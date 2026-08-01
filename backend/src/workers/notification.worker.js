import { writeFile, unlink } from 'node:fs/promises';
import { RabbitMqBroker } from '../messaging/rabbitmq.broker.js';
import { processDelivery } from '../messaging/notification.consumer.js';
import { handleNotificationEvent } from '../messaging/notification.handler.js';
import { publishOutboxBatch } from '../messaging/outbox.publisher.js';
import { poolPromise } from '../config/db.js';
import { createServer } from 'node:http';
import { createLogger } from '../monitoring/logger.js';
import { register, workerHeartbeat, outboxEvents, databaseUp } from '../monitoring/metrics.js';
import { countOutboxByStatus } from '../messaging/outbox.repository.js';

const logger = createLogger('notification-worker');
const broker = new RabbitMqBroker({ logger });
const healthFile = process.env.WORKER_HEALTH_FILE || '/tmp/notification-worker-ready';
let stopping = false;

async function heartbeat() {
  if (!stopping) {
    await writeFile(healthFile, new Date().toISOString(), { mode: 0o600 });
    workerHeartbeat.set(Date.now() / 1000);
    const counts = await countOutboxByStatus();
    for (const status of ['Pending', 'Processing', 'Sent', 'Failed']) outboxEvents.set({ status }, 0);
    for (const row of counts) outboxEvents.set({ status: row.Status }, Number(row.Total));
  }
}

async function main() {
  await poolPromise;
  databaseUp.set(1);
  const metricsPort = Number(process.env.WORKER_METRICS_PORT || 9464);
  const metricsServer = createServer(async (req, res) => {
    if (req.url !== '/metrics') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': register.contentType }); res.end(await register.metrics());
  }).listen(metricsPort, '0.0.0.0');
  await broker.connect();
  await broker.consume((message, channel) =>
    processDelivery({ message, channel, broker, handler: handleNotificationEvent }));
  await heartbeat();
  const healthTimer = setInterval(() => heartbeat().catch((error) => logger.error('Worker heartbeat failed', { error })), 10000);
  const pollTimer = setInterval(() => {
    publishOutboxBatch(broker).catch((error) =>
      logger.error('Outbox polling failed', { error }));
  }, Number(process.env.OUTBOX_POLL_INTERVAL_MS || 2000));
  await publishOutboxBatch(broker);

  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    logger.info('Notification worker stopping', { signal });
    clearInterval(healthTimer);
    clearInterval(pollTimer);
    await broker.close();
    await new Promise((resolve) => metricsServer.close(resolve));
    await unlink(healthFile).catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  databaseUp.set(0);
  logger.error('Notification worker failed', { error });
  process.exit(1);
});
