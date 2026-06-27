// src/server.js
import app from './app.js';
import { poolPromise } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await poolPromise;

    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Không thể khởi động server:', error);
    process.exit(1);
  }
}

startServer();