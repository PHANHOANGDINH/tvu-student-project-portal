import { poolPromise, sql } from '../../config/db.js';

export async function admin() {
  const pool = await poolPromise;
  const stats = await pool.request().query(`SELECT
    (SELECT COUNT(*) FROM Users WHERE DeletedAt IS NULL) totalUsers,
    (SELECT COUNT(*) FROM Users WHERE Role='ADMIN' AND DeletedAt IS NULL) admins,
    (SELECT COUNT(*) FROM Users WHERE Role='LECTURER' AND DeletedAt IS NULL) lecturers,
    (SELECT COUNT(*) FROM Users WHERE Role='STUDENT' AND DeletedAt IS NULL) students,
    (SELECT COUNT(*) FROM AcademicYears) academicYears,
    (SELECT COUNT(*) FROM Semesters) semesters,
    (SELECT COUNT(*) FROM Subjects) subjects,
    (SELECT COUNT(*) FROM CourseClasses) classes,
    (SELECT COUNT(*) FROM StudentGroups WHERE DeletedAt IS NULL) groups,
    (SELECT COUNT(*) FROM TopicRegistrations WHERE DeletedAt IS NULL) topics,
    (SELECT COUNT(*) FROM TopicRegistrations WHERE Status='PENDING' AND DeletedAt IS NULL) topicsPending,
    (SELECT COUNT(*) FROM TopicRegistrations WHERE Status='APPROVED' AND DeletedAt IS NULL) topicsApproved,
    (SELECT COUNT(*) FROM TopicRegistrations WHERE Status='REJECTED' AND DeletedAt IS NULL) topicsRejected,
    (SELECT COUNT(*) FROM TopicRegistrations WHERE Status='REQUIRES_REVISION' AND DeletedAt IS NULL) topicsRevision,
    (SELECT COUNT(*) FROM SubmissionRequirements WHERE DeletedAt IS NULL) requirements,
    (SELECT COUNT(*) FROM Submissions) submissions,
    (SELECT COUNT(*) FROM SubmissionAttempts WHERE IsLate=0) onTime,
    (SELECT COUNT(*) FROM SubmissionAttempts WHERE IsLate=1) late,
    (SELECT COUNT(*) FROM Grades WHERE IsPublished=1) graded,
    (SELECT COUNT(*) FROM Submissions s WHERE NOT EXISTS(SELECT 1 FROM Grades g WHERE g.SubmissionId=s.Id AND g.IsPublished=1)) ungraded`);
  const activity = await pool.request().query(`SELECT TOP 10 s.Id id,'SUBMISSION' type,g.Name title,s.Status status,s.UpdatedAt createdAt
    FROM Submissions s JOIN StudentGroups g ON g.Id=s.GroupId
    WHERE s.UpdatedAt IS NOT NULL ORDER BY s.UpdatedAt DESC`);
  return { stats: stats.recordset[0], recentActivity: activity.recordset };
}

export async function lecturer(userId) {
  const pool = await poolPromise;
  const stats = await pool.request().input('Uid', sql.Int, userId).query(`SELECT
    (SELECT COUNT(*) FROM CourseClasses WHERE LecturerId=@Uid AND DeletedAt IS NULL) classes,
    (SELECT COUNT(*) FROM StudentGroups g JOIN CourseClasses c ON c.Id=g.ClassId WHERE c.LecturerId=@Uid AND g.DeletedAt IS NULL) groups,
    (SELECT COUNT(*) FROM TopicRegistrations t JOIN CourseClasses c ON c.Id=t.ClassId WHERE c.LecturerId=@Uid AND t.Status='PENDING' AND t.DeletedAt IS NULL) topicsPending,
    (SELECT COUNT(*) FROM SubmissionRequirements rq JOIN SubmissionRounds rr ON rr.RequirementId=rq.Id JOIN CourseClasses cc ON cc.Id=rq.ClassId JOIN StudentGroups gg ON gg.ClassId=rq.ClassId AND gg.DeletedAt IS NULL WHERE cc.LecturerId=@Uid AND rr.Status='OPEN' AND NOT EXISTS(SELECT 1 FROM Submissions ss WHERE ss.RequirementId=rq.Id AND ss.GroupId=gg.Id)) notSubmitted,
    (SELECT COUNT(*) FROM Submissions s JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE c.LecturerId=@Uid) submitted,
    (SELECT COUNT(*) FROM SubmissionAttempts a JOIN Submissions s ON s.Id=a.SubmissionId JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE c.LecturerId=@Uid AND a.IsLate=1) late,
    (SELECT COUNT(*) FROM Submissions s JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE c.LecturerId=@Uid AND s.Status IN('SUBMITTED','LATE','RESUBMITTED','UNDER_REVIEW')) waitingGrade,
    (SELECT COUNT(*) FROM Grades g JOIN Submissions s ON s.Id=g.SubmissionId JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId WHERE c.LecturerId=@Uid AND g.IsPublished=1) graded,
    (SELECT COUNT(*) FROM SubmissionRequirements r JOIN CourseClasses c ON c.Id=r.ClassId JOIN SubmissionRounds sr ON sr.RequirementId=r.Id WHERE c.LecturerId=@Uid AND sr.Status='OPEN') openRequirements`);
  const upcoming = await pool.request().input('Uid', sql.Int, userId).query(`SELECT TOP 8 r.Id id,r.Title title,c.Code classCode,sr.Deadline deadline
    FROM SubmissionRequirements r JOIN SubmissionRounds sr ON sr.RequirementId=r.Id JOIN CourseClasses c ON c.Id=r.ClassId
    WHERE c.LecturerId=@Uid AND sr.Status='OPEN' AND sr.Deadline>=SYSDATETIME() ORDER BY sr.Deadline`);
  const activity = await pool.request().input('Uid', sql.Int, userId).query(`SELECT TOP 10 s.Id id,g.Name title,s.Status status,s.UpdatedAt createdAt
    FROM Submissions s JOIN StudentGroups g ON g.Id=s.GroupId JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN CourseClasses c ON c.Id=r.ClassId
    WHERE c.LecturerId=@Uid ORDER BY s.UpdatedAt DESC`);
  return { stats: stats.recordset[0], upcoming: upcoming.recordset, recentActivity: activity.recordset };
}

