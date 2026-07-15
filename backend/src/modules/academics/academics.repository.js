import { poolPromise, sql } from '../../config/db.js';
import { USER_ROLES } from '../../constants/roles.js';

const ENTITY_CONFIG = {
  academicYears: {
    table: 'AcademicYears',
    alias: 'ay',
    sort: { name: 'ay.Name', startDate: 'ay.StartDate', status: 'ay.IsActive', createdAt: 'ay.CreatedAt' },
    select: 'ay.Id, ay.Name, ay.StartDate, ay.EndDate, ay.IsActive, ay.CreatedAt, ay.UpdatedAt',
  },
  semesters: {
    table: 'Semesters',
    alias: 's',
    sort: { name: 's.Name', code: 's.Code', startDate: 's.StartDate', status: 's.IsActive', createdAt: 's.CreatedAt' },
    select: 's.Id, s.AcademicYearId, s.Name, s.Code, s.StartDate, s.EndDate, s.IsActive, s.CreatedAt, s.UpdatedAt, ay.Name AS AcademicYearName',
    join: 'LEFT JOIN AcademicYears ay ON ay.Id = s.AcademicYearId',
  },
  subjects: {
    table: 'Subjects',
    alias: 'sub',
    sort: { code: 'sub.Code', name: 'sub.Name', credits: 'sub.Credits', status: 'sub.IsActive', createdAt: 'sub.CreatedAt' },
    select: 'sub.Id, sub.Code, sub.Name, sub.Credits, sub.Description, sub.IsActive, sub.CreatedAt, sub.UpdatedAt',
  },
};

function orderBy(config, sortBy = 'createdAt', sortOrder = 'desc') {
  const column = config.sort[sortBy] || config.sort.createdAt;
  const direction = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `${column} ${direction}`;
}

function addCommonFilters(request, alias, filters = {}) {
  request.input('Search', sql.NVarChar(200), filters.search ? `%${filters.search}%` : null);
  request.input('Status', sql.NVarChar(20), filters.status || null);

  return `
    ${alias}.DeletedAt IS NULL
    AND (
      @Search IS NULL
      OR ${alias}.Name LIKE @Search
      ${alias === 'ay' ? '' : `OR ${alias}.Code LIKE @Search`}
    )
    AND (
      @Status IS NULL
      OR (@Status = 'ACTIVE' AND ${alias}.IsActive = 1)
      OR (@Status = 'INACTIVE' AND ${alias}.IsActive = 0)
    )
  `;
}

