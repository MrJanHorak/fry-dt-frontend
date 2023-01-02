import React, { useEffect, useState } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

const VoiceSettings = ({ formData, handleChange }) => {
  const text = 'Welcome to the Fry word diagnosis tool!';
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [voiceIndex, setVoiceIndex] = useState(null);
  const onEnd = () => {
    // You could do something here after speaking has finished
  };
  const { speak, cancel, speaking, supported, voices } = useSpeechSynthesis({
    onEnd,
  });

  let voice = voices[formData.voice] || 0;

  const styleFlexRow = { display: 'flex', flexDirection: 'row' };
  const styleContainerRatePitch = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 12,
  };

  useEffect(() => {
    if (formData.voice) {
      setPitch(formData.pitch);
      setRate(formData.rate);
      setVoiceIndex(formData.voice);
    }
  }, [formData.pitch, formData.rate, formData.voice]);

  return (
    <>
      {formData.voice === null && (
        <div>
          <h2>Loading ...</h2>
        </div>
      )}
      {formData.voice !== null && (
        <form>
          <h2>Choose Voice</h2>
          {!supported && (
            <p>
              Oh no, it looks like your browser doesn&#39;t support Speech
              Synthesis.
            </p>
          )}
          {supported && (
            <React.Fragment>
              <p>
                {`Choose a voice below. 
            Then press the 'Speak' button to hear a sample.`}
              </p>
              <label htmlFor='voice'>Voice</label>
              <select
                id='voice'
                name='voice'
                value={voiceIndex || ''}
                onChange={(event) => {
                  setVoiceIndex(event.target.value);
                  handleChange(event);
                }}
              >
                <option value=''>Default</option>
                {voices.map((option, index) => (
                  <option key={option.voiceURI} value={index}>
                    {`${option.lang} - ${option.name}`}
                  </option>
                ))}
              </select>
              <div style={styleContainerRatePitch}>
                <div style={styleFlexRow}>
                  <label htmlFor='rate'>Rate: </label>
                  <div className='rate-value'>{rate}</div>
                </div>
                <input
                  type='range'
                  min='0.7'
                  max='1.2'
                  defaultValue={rate}
                  step='0.01'
                  id='rate'
                  name='rate'
                  onChange={(event) => {
                    setRate(event.target.value);
                    handleChange(event);
                  }}
                />
              </div>
              <div style={styleContainerRatePitch}>
                <div style={styleFlexRow}>
                  <label htmlFor='pitch'>Pitch: </label>
                  <div className='pitch-value'>{pitch}</div>
                </div>
                <input
                  type='range'
                  min='0.5'
                  max='1.5'
                  defaultValue={pitch}
                  step='0.01'
                  id='pitch'
                  name='pitch'
                  onChange={(event) => {
                    setPitch(event.target.value);
                    handleChange(event);
                  }}
                />
              </div>
              {speaking ? (
                <button type='button' onClick={cancel}>
                  Stop
                </button>
              ) : (
                <button
                  type='button'
                  onClick={() => speak({ text, voice, rate, pitch })}
                >
                  Speak
                </button>
              )}
            </React.Fragment>
          )}
        </form>
      )}
    </>
  );
};

export default VoiceSettings;
