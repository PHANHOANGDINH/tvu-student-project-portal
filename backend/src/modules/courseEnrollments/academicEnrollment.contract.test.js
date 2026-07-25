import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const admin = fs.readFileSync(new URL('../administrativeClasses/administrativeClasses.repository.js', import.meta.url), 'utf8')
const enroll = fs.readFileSync(new URL('./courseEnrollments.repository.js', import.meta.url), 'utf8')
const migration = fs.readFileSync(new URL('../../../../database/migrations/20260726_add_course_class_section_code.sql', import.meta.url), 'utf8')

test('administrative create/update/list and current membership contract', () => {
  assert.match(admin, /INSERT AdministrativeClasses/)
  assert.match(admin, /UPDATE AdministrativeClasses/)
  assert.match(admin, /studentCount/)
  assert.match(admin, /m\.IsCurrent=1/)
  assert.match(admin, /tx\.begin\(\)/)
})

test('administrative transfer closes old and creates new without course enrollment mutation', () => {
  const transfer = admin.slice(admin.indexOf('export async function transfer'))
  assert.match(transfer, /IsCurrent=0,EndAt=SYSDATETIME\(\)/)
  assert.match(transfer, /INSERT AdministrativeClassMemberships/)
  assert.doesNotMatch(transfer, /CourseClassEnrollments/)
})

test('bulk enrollment uses only current active students and avoids duplicates', () => {
  const bulk = enroll.slice(enroll.indexOf('export async function bulkEnroll'), enroll.indexOf('export async function selfEligible'))
  assert.match(bulk, /m\.IsCurrent=1/)
  assert.match(bulk, /u\.IsActive=1/)
  assert.match(bulk, /found\?\.IsActive/)
  assert.match(bulk, /capacity/)
})

test('self enrollment enforces window, capacity, duplicate and eligibility', () => {
  const self = enroll.slice(enroll.indexOf('export async function selfEligible'), enroll.indexOf('export async function selfWithdraw'))
  assert.match(self, /EnrollmentOpenAt<=SYSDATETIME\(\)/)
  assert.match(self, /EnrollmentCloseAt>=SYSDATETIME\(\)/)
  assert.match(self, /CourseClassEligibleClasses/)
  assert.match(self, /AdministrativeClassMemberships/)
  assert.match(self, /DUPLICATE/)
  assert.match(self, /CAPACITY/)
})

test('course transfer blocks group, topic, submission and grade data', () => {
  const transfer = enroll.slice(enroll.indexOf('export async function transferEnrollment'))
  for (const token of ['GroupMembers', 'TopicRegistrations', 'Submissions', 'Grades']) assert.match(transfer, new RegExp(token))
  assert.match(transfer, /DIFFERENT_COURSE/)
  assert.match(transfer, /IsActive=0,EnrollmentStatus='TRANSFERRED'/)
})

test('course class migration enforces generated-code uniqueness and positive sections', () => {
  assert.match(migration, /CourseClassCode/)
  assert.match(migration, /CHECK\(SectionNumber>0\)/)
  assert.match(migration, /UX_CourseClasses_CourseClassCode/)
  assert.match(migration, /UX_CourseClasses_Semester_Subject_Section/)
})
