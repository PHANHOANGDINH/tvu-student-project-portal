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
- giảng viên chấm bài cuối kỳ;
- thêm sinh viên vào nhóm;
- duyệt hoặc yêu cầu sửa đăng ký đề tài nhóm;
- tạo/mở yêu cầu nộp bài;
- sinh viên nộp bài;
- yêu cầu chỉnh sửa và công bố điểm.

API `/api/notifications` từ `main` tiếp tục cung cấp danh sách, unread count,
đánh dấu một hoặc tất cả notification đã đọc. Các service nhóm/nộp bài/chấm
điểm không insert `Notifications` trực tiếp; chúng ghi event vào outbox và dùng
UUID ổn định suy ra từ `eventKey` để giữ idempotency.

Các model cũ đã hỗ trợ transaction dùng chung thì ghi nghiệp vụ và outbox trong
cùng transaction. Một số repository mới từ `main` tự quản lý transaction nội
bộ rồi mới gọi notification service; merge này không viết lại toàn bộ lớp dữ
liệu, nên vẫn còn một khoảng lỗi nhỏ giữa commit nghiệp vụ và ghi outbox ở các
luồng đó. Bước tiếp theo là cho các repository này nhận transaction/outbox event
để loại bỏ hoàn toàn khoảng lỗi.

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
