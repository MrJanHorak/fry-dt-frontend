import styles from './styles.module.css'
import React, { useState, useRef, useCallback } from 'react'
import useSocket from '../../hooks/useSocket'

const SendMessage = ({ socket, username, room, userRole }) => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef(null)

  const { emit } = useSocket(socket)

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      emit('user_typing', { username, room, isTyping: true })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      emit('user_typing', { username, room, isTyping: false })
    }, 1000)
  }, [isTyping, emit, username, room])

  const handleMessageChange = (e) => {
    setMessage(e.target.value)
    handleTyping()
  }

  const sendMessage = () => {
    if (message.trim() !== '') {
      const __createdtime__ = Date.now()

      // Stop typing indicator when sending message
      if (isTyping) {
        setIsTyping(false)
        emit('user_typing', { username, room, isTyping: false })
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }

      // Send message to server
      emit('send_message', {
        username,
        room,
        message: message.trim(),
        userRole,
        __createdtime__
      })
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={styles.sendMessageContainer}>
      <input
        className={styles.messageInput}
        placeholder="Type a message..."
        onChange={handleMessageChange}
        onKeyPress={handleKeyPress}
        value={message}
        aria-label="Message input"
        autoComplete="off"
      />
      <button
        className="btn btn-primary"
        onClick={sendMessage}
        disabled={!message.trim()}
        aria-label="Send message"
      >
        Send Message
      </button>
    </div>
  )
}

export default SendMessage
