import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../../styles/Auth.css'

// Assets
import robot from '../../assets/avatars/orange1.png' //<= included in starter code

// Services
import { signup } from '../../services/authService'

//Components
import AvatarSelection from './AvatarSelection'

const SignUp = (props) => {
  const navigate = useNavigate()
  const [popup, setPopup] = useState(false)
  const [msg, setMsg] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    grade: 1,
    role: '',
    avatar: robot
  })

  const handlePopup = () => {
    setPopup(!popup)
  }

  const handleChange = (e) => {
    setMsg('')
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await signup(formData)
      props.handleSignupOrLogin()
      navigate('/')
    } catch (error) {
      setMsg(error.message)
    }
  }

  return (
    <div className="signup-page">
      {popup && (
        <AvatarSelection
          formData={formData}
          handleChange={handleChange}
          handlePopup={handlePopup}
        />
      )}

      <div className="form-container">
        <div className="title-container">
          <h1>Create an Account</h1>
          {msg ? (
            <h3>{msg}</h3>
          ) : (
            <h3>Teach and Test your students FRY recognition.</h3>
          )}
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <input
            required
            name="name"
            type="text"
            autoComplete="off"
            placeholder="Username"
            onChange={handleChange}
            value={formData.name}
          />
          <input
            required
            name="email"
            type="email"
            autoComplete="off"
            placeholder="Email"
            onChange={handleChange}
            value={formData.email}
          />
          <input
            required
            name="password"
            type="password"
            autoComplete="off"
            placeholder="Password"
            onChange={handleChange}
            value={formData.password}
          />
          <input
            required
            name="grade"
            type="number"
            min="1"
            max="5"
            autoComplete="off"
            placeholder="grade"
            onChange={handleChange}
            value={formData.grade}
          />

          <button
            type="button"
            autoComplete="off"
            className="submit-button"
            onClick={handlePopup}
          >
            Select Avatar
          </button>
          <ul>
            <input
              name="role"
              type="radio"
              value="teacher"
              id="teacher"
              onChange={handleChange}
            />

            <label htmlFor="teacher">Teacher</label>

            <input
              name="role"
              type="radio"
              value="parent"
              id="parent"
              onChange={handleChange}
            />

            <label htmlFor="parent">Parent</label>
          </ul>
          <button autoComplete="off" className="submit-button" type="submit">
            SIGN UP
          </button>
        </form>
        <div className="redirect-container">
          <p>Already have an account?</p>
          <Link className="redirect-link" to="/signin">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp
