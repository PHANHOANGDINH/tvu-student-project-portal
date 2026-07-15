-- Normalize legacy user roles to ADMIN, LECTURER, STUDENT.
-- Review affected rows before running this script on a shared database.
-- This script does not delete data and does not reset the database.

BEGIN TRY
  BEGIN TRANSACTION;

  DECLARE @RoleConstraintName SYSNAME;
  DECLARE @Sql NVARCHAR(MAX);

  SELECT TOP 1 @RoleConstraintName = cc.name
  FROM sys.check_constraints cc
  JOIN sys.tables t ON t.object_id = cc.parent_object_id
  WHERE t.name = 'Users'
    AND cc.definition LIKE '%Role%';

  IF @RoleConstraintName IS NOT NULL
  BEGIN
    SET @Sql = N'ALTER TABLE dbo.Users DROP CONSTRAINT ' + QUOTENAME(@RoleConstraintName) + N';';
    EXEC sp_executesql @Sql;
  END;

  UPDATE dbo.Users
  SET Role = CASE
    WHEN Role IN ('Admin', 'admin', 'ADMIN') THEN 'ADMIN'
    WHEN Role IN ('Teacher', 'teacher', 'TEACHER', 'Lecturer', 'lecturer', 'LECTURER', 'GIANGVIEN', 'GiangVien') THEN 'LECTURER'
    WHEN Role IN ('Student', 'student', 'STUDENT', 'SINHVIEN', 'SinhVien') THEN 'STUDENT'
    ELSE Role
  END,
  UpdatedAt = SYSDATETIME()
  WHERE Role IN (
    'Admin', 'admin', 'ADMIN',
    'Teacher', 'teacher', 'TEACHER', 'Lecturer', 'lecturer', 'LECTURER', 'GIANGVIEN', 'GiangVien',
    'Student', 'student', 'STUDENT', 'SINHVIEN', 'SinhVien'
  );

  IF EXISTS (
    SELECT 1
    FROM dbo.Users
    WHERE Role NOT IN ('ADMIN', 'LECTURER', 'STUDENT')
  )
  BEGIN
    THROW 51000, 'Users table contains roles outside ADMIN, LECTURER, STUDENT.', 1;
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Users_Role_Standard'
      AND parent_object_id = OBJECT_ID('dbo.Users')
  )
  BEGIN
    ALTER TABLE dbo.Users WITH CHECK
      ADD CONSTRAINT CK_Users_Role_Standard CHECK (Role IN ('ADMIN', 'LECTURER', 'STUDENT'));
  END;

  SELECT Role, COUNT(*) AS Total
  FROM dbo.Users
  GROUP BY Role;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  THROW;
END CATCH;
