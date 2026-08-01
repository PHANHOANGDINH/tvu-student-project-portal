#!/usr/bin/env bash
set -Eeuo pipefail
[[ "${DB_DATABASE:-}" =~ ^[A-Za-z0-9_]+$ ]] || { echo "Unsafe database name." >&2; exit 1; }
[[ "${BACKUP_FILE:-}" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo "Unsafe backup filename." >&2; exit 1; }
query="BACKUP DATABASE [$DB_DATABASE] TO DISK=N'/var/opt/mssql/backup/$BACKUP_FILE' WITH COPY_ONLY, CHECKSUM, COMPRESSION; RESTORE VERIFYONLY FROM DISK=N'/var/opt/mssql/backup/$BACKUP_FILE' WITH CHECKSUM;"
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -Q "$query"
