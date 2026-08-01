// src/app.js
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { swaggerSpec } from './docs/swagger.js';
import { sendError } from './utils/apiResponse.util.js';
import { requestId } from './middlewares/requestId.middleware.js';
import { metricsHandler, metricsMiddleware } from './monitoring/metrics.js';
import { logger } from './monitoring/logger.js';

const app = express();
app.use(requestId);
app.use(metricsMiddleware);
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => logger.info('HTTP request completed', {
    requestId: req.requestId, method: req.method, path: req.path,
    statusCode: res.statusCode, durationMs: Date.now() - startedAt,
  }));
  next();
});

const allowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin không được phép bởi CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/internal/metrics', metricsHandler);

app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', routes);

app.use((req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: 'Không tìm thấy API',
  });
});

app.use((error, req, res, next) => {
  if (error.message === 'Origin không được phép bởi CORS') {
    return sendError(res, {
      statusCode: 403,
      message: 'Origin không được phép truy cập API',
    });
  }

  logger.error('HTTP request failed', { requestId: req.requestId, method: req.method, path: req.path, statusCode: Number(error.statusCode) || 500, error });
  const statusCode = Number(error.statusCode) || 500;
  return sendError(res, {
    statusCode,
    message: statusCode < 500 ? error.message : 'Lỗi hệ thống',
    errors: process.env.NODE_ENV === 'development' ? { system: [error.message] } : null,
  });
});

export default app;
