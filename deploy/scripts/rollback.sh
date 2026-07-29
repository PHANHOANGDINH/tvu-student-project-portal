#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <git-ref-or-commit>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
target_ref="$1"

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }
git rev-parse --verify "${target_ref}^{commit}" >/dev/null

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

git checkout --detach "$target_ref"
"${compose[@]}" config --quiet
"${compose[@]}" build
"${compose[@]}" up -d --remove-orphans

for service in database backend frontend proxy; do
  healthy=false
  for _ in {1..60}; do
    container_id="$("${compose[@]}" ps -q "$service")"
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
    if [[ "$status" == "healthy" ]]; then
      healthy=true
      break
    fi
    [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]] && break
    sleep 5
  done
  [[ "$healthy" == "true" ]] || { echo "Rollback service $service is not healthy." >&2; exit 1; }
done

echo "Rollback healthy at commit $(git rev-parse --short HEAD)."
