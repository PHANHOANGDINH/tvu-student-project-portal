import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, FileCheck2, FolderClock, GraduationCap, Layers3, School, ShieldCheck, Sparkles, UserRoundCog, UsersRound } from 'lucide-react'
import PublicFooter from '../components/PublicFooter'
import PublicHeader from '../components/PublicHeader'

const features = [
  [Layers3, 'Quản lý lớp học phần', 'Tổ chức lớp học, thành viên và hoạt động học tập theo từng học kỳ.'],
  [UsersRound, 'Quản lý nhóm sinh viên', 'Hỗ trợ thành lập nhóm và theo dõi thông tin thành viên minh bạch.'],
  [BookOpen, 'Đăng ký và duyệt đề tài', 'Kết nối sinh viên với đề tài, giảng viên và quy trình phê duyệt.'],
  [ClipboardCheck, 'Theo dõi yêu cầu nộp', 'Tập trung thời hạn, yêu cầu và trạng thái hoàn thành tại một nơi.'],
  [FolderClock, 'Nộp bài và lưu lịch sử', 'Quản lý phiên bản bài nộp và tra cứu lịch sử thuận tiện.'],
  [FileCheck2, 'Chấm điểm và phản hồi', 'Ghi nhận kết quả, tiêu chí đánh giá và phản hồi rõ ràng.']
]
const roles = [[UserRoundCog, 'Quản trị viên', 'Quản lý hệ thống, tài khoản, học vụ và lớp học phần.'], [School, 'Giảng viên', 'Quản lý lớp phụ trách, đề tài, yêu cầu nộp và chấm điểm.'], [GraduationCap, 'Sinh viên', 'Tham gia lớp, lập nhóm, đăng ký đề tài, nộp bài và xem kết quả.']]
const steps = ['Đăng nhập', 'Tham gia lớp', 'Lập nhóm và đăng ký đề tài', 'Nhận yêu cầu nộp', 'Nộp bài', 'Nhận phản hồi và kết quả']

export default function PublicLandingPage() {
  return <div className="public-page"><PublicHeader /><main>
    <section className="public-hero" id="trang-chu"><div className="public-hero-copy"><span className="public-eyebrow"><Sparkles /> Không gian học tập số của TVU</span><h1>Đồng hành cùng hành trình <em>hoàn thành đồ án</em> của bạn</h1><p>Nền tảng hỗ trợ quản lý lớp học phần, nhóm sinh viên, đề tài, bài nộp và kết quả một cách hiệu quả, liền mạch.</p><div className="public-hero-actions"><Link className="public-button primary" to="/login">Đăng nhập hệ thống <ArrowRight /></Link><a className="public-button secondary" href="#huong-dan">Xem hướng dẫn</a></div><div className="public-trust"><CheckCircle2 /> Dành riêng cho cộng đồng học tập Đại học Trà Vinh</div></div>
    <div className="public-hero-visual" aria-hidden="true"><div className="portal-preview"><div className="preview-top"><span/><span/><span/></div><div className="preview-body"><div className="preview-sidebar"><b>TVU</b><i/><i/><i/></div><div className="preview-main"><span>Xin chào, sinh viên!</span><strong>Tiến độ học tập</strong><div className="preview-progress"><i/></div><div className="preview-cards"><b/><b/><b/></div></div></div></div><div className="hero-float-card"><ShieldCheck/><span><strong>An toàn và tập trung</strong>Thông tin học tập được tổ chức rõ ràng</span></div></div></section>
    <section className="public-section" id="gioi-thieu"><div className="public-section-heading"><span>Khám phá nền tảng</span><h2>Hệ thống hỗ trợ những gì?</h2><p>Các công cụ thiết yếu giúp hoạt động quản lý đồ án nhất quán từ khi bắt đầu đến lúc đánh giá kết quả.</p></div><div className="feature-grid">{features.map(([Icon,title,description],index)=><article className="feature-card" key={title}><span className="feature-number">0{index+1}</span><Icon/><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="public-role-section"><div className="public-section-heading light"><span>Một nền tảng, nhiều vai trò</span><h2>Được thiết kế dành cho ai?</h2></div><div className="role-grid">{roles.map(([Icon,title,description])=><article className="role-card" key={title}><span><Icon/></span><h3>{title}</h3><p>{description}</p><Link to="/login">Truy cập hệ thống <ArrowRight/></Link></article>)}</div></section>
    <section className="public-section public-process" id="huong-dan"><div className="public-section-heading"><span>Đơn giản và liền mạch</span><h2>Quy trình sử dụng</h2><p>Sáu bước rõ ràng giúp sinh viên chủ động theo dõi toàn bộ hành trình thực hiện đồ án.</p></div><div className="process-list">{steps.map((step,index)=><div className="process-step" key={step}><strong>{String(index+1).padStart(2,'0')}</strong><span>{step}</span></div>)}</div><div className="public-cta"><div><span>Sẵn sàng bắt đầu?</span><h2>Truy cập không gian học tập của bạn ngay hôm nay.</h2></div><Link className="public-button white" to="/login">Đăng nhập ngay <ArrowRight/></Link></div></section>
  </main><PublicFooter/></div>
}
