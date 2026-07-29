// src/modules/teacher/teacher.projects.controller.js
import {
  getProjects,
  countProjects,
  findProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  softDeleteProject,
  findActiveClassById,
  getProjectRegistrations,
  countProjectRegistrations,
  findProjectRegistrationById,
  updateRegistrationStatus,
  countApprovedRegistrations,
} from '../project/project.model.js';

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function normalizePositiveNumber(value, defaultValue = 1) {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : defaultValue;
}

export async function getTeacherProjects(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const filters = {
      page,
      limit,
      search: normalizeString(req.query.search),
      status: normalizeString(req.query.status) || null,
      teacherId: req.user.id,
      onlyActive: false,
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
    console.error('Lỗi lấy đề tài của giảng viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách đề tài',
    });
  }
}

export async function getTeacherProjectDetail(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    const project = await findProjectById(id);

    if (!project || project.DeletedAt || project.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài',
      });
    }

    return res.json({
      data: project,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đề tài giảng viên:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết đề tài',
    });
  }
}

export async function createTeacherProject(req, res) {
  try {
    const title = normalizeString(req.body.title);
    const description = normalizeString(req.body.description);
    const requirements = normalizeString(req.body.requirements);
    const expectedOutcome = normalizeString(req.body.expectedOutcome);
    const classId = normalizeNullableNumber(req.body.classId);
    const maxStudents = normalizePositiveNumber(req.body.maxStudents, 1);

    if (!title) {
      return res.status(400).json({
        message: 'Vui lòng nhập tên đề tài',
      });
    }

    if (classId) {
      const classItem = await findActiveClassById(classId);

      if (!classItem) {
        return res.status(400).json({
          message: 'Lớp học không hợp lệ hoặc đã bị khóa',
        });
      }
    }

    const project = await createProject({
      title,
      description,
      requirements,
      expectedOutcome,
      teacherId: req.user.id,
      classId,
      maxStudents,
      status: 'Pending',
    });

    return res.status(201).json({
      message: 'Tạo đề tài thành công, chờ admin duyệt',
      data: project,
    });
  } catch (error) {
    console.error('Lỗi tạo đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi tạo đề tài',
    });
  }
}

export async function updateTeacherProject(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    const currentProject = await findProjectById(id);

    if (!currentProject || currentProject.DeletedAt || currentProject.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài',
      });
    }

    if (currentProject.Status === 'Closed') {
      return res.status(400).json({
        message: 'Không thể cập nhật đề tài đã đóng',
      });
    }

    const title = normalizeString(req.body.title) || currentProject.Title;
    const description =
      req.body.description !== undefined
        ? normalizeString(req.body.description)
        : currentProject.Description;

    const requirements =
      req.body.requirements !== undefined
        ? normalizeString(req.body.requirements)
        : currentProject.Requirements;

    const expectedOutcome =
      req.body.expectedOutcome !== undefined
        ? normalizeString(req.body.expectedOutcome)
        : currentProject.ExpectedOutcome;

    const classId =
      req.body.classId !== undefined
        ? normalizeNullableNumber(req.body.classId)
        : currentProject.ClassId;

    const maxStudents =
      req.body.maxStudents !== undefined
        ? normalizePositiveNumber(req.body.maxStudents, currentProject.MaxStudents)
        : currentProject.MaxStudents;

    if (classId) {
      const classItem = await findActiveClassById(classId);

      if (!classItem) {
        return res.status(400).json({
          message: 'Lớp học không hợp lệ hoặc đã bị khóa',
        });
      }
    }

    const approvedCount = await countApprovedRegistrations(id);

    if (maxStudents < approvedCount) {
      return res.status(400).json({
        message: `Số lượng tối đa không được nhỏ hơn số sinh viên đã được duyệt hiện tại: ${approvedCount}`,
      });
    }

    const updatedProject = await updateProject(id, {
      title,
      description,
      requirements,
      expectedOutcome,
      classId,
      maxStudents,
    });

    if (currentProject.Status === 'Rejected') {
      await updateProjectStatus(id, 'Pending', null);
    }

    return res.json({
      message:
        currentProject.Status === 'Rejected'
          ? 'Cập nhật đề tài thành công, đề tài đã chuyển về trạng thái chờ duyệt'
          : 'Cập nhật đề tài thành công',
      data: updatedProject,
    });
  } catch (error) {
    console.error('Lỗi cập nhật đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi cập nhật đề tài',
    });
  }
}

