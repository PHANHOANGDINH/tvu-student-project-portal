export const mockUsers = [
  {
    id: 1,
    fullName: 'Nguyễn Văn Admin',
    email: 'admin@tvu.edu.vn',
    role: 'Admin',
    className: '',
    status: 'Hoạt động'
  },
  {
    id: 2,
    fullName: 'Trần Thị Giảng Viên',
    email: 'teacher@tvu.edu.vn',
    role: 'Teacher',
    className: 'Khoa CNTT',
    status: 'Hoạt động'
  },
  {
    id: 3,
    fullName: 'Lâm Tấn Hưng',
    email: 'student@st.tvu.edu.vn',
    role: 'Student',
    className: 'DA22TTB',
    status: 'Hoạt động'
  }
]

export const mockClasses = [
  {
    id: 1,
    className: 'DA22TTB',
    major: 'Công nghệ thông tin',
    totalStudents: 42,
    advisor: 'Trần Thị Giảng Viên'
  },
  {
    id: 2,
    className: 'DA23TTA',
    major: 'Kỹ thuật phần mềm',
    totalStudents: 38,
    advisor: 'Nguyễn Văn A'
  }
]

export const mockProjects = [
  {
    id: 1,
    title: 'Xây dựng cổng quản lý dự án sinh viên',
    description: 'Hệ thống hỗ trợ sinh viên đăng ký đề tài, nộp tiến độ và nộp sản phẩm cuối kỳ.',
    teacher: 'Trần Thị Giảng Viên',
    students: 'Lâm Tấn Hưng, Võ Quốc Thắng',
    className: 'DA22TTB',
    status: 'Đang thực hiện',
    semester: 'HK1 2026'
  },
  {
    id: 2,
    title: 'Ứng dụng quản lý cửa hàng điện thoại',
    description: 'Quản lý sản phẩm, hóa đơn, khách hàng và thống kê doanh thu.',
    teacher: 'Nguyễn Văn A',
    students: 'Chưa có nhóm',
    className: 'DA23TTA',
    status: 'Chờ đăng ký',
    semester: 'HK1 2026'
  }
]

export const mockProgress = [
  {
    id: 1,
    projectTitle: 'Xây dựng cổng quản lý dự án sinh viên',
    week: 'Tuần 1',
    content: 'Hoàn thành phân tích yêu cầu và thiết kế database.',
    fileName: 'bao-cao-tuan-1.pdf',
    status: 'Đã duyệt',
    comment: 'Làm tốt, tiếp tục hoàn thiện chức năng auth.'
  },
  {
    id: 2,
    projectTitle: 'Xây dựng cổng quản lý dự án sinh viên',
    week: 'Tuần 2',
    content: 'Hoàn thành backend 6 sprint.',
    fileName: 'bao-cao-tuan-2.pdf',
    status: 'Chờ duyệt',
    comment: ''
  }
]

export const mockSubmissions = [
  {
    id: 1,
    projectTitle: 'Xây dựng cổng quản lý dự án sinh viên',
    studentGroup: 'Lâm Tấn Hưng, Võ Quốc Thắng',
    reportFile: 'bao-cao-cuoi-ky.docx',
    sourceCodeUrl: 'https://github.com/example/project',
    status: 'Chờ chấm',
    score: ''
  }
]