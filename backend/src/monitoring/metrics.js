import client from 'prom-client';

export const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'tvu_process_' });
export const httpRequests = new client.Counter({ name: 'tvu_http_requests_total', help: 'HTTP requests', labelNames: ['method', 'route', 'status'], registers: [register] });
export const httpDuration = new client.Histogram({ name: 'tvu_http_request_duration_seconds', help: 'HTTP request latency', labelNames: ['method', 'route', 'status'], registers: [register], buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5] });
export const databaseUp = new client.Gauge({ name: 'tvu_database_up', help: 'SQL Server connectivity', registers: [register] });
export const outboxEvents = new client.Gauge({ name: 'tvu_outbox_events', help: 'Outbox records by status', labelNames: ['status'], registers: [register] });
export const workerHeartbeat = new client.Gauge({ name: 'tvu_notification_worker_heartbeat_timestamp_seconds', help: 'Last worker heartbeat', registers: [register] });
export const notificationEvents = new client.Counter({ name: 'tvu_notification_events_total', help: 'Notification worker events', labelNames: ['operation', 'result'], registers: [register] });

export function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const matchedRoute = req.route?.path ? `${req.baseUrl || ''}${req.route.path}` : (req.baseUrl || 'unmatched');
    const labels = { method: req.method, route: matchedRoute, status: String(res.statusCode) };
    httpRequests.inc(labels); end(labels);
  });
  next();
}
export async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType); res.end(await register.metrics());
}
