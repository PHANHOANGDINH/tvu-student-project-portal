#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "Restore failed at line $LINENO." >&2' ERR
[[ $# -eq 2 && "$1" == "--confirm-restore" ]] || { echo "Usage: $0 --confirm-restore <backup-directory>" >&2; exit 1; }
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; cd "$ROOT_DIR"
docker_root="$ROOT_DIR"; if command -v cygpath >/dev/null 2>&1; then docker_root="$(cygpath -w "$ROOT_DIR")"; fi
backup_dir="$(realpath "$2")"; [[ -d "$backup_dir" && -f "$backup_dir/SHA256SUMS" ]] || { echo "Invalid backup directory." >&2; exit 1; }
docker_backup_dir="$backup_dir"; if command -v cygpath >/dev/null 2>&1; then docker_backup_dir="$(cygpath -w "$backup_dir")"; fi
(cd "$backup_dir" && sha256sum -c SHA256SUMS)
ENV_FILE="${ENV_FILE:-.env.restore-test}"; COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
[[ -f "$ENV_FILE" ]] || { echo "Missing isolated restore environment file." >&2; exit 1; }
project="$(sed -n 's/^COMPOSE_PROJECT_NAME=//p' "$ENV_FILE" | tail -1)"
[[ -n "$project" && "$project" != "tvu-student-project-portal-prod" && "${ALLOW_ISOLATED_RESTORE:-}" == "YES" ]] || { echo "Restore is allowed only in an explicitly isolated project." >&2; exit 1; }
compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" -p "$project")
if [[ -n "$("${compose[@]}" ps -q database 2>/dev/null)" && -n "$("${compose[@]}" ps -q backend 2>/dev/null)" ]]; then ENV_FILE="$ENV_FILE" COMPOSE_FILE="$COMPOSE_FILE" COMPOSE_PROJECT_NAME="$project" "$ROOT_DIR/deploy/scripts/backup.sh"; fi
"${compose[@]}" stop backend notification-worker frontend proxy 2>/dev/null || true
"${compose[@]}" up -d database rabbitmq
for service in database rabbitmq; do
  ready=false
  for _ in {1..60}; do id="$("${compose[@]}" ps -q "$service")"; status="$(docker inspect -f '{{.State.Health.Status}}' "$id")"; [[ "$status" == healthy ]] && { ready=true; break; }; [[ "$status" == unhealthy ]] && break; sleep 5; done
  [[ "$ready" == true ]] || { echo "$service did not become healthy before restore." >&2; exit 1; }
done
database_id="$("${compose[@]}" ps -q database)"; bak="$(find "$backup_dir" -maxdepth 1 -name 'database_*.bak' -print -quit)"; uploads="$(find "$backup_dir" -maxdepth 1 -name 'uploads_*.tar.gz' -print -quit)"
[[ -f "$bak" && -f "$uploads" ]] || { echo "SQL or uploads archive is missing." >&2; exit 1; }
docker_bak="$bak"; if command -v cygpath >/dev/null 2>&1; then docker_bak="$(cygpath -w "$bak")"; fi
MSYS2_ARG_CONV_EXCL='*' docker cp "$docker_bak" "$database_id:/var/opt/mssql/backup/restore.bak"
MSYS2_ARG_CONV_EXCL='*' docker cp "$docker_root/deploy/scripts/sql-restore.sh" "$database_id:/tmp/tvu-sql-restore.sh"
MSYS2_ARG_CONV_EXCL='*' "${compose[@]}" exec -T database /bin/bash /tmp/tvu-sql-restore.sh >/dev/null
MSYS2_ARG_CONV_EXCL='*' docker run --rm -v "${project}_backend_uploads:/uploads" -v "$docker_backup_dir:/backup:ro" alpine:3.21 sh -c "find /uploads -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + && tar -xzpf /backup/$(basename "$uploads") -C /uploads"
"${compose[@]}" run --rm database-init
services=(database rabbitmq notification-worker backend frontend)
if [[ "${RESTORE_INCLUDE_PROXY:-true}" == "true" ]]; then services+=(proxy); fi
"${compose[@]}" up -d "${services[@]}"
for service in "${services[@]}"; do
  for _ in {1..60}; do id="$("${compose[@]}" ps -q "$service")"; status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id")"; [[ "$status" == healthy ]] && break; [[ "$status" =~ unhealthy|exited|dead ]] && exit 1; sleep 5; done
  [[ "$status" == healthy ]] || exit 1
done
echo "Isolated restore completed and healthy."
