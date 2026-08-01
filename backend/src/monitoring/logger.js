const REDACTED_KEYS = /authorization|cookie|password|secret|token|connection.?string|file(content)?/i;

function sanitize(value, seen = new WeakSet()) {
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key, REDACTED_KEYS.test(key) ? '[REDACTED]' : sanitize(item, seen),
  ]));
}

export function createLogger(service = process.env.SERVICE_NAME || 'backend-api') {
  const write = (level, message, context = {}) => {
    const record = sanitize({ timestamp: new Date().toISOString(), level, service, message, ...context });
    (level === 'error' ? console.error : console.log)(JSON.stringify(record));
  };
  return {
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
  };
}

export const logger = createLogger();
