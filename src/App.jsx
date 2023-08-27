import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import './App.css'

// Services
import { getUser, logout } from './services/authService'

// Pages + Components
import Nav from './components/Nav/Nav'
import SignUp from './pages/auth/SignUp'
import SignIn from './pages/auth/SignIn'
import Landing from './pages/Landing'
import Testing from './pages/Testing'
import Study from './pages/Study'
import Profile from './pages/Profile'
import Chat from './components/Chat/Chat'

const socket = io.connect('http://localhost:3000')

const App = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(getUser())
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState('')

  const handleSignupOrLogin = async () => {
    const currentUser = await getUser()
    setUser(currentUser)
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    navigate('/')
  }

  return (
    <div className="App">
      <Nav user={user} handleLogout={handleLogout} />
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
        <Route path="/study" element={<Study user={user} />} />
        <Route
          path="/testing"
          element={
            <Testing
              user={user}
              username={username}
              setUsername={setUsername}
              room={room}
              setRoom={setRoom}
              socket={socket}
            />
          }
        />
        <Route
          path="/chat"
          element={<Chat user={user} username={username} room={room} socket={socket} />}
        />
        <Route path="/profile" element={<Profile user={user} />} />

        {/* <Route path='/admin' element={<Admin user={user} />} /> */}
      </Routes>
    </div>
  )
}

export default App
