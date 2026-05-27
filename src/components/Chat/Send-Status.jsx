import styles from './styles.module.css'
import React, { useEffect, useState } from 'react'

const SendStatus = ({ socket, username, room, userRole }) => {
  const [status, setStatus] = useState(false)

  useEffect(() => {
    const __createdtime__ = Date.now()
    socket.emit('send_status', {
      username,
      room,
      status,
      userRole,
      __createdtime__
    })
  }, [room, socket, status, userRole, username])

  const sendStatus = (event) => {
    event.preventDefault()
    setStatus((prevStatus) => !prevStatus)
  }

  return (
    <div className={styles.sendMessageContainer}>
      <button
        type="button"
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
