import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { filters } from '../src/modules/dashboard/dashboard-analytics.service.js';

const source = async file => readFile(new URL(`../src/modules/dashboard/${file}`, import.meta.url), 'utf8');

test('dashboard analytics routes retain JWT and role authorization', async () => {
  const routes = await source('dashboard.routes.js');
  assert.match(routes, /router\.use\(auth, role\(userRole\)\)/);
  assert.match(routes, /summary/);
  assert.match(routes, /group-progress/);
  assert.match(routes, /project-progress/);
});

test('lecturer and student aggregate queries remain user and CourseClass scoped', async () => {
  const repository = await source('dashboard-analytics.repository.js');
  assert.match(repository, /c\.LecturerId=@Uid/);
  assert.match(repository, /@CourseClassId IS NULL OR c\.Id=@CourseClassId/);
  assert.match(repository, /gm\.StudentId=@Uid/);
  assert.match(repository, /@CourseClassId IS NULL OR g\.ClassId=@CourseClassId/);
  assert.doesNotMatch(repository, /\$\{filters\./);
});

test('dashboard filters validate ids and date ranges', () => {
  assert.deepEqual(filters({ courseClassId: '9', dateFrom: '2026-01-01', dateTo: '2026-01-31' }), { courseClassId: 9, academicYearId: undefined, semesterId: undefined, dateFrom: '2026-01-01', dateTo: '2026-01-31' });
  assert.throws(() => filters({ courseClassId: '-1' }), /courseClassId/);
  assert.throws(() => filters({ dateFrom: '2026-02-01', dateTo: '2026-01-01' }), /Khoảng ngày/);
  assert.throws(() => filters({ dateFrom: 'not-a-date' }), /dateFrom/);
});

test('local and Docker dashboard connectivity keep both browser origins and safe errors', async () => {
  const compose = await readFile(new URL('../../docker-compose.yml', import.meta.url), 'utf8');
  const envExample = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  const dashboardApi = await readFile(new URL('../../frontend/src/api/dashboardApi.js', import.meta.url), 'utf8');
  const http = await readFile(new URL('../../frontend/src/api/http.js', import.meta.url), 'utf8');

  for (const sourceText of [compose, envExample]) {
    assert.match(sourceText, /http:\/\/localhost:5173,http:\/\/localhost:8080/);
  }
  assert.match(http, /VITE_API_BASE_URL \|\| 'http:\/\/localhost:5000\/api'/);
  assert.match(http, /Không thể kết nối đến máy chủ\. Vui lòng thử lại\./);
  assert.match(http, /isDashboardRequest/);
  assert.match(dashboardApi, /Phiên đăng nhập đã hết hạn/);
  assert.match(dashboardApi, /Bạn không có quyền xem dữ liệu này/);
  assert.match(dashboardApi, /Không tìm thấy dữ liệu dashboard/);
  assert.match(dashboardApi, /Hệ thống đang gặp sự cố/);
});
