import { Construction } from 'lucide-react'
import { useLocation } from 'react-router-dom'
function StudentUnavailablePage(){const location=useLocation();const notification=location.pathname.includes('notification');const names=location.pathname.includes('course-classes')?'Lớp học phần':location.pathname.includes('groups')?'Nhóm của tôi':notification?'Thông báo':location.pathname.includes('result')?'Kết quả và phản hồi':'Chức năng sinh viên';return <div className="panel unavailable-state"><Construction/><h2>{names}</h2><p>{notification?'Hiện chưa có thông báo nào. Chức năng đang được cập nhật.':'Chức năng đang được cập nhật và sẽ sớm sẵn sàng.'}</p><span className="badge muted">Đang cập nhật</span></div>}
export default StudentUnavailablePage
