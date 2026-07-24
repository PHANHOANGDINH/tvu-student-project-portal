SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @constraint SYSNAME,@sql NVARCHAR(1000);
  SELECT TOP 1 @constraint=cc.name FROM sys.check_constraints cc
  WHERE cc.parent_object_id=OBJECT_ID('dbo.SubmissionFiles') AND cc.definition LIKE '%ItemType%';
  IF @constraint IS NOT NULL
  BEGIN
    SET @sql=N'ALTER TABLE dbo.SubmissionFiles DROP CONSTRAINT '+QUOTENAME(@constraint);
    EXEC sp_executesql @sql;
  END;
  ALTER TABLE dbo.SubmissionFiles ADD CONSTRAINT CK_SubmissionFiles_ItemType
    CHECK(ItemType IN('REPORT','SLIDE','SOURCE_CODE','OTHER','REPORT_FILE'));
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
