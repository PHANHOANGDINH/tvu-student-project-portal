<<<<<<< HEAD
﻿import { changePassword as changePasswordService, getCurrentUser, login as loginService, registerStudent } from './auth.service.js';
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
=======
// src/modules/auth/auth.controller.js
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.util.js";
import { findUserByEmail, findUserById } from "./auth.model.js";

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email và mật khẩu",
            });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng",
            });
        }

        if (user.IsLocked) {
            return res.status(403).json({
                message: "Tài khoản đã bị khóa",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.PasswordHash,
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng",
            });
        }

        const token = generateToken(user);

        return res.json({
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user.Id,
                fullName: user.FullName,
                email: user.Email,
                role: user.Role,
            },
        });
    } catch (error) {
        console.error("========== LOGIN ERROR ==========");
        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        return res.status(500).json({
            message: error.message,
        });
    }
}

export async function me(req, res) {
    try {
        const user = await findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng",
            });
        }

        return res.json({
            user: {
                id: user.Id,
                fullName: user.FullName,
                email: user.Email,
                role: user.Role,
                isActive: user.IsActive,
                createdAt: user.CreatedAt,
            },
        });
    } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);

        return res.status(500).json({
            message: "Lỗi server khi lấy thông tin người dùng",
        });
    }
>>>>>>> 8b95a6f4b70675a1d81fa53807382cd291eaf0f1
}
