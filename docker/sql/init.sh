#!/usr/bin/env bash
set -Eeuo pipefail

SQLCMD=/opt/mssql-tools18/bin/sqlcmd
DATABASE_NAME="${DB_DATABASE:-tvu_student_project_portal}"

if [[ ! "$DATABASE_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "DB_DATABASE may only contain letters, numbers, and underscores." >&2
  exit 1
fi

"$SQLCMD" \
  -S database \
  -U sa \
  -P "$MSSQL_SA_PASSWORD" \
  -C \
  -b \
  -Q "IF DB_ID(N'$DATABASE_NAME') IS NULL CREATE DATABASE [$DATABASE_NAME];"

HAS_USERS="$(
  "$SQLCMD" \
    -S database \
    -U sa \
    -P "$MSSQL_SA_PASSWORD" \
    -C \
    -h -1 \
    -W \
    -Q "SET NOCOUNT ON; SELECT CASE WHEN OBJECT_ID(N'[$DATABASE_NAME].dbo.Users', N'U') IS NULL THEN 0 ELSE 1 END;"
)"

if [[ "${HAS_USERS//[[:space:]]/}" != "1" ]]; then
  echo "Database created, but no baseline Users table exists; existing migrations were not applied."
  echo "Restore or initialize the repository-compatible baseline schema, then recreate this service."
  exit 0
fi

shopt -s nullglob
for migration in /migrations/*.sql; do
  echo "Applying migration: $(basename "$migration")"
  "$SQLCMD" \
    -S database \
    -U sa \
    -P "$MSSQL_SA_PASSWORD" \
    -C \
    -b \
    -d "$DATABASE_NAME" \
    -i "$migration"
done
