## Mục tiêu

<!-- Vấn đề cần giải quyết và liên kết Jira/GitHub Issue nếu có. -->

## Phạm vi thay đổi

<!-- Tóm tắt các thay đổi chính. Nêu rõ nội dung ngoài phạm vi. -->

## Kiểm thử

<!-- Liệt kê lệnh/kịch bản đã chạy và kết quả. Ghi "Không áp dụng" kèm lý do. -->

- [ ] Backend: `npm test`
- [ ] Backend: `npm run test:regression` (khi workflow/database bị ảnh hưởng)
- [ ] Frontend: `npm run lint`
- [ ] Frontend: `npm run build`
- [ ] Kiểm thử thủ công workflow/API liên quan
- [ ] `git diff --check`

## Database

<!-- Có thay đổi schema/data/migration không? Nếu có, nêu file, thứ tự chạy,
cách kiểm thử, khả năng tương thích và phương án rollback. -->

- [ ] Không có thay đổi database
- [ ] Có migration và đã kiểm thử trên database test
- [ ] Không chứa dump, backup hoặc dữ liệu thật

## Bảo mật

<!-- Đánh giá JWT, role, ownership, input/file validation, CORS và dữ liệu nhạy
cảm. -->

- [ ] Đã kiểm tra authentication/authorization và ownership bị ảnh hưởng
- [ ] Không chứa `.env`, secret, token, mật khẩu hoặc log nhạy cảm
- [ ] Upload/download được kiểm tra loại file, đường dẫn và quyền truy cập
- [ ] Không có ảnh hưởng bảo mật, hoặc đã giải thích rõ ở trên

## Giao diện

<!-- Thêm ảnh trước/sau hoặc video nếu PR thay đổi UI. -->

## Checklist

- [ ] Nhánh dùng tiền tố `feature/`, `fix/`, `docs/` hoặc `test/`
- [ ] Commit tuân thủ Conventional Commits
- [ ] PR chỉ chứa thay đổi liên quan đến mục tiêu
- [ ] README/Swagger/tài liệu kiến trúc đã được cập nhật khi cần
- [ ] Không commit log, backup, runtime upload hoặc generated output
