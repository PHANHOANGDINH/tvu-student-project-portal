import { USER_ROLES, normalizeRole } from '../../constants/roles.js';
import { hashPassword } from '../../utils/password.util.js';
import {
  countActiveAdmins,
  countUsers,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUserCode,
  findUsers,
  updatePassword,
  updateUser,
  updateUserStatus,
} from './users.repository.js';

const CREATE_ALLOWED_ROLES = [USER_ROLES.LECTURER, USER_ROLES.STUDENT];
const UPDATE_ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.LECTURER, USER_ROLES.STUDENT];
const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];
const VALID_SORT_FIELDS = ['fullName', 'email', 'userCode', 'role', 'status', 'createdAt'];

function normalizeString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeEmail(email) {
  return normalizeString(email).toLowerCase();
}

function normalizeUserCode(userCode) {
  return normalizeString(userCode).toUpperCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  const errors = [];

  if (!password) errors.push('Mật khẩu không được để trống.');
  if (password && password.length < 8) errors.push('Mật khẩu phải có ít nhất 8 ký tự.');
  if (password && !/[A-Z]/.test(password)) errors.push('Mật khẩu phải có ít nhất một chữ hoa.');
  if (password && !/[a-z]/.test(password)) errors.push('Mật khẩu phải có ít nhất một chữ thường.');
  if (password && !/\d/.test(password)) errors.push('Mật khẩu phải có ít nhất một chữ số.');

  return errors;
}

function getUserCodeLabel(role) {
  if (role === USER_ROLES.STUDENT) return 'MSSV';
  if (role === USER_ROLES.LECTURER) return 'Mã giảng viên';
  return 'Mã người dùng';
}

function sanitizeProfilePayload(data = {}) {
  return {
    fullName: normalizeString(data.fullName),
    email: normalizeEmail(data.email),
    role: normalizeRole(data.role),
    userCode: normalizeUserCode(data.userCode),
    phone: normalizeString(data.phone),
    department: normalizeString(data.department),
    className: normalizeString(data.className).toUpperCase(),
  };
}

function parsePositiveInt(value, fallback, max = null) {
  const number = Number(value);
  const parsed = Number.isInteger(number) && number > 0 ? number : fallback;
  return max ? Math.min(parsed, max) : parsed;
}

export async function listUsers(query = {}) {
  const page = parsePositiveInt(query.page, 1);
  const pageSize = parsePositiveInt(query.pageSize || query.limit, 10, 100);
  const role = query.role ? normalizeRole(query.role) : null;
  const status = query.status ? normalizeString(query.status).toUpperCase() : null;
  const sortBy = VALID_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  if (query.role && !role) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors: { role: ['Vai trò không hợp lệ.'] },
    };
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors: { status: ['Trạng thái không hợp lệ.'] },
    };
  }

  const filters = {
    page,
    pageSize,
    search: normalizeString(query.search),
    role,
    status,
    sortBy,
    sortOrder,
  };

  const [items, totalItems] = await Promise.all([
    findUsers(filters),
    countUsers(filters),
  ]);

  return {
    success: true,
    statusCode: 200,
    message: 'Lấy danh sách người dùng thành công',
    data: {
      items,
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

export async function getUserDetail(id) {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors: { id: ['Id người dùng không hợp lệ.'] },
    };
  }

  const user = await findUserById(userId);

  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: 'Không tìm thấy người dùng',
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: 'Lấy thông tin người dùng thành công',
    data: user,
  };
}

async function validateUniqueFields({ email, userCode, currentUserId = null, role }) {
  const errors = {};

  const existedEmail = await findUserByEmail(email);
  if (existedEmail && existedEmail.Id !== currentUserId) {
    errors.email = ['Email đã được sử dụng.'];
  }

  if (userCode) {
    const existedUserCode = await findUserByUserCode(userCode);
    if (existedUserCode && existedUserCode.Id !== currentUserId) {
      errors.userCode = [`${getUserCodeLabel(role)} đã được sử dụng.`];
    }
  }

  return errors;
}

function validateProfilePayload(payload, { requirePassword = false, password = '', confirmPassword = '' } = {}) {
  const errors = {};

  if (!payload.fullName) errors.fullName = ['Họ tên không được để trống.'];
  if (!payload.email) errors.email = ['Email không được để trống.'];
  if (payload.email && !isValidEmail(payload.email)) errors.email = ['Email không đúng định dạng.'];
  if (!payload.role) errors.role = ['Vai trò không hợp lệ.'];

  if ((payload.role === USER_ROLES.STUDENT || payload.role === USER_ROLES.LECTURER) && !payload.userCode) {
    errors.userCode = [`${getUserCodeLabel(payload.role)} không được để trống.`];
  }

  if (payload.role === USER_ROLES.STUDENT && !payload.className) {
    errors.className = ['Sinh viên cần có mã lớp.'];
  }

  if (requirePassword) {
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length) errors.password = passwordErrors;

    if (!confirmPassword) {
      errors.confirmPassword = ['Xác nhận mật khẩu không được để trống.'];
    } else if (password !== confirmPassword) {
      errors.confirmPassword = ['Xác nhận mật khẩu không khớp.'];
    }
  }

  return errors;
}

