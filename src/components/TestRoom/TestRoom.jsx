import { useNavigate } from 'react-router-dom'
import styles from './styles.module.css'

const TestRoom = ({ user,  room, setRoom, socket }) => {
  console.log(user)
  const navigate = useNavigate()
  let username = user.name
  const joinRoom = () => {
    if (room !== '' && username !== '') {
      socket.emit('join_room', { username, user, room })
    }
    // Redirect to /chat
    navigate('/chat', { replace: true })
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1>{`Testing Center`}</h1>
      

        <select
          className={styles.input}
          onChange={(e) => setRoom(e.target.value)}
        >
          <option>-- Select Room --</option>
          <option value="waiting">waiting room</option>
          <option value="testing">testing</option>
        </select>

        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={joinRoom}
        >
          Ready
        </button>
      </div>
    </div>
  )
}

export default TestRoom
