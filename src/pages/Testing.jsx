import TestRoom from '../components/TestRoom/TestRoom'

function Testing({ user, room, setRoom, socket }) {
 
  return (
    <div>
      <TestRoom
        user={user}
        room={room}
        setRoom={setRoom}
        socket={socket}
      />
    </div>
  )
}

export default Testing
