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

const VALID_ROLES = ['ADMIN', 'LECTURER', 'STUDENT'];

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
  if (importType === 'students') return 'STUDENT';
  if (importType === 'teachers') return 'LECTURER';
  return '';
}

function getUserCodeLabel(role) {
  if (role === 'STUDENT') return 'MSSV';
  if (role === 'LECTURER') return 'MĂ£ giáº£ng viĂªn';
  return 'MĂ£ ngÆ°á»i dĂ¹ng';
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
        message: 'Vai trĂ² khĂ´ng há»£p lá»‡',
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
    console.error('Lá»—i láº¥y danh sĂ¡ch ngÆ°á»i dĂ¹ng:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi láº¥y danh sĂ¡ch ngÆ°á»i dĂ¹ng',
    });
  }
}

export async function getAdminUserDetail(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id ngÆ°á»i dĂ¹ng khĂ´ng há»£p lá»‡',
      });
    }

    const user = await findUserByIdForAdmin(id);

    if (!user) {
      return res.status(404).json({
        message: 'KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng',
      });
    }

    return res.json({
      data: user,
    });
  } catch (error) {
    console.error('Lá»—i láº¥y chi tiáº¿t ngÆ°á»i dĂ¹ng:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi láº¥y chi tiáº¿t ngÆ°á»i dĂ¹ng',
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
        message: 'Vui lĂ²ng nháº­p há» tĂªn, email vĂ  vai trĂ²',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Email khĂ´ng há»£p lá»‡',
      });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({
        message: 'Vai trĂ² khĂ´ng há»£p lá»‡',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Máº­t kháº©u pháº£i cĂ³ Ă­t nháº¥t 6 kĂ½ tá»±',
      });
    }

    if ((role === 'STUDENT' || role === 'LECTURER') && !userCode) {
      return res.status(400).json({
        message: `${getUserCodeLabel(role)} khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng`,
      });
    }

    if (role === 'STUDENT' && !className) {
      return res.status(400).json({
        message: 'Sinh viĂªn cáº§n cĂ³ mĂ£ lá»›p',
      });
    }

    let targetClass = null;

    if (role === 'STUDENT') {
      const classByCode = await findClassByCode(className);

      if (!classByCode || classByCode.DeletedAt) {
        return res.status(400).json({
          message: `MĂ£ lá»›p ${className} khĂ´ng tá»“n táº¡i trong há»‡ thá»‘ng`,
        });
      }

      targetClass = await findClassById(classByCode.Id);

      if (!targetClass || targetClass.DeletedAt) {
        return res.status(400).json({
          message: `MĂ£ lá»›p ${className} khĂ´ng há»£p lá»‡`,
        });
      }

      if (targetClass.IsActive === false) {
        return res.status(400).json({
          message: `Lá»›p ${className} Ä‘ang bá»‹ khĂ³a, khĂ´ng thá»ƒ thĂªm sinh viĂªn`,
        });
      }
    }

    const existedEmail = await findUserByEmailForAdmin(email);

    if (existedEmail) {
      return res.status(409).json({
        message: 'Email Ä‘Ă£ tá»“n táº¡i trong há»‡ thá»‘ng',
      });
    }

    if (userCode) {
      const existedUserCode = await findUserByUserCodeForAdmin(userCode);

      if (existedUserCode) {
        return res.status(409).json({
          message: `${getUserCodeLabel(role)} Ä‘Ă£ tá»“n táº¡i trong há»‡ thá»‘ng`,
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
      className: role === 'STUDENT' ? className : '',
    });

    if (role === 'STUDENT' && targetClass) {
      await addStudentToClass(targetClass.Id, newUser.Id);
    }

    return res.status(201).json({
      message: 'Táº¡o ngÆ°á»i dĂ¹ng thĂ nh cĂ´ng',
      data: newUser,
    });
  } catch (error) {
    console.error('Lá»—i táº¡o ngÆ°á»i dĂ¹ng:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi táº¡o ngÆ°á»i dĂ¹ng',
    });
  }
}

