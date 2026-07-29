#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and configure it." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Deployment worktree must be clean." >&2
  exit 1
fi

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
previous_ref="$(git rev-parse HEAD)"
deploy_ref="$(sed -n 's/^DEPLOY_REF=//p' "$ENV_FILE" | tail -n 1)"
deploy_ref="${deploy_ref:-origin/main}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

backup_if_running() {
  local database_id
  database_id="$("${compose[@]}" ps -q database)"
  if [[ -z "$database_id" ]] || [[ "$(docker inspect -f '{{.State.Running}}' "$database_id")" != "true" ]]; then
    echo "Database is not running; pre-deploy backup skipped for first deployment."
    return
  fi

  echo "Creating pre-deploy SQL and uploads backups."
  "${compose[@]}" exec -T -e BACKUP_FILE="predeploy_${timestamp}.bak" database \
    /bin/bash -lc '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -v DbName="$DB_DATABASE" BackupFile="$BACKUP_FILE" -Q "BACKUP DATABASE [\$(DbName)] TO DISK=N'\''/var/opt/mssql/backup/\$(BackupFile)'\'' WITH COPY_ONLY, CHECKSUM, COMPRESSION"'
  BACKUP_FILE="uploads_${timestamp}.tar.gz" "${compose[@]}" --profile tools run --rm uploads-backup
}

wait_for_health() {
  local service="$1"
  local container_id
  container_id="$("${compose[@]}" ps -q "$service")"
  [[ -n "$container_id" ]] || return 1

  for _ in {1..60}; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
    [[ "$status" == "healthy" ]] && return 0
    [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]] && return 1
    sleep 5
  done
  return 1
}

backup_if_running

git fetch --prune origin
git checkout --detach "$deploy_ref"

"${compose[@]}" config --quiet
"${compose[@]}" pull --ignore-buildable || true
"${compose[@]}" build --pull
"${compose[@]}" up -d --remove-orphans

if wait_for_health database && wait_for_health backend && wait_for_health frontend && wait_for_health proxy; then
  echo "Deployment healthy at commit $(git rev-parse --short HEAD)."
  exit 0
fi

echo "Deployment healthcheck failed; rolling back to $previous_ref." >&2
"$ROOT_DIR/deploy/scripts/rollback.sh" "$previous_ref"
exit 1
