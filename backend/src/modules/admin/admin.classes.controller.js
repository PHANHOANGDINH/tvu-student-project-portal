// src/modules/admin/admin.classes.controller.js
import {
  getClasses,
  countClasses,
  findClassById,
  findClassByCode,
  findTeacherById,
  createClass,
  updateClass,
  setClassActive,
  softDeleteClass,
  findStudentById,
  findActiveStudentClass,
  addStudentToClass,
  getClassStudents,
  countClassStudents,
  removeStudentFromClass,
} from './admin.classes.model.js';

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

export async function getAdminClasses(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const filters = {
      page,
      limit,
      search: normalizeString(req.query.search),
      status: normalizeString(req.query.status) || 'not-deleted',
      advisorTeacherId: normalizeNullableNumber(req.query.advisorTeacherId),
    };

    const [classes, total] = await Promise.all([
      getClasses(filters),
      countClasses(filters),
    ]);

    return res.json({
      data: classes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách lớp',
    });
  }
}

export async function getAdminClassDetail(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id lớp học không hợp lệ',
      });
    }

    const classItem = await findClassById(id);

    if (!classItem) {
      return res.status(404).json({
        message: 'Không tìm thấy lớp học',
      });
    }

    return res.json({
      data: classItem,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết lớp',
    });
  }
}

export async function createAdminClass(req, res) {
  try {
    const classCode = normalizeString(req.body.classCode).toUpperCase();
    const className = normalizeString(req.body.className);
    const department = normalizeString(req.body.department);
    const academicYear = normalizeString(req.body.academicYear);
    const advisorTeacherId = normalizeNullableNumber(req.body.advisorTeacherId);

    if (!classCode || !className) {
      return res.status(400).json({
        message: 'Vui lòng nhập mã lớp và tên lớp',
      });
    }

    const existedClass = await findClassByCode(classCode);

    if (existedClass) {
      return res.status(409).json({
        message: 'Mã lớp đã tồn tại trong hệ thống',
      });
    }

    if (advisorTeacherId) {
      const teacher = await findTeacherById(advisorTeacherId);

      if (!teacher) {
        return res.status(400).json({
          message: 'Giảng viên cố vấn không hợp lệ hoặc đã bị khóa',
        });
      }
    }

    const newClass = await createClass({
      classCode,
      className,
      department,
      academicYear,
      advisorTeacherId,
    });

    return res.status(201).json({
      message: 'Tạo lớp học thành công',
      data: newClass,
    });
  } catch (error) {
    console.error('Lỗi tạo lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi tạo lớp học',
    });
  }
}

export async function updateAdminClass(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id lớp học không hợp lệ',
      });
    }

    const currentClass = await findClassById(id);

    if (!currentClass || currentClass.DeletedAt) {
      return res.status(404).json({
        message: 'Không tìm thấy lớp học',
      });
    }

    const classCode = normalizeString(req.body.classCode).toUpperCase() || currentClass.ClassCode;
    const className = normalizeString(req.body.className) || currentClass.ClassName;

    const department =
      req.body.department !== undefined
        ? normalizeString(req.body.department)
        : currentClass.Department;

    const academicYear =
      req.body.academicYear !== undefined
        ? normalizeString(req.body.academicYear)
        : currentClass.AcademicYear;

    const advisorTeacherId =
      req.body.advisorTeacherId !== undefined
        ? normalizeNullableNumber(req.body.advisorTeacherId)
        : currentClass.AdvisorTeacherId;

    const existedClass = await findClassByCode(classCode);

    if (existedClass && existedClass.Id !== id) {
      return res.status(409).json({
        message: 'Mã lớp đã được sử dụng bởi lớp khác',
      });
    }

    if (advisorTeacherId) {
      const teacher = await findTeacherById(advisorTeacherId);

      if (!teacher) {
        return res.status(400).json({
          message: 'Giảng viên cố vấn không hợp lệ hoặc đã bị khóa',
        });
      }
    }

    const updatedClass = await updateClass(id, {
      classCode,
      className,
      department,
      academicYear,
      advisorTeacherId,
    });

    return res.json({
      message: 'Cập nhật lớp học thành công',
      data: updatedClass,
    });
  } catch (error) {
    console.error('Lỗi cập nhật lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi cập nhật lớp học',
    });
  }
}

