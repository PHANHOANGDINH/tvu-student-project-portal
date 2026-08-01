#!/usr/bin/env bash
set -Eeuo pipefail
[[ "${DB_DATABASE:-}" =~ ^[A-Za-z0-9_]+$ ]] || { echo "Unsafe database name." >&2; exit 1; }
query="ALTER DATABASE [$DB_DATABASE] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [$DB_DATABASE] FROM DISK=N'/var/opt/mssql/backup/restore.bak' WITH REPLACE, CHECKSUM; ALTER DATABASE [$DB_DATABASE] SET MULTI_USER;"
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -Q "$query"
