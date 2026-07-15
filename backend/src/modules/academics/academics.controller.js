import { sendError, sendSuccess } from '../../utils/apiResponse.util.js';
import * as service from './academics.service.js';

function handleError(res, error) {
  const duplicate = error?.number === 2601 || error?.number === 2627;
  return sendError(res, {
    statusCode: duplicate ? 409 : error.statusCode || 500,
    message: duplicate ? 'Dữ liệu đã tồn tại trong hệ thống' : error.message || 'Lỗi hệ thống',
    errors: error.errors || null,
  });
}

function crudHandlers(label, handlers) {
  return {
    list: async (req, res) => {
      try {
        return sendSuccess(res, { message: `Lấy danh sách ${label} thành công`, data: await handlers.list(req.query) });
      } catch (error) {
        return handleError(res, error);
      }
    },
    get: async (req, res) => {
      try {
        return sendSuccess(res, { message: `Lấy chi tiết ${label} thành công`, data: await handlers.get(req.params.id) });
      } catch (error) {
        return handleError(res, error);
      }
    },
    create: async (req, res) => {
      try {
        return sendSuccess(res, { statusCode: 201, message: `Tạo ${label} thành công`, data: await handlers.create(req.body || {}) });
      } catch (error) {
        return handleError(res, error);
      }
    },
    update: async (req, res) => {
      try {
        return sendSuccess(res, { message: `Cập nhật ${label} thành công`, data: await handlers.update(req.params.id, req.body || {}) });
      } catch (error) {
        return handleError(res, error);
      }
    },
    status: async (req, res) => {
      try {
        return sendSuccess(res, { message: `Cập nhật trạng thái ${label} thành công`, data: await handlers.status(req.params.id, req.body?.isActive) });
      } catch (error) {
        return handleError(res, error);
      }
    },
  };
}

export const academicYearsController = crudHandlers('năm học', {
  list: service.listAcademicYears,
  get: service.getAcademicYear,
  create: service.createAcademicYear,
  update: service.updateAcademicYear,
  status: service.updateAcademicYearStatus,
});

export const semestersController = crudHandlers('học kỳ', {
  list: service.listSemesters,
  get: service.getSemester,
  create: service.createSemester,
  update: service.updateSemester,
  status: service.updateSemesterStatus,
});

export const subjectsController = crudHandlers('môn học', {
  list: service.listSubjects,
  get: service.getSubject,
  create: service.createSubject,
  update: service.updateSubject,
  status: service.updateSubjectStatus,
});

export const courseClassesController = {
  list: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Lấy danh sách lớp học phần thành công', data: await service.listCourseClasses(req.query) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  get: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Lấy chi tiết lớp học phần thành công', data: await service.getCourseClass(req.params.id) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  create: async (req, res) => {
    try {
      return sendSuccess(res, { statusCode: 201, message: 'Tạo lớp học phần thành công', data: await service.createCourseClass(req.body || {}) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  update: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Cập nhật lớp học phần thành công', data: await service.updateCourseClass(req.params.id, req.body || {}) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  status: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Cập nhật trạng thái lớp học phần thành công', data: await service.updateCourseClassStatus(req.params.id, req.body?.status) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  assignLecturer: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Phân công giảng viên thành công', data: await service.assignLecturer(req.params.id, req.body?.lecturerId) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  students: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Lấy danh sách sinh viên lớp học phần thành công', data: await service.listCourseClassStudents(req.params.id, req.query) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  enroll: async (req, res) => {
    try {
      return sendSuccess(res, { statusCode: 201, message: 'Thêm sinh viên vào lớp học phần thành công', data: await service.enrollStudents(req.params.id, req.body || {}) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  removeStudent: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Xóa sinh viên khỏi lớp học phần thành công', data: await service.removeStudent(req.params.id, req.params.studentId) });
    } catch (error) {
      return handleError(res, error);
    }
  },
};

export const lecturerCourseClassesController = {
  list: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Lấy danh sách lớp phụ trách thành công', data: await service.listLecturerCourseClasses(req.user.id, req.query) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  get: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Lấy chi tiết lớp phụ trách thành công', data: await service.getLecturerCourseClass(req.user.id, req.params.id) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  students: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Lấy danh sách sinh viên lớp phụ trách thành công', data: await service.listCourseClassStudents(req.params.id, req.query, { lecturerId: req.user.id }) });
    } catch (error) {
      return handleError(res, error);
    }
  },
};

export const studentCourseClassesController = {
  list: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Lấy danh sách lớp đang học thành công', data: await service.listStudentCourseClasses(req.user.id, req.query) });
    } catch (error) {
      return handleError(res, error);
    }
  },
  get: async (req, res) => {
    try {
      return sendSuccess(res, { message: 'Lấy chi tiết lớp đang học thành công', data: await service.getStudentCourseClass(req.user.id, req.params.id) });
    } catch (error) {
      return handleError(res, error);
    }
  },
};
