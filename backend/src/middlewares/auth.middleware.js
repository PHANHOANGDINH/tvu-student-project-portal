// src/middlewares/auth.middleware.js
import { verifyToken } from '../utils/jwt.util.js';
import { normalizeRole } from '../constants/roles.js';
import { sendError } from '../utils/apiResponse.util.js';

export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, {
        statusCode: 401,
        message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const role = normalizeRole(decoded.role);
    const id = decoded.sub || decoded.id;

    if (!id || !role) {
      return sendError(res, {
        statusCode: 401,
        message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn',
      });
    }

    req.user = {
      id: Number(id),
      email: decoded.email,
      role,
    };

    next();
  } catch (error) {
    return sendError(res, {
      statusCode: 401,
      message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn',
    });
  }
}
