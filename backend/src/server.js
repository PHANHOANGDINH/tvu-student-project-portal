import app from './app.js';
import { poolPromise } from './config/db.js';
import { logger } from './monitoring/logger.js';
import { databaseUp } from './monitoring/metrics.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await poolPromise;
    databaseUp.set(1);
    app.listen(PORT, () => logger.info('Backend API listening', { port: Number(PORT) }));
  } catch (error) {
    databaseUp.set(0);
    logger.error('Backend startup failed', { error });
    process.exit(1);
  }
}

startServer();
