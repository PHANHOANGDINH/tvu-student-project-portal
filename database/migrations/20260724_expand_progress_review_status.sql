SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @constraint SYSNAME,@sql NVARCHAR(1000);
  SELECT TOP 1 @constraint=cc.name FROM sys.check_constraints cc
  WHERE cc.parent_object_id=OBJECT_ID('dbo.Submissions') AND cc.definition LIKE '%Status%';
  IF @constraint IS NOT NULL
  BEGIN
    SET @sql=N'ALTER TABLE dbo.Submissions DROP CONSTRAINT '+QUOTENAME(@constraint);
    EXEC sp_executesql @sql;
  END;
  ALTER TABLE dbo.Submissions ADD CONSTRAINT CK_Submissions_Status CHECK(Status IN(
    'DRAFT','SUBMITTED','LATE','RESUBMITTED','UNDER_REVIEW','REQUIRES_REVISION','GRADED','COMPLETED','NOT_MET'));
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
