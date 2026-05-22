import { useNavigate } from 'react-router-dom'
import styles from './styles.module.css'
import { useState, useEffect, useCallback } from 'react'
import TeacherTestingInterface from '../TeacherTesting/TeacherTestingInterface'
import StudentTestingInterface from '../StudentTesting/StudentTestingInterface'

const TestRoom = ({
  user,
  room,
  setRoom,
  socket,
  autoJoinSession,
  clearAutoJoinSession
}) => {
  const navigate = useNavigate()
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')

  const username = user.name
  const isTeacher = user.role === 'teacher' || user.isAdmin

  const normalizeRoom = (value) =>
    value.trim().toUpperCase().replace(/\s+/g, '-')

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

  const updateTestingPresence = useCallback(
    (nextRoom) => {
      socket.emit('update_presence', {
        profileId: user.profile || user._id,
        user,
        currentPath: '/testing',
        context: 'testing-center',
        room: nextRoom,
        invitedRoom: null
      })
    },
    [socket, user]
  )

  const connectToRoom = useCallback(
    (requestedRoom = room) => {
      const nextRoom = normalizeRoom(requestedRoom)

      if (nextRoom !== '' && username !== '') {
        setIsConnecting(true)
        setRoom(nextRoom)
        socket.emit('join_room', { username, user, room: nextRoom })
        updateTestingPresence(nextRoom)

        setTimeout(() => {
          setHasJoinedRoom(true)
          setIsConnecting(false)
          clearAutoJoinSession?.()
        }, 1000)
      }
    },
    [room, username, setRoom, socket, user, updateTestingPresence, clearAutoJoinSession]
  )

  const joinRoom = () => {
    connectToRoom(room)
  }

  useEffect(() => {
    if (!autoJoinSession?.room || hasJoinedRoom || isConnecting) return

    connectToRoom(autoJoinSession.room)
  }, [autoJoinSession, hasJoinedRoom, isConnecting, connectToRoom])

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
            ? 'Open a live testing room and pull in the students from your online roster'
            : 'Your teacher will bring you in automatically'}
        </p>

        {autoJoinSession?.room && !hasJoinedRoom && (
          <div className={styles.studentLaunchCard}>
            <div className={styles.studentPulseGraphic}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className={styles.helperText}>
              {autoJoinSession.teacherName
                ? `${autoJoinSession.teacherName} is bringing you in.`
                : 'Teacher invitation received.'}
            </span>
            <span className={styles.copyMessage}>Connecting automatically...</span>
          </div>
        )}

        <div className={styles.userInfo}>
          {isTeacher ? <span>Role: {user.role}</span> : <span>{user.name}</span>}
          {isTeacher && <span>Name: {user.name}</span>}
        </div>

        {isTeacher ? (
          <>
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
                placeholder="Create or paste a session code"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
              />

              <button
                type="button"
                className={styles.secondaryAction}
                onClick={generateRoomCode}
                disabled={isConnecting}
              >
                Generate Session Code
              </button>
            </div>

            {room && (
              <div className={styles.sessionShareCard}>
                <span className={styles.helperText}>
                  Share this code with students:
                </span>
                <div className={styles.sessionCode}>{room}</div>
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={copyRoomCode}
                  >
                    Copy Code
                  </button>
                  {copyMessage && (
                    <span className={styles.copyMessage}>{copyMessage}</span>
                  )}
                </div>
              </div>
            )}

            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={joinRoom}
              disabled={!normalizeRoom(room) || isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Open Session'}
            </button>

            <div className={styles.instructions}>
              <h3>Instructions:</h3>
              <ul>
                <li>Use the teacher dashboard to see which roster students are online</li>
                <li>Launch the testing center from the dashboard to pull online students in</li>
                <li>Open the session to access the teacher testing interface</li>
                <li>
                  You can send words, assess responses, and monitor progress live
                </li>
                <li>
                  Session codes remain available as a fallback when automatic pull-in is not possible
                </li>
                <li>
                  Use the assessment tools to track progress during the session
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className={styles.studentLaunchCard}>
            <div className={styles.studentPulseGraphic}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <h2>{isConnecting ? 'Joining Test' : 'Wait Here'}</h2>
            <p>
              {isConnecting
                ? 'Opening your test now.'
                : 'Stay on this screen. Your teacher will open the test for you.'}
            </p>
          </div>
        )}

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
