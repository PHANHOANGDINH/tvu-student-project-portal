import 'dotenv/config';
import { hashPassword } from '../utils/password.util.js';

if (String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production') {
  throw new Error('seed:demo is disabled when NODE_ENV=production.');
}

const passwords = {
  lecturer: process.env.DEMO_LECTURER_PASSWORD,
  student: process.env.DEMO_STUDENT_PASSWORD,
};
for (const [role, password] of Object.entries(passwords)) {
  if (!password) throw new Error(`Missing DEMO_${role.toUpperCase()}_PASSWORD.`);
}

const demoUsers = [
  { key: 'lecturer1', passwordKey: 'lecturer', email: 'thiennhd@tvu.edu.vn', code: 'GV001', name: 'ThS. Nguyễn Hoàng Duy Thiện', role: 'LECTURER' },
  { key: 'lecturer2', passwordKey: 'lecturer', email: 'annb@tvu.edu.vn', code: 'GV002', name: 'TS. Nguyễn Bảo Ân', role: 'LECTURER' },
  { key: 'student1', passwordKey: 'student', email: 'sv001@tvu.edu.vn', code: 'SV001', name: 'Sinh viên Demo 01', role: 'STUDENT' },
  { key: 'student2', passwordKey: 'student', email: 'sv002@tvu.edu.vn', code: 'SV002', name: 'Sinh viên Demo 02', role: 'STUDENT' },
  { key: 'student3', passwordKey: 'student', email: 'sv003@tvu.edu.vn', code: 'SV003', name: 'Sinh viên Demo 03', role: 'STUDENT' },
];
const hashes = {
  lecturer: await hashPassword(passwords.lecturer),
  student: await hashPassword(passwords.student),
};

const { poolPromise, sql } = await import('../config/db.js');
const pool = await poolPromise;
const transaction = new sql.Transaction(pool);
const request = () => new sql.Request(transaction);
async function one(query, inputs = []) {
  const req = request();
  for (const [name, type, value] of inputs) req.input(name, type, value);
  return (await req.query(query)).recordset[0];
}

