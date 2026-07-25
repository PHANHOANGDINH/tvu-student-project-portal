const lastTwo=value=>String(value).slice(-2).padStart(2,'0')
export function buildSemesterCode({semesterName='',semesterCode='',academicYearName='',academicYearStartDate,academicYearEndDate}){
 const text=`${semesterCode} ${semesterName}`.toLocaleLowerCase('vi')
 const normalized=text.normalize('NFD').replace(/\p{Diacritic}/gu,'')
 const term=normalized.includes('he')?3:/\b2\b/.test(normalized)?2:1
 const years=String(academicYearName).match(/(20\d{2}).*?(20\d{2})/)
 const start=years?.[1]||new Date(academicYearStartDate).getUTCFullYear()
 const end=years?.[2]||new Date(academicYearEndDate).getUTCFullYear()
 if(!start||!end)throw new Error('INVALID_ACADEMIC_YEAR')
 return `${term}${lastTwo(start)}${lastTwo(end)}`
}
export const buildCourseClassCode=({semesterCode,subjectCode,sectionNumber})=>`${semesterCode}-${String(subjectCode).trim().toUpperCase()}-${String(sectionNumber).padStart(2,'0')}`

export const getNextSectionNumber=maxSection=>Number(maxSection||0)+1
