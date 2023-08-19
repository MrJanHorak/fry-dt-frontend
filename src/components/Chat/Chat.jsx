import styles from './styles.module.css';
import RoomAndUsersColumn from './Room-and-users';
import SendMessage from './Send-messages';
import MessagesReceived from './Messages';

const Chat = ({ username, room, socket }) => {
  return (
    <div className={styles.chatContainer}>
      <RoomAndUsersColumn socket={socket} username={username} room={room} />

      <div>
        <MessagesReceived socket={socket} />
        <SendMessage socket={socket} username={username} room={room} />
      </div>
    </div>
  );
};

export default Chat;