// src/middlewares/role.middleware.js
export default function roleMiddleware(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập chức năng này',
      });
    }

    next();
  };
}