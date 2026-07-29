import { validateNotificationEvent } from './notification.events.js';

export async function publishOutboxBatch(
  broker,
  {
    logger = console,
    batchSize = 20,
    repository = null,
  } = {}
) {
  const activeRepository = repository || await import('./outbox.repository.js');
  const records = await activeRepository.claimOutboxEvents(batchSize);
  for (const record of records) {
    let event;
    try {
      event = JSON.parse(record.Payload);
      const errors = validateNotificationEvent(event);
      if (errors.length) throw new Error(errors.join(', '));
      await broker.publish(event);
      await activeRepository.markOutboxSent(record.EventId);
      logger.info('Notification outbox event published', {
        eventId: event.eventId,
        correlationId: event.correlationId,
      });
    } catch (error) {
      await activeRepository.releaseOutboxEvent(record.EventId, error, record.Attempts);
      logger.error('Notification outbox publish failed', {
        eventId: String(record.EventId),
        correlationId: event?.correlationId || record.CorrelationId,
        message: error.message,
      });
    }
  }
  return records.length;
}
