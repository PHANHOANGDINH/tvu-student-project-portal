import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Checkbox, Col, DatePicker, Divider, Flex, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { listLecturerCourseClasses } from '../../api/academicsApi'
import { changeRequirementStatus, createRequirement, deleteRequirement, listLecturerRequirements, updateRequirement } from '../../api/submissionRequirementsApi'
import { StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi } from '../../utils/formatters'
import './submission-requirements.css'

const CONTENT_LABELS = {
  REPORT: 'Báo cáo',
  SLIDE: 'Slide trình chiếu',
  SOURCE_CODE: 'Mã nguồn',
  GITHUB_LINK: 'Liên kết GitHub',
  VIDEO_LINK: 'Liên kết video',
  OTHER: 'Nội dung khác'
}
const CONTENT_OPTIONS = Object.entries(CONTENT_LABELS).map(([value, label]) => ({ value, label }))
const initialValues = { classId: undefined, title: '', description: '', instructions: '', startAt: null, deadline: null, allowLate: false, allowResubmission: false, maxAttempts: 1, maxFileSizeMb: null, requiredItems: [] }

function RequiredContentTags({ items = [] }) {
  const labels = items.map(item => CONTENT_LABELS[item.type || item] || 'Nội dung khác')
  const shown = labels.slice(0, 3), hidden = labels.slice(3)
  return <Space size={[4, 4]} wrap>{shown.map(label => <Tag color="blue" key={label}>{label}</Tag>)}{hidden.length > 0 && <Tooltip title={hidden.join(', ')}><Tag>+{hidden.length}</Tag></Tooltip>}</Space>
}

