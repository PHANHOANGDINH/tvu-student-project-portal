export const rabbitConfig = Object.freeze({
  exchange: process.env.RABBITMQ_NOTIFICATION_EXCHANGE || 'tvu.notifications',
  routingKey: process.env.RABBITMQ_NOTIFICATION_ROUTING_KEY || 'notification.created',
  queue: process.env.RABBITMQ_NOTIFICATION_QUEUE || 'tvu.notifications.process',
  retryExchange: process.env.RABBITMQ_RETRY_EXCHANGE || 'tvu.notifications.retry',
  retryQueue: process.env.RABBITMQ_RETRY_QUEUE || 'tvu.notifications.retry',
  deadExchange: process.env.RABBITMQ_DEAD_EXCHANGE || 'tvu.notifications.dead',
  deadQueue: process.env.RABBITMQ_DEAD_QUEUE || 'tvu.notifications.dead',
  retryDelayMs: Number(process.env.RABBITMQ_RETRY_DELAY_MS || 5000),
  maxRetries: Number(process.env.RABBITMQ_MAX_RETRIES || 3),
  prefetch: Number(process.env.RABBITMQ_PREFETCH || 10),
});

export function rabbitUrl() {
  const user = encodeURIComponent(process.env.RABBITMQ_USER || '');
  const password = encodeURIComponent(process.env.RABBITMQ_PASSWORD || '');
  const host = process.env.RABBITMQ_HOST || 'rabbitmq';
  const port = Number(process.env.RABBITMQ_PORT || 5672);
  const vhost = encodeURIComponent(process.env.RABBITMQ_VHOST || '/');
  if (!user || !password) throw new Error('RabbitMQ credentials are not configured');
  return `amqp://${user}:${password}@${host}:${port}/${vhost}`;
}
