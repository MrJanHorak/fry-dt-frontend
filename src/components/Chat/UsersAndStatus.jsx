import styles from './styles.module.css';
import { useState, useEffect } from 'react';

const UsersAndStatus = ({ socket, roomUsers }) => {
  const [statusReceived, setStatusReceived] = useState([]);

  useEffect(() => {
    socket.on('receive_status', (data) => {
    
      const statusIndex = statusReceived.findIndex(
        (student) => student.username === data.username
      );

      if (statusIndex >= 0) {
        setStatusReceived((prevStatusReceived) => [
          ...prevStatusReceived.filter((student) => student.username !== data.username),
          data
        ]);
      } else {
        setStatusReceived((prevStatusReceived) => [...prevStatusReceived, data]);
      }
    });
    return () => socket.off('receive_status');
  }, [socket, statusReceived]);

  const studentStatus = roomUsers
    .filter((user) => user.user.role === 'student')
    .map((user) => ({
      ...user.user,
      status:
        statusReceived.find((student) => student.username === user.user.name)?.status || false
    }));

  return (
    <div className={styles.roomAndUsersColumn}>
      <div>
        <ul className={styles.usersList}>
          {studentStatus.map((student) => (
            <li
              style={{
                fontWeight: 'normal',
                color: `${student?.status === true ? 'green' : 'yellow'}`
              }}
              key={student.name} 
            >
              <div
                className="userStatus"
                style={{
                  backgroundColor: `${student.status === true ? 'yellow' : 'purple'}`
                }}
              >
                Student: {student.name}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UsersAndStatus;