export function mapAcademicYear(row) {
  if (!row) return null;
  return {
    id: row.Id,
    name: row.Name,
    startDate: row.StartDate,
    endDate: row.EndDate,
    isActive: row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export function mapSemester(row) {
  if (!row) return null;
  return {
    id: row.Id,
    academicYearId: row.AcademicYearId,
    academicYearName: row.AcademicYearName,
    name: row.Name,
    code: row.Code,
    startDate: row.StartDate,
    endDate: row.EndDate,
    isActive: row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export function mapSubject(row) {
  if (!row) return null;
  return {
    id: row.Id,
    code: row.Code,
    name: row.Name,
    credits: row.Credits,
    description: row.Description,
    isActive: row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export function mapCourseClass(row) {
  if (!row) return null;
  return {
    id: row.Id,
    code: row.Code,
    subjectId: row.SubjectId,
    subjectCode: row.SubjectCode,
    subjectName: row.SubjectName,
    semesterId: row.SemesterId,
    semesterName: row.SemesterName,
    academicYearName: row.AcademicYearName,
    lecturerId: row.LecturerId,
    lecturerName: row.LecturerName,
    maxStudents: row.MaxStudents,
    studentCount: Number(row.StudentCount || 0),
    status: row.Status,
    isActive: row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export function mapStudent(row) {
  if (!row) return null;
  return {
    id: row.Id,
    fullName: row.FullName,
    email: row.Email,
    userCode: row.UserCode,
    className: row.ClassName,
    department: row.Department,
    enrolledAt: row.EnrolledAt,
  };
}

export async function listEntity(entity, filters = {}) {
  const config = ENTITY_CONFIG[entity];
  const pool = await poolPromise;
  const request = pool.request();
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const pageSize = Number(filters.pageSize) > 0 ? Number(filters.pageSize) : 10;
  const offset = (page - 1) * pageSize;
  const extra = [];

  request.input('Offset', sql.Int, offset);
  request.input('PageSize', sql.Int, pageSize);

  if (entity === 'semesters' && filters.academicYearId) {
    request.input('AcademicYearId', sql.Int, Number(filters.academicYearId));
    extra.push('s.AcademicYearId = @AcademicYearId');
  }

  const where = [addCommonFilters(request, config.alias, filters), ...extra].join(' AND ');
  const join = config.join || '';

  const items = await request.query(`
      SELECT ${config.select}
      FROM ${config.table} ${config.alias}
      ${join}
      WHERE ${where}
      ORDER BY ${orderBy(config, filters.sortBy, filters.sortOrder)}
      OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
    `);

  const countRequest = pool.request();
  const countExtra = [];
  if (entity === 'semesters' && filters.academicYearId) {
    countRequest.input('AcademicYearId', sql.Int, Number(filters.academicYearId));
    countExtra.push('s.AcademicYearId = @AcademicYearId');
  }
  const countWhere = [addCommonFilters(countRequest, config.alias, filters), ...countExtra].join(' AND ');
  const total = await countRequest.query(`
    SELECT COUNT(*) AS Total
    FROM ${config.table} ${config.alias}
    WHERE ${countWhere}
  `);

  const mapper = entity === 'academicYears' ? mapAcademicYear : entity === 'semesters' ? mapSemester : mapSubject;
  return {
    items: items.recordset.map(mapper),
    pagination: { page, pageSize, total: Number(total.recordset[0]?.Total || 0) },
  };
}

export async function findEntityById(entity, id) {
  const config = ENTITY_CONFIG[entity];
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .query(`
      SELECT ${config.select}
      FROM ${config.table} ${config.alias}
      ${config.join || ''}
      WHERE ${config.alias}.Id = @Id AND ${config.alias}.DeletedAt IS NULL
    `);
  const mapper = entity === 'academicYears' ? mapAcademicYear : entity === 'semesters' ? mapSemester : mapSubject;
  return mapper(result.recordset[0]);
}

export async function createAcademicYear(data) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Name', sql.NVarChar(50), data.name)
    .input('StartDate', sql.Date, data.startDate)
    .input('EndDate', sql.Date, data.endDate)
    .query(`
      INSERT INTO AcademicYears (Name, StartDate, EndDate)
      OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.StartDate, INSERTED.EndDate, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      VALUES (@Name, @StartDate, @EndDate)
    `);
  return mapAcademicYear(result.recordset[0]);
}

export async function updateAcademicYear(id, data) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .input('Name', sql.NVarChar(50), data.name)
    .input('StartDate', sql.Date, data.startDate)
    .input('EndDate', sql.Date, data.endDate)
    .query(`
      UPDATE AcademicYears
      SET Name = @Name, StartDate = @StartDate, EndDate = @EndDate, UpdatedAt = SYSDATETIME()
      OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.StartDate, INSERTED.EndDate, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      WHERE Id = @Id AND DeletedAt IS NULL
    `);
  return mapAcademicYear(result.recordset[0]);
}

export async function createSemester(data) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('AcademicYearId', sql.Int, data.academicYearId)
    .input('Name', sql.NVarChar(100), data.name)
    .input('Code', sql.NVarChar(30), data.code)
    .input('StartDate', sql.Date, data.startDate)
    .input('EndDate', sql.Date, data.endDate)
    .query(`
      INSERT INTO Semesters (AcademicYearId, Name, Code, StartDate, EndDate)
      OUTPUT INSERTED.Id
      VALUES (@AcademicYearId, @Name, @Code, @StartDate, @EndDate)
    `);
  return findEntityById('semesters', result.recordset[0].Id);
}

export async function updateSemester(id, data) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .input('AcademicYearId', sql.Int, data.academicYearId)
    .input('Name', sql.NVarChar(100), data.name)
    .input('Code', sql.NVarChar(30), data.code)
    .input('StartDate', sql.Date, data.startDate)
    .input('EndDate', sql.Date, data.endDate)
    .query(`
      UPDATE Semesters
      SET AcademicYearId = @AcademicYearId, Name = @Name, Code = @Code, StartDate = @StartDate, EndDate = @EndDate, UpdatedAt = SYSDATETIME()
      OUTPUT INSERTED.Id
      WHERE Id = @Id AND DeletedAt IS NULL
    `);
  return result.recordset[0] ? findEntityById('semesters', id) : null;
}

export async function createSubject(data) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Code', sql.NVarChar(50), data.code)
    .input('Name', sql.NVarChar(200), data.name)
    .input('Credits', sql.Int, data.credits)
    .input('Description', sql.NVarChar(sql.MAX), data.description || null)
    .query(`
      INSERT INTO Subjects (Code, Name, Credits, Description)
      OUTPUT INSERTED.Id, INSERTED.Code, INSERTED.Name, INSERTED.Credits, INSERTED.Description, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      VALUES (@Code, @Name, @Credits, @Description)
    `);
  return mapSubject(result.recordset[0]);
}

export async function updateSubject(id, data) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .input('Code', sql.NVarChar(50), data.code)
    .input('Name', sql.NVarChar(200), data.name)
    .input('Credits', sql.Int, data.credits)
    .input('Description', sql.NVarChar(sql.MAX), data.description || null)
    .query(`
      UPDATE Subjects
      SET Code = @Code, Name = @Name, Credits = @Credits, Description = @Description, UpdatedAt = SYSDATETIME()
      OUTPUT INSERTED.Id, INSERTED.Code, INSERTED.Name, INSERTED.Credits, INSERTED.Description, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      WHERE Id = @Id AND DeletedAt IS NULL
    `);
  return mapSubject(result.recordset[0]);
}

export async function updateEntityStatus(entity, id, isActive) {
  const config = ENTITY_CONFIG[entity];
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .input('IsActive', sql.Bit, Boolean(isActive))
    .query(`
      UPDATE ${config.table}
      SET IsActive = @IsActive, UpdatedAt = SYSDATETIME()
      WHERE Id = @Id AND DeletedAt IS NULL
    `);
  return result.rowsAffected[0] > 0 ? findEntityById(entity, id) : null;
}

function courseClassBaseWhere(request, filters = {}) {
  request.input('Search', sql.NVarChar(200), filters.search ? `%${filters.search}%` : null);
  request.input('Status', sql.NVarChar(20), filters.status || null);
  request.input('SubjectId', sql.Int, filters.subjectId ? Number(filters.subjectId) : null);
  request.input('SemesterId', sql.Int, filters.semesterId ? Number(filters.semesterId) : null);
  request.input('LecturerId', sql.Int, filters.lecturerId ? Number(filters.lecturerId) : null);

  return `
    cc.DeletedAt IS NULL
    AND (@Search IS NULL OR cc.Code LIKE @Search OR sub.Code LIKE @Search OR sub.Name LIKE @Search OR u.FullName LIKE @Search)
    AND (@Status IS NULL OR cc.Status = @Status OR (@Status = 'ACTIVE' AND cc.IsActive = 1) OR (@Status = 'INACTIVE' AND cc.IsActive = 0))
    AND (@SubjectId IS NULL OR cc.SubjectId = @SubjectId)
    AND (@SemesterId IS NULL OR cc.SemesterId = @SemesterId)
    AND (@LecturerId IS NULL OR cc.LecturerId = @LecturerId)
  `;
}

function studentCourseClassBaseWhere(request, studentId, filters = {}) {
  request.input('StudentId', sql.Int, Number(studentId));
  return `${courseClassBaseWhere(request, filters)}
    AND sce.StudentId = @StudentId
    AND sce.DeletedAt IS NULL
    AND sce.IsActive = 1
  `;
}
const COURSE_CLASS_SELECT = `
  cc.Id, cc.Code, cc.SubjectId, sub.Code AS SubjectCode, sub.Name AS SubjectName,
  cc.SemesterId, sem.Name AS SemesterName, ay.Name AS AcademicYearName,
  cc.LecturerId, u.FullName AS LecturerName, cc.MaxStudents, cc.Status, cc.IsActive,
  cc.CreatedAt, cc.UpdatedAt,
  COUNT(CASE WHEN e.DeletedAt IS NULL AND e.IsActive = 1 THEN e.Id END) AS StudentCount
`;

const COURSE_CLASS_JOIN = `
  JOIN Subjects sub ON sub.Id = cc.SubjectId
  JOIN Semesters sem ON sem.Id = cc.SemesterId
  JOIN AcademicYears ay ON ay.Id = sem.AcademicYearId
  LEFT JOIN Users u ON u.Id = cc.LecturerId
  LEFT JOIN CourseClassEnrollments e ON e.CourseClassId = cc.Id
`;

const COURSE_CLASS_GROUP = `
  cc.Id, cc.Code, cc.SubjectId, sub.Code, sub.Name, cc.SemesterId, sem.Name, ay.Name,
  cc.LecturerId, u.FullName, cc.MaxStudents, cc.Status, cc.IsActive, cc.CreatedAt, cc.UpdatedAt
`;

export async function listCourseClasses(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const pageSize = Number(filters.pageSize) > 0 ? Number(filters.pageSize) : 10;
  const offset = (page - 1) * pageSize;

  request.input('Offset', sql.Int, offset);
  request.input('PageSize', sql.Int, pageSize);
  const where = courseClassBaseWhere(request, filters);

  const result = await request.query(`
    SELECT ${COURSE_CLASS_SELECT}
    FROM CourseClasses cc
    ${COURSE_CLASS_JOIN}
    WHERE ${where}
    GROUP BY ${COURSE_CLASS_GROUP}
    ORDER BY cc.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*) AS Total
    FROM CourseClasses cc
    JOIN Subjects sub ON sub.Id = cc.SubjectId
    JOIN Semesters sem ON sem.Id = cc.SemesterId
    LEFT JOIN Users u ON u.Id = cc.LecturerId
    WHERE ${where};
  `);

  return {
    items: result.recordsets[0].map(mapCourseClass),
    pagination: { page, pageSize, total: Number(result.recordsets[1][0]?.Total || 0) },
  };
}

export async function findCourseClassById(id, filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input('Id', sql.Int, Number(id));
  if (filters.lecturerId) request.input('LecturerId', sql.Int, Number(filters.lecturerId));
  if (filters.studentId) request.input('StudentId', sql.Int, Number(filters.studentId));

  const lecturerClause = filters.lecturerId ? 'AND cc.LecturerId = @LecturerId' : '';
  const studentJoin = filters.studentId ? 'JOIN CourseClassEnrollments se ON se.CourseClassId = cc.Id AND se.StudentId = @StudentId AND se.DeletedAt IS NULL AND se.IsActive = 1' : '';

  const result = await request.query(`
    SELECT ${COURSE_CLASS_SELECT}
    FROM CourseClasses cc
    ${COURSE_CLASS_JOIN}
    ${studentJoin}
    WHERE cc.Id = @Id AND cc.DeletedAt IS NULL ${lecturerClause}
    GROUP BY ${COURSE_CLASS_GROUP}
  `);
  return mapCourseClass(result.recordset[0]);
}

export async function listStudentCourseClasses(studentId, filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const pageSize = Number(filters.pageSize) > 0 ? Number(filters.pageSize) : 10;
  const offset = (page - 1) * pageSize;

  request.input('Offset', sql.Int, offset);
  request.input('PageSize', sql.Int, pageSize);
  const where = studentCourseClassBaseWhere(request, studentId, filters);

  const result = await request.query(`
    SELECT ${COURSE_CLASS_SELECT}
    FROM CourseClassEnrollments sce
    JOIN CourseClasses cc ON cc.Id = sce.CourseClassId
    ${COURSE_CLASS_JOIN}
    WHERE ${where}
    GROUP BY ${COURSE_CLASS_GROUP}
    ORDER BY cc.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(DISTINCT cc.Id) AS Total
    FROM CourseClassEnrollments sce
    JOIN CourseClasses cc ON cc.Id = sce.CourseClassId
    JOIN Subjects sub ON sub.Id = cc.SubjectId
    JOIN Semesters sem ON sem.Id = cc.SemesterId
    LEFT JOIN Users u ON u.Id = cc.LecturerId
    WHERE ${where};
  `);

  return {
    items: result.recordsets[0].map(mapCourseClass),
    pagination: { page, pageSize, total: Number(result.recordsets[1][0]?.Total || 0) },
  };
}
export async function createCourseClass(data) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Code', sql.NVarChar(50), data.code)
    .input('SubjectId', sql.Int, data.subjectId)
    .input('SemesterId', sql.Int, data.semesterId)
    .input('LecturerId', sql.Int, data.lecturerId || null)
    .input('MaxStudents', sql.Int, data.maxStudents || null)
    .input('Status', sql.NVarChar(20), data.status || 'ACTIVE')
    .query(`
      INSERT INTO CourseClasses (Code, SubjectId, SemesterId, LecturerId, MaxStudents, Status, IsActive)
      OUTPUT INSERTED.Id
      VALUES (@Code, @SubjectId, @SemesterId, @LecturerId, @MaxStudents, @Status, CASE WHEN @Status = 'ACTIVE' THEN 1 ELSE 0 END)
    `);
  return findCourseClassById(result.recordset[0].Id);
}

export async function updateCourseClass(id, data) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .input('Code', sql.NVarChar(50), data.code)
    .input('SubjectId', sql.Int, data.subjectId)
    .input('SemesterId', sql.Int, data.semesterId)
    .input('LecturerId', sql.Int, data.lecturerId || null)
    .input('MaxStudents', sql.Int, data.maxStudents || null)
    .input('Status', sql.NVarChar(20), data.status || 'ACTIVE')
    .query(`
      UPDATE CourseClasses
      SET Code = @Code, SubjectId = @SubjectId, SemesterId = @SemesterId, LecturerId = @LecturerId,
          MaxStudents = @MaxStudents, Status = @Status, IsActive = CASE WHEN @Status = 'ACTIVE' THEN 1 ELSE 0 END,
          UpdatedAt = SYSDATETIME()
      OUTPUT INSERTED.Id
      WHERE Id = @Id AND DeletedAt IS NULL
    `);
  return result.recordset[0] ? findCourseClassById(id) : null;
}

