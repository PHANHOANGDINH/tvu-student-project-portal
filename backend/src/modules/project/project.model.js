// src/modules/project/project.model.js
import { sql, poolPromise } from '../../config/db.js';

export const PROJECT_STATUSES = ['Draft', 'Pending', 'Approved', 'Rejected', 'Closed'];
export const REGISTRATION_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

function addProjectFilters(request, filters = {}) {
  const search = filters.search ? `%${filters.search.trim()}%` : null;
  const status = filters.status || null;
  const teacherId = filters.teacherId ? Number(filters.teacherId) : null;
  const classId = filters.classId ? Number(filters.classId) : null;
  const onlyActive = filters.onlyActive === true;

  request.input('Search', sql.NVarChar(300), search);
  request.input('Status', sql.NVarChar(30), status);
  request.input('TeacherId', sql.Int, teacherId);
  request.input('ClassId', sql.Int, classId);
  request.input('OnlyActive', sql.Bit, onlyActive);

  return `
    WHERE
      (
        @Search IS NULL
        OR p.Title LIKE @Search
        OR p.Description LIKE @Search
        OR p.Requirements LIKE @Search
        OR t.FullName LIKE @Search
        OR c.ClassCode LIKE @Search
        OR c.ClassName LIKE @Search
      )
      AND (@Status IS NULL OR p.Status = @Status)
      AND (@TeacherId IS NULL OR p.TeacherId = @TeacherId)
      AND (@ClassId IS NULL OR p.ClassId = @ClassId)
      AND (
        @OnlyActive = 0
        OR (p.DeletedAt IS NULL AND p.IsActive = 1)
      )
  `;
}

export async function getProjects(filters = {}) {
  const pool = await poolPromise;

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;

  const request = pool.request();
  const whereClause = addProjectFilters(request, filters);

  request.input('Offset', sql.Int, offset);
  request.input('Limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
      p.Id,
      p.Title,
      p.Description,
      p.Requirements,
      p.ExpectedOutcome,
      p.TeacherId,
      t.FullName AS TeacherName,
      t.Email AS TeacherEmail,
      p.ClassId,
      c.ClassCode,
      c.ClassName,
      p.MaxStudents,
      p.Status,
      p.RejectReason,
      p.IsActive,
      p.CreatedAt,
      p.UpdatedAt,
      p.DeletedAt,
      COUNT(CASE WHEN pr.Status = 'Approved' AND pr.DeletedAt IS NULL THEN 1 END) AS ApprovedStudents,
      COUNT(CASE WHEN pr.Status = 'Pending' AND pr.DeletedAt IS NULL THEN 1 END) AS PendingRegistrations
    FROM Projects p
    INNER JOIN Users t
      ON p.TeacherId = t.Id
    LEFT JOIN Classes c
      ON p.ClassId = c.Id
    LEFT JOIN ProjectRegistrations pr
      ON p.Id = pr.ProjectId
    ${whereClause}
    GROUP BY
      p.Id,
      p.Title,
      p.Description,
      p.Requirements,
      p.ExpectedOutcome,
      p.TeacherId,
      t.FullName,
      t.Email,
      p.ClassId,
      c.ClassCode,
      c.ClassName,
      p.MaxStudents,
      p.Status,
      p.RejectReason,
      p.IsActive,
      p.CreatedAt,
      p.UpdatedAt,
      p.DeletedAt
    ORDER BY p.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
  `);

  return result.recordset;
}

export async function countProjects(filters = {}) {
  const pool = await poolPromise;

  const request = pool.request();
  const whereClause = addProjectFilters(request, filters);

  const result = await request.query(`
    SELECT COUNT(DISTINCT p.Id) AS Total
    FROM Projects p
    INNER JOIN Users t
      ON p.TeacherId = t.Id
    LEFT JOIN Classes c
      ON p.ClassId = c.Id
    ${whereClause}
  `);

  return result.recordset[0].Total;
}

export async function findProjectById(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      SELECT TOP 1
        p.Id,
        p.Title,
        p.Description,
        p.Requirements,
        p.ExpectedOutcome,
        p.TeacherId,
        t.FullName AS TeacherName,
        t.Email AS TeacherEmail,
        p.ClassId,
        c.ClassCode,
        c.ClassName,
        p.MaxStudents,
        p.Status,
        p.RejectReason,
        p.IsActive,
        p.CreatedAt,
        p.UpdatedAt,
        p.DeletedAt,
        (
          SELECT COUNT(*)
          FROM ProjectRegistrations pr
          WHERE pr.ProjectId = p.Id
            AND pr.Status = 'Approved'
            AND pr.DeletedAt IS NULL
        ) AS ApprovedStudents,
        (
          SELECT COUNT(*)
          FROM ProjectRegistrations pr
          WHERE pr.ProjectId = p.Id
            AND pr.Status = 'Pending'
            AND pr.DeletedAt IS NULL
        ) AS PendingRegistrations
      FROM Projects p
      INNER JOIN Users t
        ON p.TeacherId = t.Id
      LEFT JOIN Classes c
        ON p.ClassId = c.Id
      WHERE p.Id = @Id
    `);

  return result.recordset[0] || null;
}

