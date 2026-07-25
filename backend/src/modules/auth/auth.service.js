import { findUserByEmail, findUserById, findUserWithPasswordById, updateUserPassword } from './auth.model.js';
import { comparePassword, hashPassword } from '../../utils/password.util.js';
import { generateToken } from '../../utils/jwt.util.js';
import { normalizeRole } from '../../constants/roles.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerStudent() {
  return {
    success: false,
    statusCode: 403,
    message: 'Đăng ký công khai đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được cấp tài khoản.',
  };
}

export async function login(data) {
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');

  if (!email || !password) {
    return {
      success: false,
      statusCode: 400,
      message: 'Email và mật khẩu không được để trống.',
      errors: {
        ...(!email ? { email: ['Email không được để trống.'] } : {}),
        ...(!password ? { password: ['Mật khẩu không được để trống.'] } : {}),
      },
    };
  }

  if (!validateEmail(email)) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ.',
      errors: {
        email: ['Email không đúng định dạng.'],
      },
    };
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: 'Email hoặc mật khẩu không chính xác.',
    };
  }

  if (user.IsActive === false) {
    return {
      success: false,
      statusCode: 403,
      message: 'Tài khoản đã bị khóa hoặc ngừng hoạt động.',
    };
  }

  const isPasswordValid = await comparePassword(password, user.PasswordHash);

  if (!isPasswordValid) {
    return {
      success: false,
      statusCode: 401,
      message: 'Email hoặc mật khẩu không chính xác.',
    };
  }

  const role = normalizeRole(user.Role);

  if (!role) {
    return {
      success: false,
      statusCode: 403,
      message: 'Vai trò tài khoản không hợp lệ.',
    };
  }

  const { token, expiresIn } = generateToken({ ...user, Role: role });

  return {
    success: true,
    statusCode: 200,
    message: 'Đăng nhập thành công',
    data: {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.Id,
        email: user.Email,
        fullName: user.FullName,
        role,
      },
    },
  };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: 'Không tìm thấy người dùng.',
    };
  }

  if (user.IsActive === false) {
    return {
      success: false,
      statusCode: 403,
      message: 'Tài khoản đã bị khóa hoặc ngừng hoạt động.',
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: 'Lấy thông tin người dùng thành công',
    data: {
      id: user.Id,
      email: user.Email,
      fullName: user.FullName,
      role: normalizeRole(user.Role),
      isActive: user.IsActive,
      userCode: user.UserCode,
      phone: user.Phone,
      department: user.Department,
      className: user.ClassName,
      createdAt: user.CreatedAt,
      updatedAt: user.UpdatedAt,
    },
  };
}

function validateNewPassword(password) {
  const errors = [];

  if (!password) errors.push('Mật khẩu mới không được để trống.');
  if (password && password.length < 8) errors.push('Mật khẩu mới phải có ít nhất 8 ký tự.');
  if (password && !/[A-Z]/.test(password)) errors.push('Mật khẩu mới phải có ít nhất một chữ hoa.');
  if (password && !/[a-z]/.test(password)) errors.push('Mật khẩu mới phải có ít nhất một chữ thường.');
  if (password && !/\d/.test(password)) errors.push('Mật khẩu mới phải có ít nhất một chữ số.');

  return errors;
}

export async function changePassword(userId, data) {
  const currentPassword = String(data.currentPassword || '');
  const newPassword = String(data.newPassword || '');
  const confirmNewPassword = String(data.confirmNewPassword || '');
  const errors = {};

  if (!currentPassword) errors.currentPassword = ['Mật khẩu hiện tại không được để trống.'];

  const newPasswordErrors = validateNewPassword(newPassword);
  if (newPasswordErrors.length > 0) errors.newPassword = newPasswordErrors;

  if (!confirmNewPassword) {
    errors.confirmNewPassword = ['Xác nhận mật khẩu mới không được để trống.'];
  } else if (newPassword !== confirmNewPassword) {
    errors.confirmNewPassword = ['Xác nhận mật khẩu mới không khớp.'];
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ.',
      errors,
    };
  }

  const user = await findUserWithPasswordById(userId);

  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: 'Không tìm thấy người dùng.',
    };
  }

  if (user.IsActive === false) {
    return {
      success: false,
      statusCode: 403,
      message: 'Tài khoản đã bị khóa hoặc ngừng hoạt động.',
    };
  }

  const isCurrentPasswordValid = await comparePassword(currentPassword, user.PasswordHash);

  if (!isCurrentPasswordValid) {
    return {
      success: false,
      statusCode: 400,
      message: 'Mật khẩu hiện tại không chính xác.',
      errors: {
        currentPassword: ['Mật khẩu hiện tại không chính xác.'],
      },
    };
  }

  const isSamePassword = await comparePassword(newPassword, user.PasswordHash);

  if (isSamePassword) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ.',
      errors: {
        newPassword: ['Mật khẩu mới không được giống mật khẩu cũ.'],
      },
    };
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(user.Id, passwordHash);

  return {
    success: true,
    statusCode: 200,
    message: 'Đổi mật khẩu thành công',
    data: null,
  };
}
