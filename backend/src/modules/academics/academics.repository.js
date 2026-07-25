import { poolPromise, sql } from '../../config/db.js'
import {buildSemesterCode,buildCourseClassCode,getNextSectionNumber} from './courseClassCode.js'

const meta = {
  academicYears: { table:'AcademicYears', select:'Id id,Name name,StartDate startDate,EndDate endDate,IsActive isActive', fields:['Name','StartDate','EndDate'], search:'Name', orderBy:'StartDate DESC' },
  semesters: { table:'Semesters', select:'Id id,AcademicYearId academicYearId,(SELECT Name FROM AcademicYears a WHERE a.Id=AcademicYearId) academicYearName,Name name,Code code,StartDate startDate,EndDate endDate,IsActive isActive', fields:['AcademicYearId','Name','Code','StartDate','EndDate'], search:'Name + Code', orderBy:'StartDate DESC' },
  subjects: { table:'Subjects', select:'Id id,Code code,Name name,Credits credits,Description description,IsActive isActive', fields:['Code','Name','Credits','Description'], search:'Code + Name', orderBy:'Name' },
  courseClasses: { table:'CourseClasses', select:'Id id,Code code,CourseClassCode courseClassCode,SectionNumber sectionNumber,SubjectId subjectId,(SELECT Name FROM Subjects s WHERE s.Id=SubjectId) subjectName,SemesterId semesterId,(SELECT AcademicYearId FROM Semesters sx WHERE sx.Id=SemesterId) academicYearId,(SELECT Name FROM Semesters sm WHERE sm.Id=SemesterId) semesterName,LecturerId lecturerId,(SELECT UserCode FROM Users u WHERE u.Id=LecturerId) lecturerCode,(SELECT FullName FROM Users u WHERE u.Id=LecturerId) lecturerName,MaxStudents maxStudents,MaxStudents capacity,Status status,AllowSelfEnrollment allowSelfEnrollment,EnrollmentOpenAt enrollmentOpenAt,EnrollmentCloseAt enrollmentCloseAt,(SELECT COUNT(*) FROM CourseClassEnrollments e WHERE e.CourseClassId=CourseClasses.Id AND e.IsActive=1 AND e.DeletedAt IS NULL) enrollmentCount,IsActive isActive', fields:['SubjectId','SemesterId','LecturerId','MaxStudents','Status','AllowSelfEnrollment','EnrollmentOpenAt','EnrollmentCloseAt'], search:'Code', orderBy:'CreatedAt DESC' }
}
const get = (entity) => meta[entity]

