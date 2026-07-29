import { randomUUID } from 'node:crypto';

export const NOTIFICATION_EVENT_TYPES = Object.freeze({
  CLASS_STUDENT_ADDED: 'class.student.added',
  PROJECT_STATUS_CHANGED: 'project.status.changed',
  PROJECT_REGISTRATION_REVIEWED: 'project.registration.reviewed',
  PROGRESS_REVIEWED: 'progress.reviewed',
  FINAL_SUBMISSION_GRADED: 'final-submission.graded',
});

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
