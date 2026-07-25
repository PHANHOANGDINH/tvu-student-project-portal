SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;

  IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClassLecturers') AND name=N'UX_CourseClassLecturers_ActivePrimary')
    DROP INDEX UX_CourseClassLecturers_ActivePrimary ON dbo.CourseClassLecturers;
  IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.CourseClassLecturers') AND name=N'CK_CourseClassLecturers_Role')
    ALTER TABLE dbo.CourseClassLecturers DROP CONSTRAINT CK_CourseClassLecturers_Role;
  IF COL_LENGTH(N'dbo.CourseClassLecturers',N'AssignmentRole') IS NOT NULL
    UPDATE dbo.CourseClassLecturers SET AssignmentRole=N'LECTURER' WHERE AssignmentRole<>N'LECTURER';

  IF OBJECT_ID(N'dbo.AdministrativeClasses',N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.AdministrativeClasses(
      Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AdministrativeClasses PRIMARY KEY,
      ClassCode NVARCHAR(50) NOT NULL,
      ClassName NVARCHAR(150) NOT NULL,
      Cohort NVARCHAR(30) NULL,
      MajorId INT NULL,
      AcademicYearId INT NULL,
      Status NVARCHAR(20) NOT NULL CONSTRAINT DF_AdministrativeClasses_Status DEFAULT N'ACTIVE',
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AdministrativeClasses_CreatedAt DEFAULT SYSDATETIME(),
      UpdatedAt DATETIME2 NULL,
      CONSTRAINT FK_AdministrativeClasses_AcademicYears FOREIGN KEY(AcademicYearId) REFERENCES dbo.AcademicYears(Id),
      CONSTRAINT CK_AdministrativeClasses_Status CHECK(Status IN(N'ACTIVE',N'INACTIVE',N'GRADUATED'))
    );
    CREATE UNIQUE INDEX UX_AdministrativeClasses_ClassCode ON dbo.AdministrativeClasses(ClassCode);
  END;

  IF OBJECT_ID(N'dbo.AdministrativeClassMemberships',N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.AdministrativeClassMemberships(
      Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AdministrativeClassMemberships PRIMARY KEY,
      AdministrativeClassId INT NOT NULL,
      StudentId INT NOT NULL,
      StartAt DATETIME2 NOT NULL CONSTRAINT DF_AdministrativeClassMemberships_StartAt DEFAULT SYSDATETIME(),
      EndAt DATETIME2 NULL,
      IsCurrent BIT NOT NULL CONSTRAINT DF_AdministrativeClassMemberships_IsCurrent DEFAULT(1),
      TransferReason NVARCHAR(500) NULL,
      CreatedBy INT NULL,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AdministrativeClassMemberships_CreatedAt DEFAULT SYSDATETIME(),
      UpdatedAt DATETIME2 NULL,
      CONSTRAINT FK_AdminMemberships_Class FOREIGN KEY(AdministrativeClassId) REFERENCES dbo.AdministrativeClasses(Id),
      CONSTRAINT FK_AdminMemberships_Student FOREIGN KEY(StudentId) REFERENCES dbo.Users(Id),
      CONSTRAINT FK_AdminMemberships_CreatedBy FOREIGN KEY(CreatedBy) REFERENCES dbo.Users(Id),
      CONSTRAINT CK_AdminMemberships_Dates CHECK(EndAt IS NULL OR EndAt>=StartAt)
    );
    CREATE UNIQUE INDEX UX_AdminMemberships_CurrentStudent ON dbo.AdministrativeClassMemberships(StudentId) WHERE IsCurrent=1;
    CREATE UNIQUE INDEX UX_AdminMemberships_Class_Student_Start ON dbo.AdministrativeClassMemberships(AdministrativeClassId,StudentId,StartAt);
    CREATE INDEX IX_AdminMemberships_Class_Current ON dbo.AdministrativeClassMemberships(AdministrativeClassId,IsCurrent);
  END;

  IF OBJECT_ID(N'dbo.CourseClassEligibleClasses',N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.CourseClassEligibleClasses(
      Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CourseClassEligibleClasses PRIMARY KEY,
      CourseClassId INT NOT NULL,AdministrativeClassId INT NOT NULL,AddedBy INT NULL,
      AddedAt DATETIME2 NOT NULL CONSTRAINT DF_CourseClassEligibleClasses_AddedAt DEFAULT SYSDATETIME(),
      CONSTRAINT FK_EligibleClasses_CourseClass FOREIGN KEY(CourseClassId) REFERENCES dbo.CourseClasses(Id),
      CONSTRAINT FK_EligibleClasses_AdminClass FOREIGN KEY(AdministrativeClassId) REFERENCES dbo.AdministrativeClasses(Id),
      CONSTRAINT FK_EligibleClasses_AddedBy FOREIGN KEY(AddedBy) REFERENCES dbo.Users(Id),
      CONSTRAINT UQ_EligibleClasses_Course_Admin UNIQUE(CourseClassId,AdministrativeClassId)
    );
    CREATE INDEX IX_EligibleClasses_AdminClass ON dbo.CourseClassEligibleClasses(AdministrativeClassId);
  END;

  IF COL_LENGTH(N'dbo.CourseClasses',N'EnrollmentOpenAt') IS NULL ALTER TABLE dbo.CourseClasses ADD EnrollmentOpenAt DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.CourseClasses',N'EnrollmentCloseAt') IS NULL ALTER TABLE dbo.CourseClasses ADD EnrollmentCloseAt DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.CourseClasses',N'AllowSelfEnrollment') IS NULL ALTER TABLE dbo.CourseClasses ADD AllowSelfEnrollment BIT NOT NULL CONSTRAINT DF_CourseClasses_AllowSelfEnrollment DEFAULT(0);
  IF COL_LENGTH(N'dbo.CourseClassEnrollments',N'EnrollmentStatus') IS NULL ALTER TABLE dbo.CourseClassEnrollments ADD EnrollmentStatus NVARCHAR(20) NOT NULL CONSTRAINT DF_CourseClassEnrollments_Status DEFAULT N'ACTIVE';
  IF COL_LENGTH(N'dbo.CourseClassEnrollments',N'EnrolledBy') IS NULL ALTER TABLE dbo.CourseClassEnrollments ADD EnrolledBy INT NULL CONSTRAINT FK_CourseClassEnrollments_EnrolledBy REFERENCES dbo.Users(Id);

  IF EXISTS(SELECT 1 FROM sys.foreign_keys WHERE parent_object_id IN(OBJECT_ID(N'dbo.AdministrativeClasses'),OBJECT_ID(N'dbo.AdministrativeClassMemberships'),OBJECT_ID(N'dbo.CourseClassEligibleClasses')) AND(is_disabled=1 OR is_not_trusted=1))
    THROW 51100,'Administrative class migration has disabled or untrusted foreign keys.',1;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
