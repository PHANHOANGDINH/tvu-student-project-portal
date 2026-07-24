import { USER_ROLES } from '../constants/roles.js';
import { groupSwaggerPaths } from './groups.swagger.js';
import { submissionSwaggerPaths } from './submissions.swagger.js';
import { submissionUploadSwaggerPaths } from './submissionUploads.swagger.js';
import { gradingSwaggerPaths } from './grading.swagger.js';
import { notificationsDashboardPaths } from './notificationsDashboard.swagger.js';
import { academicsSwaggerPaths } from './academics.swagger.js';
import { studentImportSwaggerPaths } from './studentImport.swagger.js';
import { lecturerImportSwaggerPaths } from './lecturerImport.swagger.js';
import { topicRoundSwaggerPaths } from './topicRounds.swagger.js';

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
    ...groupSwaggerPaths,
    ...submissionSwaggerPaths,
    ...submissionUploadSwaggerPaths,
    ...gradingSwaggerPaths,
    ...notificationsDashboardPaths,
    ...academicsSwaggerPaths,
    ...studentImportSwaggerPaths,
    ...lecturerImportSwaggerPaths,
    ...topicRoundSwaggerPaths,
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
