// src/scripts/seedUsers.js
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { sql, poolPromise } from '../config/db.js';

dotenv.config();

const sampleUsers = [
  {
    fullName: 'Nguyá»…n VÄƒn An',
    email: 'teacher01@tvu.edu.vn',
    password: '123456',
    role: 'LECTURER',
    userCode: 'GV001',
    phone: '0901000001',
    department: 'Khoa Ká»¹ thuáº­t vĂ  CĂ´ng nghá»‡',
    className: null,
  },
  {
    fullName: 'Tráº§n Thá»‹ BĂ¬nh',
    email: 'teacher02@tvu.edu.vn',
    password: '123456',
    role: 'LECTURER',
    userCode: 'GV002',
    phone: '0901000002',
    department: 'Khoa Ká»¹ thuáº­t vĂ  CĂ´ng nghá»‡',
    className: null,
  },
  {
    fullName: 'LĂª Minh CÆ°á»ng',
    email: 'student01@st.tvu.edu.vn',
    password: '123456',
    role: 'STUDENT',
    userCode: '1101230001',
    phone: '0911000001',
    department: 'Khoa Ká»¹ thuáº­t vĂ  CĂ´ng nghá»‡',
    className: 'DA23TTA',
  },
  {
    fullName: 'Pháº¡m Quá»‘c DÅ©ng',
    email: 'student02@st.tvu.edu.vn',
    password: '123456',
    role: 'STUDENT',
    userCode: '1101230002',
    phone: '0911000002',
    department: 'Khoa Ká»¹ thuáº­t vĂ  CĂ´ng nghá»‡',
    className: 'DA23TTA',
  },
  {
    fullName: 'VĂµ Thanh Huy',
    email: 'student03@st.tvu.edu.vn',
    password: '123456',
    role: 'STUDENT',
    userCode: '1101230003',
    phone: '0911000003',
    department: 'Khoa Ká»¹ thuáº­t vĂ  CĂ´ng nghá»‡',
    className: 'DA23TTA',
  },
];

async function seedUsers() {
  try {
    const pool = await poolPromise;

    for (const user of sampleUsers) {
      const checkResult = await pool
        .request()
        .input('Email', sql.NVarChar(150), user.email)
        .query(`
          SELECT Id
          FROM Users
          WHERE Email = @Email
        `);

      if (checkResult.recordset.length > 0) {
        console.log(`Bá» qua vĂ¬ Ä‘Ă£ tá»“n táº¡i: ${user.email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, 10);

      await pool
        .request()
        .input('FullName', sql.NVarChar(100), user.fullName)
        .input('Email', sql.NVarChar(150), user.email)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('Role', sql.NVarChar(20), user.role)
        .input('UserCode', sql.NVarChar(50), user.userCode)
        .input('Phone', sql.NVarChar(20), user.phone)
        .input('Department', sql.NVarChar(100), user.department)
        .input('ClassName', sql.NVarChar(100), user.className)
        .query(`
          INSERT INTO Users (
            FullName,
            Email,
            PasswordHash,
            Role,
            UserCode,
            Phone,
            Department,
            ClassName
          )
          VALUES (
            @FullName,
            @Email,
            @PasswordHash,
            @Role,
            @UserCode,
            @Phone,
            @Department,
            @ClassName
          )
        `);

      console.log(`ÄĂ£ táº¡o user: ${user.email}`);
    }

    console.log('Seed user máº«u hoĂ n táº¥t');
    process.exit(0);
  } catch (error) {
    console.error('Lá»—i seed users:', error);
    process.exit(1);
  }
}

seedUsers();
