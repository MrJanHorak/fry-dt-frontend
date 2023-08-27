import styles from './styles.module.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const UsersAndStatus = ({ socket, username, user, room }) => {
  const [roomUsers, setRoomUsers] = useState([])
  const [statusReceived, setStatusReceived] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    socket.on('chatroom_users', (data) => {
      console.log(data)
      setRoomUsers(data)
    })

    return () => socket.off('chatroom_users')
  }, [socket])

  useEffect(() => {
    socket.on('receive_status', (data) => {
      console.log(data)
      setStatusReceived((state) => [
        ...state,
        {
          status: data.status,
          username: data.username,
          userRole: data.userRole,
          __createdtime__: data.__createdtime__
        }
      ])
    })

    // Remove event listener on component unmount
    return () => socket.off('receive_message')
  }, [socket])

  const leaveRoom = () => {
    const __createdtime__ = Date.now()
    socket.emit('leave_room', { username, room, __createdtime__ })
    // Redirect to home page
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.roomAndUsersColumn}>
      <h2 className={styles.roomTitle}>{room}</h2>

      <div>
        {roomUsers.length > 0 && <h5 className={styles.usersTitle}>Users:</h5>}
        <ul className={styles.usersList}>
          {roomUsers.map((user) => (
            <li
              style={{
                fontWeight: `${user.username === username ? 'bold' : 'normal'}`,
                color: `${user.user.role === 'teacher' ? 'red' : 'black'}`
              }}
              key={user.id}
            >
              {user.username}
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btn-outline" onClick={leaveRoom}>
        Leave
      </button>
    </div>
  )
}

export default UsersAndStatus
