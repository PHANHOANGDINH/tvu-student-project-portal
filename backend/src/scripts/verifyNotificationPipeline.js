import { sql, poolPromise } from '../config/db.js';
import { createNotificationEvent, NOTIFICATION_EVENT_TYPES } from '../messaging/notification.events.js';
import { enqueueOutboxEvent } from '../messaging/outbox.repository.js';
import { RabbitMqBroker } from '../messaging/rabbitmq.broker.js';
import { rabbitConfig } from '../messaging/rabbitmq.config.js';

const mode = process.argv[2] || 'full';
const eventId = process.env.TEST_EVENT_ID;
if (!/^[0-9a-f-]{36}$/i.test(eventId || '')) {
  throw new Error('TEST_EVENT_ID must be a UUID');
}

const email = `rabbit-test-${eventId}@example.invalid`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function enqueue() {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const userResult = await transaction.request()
      .input('Email', sql.NVarChar(150), email)
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, Role, IsActive, CreatedAt)
        OUTPUT INSERTED.Id
        VALUES (N'RabbitMQ Integration Test', @Email, N'not-a-login-credential',
          N'STUDENT', 1, SYSUTCDATETIME())
      `);
    const userId = userResult.recordset[0].Id;
    const event = createNotificationEvent({
      eventId,
      eventType: NOTIFICATION_EVENT_TYPES.CLASS_STUDENT_ADDED,
      recipientIds: [userId, userId],
      actor: { id: userId, role: 'STUDENT' },
      entityType: 'Class',
      entityId: 1,
      payload: { title: 'Integration test', message: 'Safe RabbitMQ integration event' },
      correlationId: `integration:${eventId}`,
    });
    await enqueueOutboxEvent(transaction, event);
    await transaction.commit();
    console.info('Integration outbox event enqueued', { eventId });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function readState() {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('EventId', sql.UniqueIdentifier, eventId)
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT o.Status, o.Attempts,
        (SELECT COUNT(*) FROM Notifications n
          INNER JOIN Users u ON u.Id = n.UserId
          WHERE n.EventKey = CONVERT(NVARCHAR(36), @EventId) AND u.Email = @Email) AS Notifications
      FROM NotificationOutbox o WHERE o.EventId = @EventId
    `);
  return result.recordset[0] || null;
}

async function waitForDelivery() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const state = await readState();
    if (state?.Status === 'Sent' && state.Notifications === 1) return state;
    await wait(500);
  }
  throw new Error('Timed out waiting for outbox delivery');
}

async function verifyIdempotencyAndDlq() {
  const pool = await poolPromise;
  const payloadResult = await pool.request()
    .input('EventId', sql.UniqueIdentifier, eventId)
    .query('SELECT Payload FROM NotificationOutbox WHERE EventId = @EventId');
  const event = JSON.parse(payloadResult.recordset[0].Payload);
  const broker = new RabbitMqBroker();
  await broker.publish(event);
  await wait(1000);
  const duplicateState = await readState();
  if (duplicateState.Notifications !== 1) throw new Error('Duplicate notification detected');

  const channel = await broker.connect();
  const before = await channel.checkQueue(rabbitConfig.deadQueue);
  const invalid = { eventId: crypto.randomUUID(), correlationId: `dlq:${eventId}` };
  await broker.publish(invalid, { headers: { 'x-retry-count': rabbitConfig.maxRetries } });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await channel.checkQueue(rabbitConfig.deadQueue);
    if (current.messageCount > before.messageCount) break;
    await wait(500);
  }
  const after = await channel.checkQueue(rabbitConfig.deadQueue);
  if (after.messageCount <= before.messageCount) throw new Error('DLQ did not receive invalid event');

  for (let attempt = 0; attempt < after.messageCount; attempt += 1) {
    const message = await channel.get(rabbitConfig.deadQueue, { noAck: false });
    if (!message) break;
    if (message.properties.correlationId === invalid.correlationId) channel.ack(message);
    else channel.nack(message, false, true);
  }
  await broker.close();
}

async function cleanup() {
  const pool = await poolPromise;
  await pool.request()
    .input('EventId', sql.UniqueIdentifier, eventId)
    .input('Email', sql.NVarChar(150), email)
    .query(`
      DELETE n FROM Notifications n INNER JOIN Users u ON u.Id = n.UserId
        WHERE n.EventKey = CONVERT(NVARCHAR(36), @EventId) AND u.Email = @Email;
      DELETE FROM NotificationOutbox WHERE EventId = @EventId;
      DELETE FROM Users WHERE Email = @Email;
    `);
}

try {
  if (mode === 'enqueue' || mode === 'full') await enqueue();
  if (mode === 'verify' || mode === 'full') {
    const state = await waitForDelivery();
    await verifyIdempotencyAndDlq();
    console.info('Notification integration verification passed', {
      eventId,
      outboxStatus: state.Status,
      notifications: state.Notifications,
    });
    await cleanup();
  }
} finally {
  await poolPromise.then((pool) => pool.close()).catch(() => {});
}
