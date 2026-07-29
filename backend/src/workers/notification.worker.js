import { writeFile, unlink } from 'node:fs/promises';
import { RabbitMqBroker } from '../messaging/rabbitmq.broker.js';
import { processDelivery } from '../messaging/notification.consumer.js';
import { handleNotificationEvent } from '../messaging/notification.handler.js';
import { publishOutboxBatch } from '../messaging/outbox.publisher.js';
import { poolPromise } from '../config/db.js';

const broker = new RabbitMqBroker();
const healthFile = process.env.WORKER_HEALTH_FILE || '/tmp/notification-worker-ready';
let stopping = false;

async function heartbeat() {
  if (!stopping) await writeFile(healthFile, new Date().toISOString(), { mode: 0o600 });
}

async function main() {
  await poolPromise;
  await broker.connect();
  await broker.consume((message, channel) =>
    processDelivery({ message, channel, broker, handler: handleNotificationEvent }));
  await heartbeat();
  const healthTimer = setInterval(() => heartbeat().catch(console.error), 10000);
  const pollTimer = setInterval(() => {
    publishOutboxBatch(broker).catch((error) =>
      console.error('Outbox polling failed', { message: error.message }));
  }, Number(process.env.OUTBOX_POLL_INTERVAL_MS || 2000));
  await publishOutboxBatch(broker);

  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    console.info('Notification worker stopping', { signal });
    clearInterval(healthTimer);
    clearInterval(pollTimer);
    await broker.close();
    await unlink(healthFile).catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Notification worker failed', { message: error.message });
  process.exit(1);
});