export async function updateCourseClassStatus(id, status) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .input('Status', sql.NVarChar(20), status)
    .query(`
      UPDATE CourseClasses
      SET Status = @Status, IsActive = CASE WHEN @Status = 'ACTIVE' THEN 1 ELSE 0 END, UpdatedAt = SYSDATETIME()
      OUTPUT INSERTED.Id
      WHERE Id = @Id AND DeletedAt IS NULL
    `);
  return result.recordset[0] ? findCourseClassById(id) : null;
}

export async function assignLecturer(id, lecturerId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .input('LecturerId', sql.Int, lecturerId || null)
    .query(`
      UPDATE CourseClasses
      SET LecturerId = @LecturerId, UpdatedAt = SYSDATETIME()
      OUTPUT INSERTED.Id
      WHERE Id = @Id AND DeletedAt IS NULL
    `);
  return result.recordset[0] ? findCourseClassById(id) : null;
}

export async function findActiveUserByIdAndRole(id, role) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Id', sql.Int, Number(id))
    .input('Role', sql.NVarChar(20), role)
    .query(`
      SELECT TOP 1 Id
      FROM Users
      WHERE Id = @Id AND Role = @Role AND IsActive = 1 AND DeletedAt IS NULL
    `);
  return result.recordset[0] || null;
}

