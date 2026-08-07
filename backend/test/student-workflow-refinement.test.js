import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = relative => readFile(new URL(relative, import.meta.url), 'utf8')

test('student workflow route requires Student JWT authorization', async () => {
  const routes = await source('../src/modules/submissions/submissions.routes.js')
  assert.match(routes, /use\(auth,role\(R\.STUDENT\)\)/)
  assert.match(routes, /get\('\/submission-workflow',c\.workflow\)/)
})

test('student workflow returns progress and final requirements grouped by CourseClass data', async () => {
  const repository = await source('../src/modules/submissions/submissions.repository.js')
  assert.match(repository, /c\.Id courseClassId,c\.Code courseClassCode/)
  assert.match(repository, /@WorkflowType='PROGRESS'/)
  assert.match(repository, /@WorkflowType='FINAL'/)
})

test('student workflow is isolated to active enrollment and own group', async () => {
  const repository = await source('../src/modules/submissions/submissions.repository.js')
  assert.match(repository, /enrollment\.StudentId=@Uid AND enrollment\.IsActive=1 AND enrollment\.DeletedAt IS NULL/)
  assert.match(repository, /member\.ClassId=c\.Id AND member\.StudentId=@Uid/)
  assert.match(repository, /s\.RequirementId=r\.Id AND s\.GroupId=g\.Id/)
})

test('student workflow exposes latest attempt, lecturer feedback and published grade only', async () => {
  const repository = await source('../src/modules/submissions/submissions.repository.js')
  assert.match(repository, /ORDER BY a\.AttemptNumber DESC/)
  assert.match(repository, /feedback\.GeneralComment feedback/)
  assert.match(repository, /CASE WHEN grade\.IsPublished=1 THEN grade\.TotalScore END score/)
})

test('submission history preserves multiple attempts instead of overwriting them', async () => {
  const repository = await source('../src/modules/submissions/submissions.repository.js')
  assert.match(repository, /INSERT SubmissionAttempts/)
  assert.match(repository, /LatestAttemptNumber=@N/)
  assert.match(repository, /ORDER BY AttemptNumber DESC/)
})

test('closed requirements and deadlines are validated by backend submission service', async () => {
  const service = await source('../src/modules/submissions/submissions.service.js')
  assert.match(service, /ctx\.roundStatus!=='OPEN'/)
  assert.match(service, /late&&!ctx\.allowLate/)
  assert.match(service, /attempts>=ctx\.maxAttempts/)
})

test('lecturer review is restricted to the lecturer assigned to the CourseClass', async () => {
  const grading = await source('../src/modules/grading/grading.service.js')
  assert.match(grading, /s\.lecturerId!==user\.id/)
  assert.match(grading, /Bạn không phụ trách lớp học phần này/)
})

test('student result hides unpublished grades and verifies group membership', async () => {
  const grading = await source('../src/modules/grading/grading.service.js')
  assert.match(grading, /repo\.member\(s\.groupId,user\.id\)/)
  assert.match(grading, /!r\.grade\.isPublished\)r\.grade=null/)
})

test('student module UI uses shared Vietnamese statuses and minute date format', async () => {
  const formatters = await source('../../frontend/src/utils/formatters.js')
  const page = await source('../../frontend/src/pages/student/StudentReportsPage.jsx')
  assert.match(formatters, /OPEN: 'Đang mở'/)
  assert.match(formatters, /CLOSED: 'Đã đóng'/)
  assert.match(formatters, /minute: '2-digit'/)
  assert.match(page, /formatDateTimeVi/)
  assert.doesNotMatch(page, /toLocaleString/)
})

test('student module provides attempts, files, links, feedback and grade drawers', async () => {
  const page = await source('../../frontend/src/pages/student/StudentReportsPage.jsx')
  assert.match(page, /Lịch sử các lần nộp/)
  assert.match(page, /downloadSubmissionFile/)
  assert.match(page, /attempt\.links\.map/)
  assert.match(page, /feedback\?\.comment/)
  assert.match(page, /result\?\.grade/)
})
