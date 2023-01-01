import React, { useEffect, useState, useTimeout } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

import '../../styles/FlashCard.css';
import SplitText from './SplitText';

const FlashCard = ({ profile, handleClick, displayWord }) => {
  const [speaking, setSpeaking] = useState(false);
  const { speak, voices } = useSpeechSynthesis();

  let toSpell = [];

  const spellWord = (e) => {
    toSpell = displayWord.split('');
    let time = (toSpell.length * 1000 + 1000) / profile.rate;

    setTimeout(() => {
      setSpeaking(false);
    }, [time]);
    setSpeaking(true);
    toSpell.forEach((letter) => {
      speak({
        text: letter,
        voice: voices[profile.voice],
        rate: profile.rate,
        pitch: profile.pitch,
      });
    });
  };

  useEffect(() => {
    const timedSpeaking = setTimeout(() => {
      console.log('I SHOULD BE SAYING SOMETHING!');
      setSpeaking(true);
      speak({
        text: displayWord,
        // voice: voices[profile.voice],
        // rate: profile.rate,
        // pitch: profile.pitch,
      });
      setSpeaking(false);
    }, 5000);
    return () => clearTimeout(timedSpeaking);
  }, [displayWord]);

  return displayWord ? (
    <div className='flashcard-container'>
      <div className='flashcard-definition'>
        <div id='word'>
          {speaking ? (
            <h1>
              <SplitText
                rate={profile.rate}
                displayWord={displayWord}
                role={'heading'}
              />{' '}
            </h1>
          ) : (
            <h1> {displayWord} </h1>
          )}
        </div>

        <div id='button-container'>
          <button
            {...(!speaking
              ? {
                  onClick: () => {
                    handleClick();
                    // sayWord()
                  },
                }
              : {})}
          >
            NEXT
          </button>
          <button
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
                    spellWord();
                  },
                }
              : {})}
          >
            SPELL
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
