import styles from './styles.module.css'
import RoomAndUsersColumn from './Room-and-users'
import SendMessage from './Send-messages'
import SendStatus from './Send-Status'
import MessagesReceived from './Messages'
import UsersAndStatus from './UsersAndStatus'
import { useState, useEffect } from 'react'
import useSocket from '../../hooks/useSocket'
import { LoadingSpinner } from '../Loading/Loading'

const Chat = ({ user, room, socket }) => {
  const [roomUsers, setRoomUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const { isConnected, emit, on, off } = useSocket(socket)

  let username = user.name

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(true)
      return
    }

    // Join room when component mounts
    const joinRoom = async () => {
      try {
        const __createdtime__ = Date.now()
        emit('join_room', { username, room, __createdtime__ })
        setIsLoading(false)
      } catch (err) {
        setError('Failed to join chat room')
        setIsLoading(false)
      }
    }

    joinRoom()

    // Handle connection errors
    const handleError = (error) => {
      setError('Connection error occurred')
      console.error('Socket error:', error)
    }

    const handleDisconnect = () => {
      setError('Lost connection to chat server')
    }

    on('connect_error', handleError)
    on('disconnect', handleDisconnect)

    return () => {
      off('connect_error', handleError)
      off('disconnect', handleDisconnect)
    }
  }, [isConnected, emit, on, off, username, room])

  if (isLoading) {
    return (
      <div className="chat-loading-container">
        <LoadingSpinner size="large" />
        <p>Connecting to chat...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="chat-error-container">
        <div className="error-message">
          <h3>Chat Connection Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="roomContainer">
      {user.role === 'student' && (
        <SendStatus
          username={username}
          userRole={user.role}
          socket={socket}
          room={room}
          roomUsers={roomUsers}
        />
      )}
      {user.role === 'teacher' && (
        <UsersAndStatus
          socket={socket}
          username={username}
          roomUsers={roomUsers}
        />
      )}

      <div className={styles.chatContainer}>
        <RoomAndUsersColumn
          user={user}
          socket={socket}
          username={username}
          room={room}
          setRoomUsers={setRoomUsers}
        />
        <div>
          <MessagesReceived socket={socket} />
          <SendMessage
            socket={socket}
            username={username}
            room={room}
            userRole={user.role}
          />
        </div>
      </div>
    </div>
  )
}

export default Chat
