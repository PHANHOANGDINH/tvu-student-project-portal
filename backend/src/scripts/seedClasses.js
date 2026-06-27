// src/scripts/seedClasses.js
import dotenv from 'dotenv';

import { sql, poolPromise } from '../config/db.js';

dotenv.config();

const sampleClasses = [
  {
    classCode: 'DA23TTA',
    className: 'Công nghệ thông tin A - Khóa 2023',
    department: 'Khoa Kỹ thuật và Công nghệ',
    academicYear: '2023-2027',
    advisorEmail: 'teacher01@tvu.edu.vn',
  },
  {
    classCode: 'DA23TTB',
    className: 'Công nghệ thông tin B - Khóa 2023',
    department: 'Khoa Kỹ thuật và Công nghệ',
    academicYear: '2023-2027',
    advisorEmail: 'teacher02@tvu.edu.vn',
  },
];

async function findTeacherIdByEmail(pool, email) {
  const result = await pool
    .request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT TOP 1 Id
      FROM Users
      WHERE Email = @Email
        AND Role = 'Teacher'
        AND DeletedAt IS NULL
    `);

  return result.recordset[0]?.Id || null;
}

async function seedClasses() {
  try {
    const pool = await poolPromise;

    for (const item of sampleClasses) {
      const checkResult = await pool
        .request()
        .input('ClassCode', sql.NVarChar(50), item.classCode)
        .query(`
          SELECT Id
          FROM Classes
          WHERE ClassCode = @ClassCode
        `);

      if (checkResult.recordset.length > 0) {
        console.log(`Bỏ qua vì lớp đã tồn tại: ${item.classCode}`);
        continue;
      }

      const advisorTeacherId = await findTeacherIdByEmail(pool, item.advisorEmail);

      await pool
        .request()
        .input('ClassCode', sql.NVarChar(50), item.classCode)
        .input('ClassName', sql.NVarChar(100), item.className)
        .input('Department', sql.NVarChar(100), item.department)
        .input('AcademicYear', sql.NVarChar(20), item.academicYear)
        .input('AdvisorTeacherId', sql.Int, advisorTeacherId)
        .query(`
          INSERT INTO Classes (
            ClassCode,
            ClassName,
            Department,
            AcademicYear,
            AdvisorTeacherId
          )
          VALUES (
            @ClassCode,
            @ClassName,
            @Department,
            @AcademicYear,
            @AdvisorTeacherId
          )
        `);

      console.log(`Đã tạo lớp: ${item.classCode}`);
    }

    console.log('Seed lớp học mẫu hoàn tất');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed classes:', error);
    process.exit(1);
  }
}

seedClasses();