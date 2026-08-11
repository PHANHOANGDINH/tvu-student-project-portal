import { useCallback, useEffect, useMemo, useState } from 'react'
import { Collapse, Empty } from 'antd'
import { listLecturerTopics, reviewTopic } from '../../api/groupsApi'
import { StatusBadge } from '../../components/common/UiState'
import { statusLabel } from '../../utils/formatters'

export default function LecturerTopicRegistrationsPage() {
  const [items, setItems] = useState([]), [status, setStatus] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { setItems((await listLecturerTopics(status)).data || []); setError('') } catch (requestError) { setError(requestError.message) } finally { setLoading(false) } }, [status])
  useEffect(() => { load() }, [load])
  const grouped = useMemo(() => {
    const classes = new Map()
    items.forEach(topic => {
      const key = topic.classCode || 'Lớp học phần chưa xác định'
      if (!classes.has(key)) classes.set(key, [])
      classes.get(key).push(topic)
    })
    return [...classes.entries()]
  }, [items])
  const review = async (id, next) => { const comment = next === 'APPROVED' ? '' : window.prompt('Nhập lý do phản hồi:'); if (next !== 'APPROVED' && !comment) return; try { await reviewTopic(id, { status: next, comment }); load() } catch (requestError) { setError(requestError.message) } }
  const classPanels = grouped.map(([classCode, topics]) => ({
    key: classCode,
    label: <div className="topic-class-heading"><strong>{classCode}</strong><span>{topics.length} đăng ký đề tài</span></div>,
    children: <div className="table-wrap topic-registration-table"><table><thead><tr><th>Đề tài</th><th>Nhóm</th><th>Trạng thái</th><th>Duyệt</th></tr></thead><tbody>{topics.map(topic => <tr key={topic.id}><td><strong className="breakable-text">{topic.title}</strong><p className="breakable-text">{topic.description || 'Không có mô tả.'}</p>{topic.reviewComment && <small>Phản hồi: {topic.reviewComment}</small>}</td><td>{topic.groupName}</td><td><StatusBadge status={topic.status} /></td><td><div className="compact-actions topic-review-actions"><button onClick={() => review(topic.id, 'APPROVED')}>Duyệt</button><button onClick={() => review(topic.id, 'REQUIRES_REVISION')}>Yêu cầu sửa</button><button onClick={() => review(topic.id, 'REJECTED')}>Từ chối</button></div></td></tr>)}</tbody></table></div>
  }))
  return <div><div className="page-title"><h2>Duyệt đăng ký đề tài</h2><p>Duyệt đề tài theo từng lớp học phần bạn phụ trách.</p></div>{error && <div className="alert error">{error}</div>}<div className="panel topic-registration-page"><label className="topic-status-filter"><span>Trạng thái</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{['PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVISION'].map(value => <option value={value} key={value}>{statusLabel(value)}</option>)}</select></label>{loading ? <p>Đang tải...</p> : classPanels.length ? <Collapse defaultActiveKey={classPanels.map(item => item.key)} items={classPanels} /> : <Empty description="Không có đăng ký đề tài phù hợp." />}</div></div>
}
