import { createHash, randomUUID } from 'node:crypto';

export const NOTIFICATION_EVENT_TYPES = Object.freeze({
  CLASS_STUDENT_ADDED: 'class.student.added',
  PROJECT_STATUS_CHANGED: 'project.status.changed',
  PROJECT_REGISTRATION_REVIEWED: 'project.registration.reviewed',
  PROGRESS_REVIEWED: 'progress.reviewed',
  FINAL_SUBMISSION_GRADED: 'final-submission.graded',
  GROUP_MEMBER_ADDED: 'GROUP_MEMBER_ADDED',
  TOPIC_REVIEWED: 'TOPIC_REVIEWED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  GRADE_PUBLISHED: 'GRADE_PUBLISHED',
  SUBMISSION_REQUIREMENT_CREATED: 'SUBMISSION_REQUIREMENT_CREATED',
  SUBMISSION_ROUND_OPENED: 'SUBMISSION_ROUND_OPENED',
  SUBMISSION_RECEIVED: 'SUBMISSION_RECEIVED',
});

export function eventIdFromKey(key) {
  const bytes = createHash('sha256').update(String(key)).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function positiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

export function validateNotificationEvent(event) {
  const errors = [];
  if (!event || typeof event !== 'object') return ['event must be an object'];
  if (!/^[0-9a-f-]{36}$/i.test(String(event.eventId || ''))) errors.push('eventId is invalid');
  if (!Object.values(NOTIFICATION_EVENT_TYPES).includes(event.eventType)) errors.push('eventType is invalid');
  if (Number.isNaN(Date.parse(event.occurredAt))) errors.push('occurredAt is invalid');
  if (!Array.isArray(event.recipientIds) || event.recipientIds.length === 0 ||
      event.recipientIds.some((id) => !positiveInteger(id))) errors.push('recipientIds is invalid');
  if (!event.actor || !positiveInteger(event.actor.id)) errors.push('actor is invalid');
  if (!event.entityType || typeof event.entityType !== 'string') errors.push('entityType is invalid');
  if (!positiveInteger(event.entityId)) errors.push('entityId is invalid');
  if (!event.payload || typeof event.payload !== 'object') errors.push('payload is invalid');
  if (!event.payload.title || !event.payload.message) errors.push('payload title and message are required');
  if (!event.correlationId || typeof event.correlationId !== 'string') errors.push('correlationId is invalid');
  return errors;
}

export function createNotificationEvent({
  eventType,
  recipientIds,
  actor,
  entityType,
  entityId,
  payload,
  correlationId,
  eventId = randomUUID(),
  occurredAt = new Date().toISOString(),
}) {
  const event = {
    eventId,
    eventType,
    occurredAt,
    recipientIds: [...new Set(recipientIds.map(Number))],
    actor: { id: Number(actor.id), role: actor.role || null },
    entityType,
    entityId: Number(entityId),
    payload,
    correlationId: correlationId || eventId,
  };
  const errors = validateNotificationEvent(event);
  if (errors.length) throw new Error(`Invalid notification event: ${errors.join(', ')}`);
  return event;
}