export async function listEntities(entity,{page,pageSize,search,academicYearId,semesterId,lecturerId,status}) {
  const m=get(entity),pool=await poolPromise,pattern=search?'%'+search+'%':null,offset=(page-1)*pageSize
  const extra=entity==='courseClasses'?' AND (@YearId IS NULL OR SemesterId IN(SELECT Id FROM Semesters WHERE AcademicYearId=@YearId)) AND (@SemesterId IS NULL OR SemesterId=@SemesterId) AND (@LecturerId IS NULL OR LecturerId=@LecturerId) AND (@Status IS NULL OR Status=@Status)':''
  const where='DeletedAt IS NULL AND (@Pattern IS NULL OR '+m.search.split(' + ').map(x=>x+' LIKE @Pattern').join(' OR ')+')'+extra
  const bind=(r)=>{r.input('Pattern',sql.NVarChar(202),pattern);if(entity==='courseClasses')r.input('YearId',sql.Int,Number(academicYearId)||null).input('SemesterId',sql.Int,Number(semesterId)||null).input('LecturerId',sql.Int,Number(lecturerId)||null).input('Status',sql.NVarChar(20),status||null);return r}
  const items=await bind(pool.request()).input('Offset',sql.Int,offset).input('PageSize',sql.Int,pageSize).query('SELECT '+m.select+' FROM '+m.table+' WHERE '+where+' ORDER BY '+m.orderBy+' OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY')
  const total=await bind(pool.request()).query('SELECT COUNT(*) total FROM '+m.table+' WHERE '+where)
  return{items:items.recordset,total:total.recordset[0].total}
}
export async function findEntity(entity,id) {
  const m=get(entity),pool=await poolPromise,r=await pool.request().input('Id',sql.Int,id).query('SELECT '+m.select+' FROM '+m.table+' WHERE Id=@Id AND DeletedAt IS NULL')
  return r.recordset[0]||null
}
function bind(r,field,value){
  if(field.endsWith('Id')||field==='Credits'||field==='MaxStudents')return r.input(field,sql.Int,value)
  if(field.endsWith('Date'))return r.input(field,sql.Date,value)
  if(field.endsWith('At'))return r.input(field,sql.DateTime2,value||null)
  if(field==='AllowSelfEnrollment')return r.input(field,sql.Bit,Boolean(value))
  return r.input(field,sql.NVarChar(sql.MAX),value)
}
export async function saveEntity(entity,id,data){
  const m=get(entity),pool=await poolPromise,r=pool.request(),fields=m.fields.filter(f=>Object.hasOwn(data,f))
  fields.forEach(f=>bind(r,f,data[f]))
  if(id){r.input('Id',sql.Int,id);await r.query('UPDATE '+m.table+' SET '+fields.map(f=>f+'=@'+f).join(',')+',UpdatedAt=SYSDATETIME() WHERE Id=@Id AND DeletedAt IS NULL');return findEntity(entity,id)}
  const q=await r.query('INSERT INTO '+m.table+' ('+fields.join(',')+',IsActive) OUTPUT INSERTED.Id id VALUES ('+fields.map(f=>'@'+f).join(',')+',1)')
  return findEntity(entity,q.recordset[0].id)
}
export async function createCourseClass(data){const pool=await poolPromise,tx=pool.transaction();await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);try{const ref=(await tx.request().input('SubjectId',sql.Int,data.SubjectId).input('SemesterId',sql.Int,data.SemesterId).query('SELECT sub.Code subjectCode,sem.Name semesterName,sem.Code semesterCode,ay.Name academicYearName,ay.StartDate academicYearStartDate,ay.EndDate academicYearEndDate FROM Subjects sub CROSS JOIN Semesters sem JOIN AcademicYears ay ON ay.Id=sem.AcademicYearId WHERE sub.Id=@SubjectId AND sem.Id=@SemesterId')).recordset[0];if(!ref)throw Object.assign(new Error('INVALID_REFERENCE'),{code:'INVALID_REFERENCE'});const max=Number((await tx.request().input('SubjectId',sql.Int,data.SubjectId).input('SemesterId',sql.Int,data.SemesterId).query('SELECT ISNULL(MAX(SectionNumber),0) n FROM CourseClasses WITH(UPDLOCK,HOLDLOCK) WHERE SubjectId=@SubjectId AND SemesterId=@SemesterId')).recordset[0].n),section=data.SectionNumber||getNextSectionNumber(max),code=buildCourseClassCode({semesterCode:buildSemesterCode(ref),subjectCode:ref.subjectCode,sectionNumber:section}),r=tx.request();r.input('Code',sql.NVarChar(80),code).input('Section',sql.Int,section).input('SubjectId',sql.Int,data.SubjectId).input('SemesterId',sql.Int,data.SemesterId).input('LecturerId',sql.Int,data.LecturerId).input('Max',sql.Int,data.MaxStudents||null).input('Status',sql.NVarChar(20),data.Status).input('Self',sql.Bit,Boolean(data.AllowSelfEnrollment)).input('Open',sql.DateTime2,data.EnrollmentOpenAt||null).input('Close',sql.DateTime2,data.EnrollmentCloseAt||null);const q=await r.query("INSERT CourseClasses(Code,CourseClassCode,SectionNumber,SubjectId,SemesterId,LecturerId,MaxStudents,Status,AllowSelfEnrollment,EnrollmentOpenAt,EnrollmentCloseAt,IsActive)OUTPUT INSERTED.Id id VALUES(@Code,@Code,@Section,@SubjectId,@SemesterId,@LecturerId,@Max,@Status,@Self,@Open,@Close,1)");await tx.commit();return findEntity('courseClasses',q.recordset[0].id)}catch(e){await tx.rollback();throw e}}
export async function setStatus(entity,id,isActive){
  const m=get(entity),pool=await poolPromise
  await pool.request().input('Id',sql.Int,id).input('Active',sql.Bit,isActive).query('UPDATE '+m.table+' SET IsActive=@Active,UpdatedAt=SYSDATETIME() WHERE Id=@Id AND DeletedAt IS NULL')
  return findEntity(entity,id)
}
export async function duplicate(entity,field,value,id=null){
  const m=get(entity),pool=await poolPromise,r=await pool.request().input('Value',sql.NVarChar(200),value).input('Id',sql.Int,id).query('SELECT TOP 1 Id FROM '+m.table+' WHERE '+field+'=@Value AND DeletedAt IS NULL AND (@Id IS NULL OR Id<>@Id)')
  return!!r.recordset[0]
}
export async function reference(table,id,role=null){
  const pool=await poolPromise,r=pool.request().input('Id',sql.Int,id);if(role)r.input('Role',sql.NVarChar(20),role)
  const q=await r.query('SELECT TOP 1 Id FROM '+table+' WHERE Id=@Id AND DeletedAt IS NULL'+(role?' AND Role=@Role AND IsActive=1':''))
  return!!q.recordset[0]
}
const studentSelect="c.Id id,c.CourseClassCode code,e.EnrollmentStatus enrollmentStatus,e.EnrollmentSource enrollmentSource,e.EnrolledAt enrolledAt,"+'sub.Code subjectCode,sub.Name subjectName,sub.Credits credits,sub.Description subjectDescription,sem.Name semesterName,sem.Code semesterCode,sem.StartDate semesterStartDate,sem.EndDate semesterEndDate,ay.Name academicYearName,u.FullName lecturerName,u.Email lecturerEmail,c.Status status,c.IsActive isActive,c.MaxStudents maxStudents'
const studentFrom=' FROM CourseClasses c JOIN CourseClassEnrollments e ON e.CourseClassId=c.Id AND e.StudentId=@Uid AND e.IsActive=1 AND e.DeletedAt IS NULL JOIN Subjects sub ON sub.Id=c.SubjectId JOIN Semesters sem ON sem.Id=c.SemesterId JOIN AcademicYears ay ON ay.Id=sem.AcademicYearId LEFT JOIN Users u ON u.Id=c.LecturerId WHERE c.DeletedAt IS NULL'
export async function listStudentClasses(uid,{page,pageSize,search}){
 const pool=await poolPromise,pattern=search?'%'+search+'%':null,where=studentFrom+' AND (@Pattern IS NULL OR c.Code LIKE @Pattern OR sub.Name LIKE @Pattern)',bind=r=>r.input('Uid',sql.Int,uid).input('Pattern',sql.NVarChar(202),pattern)
 const items=await bind(pool.request()).input('Offset',sql.Int,(page-1)*pageSize).input('PageSize',sql.Int,pageSize).query('SELECT '+studentSelect+where+' ORDER BY ay.StartDate DESC,sem.StartDate DESC,c.Code OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY')
 const total=await bind(pool.request()).query('SELECT COUNT(*) total'+where);return{items:items.recordset,total:total.recordset[0].total}
}
export async function findStudentClass(uid,id){
 const pool=await poolPromise,r=await pool.request().input('Uid',sql.Int,uid).input('Id',sql.Int,id).query('SELECT '+studentSelect+studentFrom+' AND c.Id=@Id')
 return r.recordset[0]||null
}
const lecturerSelect='c.Id id,c.CourseClassCode code,sub.Code subjectCode,sub.Name subjectName,sub.Credits credits,sub.Description subjectDescription,sem.Name semesterName,sem.Code semesterCode,sem.StartDate semesterStartDate,sem.EndDate semesterEndDate,ay.Name academicYearName,c.Status status,c.IsActive isActive,c.MaxStudents maxStudents,(SELECT COUNT(*) FROM CourseClassEnrollments e WHERE e.CourseClassId=c.Id AND e.IsActive=1 AND e.DeletedAt IS NULL) studentCount'
const lecturerFrom=' FROM CourseClasses c JOIN Subjects sub ON sub.Id=c.SubjectId JOIN Semesters sem ON sem.Id=c.SemesterId JOIN AcademicYears ay ON ay.Id=sem.AcademicYearId WHERE c.LecturerId=@Uid AND c.DeletedAt IS NULL'
export async function listLecturerClasses(uid,{page,pageSize,search,status}){
 const pool=await poolPromise,pattern=search?'%'+search+'%':null,state=status||null,where=lecturerFrom+' AND (@Pattern IS NULL OR c.Code LIKE @Pattern OR sub.Name LIKE @Pattern) AND (@Status IS NULL OR c.Status=@Status)',bind=r=>r.input('Uid',sql.Int,uid).input('Pattern',sql.NVarChar(202),pattern).input('Status',sql.NVarChar(30),state)
 const items=await bind(pool.request()).input('Offset',sql.Int,(page-1)*pageSize).input('PageSize',sql.Int,pageSize).query('SELECT '+lecturerSelect+where+' ORDER BY ay.StartDate DESC,sem.StartDate DESC,c.Code OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY')
 const total=await bind(pool.request()).query('SELECT COUNT(*) total'+where);return{items:items.recordset,total:total.recordset[0].total}
}
export async function findLecturerClass(uid,id){const pool=await poolPromise,r=await pool.request().input('Uid',sql.Int,uid).input('Id',sql.Int,id).query('SELECT '+lecturerSelect+lecturerFrom+' AND c.Id=@Id');return r.recordset[0]||null}
