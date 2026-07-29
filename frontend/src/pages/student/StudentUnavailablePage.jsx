import { Construction } from 'lucide-react'
import { useLocation } from 'react-router-dom'
function StudentUnavailablePage(){const location=useLocation();const names=location.pathname.includes('course-classes')?'Lớp học phần':location.pathname.includes('groups')?'Nhóm của tôi':location.pathname.includes('notification')?'Thông báo':location.pathname.includes('result')?'Kết quả và phản hồi':'Chức năng sinh viên';return <div className="panel unavailable-state"><Construction/><h2>{names}</h2><p>Backend hiện chưa cung cấp API cho chức năng này. Giao diện sẽ được kích hoạt khi dữ liệu thật sẵn sàng.</p><span className="badge muted">Chưa khả dụng</span></div>}
export default StudentUnavailablePage
