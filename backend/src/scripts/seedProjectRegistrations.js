// src/scripts/seedProjectRegistrations.js
import dotenv from 'dotenv';

import { sql, poolPromise } from '../config/db.js';

dotenv.config();

const sampleRegistrations = [
  {
    projectTitle: 'Xây dựng cổng quản lý đề tài sinh viên',
    studentEmail: 'student01@st.tvu.edu.vn',
    note: 'Em muốn đăng ký đề tài này để rèn luyện backend và quy trình quản lý đề tài.',
    status: 'Approved',
    reviewerEmail: 'teacher01@tvu.edu.vn',
  },
  {
    projectTitle: 'Hệ thống gợi ý đề tài theo năng lực sinh viên',
    studentEmail: 'student02@st.tvu.edu.vn',
    note: 'Em quan tâm đến chức năng gợi ý và xử lý dữ liệu.',
    status: 'Pending',
    reviewerEmail: null,
  },
];

async function findProjectIdByTitle(pool, title) {
  const result = await pool
    .request()
    .input('Title', sql.NVarChar(255), title)
    .query(`
      SELECT TOP 1 Id
      FROM Projects
      WHERE Title = @Title
        AND DeletedAt IS NULL
    `);

  return result.recordset[0]?.Id || null;
}

async function findUserIdByEmail(pool, email) {
  const result = await pool
    .request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT TOP 1 Id
      FROM Users
      WHERE Email = @Email
        AND DeletedAt IS NULL
    `);

  return result.recordset[0]?.Id || null;
}

async function seedProjectRegistrations() {
  try {
    const pool = await poolPromise;

    for (const item of sampleRegistrations) {
      const projectId = await findProjectIdByTitle(pool, item.projectTitle);
      const studentId = await findUserIdByEmail(pool, item.studentEmail);
      const reviewerId = item.reviewerEmail
        ? await findUserIdByEmail(pool, item.reviewerEmail)
        : null;

      if (!projectId) {
        console.log(`Không tìm thấy đề tài: ${item.projectTitle}`);
        continue;
      }

      if (!studentId) {
        console.log(`Không tìm thấy sinh viên: ${item.studentEmail}`);
        continue;
      }

      const checkResult = await pool
        .request()
        .input('ProjectId', sql.Int, projectId)
        .input('StudentId', sql.Int, studentId)
        .query(`
          SELECT TOP 1 Id
          FROM ProjectRegistrations
          WHERE ProjectId = @ProjectId
            AND StudentId = @StudentId
            AND DeletedAt IS NULL
        `);

      if (checkResult.recordset.length > 0) {
        console.log(`Bỏ qua vì đã đăng ký: ${item.studentEmail}`);
        continue;
      }

      await pool
        .request()
        .input('ProjectId', sql.Int, projectId)
        .input('StudentId', sql.Int, studentId)
        .input('Note', sql.NVarChar(sql.MAX), item.note)
        .input('Status', sql.NVarChar(30), item.status)
        .input('ReviewedBy', sql.Int, reviewerId)
        .query(`
          INSERT INTO ProjectRegistrations (
            ProjectId,
            StudentId,
            Note,
            Status,
            ReviewedBy,
            ReviewedAt
          )
          VALUES (
            @ProjectId,
            @StudentId,
            @Note,
            @Status,
            @ReviewedBy,
            CASE WHEN @ReviewedBy IS NULL THEN NULL ELSE SYSDATETIME() END
          )
        `);

      console.log(`Đã tạo đăng ký: ${item.studentEmail}`);
    }

    console.log('Seed đăng ký đề tài mẫu hoàn tất');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed project registrations:', error);
    process.exit(1);
  }
}

seedProjectRegistrations();