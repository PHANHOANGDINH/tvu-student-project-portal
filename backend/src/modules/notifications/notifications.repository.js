import { poolPromise, sql } from '../../config/db.js';

export async function groupUsers(groupId) {
  const pool = await poolPromise;
  const result = await pool.request().input('Id', sql.Int, groupId)
    .query('SELECT StudentId id FROM GroupMembers WHERE GroupId=@Id AND DeletedAt IS NULL');
  return result.recordset.map((item) => item.id);
}

export async function classStudents(classId) {
  const pool = await poolPromise;
  const result = await pool.request().input('Id', sql.Int, classId)
    .query(`SELECT StudentId id FROM CourseClassEnrollments
      WHERE CourseClassId=@Id AND IsActive=1 AND DeletedAt IS NULL`);
  return result.recordset.map((item) => item.id);
}

export async function list(userId, { page = 1, pageSize = 20 } = {}) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Uid', sql.Int, userId)
    .input('Offset', sql.Int, (page - 1) * pageSize)
    .input('Size', sql.Int, pageSize)
    .query(`SELECT Id id, Type type, Title title, Message message,
      RelatedEntityType relatedEntityType, RelatedEntityId relatedEntityId,
      IsRead isRead, CreatedAt createdAt, ReadAt readAt
      FROM Notifications WHERE UserId=@Uid ORDER BY CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Size ROWS ONLY`);
  return result.recordset;
}

export async function unreadCount(userId) {
  const pool = await poolPromise;
  const result = await pool.request().input('Uid', sql.Int, userId)
    .query('SELECT COUNT(*) total FROM Notifications WHERE UserId=@Uid AND IsRead=0');
  return result.recordset[0].total;
}

export async function markRead(id, userId) {
  const pool = await poolPromise;
  const result = await pool.request().input('Id', sql.Int, id).input('Uid', sql.Int, userId)
    .query(`UPDATE Notifications SET IsRead=1, ReadAt=COALESCE(ReadAt,SYSDATETIME())
      OUTPUT INSERTED.Id id WHERE Id=@Id AND UserId=@Uid`);
  return result.recordset[0] || null;
}

export async function markAll(userId) {
  const pool = await poolPromise;
  const result = await pool.request().input('Uid', sql.Int, userId)
    .query(`UPDATE Notifications SET IsRead=1, ReadAt=COALESCE(ReadAt,SYSDATETIME())
      WHERE UserId=@Uid AND IsRead=0`);
  return result.rowsAffected[0];
}
