import { poolPromise, sql } from '../../config/db.js'

export async function hasActiveAssignment(courseClassId, lecturerId) {
  const pool = await poolPromise
  const result = await pool.request()
    .input('CourseClassId', sql.Int, courseClassId)
    .input('LecturerId', sql.Int, lecturerId)
    .query(`SELECT TOP 1 1 ok
      FROM CourseClassLecturers
      WHERE CourseClassId=@CourseClassId AND LecturerId=@LecturerId AND IsActive=1`)
  return Boolean(result.recordset[0])
}

export async function getLecturerAssignment(courseClassId, lecturerId) {
  const pool = await poolPromise
  const result = await pool.request()
    .input('CourseClassId', sql.Int, courseClassId)
    .input('LecturerId', sql.Int, lecturerId)
    .query(`SELECT TOP 1 Id id,CourseClassId courseClassId,LecturerId lecturerId,
      AssignmentRole assignmentRole,IsActive isActive,AssignedAt assignedAt,UpdatedAt updatedAt
      FROM CourseClassLecturers
      WHERE CourseClassId=@CourseClassId AND LecturerId=@LecturerId`)
  return result.recordset[0] || null
}

export async function listByCourseClass(courseClassId) {
  const pool = await poolPromise
  const result = await pool.request().input('CourseClassId', sql.Int, courseClassId)
    .query(`SELECT link.Id id,link.CourseClassId courseClassId,u.Id lecturerId,u.UserCode code,
      u.FullName fullName,u.Email email,link.AssignmentRole assignmentRole,link.IsActive isActive,
      link.AssignedBy assignedBy,link.AssignedAt assignedAt,link.UpdatedAt updatedAt
      FROM CourseClassLecturers link
      JOIN Users u ON u.Id=link.LecturerId
      WHERE link.CourseClassId=@CourseClassId
      ORDER BY CASE link.AssignmentRole WHEN 'PRIMARY' THEN 0 ELSE 1 END,u.FullName`)
  return result.recordset
}

export async function listCourseClassesByLecturer(lecturerId) {
  const pool = await poolPromise
  const result = await pool.request().input('LecturerId', sql.Int, lecturerId)
    .query(`SELECT link.CourseClassId courseClassId,link.AssignmentRole assignmentRole
      FROM CourseClassLecturers link
      JOIN CourseClasses c ON c.Id=link.CourseClassId
      WHERE link.LecturerId=@LecturerId AND link.IsActive=1
        AND c.DeletedAt IS NULL`)
  return result.recordset
}

export async function listForCourseClasses(courseClassIds) {
  const ids = [...new Set(courseClassIds.map(Number).filter(Number.isInteger))]
  if (!ids.length) return []
  const pool = await poolPromise
  const request = pool.request()
  const parameters = ids.map((value,index) => {
    request.input(`ClassId${index}`, sql.Int, value)
    return `@ClassId${index}`
  })
  const result = await request.query(`SELECT link.CourseClassId courseClassId,u.Id lecturerId,
    u.UserCode code,u.FullName fullName,u.Email email,link.AssignmentRole assignmentRole,
    link.IsActive isActive
    FROM CourseClassLecturers link
    JOIN Users u ON u.Id=link.LecturerId
    WHERE link.CourseClassId IN (${parameters.join(',')})
    ORDER BY link.CourseClassId,CASE link.AssignmentRole WHEN 'PRIMARY' THEN 0 ELSE 1 END,u.FullName`)
  return result.recordset
}
