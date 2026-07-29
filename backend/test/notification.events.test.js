import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNotificationEvent,
  NOTIFICATION_EVENT_TYPES,
  validateNotificationEvent,
} from '../src/messaging/notification.events.js';

const validInput = {
  eventType: NOTIFICATION_EVENT_TYPES.CLASS_STUDENT_ADDED,
  recipientIds: [2, 2],
  actor: { id: 1, role: 'ADMIN' },
  entityType: 'Class',
  entityId: 4,
  payload: { title: 'Title', message: 'Message' },
  correlationId: 'request-1',
};

test('creates a complete event and deduplicates recipients', () => {
  const event = createNotificationEvent(validInput);
  assert.equal(validateNotificationEvent(event).length, 0);
  assert.deepEqual(event.recipientIds, [2]);
  assert.match(event.eventId, /^[0-9a-f-]{36}$/i);
});

test('rejects an event without a recipient or message', () => {
  assert.throws(() => createNotificationEvent({
    ...validInput,
    recipientIds: [],
    payload: { title: 'Missing message' },
  }), /recipientIds is invalid/);
});
