import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.css'

const RoomAndUsers = ({ socket, username, setRoomUsers, room }) => {
  const [roomUsers, setRoomUsersState] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const handleChatroomUsers = (data) => {
      setRoomUsersState(data)
      setRoomUsers(data)
    }

    socket.on('chatroom_users', handleChatroomUsers)

    return () => socket.off('chatroom_users', handleChatroomUsers)
  }, [setRoomUsers, socket])

  const leaveRoom = () => {
    const __createdtime__ = Date.now()
    socket.emit('leave_room', { username, room, __createdtime__ })
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.roomAndUsersColumn}>
      <h2 className={styles.roomTitle}>{room}</h2>

      <div>
        {roomUsers.length > 0 && <h5 className={styles.usersTitle}>Users:</h5>}
        <ul className={styles.usersList}>
          {roomUsers.map((roomUser) => (
            <li
              style={{
                fontWeight: roomUser.username === username ? 'bold' : 'normal',
                color: roomUser.user?.role === 'teacher' ? 'red' : 'black'
              }}
              key={roomUser.id}
            >
              {roomUser.username}
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btn-outline" onClick={leaveRoom} type="button">
        Leave
      </button>
    </div>
  )
}

export default RoomAndUsers