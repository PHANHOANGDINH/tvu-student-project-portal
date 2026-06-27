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
      console.log('Tài khoản admin đã tồn tại');
      process.exit(0);
    }

    await pool
      .request()
      .input('FullName', sql.NVarChar(100), 'Quản trị viên')
      .input('Email', sql.NVarChar(150), email)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Role', sql.NVarChar(20), 'Admin')
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, Role)
        VALUES (@FullName, @Email, @PasswordHash, @Role)
      `);

    console.log('Tạo tài khoản admin thành công');
    console.log('Email:', email);
    console.log('Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();