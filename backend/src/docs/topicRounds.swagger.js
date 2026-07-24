const secure = { security: [{ bearerAuth: [] }], tags: ['Topic registration rounds'] }
const id = name => ({ name, in: 'path', required: true, schema: { type: 'integer' } })
const ok = { 200: { description: 'Thành công' }, 400: { description: 'Dữ liệu không hợp lệ' },
  401: { description: 'Chưa xác thực' }, 403: { description: 'Không có quyền' }, 409: { description: 'Xung đột nghiệp vụ' } }
export const topicRoundSwaggerPaths = {
  '/lecturer/topic-rounds': {
    get: { ...secure, summary: 'Danh sách vòng đăng ký của giảng viên', responses: ok },
    post: { ...secure, summary: 'Tạo vòng đăng ký nháp', responses: { ...ok, 201: { description: 'Đã tạo' } } },
  },
  '/lecturer/topic-rounds/{id}': { put: { ...secure, summary: 'Cập nhật vòng đăng ký', parameters: [id('id')], responses: ok } },
  '/lecturer/topic-rounds/{id}/status': { patch: { ...secure, summary: 'Mở, đóng hoặc hủy vòng đăng ký', parameters: [id('id')], responses: ok } },
  '/lecturer/topic-rounds/{id}/files': {
    get: { ...secure, summary: 'Danh sách file hướng dẫn', parameters: [id('id')], responses: ok },
    post: { ...secure, summary: 'Upload PDF, DOC hoặc DOCX', parameters: [id('id')],
      requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object',
        properties: { file: { type: 'string', format: 'binary' } } } } } }, responses: ok },
  },
  '/lecturer/topic-rounds/files/{fileId}/download': { get: { ...secure, summary: 'Tải file hướng dẫn', parameters: [id('fileId')], responses: ok } },
  '/lecturer/topic-rounds/files/{fileId}': { delete: { ...secure, summary: 'Xóa file khi vòng còn nháp', parameters: [id('fileId')], responses: ok } },
  '/student/topic-rounds': { get: { ...secure, summary: 'Danh sách vòng thuộc lớp đang học', responses: ok } },
  '/student/topic-rounds/{id}/files': { get: { ...secure, summary: 'Xem file hướng dẫn', parameters: [id('id')], responses: ok } },
  '/student/topic-rounds/{id}/register': { post: { ...secure, summary: 'Trưởng nhóm đăng ký đề tài theo vòng', parameters: [id('id')], responses: ok } },
  '/student/topic-rounds/{id}/registration': { put: { ...secure, summary: 'Chỉnh sửa đăng ký trong vòng', parameters: [id('id')], responses: ok } },
  '/student/topic-rounds/files/{fileId}/download': { get: { ...secure, summary: 'Tải file hướng dẫn', parameters: [id('fileId')], responses: ok } },
}
