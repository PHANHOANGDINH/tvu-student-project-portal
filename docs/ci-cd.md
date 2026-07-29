# GitHub Actions CI

Workflow CI của dự án nằm tại `.github/workflows/ci.yml`. Workflow chỉ kiểm tra
chất lượng và khả năng chạy tích hợp; chưa triển khai ứng dụng lên VPS hay môi
trường production.

## Trigger và quyền

CI chạy khi có Pull Request vào `main`, push lên `main`, hoặc được chạy thủ công
bằng `workflow_dispatch`. Workflow chỉ có quyền `contents: read`. Concurrency
hủy run cũ trên cùng Pull Request/ref khi có run mới.

## Frontend

Job dùng Node.js 22, npm cache theo lockfile, rồi chạy:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

## Backend

`backend/package.json` hiện không có script `test`, vì vậy CI không tự tạo hoặc
gọi `npm test`. Job dùng Node.js 22, npm cache, chạy `npm ci`, syntax-check toàn
bộ JavaScript và import/validate Swagger OpenAPI spec mà không kết nối database.

Khi backend có test script thật, bổ sung lệnh đó trong cùng PR thêm test.

## Docker integration

Job Docker chỉ chạy sau hai quality job. Runner sinh password SQL Server và JWT
secret ngẫu nhiên, ghi `.env` với quyền hạn chế mà không echo giá trị, và dùng
Compose project riêng theo run ID/attempt. Job chạy Compose config/build/up,
đợi SQL Server, backend và frontend healthy, kiểm tra HTTP 200 cho health,
frontend, Swagger, rồi xác nhận restart count bằng 0.

Cleanup luôn chạy:

```bash
docker compose down --volumes --remove-orphans
```

`--volumes` chỉ xóa volume thuộc Compose project CI tạm, không tác động volume
development/production.

## Secrets và phạm vi

Workflow không dùng credential thật hay repository secret cho integration test.
Credential ngẫu nhiên chỉ tồn tại trong runner và không được in ra log. Không
commit `.env`, backup, runtime upload hoặc token.

CI không chạy `npm audit fix`, không deploy VPS và không thêm RabbitMQ.
