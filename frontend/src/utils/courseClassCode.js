const years=name=>String(name||'').match(/(20\d{2}).*?(20\d{2})/)
export function semesterCode(semester){const text=`${semester?.code||''} ${semester?.name||''}`.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{Diacritic}/gu,''),match=years(semester?.academicYearName);if(!match)return'—';return`${text.includes('he')?3:/\b2\b/.test(text)?2:1}${match[1].slice(-2)}${match[2].slice(-2)}`}
export function courseClassCodePreview(semester,subject,section=1){const sem=semesterCode(semester);return sem==='—'?'—':`${sem}-${subject?.code||'—'}-${String(section||1).padStart(2,'0')}`}
