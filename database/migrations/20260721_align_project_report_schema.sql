/*
  Safely aligns the legacy TVU schema with the current backend contract.
  Idempotent: may be executed more than once. Legacy tables/data are retained.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.Projects', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Projects (
    Id int NOT NULL PRIMARY KEY,
    Title nvarchar(255) NOT NULL,
    Description nvarchar(max) NULL,
    Requirements nvarchar(max) NULL,
    ExpectedOutcome nvarchar(max) NULL,
    TeacherId int NOT NULL,
    ClassId int NULL,
    MaxStudents int NOT NULL CONSTRAINT DF_Projects_MaxStudents DEFAULT 1,
    Status nvarchar(30) NOT NULL CONSTRAINT DF_Projects_Status DEFAULT 'Pending',
    RejectReason nvarchar(max) NULL,
    IsActive bit NOT NULL CONSTRAINT DF_Projects_IsActive DEFAULT 1,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_Projects_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt datetime2 NULL,
    DeletedAt datetime2 NULL,
    CONSTRAINT FK_Projects_Teacher FOREIGN KEY (TeacherId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Projects_Class FOREIGN KEY (ClassId) REFERENCES dbo.Classes(Id)
  );
END;

IF OBJECT_ID('dbo.ProjectTopics', 'U') IS NOT NULL
BEGIN
  INSERT dbo.Projects (Id,Title,Description,Requirements,TeacherId,ClassId,MaxStudents,Status,IsActive,CreatedAt,UpdatedAt,DeletedAt)
  SELECT pt.Id,pt.Title,pt.Description,pt.Requirements,pt.TeacherId,pt.ClassId,pt.MaxStudents,pt.Status,
         CASE WHEN pt.DeletedAt IS NULL THEN 1 ELSE 0 END,pt.CreatedAt,pt.UpdatedAt,pt.DeletedAt
  FROM dbo.ProjectTopics pt
  WHERE NOT EXISTS (SELECT 1 FROM dbo.Projects p WHERE p.Id=pt.Id);
END;

IF OBJECT_ID('dbo.ProjectIdSequence','SO') IS NULL EXEC(N'CREATE SEQUENCE dbo.ProjectIdSequence AS int START WITH 1000000 INCREMENT BY 1;');
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id=OBJECT_ID('dbo.Projects') AND parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.Projects'),'Id','ColumnId'))
  ALTER TABLE dbo.Projects ADD CONSTRAINT DF_Projects_Id DEFAULT (NEXT VALUE FOR dbo.ProjectIdSequence) FOR Id;

IF COL_LENGTH('dbo.ProjectRegistrations','ProjectId') IS NULL ALTER TABLE dbo.ProjectRegistrations ADD ProjectId int NULL;
IF COL_LENGTH('dbo.ProjectRegistrations','ReviewNote') IS NULL ALTER TABLE dbo.ProjectRegistrations ADD ReviewNote nvarchar(max) NULL;
IF COL_LENGTH('dbo.ProjectRegistrations','ReviewedBy') IS NULL ALTER TABLE dbo.ProjectRegistrations ADD ReviewedBy int NULL;
IF COL_LENGTH('dbo.ProjectRegistrations','UpdatedAt') IS NULL ALTER TABLE dbo.ProjectRegistrations ADD UpdatedAt datetime2 NULL;
IF COL_LENGTH('dbo.ProjectRegistrations','DeletedAt') IS NULL ALTER TABLE dbo.ProjectRegistrations ADD DeletedAt datetime2 NULL;
ALTER TABLE dbo.ProjectRegistrations ALTER COLUMN TopicId int NULL;
ALTER TABLE dbo.ProjectRegistrations ALTER COLUMN TeamId int NULL;
EXEC(N'UPDATE dbo.ProjectRegistrations SET ProjectId=TopicId WHERE ProjectId IS NULL AND TopicId IS NOT NULL;');
EXEC(N'UPDATE dbo.ProjectRegistrations SET ReviewNote=TeacherNote WHERE ReviewNote IS NULL AND TeacherNote IS NOT NULL;');
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_ProjectRegistrations_Projects')
  EXEC(N'ALTER TABLE dbo.ProjectRegistrations WITH CHECK ADD CONSTRAINT FK_ProjectRegistrations_Projects FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id);');

IF OBJECT_ID('dbo.ProjectProgressReports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ProjectProgressReports (
    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    LegacyProgressReportId int NULL,
    ProjectId int NOT NULL,
    StudentId int NOT NULL,
    Title nvarchar(255) NOT NULL,
    Content nvarchar(max) NULL,
    ProgressPercent decimal(5,2) NOT NULL CONSTRAINT DF_ProjectProgress_Percent DEFAULT 0,
    ReportDate date NULL,
    FileUrl nvarchar(500) NULL,
    Status nvarchar(30) NOT NULL CONSTRAINT DF_ProjectProgress_Status DEFAULT 'Submitted',
    TeacherComment nvarchar(max) NULL,
    TeacherScore decimal(4,2) NULL,
    ReviewedBy int NULL,
    ReviewedAt datetime2 NULL,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_ProjectProgress_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt datetime2 NULL,
    DeletedAt datetime2 NULL,
    CONSTRAINT FK_ProjectProgress_Project FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id),
    CONSTRAINT FK_ProjectProgress_Student FOREIGN KEY(StudentId) REFERENCES dbo.Users(Id)
  );
  CREATE UNIQUE INDEX UX_ProjectProgress_Legacy ON dbo.ProjectProgressReports(LegacyProgressReportId) WHERE LegacyProgressReportId IS NOT NULL;
END;

/* A TeamId maps safely to StudentId only when the team has exactly one member. */
IF OBJECT_ID('dbo.ProgressReports','U') IS NOT NULL
BEGIN
  ;WITH SingleMemberTeams AS (
    SELECT TeamId, MIN(StudentId) StudentId FROM dbo.TeamMembers GROUP BY TeamId HAVING COUNT(*)=1
  )
  INSERT dbo.ProjectProgressReports (LegacyProgressReportId,ProjectId,StudentId,Title,Content,FileUrl,Status,TeacherComment,TeacherScore,ReviewedAt,CreatedAt)
  SELECT r.Id,t.TopicId,s.StudentId,r.Title,r.Content,r.FileUrl,r.Status,r.Feedback,r.Score,r.ReviewedAt,r.SubmittedAt
  FROM dbo.ProgressReports r JOIN dbo.Teams t ON t.Id=r.TeamId JOIN SingleMemberTeams s ON s.TeamId=r.TeamId
  JOIN dbo.Projects p ON p.Id=t.TopicId
  WHERE t.TopicId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ProjectProgressReports n WHERE n.LegacyProgressReportId=r.Id);
END;

IF COL_LENGTH('dbo.FinalSubmissions','ProjectId') IS NULL ALTER TABLE dbo.FinalSubmissions ADD ProjectId int NULL;
IF COL_LENGTH('dbo.FinalSubmissions','StudentId') IS NULL ALTER TABLE dbo.FinalSubmissions ADD StudentId int NULL;
IF COL_LENGTH('dbo.FinalSubmissions','ReportFileUrl') IS NULL ALTER TABLE dbo.FinalSubmissions ADD ReportFileUrl nvarchar(500) NULL;
IF COL_LENGTH('dbo.FinalSubmissions','GithubUrl') IS NULL ALTER TABLE dbo.FinalSubmissions ADD GithubUrl nvarchar(500) NULL;
IF COL_LENGTH('dbo.FinalSubmissions','TeacherComment') IS NULL ALTER TABLE dbo.FinalSubmissions ADD TeacherComment nvarchar(max) NULL;
IF COL_LENGTH('dbo.FinalSubmissions','TeacherScore') IS NULL ALTER TABLE dbo.FinalSubmissions ADD TeacherScore decimal(4,2) NULL;
IF COL_LENGTH('dbo.FinalSubmissions','ReviewedBy') IS NULL ALTER TABLE dbo.FinalSubmissions ADD ReviewedBy int NULL;
IF COL_LENGTH('dbo.FinalSubmissions','UpdatedAt') IS NULL ALTER TABLE dbo.FinalSubmissions ADD UpdatedAt datetime2 NULL;
IF COL_LENGTH('dbo.FinalSubmissions','DeletedAt') IS NULL ALTER TABLE dbo.FinalSubmissions ADD DeletedAt datetime2 NULL;
ALTER TABLE dbo.FinalSubmissions ALTER COLUMN TeamId int NULL;
EXEC(N'UPDATE fs SET ProjectId=t.TopicId,ReportFileUrl=COALESCE(fs.ReportFileUrl,fs.FileUrl),GithubUrl=COALESCE(fs.GithubUrl,fs.SourceCodeUrl),TeacherComment=COALESCE(fs.TeacherComment,fs.Feedback),TeacherScore=COALESCE(fs.TeacherScore,fs.Score)
FROM dbo.FinalSubmissions fs JOIN dbo.Teams t ON t.Id=fs.TeamId WHERE fs.ProjectId IS NULL;');
EXEC(N';WITH SingleMemberTeams AS (SELECT TeamId,MIN(StudentId) StudentId FROM dbo.TeamMembers GROUP BY TeamId HAVING COUNT(*)=1)
UPDATE fs SET StudentId=s.StudentId FROM dbo.FinalSubmissions fs JOIN SingleMemberTeams s ON s.TeamId=fs.TeamId WHERE fs.StudentId IS NULL;');
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_FinalSubmissions_Projects')
  EXEC(N'ALTER TABLE dbo.FinalSubmissions WITH CHECK ADD CONSTRAINT FK_FinalSubmissions_Projects FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id);');

COMMIT TRANSACTION;
