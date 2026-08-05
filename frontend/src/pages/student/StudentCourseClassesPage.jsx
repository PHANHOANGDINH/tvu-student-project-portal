import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Search } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getStudentCourseClass, listStudentCourseClasses } from '../../api/academicsApi'
import CourseCard from '../../components/common/CourseCard'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../components/common/UiState'

export default function StudentCourseClassesPage() {
  const { id } = useParams()
  const [items, setItems] = useState([])
  const [detail, setDetail] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => {
    try {
      setLoading(true); setError('')
      if (id) setDetail((await getStudentCourseClass(id)).data)
      else { const response = await listStudentCourseClasses({ page, pageSize: 10, search }); setItems(response.data.items || []); setPages(response.data.totalPages || 1) }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id, page])
  if (loading) return <div className="panel"><LoadingState label="Đang tải lớp học phần..." /></div>
  if (error) return <div className="panel"><ErrorState message={error} onRetry={load} /></div>
  if (id) return <CourseDetail detail={detail} />
  return <div>
    <PageHeader eyebrow="Không gian học tập" title="Lớp học phần của tôi" description="Truy cập các lớp học phần được phân quyền theo tài khoản sinh viên." />
    <form className="course-toolbar" onSubmit={event => { event.preventDefault(); page === 1 ? load() : setPage(1) }}><label><Search size={18} /><input aria-label="Tìm lớp học phần" placeholder="Tìm theo mã lớp hoặc tên môn học..." value={search} onChange={event => setSearch(event.target.value)} /></label><button className="btn-primary small">Tìm kiếm</button></form>
    {items.length ? <div className="course-grid">{items.map((course, index) => <CourseCard key={course.id} course={course} index={index} to={`/student/course-classes/${course.id}`} />)}</div> : <div className="panel"><EmptyState title="Chưa có lớp học phần" description="Bạn chưa được xếp vào lớp học phần nào trong học kỳ hiện tại." /></div>}
    <div className="pagination-bar"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page}/{pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau</button></div>
  </div>
}

function CourseDetail({ detail }) {
  return <div><Link className="back-link" to="/student/course-classes"><ArrowLeft size={17} /> Danh sách lớp học phần</Link><section className="course-detail-hero"><div><span className="eyebrow">{detail.subjectCode || 'HỌC PHẦN'}</span><h2>{detail.code} — {detail.subjectName}</h2><p>Thông tin lớp học phần sinh viên đang tham gia.</p></div><StatusBadge status={detail.status} /></section><div className="panel info-list course-detail-list"><div><span>Môn học</span><strong>{detail.subjectCode} — {detail.subjectName}</strong></div><div><span>Số tín chỉ</span><strong>{detail.credits}</strong></div><div><span>Học kỳ</span><strong>{detail.semesterName} ({detail.semesterCode})</strong></div><div><span>Năm học</span><strong>{detail.academicYearName}</strong></div><div><span>Giảng viên</span><strong>{detail.lecturerName || 'Chưa phân công'}</strong></div><div><span>Trạng thái</span><StatusBadge status={detail.status} /></div></div><div className="course-detail-note"><BookOpen size={20} /><div><strong>Không gian lớp học phần</strong><p>Các chức năng nhóm, đề tài và nộp bài được truy cập từ menu điều hướng theo quyền của bạn.</p></div></div></div>
}