export default function SubmissionRequirementsPage() {
  const [form] = Form.useForm()
  const [items, setItems] = useState([]), [classes, setClasses] = useState([])
  const [editing, setEditing] = useState(null), [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [requirements, courseClasses] = await Promise.all([listLecturerRequirements(), listLecturerCourseClasses({ pageSize: 100 })])
      setItems(requirements.data || [])
      setClasses(courseClasses.data?.items || [])
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function open(item = null) {
    setEditing(item)
    form.setFieldsValue(item ? {
      ...item,
      startAt: dayjs(item.startAt),
      deadline: dayjs(item.deadline),
      requiredItems: (item.requiredItems || []).map(value => value.type || value)
    } : initialValues)
    setShow(true)
  }

  function closeForm() {
    setShow(false)
    setEditing(null)
    form.resetFields()
  }

  async function save(values) {
    setSaving(true)
    setError('')
    const payload = {
      ...values,
      startAt: values.startAt.toISOString(),
      deadline: values.deadline.toISOString(),
      requiredItems: values.requiredItems.map(type => ({ type }))
    }
    try {
      if (editing) await updateRequirement(editing.id, payload)
      else await createRequirement(payload)
      closeForm()
      await load()
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu yêu cầu. Vui lòng thử lại.')
    } finally { setSaving(false) }
  }

  async function action(callback) {
    try { setError(''); await callback(); await load() }
    catch (requestError) { setError(requestError.message || 'Không thể cập nhật yêu cầu. Vui lòng thử lại.') }
  }

  const columns = [
    { title: 'Yêu cầu', dataIndex: 'title', key: 'title', render: (_, item) => <div className="requirement-title-cell"><strong>{item.title}</strong><RequiredContentTags items={item.requiredItems} /></div> },
    { title: 'Lớp học phần', dataIndex: 'classCode', key: 'classCode', width: 190 },
    { title: 'Thời hạn', key: 'time', width: 260, render: (_, item) => <span>{formatDateTimeVi(item.startAt)} – {formatDateTimeVi(item.deadline)}</span> },
    { title: 'Trạng thái', dataIndex: 'effectiveStatus', key: 'status', width: 145, render: status => <StatusBadge status={status} /> },
    { title: 'Thao tác', key: 'actions', width: 250, render: (_, item) => <Space size={8} wrap>
      {!['CLOSED', 'CANCELLED'].includes(item.status) && <Button size="small" onClick={() => open(item)}>Sửa</Button>}
      {['DRAFT', 'CANCELLED'].includes(item.status) && <Button size="small" type="primary" onClick={() => action(() => changeRequirementStatus(item.id, 'OPEN'))}>Mở</Button>}
      {item.status === 'OPEN' && <Popconfirm title="Bạn có chắc muốn đóng yêu cầu này?" okText="Đóng yêu cầu" cancelText="Quay lại" onConfirm={() => action(() => changeRequirementStatus(item.id, 'CLOSED'))}><Button size="small">Đóng</Button></Popconfirm>}
      {!['CLOSED', 'CANCELLED'].includes(item.status) && <Popconfirm title="Bạn có chắc muốn hủy yêu cầu này?" okText="Hủy yêu cầu" cancelText="Quay lại" okButtonProps={{ danger: true }} onConfirm={() => action(() => changeRequirementStatus(item.id, 'CANCELLED'))}><Button size="small" danger>Hủy</Button></Popconfirm>}
      {['DRAFT', 'CANCELLED'].includes(item.status) && <Popconfirm title="Bạn có chắc muốn xóa yêu cầu này?" okText="Xóa" cancelText="Quay lại" okButtonProps={{ danger: true }} onConfirm={() => action(() => deleteRequirement(item.id))}><Button size="small" danger>Xóa</Button></Popconfirm>}
    </Space> }
  ]

  return <div className="lecturer-requirements-page">
    <div className="page-title row-between"><div><h2>Yêu cầu và đợt nộp</h2><p>Quản lý yêu cầu nộp cho lớp học phần bạn phụ trách.</p></div><Button type="primary" onClick={() => open()}>Tạo yêu cầu</Button></div>
    {error && <Alert type="error" showIcon message={error} closable onClose={() => setError('')} />}

    {show && <Card className="requirement-form-card" title={editing ? 'Sửa yêu cầu' : 'Tạo yêu cầu'}>
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={save} requiredMark="optional">
        <section><Typography.Title level={5}>Thông tin yêu cầu</Typography.Title><Divider />
          <Form.Item name="classId" label="Lớp học phần" rules={[{ required: true, message: 'Vui lòng chọn lớp học phần.' }]}>
            <Select showSearch optionFilterProp="label" disabled={Boolean(editing)} placeholder="Chọn lớp học phần" options={classes.map(item => ({ value: item.id, label: `${item.code} — ${item.subjectName}` }))} />
          </Form.Item>
          <Form.Item name="title" label="Tên yêu cầu" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên yêu cầu.' }]}><Input placeholder="Nhập tên yêu cầu" /></Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập mô tả.' }]}><Input.TextArea rows={3} placeholder="Mô tả nội dung và mục tiêu của yêu cầu" /></Form.Item>
          <Form.Item name="instructions" label="Hướng dẫn"><Input.TextArea rows={3} placeholder="Hướng dẫn sinh viên chuẩn bị và nộp bài" /></Form.Item>
        </section>

        <section><Typography.Title level={5}>Thiết lập nộp bài</Typography.Title><Divider />
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12} xl={6}><Form.Item name="startAt" label="Bắt đầu" rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu.' }]}><DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" placeholder="Chọn thời gian" /></Form.Item></Col>
            <Col xs={24} md={12} xl={6}><Form.Item name="deadline" label="Hạn nộp" dependencies={['startAt']} rules={[{ required: true, message: 'Vui lòng chọn hạn nộp.' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || !getFieldValue('startAt') || value.isAfter(getFieldValue('startAt')) ? Promise.resolve() : Promise.reject(new Error('Hạn nộp phải sau thời gian bắt đầu.')) } })]}><DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" placeholder="Chọn thời gian" /></Form.Item></Col>
            <Col xs={24} md={12} xl={6}><Form.Item name="maxAttempts" label="Số lần nộp tối đa" rules={[{ required: true, message: 'Vui lòng nhập số lần nộp.' }]}><InputNumber min={1} precision={0} addonAfter="lần" /></Form.Item></Col>
            <Col xs={24} md={12} xl={6}><Form.Item name="maxFileSizeMb" label="Dung lượng tối đa"><InputNumber min={1} precision={0} addonAfter="MB" placeholder="Không giới hạn" /></Form.Item></Col>
          </Row>
          <Flex className="requirement-switches" gap={24} wrap>
            <Form.Item name="allowLate" label="Cho phép nộp trễ" valuePropName="checked"><Switch checkedChildren="Có" unCheckedChildren="Không" /></Form.Item>
            <Form.Item name="allowResubmission" label="Cho phép nộp lại" valuePropName="checked"><Switch checkedChildren="Có" unCheckedChildren="Không" /></Form.Item>
          </Flex>
        </section>

        <section><Typography.Title level={5}>Nội dung bắt buộc</Typography.Title><Divider />
          <Form.Item name="requiredItems" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nội dung bắt buộc.' }]}>
            <Checkbox.Group options={CONTENT_OPTIONS} className="required-content-grid" />
          </Form.Item>
        </section>

        <Flex className="requirement-form-footer" justify="flex-end" gap={8} wrap><Button onClick={closeForm} disabled={saving}>Hủy</Button><Button type="primary" htmlType="submit" loading={saving}>{editing ? 'Lưu thay đổi' : 'Tạo yêu cầu'}</Button></Flex>
      </Form>
    </Card>}

    <Card className="requirements-list-card"><Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1050 }} locale={{ emptyText: 'Chưa có yêu cầu nộp nào.' }} /></Card>
  </div>
}
