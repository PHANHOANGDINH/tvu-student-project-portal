// src/scripts/seedClassMembers.js
import dotenv from 'dotenv';

import { sql, poolPromise } from '../config/db.js';

dotenv.config();

const classMembers = [
  {
    classCode: 'DA23TTA',
    studentEmail: 'student01@st.tvu.edu.vn',
  },
  {
    classCode: 'DA23TTA',
    studentEmail: 'student02@st.tvu.edu.vn',
  },
  {
    classCode: 'DA23TTA',
    studentEmail: 'student03@st.tvu.edu.vn',
  },
];

async function findClassId(pool, classCode) {
  const result = await pool
    .request()
    .input('ClassCode', sql.NVarChar(50), classCode)
    .query(`
      SELECT TOP 1 Id
      FROM Classes
      WHERE ClassCode = @ClassCode
        AND DeletedAt IS NULL
    `);

  return result.recordset[0]?.Id || null;
}

async function findStudentId(pool, email) {
  const result = await pool
    .request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT TOP 1 Id
      FROM Users
      WHERE Email = @Email
        AND Role = 'STUDENT'
        AND DeletedAt IS NULL
    `);

  return result.recordset[0]?.Id || null;
}

async function findActiveStudentClass(pool, studentId) {
  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .query(`
      SELECT TOP 1 Id, ClassId
      FROM StudentClassMembers
      WHERE StudentId = @StudentId
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

async function seedClassMembers() {
  try {
    const pool = await poolPromise;

    for (const item of classMembers) {
      const classId = await findClassId(pool, item.classCode);
      const studentId = await findStudentId(pool, item.studentEmail);

      if (!classId) {
        console.log(`KhĂ´ng tĂ¬m tháº¥y lá»›p: ${item.classCode}`);
        continue;
      }

      if (!studentId) {
        console.log(`KhĂ´ng tĂ¬m tháº¥y sinh viĂªn: ${item.studentEmail}`);
        continue;
      }

      const activeClass = await findActiveStudentClass(pool, studentId);

      if (activeClass) {
        console.log(`Bá» qua vĂ¬ sinh viĂªn Ä‘Ă£ cĂ³ lá»›p: ${item.studentEmail}`);
        continue;
      }

      await pool
        .request()
        .input('ClassId', sql.Int, classId)
        .input('StudentId', sql.Int, studentId)
        .query(`
          INSERT INTO StudentClassMembers (
            ClassId,
            StudentId
          )
          VALUES (
            @ClassId,
            @StudentId
          )
        `);

      console.log(`ÄĂ£ thĂªm ${item.studentEmail} vĂ o lá»›p ${item.classCode}`);
    }

    console.log('Seed sinh viĂªn vĂ o lá»›p hoĂ n táº¥t');
    process.exit(0);
  } catch (error) {
    console.error('Lá»—i seed class members:', error);
    process.exit(1);
  }
}

seedClassMembers();
