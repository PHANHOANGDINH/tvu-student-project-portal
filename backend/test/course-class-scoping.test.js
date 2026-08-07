import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = async path => readFile(new URL(path, import.meta.url), 'utf8')

test('course-class enrollment is idempotent and allows the same student in different classes', async () => {
  const repository = await source('../src/modules/students/studentImport.repository.js')
  assert.match(repository, /CourseClassId=@ClassId AND StudentId=@StudentId/)
  assert.match(repository, /skipped\.push/)
  assert.doesNotMatch(repository, /WHERE\s+StudentId=@StudentId\s+(?!.*CourseClassId)/)
})

test('group membership is unique inside a class, not globally', async () => {
  const repository = await source('../src/modules/groups/groups.repository.js')
  assert.match(repository, /ClassId=@ClassId AND StudentId=@StudentId AND DeletedAt IS NULL/)
  assert.match(repository, /CourseClassEnrollments WHERE CourseClassId=@ClassId AND StudentId=@StudentId/)
})

test('lecturer and student class queries return every authorized class', async () => {
  const academics = await source('../src/modules/academics/academics.repository.js')
  const dashboard = await source('../src/modules/dashboard/dashboard.repository.js')
  assert.match(academics, /c\.LecturerId=@Uid/)
  assert.match(academics, /scm\.CourseClassId=c\.Id AND scm\.StudentId=@Uid/)
  assert.match(dashboard, /courseClasses: classes\.recordset/)
  assert.doesNotMatch(dashboard, /SELECT TOP 1 g\.Id/)
})

test('topics, requirements, submissions and grading remain scoped through CourseClass', async () => {
  const groups = await source('../src/modules/groups/groups.repository.js')
  const requirements = await source('../src/modules/submissions/submissionRequirements.repository.js')
  const submissions = await source('../src/modules/submissions/submissions.repository.js')
  const grading = await source('../src/modules/grading/grading.repository.js')
  assert.match(groups, /tr\.ClassId AS classId/)
  assert.match(requirements, /r\.ClassId AS classId/)
  assert.match(submissions, /gm\.ClassId=r\.ClassId AND gm\.StudentId=@Uid/)
  assert.match(grading, /JOIN CourseClasses c ON c\.Id=r\.ClassId/)
})

test('workspace routes preserve CourseClassId in lecturer and student navigation', async () => {
  const app = await source('../../frontend/src/App.jsx')
  const card = await source('../../frontend/src/components/common/CourseCard.jsx')
  assert.match(app, /lecturer\/course-classes\/:id/)
  assert.match(app, /student\/course-classes\/:id/)
  assert.match(card, /to=\{to\}/)
  assert.doesNotMatch(card, /course\s*=\s*\{[^}]*code:\s*['"]/)
})

test('student progress and final submission routers are mounted in the API', async () => {
  const routes = await source('../src/routes/index.js')
  const studentRoutes = await source('../src/modules/student/student.routes.js')
  assert.match(routes, /router\.use\('\/student', studentRoutes\)/)
  assert.match(studentRoutes, /router\.use\('\/progress', studentProgressRoutes\)/)
  assert.match(studentRoutes, /router\.use\('\/final-submissions', studentFinalSubmissionRoutes\)/)
})
