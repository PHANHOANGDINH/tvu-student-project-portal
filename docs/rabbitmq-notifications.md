# RabbitMQ notification pipeline

## Thành phần

- `notification.events.js`: contract và validation.
- `outbox.repository.js`: ghi/claim/đánh dấu outbox.
- `outbox.publisher.js`: publish event bằng confirm channel.
- `rabbitmq.broker.js`: kết nối, reconnect và khai báo topology.
- `notification.consumer.js`: manual ack, retry và DLQ.
- `notification.handler.js`: insert notification idempotent.
- `notification.worker.js`: tiến trình publisher/consumer và graceful shutdown.

API không kết nối RabbitMQ. Mỗi thay đổi nghiệp vụ được commit cùng một row
`NotificationOutbox`. Nếu broker dừng, row vẫn ở SQL Server và worker thử lại
với exponential backoff. Nếu publish thành công nhưng cập nhật outbox thất bại,
event có thể được publish lại; handler dùng `eventId` làm `EventKey`, kết hợp
unique `(UserId, EventKey)`, nên không tạo notification trùng.

## Topology

| Thành phần | Tên mặc định | Chính sách |
| --- | --- | --- |
| Main exchange | `tvu.notifications` | direct, durable |
| Consumer queue | `tvu.notifications.process` | durable |
| Retry exchange/queue | `tvu.notifications.retry` | durable, TTL 5 giây |
| Dead exchange/queue | `tvu.notifications.dead` | durable |
| Routing key | `notification.created` | cố định |

Message dùng delivery mode persistent. Consumer có `prefetch=10`, manual ack và
chỉ ack sau khi handler hoàn tất hoặc sau khi republish retry/DLQ đã được broker
confirm. `RABBITMQ_MAX_RETRIES=3` ngăn retry vô hạn.

## Event đã chuyển đổi

- admin thêm sinh viên vào lớp;
- admin duyệt/từ chối đề tài;
- giảng viên duyệt/từ chối đăng ký đề tài;
- giảng viên phản hồi tiến độ;
- giảng viên chấm bài cuối kỳ.

Repo hiện không có luồng ghi nhóm hoặc API tạo thông báo quản trị, nên hai loại
này chưa được giả lập. Khi bổ sung nghiệp vụ, model/repository phải ghi outbox
trong cùng transaction thay vì publish trực tiếp.

## Chạy và quan sát

```bash
docker compose up -d
docker compose ps
docker compose logs -f notification-worker
```

Local management UI dùng `http://localhost:15672` với credential từ `.env`.
Production không publish AMQP hoặc management port.

Kiểm tra queue không in nội dung message:

```bash
docker compose exec rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged
```

Worker riêng ngoài Docker:

```bash
cd backend
npm run worker:notifications
```

## Failure recovery

1. Dừng RabbitMQ: API vẫn commit nghiệp vụ và outbox.
2. Khởi động RabbitMQ: worker reconnect và publish pending outbox.
3. Restart worker: row `Processing` quá 5 phút được trả về `Pending`.
4. Publish trùng: unique notification key bỏ qua bản sao.
5. Message lỗi: retry giới hạn rồi chuyển `tvu.notifications.dead`.

DLQ phải được điều tra và replay có kiểm soát; không tự động replay vô hạn.
Log chỉ ghi `eventId`, `correlationId`, số retry và lỗi đã cắt ngắn.

## Migration

`database/migrations/20260729_add_notification_outbox.sql` chỉ thêm bảng/index
outbox và có guard idempotent. `database/schema-baseline.sql` không bị sửa.
