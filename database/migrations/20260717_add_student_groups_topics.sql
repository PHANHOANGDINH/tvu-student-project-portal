SET XACT_ABORT ON;
BEGIN TRANSACTION;

CREATE TABLE StudentGroups (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  ClassId INT NOT NULL,
  Name NVARCHAR(150) NOT NULL,
  LeaderId INT NOT NULL,
  MaxMembers INT NOT NULL CONSTRAINT DF_StudentGroups_MaxMembers DEFAULT 5,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentGroups_CreatedAt DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NULL,
  DeletedAt DATETIME2 NULL,
  CONSTRAINT FK_StudentGroups_CourseClasses FOREIGN KEY (ClassId) REFERENCES CourseClasses(Id),
  CONSTRAINT FK_StudentGroups_Leader FOREIGN KEY (LeaderId) REFERENCES Users(Id),
  CONSTRAINT CK_StudentGroups_MaxMembers CHECK (MaxMembers BETWEEN 2 AND 20)
);

CREATE TABLE GroupMembers (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  GroupId INT NOT NULL,
  ClassId INT NOT NULL,
  StudentId INT NOT NULL,
  JoinedAt DATETIME2 NOT NULL CONSTRAINT DF_GroupMembers_JoinedAt DEFAULT SYSDATETIME(),
  DeletedAt DATETIME2 NULL,
  CONSTRAINT FK_GroupMembers_Groups FOREIGN KEY (GroupId) REFERENCES StudentGroups(Id),
  CONSTRAINT FK_GroupMembers_CourseClasses FOREIGN KEY (ClassId) REFERENCES CourseClasses(Id),
  CONSTRAINT FK_GroupMembers_Students FOREIGN KEY (StudentId) REFERENCES Users(Id)
);

CREATE TABLE TopicRegistrations (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  GroupId INT NOT NULL,
  ClassId INT NOT NULL,
  Title NVARCHAR(250) NOT NULL,
  Description NVARCHAR(MAX) NOT NULL,
  Technologies NVARCHAR(500) NULL,
  Objectives NVARCHAR(MAX) NULL,
  Notes NVARCHAR(MAX) NULL,
  Status NVARCHAR(30) NOT NULL CONSTRAINT DF_TopicRegistrations_Status DEFAULT 'PENDING',
  ReviewedBy INT NULL,
  ReviewedAt DATETIME2 NULL,
  ReviewComment NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TopicRegistrations_CreatedAt DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NULL,
  DeletedAt DATETIME2 NULL,
  CONSTRAINT FK_TopicRegistrations_Groups FOREIGN KEY (GroupId) REFERENCES StudentGroups(Id),
  CONSTRAINT FK_TopicRegistrations_CourseClasses FOREIGN KEY (ClassId) REFERENCES CourseClasses(Id),
  CONSTRAINT FK_TopicRegistrations_Reviewer FOREIGN KEY (ReviewedBy) REFERENCES Users(Id),
  CONSTRAINT CK_TopicRegistrations_Status CHECK (Status IN ('PENDING','APPROVED','REJECTED','REQUIRES_REVISION'))
);

CREATE TABLE TopicReviewHistory (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  TopicRegistrationId INT NOT NULL,
  PreviousStatus NVARCHAR(30) NOT NULL,
  NewStatus NVARCHAR(30) NOT NULL,
  Comment NVARCHAR(MAX) NULL,
  ReviewedBy INT NOT NULL,
  ReviewedAt DATETIME2 NOT NULL CONSTRAINT DF_TopicReviewHistory_ReviewedAt DEFAULT SYSDATETIME(),
  CONSTRAINT FK_TopicReviewHistory_Registration FOREIGN KEY (TopicRegistrationId) REFERENCES TopicRegistrations(Id),
  CONSTRAINT FK_TopicReviewHistory_Reviewer FOREIGN KEY (ReviewedBy) REFERENCES Users(Id)
);

CREATE UNIQUE INDEX UX_GroupMembers_Class_Student_Active ON GroupMembers(ClassId, StudentId) WHERE DeletedAt IS NULL;
CREATE UNIQUE INDEX UX_GroupMembers_Group_Student_Active ON GroupMembers(GroupId, StudentId) WHERE DeletedAt IS NULL;
CREATE UNIQUE INDEX UX_TopicRegistrations_Group_Active ON TopicRegistrations(GroupId) WHERE DeletedAt IS NULL;
CREATE UNIQUE INDEX UX_TopicRegistrations_Class_Title_Active ON TopicRegistrations(ClassId, Title) WHERE DeletedAt IS NULL;
CREATE INDEX IX_StudentGroups_ClassId ON StudentGroups(ClassId) WHERE DeletedAt IS NULL;
CREATE INDEX IX_TopicRegistrations_Class_Status ON TopicRegistrations(ClassId, Status) WHERE DeletedAt IS NULL;
CREATE INDEX IX_TopicReviewHistory_Registration ON TopicReviewHistory(TopicRegistrationId, ReviewedAt DESC);

COMMIT TRANSACTION;
