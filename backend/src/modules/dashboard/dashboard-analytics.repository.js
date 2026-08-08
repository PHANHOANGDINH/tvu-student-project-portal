import { poolPromise, sql } from '../../config/db.js';

const rows = result => result.recordset;
const requestWithFilters = async (filters = {}, userId) => {
  const pool = await poolPromise;
  const request = pool.request();
  if (userId) request.input('Uid', sql.Int, userId);
  request.input('CourseClassId', sql.Int, filters.courseClassId || null);
  request.input('AcademicYearId', sql.Int, filters.academicYearId || null);
  request.input('SemesterId', sql.Int, filters.semesterId || null);
  request.input('DateFrom', sql.DateTime2, filters.dateFrom ? new Date(filters.dateFrom) : null);
  request.input('DateTo', sql.DateTime2, filters.dateTo ? new Date(filters.dateTo) : null);
  return request;
};

export async function adminDataset(name, filters) {
  const request = await requestWithFilters(filters);
  const queries = {
    summary: `SELECT (SELECT COUNT(*) FROM Users WHERE DeletedAt IS NULL) totalAccounts,(SELECT COUNT(*) FROM Users WHERE Role='STUDENT' AND DeletedAt IS NULL) totalStudents,(SELECT COUNT(*) FROM Users WHERE Role='LECTURER' AND DeletedAt IS NULL) totalLecturers,(SELECT COUNT(*) FROM CourseClasses WHERE DeletedAt IS NULL) totalCourseClasses,(SELECT COUNT(*) FROM StudentGroups WHERE DeletedAt IS NULL) totalGroups,(SELECT COUNT(*) FROM TopicRegistrations WHERE DeletedAt IS NULL) totalTopics`,
    accountsByRole: `SELECT Role label,COUNT(*) value FROM Users WHERE DeletedAt IS NULL GROUP BY Role ORDER BY Role`,
    courseClassesBySemester: `SELECT CONCAT(ay.Name,' · ',s.Name) label,COUNT(*) value FROM CourseClasses c JOIN Semesters s ON s.Id=c.SemesterId JOIN AcademicYears ay ON ay.Id=s.AcademicYearId WHERE c.DeletedAt IS NULL AND (@AcademicYearId IS NULL OR ay.Id=@AcademicYearId) GROUP BY ay.Name,s.Name,s.StartDate ORDER BY s.StartDate`,
    studentsByFaculty: `SELECT f.FacultyName label,COUNT(DISTINCT scm.StudentId) value FROM Faculties f LEFT JOIN Classes cl ON cl.FacultyId=f.Id AND cl.DeletedAt IS NULL LEFT JOIN StudentClassMembers scm ON scm.ClassId=cl.Id AND scm.DeletedAt IS NULL WHERE f.DeletedAt IS NULL GROUP BY f.FacultyName ORDER BY value DESC`,
    topicsByStatus: `SELECT Status label,COUNT(*) value FROM TopicRegistrations WHERE DeletedAt IS NULL GROUP BY Status ORDER BY Status`,
    submissionsOverTime: `SELECT CONVERT(char(7),a.SubmittedAt,126) label,COUNT(*) value FROM SubmissionAttempts a WHERE (@DateFrom IS NULL OR a.SubmittedAt>=@DateFrom) AND (@DateTo IS NULL OR a.SubmittedAt<DATEADD(day,1,@DateTo)) GROUP BY CONVERT(char(7),a.SubmittedAt,126) ORDER BY label`,
    courseClassesByCourse: `SELECT TOP 10 CONCAT(s.Code,' · ',s.Name) label,COUNT(*) value FROM CourseClasses c JOIN Subjects s ON s.Id=c.SubjectId WHERE c.DeletedAt IS NULL GROUP BY s.Code,s.Name ORDER BY value DESC`,
    recentActivities: `SELECT TOP 10 Id id,FullName title,Role status,CreatedAt createdAt FROM Users WHERE DeletedAt IS NULL ORDER BY CreatedAt DESC`
  };
  const result = await request.query(queries[name]);
  return name === 'summary' ? result.recordset[0] : rows(result);
}

