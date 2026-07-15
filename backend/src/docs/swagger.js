import { USER_ROLES } from '../constants/roles.js';

const apiErrorResponse = {
  description: 'Lỗi API',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
};

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'TVU Student Project Portal API',
    version: '1.0.0',
    description: 'API cho hệ thống quản lý nộp đồ án và báo cáo kết thúc môn.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          data: { nullable: true, example: null },
          errors: { nullable: true, example: null },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'student@example.com' },
          password: { type: 'string', format: 'password', example: 'Password123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Đăng nhập thành công' },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              tokenType: { type: 'string', example: 'Bearer' },
              expiresIn: { type: 'integer', nullable: true, example: 3600 },
              user: { $ref: '#/components/schemas/AuthUser' },
            },
          },
          errors: { nullable: true, example: null },
        },
      },
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          role: { type: 'string', enum: Object.values(USER_ROLES) },
          isActive: { type: 'boolean', nullable: true },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password', minLength: 8 },
          confirmNewPassword: { type: 'string', format: 'password', minLength: 8 },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          fullName: { type: 'string', example: 'Nguyễn Văn A' },
          email: { type: 'string', format: 'email', example: 'student@example.com' },
          userCode: { type: 'string', nullable: true, example: 'SV001' },
          phone: { type: 'string', nullable: true },
          department: { type: 'string', nullable: true },
          className: { type: 'string', nullable: true },
          role: { type: 'string', enum: Object.values(USER_ROLES) },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      UserListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              page: { type: 'integer', example: 1 },
              pageSize: { type: 'integer', example: 10 },
              totalItems: { type: 'integer', example: 0 },
              totalPages: { type: 'integer', example: 0 },
            },
          },
          errors: { nullable: true, example: null },
        },
      },
      UserCreateRequest: {
        type: 'object',
        required: ['fullName', 'email', 'role', 'password', 'confirmPassword'],
        properties: {
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: [USER_ROLES.LECTURER, USER_ROLES.STUDENT] },
          userCode: { type: 'string' },
          phone: { type: 'string' },
          department: { type: 'string' },
          className: { type: 'string' },
          password: { type: 'string', format: 'password', minLength: 8 },
          confirmPassword: { type: 'string', format: 'password', minLength: 8 },
        },
      },
      UserUpdateRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: Object.values(USER_ROLES) },
          userCode: { type: 'string' },
          phone: { type: 'string' },
          department: { type: 'string' },
          className: { type: 'string' },
        },
      },
      UserStatusRequest: {
        type: 'object',
        required: ['isActive'],
        properties: {
          isActive: { type: 'boolean', example: false },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['newPassword', 'confirmNewPassword'],
        properties: {
          newPassword: { type: 'string', format: 'password', minLength: 8 },
          confirmNewPassword: { type: 'string', format: 'password', minLength: 8 },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng nhập bằng email và mật khẩu',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Đăng nhập thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          400: apiErrorResponse,
          401: apiErrorResponse,
          403: apiErrorResponse,
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Lấy thông tin người dùng hiện tại',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lấy thông tin thành công' },
          401: apiErrorResponse,
          404: apiErrorResponse,
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Đổi mật khẩu người dùng hiện tại',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
        },
        responses: {
          200: { description: 'Đổi mật khẩu thành công' },
          400: apiErrorResponse,
          401: apiErrorResponse,
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Admin lấy danh sách người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: Object.values(USER_ROLES) } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['fullName', 'email', 'userCode', 'role', 'status', 'createdAt'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: { description: 'Lấy danh sách thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserListResponse' } } } },
          401: apiErrorResponse,
          403: apiErrorResponse,
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Admin tạo tài khoản LECTURER hoặc STUDENT',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreateRequest' } } },
        },
        responses: {
          201: { description: 'Tạo người dùng thành công' },
          400: apiErrorResponse,
          401: apiErrorResponse,
          403: apiErrorResponse,
          409: apiErrorResponse,
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Admin xem chi tiết người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lấy chi tiết thành công' }, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse },
      },
      put: {
        tags: ['Users'],
        summary: 'Admin cập nhật người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdateRequest' } } } },
        responses: { 200: { description: 'Cập nhật thành công' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse, 409: apiErrorResponse },
      },
    },
    '/users/{id}/status': {
      patch: {
        tags: ['Users'],
        summary: 'Admin khóa hoặc mở khóa tài khoản',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserStatusRequest' } } } },
        responses: { 200: { description: 'Cập nhật trạng thái thành công' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse },
      },
    },
    '/users/{id}/reset-password': {
      post: {
        tags: ['Users'],
        summary: 'Admin reset mật khẩu người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } } },
        responses: { 200: { description: 'Reset mật khẩu thành công' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse },
      },
    },
  },
};