export async function updateAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id ngÆ°á»i dĂ¹ng khĂ´ng há»£p lá»‡',
      });
    }

    const currentUser = await findUserByIdForAdmin(id);

    if (!currentUser || currentUser.DeletedAt) {
      return res.status(404).json({
        message: 'KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng',
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
        message: 'Vui lĂ²ng nháº­p há» tĂªn, email vĂ  vai trĂ²',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Email khĂ´ng há»£p lá»‡',
      });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({
        message: 'Vai trĂ² khĂ´ng há»£p lá»‡',
      });
    }

    if ((role === 'STUDENT' || role === 'LECTURER') && !userCode) {
      return res.status(400).json({
        message: `${getUserCodeLabel(role)} khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng`,
      });
    }

    const existedEmail = await findUserByEmailForAdmin(email);

    if (existedEmail && existedEmail.Id !== id) {
      return res.status(409).json({
        message: 'Email Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng bá»Ÿi ngÆ°á»i dĂ¹ng khĂ¡c',
      });
    }

    if (userCode) {
      const existedUserCode = await findUserByUserCodeForAdmin(userCode);

      if (existedUserCode && existedUserCode.Id !== id) {
        return res.status(409).json({
          message: `${getUserCodeLabel(role)} Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng bá»Ÿi ngÆ°á»i dĂ¹ng khĂ¡c`,
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
      className: role === 'STUDENT' ? className : '',
    });

    return res.json({
      message: 'Cáº­p nháº­t ngÆ°á»i dĂ¹ng thĂ nh cĂ´ng',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Lá»—i cáº­p nháº­t ngÆ°á»i dĂ¹ng:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi cáº­p nháº­t ngÆ°á»i dĂ¹ng',
    });
  }
}

export async function lockAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id ngÆ°á»i dĂ¹ng khĂ´ng há»£p lá»‡',
      });
    }

    const user = await setUserActive(id, false);

    if (!user) {
      return res.status(404).json({
        message: 'KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng',
      });
    }

    return res.json({
      message: 'KhĂ³a tĂ i khoáº£n thĂ nh cĂ´ng',
      data: user,
    });
  } catch (error) {
    console.error('Lá»—i khĂ³a ngÆ°á»i dĂ¹ng:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi khĂ³a tĂ i khoáº£n',
    });
  }
}

export async function unlockAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id ngÆ°á»i dĂ¹ng khĂ´ng há»£p lá»‡',
      });
    }

    const user = await setUserActive(id, true);

    if (!user) {
      return res.status(404).json({
        message: 'KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng',
      });
    }

    return res.json({
      message: 'Má»Ÿ khĂ³a tĂ i khoáº£n thĂ nh cĂ´ng',
      data: user,
    });
  } catch (error) {
    console.error('Lá»—i má»Ÿ khĂ³a ngÆ°á»i dĂ¹ng:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi má»Ÿ khĂ³a tĂ i khoáº£n',
    });
  }
}

export async function resetPasswordAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id ngÆ°á»i dĂ¹ng khĂ´ng há»£p lá»‡',
      });
    }

    const currentUser = await findUserByIdForAdmin(id);

    if (!currentUser || currentUser.DeletedAt) {
      return res.status(404).json({
        message: 'KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng',
      });
    }

    const newPassword = generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await resetUserPassword(id, passwordHash);

    return res.json({
      message: 'Cáº¥p láº¡i máº­t kháº©u thĂ nh cĂ´ng',
      data: user,
      newPassword,
    });
  } catch (error) {
    console.error('Lá»—i cáº¥p láº¡i máº­t kháº©u:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi cáº¥p láº¡i máº­t kháº©u',
    });
  }
}

export async function deleteAdminUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id ngÆ°á»i dĂ¹ng khĂ´ng há»£p lá»‡',
      });
    }

    const user = await softDeleteUser(id);

    if (!user) {
      return res.status(404).json({
        message: 'KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng',
      });
    }

    return res.json({
      message: 'XĂ³a ngÆ°á»i dĂ¹ng thĂ nh cĂ´ng',
      data: user,
    });
  } catch (error) {
    console.error('Lá»—i xĂ³a ngÆ°á»i dĂ¹ng:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi xĂ³a ngÆ°á»i dĂ¹ng',
    });
  }
}

