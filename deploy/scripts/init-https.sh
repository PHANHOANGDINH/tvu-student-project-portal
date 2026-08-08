#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; cd "$ROOT_DIR"
ENV_FILE="${ENV_FILE:-.env.production}"; COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }
domain="$(sed -n 's/^DOMAIN=//p' "$ENV_FILE" | tail -n 1)"; email="$(sed -n 's/^LETSENCRYPT_EMAIL=//p' "$ENV_FILE" | tail -n 1)"
[[ "$domain" =~ ^[A-Za-z0-9.-]+$ && "$domain" == *.* ]] || { echo "Invalid DOMAIN" >&2; exit 1; }
[[ "$email" == *@*.* ]] || { echo "Invalid LETSENCRYPT_EMAIL" >&2; exit 1; }
compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
[[ -z "$("${compose[@]}" ps -q proxy 2>/dev/null)" ]] || { echo "Stop proxy before certificate bootstrap." >&2; exit 1; }
"${compose[@]}" --profile tools run --rm --service-ports certbot certonly --standalone --non-interactive --agree-tos --no-eff-email --email "$email" -d "$domain"
