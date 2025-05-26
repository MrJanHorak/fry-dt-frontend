import React, { useEffect, useState, useCallback, useRef } from 'react'
import { RiUserVoiceFill } from 'react-icons/ri'
import { IoArrowBack, IoArrowForward } from 'react-icons/io5'
import { MdVolumeOff, MdVolumeUp } from 'react-icons/md'
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis'
import { LoadingSpinner } from '../Loading/Loading'

import './FlashCard.css'

const FlashCard = ({
  profile,
  handleClick,
  handleBack,
  displayWord,
  isTest
}) => {
  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [autoSpoken, setAutoSpoken] = useState(false)
  const timeoutRef = useRef(null)

  const { speak, speaking, supported, error, getPreferredVoice } =
    useSpeechSynthesis({
      rate: profile?.rate || 1,
      pitch: profile?.pitch || 1,
      volume: profile?.volume || 1
    })

  // Get the appropriate voice for the profile
  const getVoice = useCallback(() => {
    if (profile?.voice !== undefined && profile.voice !== null) {
      return profile.voice
    }
    return getPreferredVoice('en')
  }, [profile?.voice, getPreferredVoice])

  // Speak the word with error handling
  const speakWord = useCallback(
    (customOptions = {}) => {
      if (!displayWord || !supported) return false

      const voiceOptions = {
        rate: profile?.rate || 1,
        pitch: profile?.pitch || 1,
        volume: profile?.volume || 1,
        voice: getVoice(),
        ...customOptions
      }

      return speak(displayWord, voiceOptions)
    },
    [displayWord, profile, supported, speak, getVoice]
  )

  // Auto-speak functionality for practice mode
  useEffect(() => {
    if (!isTest && displayWord && !autoSpoken) {
      setButtonDisabled(true)

      timeoutRef.current = setTimeout(() => {
        speakWord()
        setAutoSpoken(true)
        setButtonDisabled(false)
      }, 1000) // Reduced from 4 seconds for better UX

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    } else if (isTest) {
      setButtonDisabled(false)
    }
  }, [displayWord, isTest, autoSpoken, speakWord])

  // Reset auto-spoken state when word changes
  useEffect(() => {
    setAutoSpoken(false)
  }, [displayWord])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (speaking) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          handleBack()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleClick()
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          if (supported) speakWord()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [speaking, handleBack, handleClick, speakWord, supported])

  if (!displayWord) {
    return (
      <div className="flashcard-container flashcard-container--loading">
        <LoadingSpinner size="large" />
        <p>Loading flashcard...</p>
      </div>
    )
  }

  return (
    <div
      className="flashcard-container"
      role="main"
      aria-label="Flashcard practice"
      tabIndex={0}
    >
      <div className="flashcard-definition">
        <div id="word" role="region" aria-label="Current word">
          <h1 aria-live="polite">{displayWord}</h1>
          {error && (
            <div className="error-message" role="alert">
              <small>Speech not available: {error}</small>
            </div>
          )}
        </div>

        <div
          id="button-container"
          role="toolbar"
          aria-label="Flashcard controls"
        >
          <button
            onClick={handleBack}
            disabled={speaking}
            className="flashcard-btn flashcard-btn--back"
            aria-label="Previous word"
            title="Previous word (Left arrow)"
          >
            <IoArrowBack aria-hidden="true" />
            <span className="sr-only">Previous</span>
          </button>

          <button
            onClick={() => speakWord()}
            disabled={buttonDisabled || !supported}
            className={`flashcard-btn flashcard-btn--speak ${
              speaking ? 'flashcard-btn--speaking' : ''
            }`}
            aria-label={speaking ? 'Speaking word' : 'Speak word'}
            title="Speak word (Space or Enter)"
          >
            {speaking ? (
              <LoadingSpinner size="small" />
            ) : supported ? (
              <RiUserVoiceFill aria-hidden="true" />
            ) : (
              <MdVolumeOff aria-hidden="true" />
            )}
            <span className="sr-only">
              {speaking
                ? 'Speaking'
                : supported
                ? 'Speak word'
                : 'Speech not supported'}
            </span>
          </button>

          <button
            onClick={handleClick}
            disabled={speaking}
            className="flashcard-btn flashcard-btn--next"
            aria-label="Next word"
            title="Next word (Right arrow)"
          >
            <IoArrowForward aria-hidden="true" />
            <span className="sr-only">Next</span>
          </button>
        </div>

        {!isTest && (
          <div className="flashcard-instructions">
            <p>
              <small>
                Use arrow keys to navigate, spacebar to hear the word
                {speaking && ' (Speaking...)'}
              </small>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FlashCard
