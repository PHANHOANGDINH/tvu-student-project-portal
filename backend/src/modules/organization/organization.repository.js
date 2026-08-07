import { poolPromise, sql } from '../../config/db.js'

const facultySort = { code: 'f.FacultyCode', name: 'f.FacultyName', updatedAt: 'COALESCE(f.UpdatedAt,f.CreatedAt)', classCount: 'AdministrativeClassCount' }
const classSort = { code: 'c.ClassCode', name: 'c.ClassName', admissionYear: 'c.AdmissionYear', updatedAt: 'COALESCE(c.UpdatedAt,c.CreatedAt)', studentCount: 'StudentCount' }
const direction = value => String(value).toLowerCase() === 'asc' ? 'ASC' : 'DESC'

export async function listFaculties({ page, pageSize, search, isActive, sortBy, sortDirection }) {
  const pool = await poolPromise
  const bind = request => request.input('Pattern', sql.NVarChar(320), search ? `%${search}%` : null).input('IsActive', sql.Bit, isActive)
  const where = `f.DeletedAt IS NULL AND (@Pattern IS NULL OR f.FacultyCode LIKE @Pattern OR f.FacultyName LIKE @Pattern) AND (@IsActive IS NULL OR f.IsActive=@IsActive)`
  const items = await bind(pool.request()).input('Offset', sql.Int, (page - 1) * pageSize).input('PageSize', sql.Int, pageSize).query(`
    SELECT f.Id id,f.FacultyCode facultyCode,f.FacultyName facultyName,f.Description description,f.IsActive isActive,
      f.CreatedAt createdAt,f.UpdatedAt updatedAt,COUNT(c.Id) administrativeClassCount
    FROM Faculties f LEFT JOIN Classes c ON c.FacultyId=f.Id AND c.DeletedAt IS NULL
    WHERE ${where} GROUP BY f.Id,f.FacultyCode,f.FacultyName,f.Description,f.IsActive,f.CreatedAt,f.UpdatedAt
    ORDER BY ${facultySort[sortBy] || facultySort.updatedAt} ${direction(sortDirection)},f.Id DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY`)
  const total = await bind(pool.request()).query(`SELECT COUNT(*) total FROM Faculties f WHERE ${where}`)
  return { items: items.recordset, total: total.recordset[0].total }
}

export async function findFaculty(id) {
  const pool = await poolPromise
  const result = await pool.request().input('Id', sql.Int, id).query(`
    SELECT f.Id id,f.FacultyCode facultyCode,f.FacultyName facultyName,f.Description description,f.IsActive isActive,
      f.CreatedAt createdAt,f.UpdatedAt updatedAt,(SELECT COUNT(*) FROM Classes c WHERE c.FacultyId=f.Id AND c.DeletedAt IS NULL) administrativeClassCount
    FROM Faculties f WHERE f.Id=@Id AND f.DeletedAt IS NULL`)
  return result.recordset[0] || null
}

export async function findFacultyByCode(code, excludeId = null) {
  const pool = await poolPromise
  const result = await pool.request().input('Code', sql.NVarChar(30), code).input('ExcludeId', sql.Int, excludeId)
    .query('SELECT TOP 1 Id id FROM Faculties WHERE UPPER(FacultyCode)=UPPER(@Code) AND DeletedAt IS NULL AND (@ExcludeId IS NULL OR Id<>@ExcludeId)')
  return result.recordset[0] || null
}

export async function createFaculty(data) {
  const pool = await poolPromise
  const result = await pool.request().input('Code', sql.NVarChar(30), data.facultyCode).input('Name', sql.NVarChar(150), data.facultyName)
    .input('Description', sql.NVarChar(500), data.description).query('INSERT Faculties(FacultyCode,FacultyName,Description) OUTPUT INSERTED.Id id VALUES(@Code,@Name,@Description)')
  return findFaculty(result.recordset[0].id)
}

export async function updateFaculty(id, data) {
  const pool = await poolPromise
  await pool.request().input('Id', sql.Int, id).input('Code', sql.NVarChar(30), data.facultyCode).input('Name', sql.NVarChar(150), data.facultyName)
    .input('Description', sql.NVarChar(500), data.description).query('UPDATE Faculties SET FacultyCode=@Code,FacultyName=@Name,Description=@Description,UpdatedAt=SYSDATETIME() WHERE Id=@Id AND DeletedAt IS NULL')
  return findFaculty(id)
}

export async function setFacultyStatus(id, isActive) {
  const pool = await poolPromise
  await pool.request().input('Id', sql.Int, id).input('IsActive', sql.Bit, isActive).query('UPDATE Faculties SET IsActive=@IsActive,UpdatedAt=SYSDATETIME() WHERE Id=@Id AND DeletedAt IS NULL')
  return findFaculty(id)
}

export async function deleteFaculty(id) {
  const pool = await poolPromise
  const result = await pool.request().input('Id', sql.Int, id).query(`
    UPDATE Faculties SET IsActive=0,DeletedAt=SYSDATETIME(),UpdatedAt=SYSDATETIME()
    OUTPUT INSERTED.Id id WHERE Id=@Id AND DeletedAt IS NULL
      AND NOT EXISTS(SELECT 1 FROM Classes WHERE FacultyId=@Id AND DeletedAt IS NULL)`)
  return result.recordset[0] || null
}

export async function listAdministrativeClasses({ page, pageSize, search, facultyId, admissionYear, isActive, sortBy, sortDirection }) {
  const pool = await poolPromise
  const bind = request => request.input('Pattern', sql.NVarChar(320), search ? `%${search}%` : null).input('FacultyId', sql.Int, facultyId)
    .input('AdmissionYear', sql.Int, admissionYear).input('IsActive', sql.Bit, isActive)
  const where = `c.DeletedAt IS NULL AND (@Pattern IS NULL OR c.ClassCode LIKE @Pattern OR c.ClassName LIKE @Pattern)
    AND (@FacultyId IS NULL OR c.FacultyId=@FacultyId) AND (@AdmissionYear IS NULL OR c.AdmissionYear=@AdmissionYear) AND (@IsActive IS NULL OR c.IsActive=@IsActive)`
  const select = `c.Id id,c.ClassCode classCode,c.ClassName className,c.FacultyId facultyId,f.FacultyCode facultyCode,f.FacultyName facultyName,
    c.AdmissionYear admissionYear,c.AcademicProgram academicProgram,c.AdvisorTeacherId advisorLecturerId,u.FullName advisorLecturerName,u.Email advisorLecturerEmail,
    c.Description description,c.IsActive isActive,c.CreatedAt createdAt,c.UpdatedAt updatedAt,COUNT(scm.Id) studentCount`
  const items = await bind(pool.request()).input('Offset', sql.Int, (page - 1) * pageSize).input('PageSize', sql.Int, pageSize).query(`
    SELECT ${select} FROM Classes c JOIN Faculties f ON f.Id=c.FacultyId LEFT JOIN Users u ON u.Id=c.AdvisorTeacherId
    LEFT JOIN StudentClassMembers scm ON scm.ClassId=c.Id AND scm.DeletedAt IS NULL WHERE ${where}
    GROUP BY c.Id,c.ClassCode,c.ClassName,c.FacultyId,f.FacultyCode,f.FacultyName,c.AdmissionYear,c.AcademicProgram,c.AdvisorTeacherId,u.FullName,u.Email,c.Description,c.IsActive,c.CreatedAt,c.UpdatedAt
    ORDER BY ${classSort[sortBy] || classSort.updatedAt} ${direction(sortDirection)},c.Id DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY`)
  const total = await bind(pool.request()).query(`SELECT COUNT(*) total FROM Classes c WHERE ${where}`)
  return { items: items.recordset, total: total.recordset[0].total }
}

export async function findAdministrativeClass(id, transaction = null) {
  const pool = transaction || await poolPromise
  const result = await pool.request().input('Id', sql.Int, id).query(`
    SELECT c.Id id,c.ClassCode classCode,c.ClassName className,c.FacultyId facultyId,f.FacultyCode facultyCode,f.FacultyName facultyName,
      c.AdmissionYear admissionYear,c.AcademicProgram academicProgram,c.AdvisorTeacherId advisorLecturerId,u.FullName advisorLecturerName,
      c.Description description,c.IsActive isActive,c.CreatedAt createdAt,c.UpdatedAt updatedAt,
      (SELECT COUNT(*) FROM StudentClassMembers scm WHERE scm.ClassId=c.Id AND scm.DeletedAt IS NULL) studentCount
    FROM Classes c JOIN Faculties f ON f.Id=c.FacultyId LEFT JOIN Users u ON u.Id=c.AdvisorTeacherId WHERE c.Id=@Id AND c.DeletedAt IS NULL`)
  return result.recordset[0] || null
}

export async function findAdministrativeClassByCode(code, excludeId = null) {
  const pool = await poolPromise
  const result = await pool.request().input('Code', sql.NVarChar(50), code).input('ExcludeId', sql.Int, excludeId)
    .query('SELECT TOP 1 Id id FROM Classes WHERE UPPER(ClassCode)=UPPER(@Code) AND (@ExcludeId IS NULL OR Id<>@ExcludeId)')
  return result.recordset[0] || null
}

export async function findActiveLecturer(id) {
  const pool = await poolPromise
  const result = await pool.request().input('Id', sql.Int, id).query("SELECT TOP 1 Id id FROM Users WHERE Id=@Id AND Role='LECTURER' AND IsActive=1 AND DeletedAt IS NULL")
  return result.recordset[0] || null
}

function bindClass(request, data) {
  return request.input('Code', sql.NVarChar(50), data.classCode).input('Name', sql.NVarChar(100), data.className).input('FacultyId', sql.Int, data.facultyId)
    .input('AdmissionYear', sql.Int, data.admissionYear).input('AcademicProgram', sql.NVarChar(150), data.academicProgram)
    .input('AdvisorId', sql.Int, data.advisorLecturerId).input('Description', sql.NVarChar(500), data.description)
}

export async function createAdministrativeClass(data) {
  const pool = await poolPromise
  const result = await bindClass(pool.request(), data).query(`INSERT Classes(ClassCode,ClassName,FacultyId,AdmissionYear,AcademicProgram,AdvisorTeacherId,Description,Department,AcademicYear)
    OUTPUT INSERTED.Id id VALUES(@Code,@Name,@FacultyId,@AdmissionYear,@AcademicProgram,@AdvisorId,@Description,NULL,CASE WHEN @AdmissionYear IS NULL THEN NULL ELSE CONVERT(NVARCHAR(20),@AdmissionYear) END)`)
  return findAdministrativeClass(result.recordset[0].id)
}

export async function updateAdministrativeClass(id, data) {
  const pool = await poolPromise
  await bindClass(pool.request(), data).input('Id', sql.Int, id).query(`UPDATE Classes SET ClassCode=@Code,ClassName=@Name,FacultyId=@FacultyId,AdmissionYear=@AdmissionYear,
    AcademicProgram=@AcademicProgram,AdvisorTeacherId=@AdvisorId,Description=@Description,AcademicYear=CASE WHEN @AdmissionYear IS NULL THEN NULL ELSE CONVERT(NVARCHAR(20),@AdmissionYear) END,
    UpdatedAt=SYSDATETIME() WHERE Id=@Id AND DeletedAt IS NULL`)
  return findAdministrativeClass(id)
}

export async function setAdministrativeClassStatus(id, isActive) {
  const pool = await poolPromise
  await pool.request().input('Id', sql.Int, id).input('IsActive', sql.Bit, isActive).query('UPDATE Classes SET IsActive=@IsActive,UpdatedAt=SYSDATETIME() WHERE Id=@Id AND DeletedAt IS NULL')
  return findAdministrativeClass(id)
}

export async function deleteAdministrativeClass(id) {
  const pool = await poolPromise
  const result = await pool.request().input('Id', sql.Int, id).query(`UPDATE Classes SET IsActive=0,DeletedAt=SYSDATETIME(),UpdatedAt=SYSDATETIME()
    OUTPUT INSERTED.Id id WHERE Id=@Id AND DeletedAt IS NULL AND NOT EXISTS(SELECT 1 FROM StudentClassMembers WHERE ClassId=@Id AND DeletedAt IS NULL)`)
  return result.recordset[0] || null
}

export async function listAdministrativeClassStudents(classId, { page, pageSize, search }) {
  const pool = await poolPromise
  const bind = request => request.input('ClassId', sql.Int, classId).input('Pattern', sql.NVarChar(320), search ? `%${search}%` : null)
  const where = `scm.ClassId=@ClassId AND scm.DeletedAt IS NULL AND u.DeletedAt IS NULL AND (@Pattern IS NULL OR u.UserCode LIKE @Pattern OR u.FullName LIKE @Pattern OR u.Email LIKE @Pattern)`
  const items = await bind(pool.request()).input('Offset', sql.Int, (page - 1) * pageSize).input('PageSize', sql.Int, pageSize).query(`
    SELECT u.Id studentId,u.UserCode studentCode,u.FullName fullName,u.Email email,u.IsActive isActive,scm.CreatedAt assignedAt
    FROM StudentClassMembers scm JOIN Users u ON u.Id=scm.StudentId WHERE ${where} ORDER BY u.FullName,u.Id OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY`)
  const total = await bind(pool.request()).query(`SELECT COUNT(*) total FROM StudentClassMembers scm JOIN Users u ON u.Id=scm.StudentId WHERE ${where}`)
  return { items: items.recordset, total: total.recordset[0].total }
}

export async function findStudent(id, transaction = null) {
  const pool = transaction || await poolPromise
  const result = await pool.request().input('Id', sql.Int, id).query("SELECT TOP 1 Id id,FullName fullName,IsActive isActive FROM Users WHERE Id=@Id AND Role='STUDENT' AND DeletedAt IS NULL")
  return result.recordset[0] || null
}

export async function assignStudent(studentId, classId) {
  const pool = await poolPromise
  const transaction = new sql.Transaction(pool)
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)
  try {
    const student = await findStudent(studentId, transaction)
    const target = await findAdministrativeClass(classId, transaction)
    if (!student) { const error = new Error('STUDENT_NOT_FOUND'); error.code='STUDENT_NOT_FOUND'; throw error }
    if (!student.isActive) { const error = new Error('STUDENT_INACTIVE'); error.code='STUDENT_INACTIVE'; throw error }
    if (!target) { const error = new Error('CLASS_NOT_FOUND'); error.code='CLASS_NOT_FOUND'; throw error }
    if (!target.isActive) { const error = new Error('CLASS_INACTIVE'); error.code='CLASS_INACTIVE'; throw error }
    await transaction.request().input('StudentId', sql.Int, studentId).query('UPDATE StudentClassMembers SET DeletedAt=SYSDATETIME() WHERE StudentId=@StudentId AND DeletedAt IS NULL')
    await transaction.request().input('StudentId', sql.Int, studentId).input('ClassId', sql.Int, classId).query(`
      IF EXISTS(SELECT 1 FROM StudentClassMembers WHERE StudentId=@StudentId AND ClassId=@ClassId)
        UPDATE StudentClassMembers SET DeletedAt=NULL,CreatedAt=SYSDATETIME() WHERE StudentId=@StudentId AND ClassId=@ClassId;
      ELSE INSERT StudentClassMembers(ClassId,StudentId) VALUES(@ClassId,@StudentId);`)
    await transaction.commit()
    return { studentId, administrativeClassId: classId }
  } catch (error) { await transaction.rollback(); throw error }
}

export async function removeStudent(classId, studentId) {
  const pool = await poolPromise
  const result = await pool.request().input('ClassId', sql.Int, classId).input('StudentId', sql.Int, studentId)
    .query('UPDATE StudentClassMembers SET DeletedAt=SYSDATETIME() OUTPUT INSERTED.StudentId studentId WHERE ClassId=@ClassId AND StudentId=@StudentId AND DeletedAt IS NULL')
  return result.recordset[0] || null
}

export async function unassignStudent(studentId) {
  const pool = await poolPromise
  await pool.request().input('StudentId', sql.Int, studentId).query('UPDATE StudentClassMembers SET DeletedAt=SYSDATETIME() WHERE StudentId=@StudentId AND DeletedAt IS NULL')
  return { studentId, administrativeClassId: null }
}