try {
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  const cleanup = await request().query(`
    SET XACT_ABORT ON;
    SELECT Id INTO #SmokeUsers FROM Users
    WHERE Email LIKE 'smoke.%@example.test' OR UserCode LIKE 'SMK%'
       OR FullName LIKE '%Smoke%' OR FullName LIKE '%E2E test%';

    SELECT Id INTO #TestClasses FROM Classes
    WHERE (ClassCode LIKE 'SMK%' OR ClassCode LIKE '%SMOKE%' OR ClassCode LIKE '%DEMO%'
        OR ClassName LIKE 'SMK%' OR ClassName LIKE '%SMOKE%' OR ClassName LIKE '%DEMO%')
      AND (Id <> 1 OR ClassCode LIKE 'SMK%' OR ClassCode LIKE '%SMOKE%' OR ClassCode LIKE '%DEMO%'
                   OR ClassName LIKE 'SMK%' OR ClassName LIKE '%SMOKE%' OR ClassName LIKE '%DEMO%');
    SELECT Id INTO #TestCourseClasses FROM CourseClasses
    WHERE (Code LIKE 'SMK%' OR Code LIKE '%SMOKE%' OR Code LIKE '%DEMO%')
      AND (Id <> 1 OR Code LIKE 'SMK%' OR Code LIKE '%SMOKE%' OR Code LIKE '%DEMO%');
    SELECT Id INTO #TestTopicRounds FROM TopicRegistrationRounds
    WHERE ClassId IN (SELECT Id FROM #TestCourseClasses);

    SELECT DISTINCT g.Id INTO #TestGroups FROM StudentGroups g
    LEFT JOIN GroupMembers gm ON gm.GroupId=g.Id
    WHERE g.ClassId IN (SELECT Id FROM #TestClasses) OR g.ClassId IN (SELECT Id FROM #TestCourseClasses) OR g.LeaderId IN (SELECT Id FROM #SmokeUsers)
       OR gm.StudentId IN (SELECT Id FROM #SmokeUsers) OR g.Name LIKE '%Smoke%'
       OR g.Name LIKE '%E2E test%' OR g.Name LIKE 'SMK%' OR g.Name LIKE '%DEMO%';
    SELECT Id INTO #TestTopics FROM TopicRegistrations
    WHERE GroupId IN (SELECT Id FROM #TestGroups) OR ClassId IN (SELECT Id FROM #TestClasses) OR ClassId IN (SELECT Id FROM #TestCourseClasses)
       OR RoundId IN (SELECT Id FROM #TestTopicRounds)
       OR ReviewedBy IN (SELECT Id FROM #SmokeUsers) OR Title LIKE '%Smoke%'
       OR Title LIKE '%E2E test%' OR Title LIKE 'SMK%' OR Title LIKE '%DEMO%';
    SELECT Id INTO #TestRequirements FROM SubmissionRequirements
    WHERE ClassId IN (SELECT Id FROM #TestClasses) OR ClassId IN (SELECT Id FROM #TestCourseClasses) OR CreatedBy IN (SELECT Id FROM #SmokeUsers)
       OR Title LIKE '%Smoke%' OR Title LIKE '%E2E test%' OR Title LIKE 'SMK%' OR Title LIKE '%DEMO%';
    SELECT DISTINCT s.Id INTO #TestSubmissions FROM Submissions s
    LEFT JOIN SubmissionAttempts a ON a.SubmissionId=s.Id
    WHERE s.GroupId IN (SELECT Id FROM #TestGroups) OR s.RequirementId IN (SELECT Id FROM #TestRequirements)
       OR a.SubmittedBy IN (SELECT Id FROM #SmokeUsers);
    SELECT Id INTO #TestProjects FROM Projects
    WHERE TeacherId IN (SELECT Id FROM #SmokeUsers) OR ClassId IN (SELECT Id FROM #TestClasses)
       OR Title LIKE '%Smoke%' OR Title LIKE '%E2E test%' OR Title LIKE 'SMK%' OR Title LIKE '%DEMO%';

    DECLARE @Deleted TABLE(Entity NVARCHAR(80),DeletedCount INT);
    DELETE Notifications WHERE UserId IN (SELECT Id FROM #SmokeUsers)
      OR (RelatedEntityType='TOPIC_REGISTRATION' AND RelatedEntityId IN (SELECT Id FROM #TestTopics))
      OR (RelatedEntityType='SUBMISSION' AND RelatedEntityId IN (SELECT Id FROM #TestSubmissions))
      OR Title LIKE '%Smoke%' OR Title LIKE '%E2E test%' OR EventKey LIKE 'SMK%';
    INSERT @Deleted VALUES('Notifications',@@ROWCOUNT);
    DELETE CriterionScores WHERE GradeId IN (SELECT Id FROM Grades WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions)); INSERT @Deleted VALUES('CriterionScores',@@ROWCOUNT);
    DELETE Grades WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions) OR GradedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('Grades',@@ROWCOUNT);
    DELETE Feedback WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions) OR CreatedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('Feedback',@@ROWCOUNT);
    DELETE SubmissionReviewHistory WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions) OR ActorId IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('SubmissionReviewHistory',@@ROWCOUNT);
    DELETE SubmissionItemResponses
    WHERE SubmissionAttemptId IN (SELECT Id FROM SubmissionAttempts WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions))
       OR SubmissionFileId IN (
         SELECT Id FROM SubmissionFiles
         WHERE SubmissionAttemptId IN (SELECT Id FROM SubmissionAttempts WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions))
            OR UploadedBy IN (SELECT Id FROM #SmokeUsers)
       )
       OR RequiredSubmissionItemId IN (SELECT Id FROM RequiredSubmissionItems WHERE RequirementId IN (SELECT Id FROM #TestRequirements));
    INSERT @Deleted VALUES('SubmissionItemResponses',@@ROWCOUNT);
    DELETE SubmissionLinks WHERE SubmissionAttemptId IN (SELECT Id FROM SubmissionAttempts WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions)); INSERT @Deleted VALUES('SubmissionLinks',@@ROWCOUNT);
    DELETE SubmissionFiles WHERE SubmissionAttemptId IN (SELECT Id FROM SubmissionAttempts WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions)) OR UploadedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('SubmissionFiles',@@ROWCOUNT);
    DELETE SubmissionHistory WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions) OR ActorId IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('SubmissionHistory',@@ROWCOUNT);
    DELETE SubmissionAttempts WHERE SubmissionId IN (SELECT Id FROM #TestSubmissions) OR SubmittedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('SubmissionAttempts',@@ROWCOUNT);
    DELETE Submissions WHERE Id IN (SELECT Id FROM #TestSubmissions); INSERT @Deleted VALUES('Submissions',@@ROWCOUNT);
    DELETE RequiredSubmissionItems WHERE RequirementId IN (SELECT Id FROM #TestRequirements); INSERT @Deleted VALUES('RequiredSubmissionItems',@@ROWCOUNT);
    DELETE SubmissionRounds WHERE RequirementId IN (SELECT Id FROM #TestRequirements); INSERT @Deleted VALUES('SubmissionRounds',@@ROWCOUNT);
    DELETE EvaluationCriteria WHERE RequirementId IN (SELECT Id FROM #TestRequirements); INSERT @Deleted VALUES('EvaluationCriteria',@@ROWCOUNT);
    DELETE SubmissionRequirements WHERE Id IN (SELECT Id FROM #TestRequirements); INSERT @Deleted VALUES('SubmissionRequirements',@@ROWCOUNT);
    DELETE TopicReviewHistory WHERE TopicRegistrationId IN (SELECT Id FROM #TestTopics) OR ReviewedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('TopicReviewHistory',@@ROWCOUNT);
    DELETE TopicRegistrations WHERE Id IN (SELECT Id FROM #TestTopics); INSERT @Deleted VALUES('TopicRegistrations',@@ROWCOUNT);
    DELETE TopicRegistrationRoundFiles WHERE RoundId IN (SELECT Id FROM #TestTopicRounds) OR UploadedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('TopicRegistrationRoundFiles',@@ROWCOUNT);
    DELETE TopicRegistrationRounds WHERE Id IN (SELECT Id FROM #TestTopicRounds); INSERT @Deleted VALUES('TopicRegistrationRounds',@@ROWCOUNT);
    DELETE GroupMembers WHERE GroupId IN (SELECT Id FROM #TestGroups) OR StudentId IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('GroupMembers',@@ROWCOUNT);
    DELETE StudentGroups WHERE Id IN (SELECT Id FROM #TestGroups); INSERT @Deleted VALUES('StudentGroups',@@ROWCOUNT);
    DELETE FinalSubmissions WHERE ProjectId IN (SELECT Id FROM #TestProjects) OR StudentId IN (SELECT Id FROM #SmokeUsers) OR ReviewedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('FinalSubmissions',@@ROWCOUNT);
    DELETE ProjectProgressReports WHERE ProjectId IN (SELECT Id FROM #TestProjects) OR StudentId IN (SELECT Id FROM #SmokeUsers) OR ReviewedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('ProjectProgressReports',@@ROWCOUNT);
    DELETE ProjectRegistrations WHERE ProjectId IN (SELECT Id FROM #TestProjects) OR StudentId IN (SELECT Id FROM #SmokeUsers) OR ReviewedBy IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('ProjectRegistrations',@@ROWCOUNT);
    DELETE Projects WHERE Id IN (SELECT Id FROM #TestProjects); INSERT @Deleted VALUES('Projects',@@ROWCOUNT);
    DELETE CourseClassEnrollments WHERE StudentId IN (SELECT Id FROM #SmokeUsers) OR CourseClassId IN (SELECT Id FROM #TestCourseClasses); INSERT @Deleted VALUES('CourseClassEnrollments',@@ROWCOUNT);
    DELETE StudentClassMembers WHERE StudentId IN (SELECT Id FROM #SmokeUsers) OR ClassId IN (SELECT Id FROM #TestClasses); INSERT @Deleted VALUES('StudentClassMembers',@@ROWCOUNT);
    IF EXISTS(SELECT 1 FROM Classes WHERE AdvisorTeacherId IN (SELECT Id FROM #SmokeUsers) AND Id NOT IN (SELECT Id FROM #TestClasses)) THROW 51001,'Smoke lecturer is assigned to an unmarked class.',1;
    IF EXISTS(SELECT 1 FROM CourseClasses WHERE LecturerId IN (SELECT Id FROM #SmokeUsers) AND Id NOT IN (SELECT Id FROM #TestCourseClasses)) THROW 51002,'Smoke lecturer is assigned to an unmarked course class.',1;
    DELETE CourseClasses WHERE Id IN (SELECT Id FROM #TestCourseClasses); INSERT @Deleted VALUES('CourseClasses',@@ROWCOUNT);
    DELETE Classes WHERE Id IN (SELECT Id FROM #TestClasses); INSERT @Deleted VALUES('Classes',@@ROWCOUNT);
    DELETE Users WHERE Id IN (SELECT Id FROM #SmokeUsers); INSERT @Deleted VALUES('Users',@@ROWCOUNT);
    DELETE s FROM Semesters s WHERE (s.Code LIKE 'SMK%' OR s.Code LIKE '%SMOKE%' OR s.Code LIKE '%DEMO%' OR s.Name LIKE 'SMK%' OR s.Name LIKE '%SMOKE%' OR s.Name LIKE '%DEMO%') AND NOT EXISTS(SELECT 1 FROM CourseClasses c WHERE c.SemesterId=s.Id); INSERT @Deleted VALUES('Semesters',@@ROWCOUNT);
    DELETE s FROM Subjects s WHERE (s.Code LIKE 'SMK%' OR s.Code LIKE '%SMOKE%' OR s.Code LIKE '%DEMO%' OR s.Name LIKE 'SMK%' OR s.Name LIKE '%SMOKE%' OR s.Name LIKE '%DEMO%') AND NOT EXISTS(SELECT 1 FROM CourseClasses c WHERE c.SubjectId=s.Id); INSERT @Deleted VALUES('Subjects',@@ROWCOUNT);
    DELETE ay FROM AcademicYears ay WHERE (ay.Name LIKE 'SMK%' OR ay.Name LIKE '%SMOKE%' OR ay.Name LIKE '%DEMO%') AND NOT EXISTS(SELECT 1 FROM Semesters s WHERE s.AcademicYearId=ay.Id); INSERT @Deleted VALUES('AcademicYears',@@ROWCOUNT);
    SELECT Entity,DeletedCount FROM @Deleted WHERE DeletedCount>0 ORDER BY Entity;
  `);

  const userIds = {};
  for (const user of demoUsers) {
    const row = await one(`
      MERGE Users WITH(HOLDLOCK) target USING(SELECT @Email Email) source ON target.Email=source.Email
      WHEN MATCHED THEN UPDATE SET FullName=@FullName,UserCode=@UserCode,Role=@Role,PasswordHash=@PasswordHash,IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
      WHEN NOT MATCHED THEN INSERT(FullName,Email,PasswordHash,Role,IsActive,UserCode) VALUES(@FullName,@Email,@PasswordHash,@Role,1,@UserCode)
      OUTPUT INSERTED.Id id;`, [
      ['Email',sql.NVarChar(150),user.email],['FullName',sql.NVarChar(100),user.name],
      ['UserCode',sql.NVarChar(50),user.code],['Role',sql.NVarChar(20),user.role],
      ['PasswordHash',sql.NVarChar(255),hashes[user.passwordKey]],
    ]);
    userIds[user.key]=row.id;
  }

  const year = await one(`
    MERGE AcademicYears WITH(HOLDLOCK) target USING(SELECT @Name Name) source ON target.Name=source.Name
    WHEN MATCHED THEN UPDATE SET StartDate=@StartDate,EndDate=@EndDate,IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT(Name,StartDate,EndDate,IsActive) VALUES(@Name,@StartDate,@EndDate,1)
    OUTPUT INSERTED.Id id;`, [['Name',sql.NVarChar(50),'2026-2027'],['StartDate',sql.Date,'2026-08-01'],['EndDate',sql.Date,'2027-07-31']]);
  const semester = await one(`
    MERGE Semesters WITH(HOLDLOCK) target USING(SELECT @Code Code) source ON target.Code=source.Code
    WHEN MATCHED THEN UPDATE SET AcademicYearId=@YearId,Name=@Name,StartDate=@StartDate,EndDate=@EndDate,IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT(AcademicYearId,Name,Code,StartDate,EndDate,IsActive) VALUES(@YearId,@Name,@Code,@StartDate,@EndDate,1)
    OUTPUT INSERTED.Id id;`, [['YearId',sql.Int,year.id],['Name',sql.NVarChar(100),'Học kỳ 1 Demo'],['Code',sql.NVarChar(30),'HK1_DEMO'],['StartDate',sql.Date,'2026-08-01'],['EndDate',sql.Date,'2026-12-31']]);
  const subject = await one(`
    MERGE Subjects WITH(HOLDLOCK) target USING(SELECT @Code Code) source ON target.Code=source.Code
    WHEN MATCHED THEN UPDATE SET Name=@Name,Credits=3,Description=@Description,IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT(Code,Name,Credits,Description,IsActive) VALUES(@Code,@Name,3,@Description,1)
    OUTPUT INSERTED.Id id;`, [['Code',sql.NVarChar(50),'CNPM_DEMO'],['Name',sql.NVarChar(200),'Công nghệ phần mềm'],['Description',sql.NVarChar(sql.MAX),'Dữ liệu demo phục vụ kiểm tra thủ công.']]);
  const courseClass = await one(`
    MERGE CourseClasses WITH(HOLDLOCK) target USING(SELECT @Code Code) source ON target.Code=source.Code
    WHEN MATCHED THEN UPDATE SET SubjectId=@SubjectId,SemesterId=@SemesterId,LecturerId=@LecturerId,MaxStudents=30,Status='ACTIVE',IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT(Code,SubjectId,SemesterId,LecturerId,MaxStudents,Status,IsActive) VALUES(@Code,@SubjectId,@SemesterId,@LecturerId,30,'ACTIVE',1)
    OUTPUT INSERTED.Id id;`, [['Code',sql.NVarChar(50),'CNPM_DEMO_01'],['SubjectId',sql.Int,subject.id],['SemesterId',sql.Int,semester.id],['LecturerId',sql.Int,userIds.lecturer1]]);
  for (const studentId of [userIds.student1,userIds.student2]) {
    await one(`MERGE CourseClassEnrollments WITH(HOLDLOCK) target USING(SELECT @ClassId CourseClassId,@StudentId StudentId) source ON target.CourseClassId=source.CourseClassId AND target.StudentId=source.StudentId WHEN MATCHED THEN UPDATE SET IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME() WHEN NOT MATCHED THEN INSERT(CourseClassId,StudentId,IsActive) VALUES(@ClassId,@StudentId,1) OUTPUT INSERTED.Id id;`, [['ClassId',sql.Int,courseClass.id],['StudentId',sql.Int,studentId]]);
  }

  const crossClass = await one(`
    MERGE CourseClasses WITH(HOLDLOCK) target USING(SELECT @Code Code) source ON target.Code=source.Code
    WHEN MATCHED THEN UPDATE SET SubjectId=@SubjectId,SemesterId=@SemesterId,LecturerId=@LecturerId,MaxStudents=30,Status='ACTIVE',IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT(Code,SubjectId,SemesterId,LecturerId,MaxStudents,Status,IsActive) VALUES(@Code,@SubjectId,@SemesterId,@LecturerId,30,'ACTIVE',1)
    OUTPUT INSERTED.Id id;`, [['Code',sql.NVarChar(50),'CNPM_DEMO_02'],['SubjectId',sql.Int,subject.id],['SemesterId',sql.Int,semester.id],['LecturerId',sql.Int,userIds.lecturer2]]);
  await one(`MERGE CourseClassEnrollments WITH(HOLDLOCK) target USING(SELECT @ClassId CourseClassId,@StudentId StudentId) source ON target.CourseClassId=source.CourseClassId AND target.StudentId=source.StudentId WHEN MATCHED THEN UPDATE SET IsActive=1,DeletedAt=NULL,UpdatedAt=SYSDATETIME() WHEN NOT MATCHED THEN INSERT(CourseClassId,StudentId,IsActive) VALUES(@ClassId,@StudentId,1) OUTPUT INSERTED.Id id;`, [['ClassId',sql.Int,crossClass.id],['StudentId',sql.Int,userIds.student3]]);

  const group = await one(`
    MERGE StudentGroups WITH(HOLDLOCK) target USING(SELECT @ClassId ClassId,@Name Name) source ON target.ClassId=source.ClassId AND target.Name=source.Name
    WHEN MATCHED THEN UPDATE SET LeaderId=@LeaderId,MaxMembers=5,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT(ClassId,Name,LeaderId,MaxMembers) VALUES(@ClassId,@Name,@LeaderId,5)
    OUTPUT INSERTED.Id id;`, [['ClassId',sql.Int,courseClass.id],['Name',sql.NVarChar(150),'Nhóm SV001 - SV002'],['LeaderId',sql.Int,userIds.student1]]);
  for (const studentId of [userIds.student1,userIds.student2]) {
    await one(`MERGE GroupMembers WITH(HOLDLOCK) target USING(SELECT @GroupId GroupId,@StudentId StudentId) source ON target.GroupId=source.GroupId AND target.StudentId=source.StudentId WHEN MATCHED THEN UPDATE SET ClassId=@ClassId,DeletedAt=NULL WHEN NOT MATCHED THEN INSERT(GroupId,ClassId,StudentId) VALUES(@GroupId,@ClassId,@StudentId) OUTPUT INSERTED.Id id;`, [['GroupId',sql.Int,group.id],['ClassId',sql.Int,courseClass.id],['StudentId',sql.Int,studentId]]);
  }
  const topic = await one(`
    MERGE TopicRegistrations WITH(HOLDLOCK) target USING(SELECT @GroupId GroupId) source ON target.GroupId=source.GroupId
    WHEN MATCHED THEN UPDATE SET ClassId=@ClassId,Title=@Title,Description=@Description,Technologies=@Technologies,Objectives=@Objectives,Status='PENDING',ReviewedBy=NULL,ReviewedAt=NULL,ReviewComment=NULL,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT(GroupId,ClassId,Title,Description,Technologies,Objectives,Status) VALUES(@GroupId,@ClassId,@Title,@Description,@Technologies,@Objectives,'PENDING')
    OUTPUT INSERTED.Id id;`, [['GroupId',sql.Int,group.id],['ClassId',sql.Int,courseClass.id],['Title',sql.NVarChar(250),'Đề tài Demo - Cổng quản lý dự án sinh viên'],['Description',sql.NVarChar(sql.MAX),'Đề tài demo ở trạng thái chờ duyệt.'],['Technologies',sql.NVarChar(500),'Node.js, React, SQL Server'],['Objectives',sql.NVarChar(sql.MAX),'Kiểm tra thủ công luồng nhóm và đăng ký đề tài.']]);
  const requirement = await one(`
    MERGE SubmissionRequirements WITH(HOLDLOCK) target USING(SELECT @ClassId ClassId,@Title Title) source ON target.ClassId=source.ClassId AND target.Title=source.Title
    WHEN MATCHED THEN UPDATE SET Description=@Description,Instructions=@Instructions,AllowLate=0,AllowResubmission=1,MaxAttempts=3,MaxFileSizeMb=20,CreatedBy=@CreatedBy,DeletedAt=NULL,UpdatedAt=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT(ClassId,Title,Description,Instructions,AllowLate,AllowResubmission,MaxAttempts,MaxFileSizeMb,CreatedBy) VALUES(@ClassId,@Title,@Description,@Instructions,0,1,3,20,@CreatedBy)
    OUTPUT INSERTED.Id id;`, [['ClassId',sql.Int,courseClass.id],['Title',sql.NVarChar(200),'Yêu cầu nộp Demo'],['Description',sql.NVarChar(sql.MAX),'Nộp báo cáo demo cho kiểm tra thủ công.'],['Instructions',sql.NVarChar(sql.MAX),'Chưa cần tạo bài nộp.'],['CreatedBy',sql.Int,userIds.lecturer1]]);
  await one(`MERGE SubmissionRounds WITH(HOLDLOCK) target USING(SELECT @Id RequirementId) source ON target.RequirementId=source.RequirementId WHEN MATCHED THEN UPDATE SET StartAt=DATEADD(day,-1,SYSDATETIME()),Deadline=DATEADD(day,30,SYSDATETIME()),Status='OPEN',UpdatedAt=SYSDATETIME() WHEN NOT MATCHED THEN INSERT(RequirementId,StartAt,Deadline,Status) VALUES(@Id,DATEADD(day,-1,SYSDATETIME()),DATEADD(day,30,SYSDATETIME()),'OPEN') OUTPUT INSERTED.Id id;`, [['Id',sql.Int,requirement.id]]);
  await one(`MERGE RequiredSubmissionItems WITH(HOLDLOCK) target USING(SELECT @Id RequirementId,'REPORT' ItemType) source ON target.RequirementId=source.RequirementId AND target.ItemType=source.ItemType WHEN MATCHED THEN UPDATE SET Description=@Description WHEN NOT MATCHED THEN INSERT(RequirementId,ItemType,Description) VALUES(@Id,'REPORT',@Description) OUTPUT INSERTED.Id id;`, [['Id',sql.Int,requirement.id],['Description',sql.NVarChar(300),'Báo cáo PDF demo']]);

  await transaction.commit();
  console.log(JSON.stringify({deleted:cleanup.recordset,created:{users:userIds,academicYearId:year.id,semesterId:semester.id,subjectId:subject.id,courseClassId:courseClass.id,crossClassId:crossClass.id,groupId:group.id,topicId:topic.id,requirementId:requirement.id}},null,2));
} catch (error) {
  try { await transaction.rollback(); } catch { /* already rolled back */ }
  throw error;
} finally {
  await pool.close();
}
