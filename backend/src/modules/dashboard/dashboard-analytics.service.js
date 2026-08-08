const loadRepository = () => import('./dashboard-analytics.repository.js');

const positiveInt = (value, field) => {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw Object.assign(new Error(`${field} không hợp lệ`), { statusCode: 400 });
  return parsed;
};

export function filters(query) {
  const result = {
    courseClassId: positiveInt(query.courseClassId, 'courseClassId'),
    academicYearId: positiveInt(query.academicYearId, 'academicYearId'),
    semesterId: positiveInt(query.semesterId, 'semesterId')
  };
  for (const field of ['dateFrom', 'dateTo']) {
    if (query[field]) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(query[field]) || Number.isNaN(Date.parse(query[field]))) throw Object.assign(new Error(`${field} không hợp lệ`), { statusCode: 400 });
      result[field] = query[field];
    }
  }
  if (result.dateFrom && result.dateTo && result.dateFrom > result.dateTo) throw Object.assign(new Error('Khoảng ngày không hợp lệ'), { statusCode: 400 });
  return result;
}

export const admin = async (name, query) => (await loadRepository()).adminDataset(name, filters(query));
export const lecturer = async (name, query, user) => (await loadRepository()).lecturerDataset(name, filters(query), user.id);
export const student = async (name, query, user) => (await loadRepository()).studentDataset(name, filters(query), user.id);
