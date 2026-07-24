import { poolPromise, sql } from '../../config/db.js'

const base = `SELECT r.Id id,r.ClassId classId,c.Code classCode,s.Name className,r.Name name,
r.Description description,r.StartAt startAt,r.EndAt endAt,r.Status status,c.LecturerId lecturerId,
r.CreatedAt createdAt,r.UpdatedAt updatedAt FROM TopicRegistrationRounds r
JOIN CourseClasses c ON c.Id=r.ClassId JOIN Subjects s ON s.Id=c.SubjectId`

export async function listLecturer(userId) {
  const p = await poolPromise
  return (await p.request().input('Uid', sql.Int, userId)
    .query(`${base} WHERE c.LecturerId=@Uid AND r.DeletedAt IS NULL ORDER BY r.StartAt DESC`)).recordset
}
export async function listStudent(userId) {
  const p = await poolPromise
  return (await p.request().input('Uid', sql.Int, userId).query(`${base}
    JOIN CourseClassEnrollments e ON e.CourseClassId=r.ClassId AND e.StudentId=@Uid
      AND e.IsActive=1 AND e.DeletedAt IS NULL
    WHERE r.DeletedAt IS NULL AND r.Status<>'DRAFT' ORDER BY r.StartAt DESC`)).recordset
}
export async function find(id) {
  const p = await poolPromise
  return (await p.request().input('Id', sql.Int, id)
    .query(`${base} WHERE r.Id=@Id AND r.DeletedAt IS NULL`)).recordset[0] || null
}
export async function create(data, userId) {
  const p = await poolPromise
  const result = await p.request().input('ClassId', sql.Int, data.classId)
    .input('Name', sql.NVarChar(200), data.name).input('Description', sql.NVarChar(sql.MAX), data.description || null)
    .input('StartAt', sql.DateTime2, data.startAt).input('EndAt', sql.DateTime2, data.endAt)
    .input('Uid', sql.Int, userId).query(`INSERT TopicRegistrationRounds
      (ClassId,Name,Description,StartAt,EndAt,CreatedBy) OUTPUT INSERTED.Id
      VALUES(@ClassId,@Name,@Description,@StartAt,@EndAt,@Uid)`)
  return find(result.recordset[0].Id)
}
export async function update(id, data) {
  const p = await poolPromise
  await p.request().input('Id', sql.Int, id).input('Name', sql.NVarChar(200), data.name)
    .input('Description', sql.NVarChar(sql.MAX), data.description || null)
    .input('StartAt', sql.DateTime2, data.startAt).input('EndAt', sql.DateTime2, data.endAt)
    .query(`UPDATE TopicRegistrationRounds SET Name=@Name,Description=@Description,StartAt=@StartAt,
      EndAt=@EndAt,UpdatedAt=SYSDATETIME() WHERE Id=@Id`)
  return find(id)
}
export async function setStatus(id, status) {
  const p = await poolPromise
  await p.request().input('Id', sql.Int, id).input('Status', sql.NVarChar(20), status)
    .query('UPDATE TopicRegistrationRounds SET Status=@Status,UpdatedAt=SYSDATETIME() WHERE Id=@Id')
  return find(id)
}
