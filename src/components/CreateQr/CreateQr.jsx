import React, { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

import CryptoJS from 'crypto-js'
import { changePassword } from '../../services/authService'

const CreateQr = ({ user, pw }) => {
  const encryptKey = import.meta.env.VITE_REACT_APP_ENCRYPTKEY
  const [qrCards, setQrCards] = useState([])

  useEffect(() => {
    const generateQRCodesAndUpdatePasswords = async () => {
      // First, generate the QR codes
      const qrCodes = user.students.map((student) => {
        let qrValue = [
          CryptoJS.AES.encrypt(
            JSON.stringify(student.name),
            encryptKey
          ).toString(),
          pw
        ].join(',')

        return (
          <div
            key={student._id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 10,
              margin: 20,
              border: '1px solid black',
              borderRadius: 12
            }}
            className="qr-card"
          >
            <div
              style={{
                height: 75,
                backgroundColor: 'grey',
                borderTopRightRadius: 12,
                borderTopLeftRadius: 12,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="qr-card-header"
            >
              <h2>FRY Diagnosis Tool</h2>
            </div>
            <div style={{ padding: 20 }} className="qr-code-field">
              <QRCode value={qrValue} />
            </div>
            <div
              style={{
                height: 75,
                backgroundColor: 'grey',
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                color: 'white',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="qr-code-footer"
            >
              <h2>{student.name}</h2>
            </div>
          </div>
        )
      })
      setQrCards(qrCodes)

      // Then, update the passwords
      await Promise.all(
        user.students.map((student) => changePassword(student._id, pw))
      )
    }

    generateQRCodesAndUpdatePasswords()
  }, [user, pw])

  return (
    <div
      style={{ display: 'flex', flexDirection: 'row', maxWidth: '900px' }}
      className="qr-card-page"
    >
      {qrCards}
    </div>
  )
}

export default CreateQr
