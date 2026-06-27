// src/scripts/seedUsers.js
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { sql, poolPromise } from '../config/db.js';

dotenv.config();

const sampleUsers = [
  {
    fullName: 'Nguyễn Văn An',
    email: 'teacher01@tvu.edu.vn',
    password: '123456',
    role: 'Teacher',
    userCode: 'GV001',
    phone: '0901000001',
    department: 'Khoa Kỹ thuật và Công nghệ',
    className: null,
  },
  {
    fullName: 'Trần Thị Bình',
    email: 'teacher02@tvu.edu.vn',
    password: '123456',
    role: 'Teacher',
    userCode: 'GV002',
    phone: '0901000002',
    department: 'Khoa Kỹ thuật và Công nghệ',
    className: null,
  },
  {
    fullName: 'Lê Minh Cường',
    email: 'student01@st.tvu.edu.vn',
    password: '123456',
    role: 'Student',
    userCode: '1101230001',
    phone: '0911000001',
    department: 'Khoa Kỹ thuật và Công nghệ',
    className: 'DA23TTA',
  },
  {
    fullName: 'Phạm Quốc Dũng',
    email: 'student02@st.tvu.edu.vn',
    password: '123456',
    role: 'Student',
    userCode: '1101230002',
    phone: '0911000002',
    department: 'Khoa Kỹ thuật và Công nghệ',
    className: 'DA23TTA',
  },
  {
    fullName: 'Võ Thanh Huy',
    email: 'student03@st.tvu.edu.vn',
    password: '123456',
    role: 'Student',
    userCode: '1101230003',
    phone: '0911000003',
    department: 'Khoa Kỹ thuật và Công nghệ',
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
        console.log(`Bỏ qua vì đã tồn tại: ${user.email}`);
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

      console.log(`Đã tạo user: ${user.email}`);
    }

    console.log('Seed user mẫu hoàn tất');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed users:', error);
    process.exit(1);
  }
}

seedUsers();