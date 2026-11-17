import React, { useState } from "react";
import "./AddStudent.css";

// Assets
import green1 from "../../assets/avatars/green1.png";

// Services
import { addStudent } from "../../services/authService";
import Collapsible from "react-collapsible";


//Components

const AddStudent = ({added, user}) => {
  const [msg, setMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    grade: 1,
    password: "",
    avatar: green1,
  });

  const handleChange = (e) => {
    setMsg("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addStudent(formData);
      setMsg(`${formData.name} was added.`);
      setFormData({ ...formData, name: "", password: "" });
      added()
    } catch (error) {
      setMsg(error.message);
    }
  };

  return (
    <div className="add-student-page">
      <Collapsible trigger={user.role==="parent"? "Add Child": "Add Student"}>
      <div className="add-student-container">
        <div className="title-container">
          <h1>Add a {user.role==="parent"? "Child": "Student"}</h1>
          <p role="status" aria-live="polite">{msg}</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
  
          <label htmlFor="add-student-name">Login name</label>
          <input
            required
            id="add-student-name"
            name="name"
            type="text"
            autoComplete="off"
            placeholder="e.g. Emma-H"
            maxLength={40}
            onChange={handleChange}
            value={formData.name}
          />

          <label htmlFor="add-student-grade">Grade (0 = Kindergarten)</label>
          <input
            required
            id="add-student-grade"
            name="grade"
            type="number"
            min="0"
            max="12"
            autoComplete="off"
            placeholder="grade"
            onChange={handleChange}
            value={formData.grade}
          />

          <label htmlFor="add-student-password">
            Password (optional – leave blank to use a QR login card)
          </label>
          <input
            id="add-student-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            onChange={handleChange}
            value={formData.password}
          />

          <button autoComplete="off" className="submit-button" type="submit">
            ADD STUDENT
          </button>
        </form>
      </div>
      </Collapsible>
    </div>
  );
};

export default AddStudent;
