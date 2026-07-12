// src/middlewares/role.middleware.js
import { normalizeRole } from '../constants/roles.js';
import { sendError } from '../utils/apiResponse.util.js';

export default function roleMiddleware(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole).filter(Boolean);

  return function (req, res, next) {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn',
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
      return sendError(res, {
        statusCode: 403,
        message: 'Bạn không có quyền thực hiện chức năng này',
      });
    }

    next();
  };
}
