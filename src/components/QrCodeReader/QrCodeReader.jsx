import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { useNavigate } from 'react-router-dom';
import qrcode from '../../assets/qrcode.png';
import CryptoJS from 'crypto-js';

// Services
import { login } from '../../services/authService';

const ReadQr = ({ handleSignupOrLogin }) => {
  const encryptKey = import.meta.env.VITE_REACT_APP_ENCRYPTKEY;
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      <div>
        {showScanner ? (
          <QrReader
            onResult={async (result, error) => {
              if (!!result) {
                let resultTextSplit = result?.text.split(',');
                let qrNameDecrypt = CryptoJS.AES.decrypt(
                  resultTextSplit[0],
                  encryptKey
                );
                let qrName = await JSON.parse(
                  qrNameDecrypt.toString(CryptoJS.enc.Utf8)
                );
                let qrPwDecrypt = CryptoJS.AES.decrypt(
                  resultTextSplit[1],
                  encryptKey
                );
                let qrPw = await JSON.parse(
                  qrPwDecrypt.toString(CryptoJS.enc.Utf8)
                );
                try {
                  await login({ name: qrName, pw: qrPw });
                  handleSignupOrLogin();
                  navigate('/');
                } catch (error) {
                  setMsg(error.message);
                }
              }
              if (!!error) {
                console.info(error);
              }
            }}
            style={{ width: '100%' }}
          />
        ) : (
          <div>
            <button
              className='submit-button'
              onClick={() => {
                setShowScanner(true);
                setMsg('Make sure your QrCode is visible!');
              }}
            >
              <img
                alt='use qr code for login'
                src={qrcode}
                style={{ height: '125px', width: '100px' }}
              />
              <br />
              <strong>Log-in Using QRCode (requires a Camera)</strong>
            </button>
          </div>
        )}
        <p>{msg}</p>
      </div>
    </>
  );
};

export default ReadQr;
