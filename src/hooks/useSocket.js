/**
 * Custom hook for managing socket connections
 * Handles connection, disconnection, and event listeners
 */

import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const useSocket = (
  socketOrPath = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
) => {
  const socketRef = useRef(null)
  const listenersRef = useRef(new Map())

  // Initialize socket connection
  useEffect(() => {
    // Check if we received an existing socket object or a path string
    if (socketOrPath && typeof socketOrPath === 'object' && socketOrPath.emit) {
      // Use existing socket object
      socketRef.current = socketOrPath
    } else {
      // Create new socket connection with the provided path
      socketRef.current = io(socketOrPath, {
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true
      })
    }

    const socket = socketRef.current

    // Only set up event handlers if we created a new socket connection
    if (typeof socketOrPath === 'string' || !socketOrPath) {
      // Connection event handlers for new connections
      socket.on('connect', () => {
        console.log('Connected to server:', socket.id)
      })

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason)
      })

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
      })
    }

    // Cleanup on unmount
    return () => {
      // Only cleanup listeners if we created the socket
      if (typeof socketOrPath === 'string' || !socketOrPath) {
        if (socketRef.current) {
          socketRef.current.disconnect()
          socketRef.current = null
        }
      }
    }
  }, [socketOrPath])

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

  // Get connection status
  const isConnected = socketRef.current?.connected || false

  return {
    socket: socketRef.current,
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
