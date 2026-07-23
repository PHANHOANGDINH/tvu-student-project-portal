/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { BookOpen, Eye, Plus, Search, UserRoundCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getUsers } from '../../api/adminApi'
import { createAcademic, listAcademic, setAcademicStatus, updateAcademic } from '../../api/academicsApi'

const configs = {
  'academic-years': { fields: [['name','Tên năm học','text'],['startDate','Ngày bắt đầu','date'],['endDate','Ngày kết thúc','date']], columns: [['name','Tên năm học'],['startDate','Bắt đầu'],['endDate','Kết thúc']] },
  semesters: { fields: [['academicYearId','Năm học','academic-years'],['name','Tên học kỳ','text'],['code','Mã học kỳ','text'],['startDate','Ngày bắt đầu','date'],['endDate','Ngày kết thúc','date']], columns: [['code','Mã'],['name','Tên học kỳ'],['academicYearId','Năm học'],['startDate','Bắt đầu'],['endDate','Kết thúc']] },
  subjects: { fields: [['code','Mã môn học','text'],['name','Tên môn học','text'],['credits','Số tín chỉ','number'],['description','Mô tả','text']], columns: [['code','Mã môn'],['name','Tên môn học'],['credits','Tín chỉ']] },
  'course-classes': { fields: [['code','Mã lớp học phần','text'],['subjectId','Môn học','subjects'],['semesterId','Học kỳ','semesters'],['lecturerId','Giảng viên phụ trách','lecturers'],['maxStudents','Sĩ số tối đa','number'],['status','Trạng thái','status']], columns: [['code','Mã lớp'],['subjectId','Môn học'],['semesterId','Học kỳ'],['lecturerName','Giảng viên phụ trách'],['status','Trạng thái']] },
}
const resourceTitles = { academicYears:'Năm học', semesters:'Học kỳ', subjects:'Môn học', courseClasses:'Lớp học phần' }
const statusText = { ACTIVE:'Hoạt động', INACTIVE:'Đã khóa', COMPLETED:'Đã kết thúc', CANCELLED:'Đã hủy' }
const initial = { status:'ACTIVE' }
const normalizeItems = data => Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
const date = value => value ? new Date(value).toLocaleDateString('vi-VN') : '—'

