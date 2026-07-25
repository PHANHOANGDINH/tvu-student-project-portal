import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'

import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ClassesPage from './pages/ClassesPage'
import ProfilePage from './pages/ProfilePage'

import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage'
import StudentDashboardPage from './pages/student/StudentDashboardPage'
import StudentProjectsPage from './pages/student/StudentProjectsPage'
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

          <Route
            path="profile"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.LECTURER, USER_ROLES.STUDENT]}>
                <ProfilePage />
              </RoleRoute>
            }
          />
          <Route path="student/dashboard" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentDashboardPage /></RoleRoute>} />
          <Route path="student/topic-registration" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentProjectsPage /></RoleRoute>} />
          <Route path="student/projects" element={<Navigate to="/student/topic-registration" replace />} />
          <Route path="student/progress" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentReportsPage type="progress" /></RoleRoute>} />
          <Route path="student/final-submissions" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentReportsPage type="final" /></RoleRoute>} />
          <Route path="student/submissions" element={<Navigate to="/student/final-submissions" replace />} />
          <Route path="student/course-classes/*" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentUnavailablePage /></RoleRoute>} />
          <Route path="student/groups/*" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentUnavailablePage /></RoleRoute>} />
          <Route path="student/submission-requirements/*" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentUnavailablePage /></RoleRoute>} />
          <Route path="student/submissions/:id/history" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentUnavailablePage /></RoleRoute>} />
          <Route path="student/submissions/:id/result" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentUnavailablePage /></RoleRoute>} />
          <Route path="student/notifications" element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT]}><StudentUnavailablePage /></RoleRoute>} />
          <Route path="student/profile" element={<Navigate to="/profile" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
