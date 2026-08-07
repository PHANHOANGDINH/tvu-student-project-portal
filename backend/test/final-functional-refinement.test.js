import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { preview } from '../src/modules/lecturers/lecturerImport.service.js'

const source = relative => readFile(new URL(relative, import.meta.url), 'utf8')

test('lecturer CSV keeps legacy headers and accepts optional academicDegree', async () => {
  const suffix = randomUUID().slice(0, 8)
  const legacy = await preview({ buffer: Buffer.from(`lecturerCode,fullName,email,password\nGV${suffix},Giảng viên cũ,legacy-${suffix}@example.edu.vn,ValidPass1`) }, 1)
  const extended = await preview({ buffer: Buffer.from(`lecturerCode,fullName,email,password,academicDegree\nGX${suffix},Giảng viên mới,degree-${suffix}@example.edu.vn,ValidPass1,Tiến sĩ`) }, 1)
  assert.equal(legacy.success, true)
  assert.equal(legacy.data.validCount, 1)
  assert.equal(extended.success, true)
  assert.equal(extended.data.rows[0].academicDegree, 'Tiến sĩ')
})

test('student exports can be scoped by faculty and administrative class', async () => {
  const repository = await source('../src/modules/users/users.repository.js')
  assert.match(repository, /@FacultyId IS NULL OR faculty\.Id = @FacultyId OR activeClass\.FacultyId = @FacultyId/)
  assert.match(repository, /@AdministrativeClassId IS NULL OR activeClass\.Id = @AdministrativeClassId/)
})

test('AcademicDegree is nullable and flows through lecturer CRUD and export', async () => {
  const migration = await source('../../database/migrations/20260808_add_lecturer_academic_degree.sql')
  const users = await source('../src/modules/users/users.repository.js')
  const lecturers = await source('../src/modules/lecturers/lecturerImport.repository.js')
  assert.match(migration, /AcademicDegree NVARCHAR\(100\) NULL/)
  assert.match(users, /AcademicDegree = @AcademicDegree/)
  assert.match(lecturers, /@FacultyId IS NULL OR f\.Id=@FacultyId/)
})

test('course workspace distinguishes not found from forbidden access', async () => {
  const service = await source('../src/modules/academics/academics.service.js')
  assert.match(service, /findEntity\('courseClasses',key\).*404/)
  assert.match(service, /studentDetail[\s\S]*403/)
  assert.match(service, /lecturerDetail[\s\S]*403/)
})

test('frontend guards null course data and hides raw production exceptions', async () => {
  const workspace = await source('../../frontend/src/components/common/ClassWorkspace.jsx')
  const boundary = await source('../../frontend/src/components/common/AppErrorBoundary.jsx')
  const users = await source('../../frontend/src/pages/UsersPage.jsx')
  assert.match(workspace, /if \(!course \|\| !Number\.isInteger/)
  assert.match(workspace, /Bạn chưa tham gia nhóm/)
  assert.match(boundary, /Không thể hiển thị nội dung này/)
  assert.doesNotMatch(boundary, /error\.message/)
  assert.match(users, /placeholder="Chọn lớp hành chính"/)
})
