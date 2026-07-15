import { useEffect, useState } from 'react'
import { academicYearsApi, semestersApi } from '../api/academicApi'

const emptyForm = { academicYearId: '', name: '', code: '', startDate: '', endDate: '' }
const toDate = (value) => (value ? String(value).slice(0, 10) : '')

function SemestersPage() {
  const [items, setItems] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', academicYearId: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [semesterRes, yearRes] = await Promise.all([
        semestersApi.list({ ...filters, pageSize: 100 }),
        academicYearsApi.list({ pageSize: 100, status: 'ACTIVE' })
      ])
      setItems(semesterRes.data?.items || [])
      setAcademicYears(yearRes.data?.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function edit(item) {
    setEditing(item)
    setForm({
      academicYearId: item.academicYearId || '',
      name: item.name || '',
      code: item.code || '',
      startDate: toDate(item.startDate),
      endDate: toDate(item.endDate)
    })
  }

  function reset() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      if (editing) {
        await semestersApi.update(editing.id, form)
        setMessage('Đã cập nhật học kỳ')
      } else {
        await semestersApi.create(form)
        setMessage('Đã tạo học kỳ')
      }
      reset()
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleStatus(item) {
    try {
      await semestersApi.status(item.id, !item.isActive)
      setMessage('Đã cập nhật trạng thái')
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <h2 className="page-title">Học kỳ</h2>
      <p className="page-subtitle">Tạo và quản lý học kỳ theo từng năm học.</p>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <div className="form-group">
            <label>Năm học</label>
            <select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
              <option value="">Chọn năm học</option>
              {academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tên học kỳ</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Học kỳ 1" />
          </div>
          <div className="form-group">
            <label>Mã học kỳ</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="HK1-2026" />
          </div>
          <div className="form-group">
            <label>Ngày bắt đầu</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Ngày kết thúc</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
            {editing && <button className="btn-light" type="button" onClick={reset}>Hủy</button>}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="filter-grid">
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Tìm học kỳ" />
          <select value={filters.academicYearId} onChange={(e) => setFilters({ ...filters, academicYearId: e.target.value })}>
            <option value="">Tất cả năm học</option>
            {academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang dùng</option>
            <option value="INACTIVE">Tạm khóa</option>
          </select>
          <button className="btn-light" type="button" onClick={loadData}>Lọc</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Mã</th><th>Tên</th><th>Năm học</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.academicYearName}</td>
                  <td>{toDate(item.startDate)} - {toDate(item.endDate)}</td>
                  <td><span className={`badge ${item.isActive ? 'green' : ''}`}>{item.isActive ? 'Đang dùng' : 'Tạm khóa'}</span></td>
                  <td className="card-actions">
                    <button className="btn-light" type="button" onClick={() => edit(item)}>Sửa</button>
                    <button className="btn-light" type="button" onClick={() => toggleStatus(item)}>{item.isActive ? 'Khóa' : 'Mở'}</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan="6">{loading ? 'Đang tải...' : 'Chưa có học kỳ'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default SemestersPage
