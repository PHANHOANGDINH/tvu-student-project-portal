# Chạy TVU Student Project Portal bằng Docker

## Thành phần

Docker Compose chạy bốn service:

- `database`: Microsoft SQL Server 2022 Developer trên Linux container;
- `database-init`: tạo database nếu chưa có và áp dụng migration hiện có khi
  schema nền đã tồn tại;
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
- database schema nền tương thích với source hiện tại.

## Giới hạn schema hiện tại

Repo trên branch này chỉ chứa migration
`database/migrations/20260713_normalize_user_roles.sql`. Migration đó giả định
bảng `Users` đã tồn tại; repo không chứa script tạo toàn bộ schema nền.

`database-init` sẽ:

1. tạo database có tên từ `DB_DATABASE` nếu chưa tồn tại;
2. kiểm tra bảng `Users`;
3. áp dụng các migration theo thứ tự tên file nếu schema nền tồn tại;
4. bỏ qua migration và ghi cảnh báo nếu database mới chưa có schema nền.

Backend và các endpoint health/Swagger vẫn khởi động với database rỗng, nhưng
workflow đăng nhập và nghiệp vụ cần schema nền được restore/khởi tạo riêng.
Không tự tạo bảng từ phỏng đoán vì điều đó có thể làm sai schema nghiệp vụ.

## Cấu hình

Sao chép file mẫu thành `.env` tại thư mục gốc:

```powershell
Copy-Item .env.docker.example .env
```

Thay các placeholder:

- `MSSQL_SA_PASSWORD`: mật khẩu local đủ mạnh theo chính sách SQL Server;
- `JWT_SECRET`: chuỗi local dài, ngẫu nhiên;
- `DB_DATABASE`: tên database chỉ gồm chữ, số và dấu gạch dưới;
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

Compose đợi SQL Server healthy, chạy `database-init`, sau đó mới khởi động
backend. Frontend chỉ khởi động sau khi backend healthy.

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
- Backend không healthy: kiểm tra `database-init`, tên database và credential.
- Workflow trả lỗi thiếu bảng: restore/khởi tạo schema nền tương thích.
- CORS bị từ chối: bảo đảm origin trình duyệt khớp chính xác
  `CORS_ALLOWED_ORIGINS`.

RabbitMQ, GitHub Actions và triển khai production/VPS không thuộc bước này.