const paginatedResponse = (schemaName) => ({
  description: 'List loaded successfully',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: `#/components/schemas/${schemaName}` } },
              pagination: { $ref: '#/components/schemas/Pagination' },
            },
          },
          errors: { nullable: true, example: null },
        },
      },
    },
  },
});

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const studentIdParam = { name: 'studentId', in: 'path', required: true, schema: { type: 'integer' } };
const commonListParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
  { name: 'search', in: 'query', schema: { type: 'string' } },
  { name: 'status', in: 'query', schema: { type: 'string' } },
];

Object.assign(swaggerSpec.components.schemas, {
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      pageSize: { type: 'integer', example: 10 },
      total: { type: 'integer', example: 0 },
    },
  },
  AcademicYear: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, name: { type: 'string' }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date' }, isActive: { type: 'boolean' },
    },
  },
  Semester: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, academicYearId: { type: 'integer' }, academicYearName: { type: 'string' }, name: { type: 'string' }, code: { type: 'string' }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date' }, isActive: { type: 'boolean' },
    },
  },
  Subject: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, code: { type: 'string' }, name: { type: 'string' }, credits: { type: 'integer' }, description: { type: 'string', nullable: true }, isActive: { type: 'boolean' },
    },
  },
  CourseClass: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, code: { type: 'string' }, subjectId: { type: 'integer' }, subjectCode: { type: 'string' }, subjectName: { type: 'string' }, semesterId: { type: 'integer' }, semesterName: { type: 'string' }, academicYearName: { type: 'string' }, lecturerId: { type: 'integer', nullable: true }, lecturerName: { type: 'string', nullable: true }, maxStudents: { type: 'integer', nullable: true }, studentCount: { type: 'integer' }, status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED'] }, isActive: { type: 'boolean' },
    },
  },
  CourseClassStudent: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, fullName: { type: 'string' }, email: { type: 'string' }, userCode: { type: 'string', nullable: true }, className: { type: 'string', nullable: true }, department: { type: 'string', nullable: true }, enrolledAt: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  AcademicYearRequest: { type: 'object', required: ['name', 'startDate', 'endDate'], properties: { name: { type: 'string' }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date' } } },
  SemesterRequest: { type: 'object', required: ['academicYearId', 'name', 'code', 'startDate', 'endDate'], properties: { academicYearId: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string' }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date' } } },
  SubjectRequest: { type: 'object', required: ['code', 'name', 'credits'], properties: { code: { type: 'string' }, name: { type: 'string' }, credits: { type: 'integer', minimum: 1 }, description: { type: 'string' } } },
  CourseClassRequest: { type: 'object', required: ['code', 'subjectId', 'semesterId'], properties: { code: { type: 'string' }, subjectId: { type: 'integer' }, semesterId: { type: 'integer' }, lecturerId: { type: 'integer', nullable: true }, maxStudents: { type: 'integer', nullable: true }, status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED'] } } },
  StatusRequest: { type: 'object', properties: { isActive: { type: 'boolean' }, status: { type: 'string' } } },
  LecturerAssignmentRequest: { type: 'object', properties: { lecturerId: { type: 'integer', nullable: true } } },
  EnrollmentRequest: { type: 'object', properties: { studentId: { type: 'integer' }, studentIds: { type: 'array', items: { type: 'integer' } } } },
});

function crudPaths(tag, schemaName, requestName, statusBodyName = 'StatusRequest') {
  return {
    get: { tags: [tag], security: [{ bearerAuth: [] }], parameters: commonListParams, responses: { 200: paginatedResponse(schemaName), 401: apiErrorResponse, 403: apiErrorResponse } },
    post: { tags: [tag], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${requestName}` } } } }, responses: { 201: { description: 'Created' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 409: apiErrorResponse } },
  };
}

function crudByIdPath(tag, requestName) {
  return {
    get: { tags: [tag], security: [{ bearerAuth: [] }], parameters: [idParam], responses: { 200: { description: 'Loaded' }, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } },
    put: { tags: [tag], security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${requestName}` } } } }, responses: { 200: { description: 'Updated' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse, 409: apiErrorResponse } },
  };
}

