import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ClassesPage from './pages/ClassesPage'
import ProfilePage from './pages/ProfilePage'

import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage'

import RoleRoute from './components/RoleRoute'
import { getUserRole, isLoggedIn } from './utils/auth'

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />

  return children
}

function DashboardRedirect() {
  const role = getUserRole()

  if (role === 'Admin') {
    return (
      <RoleRoute allowedRoles={['Admin']}>
        <DashboardPage />
      </RoleRoute>
    )
  }

  if (role === 'Teacher') {
    return <Navigate to="/teacher/dashboard" replace />
  }

  if (role === 'Student') {
    return <Navigate to="/student/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
            path="users"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <UsersPage />
              </RoleRoute>
            }
          />

          <Route
            path="classes"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <ClassesPage />
              </RoleRoute>
            }
          />

          <Route
            path="teacher/dashboard"
            element={
              <RoleRoute allowedRoles={['Teacher']}>
                <TeacherDashboardPage />
              </RoleRoute>
            }
          />

          <Route
            path="profile"
            element={
              <RoleRoute allowedRoles={['Admin', 'Teacher']}>
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