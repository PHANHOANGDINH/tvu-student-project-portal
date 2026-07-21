SET XACT_ABORT ON;

-- Existing installations originally linked the canonical workflow tables to
-- legacy Classes. A clean database already uses CourseClasses and skips this.
IF EXISTS (
  SELECT 1
  FROM sys.foreign_keys
  WHERE parent_object_id = OBJECT_ID(N'dbo.StudentGroups')
    AND referenced_object_id = OBJECT_ID(N'dbo.Classes')
)
BEGIN
  BEGIN TRY
    BEGIN TRANSACTION;

    SELECT DISTINCT legacy.Id AS LegacyClassId, canonical.Id AS CourseClassId
    INTO #ClassMap
    FROM dbo.Classes legacy
    LEFT JOIN dbo.CourseClasses canonical ON canonical.Code = legacy.ClassCode
    WHERE legacy.Id IN (
      SELECT ClassId FROM dbo.StudentGroups
      UNION SELECT ClassId FROM dbo.GroupMembers
      UNION SELECT ClassId FROM dbo.TopicRegistrations
      UNION SELECT ClassId FROM dbo.SubmissionRequirements
    );

    IF EXISTS (SELECT 1 FROM #ClassMap WHERE CourseClassId IS NULL)
      THROW 51020, 'Cannot migrate academic references: a used legacy class has no matching CourseClasses.Code.', 1;

    IF EXISTS (
      SELECT legacy.Id
      FROM dbo.Classes legacy
      JOIN dbo.CourseClasses canonical ON canonical.Code = legacy.ClassCode
      WHERE legacy.Id IN (SELECT LegacyClassId FROM #ClassMap)
      GROUP BY legacy.Id
      HAVING COUNT(*) <> 1
    )
      THROW 51021, 'Cannot migrate academic references: class-code mapping is not unique.', 1;

    IF EXISTS (
      SELECT CourseClassId
      FROM #ClassMap
      GROUP BY CourseClassId
      HAVING COUNT(DISTINCT LegacyClassId) > 1
    )
      THROW 51022, 'Cannot migrate academic references: multiple legacy classes map to one course class.', 1;

    ALTER TABLE dbo.StudentGroups DROP CONSTRAINT FK_StudentGroups_Classes;
    ALTER TABLE dbo.GroupMembers DROP CONSTRAINT FK_GroupMembers_Classes;
    ALTER TABLE dbo.TopicRegistrations DROP CONSTRAINT FK_TopicRegistrations_Classes;
    ALTER TABLE dbo.SubmissionRequirements DROP CONSTRAINT FK_SubmissionRequirements_Classes;

    UPDATE target SET ClassId = mapping.CourseClassId
    FROM dbo.StudentGroups target JOIN #ClassMap mapping ON mapping.LegacyClassId = target.ClassId;
    UPDATE target SET ClassId = mapping.CourseClassId
    FROM dbo.GroupMembers target JOIN #ClassMap mapping ON mapping.LegacyClassId = target.ClassId;
    UPDATE target SET ClassId = mapping.CourseClassId
    FROM dbo.TopicRegistrations target JOIN #ClassMap mapping ON mapping.LegacyClassId = target.ClassId;
    UPDATE target SET ClassId = mapping.CourseClassId
    FROM dbo.SubmissionRequirements target JOIN #ClassMap mapping ON mapping.LegacyClassId = target.ClassId;

    ALTER TABLE dbo.StudentGroups WITH CHECK ADD CONSTRAINT FK_StudentGroups_CourseClasses FOREIGN KEY (ClassId) REFERENCES dbo.CourseClasses(Id);
    ALTER TABLE dbo.GroupMembers WITH CHECK ADD CONSTRAINT FK_GroupMembers_CourseClasses FOREIGN KEY (ClassId) REFERENCES dbo.CourseClasses(Id);
    ALTER TABLE dbo.TopicRegistrations WITH CHECK ADD CONSTRAINT FK_TopicRegistrations_CourseClasses FOREIGN KEY (ClassId) REFERENCES dbo.CourseClasses(Id);
    ALTER TABLE dbo.SubmissionRequirements WITH CHECK ADD CONSTRAINT FK_SubmissionRequirements_CourseClasses FOREIGN KEY (ClassId) REFERENCES dbo.CourseClasses(Id);

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH;
END;
