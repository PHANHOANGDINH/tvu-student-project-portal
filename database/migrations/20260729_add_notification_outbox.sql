SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.NotificationOutbox', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.NotificationOutbox (
    EventId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_NotificationOutbox PRIMARY KEY,
    EventType NVARCHAR(100) NOT NULL,
    Payload NVARCHAR(MAX) NOT NULL,
    CorrelationId NVARCHAR(100) NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_NotificationOutbox_Status DEFAULT N'Pending',
    Attempts INT NOT NULL CONSTRAINT DF_NotificationOutbox_Attempts DEFAULT 0,
    AvailableAt DATETIME2 NOT NULL CONSTRAINT DF_NotificationOutbox_AvailableAt DEFAULT SYSUTCDATETIME(),
    LockedAt DATETIME2 NULL,
    SentAt DATETIME2 NULL,
    LastError NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_NotificationOutbox_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_NotificationOutbox_Status CHECK (Status IN (N'Pending', N'Processing', N'Sent', N'Failed'))
  );

  CREATE INDEX IX_NotificationOutbox_Pending
    ON dbo.NotificationOutbox (Status, AvailableAt, CreatedAt)
    INCLUDE (Attempts, LockedAt);
END;

COMMIT TRANSACTION;
