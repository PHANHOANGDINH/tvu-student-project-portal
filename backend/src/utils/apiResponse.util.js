export function sendSuccess(res, { statusCode = 200, message = 'Thao tác thành công', data = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,
  });
}

export function sendError(
  res,
  {
    statusCode = 500,
    message = 'Lỗi hệ thống',
    data = null,
    errors = null,
  } = {}
) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
    errors,
  });
}
