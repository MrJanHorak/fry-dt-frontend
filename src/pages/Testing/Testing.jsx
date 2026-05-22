import TestRoom from '../../components/TestRoom/TestRoom'

function Testing({
  user,
  room,
  setRoom,
  socket,
  autoJoinSession,
  clearAutoJoinSession
}) {
  return (
    <div>
      <TestRoom
        user={user}
        room={room}
        setRoom={setRoom}
        socket={socket}
        autoJoinSession={autoJoinSession}
        clearAutoJoinSession={clearAutoJoinSession}
      />
    </div>
  )
}

export default Testing
