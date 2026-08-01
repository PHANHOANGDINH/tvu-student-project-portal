#!/usr/bin/env bash
set -Eeuo pipefail
backup_root="${1:-${BACKUP_ROOT:-deploy/backups}}"
daily_days="${BACKUP_RETENTION_DAYS:-14}"
weekly_weeks="${BACKUP_WEEKLY_RETENTION_WEEKS:-8}"
[[ "$daily_days" =~ ^[0-9]+$ && "$weekly_weeks" =~ ^[0-9]+$ ]] || { echo "Retention values must be non-negative integers." >&2; exit 1; }
find "$backup_root" -mindepth 1 -maxdepth 1 -type d -name '20????????T??????Z' -mtime "+$daily_days" -print0 |
while IFS= read -r -d '' directory; do
  age_days=$(( ($(date +%s) - $(stat -c %Y "$directory")) / 86400 ))
  if (( age_days > weekly_weeks * 7 )) || [[ "$(date -u -d "@$(stat -c %Y "$directory")" +%u)" != "7" ]]; then rm -rf -- "$directory"; fi
done
