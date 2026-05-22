import { useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import io from 'socket.io-client'
import './App.css'

// Context Providers
import { useAuth } from './contexts/AuthContext'
import { PerformanceProvider } from './contexts/PerformanceContext'

// Pages + Components
import Nav from './components/Nav/Nav'
import SignUp from './pages/auth/SignUp'
import SignIn from './pages/auth/SignIn'
import Landing from './pages/Landing/Landing'
import Testing from './pages/Testing/Testing'
import Study from './pages/Study/Study'
import Profile from './pages/Profile/Profile'
import Chat from './components/Chat/Chat'
import MonitoringDashboard from './components/MonitoringDashboard/MonitoringDashboard'
import TeacherDashboard from './components/TeacherDashboard/TeacherDashboard'
import StudentPracticeMode from './components/StudentPractice/StudentPracticeMode'

const socket = io.connect('http://localhost:3000')

/**
 * The main component of the application.
 *
 * @component
 * @returns {JSX.Element} The rendered App component
 */
const App = () => {
  const navigate = useNavigate()
  const { user, refreshUser, logout } = useAuth()
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState('')

  const isAdmin = Boolean(user?.isAdmin)
  const isTeacher = isAdmin || user?.role === 'teacher'
  const isStudent = user?.role === 'student'
  const canAccessTesting = isTeacher || isStudent

  const renderProtectedRoute = (element) =>
    user ? element : <Navigate to="/signin" replace />

  const renderRoleProtectedRoute = (allowed, element) =>
    allowed ? element : <Navigate to={user ? '/' : '/signin'} replace />

  const handleSignupOrLogin = async () => {
    refreshUser()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <PerformanceProvider>
      <div className="App">
        <Nav user={user} handleLogout={handleLogout} />
        {user && (import.meta.env.DEV || isAdmin) && <MonitoringDashboard />}
        <Routes>
          <Route path="/" element={<Landing user={user} />} />
          <Route
            path="/signin"
            element={<SignIn handleSignupOrLogin={handleSignupOrLogin} />}
          />
          <Route
            path="/signup"
            element={<SignUp handleSignupOrLogin={handleSignupOrLogin} />}
          />
          <Route
            path="/study"
            element={renderProtectedRoute(<Study user={user} />)}
          />
          <Route
            path="/testing"
            element={renderRoleProtectedRoute(
              canAccessTesting,
              <Testing
                user={user}
                username={username}
                setUsername={setUsername}
                room={room}
                setRoom={setRoom}
                socket={socket}
              />
            )}
          />
          <Route
            path="/chat"
            element={renderRoleProtectedRoute(
              canAccessTesting,
              <Chat
                user={user}
                username={username}
                room={room}
                socket={socket}
              />
            )}
          />
          <Route
            path="/profile"
            element={renderProtectedRoute(<Profile user={user} />)}
          />
          <Route
            path="/teacher-dashboard"
            element={renderRoleProtectedRoute(
              isTeacher,
              <TeacherDashboard user={user} />
            )}
          />
          <Route
            path="/student-practice"
            element={renderRoleProtectedRoute(
              isStudent,
              <StudentPracticeMode user={user} />
            )}
          />

          {/* <Route path='/admin' element={<Admin user={user} />} /> */}
        </Routes>
      </div>
    </PerformanceProvider>
  )
}

export default App
