import dotenv from 'dotenv';
import sql from 'mssql';
import { createLogger } from '../monitoring/logger.js';

dotenv.config({ override: true });
const logger = createLogger(process.env.SERVICE_NAME || 'backend-api');
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT || 1433),
  options: {
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

logger.info('Connecting to SQL Server', { server: dbConfig.server, database: dbConfig.database, port: dbConfig.port });
const poolPromise = new sql.ConnectionPool(dbConfig).connect()
  .then((pool) => { logger.info('SQL Server connected'); return pool; })
  .catch((error) => { logger.error('SQL Server connection failed', { error }); throw error; });

export { sql, poolPromise };
