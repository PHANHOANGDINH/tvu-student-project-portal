import{request}from'./http'
export const availableCourseClasses=()=>request('/student/course-class-enrollment/available')
export const selfEnroll=id=>request(`/student/course-class-enrollment/${id}`,{method:'POST'})
export const selfWithdraw=id=>request(`/student/course-class-enrollment/${id}`,{method:'DELETE'})
export const transferCourseEnrollment=data=>request('/admin/course-enrollments/transfer',{method:'POST',body:JSON.stringify(data)})
