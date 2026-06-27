// src/modules/report/report.model.js
import { sql, poolPromise } from '../../config/db.js';

export async function findApprovedStudentProject(studentId, projectId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .input('ProjectId', sql.Int, projectId)
    .query(`
      SELECT TOP 1
        pr.Id AS RegistrationId,
        pr.ProjectId,
        p.Title AS ProjectTitle,
        p.TeacherId,
        pr.StudentId,
        pr.Status AS RegistrationStatus,
        p.Status AS ProjectStatus
      FROM ProjectRegistrations pr
      INNER JOIN Projects p
        ON pr.ProjectId = p.Id
      WHERE pr.StudentId = @StudentId
        AND pr.ProjectId = @ProjectId
        AND pr.Status = 'Approved'
        AND pr.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND p.IsActive = 1
        AND p.Status = 'Approved'
    `);

  return result.recordset[0] || null;
}

export async function createProgressReport(data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ProjectId', sql.Int, data.projectId)
    .input('StudentId', sql.Int, data.studentId)
    .input('Title', sql.NVarChar(255), data.title)
    .input('Content', sql.NVarChar(sql.MAX), data.content || null)
    .input('ProgressPercent', sql.Decimal(5, 2), data.progressPercent)
    .input('ReportDate', sql.Date, data.reportDate || null)
    .input('FileUrl', sql.NVarChar(500), data.fileUrl || null)
    .query(`
      INSERT INTO ProjectProgressReports (
        ProjectId,
        StudentId,
        Title,
        Content,
        ProgressPercent,
        ReportDate,
        FileUrl
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Title,
        INSERTED.Content,
        INSERTED.ProgressPercent,
        INSERTED.ReportDate,
        INSERTED.FileUrl,
        INSERTED.Status,
        INSERTED.CreatedAt
      VALUES (
        @ProjectId,
        @StudentId,
        @Title,
        @Content,
        @ProgressPercent,
        ISNULL(@ReportDate, CAST(GETDATE() AS DATE)),
        @FileUrl
      )
    `);

  return result.recordset[0];
}

export async function getStudentProgressReports(studentId, filters = {}) {
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
        r.Id,
        r.ProjectId,
        p.Title AS ProjectTitle,
        r.StudentId,
        r.Title,
        r.Content,
        r.ProgressPercent,
        r.ReportDate,
        r.FileUrl,
        r.Status,
        r.TeacherComment,
        r.TeacherScore,
        r.ReviewedBy,
        reviewer.FullName AS ReviewerName,
        r.ReviewedAt,
        r.CreatedAt,
        r.UpdatedAt
      FROM ProjectProgressReports r
      INNER JOIN Projects p
        ON r.ProjectId = p.Id
      LEFT JOIN Users reviewer
        ON r.ReviewedBy = reviewer.Id
      WHERE r.StudentId = @StudentId
        AND r.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR r.Status = @Status)
      ORDER BY r.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countStudentProgressReports(studentId, filters = {}) {
  const pool = await poolPromise;

  const status = filters.status || null;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .input('Status', sql.NVarChar(30), status)
    .query(`
      SELECT COUNT(*) AS Total
      FROM ProjectProgressReports r
      INNER JOIN Projects p
        ON r.ProjectId = p.Id
      WHERE r.StudentId = @StudentId
        AND r.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR r.Status = @Status)
    `);

  return result.recordset[0].Total;
}

