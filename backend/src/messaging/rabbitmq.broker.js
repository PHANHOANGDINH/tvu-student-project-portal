import amqp from 'amqplib';
import { rabbitConfig, rabbitUrl } from './rabbitmq.config.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class RabbitMqBroker {
  constructor({ logger = console } = {}) {
    this.logger = logger;
    this.connection = null;
    this.channel = null;
    this.connecting = null;
    this.closing = false;
    this.consumerHandler = null;
  }

  async connect() {
    if (this.channel) return this.channel;
    if (this.connecting) return this.connecting;
    this.connecting = this.#connectWithRetry();
    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  async #connectWithRetry() {
    let delay = 1000;
    while (!this.closing) {
      try {
        const connection = await amqp.connect(rabbitUrl(), { heartbeat: 30 });
        connection.on('error', (error) => this.logger.error('RabbitMQ connection error', { message: error.message }));
        connection.on('close', () => {
          this.connection = null;
          this.channel = null;
          if (!this.closing) {
            this.logger.warn('RabbitMQ connection closed; reconnect scheduled');
            setTimeout(() => this.#restoreConsumer().catch((error) =>
              this.logger.error('RabbitMQ reconnect failed', { message: error.message })), 1000);
          }
        });
        const channel = await connection.createConfirmChannel();
        channel.on('error', (error) => this.logger.error('RabbitMQ channel error', { message: error.message }));
        await this.#assertTopology(channel);
        this.connection = connection;
        this.channel = channel;
        this.logger.info('RabbitMQ connected');
        return channel;
      } catch (error) {
        this.logger.warn('RabbitMQ unavailable; retrying', { message: error.message, retryInMs: delay });
        await sleep(delay);
        delay = Math.min(delay * 2, 30000);
      }
    }
    throw new Error('RabbitMQ broker is closing');
  }

  async #assertTopology(channel) {
    await channel.assertExchange(rabbitConfig.exchange, 'direct', { durable: true });
    await channel.assertExchange(rabbitConfig.retryExchange, 'direct', { durable: true });
    await channel.assertExchange(rabbitConfig.deadExchange, 'direct', { durable: true });
    await channel.assertQueue(rabbitConfig.queue, { durable: true });
    await channel.bindQueue(rabbitConfig.queue, rabbitConfig.exchange, rabbitConfig.routingKey);
    await channel.assertQueue(rabbitConfig.retryQueue, {
      durable: true,
      arguments: {
        'x-message-ttl': rabbitConfig.retryDelayMs,
        'x-dead-letter-exchange': rabbitConfig.exchange,
        'x-dead-letter-routing-key': rabbitConfig.routingKey,
      },
    });
    await channel.bindQueue(rabbitConfig.retryQueue, rabbitConfig.retryExchange, rabbitConfig.routingKey);
    await channel.assertQueue(rabbitConfig.deadQueue, { durable: true });
    await channel.bindQueue(rabbitConfig.deadQueue, rabbitConfig.deadExchange, rabbitConfig.routingKey);
    await channel.prefetch(rabbitConfig.prefetch);
  }

  async publish(event, { exchange = rabbitConfig.exchange, headers = {} } = {}) {
    const channel = await this.connect();
    const body = Buffer.from(JSON.stringify(event));
    const accepted = channel.publish(exchange, rabbitConfig.routingKey, body, {
      persistent: true,
      contentType: 'application/json',
      messageId: event.eventId,
      correlationId: event.correlationId,
      timestamp: Date.now(),
      headers,
    });
    if (!accepted) await new Promise((resolve) => channel.once('drain', resolve));
    await channel.waitForConfirms();
  }

  async consume(handler) {
    this.consumerHandler = handler;
    const channel = await this.connect();
    await channel.consume(rabbitConfig.queue, (message) => handler(message, channel), { noAck: false });
  }

  async #restoreConsumer() {
    const channel = await this.connect();
    if (this.consumerHandler) {
      await channel.consume(
        rabbitConfig.queue,
        (message) => this.consumerHandler(message, channel),
        { noAck: false }
      );
      this.logger.info('RabbitMQ consumer restored');
    }
  }

  async close() {
    this.closing = true;
    try { await this.channel?.close(); } catch {}
    try { await this.connection?.close(); } catch {}
    this.channel = null;
    this.connection = null;
  }
}
