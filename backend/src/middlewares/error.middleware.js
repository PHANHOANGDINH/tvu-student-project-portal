export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'Không tìm thấy API.',
    data: null,
    errors: null,
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  return res.status(500).json({
    success: false,
    message: 'Lỗi hệ thống.',
    data: null,
    errors: process.env.NODE_ENV === 'development' ? { system: [error.message] } : null,
  });
}
