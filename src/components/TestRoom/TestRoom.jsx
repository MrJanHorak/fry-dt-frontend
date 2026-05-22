import { useNavigate } from 'react-router-dom'
import styles from './styles.module.css'
import { useState } from 'react'
import TeacherTestingInterface from '../TeacherTesting/TeacherTestingInterface'
import StudentTestingInterface from '../StudentTesting/StudentTestingInterface'

const TestRoom = ({ user, room, setRoom, socket }) => {
  const navigate = useNavigate()
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')

  const username = user.name
  const isTeacher = user.role === 'teacher' || user.isAdmin

  const normalizeRoom = (value) => value.trim().toUpperCase().replace(/\s+/g, '-')

  const generateRoomCode = () => {
    const generatedCode = `SESSION-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`

    setRoom(generatedCode)
    setCopyMessage('')
  }

  const copyRoomCode = async () => {
    if (!room) return

    try {
      await navigator.clipboard.writeText(room)
      setCopyMessage('Session code copied')
    } catch (error) {
      setCopyMessage('Unable to copy automatically')
    }
  }

  const joinRoom = () => {
    const nextRoom = normalizeRoom(room)

    if (nextRoom !== '' && username !== '') {
      setIsConnecting(true)
      setRoom(nextRoom)
      socket.emit('join_room', { username, user, room: nextRoom })

      setTimeout(() => {
        setHasJoinedRoom(true)
        setIsConnecting(false)
      }, 1000)
    }
  }

  if (hasJoinedRoom) {
    if (isTeacher) {
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
          {isTeacher
            ? 'Create or share a session code to invite students into a live test'
            : 'Enter the session code your teacher shared with you'}
        </p>

        <div className={styles.userInfo}>
          <span>Role: {user.role}</span>
          <span>Name: {user.name}</span>
        </div>

        <div className={styles.roomField}>
          <input
            className={styles.input}
            type="text"
            value={room}
            onChange={(e) => {
              setRoom(e.target.value.toUpperCase())
              setCopyMessage('')
            }}
            disabled={isConnecting}
            placeholder={
              isTeacher ? 'Create or paste a session code' : 'Enter session code'
            }
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
          />

          {isTeacher && (
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={generateRoomCode}
              disabled={isConnecting}
            >
              Generate Session Code
            </button>
          )}
        </div>

        {isTeacher && room && (
          <div className={styles.sessionShareCard}>
            <span className={styles.helperText}>Share this code with students:</span>
            <div className={styles.sessionCode}>{room}</div>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={copyRoomCode}
              >
                Copy Code
              </button>
              {copyMessage && <span className={styles.copyMessage}>{copyMessage}</span>}
            </div>
          </div>
        )}

        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={joinRoom}
          disabled={!normalizeRoom(room) || isConnecting}
        >
          {isConnecting
            ? 'Connecting...'
            : isTeacher
              ? 'Open Session'
              : 'Join Session'}
        </button>

        <div className={styles.instructions}>
          <h3>Instructions:</h3>
          {isTeacher ? (
            <ul>
              <li>Create a session code or use one your class already knows</li>
              <li>Share the code with students before starting the test</li>
              <li>
                Open the session to access the teacher testing interface
              </li>
              <li>You can send words, assess responses, and monitor progress live</li>
              <li>
                Students must join with the same session code to participate
              </li>
              <li>Use the assessment tools to track progress during the session</li>
            </ul>
          ) : (
            <ul>
              <li>Enter the exact session code your teacher shared</li>
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
