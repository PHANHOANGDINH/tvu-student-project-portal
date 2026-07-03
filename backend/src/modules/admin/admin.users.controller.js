// src/modules/admin/admin.users.controller.js
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';

import {
  getUsers,
  countUsers,
  findUserByIdForAdmin,
  findUserByEmailForAdmin,
  findUserByUserCodeForAdmin,
  createUser,
  updateUser,
  setUserActive,
  resetUserPassword,
  softDeleteUser,
} from './admin.users.model.js';

import {
  findClassByCode,
  findClassById,
  findActiveStudentClass,
  addStudentToClass,
} from './admin.classes.model.js';

const VALID_ROLES = ['Admin', 'Teacher', 'Student'];

function normalizeString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generatePassword() {
  return `TVU${Math.floor(100000 + Math.random() * 900000)}`;
}

function getRoleFromImportType(importType) {
  if (importType === 'students') return 'Student';
  if (importType === 'teachers') return 'Teacher';
  return '';
}

function getUserCodeLabel(role) {
  if (role === 'Student') return 'MSSV';
  if (role === 'Teacher') return 'Mã giảng viên';
  return 'Mã người dùng';
}

function getCell(row, keys = []) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }

  return '';
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
    const password = normalizeString(req.body.password);
    const role = normalizeString(req.body.role);
    const userCode = normalizeString(req.body.userCode).toUpperCase();
    const phone = normalizeString(req.body.phone);
    const department = normalizeString(req.body.department);
    const className = normalizeString(req.body.className).toUpperCase();

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

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    if ((role === 'Student' || role === 'Teacher') && !userCode) {
      return res.status(400).json({
        message: `${getUserCodeLabel(role)} không được để trống`,
      });
    }

    if (role === 'Student' && !className) {
      return res.status(400).json({
        message: 'Sinh viên cần có mã lớp',
      });
    }

    let targetClass = null;

    if (role === 'Student') {
      const classByCode = await findClassByCode(className);

      if (!classByCode || classByCode.DeletedAt) {
        return res.status(400).json({
          message: `Mã lớp ${className} không tồn tại trong hệ thống`,
        });
      }

      targetClass = await findClassById(classByCode.Id);

      if (!targetClass || targetClass.DeletedAt) {
        return res.status(400).json({
          message: `Mã lớp ${className} không hợp lệ`,
        });
      }

      if (targetClass.IsActive === false) {
        return res.status(400).json({
          message: `Lớp ${className} đang bị khóa, không thể thêm sinh viên`,
        });
      }
    }

    const existedEmail = await findUserByEmailForAdmin(email);

    if (existedEmail) {
      return res.status(409).json({
        message: 'Email đã tồn tại trong hệ thống',
      });
    }

    if (userCode) {
      const existedUserCode = await findUserByUserCodeForAdmin(userCode);

      if (existedUserCode) {
        return res.status(409).json({
          message: `${getUserCodeLabel(role)} đã tồn tại trong hệ thống`,
        });
      }
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
      className: role === 'Student' ? className : '',
    });

    if (role === 'Student' && targetClass) {
      await addStudentToClass(targetClass.Id, newUser.Id);
    }

    return res.status(201).json({
      message: 'Tạo người dùng thành công',
      data: newUser,
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
    const email =
      normalizeString(req.body.email).toLowerCase() || currentUser.Email;
    const role = normalizeString(req.body.role) || currentUser.Role;
    const userCode =
      normalizeString(req.body.userCode).toUpperCase() ||
      currentUser.UserCode ||
      '';

    const phone =
      req.body.phone !== undefined
        ? normalizeString(req.body.phone)
        : currentUser.Phone;

    const department =
      req.body.department !== undefined
        ? normalizeString(req.body.department)
        : currentUser.Department;

    const className =
      req.body.className !== undefined
        ? normalizeString(req.body.className).toUpperCase()
        : currentUser.ClassName;

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

    if ((role === 'Student' || role === 'Teacher') && !userCode) {
      return res.status(400).json({
        message: `${getUserCodeLabel(role)} không được để trống`,
      });
    }

    const existedEmail = await findUserByEmailForAdmin(email);

    if (existedEmail && existedEmail.Id !== id) {
      return res.status(409).json({
        message: 'Email đã được sử dụng bởi người dùng khác',
      });
    }

    if (userCode) {
      const existedUserCode = await findUserByUserCodeForAdmin(userCode);

      if (existedUserCode && existedUserCode.Id !== id) {
        return res.status(409).json({
          message: `${getUserCodeLabel(role)} đã được sử dụng bởi người dùng khác`,
        });
      }
    }

    const updatedUser = await updateUser(id, {
      fullName,
      email,
      role,
      userCode,
      phone,
      department,
      className: role === 'Student' ? className : '',
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
      message: 'Lỗi server khi khóa tài khoản',
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
      message: 'Lỗi server khi mở khóa tài khoản',
    });
  }
}

