import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationEvent, NOTIFICATION_EVENT_TYPES } from '../src/messaging/notification.events.js';
import { publishOutboxBatch } from '../src/messaging/outbox.publisher.js';

function record() {
  const event = createNotificationEvent({
    eventType: NOTIFICATION_EVENT_TYPES.FINAL_SUBMISSION_GRADED,
    recipientIds: [9],
    actor: { id: 3, role: 'LECTURER' },
    entityType: 'FinalSubmission',
    entityId: 7,
    payload: { title: 'Title', message: 'Message' },
    correlationId: 'outbox-test',
  });
  return { EventId: event.eventId, Payload: JSON.stringify(event), Attempts: 1 };
}

const logger = { info() {}, warn() {}, error() {} };

test('marks outbox sent only after publisher confirm resolves', async () => {
  const item = record();
  const calls = [];
  const repository = {
    claimOutboxEvents: async () => [item],
    markOutboxSent: async () => calls.push('sent'),
    releaseOutboxEvent: async () => calls.push('released'),
  };
  await publishOutboxBatch({ publish: async () => calls.push('confirmed') }, { repository, logger });
  assert.deepEqual(calls, ['confirmed', 'sent']);
});

test('releases outbox with backoff when publishing fails', async () => {
  const item = record();
  const calls = [];
  const repository = {
    claimOutboxEvents: async () => [item],
    markOutboxSent: async () => calls.push('sent'),
    releaseOutboxEvent: async (...args) => calls.push(['released', ...args]),
  };
  await publishOutboxBatch({ publish: async () => { throw new Error('offline'); } }, { repository, logger });
  assert.equal(calls[0][0], 'released');
  assert.equal(calls[0][1], item.EventId);
});
