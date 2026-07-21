import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, FileCheck2, FolderKanban, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getStudentFinalsApi, getStudentProgressApi, getStudentProjectsApi, getStudentRegistrationsApi } from '../../api/studentApi'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../components/common/UiState'

function StudentDashboardPage() {
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('')
  async function load(){try{setLoading(true);setError('');const [projects,registrations,progress,finals]=await Promise.all([getStudentProjectsApi({limit:100}),getStudentRegistrationsApi({limit:100}),getStudentProgressApi({limit:100}),getStudentFinalsApi({limit:100})]);setData({projects:projects?.data||[],registrations:registrations?.data||[],progress:progress?.data||[],finals:finals?.data||[]})}catch(err){setError(err.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[])
  if(loading)return <LoadingState label="Đang chuẩn bị không gian sinh viên..." />
  if(error)return <ErrorState message={error} onRetry={load}/>
  const approved=data.registrations.filter(x=>x.Status==='Approved'); const recent=[...data.progress,...data.finals].sort((a,b)=>new Date(b.CreatedAt||b.SubmittedAt)-new Date(a.CreatedAt||a.SubmittedAt)).slice(0,5)
  const stats=[[BookOpen,'Đề tài khả dụng',data.projects.length,'Đề tài đang mở đăng ký'],[FolderKanban,'Đăng ký của tôi',data.registrations.length,'Tất cả lượt đăng ký'],[CheckCircle2,'Đề tài đã duyệt',approved.length,'Đang được thực hiện'],[ListChecks,'Báo cáo tiến độ',data.progress.length,'Báo cáo đã gửi'],[FileCheck2,'Bài cuối kỳ',data.finals.length,'Bài đã nộp']]
  return <><div className="page-title"><h2>Tổng quan sinh viên</h2><p>Theo dõi đề tài, tiến độ và bài nộp của bạn tại một nơi.</p></div><div className="stat-grid">{stats.map(([Icon,label,value,desc])=><div className="stat-card" key={label}><div className="stat-icon"><Icon/></div><div><span>{label}</span><strong>{value}</strong><p>{desc}</p></div></div>)}</div><div className="dashboard-grid"><section className="panel"><h3>Hoạt động gần đây</h3>{recent.length?recent.map(item=><div className="activity-row" key={`${item.Title}-${item.Id}`}><div><strong>{item.Title}</strong><span>{item.ProjectTitle||'Đồ án sinh viên'}</span></div><StatusBadge status={item.Status}/></div>):<EmptyState title="Chưa có hoạt động" description="Các báo cáo và bài nộp mới sẽ hiển thị tại đây."/>}</section><section className="panel"><h3>Liên kết nhanh</h3><div className="quick-link-grid"><Link to="/student/topic-registration">Đăng ký đề tài</Link><Link to="/student/progress">Nộp báo cáo tiến độ</Link><Link to="/student/final-submissions">Nộp bài cuối kỳ</Link><Link to="/student/profile">Xem hồ sơ</Link></div></section></div></>
}
export default StudentDashboardPage
