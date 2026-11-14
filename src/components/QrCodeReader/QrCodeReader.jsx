import React, { useRef, useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useNavigate } from 'react-router-dom'
import qrcode from '../../assets/qrcode.png'

// Services
import { qrLogin } from '../../services/authService'

/**
 * Students sign in by holding their personal QR login card up to the camera.
 */
const ReadQr = ({ handleSignupOrLogin }) => {
  const navigate = useNavigate()
  const [msg, setMsg] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const busy = useRef(false)

  const handleScan = async (detectedCodes) => {
    const text = detectedCodes?.[0]?.rawValue
    if (!text || busy.current) return
    busy.current = true
    try {
      await qrLogin(text)
      setShowScanner(false)
      handleSignupOrLogin()
      navigate('/')
    } catch (error) {
      setMsg(error.message)
    } finally {
      busy.current = false
    }
  }

  return (
    <div>
      {showScanner ? (
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
          <Scanner
            onScan={handleScan}
            onError={() =>
              setMsg(
                'We could not use the camera. Ask a grown-up to allow camera access, or sign in with your name.'
              )
            }
            constraints={{ facingMode: 'user' }}
            formats={['qr_code']}
          />
          <button
            type="button"
            className="submit-button"
            onClick={() => setShowScanner(false)}
          >
            Stop camera
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="submit-button"
          onClick={() => {
            setShowScanner(true)
            setMsg('Hold your card in front of the camera.')
          }}
        >
          <img
            alt=""
            src={qrcode}
            style={{ height: '125px', width: '100px' }}
          />
          <br />
          <strong>Sign in with my QR card</strong>
        </button>
      )}
      <p role="status" aria-live="polite">
        {msg}
      </p>
    </div>
  )
}

export default ReadQr