export async function findProgressReportById(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      SELECT TOP 1
        r.Id,
        r.ProjectId,
        p.Title AS ProjectTitle,
        p.TeacherId,
        teacher.FullName AS TeacherName,
        r.StudentId,
        student.FullName AS StudentName,
        student.Email AS StudentEmail,
        student.UserCode AS StudentCode,
        r.Title,
        r.Content,
        r.ProgressPercent,
        r.ReportDate,
        r.FileUrl,
        r.Status,
        r.TeacherComment,
        r.TeacherScore,
        r.ReviewedBy,
        reviewer.FullName AS ReviewerName,
        r.ReviewedAt,
        r.CreatedAt,
        r.UpdatedAt,
        r.DeletedAt
      FROM ProjectProgressReports r
      INNER JOIN Projects p
        ON r.ProjectId = p.Id
      INNER JOIN Users teacher
        ON p.TeacherId = teacher.Id
      INNER JOIN Users student
        ON r.StudentId = student.Id
      LEFT JOIN Users reviewer
        ON r.ReviewedBy = reviewer.Id
      WHERE r.Id = @Id
    `);

  return result.recordset[0] || null;
}

export async function updateProgressReport(id, studentId, data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('StudentId', sql.Int, studentId)
    .input('Title', sql.NVarChar(255), data.title)
    .input('Content', sql.NVarChar(sql.MAX), data.content || null)
    .input('ProgressPercent', sql.Decimal(5, 2), data.progressPercent)
    .input('ReportDate', sql.Date, data.reportDate || null)
    .input('FileUrl', sql.NVarChar(500), data.fileUrl || null)
    .query(`
      UPDATE ProjectProgressReports
      SET
        Title = @Title,
        Content = @Content,
        ProgressPercent = @ProgressPercent,
        ReportDate = ISNULL(@ReportDate, ReportDate),
        FileUrl = @FileUrl,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Title,
        INSERTED.Content,
        INSERTED.ProgressPercent,
        INSERTED.ReportDate,
        INSERTED.FileUrl,
        INSERTED.Status,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND StudentId = @StudentId
        AND Status = 'Submitted'
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function softDeleteProgressReport(id, studentId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('StudentId', sql.Int, studentId)
    .query(`
      UPDATE ProjectProgressReports
      SET
        DeletedAt = SYSDATETIME(),
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Title,
        INSERTED.DeletedAt
      WHERE Id = @Id
        AND StudentId = @StudentId
        AND Status = 'Submitted'
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function getTeacherProgressReports(teacherId, filters = {}) {
  const pool = await poolPromise;

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const status = filters.status || null;
  const search = filters.search ? `%${filters.search.trim()}%` : null;

  const result = await pool
    .request()
    .input('TeacherId', sql.Int, teacherId)
    .input('Status', sql.NVarChar(30), status)
    .input('Search', sql.NVarChar(300), search)
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit)
    .query(`
      SELECT
        r.Id,
        r.ProjectId,
        p.Title AS ProjectTitle,
        r.StudentId,
        student.FullName AS StudentName,
        student.Email AS StudentEmail,
        student.UserCode AS StudentCode,
        r.Title,
        r.ProgressPercent,
        r.ReportDate,
        r.FileUrl,
        r.Status,
        r.TeacherComment,
        r.TeacherScore,
        r.ReviewedAt,
        r.CreatedAt,
        r.UpdatedAt
      FROM ProjectProgressReports r
      INNER JOIN Projects p
        ON r.ProjectId = p.Id
      INNER JOIN Users student
        ON r.StudentId = student.Id
      WHERE p.TeacherId = @TeacherId
        AND r.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR r.Status = @Status)
        AND (
          @Search IS NULL
          OR r.Title LIKE @Search
          OR r.Content LIKE @Search
          OR p.Title LIKE @Search
          OR student.FullName LIKE @Search
          OR student.Email LIKE @Search
          OR student.UserCode LIKE @Search
        )
      ORDER BY r.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countTeacherProgressReports(teacherId, filters = {}) {
  const pool = await poolPromise;

  const status = filters.status || null;
  const search = filters.search ? `%${filters.search.trim()}%` : null;

  const result = await pool
    .request()
    .input('TeacherId', sql.Int, teacherId)
    .input('Status', sql.NVarChar(30), status)
    .input('Search', sql.NVarChar(300), search)
    .query(`
      SELECT COUNT(*) AS Total
      FROM ProjectProgressReports r
      INNER JOIN Projects p
        ON r.ProjectId = p.Id
      INNER JOIN Users student
        ON r.StudentId = student.Id
      WHERE p.TeacherId = @TeacherId
        AND r.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR r.Status = @Status)
        AND (
          @Search IS NULL
          OR r.Title LIKE @Search
          OR r.Content LIKE @Search
          OR p.Title LIKE @Search
          OR student.FullName LIKE @Search
          OR student.Email LIKE @Search
          OR student.UserCode LIKE @Search
        )
    `);

  return result.recordset[0].Total;
}

export async function reviewProgressReport(id, teacherId, data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('TeacherId', sql.Int, teacherId)
    .input('TeacherComment', sql.NVarChar(sql.MAX), data.teacherComment || null)
    .input('TeacherScore', sql.Decimal(4, 2), data.teacherScore)
    .query(`
      UPDATE r
      SET
        r.Status = 'Reviewed',
        r.TeacherComment = @TeacherComment,
        r.TeacherScore = @TeacherScore,
        r.ReviewedBy = @TeacherId,
        r.ReviewedAt = SYSDATETIME(),
        r.UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Title,
        INSERTED.Status,
        INSERTED.TeacherComment,
        INSERTED.TeacherScore,
        INSERTED.ReviewedBy,
        INSERTED.ReviewedAt,
        INSERTED.UpdatedAt
      FROM ProjectProgressReports r
      INNER JOIN Projects p
        ON r.ProjectId = p.Id
      WHERE r.Id = @Id
        AND p.TeacherId = @TeacherId
        AND r.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function findFinalSubmissionByProjectStudent(projectId, studentId) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ProjectId', sql.Int, projectId)
    .input('StudentId', sql.Int, studentId)
    .query(`
      SELECT TOP 1
        Id,
        ProjectId,
        StudentId,
        Status,
        DeletedAt
      FROM FinalSubmissions
      WHERE ProjectId = @ProjectId
        AND StudentId = @StudentId
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function createFinalSubmission(data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('ProjectId', sql.Int, data.projectId)
    .input('StudentId', sql.Int, data.studentId)
    .input('Title', sql.NVarChar(255), data.title)
    .input('Description', sql.NVarChar(sql.MAX), data.description || null)
    .input('ReportFileUrl', sql.NVarChar(500), data.reportFileUrl || null)
    .input('GithubUrl', sql.NVarChar(500), data.githubUrl || null)
    .input('DemoUrl', sql.NVarChar(500), data.demoUrl || null)
    .query(`
      INSERT INTO FinalSubmissions (
        ProjectId,
        StudentId,
        Title,
        Description,
        ReportFileUrl,
        GithubUrl,
        DemoUrl
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Title,
        INSERTED.Description,
        INSERTED.ReportFileUrl,
        INSERTED.GithubUrl,
        INSERTED.DemoUrl,
        INSERTED.Status,
        INSERTED.SubmittedAt
      VALUES (
        @ProjectId,
        @StudentId,
        @Title,
        @Description,
        @ReportFileUrl,
        @GithubUrl,
        @DemoUrl
      )
    `);

  return result.recordset[0];
}

export async function getStudentFinalSubmissions(studentId, filters = {}) {
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
        fs.Id,
        fs.ProjectId,
        p.Title AS ProjectTitle,
        fs.StudentId,
        fs.Title,
        fs.Description,
        fs.ReportFileUrl,
        fs.GithubUrl,
        fs.DemoUrl,
        fs.Status,
        fs.TeacherComment,
        fs.TeacherScore,
        fs.ReviewedBy,
        reviewer.FullName AS ReviewerName,
        fs.ReviewedAt,
        fs.SubmittedAt,
        fs.UpdatedAt
      FROM FinalSubmissions fs
      INNER JOIN Projects p
        ON fs.ProjectId = p.Id
      LEFT JOIN Users reviewer
        ON fs.ReviewedBy = reviewer.Id
      WHERE fs.StudentId = @StudentId
        AND fs.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR fs.Status = @Status)
      ORDER BY fs.SubmittedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countStudentFinalSubmissions(studentId, filters = {}) {
  const pool = await poolPromise;

  const status = filters.status || null;

  const result = await pool
    .request()
    .input('StudentId', sql.Int, studentId)
    .input('Status', sql.NVarChar(30), status)
    .query(`
      SELECT COUNT(*) AS Total
      FROM FinalSubmissions fs
      INNER JOIN Projects p
        ON fs.ProjectId = p.Id
      WHERE fs.StudentId = @StudentId
        AND fs.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR fs.Status = @Status)
    `);

  return result.recordset[0].Total;
}

export async function findFinalSubmissionById(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      SELECT TOP 1
        fs.Id,
        fs.ProjectId,
        p.Title AS ProjectTitle,
        p.TeacherId,
        teacher.FullName AS TeacherName,
        fs.StudentId,
        student.FullName AS StudentName,
        student.Email AS StudentEmail,
        student.UserCode AS StudentCode,
        fs.Title,
        fs.Description,
        fs.ReportFileUrl,
        fs.GithubUrl,
        fs.DemoUrl,
        fs.Status,
        fs.TeacherComment,
        fs.TeacherScore,
        fs.ReviewedBy,
        reviewer.FullName AS ReviewerName,
        fs.ReviewedAt,
        fs.SubmittedAt,
        fs.UpdatedAt,
        fs.DeletedAt
      FROM FinalSubmissions fs
      INNER JOIN Projects p
        ON fs.ProjectId = p.Id
      INNER JOIN Users teacher
        ON p.TeacherId = teacher.Id
      INNER JOIN Users student
        ON fs.StudentId = student.Id
      LEFT JOIN Users reviewer
        ON fs.ReviewedBy = reviewer.Id
      WHERE fs.Id = @Id
    `);

  return result.recordset[0] || null;
}

export async function updateFinalSubmission(id, studentId, data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('StudentId', sql.Int, studentId)
    .input('Title', sql.NVarChar(255), data.title)
    .input('Description', sql.NVarChar(sql.MAX), data.description || null)
    .input('ReportFileUrl', sql.NVarChar(500), data.reportFileUrl || null)
    .input('GithubUrl', sql.NVarChar(500), data.githubUrl || null)
    .input('DemoUrl', sql.NVarChar(500), data.demoUrl || null)
    .query(`
      UPDATE FinalSubmissions
      SET
        Title = @Title,
        Description = @Description,
        ReportFileUrl = @ReportFileUrl,
        GithubUrl = @GithubUrl,
        DemoUrl = @DemoUrl,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Title,
        INSERTED.Description,
        INSERTED.ReportFileUrl,
        INSERTED.GithubUrl,
        INSERTED.DemoUrl,
        INSERTED.Status,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND StudentId = @StudentId
        AND Status = 'Submitted'
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function getTeacherFinalSubmissions(teacherId, filters = {}) {
  const pool = await poolPromise;

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const status = filters.status || null;
  const search = filters.search ? `%${filters.search.trim()}%` : null;

  const result = await pool
    .request()
    .input('TeacherId', sql.Int, teacherId)
    .input('Status', sql.NVarChar(30), status)
    .input('Search', sql.NVarChar(300), search)
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit)
    .query(`
      SELECT
        fs.Id,
        fs.ProjectId,
        p.Title AS ProjectTitle,
        fs.StudentId,
        student.FullName AS StudentName,
        student.Email AS StudentEmail,
        student.UserCode AS StudentCode,
        fs.Title,
        fs.ReportFileUrl,
        fs.GithubUrl,
        fs.DemoUrl,
        fs.Status,
        fs.TeacherComment,
        fs.TeacherScore,
        fs.ReviewedAt,
        fs.SubmittedAt,
        fs.UpdatedAt
      FROM FinalSubmissions fs
      INNER JOIN Projects p
        ON fs.ProjectId = p.Id
      INNER JOIN Users student
        ON fs.StudentId = student.Id
      WHERE p.TeacherId = @TeacherId
        AND fs.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR fs.Status = @Status)
        AND (
          @Search IS NULL
          OR fs.Title LIKE @Search
          OR fs.Description LIKE @Search
          OR p.Title LIKE @Search
          OR student.FullName LIKE @Search
          OR student.Email LIKE @Search
          OR student.UserCode LIKE @Search
        )
      ORDER BY fs.SubmittedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countTeacherFinalSubmissions(teacherId, filters = {}) {
  const pool = await poolPromise;

  const status = filters.status || null;
  const search = filters.search ? `%${filters.search.trim()}%` : null;

  const result = await pool
    .request()
    .input('TeacherId', sql.Int, teacherId)
    .input('Status', sql.NVarChar(30), status)
    .input('Search', sql.NVarChar(300), search)
    .query(`
      SELECT COUNT(*) AS Total
      FROM FinalSubmissions fs
      INNER JOIN Projects p
        ON fs.ProjectId = p.Id
      INNER JOIN Users student
        ON fs.StudentId = student.Id
      WHERE p.TeacherId = @TeacherId
        AND fs.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
        AND (@Status IS NULL OR fs.Status = @Status)
        AND (
          @Search IS NULL
          OR fs.Title LIKE @Search
          OR fs.Description LIKE @Search
          OR p.Title LIKE @Search
          OR student.FullName LIKE @Search
          OR student.Email LIKE @Search
          OR student.UserCode LIKE @Search
        )
    `);

  return result.recordset[0].Total;
}

export async function reviewFinalSubmission(id, teacherId, data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('TeacherId', sql.Int, teacherId)
    .input('TeacherComment', sql.NVarChar(sql.MAX), data.teacherComment || null)
    .input('TeacherScore', sql.Decimal(4, 2), data.teacherScore)
    .query(`
      UPDATE fs
      SET
        fs.Status = 'Reviewed',
        fs.TeacherComment = @TeacherComment,
        fs.TeacherScore = @TeacherScore,
        fs.ReviewedBy = @TeacherId,
        fs.ReviewedAt = SYSDATETIME(),
        fs.UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.ProjectId,
        INSERTED.StudentId,
        INSERTED.Title,
        INSERTED.Status,
        INSERTED.TeacherComment,
        INSERTED.TeacherScore,
        INSERTED.ReviewedBy,
        INSERTED.ReviewedAt,
        INSERTED.UpdatedAt
      FROM FinalSubmissions fs
      INNER JOIN Projects p
        ON fs.ProjectId = p.Id
      WHERE fs.Id = @Id
        AND p.TeacherId = @TeacherId
        AND fs.DeletedAt IS NULL
        AND p.DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function getReportStats() {
  const pool = await poolPromise;

  const progressResult = await pool.request().query(`
    SELECT
      COUNT(*) AS TotalProgressReports,
      SUM(CASE WHEN Status = 'Submitted' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalSubmittedProgressReports,
      SUM(CASE WHEN Status = 'Reviewed' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalReviewedProgressReports
    FROM ProjectProgressReports
  `);

  const finalResult = await pool.request().query(`
    SELECT
      COUNT(*) AS TotalFinalSubmissions,
      SUM(CASE WHEN Status = 'Submitted' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalSubmittedFinalSubmissions,
      SUM(CASE WHEN Status = 'Reviewed' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalReviewedFinalSubmissions
    FROM FinalSubmissions
  `);

  return {
    progressReports: progressResult.recordset[0],
    finalSubmissions: finalResult.recordset[0],
  };
}