import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLecturerCourseClass, listLecturerCourseClasses } from '../../api/academicsApi'
import ClassWorkspace from '../../components/common/ClassWorkspace'
import CourseCard from '../../components/common/CourseCard'
import CourseFilters from '../../components/common/CourseFilters'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/UiState'

const initial = { search: '', academicYearId: '', semesterId: '', subjectId: '', status: '', academicYears: [], semesters: [], subjects: [] }
const unique = (items, id, name, code) => [...new Map(items.filter(item => item[id]).map(item => [item[id], { id: item[id], name: item[name], code: item[code] }])).values()]
const paramsOf = ({ search, academicYearId, semesterId, subjectId, status }) => ({ search, academicYearId, semesterId, subjectId, status })

export default function LecturerCourseClassesPage() {
  const { id } = useParams(); const [items, setItems] = useState([]); const [detail, setDetail] = useState(null); const [filters, setFilters] = useState(initial); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const load = async params => { try { setLoading(true); setError(''); if (id) setDetail((await getLecturerCourseClass(id)).data); else { const response = await listLecturerCourseClasses({ ...paramsOf(params), pageSize: 100 }); const rows = response.data.items || []; setItems(rows); setFilters(current => ({ ...current, academicYears: current.academicYears.length ? current.academicYears : unique(rows, 'academicYearId', 'academicYearName'), semesters: current.semesters.length ? current.semesters : unique(rows, 'semesterId', 'semesterName'), subjects: current.subjects.length ? current.subjects : unique(rows, 'subjectId', 'subjectName', 'subjectCode') })) } } catch (err) { setError(err.message) } finally { setLoading(false) } }
  useEffect(() => { load({}) }, [id])
  if (loading) return <div className="panel"><LoadingState label="Đang tải lớp phụ trách..." /></div>
  if (error) return <div className="panel"><ErrorState message={error} onRetry={() => load(filters)} /></div>
  if (id) return <ClassWorkspace course={detail} role="lecturer" />
  return <div><PageHeader eyebrow="Không gian giảng viên" title="Lớp học phần phụ trách" description="Mỗi lớp là một không gian dự án độc lập theo đúng mã lớp học phần." /><CourseFilters filters={filters} onChange={setFilters} onSubmit={event => { event.preventDefault(); load(filters) }} />{items.length ? <div className="course-grid">{items.map((course, index) => <CourseCard role="lecturer" key={course.id} course={course} index={index} to={`/lecturer/course-classes/${course.id}`} />)}</div> : <div className="panel"><EmptyState title="Không có lớp phù hợp" description="Không tìm thấy lớp học phần nào trong phạm vi được phân công." /></div>}</div>
}
