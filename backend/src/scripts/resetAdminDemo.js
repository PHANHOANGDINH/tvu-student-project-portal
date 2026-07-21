import 'dotenv/config';
import { hashPassword } from '../utils/password.util.js';
import { poolPromise, sql } from '../config/db.js';

if (String(process.env.NODE_ENV||'').trim().toLowerCase()==='production') throw new Error('reset:admin-demo bị vô hiệu hóa trong production.');
if (String(process.env.DB_DATABASE||'')!=='TvuStudentProjectPortal') throw new Error('Chỉ được chạy trên database development TvuStudentProjectPortal.');
if (!['localhost','127.0.0.1','.','(local)'].includes(String(process.env.DB_SERVER||'').toLowerCase())) throw new Error('Database không phải local development.');
const adminPassword=process.env.DEMO_ADMIN_PASSWORD,lecturerPassword=process.env.DEMO_LECTURER_PASSWORD;
if(!adminPassword||!lecturerPassword)throw new Error('Thiếu DEMO_ADMIN_PASSWORD hoặc DEMO_LECTURER_PASSWORD.');
const [adminHash,lecturerHash]=await Promise.all([hashPassword(adminPassword),hashPassword(lecturerPassword)]);
const pool=await poolPromise,transaction=new sql.Transaction(pool);
try{
 await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
 const result=await new sql.Request(transaction).input('AdminHash',sql.NVarChar(255),adminHash).input('LecturerHash',sql.NVarChar(255),lecturerHash).query(`
  SET XACT_ABORT ON;
  DELETE FROM Notifications;
  DELETE FROM CriterionScores;
  DELETE FROM Grades;
  DELETE FROM Feedback;
  DELETE FROM SubmissionReviewHistory;
  DELETE FROM SubmissionFiles;
  DELETE FROM SubmissionLinks;
  DELETE FROM SubmissionHistory;
  DELETE FROM SubmissionAttempts;
  DELETE FROM Submissions;
  DELETE FROM EvaluationCriteria;
  DELETE FROM RequiredSubmissionItems;
  DELETE FROM SubmissionRounds;
  DELETE FROM SubmissionRequirements;
  DELETE FROM TopicReviewHistory;
  DELETE FROM TopicRegistrations;
  DELETE FROM GroupMembers;
  DELETE FROM StudentGroups;
  DELETE FROM CourseClassEnrollments;
  DELETE FROM FinalSubmissions;
  DELETE FROM ProjectProgressReports;
  DELETE FROM ProjectRegistrations;
  DELETE FROM Projects;
  DELETE FROM StudentClassMembers;
  UPDATE Classes SET AdvisorTeacherId=NULL,UpdatedAt=SYSDATETIME() WHERE AdvisorTeacherId IS NOT NULL;
  UPDATE CourseClasses SET LecturerId=NULL,UpdatedAt=SYSDATETIME() WHERE LecturerId IS NOT NULL;
  DELETE FROM Users;
  INSERT Users(FullName,Email,PasswordHash,Role,IsActive,UserCode) VALUES
   (N'Quản trị viên hệ thống',N'admin.demo@tvu.edu.vn',@AdminHash,N'ADMIN',1,N'AD001'),
   (N'ThS. Nguyễn Hoàng Duy Thiện',N'thiennhd@tvu.edu.vn',@LecturerHash,N'LECTURER',1,N'GV001'),
   (N'TS. Nguyễn Bảo Ân',N'annb@tvu.edu.vn',@LecturerHash,N'LECTURER',1,N'GV002');
  IF (SELECT COUNT(*) FROM Users)<>3 THROW 51100,N'Reset không tạo đúng 3 tài khoản.',1;
  IF EXISTS(SELECT 1 FROM Users WHERE Role NOT IN(N'ADMIN',N'LECTURER')) THROW 51101,N'Phát hiện role không hợp lệ.',1;
  SELECT Id id,Email email,UserCode userCode,Role role,IsActive isActive FROM Users ORDER BY Id;
 `);
 await transaction.commit();
 console.log(JSON.stringify({status:'RESET_ADMIN_DEMO_PASS',accounts:result.recordset},null,2));
}catch(error){try{await transaction.rollback();}catch{/* transaction đã rollback */}throw error;}finally{await pool.close();}
