import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'

import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import AcademicYearsPage from './pages/AcademicYearsPage'
import SemestersPage from './pages/SemestersPage'
import SubjectsPage from './pages/SubjectsPage'
import CourseClassesPage from './pages/CourseClassesPage'
import ProfilePage from './pages/ProfilePage'

import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage'

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
            path="admin/academic-years"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AcademicYearsPage />
              </RoleRoute>
            }
          />

          <Route
            path="admin/semesters"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <SemestersPage />
              </RoleRoute>
            }
          />

          <Route
            path="admin/subjects"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <SubjectsPage />
              </RoleRoute>
            }
          />

          <Route
            path="admin/course-classes"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <CourseClassesPage mode="admin" />
              </RoleRoute>
            }
          />
          <Route path="classes" element={<Navigate to="/admin/course-classes" replace />} />

          <Route
            path="teacher/dashboard"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.LECTURER]}>
                <TeacherDashboardPage />
              </RoleRoute>
            }
          />

          <Route
            path="lecturer/course-classes"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.LECTURER]}>
                <CourseClassesPage mode="lecturer" />
              </RoleRoute>
            }
          />

          <Route
            path="student/course-classes"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.STUDENT]}>
                <CourseClassesPage mode="student" />
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

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
