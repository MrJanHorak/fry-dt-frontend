import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket from '../../hooks/useSocket'
import useSpeechRecognition from '../../hooks/useSpeechRecognition'
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis'
import styles from './styles.module.css'

const StudentTestingInterface = ({ user, room, socket }) => {
  const navigate = useNavigate()
  const { emit, on, off, isConnected } = useSocket(socket)

  // Speech hooks
  const {
    isListening,
    transcript,
    finalTranscript,
    confidence,
    error: speechError,
    supported: speechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
    getResponseTime,
    checkWordMatch
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    lang: 'en-US'
  })

  const {
    speak,
    speaking,
    supported: speechSynthesisSupported
  } = useSpeechSynthesis()

  // Test session state
  const [currentSession, setCurrentSession] = useState(null)
  const [currentWord, setCurrentWord] = useState(null)
  const [testType, setTestType] = useState(null)
  const [isWaitingForWord, setIsWaitingForWord] = useState(true)
  const [hasSubmittedResponse, setHasSubmittedResponse] = useState(false)

  // Response state
  const [typedResponse, setTypedResponse] = useState('')
  const [responseStartTime, setResponseStartTime] = useState(null)
  const [showWordDisplay, setShowWordDisplay] = useState(false)

  // UI state
  const [notification, setNotification] = useState(null)
  const [error, setError] = useState(null)
  const [isSessionActive, setIsSessionActive] = useState(false)

  const wordDisplayTimeoutRef = useRef(null)

  // Handle socket events
  useEffect(() => {
    if (!isConnected) return

    // Handle test session starting
    const handleTestSessionStarted = (data) => {
      console.log('Test session started:', data)
      setCurrentSession(data)
      setIsSessionActive(true)
      setIsWaitingForWord(true)
      setNotification(`Test session started - ${data.testType}`)
      setTimeout(() => setNotification(null), 3000)
    }

    // Handle receiving a word to test
    const handleReceiveTestWord = (data) => {
      console.log('Received test word:', data)
      setCurrentWord(data)
      setTestType(data.testType)
      setIsWaitingForWord(false)
      setHasSubmittedResponse(false)
      setResponseStartTime(Date.now())
      resetTranscript()
      setTypedResponse('')

      // Show word display for recognition/reading tests
      if (data.testType === 'recognition' || data.testType === 'reading') {
        setShowWordDisplay(true)
        // Auto-hide word after a few seconds for recognition tests
        if (data.testType === 'recognition') {
          wordDisplayTimeoutRef.current = setTimeout(() => {
            setShowWordDisplay(false)
          }, 3000)
        }
      }

      // Auto-speak word for pronunciation tests
      if (data.testType === 'pronunciation' && speechSynthesisSupported) {
        setTimeout(() => speak(data.word), 500)
      }
    }

    // Handle test session ending
    const handleTestSessionEnded = (data) => {
      console.log('Test session ended:', data)
      setIsSessionActive(false)
      setCurrentSession(null)
      setCurrentWord(null)
      setIsWaitingForWord(true)
      setNotification('Test session completed')
      setTimeout(() => setNotification(null), 3000)
    }

    // Handle word pronunciation
    const handleWordPronunciation = (data) => {
      if (speechSynthesisSupported && data.word) {
        speak(data.word)
      }
    }

    on('test_session_started', handleTestSessionStarted)
    on('receive_test_word', handleReceiveTestWord)
    on('test_session_ended', handleTestSessionEnded)
    on('word_pronunciation', handleWordPronunciation)

    return () => {
      off('test_session_started', handleTestSessionStarted)
      off('receive_test_word', handleReceiveTestWord)
      off('test_session_ended', handleTestSessionEnded)
      off('word_pronunciation', handleWordPronunciation)

      if (wordDisplayTimeoutRef.current) {
        clearTimeout(wordDisplayTimeoutRef.current)
      }
    }
  }, [isConnected, on, off, resetTranscript, speak, speechSynthesisSupported])

  // Submit response when speech recognition completes
  useEffect(() => {
    if (
      finalTranscript &&
      currentWord &&
      testType === 'pronunciation' &&
      !hasSubmittedResponse
    ) {
      submitResponse()
    }
  }, [finalTranscript, currentWord, testType, hasSubmittedResponse])

  // Submit response to teacher
  const submitResponse = useCallback(() => {
    if (!currentWord || hasSubmittedResponse) return

    const responseTime = responseStartTime ? Date.now() - responseStartTime : 0
    let response = null
    let recognized = false

    switch (testType) {
      case 'pronunciation':
        response = finalTranscript
        recognized = checkWordMatch(currentWord.word, 0.7)
        break
      case 'spelling':
        response = typedResponse
        recognized =
          typedResponse.toLowerCase().trim() ===
          currentWord.word.toLowerCase().trim()
        break
      case 'recognition':
        response = 'viewed'
        recognized = true // Teacher will assess manually
        break
      case 'reading':
        response = finalTranscript || 'read_aloud'
        recognized = true // Teacher will assess fluency
        break
      default:
        response = finalTranscript || typedResponse
    }

    const responseData = {
      sessionId: currentSession.sessionId,
      word: currentWord.word,
      studentId: user._id,
      studentName: user.name,
      response,
      responseTime,
      testType,
      recognized,
      confidence: confidence || 0
    }

    emit('submit_test_response', responseData)
    setHasSubmittedResponse(true)
    setNotification('Response submitted!')
    setTimeout(() => setNotification(null), 2000)

    // Stop listening if in pronunciation mode
    if (isListening) {
      stopListening()
    }
  }, [
    currentWord,
    hasSubmittedResponse,
    responseStartTime,
    testType,
    finalTranscript,
    typedResponse,
    checkWordMatch,
    confidence,
    currentSession,
    user,
    emit,
    isListening,
    stopListening
  ])

  // Start pronunciation test
  const startPronunciationTest = () => {
    if (!speechRecognitionSupported) {
      setError('Speech recognition not supported in your browser')
      return
    }

    resetTranscript()
    setResponseStartTime(Date.now())
    startListening()
  }

  // Request word pronunciation
  const requestPronunciation = () => {
    if (currentWord) {
      emit('request_word_pronunciation', {
        word: currentWord.word,
        studentId: user._id,
        sessionId: currentSession?.sessionId
      })
    }
  }

  // Handle spelling input
  const handleSpellingSubmit = (e) => {
    e.preventDefault()
    if (typedResponse.trim()) {
      submitResponse()
    }
  }

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Connection Error</h3>
          <p>Not connected to server. Please check your connection.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Student Testing</h1>
        <div className={styles.studentInfo}>
          <span>Student: {user.name}</span>
          <span>Room: {room}</span>
          {currentSession && <span>Test Type: {testType}</span>}
        </div>
      </div>

      {notification && (
        <div className={styles.notification}>{notification}</div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {speechError && (
        <div className={styles.error}>
          <p>Speech Recognition Error: {speechError}</p>
          <button onClick={() => resetTranscript()}>Reset</button>
        </div>
      )}

      {!isSessionActive ? (
        <div className={styles.waitingRoom}>
          <div className={styles.waitingCard}>
            <h2>Waiting for Test Session</h2>
            <p>Please wait for your teacher to start a test session.</p>
            <div className={styles.loadingSpinner}></div>
          </div>
        </div>
      ) : (
        <div className={styles.testingArea}>
          {isWaitingForWord ? (
            <div className={styles.waitingForWord}>
              <h2>Waiting for Next Word</h2>
              <p>Your teacher will send you a word to test shortly.</p>
              <div className={styles.loadingSpinner}></div>
            </div>
          ) : (
            <div className={styles.wordTest}>
              {/* Word Recognition Test */}
              {testType === 'recognition' && (
                <div className={styles.recognitionTest}>
                  <h2>Word Recognition</h2>
                  {showWordDisplay ? (
                    <div className={styles.wordDisplay}>
                      <div className={styles.displayedWord}>
                        {currentWord.word}
                      </div>
                      <p>Look at this word carefully</p>
                    </div>
                  ) : (
                    <div className={styles.afterDisplay}>
                      <p>Did you recognize the word?</p>
                      <button
                        onClick={submitResponse}
                        disabled={hasSubmittedResponse}
                        className={styles.submitButton}
                      >
                        {hasSubmittedResponse
                          ? 'Response Submitted'
                          : 'Yes, I recognized it'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pronunciation Test */}
              {testType === 'pronunciation' && (
                <div className={styles.pronunciationTest}>
                  <h2>Pronunciation Test</h2>
                  <p>Listen to the word and then say it out loud</p>

                  <div className={styles.pronunciationControls}>
                    <button
                      onClick={requestPronunciation}
                      disabled={speaking}
                      className={styles.hearWordButton}
                    >
                      {speaking ? 'Playing...' : '🔊 Hear Word Again'}
                    </button>
                  </div>

                  <div className={styles.speechControls}>
                    {!isListening && !hasSubmittedResponse && (
                      <button
                        onClick={startPronunciationTest}
                        className={styles.startSpeechButton}
                        disabled={!speechRecognitionSupported}
                      >
                        🎤 Say the Word
                      </button>
                    )}

                    {isListening && (
                      <div className={styles.listeningIndicator}>
                        <div className={styles.microphoneActive}></div>
                        <p>Listening... Say the word now</p>
                        <button
                          onClick={stopListening}
                          className={styles.stopButton}
                        >
                          Stop Recording
                        </button>
                      </div>
                    )}

                    {finalTranscript && (
                      <div className={styles.transcriptDisplay}>
                        <p>
                          You said: "<strong>{finalTranscript}</strong>"
                        </p>
                        <p>Confidence: {Math.round(confidence * 100)}%</p>
                      </div>
                    )}

                    {hasSubmittedResponse && (
                      <div className={styles.responseSubmitted}>
                        <p>✓ Response submitted to teacher</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Spelling Test */}
              {testType === 'spelling' && (
                <div className={styles.spellingTest}>
                  <h2>Spelling Test</h2>
                  <p>Listen to the word and type how you think it's spelled</p>

                  <button
                    onClick={requestPronunciation}
                    disabled={speaking}
                    className={styles.hearWordButton}
                  >
                    {speaking ? 'Playing...' : '🔊 Hear Word'}
                  </button>

                  <form
                    onSubmit={handleSpellingSubmit}
                    className={styles.spellingForm}
                  >
                    <input
                      type="text"
                      value={typedResponse}
                      onChange={(e) => setTypedResponse(e.target.value)}
                      placeholder="Type the word here..."
                      disabled={hasSubmittedResponse}
                      className={styles.spellingInput}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!typedResponse.trim() || hasSubmittedResponse}
                      className={styles.submitButton}
                    >
                      {hasSubmittedResponse ? 'Submitted' : 'Submit Spelling'}
                    </button>
                  </form>

                  {hasSubmittedResponse && (
                    <div className={styles.responseSubmitted}>
                      <p>
                        ✓ Your spelling "{typedResponse}" has been submitted
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reading Test */}
              {testType === 'reading' && (
                <div className={styles.readingTest}>
                  <h2>Reading Test</h2>
                  <div className={styles.wordDisplay}>
                    <div className={styles.displayedWord}>
                      {currentWord.word}
                    </div>
                    <p>Read this word out loud</p>
                  </div>

                  <div className={styles.speechControls}>
                    {!isListening && !hasSubmittedResponse && (
                      <button
                        onClick={startPronunciationTest}
                        className={styles.startSpeechButton}
                        disabled={!speechRecognitionSupported}
                      >
                        🎤 Start Reading
                      </button>
                    )}

                    {isListening && (
                      <div className={styles.listeningIndicator}>
                        <div className={styles.microphoneActive}></div>
                        <p>Reading... Speak clearly</p>
                        <button
                          onClick={stopListening}
                          className={styles.stopButton}
                        >
                          Finish Reading
                        </button>
                      </div>
                    )}

                    {hasSubmittedResponse && (
                      <div className={styles.responseSubmitted}>
                        <p>✓ Reading submitted to teacher</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Browser Support Warnings */}
              {(testType === 'pronunciation' || testType === 'reading') &&
                !speechRecognitionSupported && (
                  <div className={styles.browserWarning}>
                    <p>
                      ⚠️ Speech recognition is not supported in your browser.
                      Please use Chrome or Edge for the best experience.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentTestingInterface
