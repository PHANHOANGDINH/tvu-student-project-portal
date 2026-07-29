// src/modules/student/student.progress.controller.js
import {
  findApprovedStudentProject,
  createProgressReport,
  getStudentProgressReports,
  countStudentProgressReports,
  findProgressReportById,
  updateProgressReport,
  softDeleteProgressReport,
} from '../report/report.model.js';

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeProgressPercent(value) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return 0;
  if (numberValue < 0) return 0;
  if (numberValue > 100) return 100;

  return numberValue;
}

export async function getMyProgressReports(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const status = normalizeString(req.query.status) || null;

    const filters = {
      page,
      limit,
      status,
    };

    const [reports, total] = await Promise.all([
      getStudentProgressReports(req.user.id, filters),
      countStudentProgressReports(req.user.id, filters),
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
    console.error('Lỗi lấy báo cáo tiến độ của sinh viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy báo cáo tiến độ',
    });
  }
}

export async function createMyProgressReport(req, res) {
  try {
    const projectId = Number(req.body.projectId);
    const title = normalizeString(req.body.title);
    const content = normalizeString(req.body.content);
    const progressPercent = normalizeProgressPercent(req.body.progressPercent);
    const reportDate = normalizeString(req.body.reportDate) || null;
    const fileUrl = normalizeString(req.body.fileUrl);

    if (!projectId) {
      return res.status(400).json({
        message: 'Vui lòng chọn đề tài',
      });
    }

    if (!title) {
      return res.status(400).json({
        message: 'Vui lòng nhập tiêu đề báo cáo tiến độ',
      });
    }

    const approvedProject = await findApprovedStudentProject(req.user.id, projectId);

    if (!approvedProject) {
      return res.status(403).json({
        message: 'Bạn chỉ được nộp tiến độ cho đề tài đã được duyệt',
      });
    }

    const report = await createProgressReport({
      projectId,
      studentId: req.user.id,
      title,
      content,
      progressPercent,
      reportDate,
      fileUrl,
    });

    return res.status(201).json({
      message: 'Nộp báo cáo tiến độ thành công',
      data: report,
    });
  } catch (error) {
    console.error('Lỗi nộp báo cáo tiến độ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi nộp báo cáo tiến độ',
    });
  }
}

export async function getMyProgressReportDetail(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id báo cáo không hợp lệ',
      });
    }

    const report = await findProgressReportById(id);

    if (!report || report.DeletedAt || report.StudentId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy báo cáo tiến độ',
      });
    }

    return res.json({
      data: report,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết báo cáo tiến độ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết báo cáo tiến độ',
    });
  }
}

export async function updateMyProgressReport(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id báo cáo không hợp lệ',
      });
    }

    const currentReport = await findProgressReportById(id);

    if (!currentReport || currentReport.DeletedAt || currentReport.StudentId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy báo cáo tiến độ',
      });
    }

    if (currentReport.Status === 'Reviewed') {
      return res.status(400).json({
        message: 'Không thể sửa báo cáo đã được giảng viên nhận xét',
      });
    }

    const title = normalizeString(req.body.title) || currentReport.Title;

    const content =
      req.body.content !== undefined
        ? normalizeString(req.body.content)
        : currentReport.Content;

    const progressPercent =
      req.body.progressPercent !== undefined
        ? normalizeProgressPercent(req.body.progressPercent)
        : currentReport.ProgressPercent;

    const reportDate =
      req.body.reportDate !== undefined
        ? normalizeString(req.body.reportDate)
        : currentReport.ReportDate;

    const fileUrl =
      req.body.fileUrl !== undefined
        ? normalizeString(req.body.fileUrl)
        : currentReport.FileUrl;

    const updated = await updateProgressReport(id, req.user.id, {
      title,
      content,
      progressPercent,
      reportDate,
      fileUrl,
    });

    return res.json({
      message: 'Cập nhật báo cáo tiến độ thành công',
      data: updated,
    });
  } catch (error) {
    console.error('Lỗi cập nhật báo cáo tiến độ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi cập nhật báo cáo tiến độ',
    });
  }
}

export async function deleteMyProgressReport(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id báo cáo không hợp lệ',
      });
    }

    const report = await softDeleteProgressReport(id, req.user.id);

    if (!report) {
      return res.status(404).json({
        message: 'Không tìm thấy báo cáo hoặc báo cáo đã được nhận xét',
      });
    }

    return res.json({
      message: 'Xóa báo cáo tiến độ thành công',
      data: report,
    });
  } catch (error) {
    console.error('Lỗi xóa báo cáo tiến độ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi xóa báo cáo tiến độ',
    });
  }
}