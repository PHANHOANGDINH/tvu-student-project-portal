import { useEffect, useState } from 'react'
import { academicYearsApi } from '../api/academicApi'

const emptyForm = { name: '', startDate: '', endDate: '' }

function toInputDate(value) {
  return value ? String(value).slice(0, 10) : ''
}

function AcademicYearsPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const response = await academicYearsApi.list({ search, status, pageSize: 100 })
      setItems(response.data?.items || [])
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
    setForm({ name: item.name || '', startDate: toInputDate(item.startDate), endDate: toInputDate(item.endDate) })
    setMessage('')
    setError('')
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
        await academicYearsApi.update(editing.id, form)
        setMessage('Đã cập nhật năm học')
      } else {
        await academicYearsApi.create(form)
        setMessage('Đã tạo năm học')
      }
      reset()
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleStatus(item) {
    setError('')
    setMessage('')
    try {
      await academicYearsApi.status(item.id, !item.isActive)
      setMessage('Đã cập nhật trạng thái')
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <div className="row-between">
        <div>
          <h2 className="page-title">Năm học</h2>
          <p className="page-subtitle">Quản lý niên khóa dùng cho học kỳ và lớp học phần.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <div className="form-group">
            <label>Tên năm học</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="2026-2027" />
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên năm học" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang dùng</option>
            <option value="INACTIVE">Tạm khóa</option>
          </select>
          <button className="btn-light" type="button" onClick={loadData}>Lọc</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{toInputDate(item.startDate)} - {toInputDate(item.endDate)}</td>
                  <td><span className={`badge ${item.isActive ? 'green' : ''}`}>{item.isActive ? 'Đang dùng' : 'Tạm khóa'}</span></td>
                  <td className="card-actions">
                    <button className="btn-light" type="button" onClick={() => edit(item)}>Sửa</button>
                    <button className="btn-light" type="button" onClick={() => toggleStatus(item)}>{item.isActive ? 'Khóa' : 'Mở'}</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan="4">{loading ? 'Đang tải...' : 'Chưa có năm học'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AcademicYearsPage
