import{useMemo,useState}from'react'
const text=x=>`${x.userCode||'—'} — ${x.fullName} — ${x.email}`
export default function LecturerAssignmentFields({lecturers,coLecturerIds,onCoLecturersChange,disabled}){
 const[search,setSearch]=useState(''),selected=useMemo(()=>new Set(coLecturerIds.map(String)),[coLecturerIds]),term=search.trim().toLocaleLowerCase('vi')
 const available=lecturers.filter(x=>!selected.has(String(x.id))&&(!term||[x.userCode,x.fullName,x.email].some(v=>String(v||'').toLocaleLowerCase('vi').includes(term))))
 const chosen=coLecturerIds.map(id=>lecturers.find(x=>String(x.id)===String(id))).filter(Boolean)
 return <section className="lecturer-assignment-fields"><h4>Giảng viên giảng dạy</h4><label>Tìm giảng viên<input disabled={disabled} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo mã, tên hoặc email"/></label>{search&&<div className="lecturer-search-results">{available.length?available.map(x=><button type="button" key={x.id} onClick={()=>{onCoLecturersChange([...coLecturerIds,x.id]);setSearch('')}}>{text(x)}</button>):<p>Không tìm thấy giảng viên phù hợp.</p>}</div>}<div className="lecturer-chips">{chosen.map(x=><span key={x.id}>{x.userCode} — {x.fullName}<button type="button" disabled={disabled} onClick={()=>onCoLecturersChange(coLecturerIds.filter(id=>String(id)!==String(x.id)))}>×</button></span>)}</div></section>
}
