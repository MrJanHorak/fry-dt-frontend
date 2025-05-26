import { useNavigate } from 'react-router-dom'
import styles from './styles.module.css'
import { useEffect, useState } from 'react'
import TeacherTestingInterface from '../TeacherTesting/TeacherTestingInterface'
import StudentTestingInterface from '../StudentTesting/StudentTestingInterface'

const TestRoom = ({ user, room, setRoom, socket }) => {
  const navigate = useNavigate()
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  let username = user.name

  const joinRoom = () => {
    if (room !== '' && username !== '') {
      setIsConnecting(true)
      socket.emit('join_room', { username, user, room })

      // Wait a moment for the socket connection to establish
      setTimeout(() => {
        setHasJoinedRoom(true)
        setIsConnecting(false)
      }, 1000)
    }
  }

  // Auto-redirect if no room is selected
  useEffect(() => {
    if (!room && !hasJoinedRoom) {
      // Don't auto-redirect, let user select room
    }
  }, [room, hasJoinedRoom])

  // If user has joined a room, show the appropriate testing interface
  if (hasJoinedRoom) {
    if (user.role === 'teacher') {
      return <TeacherTestingInterface user={user} room={room} socket={socket} />
    } else {
      return <StudentTestingInterface user={user} room={room} socket={socket} />
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1>Testing Center</h1>
        <p className={styles.subtitle}>
          {user.role === 'teacher'
            ? 'Select a room to start or manage testing sessions'
            : 'Select a room to join a testing session'}
        </p>

        <div className={styles.userInfo}>
          <span>Role: {user.role}</span>
          <span>Name: {user.name}</span>
        </div>

        <select
          className={styles.input}
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          disabled={isConnecting}
        >
          <option value="">-- Select Room --</option>
          <option value="room-1">Testing Room 1</option>
          <option value="room-2">Testing Room 2</option>
          <option value="room-3">Testing Room 3</option>
          <option value="practice">Practice Room</option>
          <option value="assessment">Assessment Room</option>
        </select>

        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={joinRoom}
          disabled={!room || isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Join Room'}
        </button>

        <div className={styles.instructions}>
          <h3>Instructions:</h3>
          {user.role === 'teacher' ? (
            <ul>
              <li>
                Select a room and join to access the teacher testing interface
              </li>
              <li>
                You can start test sessions, send words to students, and assess
                responses
              </li>
              <li>
                Students must be in the same room to participate in your tests
              </li>
              <li>Use the assessment tools to track student progress</li>
            </ul>
          ) : (
            <ul>
              <li>Select the same room as your teacher</li>
              <li>Wait for your teacher to start a test session</li>
              <li>Follow the on-screen instructions for each test</li>
              <li>
                Make sure your microphone is working for pronunciation tests
              </li>
            </ul>
          )}
        </div>

        <button
          className={styles.backButton}
          onClick={() => navigate('/', { replace: true })}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  )
}

export default TestRoom
