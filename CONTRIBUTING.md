# Đóng góp cho TVU Student Project Portal

Cảm ơn bạn đã đóng góp. Tài liệu này thống nhất cách tạo nhánh, commit, kiểm
thử và Pull Request (PR) cho repository.

## Chuẩn bị môi trường

1. Cài dependency riêng trong `backend` và `frontend` bằng `npm install`.
2. Sao chép các file `.env.example` thành `.env` cục bộ và điền cấu hình của
   môi trường phát triển.
3. Dùng database phát triển/test riêng. Đọc và sao lưu dữ liệu trước khi áp dụng
   migration.

Không commit `.env`, secret, mật khẩu, token, log, backup database, file upload
runtime hoặc dữ liệu thật. Nếu nghi ngờ secret đã bị commit, dừng chia sẻ secret,
thu hồi/rotate credential và thông báo maintainer; chỉ xóa file khỏi commit là
chưa đủ.

## Nhánh

Tạo nhánh ngắn hạn từ nhánh nền đã được nhóm thống nhất:

- `feature/<mo-ta-ngan>` cho chức năng mới;
- `fix/<mo-ta-ngan>` cho sửa lỗi;
- `docs/<mo-ta-ngan>` cho tài liệu;
- `test/<mo-ta-ngan>` cho kiểm thử.

Dùng chữ thường, dấu gạch ngang và tên thể hiện rõ phạm vi. Không commit trực
tiếp hoặc tự merge vào `main`; gửi PR để review. Không force push lên nhánh dùng
chung.

## Commit

Repository dùng Conventional Commits:

```text
<type>(<scope>): <description>
```

Các type thường dùng: `feat`, `fix`, `docs`, `test`, `refactor`, `style`,
`chore`. Scope là tùy chọn nhưng nên phản ánh module, ví dụ:

```text
feat(groups): add leader transfer validation
fix(files): reject invalid upload paths
docs: clarify local setup
test(regression): cover enrollment capacity
```

Mỗi commit nên có một mục đích rõ ràng. Không trộn refactor không liên quan,
generated output hoặc thay đổi dependency ngoài phạm vi.

## Kiểm tra trước khi mở PR

Chạy các kiểm tra phù hợp với phần thay đổi.

Backend unit/contract test:

```bash
cd backend
npm test
```

Backend regression test:

```bash
cd backend
npm run test:regression
```

Regression test cần SQL Server test được cấu hình và có thể thay đổi dữ liệu.
Không chạy bằng credential hoặc database production.

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Ngoài ra:

```bash
git diff --check
```

Kiểm tra thủ công workflow bị ảnh hưởng, Swagger nếu API thay đổi, migration
trên database test nếu schema thay đổi và bảo đảm diff không chứa secret/dữ liệu
nhạy cảm. Thay đổi chỉ ở tài liệu có thể ghi rõ những kiểm tra không áp dụng.

## Database

- Không sửa migration đã được dùng trên môi trường chia sẻ; tạo migration mới.
- Migration phải có tên theo thứ tự thời gian và mô tả đúng mục đích.
- Review tính tương thích, transaction, ràng buộc dữ liệu và phương án rollback.
- Ghi rõ trong PR schema/data nào thay đổi, thứ tự chạy và cách đã kiểm thử.
- Không commit database dump, backup hoặc dữ liệu người dùng.

## Pull Request

Giữ PR tập trung và đủ nhỏ để review. PR phải nêu:

- mục tiêu và phạm vi thay đổi;
- cách kiểm thử và kết quả;
- thay đổi database/migration, hoặc xác nhận không có;
- ảnh hưởng bảo mật: JWT, role, ownership, validation, secret và file access;
- ảnh chụp/video đối với thay đổi giao diện khi phù hợp;
- issue/Jira liên quan và ghi chú triển khai nếu có.

Dùng checklist trong PR template, phản hồi review bằng commit bổ sung và chỉ
resolve hội thoại khi vấn đề đã được xử lý. Merge chỉ thực hiện sau khi có review
và các kiểm tra cần thiết đạt yêu cầu.

## Báo lỗi và đề xuất

Dùng GitHub Issue template tương ứng. Không đăng secret, credential, dữ liệu cá
nhân, log nhạy cảm hoặc file nội bộ trong issue công khai.