export async function resetPasswordAdminUser(req, res) {
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

    const newPassword = generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await resetUserPassword(id, passwordHash);

    return res.json({
      message: 'Cấp lại mật khẩu thành công',
      data: user,
      newPassword,
    });
  } catch (error) {
    console.error('Lỗi cấp lại mật khẩu:', error);

    return res.status(500).json({
      message: 'Lỗi server khi cấp lại mật khẩu',
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

export async function importUsersFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Vui lòng chọn file Excel',
      });
    }

    const importType = normalizeString(req.body.importType);
    const role = getRoleFromImportType(importType);

    if (!role) {
      return res.status(400).json({
        message: 'Vui lòng chọn loại import: sinh viên hoặc giảng viên',
      });
    }

    const workbook = xlsx.read(req.file.buffer, {
      type: 'buffer',
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(worksheet, {
      defval: '',
    });

    if (!rows.length) {
      return res.status(400).json({
        message: 'File Excel không có dữ liệu',
      });
    }

    const successItems = [];
    const errorItems = [];

    const seenEmails = new Set();
    const seenUserCodes = new Set();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;

      const fullName = normalizeString(
        getCell(row, ['Họ tên', 'Ho ten', 'HoTen', 'fullName', 'FullName'])
      );

      const email = normalizeString(
        getCell(row, ['Email', 'email'])
      ).toLowerCase();

      const userCode = normalizeString(
        getCell(row, [
          'MSSV',
          'Mã sinh viên',
          'Ma sinh vien',
          'Mã giảng viên',
          'Ma giang vien',
          'Mã người dùng',
          'Ma nguoi dung',
          'userCode',
          'UserCode',
        ])
      ).toUpperCase();

      const phone = normalizeString(
        getCell(row, [
          'Số điện thoại',
          'So dien thoai',
          'SDT',
          'phone',
          'Phone',
        ])
      );

      const department = normalizeString(
        getCell(row, ['Khoa', 'department', 'Department'])
      );

      const className = normalizeString(
        getCell(row, ['Mã lớp', 'Ma lop', 'Lớp', 'Lop', 'className', 'ClassName'])
      ).toUpperCase();

      const password =
        normalizeString(
          getCell(row, ['Mật khẩu', 'Mat khau', 'password', 'Password'])
        ) || '123456';

      let targetClass = null;

      try {
        if (!fullName || !email) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Thiếu họ tên hoặc email',
            rowData: row,
          });

          continue;
        }

        if (!isValidEmail(email)) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Email không hợp lệ',
            rowData: row,
          });

          continue;
        }

        if (seenEmails.has(email)) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Email bị trùng trong file Excel',
            rowData: row,
          });

          continue;
        }

        seenEmails.add(email);

        if (role === 'Student' && !userCode) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Sinh viên cần có MSSV',
            rowData: row,
          });

          continue;
        }

        if (role === 'Teacher' && !userCode) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Giảng viên cần có mã giảng viên',
            rowData: row,
          });

          continue;
        }

        if (seenUserCodes.has(userCode)) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason:
              role === 'Student'
                ? 'MSSV bị trùng trong file Excel'
                : 'Mã giảng viên bị trùng trong file Excel',
            rowData: row,
          });

          continue;
        }

        seenUserCodes.add(userCode);

        if (role === 'Student' && !className) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Sinh viên cần có mã lớp',
            rowData: row,
          });

          continue;
        }

        if (role === 'Student') {
          const classByCode = await findClassByCode(className);

          if (!classByCode || classByCode.DeletedAt) {
            errorItems.push({
              row: rowNumber,
              email,
              userCode,
              reason: `Mã lớp ${className} không tồn tại trong hệ thống`,
              rowData: row,
            });

            continue;
          }

          targetClass = await findClassById(classByCode.Id);

          if (!targetClass || targetClass.DeletedAt) {
            errorItems.push({
              row: rowNumber,
              email,
              userCode,
              reason: `Mã lớp ${className} không hợp lệ`,
              rowData: row,
            });

            continue;
          }

          if (targetClass.IsActive === false) {
            errorItems.push({
              row: rowNumber,
              email,
              userCode,
              reason: `Lớp ${className} đang bị khóa`,
              rowData: row,
            });

            continue;
          }
        }

        if (password.length < 6) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Mật khẩu phải có ít nhất 6 ký tự',
            rowData: row,
          });

          continue;
        }

        const existedEmail = await findUserByEmailForAdmin(email);

        if (existedEmail) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Email đã tồn tại trong hệ thống',
            rowData: row,
          });

          continue;
        }

        const existedUserCode = await findUserByUserCodeForAdmin(userCode);

        if (existedUserCode) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason:
              role === 'Student'
                ? 'MSSV đã tồn tại trong hệ thống'
                : 'Mã giảng viên đã tồn tại trong hệ thống',
            rowData: row,
          });

          continue;
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
          className: role === 'Student' ? className : '',
        });

        if (role === 'Student' && targetClass) {
          const activeClass = await findActiveStudentClass(newUser.Id);

          if (!activeClass) {
            await addStudentToClass(targetClass.Id, newUser.Id);
          }
        }

        successItems.push({
          row: rowNumber,
          id: newUser.Id,
          fullName: newUser.FullName,
          email: newUser.Email,
          userCode: newUser.UserCode,
          classCode: role === 'Student' ? className : '',
          role: newUser.Role,
        });
      } catch (rowError) {
        errorItems.push({
          row: rowNumber,
          email,
          userCode,
          reason: rowError.message || 'Lỗi khi import dòng này',
          rowData: row,
        });
      }
    }

    return res.json({
      message: 'Import người dùng từ Excel hoàn tất',
      importType,
      role,
      totalRows: rows.length,
      successCount: successItems.length,
      failedCount: errorItems.length,
      successItems,
      errorItems,
    });
  } catch (error) {
    console.error('Lỗi import người dùng từ Excel:', error);

    return res.status(500).json({
      message: 'Lỗi server khi import người dùng từ Excel',
    });
  }
}