import { useState, useEffect, useCallback } from 'react'
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation
} from 'react-router-dom'
import io from 'socket.io-client'
import './App.css'
import { SOCKET_URL } from './config/runtime'
import { getToken } from './services/tokenService'

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
import Practice from './pages/Practice/Practice'
import MyProgress from './pages/MyProgress/MyProgress'
import AccessibilitySettings from './components/AccessibilitySettings/AccessibilitySettings'
import ClassProgress from './pages/Teacher/ClassProgress'
import Assignments from './pages/Teacher/Assignments'
import StudentDetail from './pages/Teacher/StudentDetail'
import Benchmark from './pages/Teacher/Benchmark'
import PrintPackets from './pages/Teacher/PrintPackets'
import Insights from './pages/Teacher/Insights'

// The socket only connects once someone is signed in, and sends the same JWT
// the REST API uses (the server rejects unauthenticated sockets).
const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() })
})

const generateSessionCode = () =>
  `SESSION-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const getPresenceContext = (pathname, role) => {
  if (pathname.startsWith('/teacher-dashboard')) return 'teacher-dashboard'
  if (pathname.startsWith('/student-practice')) return 'practice-lobby'
  if (pathname.startsWith('/testing')) return 'testing-lobby'
  if (pathname.startsWith('/study'))
    return role === 'student' ? 'study' : 'online'
  if (pathname.startsWith('/profile')) return 'profile'
  if (pathname.startsWith('/chat')) return 'chat'
  return 'online'
}

const buildPresencePayload = (user, pathname, overrides = {}) => ({
  profileId: user?.profile || user?._id,
  user: {
    _id: user?._id,
    profile: user?.profile,
    name: user?.name,
    role: user?.role,
    isAdmin: user?.isAdmin
  },
  status: 'online',
  currentPath: overrides.currentPath || pathname,
  context: overrides.context || getPresenceContext(pathname, user?.role),
  practiceMode: null,
  practiceSessionActive: false,
  currentWord: null,
  wordsCompleted: 0,
  totalWords: 0,
  isListening: false,
  room: null,
  invitedRoom: null,
  ...overrides
})

/**
 * The main component of the application.
 *
 * @component
 * @returns {JSX.Element} The rendered App component
 */
const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser, logout } = useAuth()
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState('')
  const [autoJoinSession, setAutoJoinSession] = useState(null)

  const isAdmin = Boolean(user?.isAdmin)
  const isTeacher = isAdmin || user?.role === 'teacher'
  const isStudent = user?.role === 'student'
  // Teachers and parents both look after students
  const isEducator = isTeacher || user?.role === 'parent'
  const canAccessTesting = isTeacher || isStudent

  const renderProtectedRoute = (element) =>
    user ? element : <Navigate to="/signin" replace />

  const renderRoleProtectedRoute = (allowed, element) =>
    allowed ? element : <Navigate to={user ? '/' : '/signin'} replace />

  const emitPresence = useCallback(
    (eventName, overrides = {}) => {
      if (!user || !socket.connected) return

      socket.emit(
        eventName,
        buildPresencePayload(user, location.pathname, overrides)
      )
    },
    [user, location.pathname]
  )

  // Connect when signed in; reconnect with the new token when the user changes
  useEffect(() => {
    if (user) {
      if (socket.connected) socket.disconnect()
      socket.connect()
    } else if (socket.connected) {
      socket.disconnect()
    }
  }, [user?._id])

  useEffect(() => {
    if (!user) return undefined

    const registerPresence = () => {
      socket.emit(
        'register_presence',
        buildPresencePayload(user, location.pathname)
      )
    }

    socket.on('connect', registerPresence)

    if (socket.connected) {
      registerPresence()
    }

    return () => {
      socket.off('connect', registerPresence)
    }
  }, [user, location.pathname])

  useEffect(() => {
    emitPresence('update_presence')
  }, [emitPresence])

  useEffect(() => {
    if (!user || user.role !== 'student') return undefined

    const handleTestingCenterInvitation = (invitation) => {
      if (!invitation?.room) return

      setRoom(invitation.room)
      setAutoJoinSession({
        room: invitation.room,
        teacherName: invitation.teacherName || '',
        sentAt: invitation.sentAt || Date.now(),
        source: 'teacher-invite'
      })
      navigate('/testing')
    }

    socket.on('testing_center_invitation', handleTestingCenterInvitation)

    return () => {
      socket.off('testing_center_invitation', handleTestingCenterInvitation)
    }
  }, [user, navigate])

  const handleSignupOrLogin = async () => {
    refreshUser()
  }

  const handleLogout = async () => {
    if (user && socket.connected) {
      socket.emit('unregister_presence')
    }

    setAutoJoinSession(null)
    setRoom('')
    await logout()
    navigate('/')
  }

  const clearAutoJoinSession = useCallback(() => {
    setAutoJoinSession(null)
  }, [])

  const handleLaunchTestingCenter = useCallback(
    ({ studentProfileIds = [], room: requestedRoom } = {}) => {
      if (!user || !studentProfileIds.length) return

      const nextRoom = requestedRoom || generateSessionCode()

      setRoom(nextRoom)
      setAutoJoinSession({
        room: nextRoom,
        sentAt: Date.now(),
        source: 'teacher-dashboard'
      })

      if (socket.connected) {
        socket.emit('request_testing_center_invite', {
          room: nextRoom,
          studentProfileIds,
          teacherId: user.profile || user._id,
          teacherName: user.name
        })

        socket.emit(
          'update_presence',
          buildPresencePayload(user, '/testing', {
            currentPath: '/testing',
            context: 'testing-lobby',
            room: nextRoom
          })
        )
      }

      navigate('/testing')
    },
    [user, navigate]
  )

  return (
    <PerformanceProvider>
      <div className="App">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="hide-in-focus-mode">
          <Nav user={user} handleLogout={handleLogout} />
        </div>
        {user && (import.meta.env.DEV || isAdmin) && <MonitoringDashboard />}
        <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
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
                autoJoinSession={autoJoinSession}
                clearAutoJoinSession={clearAutoJoinSession}
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
              <TeacherDashboard
                socket={socket}
                onLaunchTestingCenter={handleLaunchTestingCenter}
              />
            )}
          />
          <Route
            path="/student-practice"
            element={renderRoleProtectedRoute(
              isStudent,
              <StudentPracticeMode socket={socket} />
            )}
          />

          <Route
            path="/practice"
            element={renderRoleProtectedRoute(isStudent, <Practice />)}
          />
          <Route
            path="/my-progress"
            element={renderRoleProtectedRoute(isStudent, <MyProgress />)}
          />
          <Route path="/settings/reading" element={<AccessibilitySettings />} />
          <Route
            path="/insights"
            element={renderRoleProtectedRoute(isEducator, <Insights />)}
          />
          <Route
            path="/class"
            element={renderRoleProtectedRoute(isEducator, <ClassProgress />)}
          />
          <Route
            path="/assignments"
            element={renderRoleProtectedRoute(isEducator, <Assignments />)}
          />
          <Route
            path="/students/:id"
            element={renderRoleProtectedRoute(isEducator, <StudentDetail />)}
          />
          <Route
            path="/students/:id/print"
            element={renderRoleProtectedRoute(isEducator, <PrintPackets mode="student" />)}
          />
          <Route
            path="/assignments/:id/print"
            element={renderRoleProtectedRoute(isEducator, <PrintPackets mode="assignment" />)}
          />
          <Route
            path="/students/:id/benchmark"
            element={renderRoleProtectedRoute(isEducator, <Benchmark />)}
          />

          {/* <Route path='/admin' element={<Admin user={user} />} /> */}
        </Routes>
        </main>
      </div>
    </PerformanceProvider>
  )
}

export default App
