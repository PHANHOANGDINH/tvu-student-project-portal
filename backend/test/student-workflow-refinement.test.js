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
  assert.match(repository, /r\.RequirementType='ASSIGNMENT'/)
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
  assert.match(grading, /không phụ trách lớp học phần này/)
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

test('student module provides separate requirement, submission and evaluation pages', async () => {
  const app = await source('../../frontend/src/App.jsx')
  const requirements = await source('../../frontend/src/pages/student/SubmissionRequirementsPage.jsx')
  const submission = await source('../../frontend/src/pages/student/WorkflowSubmissionDetailPage.jsx')
  const evaluation = await source('../../frontend/src/pages/student/WorkflowEvaluationPage.jsx')
  assert.match(app, /student\/submission-requirements\/:id/)
  assert.match(app, /student\/progress\/:id\/submission/)
  assert.match(app, /student\/progress\/:id\/evaluation/)
  assert.match(app, /student\/progress\/:id/)
  assert.match(app, /student\/final-submissions\/:id/)
  assert.doesNotMatch(requirements, /setSelected/)
  assert.match(submission, /Lịch sử các lần nộp/)
  assert.match(submission, /downloadSubmissionFile/)
  assert.match(submission, /selected\.links/)
  assert.match(evaluation, /feedback\?\.comment/)
  assert.match(evaluation, /grade\?\.isPublished/)
})

test('student requirement detail distinguishes missing resources from unauthorized CourseClasses', async () => {
  const routes = await source('../src/modules/submissions/submissionRequirements.routes.js')
  const repository = await source('../src/modules/submissions/submissionRequirements.repository.js')
  const service = await source('../src/modules/submissions/submissionRequirements.service.js')
  assert.match(routes, /use\(auth,role\(R\.STUDENT\)\)/)
  assert.match(routes, /get\('\/:id',c\.studentDetail\)/)
  assert.match(repository, /enrollment\.StudentId=@UserId AND enrollment\.IsActive=1 AND enrollment\.DeletedAt IS NULL/)
  assert.match(repository, /WHERE r\.Id=@Id AND r\.DeletedAt IS NULL/)
  assert.match(service, /if\(!item\)return fail\(404/)
  assert.match(service, /if\(!item\.enrolled\)return fail\(403/)
})

test('requirement detail loads one authorized API response without depending on group submission context', async () => {
  const page = await source('../../frontend/src/pages/student/RequirementDetailPage.jsx')
  assert.match(page, /getStudentRequirement\(id\)/)
  assert.doesNotMatch(page, /currentSubmission\(id\)/)
  assert.match(page, /requestError\.status===403/)
  assert.match(page, /requestError\.status===404/)
})

test('student dashboard uses responsive KPI cards and localized activity statuses', async () => {
  const dashboard = await source('../../frontend/src/pages/dashboards/RoleDashboardPage.jsx')
  const components = await source('../../frontend/src/components/dashboard/DashboardComponents.jsx')
  const styles = await source('../../frontend/src/pages/dashboards/role-dashboard.css')
  assert.match(dashboard, /Đợt đang mở/)
  assert.match(dashboard, /Thông báo chưa đọc/)
  assert.match(dashboard, /Cần chỉnh sửa/)
  assert.match(dashboard, /Điểm đã công bố/)
  assert.match(components, /submissionStatusLabel/)
  assert.match(styles, /repeat\(5,minmax\(0,1fr\)\)/)
  assert.match(styles, /max-width:480px/)
})

test('presentation seed is idempotent and never resets data', async () => {
  const seed = await source('../src/scripts/seedPresentation.js')
  assert.match(seed, /SERIALIZABLE/)
  assert.match(seed, /business keys/)
  assert.doesNotMatch(seed, /\b(?:DROP|TRUNCATE)\s+(?:TABLE|DATABASE)/i)
  assert.doesNotMatch(seed, /docker compose down/)
})
