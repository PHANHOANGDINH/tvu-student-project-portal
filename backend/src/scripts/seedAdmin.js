// src/scripts/seedAdmin.js
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { sql, poolPromise } from '../config/db.js';

dotenv.config();

async function seedAdmin() {
  try {
    const pool = await poolPromise;

    const email = 'admin@tvu.edu.vn';
    const password = '123456';
    const passwordHash = await bcrypt.hash(password, 10);

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
      .input('FullName', sql.NVarChar(100), 'Quáº£n trá»‹ viĂªn')
      .input('Email', sql.NVarChar(150), email)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Role', sql.NVarChar(20), 'ADMIN')
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, Role)
        VALUES (@FullName, @Email, @PasswordHash, @Role)
      `);

    console.log('Táº¡o tĂ i khoáº£n admin thĂ nh cĂ´ng');
    console.log('Email:', email);
    console.log('Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Lá»—i seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();
