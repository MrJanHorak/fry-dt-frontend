import styles from './styles.module.css';
import RoomAndUsersColumn from './Room-and-users';
import SendMessage from './Send-messages';
import MessagesReceived from './Messages';

const Chat = ({ user, username, room, socket }) => {
  return (
    <div className={styles.chatContainer}>
      <RoomAndUsersColumn user={user} socket={socket} username={username} room={room} />
      <div>
{user.role === 'student' && 'hello Student '}
{user.role === 'teacher' && 'Teacher View'}
        <MessagesReceived socket={socket} />
        <SendMessage socket={socket} username={username} room={room} userRole={user.role} />
      </div>
    </div>
  );
};

export default Chat;