export async function importUsersFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Vui lĂ²ng chá»n file Excel',
      });
    }

    const importType = normalizeString(req.body.importType);
    const role = getRoleFromImportType(importType);

    if (!role) {
      return res.status(400).json({
        message: 'Vui lĂ²ng chá»n loáº¡i import: sinh viĂªn hoáº·c giáº£ng viĂªn',
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
        message: 'File Excel khĂ´ng cĂ³ dá»¯ liá»‡u',
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
        getCell(row, ['Há» tĂªn', 'Ho ten', 'HoTen', 'fullName', 'FullName'])
      );

      const email = normalizeString(
        getCell(row, ['Email', 'email'])
      ).toLowerCase();

      const userCode = normalizeString(
        getCell(row, [
          'MSSV',
          'MĂ£ sinh viĂªn',
          'Ma sinh vien',
          'MĂ£ giáº£ng viĂªn',
          'Ma giang vien',
          'MĂ£ ngÆ°á»i dĂ¹ng',
          'Ma nguoi dung',
          'userCode',
          'UserCode',
        ])
      ).toUpperCase();

      const phone = normalizeString(
        getCell(row, [
          'Sá»‘ Ä‘iá»‡n thoáº¡i',
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
        getCell(row, ['MĂ£ lá»›p', 'Ma lop', 'Lá»›p', 'Lop', 'className', 'ClassName'])
      ).toUpperCase();

      const password =
        normalizeString(
          getCell(row, ['Máº­t kháº©u', 'Mat khau', 'password', 'Password'])
        ) || '123456';

      let targetClass = null;

      try {
        if (!fullName || !email) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Thiáº¿u há» tĂªn hoáº·c email',
            rowData: row,
          });

          continue;
        }

        if (!isValidEmail(email)) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Email khĂ´ng há»£p lá»‡',
            rowData: row,
          });

          continue;
        }

        if (seenEmails.has(email)) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Email bá»‹ trĂ¹ng trong file Excel',
            rowData: row,
          });

          continue;
        }

        seenEmails.add(email);

        if (role === 'STUDENT' && !userCode) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Sinh viĂªn cáº§n cĂ³ MSSV',
            rowData: row,
          });

          continue;
        }

        if (role === 'LECTURER' && !userCode) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Giáº£ng viĂªn cáº§n cĂ³ mĂ£ giáº£ng viĂªn',
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
              role === 'STUDENT'
                ? 'MSSV bá»‹ trĂ¹ng trong file Excel'
                : 'MĂ£ giáº£ng viĂªn bá»‹ trĂ¹ng trong file Excel',
            rowData: row,
          });

          continue;
        }

        seenUserCodes.add(userCode);

        if (role === 'STUDENT' && !className) {
          errorItems.push({
            row: rowNumber,
            email,
            userCode,
            reason: 'Sinh viĂªn cáº§n cĂ³ mĂ£ lá»›p',
            rowData: row,
          });

          continue;
        }

        if (role === 'STUDENT') {
          const classByCode = await findClassByCode(className);

          if (!classByCode || classByCode.DeletedAt) {
            errorItems.push({
              row: rowNumber,
              email,
              userCode,
              reason: `MĂ£ lá»›p ${className} khĂ´ng tá»“n táº¡i trong há»‡ thá»‘ng`,
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
              reason: `MĂ£ lá»›p ${className} khĂ´ng há»£p lá»‡`,
              rowData: row,
            });

            continue;
          }

          if (targetClass.IsActive === false) {
            errorItems.push({
              row: rowNumber,
              email,
              userCode,
              reason: `Lá»›p ${className} Ä‘ang bá»‹ khĂ³a`,
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
            reason: 'Máº­t kháº©u pháº£i cĂ³ Ă­t nháº¥t 6 kĂ½ tá»±',
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
            reason: 'Email Ä‘Ă£ tá»“n táº¡i trong há»‡ thá»‘ng',
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
              role === 'STUDENT'
                ? 'MSSV Ä‘Ă£ tá»“n táº¡i trong há»‡ thá»‘ng'
                : 'MĂ£ giáº£ng viĂªn Ä‘Ă£ tá»“n táº¡i trong há»‡ thá»‘ng',
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
          className: role === 'STUDENT' ? className : '',
        });

        if (role === 'STUDENT' && targetClass) {
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
          classCode: role === 'STUDENT' ? className : '',
          role: newUser.Role,
        });
      } catch (rowError) {
        errorItems.push({
          row: rowNumber,
          email,
          userCode,
          reason: rowError.message || 'Lá»—i khi import dĂ²ng nĂ y',
          rowData: row,
        });
      }
    }

    return res.json({
      message: 'Import ngÆ°á»i dĂ¹ng tá»« Excel hoĂ n táº¥t',
      importType,
      role,
      totalRows: rows.length,
      successCount: successItems.length,
      failedCount: errorItems.length,
      successItems,
      errorItems,
    });
  } catch (error) {
    console.error('Lá»—i import ngÆ°á»i dĂ¹ng tá»« Excel:', error);

    return res.status(500).json({
      message: 'Lá»—i server khi import ngÆ°á»i dĂ¹ng tá»« Excel',
    });
  }
}
