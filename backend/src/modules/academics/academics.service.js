import { USER_ROLES } from '../../constants/roles.js';
import * as repo from './academics.repository.js';

const COURSE_CLASS_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED']);

function fail(statusCode, message, errors = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  throw error;
}

function required(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    fail(400, `${label} lĂ  báº¯t buá»™c`);
  }
}

function validateDateRange(startDate, endDate) {
  required(startDate, 'NgĂ y báº¯t Ä‘áº§u');
  required(endDate, 'NgĂ y káº¿t thĂºc');
  if (new Date(startDate) >= new Date(endDate)) {
    fail(400, 'Ngay bat dau phai truoc ngay ket thuc');
  }
}

function ensureDateInside(parent, startDate, endDate, label) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const parentStart = new Date(parent.startDate);
  const parentEnd = new Date(parent.endDate);

  if (start < parentStart || end > parentEnd) {
    fail(400, `${label} phai nam trong thoi gian nam hoc`);
  }
}

function normalizeStatus(status = 'ACTIVE') {
  const normalized = String(status || 'ACTIVE').trim().toUpperCase();
  if (!COURSE_CLASS_STATUSES.has(normalized)) {
    fail(400, 'Tráº¡ng thĂ¡i lá»›p há»c pháº§n khĂ´ng há»£p lá»‡');
  }
  return normalized;
}

async function ensureExists(entity, id, label) {
  if (!Number(id)) fail(400, `${label} khĂ´ng há»£p lá»‡`);
  const item = await repo.findEntityById(entity, Number(id));
  if (!item) fail(404, `KhĂ´ng tĂ¬m tháº¥y ${label.toLowerCase()}`);
  return item;
}

async function ensureCourseClass(id, filters = {}) {
  const item = await repo.findCourseClassById(id, filters);
  if (!item) fail(404, 'KhĂ´ng tĂ¬m tháº¥y lá»›p há»c pháº§n');
  return item;
}

export async function listAcademicYears(query) {
  return repo.listEntity('academicYears', query);
}

export async function getAcademicYear(id) {
  return ensureExists('academicYears', id, 'NÄƒm há»c');
}

