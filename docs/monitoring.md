# Monitoring and alerting

Production monitoring is an internal-only Compose stack (`docker-compose.monitoring.yml`). Prometheus and Grafana have no published host ports. Administrators should use an SSH tunnel or an authenticated reverse proxy; do not expose them directly.

The Backend exports `/internal/metrics` privately and adds `X-Request-Id` to responses. The worker exports port `9464` internally. RabbitMQ exposes its built-in Prometheus endpoint internally on `15692`; cAdvisor supplies container CPU, memory, filesystem and restart signals. SQL availability is reported after a real connection.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d
docker compose --env-file .env.production -f docker-compose.monitoring.yml up -d
```

Prometheus configuration and alerts live under `deploy/monitoring/`. Grafana provisions its datasource and the `TVU Portal Operations` dashboard from version-controlled files. Set `GRAFANA_ADMIN_PASSWORD` only in `.env.production`.

Alerts cover API, worker, SQL Server and RabbitMQ availability, 5xx rate, queue/outbox backlog, failed outbox records, DLQ messages, container restarts and filesystem pressure. No real alert destination is configured. Connect Alertmanager to a secret-backed receiver only after production approval.

Logs are JSON with timestamp, level, service and request/event correlation context. Sensitive keys are redacted. Metric labels contain no user identifiers.
