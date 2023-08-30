import styles from './styles.module.css'
import RoomAndUsersColumn from './Room-and-users'
import SendMessage from './Send-messages'
import SendStatus from './Send-Status'
import MessagesReceived from './Messages'
import UsersAndStatus from './UsersAndStatus'
import { useState } from 'react'

const Chat = ({ user, room, socket }) => {
  const [roomUsers, setRoomUsers] = useState([])

  let username = user.name

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
        <UsersAndStatus socket={socket} username={username} roomUsers={roomUsers} />
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
