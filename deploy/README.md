# TVU Project Portal production deployment

Production Compose publishes only TCP 80 and 443. SQL Server, RabbitMQ, backend, frontend, worker metrics, Prometheus, and Grafana remain on Docker-only networks.

## Required from the operator

- Linux VPS, sudo account, and SSH key.
- Domain with A/AAAA records pointing to the VPS.
- Strong SQL Server, JWT, RabbitMQ, and optional Grafana secrets.
- SQL Server edition/license decision; the example uses Express.
- Off-site backup destination and retention policy.

Never commit `.env.production`. Never run `docker compose down -v`, `docker volume rm`, or delete named volumes during deploy or rollback.

The production Compose file requires non-empty `DOMAIN`, `MSSQL_SA_PASSWORD`,
`JWT_SECRET`, `RABBITMQ_USER`, and `RABBITMQ_PASSWORD`. Monitoring additionally
requires `GRAFANA_ADMIN_PASSWORD`. The checked-in examples contain placeholders,
not usable credentials.

## Local production check

On Windows, create the ignored local environment once, then use the safety check:

```powershell
.\deploy\scripts\new-local-production-env.ps1
# Only use the generator for a new stack; existing volumes require their original credentials.
.\deploy\scripts\local-production-check.ps1
.\deploy\scripts\local-production-check.ps1 -Build
.\deploy\scripts\local-production-check.ps1 -Start
```

For `DOMAIN=localhost`, the script creates a self-signed certificate inside the
existing Compose certificate volume if one is missing. It does not print secrets,
remove containers, delete volumes, reset the database, or seed an admin while the
two admin seed variables are blank. Use `https://localhost` and accept the local
self-signed certificate warning. Never replace credentials in `.env.production`
when reusing an initialized SQL Server or RabbitMQ volume; use the credentials that
originally initialized those volumes.

## First deployment

```bash
sudo bash deploy/scripts/setup-server.sh
git clone <repository-url> /opt/tvu-student-project-portal
cd /opt/tvu-student-project-portal
git fetch --tags origin
git checkout --detach v1.1.0
cp deploy/.env.example .env.production
chmod 600 .env.production
editor .env.production
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
bash deploy/scripts/init-https.sh
bash deploy/scripts/deploy.sh
```

Initial HTTPS needs valid DNS and inbound TCP 80. Certbot runs before Nginx because Nginx cannot start without its first certificate. Schedule `deploy/scripts/renew-https.sh` daily.

For later releases, set `DEPLOY_REF` to the immutable tag, then run:

```bash
git fetch --tags origin
bash deploy/scripts/deploy.sh
docker compose --env-file .env.production -f docker-compose.production.yml ps
curl -fsS https://${DOMAIN}/health
curl -fsS https://${DOMAIN}/api/health
curl -fsS https://${DOMAIN}/api-docs/ >/dev/null
```

`deploy.sh` creates and verifies a SQL Server and uploads backup before redeploy. Named volumes persist SQL Server, RabbitMQ, uploads, certificates, and backups. Schema initialization creates a missing database, imports the baseline only when the application schema is absent, and skips recorded migrations. Admin seed is a no-op when its two variables are blank.

## Backup and isolated restore test

```bash
bash deploy/scripts/backup.sh
cp deploy/.env.example .env.restore-test
# Set unique secrets and COMPOSE_PROJECT_NAME=tvu-restore-test.
ALLOW_ISOLATED_RESTORE=YES COMPOSE_PROJECT_NAME=tvu-restore-test bash deploy/scripts/restore.sh --confirm-restore deploy/backups/<timestamp>
```

Backups include a verified SQL Server COPY_ONLY backup, uploads archive, Compose snapshot, and SHA256 checksums. Copy them to encrypted off-site storage. Restore production only through a separately approved incident procedure.

## Rollback

```bash
git fetch --tags origin
bash deploy/scripts/backup.sh
bash deploy/scripts/rollback.sh v1.0.0
```

Rollback preserves volumes and does not reverse database migrations. Review migration compatibility first.

## Firewall and checks

Allow SSH (preferably source-IP restricted), TCP 80, and TCP 443 only. Never publish 1433, 5672, 15672, 5000, 9464, 9090, or 3000. After deploy, verify HTTPS frontend, health, Swagger, three-role login, read-only role APIs, worker health, RabbitMQ queue depth, disk space, logs, backups, and off-site copies.

Swagger is public in this release. Restrict it at Nginx if production policy requires authenticated or IP-limited documentation.

## Release boundary

Tag `v1.1.0` points to `f429b5a03a1cebb43d240fef559d53ea0d671e9f`. This readiness branch is newer than that tag. Merge it and create a new immutable patch tag before relying on the added TLS scripts and runbook on the VPS.
