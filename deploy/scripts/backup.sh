#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "Backup failed at line $LINENO." >&2' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
docker_root="$ROOT_DIR"
if command -v cygpath >/dev/null 2>&1; then docker_root="$(cygpath -w "$ROOT_DIR")"; fi
cd "$ROOT_DIR"
ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
BACKUP_ROOT="${BACKUP_ROOT:-$ROOT_DIR/deploy/backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="$BACKUP_ROOT/$timestamp"
docker_destination="$destination"
if command -v cygpath >/dev/null 2>&1; then docker_destination="$(cygpath -w "$destination")"; fi
lock_dir="$BACKUP_ROOT/.backup.lock"
mkdir -p "$BACKUP_ROOT"
if ! mkdir "$lock_dir" 2>/dev/null; then echo "Another backup is running." >&2; exit 1; fi
trap 'rmdir "$lock_dir" 2>/dev/null || true' EXIT
mkdir "$destination"
chmod 700 "$destination" 2>/dev/null || true
compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
database_id="$("${compose[@]}" ps -q database)"
[[ -n "$database_id" ]] || { echo "Database container is not running." >&2; exit 1; }
backend_id="$("${compose[@]}" ps -q backend)"
[[ -n "$backend_id" ]] || { echo "Backend container is not running." >&2; exit 1; }
uploads_volume="$(MSYS2_ARG_CONV_EXCL='*' docker inspect -f '{{range .Mounts}}{{if eq .Destination "/app/uploads"}}{{.Name}}{{end}}{{end}}' "$backend_id")"
[[ -n "$uploads_volume" ]] || { echo "Uploads volume was not found." >&2; exit 1; }
bak="database_${timestamp}.bak"
echo "Creating and verifying SQL Server backup."
MSYS2_ARG_CONV_EXCL='*' docker cp "$docker_root/deploy/scripts/sql-backup.sh" "$database_id:/tmp/tvu-sql-backup.sh"
MSYS2_ARG_CONV_EXCL='*' "${compose[@]}" exec -T -e BACKUP_FILE="$bak" database /bin/bash /tmp/tvu-sql-backup.sh >/dev/null
MSYS2_ARG_CONV_EXCL='*' docker cp "$database_id:/var/opt/mssql/backup/$bak" "$docker_destination/$bak"
echo "Archiving uploads."
MSYS2_ARG_CONV_EXCL='*' docker run --rm -v "$uploads_volume:/uploads:ro" -v "$docker_destination:/backup" alpine:3.21 tar -czpf "/backup/uploads_${timestamp}.tar.gz" -C /uploads .
cp docker-compose.production.yml "$destination/"
(cd "$destination" && sha256sum "$bak" "uploads_${timestamp}.tar.gz" docker-compose.production.yml > SHA256SUMS)
echo "Applying backup retention policy."
chmod -R go-rwx "$destination" 2>/dev/null || true
"$ROOT_DIR/deploy/scripts/backup-retention.sh" "$BACKUP_ROOT"
if [[ -n "${OFFSITE_BACKUP_COMMAND:-}" ]]; then BACKUP_DIRECTORY="$destination" bash -c "$OFFSITE_BACKUP_COMMAND"; fi
echo "Backup completed: $destination"
