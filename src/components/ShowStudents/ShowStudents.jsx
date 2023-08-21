import React from 'react';
import Collapsible from 'react-collapsible';

//services
import { removeStudent } from '../../services/profileService';

//components
import WordStats from '../WordStats/WordStats';

// assets
import '../../styles/ShowStudent.css';

const ShowStudents = ({ user }) => {



 const handleClick = async(studentId) =>{
  try {
    await removeStudent(user._id, studentId);
  } catch (error) {
    console.log(error.message);
  }
};

  const students = user.students.map((student) => {
    console.log(student)
    return (
      <div className='student-container' key={student._id}>
        <Collapsible
          trigger={
            <div className='student-collapsible-title'>
              <img
                id='student-profile-pic'
                alt='small student pic'
                src={student.avatar}
              />
              <p>{student.name}</p>
              <p>Grade: {student.grade}</p>
              <p>Times tested:{student.tested}</p>
              <button onClick={() => handleClick(student._id)}>X</button>
            </div>
          }
        >
          {<WordStats userProfile={student} />}
        </Collapsible>
      </div>
    );
  });
  return (
    <>
      <div>{students}</div>
    </>
  );
};

export default ShowStudents;
