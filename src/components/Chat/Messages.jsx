import styles from './styles.module.css'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import useSocket from '../../hooks/useSocket'
import { ChatSkeleton } from '../Loading/Loading'

const Messages = ({ socket }) => {
  const [messagesReceived, setMessagesReceived] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState([])

  const messagesColumnRef = useRef(null)
  const { isConnected, on, off } = useSocket(socket)

  // Memoize sorted messages for better performance
  const sortedMessages = useMemo(() => {
    return sortMessagesByDate([...messagesReceived])
  }, [messagesReceived])

  // Optimized message handler with useCallback
  const handleReceiveMessage = useCallback((data) => {
    setMessagesReceived((state) => [
      ...state,
      {
        message: data.message,
        username: data.username,
        userRole: data.userRole,
        __createdtime__: data.__createdtime__
      }
    ])
  }, [])

  // Handle last 100 messages
  const handleLast100Messages = useCallback((last100Messages) => {
    try {
      const parsedMessages = JSON.parse(last100Messages)
      const sortedLastMessages = sortMessagesByDate(parsedMessages)
      setMessagesReceived((state) => [...sortedLastMessages, ...state])
      setIsLoading(false)
    } catch (error) {
      console.error('Error parsing messages:', error)
      setIsLoading(false)
    }
  }, [])

  // Handle typing indicators
  const handleUserTyping = useCallback((data) => {
    setTypingUsers((users) => {
      if (data.isTyping && !users.includes(data.username)) {
        return [...users, data.username]
      } else if (!data.isTyping) {
        return users.filter((user) => user !== data.username)
      }
      return users
    })
  }, [])

  useEffect(() => {
    if (!isConnected) return

    on('receive_message', handleReceiveMessage)
    on('last_100_messages', handleLast100Messages)
    on('user_typing', handleUserTyping)

    return () => {
      off('receive_message', handleReceiveMessage)
      off('last_100_messages', handleLast100Messages)
      off('user_typing', handleUserTyping)
    }
  }, [
    isConnected,
    on,
    off,
    handleReceiveMessage,
    handleLast100Messages,
    handleUserTyping
  ])

  // Auto-scroll to bottom with smooth behavior
  useEffect(() => {
    if (messagesColumnRef.current) {
      messagesColumnRef.current.scrollTo({
        top: messagesColumnRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [sortedMessages])

  function sortMessagesByDate(messages) {
    return messages.sort(
      (a, b) => parseInt(a.__createdtime__) - parseInt(b.__createdtime__)
    )
  }

  // Enhanced date formatting with relative time
  function formatDateFromTimestamp(timestamp) {
    const date = new Date(parseInt(timestamp))
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className={styles.messagesColumn}>
        <ChatSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className={styles.messagesColumn} ref={messagesColumnRef}>
      {sortedMessages.map((msg, i) => (
        <div
          className={styles.message}
          style={{
            backgroundColor: `${
              msg.userRole === 'teacher'
                ? 'darkblue'
                : msg.userRole === 'student'
                ? 'green'
                : 'orange'
            }`
          }}
          key={`${msg.__createdtime__}-${i}`}
          role="article"
          aria-label={`Message from ${msg.username}`}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className={styles.msgMeta} aria-label="User role">
              {msg.userRole ?? 'Chat Bot'}
            </span>
            <span className={styles.msgMeta} aria-label="Username">
              {msg.username}
            </span>
            <span className={styles.msgMeta} aria-label="Message time">
              {formatDateFromTimestamp(msg.__createdtime__)}
            </span>
          </div>
          <p className={styles.msgText} aria-label="Message content">
            {msg.message}
          </p>
        </div>
      ))}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className={styles.typingIndicator} aria-live="polite">
          <div className={styles.typingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className={styles.typingText}>
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.length} people are typing...`}
          </span>
        </div>
      )}
    </div>
  )
}

export default Messages
