SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Notifications (
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(1000) NOT NULL,
    RelatedEntityType NVARCHAR(50) NULL,
    RelatedEntityId INT NULL,
    EventKey NVARCHAR(200) NOT NULL,
    IsRead BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSDATETIME(),
    ReadAt DATETIME2 NULL,
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
    CONSTRAINT UQ_Notifications_User_Event UNIQUE (UserId, EventKey)
  );
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.Notifications') AND name = N'IX_Notifications_User_Unread'
)
  CREATE INDEX IX_Notifications_User_Unread
    ON dbo.Notifications (UserId, IsRead, CreatedAt DESC);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.Notifications') AND name = N'IX_Notifications_User_Created'
)
  CREATE INDEX IX_Notifications_User_Created
    ON dbo.Notifications (UserId, CreatedAt DESC);

COMMIT TRANSACTION;
