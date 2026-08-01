import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationEvent, NOTIFICATION_EVENT_TYPES } from '../src/messaging/notification.events.js';
import { processDelivery } from '../src/messaging/notification.consumer.js';
import { rabbitConfig } from '../src/messaging/rabbitmq.config.js';

function event() {
  return createNotificationEvent({
    eventType: NOTIFICATION_EVENT_TYPES.PROGRESS_REVIEWED,
    recipientIds: [2],
    actor: { id: 1, role: 'LECTURER' },
    entityType: 'ProjectProgressReport',
    entityId: 3,
    payload: { title: 'Title', message: 'Message' },
    correlationId: 'test-correlation',
  });
}

function delivery(value, retryCount = 0) {
  return {
    content: Buffer.from(JSON.stringify(value)),
    properties: {
      messageId: value.eventId,
      correlationId: value.correlationId,
      headers: { 'x-retry-count': retryCount },
    },
  };
}

const logger = { info() {}, warn() {}, error() {} };

test('acks only after notification handler succeeds', async () => {
  let handled = false;
  let acked = false;
  const value = event();
  const result = await processDelivery({
    message: delivery(value),
    channel: { ack() { assert.equal(handled, true); acked = true; } },
    broker: { publish: async () => assert.fail('must not republish') },
    handler: async () => { handled = true; },
    logger,
  });
  assert.equal(result, 'ack');
  assert.equal(acked, true);
});

test('publishes a failed delivery to bounded retry before ack', async () => {
  const calls = [];
  const value = event();
  const result = await processDelivery({
    message: delivery(value, 0),
    channel: { ack() { calls.push('ack'); } },
    broker: { async publish(_event, options) { calls.push(options); } },
    handler: async () => { throw new Error('temporary'); },
    logger,
  });
  assert.equal(result, 'retry');
  assert.equal(calls[0].exchange, rabbitConfig.retryExchange);
  assert.equal(calls[0].headers['x-retry-count'], 1);
  assert.equal(calls[1], 'ack');
});

test('routes exhausted retries to the dead-letter queue', async () => {
  const calls = [];
  const value = event();
  const result = await processDelivery({
    message: delivery(value, rabbitConfig.maxRetries),
    channel: { ack() { calls.push('ack'); } },
    broker: { async publish(_event, options) { calls.push(options); } },
    handler: async () => { throw new Error('permanent'); },
    logger,
  });
  assert.equal(result, 'dead');
  assert.equal(calls[0].exchange, rabbitConfig.deadExchange);
  assert.equal(calls[1], 'ack');
});