export async function student(userId) {
  const pool = await poolPromise;
  const stats = await pool.request().input('Uid', sql.Int, userId).query(`SELECT
    (SELECT COUNT(*) FROM CourseClassEnrollments WHERE StudentId=@Uid AND IsActive=1 AND DeletedAt IS NULL) classes,
    (SELECT COUNT(*) FROM SubmissionRequirements r JOIN SubmissionRounds sr ON sr.RequirementId=r.Id JOIN CourseClassEnrollments enrollment ON enrollment.CourseClassId=r.ClassId AND enrollment.StudentId=@Uid AND enrollment.IsActive=1 AND enrollment.DeletedAt IS NULL WHERE sr.Status='OPEN') openRequirements,
    (SELECT COUNT(*) FROM Notifications WHERE UserId=@Uid AND IsRead=0) unread,
    (SELECT COUNT(*) FROM Submissions s JOIN GroupMembers gm ON gm.GroupId=s.GroupId AND gm.StudentId=@Uid AND gm.DeletedAt IS NULL WHERE s.Status='REQUIRES_REVISION') revisions,
    (SELECT COUNT(*) FROM Grades g JOIN Submissions s ON s.Id=g.SubmissionId JOIN GroupMembers gm ON gm.GroupId=s.GroupId AND gm.StudentId=@Uid AND gm.DeletedAt IS NULL WHERE g.IsPublished=1) publishedGrades`);
  const group = await pool.request().input('Uid', sql.Int, userId).query(`SELECT TOP 1 g.Id id,g.Name name,g.LeaderId leaderId,c.Code classCode,t.Status topicStatus,t.Title topicTitle
    FROM GroupMembers gm JOIN StudentGroups g ON g.Id=gm.GroupId JOIN CourseClasses c ON c.Id=g.ClassId LEFT JOIN TopicRegistrations t ON t.GroupId=g.Id AND t.DeletedAt IS NULL
    WHERE gm.StudentId=@Uid AND gm.DeletedAt IS NULL ORDER BY gm.JoinedAt DESC`);
  const upcoming = await pool.request().input('Uid', sql.Int, userId).query(`SELECT TOP 8 r.Id id,r.Title title,c.Code classCode,sr.Deadline deadline
    FROM SubmissionRequirements r JOIN SubmissionRounds sr ON sr.RequirementId=r.Id JOIN CourseClasses c ON c.Id=r.ClassId JOIN CourseClassEnrollments enrollment ON enrollment.CourseClassId=r.ClassId AND enrollment.StudentId=@Uid AND enrollment.IsActive=1 AND enrollment.DeletedAt IS NULL
    WHERE sr.Status='OPEN' AND sr.Deadline>=SYSDATETIME() ORDER BY sr.Deadline`);
  const recent = await pool.request().input('Uid', sql.Int, userId).query(`SELECT TOP 8 s.Id submissionId,a.AttemptNumber attemptNumber,a.Status status,a.SubmittedAt submittedAt,r.Title title
    FROM SubmissionAttempts a JOIN Submissions s ON s.Id=a.SubmissionId JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN GroupMembers gm ON gm.GroupId=s.GroupId AND gm.StudentId=@Uid AND gm.DeletedAt IS NULL
    ORDER BY a.SubmittedAt DESC`);
  const grades = await pool.request().input('Uid', sql.Int, userId).query(`SELECT TOP 8 s.Id submissionId,r.Title title,g.TotalScore totalScore,g.MaxScore maxScore,g.PublishedAt publishedAt
    FROM Grades g JOIN Submissions s ON s.Id=g.SubmissionId JOIN SubmissionRequirements r ON r.Id=s.RequirementId JOIN GroupMembers gm ON gm.GroupId=s.GroupId AND gm.StudentId=@Uid AND gm.DeletedAt IS NULL
    WHERE g.IsPublished=1 ORDER BY g.PublishedAt DESC`);
  return { stats: stats.recordset[0], group: group.recordset[0] || null, upcoming: upcoming.recordset, recentSubmissions: recent.recordset, publishedGrades: grades.recordset };
}