export async function createAcademicYear(payload) {
  required(payload?.name, 'TĂªn nÄƒm há»c');
  validateDateRange(payload.startDate, payload.endDate);
  return repo.createAcademicYear({
    name: payload.name.trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
}

export async function updateAcademicYear(id, payload) {
  await ensureExists('academicYears', id, 'NÄƒm há»c');
  required(payload?.name, 'TĂªn nÄƒm há»c');
  validateDateRange(payload.startDate, payload.endDate);
  const item = await repo.updateAcademicYear(id, {
    name: payload.name.trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
  if (!item) fail(404, 'KhĂ´ng tĂ¬m tháº¥y nÄƒm há»c');
  return item;
}

export async function updateAcademicYearStatus(id, isActive) {
  await ensureExists('academicYears', id, 'NÄƒm há»c');
  return repo.updateEntityStatus('academicYears', id, Boolean(isActive));
}

export async function listSemesters(query) {
  return repo.listEntity('semesters', query);
}

export async function getSemester(id) {
  return ensureExists('semesters', id, 'Há»c ká»³');
}

export async function createSemester(payload) {
  const academicYear = await ensureExists('academicYears', payload?.academicYearId, 'Nam hoc');
  required(payload?.name, 'TĂªn há»c ká»³');
  required(payload?.code, 'MĂ£ há»c ká»³');
  validateDateRange(payload.startDate, payload.endDate);
  ensureDateInside(academicYear, payload.startDate, payload.endDate, 'Thoi gian hoc ky');
  return repo.createSemester({
    academicYearId: Number(payload.academicYearId),
    name: payload.name.trim(),
    code: payload.code.trim().toUpperCase(),
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
}

export async function updateSemester(id, payload) {
  await ensureExists('semesters', id, 'Hoc ky');
  const academicYear = await ensureExists('academicYears', payload?.academicYearId, 'Nam hoc');
  required(payload?.name, 'TĂªn há»c ká»³');
  required(payload?.code, 'MĂ£ há»c ká»³');
  validateDateRange(payload.startDate, payload.endDate);
  ensureDateInside(academicYear, payload.startDate, payload.endDate, 'Thoi gian hoc ky');
  const item = await repo.updateSemester(id, {
    academicYearId: Number(payload.academicYearId),
    name: payload.name.trim(),
    code: payload.code.trim().toUpperCase(),
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
  if (!item) fail(404, 'KhĂ´ng tĂ¬m tháº¥y há»c ká»³');
  return item;
}

export async function updateSemesterStatus(id, isActive) {
  await ensureExists('semesters', id, 'Há»c ká»³');
  return repo.updateEntityStatus('semesters', id, Boolean(isActive));
}

export async function listSubjects(query) {
  return repo.listEntity('subjects', query);
}

export async function getSubject(id) {
  return ensureExists('subjects', id, 'MĂ´n há»c');
}

export async function createSubject(payload) {
  required(payload?.code, 'MĂ£ mĂ´n há»c');
  required(payload?.name, 'TĂªn mĂ´n há»c');
  const credits = Number(payload.credits || 0);
  if (!Number.isInteger(credits) || credits <= 0) fail(400, 'Sá»‘ tĂ­n chá»‰ pháº£i lá»›n hÆ¡n 0');
  return repo.createSubject({
    code: payload.code.trim().toUpperCase(),
    name: payload.name.trim(),
    credits,
    description: payload.description?.trim() || null,
  });
}

export async function updateSubject(id, payload) {
  await ensureExists('subjects', id, 'MĂ´n há»c');
  required(payload?.code, 'MĂ£ mĂ´n há»c');
  required(payload?.name, 'TĂªn mĂ´n há»c');
  const credits = Number(payload.credits || 0);
  if (!Number.isInteger(credits) || credits <= 0) fail(400, 'Sá»‘ tĂ­n chá»‰ pháº£i lá»›n hÆ¡n 0');
  const item = await repo.updateSubject(id, {
    code: payload.code.trim().toUpperCase(),
    name: payload.name.trim(),
    credits,
    description: payload.description?.trim() || null,
  });
  if (!item) fail(404, 'KhĂ´ng tĂ¬m tháº¥y mĂ´n há»c');
  return item;
}

export async function updateSubjectStatus(id, isActive) {
  await ensureExists('subjects', id, 'MĂ´n há»c');
  return repo.updateEntityStatus('subjects', id, Boolean(isActive));
}

export async function listCourseClasses(query) {
  return repo.listCourseClasses(query);
}

export async function getCourseClass(id) {
  return ensureCourseClass(id);
}

async function normalizeCourseClassPayload(payload) {
  required(payload?.code, 'MĂ£ lá»›p há»c pháº§n');
  await ensureExists('subjects', payload.subjectId, 'MĂ´n há»c');
  await ensureExists('semesters', payload.semesterId, 'Há»c ká»³');

  const lecturerId = payload.lecturerId ? Number(payload.lecturerId) : null;
  if (lecturerId) {
    const lecturer = await repo.findActiveUserByIdAndRole(lecturerId, USER_ROLES.LECTURER);
    if (!lecturer) fail(400, 'Giáº£ng viĂªn Ä‘Æ°á»£c phĂ¢n cĂ´ng khĂ´ng há»£p lá»‡');
  }

  const maxStudents = payload.maxStudents ? Number(payload.maxStudents) : null;
  if (maxStudents !== null && (!Number.isInteger(maxStudents) || maxStudents <= 0)) {
    fail(400, 'SÄ© sá»‘ tá»‘i Ä‘a pháº£i lá»›n hÆ¡n 0');
  }

  return {
    code: payload.code.trim().toUpperCase(),
    subjectId: Number(payload.subjectId),
    semesterId: Number(payload.semesterId),
    lecturerId,
    maxStudents,
    status: normalizeStatus(payload.status),
  };
}

export async function createCourseClass(payload) {
  return repo.createCourseClass(await normalizeCourseClassPayload(payload));
}

export async function updateCourseClass(id, payload) {
  await ensureCourseClass(id);
  const item = await repo.updateCourseClass(id, await normalizeCourseClassPayload(payload));
  if (!item) fail(404, 'KhĂ´ng tĂ¬m tháº¥y lá»›p há»c pháº§n');
  return item;
}

export async function updateCourseClassStatus(id, status) {
  await ensureCourseClass(id);
  return repo.updateCourseClassStatus(id, normalizeStatus(status));
}

export async function assignLecturer(id, lecturerId) {
  await ensureCourseClass(id);
  const normalizedLecturerId = lecturerId ? Number(lecturerId) : null;
  if (normalizedLecturerId) {
    const lecturer = await repo.findActiveUserByIdAndRole(normalizedLecturerId, USER_ROLES.LECTURER);
    if (!lecturer) fail(400, 'Giáº£ng viĂªn Ä‘Æ°á»£c phĂ¢n cĂ´ng khĂ´ng há»£p lá»‡');
  }
  return repo.assignLecturer(id, normalizedLecturerId);
}

export async function listCourseClassStudents(id, query = {}, owner = {}) {
  await ensureCourseClass(id, owner.lecturerId ? { lecturerId: owner.lecturerId } : {});
  return repo.listCourseClassStudents(id, query);
}

export async function enrollStudents(id, payload) {
  const courseClass = await ensureCourseClass(id);
  const studentIds = Array.isArray(payload?.studentIds) ? payload.studentIds : [payload?.studentId];
  const uniqueIds = [...new Set(studentIds.map(Number).filter(Boolean))];
  if (uniqueIds.length === 0) fail(400, 'Danh sĂ¡ch sinh viĂªn khĂ´ng há»£p lá»‡');

  const validIds = await repo.assertStudents(uniqueIds);
  if (validIds.length !== uniqueIds.length) fail(400, 'Danh sĂ¡ch sinh viĂªn chá»©a tĂ i khoáº£n khĂ´ng há»£p lá»‡');

  const existingIds = await repo.findActiveEnrollmentStudentIds(id, validIds);
  if (existingIds.length > 0) fail(400, 'Khong the them sinh vien trung vao lop hoc phan');

  if (courseClass.maxStudents) {
    const currentCount = await repo.countCourseClassStudents(id);
    if (currentCount + validIds.length > courseClass.maxStudents) {
      fail(400, 'Sá»‘ lÆ°á»£ng sinh viĂªn vÆ°á»£t quĂ¡ sÄ© sá»‘ tá»‘i Ä‘a cá»§a lá»›p há»c pháº§n');
    }
  }

  return repo.enrollStudents(id, validIds);
}

export async function removeStudent(id, studentId) {
  await ensureCourseClass(id);
  const removed = await repo.removeStudent(id, studentId);
  if (!removed) fail(404, 'KhĂ´ng tĂ¬m tháº¥y sinh viĂªn trong lá»›p há»c pháº§n');
  return { removed: true };
}

export async function listLecturerCourseClasses(lecturerId, query = {}) {
  return repo.listCourseClasses({ ...query, lecturerId });
}

export async function getLecturerCourseClass(lecturerId, id) {
  return ensureCourseClass(id, { lecturerId });
}

export async function listStudentCourseClasses(studentId, query = {}) {
  return repo.listStudentCourseClasses(studentId, query);
}

export async function getStudentCourseClass(studentId, id) {
  return ensureCourseClass(id, { studentId });
}