export async function lockAdminClass(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id lớp học không hợp lệ',
      });
    }

    const classItem = await setClassActive(id, false);

    if (!classItem) {
      return res.status(404).json({
        message: 'Không tìm thấy lớp học',
      });
    }

    return res.json({
      message: 'Khóa lớp học thành công',
      data: classItem,
    });
  } catch (error) {
    console.error('Lỗi khóa lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi khóa lớp học',
    });
  }
}

export async function unlockAdminClass(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id lớp học không hợp lệ',
      });
    }

    const classItem = await setClassActive(id, true);

    if (!classItem) {
      return res.status(404).json({
        message: 'Không tìm thấy lớp học',
      });
    }

    return res.json({
      message: 'Mở khóa lớp học thành công',
      data: classItem,
    });
  } catch (error) {
    console.error('Lỗi mở khóa lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi mở khóa lớp học',
    });
  }
}

export async function deleteAdminClass(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Id lớp học không hợp lệ',
      });
    }

    const classItem = await softDeleteClass(id);

    if (!classItem) {
      return res.status(404).json({
        message: 'Không tìm thấy lớp học',
      });
    }

    return res.json({
      message: 'Xóa lớp học thành công',
      data: classItem,
    });
  } catch (error) {
    console.error('Lỗi xóa lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi xóa lớp học',
    });
  }
}

export async function getAdminClassStudents(req, res) {
  try {
    const classId = Number(req.params.id);

    if (!classId) {
      return res.status(400).json({
        message: 'Id lớp học không hợp lệ',
      });
    }

    const classItem = await findClassById(classId);

    if (!classItem || classItem.DeletedAt) {
      return res.status(404).json({
        message: 'Không tìm thấy lớp học',
      });
    }

    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const filters = {
      page,
      limit,
      search: normalizeString(req.query.search),
    };

    const [students, total] = await Promise.all([
      getClassStudents(classId, filters),
      countClassStudents(classId, filters),
    ]);

    return res.json({
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy sinh viên trong lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách sinh viên trong lớp',
    });
  }
}

export async function addAdminClassStudent(req, res) {
  try {
    const classId = Number(req.params.id);
    const studentId = Number(req.body.studentId);

    if (!classId) {
      return res.status(400).json({
        message: 'Id lớp học không hợp lệ',
      });
    }

    if (!studentId) {
      return res.status(400).json({
        message: 'Vui lòng chọn sinh viên',
      });
    }

    const classItem = await findClassById(classId);

    if (!classItem || classItem.DeletedAt) {
      return res.status(404).json({
        message: 'Không tìm thấy lớp học',
      });
    }

    if (!classItem.IsActive) {
      return res.status(400).json({
        message: 'Không thể thêm sinh viên vào lớp đã bị khóa',
      });
    }

    const student = await findStudentById(studentId);

    if (!student) {
      return res.status(400).json({
        message: 'Sinh viên không hợp lệ hoặc đã bị khóa',
      });
    }

    const activeClass = await findActiveStudentClass(studentId);

    if (activeClass) {
      return res.status(409).json({
        message: `Sinh viên này đã thuộc lớp ${activeClass.ClassCode}`,
        currentClass: activeClass,
      });
    }

    const member = await addStudentToClass(classId, studentId);

    return res.status(201).json({
      message: 'Thêm sinh viên vào lớp thành công',
      data: member,
    });
  } catch (error) {
    console.error('Lỗi thêm sinh viên vào lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi thêm sinh viên vào lớp',
    });
  }
}

export async function removeAdminClassStudent(req, res) {
  try {
    const classId = Number(req.params.id);
    const studentId = Number(req.params.studentId);

    if (!classId || !studentId) {
      return res.status(400).json({
        message: 'Id lớp học hoặc Id sinh viên không hợp lệ',
      });
    }

    const member = await removeStudentFromClass(classId, studentId);

    if (!member) {
      return res.status(404).json({
        message: 'Không tìm thấy sinh viên trong lớp này',
      });
    }

    return res.json({
      message: 'Xóa sinh viên khỏi lớp thành công',
      data: member,
    });
  } catch (error) {
    console.error('Lỗi xóa sinh viên khỏi lớp:', error);

    return res.status(500).json({
      message: 'Lỗi server khi xóa sinh viên khỏi lớp',
    });
  }
}