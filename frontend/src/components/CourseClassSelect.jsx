/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { listLecturerCourseClasses, listStudentCourseClasses } from '../api/academicsApi'

export default function CourseClassSelect({ role, value, onChange, label = 'Lớp học phần' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = role === 'LECTURER' ? listLecturerCourseClasses : listStudentCourseClasses
    load({ pageSize: 100 })
      .then(response => {
        const rows = response.data?.items || response.data || []
        setItems(rows)
        if (!value && rows.length) onChange(String(rows[0].id))
      })
      .catch(() => setError('Không thể tải danh sách lớp học phần.'))
      .finally(() => setLoading(false))
  }, [role])

  return <label className="course-class-select">
    <span>{label}</span>
    <select value={value} onChange={event => onChange(event.target.value)} disabled={loading}>
      <option value="">{loading ? 'Đang tải lớp...' : 'Chọn lớp học phần'}</option>
      {items.map(item => <option key={item.id} value={item.id}>
        {item.code || item.classCode} — {item.subjectName || item.name || 'Lớp học phần'}
      </option>)}
    </select>
    {error && <small className="field-error">{error}</small>}
  </label>
}