export async function listCourseClassStudents(courseClassId, filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const pageSize = Number(filters.pageSize) > 0 ? Number(filters.pageSize) : 10;
  const offset = (page - 1) * pageSize;

  request.input('CourseClassId', sql.Int, Number(courseClassId));
  request.input('Search', sql.NVarChar(200), filters.search ? `%${filters.search}%` : null);
  request.input('Offset', sql.Int, offset);
  request.input('PageSize', sql.Int, pageSize);

  const result = await request.query(`
    SELECT u.Id, u.FullName, u.Email, u.UserCode, u.ClassName, u.Department, e.CreatedAt AS EnrolledAt
    FROM CourseClassEnrollments e
    JOIN Users u ON u.Id = e.StudentId
    WHERE e.CourseClassId = @CourseClassId
      AND e.DeletedAt IS NULL
      AND e.IsActive = 1
      AND u.DeletedAt IS NULL
      AND (@Search IS NULL OR u.FullName LIKE @Search OR u.Email LIKE @Search OR u.UserCode LIKE @Search)
    ORDER BY u.FullName ASC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*) AS Total
    FROM CourseClassEnrollments e
    JOIN Users u ON u.Id = e.StudentId
    WHERE e.CourseClassId = @CourseClassId
      AND e.DeletedAt IS NULL
      AND e.IsActive = 1
      AND u.DeletedAt IS NULL
      AND (@Search IS NULL OR u.FullName LIKE @Search OR u.Email LIKE @Search OR u.UserCode LIKE @Search);
  `);

  return {
    items: result.recordsets[0].map(mapStudent),
    pagination: { page, pageSize, total: Number(result.recordsets[1][0]?.Total || 0) },
  };
}

