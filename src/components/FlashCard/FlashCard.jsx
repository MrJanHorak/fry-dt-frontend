import React, { useEffect, useState, useTimeout } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

import '../../styles/FlashCard.css';

const FlashCard = ({ profile, handleClick, handleBack, displayWord }) => {
  const [speaking, setSpeaking] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const { speak, voices } = useSpeechSynthesis();

  useEffect(() => {
    setButtonDisabled(true);
    const timedSpeaking = setTimeout(() => {
      setSpeaking(true);
      speak({
        text: displayWord,
        voice: voices[profile.voice],
        rate: profile.rate,
        pitch: profile.pitch,
      });
      setSpeaking(false);
      setButtonDisabled(false);
    }, 5000);
    return () => clearTimeout(timedSpeaking);
  }, [displayWord]);

  return displayWord ? (
    <div className='flashcard-container'>
      <div className='flashcard-definition'>
        <div id='word'>
          <h1> {displayWord} </h1>
        </div>

        <div id='button-container'>
        <button
            {...(!speaking
              ? {
                  onClick: () => {
                    handleBack();
                  },
                }
              : {})}
          >
            BACK
          </button>
          <button
            disabled={buttonDisabled}
            {...(!speaking
              ? {
                  onClick: () => {
                    speak({
                      text: displayWord,
                      voice: voices[profile.voice],
                      rate: profile.rate,
                      pitch: profile.pitch,
                    });
                  },
                }
              : {})}
          >
            PRONOUNCE
          </button>
          <button
            {...(!speaking
              ? {
                  onClick: () => {
                    handleClick();
                  },
                }
              : {})}
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <h2>Loading Flashcards ...</h2>
    </div>
  );
};

export default FlashCard;
