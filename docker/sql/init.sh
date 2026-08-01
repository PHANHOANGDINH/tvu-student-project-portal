#!/usr/bin/env bash
set -Eeuo pipefail

SQLCMD=/opt/mssql-tools18/bin/sqlcmd
DATABASE_NAME="${DB_DATABASE:-tvu_student_project_portal}"
BASELINE_PATH=/schema/schema-baseline.sql

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

"$SQLCMD" \
  -S database \
  -U sa \
  -P "$MSSQL_SA_PASSWORD" \
  -C \
  -b \
  -d "$DATABASE_NAME" \
  -Q "
    IF OBJECT_ID(N'dbo.DockerSchemaMigrations', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.DockerSchemaMigrations (
        ScriptName NVARCHAR(260) NOT NULL
          CONSTRAINT PK_DockerSchemaMigrations PRIMARY KEY,
        AppliedAt DATETIME2 NOT NULL
          CONSTRAINT DF_DockerSchemaMigrations_AppliedAt DEFAULT SYSUTCDATETIME()
      );
    END;
  "

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

baseline_applied=false
if [[ "${HAS_USERS//[[:space:]]/}" != "1" ]]; then
  echo "Applying schema baseline exported from TvuStudentProjectPortal."
  runtime_baseline=/tmp/schema-baseline.runtime.sql
  sed \
    -e "s/^:setvar DatabaseName .*/:setvar DatabaseName \"$DATABASE_NAME\"/" \
    -e "s/^:setvar DefaultFilePrefix .*/:setvar DefaultFilePrefix \"$DATABASE_NAME\"/" \
    "$BASELINE_PATH" > "$runtime_baseline"
  "$SQLCMD" \
    -S database \
    -U sa \
    -P "$MSSQL_SA_PASSWORD" \
    -C \
    -b \
    -d "$DATABASE_NAME" \
    -i "$runtime_baseline"
  baseline_applied=true
else
  echo "Existing application schema detected; baseline creation skipped."
fi

# The exported baseline already contains repository migrations through 20260721.
# Record those scripts only after a fresh baseline import so they are not replayed.
if [[ "$baseline_applied" == "true" ]]; then
  for included in /migrations/202607{13,15,17,18,19,21}_*.sql; do
    [[ -f "$included" ]] || continue
    included_name="$(basename "$included")"
    "$SQLCMD" -S database -U sa -P "$MSSQL_SA_PASSWORD" -C -b -d "$DATABASE_NAME" \
      -v ScriptName="$included_name" \
      -Q "IF NOT EXISTS (SELECT 1 FROM dbo.DockerSchemaMigrations WHERE ScriptName=N'\$(ScriptName)') INSERT dbo.DockerSchemaMigrations (ScriptName) VALUES (N'\$(ScriptName)');"
  done
fi

"$SQLCMD" \
  -S database \
  -U sa \
  -P "$MSSQL_SA_PASSWORD" \
  -C \
  -b \
  -d "$DATABASE_NAME" \
  -Q "
    IF NOT EXISTS (
      SELECT 1 FROM dbo.DockerSchemaMigrations
      WHERE ScriptName = N'schema-baseline.sql'
    )
      INSERT dbo.DockerSchemaMigrations (ScriptName)
      VALUES (N'schema-baseline.sql');
  "

shopt -s nullglob
for migration in /migrations/*.sql; do
  migration_name="$(basename "$migration")"
  if [[ ! "$migration_name" =~ ^[A-Za-z0-9_.-]+$ ]]; then
    echo "Unsafe migration filename: $migration_name" >&2
    exit 1
  fi

  already_applied="$(
    "$SQLCMD" \
      -S database \
      -U sa \
      -P "$MSSQL_SA_PASSWORD" \
      -C \
      -h -1 \
      -W \
      -d "$DATABASE_NAME" \
      -Q "
        SET NOCOUNT ON;
        SELECT COUNT(*)
        FROM dbo.DockerSchemaMigrations
        WHERE ScriptName = N'$migration_name';
      "
  )"

  if [[ "${already_applied//[[:space:]]/}" == "1" ]]; then
    echo "Skipping applied migration: $migration_name"
    continue
  fi

  echo "Applying migration: $migration_name"
  "$SQLCMD" \
    -S database \
    -U sa \
    -P "$MSSQL_SA_PASSWORD" \
    -C \
    -b \
    -d "$DATABASE_NAME" \
    -i "$migration"

  "$SQLCMD" \
    -S database \
    -U sa \
    -P "$MSSQL_SA_PASSWORD" \
    -C \
    -b \
    -d "$DATABASE_NAME" \
    -Q "
      INSERT dbo.DockerSchemaMigrations (ScriptName)
      VALUES (N'$migration_name');
    "
done

echo "Database schema initialization completed."
