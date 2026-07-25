import { changePassword as changePasswordService, getCurrentUser, login as loginService, registerStudent } from './auth.service.js';
import { sendError, sendSuccess } from '../../utils/apiResponse.util.js';

function sendServiceResult(res, result) {
  if (!result.success) {
    return sendError(res, {
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors || null,
    });
  }

  return sendSuccess(res, {
    statusCode: result.statusCode,
    message: result.message,
    data: result.data ?? null,
  });
}

export async function login(req, res) {
  try {
    const result = await loginService(req.body || {});
    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi login:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi đăng nhập',
    });
  }
}

export async function me(req, res) {
  try {
    const result = await getCurrentUser(req.user.id);
    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi lấy thông tin user:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi lấy thông tin người dùng',
    });
  }
}

export async function changePassword(req, res) {
  try {
    const result = await changePasswordService(req.user.id, req.body || {});
    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi đổi mật khẩu',
    });
  }
}

export async function register(req, res) {
  const result = await registerStudent(req.body || {});
  return sendServiceResult(res, result);
}
