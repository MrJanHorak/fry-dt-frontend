import styles from './styles.module.css'
import React, { useEffect, useState } from 'react'

const SendStatus = ({ socket, username, room, userRole }) => {
  const [status, setStatus] = useState(false)
  useEffect(()=>{
    const __createdtime__ = Date.now()
      socket.emit('send_status', {
        username,
        room,
        status: status,
        userRole,
        __createdtime__
      })
  },[status])

  const sendStatus = (e) => {
    e.preventDefault
    setStatus(prevStatus => !prevStatus)
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
