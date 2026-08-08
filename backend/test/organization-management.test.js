import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source=path=>readFile(new URL(path,import.meta.url),'utf8')

test('organization routes require JWT admin role for every endpoint',async()=>{
 const routes=await source('../src/modules/organization/organization.routes.js')
 assert.match(routes,/router\.use\(auth,role\(USER_ROLES\.ADMIN\)\)/)
 assert.match(routes,/facultyRoutes\.delete/)
 assert.match(routes,/administrativeClassRoutes\.delete/)
 assert.match(routes,/administrativeStudentRoutes\.put/)
})

test('faculty and administrative-class codes are normalized and validated',async()=>{
 const service=await source('../src/modules/organization/organization.service.js')
 assert.match(service,/facultyCode=clean\(payload\.facultyCode\)\.toUpperCase\(\)/)
 assert.match(service,/classCode=clean\(payload\.classCode\)\.toUpperCase\(\)/)
 assert.match(service,/findFacultyByCode/)
 assert.match(service,/findAdministrativeClassByCode/)
})

test('student transfer is serializable and keeps one active administrative class',async()=>{
 const repository=await source('../src/modules/organization/organization.repository.js')
 const migration=await source('../../database/migrations/20260807_add_faculties_administrative_classes.sql')
 assert.match(repository,/begin\(sql\.ISOLATION_LEVEL\.SERIALIZABLE\)/)
 assert.match(repository,/UPDATE StudentClassMembers SET DeletedAt=SYSDATETIME\(\) WHERE StudentId=@StudentId AND DeletedAt IS NULL/)
 assert.match(migration,/UX_StudentClassMembers_Student_Active/)
})

test('administrative assignment never changes CourseClass enrollment',async()=>{
 const repository=await source('../src/modules/organization/organization.repository.js')
 assert.doesNotMatch(repository,/UPDATE\s+CourseClassEnrollments|DELETE\s+FROM\s+CourseClassEnrollments|INSERT\s+(?:INTO\s+)?CourseClassEnrollments/i)
})

test('migration is transactional, idempotent, and uses no cascade delete',async()=>{
 const migration=await source('../../database/migrations/20260807_add_faculties_administrative_classes.sql')
 assert.match(migration,/BEGIN TRY[\s\S]*BEGIN TRANSACTION[\s\S]*COMMIT TRANSACTION/)
 assert.match(migration,/IF OBJECT_ID\(N'dbo\.Faculties'/)
 assert.match(migration,/IF COL_LENGTH\(N'dbo\.Classes'/)
 assert.doesNotMatch(migration,/ON DELETE CASCADE/i)
})

test('frontend keeps CourseClass and AdministrativeClass as separate routes',async()=>{
 const app=await source('../../frontend/src/App.jsx')
 const navigation=await source('../../frontend/src/components/layout/navigation.js')
 assert.match(app,/admin\/course-classes/)
 assert.match(app,/admin\/administrative-classes/)
 assert.match(navigation,/Lớp học phần/)
 assert.match(navigation,/Lớp hành chính/)
})

test('frontend replaces raw network failures with a Vietnamese message',async()=>{
 const client=await source('../../frontend/src/api/http.js')
 assert.match(client,/Không thể kết nối đến máy chủ/)
 assert.doesNotMatch(client,/throw new Error\(['"]Failed to fetch/)
})
