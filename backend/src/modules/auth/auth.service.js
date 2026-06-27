import { createUser, findUserByEmail, findUserById } from './auth.repository.js';
import { comparePassword, hashPassword } from '../../utils/password.util.js';
import { generateToken } from '../../utils/jwt.util.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerStudent(data) {
  const fullName = String(data.fullName || '').trim();
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const userCode = String(data.userCode || '').trim();

  if (!fullName) {
    return {
      success: false,
      statusCode: 400,
      message: 'Họ tên không được để trống.'
    };
  }

  if (!email || !validateEmail(email)) {
    return {
      success: false,
      statusCode: 400,
      message: 'Email không đúng định dạng.'
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      statusCode: 400,
      message: 'Mật khẩu phải có ít nhất 6 ký tự.'
    };
  }

  if (!userCode) {
    return {
      success: false,
      statusCode: 400,
      message: 'MSSV không được để trống.'
    };
  }

  const existedUser = await findUserByEmail(email);

  if (existedUser) {
    return {
      success: false,
      statusCode: 409,
      message: 'Email đã tồn tại.'
    };
  }

  const passwordHash = await hashPassword(password);

  const newUserId = await createUser({
    fullName,
    email,
    passwordHash,
    role: 'STUDENT',
    userCode
  });

  const createdUser = await findUserById(newUserId);
  const token = generateToken(createdUser);

  return {
    success: true,
    statusCode: 201,
    message: 'Đăng ký tài khoản sinh viên thành công.',
    data: {
      user: createdUser,
      token
    }
  };
}

export async function login(data) {
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');

  if (!email || !password) {
    return {
      success: false,
      statusCode: 400,
      message: 'Email và mật khẩu không được để trống.'
    };
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return {
      success: false,
      statusCode: 400,
      message: 'Email hoặc mật khẩu không đúng.'
    };
  }

  if (user.IsLocked) {
    return {
      success: false,
      statusCode: 403,
      message: 'Tài khoản đã bị khóa.'
    };
  }

  const isPasswordValid = await comparePassword(password, user.PasswordHash);

  if (!isPasswordValid) {
    return {
      success: false,
      statusCode: 400,
      message: 'Email hoặc mật khẩu không đúng.'
    };
  }

  const token = generateToken(user);

  return {
    success: true,
    statusCode: 200,
    message: 'Đăng nhập thành công.',
    data: {
      user: {
        UserId: user.UserId,
        FullName: user.FullName,
        Email: user.Email,
        Role: user.Role,
        UserCode: user.UserCode,
        CreatedAt: user.CreatedAt
      },
      token
    }
  };
}