export async function createAdminManagedUser(data = {}) {
  const payload = sanitizeProfilePayload(data);
  const password = String(data.password || '');
  const confirmPassword = String(data.confirmPassword || '');

  const errors = validateProfilePayload(payload, {
    requirePassword: true,
    password,
    confirmPassword,
  });

  if (payload.role && !CREATE_ALLOWED_ROLES.includes(payload.role)) {
    errors.role = ['Admin chỉ được tạo tài khoản LECTURER hoặc STUDENT trong giai đoạn này.'];
  }

  if (Object.keys(errors).length) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors,
    };
  }

  const uniqueErrors = await validateUniqueFields(payload);
  if (Object.keys(uniqueErrors).length) {
    return {
      success: false,
      statusCode: 409,
      message: 'Dữ liệu đã tồn tại',
      errors: uniqueErrors,
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    ...payload,
    className: payload.role === USER_ROLES.STUDENT ? payload.className : '',
    passwordHash,
  });

  return {
    success: true,
    statusCode: 201,
    message: 'Tạo người dùng thành công',
    data: user,
  };
}

export async function updateAdminManagedUser(id, data = {}) {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors: { id: ['Id người dùng không hợp lệ.'] },
    };
  }

  const currentUser = await findUserById(userId);
  if (!currentUser) {
    return {
      success: false,
      statusCode: 404,
      message: 'Không tìm thấy người dùng',
    };
  }

  const payload = sanitizeProfilePayload({
    fullName: data.fullName ?? currentUser.fullName,
    email: data.email ?? currentUser.email,
    role: data.role ?? currentUser.role,
    userCode: data.userCode ?? currentUser.userCode,
    phone: data.phone ?? currentUser.phone,
    department: data.department ?? currentUser.department,
    className: data.className ?? currentUser.className,
  });

  const errors = validateProfilePayload(payload);

  if (payload.role && !UPDATE_ALLOWED_ROLES.includes(payload.role)) {
    errors.role = ['Vai trò không hợp lệ.'];
  }

  if (currentUser.role === USER_ROLES.ADMIN && payload.role !== USER_ROLES.ADMIN) {
    const remainingAdmins = await countActiveAdmins(userId);
    if (remainingAdmins <= 0 && currentUser.isActive !== false) {
      errors.role = ['Không được đổi vai trò của Admin cuối cùng còn hoạt động.'];
    }
  }

  if (currentUser.role !== USER_ROLES.ADMIN && payload.role === USER_ROLES.ADMIN) {
    errors.role = ['Không hỗ trợ nâng tài khoản lên ADMIN trong giai đoạn này.'];
  }

  if (Object.keys(errors).length) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors,
    };
  }

  const uniqueErrors = await validateUniqueFields({
    ...payload,
    currentUserId: userId,
  });

  if (Object.keys(uniqueErrors).length) {
    return {
      success: false,
      statusCode: 409,
      message: 'Dữ liệu đã tồn tại',
      errors: uniqueErrors,
    };
  }

  const user = await updateUser(userId, {
    ...payload,
    className: payload.role === USER_ROLES.STUDENT ? payload.className : '',
  });

  return {
    success: true,
    statusCode: 200,
    message: 'Cập nhật người dùng thành công',
    data: user,
  };
}

export async function setAdminManagedUserStatus(id, isActive, currentAdminId) {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0 || typeof isActive !== 'boolean') {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors: { isActive: ['Trạng thái tài khoản không hợp lệ.'] },
    };
  }

  const user = await findUserById(userId);
  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: 'Không tìm thấy người dùng',
    };
  }

  if (userId === Number(currentAdminId) && isActive === false) {
    return {
      success: false,
      statusCode: 403,
      message: 'Admin không được tự khóa tài khoản của mình',
    };
  }

  if (user.role === USER_ROLES.ADMIN && user.isActive !== false && isActive === false) {
    const remainingAdmins = await countActiveAdmins(userId);
    if (remainingAdmins <= 0) {
      return {
        success: false,
        statusCode: 403,
        message: 'Không được khóa Admin cuối cùng còn hoạt động',
      };
    }
  }

  const updatedUser = await updateUserStatus(userId, isActive);

  return {
    success: true,
    statusCode: 200,
    message: isActive ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công',
    data: updatedUser,
  };
}

export async function resetAdminManagedUserPassword(id, data = {}) {
  const userId = Number(id);
  const newPassword = String(data.newPassword || '');
  const confirmNewPassword = String(data.confirmNewPassword || '');
  const errors = {};

  if (!Number.isInteger(userId) || userId <= 0) {
    errors.id = ['Id người dùng không hợp lệ.'];
  }

  const passwordErrors = validatePassword(newPassword);
  if (passwordErrors.length) errors.newPassword = passwordErrors;

  if (!confirmNewPassword) {
    errors.confirmNewPassword = ['Xác nhận mật khẩu mới không được để trống.'];
  } else if (newPassword !== confirmNewPassword) {
    errors.confirmNewPassword = ['Xác nhận mật khẩu mới không khớp.'];
  }

  if (Object.keys(errors).length) {
    return {
      success: false,
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors,
    };
  }

  const user = await findUserById(userId);
  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: 'Không tìm thấy người dùng',
    };
  }

  const passwordHash = await hashPassword(newPassword);
  const updatedUser = await updatePassword(userId, passwordHash);

  return {
    success: true,
    statusCode: 200,
    message: 'Reset mật khẩu thành công',
    data: updatedUser,
  };
}
