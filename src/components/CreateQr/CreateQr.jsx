import React from 'react';
import QRCode from 'react-qr-code';
import '../../styles/QrPage.css';
import CryptoJS from 'crypto-js';

const CreateQr = ({ user, pw }) => {
  // const CryptoJS = require("crypto-js");
  const encryptKey = import.meta.env.VITE_REACT_APP_ENCRYPTKEY;
  const qrCard = user.students.map((student) => {
    let qrValue = [
      CryptoJS.AES.encrypt(JSON.stringify(student.name), encryptKey).toString(),
      pw,
    ].join(',');
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
          borderRadius: 12,
        }}
        className='qr-card'
      >
        <div
          style={{
            height: 75,
            backgroundColor: 'grey',
            borderTopRightRadius: 12,
            borderTopLeftRadius: 12,
            color: 'white',
          }}
          className='qr-card-header'
        >
          <h2>Spelling Bee Practice</h2>
        </div>
        <div style={{ padding: 20 }} className='qr-code-field'>
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
            justifyContent: 'center',
            textAlign: 'center',
          }}
          className='qr-code-footer'
        >
          <h2>{student.name}</h2>
        </div>
      </div>
    );
  });

  return (
    <div
      style={{ display: 'flex', flexDirection: 'row', maxWidth: '900px' }}
      className='qr-card-page'
    >
      {qrCard}
    </div>
  );
};

export default CreateQr;
