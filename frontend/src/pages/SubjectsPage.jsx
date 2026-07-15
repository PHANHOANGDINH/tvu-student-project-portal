import { useEffect, useState } from 'react'
import { subjectsApi } from '../api/academicApi'

const emptyForm = { code: '', name: '', credits: 3, description: '' }

function SubjectsPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const response = await subjectsApi.list({ ...filters, pageSize: 100 })
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
    setForm({
      code: item.code || '',
      name: item.name || '',
      credits: item.credits || 3,
      description: item.description || ''
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
        await subjectsApi.update(editing.id, form)
        setMessage('Đã cập nhật môn học')
      } else {
        await subjectsApi.create(form)
        setMessage('Đã tạo môn học')
      }
      reset()
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleStatus(item) {
    try {
      await subjectsApi.status(item.id, !item.isActive)
      setMessage('Đã cập nhật trạng thái')
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <h2 className="page-title">Môn học</h2>
      <p className="page-subtitle">Quản lý danh mục môn học dùng cho lớp học phần.</p>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <div className="form-group">
            <label>Mã môn</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CT101" />
          </div>
          <div className="form-group">
            <label>Tên môn</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cơ sở lập trình" />
          </div>
          <div className="form-group">
            <label>Số tín chỉ</label>
            <input type="number" min="1" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn" />
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
            {editing && <button className="btn-light" type="button" onClick={reset}>Hủy</button>}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="filter-grid">
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Tìm mã hoặc tên môn" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang dùng</option>
            <option value="INACTIVE">Tạm khóa</option>
          </select>
          <button className="btn-light" type="button" onClick={loadData}>Lọc</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Mã</th><th>Tên môn</th><th>Tín chỉ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.credits}</td>
                  <td><span className={`badge ${item.isActive ? 'green' : ''}`}>{item.isActive ? 'Đang dùng' : 'Tạm khóa'}</span></td>
                  <td className="card-actions">
                    <button className="btn-light" type="button" onClick={() => edit(item)}>Sửa</button>
                    <button className="btn-light" type="button" onClick={() => toggleStatus(item)}>{item.isActive ? 'Khóa' : 'Mở'}</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan="5">{loading ? 'Đang tải...' : 'Chưa có môn học'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default SubjectsPage
