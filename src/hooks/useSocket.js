/**
 * Custom hook for managing socket connections
 * Handles connection, disconnection, and event listeners
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config/runtime'

const isSocketLike = (value) =>
  Boolean(value && typeof value === 'object' && typeof value.emit === 'function')

const useSocket = (socketOrPath = SOCKET_URL) => {
  const socketRef = useRef(null)
  const listenersRef = useRef(new Map())
  const [socketInstance, setSocketInstance] = useState(() =>
    isSocketLike(socketOrPath) ? socketOrPath : null
  )
  const [isConnected, setIsConnected] = useState(() =>
    Boolean(isSocketLike(socketOrPath) && socketOrPath.connected)
  )

  const clearTrackedListeners = useCallback((socket) => {
    listenersRef.current.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        socket.off(event, handler)
      })
    })
    listenersRef.current.clear()
  }, [])

  // Initialize socket connection
  useEffect(() => {
    const usingExistingSocket = isSocketLike(socketOrPath)
    const socket = usingExistingSocket
      ? socketOrPath
      : io(socketOrPath, {
          transports: ['websocket'],
          upgrade: true,
          rememberUpgrade: true
        })

    socketRef.current = socket
    setSocketInstance(socket)
    setIsConnected(Boolean(socket.connected))

    const handleConnect = () => {
      setIsConnected(true)
      console.log('Connected to server:', socket.id)
    }

    const handleDisconnect = (reason) => {
      setIsConnected(false)
      console.log('Disconnected from server:', reason)
    }

    const handleConnectError = (error) => {
      setIsConnected(false)
      console.error('Connection error:', error)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      clearTrackedListeners(socket)

      if (!usingExistingSocket) {
        socket.disconnect()
      }

      socketRef.current = null
    }
  }, [socketOrPath, clearTrackedListeners])

  // Add event listener
  const addEventListener = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler)

      // Keep track of listeners for cleanup
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, [])
      }
      listenersRef.current.get(event).push(handler)
    }
  }, [])

  // Remove event listener
  const removeEventListener = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler)

      // Remove from tracked listeners
      const listeners = listenersRef.current.get(event)
      if (listeners) {
        const index = listeners.indexOf(handler)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }, [])

  // Emit event
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('Socket not connected. Cannot emit event:', event)
    }
  }, [])

  // Join room
  const joinRoom = useCallback(
    (roomData) => {
      emit('join_room', roomData)
    },
    [emit]
  )

  // Leave room
  const leaveRoom = useCallback(
    (roomData) => {
      emit('leave_room', roomData)
    },
    [emit]
  )

  // Send message
  const sendMessage = useCallback(
    (messageData) => {
      emit('send_message', messageData)
    },
    [emit]
  )

  // Send status
  const sendStatus = useCallback(
    (statusData) => {
      emit('send_status', statusData)
    },
    [emit]
  )

  return {
    socket: socketRef.current || socketInstance,
    isConnected,
    addEventListener,
    removeEventListener,
    on: addEventListener, // Alias for compatibility
    off: removeEventListener, // Alias for compatibility
    emit,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendStatus
  }
}

export default useSocket
