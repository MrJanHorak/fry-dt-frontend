import TestRoom from '../components/TestRoom/TestRoom'

function Testing({ user, username, setUsername, room, setRoom, socket }) {
  console.log(user)
  return (
    <div>
      <TestRoom
        username={user.name}
        setUsername={setUsername}
        room={room}
        setRoom={setRoom}
        socket={socket}
      />
    </div>
  )
}

export default Testing
