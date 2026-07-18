import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { currentSubmission, uploadSubmission } from '../../api/submissionsApi'

const FILE_ITEMS = ['REPORT', 'SLIDE', 'SOURCE_CODE', 'OTHER']
const ACCEPTED_TYPES = {
  REPORT: '.pdf,.doc,.docx',
  SLIDE: '.pdf,.ppt,.pptx',
  SOURCE_CODE: '.zip,.rar,.7z',
  OTHER: undefined
}

export default function SubmitRequirementPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState({})
  const [github, setGithub] = useState('')
  const [video, setVideo] = useState('')
  const [progress, setProgress] = useState(0)
  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    return currentSubmission(id)
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.message || 'Không thể tải yêu cầu nộp bài'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function submit(event) {
    event.preventDefault()
    setError('')
    const maxBytes = (data.requirement.maxFileSizeMb || 20) * 1024 * 1024
    const oversized = Object.values(selected).find((file) => file?.size > maxBytes)
    if (oversized) {
      setError(`File “${oversized.name}” vượt quá dung lượng cho phép.`)
      return
    }
    if (!window.confirm('Xác nhận gửi lần nộp này?')) return

    const formData = new FormData()
    Object.entries(selected).forEach(([type, file]) => { if (file) formData.append(type, file) })
    if (github) formData.append('githubUrl', github)
    if (video) formData.append('videoUrl', video)

    try {
      setLoading(true)
      setProgress(0)
      await uploadSubmission(id, formData, setProgress)
      setSelected({})
      setGithub('')
      setVideo('')
      setFormKey((value) => value + 1)
      await load()
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi bài')
    } finally {
      setLoading(false)
    }
  }

  if (!data) return <div className="panel">{loading ? 'Đang tải...' : error || 'Không có dữ liệu.'}</div>

  const requirement = data.requirement
  const attempts = data.attempts || []
  const isLate = Date.now() > new Date(requirement.deadline).getTime()

  return <div>
    <div className="page-title"><h2>Nộp bài: {requirement.groupName}</h2><p>Đã nộp {attempts.length}/{requirement.maxAttempts} lần · Tối đa {requirement.maxFileSizeMb || 20} MB/file.</p></div>
    {isLate && <div className="alert error">Đã quá hạn. Lần nộp này sẽ được đánh dấu trễ nếu đợt cho phép.</div>}
    {error && <div className="alert error">{error}</div>}
    <form key={formKey} className="panel" onSubmit={submit}>
      {requirement.requiredItems.filter((type) => FILE_ITEMS.includes(type)).map((type) => <label key={type}>{type}<input type="file" accept={ACCEPTED_TYPES[type]} required onChange={(event) => setSelected((current) => ({ ...current, [type]: event.target.files[0] }))} /></label>)}
      {requirement.requiredItems.includes('GITHUB_LINK') && <input type="url" required placeholder="Liên kết GitHub" value={github} onChange={(event) => setGithub(event.target.value)} />}
      {requirement.requiredItems.includes('VIDEO_LINK') && <input type="url" required placeholder="Liên kết video" value={video} onChange={(event) => setVideo(event.target.value)} />}
      <button className="btn-primary" disabled={loading}>{loading ? 'Đang gửi...' : `Gửi bài${progress ? ` (${progress}%)` : ''}`}</button>
    </form>
    {data.submission && <button className="btn-light" onClick={() => navigate(`/student/submissions/${data.submission.id}/history`)}>Xem lịch sử nộp</button>}
  </div>
}
