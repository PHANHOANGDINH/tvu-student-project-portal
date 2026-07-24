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

export async function listFiles(roundId) { const p=await poolPromise; return (await p.request().input('Id',sql.Int,roundId).query(`SELECT Id id,RoundId roundId,OriginalName originalName,MimeType mimeType,SizeBytes sizeBytes,CreatedAt createdAt FROM TopicRegistrationRoundFiles WHERE RoundId=@Id ORDER BY CreatedAt`)).recordset }
export async function addFile(roundId,file,userId) { const p=await poolPromise; const r=await p.request().input('RoundId',sql.Int,roundId).input('Original',sql.NVarChar(260),file.originalname).input('Stored',sql.NVarChar(260),file.filename).input('Relative',sql.NVarChar(1000),file.relativePath).input('Mime',sql.NVarChar(150),file.mimetype).input('Size',sql.BigInt,file.size).input('Uid',sql.Int,userId).query(`INSERT TopicRegistrationRoundFiles(RoundId,OriginalName,StoredName,RelativePath,MimeType,SizeBytes,UploadedBy) OUTPUT INSERTED.Id VALUES(@RoundId,@Original,@Stored,@Relative,@Mime,@Size,@Uid)`); return (await listFiles(roundId)).find(x=>x.id===r.recordset[0].Id) }
export async function findFile(fileId) { const p=await poolPromise; return (await p.request().input('Id',sql.Int,fileId).query(`SELECT f.Id id,f.RoundId roundId,f.OriginalName originalName,f.RelativePath relativePath,r.Status status,r.ClassId classId,c.LecturerId lecturerId,(SELECT COUNT(*) FROM TopicRegistrations t WHERE t.RoundId=r.Id AND t.DeletedAt IS NULL) registrationCount FROM TopicRegistrationRoundFiles f JOIN TopicRegistrationRounds r ON r.Id=f.RoundId JOIN CourseClasses c ON c.Id=r.ClassId WHERE f.Id=@Id`)).recordset[0]||null }
export async function deleteFile(fileId) { const p=await poolPromise; return (await p.request().input('Id',sql.Int,fileId).query('DELETE TopicRegistrationRoundFiles WHERE Id=@Id')).rowsAffected[0]>0 }
export async function studentCanAccess(roundId,userId) { const p=await poolPromise; return Boolean((await p.request().input('Rid',sql.Int,roundId).input('Uid',sql.Int,userId).query(`SELECT TOP 1 1 ok FROM TopicRegistrationRounds r JOIN CourseClassEnrollments e ON e.CourseClassId=r.ClassId AND e.StudentId=@Uid AND e.IsActive=1 AND e.DeletedAt IS NULL WHERE r.Id=@Rid AND r.DeletedAt IS NULL`)).recordset[0]) }
export async function studentContext(roundId,userId){const p=await poolPromise;return(await p.request().input('Rid',sql.Int,roundId).input('Uid',sql.Int,userId).query(`SELECT r.Id roundId,r.ClassId classId,r.Name roundName,r.StartAt startAt,r.EndAt endAt,r.Status status,r.AllowEditing allowEditing,r.MaxEditCount maxEditCount,g.Id groupId,g.LeaderId leaderId FROM TopicRegistrationRounds r JOIN CourseClassEnrollments e ON e.CourseClassId=r.ClassId AND e.StudentId=@Uid AND e.IsActive=1 AND e.DeletedAt IS NULL LEFT JOIN GroupMembers gm ON gm.ClassId=r.ClassId AND gm.StudentId=@Uid AND gm.DeletedAt IS NULL LEFT JOIN StudentGroups g ON g.Id=gm.GroupId AND g.DeletedAt IS NULL WHERE r.Id=@Rid AND r.DeletedAt IS NULL`)).recordset[0]||null}
export async function registration(roundId,groupId){const p=await poolPromise;return(await p.request().input('Rid',sql.Int,roundId).input('Gid',sql.Int,groupId).query(`SELECT TOP 1 Id id,RoundId roundId,GroupId groupId,ClassId classId,Title title,Description description,Objectives objectives,Scope scope,Technologies technologies,ExpectedResults expectedResults,ReferenceUrl referenceUrl,RevisionCount revisionCount,Status status,ReviewComment reviewComment,CreatedAt createdAt,UpdatedAt updatedAt FROM TopicRegistrations WHERE RoundId=@Rid AND GroupId=@Gid AND DeletedAt IS NULL`)).recordset[0]||null}
export async function createRegistration(context,data){const p=await poolPromise;const r=await p.request().input('Rid',sql.Int,context.roundId).input('Gid',sql.Int,context.groupId).input('Cid',sql.Int,context.classId).input('Title',sql.NVarChar(250),data.title).input('Description',sql.NVarChar(sql.MAX),data.description).input('Objectives',sql.NVarChar(sql.MAX),data.objectives||null).input('Scope',sql.NVarChar(sql.MAX),data.scope||null).input('Technologies',sql.NVarChar(500),data.technologies||null).input('Expected',sql.NVarChar(sql.MAX),data.expectedResults||null).input('Url',sql.NVarChar(1000),data.referenceUrl||null).query(`INSERT TopicRegistrations(RoundId,GroupId,ClassId,Title,Description,Objectives,Scope,Technologies,ExpectedResults,ReferenceUrl) OUTPUT INSERTED.Id VALUES(@Rid,@Gid,@Cid,@Title,@Description,@Objectives,@Scope,@Technologies,@Expected,@Url)`);return registration(context.roundId,context.groupId)}
export async function updateRegistration(current,data){const p=await poolPromise;await p.request().input('Id',sql.Int,current.id).input('Title',sql.NVarChar(250),data.title).input('Description',sql.NVarChar(sql.MAX),data.description).input('Objectives',sql.NVarChar(sql.MAX),data.objectives||null).input('Scope',sql.NVarChar(sql.MAX),data.scope||null).input('Technologies',sql.NVarChar(500),data.technologies||null).input('Expected',sql.NVarChar(sql.MAX),data.expectedResults||null).input('Url',sql.NVarChar(1000),data.referenceUrl||null).query(`UPDATE TopicRegistrations SET Title=@Title,Description=@Description,Objectives=@Objectives,Scope=@Scope,Technologies=@Technologies,ExpectedResults=@Expected,ReferenceUrl=@Url,RevisionCount=RevisionCount+1,Status='PENDING',UpdatedAt=SYSDATETIME() WHERE Id=@Id`);return registration(current.roundId,current.groupId)}