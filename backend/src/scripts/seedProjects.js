// src/scripts/seedProjects.js
import dotenv from 'dotenv';

import { sql, poolPromise } from '../config/db.js';

dotenv.config();

const sampleProjects = [
  {
    title: 'Xây dựng cổng quản lý đề tài sinh viên',
    description:
      'Hệ thống hỗ trợ giảng viên đăng đề tài, sinh viên đăng ký đề tài và admin quản lý quy trình xét duyệt.',
    requirements:
      'Sử dụng Node.js, Express, SQL Server. Có phân quyền Admin, Teacher, Student.',
    expectedOutcome:
      'Website có API backend hoàn chỉnh, hỗ trợ quản lý tài khoản, lớp học, đề tài và đăng ký đề tài.',
    teacherEmail: 'teacher01@tvu.edu.vn',
    classCode: 'DA23TTA',
    maxStudents: 3,
    status: 'Approved',
  },
  {
    title: 'Ứng dụng theo dõi tiến độ thực hiện đồ án',
    description:
      'Hệ thống cho phép sinh viên nộp tiến độ, giảng viên nhận xét và đánh giá quá trình thực hiện.',
    requirements:
      'Có chức năng nộp báo cáo tiến độ, nhận xét, thống kê trạng thái.',
    expectedOutcome:
      'API backend phục vụ quản lý tiến độ đồ án.',
    teacherEmail: 'teacher02@tvu.edu.vn',
    classCode: 'DA23TTB',
    maxStudents: 2,
    status: 'Pending',
  },
  {
    title: 'Hệ thống gợi ý đề tài theo năng lực sinh viên',
    description:
      'Dựa trên kỹ năng và định hướng của sinh viên để đề xuất đề tài phù hợp.',
    requirements:
      'Có dữ liệu kỹ năng sinh viên, danh sách đề tài, cơ chế gợi ý đơn giản.',
    expectedOutcome:
      'Prototype backend cho chức năng gợi ý đề tài.',
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
        AND Role = 'Teacher'
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
        console.log(`Bỏ qua vì đề tài đã tồn tại: ${item.title}`);
        continue;
      }

      const teacherId = await findTeacherIdByEmail(pool, item.teacherEmail);
      const classId = await findClassIdByCode(pool, item.classCode);

      if (!teacherId) {
        console.log(`Không tìm thấy giảng viên: ${item.teacherEmail}`);
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

      console.log(`Đã tạo đề tài: ${item.title}`);
    }

    console.log('Seed đề tài mẫu hoàn tất');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed projects:', error);
    process.exit(1);
  }
}

seedProjects();