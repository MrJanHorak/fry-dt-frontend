import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../../styles/Auth.css'

// Services
import { login } from '../../services/authService'
import ReadQr from '../../components/QrCodeReader/QrCodeReader'

const SignIn = ({ handleSignupOrLogin }) => {
  const navigate = useNavigate()
  const [msg, setMsg] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    pw: ''
  })

  const handleChange = (e) => {
    setMsg('')
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(formData)
      handleSignupOrLogin()
      navigate('/')
    } catch (error) {
      setMsg(error.message)
    }
  }

  return (
    <div className="signup-page">
      <div className="form-container">
        <div className="qr-code-sign-in">
          <br />
          <ReadQr handleSignupOrLogin={handleSignupOrLogin} />
        </div>
        <div className="signin-title-container">
          <h1>Sign In</h1>
          {msg ? <h3>{msg}</h3> : <h3>FRY Diagnosis Tool</h3>}
        </div>
        <div className="sign-in-container">
          <div className="sign-in-form">
            <form className="register-form" onSubmit={handleSubmit}>
              <input
                required
                name="name"
                type="String"
                autoComplete="off"
                placeholder="user name"
                onChange={handleChange}
                value={formData.name}
              />
              <input
                required
                name="pw"
                type="password"
                autoComplete="off"
                placeholder="Password"
                onChange={handleChange}
                value={formData.pw}
              />

              <button autoComplete="off" className="submit-button" type="submit">
                SIGN IN
              </button>
            </form>
          </div>
        </div>
        <div className="redirect-container">
          <p>Don't have an account?</p>
          <Link className="redirect-link" to="/signup">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignIn
