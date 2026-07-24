SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID('dbo.TopicRegistrationRounds', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.TopicRegistrationRounds (
      Id INT IDENTITY(1,1) PRIMARY KEY,
      ClassId INT NOT NULL,
      Name NVARCHAR(200) NOT NULL,
      Description NVARCHAR(MAX) NULL,
      Requirements NVARCHAR(MAX) NULL,
      AllowEditing BIT NOT NULL CONSTRAINT DF_TopicRegistrationRounds_AllowEditing DEFAULT 1,
      MaxEditCount INT NOT NULL CONSTRAINT DF_TopicRegistrationRounds_MaxEditCount DEFAULT 3,
      StartAt DATETIME2 NOT NULL,
      EndAt DATETIME2 NOT NULL,
      Status NVARCHAR(20) NOT NULL CONSTRAINT DF_TopicRegistrationRounds_Status DEFAULT 'DRAFT',
      CreatedBy INT NOT NULL,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TopicRegistrationRounds_CreatedAt DEFAULT SYSDATETIME(),
      UpdatedAt DATETIME2 NULL,
      DeletedAt DATETIME2 NULL,
      CONSTRAINT FK_TopicRegistrationRounds_Class FOREIGN KEY (ClassId) REFERENCES dbo.CourseClasses(Id),
      CONSTRAINT FK_TopicRegistrationRounds_Creator FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
      CONSTRAINT CK_TopicRegistrationRounds_Status CHECK (Status IN ('DRAFT','OPEN','CLOSED','CANCELLED')),
      CONSTRAINT CK_TopicRegistrationRounds_Time CHECK (StartAt < EndAt)
    );
    CREATE INDEX IX_TopicRegistrationRounds_Class_Status
      ON dbo.TopicRegistrationRounds(ClassId, Status) WHERE DeletedAt IS NULL;
  END;

  IF COL_LENGTH('dbo.TopicRegistrations', 'RoundId') IS NULL
    ALTER TABLE dbo.TopicRegistrations ADD RoundId INT NULL;
  IF COL_LENGTH('dbo.TopicRegistrations', 'Scope') IS NULL
    ALTER TABLE dbo.TopicRegistrations ADD Scope NVARCHAR(MAX) NULL;
  IF COL_LENGTH('dbo.TopicRegistrations', 'ExpectedResults') IS NULL
    ALTER TABLE dbo.TopicRegistrations ADD ExpectedResults NVARCHAR(MAX) NULL;
  IF COL_LENGTH('dbo.TopicRegistrations', 'ReferenceUrl') IS NULL
    ALTER TABLE dbo.TopicRegistrations ADD ReferenceUrl NVARCHAR(1000) NULL;
  IF COL_LENGTH('dbo.TopicRegistrations', 'RevisionCount') IS NULL
    ALTER TABLE dbo.TopicRegistrations ADD RevisionCount INT NOT NULL
      CONSTRAINT DF_TopicRegistrations_RevisionCount DEFAULT 0;

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TopicRegistrations_Round')
    EXEC sp_executesql N'ALTER TABLE dbo.TopicRegistrations WITH CHECK ADD CONSTRAINT FK_TopicRegistrations_Round FOREIGN KEY (RoundId) REFERENCES dbo.TopicRegistrationRounds(Id)';

  IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.TopicRegistrations') AND name='UX_TopicRegistrations_Group_Active')
    DROP INDEX UX_TopicRegistrations_Group_Active ON dbo.TopicRegistrations;
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.TopicRegistrations') AND name='UX_TopicRegistrations_Round_Group_Active')
    EXEC sp_executesql N'CREATE UNIQUE INDEX UX_TopicRegistrations_Round_Group_Active ON dbo.TopicRegistrations(RoundId,GroupId) WHERE DeletedAt IS NULL AND RoundId IS NOT NULL';
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.TopicRegistrations') AND name='IX_TopicRegistrations_Round_Status')
    EXEC sp_executesql N'CREATE INDEX IX_TopicRegistrations_Round_Status ON dbo.TopicRegistrations(RoundId,Status) WHERE DeletedAt IS NULL';
  IF OBJECT_ID('dbo.TopicRegistrationRoundFiles', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.TopicRegistrationRoundFiles (
      Id INT IDENTITY(1,1) PRIMARY KEY,
      RoundId INT NOT NULL,
      OriginalName NVARCHAR(260) NOT NULL,
      StoredName NVARCHAR(260) NOT NULL,
      RelativePath NVARCHAR(1000) NOT NULL,
      MimeType NVARCHAR(150) NOT NULL,
      SizeBytes BIGINT NOT NULL,
      UploadedBy INT NOT NULL,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TopicRegistrationRoundFiles_CreatedAt DEFAULT SYSDATETIME(),
      CONSTRAINT FK_TopicRegistrationRoundFiles_Round FOREIGN KEY (RoundId) REFERENCES dbo.TopicRegistrationRounds(Id),
      CONSTRAINT FK_TopicRegistrationRoundFiles_User FOREIGN KEY (UploadedBy) REFERENCES dbo.Users(Id)
    );
  END;

  IF COL_LENGTH('dbo.SubmissionRequirements', 'RequirementType') IS NULL
    ALTER TABLE dbo.SubmissionRequirements ADD RequirementType NVARCHAR(30) NOT NULL
      CONSTRAINT DF_SubmissionRequirements_Type DEFAULT 'ASSIGNMENT';
  IF COL_LENGTH('dbo.SubmissionRequirements', 'WeekNumber') IS NULL
    ALTER TABLE dbo.SubmissionRequirements ADD WeekNumber INT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_SubmissionRequirements_Type')
    EXEC sp_executesql N'ALTER TABLE dbo.SubmissionRequirements ADD CONSTRAINT CK_SubmissionRequirements_Type CHECK (RequirementType IN (''ASSIGNMENT'',''WEEKLY_PROGRESS''))';
  IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_SubmissionRequirements_Week')
    EXEC sp_executesql N'ALTER TABLE dbo.SubmissionRequirements ADD CONSTRAINT CK_SubmissionRequirements_Week CHECK (WeekNumber IS NULL OR WeekNumber BETWEEN 1 AND 53)';

  IF COL_LENGTH('dbo.RequiredSubmissionItems', 'Name') IS NULL
    ALTER TABLE dbo.RequiredSubmissionItems ADD Name NVARCHAR(200) NULL;
  IF COL_LENGTH('dbo.RequiredSubmissionItems', 'IsRequired') IS NULL
    ALTER TABLE dbo.RequiredSubmissionItems ADD IsRequired BIT NOT NULL
      CONSTRAINT DF_RequiredSubmissionItems_IsRequired DEFAULT 1;
  IF COL_LENGTH('dbo.RequiredSubmissionItems', 'DisplayOrder') IS NULL
    ALTER TABLE dbo.RequiredSubmissionItems ADD DisplayOrder INT NOT NULL
      CONSTRAINT DF_RequiredSubmissionItems_DisplayOrder DEFAULT 0;
  IF COL_LENGTH('dbo.RequiredSubmissionItems', 'AllowedExtensions') IS NULL
    ALTER TABLE dbo.RequiredSubmissionItems ADD AllowedExtensions NVARCHAR(500) NULL;
  IF COL_LENGTH('dbo.RequiredSubmissionItems', 'MaxFiles') IS NULL
    ALTER TABLE dbo.RequiredSubmissionItems ADD MaxFiles INT NULL;

  DECLARE @itemConstraint SYSNAME;
  SELECT TOP 1 @itemConstraint = cc.name
  FROM sys.check_constraints cc
  WHERE cc.parent_object_id = OBJECT_ID('dbo.RequiredSubmissionItems')
    AND cc.definition LIKE '%ItemType%';
  IF @itemConstraint IS NOT NULL
  BEGIN
    DECLARE @dropConstraintSql NVARCHAR(1000) = N'ALTER TABLE dbo.RequiredSubmissionItems DROP CONSTRAINT ' + QUOTENAME(@itemConstraint);
    EXEC sp_executesql @dropConstraintSql;
  END;
  ALTER TABLE dbo.RequiredSubmissionItems ADD CONSTRAINT CK_RequiredSubmissionItems_Type
    CHECK (ItemType IN (
      'TEXT','REPORT','SLIDE','SOURCE_CODE','FILE','GITHUB_LINK','JIRA_LINK',
      'FIGMA_LINK','VIDEO_LINK','DEMO_LINK','DOCUMENT_LINK','OTHER_LINK','OTHER'
    ));

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
