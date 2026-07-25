import 'dotenv/config'
import sql from 'mssql'

const config={
  user:process.env.DB_USER,password:process.env.DB_PASSWORD,
  server:process.env.DB_SERVER||'localhost',database:process.env.DB_DATABASE,
  port:Number(process.env.DB_PORT)||1433,
  options:{encrypt:false,trustServerCertificate:true},
}
const pool=await sql.connect(config)
const transaction=new sql.Transaction(pool)
try {
  await transaction.begin()
  const request=()=>new sql.Request(transaction)
  const resolve=async(courseCode,userCode)=>{
    const result=await request().input('CourseCode',sql.NVarChar(50),courseCode)
      .input('UserCode',sql.NVarChar(50),userCode).query(`SELECT c.Id courseClassId,u.Id lecturerId
        FROM CourseClasses c CROSS JOIN Users u
        WHERE c.Code=@CourseCode AND c.DeletedAt IS NULL
          AND u.UserCode=@UserCode AND u.Role='LECTURER' AND u.IsActive=1 AND u.DeletedAt IS NULL`)
    if(!result.recordset[0])throw new Error(`Không tìm thấy ${courseCode}/${userCode}`)
    return result.recordset[0]
  }
  const demoClasses=[['CNPM_DEMO_01','GV001'],['CNPM_DEMO_02','GV002']]
  for(const [courseCode,primaryCode] of demoClasses){
    await request().input('CourseCode',sql.NVarChar(50),courseCode).input('PrimaryCode',sql.NVarChar(50),primaryCode)
      .query(`DECLARE @SubjectId INT=(SELECT TOP 1 Id FROM Subjects WHERE Code='220055' AND DeletedAt IS NULL);
        DECLARE @SemesterId INT=(SELECT TOP 1 Id FROM Semesters WHERE Code='HK1' AND DeletedAt IS NULL);
        DECLARE @LecturerId INT=(SELECT TOP 1 Id FROM Users WHERE UserCode=@PrimaryCode AND Role='LECTURER' AND DeletedAt IS NULL);
        IF @SubjectId IS NULL OR @SemesterId IS NULL OR @LecturerId IS NULL THROW 51060,'Missing canonical demo references.',1;
        IF NOT EXISTS(SELECT 1 FROM CourseClasses WHERE Code=@CourseCode AND DeletedAt IS NULL)
          INSERT CourseClasses(Code,SubjectId,SemesterId,LecturerId,MaxStudents,Status,IsActive)
          VALUES(@CourseCode,@SubjectId,@SemesterId,@LecturerId,30,'ACTIVE',1);`)
  }
  const assignments=[
    ['CNPM_DEMO_01','GV001','PRIMARY'],
    ['CNPM_DEMO_01','GV002','CO_LECTURER'],
    ['CNPM_DEMO_02','GV002','PRIMARY'],
  ]
  for(const [courseCode,userCode,role] of assignments){
    const item=await resolve(courseCode,userCode)
    await request().input('ClassId',sql.Int,item.courseClassId).input('LecturerId',sql.Int,item.lecturerId)
      .input('Role',sql.NVarChar(20),role).query(`MERGE CourseClassLecturers WITH(HOLDLOCK) target
        USING(SELECT @ClassId CourseClassId,@LecturerId LecturerId) source
        ON target.CourseClassId=source.CourseClassId AND target.LecturerId=source.LecturerId
        WHEN MATCHED THEN UPDATE SET AssignmentRole=@Role,IsActive=1,UpdatedAt=SYSDATETIME()
        WHEN NOT MATCHED THEN INSERT(CourseClassId,LecturerId,AssignmentRole,IsActive)
          VALUES(@ClassId,@LecturerId,@Role,1);`)
  }
  await transaction.commit()
  console.log('CourseClassLecturers demo seed completed.')
} catch(error) {
  if(transaction._aborted!==true)await transaction.rollback().catch(()=>null)
  throw error
} finally {
  await pool.close()
}
