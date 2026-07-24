const secure = { security: [{ bearerAuth: [] }], tags: ['Weekly Progress'] }
const id = name => ({ name, in: 'path', required: true, schema: { type: 'integer' } })
const responses = { 200: { description: 'Thành công' }, 401: { description: 'Chưa xác thực' },
  403: { description: 'Không có quyền' }, 409: { description: 'Xung đột nghiệp vụ' } }
export const weeklyProgressSwaggerPaths = {
  '/lecturer/submission-requirements': {
    get: { ...secure, summary: 'List weekly progress requirements', responses },
    post: { ...secure, summary: 'Create WEEKLY_PROGRESS with RequiredSubmissionItems',
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
        required: ['classId','title','weekNumber','startAt','deadline','requiredItems'],
        properties: { requirementType: { type: 'string', enum: ['WEEKLY_PROGRESS'] },
          weekNumber: { type: 'integer', minimum: 1, maximum: 53 }, requiredItems: { type: 'array',
            items: { type: 'object', properties: { type: { type: 'string' }, name: { type: 'string' },
              isRequired: { type: 'boolean' }, description: { type: 'string' }, displayOrder: { type: 'integer' } } } } } } } } },
      responses: { ...responses, 201: { description: 'Đã tạo' } } },
  },
  '/lecturer/submission-requirements/{id}': { put: { ...secure, summary: 'Update weekly progress requirement', parameters: [id('id')], responses } },
  '/lecturer/submission-requirements/{id}/status': { patch: { ...secure, summary: 'Open, close, or cancel weekly progress requirement', parameters: [id('id')], responses } },
  '/student/submission-requirements': { get: { ...secure, summary: 'List student weekly progress requirements and dynamic items', responses } },
  '/student/submission-requirements/{id}/submissions': { post: { ...secure, summary: 'Submit dynamic responses as multipart: responses JSON and item_<itemId> files', parameters: [id('id')], responses } },
  '/student/submissions/{id}/history': { get: { ...secure, summary: 'Attempt history with independent item responses', parameters: [id('id')], responses } },
  '/lecturer/submission-requirements/{id}/submissions': { get: { ...secure, summary: 'List progress submissions by group', parameters: [id('id')], responses } },
  '/lecturer/submissions/{id}/review': { patch: { ...secure, summary: 'Review using UNDER_REVIEW, COMPLETED, REQUIRES_REVISION, or NOT_MET', parameters: [id('id')], responses } },
}
