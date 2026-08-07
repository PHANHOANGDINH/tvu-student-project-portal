import { useEffect, useState } from 'react'
import { Select } from 'antd'
import { listGroups } from '../../api/groupsApi'
import { listLecturerCourseClasses } from '../../api/academicsApi'
import { formatGroupName } from '../../utils/formatters'

export default function LecturerGroupsPage() {
  const initialClass = new URLSearchParams(window.location.search).get('courseClassId') || ''
  const [classId,setClassId]=useState(initialClass),[classes,setClasses]=useState([]),[items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
  const load=async value=>{if(!value){setItems([]);return}setLoading(true);try{setError('');setItems((await listGroups(value)).data||[])}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{listLecturerCourseClasses({pageSize:100}).then(response=>setClasses(response.data.items||[])).catch(()=>setError('Không tải được danh sách lớp phụ trách.')).finally(()=>setLoading(false));if(initialClass)load(initialClass)},[])
  return <div><div className="page-title"><h2>Nhóm sinh viên</h2><p>Chỉ hiển thị nhóm thuộc lớp bạn phụ trách.</p></div>{error&&<div className="alert error">{error}</div>}<div className="panel group-management"><label className="form-field-ui"><span>Lớp học phần</span><Select showSearch allowClear loading={loading} optionFilterProp="label" placeholder="Chọn lớp học phần" value={classId||undefined} options={classes.map(item=>({value:item.id,label:`${item.code} — ${item.subjectName}`}))} onChange={value=>{setClassId(value||'');load(value)}} /></label><div className="table-wrap"><table><thead><tr><th>Nhóm</th><th>Lớp</th><th>Trưởng nhóm</th><th>Thành viên</th></tr></thead><tbody>{items.map(group=><tr key={group.id}><td><strong>{formatGroupName(group.name)}</strong></td><td>{group.classCode}</td><td>{group.leaderName}</td><td>{group.memberCount}/{group.maxMembers} thành viên</td></tr>)}{!items.length&&!loading&&<tr><td colSpan="4">Chưa có dữ liệu.</td></tr>}</tbody></table></div></div></div>
}
