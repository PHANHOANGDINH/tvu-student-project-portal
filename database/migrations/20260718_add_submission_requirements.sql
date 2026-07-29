SET XACT_ABORT ON;
BEGIN TRANSACTION;

CREATE TABLE SubmissionRequirements (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  ClassId INT NOT NULL,
  Title NVARCHAR(200) NOT NULL,
  Description NVARCHAR(MAX) NOT NULL,
  Instructions NVARCHAR(MAX) NULL,
  AllowLate BIT NOT NULL CONSTRAINT DF_SubmissionRequirements_AllowLate DEFAULT 0,
  AllowResubmission BIT NOT NULL CONSTRAINT DF_SubmissionRequirements_AllowResubmission DEFAULT 0,
  MaxAttempts INT NOT NULL CONSTRAINT DF_SubmissionRequirements_MaxAttempts DEFAULT 1,
  MaxFileSizeMb INT NULL,
  CreatedBy INT NOT NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_SubmissionRequirements_CreatedAt DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NULL,
  DeletedAt DATETIME2 NULL,
  CONSTRAINT FK_SubmissionRequirements_CourseClasses FOREIGN KEY (ClassId) REFERENCES CourseClasses(Id),
  CONSTRAINT FK_SubmissionRequirements_Creator FOREIGN KEY (CreatedBy) REFERENCES Users(Id),
  CONSTRAINT CK_SubmissionRequirements_MaxAttempts CHECK (MaxAttempts > 0),
  CONSTRAINT CK_SubmissionRequirements_MaxFileSize CHECK (MaxFileSizeMb IS NULL OR MaxFileSizeMb > 0)
);

CREATE TABLE SubmissionRounds (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  RequirementId INT NOT NULL,
  StartAt DATETIME2 NOT NULL,
  Deadline DATETIME2 NOT NULL,
  Status NVARCHAR(20) NOT NULL CONSTRAINT DF_SubmissionRounds_Status DEFAULT 'DRAFT',
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_SubmissionRounds_CreatedAt DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NULL,
  CONSTRAINT FK_SubmissionRounds_Requirement FOREIGN KEY (RequirementId) REFERENCES SubmissionRequirements(Id),
  CONSTRAINT UQ_SubmissionRounds_Requirement UNIQUE (RequirementId),
  CONSTRAINT CK_SubmissionRounds_Time CHECK (StartAt < Deadline),
  CONSTRAINT CK_SubmissionRounds_Status CHECK (Status IN ('DRAFT','OPEN','CLOSED','CANCELLED'))
);

CREATE TABLE RequiredSubmissionItems (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  RequirementId INT NOT NULL,
  ItemType NVARCHAR(30) NOT NULL,
  Description NVARCHAR(300) NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_RequiredSubmissionItems_CreatedAt DEFAULT SYSDATETIME(),
  CONSTRAINT FK_RequiredSubmissionItems_Requirement FOREIGN KEY (RequirementId) REFERENCES SubmissionRequirements(Id),
  CONSTRAINT UQ_RequiredSubmissionItems_Type UNIQUE (RequirementId, ItemType),
  CONSTRAINT CK_RequiredSubmissionItems_Type CHECK (ItemType IN ('REPORT','SLIDE','SOURCE_CODE','GITHUB_LINK','VIDEO_LINK','OTHER'))
);

CREATE UNIQUE INDEX UX_SubmissionRequirements_Class_Title_Active ON SubmissionRequirements(ClassId, Title) WHERE DeletedAt IS NULL;
CREATE INDEX IX_SubmissionRequirements_ClassId ON SubmissionRequirements(ClassId) WHERE DeletedAt IS NULL;
CREATE INDEX IX_SubmissionRounds_Status_Time ON SubmissionRounds(Status, StartAt, Deadline);
CREATE INDEX IX_RequiredSubmissionItems_Requirement ON RequiredSubmissionItems(RequirementId);

COMMIT TRANSACTION;
