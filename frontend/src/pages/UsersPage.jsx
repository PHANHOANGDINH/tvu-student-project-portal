import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, FileUp, Lock, LockOpen, Plus, Search, Users as UsersIcon } from 'lucide-react'
import { Button, Dropdown, Select } from 'antd'
import { EditOutlined, LockOutlined, MoreOutlined, UnlockOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { createUser, getUserById, getUsers, resetUserPassword, updateUser, updateUserStatus } from '../api/adminApi'
import { listOrganization } from '../api/organizationApi'
import { exportAdminStudents, listAcademic } from '../api/academicsApi'
import { USER_ROLES } from '../constants/roles'
import { ROLE_LABELS } from '../constants/uiLabels'
import Modal from '../components/common/Modal'

const roles = ROLE_LABELS

const emptyForm = {
  role: 'STUDENT',
  userCode: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  facultyId: '',
  administrativeClassId: '',
  className: '',
  academicDegree: '',
  password: '',
  confirmPassword: '',
  isActive: true
}

const emptyResetForm = {
  password: '',
  confirmPassword: ''
}

const formatDate = value => value ? new Date(value).toLocaleDateString('vi-VN') : '—'
const codeLabel = role => role === 'LECTURER' ? 'Mã giảng viên' : role === 'ADMIN' ? 'Mã quản trị viên' : 'Mã sinh viên'

function downloadCsv(items, fileName = 'danh-sach-tai-khoan.csv') {
  const safe = v => {
    let s = String(v ?? '')
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = [
    ['Mã tài khoản', 'Họ và tên', 'Email', 'Khoa', 'Lớp hành chính', 'Học vị', 'Vai trò', 'Trạng thái'],
    ...items.map(x => [x.userCode, x.fullName, x.email, x.department, x.className, x.academicDegree, roles[x.role] || x.role, x.isActive ? 'Hoạt động' : 'Đã khóa'])
  ]
  const blob = new Blob(['\uFEFF' + rows.map(r => r.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export default function UsersPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [users, setUsers] = useState([])
  const [faculties, setFaculties] = useState([])
  const [facultiesLoading, setFacultiesLoading] = useState(false)
  const [administrativeClasses, setAdministrativeClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 })
  const [filters, setFilters] = useState({ page: 1, pageSize: 10, search: '', role: '', status: '', facultyId: '', administrativeClassId: '', sortBy: 'createdAt', sortOrder: 'desc' })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [resetForm, setResetForm] = useState(emptyResetForm)
  const [courseClasses, setCourseClasses] = useState([])
  const [exportForm, setExportForm] = useState({ scope: 'all', facultyId: '', administrativeClassId: '', courseClassId: '' })

  const load = async (next = filters) => {
    try {
      setLoading(true)
      const response = await getUsers(next)
      const data = response?.data || {}
      setUsers(data.items || [])
      setPagination({
        page: data.page || 1,
        pageSize: data.pageSize || 10,
        totalItems: data.totalItems || 0,
        totalPages: data.totalPages || 1
      })
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Không thể tải danh sách người dùng' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    setFacultiesLoading(true)
    listOrganization('faculties', { pageSize: 100, isActive: true })
      .then(response => setFaculties(response.data.items || []))
      .catch(() => setFaculties([]))
      .finally(() => setFacultiesLoading(false))
  }, [])

  useEffect(() => {
    setClassesLoading(true)
    listOrganization('administrative-classes', { pageSize: 100, isActive: true })
      .then(response => setAdministrativeClasses(response.data.items || []))
      .catch(() => setAdministrativeClasses([]))
      .finally(() => setClassesLoading(false))
  }, [])

  const classesForFaculty = useMemo(() => administrativeClasses.filter(item => !form.facultyId || Number(item.facultyId) === Number(form.facultyId)), [administrativeClasses, form.facultyId])
  const exportClassesForFaculty = useMemo(() => administrativeClasses.filter(item => !exportForm.facultyId || Number(item.facultyId) === Number(exportForm.facultyId)), [administrativeClasses, exportForm.facultyId])

  useEffect(() => {
    if (location.pathname.endsWith('/new')) openCreate()
  }, [location.pathname])

  const title = useMemo(() => {
    if (modal?.type === 'studentExport') return 'Xuất danh sách sinh viên'
    if (modal?.type === 'detail') return 'Chi tiết tài khoản'
    if (modal?.type === 'edit') return 'Chỉnh sửa tài khoản'
    if (modal?.type === 'reset') return 'Đặt lại mật khẩu'
    return 'Thêm tài khoản'
  }, [modal])

  const apply = patch => {
    const next = { ...filters, ...patch }
    setFilters(next)
    load(next)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setModal({ type: 'create' })
  }

  const openDetail = async user => {
    try {
      setSaving(true)
      const userId = user.id || user.Id
      const response = await getUserById(userId)
      setModal({ type: 'detail', user: response?.data || user })
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Không thể tải chi tiết người dùng' })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = user => {
    setForm({
      role: user.role || 'STUDENT',
      userCode: user.userCode || '',
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || '',
      facultyId: faculties.find(item => item.facultyName === user.department)?.id || '',
      administrativeClassId: user.administrativeClassId || '',
      className: user.className || '',
      academicDegree: user.academicDegree || '',
      isActive: user.isActive !== false,
      password: '',
      confirmPassword: ''
    })
    setModal({ type: 'edit', user })
  }

  const close = () => {
    setModal(null)
    setForm(emptyForm)
    setResetForm(emptyResetForm)
    if (location.pathname.endsWith('/new')) navigate('/admin/users', { replace: true })
  }

  const validateForm = () => {
    if (!form.userCode.trim() || !form.fullName.trim() || !form.email.trim()) {
      return 'Vui lòng nhập đầy đủ mã tài khoản, họ tên và email.'
    }
    if (modal.type === 'create' && form.password !== form.confirmPassword) {
      return 'Xác nhận mật khẩu không khớp.'
    }
    if (form.role === (USER_ROLES?.STUDENT || 'STUDENT') && !form.facultyId) {
      return 'Sinh viên cần chọn khoa.'
    }
    if (form.role === (USER_ROLES?.STUDENT || 'STUDENT') && !form.administrativeClassId) {
      return 'Sinh viên cần bổ sung thông tin lớp học.'
    }
    return null
  }

  const save = async event => {
    event.preventDefault()
    const errorMsg = validateForm()
    if (errorMsg) return setMessage({ type: 'error', text: errorMsg })

    try {
      setSaving(true)
      const payload = {
        role: form.role,
        userCode: form.userCode.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
        className: form.className.trim(),
        administrativeClassId: form.role === 'STUDENT' ? Number(form.administrativeClassId) : null,
        academicDegree: form.role === 'LECTURER' ? form.academicDegree : ''
      }

      if (modal.type === 'create') {
        await createUser({
          ...payload,
          password: form.password,
          confirmPassword: form.confirmPassword
        })
      } else {
        const userId = modal.user.id || modal.user.Id
        await updateUser(userId, payload)
      }

      setMessage({
        type: 'success',
        text: modal.type === 'create' ? 'Tạo tài khoản thành công.' : 'Cập nhật tài khoản thành công.'
      })
      close()
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Lỗi khi lưu thông tin người dùng' })
    } finally {
      setSaving(false)
    }
  }

  const confirmStatus = user => setModal({ type: 'status', user, next: user.isActive === false })

  const changeStatus = async () => {
    try {
      setSaving(true)
      const userId = modal.user.id || modal.user.Id
      await updateUserStatus(userId, modal.next)
      setMessage({ type: 'success', text: modal.next ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.' })
      close()
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Lỗi khi đổi trạng thái' })
    } finally {
      setSaving(false)
    }
  }

  const doReset = async event => {
    event.preventDefault()
    if (resetForm.password !== resetForm.confirmPassword) {
      return setMessage({ type: 'error', text: 'Xác nhận mật khẩu không khớp.' })
    }
    try {
      setSaving(true)
      const userId = modal.user.id || modal.user.Id
      await resetUserPassword(userId, {
        newPassword: resetForm.password,
        confirmNewPassword: resetForm.confirmPassword
      })
      setMessage({ type: 'success', text: 'Đặt lại mật khẩu thành công.' })
      close()
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Lỗi khi đặt lại mật khẩu' })
    } finally {
      setSaving(false)
    }
  }

  const exportUsers = async role => {
    try {
      const exportFilters = {
        ...filters,
        role,
        administrativeClassId: role === 'STUDENT' ? filters.administrativeClassId : '',
        pageSize: 100
      }
      const items = []
      let page = 1
      let totalPages = 1
      do {
        const response = await getUsers({ ...exportFilters, page })
        items.push(...(response?.data?.items || []))
        totalPages = response?.data?.totalPages || 1
        page += 1
      } while (page <= totalPages)
      const faculty = faculties.find(item => Number(item.id) === Number(filters.facultyId))
      const adminClass = role === 'STUDENT'
        ? administrativeClasses.find(item => Number(item.id) === Number(filters.administrativeClassId))
        : null
      const suffix = adminClass?.classCode || faculty?.facultyCode || 'tat-ca'
      downloadCsv(items, `danh-sach-${role === 'LECTURER' ? 'giang-vien' : 'sinh-vien'}-${suffix}.csv`)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    }
  }

  const openStudentExport = async () => {
    setExportForm({ scope: 'all', facultyId: '', administrativeClassId: '', courseClassId: '' })
    setModal({ type: 'studentExport' })
    if (!courseClasses.length) {
      try {
        const response = await listAcademic('courseClasses', { page: 1, pageSize: 100 })
        setCourseClasses(response?.data?.items || [])
      } catch (e) {
        setMessage({ type: 'error', text: e.message || 'Không thể tải danh sách lớp học phần.' })
      }
    }
  }

  const submitStudentExport = async event => {
    event.preventDefault()
    const required = { faculty: 'facultyId', administrativeClass: 'administrativeClassId', courseClass: 'courseClassId' }[exportForm.scope]
    if (required && !exportForm[required]) return setMessage({ type: 'error', text: 'Vui lòng chọn đầy đủ điều kiện cho phạm vi xuất.' })
    try {
      setSaving(true)
      const blob = await exportAdminStudents(exportForm)
      const faculty = faculties.find(item => Number(item.id) === Number(exportForm.facultyId))
      const adminClass = administrativeClasses.find(item => Number(item.id) === Number(exportForm.administrativeClassId))
      const courseClass = courseClasses.find(item => Number(item.id) === Number(exportForm.courseClassId))
      const suffix = courseClass?.code || adminClass?.classCode || faculty?.facultyCode || 'tat-ca'
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `danh-sach-sinh-vien-${suffix}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Đã xuất danh sách sinh viên thành công.' })
      close()
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Không thể xuất danh sách sinh viên.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="page-title admin-page-heading">
        <div>
          <span className="eyebrow">QUẢN LÝ NGƯỜI DÙNG</span>
          <h2>Danh sách tài khoản</h2>
          <p>Quản lý thông tin, vai trò và trạng thái truy cập của người dùng.</p>
        </div>
        <div className="toolbar-actions">
          <button className="btn-light" onClick={() => navigate('/admin/students/import')}><FileUp size={17} />Nhập sinh viên</button>
          <button className="btn-light" onClick={() => navigate('/admin/lecturers/import')}><FileUp size={17} />Nhập giảng viên</button>
          <button className="btn-light" onClick={openStudentExport}><Download size={17} />Xuất sinh viên</button>
          <button className="btn-light" onClick={() => exportUsers('LECTURER')}><Download size={17} />Xuất giảng viên</button>
          <button className="btn-primary" onClick={openCreate}><Plus size={18} />Thêm tài khoản</button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="panel filters-panel">
        <form className="admin-filterbar" onSubmit={e => { e.preventDefault(); apply({ page: 1 }) }}>
          <label className="search-field">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="Tìm theo mã, họ tên, email, khoa, lớp..."
            />
          </label>
          <select value={filters.role} onChange={e => apply({ role: e.target.value, page: 1 })}>
            <option value="">Tất cả vai trò</option>
            {Object.entries(roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filters.status} onChange={e => apply({ status: e.target.value, page: 1 })}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>
          <Select showSearch allowClear optionFilterProp="label" placeholder="Tất cả khoa" loading={facultiesLoading} value={filters.facultyId || undefined} options={faculties.map(item=>({value:item.id,label:`${item.facultyCode} — ${item.facultyName}`}))} onChange={value=>apply({facultyId:value||'',administrativeClassId:'',page:1})}/>
          {filters.role !== 'LECTURER' && (
            <Select showSearch allowClear optionFilterProp="label" placeholder="Tất cả lớp hành chính"
              loading={classesLoading} value={filters.administrativeClassId || undefined}
              options={administrativeClasses.filter(item => !filters.facultyId || Number(item.facultyId) === Number(filters.facultyId)).map(item => ({ value: item.id, label: `${item.classCode} — ${item.className}` }))}
              onChange={value => apply({ administrativeClassId: value || '', page: 1 })} />
          )}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={e => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              apply({ sortBy, sortOrder, page: 1 })
            }}
          >
            <option value="createdAt-desc">Mới tạo gần đây</option>
            <option value="createdAt-asc">Cũ nhất</option>
            <option value="fullName-asc">Họ tên A–Z</option>
            <option value="fullName-desc">Họ tên Z–A</option>
          </select>
          <button className="btn-primary" type="submit"><Search size={17} />Tìm kiếm</button>
        </form>
      </div>

      <div className="panel account-table-panel">
        <div className="table-summary">
          <div><UsersIcon size={20} /><strong>{pagination.totalItems}</strong> tài khoản</div>
          <span>Đã chọn {selected.length}</span>
        </div>

        {loading ? (
          <div className="skeleton-list">{[1, 2, 3, 4].map(x => <div key={x} />)}</div>
        ) : !users.length ? (
          <div className="empty-state">
            <UsersIcon size={42} />
            <h3>Chưa có tài khoản phù hợp</h3>
            <p>Thử thay đổi bộ lọc hoặc thêm tài khoản mới.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="account-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selected.length === users.length && users.length > 0}
                      onChange={e => setSelected(e.target.checked ? users.map(x => x.id || x.Id) : [])}
                    />
                  </th>
                  <th>Mã tài khoản</th>
                  <th>Họ và tên</th>
                  <th>Email / Tên đăng nhập</th>
                  <th>Vai trò</th>
                  <th>Học vị</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const uId = user.id || user.Id
                  return (
                    <tr key={uId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(uId)}
                          onChange={e => setSelected(e.target.checked ? [...selected, uId] : selected.filter(x => x !== uId))}
                        />
                      </td>
                      <td><strong>{user.userCode || '—'}</strong></td>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-pill ${(user.role || '').toLowerCase()}`}>
                          {roles[user.role] || user.role}
                        </span>
                      </td>
                      <td>{user.role === 'LECTURER' ? user.academicDegree || '—' : '—'}</td>
                      <td>
                        <span className={`status-pill ${user.isActive === false ? 'inactive' : 'active'}`}>
                          <i />{user.isActive === false ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="compact-actions account-actions">
                          <Button size="small" type="link" icon={<Eye size={15} />} onClick={() => openDetail(user)}>Xem</Button>
                          <Dropdown trigger={['click']} menu={{ items: [
                            { key: 'edit', icon: <EditOutlined />, label: 'Chỉnh sửa', onClick: () => openEdit(user) },
                            { type: 'divider' },
                            { key: 'reset', icon: <LockOutlined />, label: 'Đặt lại mật khẩu', onClick: () => { setResetForm(emptyResetForm); setModal({ type: 'reset', user }) } },
                            { key: 'status', danger: user.isActive !== false, icon: user.isActive === false ? <UnlockOutlined /> : <LockOutlined />, label: user.isActive === false ? 'Mở khóa tài khoản' : 'Khóa tài khoản', onClick: () => confirmStatus(user) }
                          ] }}>
                            <Button size="small" type="text" icon={<MoreOutlined />} aria-label={`Mở menu thao tác cho ${user.fullName}`} />
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <label>
            Hiển thị{' '}
            <select value={filters.pageSize} onChange={e => apply({ pageSize: Number(e.target.value), page: 1 })}>
              {[10, 20, 50].map(x => <option key={x}>{x}</option>)}
            </select>{' '}
            bản ghi
          </label>
          <div className="pagination-bar">
            <button disabled={pagination.page <= 1} onClick={() => apply({ page: pagination.page - 1 })}>Trước</button>
            <span>Trang {pagination.page}/{pagination.totalPages || 1}</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => apply({ page: pagination.page + 1 })}>Sau</button>
          </div>
        </div>
      </div>

      {modal && (
        <Modal
          open
          eyebrow="Tài khoản"
          title={modal.type === 'status' ? (modal.next ? 'Mở khóa tài khoản' : 'Khóa tài khoản') : title}
          description={modal.type === 'detail' ? 'Thông tin chi tiết của tài khoản trong hệ thống.' : undefined}
          onClose={close}
          closeOnBackdrop={!saving}
          closeOnEscape={!saving}
        >

            {modal.type === 'studentExport' ? (
              <form onSubmit={submitStudentExport} className="student-export-form">
                <label>Phạm vi xuất
                  <Select value={exportForm.scope} options={[
                    { value: 'all', label: 'Tất cả sinh viên' },
                    { value: 'faculty', label: 'Theo khoa' },
                    { value: 'administrativeClass', label: 'Theo lớp hành chính' },
                    { value: 'courseClass', label: 'Theo lớp học phần' }
                  ]} onChange={scope => setExportForm({ scope, facultyId: '', administrativeClassId: '', courseClassId: '' })} />
                </label>
                {(exportForm.scope === 'faculty' || exportForm.scope === 'administrativeClass') && <label>Khoa
                  <Select showSearch optionFilterProp="label" placeholder="Chọn khoa" loading={facultiesLoading} value={exportForm.facultyId || undefined} options={faculties.map(item => ({ value: item.id, label: `${item.facultyCode} — ${item.facultyName}` }))} onChange={facultyId => setExportForm({ ...exportForm, facultyId, administrativeClassId: '' })} />
                </label>}
                {exportForm.scope === 'administrativeClass' && <label>Lớp hành chính
                  <Select showSearch optionFilterProp="label" placeholder="Chọn lớp hành chính" disabled={!exportForm.facultyId} value={exportForm.administrativeClassId || undefined} options={exportClassesForFaculty.map(item => ({ value: item.id, label: `${item.classCode} — ${item.className}` }))} onChange={administrativeClassId => setExportForm({ ...exportForm, administrativeClassId })} />
                </label>}
                {exportForm.scope === 'courseClass' && <label>Lớp học phần
                  <Select showSearch optionFilterProp="label" placeholder="Chọn lớp học phần" value={exportForm.courseClassId || undefined} options={courseClasses.map(item => ({ value: item.id, label: `${item.code} — ${item.subjectName || 'Học phần'}` }))} onChange={courseClassId => setExportForm({ ...exportForm, courseClassId })} />
                </label>}
                <p className="form-hint">File CSV chứa toàn bộ sinh viên phù hợp với phạm vi đã chọn, không giới hạn theo trang hiện tại.</p>
                <div className="modal-actions"><button type="button" className="btn-light" onClick={close}>Hủy</button><button className="btn-primary" disabled={saving}><Download size={17} />{saving ? 'Đang xuất...' : 'Tải danh sách'}</button></div>
              </form>
            ) : modal.type === 'detail' ? (
              <div className="info-list">
                {[
                  ['Mã tài khoản', modal.user.userCode],
                  ['Họ và tên', modal.user.fullName],
                  ['Email', modal.user.email],
                  ['Số điện thoại', modal.user.phone],
                  ['Khoa', modal.user.department],
                  ['Lớp', modal.user.className],
                  ['Học vị', modal.user.academicDegree],
                  ['Vai trò', roles[modal.user.role] || modal.user.role],
                  ['Trạng thái', modal.user.isActive === false ? 'Đã khóa' : 'Hoạt động'],
                  ['Ngày tạo', formatDate(modal.user.createdAt)]
                ].map(([l, v]) => (
                  <div key={l}>
                    <span>{l}</span>
                    <strong>{v || '—'}</strong>
                  </div>
                ))}
              </div>
            ) : modal.type === 'status' ? (
              <div>
                <p>Bạn có chắc muốn {modal.next ? 'mở khóa' : 'khóa'} tài khoản <strong>{modal.user.fullName}</strong>?</p>
                <div className="modal-actions">
                  <button className="btn-light" onClick={close}>Hủy</button>
                  <button className={modal.next ? 'btn-primary' : 'btn-danger'} disabled={saving} onClick={changeStatus}>
                    {modal.next ? <LockOpen size={17} /> : <Lock size={17} />}Xác nhận
                  </button>
                </div>
              </div>
            ) : modal.type === 'reset' ? (
              <form onSubmit={doReset}>
                <div className="form-grid">
                  <label>
                    Mật khẩu mới
                    <input required type="password" value={resetForm.password} onChange={e => setResetForm({ ...resetForm, password: e.target.value })} />
                  </label>
                  <label>
                    Xác nhận mật khẩu
                    <input required type="password" value={resetForm.confirmPassword} onChange={e => setResetForm({ ...resetForm, confirmPassword: e.target.value })} />
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-light" onClick={close}>Hủy</button>
                  <button className="btn-primary" disabled={saving}>Đặt lại mật khẩu</button>
                </div>
              </form>
            ) : (
              <form onSubmit={save}>
                <div className="form-grid">
                  <label>
                    Vai trò
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      {Object.entries(roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <label>
                    {codeLabel(form.role)}
                    <input required value={form.userCode} onChange={e => setForm({ ...form, userCode: e.target.value })} />
                  </label>
                  <label>
                    Họ và tên
                    <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                  </label>
                  <label>
                    Email / Tên đăng nhập
                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </label>
                  <label>
                    Số điện thoại
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </label>
                  <label>
                    Khoa
                    <Select
                      showSearch allowClear loading={facultiesLoading} optionFilterProp="label"
                      value={form.facultyId || undefined} placeholder="Chọn khoa"
                      notFoundContent={facultiesLoading ? 'Đang tải...' : 'Chưa có dữ liệu khoa'}
                      options={faculties.map(item => ({ value: item.id, label: `${item.facultyCode} - ${item.facultyName}` }))}
                      onChange={value => { const faculty = faculties.find(item => item.id === value); const selectedClass=administrativeClasses.find(item=>Number(item.id)===Number(form.administrativeClassId));setForm({ ...form, facultyId: value || '', department: faculty?.facultyName || '', administrativeClassId:selectedClass&&Number(selectedClass.facultyId)===Number(value)?form.administrativeClassId:'',className:selectedClass&&Number(selectedClass.facultyId)===Number(value)?form.className:'' }) }}
                    />
                  </label>
                  {form.role === 'STUDENT' && <label>
                    Lớp
                    <Select showSearch allowClear={form.role!=='STUDENT'} loading={classesLoading} optionFilterProp="label" value={form.administrativeClassId||undefined} placeholder="Chọn lớp hành chính" notFoundContent={classesLoading?'Đang tải...':'Không có lớp phù hợp'} options={classesForFaculty.map(item=>({value:item.id,label:`${item.classCode} — ${item.className}`}))} onChange={value=>{const item=administrativeClasses.find(x=>Number(x.id)===Number(value));setForm({...form,administrativeClassId:value||'',className:item?.classCode||''})}} />
                  </label>}
                  {form.role === 'LECTURER' && <label>Học vị<Select allowClear value={form.academicDegree||undefined} placeholder="Chọn học vị" options={['Cử nhân','Kỹ sư','Thạc sĩ','Tiến sĩ',...(form.academicDegree&&!['Cử nhân','Kỹ sư','Thạc sĩ','Tiến sĩ'].includes(form.academicDegree)?[form.academicDegree]:[])].map(value=>({value,label:value}))} onChange={value=>setForm({...form,academicDegree:value||''})}/></label>}
                  {modal.type === 'create' && (
                    <>
                      <label>
                        Mật khẩu ban đầu
                        <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                      </label>
                      <label>
                        Xác nhận mật khẩu
                        <input required type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
                      </label>
                    </>
                  )}
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-light" onClick={close}>Hủy</button>
                  <button className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu tài khoản'}</button>
                </div>
              </form>
            )}
        </Modal>
      )}
    </div>
  )
}
