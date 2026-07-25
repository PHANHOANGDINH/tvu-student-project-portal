// src/modules/admin/admin.classes.model.js
import { sql, poolPromise } from '../../config/db.js';

function addClassFilters(request, filters = {}) {
  const search = filters.search ? `%${filters.search.trim()}%` : null;
  const status = filters.status || 'not-deleted';
  const advisorTeacherId = filters.advisorTeacherId ? Number(filters.advisorTeacherId) : null;

  request.input('Search', sql.NVarChar(200), search);
  request.input('Status', sql.NVarChar(20), status);
  request.input('AdvisorTeacherId', sql.Int, advisorTeacherId);

  return `
    WHERE
      (
        @Search IS NULL
        OR c.ClassCode LIKE @Search
        OR c.ClassName LIKE @Search
        OR c.Department LIKE @Search
        OR c.AcademicYear LIKE @Search
        OR u.FullName LIKE @Search
      )
      AND
      (
        @AdvisorTeacherId IS NULL
        OR c.AdvisorTeacherId = @AdvisorTeacherId
      )
      AND
      (
        @Status = 'all'
        OR (@Status = 'not-deleted' AND c.DeletedAt IS NULL)
        OR (@Status = 'active' AND c.IsActive = 1 AND c.DeletedAt IS NULL)
        OR (@Status = 'inactive' AND c.IsActive = 0 AND c.DeletedAt IS NULL)
        OR (@Status = 'deleted' AND c.DeletedAt IS NOT NULL)
      )
  `;
}

export async function getClasses(filters = {}) {
  const pool = await poolPromise;

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;

  const request = pool.request();
  const whereClause = addClassFilters(request, filters);

  request.input('Offset', sql.Int, offset);
  request.input('Limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
      c.Id,
      c.ClassCode,
      c.ClassName,
      c.Department,
      c.AcademicYear,
      c.AdvisorTeacherId,
      u.FullName AS AdvisorTeacherName,
      u.Email AS AdvisorTeacherEmail,
      c.IsActive,
      c.CreatedAt,
      c.UpdatedAt,
      c.DeletedAt,
      COUNT(scm.Id) AS TotalStudents
    FROM Classes c
    LEFT JOIN Users u 
      ON c.AdvisorTeacherId = u.Id
    LEFT JOIN StudentClassMembers scm 
      ON c.Id = scm.ClassId 
      AND scm.DeletedAt IS NULL
    ${whereClause}
    GROUP BY
      c.Id,
      c.ClassCode,
      c.ClassName,
      c.Department,
      c.AcademicYear,
      c.AdvisorTeacherId,
      u.FullName,
      u.Email,
      c.IsActive,
      c.CreatedAt,
      c.UpdatedAt,
      c.DeletedAt
    ORDER BY c.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
  `);

  return result.recordset;
}

export async function countClasses(filters = {}) {
  const pool = await poolPromise;

  const request = pool.request();
  const whereClause = addClassFilters(request, filters);

  const result = await request.query(`
    SELECT COUNT(*) AS Total
    FROM Classes c
    LEFT JOIN Users u 
      ON c.AdvisorTeacherId = u.Id
    ${whereClause}
  `);

  return result.recordset[0].Total;
}

export async function findClassById(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      SELECT TOP 1
        c.Id,
        c.ClassCode,
        c.ClassName,
        c.Department,
        c.AcademicYear,
        c.AdvisorTeacherId,
        u.FullName AS AdvisorTeacherName,
        u.Email AS AdvisorTeacherEmail,
        c.IsActive,
        c.CreatedAt,
        c.UpdatedAt,
        c.DeletedAt,
        (
          SELECT COUNT(*)
          FROM StudentClassMembers scm
          WHERE scm.ClassId = c.Id
            AND scm.DeletedAt IS NULL
        ) AS TotalStudents
      FROM Classes c
      LEFT JOIN Users u 
        ON c.AdvisorTeacherId = u.Id
      WHERE c.Id = @Id
    `);

  return result.recordset[0] || null;
}

export async function findClassByCode(classCode) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ClassCode', sql.NVarChar(50), classCode)
    .query(`
      SELECT TOP 1
        Id,
        ClassCode,
        ClassName,
        DeletedAt
      FROM Classes
      WHERE ClassCode = @ClassCode
    `);

  return result.recordset[0] || null;
}

