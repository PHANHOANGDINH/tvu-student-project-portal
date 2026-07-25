export function semesterCode(semester){
 const text=`${semester?.code||''} ${semester?.name||''}`.toLocaleLowerCase('vi'),term=text.includes('hè')||text.includes('he')?3:/\b2\b/.test(text)?2:1,years=String(semester?.academicYearName||'').match(/(20\d{2}).*?(20\d{2})/)
 return years?`${term}${years[1].slice(-2)}${years[2].slice(-2)}`:'—'
}
export function courseClassCodePreview(semester,subject,sectionNumber=1){const code=semesterCode(semester);return code==='—'?'—':`${code}-${subject?.code||'—'}-${String(sectionNumber||1).padStart(2,'0')}`}
