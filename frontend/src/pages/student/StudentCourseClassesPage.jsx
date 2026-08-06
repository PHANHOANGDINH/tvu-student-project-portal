import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStudentCourseClass, listStudentCourseClasses } from '../../api/academicsApi'
import ClassWorkspace from '../../components/common/ClassWorkspace'
import CourseCard from '../../components/common/CourseCard'
import CourseFilters from '../../components/common/CourseFilters'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/UiState'

const initial = { search: '', academicYearId: '', semesterId: '', subjectId: '', status: '', academicYears: [], semesters: [], subjects: [] }
const unique = (items, id, name, code) => [...new Map(items.filter(item => item[id]).map(item => [item[id], { id: item[id], name: item[name], code: item[code] }])).values()]
const paramsOf = ({ search, academicYearId, semesterId, subjectId, status }) => ({ search, academicYearId, semesterId, subjectId, status })

export default function StudentCourseClassesPage() {
  const { id } = useParams()
  const [items, setItems] = useState([])
  const [detail, setDetail] = useState(null)
  const [filters, setFilters] = useState(initial)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => {
    try {
      setLoading(true); setError('')
      if (id) setDetail((await getStudentCourseClass(id)).data)
      else { const response = await listStudentCourseClasses({ ...paramsOf(filters), page, pageSize: 100 }); const rows=response.data.items || []; setItems(rows); setPages(response.data.totalPages || 1); setFilters(current => ({ ...current, academicYears: current.academicYears.length ? current.academicYears : unique(rows,'academicYearId','academicYearName'), semesters: current.semesters.length ? current.semesters : unique(rows,'semesterId','semesterName'), subjects: current.subjects.length ? current.subjects : unique(rows,'subjectId','subjectName','subjectCode') })) }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id, page])
  if (loading) return <div className="panel"><LoadingState label="Đang tải lớp học phần..." /></div>
  if (error) return <div className="panel"><ErrorState message={error} onRetry={load} /></div>
  if (id) return <ClassWorkspace course={detail} role="student" />
  return <div>
    <PageHeader eyebrow="Không gian học tập" title="Lớp học phần của tôi" description="Truy cập các lớp học phần được phân quyền theo tài khoản sinh viên." />
    <CourseFilters filters={filters} onChange={setFilters} onSubmit={event => { event.preventDefault(); page === 1 ? load() : setPage(1) }} showSubject={false} />
    {items.length ? <div className="course-grid">{items.map((course, index) => <CourseCard key={course.id} course={course} index={index} to={`/student/course-classes/${course.id}`} />)}</div> : <div className="panel"><EmptyState title="Chưa có lớp học phần" description="Bạn chưa được xếp vào lớp học phần nào trong học kỳ hiện tại." /></div>}
    <div className="pagination-bar"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page}/{pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau</button></div>
  </div>
}
