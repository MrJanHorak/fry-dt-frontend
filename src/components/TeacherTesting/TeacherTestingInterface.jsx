import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket from '../../hooks/useSocket'
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis'
import FryWordList from '../../assets/FryWordList.json'
import styles from './styles.module.css'

const TeacherTestingInterface = ({ user, room, socket }) => {
  const navigate = useNavigate()
  const { emit, on, off, isConnected } = useSocket(socket)
  const { speak, speaking, supported: speechSupported } = useSpeechSynthesis()

  // Test session state
  const [currentSession, setCurrentSession] = useState(null)
  const [selectedWords, setSelectedWords] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [testType, setTestType] = useState('recognition')
  const [fryLevel, setFryLevel] = useState(1)
  const [studentResponses, setStudentResponses] = useState([])
  const [connectedStudents, setConnectedStudents] = useState([])
  const [sessionNotes, setSessionNotes] = useState('')

  // Assessment state
  const [currentAssessment, setCurrentAssessment] = useState(null)
  const [assessmentNotes, setAssessmentNotes] = useState('')
  const [wordScore, setWordScore] = useState(null)

  // UI state
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showWordSelection, setShowWordSelection] = useState(true)
  const [error, setError] = useState(null)

  const sessionIdRef = useRef(null)

  // Generate session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get available words for selected FRY level
  const getAvailableWords = useCallback(() => {
    const levelKey = `level${fryLevel}`
    return FryWordList[levelKey] || []
  }, [fryLevel])

  // Handle socket events
  useEffect(() => {
    if (!isConnected) return

    // Listen for student responses
    const handleStudentResponse = (data) => {
      console.log('Received student response:', data)
      setStudentResponses((prev) => [
        ...prev,
        {
          ...data,
          id: `${data.studentId}_${Date.now()}`
        }
      ])
    }

    // Listen for students joining/leaving
    const handleRoomUsers = (users) => {
      const students = users.filter((u) => u.user?.role === 'student')
      setConnectedStudents(students)
    }

    // Listen for pronunciation requests
    const handlePronunciationRequest = (data) => {
      console.log('Student requested pronunciation:', data)
      // Optionally auto-pronounce or show notification to teacher
      if (speechSupported) {
        speak(data.word)
      }
    }

    on('student_test_response', handleStudentResponse)
    on('chatroom_users', handleRoomUsers)
    on('pronunciation_requested', handlePronunciationRequest)

    return () => {
      off('student_test_response', handleStudentResponse)
      off('chatroom_users', handleRoomUsers)
      off('pronunciation_requested', handlePronunciationRequest)
    }
  }, [isConnected, on, off, speak, speechSupported])

  // Start new test session
  const startTestSession = () => {
    if (selectedWords.length === 0) {
      setError('Please select at least one word to test')
      return
    }

    const sessionId = generateSessionId()
    sessionIdRef.current = sessionId

    const sessionData = {
      sessionId,
      teacherId: user._id,
      room,
      testType,
      wordsToTest: selectedWords,
      fryLevel
    }

    setCurrentSession(sessionData)
    setIsSessionActive(true)
    setCurrentWordIndex(0)
    setStudentResponses([])
    setShowWordSelection(false)
    setError(null)

    emit('start_test_session', sessionData)
  }

  // Send next word to students
  const sendCurrentWord = () => {
    if (!currentSession || currentWordIndex >= selectedWords.length) return

    const word = selectedWords[currentWordIndex]
    const wordData = {
      sessionId: currentSession.sessionId,
      word,
      testType,
      difficulty: 'medium',
      room,
      sequence: currentWordIndex + 1
    }

    emit('send_test_word', wordData)

    // Clear previous responses for this word
    setStudentResponses([])
  }

  // Move to next word
  const nextWord = () => {
    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex((prev) => prev + 1)
      setStudentResponses([])
    }
  }

  // Move to previous word
  const previousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex((prev) => prev - 1)
      setStudentResponses([])
    }
  }

  // Save assessment for a student response
  const saveAssessment = (response, recognized, score, notes) => {
    const assessmentData = {
      sessionId: currentSession.sessionId,
      word: response.word,
      studentId: response.studentId,
      teacherNotes: notes,
      score,
      recognized
    }

    emit('save_assessment_note', assessmentData)
    setCurrentAssessment(null)
    setAssessmentNotes('')
    setWordScore(null)
  }

  // End test session
  const endTestSession = () => {
    if (!currentSession) return

    const endData = {
      sessionId: currentSession.sessionId,
      room,
      completedCount: currentWordIndex + 1,
      totalWords: selectedWords.length
    }

    emit('end_test_session', endData)

    setIsSessionActive(false)
    setCurrentSession(null)
    setShowWordSelection(true)
    setStudentResponses([])
    setCurrentWordIndex(0)
  }

  // Pronounce current word
  const pronounceWord = () => {
    if (speechSupported && selectedWords[currentWordIndex]) {
      speak(selectedWords[currentWordIndex])
    }
  }

  // Handle word selection
  const toggleWordSelection = (word) => {
    setSelectedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    )
  }

  // Select words by level preset
  const selectWordsByLevel = (level, count = 10) => {
    const levelWords = getAvailableWords()
    const shuffled = [...levelWords].sort(() => Math.random() - 0.5)
    setSelectedWords(shuffled.slice(0, count))
  }

  const currentWord = selectedWords[currentWordIndex]
  const availableWords = getAvailableWords()

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
        <h1>Teacher Testing Interface</h1>
        <div className={styles.sessionInfo}>
          <span>Room: {room}</span>
          <span>Students Connected: {connectedStudents.length}</span>
          {currentSession && (
            <span>Session: {currentSession.sessionId.slice(-8)}</span>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {showWordSelection && (
        <div className={styles.wordSelection}>
          <h2>Select Words to Test</h2>

          <div className={styles.testSettings}>
            <div className={styles.setting}>
              <label>FRY Level:</label>
              <select
                value={fryLevel}
                onChange={(e) => setFryLevel(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.setting}>
              <label>Test Type:</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
              >
                <option value="recognition">Word Recognition</option>
                <option value="pronunciation">Pronunciation</option>
                <option value="spelling">Spelling</option>
                <option value="reading">Reading Fluency</option>
              </select>
            </div>
          </div>

          <div className={styles.quickSelect}>
            <h3>Quick Select:</h3>
            <button onClick={() => selectWordsByLevel(fryLevel, 5)}>
              Random 5 Words
            </button>
            <button onClick={() => selectWordsByLevel(fryLevel, 10)}>
              Random 10 Words
            </button>
            <button onClick={() => selectWordsByLevel(fryLevel, 20)}>
              Random 20 Words
            </button>
          </div>

          <div className={styles.wordGrid}>
            {availableWords.map((word) => (
              <div
                key={word}
                className={`${styles.wordCard} ${
                  selectedWords.includes(word) ? styles.selected : ''
                }`}
                onClick={() => toggleWordSelection(word)}
              >
                {word}
              </div>
            ))}
          </div>

          <div className={styles.selectedWords}>
            <h3>Selected Words ({selectedWords.length}):</h3>
            <div className={styles.selectedList}>
              {selectedWords.map((word, index) => (
                <span key={word} className={styles.selectedWord}>
                  {index + 1}. {word}
                </span>
              ))}
            </div>
          </div>

          <button
            className={styles.startButton}
            onClick={startTestSession}
            disabled={
              selectedWords.length === 0 || connectedStudents.length === 0
            }
          >
            Start Test Session
          </button>
        </div>
      )}

      {isSessionActive && (
        <div className={styles.testingSession}>
          <div className={styles.wordControls}>
            <h2>Testing Word: "{currentWord}"</h2>
            <div className={styles.wordNavigation}>
              <button onClick={previousWord} disabled={currentWordIndex === 0}>
                ← Previous
              </button>

              <span className={styles.wordCounter}>
                {currentWordIndex + 1} of {selectedWords.length}
              </span>

              <button
                onClick={nextWord}
                disabled={currentWordIndex >= selectedWords.length - 1}
              >
                Next →
              </button>
            </div>

            <div className={styles.wordActions}>
              <button onClick={sendCurrentWord} className={styles.sendWord}>
                Send Word to Students
              </button>
              <button
                onClick={pronounceWord}
                disabled={!speechSupported || speaking}
              >
                {speaking ? 'Speaking...' : 'Pronounce Word'}
              </button>
            </div>
          </div>

          <div className={styles.studentResponses}>
            <h3>Student Responses:</h3>
            {studentResponses.length === 0 ? (
              <p>Waiting for student responses...</p>
            ) : (
              <div className={styles.responsesList}>
                {studentResponses.map((response) => (
                  <div key={response.id} className={styles.responseCard}>
                    <div className={styles.responseHeader}>
                      <strong>{response.studentName}</strong>
                      <span className={styles.responseTime}>
                        {response.responseTime}ms
                      </span>
                    </div>

                    <div className={styles.responseContent}>
                      {testType === 'pronunciation' && (
                        <div>
                          <span className={styles.confidence}>
                            Confidence: {Math.round(response.confidence * 100)}%
                          </span>
                          <span className={styles.recognized}>
                            {response.recognized
                              ? '✓ Recognized'
                              : '✗ Not recognized'}
                          </span>
                        </div>
                      )}

                      {response.response && (
                        <div className={styles.spokenText}>
                          Spoken: "{response.response}"
                        </div>
                      )}
                    </div>

                    <button
                      className={styles.assessButton}
                      onClick={() => setCurrentAssessment(response)}
                    >
                      Add Assessment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.sessionControls}>
            <button onClick={endTestSession} className={styles.endSession}>
              End Session
            </button>
          </div>
        </div>
      )}

      {currentAssessment && (
        <div className={styles.assessmentModal}>
          <div className={styles.modalContent}>
            <h3>Assess Response</h3>
            <p>
              <strong>Student:</strong> {currentAssessment.studentName}
              <br />
              <strong>Word:</strong> {currentAssessment.word}
              <br />
              {currentAssessment.response && (
                <>
                  <strong>Response:</strong> {currentAssessment.response}
                  <br />
                </>
              )}
              <strong>Response Time:</strong> {currentAssessment.responseTime}ms
            </p>

            <div className={styles.assessmentForm}>
              <label>
                Recognized Correctly:
                <select
                  value={wordScore || ''}
                  onChange={(e) => setWordScore(e.target.value === 'true')}
                >
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>

              <label>
                Teacher Notes:
                <textarea
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                  placeholder="Add notes about student's performance..."
                  rows={4}
                />
              </label>

              <div className={styles.modalActions}>
                <button
                  onClick={() => {
                    saveAssessment(
                      currentAssessment,
                      wordScore,
                      wordScore ? 1 : 0,
                      assessmentNotes
                    )
                  }}
                  disabled={wordScore === null}
                >
                  Save Assessment
                </button>
                <button onClick={() => setCurrentAssessment(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherTestingInterface
