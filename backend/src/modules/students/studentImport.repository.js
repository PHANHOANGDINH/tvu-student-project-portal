import { poolPromise, sql } from '../../config/db.js';

const runRequest = (context) => context ? new sql.Request(context) : poolPromise.then((pool) => pool.request());

export async function findCourseClass(id, context = null, lock = false) {
  const request = await runRequest(context);
  const hint = lock ? 'WITH (UPDLOCK,HOLDLOCK)' : '';
  const result = await request.input('Id', sql.Int, id).query(`
    SELECT Id id,Code code,MaxStudents maxStudents,Status status,IsActive isActive
    FROM CourseClasses ${hint} WHERE Id=@Id AND DeletedAt IS NULL`);
  return result.recordset[0] || null;
}

export async function findExistingUsers(rows) {
  if (!rows.length) return [];
  const pool = await poolPromise, request = pool.request(), clauses = [];
  rows.forEach((row, index) => {
    request.input(`Email${index}`, sql.NVarChar(150), row.email);
    request.input(`Code${index}`, sql.NVarChar(50), row.studentCode);
    clauses.push(`Email=@Email${index}`, `UserCode=@Code${index}`);
  });
  const result = await request.query(`SELECT Id id,Email email,UserCode studentCode FROM Users WHERE DeletedAt IS NULL AND (${clauses.join(' OR ')})`);
  return result.recordset;
}

async function assertCapacity(transaction, courseClass, additional) {
  const result = await new sql.Request(transaction).input('Id', sql.Int, courseClass.id).query(`
    SELECT COUNT(*) total FROM CourseClassEnrollments WITH (UPDLOCK,HOLDLOCK)
    WHERE CourseClassId=@Id AND IsActive=1 AND DeletedAt IS NULL`);
  const current = Number(result.recordset[0].total);
  if (courseClass.maxStudents && current + additional > courseClass.maxStudents) {
    const error = new Error(`Lớp chỉ còn ${Math.max(courseClass.maxStudents-current,0)} chỗ trống.`);
    error.statusCode = 409;
    throw error;
  }
}

export async function importStudents(courseClassId, rows) {
  const pool = await poolPromise, transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const courseClass = await findCourseClass(courseClassId, transaction, true);
    if (!courseClass) { const error=new Error('Không tìm thấy lớp học phần.'); error.statusCode=404; throw error; }
    if (!courseClass.isActive || courseClass.status !== 'ACTIVE') { const error=new Error('Lớp học phần không hoạt động.'); error.statusCode=409; throw error; }
    await assertCapacity(transaction, courseClass, rows.length);
    const created = [];
    for (const row of rows) {
      const duplicate = await new sql.Request(transaction)
        .input('Email',sql.NVarChar(150),row.email).input('Code',sql.NVarChar(50),row.studentCode)
        .query('SELECT TOP 1 Id,Email,UserCode FROM Users WITH (UPDLOCK,HOLDLOCK) WHERE DeletedAt IS NULL AND (Email=@Email OR UserCode=@Code)');
      if (duplicate.recordset[0]) { const error=new Error(`Dữ liệu dòng ${row.rowNumber} đã tồn tại.`); error.statusCode=409; throw error; }
      const inserted = await new sql.Request(transaction)
        .input('FullName',sql.NVarChar(100),row.fullName).input('Email',sql.NVarChar(150),row.email)
        .input('PasswordHash',sql.NVarChar(255),row.passwordHash).input('Code',sql.NVarChar(50),row.studentCode)
        .input('ClassName',sql.NVarChar(100),courseClass.code).query(`
          INSERT Users(FullName,Email,PasswordHash,Role,IsActive,UserCode,ClassName)
          OUTPUT INSERTED.Id id,INSERTED.FullName fullName,INSERTED.Email email,INSERTED.UserCode studentCode
          VALUES(@FullName,@Email,@PasswordHash,'STUDENT',1,@Code,@ClassName)`);
      const user = inserted.recordset[0];
      await new sql.Request(transaction).input('ClassId',sql.Int,courseClass.id).input('StudentId',sql.Int,user.id)
        .query('INSERT CourseClassEnrollments(CourseClassId,StudentId,IsActive) VALUES(@ClassId,@StudentId,1)');
      created.push(user);
    }
    await transaction.commit();
    return { courseClass, created };
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function bulkEnroll(courseClassId, studentIds) {
  const pool = await poolPromise, transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const courseClass = await findCourseClass(courseClassId, transaction, true);
    if (!courseClass) { const error=new Error('Không tìm thấy lớp học phần.'); error.statusCode=404; throw error; }
    if (!courseClass.isActive || courseClass.status !== 'ACTIVE') { const error=new Error('Lớp học phần không hoạt động.'); error.statusCode=409; throw error; }
    const enrolled=[], skipped=[];
    for (const studentId of studentIds) {
      const user = await new sql.Request(transaction).input('Id',sql.Int,studentId).query(`
        SELECT Id id,FullName fullName,Email email,UserCode studentCode FROM Users WITH (UPDLOCK,HOLDLOCK)
        WHERE Id=@Id AND Role='STUDENT' AND IsActive=1 AND DeletedAt IS NULL`);
      if (!user.recordset[0]) { const error=new Error(`Sinh viên ${studentId} không tồn tại hoặc không hoạt động.`); error.statusCode=400; throw error; }
      const existing = await new sql.Request(transaction).input('ClassId',sql.Int,courseClass.id).input('StudentId',sql.Int,studentId).query(`
        SELECT TOP 1 Id,IsActive,DeletedAt FROM CourseClassEnrollments WITH (UPDLOCK,HOLDLOCK)
        WHERE CourseClassId=@ClassId AND StudentId=@StudentId ORDER BY CASE WHEN IsActive=1 AND DeletedAt IS NULL THEN 0 ELSE 1 END,Id DESC`);
      if (existing.recordset[0]?.IsActive && !existing.recordset[0]?.DeletedAt) { skipped.push(user.recordset[0]); continue; }
      enrolled.push({ ...user.recordset[0], enrollmentId: existing.recordset[0]?.Id || null });
    }
    await assertCapacity(transaction, courseClass, enrolled.length);
    for (const student of enrolled) {
      if (student.enrollmentId) await new sql.Request(transaction).input('Id',sql.Int,student.enrollmentId).query('UPDATE CourseClassEnrollments SET IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME() WHERE Id=@Id');
      else await new sql.Request(transaction).input('ClassId',sql.Int,courseClass.id).input('StudentId',sql.Int,student.id).query('INSERT CourseClassEnrollments(CourseClassId,StudentId,IsActive) VALUES(@ClassId,@StudentId,1)');
      delete student.enrollmentId;
    }
    await transaction.commit();
    return { courseClass, enrolled, skipped };
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function listEnrollments(courseClassId,{page=1,pageSize=20,search='' }={}) {
  const pool=await poolPromise, pattern=search?`%${search}%`:null, offset=(page-1)*pageSize;
  const bind=(request)=>request.input('Id',sql.Int,courseClassId).input('Pattern',sql.NVarChar(202),pattern);
  const where=`e.CourseClassId=@Id AND e.IsActive=1 AND e.DeletedAt IS NULL AND u.DeletedAt IS NULL AND (@Pattern IS NULL OR u.FullName LIKE @Pattern OR u.Email LIKE @Pattern OR u.UserCode LIKE @Pattern)`;
  const items=await bind(pool.request()).input('Offset',sql.Int,offset).input('Size',sql.Int,pageSize).query(`SELECT u.Id id,u.UserCode studentCode,u.FullName fullName,u.Email email,e.CreatedAt enrolledAt FROM CourseClassEnrollments e JOIN Users u ON u.Id=e.StudentId WHERE ${where} ORDER BY u.UserCode OFFSET @Offset ROWS FETCH NEXT @Size ROWS ONLY`);
  const total=await bind(pool.request()).query(`SELECT COUNT(*) total FROM CourseClassEnrollments e JOIN Users u ON u.Id=e.StudentId WHERE ${where}`);
  return {items:items.recordset,total:Number(total.recordset[0].total)};
}
