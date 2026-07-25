SET XACT_ABORT ON;
BEGIN TRY
 BEGIN TRANSACTION;
 IF COL_LENGTH(N'dbo.CourseClasses',N'CourseClassCode') IS NULL ALTER TABLE dbo.CourseClasses ADD CourseClassCode NVARCHAR(80) NULL;
 IF COL_LENGTH(N'dbo.CourseClasses',N'SectionNumber') IS NULL ALTER TABLE dbo.CourseClasses ADD SectionNumber INT NULL;
 EXEC(N';WITH numbered AS(SELECT Id,ROW_NUMBER()OVER(PARTITION BY SemesterId,SubjectId ORDER BY CreatedAt,Id)sectionNumber FROM dbo.CourseClasses) UPDATE c SET SectionNumber=n.sectionNumber FROM dbo.CourseClasses c JOIN numbered n ON n.Id=c.Id WHERE c.SectionNumber IS NULL');
 EXEC(N'UPDATE c SET CourseClassCode=CONCAT(CASE WHEN UPPER(ISNULL(sem.Code,N'''')) LIKE N''%HE%'' OR LOWER(sem.Name) LIKE N''%hè%'' THEN N''3'' WHEN UPPER(ISNULL(sem.Code,N'''')) LIKE N''%2%'' OR sem.Name LIKE N''%2%'' THEN N''2'' ELSE N''1'' END,RIGHT(LEFT(ay.Name,4),2),RIGHT(ay.Name,2),N''-'',sub.Code,N''-'',RIGHT(N''00''+CONVERT(NVARCHAR(10),c.SectionNumber),2)) FROM dbo.CourseClasses c JOIN dbo.Subjects sub ON sub.Id=c.SubjectId JOIN dbo.Semesters sem ON sem.Id=c.SemesterId JOIN dbo.AcademicYears ay ON ay.Id=sem.AcademicYearId WHERE c.CourseClassCode IS NULL OR c.CourseClassCode=c.Code');
 EXEC(N'ALTER TABLE dbo.CourseClasses ALTER COLUMN CourseClassCode NVARCHAR(80) NOT NULL');
 EXEC(N'ALTER TABLE dbo.CourseClasses ALTER COLUMN SectionNumber INT NOT NULL');
 IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.CourseClasses')AND name=N'CK_CourseClasses_SectionNumber')
  EXEC(N'ALTER TABLE dbo.CourseClasses ADD CONSTRAINT CK_CourseClasses_SectionNumber CHECK(SectionNumber>0)');
 IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClasses')AND name=N'UX_CourseClasses_CourseClassCode')
  EXEC(N'CREATE UNIQUE INDEX UX_CourseClasses_CourseClassCode ON dbo.CourseClasses(CourseClassCode) WHERE DeletedAt IS NULL');
 IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClasses')AND name=N'UX_CourseClasses_Semester_Subject_Section')
  EXEC(N'CREATE UNIQUE INDEX UX_CourseClasses_Semester_Subject_Section ON dbo.CourseClasses(SemesterId,SubjectId,SectionNumber) WHERE DeletedAt IS NULL');
 COMMIT TRANSACTION;
END TRY
BEGIN CATCH
 IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
 THROW;
END CATCH;
