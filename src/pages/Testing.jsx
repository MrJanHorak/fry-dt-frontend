import TestRoom from '../components/TestRoom/TestRoom'

function Testing({ username, setUsername, room, setRoom, socket }) {
  return (
    <div>
      <TestRoom
        username={username}
        setUsername={setUsername}
        room={room}
        setRoom={setRoom}
        socket={socket}
      />
    </div>
  )
}

export default Testing
