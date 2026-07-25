SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  IF OBJECT_ID(N'dbo.CourseClassLecturers', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.CourseClassLecturers (
      Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CourseClassLecturers PRIMARY KEY,
      CourseClassId INT NOT NULL,
      LecturerId INT NOT NULL,
      AssignmentRole NVARCHAR(20) NOT NULL,
      IsActive BIT NOT NULL CONSTRAINT DF_CourseClassLecturers_IsActive DEFAULT (1),
      AssignedBy INT NULL,
      AssignedAt DATETIME2 NOT NULL CONSTRAINT DF_CourseClassLecturers_AssignedAt DEFAULT SYSDATETIME(),
      UpdatedAt DATETIME2 NULL,
      CONSTRAINT FK_CourseClassLecturers_CourseClasses FOREIGN KEY (CourseClassId) REFERENCES dbo.CourseClasses(Id),
      CONSTRAINT FK_CourseClassLecturers_Lecturers FOREIGN KEY (LecturerId) REFERENCES dbo.Users(Id),
      CONSTRAINT FK_CourseClassLecturers_AssignedBy FOREIGN KEY (AssignedBy) REFERENCES dbo.Users(Id),
      CONSTRAINT UQ_CourseClassLecturers_Class_Lecturer UNIQUE (CourseClassId, LecturerId),
      CONSTRAINT CK_CourseClassLecturers_Role CHECK (AssignmentRole IN (N'PRIMARY', N'CO_LECTURER'))
    );
  END;
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClassLecturers') AND name=N'IX_CourseClassLecturers_CourseClassId')
    CREATE INDEX IX_CourseClassLecturers_CourseClassId ON dbo.CourseClassLecturers(CourseClassId, IsActive);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClassLecturers') AND name=N'IX_CourseClassLecturers_LecturerId')
    CREATE INDEX IX_CourseClassLecturers_LecturerId ON dbo.CourseClassLecturers(LecturerId);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClassLecturers') AND name=N'IX_CourseClassLecturers_Lecturer_Active')
    CREATE INDEX IX_CourseClassLecturers_Lecturer_Active ON dbo.CourseClassLecturers(LecturerId, IsActive) INCLUDE(CourseClassId, AssignmentRole);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClassLecturers') AND name=N'UX_CourseClassLecturers_ActivePrimary')
    CREATE UNIQUE INDEX UX_CourseClassLecturers_ActivePrimary ON dbo.CourseClassLecturers(CourseClassId)
      WHERE AssignmentRole=N'PRIMARY' AND IsActive=1;
  IF COL_LENGTH(N'dbo.CourseClasses', N'LecturerId') IS NOT NULL
  BEGIN
    INSERT dbo.CourseClassLecturers(CourseClassId, LecturerId, AssignmentRole, IsActive, AssignedAt)
    SELECT c.Id,c.LecturerId,N'PRIMARY',1,COALESCE(c.UpdatedAt,c.CreatedAt,SYSDATETIME())
    FROM dbo.CourseClasses c
    JOIN dbo.Users u ON u.Id=c.LecturerId AND u.Role=N'LECTURER' AND u.DeletedAt IS NULL
    WHERE c.LecturerId IS NOT NULL AND c.DeletedAt IS NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.CourseClassLecturers link WHERE link.CourseClassId=c.Id AND link.LecturerId=c.LecturerId);
    IF EXISTS (
      SELECT 1 FROM dbo.CourseClasses c
      JOIN dbo.Users u ON u.Id=c.LecturerId AND u.Role=N'LECTURER' AND u.DeletedAt IS NULL
      WHERE c.LecturerId IS NOT NULL AND c.DeletedAt IS NULL
        AND NOT EXISTS (SELECT 1 FROM dbo.CourseClassLecturers link WHERE link.CourseClassId=c.Id AND link.LecturerId=c.LecturerId)
    ) THROW 51040, 'CourseClasses.LecturerId backfill is incomplete.', 1;
  END;
  IF EXISTS (
    SELECT 1 FROM dbo.CourseClassLecturers link
    LEFT JOIN dbo.CourseClasses c ON c.Id=link.CourseClassId
    LEFT JOIN dbo.Users u ON u.Id=link.LecturerId
    WHERE c.Id IS NULL OR u.Id IS NULL
  ) THROW 51041, 'CourseClassLecturers contains orphan references.', 1;
  IF EXISTS (
    SELECT CourseClassId,LecturerId FROM dbo.CourseClassLecturers
    GROUP BY CourseClassId,LecturerId HAVING COUNT(*)>1
  ) THROW 51042, 'CourseClassLecturers contains duplicate assignments.', 1;
  IF EXISTS (
    SELECT CourseClassId FROM dbo.CourseClassLecturers
    WHERE AssignmentRole=N'PRIMARY' AND IsActive=1
    GROUP BY CourseClassId HAVING COUNT(*)>1
  ) THROW 51043, 'A course class has more than one active PRIMARY lecturer.', 1;
  IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE parent_object_id=OBJECT_ID(N'dbo.CourseClassLecturers')
      AND (is_disabled=1 OR is_not_trusted=1)
  ) THROW 51044, 'CourseClassLecturers has disabled or untrusted foreign keys.', 1;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
