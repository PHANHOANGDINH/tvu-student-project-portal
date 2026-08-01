# Triển khai VPS với domain và HTTPS

> Production cần monitoring stack nội bộ và backup định kỳ/off-site theo [monitoring.md](monitoring.md) và [backup-restore.md](backup-restore.md). Không public Prometheus/Grafana. Deploy mặc định dừng nếu backup thất bại.

## Kiến trúc production

```text
Internet
   │ 80/443
   ▼
Nginx reverse proxy
   ├── /, static/SPA ──► Frontend Nginx
   ├── /api ───────────► Backend Node.js
   └── /api-docs ──────► Backend Swagger
                              │
                              ▼
                         SQL Server
                              ▲
                              │ outbox
                    Notification Worker ⇄ RabbitMQ
```

Chỉ proxy publish cổng `80` và `443`. Frontend, backend và SQL Server chỉ ở
Docker network nội bộ. SQL data, SQL backup, upload và chứng chỉ Let's Encrypt
được giữ bằng named volume.

## Thông tin cần chuẩn bị

- VPS Ubuntu/Debian x64 có quyền `sudo`;
- IPv4/IPv6 public của VPS;
- domain/subdomain thật;
- email nhận cảnh báo Let's Encrypt;
- quyền sửa DNS;
- SSH key và user deploy;
- password SQL Server, JWT secret production được sinh ngẫu nhiên;
- chính sách backup off-site và retention.

Không đưa các giá trị này vào Git hoặc issue công khai.

## DNS và firewall

Tạo bản ghi `A` trỏ domain vào IPv4 VPS; tạo `AAAA` chỉ khi VPS có IPv6 được
cấu hình. Chờ DNS propagate và kiểm tra:

```bash
dig +short portal.example.edu.vn A
```

Chạy setup:

```bash
sudo bash deploy/scripts/setup-server.sh
```

Script cài Docker Engine/Compose plugin và UFW, chỉ mở OpenSSH, TCP 80 và 443.
Kiểm tra SSH hoạt động trước khi đóng phiên hiện tại.

## Cấu hình production

Clone repo vào thư mục chỉ user deploy được ghi:

```bash
git clone <repository-url> /opt/tvu-student-project-portal
cd /opt/tvu-student-project-portal
cp .env.production.example .env.production
chmod 600 .env.production
```

Điền domain, email, credential mạnh và `DEPLOY_REF`. Không cấu hình seed admin
trừ lần khởi tạo có kiểm soát; xóa hai giá trị seed khỏi `.env.production` sau
khi tài khoản được tạo.

Validate:

```bash
docker compose --env-file .env.production \
  -f docker-compose.production.yml config --quiet
```

## Cấp chứng chỉ lần đầu

Đảm bảo cổng 80 chưa bị web server khác chiếm. Nạp biến domain/email từ file
bằng cách nhập thủ công, không in credential:

```bash
read -rp "Domain: " DOMAIN
read -rp "Let's Encrypt email: " LETSENCRYPT_EMAIL

docker compose --env-file .env.production \
  -f docker-compose.production.yml --profile tools run --rm --service-ports \
  certbot certonly --standalone --preferred-challenges http \
  --domain "$DOMAIN" --email "$LETSENCRYPT_EMAIL" \
  --agree-tos --no-eff-email
```

Sau khi có `fullchain.pem` và `privkey.pem` trong named volume, proxy có thể khởi
động.

## Deploy

```bash
bash deploy/scripts/deploy.sh
```

Script yêu cầu worktree sạch, backup database/uploads nếu stack cũ đang chạy,
fetch `DEPLOY_REF`, validate Compose, pull/build image, `up -d`, rồi chờ health
của database, backend, frontend và proxy. Nếu health thất bại, script tự gọi
rollback về commit trước.

Kiểm tra:

```bash
curl -I "http://$DOMAIN"
curl --fail "https://$DOMAIN/health"
curl --fail "https://$DOMAIN/api/health"
curl --fail "https://$DOMAIN/api-docs/"
```

HTTP phải redirect 301 sang HTTPS. Kiểm tra response security headers và đảm bảo
Backend/SQL không xuất hiện trong `ss -lntp` trên host.

## Backup và restore

Pre-deploy backup nằm trong volume `sqlserver_backups`:

- `predeploy_<UTC timestamp>.bak`: SQL Server `COPY_ONLY`, checksum, compression;
- `uploads_<UTC timestamp>.tar.gz`: snapshot upload.

RabbitMQ và notification worker chỉ nằm trên private Docker network; không mở
port `5672` hoặc `15672` trên host. Cấu hình `RABBITMQ_USER` và
`RABBITMQ_PASSWORD` mạnh trong `.env.production`. Volume `rabbitmq_data` giữ
durable queue/message qua lần recreate container.

Named volume trên cùng VPS không thay thế backup off-site. Đồng bộ bản backup đã
mã hóa sang storage khác, đặt retention và kiểm thử restore định kỳ. Không copy
`.bak` vào Git.

Rollback code không tự restore database vì migration có thể forward-only. Restore
database chỉ thực hiện sau khi đánh giá migration và xác nhận backup:

```bash
bash deploy/scripts/rollback.sh <known-good-commit>
```

## Gia hạn Let's Encrypt

Chạy định kỳ bằng root cron hoặc systemd timer:

```bash
cd /opt/tvu-student-project-portal
docker compose --env-file .env.production -f docker-compose.production.yml \
  --profile tools run --rm certbot renew --webroot -w /var/www/certbot --quiet
docker compose --env-file .env.production -f docker-compose.production.yml \
  exec -T proxy nginx -s reload
```

Ví dụ lịch mỗi ngày lúc 03:20; Certbot chỉ renew khi gần hết hạn. Kiểm tra bằng
`certbot renew --dry-run` trước.

## Vận hành và xử lý sự cố

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs
```

Compose có healthcheck, `restart: unless-stopped` và log rotation. Upload tối đa
mặc định `25m`; điều chỉnh `CLIENT_MAX_BODY_SIZE` theo validation backend.

Không public port SQL/Backend để debug. Dùng `docker compose exec` qua SSH.
Khi kiểm tra deploy, xác nhận thêm `rabbitmq` và `notification-worker` healthy.
Không xóa volume RabbitMQ trong rollback thông thường.
