import { sql, poolPromise } from '../config/db.js';

export async function enqueueOutboxEvent(transaction, event) {
  await transaction.request()
    .input('EventId', sql.UniqueIdentifier, event.eventId)
    .input('EventType', sql.NVarChar(100), event.eventType)
    .input('Payload', sql.NVarChar(sql.MAX), JSON.stringify(event))
    .input('CorrelationId', sql.NVarChar(100), event.correlationId)
    .query(`
      INSERT INTO NotificationOutbox (EventId, EventType, Payload, CorrelationId)
      VALUES (@EventId, @EventType, @Payload, @CorrelationId)
    `);
}

export async function claimOutboxEvents(batchSize = 20) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('BatchSize', sql.Int, batchSize)
    .query(`
      UPDATE NotificationOutbox
      SET Status = 'Pending', LockedAt = NULL
      WHERE Status = 'Processing' AND LockedAt < DATEADD(MINUTE, -5, SYSUTCDATETIME());

      ;WITH pending AS (
        SELECT TOP (@BatchSize) *
        FROM NotificationOutbox WITH (UPDLOCK, READPAST, ROWLOCK)
        WHERE Status = 'Pending' AND AvailableAt <= SYSUTCDATETIME()
        ORDER BY CreatedAt
      )
      UPDATE pending
      SET Status = 'Processing', LockedAt = SYSUTCDATETIME(), Attempts = Attempts + 1
      OUTPUT INSERTED.EventId, INSERTED.Payload, INSERTED.Attempts, INSERTED.CorrelationId;
    `);
  return result.recordset;
}

export async function markOutboxSent(eventId) {
  const pool = await poolPromise;
  await pool.request().input('EventId', sql.UniqueIdentifier, eventId).query(`
    UPDATE NotificationOutbox
    SET Status = 'Sent', SentAt = SYSUTCDATETIME(), LockedAt = NULL, LastError = NULL
    WHERE EventId = @EventId
  `);
}

export async function releaseOutboxEvent(eventId, error, attempts) {
  const pool = await poolPromise;
  const delaySeconds = Math.min(300, 2 ** Math.min(attempts, 8));
  const maxAttempts = Number(process.env.OUTBOX_MAX_ATTEMPTS || 20);
  await pool.request()
    .input('EventId', sql.UniqueIdentifier, eventId)
    .input('LastError', sql.NVarChar(1000), String(error?.message || error).slice(0, 1000))
    .input('DelaySeconds', sql.Int, delaySeconds)
    .input('MaxAttempts', sql.Int, maxAttempts)
    .query(`
      UPDATE NotificationOutbox
      SET Status = CASE WHEN Attempts >= @MaxAttempts THEN 'Failed' ELSE 'Pending' END,
          AvailableAt = DATEADD(SECOND, @DelaySeconds, SYSUTCDATETIME()),
          LockedAt = NULL,
          LastError = @LastError
      WHERE EventId = @EventId
    `);
}
