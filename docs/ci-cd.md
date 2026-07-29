# CI/CD với GitHub Actions

## Continuous Integration

`.github/workflows/ci.yml` chạy khi có Pull Request vào `main`, push lên `main`
hoặc `workflow_dispatch`.

- Frontend: Node.js 22, `npm ci`, lint và production build.
- Backend: `npm ci`, syntax-check JavaScript và validate Swagger. Backend hiện
  không khai báo `npm test`, nên workflow không tự tạo test script.
- Docker integration: tạo credential runner tạm, build/up Compose, chờ health,
  kiểm tra HTTP/restart count và luôn cleanup volume CI riêng.

CI chỉ có quyền `contents: read`; run cũ trên cùng branch/PR được hủy.

## Continuous Deployment

`.github/workflows/cd.yml` deploy production trong hai trường hợp:

1. workflow `CI` hoàn tất thành công sau một `push` lên `main`;
2. `workflow_dispatch` với full 40-character commit SHA đã thuộc `main`.

CD không deploy từ Pull Request. Commit được checkout và xác minh là ancestor
của `origin/main` trước khi kết nối VPS.

Job dùng GitHub Environment `production`. Nên cấu hình required reviewers và
deployment protection rules cho Environment này.

Concurrency group cố định `production-deployment` bảo đảm chỉ một production
deployment chạy tại một thời điểm; `cancel-in-progress: false` không cắt ngang
backup/deploy/rollback đang chạy. Timeout là 45 phút.

## Secrets bắt buộc

Cấu hình trong GitHub Environment `production`:

| Secret | Mục đích |
| --- | --- |
| `VPS_HOST` | Host/IP SSH của VPS |
| `VPS_PORT` | Cổng SSH |
| `VPS_USER` | User deploy không dùng password |
| `VPS_SSH_KEY` | Private key SSH dành riêng cho deploy |
| `VPS_DEPLOY_PATH` | Đường dẫn tuyệt đối của repo trên VPS |
| `DOMAIN` | Domain production |
| `LETSENCRYPT_EMAIL` | Email Let's Encrypt |
| `SQL_SA_PASSWORD` | Password SQL Server production |
| `JWT_SECRET` | Khóa ký JWT production |
| `RABBITMQ_USER` | User RabbitMQ production |
| `RABBITMQ_PASSWORD` | Password RabbitMQ production |

Workflow kiểm tra secret trong shell, không dùng `secrets.*` trực tiếp trong
biểu thức `if`. Giá trị secret không được echo vào log hoặc step summary.
`.env.production` được tạo ở runner với mode hạn chế, copy qua SCP, cài mode
`600` trên VPS và không commit.

## SSH và source revision

Runner ghi private key mode `600`, tạo `known_hosts` bằng `ssh-keyscan`, sau đó
dùng `BatchMode=yes` và `StrictHostKeyChecking=yes`. Không hỗ trợ SSH password.

VPS clone/fetch repository qua HTTPS và xác minh target SHA thuộc `main`.
`.env.production` đặt `DEPLOY_REF` bằng đúng SHA bất biến; `deploy.sh` checkout
SHA đó thay vì một branch chuyển động.

Nếu repository chuyển sang private, cần thiết kế thêm deploy key/token read-only
cho bước fetch trên VPS; không tái sử dụng private key SSH của VPS làm GitHub
credential.

## Deploy, backup và rollback

Trước deploy, workflow bảo đảm certificate Let's Encrypt đã tồn tại; lần đầu có
thể cấp certificate bằng HTTP challenge trên port 80.

`deploy/scripts/deploy.sh`:

- backup SQL Server và uploads nếu stack cũ đang chạy;
- validate production Compose;
- pull/build image;
- `up -d`;
- chờ database, backend, frontend và proxy healthy;
- tự gọi rollback nội bộ nếu health thất bại.

Sau internal health, runner kiểm tra HTTPS cho frontend, `/api/health` và
`/api-docs/`. Nếu deploy hoặc public health thất bại, CD gọi
`deploy/scripts/rollback.sh` với commit trước và đánh dấu workflow thất bại.

Step summary chỉ ghi SHA, trigger, outcome và Environment; không ghi host,
domain hay secret.

## Chuẩn bị trước run đầu tiên

1. Hoàn tất DNS, firewall, Docker và user deploy theo
   `docs/vps-deployment.md`.
2. Đảm bảo VPS có thể clone/fetch repository.
3. Tạo Environment `production`, thêm secrets và required reviewers.
4. Merge CI/CD vào `main`.
5. Không chạy `workflow_dispatch` cho tới khi VPS và secrets hoàn chỉnh.

Workflow không chạy `npm audit fix`. CI kiểm tra health của RabbitMQ và
notification worker; CD truyền credential RabbitMQ qua GitHub Environment mà
không ghi chúng vào log. Workflow không tự thay đổi schema/logic nghiệp vụ.
