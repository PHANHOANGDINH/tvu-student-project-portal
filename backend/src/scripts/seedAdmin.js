// src/scripts/seedAdmin.js
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { sql, poolPromise } from '../config/db.js';

dotenv.config();

async function seedAdmin() {
  try {
    const email = String(process.env.DOCKER_SEED_ADMIN_EMAIL || '').trim().toLowerCase();
    const password = String(process.env.DOCKER_SEED_ADMIN_PASSWORD || '');

    if (!email || !password) {
      console.log('Bỏ qua Docker admin seed vì chưa cấu hình tài khoản.');
      process.exit(0);
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || password.length < 12
      || !/[A-Z]/.test(password)
      || !/[a-z]/.test(password)
      || !/\d/.test(password)
    ) {
      console.error('Docker admin seed email hoặc password không đạt yêu cầu an toàn.');
      process.exit(1);
    }

    const pool = await poolPromise;
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const checkResult = await pool
      .request()
      .input('Email', sql.NVarChar(150), email)
      .query(`
        SELECT Id
        FROM Users
        WHERE Email = @Email
      `);

    if (checkResult.recordset.length > 0) {
      console.log('TĂ i khoáº£n admin Ä‘Ă£ tá»“n táº¡i');
      process.exit(0);
    }

    await pool
      .request()
      .input('FullName', sql.NVarChar(100), 'Docker Administrator')
      .input('Email', sql.NVarChar(150), email)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Role', sql.NVarChar(20), 'ADMIN')
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, Role)
        VALUES (@FullName, @Email, @PasswordHash, @Role)
      `);

    console.log('Tạo tài khoản Docker admin thành công');
    console.log('Email:', email);

    process.exit(0);
  } catch (error) {
    console.error('Lá»—i seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();
