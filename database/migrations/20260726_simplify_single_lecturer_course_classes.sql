SET XACT_ABORT ON;
BEGIN TRY
 BEGIN TRANSACTION;

 IF COL_LENGTH(N'dbo.CourseClasses',N'LecturerId') IS NULL
  ALTER TABLE dbo.CourseClasses ADD LecturerId INT NULL;
 IF COL_LENGTH(N'dbo.CourseClasses',N'CourseClassCode') IS NULL
  ALTER TABLE dbo.CourseClasses ADD CourseClassCode NVARCHAR(80) NULL;
 IF COL_LENGTH(N'dbo.CourseClasses',N'SectionNumber') IS NULL
  ALTER TABLE dbo.CourseClasses ADD SectionNumber INT NULL;
 IF COL_LENGTH(N'dbo.CourseClasses',N'AllowSelfEnrollment') IS NULL
  ALTER TABLE dbo.CourseClasses ADD AllowSelfEnrollment BIT NOT NULL CONSTRAINT DF_CourseClasses_AllowSelfEnrollment_Simple DEFAULT(0);
 IF COL_LENGTH(N'dbo.CourseClasses',N'EnrollmentOpenAt') IS NULL
  ALTER TABLE dbo.CourseClasses ADD EnrollmentOpenAt DATETIME2 NULL;
 IF COL_LENGTH(N'dbo.CourseClasses',N'EnrollmentCloseAt') IS NULL
  ALTER TABLE dbo.CourseClasses ADD EnrollmentCloseAt DATETIME2 NULL;

 IF OBJECT_ID(N'dbo.CourseClassLecturerMigrationReport',N'U') IS NULL
  CREATE TABLE dbo.CourseClassLecturerMigrationReport(
   CourseClassId INT NOT NULL CONSTRAINT PK_CourseClassLecturerMigrationReport PRIMARY KEY,
   PreviousLecturerId INT NULL,SelectedLecturerId INT NULL,SelectionSource NVARCHAR(30) NOT NULL,
   MigratedAt DATETIME2 NOT NULL CONSTRAINT DF_CourseClassLecturerMigrationReport_MigratedAt DEFAULT SYSDATETIME()
  );

 IF OBJECT_ID(N'dbo.CourseClassLecturers',N'U') IS NOT NULL
 BEGIN
  ;WITH chosen AS(
   SELECT c.Id CourseClassId,c.LecturerId PreviousLecturerId,
    CASE WHEN currentUser.Id IS NOT NULL THEN c.LecturerId ELSE assignment.LecturerId END SelectedLecturerId,
    CASE WHEN currentUser.Id IS NOT NULL THEN N'COURSE_CLASSES' WHEN assignment.LecturerId IS NOT NULL THEN N'ASSIGNMENT_STABLE' ELSE N'UNASSIGNED' END SelectionSource
   FROM dbo.CourseClasses c
   LEFT JOIN dbo.Users currentUser ON currentUser.Id=c.LecturerId AND currentUser.Role=N'LECTURER' AND currentUser.IsActive=1 AND currentUser.DeletedAt IS NULL
   OUTER APPLY(SELECT TOP(1) link.LecturerId FROM dbo.CourseClassLecturers link JOIN dbo.Users u ON u.Id=link.LecturerId
    WHERE link.CourseClassId=c.Id AND link.IsActive=1 AND u.Role=N'LECTURER' AND u.IsActive=1 AND u.DeletedAt IS NULL
    ORDER BY link.AssignedAt,link.Id,link.LecturerId)assignment
   WHERE c.DeletedAt IS NULL
  )
  MERGE dbo.CourseClassLecturerMigrationReport target USING chosen source ON target.CourseClassId=source.CourseClassId
  WHEN NOT MATCHED THEN INSERT(CourseClassId,PreviousLecturerId,SelectedLecturerId,SelectionSource)
   VALUES(source.CourseClassId,source.PreviousLecturerId,source.SelectedLecturerId,source.SelectionSource);

  UPDATE c SET LecturerId=r.SelectedLecturerId,UpdatedAt=SYSDATETIME()
  FROM dbo.CourseClasses c JOIN dbo.CourseClassLecturerMigrationReport r ON r.CourseClassId=c.Id
  WHERE (c.LecturerId IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.Users u WHERE u.Id=c.LecturerId AND u.Role=N'LECTURER' AND u.IsActive=1 AND u.DeletedAt IS NULL));
 END;

 EXEC(N';WITH numbered AS(SELECT Id,ROW_NUMBER()OVER(PARTITION BY SemesterId,SubjectId ORDER BY CreatedAt,Id)n FROM dbo.CourseClasses)
 UPDATE c SET SectionNumber=n.n FROM dbo.CourseClasses c JOIN numbered n ON n.Id=c.Id WHERE c.SectionNumber IS NULL');
 EXEC(N'UPDATE c SET CourseClassCode=CONCAT(CASE WHEN UPPER(ISNULL(sem.Code,N'''')) LIKE N''%HE%'' OR LOWER(sem.Name) LIKE N''%hè%'' THEN N''3'' WHEN UPPER(ISNULL(sem.Code,N'''')) LIKE N''%2%'' OR sem.Name LIKE N''%2%'' THEN N''2'' ELSE N''1'' END,RIGHT(LEFT(ay.Name,4),2),RIGHT(ay.Name,2),N''-'',sub.Code,N''-'',RIGHT(N''00''+CONVERT(NVARCHAR(10),c.SectionNumber),2)) FROM dbo.CourseClasses c JOIN dbo.Subjects sub ON sub.Id=c.SubjectId JOIN dbo.Semesters sem ON sem.Id=c.SemesterId JOIN dbo.AcademicYears ay ON ay.Id=sem.AcademicYearId WHERE c.CourseClassCode IS NULL OR c.CourseClassCode=c.Code');
 EXEC(N'ALTER TABLE dbo.CourseClasses ALTER COLUMN CourseClassCode NVARCHAR(80) NOT NULL');
 EXEC(N'ALTER TABLE dbo.CourseClasses ALTER COLUMN SectionNumber INT NOT NULL');
 IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name=N'CK_CourseClasses_SectionNumber_Simple')
  ALTER TABLE dbo.CourseClasses ADD CONSTRAINT CK_CourseClasses_SectionNumber_Simple CHECK(SectionNumber>0);
 IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClasses') AND name=N'UX_CourseClasses_CourseClassCode_Simple')
  CREATE UNIQUE INDEX UX_CourseClasses_CourseClassCode_Simple ON dbo.CourseClasses(CourseClassCode) WHERE DeletedAt IS NULL;
 IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClasses') AND name=N'UX_CourseClasses_Semester_Subject_Section_Simple')
  CREATE UNIQUE INDEX UX_CourseClasses_Semester_Subject_Section_Simple ON dbo.CourseClasses(SemesterId,SubjectId,SectionNumber) WHERE DeletedAt IS NULL;

 IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CourseClassEnrollments') AND name=N'UX_CourseClassEnrollments_Class_Student_Simple')
  CREATE UNIQUE INDEX UX_CourseClassEnrollments_Class_Student_Simple ON dbo.CourseClassEnrollments(CourseClassId,StudentId);
 IF COL_LENGTH(N'dbo.CourseClassEnrollments',N'EnrollmentStatus') IS NULL ALTER TABLE dbo.CourseClassEnrollments ADD EnrollmentStatus NVARCHAR(30) NULL;
 IF COL_LENGTH(N'dbo.CourseClassEnrollments',N'EnrollmentSource') IS NULL ALTER TABLE dbo.CourseClassEnrollments ADD EnrollmentSource NVARCHAR(30) NULL;
 IF COL_LENGTH(N'dbo.CourseClassEnrollments',N'EnrolledAt') IS NULL ALTER TABLE dbo.CourseClassEnrollments ADD EnrolledAt DATETIME2 NULL;
 IF COL_LENGTH(N'dbo.CourseClassEnrollments',N'EnrolledBy') IS NULL ALTER TABLE dbo.CourseClassEnrollments ADD EnrolledBy INT NULL;
 EXEC(N'UPDATE dbo.CourseClassEnrollments SET EnrollmentStatus=CASE WHEN IsActive=1 AND DeletedAt IS NULL THEN N''ACTIVE'' ELSE N''WITHDRAWN'' END WHERE EnrollmentStatus IS NULL;
 UPDATE dbo.CourseClassEnrollments SET EnrollmentSource=N''ADMIN'' WHERE EnrollmentSource IS NULL;
 UPDATE dbo.CourseClassEnrollments SET EnrolledAt=CreatedAt WHERE EnrolledAt IS NULL;
 ALTER TABLE dbo.CourseClassEnrollments ALTER COLUMN EnrollmentStatus NVARCHAR(30) NOT NULL;
 ALTER TABLE dbo.CourseClassEnrollments ALTER COLUMN EnrollmentSource NVARCHAR(30) NOT NULL;
 ALTER TABLE dbo.CourseClassEnrollments ALTER COLUMN EnrolledAt DATETIME2 NOT NULL');
 IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name=N'CK_CourseClassEnrollments_Source_Simple')
  EXEC(N'ALTER TABLE dbo.CourseClassEnrollments ADD CONSTRAINT CK_CourseClassEnrollments_Source_Simple CHECK(EnrollmentSource IN(N''ADMIN'',N''CSV_IMPORT'',N''SELF_ENROLLMENT'',N''TRANSFER''))');
 IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name=N'CK_CourseClassEnrollments_Status_Simple')
  EXEC(N'ALTER TABLE dbo.CourseClassEnrollments ADD CONSTRAINT CK_CourseClassEnrollments_Status_Simple CHECK(EnrollmentStatus IN(N''ACTIVE'',N''WITHDRAWN'',N''TRANSFERRED''))');

 IF EXISTS(SELECT 1 FROM dbo.Users WHERE UserCode=N'GV001' AND Role=N'LECTURER' AND IsActive=1)
  UPDATE c SET LecturerId=u.Id FROM dbo.CourseClasses c CROSS JOIN dbo.Users u WHERE c.Code=N'CNPM_DEMO_01' AND u.UserCode=N'GV001';
 IF EXISTS(SELECT 1 FROM dbo.Users WHERE UserCode=N'GV002' AND Role=N'LECTURER' AND IsActive=1)
  UPDATE c SET LecturerId=u.Id FROM dbo.CourseClasses c CROSS JOIN dbo.Users u WHERE c.Code=N'CNPM_DEMO_02' AND u.UserCode=N'GV002';

 IF OBJECT_ID(N'dbo.CourseClassLecturers',N'U') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE major_id=OBJECT_ID(N'dbo.CourseClassLecturers') AND name=N'Deprecated')
  EXEC sys.sp_addextendedproperty @name=N'Deprecated',@value=N'Use CourseClasses.LecturerId',@level0type=N'SCHEMA',@level0name=N'dbo',@level1type=N'TABLE',@level1name=N'CourseClassLecturers';
 IF OBJECT_ID(N'dbo.AdministrativeClasses',N'U') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE major_id=OBJECT_ID(N'dbo.AdministrativeClasses') AND name=N'Deprecated')
  EXEC sys.sp_addextendedproperty @name=N'Deprecated',@value=N'Not used by simple course management',@level0type=N'SCHEMA',@level0name=N'dbo',@level1type=N'TABLE',@level1name=N'AdministrativeClasses';
 IF OBJECT_ID(N'dbo.AdministrativeClassMemberships',N'U') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE major_id=OBJECT_ID(N'dbo.AdministrativeClassMemberships') AND name=N'Deprecated')
  EXEC sys.sp_addextendedproperty @name=N'Deprecated',@value=N'Not used by simple course management',@level0type=N'SCHEMA',@level0name=N'dbo',@level1type=N'TABLE',@level1name=N'AdministrativeClassMemberships';
 IF OBJECT_ID(N'dbo.CourseClassEligibleClasses',N'U') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE major_id=OBJECT_ID(N'dbo.CourseClassEligibleClasses') AND name=N'Deprecated')
  EXEC sys.sp_addextendedproperty @name=N'Deprecated',@value=N'Not used by simple course management',@level0type=N'SCHEMA',@level0name=N'dbo',@level1type=N'TABLE',@level1name=N'CourseClassEligibleClasses';

 IF EXISTS(SELECT 1 FROM dbo.CourseClasses c LEFT JOIN dbo.Users u ON u.Id=c.LecturerId WHERE c.LecturerId IS NOT NULL AND (u.Id IS NULL OR u.Role<>N'LECTURER' OR u.IsActive=0 OR u.DeletedAt IS NOT NULL))
  THROW 51001,N'LecturerId không hợp lệ sau migration.',1;
 IF EXISTS(SELECT 1 FROM dbo.CourseClassEnrollments e LEFT JOIN dbo.CourseClasses c ON c.Id=e.CourseClassId LEFT JOIN dbo.Users u ON u.Id=e.StudentId WHERE c.Id IS NULL OR u.Id IS NULL)
  THROW 51002,N'Phát hiện enrollment orphan.',1;
 COMMIT TRANSACTION;
END TRY
BEGIN CATCH
 IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
 THROW;
END CATCH;
