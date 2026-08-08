import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Collapse, Descriptions, Empty, Progress, Select, Space } from 'antd'
import { EyeOutlined, FileDoneOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { studentSubmissionWorkflow } from '../../api/submissionsApi'
import { ErrorState, LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi, statusLabel } from '../../utils/formatters'
import './student-workflow.css'

const completedStatuses = new Set(['GRADED', 'COMPLETED'])

function canSubmit(item) {
  if (!item.requirementId || item.requirementStatus !== 'OPEN' || !item.groupId) return false
  const now = Date.now()
  const started = now >= new Date(item.startAt).getTime()
  const beforeDeadline = now <= new Date(item.dueAt).getTime()
  const attemptsRemain = Number(item.attemptNumber || 0) < Number(item.maxAttempts || 1)
  const resubmissionAllowed = !item.attemptNumber || item.allowResubmission
  return started && (beforeDeadline || item.allowLate) && attemptsRemain && resubmissionAllowed
}

export default function StudentReportsPage({ type }) {
  const isFinal = type === 'final'
  const workflowType = isFinal ? 'FINAL' : 'PROGRESS'
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      setLoading(true)
      setError('')
      const response = await studentSubmissionWorkflow(workflowType)
      setItems(response.data || [])
    } catch {
      setError('Không tải được dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [workflowType])

  const courses = useMemo(() => {
    const map = new Map()
    items.forEach(item => {
      if (!map.has(item.courseClassId)) map.set(item.courseClassId, { ...item, requirements: [] })
      if (item.requirementId) map.get(item.courseClassId).requirements.push(item)
    })
    return [...map.values()]
  }, [items])

  const visibleCourses = courses.filter(course => !classId || course.courseClassId === classId).map(course => ({
    ...course,
    requirements: course.requirements.filter(item => !status || (item.submissionStatus || 'NOT_SUBMITTED') === status)
  })).filter(course => !status || course.requirements.length)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  const title = isFinal ? 'Bài nộp cuối kỳ và điểm' : 'Báo cáo tiến độ'
  const description = isFinal ? 'Quản lý sản phẩm cuối kỳ, báo cáo, liên kết đồ án và kết quả đánh giá.' : 'Theo dõi các mốc tiến độ, bài đã nộp và phản hồi của giảng viên.'

  return <div className="student-workflow">
    <div className="page-title row-between"><div><h2>{title}</h2><p>{description}</p></div><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/student/submission-requirements')}>{isFinal ? 'Nộp bài cuối kỳ' : 'Nộp báo cáo mới'}</Button></div>
    <div className="workflow-filters"><Select allowClear placeholder="Tất cả lớp học phần" value={classId || undefined} onChange={value => setClassId(value || '')} options={courses.map(course => ({ value: course.courseClassId, label: `${course.courseClassCode} — ${course.courseName}` }))} /><Select allowClear placeholder="Tất cả trạng thái" value={status || undefined} onChange={value => setStatus(value || '')} options={['NOT_SUBMITTED', 'SUBMITTED', 'LATE', 'RESUBMITTED', 'UNDER_REVIEW', 'REQUIRES_REVISION', 'GRADED'].map(value => ({ value, label: statusLabel(value) }))} /></div>
    {!visibleCourses.length ? <Empty description={isFinal ? 'Khi giảng viên mở yêu cầu nộp bài cuối kỳ, bạn có thể gửi sản phẩm tại đây.' : 'Bạn chưa có mốc báo cáo tiến độ trong các lớp học phần.'} /> : <Collapse defaultActiveKey={visibleCourses.map(course => String(course.courseClassId))} items={visibleCourses.map(course => {
      const completed = course.requirements.filter(item => completedStatuses.has(item.submissionStatus)).length
      const percent = course.requirements.length ? Math.round(completed * 100 / course.requirements.length) : 0
      return { key: String(course.courseClassId), label: <div className="course-collapse-header"><div><strong>{course.courseClassCode} — {course.courseName}</strong><span>GV: {course.lecturerName} · Nhóm: {course.groupName || 'Chưa có nhóm'} · Đề tài: {course.topicTitle || 'Chưa có đề tài'}</span></div><div><span>{completed}/{course.requirements.length} mốc hoàn thành</span><Progress percent={percent} showInfo={false} size="small" /></div></div>, children: course.requirements.length ? <div className="requirement-grid">{course.requirements.map(item => {
        const itemStatus = item.submissionStatus || 'NOT_SUBMITTED'
        return <Card key={item.requirementId} title={item.title} extra={<StatusBadge status={itemStatus} />}>
          <p>{item.description || 'Không có mô tả.'}</p>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[{ key: 'deadline', label: 'Hạn nộp', children: formatDateTimeVi(item.dueAt) }, { key: 'attempt', label: 'Lần nộp gần nhất', children: item.attemptNumber ? `#${item.attemptNumber}` : 'Chưa nộp' }, { key: 'submitted', label: 'Nộp lúc', children: formatDateTimeVi(item.submittedAt) }, { key: 'score', label: 'Điểm', children: item.score == null ? 'Chưa công bố' : `${item.score}/${item.maxScore || 10}` }]} />
          <Space wrap>{!isFinal && <Button onClick={() => navigate(`/student/progress/${item.requirementId}`)}>Xem chi tiết</Button>}<Button icon={<EyeOutlined />} disabled={!item.submissionId} onClick={() => navigate(isFinal ? `/student/final-submissions/${item.submissionId}` : `/student/progress/${item.submissionId}/submission`)}>{isFinal ? 'Xem bài nộp' : 'Xem bài đã nộp'}</Button>{isFinal && <Button disabled={!item.submissionId} onClick={() => navigate(`/student/final-submissions/${item.submissionId}`)}>Xem lịch sử</Button>}<Button icon={<FileDoneOutlined />} disabled={!item.submissionId || (!item.feedback && item.score == null)} onClick={() => navigate(isFinal ? `/student/final-submissions/${item.submissionId}/evaluation` : `/student/progress/${item.submissionId}/evaluation`)}>Xem đánh giá</Button>{canSubmit(item) && <Button type="primary" onClick={() => navigate(`/student/submission-requirements/${item.requirementId}/submit`)}>{item.attemptNumber ? 'Nộp lại' : 'Nộp báo cáo'}</Button>}</Space>
        </Card>
      })}</div> : <Empty description={isFinal ? 'Chưa có yêu cầu bài cuối kỳ.' : 'Chưa có yêu cầu tiến độ.'} /> }
    })} />}
  </div>
}
