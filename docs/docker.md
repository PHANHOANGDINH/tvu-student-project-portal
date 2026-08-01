# Chạy TVU Student Project Portal bằng Docker

## Thành phần

Docker Compose chạy bốn service:

- `database`: Microsoft SQL Server 2022 Developer trên Linux container;
- `database-init`: tạo database, cài schema baseline và áp dụng migration;
- `database-seed`: tùy chọn tạo một admin local từ biến môi trường;
- `backend`: Node.js/Express production container;
- `frontend`: React production build được phục vụ bởi Nginx.

Nginx phục vụ SPA và reverse proxy `/api`, `/api-docs` và `/api-docs.json` tới
backend qua Docker network. Frontend được build với `VITE_API_BASE_URL=/api`,
vì vậy trình duyệt dùng cùng origin với frontend và không phụ thuộc hostname
container hoặc `localhost` được hard-code trong bundle.

## Yêu cầu

- Docker Desktop dùng Linux containers;
- Docker Compose v2;
- đủ tài nguyên cho SQL Server (khuyến nghị ít nhất 2 GB RAM dành cho Docker);
- password SQL Server đủ mạnh theo chính sách của image.

## Nguồn schema và dữ liệu

`database/schema-baseline.sql` là schema-only deployment script được xuất từ
database local `TvuStudentProjectPortal` bằng Microsoft SqlPackage/DacFx. Script
gồm bảng, column, default/check/unique/foreign-key constraint và index mà
database nguồn đang có tại thời điểm export.

Baseline không chứa row data, password hash, login, database user, permission,
secret hoặc runtime upload. Repo hiện không có view, stored procedure hay
trigger trong database nguồn.

Không sửa baseline đã được dùng trên môi trường chia sẻ. Khi schema thay đổi,
thêm migration mới vào `database/migrations` và kiểm thử trên volume mới.

## Thứ tự khởi tạo

`database-init` chạy sau khi SQL Server healthy:

1. tạo database từ `DB_DATABASE` nếu chưa có;
2. tạo bảng hạ tầng `DockerSchemaMigrations`;
3. chạy `schema-baseline.sql` nếu chưa có bảng `Users`;
4. ghi nhận baseline;
5. chạy từng file trong `database/migrations` theo thứ tự tên nếu chưa được ghi
   nhận.

Nếu database đã có schema/dữ liệu, baseline được bỏ qua để không ghi đè dữ liệu.
Migration đã thành công được lưu trong `DockerSchemaMigrations` và được bỏ qua
ở lần chạy sau. Vì vậy recreate `database-init` không tạo lại bảng hoặc chạy
trùng migration.

Sau init, `database-seed` chỉ tạo admin local nếu cả
`DOCKER_SEED_ADMIN_EMAIL` và `DOCKER_SEED_ADMIN_PASSWORD` được cấu hình. Seed
không thay đổi tài khoản đã tồn tại và không ghi password ra log.

## Cấu hình

Sao chép file mẫu thành `.env` tại thư mục gốc:

```powershell
Copy-Item .env.docker.example .env
```

Thay các placeholder:

- `MSSQL_SA_PASSWORD`: mật khẩu local đủ mạnh theo chính sách SQL Server;
- `JWT_SECRET`: chuỗi local dài, ngẫu nhiên;
- `DB_DATABASE`: tên database chỉ gồm chữ, số và dấu gạch dưới;
- `DOCKER_SEED_ADMIN_EMAIL` và `DOCKER_SEED_ADMIN_PASSWORD`: tùy chọn để tạo
  admin local. Password phải dài ít nhất 12 ký tự và có chữ hoa, chữ thường,
  chữ số;
- các port nếu port mặc định đang được dùng;
- `CORS_ALLOWED_ORIGINS`: origin frontend được phép, mặc định
  `http://localhost:8080`; phân cách nhiều origin bằng dấu phẩy.

Không commit `.env`. Không dùng credential production trong môi trường local.

## Build và chạy

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

