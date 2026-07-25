// src/scripts/seedProjects.js
import dotenv from 'dotenv';

import { sql, poolPromise } from '../config/db.js';

dotenv.config();

const sampleProjects = [
  {
    title: 'XĂ¢y dá»±ng cá»•ng quáº£n lĂ½ Ä‘á» tĂ i sinh viĂªn',
    description:
      'Há»‡ thá»‘ng há»— trá»£ giáº£ng viĂªn Ä‘Äƒng Ä‘á» tĂ i, sinh viĂªn Ä‘Äƒng kĂ½ Ä‘á» tĂ i vĂ  admin quáº£n lĂ½ quy trĂ¬nh xĂ©t duyá»‡t.',
    requirements:
      'Sá»­ dá»¥ng Node.js, Express, SQL Server. CĂ³ phĂ¢n quyá»n Admin, Teacher, Student.',
    expectedOutcome:
      'Website cĂ³ API backend hoĂ n chá»‰nh, há»— trá»£ quáº£n lĂ½ tĂ i khoáº£n, lá»›p há»c, Ä‘á» tĂ i vĂ  Ä‘Äƒng kĂ½ Ä‘á» tĂ i.',
    teacherEmail: 'teacher01@tvu.edu.vn',
    classCode: 'DA23TTA',
    maxStudents: 3,
    status: 'Approved',
  },
  {
    title: 'á»¨ng dá»¥ng theo dĂµi tiáº¿n Ä‘á»™ thá»±c hiá»‡n Ä‘á»“ Ă¡n',
    description:
      'Há»‡ thá»‘ng cho phĂ©p sinh viĂªn ná»™p tiáº¿n Ä‘á»™, giáº£ng viĂªn nháº­n xĂ©t vĂ  Ä‘Ă¡nh giĂ¡ quĂ¡ trĂ¬nh thá»±c hiá»‡n.',
    requirements:
      'CĂ³ chá»©c nÄƒng ná»™p bĂ¡o cĂ¡o tiáº¿n Ä‘á»™, nháº­n xĂ©t, thá»‘ng kĂª tráº¡ng thĂ¡i.',
    expectedOutcome:
      'API backend phá»¥c vá»¥ quáº£n lĂ½ tiáº¿n Ä‘á»™ Ä‘á»“ Ă¡n.',
    teacherEmail: 'teacher02@tvu.edu.vn',
    classCode: 'DA23TTB',
    maxStudents: 2,
    status: 'Pending',
  },
  {
    title: 'Há»‡ thá»‘ng gá»£i Ă½ Ä‘á» tĂ i theo nÄƒng lá»±c sinh viĂªn',
    description:
      'Dá»±a trĂªn ká»¹ nÄƒng vĂ  Ä‘á»‹nh hÆ°á»›ng cá»§a sinh viĂªn Ä‘á»ƒ Ä‘á» xuáº¥t Ä‘á» tĂ i phĂ¹ há»£p.',
    requirements:
      'CĂ³ dá»¯ liá»‡u ká»¹ nÄƒng sinh viĂªn, danh sĂ¡ch Ä‘á» tĂ i, cÆ¡ cháº¿ gá»£i Ă½ Ä‘Æ¡n giáº£n.',
    expectedOutcome:
      'Prototype backend cho chá»©c nÄƒng gá»£i Ă½ Ä‘á» tĂ i.',
    teacherEmail: 'teacher01@tvu.edu.vn',
    classCode: 'DA23TTA',
    maxStudents: 2,
    status: 'Approved',
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
        AND Role = 'LECTURER'
        AND DeletedAt IS NULL
    `);

  return result.recordset[0]?.Id || null;
}

async function findClassIdByCode(pool, classCode) {
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

async function seedProjects() {
  try {
    const pool = await poolPromise;

    for (const item of sampleProjects) {
      const checkResult = await pool
        .request()
        .input('Title', sql.NVarChar(255), item.title)
        .query(`
          SELECT TOP 1 Id
          FROM Projects
          WHERE Title = @Title
            AND DeletedAt IS NULL
        `);

      if (checkResult.recordset.length > 0) {
        console.log(`Bá» qua vĂ¬ Ä‘á» tĂ i Ä‘Ă£ tá»“n táº¡i: ${item.title}`);
        continue;
      }

      const teacherId = await findTeacherIdByEmail(pool, item.teacherEmail);
      const classId = await findClassIdByCode(pool, item.classCode);

      if (!teacherId) {
        console.log(`KhĂ´ng tĂ¬m tháº¥y giáº£ng viĂªn: ${item.teacherEmail}`);
        continue;
      }

      await pool
        .request()
        .input('Title', sql.NVarChar(255), item.title)
        .input('Description', sql.NVarChar(sql.MAX), item.description)
        .input('Requirements', sql.NVarChar(sql.MAX), item.requirements)
        .input('ExpectedOutcome', sql.NVarChar(sql.MAX), item.expectedOutcome)
        .input('TeacherId', sql.Int, teacherId)
        .input('ClassId', sql.Int, classId)
        .input('MaxStudents', sql.Int, item.maxStudents)
        .input('Status', sql.NVarChar(30), item.status)
        .query(`
          INSERT INTO Projects (
            Title,
            Description,
            Requirements,
            ExpectedOutcome,
            TeacherId,
            ClassId,
            MaxStudents,
            Status
          )
          VALUES (
            @Title,
            @Description,
            @Requirements,
            @ExpectedOutcome,
            @TeacherId,
            @ClassId,
            @MaxStudents,
            @Status
          )
        `);

      console.log(`ÄĂ£ táº¡o Ä‘á» tĂ i: ${item.title}`);
    }

    console.log('Seed Ä‘á» tĂ i máº«u hoĂ n táº¥t');
    process.exit(0);
  } catch (error) {
    console.error('Lá»—i seed projects:', error);
    process.exit(1);
  }
}

seedProjects();
