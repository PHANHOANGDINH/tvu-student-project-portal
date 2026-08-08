IF COL_LENGTH(N'dbo.Users', N'AcademicDegree') IS NULL
BEGIN
  ALTER TABLE dbo.Users ADD AcademicDegree NVARCHAR(100) NULL;
END;