Compose đợi SQL Server healthy, chạy `database-init`, chạy seed tùy chọn, sau
đó mới khởi động backend. Frontend chỉ khởi động sau khi backend healthy.

## Xác minh

Với port mặc định:

```bash
curl http://localhost:8080/health
curl http://localhost:5000/api/health
curl http://localhost:8080/api/health
curl http://localhost:5000/api-docs.json
curl http://localhost:8080/api-docs.json
```

Mở trong trình duyệt:

- Frontend: <http://localhost:8080>
- Swagger qua frontend proxy: <http://localhost:8080/api-docs>
- Backend API trực tiếp: <http://localhost:5000/api>
- Swagger trực tiếp: <http://localhost:5000/api-docs>

Kiểm tra health và restart:

```bash
docker compose ps
docker inspect --format "{{.Name}} {{.State.Health.Status}} {{.RestartCount}}" \
  tvu-student-project-portal-database-1 \
  tvu-student-project-portal-backend-1 \
  tvu-student-project-portal-frontend-1
```

Kiểm tra CORS bằng đúng origin:

```bash
curl -i -H "Origin: http://localhost:8080" \
  http://localhost:5000/api/health
```

Response phải có `Access-Control-Allow-Origin: http://localhost:8080`, không
phải wildcard. Gọi `/api/health` qua Nginx là same-origin nên trình duyệt không
cần CORS.

## Volume

- `sqlserver_data` giữ `/var/opt/mssql`;
- `backend_uploads` giữ `/app/uploads`.

Kiểm tra volume upload mà không sửa source:

```bash
docker compose exec backend sh -c \
  "touch /app/uploads/.volume-check && test -f /app/uploads/.volume-check"
docker compose restart backend
docker compose exec backend test -f /app/uploads/.volume-check
docker compose exec backend rm /app/uploads/.volume-check
```

## Test ngoài container

```bash
cd backend
npm test

cd ../frontend
npm run lint
npm run build
```

Nếu package hiện tại không khai báo script test backend, npm sẽ báo thiếu
script; ghi nhận kết quả thay vì thêm dependency hoặc thay đổi nghiệp vụ.

## Dừng

```bash
docker compose down
```

Không thêm `-v` nếu muốn giữ database và upload. Chỉ xóa volume khi đã xác nhận
dữ liệu không còn cần thiết và có backup phù hợp.

## Xử lý sự cố

```bash
docker compose ps
docker compose logs database
docker compose logs database-init
docker compose logs backend
docker compose logs frontend
```

- SQL Server không healthy: kiểm tra Docker đang dùng Linux containers, RAM và
  chính sách mật khẩu.
- `database-init` lỗi: xem migration đầu tiên chưa được ghi nhận trong log và
  sửa lỗi trước khi chạy lại; migration đã thành công sẽ không chạy trùng.
- Backend không healthy: kiểm tra init/seed, tên database và credential.
- Seed lỗi: kiểm tra email/password local đáp ứng yêu cầu, hoặc để trống cả hai
  biến để bỏ qua.
- CORS bị từ chối: bảo đảm origin trình duyệt khớp chính xác
  `CORS_ALLOWED_ORIGINS`.

## RabbitMQ và notification worker

Compose chạy thêm `rabbitmq` và `notification-worker`. RabbitMQ giữ dữ liệu
trong volume `rabbitmq_data`; worker đọc SQL outbox, publish event persistent và
consume bằng manual ack. Điền `RABBITMQ_USER` và `RABBITMQ_PASSWORD` trong
`.env`; không dùng placeholder. Local publish AMQP `5672` và management UI
`15672`. Production không public hai port này.

```bash
docker compose ps rabbitmq notification-worker
docker compose logs notification-worker
docker compose exec rabbitmq rabbitmqctl list_queues name messages_ready
```

Không dùng `docker compose down -v` nếu cần giữ SQL, upload hoặc RabbitMQ data.
Xem [rabbitmq-notifications.md](rabbitmq-notifications.md) để kiểm thử
retry/DLQ và failure recovery.
