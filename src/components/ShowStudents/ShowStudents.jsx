import React from 'react';
import Collapsible from 'react-collapsible';
import '../../styles/ShowStudent.css';

//components
import WordStats from '../WordStats/WordStats';

const ShowStudents = ({ user }) => {
  const students = user.students.map((student) => {
    return (
      <div className='student-container' key={student._id}>
        <Collapsible
          trigger={
            <div className='student-collapsable-title'>
              <img
                id='student-profile-pic'
                alt='small student pic'
                src={student.avatar}
              />
              <p>{student.name}</p>
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
