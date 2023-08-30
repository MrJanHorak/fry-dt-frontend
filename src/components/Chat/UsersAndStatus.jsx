import styles from './styles.module.css'
import { useState, useEffect } from 'react'

const UsersAndStatus = ({ socket, username, roomUsers }) => {
  const [statusReceived, setStatusReceived] = useState([])

  useEffect(() => {
    socket.on('receive_status', (data) => {
      setStatusReceived((prevStatusReceived) => [...prevStatusReceived, data])
    })
    return () => socket.off('receive_status')
  }, [socket, statusReceived])
  console.log(roomUsers)
  console.log(statusReceived)
  const studentStatus = roomUsers
    .filter((user) => user.user.role === 'student')
    .map((user) => ({
      ...user.user,
      status:
        statusReceived.find(
          (student) => student.username === user.user.name
        )?.status || false
    }))
  console.log('STUDENT STATUS: ', studentStatus)
  return (
    <div className={styles.roomAndUsersColumn}>
      <div>
        <ul className={styles.usersList}>
          {studentStatus.map((student) => (
            <li
              style={{
                fontWeight: 'normal',
                color: `${student.status === true ? 'green' : 'yellow'}`
              }}
              key={student.name}
            >
              <div
                className="userStatus"
                style={{
                  backgroundColor: `${
                    student.status === true ? 'yellow' : 'purple'
                  }`
                }}
              >
                Student: {student.name}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default UsersAndStatus

// import styles from './styles.module.css'
// import { useState, useEffect } from 'react'

// const UsersAndStatus = ({ socket, username, roomUsers }) => {
//   const [statusReceived, setStatusReceived] = useState([])
//   const [studentStatus, setStudentStatus] = useState([])

//   useEffect(() => {
//     socket.on('receive_status', (data) => {
//       setStatusReceived(data)
//     })
//     return () => socket.off('receive_status')
//   }, [socket])

//   const currentStatus = () => {
//     let students = []
//     roomUsers.forEach((user) => {
//       if (user.user.role === 'student') {
//         students = statusReceived.filter(
//           (student) => (student.username === user.user.username)
//         )
//       }
//     })

//     console.log(students)

//     setStudentStatus((prevStudentStatus) => [...prevStudentStatus, ...students])
//     const studentList =students.map((student) => (
//       <li
//         style={{
//           fontWeight: `${student.username === username ? 'bold' : 'normal'}`,
//           color: `${student.status === 'true' ? 'green' : 'yellow'}`
//         }}
//         key={student.id}
//       >
//         <div
//           className="userStatus"
//           style={{
//             backgroundColor: `${student.status === 'true' ? 'amber' : 'purple'}`
//           }}
//         >
//           {student.username}
//         </div>
//       </li>
//     ))

//     return studentList
//   }
//   // Remove event listener on component unmount

//   return (
//     <div className={styles.roomAndUsersColumn}>
//       <div>
//         <ul className={styles.usersList}>{currentStatus()}</ul>
//       </div>
//     </div>
//   )
// }

// export default UsersAndStatus