export async function createProject(data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Title', sql.NVarChar(255), data.title)
    .input('Description', sql.NVarChar(sql.MAX), data.description || null)
    .input('Requirements', sql.NVarChar(sql.MAX), data.requirements || null)
    .input('ExpectedOutcome', sql.NVarChar(sql.MAX), data.expectedOutcome || null)
    .input('TeacherId', sql.Int, data.teacherId)
    .input('ClassId', sql.Int, data.classId || null)
    .input('MaxStudents', sql.Int, data.maxStudents || 1)
    .input('Status', sql.NVarChar(30), data.status || 'Pending')
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
      OUTPUT
        INSERTED.Id,
        INSERTED.Title,
        INSERTED.Description,
        INSERTED.Requirements,
        INSERTED.ExpectedOutcome,
        INSERTED.TeacherId,
        INSERTED.ClassId,
        INSERTED.MaxStudents,
        INSERTED.Status,
        INSERTED.IsActive,
        INSERTED.CreatedAt
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

  return result.recordset[0];
}

export async function updateProject(id, data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('Title', sql.NVarChar(255), data.title)
    .input('Description', sql.NVarChar(sql.MAX), data.description || null)
    .input('Requirements', sql.NVarChar(sql.MAX), data.requirements || null)
    .input('ExpectedOutcome', sql.NVarChar(sql.MAX), data.expectedOutcome || null)
    .input('ClassId', sql.Int, data.classId || null)
    .input('MaxStudents', sql.Int, data.maxStudents || 1)
    .query(`
      UPDATE Projects
      SET
        Title = @Title,
        Description = @Description,
        Requirements = @Requirements,
        ExpectedOutcome = @ExpectedOutcome,
        ClassId = @ClassId,
        MaxStudents = @MaxStudents,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.Title,
        INSERTED.Description,
        INSERTED.Requirements,
        INSERTED.ExpectedOutcome,
        INSERTED.TeacherId,
        INSERTED.ClassId,
        INSERTED.MaxStudents,
        INSERTED.Status,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function updateProjectStatus(id, status, rejectReason = null) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('Status', sql.NVarChar(30), status)
    .input('RejectReason', sql.NVarChar(sql.MAX), rejectReason)
    .query(`
      UPDATE Projects
      SET
        Status = @Status,
        RejectReason = @RejectReason,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.Title,
        INSERTED.Status,
        INSERTED.RejectReason,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function softDeleteProject(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      UPDATE Projects
      SET
        IsActive = 0,
        DeletedAt = SYSDATETIME(),
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.Title,
        INSERTED.Status,
        INSERTED.IsActive,
        INSERTED.DeletedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function findActiveClassById(classId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ClassId', sql.Int, classId)
    .query(`
      SELECT TOP 1
        Id,
        ClassCode,
        ClassName,
        IsActive,
        DeletedAt
      FROM Classes
      WHERE Id = @ClassId
        AND IsActive = 1
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function findStudentProjectRegistration(studentId, projectId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .input('ProjectId', sql.Int, projectId)
    .query(`
      SELECT TOP 1
        Id,
        ProjectId,
        StudentId,
        Status,
        CreatedAt,
        DeletedAt
      FROM ProjectRegistrations
      WHERE StudentId = @StudentId
        AND ProjectId = @ProjectId
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function findStudentActiveProject(studentId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .query(`
      SELECT TOP 1
        pr.Id,
        pr.ProjectId,
        p.Title,
        pr.StudentId,
        pr.Status
      FROM ProjectRegistrations pr
      INNER JOIN Projects p
        ON pr.ProjectId = p.Id
      WHERE pr.StudentId = @StudentId
        AND pr.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND pr.Status IN ('Pending', 'Approved')
    `);

  return result.recordset[0] || null;
}

export async function countApprovedRegistrations(projectId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ProjectId', sql.Int, projectId)
    .query(`
      SELECT COUNT(*) AS Total
      FROM ProjectRegistrations
      WHERE ProjectId = @ProjectId
        AND Status = 'Approved'
        AND DeletedAt IS NULL
    `);

  return result.recordset[0].Total;
}

export async function createProjectRegistration(data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ProjectId', sql.Int, data.projectId)
    .input('StudentId', sql.Int, data.studentId)
    .input('Note', sql.NVarChar(sql.MAX), data.note || null)
    .query(`
      INSERT INTO ProjectRegistrations (
        ProjectId,
        StudentId,
        Note
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Note,
        INSERTED.Status,
        INSERTED.CreatedAt
      VALUES (
        @ProjectId,
        @StudentId,
        @Note
      )
    `);

  return result.recordset[0];
}

export async function getProjectRegistrations(projectId, filters = {}) {
  const pool = await poolPromise;

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const status = filters.status || null;

  const result = await pool
    .request()
    .input('ProjectId', sql.Int, projectId)
    .input('Status', sql.NVarChar(30), status)
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit)
    .query(`
      SELECT
        pr.Id,
        pr.ProjectId,
        pr.StudentId,
        s.FullName AS StudentName,
        s.Email AS StudentEmail,
        s.UserCode AS StudentCode,
        s.ClassName,
        pr.Note,
        pr.Status,
        pr.ReviewNote,
        pr.ReviewedBy,
        reviewer.FullName AS ReviewerName,
        pr.ReviewedAt,
        pr.CreatedAt,
        pr.UpdatedAt,
        pr.DeletedAt
      FROM ProjectRegistrations pr
      INNER JOIN Users s
        ON pr.StudentId = s.Id
      LEFT JOIN Users reviewer
        ON pr.ReviewedBy = reviewer.Id
      WHERE pr.ProjectId = @ProjectId
        AND pr.DeletedAt IS NULL
        AND (@Status IS NULL OR pr.Status = @Status)
      ORDER BY pr.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countProjectRegistrations(projectId, filters = {}) {
  const pool = await poolPromise;

  const status = filters.status || null;

  const result = await pool
    .request()
    .input('ProjectId', sql.Int, projectId)
    .input('Status', sql.NVarChar(30), status)
    .query(`
      SELECT COUNT(*) AS Total
      FROM ProjectRegistrations
      WHERE ProjectId = @ProjectId
        AND DeletedAt IS NULL
        AND (@Status IS NULL OR Status = @Status)
    `);

  return result.recordset[0].Total;
}

export async function findProjectRegistrationById(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      SELECT TOP 1
        pr.Id,
        pr.ProjectId,
        p.Title AS ProjectTitle,
        p.TeacherId,
        pr.StudentId,
        s.FullName AS StudentName,
        s.Email AS StudentEmail,
        pr.Note,
        pr.Status,
        pr.ReviewNote,
        pr.ReviewedBy,
        pr.ReviewedAt,
        pr.CreatedAt,
        pr.UpdatedAt,
        pr.DeletedAt
      FROM ProjectRegistrations pr
      INNER JOIN Projects p
        ON pr.ProjectId = p.Id
      INNER JOIN Users s
        ON pr.StudentId = s.Id
      WHERE pr.Id = @Id
    `);

  return result.recordset[0] || null;
}

export async function updateRegistrationStatus(id, status, reviewNote, reviewedBy) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('Status', sql.NVarChar(30), status)
    .input('ReviewNote', sql.NVarChar(sql.MAX), reviewNote || null)
    .input('ReviewedBy', sql.Int, reviewedBy)
    .query(`
      UPDATE ProjectRegistrations
      SET
        Status = @Status,
        ReviewNote = @ReviewNote,
        ReviewedBy = @ReviewedBy,
        ReviewedAt = SYSDATETIME(),
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Status,
        INSERTED.ReviewNote,
        INSERTED.ReviewedBy,
        INSERTED.ReviewedAt,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function cancelRegistration(id, studentId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('StudentId', sql.Int, studentId)
    .query(`
      UPDATE ProjectRegistrations
      SET
        Status = 'Cancelled',
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Status,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND StudentId = @StudentId
        AND Status = 'Pending'
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function getStudentRegistrations(studentId, filters = {}) {
  const pool = await poolPromise;

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const status = filters.status || null;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .input('Status', sql.NVarChar(30), status)
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit)
    .query(`
      SELECT
        pr.Id,
        pr.ProjectId,
        p.Title,
        p.Description,
        p.TeacherId,
        t.FullName AS TeacherName,
        t.Email AS TeacherEmail,
        pr.Note,
        pr.Status,
        pr.ReviewNote,
        pr.ReviewedAt,
        pr.CreatedAt,
        pr.UpdatedAt
      FROM ProjectRegistrations pr
      INNER JOIN Projects p
        ON pr.ProjectId = p.Id
      INNER JOIN Users t
        ON p.TeacherId = t.Id
      WHERE pr.StudentId = @StudentId
        AND pr.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR pr.Status = @Status)
      ORDER BY pr.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countStudentRegistrations(studentId, filters = {}) {
  const pool = await poolPromise;

  const status = filters.status || null;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .input('Status', sql.NVarChar(30), status)
    .query(`
      SELECT COUNT(*) AS Total
      FROM ProjectRegistrations pr
      INNER JOIN Projects p
        ON pr.ProjectId = p.Id
      WHERE pr.StudentId = @StudentId
        AND pr.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR pr.Status = @Status)
    `);

  return result.recordset[0].Total;
}

export async function getProjectStats() {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      COUNT(*) AS TotalProjects,
      SUM(CASE WHEN Status = 'Draft' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalDraftProjects,
      SUM(CASE WHEN Status = 'Pending' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalPendingProjects,
      SUM(CASE WHEN Status = 'Approved' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalApprovedProjects,
      SUM(CASE WHEN Status = 'Rejected' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalRejectedProjects,
      SUM(CASE WHEN Status = 'Closed' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalClosedProjects,
      SUM(CASE WHEN DeletedAt IS NOT NULL THEN 1 ELSE 0 END) AS TotalDeletedProjects
    FROM Projects
  `);

  return result.recordset[0];
}

export async function getRegistrationStats() {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      COUNT(*) AS TotalRegistrations,
      SUM(CASE WHEN Status = 'Pending' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalPendingRegistrations,
      SUM(CASE WHEN Status = 'Approved' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalApprovedRegistrations,
      SUM(CASE WHEN Status = 'Rejected' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalRejectedRegistrations,
      SUM(CASE WHEN Status = 'Cancelled' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalCancelledRegistrations
    FROM ProjectRegistrations
  `);

  return result.recordset[0];
}