Object.assign(swaggerSpec.paths, {
  '/academic-years': crudPaths('Academic years', 'AcademicYear', 'AcademicYearRequest'),
  '/academic-years/{id}': crudByIdPath('Academic years', 'AcademicYearRequest'),
  '/academic-years/{id}/status': { patch: { tags: ['Academic years'], security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusRequest' } } } }, responses: { 200: { description: 'Status updated' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/semesters': crudPaths('Semesters', 'Semester', 'SemesterRequest'),
  '/semesters/{id}': crudByIdPath('Semesters', 'SemesterRequest'),
  '/semesters/{id}/status': { patch: { tags: ['Semesters'], security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusRequest' } } } }, responses: { 200: { description: 'Status updated' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/subjects': crudPaths('Subjects', 'Subject', 'SubjectRequest'),
  '/subjects/{id}': crudByIdPath('Subjects', 'SubjectRequest'),
  '/subjects/{id}/status': { patch: { tags: ['Subjects'], security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusRequest' } } } }, responses: { 200: { description: 'Status updated' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/course-classes': crudPaths('Course classes', 'CourseClass', 'CourseClassRequest'),
  '/course-classes/{id}': crudByIdPath('Course classes', 'CourseClassRequest'),
  '/course-classes/{id}/status': { patch: { tags: ['Course classes'], security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusRequest' } } } }, responses: { 200: { description: 'Status updated' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/course-classes/{id}/lecturer': { put: { tags: ['Course classes'], security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LecturerAssignmentRequest' } } } }, responses: { 200: { description: 'Lecturer assigned' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/course-classes/{id}/students': { get: { tags: ['Course classes'], security: [{ bearerAuth: [] }], parameters: [idParam, ...commonListParams], responses: { 200: paginatedResponse('CourseClassStudent'), 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } }, post: { tags: ['Course classes'], security: [{ bearerAuth: [] }], parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EnrollmentRequest' } } } }, responses: { 201: { description: 'Students enrolled' }, 400: apiErrorResponse, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/course-classes/{id}/students/{studentId}': { delete: { tags: ['Course classes'], security: [{ bearerAuth: [] }], parameters: [idParam, studentIdParam], responses: { 200: { description: 'Student removed' }, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/lecturer/course-classes': { get: { tags: ['Lecturer course classes'], security: [{ bearerAuth: [] }], parameters: commonListParams, responses: { 200: paginatedResponse('CourseClass'), 401: apiErrorResponse, 403: apiErrorResponse } } },
  '/lecturer/course-classes/{id}': { get: { tags: ['Lecturer course classes'], security: [{ bearerAuth: [] }], parameters: [idParam], responses: { 200: { description: 'Loaded' }, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/lecturer/course-classes/{id}/students': { get: { tags: ['Lecturer course classes'], security: [{ bearerAuth: [] }], parameters: [idParam, ...commonListParams], responses: { 200: paginatedResponse('CourseClassStudent'), 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
  '/student/course-classes': { get: { tags: ['Student course classes'], security: [{ bearerAuth: [] }], parameters: commonListParams, responses: { 200: paginatedResponse('CourseClass'), 401: apiErrorResponse, 403: apiErrorResponse } } },
  '/student/course-classes/{id}': { get: { tags: ['Student course classes'], security: [{ bearerAuth: [] }], parameters: [idParam], responses: { 200: { description: 'Loaded' }, 401: apiErrorResponse, 403: apiErrorResponse, 404: apiErrorResponse } } },
});
