SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  IF OBJECT_ID('dbo.SubmissionItemResponses','U') IS NULL
  BEGIN
    CREATE TABLE dbo.SubmissionItemResponses(
      Id INT IDENTITY(1,1) PRIMARY KEY,
      SubmissionAttemptId INT NOT NULL,
      RequiredSubmissionItemId INT NOT NULL,
      TextValue NVARCHAR(MAX) NULL,
      UrlValue NVARCHAR(2048) NULL,
      SubmissionFileId INT NULL,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_SubmissionItemResponses_CreatedAt DEFAULT SYSDATETIME(),
      UpdatedAt DATETIME2 NULL,
      CONSTRAINT FK_SubmissionItemResponses_Attempt FOREIGN KEY(SubmissionAttemptId) REFERENCES dbo.SubmissionAttempts(Id),
      CONSTRAINT FK_SubmissionItemResponses_Item FOREIGN KEY(RequiredSubmissionItemId) REFERENCES dbo.RequiredSubmissionItems(Id),
      CONSTRAINT FK_SubmissionItemResponses_File FOREIGN KEY(SubmissionFileId) REFERENCES dbo.SubmissionFiles(Id),
      CONSTRAINT UX_SubmissionItemResponses_Attempt_Item UNIQUE(SubmissionAttemptId,RequiredSubmissionItemId),
      CONSTRAINT CK_SubmissionItemResponses_OneValue CHECK(
        (CASE WHEN TextValue IS NULL THEN 0 ELSE 1 END+
         CASE WHEN UrlValue IS NULL THEN 0 ELSE 1 END+
         CASE WHEN SubmissionFileId IS NULL THEN 0 ELSE 1 END)=1)
    );
    CREATE INDEX IX_SubmissionItemResponses_Attempt ON dbo.SubmissionItemResponses(SubmissionAttemptId);
  END;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
