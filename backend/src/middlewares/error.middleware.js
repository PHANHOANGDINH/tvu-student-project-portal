export function notFoundHandler(req, res) {
  return res.status(404).json({
    message: 'Không tìm thấy API.'
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  return res.status(500).json({
    message: 'Lỗi hệ thống.',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}