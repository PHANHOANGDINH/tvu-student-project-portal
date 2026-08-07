SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.Faculties', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.Faculties (
      Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Faculties PRIMARY KEY,
      FacultyCode NVARCHAR(30) NOT NULL,
      FacultyName NVARCHAR(150) NOT NULL,
      Description NVARCHAR(500) NULL,
      IsActive BIT NOT NULL CONSTRAINT DF_Faculties_IsActive DEFAULT (1),
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Faculties_CreatedAt DEFAULT SYSDATETIME(),
      UpdatedAt DATETIME2 NULL,
      DeletedAt DATETIME2 NULL
    );
  END;

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Faculties') AND name=N'UX_Faculties_FacultyCode')
    CREATE UNIQUE INDEX UX_Faculties_FacultyCode ON dbo.Faculties(FacultyCode) WHERE DeletedAt IS NULL;

  IF COL_LENGTH(N'dbo.Classes', N'FacultyId') IS NULL
    ALTER TABLE dbo.Classes ADD FacultyId INT NULL;
  IF COL_LENGTH(N'dbo.Classes', N'AdmissionYear') IS NULL
    ALTER TABLE dbo.Classes ADD AdmissionYear INT NULL;
  IF COL_LENGTH(N'dbo.Classes', N'AcademicProgram') IS NULL
    ALTER TABLE dbo.Classes ADD AcademicProgram NVARCHAR(150) NULL;
  IF COL_LENGTH(N'dbo.Classes', N'Description') IS NULL
    ALTER TABLE dbo.Classes ADD Description NVARCHAR(500) NULL;

  EXEC sys.sp_executesql N'UPDATE dbo.Classes SET AdmissionYear=TRY_CONVERT(INT,AcademicYear) WHERE AdmissionYear IS NULL AND TRY_CONVERT(INT,AcademicYear) BETWEEN 1900 AND 2200;';

  IF EXISTS (SELECT 1 FROM dbo.Classes)
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.Faculties WHERE FacultyCode=N'LEGACY' AND DeletedAt IS NULL)
      INSERT dbo.Faculties(FacultyCode,FacultyName,Description)
      VALUES(N'LEGACY',N'Khoa chưa phân loại',N'Dữ liệu được bổ sung tự động cho lớp hành chính hiện có.');

    DECLARE @LegacyFacultyId INT = (
      SELECT TOP 1 Id FROM dbo.Faculties WHERE FacultyCode=N'LEGACY' AND DeletedAt IS NULL ORDER BY Id
    );
    EXEC sys.sp_executesql N'UPDATE dbo.Classes SET FacultyId=@Id WHERE FacultyId IS NULL;',N'@Id INT',@Id=@LegacyFacultyId;
  END;

  IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.Classes') AND name=N'FacultyId' AND is_nullable=1)
    EXEC sys.sp_executesql N'ALTER TABLE dbo.Classes ALTER COLUMN FacultyId INT NOT NULL;';

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_Classes_Faculties')
    EXEC sys.sp_executesql N'ALTER TABLE dbo.Classes WITH CHECK ADD CONSTRAINT FK_Classes_Faculties FOREIGN KEY(FacultyId) REFERENCES dbo.Faculties(Id) ON DELETE NO ACTION;';

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_Classes_AdvisorLecturer')
    ALTER TABLE dbo.Classes WITH CHECK ADD CONSTRAINT FK_Classes_AdvisorLecturer FOREIGN KEY(AdvisorTeacherId) REFERENCES dbo.Users(Id) ON DELETE NO ACTION;

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_StudentClassMembers_Classes')
    ALTER TABLE dbo.StudentClassMembers WITH CHECK ADD CONSTRAINT FK_StudentClassMembers_Classes FOREIGN KEY(ClassId) REFERENCES dbo.Classes(Id) ON DELETE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_StudentClassMembers_Students')
    ALTER TABLE dbo.StudentClassMembers WITH CHECK ADD CONSTRAINT FK_StudentClassMembers_Students FOREIGN KEY(StudentId) REFERENCES dbo.Users(Id) ON DELETE NO ACTION;

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Classes') AND name=N'IX_Classes_FacultyId')
    EXEC sys.sp_executesql N'CREATE INDEX IX_Classes_FacultyId ON dbo.Classes(FacultyId);';
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Classes') AND name=N'IX_Classes_AdvisorTeacherId')
    CREATE INDEX IX_Classes_AdvisorTeacherId ON dbo.Classes(AdvisorTeacherId);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.StudentClassMembers') AND name=N'UX_StudentClassMembers_Student_Active')
    CREATE UNIQUE INDEX UX_StudentClassMembers_Student_Active ON dbo.StudentClassMembers(StudentId) WHERE DeletedAt IS NULL;

  IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_Classes_AdmissionYear')
    EXEC sys.sp_executesql N'ALTER TABLE dbo.Classes ADD CONSTRAINT CK_Classes_AdmissionYear CHECK (AdmissionYear IS NULL OR AdmissionYear BETWEEN 1900 AND 2200);';

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