export async function lecturerDataset(name, filters, userId) {
  const request = await requestWithFilters(filters, userId);
  const scope = `c.LecturerId=@Uid AND c.DeletedAt IS NULL AND (@CourseClassId IS NULL OR c.Id=@CourseClassId)`;
  const queries = {
    summary: `SELECT (SELECT COUNT(*) FROM CourseClasses c WHERE ${scope}) classes,(SELECT COUNT(*) FROM StudentGroups g JOIN CourseClasses c ON c.Id=g.ClassId WHERE ${scope} AND g.DeletedAt IS NULL) groups,(SELECT COUNT(*) FROM TopicRegistrations t JOIN CourseClasses c ON c.Id=t.ClassId WHERE ${scope} AND t.Status='PENDING' AND t.DeletedAt IS NULL) topicsPending,(SELECT COUNT(*) FROM Submissions s JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE ${scope} AND s.Status='REQUIRES_REVISION') progressWaiting,(SELECT COUNT(*) FROM Submissions s JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE ${scope} AND s.Status IN('SUBMITTED','LATE','RESUBMITTED','UNDER_REVIEW')) waitingGrade`,
    groupProgress: `SELECT CONCAT(c.Code,' · ',g.Name) label,CAST(CASE WHEN COUNT(r.Id)=0 THEN 0 ELSE 100.0*COUNT(CASE WHEN s.Status='GRADED' THEN 1 END)/COUNT(r.Id) END AS decimal(5,1)) value,c.Id courseClassId FROM StudentGroups g JOIN CourseClasses c ON c.Id=g.ClassId LEFT JOIN SubmissionRequirements r ON r.ClassId=c.Id AND r.DeletedAt IS NULL LEFT JOIN Submissions s ON s.RequirementId=r.Id AND s.GroupId=g.Id WHERE ${scope} AND g.DeletedAt IS NULL GROUP BY c.Id,c.Code,g.Id,g.Name ORDER BY c.Code,g.Name`,
    submissionsByStatus: `SELECT s.Status label,COUNT(*) value FROM Submissions s JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE ${scope} GROUP BY s.Status ORDER BY s.Status`,
    topicsByStatus: `SELECT t.Status label,COUNT(*) value FROM TopicRegistrations t JOIN CourseClasses c ON c.Id=t.ClassId WHERE ${scope} AND t.DeletedAt IS NULL GROUP BY t.Status ORDER BY t.Status`,
    submissionsOverTime: `SELECT CONVERT(char(10),DATEADD(day,1-DATEPART(weekday,a.SubmittedAt),CAST(a.SubmittedAt AS date)),126) label,COUNT(*) value FROM SubmissionAttempts a JOIN Submissions sb ON sb.Id=a.SubmissionId JOIN SubmissionRequirements r ON r.Id=sb.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE ${scope} AND (@DateFrom IS NULL OR a.SubmittedAt>=@DateFrom) AND (@DateTo IS NULL OR a.SubmittedAt<DATEADD(day,1,@DateTo)) GROUP BY CONVERT(char(10),DATEADD(day,1-DATEPART(weekday,a.SubmittedAt),CAST(a.SubmittedAt AS date)),126) ORDER BY label`,
    gradeDistribution: `SELECT label,COUNT(*) value FROM (SELECT CASE WHEN 10.0*g.TotalScore/g.MaxScore<5 THEN N'Dưới 5' WHEN 10.0*g.TotalScore/g.MaxScore<6.5 THEN N'5–<6.5' WHEN 10.0*g.TotalScore/g.MaxScore<8 THEN N'6.5–<8' WHEN 10.0*g.TotalScore/g.MaxScore<9 THEN N'8–<9' ELSE N'9–10' END label FROM Grades g JOIN Submissions sb ON sb.Id=g.SubmissionId JOIN SubmissionRequirements r ON r.Id=sb.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE ${scope} AND g.IsPublished=1) d GROUP BY label`,
    milestoneCompletion: `SELECT r.Title label,COUNT(CASE WHEN s.Status='GRADED' THEN 1 END) completed,COUNT(g.Id)-COUNT(CASE WHEN s.Status='GRADED' THEN 1 END) remaining FROM SubmissionRequirements r JOIN CourseClasses c ON c.Id=r.ClassId JOIN StudentGroups g ON g.ClassId=c.Id AND g.DeletedAt IS NULL LEFT JOIN Submissions s ON s.RequirementId=r.Id AND s.GroupId=g.Id WHERE ${scope} AND r.DeletedAt IS NULL GROUP BY r.Id,r.Title ORDER BY r.Id`
  };
  return rows(await request.query(queries[name]));
}

