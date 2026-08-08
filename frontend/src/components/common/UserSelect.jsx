import { useCallback, useEffect, useRef, useState } from 'react'
import { Select } from 'antd'
import { getUsers } from '../../api/adminApi'

export default function UserSelect({ role, value, onChange, allowClear = true, placeholder = 'Chọn người dùng', disabled = false }) {
  const [options, setOptions] = useState([]), [loading, setLoading] = useState(false)
  const timer = useRef()
  const load = useCallback(search => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        setLoading(true)
        const response = await getUsers({ role, status: 'ACTIVE', search, page: 1, pageSize: 30, sortBy: 'fullName', sortOrder: 'asc' })
        setOptions((response.data.items || []).map(user => ({ value: user.id, label: `${user.userCode || user.email} — ${user.fullName}`, title: user.email })))
      } finally { setLoading(false) }
    }, search ? 250 : 0)
  }, [role])
  useEffect(() => { load(''); return () => clearTimeout(timer.current) }, [load])
  return <Select showSearch filterOption={false} allowClear={allowClear} disabled={disabled} loading={loading} value={value || undefined} placeholder={placeholder} options={options} onSearch={load} onChange={onChange} notFoundContent={loading ? 'Đang tải...' : 'Không tìm thấy người dùng'} optionRender={option => <div><div>{option.label}</div><small>{option.data.title}</small></div>} />
}
