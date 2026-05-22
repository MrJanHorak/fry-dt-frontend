import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdCheckCircle, MdMic, MdTimer, MdVolumeUp } from 'react-icons/md'
import useSocket from '../../hooks/useSocket'
import useSpeechRecognition from '../../hooks/useSpeechRecognition'
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis'
import styles from './styles.module.css'

const RECOGNITION_COUNTDOWN_START = 3
const RECOGNITION_LISTEN_WINDOW_MS = 4000

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
  const [recognitionCountdown, setRecognitionCountdown] = useState(null)
  const [recognitionTimedOut, setRecognitionTimedOut] = useState(false)

  // UI state
  const [error, setError] = useState(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const transcriptText = finalTranscript || transcript
  const usesSpeechCapture =
    testType === 'recognition' ||
    testType === 'pronunciation' ||
    testType === 'reading'
  const countdownTimeoutRef = useRef(null)
  const recognitionWindowTimeoutRef = useRef(null)
  const submittedWordRef = useRef(null)
  const wasListeningRef = useRef(false)

  const clearRecognitionTimers = useCallback(() => {
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current)
      countdownTimeoutRef.current = null
    }

    if (recognitionWindowTimeoutRef.current) {
      clearTimeout(recognitionWindowTimeoutRef.current)
      recognitionWindowTimeoutRef.current = null
    }
  }, [])

  // Handle socket events
  useEffect(() => {
    if (!isConnected) return

    // Handle test session starting
    const handleTestSessionStarted = (data) => {
      console.log('Test session started:', data)
      setCurrentSession(data)
      setIsSessionActive(true)
      setIsWaitingForWord(true)
    }

    // Handle receiving a word to test
    const handleReceiveTestWord = (data) => {
      console.log('Received test word:', data)
      clearRecognitionTimers()
      submittedWordRef.current = null
      setCurrentWord(data)
      setTestType(data.testType)
      setIsWaitingForWord(false)
      setHasSubmittedResponse(false)
      setResponseStartTime(data.testType === 'recognition' ? null : Date.now())
      setRecognitionCountdown(
        data.testType === 'recognition' ? RECOGNITION_COUNTDOWN_START : null
      )
      setRecognitionTimedOut(false)
      resetTranscript()
      setTypedResponse('')
      setError(null)

      // Auto-speak word for pronunciation tests
      if (data.testType === 'pronunciation' && speechSynthesisSupported) {
        setTimeout(() => speak(data.word), 500)
      }
    }

    // Handle test session ending
    const handleTestSessionEnded = (data) => {
      console.log('Test session ended:', data)
      clearRecognitionTimers()
      submittedWordRef.current = null
      setIsSessionActive(false)
      setCurrentSession(null)
      setCurrentWord(null)
      setIsWaitingForWord(true)
      setRecognitionCountdown(null)
      setRecognitionTimedOut(false)
      setResponseStartTime(null)
      navigate('/student-practice', {
        replace: true,
        state: {
          source: 'testing-session-complete',
          completedSessionId: data?.sessionId || null,
          completedAt: data?.endTime || Date.now()
        }
      })
    }

    // Handle word pronunciation
    const handleWordPronunciation = (data) => {
      if (speechSynthesisSupported && data.word) {
        speak(data.word)
      }
    }

    const handleResponseSubmitted = (data) => {
      if (
        data?.sessionId === currentSession?.sessionId &&
        data?.word === currentWord?.word
      ) {
        setHasSubmittedResponse(true)
        setRecognitionTimedOut(false)
        setError(null)
      }
    }

    const handleTestError = (data) => {
      if (data?.message) {
        setError(data.message)
      }

      if (!hasSubmittedResponse) {
        submittedWordRef.current = null
      }
    }

    on('test_session_started', handleTestSessionStarted)
    on('receive_test_word', handleReceiveTestWord)
    on('test_session_ended', handleTestSessionEnded)
    on('word_pronunciation', handleWordPronunciation)
    on('response_submitted', handleResponseSubmitted)
    on('test_error', handleTestError)

    return () => {
      off('test_session_started', handleTestSessionStarted)
      off('receive_test_word', handleReceiveTestWord)
      off('test_session_ended', handleTestSessionEnded)
      off('word_pronunciation', handleWordPronunciation)
      off('response_submitted', handleResponseSubmitted)
      off('test_error', handleTestError)
      clearRecognitionTimers()
    }
  }, [
    clearRecognitionTimers,
    currentSession?.sessionId,
    currentWord?.word,
    hasSubmittedResponse,
    isConnected,
    navigate,
    on,
    off,
    resetTranscript,
    speak,
    speechSynthesisSupported
  ])

  // Submit response to teacher
  const submitResponse = useCallback((overrides = {}) => {
    if (!currentWord || hasSubmittedResponse) return

    const submissionKey = [
      currentSession?.sessionId || 'session',
      currentWord.sequence || currentWord.word,
      user.profile || user._id
    ].join(':')

    if (submittedWordRef.current === submissionKey) {
      return
    }

    submittedWordRef.current = submissionKey

    const fallbackResponseTime = responseStartTime
      ? Date.now() - responseStartTime
      : 0
    let responseTime = usesSpeechCapture
      ? getResponseTime() || fallbackResponseTime
      : fallbackResponseTime
    let response = null
    let recognized = false
    let responseConfidence = confidence || 0

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
        response = transcriptText
        recognized = Boolean(transcriptText) && checkWordMatch(currentWord.word, 0.55)
        break
      case 'reading':
        response = transcriptText || 'read_aloud'
        recognized = Boolean(transcriptText) && checkWordMatch(currentWord.word, 0.55)
        break
      default:
        response = transcriptText || typedResponse
    }

    if (Object.prototype.hasOwnProperty.call(overrides, 'response')) {
      response = overrides.response
    }

    if (Object.prototype.hasOwnProperty.call(overrides, 'recognized')) {
      recognized = overrides.recognized
    }

    if (Object.prototype.hasOwnProperty.call(overrides, 'responseTime')) {
      responseTime = overrides.responseTime
    }

    if (Object.prototype.hasOwnProperty.call(overrides, 'confidence')) {
      responseConfidence = overrides.confidence
    }

    const responseData = {
      sessionId: currentSession.sessionId,
      word: currentWord.word,
      studentId: user.profile || user._id,
      studentName: user.name,
      response,
      responseTime,
      testType,
      recognized,
      confidence: responseConfidence
    }

    emit('submit_test_response', responseData)
    setRecognitionTimedOut(false)
    setRecognitionCountdown(null)
    setError(null)

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
    transcriptText,
    typedResponse,
    usesSpeechCapture,
    getResponseTime,
    checkWordMatch,
    confidence,
    currentSession,
    user,
    emit,
    isListening,
    stopListening
  ])

  // Recognition tests run on a countdown and then begin recording automatically.
  useEffect(() => {
    if (
      testType !== 'recognition' ||
      !currentWord ||
      hasSubmittedResponse ||
      isListening ||
      !speechRecognitionSupported ||
      recognitionCountdown === null
    ) {
      return
    }

    if (recognitionCountdown > 0) {
      countdownTimeoutRef.current = setTimeout(() => {
        setRecognitionCountdown((currentCount) =>
          currentCount === null ? null : currentCount - 1
        )
      }, 1000)

      return () => {
        if (countdownTimeoutRef.current) {
          clearTimeout(countdownTimeoutRef.current)
          countdownTimeoutRef.current = null
        }
      }
    }

    setRecognitionCountdown(null)
    setResponseStartTime(Date.now())
    setRecognitionTimedOut(false)
    startListening()
  }, [
    currentWord,
    hasSubmittedResponse,
    isListening,
    recognitionCountdown,
    speechRecognitionSupported,
    startListening,
    testType
  ])

  // Recognition should end on its own after a short response window.
  useEffect(() => {
    if (testType !== 'recognition' || !isListening || hasSubmittedResponse) {
      return
    }

    recognitionWindowTimeoutRef.current = setTimeout(() => {
      setRecognitionTimedOut(true)
      stopListening()
    }, RECOGNITION_LISTEN_WINDOW_MS)

    return () => {
      if (recognitionWindowTimeoutRef.current) {
        clearTimeout(recognitionWindowTimeoutRef.current)
        recognitionWindowTimeoutRef.current = null
      }
    }
  }, [hasSubmittedResponse, isListening, stopListening, testType])

  // Submit response when speech recognition completes
  useEffect(() => {
    if (
      finalTranscript &&
      currentWord &&
      usesSpeechCapture &&
      !hasSubmittedResponse
    ) {
      submitResponse()
    }
  }, [
    finalTranscript,
    currentWord,
    usesSpeechCapture,
    hasSubmittedResponse,
    submitResponse
  ])

  // Some browsers end recognition without a final transcript or timeout event.
  useEffect(() => {
    const wasListening = wasListeningRef.current

    if (
      testType === 'recognition' &&
      wasListening &&
      !isListening &&
      currentWord &&
      recognitionCountdown === null &&
      !hasSubmittedResponse &&
      !finalTranscript &&
      !transcriptText
    ) {
      submitResponse({
        response: 'No spoken response',
        recognized: false,
        confidence: 0,
        responseTime: getResponseTime() || RECOGNITION_LISTEN_WINDOW_MS
      })
    }

    wasListeningRef.current = isListening
  }, [
    currentWord,
    finalTranscript,
    getResponseTime,
    hasSubmittedResponse,
    isListening,
    recognitionCountdown,
    submitResponse,
    testType,
    transcriptText
  ])

  // If the timed recognition window ends without speech, record it for the teacher.
  useEffect(() => {
    if (
      testType !== 'recognition' ||
      !recognitionTimedOut ||
      isListening ||
      hasSubmittedResponse ||
      finalTranscript ||
      transcriptText
    ) {
      return
    }

    submitResponse({
      response: 'No spoken response',
      recognized: false,
      confidence: 0,
      responseTime: RECOGNITION_LISTEN_WINDOW_MS
    })
  }, [
    finalTranscript,
    hasSubmittedResponse,
    isListening,
    recognitionTimedOut,
    submitResponse,
    testType,
    transcriptText
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
        studentId: user.profile || user._id,
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
        <h1>Word Check</h1>
        <div className={styles.studentInfo}>
          <span>{user.name}</span>
          {currentSession && <span>{testType}</span>}
        </div>
      </div>

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
            <div className={styles.signalOrbit}>
              <div className={styles.signalRing}></div>
              <div className={styles.signalCore}>
                <MdMic aria-hidden="true" />
              </div>
            </div>
            <h2>Ready</h2>
            <div className={styles.waitingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.testingArea}>
          {isWaitingForWord ? (
            <div className={styles.waitingForWord}>
              <div className={styles.signalOrbit}>
                <div className={styles.signalRing}></div>
                <div className={styles.signalCore}>
                  <MdTimer aria-hidden="true" />
                </div>
              </div>
              <h2>Next</h2>
              <div className={styles.waitingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : (
            <div className={styles.wordTest}>
              {/* Word Recognition Test */}
              {testType === 'recognition' && (
                <div className={styles.recognitionTest}>
                  <div className={styles.wordDisplay}>
                    <div className={styles.displayedWord}>{currentWord.word}</div>
                  </div>

                  <div className={styles.speechControls}>
                    {recognitionCountdown !== null && speechRecognitionSupported && (
                      <div className={styles.countdownPanel}>
                        <div className={styles.countdownRing}>
                          <span>{recognitionCountdown || 'GO'}</span>
                        </div>
                      </div>
                    )}

                    {isListening && (
                      <div className={styles.listeningIndicator}>
                        <div className={styles.microphoneActive}></div>
                      </div>
                    )}

                    {hasSubmittedResponse && (
                      <div className={styles.responseSubmitted}>
                        <MdCheckCircle aria-hidden="true" />
                      </div>
                    )}
                  </div>
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
                      <MdVolumeUp aria-hidden="true" />
                      <span>{speaking ? 'Playing...' : 'Hear Word Again'}</span>
                    </button>
                  </div>

                  <div className={styles.speechControls}>
                    {!isListening && !hasSubmittedResponse && (
                      <button
                        onClick={startPronunciationTest}
                        className={styles.startSpeechButton}
                        disabled={!speechRecognitionSupported}
                      >
                        <MdMic aria-hidden="true" />
                        <span>Say the Word</span>
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

                    {hasSubmittedResponse && (
                      <div className={styles.responseSubmitted}>
                        <MdCheckCircle aria-hidden="true" />
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
                    <MdVolumeUp aria-hidden="true" />
                    <span>{speaking ? 'Playing...' : 'Hear Word'}</span>
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
                      <MdCheckCircle aria-hidden="true" />
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
                        <MdMic aria-hidden="true" />
                        <span>Read the Word</span>
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
                        <MdCheckCircle aria-hidden="true" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Browser Support Warnings */}
              {(testType === 'recognition' ||
                testType === 'pronunciation' ||
                testType === 'reading') &&
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
