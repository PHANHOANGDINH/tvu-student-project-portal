// src/modules/student/student.projects.controller.js
import {
  getProjects,
  countProjects,
  findProjectById,
  findStudentProjectRegistration,
  findStudentActiveProject,
  countApprovedRegistrations,
  createProjectRegistration,
  getStudentRegistrations,
  countStudentRegistrations,
  findProjectRegistrationById,
  cancelRegistration,
} from '../project/project.model.js';

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export async function getStudentAvailableProjects(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const filters = {
      page,
      limit,
      search: normalizeString(req.query.search),
      status: 'Approved',
      onlyActive: true,
    };

    const [projects, total] = await Promise.all([
      getProjects(filters),
      countProjects(filters),
    ]);

    return res.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đề tài cho sinh viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách đề tài',
    });
  }
}

export async function getStudentProjectDetail(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    const project = await findProjectById(id);

    if (
      !project ||
      project.DeletedAt ||
      !project.IsActive ||
      project.Status !== 'Approved'
    ) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài khả dụng',
      });
    }

    const myRegistration = await findStudentProjectRegistration(req.user.id, id);

    return res.json({
      data: {
        ...project,
        myRegistration,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đề tài cho sinh viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết đề tài',
    });
  }
}

export async function registerStudentProject(req, res) {
  try {
    const projectId = Number(req.params.id);
    const note = normalizeString(req.body.note);

    if (!projectId) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    const project = await findProjectById(projectId);

    if (
      !project ||
      project.DeletedAt ||
      !project.IsActive ||
      project.Status !== 'Approved'
    ) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài khả dụng để đăng ký',
      });
    }

    const existedRegistration = await findStudentProjectRegistration(req.user.id, projectId);

    if (existedRegistration) {
      return res.status(409).json({
        message: 'Bạn đã đăng ký đề tài này rồi',
        data: existedRegistration,
      });
    }

    const activeProject = await findStudentActiveProject(req.user.id);

    if (activeProject) {
      return res.status(409).json({
        message: 'Bạn đang có một đề tài chờ duyệt hoặc đã được duyệt',
        currentProject: activeProject,
      });
    }

    const approvedCount = await countApprovedRegistrations(projectId);

    if (approvedCount >= project.MaxStudents) {
      return res.status(400).json({
        message: 'Đề tài đã đủ số lượng sinh viên',
      });
    }

    const registration = await createProjectRegistration({
      projectId,
      studentId: req.user.id,
      note,
    });

    return res.status(201).json({
      message: 'Đăng ký đề tài thành công, chờ giảng viên duyệt',
      data: registration,
    });
  } catch (error) {
    console.error('Lỗi đăng ký đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi đăng ký đề tài',
    });
  }
}

export async function getMyProjectRegistrations(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const status = normalizeString(req.query.status) || null;

    const filters = {
      page,
      limit,
      status,
    };

    const [registrations, total] = await Promise.all([
      getStudentRegistrations(req.user.id, filters),
      countStudentRegistrations(req.user.id, filters),
    ]);

    return res.json({
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy đăng ký đề tài của sinh viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách đăng ký đề tài',
    });
  }
}

export async function cancelMyProjectRegistration(req, res) {
  try {
    const registrationId = Number(req.params.registrationId);

    if (!registrationId) {
      return res.status(400).json({
        message: 'Id đăng ký không hợp lệ',
      });
    }

    const registration = await findProjectRegistrationById(registrationId);

    if (!registration || registration.DeletedAt || registration.StudentId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy đăng ký đề tài',
      });
    }

    if (registration.Status !== 'Pending') {
      return res.status(400).json({
        message: 'Chỉ có thể hủy đăng ký khi đang chờ duyệt',
      });
    }

    const cancelled = await cancelRegistration(registrationId, req.user.id);

    return res.json({
      message: 'Hủy đăng ký đề tài thành công',
      data: cancelled,
    });
  } catch (error) {
    console.error('Lỗi hủy đăng ký đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi hủy đăng ký đề tài',
    });
  }
}