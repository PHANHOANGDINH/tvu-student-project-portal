import { rabbitConfig } from './rabbitmq.config.js';
import { validateNotificationEvent } from './notification.events.js';
import { notificationEvents } from '../monitoring/metrics.js';

export async function processDelivery({ message, channel, broker, handler, logger = console }) {
  let event;
  try {
    event = JSON.parse(message.content.toString('utf8'));
    const errors = validateNotificationEvent(event);
    if (errors.length) throw new Error(errors.join(', '));
    await handler(event);
    notificationEvents.inc({ operation: 'consume', result: 'processed' });
    channel.ack(message);
    logger.info('Notification event consumed', {
      eventId: event.eventId,
      correlationId: event.correlationId,
    });
  } catch (error) {
    const retryCount = Number(message.properties.headers?.['x-retry-count'] || 0);
    const safeContext = {
      eventId: event?.eventId || message.properties.messageId || null,
      correlationId: event?.correlationId || message.properties.correlationId || null,
      retryCount,
      message: error.message,
    };
    if (retryCount < rabbitConfig.maxRetries) {
      notificationEvents.inc({ operation: 'consume', result: 'retry' });
      await broker.publish(event || {
        eventId: message.properties.messageId,
        correlationId: message.properties.correlationId,
      }, {
        exchange: rabbitConfig.retryExchange,
        headers: { 'x-retry-count': retryCount + 1 },
      });
      channel.ack(message);
      logger.warn('Notification event scheduled for retry', safeContext);
      return 'retry';
    }
    await broker.publish(event || {
      eventId: message.properties.messageId,
      correlationId: message.properties.correlationId,
    }, {
      exchange: rabbitConfig.deadExchange,
      headers: { 'x-retry-count': retryCount, 'x-error': String(error.message).slice(0, 200) },
    });
    notificationEvents.inc({ operation: 'consume', result: 'dead_letter' });
    channel.ack(message);
    logger.error('Notification event moved to dead-letter queue', safeContext);
    return 'dead';
  }
  return 'ack';
}
