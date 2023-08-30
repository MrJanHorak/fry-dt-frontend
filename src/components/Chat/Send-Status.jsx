import styles from './styles.module.css'
import React, { useState } from 'react'

const SendStatus = ({ socket, username, room, userRole }) => {
  const [status, setStatus] = useState(false)

  const sendStatus = (e) => {
    e.preventDefault
    setStatus(true)
    if (!status) {
      const __createdtime__ = Date.now()
      // Send message to server. We can't specify who we send the message to from the frontend. We can only send to server. Server can then send message to rest of users in room
      socket.emit('send_status', {
        username,
        room,
        status: true,
        userRole,
        __createdtime__
      })
    }
  }

  return (
    <div className={styles.sendMessageContainer}>
      <button
        style={
          !status ? { backgroundColor: 'red' } : { backgroundColor: 'green' }
        }
        className="btn btn-primary"
        onClick={sendStatus}
      >
        {!status ? 'Ready?' : 'Ready'}
      </button>
    </div>
  )
}

export default SendStatus
