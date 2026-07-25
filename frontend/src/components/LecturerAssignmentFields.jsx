import { useMemo, useState } from 'react'

const optionText = lecturer =>
  `${lecturer.userCode || '—'} — ${lecturer.fullName} — ${lecturer.email}`

export default function LecturerAssignmentFields({
  lecturers,
  primaryId,
  coLecturerIds,
  onPrimaryChange,
  onCoLecturersChange,
  disabled,
}) {
  const [search,setSearch]=useState(''),[primarySearch,setPrimarySearch]=useState('')
  const selected=useMemo(()=>new Set(coLecturerIds.map(String)),[coLecturerIds])
  const available=useMemo(() => {
    const term=search.trim().toLocaleLowerCase('vi')
    return lecturers.filter(item => String(item.id)!==String(primaryId) && !selected.has(String(item.id)))
      .filter(item => !term || [item.userCode,item.fullName,item.email].some(value=>String(value||'').toLocaleLowerCase('vi').includes(term)))
  },[lecturers,primaryId,search,selected])
  const chosen=coLecturerIds.map(id=>lecturers.find(item=>String(item.id)===String(id))).filter(Boolean)

  return <section className="lecturer-assignment-fields">
    <h4>Giảng viên giảng dạy</h4>
    <label>Giảng viên chính
      <input disabled={disabled} placeholder="Tìm theo mã, tên hoặc email" list="primary-lecturers" value={primarySearch||(primaryId ? optionText(lecturers.find(x=>String(x.id)===String(primaryId))||{}) : '')} onChange={event=>{
        setPrimarySearch(event.target.value)
        const lecturer=lecturers.find(item=>optionText(item)===event.target.value)
        if(lecturer||!event.target.value)onPrimaryChange(lecturer?.id||'')
      }}/>
      <datalist id="primary-lecturers">{lecturers.filter(x=>!selected.has(String(x.id))).map(item=><option key={item.id} value={optionText(item)}/>)}</datalist>
    </label>
    <label>Giảng viên phối hợp
      <input disabled={disabled} value={search} onChange={event=>setSearch(event.target.value)} placeholder="Tìm theo mã, tên hoặc email"/>
    </label>
    {search&&<div className="lecturer-search-results">{available.length?available.map(item=><button type="button" key={item.id} onClick={()=>{onCoLecturersChange([...coLecturerIds,item.id]);setSearch('')}}>{optionText(item)}</button>):<p>Không tìm thấy giảng viên phù hợp.</p>}</div>}
    <div className="lecturer-chips">{chosen.map(item=><span key={item.id}>{item.userCode} — {item.fullName}<button type="button" disabled={disabled} aria-label={`Gỡ ${item.fullName}`} onClick={()=>onCoLecturersChange(coLecturerIds.filter(id=>String(id)!==String(item.id)))}>×</button></span>)}</div>
  </section>
}