export default function AcademicSummaryPage({ resource, title }) {
  const navigate = useNavigate()
  const key = resource === 'academicYears' ? 'academic-years' : resource === 'courseClasses' ? 'course-classes' : resource
  const config = configs[key] || { fields:[], columns:[] }
  const pageTitle = title || resourceTitles[resource] || 'Học vụ'
  const [items,setItems] = useState([]), [refs,setRefs] = useState({}), [form,setForm] = useState(initial)
  const [editing,setEditing] = useState(null), [open,setOpen] = useState(false), [search,setSearch] = useState('')
  const [page,setPage] = useState(1), [pages,setPages] = useState(1), [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false), [message,setMessage] = useState(null), [detail,setDetail] = useState(null), [detailTab,setDetailTab] = useState('general')

  const load = async () => {
    try {
      setLoading(true)
      setMessage(null)
      const response = await listAcademic(key,{ page,pageSize:10,search })
      setItems(normalizeItems(response?.data))
      setPages(Math.max(1,Number(response?.data?.totalPages)||1))
    } catch (error) {
      setItems([])
      setPages(1)
      setMessage({ type:'error', text:error.message || 'Không thể tải dữ liệu học vụ.' })
    } finally { setLoading(false) }
  }
  useEffect(() => { load() },[key,page])
  useEffect(() => {
    const types = [...new Set(config.fields.map(field=>field[2]).filter(type=>configs[type]))]
    const jobs = types.map(type=>listAcademic(type,{pageSize:100}).then(response=>[type,normalizeItems(response?.data)]))
    if(config.fields.some(field=>field[2]==='lecturers')) jobs.push(getUsers({role:'LECTURER',status:'ACTIVE',pageSize:100,sortBy:'fullName',sortOrder:'asc'}).then(response=>['lecturers',normalizeItems(response?.data)]))
    Promise.all(jobs).then(values=>setRefs(Object.fromEntries(values))).catch(error=>setMessage({type:'error',text:error.message||'Không thể tải dữ liệu tham chiếu.'}))
  },[key])

  const display = (item,field) => field.endsWith('Date') ? date(item?.[field]) : field==='academicYearId' ? item?.academicYearName||item?.[field] : field==='subjectId' ? item?.subjectName||item?.[field] : field==='semesterId' ? item?.semesterName||item?.[field] : field==='status' ? statusText[item?.[field]]||item?.[field] : item?.[field]??'—'
  const edit = item => { if(!item)return;const next={};config.fields.forEach(([field])=>next[field]=field.endsWith('Date')&&item[field]?String(item[field]).slice(0,10):(item[field]??''));setForm(next);setEditing(item);setOpen(true) }
  const submit = async event => { event.preventDefault();if(key==='course-classes'&&editing&&String(editing.lecturerId||'')!==String(form.lecturerId||'')&&!window.confirm('Xác nhận thay đổi giảng viên phụ trách lớp học phần?'))return;try{setSaving(true);editing?await updateAcademic(key,editing.id,form):await createAcademic(key,form);setMessage({type:'success',text:editing?'Cập nhật thành công.':'Thêm mới thành công.'});setOpen(false);setEditing(null);setForm(initial);await load()}catch(error){setMessage({type:'error',text:error.message||'Không thể lưu dữ liệu.'})}finally{setSaving(false)} }
  const closeModal = () => { setOpen(false);setEditing(null);setForm(initial) }

  return <div className="admin-page"><div className="page-title admin-page-heading"><div><span className="eyebrow">QUẢN LÝ HỌC VỤ</span><h2>{pageTitle}</h2><p>Quản lý thông tin {pageTitle.toLowerCase()} trong hệ thống.</p></div><div className="toolbar-actions">{key==='course-classes'&&<><button className="btn-light" onClick={()=>navigate('/admin/students/import')}><Users size={17}/>Danh sách sinh viên</button><button className="btn-light" onClick={()=>navigate('/admin/course-classes')}><UserRoundCheck size={17}/>Phân công giảng viên</button></>}<button className="btn-primary" onClick={()=>{setEditing(null);setForm(initial);setOpen(true)}}><Plus size={18}/>Thêm mới</button></div></div>
  {message&&<div className={`alert ${message.type}`}><span>{message.text}</span>{message.type==='error'&&<button onClick={load}>Thử lại</button>}</div>}
  <div className="panel"><form className="admin-filterbar compact" onSubmit={event=>{event.preventDefault();page===1?load():setPage(1)}}><label className="search-field"><Search size={18}/><input placeholder={`Tìm kiếm ${pageTitle.toLowerCase()}...`} value={search} onChange={event=>setSearch(event.target.value)}/></label><button className="btn-primary">Tìm kiếm</button></form>
  {loading?<div className="skeleton-list">{[1,2,3].map(value=><div key={value}/>)}</div>:!items.length?<div className="empty-state"><BookOpen size={42}/><h3>Chưa có dữ liệu</h3><p>Nhấn “Thêm mới” để bắt đầu.</p></div>:<div className="table-wrap"><table><thead><tr>{config.columns.map(column=><th key={column[0]}>{column[1]}</th>)}<th>Trạng thái sử dụng</th><th>Thao tác</th></tr></thead><tbody>{items.map(item=><tr key={item.id}>{config.columns.map(column=><td key={column[0]}>{display(item,column[0])}</td>)}<td><span className={`status-pill ${item.isActive?'active':'inactive'}`}>{item.isActive?'Hoạt động':'Đã khóa'}</span></td><td><div className="compact-actions">{key==='course-classes'&&<button onClick={()=>{setDetail(item);setDetailTab('general')}}><Eye size={15}/>Xem</button>}<button onClick={()=>edit(item)}>Sửa</button><button onClick={async()=>{if(window.confirm(`${item.isActive?'Khóa':'Mở khóa'} dữ liệu này?`)){await setAcademicStatus(key,item.id,!item.isActive);await load()}}}>{item.isActive?'Khóa':'Mở khóa'}</button></div></td></tr>)}</tbody></table></div>}
  <div className="pagination-bar"><button disabled={page<=1} onClick={()=>setPage(page-1)}>Trước</button><span>Trang {page}/{pages}</span><button disabled={page>=pages} onClick={()=>setPage(page+1)}>Sau</button></div></div>
  {detail&&<div className="modal-overlay"><div className="modal-card admin-modal class-detail-drawer"><div className="modal-header"><div><span className="eyebrow">CHI TIẾT LỚP HỌC PHẦN</span><h3>{detail.code} — {detail.subjectName}</h3></div><button onClick={()=>setDetail(null)}>×</button></div><div className="class-detail-actions"><button className="btn-primary" onClick={()=>{setDetail(null);edit(detail)}}><UserRoundCheck size={16}/>Phân công giảng viên</button><button className="btn-light" onClick={()=>navigate('/admin/students/import')}><Users size={16}/>Thêm sinh viên</button><button className="btn-light" onClick={()=>navigate('/admin/students/import')}>Nhập danh sách</button></div><div className="class-detail-tabs">{[['general','Thông tin chung'],['lecturer','Giảng viên phụ trách'],['students','Danh sách sinh viên'],['groups','Nhóm sinh viên'],['activity','Hoạt động lớp']].map(([value,label])=><button className={detailTab===value?'active':''} key={value} onClick={()=>setDetailTab(value)}>{label}</button>)}</div><div className="class-detail-body">{detailTab==='general'&&<div className="info-list">{[['Mã lớp',detail.code],['Môn học',detail.subjectName],['Học kỳ',detail.semesterName],['Sĩ số tối đa',detail.maxStudents],['Trạng thái',statusText[detail.status]||detail.status]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value||'—'}</strong></div>)}</div>}{detailTab==='lecturer'&&<div className="detail-focus"><UserRoundCheck/><h4>{detail.lecturerName||'Chưa phân công giảng viên'}</h4><p>Giảng viên được chọn từ danh sách tài khoản đang hoạt động, không nhập ID thủ công.</p></div>}{detailTab==='students'&&<div className="detail-focus"><Users/><h4>Danh sách sinh viên</h4><p>Sử dụng thao tác thêm hoặc nhập danh sách để cập nhật sinh viên của lớp.</p></div>}{detailTab==='groups'&&<div className="detail-focus"><Users/><h4>Nhóm sinh viên</h4><p>Thông tin nhóm được quản lý theo dữ liệu phát sinh của lớp.</p></div>}{detailTab==='activity'&&<div className="detail-focus"><BookOpen/><h4>Hoạt động lớp</h4><p>Hoạt động được ghi nhận theo quá trình sử dụng lớp học phần.</p></div>}</div></div></div>}
  {open&&<div className="modal-overlay"><div className="modal-card admin-modal"><div className="modal-header"><div><span className="eyebrow">{editing?'CẬP NHẬT':'THÊM MỚI'}</span><h3>{pageTitle}</h3></div><button onClick={closeModal}>×</button></div><form onSubmit={submit}><div className="form-grid">{config.fields.map(([field,label,type])=><label key={field}>{label}{configs[type]?<select required value={form[field]||''} onChange={event=>setForm({...form,[field]:event.target.value})}><option value="">-- Chọn --</option>{(refs[type]||[]).map(option=><option key={option.id} value={option.id}>{option.code?`${option.code} — `:''}{option.name}</option>)}</select>:type==='lecturers'?<select value={form[field]||''} onChange={event=>setForm({...form,[field]:event.target.value})}><option value="">Chưa phân công</option>{(refs.lecturers||[]).map(option=><option key={option.id} value={option.id}>{option.userCode} — {option.fullName} — {option.email}</option>)}</select>:type==='status'?<select value={form[field]||'ACTIVE'} onChange={event=>setForm({...form,[field]:event.target.value})}>{Object.entries(statusText).map(([value,labelText])=><option key={value} value={value}>{labelText}</option>)}</select>:<input required={!['description','maxStudents'].includes(field)} type={type} value={form[field]||''} onChange={event=>setForm({...form,[field]:event.target.value})}/>}</label>)}</div><div className="modal-actions"><button type="button" className="btn-light" onClick={closeModal}>Hủy</button><button className="btn-primary" disabled={saving}>{saving?'Đang lưu...':'Lưu thay đổi'}</button></div></form></div></div>}</div>
}
