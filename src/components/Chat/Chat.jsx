import styles from './styles.module.css'
import RoomAndUsersColumn from './Room-and-users'
import SendMessage from './Send-messages'
import SendStatus from './Send-Status'
import MessagesReceived from './Messages'

const Chat = ({ user, room, socket }) => {
  let username = user.name


  return (
    <div className={styles.chatContainer}>
      <RoomAndUsersColumn
        user={user}
        socket={socket}
        username={username}
        room={room}
      />
      <div>
        {user.role === 'student' && 'hello Student '}
        {user.role === 'teacher' && 'Teacher View'}
        <SendStatus username={username} userRole={user.role} socket={socket} room={room}/>
        <MessagesReceived socket={socket} />  
        <SendMessage
          socket={socket}
          username={username}
          room={room}
          userRole={user.role}
        />
      </div>
    </div>
  )
}

export default Chat
