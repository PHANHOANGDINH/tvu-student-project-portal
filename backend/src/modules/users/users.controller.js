import { sendError, sendSuccess } from '../../utils/apiResponse.util.js';
import {
  createAdminManagedUser,
  getUserDetail,
  listUsers,
  resetAdminManagedUserPassword,
  setAdminManagedUserStatus,
  updateAdminManagedUser,
} from './users.service.js';

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

export async function getUsers(req, res) {
  try {
    const result = await listUsers(req.query || {});
    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi lấy danh sách người dùng',
    });
  }
}

export async function getUserById(req, res) {
  try {
    const result = await getUserDetail(req.params.id);
    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi lấy thông tin người dùng',
    });
  }
}

export async function createUser(req, res) {
  try {
    const result = await createAdminManagedUser(req.body || {});
    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi tạo người dùng:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi tạo người dùng',
    });
  }
}

export async function updateUser(req, res) {
  try {
    const result = await updateAdminManagedUser(req.params.id, req.body || {});
    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi cập nhật người dùng:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi cập nhật người dùng',
    });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const result = await setAdminManagedUserStatus(
      req.params.id,
      req.body?.isActive,
      req.user.id
    );

    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái người dùng:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi cập nhật trạng thái người dùng',
    });
  }
}

export async function resetUserPassword(req, res) {
  try {
    const result = await resetAdminManagedUserPassword(req.params.id, req.body || {});
    return sendServiceResult(res, result);
  } catch (error) {
    console.error('Lỗi reset mật khẩu người dùng:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Lỗi server khi reset mật khẩu người dùng',
    });
  }
}
