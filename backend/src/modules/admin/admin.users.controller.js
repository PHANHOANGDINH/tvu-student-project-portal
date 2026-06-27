// src/modules/admin/admin.users.controller.js
import bcrypt from 'bcryptjs';

import {
  getUsers,
  countUsers,
  findUserByIdForAdmin,
  findUserByEmailForAdmin,
  createUser,
  updateUser,
  setUserActive,
  resetUserPassword,
  softDeleteUser,
} from './admin.users.model.js';

const VALID_ROLES = ['Admin', 'Teacher', 'Student'];

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function getAdminUsers(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const filters = {
      page,
      limit,
      search: normalizeString(req.query.search),
      role: normalizeString(req.query.role) || null,
      status: normalizeString(req.query.status) || 'not-deleted',
    };

    if (filters.role && !isValidRole(filters.role)) {
      return res.status(400).json({
        message: 'Vai trò không hợp lệ',
      });
    }

    const [users, total] = await Promise.all([
      getUsers(filters),
      countUsers(filters),
    ]);

    return res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách người dùng',
    });
  }
}

export async function getAdminUserDetail(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id người dùng không hợp lệ',
      });
    }

    const user = await findUserByIdForAdmin(id);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json({
      data: user,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết người dùng:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết người dùng',
    });
  }
}

export async function createAdminUser(req, res) {
  try {
    const fullName = normalizeString(req.body.fullName);
    const email = normalizeString(req.body.email).toLowerCase();
    const password = normalizeString(req.body.password) || '123456';
    const role = normalizeString(req.body.role);
    const userCode = normalizeString(req.body.userCode);
    const phone = normalizeString(req.body.phone);
    const department = normalizeString(req.body.department);
    const className = normalizeString(req.body.className);

    if (!fullName || !email || !role) {
      return res.status(400).json({
        message: 'Vui lòng nhập họ tên, email và vai trò',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Email không hợp lệ',
      });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({
        message: 'Vai trò không hợp lệ',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    const existedUser = await findUserByEmailForAdmin(email);

    if (existedUser) {
      return res.status(409).json({
        message: 'Email đã tồn tại trong hệ thống',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      fullName,
      email,
      passwordHash,
      role,
      userCode,
      phone,
      department,
      className,
    });

    return res.status(201).json({
      message: 'Tạo người dùng thành công',
      data: newUser,
      defaultPassword: password,
    });
  } catch (error) {
    console.error('Lỗi tạo người dùng:', error);

    return res.status(500).json({
      message: 'Lỗi server khi tạo người dùng',
    });
  }
}

export async function updateAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id người dùng không hợp lệ',
      });
    }

    const currentUser = await findUserByIdForAdmin(id);

    if (!currentUser || currentUser.DeletedAt) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    const fullName = normalizeString(req.body.fullName) || currentUser.FullName;
    const email = normalizeString(req.body.email).toLowerCase() || currentUser.Email;
    const role = normalizeString(req.body.role) || currentUser.Role;
    const userCode = req.body.userCode !== undefined ? normalizeString(req.body.userCode) : currentUser.UserCode;
    const phone = req.body.phone !== undefined ? normalizeString(req.body.phone) : currentUser.Phone;
    const department = req.body.department !== undefined ? normalizeString(req.body.department) : currentUser.Department;
    const className = req.body.className !== undefined ? normalizeString(req.body.className) : currentUser.ClassName;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Email không hợp lệ',
      });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({
        message: 'Vai trò không hợp lệ',
      });
    }

    const existedUser = await findUserByEmailForAdmin(email);

    if (existedUser && existedUser.Id !== id) {
      return res.status(409).json({
        message: 'Email đã được sử dụng bởi người dùng khác',
      });
    }

    const updatedUser = await updateUser(id, {
      fullName,
      email,
      role,
      userCode,
      phone,
      department,
      className,
    });

    return res.json({
      message: 'Cập nhật người dùng thành công',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Lỗi cập nhật người dùng:', error);

    return res.status(500).json({
      message: 'Lỗi server khi cập nhật người dùng',
    });
  }
}

export async function lockAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id người dùng không hợp lệ',
      });
    }

    if (req.user.id === id) {
      return res.status(400).json({
        message: 'Bạn không thể tự khóa tài khoản của chính mình',
      });
    }

    const user = await setUserActive(id, false);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json({
      message: 'Khóa tài khoản thành công',
      data: user,
    });
  } catch (error) {
    console.error('Lỗi khóa người dùng:', error);

    return res.status(500).json({
      message: 'Lỗi server khi khóa người dùng',
    });
  }
}

export async function unlockAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id người dùng không hợp lệ',
      });
    }

    const user = await setUserActive(id, true);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json({
      message: 'Mở khóa tài khoản thành công',
      data: user,
    });
  } catch (error) {
    console.error('Lỗi mở khóa người dùng:', error);

    return res.status(500).json({
      message: 'Lỗi server khi mở khóa người dùng',
    });
  }
}

export async function resetPasswordAdminUser(req, res) {
  try {
    const id = Number(req.params.id);
    const newPassword = normalizeString(req.body.newPassword) || '123456';

    if (!id) {
      return res.status(400).json({
        message: 'Id người dùng không hợp lệ',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await resetUserPassword(id, passwordHash);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json({
      message: 'Đặt lại mật khẩu thành công',
      data: user,
      newPassword,
    });
  } catch (error) {
    console.error('Lỗi reset mật khẩu:', error);

    return res.status(500).json({
      message: 'Lỗi server khi đặt lại mật khẩu',
    });
  }
}

export async function deleteAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id người dùng không hợp lệ',
      });
    }

    if (req.user.id === id) {
      return res.status(400).json({
        message: 'Bạn không thể tự xóa tài khoản của chính mình',
      });
    }

    const user = await softDeleteUser(id);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json({
      message: 'Xóa người dùng thành công',
      data: user,
    });
  } catch (error) {
    console.error('Lỗi xóa người dùng:', error);

    return res.status(500).json({
      message: 'Lỗi server khi xóa người dùng',
    });
  }
}