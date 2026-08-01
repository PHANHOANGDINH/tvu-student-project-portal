# Backup and restore

`deploy/scripts/backup.sh` is the single backup entry point used by deployment and scheduling. It obtains a lock, creates a SQL Server `COPY_ONLY` backup with `CHECKSUM`, runs `RESTORE VERIFYONLY`, archives uploads while retaining permissions and paths, and writes SHA-256 checksums. Backups under `deploy/backups/` are ignored by Git.

Configure `BACKUP_RETENTION_DAYS` and `BACKUP_WEEKLY_RETENTION_WEEKS`. The retention script keeps recent daily copies and older Sunday weekly copies. `OFFSITE_BACKUP_COMMAND` is an optional provider-neutral hook receiving `BACKUP_DIRECTORY`; credentials belong in the host secret store.

Install the example `deploy/monitoring/tvu-backup.*` systemd units after adjusting paths, or use cron: `0 2 * * * cd /opt/tvu-student-project-portal && ./deploy/scripts/backup.sh`.

Restore is manual and isolated:

```bash
ALLOW_ISOLATED_RESTORE=YES ENV_FILE=.env.restore-test \
  ./deploy/scripts/restore.sh --confirm-restore /protected/backups/20260801T020000Z
```

The environment must use a non-production `COMPOSE_PROJECT_NAME`. The script validates checksums, captures the current isolated state when running, pauses writers, restores SQL/uploads, applies pending migrations, restarts the stack and waits for health. Test quarterly with separately named Docker volumes.

Recommended targets are RPO 24 hours for nightly backups (reduce to 1–4 hours when required) and RTO 2 hours after rehearsals. Keep encrypted off-site copies in a separate failure domain and verify restores periodically.