export async function findTeacherById(teacherId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('TeacherId', sql.Int, teacherId)
    .query(`
      SELECT TOP 1
        Id,
        FullName,
        Email,
        Role,
        IsActive,
        DeletedAt
      FROM Users
      WHERE Id = @TeacherId
        AND Role = 'LECTURER'
        AND IsActive = 1
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function createClass(data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ClassCode', sql.NVarChar(50), data.classCode)
    .input('ClassName', sql.NVarChar(100), data.className)
    .input('Department', sql.NVarChar(100), data.department || null)
    .input('AcademicYear', sql.NVarChar(20), data.academicYear || null)
    .input('AdvisorTeacherId', sql.Int, data.advisorTeacherId || null)
    .query(`
      INSERT INTO Classes (
        ClassCode,
        ClassName,
        Department,
        AcademicYear,
        AdvisorTeacherId
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.ClassCode,
        INSERTED.ClassName,
        INSERTED.Department,
        INSERTED.AcademicYear,
        INSERTED.AdvisorTeacherId,
        INSERTED.IsActive,
        INSERTED.CreatedAt
      VALUES (
        @ClassCode,
        @ClassName,
        @Department,
        @AcademicYear,
        @AdvisorTeacherId
      )
    `);

  return result.recordset[0];
}

export async function updateClass(id, data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('ClassCode', sql.NVarChar(50), data.classCode)
    .input('ClassName', sql.NVarChar(100), data.className)
    .input('Department', sql.NVarChar(100), data.department || null)
    .input('AcademicYear', sql.NVarChar(20), data.academicYear || null)
    .input('AdvisorTeacherId', sql.Int, data.advisorTeacherId || null)
    .query(`
      UPDATE Classes
      SET
        ClassCode = @ClassCode,
        ClassName = @ClassName,
        Department = @Department,
        AcademicYear = @AcademicYear,
        AdvisorTeacherId = @AdvisorTeacherId,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ClassCode,
        INSERTED.ClassName,
        INSERTED.Department,
        INSERTED.AcademicYear,
        INSERTED.AdvisorTeacherId,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function setClassActive(id, isActive) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('IsActive', sql.Bit, isActive)
    .query(`
      UPDATE Classes
      SET
        IsActive = @IsActive,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ClassCode,
        INSERTED.ClassName,
        INSERTED.IsActive,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function softDeleteClass(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      UPDATE Classes
      SET
        IsActive = 0,
        DeletedAt = SYSDATETIME(),
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ClassCode,
        INSERTED.ClassName,
        INSERTED.IsActive,
        INSERTED.DeletedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function findStudentById(studentId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .query(`
      SELECT TOP 1
        Id,
        FullName,
        Email,
        UserCode,
        Role,
        IsActive,
        DeletedAt
      FROM Users
      WHERE Id = @StudentId
        AND Role = 'STUDENT'
        AND IsActive = 1
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function findActiveStudentClass(studentId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .query(`
      SELECT TOP 1
        scm.Id,
        scm.ClassId,
        c.ClassCode,
        c.ClassName,
        scm.StudentId
      FROM StudentClassMembers scm
      INNER JOIN Classes c 
        ON scm.ClassId = c.Id
      WHERE scm.StudentId = @StudentId
        AND scm.DeletedAt IS NULL
        AND c.DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function addStudentToClass(classId, studentId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ClassId', sql.Int, classId)
    .input('StudentId', sql.Int, studentId)
    .query(`
      INSERT INTO StudentClassMembers (
        ClassId,
        StudentId
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.ClassId,
        INSERTED.StudentId,
        INSERTED.CreatedAt
      VALUES (
        @ClassId,
        @StudentId
      )
    `);

  return result.recordset[0];
}

export async function getClassStudents(classId, filters = {}) {
  const pool = await poolPromise;

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const search = filters.search ? `%${filters.search.trim()}%` : null;

  const result = await pool
    .request()
    .input('ClassId', sql.Int, classId)
    .input('Search', sql.NVarChar(200), search)
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit)
    .query(`
      SELECT
        scm.Id AS MemberId,
        u.Id AS StudentId,
        u.FullName,
        u.Email,
        u.UserCode,
        u.Phone,
        u.Department,
        u.ClassName,
        scm.CreatedAt AS JoinedAt
      FROM StudentClassMembers scm
      INNER JOIN Users u 
        ON scm.StudentId = u.Id
      WHERE scm.ClassId = @ClassId
        AND scm.DeletedAt IS NULL
        AND u.DeletedAt IS NULL
        AND (
          @Search IS NULL
          OR u.FullName LIKE @Search
          OR u.Email LIKE @Search
          OR u.UserCode LIKE @Search
          OR u.Phone LIKE @Search
        )
      ORDER BY scm.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countClassStudents(classId, filters = {}) {
  const pool = await poolPromise;

  const search = filters.search ? `%${filters.search.trim()}%` : null;

  const result = await pool
    .request()
    .input('ClassId', sql.Int, classId)
    .input('Search', sql.NVarChar(200), search)
    .query(`
      SELECT COUNT(*) AS Total
      FROM StudentClassMembers scm
      INNER JOIN Users u 
        ON scm.StudentId = u.Id
      WHERE scm.ClassId = @ClassId
        AND scm.DeletedAt IS NULL
        AND u.DeletedAt IS NULL
        AND (
          @Search IS NULL
          OR u.FullName LIKE @Search
          OR u.Email LIKE @Search
          OR u.UserCode LIKE @Search
          OR u.Phone LIKE @Search
        )
    `);

  return result.recordset[0].Total;
}

export async function removeStudentFromClass(classId, studentId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ClassId', sql.Int, classId)
    .input('StudentId', sql.Int, studentId)
    .query(`
      UPDATE StudentClassMembers
      SET DeletedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ClassId,
        INSERTED.StudentId,
        INSERTED.DeletedAt
      WHERE ClassId = @ClassId
        AND StudentId = @StudentId
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function getClassStats() {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      COUNT(*) AS TotalClasses,
      SUM(CASE WHEN IsActive = 1 AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalActiveClasses,
      SUM(CASE WHEN IsActive = 0 AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalInactiveClasses,
      SUM(CASE WHEN DeletedAt IS NOT NULL THEN 1 ELSE 0 END) AS TotalDeletedClasses
    FROM Classes
  `);

  return result.recordset[0];
}
