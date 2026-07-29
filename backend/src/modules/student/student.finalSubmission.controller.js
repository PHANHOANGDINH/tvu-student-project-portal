// src/modules/student/student.finalSubmission.controller.js
import {
  findApprovedStudentProject,
  findFinalSubmissionByProjectStudent,
  createFinalSubmission,
  getStudentFinalSubmissions,
  countStudentFinalSubmissions,
  findFinalSubmissionById,
  updateFinalSubmission,
} from '../report/report.model.js';

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export async function getMyFinalSubmissions(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const status = normalizeString(req.query.status) || null;

    const filters = {
      page,
      limit,
      status,
    };

    const [submissions, total] = await Promise.all([
      getStudentFinalSubmissions(req.user.id, filters),
      countStudentFinalSubmissions(req.user.id, filters),
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
    console.error('Lỗi lấy báo cáo cuối kỳ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy báo cáo cuối kỳ',
    });
  }
}

export async function createMyFinalSubmission(req, res) {
  try {
    const projectId = Number(req.body.projectId);
    const title = normalizeString(req.body.title);
    const description = normalizeString(req.body.description);
    const reportFileUrl = normalizeString(req.body.reportFileUrl);
    const githubUrl = normalizeString(req.body.githubUrl);
    const demoUrl = normalizeString(req.body.demoUrl);

    if (!projectId) {
      return res.status(400).json({
        message: 'Vui lòng chọn đề tài',
      });
    }

    if (!title) {
      return res.status(400).json({
        message: 'Vui lòng nhập tên báo cáo cuối kỳ',
      });
    }

    const approvedProject = await findApprovedStudentProject(req.user.id, projectId);

    if (!approvedProject) {
      return res.status(403).json({
        message: 'Bạn chỉ được nộp báo cáo cuối kỳ cho đề tài đã được duyệt',
      });
    }

    const existedSubmission = await findFinalSubmissionByProjectStudent(
      projectId,
      req.user.id
    );

    if (existedSubmission) {
      return res.status(409).json({
        message: 'Bạn đã nộp báo cáo cuối kỳ cho đề tài này rồi',
        data: existedSubmission,
      });
    }

    const submission = await createFinalSubmission({
      projectId,
      studentId: req.user.id,
      title,
      description,
      reportFileUrl,
      githubUrl,
      demoUrl,
    });

    return res.status(201).json({
      message: 'Nộp báo cáo cuối kỳ thành công',
      data: submission,
    });
  } catch (error) {
    console.error('Lỗi nộp báo cáo cuối kỳ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi nộp báo cáo cuối kỳ',
    });
  }
}

export async function getMyFinalSubmissionDetail(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id báo cáo không hợp lệ',
      });
    }

    const submission = await findFinalSubmissionById(id);

    if (!submission || submission.DeletedAt || submission.StudentId !== req.user.id) {
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

export async function updateMyFinalSubmission(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id báo cáo không hợp lệ',
      });
    }

    const currentSubmission = await findFinalSubmissionById(id);

    if (
      !currentSubmission ||
      currentSubmission.DeletedAt ||
      currentSubmission.StudentId !== req.user.id
    ) {
      return res.status(404).json({
        message: 'Không tìm thấy báo cáo cuối kỳ',
      });
    }

    if (currentSubmission.Status === 'Reviewed') {
      return res.status(400).json({
        message: 'Không thể sửa báo cáo đã được giảng viên chấm',
      });
    }

    const title = normalizeString(req.body.title) || currentSubmission.Title;

    const description =
      req.body.description !== undefined
        ? normalizeString(req.body.description)
        : currentSubmission.Description;

    const reportFileUrl =
      req.body.reportFileUrl !== undefined
        ? normalizeString(req.body.reportFileUrl)
        : currentSubmission.ReportFileUrl;

    const githubUrl =
      req.body.githubUrl !== undefined
        ? normalizeString(req.body.githubUrl)
        : currentSubmission.GithubUrl;

    const demoUrl =
      req.body.demoUrl !== undefined
        ? normalizeString(req.body.demoUrl)
        : currentSubmission.DemoUrl;

    const updated = await updateFinalSubmission(id, req.user.id, {
      title,
      description,
      reportFileUrl,
      githubUrl,
      demoUrl,
    });

    return res.json({
      message: 'Cập nhật báo cáo cuối kỳ thành công',
      data: updated,
    });
  } catch (error) {
    console.error('Lỗi cập nhật báo cáo cuối kỳ:', error);

    return res.status(500).json({
      message: 'Lỗi server khi cập nhật báo cáo cuối kỳ',
    });
  }
}