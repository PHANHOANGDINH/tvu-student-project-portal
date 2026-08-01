SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.AcademicYears', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AcademicYears (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AcademicYears PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL, StartDate DATE NOT NULL, EndDate DATE NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_AcademicYears_IsActive DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AcademicYears_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL, DeletedAt DATETIME2 NULL,
    CONSTRAINT CK_AcademicYears_DateRange CHECK (StartDate < EndDate)
  );
  CREATE UNIQUE INDEX UX_AcademicYears_Name ON dbo.AcademicYears(Name) WHERE DeletedAt IS NULL;
END;

IF OBJECT_ID(N'dbo.Semesters', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Semesters (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Semesters PRIMARY KEY,
    AcademicYearId INT NOT NULL, Name NVARCHAR(100) NOT NULL, Code NVARCHAR(30) NOT NULL,
    StartDate DATE NOT NULL, EndDate DATE NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Semesters_IsActive DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Semesters_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL, DeletedAt DATETIME2 NULL,
    CONSTRAINT FK_Semesters_AcademicYears FOREIGN KEY (AcademicYearId) REFERENCES dbo.AcademicYears(Id),
    CONSTRAINT CK_Semesters_DateRange CHECK (StartDate < EndDate)
  );
  CREATE UNIQUE INDEX UX_Semesters_AcademicYear_Code ON dbo.Semesters(AcademicYearId, Code) WHERE DeletedAt IS NULL;
  CREATE INDEX IX_Semesters_AcademicYearId ON dbo.Semesters(AcademicYearId);
END;

IF OBJECT_ID(N'dbo.Subjects', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Subjects (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Subjects PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL, Name NVARCHAR(200) NOT NULL, Credits INT NOT NULL,
    Description NVARCHAR(MAX) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Subjects_IsActive DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Subjects_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL, DeletedAt DATETIME2 NULL,
    CONSTRAINT CK_Subjects_Credits CHECK (Credits > 0)
  );
  CREATE UNIQUE INDEX UX_Subjects_Code ON dbo.Subjects(Code) WHERE DeletedAt IS NULL;
END;

IF OBJECT_ID(N'dbo.CourseClasses', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CourseClasses (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CourseClasses PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL, SubjectId INT NOT NULL, SemesterId INT NOT NULL,
    LecturerId INT NULL, MaxStudents INT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_CourseClasses_Status DEFAULT N'ACTIVE',
    IsActive BIT NOT NULL CONSTRAINT DF_CourseClasses_IsActive DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CourseClasses_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL, DeletedAt DATETIME2 NULL,
    CONSTRAINT FK_CourseClasses_Subjects FOREIGN KEY (SubjectId) REFERENCES dbo.Subjects(Id),
    CONSTRAINT FK_CourseClasses_Semesters FOREIGN KEY (SemesterId) REFERENCES dbo.Semesters(Id),
    CONSTRAINT FK_CourseClasses_Lecturers FOREIGN KEY (LecturerId) REFERENCES dbo.Users(Id),
    CONSTRAINT CK_CourseClasses_Status CHECK (Status IN (N'ACTIVE',N'INACTIVE',N'COMPLETED',N'CANCELLED')),
    CONSTRAINT CK_CourseClasses_MaxStudents CHECK (MaxStudents IS NULL OR MaxStudents > 0)
  );
  CREATE UNIQUE INDEX UX_CourseClasses_Code ON dbo.CourseClasses(Code) WHERE DeletedAt IS NULL;
  CREATE INDEX IX_CourseClasses_SubjectId ON dbo.CourseClasses(SubjectId);
  CREATE INDEX IX_CourseClasses_SemesterId ON dbo.CourseClasses(SemesterId);
  CREATE INDEX IX_CourseClasses_LecturerId ON dbo.CourseClasses(LecturerId);
END;

IF OBJECT_ID(N'dbo.CourseClassEnrollments', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CourseClassEnrollments (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CourseClassEnrollments PRIMARY KEY,
    CourseClassId INT NOT NULL, StudentId INT NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_CourseClassEnrollments_IsActive DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CourseClassEnrollments_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL, DeletedAt DATETIME2 NULL,
    CONSTRAINT FK_CourseClassEnrollments_CourseClasses FOREIGN KEY (CourseClassId) REFERENCES dbo.CourseClasses(Id),
    CONSTRAINT FK_CourseClassEnrollments_Students FOREIGN KEY (StudentId) REFERENCES dbo.Users(Id)
  );
  CREATE UNIQUE INDEX UX_CourseClassEnrollments_Class_Student ON dbo.CourseClassEnrollments(CourseClassId,StudentId) WHERE DeletedAt IS NULL;
  CREATE INDEX IX_CourseClassEnrollments_StudentId ON dbo.CourseClassEnrollments(StudentId);
END;

COMMIT TRANSACTION;
