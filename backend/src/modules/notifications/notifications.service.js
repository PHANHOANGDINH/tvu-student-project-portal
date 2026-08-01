import { poolPromise, sql } from '../../config/db.js';
import {
  createNotificationEvent,
  eventIdFromKey,
} from '../../messaging/notification.events.js';
import { enqueueOutboxEvent } from '../../messaging/outbox.repository.js';
import * as repo from './notifications.repository.js';

const ok = (data, message) => ({ success: true, statusCode: 200, data, message });
const fail = (statusCode, message) => ({ success: false, statusCode, message });

export async function notifyUsers(userIds, data, actor) {
  const recipientIds = [...new Set(userIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  if (!recipientIds.length) return;

  const event = createNotificationEvent({
    eventId: eventIdFromKey(data.eventKey),
    eventType: data.type,
    recipientIds,
    actor,
    entityType: data.relatedEntityType,
    entityId: data.relatedEntityId,
    payload: {
      title: data.title,
      message: data.message,
      legacyEventKey: data.eventKey,
    },
    correlationId: data.eventKey,
  });

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    await enqueueOutboxEvent(transaction, event);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function notifyGroup(groupId, data, actor) {
  return notifyUsers(await repo.groupUsers(groupId), data, actor);
}

export async function notifyClass(classId, data, actor) {
  return notifyUsers(await repo.classStudents(classId), data, actor);
}

export async function list(user, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return ok({ items: await repo.list(user.id, { page, pageSize }), page, pageSize }, 'Lấy thông báo thành công');
}

export async function count(user) {
  return ok({ count: await repo.unreadCount(user.id) }, 'Lấy số thông báo chưa đọc thành công');
}

export async function read(id, user) {
  const item = await repo.markRead(Number(id), user.id);
  return item ? ok(item, 'Đánh dấu đã đọc thành công') : fail(404, 'Không tìm thấy thông báo');
}

export async function readAll(user) {
  return ok({ updated: await repo.markAll(user.id) }, 'Đánh dấu tất cả đã đọc thành công');
}
