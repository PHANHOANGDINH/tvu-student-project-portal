import { useEffect, useState } from 'react'
import { Button, Card, Empty, List } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { downloadSubmissionFile, studentSubmission } from '../../api/submissionsApi'
import { LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi } from '../../utils/formatters'

export default function SubmissionHistoryPage() {
  const { id } = useParams()
  const [data, setData] = useState(null), [error, setError] = useState('')
  useEffect(() => { studentSubmission(id).then(response => setData(response.data)).catch(() => setError('Không tải được lịch sử nộp bài. Vui lòng thử lại.')) }, [id])
  async function download(file) { const blob = await downloadSubmissionFile(file.id, 'student'); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.originalName; anchor.click(); URL.revokeObjectURL(url) }
  if (!data && !error) return <LoadingState />
  return <div><div className="page-title"><h2>Lịch sử các lần nộp</h2><p>{data?.requirementTitle}</p></div>{error && <div className="alert error">{error}</div>}{data && (!data.attempts?.length ? <Empty description="Chưa có lần nộp nào." /> : <List dataSource={data.attempts} renderItem={attempt => <List.Item><Card className="submission-attempt-card" title={`Lần ${attempt.attemptNumber}`} extra={<StatusBadge status={attempt.status} />}><p>{formatDateTimeVi(attempt.submittedAt)} {attempt.isLate ? '· Nộp trễ' : ''}</p>{attempt.files.map(file => <Button key={file.id} type="link" icon={<DownloadOutlined />} onClick={() => download(file)}>{file.originalName} ({(Number(file.size) / 1024 / 1024).toFixed(2)} MB)</Button>)}{attempt.links.map(link => <p key={link.id}><a href={link.url} target="_blank" rel="noreferrer">{link.url}</a></p>)}</Card></List.Item>} />)}</div>
}
