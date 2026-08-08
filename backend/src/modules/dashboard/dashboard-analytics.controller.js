import { sendError, sendSuccess } from '../../utils/apiResponse.util.js';
import * as service from './dashboard-analytics.service.js';

export const dataset = (role, name) => async (req, res) => {
  try {
    const data = await service[role](name, req.query, req.user);
    return sendSuccess(res, { data, message: 'Lấy thống kê dashboard thành công' });
  } catch (error) {
    if (error.statusCode === 400) return sendError(res, { statusCode: 400, message: error.message });
    console.error('Dashboard analytics error:', error.message);
    return sendError(res, { statusCode: 500, message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.' });
  }
};
