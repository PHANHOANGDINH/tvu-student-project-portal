// src/modules/teacher/teacher.finalSubmission.controller.js
import {
  getTeacherFinalSubmissions,
  countTeacherFinalSubmissions,
  findFinalSubmissionById,
  reviewFinalSubmission,
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

export async function getFinalSubmissionsForTeacher(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const filters = {
      page,
      limit,
      status: normalizeString(req.query.status) || null,
      search: normalizeString(req.query.search),
    };

    const [submissions, total] = await Promise.all([
      getTeacherFinalSubmissions(req.user.id, filters),
      countTeacherFinalSubmissions(req.user.id, filters),
    ]);

    return res.json({
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy báo cáo cuối kỳ cho giảng viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy báo cáo cuối kỳ',
    });
  }
}

export async function getFinalSubmissionDetailForTeacher(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id báo cáo không hợp lệ',
      });
    }

    const submission = await findFinalSubmissionById(id);

    if (!submission || submission.DeletedAt || submission.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy báo cáo cuối kỳ',
      });
    }

    return res.json({
      data: submission,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết báo cáo cuối kỳ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết báo cáo cuối kỳ',
    });
  }
}

export async function reviewFinalSubmissionForTeacher(req, res) {
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

    const submission = await findFinalSubmissionById(id);

    if (!submission || submission.DeletedAt || submission.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy báo cáo cuối kỳ',
      });
    }

    const reviewed = await reviewFinalSubmission(id, req.user.id, {
      teacherComment,
      teacherScore,
    });

    return res.json({
      message: 'Chấm báo cáo cuối kỳ thành công',
      data: reviewed,
    });
  } catch (error) {
    console.error('Lỗi chấm báo cáo cuối kỳ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi chấm báo cáo cuối kỳ',
    });
  }
}