export async function deleteTeacherProject(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    const project = await findProjectById(id);

    if (!project || project.DeletedAt || project.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài',
      });
    }

    const approvedCount = await countApprovedRegistrations(id);

    if (approvedCount > 0) {
      return res.status(400).json({
        message: 'Không thể xóa đề tài đã có sinh viên được duyệt',
      });
    }

    const deletedProject = await softDeleteProject(id);

    return res.json({
      message: 'Xóa đề tài thành công',
      data: deletedProject,
    });
  } catch (error) {
    console.error('Lỗi xóa đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi xóa đề tài',
    });
  }
}

export async function getTeacherProjectRegistrations(req, res) {
  try {
    const projectId = Number(req.params.id);

    if (!projectId) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    const project = await findProjectById(projectId);

    if (!project || project.DeletedAt || project.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài',
      });
    }

    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const status = normalizeString(req.query.status) || null;

    const filters = {
      page,
      limit,
      status,
    };

    const [registrations, total] = await Promise.all([
      getProjectRegistrations(projectId, filters),
      countProjectRegistrations(projectId, filters),
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
    console.error('Lỗi lấy danh sách đăng ký đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách đăng ký đề tài',
    });
  }
}

export async function approveTeacherProjectRegistration(req, res) {
  try {
    const registrationId = Number(req.params.registrationId);
    const reviewNote = normalizeString(req.body.reviewNote);

    if (!registrationId) {
      return res.status(400).json({
        message: 'Id đăng ký không hợp lệ',
      });
    }

    const registration = await findProjectRegistrationById(registrationId);

    if (!registration || registration.DeletedAt || registration.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy đăng ký đề tài',
      });
    }

    if (registration.Status !== 'Pending') {
      return res.status(400).json({
        message: 'Chỉ có thể duyệt đăng ký đang chờ xử lý',
      });
    }

    const project = await findProjectById(registration.ProjectId);

    if (!project || project.DeletedAt || project.Status !== 'Approved') {
      return res.status(400).json({
        message: 'Đề tài chưa được admin duyệt hoặc không còn khả dụng',
      });
    }

    const approvedCount = await countApprovedRegistrations(registration.ProjectId);

    if (approvedCount >= project.MaxStudents) {
      return res.status(400).json({
        message: 'Đề tài đã đủ số lượng sinh viên',
      });
    }

    const updated = await updateRegistrationStatus(
      registrationId,
      'Approved',
      reviewNote,
      req.user.id
    );

    return res.json({
      message: 'Duyệt sinh viên đăng ký đề tài thành công',
      data: updated,
    });
  } catch (error) {
    console.error('Lỗi duyệt đăng ký đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi duyệt đăng ký đề tài',
    });
  }
}

export async function rejectTeacherProjectRegistration(req, res) {
  try {
    const registrationId = Number(req.params.registrationId);
    const reviewNote = normalizeString(req.body.reviewNote);

    if (!registrationId) {
      return res.status(400).json({
        message: 'Id đăng ký không hợp lệ',
      });
    }

    const registration = await findProjectRegistrationById(registrationId);

    if (!registration || registration.DeletedAt || registration.TeacherId !== req.user.id) {
      return res.status(404).json({
        message: 'Không tìm thấy đăng ký đề tài',
      });
    }

    if (registration.Status !== 'Pending') {
      return res.status(400).json({
        message: 'Chỉ có thể từ chối đăng ký đang chờ xử lý',
      });
    }

    const updated = await updateRegistrationStatus(
      registrationId,
      'Rejected',
      reviewNote,
      req.user.id
    );

    return res.json({
      message: 'Từ chối đăng ký đề tài thành công',
      data: updated,
    });
  } catch (error) {
    console.error('Lỗi từ chối đăng ký đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi từ chối đăng ký đề tài',
    });
  }
}