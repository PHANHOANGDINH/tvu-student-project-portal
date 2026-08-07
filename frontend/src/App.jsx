import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import './group.css'
import './notifications.css'
import './theme.css'

import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'

import UsersPage from './pages/UsersPage'
import ProfilePage from './pages/ProfilePage'

// Admin & Shared Components
import RoleDashboardPage from './pages/dashboards/RoleDashboardPage'
import AcademicSummaryPage from './pages/admin/AcademicSummaryPage'
import BulkStudentImportPage from './pages/admin/BulkStudentImportPage'
import BulkLecturerImportPage from './pages/admin/BulkLecturerImportPage'
import OrganizationManagementPage from './pages/admin/OrganizationManagementPage'

// Teacher/Lecturer Pages
import LecturerGroupsPage from './pages/teacher/LecturerGroupsPage'
import LecturerTopicRegistrationsPage from './pages/teacher/LecturerTopicRegistrationsPage'
import LecturerSubmissionRequirementsPage from './pages/teacher/SubmissionRequirementsPage'
import LecturerSubmissionsPage from './pages/teacher/SubmissionsPage'
import LecturerSubmissionDetailPage from './pages/teacher/SubmissionDetailPage'
import SubmissionReviewPage from './pages/teacher/SubmissionReviewPage'
import EvaluationCriteriaPage from './pages/teacher/EvaluationCriteriaPage'
import LecturerCourseClassesPage from './pages/teacher/LecturerCourseClassesPage'

// Student Pages
import StudentGroupsPage from './pages/student/StudentGroupsPage'
import TopicRegistrationPage from './pages/student/TopicRegistrationPage'
import StudentSubmissionRequirementsPage from './pages/student/SubmissionRequirementsPage'
import StudentSubmissionsPage from './pages/student/SubmissionsPage'
import SubmitRequirementPage from './pages/student/SubmitRequirementPage'
import SubmissionHistoryPage from './pages/student/SubmissionHistoryPage'
import SubmissionResultPage from './pages/student/SubmissionResultPage'
import StudentCourseClassesPage from './pages/student/StudentCourseClassesPage'
import StudentReportsPage from './pages/student/StudentReportsPage'
import StudentUnavailablePage from './pages/student/StudentUnavailablePage'

import RoleRoute from './components/RoleRoute'
import { USER_ROLES } from './constants/roles'
import { getUserRole, isLoggedIn } from './utils/auth'

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />

  return children
}

function DashboardRedirect() {
  const role = getUserRole()

  if (role === USER_ROLES.ADMIN) {
    return (
      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
        <RoleDashboardPage role="admin" title="Tổng quan quản trị" />
      </RoleRoute>
    )
  }

  if (role === USER_ROLES.LECTURER) {
    return <Navigate to="/lecturer/dashboard" replace />
  }

  if (role === USER_ROLES.STUDENT) {
    return <Navigate to="/student/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRedirect />} />

          {/* Admin Routes */}
          <Route
            path="admin/users"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <UsersPage />
              </RoleRoute>
            }
          />
          <Route path="admin/users/new" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><UsersPage /></RoleRoute>} />

          <Route
            path="admin/course-classes"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AcademicSummaryPage resource="courseClasses" title="Lớp học phần" />
              </RoleRoute>
            }
          />

          <Route path="admin/academic-years" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><AcademicSummaryPage resource="academicYears" title="Năm học" /></RoleRoute>} />
          <Route path="admin/semesters" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><AcademicSummaryPage resource="semesters" title="Học kỳ" /></RoleRoute>} />
          <Route path="admin/subjects" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><AcademicSummaryPage resource="subjects" title="Môn học" /></RoleRoute>} />
          <Route path="admin/faculties" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><OrganizationManagementPage type="faculties" /></RoleRoute>} />
          <Route path="admin/administrative-classes" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><OrganizationManagementPage type="classes" /></RoleRoute>} />
          <Route path="admin/students/import" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><BulkStudentImportPage /></RoleRoute>} />
          <Route path="admin/lecturers/import" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><BulkLecturerImportPage /></RoleRoute>} />
          <Route path="admin/dashboard" element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><RoleDashboardPage role="admin" title="Tổng quan quản trị" /></RoleRoute>} />

          {/* Lecturer Routes */}
          <Route path="lecturer/dashboard" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><RoleDashboardPage role="lecturer" title="Dashboard Giảng viên" /></RoleRoute>} />
          <Route path="lecturer/course-classes" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerCourseClassesPage /></RoleRoute>} />
          <Route path="lecturer/course-classes/:id" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerCourseClassesPage /></RoleRoute>} />
          <Route path="lecturer/groups" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerGroupsPage /></RoleRoute>} />
          <Route path="lecturer/topic-registrations" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerTopicRegistrationsPage /></RoleRoute>} />
          <Route path="lecturer/submission-requirements" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerSubmissionRequirementsPage /></RoleRoute>} />
          <Route path="lecturer/submissions" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerSubmissionsPage /></RoleRoute>} />
          <Route path="lecturer/submissions/:id" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerSubmissionDetailPage /></RoleRoute>} />
          <Route path="lecturer/submissions/:id/review" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><SubmissionReviewPage /></RoleRoute>} />
          <Route path="lecturer/submission-requirements/:id/criteria" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><EvaluationCriteriaPage /></RoleRoute>} />

          {/* Student Routes */}
          <Route path="student/dashboard" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><RoleDashboardPage role="student" title="Dashboard Sinh viên" /></RoleRoute>} />
          <Route path="student/course-classes" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentCourseClassesPage /></RoleRoute>} />
          <Route path="student/course-classes/:id" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentCourseClassesPage /></RoleRoute>} />
          <Route path="student/groups" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentGroupsPage /></RoleRoute>} />
          <Route path="student/groups/my-group" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentGroupsPage /></RoleRoute>} />
          <Route path="student/topic-registration" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><TopicRegistrationPage /></RoleRoute>} />
          <Route path="student/projects" element={<Navigate to="/student/topic-registration" replace />} />
          <Route path="student/submission-requirements" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentSubmissionRequirementsPage /></RoleRoute>} />
          <Route path="student/submissions" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentSubmissionsPage /></RoleRoute>} />
          <Route path="student/submission-requirements/:id/submit" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><SubmitRequirementPage /></RoleRoute>} />
          <Route path="student/submissions/:id/history" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><SubmissionHistoryPage /></RoleRoute>} />
          <Route path="student/submissions/:id/result" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><SubmissionResultPage /></RoleRoute>} />
          <Route path="student/progress" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentReportsPage type="progress" /></RoleRoute>} />
          <Route path="student/final-submissions" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentReportsPage type="final" /></RoleRoute>} />
          <Route path="student/notifications" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentUnavailablePage /></RoleRoute>} />
          <Route path="student/profile" element={<Navigate to="/profile" replace />} />

          {/* Shared Routes */}
          <Route
            path="profile"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.LECTURER, USER_ROLES.STUDENT]}>
                <ProfilePage />
              </RoleRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
