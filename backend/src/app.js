// src/app.js
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { swaggerSpec } from './docs/swagger.js';
import { sendError } from './utils/apiResponse.util.js';

const app = express();

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
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

  console.error(error);
  return sendError(res, {
    statusCode: 500,
    message: 'Lỗi hệ thống',
    errors: process.env.NODE_ENV === 'development' ? { system: [error.message] } : null,
  });
});

export default app;
