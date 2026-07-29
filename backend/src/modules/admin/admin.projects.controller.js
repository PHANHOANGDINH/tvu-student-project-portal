// src/modules/admin/admin.projects.controller.js
import {
  getProjects,
  countProjects,
  findProjectById,
  updateProjectStatus,
  softDeleteProject,
  PROJECT_STATUSES,
} from '../project/project.model.js';

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export async function getAdminProjects(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const filters = {
      page,
      limit,
      search: normalizeString(req.query.search),
      status: normalizeString(req.query.status) || null,
      teacherId: req.query.teacherId ? Number(req.query.teacherId) : null,
      classId: req.query.classId ? Number(req.query.classId) : null,
      onlyActive: false,
    };

    if (filters.status && !PROJECT_STATUSES.includes(filters.status)) {
      return res.status(400).json({
        message: 'Trạng thái đề tài không hợp lệ',
      });
    }

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
    console.error('Lỗi lấy danh sách đề tài admin:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách đề tài',
    });
  }
}

export async function getAdminProjectDetail(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    const project = await findProjectById(id);

    if (!project) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài',
      });
    }

    return res.json({
      data: project,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đề tài admin:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết đề tài',
    });
  }
}

export async function updateAdminProjectStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const status = normalizeString(req.body.status);
    const rejectReason = normalizeString(req.body.rejectReason);

    if (!id) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    if (!PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Trạng thái đề tài không hợp lệ',
      });
    }

    if (status === 'Rejected' && !rejectReason) {
      return res.status(400).json({
        message: 'Vui lòng nhập lý do từ chối đề tài',
      });
    }

    const project = await findProjectById(id);

    if (!project || project.DeletedAt) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài',
      });
    }

    const updatedProject = await updateProjectStatus(
      id,
      status,
      status === 'Rejected' ? rejectReason : null
    );

    return res.json({
      message: 'Cập nhật trạng thái đề tài thành công',
      data: updatedProject,
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đề tài:', error);

    return res.status(500).json({
      message: 'Lỗi server khi cập nhật trạng thái đề tài',
    });
  }
}

export async function deleteAdminProject(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id đề tài không hợp lệ',
      });
    }

    const project = await findProjectById(id);

    if (!project || project.DeletedAt) {
      return res.status(404).json({
        message: 'Không tìm thấy đề tài',
      });
    }

    const deletedProject = await softDeleteProject(id);

    return res.json({
      message: 'Xóa đề tài thành công',
      data: deletedProject,
    });
  } catch (error) {
    console.error('Lỗi xóa đề tài admin:', error);

    return res.status(500).json({
      message: 'Lỗi server khi xóa đề tài',
    });
  }
}