import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import './group.css'

import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'

import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ClassesPage from './pages/ClassesPage'
import ProfilePage from './pages/ProfilePage'

import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage'
import LecturerGroupsPage from './pages/teacher/LecturerGroupsPage'
import LecturerTopicRegistrationsPage from './pages/teacher/LecturerTopicRegistrationsPage'
import StudentGroupsPage from './pages/student/StudentGroupsPage'
import TopicRegistrationPage from './pages/student/TopicRegistrationPage'
import LecturerSubmissionRequirementsPage from './pages/teacher/SubmissionRequirementsPage'
import StudentSubmissionRequirementsPage from './pages/student/SubmissionRequirementsPage'
import StudentSubmissionsPage from './pages/student/SubmissionsPage'
import SubmitRequirementPage from './pages/student/SubmitRequirementPage'
import SubmissionHistoryPage from './pages/student/SubmissionHistoryPage'
import LecturerSubmissionsPage from './pages/teacher/SubmissionsPage'
import LecturerSubmissionDetailPage from './pages/teacher/SubmissionDetailPage'
import SubmissionReviewPage from './pages/teacher/SubmissionReviewPage'
import EvaluationCriteriaPage from './pages/teacher/EvaluationCriteriaPage'
import SubmissionResultPage from './pages/student/SubmissionResultPage'

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
        <DashboardPage />
      </RoleRoute>
    )
  }

  if (role === USER_ROLES.LECTURER) {
    return <Navigate to="/teacher/dashboard" replace />
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
        <Route path="/register" element={<Navigate to="/login" replace />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRedirect />} />

          <Route
            path="admin/users"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <UsersPage />
              </RoleRoute>
            }
          />
          <Route path="users" element={<Navigate to="/admin/users" replace />} />

          <Route
            path="classes"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <ClassesPage />
              </RoleRoute>
            }
          />

          <Route
            path="teacher/dashboard"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.LECTURER]}>
                <TeacherDashboardPage />
              </RoleRoute>
            }
          />

          <Route path="student/groups" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentGroupsPage /></RoleRoute>} />
          <Route path="student/groups/my-group" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentGroupsPage /></RoleRoute>} />
          <Route path="student/topic-registration" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><TopicRegistrationPage /></RoleRoute>} />
          <Route path="lecturer/groups" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerGroupsPage /></RoleRoute>} />
          <Route path="lecturer/topic-registrations" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerTopicRegistrationsPage /></RoleRoute>} />

          <Route path="lecturer/submission-requirements" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerSubmissionRequirementsPage /></RoleRoute>} />
          <Route path="student/submission-requirements" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentSubmissionRequirementsPage /></RoleRoute>} />

          <Route path="student/submissions" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentSubmissionsPage /></RoleRoute>} />
          <Route path="student/submission-requirements/:id/submit" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><SubmitRequirementPage /></RoleRoute>} />
          <Route path="student/submissions/:id/history" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><SubmissionHistoryPage /></RoleRoute>} />
          <Route path="lecturer/submissions" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerSubmissionsPage /></RoleRoute>} />
          <Route path="lecturer/submissions/:id" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><LecturerSubmissionDetailPage /></RoleRoute>} />

          <Route path="lecturer/submissions/:id/review" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><SubmissionReviewPage /></RoleRoute>} />
          <Route path="lecturer/submission-requirements/:id/criteria" element={<RoleRoute allowedRoles={[USER_ROLES.LECTURER]}><EvaluationCriteriaPage /></RoleRoute>} />
          <Route path="student/submissions/:id/result" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><SubmissionResultPage /></RoleRoute>} />

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