export async function countCourseClassStudents(courseClassId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('CourseClassId', sql.Int, Number(courseClassId))
    .query(`
      SELECT COUNT(*) AS Total
      FROM CourseClassEnrollments
      WHERE CourseClassId = @CourseClassId AND DeletedAt IS NULL AND IsActive = 1
    `);
  return Number(result.recordset[0]?.Total || 0);
}

export async function enrollStudents(courseClassId, studentIds = []) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    for (const studentId of studentIds) {
      await new sql.Request(transaction)
        .input('CourseClassId', sql.Int, Number(courseClassId))
        .input('StudentId', sql.Int, Number(studentId))
        .query(`
          MERGE CourseClassEnrollments AS target
          USING (SELECT @CourseClassId AS CourseClassId, @StudentId AS StudentId) AS source
          ON target.CourseClassId = source.CourseClassId AND target.StudentId = source.StudentId
          WHEN MATCHED THEN
            UPDATE SET IsActive = 1, DeletedAt = NULL, UpdatedAt = SYSDATETIME()
          WHEN NOT MATCHED THEN
            INSERT (CourseClassId, StudentId) VALUES (source.CourseClassId, source.StudentId);
        `);
    }

    await transaction.commit();
    return listCourseClassStudents(courseClassId, { pageSize: 1000 });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function findActiveEnrollmentStudentIds(courseClassId, studentIds = []) {
  const existing = [];
  const pool = await poolPromise;

  for (const studentId of studentIds) {
    const result = await pool.request()
      .input('CourseClassId', sql.Int, Number(courseClassId))
      .input('StudentId', sql.Int, Number(studentId))
      .query(`
        SELECT TOP 1 StudentId
        FROM CourseClassEnrollments
        WHERE CourseClassId = @CourseClassId
          AND StudentId = @StudentId
          AND DeletedAt IS NULL
          AND IsActive = 1
      `);
    if (result.recordset[0]) existing.push(Number(studentId));
  }

  return existing;
}
export async function removeStudent(courseClassId, studentId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('CourseClassId', sql.Int, Number(courseClassId))
    .input('StudentId', sql.Int, Number(studentId))
    .query(`
      UPDATE CourseClassEnrollments
      SET IsActive = 0, DeletedAt = SYSDATETIME(), UpdatedAt = SYSDATETIME()
      WHERE CourseClassId = @CourseClassId AND StudentId = @StudentId AND DeletedAt IS NULL
    `);
  return result.rowsAffected[0] > 0;
}

export async function assertStudents(studentIds = []) {
  const valid = [];
  for (const studentId of studentIds) {
    const user = await findActiveUserByIdAndRole(studentId, USER_ROLES.STUDENT);
    if (user) valid.push(Number(studentId));
  }
  return valid;
}

