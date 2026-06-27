// src/modules/teacher/teacher.progress.controller.js
import {
  getTeacherProgressReports,
  countTeacherProgressReports,
  findProgressReportById,
  reviewProgressReport,
} from '../report/report.model.js';

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeScore(value) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return null;
  if (numberValue < 0 || numberValue > 10) return null;

  return numberValue;
}

export async function getProgressReportsForTeacher(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const filters = {
      page,
      limit,
      status: normalizeString(req.query.status) || null,
      search: normalizeString(req.query.search),
    };

    const [reports, total] = await Promise.all([
      getTeacherProgressReports(req.user.id, filters),
      countTeacherProgressReports(req.user.id, filters),
    ]);

    return res.json({
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy báo cáo tiến độ cho giảng viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy báo cáo tiến độ',
    });
  }
}

export async function getProgressReportDetailForTeacher(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id báo cáo không hợp lệ',
      });
    }

    const report = await findProgressReportById(id);

    if (!report || report.DeletedAt || report.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy báo cáo tiến độ',
      });
    }

    return res.json({
      data: report,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết tiến độ cho giảng viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết báo cáo tiến độ',
    });
  }
}

export async function reviewProgressReportForTeacher(req, res) {
  try {
    const id = Number(req.params.id);
    const teacherComment = normalizeString(req.body.teacherComment);
    const teacherScore = normalizeScore(req.body.teacherScore);

    if (!id) {
      return res.status(400).json({
        message: 'Id báo cáo không hợp lệ',
      });
    }

    if (teacherScore === null) {
      return res.status(400).json({
        message: 'Điểm đánh giá phải nằm trong khoảng 0 đến 10',
      });
    }

    const report = await findProgressReportById(id);

    if (!report || report.DeletedAt || report.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy báo cáo tiến độ',
      });
    }

    const reviewed = await reviewProgressReport(id, req.user.id, {
      teacherComment,
      teacherScore,
    });

    return res.json({
      message: 'Nhận xét báo cáo tiến độ thành công',
      data: reviewed,
    });
  } catch (error) {
    console.error('Lỗi nhận xét tiến độ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi nhận xét báo cáo tiến độ',
    });
  }
}