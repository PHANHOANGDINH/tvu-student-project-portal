const secure = { security: [{ bearerAuth: [] }], tags: ['Weekly Progress'] }
const id = name => ({ name, in: 'path', required: true, schema: { type: 'integer' } })
const responses = { 200: { description: 'Thành công' }, 401: { description: 'Chưa xác thực' },
  403: { description: 'Không có quyền' }, 409: { description: 'Xung đột nghiệp vụ' } }
export const weeklyProgressSwaggerPaths = {
  '/lecturer/submission-requirements': {
    get: { ...secure, summary: 'Danh sách yêu cầu, gồm tiến độ tuần', responses },
    post: { ...secure, summary: 'Tạo tiến độ tuần với RequirementType=WEEKLY_PROGRESS',
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
        required: ['classId','title','weekNumber','startAt','deadline','requiredItems'],
        properties: { requirementType: { type: 'string', enum: ['WEEKLY_PROGRESS'] },
          weekNumber: { type: 'integer', minimum: 1, maximum: 53 }, requiredItems: { type: 'array',
            items: { type: 'object', properties: { type: { type: 'string' }, name: { type: 'string' },
              isRequired: { type: 'boolean' }, description: { type: 'string' }, displayOrder: { type: 'integer' } } } } } } } } },
      responses: { ...responses, 201: { description: 'Đã tạo' } } },
  },
  '/lecturer/submission-requirements/{id}': { put: { ...secure, summary: 'Sửa yêu cầu tiến độ', parameters: [id('id')], responses } },
  '/lecturer/submission-requirements/{id}/status': { patch: { ...secure, summary: 'Mở, đóng hoặc hủy tiến độ', parameters: [id('id')], responses } },
  '/student/submission-requirements': { get: { ...secure, summary: 'Sinh viên xem yêu cầu tiến độ', responses } },
  '/student/submission-requirements/{id}/submissions': { post: { ...secure, summary: 'Nộp tiến độ bằng multipart/form-data', parameters: [id('id')], responses } },
  '/student/submissions/{id}/history': { get: { ...secure, summary: 'Lịch sử các lần nộp tiến độ', parameters: [id('id')], responses } },
  '/lecturer/submission-requirements/{id}/submissions': { get: { ...secure, summary: 'Danh sách nhóm đã nộp tiến độ', parameters: [id('id')], responses } },
  '/lecturer/submissions/{id}/review': { patch: { ...secure, summary: 'Nhận xét hoặc yêu cầu chỉnh sửa tiến độ', parameters: [id('id')], responses } },
}
