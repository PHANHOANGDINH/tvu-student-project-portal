import { Search } from 'lucide-react'

export default function CourseFilters({ filters, onChange, onSubmit, showSubject = true }) {
  const update = event => onChange({ ...filters, [event.target.name]: event.target.value })
  return <form className="course-filters" onSubmit={onSubmit}>
    <label className="course-search"><Search size={18} /><input name="search" aria-label="Tìm lớp học phần" placeholder="Tìm theo mã lớp hoặc tên môn học..." value={filters.search} onChange={update} /></label>
    <select name="academicYearId" aria-label="Lọc theo năm học" value={filters.academicYearId} onChange={update}><option value="">Tất cả năm học</option>{filters.academicYears?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <select name="semesterId" aria-label="Lọc theo học kỳ" value={filters.semesterId} onChange={update}><option value="">Tất cả học kỳ</option>{filters.semesters?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    {showSubject && <select name="subjectId" aria-label="Lọc theo môn học" value={filters.subjectId} onChange={update}><option value="">Tất cả môn học</option>{filters.subjects?.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select>}
    <select name="status" aria-label="Lọc theo trạng thái" value={filters.status} onChange={update}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="COMPLETED">Đã hoàn thành</option><option value="INACTIVE">Tạm ngưng</option></select>
    <button className="btn-primary small">Áp dụng</button>
  </form>
}
