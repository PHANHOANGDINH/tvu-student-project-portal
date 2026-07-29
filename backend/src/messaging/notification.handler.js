import { sql, poolPromise } from '../config/db.js';
import { validateNotificationEvent } from './notification.events.js';

export async function handleNotificationEvent(event) {
  const errors = validateNotificationEvent(event);
  if (errors.length) throw new Error(`Invalid notification event: ${errors.join(', ')}`);

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    for (const recipientId of event.recipientIds) {
      await transaction.request()
        .input('UserId', sql.Int, recipientId)
        .input('Type', sql.NVarChar(50), event.eventType.slice(0, 50))
        .input('Title', sql.NVarChar(200), event.payload.title.slice(0, 200))
        .input('Message', sql.NVarChar(1000), event.payload.message.slice(0, 1000))
        .input('RelatedEntityType', sql.NVarChar(50), event.entityType.slice(0, 50))
        .input('RelatedEntityId', sql.Int, event.entityId)
        .input('EventKey', sql.NVarChar(200), event.eventId)
        .query(`
          IF NOT EXISTS (
            SELECT 1 FROM Notifications WITH (UPDLOCK, HOLDLOCK)
            WHERE UserId = @UserId AND EventKey = @EventKey
          )
            INSERT INTO Notifications (
              UserId, Type, Title, Message, RelatedEntityType,
              RelatedEntityId, EventKey, IsRead, CreatedAt
            )
            VALUES (
              @UserId, @Type, @Title, @Message, @RelatedEntityType,
              @RelatedEntityId, @EventKey, 0, SYSUTCDATETIME()
            );
        `);
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