export async function studentDataset(name, filters, userId) {
  const request = await requestWithFilters(filters, userId);
  const queries = {
    summary: `SELECT (SELECT COUNT(*) FROM CourseClassEnrollments WHERE StudentId=@Uid AND IsActive=1 AND DeletedAt IS NULL) classes,(SELECT COUNT(*) FROM SubmissionRequirements r JOIN SubmissionRounds sr ON sr.RequirementId=r.Id JOIN CourseClassEnrollments e ON e.CourseClassId=r.ClassId AND e.StudentId=@Uid AND e.IsActive=1 AND e.DeletedAt IS NULL WHERE r.DeletedAt IS NULL AND sr.Status='OPEN') openRequirements,(SELECT COUNT(*) FROM Notifications WHERE UserId=@Uid AND IsRead=0) newFeedback,(SELECT COUNT(*) FROM Submissions s JOIN GroupMembers gm ON gm.GroupId=s.GroupId AND gm.StudentId=@Uid AND gm.DeletedAt IS NULL WHERE s.Status='REQUIRES_REVISION') revisionRequired,(SELECT COUNT(*) FROM Grades g JOIN Submissions s ON s.Id=g.SubmissionId JOIN GroupMembers gm ON gm.GroupId=s.GroupId WHERE gm.StudentId=@Uid AND gm.DeletedAt IS NULL AND g.IsPublished=1) publishedGrades`,
    projectProgress: `SELECT r.Title label,CASE WHEN s.Status='GRADED' THEN 100 WHEN s.Status IN('SUBMITTED','LATE','RESUBMITTED','UNDER_REVIEW','REQUIRES_REVISION') THEN 60 ELSE 0 END value,s.Status status FROM GroupMembers gm JOIN StudentGroups g ON g.Id=gm.GroupId JOIN SubmissionRequirements r ON r.ClassId=g.ClassId AND r.DeletedAt IS NULL LEFT JOIN Submissions s ON s.RequirementId=r.Id AND s.GroupId=g.Id WHERE gm.StudentId=@Uid AND gm.DeletedAt IS NULL AND (@CourseClassId IS NULL OR g.ClassId=@CourseClassId) ORDER BY r.CreatedAt`,
    gradeCriteria: `SELECT ec.Name label,cs.Score value,ec.MaxScore maxValue FROM CriterionScores cs JOIN EvaluationCriteria ec ON ec.Id=cs.CriterionId JOIN Grades gr ON gr.Id=cs.GradeId JOIN Submissions s ON s.Id=gr.SubmissionId JOIN GroupMembers gm ON gm.GroupId=s.GroupId WHERE gm.StudentId=@Uid AND gm.DeletedAt IS NULL AND gr.IsPublished=1`,
    upcomingDeadlines: `SELECT TOP 8 r.Id id,r.Title title,c.Code classCode,sr.Deadline deadline FROM CourseClassEnrollments e JOIN CourseClasses c ON c.Id=e.CourseClassId JOIN SubmissionRequirements r ON r.ClassId=c.Id JOIN SubmissionRounds sr ON sr.RequirementId=r.Id WHERE e.StudentId=@Uid AND e.IsActive=1 AND e.DeletedAt IS NULL AND sr.Status='OPEN' AND sr.Deadline>=SYSDATETIME() AND (@CourseClassId IS NULL OR c.Id=@CourseClassId) ORDER BY sr.Deadline`,
    recentFeedback: `SELECT TOP 8 f.Id id,r.Title title,f.GeneralComment comment,f.RevisionRequired revisionRequired,f.UpdatedAt createdAt FROM Feedback f JOIN Submissions s ON s.Id=f.SubmissionId JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN GroupMembers gm ON gm.GroupId=s.GroupId WHERE gm.StudentId=@Uid AND gm.DeletedAt IS NULL ORDER BY COALESCE(f.UpdatedAt,f.CreatedAt) DESC`
  };
  const result = await request.query(queries[name]);
  return name === 'summary' ? result.recordset[0] : rows(result);
}
