import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import useSpeechRecognition from '../../hooks/useSpeechRecognition'
import * as fryWordService from '../../services/fryWordService'
import * as profileService from '../../services/profileService'
import styles from './styles.module.css'

const StudentPracticeMode = () => {
  const { user } = useAuth()
  const [currentLevel, setCurrentLevel] = useState(1)
  const [practiceWords, setPracticeWords] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [practiceMode, setPracticeMode] = useState('recognition') // recognition, pronunciation, spelling, reading
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [sessionActive, setSessionActive] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [showWord, setShowWord] = useState(true)
  const [loading, setLoading] = useState(false)
  const [practiceSettings, setPracticeSettings] = useState({
    wordCount: 10,
    enableHints: true,
    autoAdvance: true,
    speechFeedback: true,
    difficulty: 'adaptive'
  })
  const [studentProgress, setStudentProgress] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  const {
    isListening,
    transcript,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    supported: isSupported,
    error: speechError,
    checkWordMatch,
    getResponseTime,
    browserSupport
  } = useSpeechRecognition()

  useEffect(() => {
    if (user?.profile) {
      loadStudentData()
    }
  }, [user])

  useEffect(() => {
    if (studentProgress) {
      const levelData = fryWordService.determineStudentLevel(
        studentProgress.assessments || []
      )
      setCurrentLevel(levelData.recommendedLevel)
      setRecommendations(
        fryWordService.getPracticeRecommendations(studentProgress)
      )
    }
  }, [studentProgress])

  const loadStudentData = async () => {
    try {
      setLoading(true)
      const progress = await profileService.getStudentProgress(user.profile)
      setStudentProgress(progress)
    } catch (error) {
      console.error('Error loading student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startPracticeSession = useCallback(() => {
    const words = fryWordService.generateTestWordSet(
      currentLevel,
      practiceSettings.wordCount,
      {
        includeReview: true,
        reviewPercentage: 0.2,
        difficultyVariation: practiceSettings.difficulty === 'adaptive'
      }
    )

    setPracticeWords(words)
    setCurrentWordIndex(0)
    setScore({ correct: 0, total: 0 })
    setSessionActive(true)
    setFeedback(null)
    setShowWord(practiceMode !== 'spelling')
  }, [currentLevel, practiceSettings, practiceMode])

  const endPracticeSession = useCallback(async () => {
    setSessionActive(false)

    // Save practice session data
    if (score.total > 0) {
      try {
        const sessionData = {
          sessionType: 'practice',
          wordsUsed: practiceWords,
          startTime: new Date(Date.now() - score.total * 30000), // Estimate
          endTime: new Date(),
          sessionSettings: {
            practiceMode,
            wordCount: practiceSettings.wordCount,
            level: currentLevel
          },
          results: {
            totalWords: score.total,
            correctWords: score.correct,
            accuracy: score.total > 0 ? score.correct / score.total : 0
          }
        }

        await profileService.addTestSession(user.profile, sessionData)
      } catch (error) {
        console.error('Error saving practice session:', error)
      }
    }
  }, [
    sessionActive,
    score,
    practiceWords,
    practiceMode,
    practiceSettings,
    currentLevel,
    user.profile
  ])

  const handleResponse = useCallback(
    async (response, isCorrect, speechAssessmentData = null) => {
      const newScore = {
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1
      }
      setScore(newScore)

      // Enhanced assessment data for teacher review
      const responseData = {
        word: practiceWords[currentWordIndex],
        correct: isCorrect,
        timeSpent: speechAssessmentData?.responseTime || 3000,
        attempts: 1,
        studentResponse: response,
        practiceMode: practiceMode
      }

      // Add speech-specific data if available
      if (speechAssessmentData) {
        responseData.speechData = {
          transcript: speechAssessmentData.transcript,
          confidence: speechAssessmentData.confidence,
          pronunciationQuality: speechAssessmentData.pronunciationAttempt,
          responseTime: speechAssessmentData.responseTime
        }
      }

      // Save individual assessment with enhanced data
      try {
        const assessmentData = {
          testType: practiceMode,
          words: [practiceWords[currentWordIndex]],
          responses: [responseData],
          date: new Date(),
          teacherNotes: `Practice session - ${practiceMode} mode${
            speechAssessmentData ? ' (with speech analysis)' : ''
          }`,
          assessmentData: {
            practiceMode: true,
            level: currentLevel,
            sessionType: 'practice',
            speechAssessment: speechAssessmentData || null
          }
        }

        await profileService.addAssessment(user.profile, assessmentData)
      } catch (error) {
        console.error('Error saving assessment:', error)
      }

      // Show enhanced feedback
      setFeedback({
        isCorrect,
        correctWord: practiceWords[currentWordIndex],
        studentResponse: response,
        speechData: speechAssessmentData,
        confidence: speechAssessmentData?.confidence || null
      })

      // Auto-advance or wait for user
      if (practiceSettings.autoAdvance) {
        setTimeout(() => {
          nextWord()
        }, 2000)
      }
    },
    [
      score,
      practiceMode,
      practiceWords,
      currentWordIndex,
      currentLevel,
      user.profile,
      practiceSettings
    ]
  )

  const nextWord = useCallback(() => {
    setFeedback(null)
    resetTranscript()

    if (currentWordIndex + 1 >= practiceWords.length) {
      endPracticeSession()
    } else {
      setCurrentWordIndex((prev) => prev + 1)
      setShowWord(practiceMode !== 'spelling')
    }
  }, [
    currentWordIndex,
    practiceWords.length,
    practiceMode,
    endPracticeSession,
    resetTranscript
  ])

  const handleSpeechResponse = useCallback(() => {
    if (!transcript || !sessionActive) return

    const currentWord = practiceWords[currentWordIndex]
    const responseTime = getResponseTime()

    // Use the enhanced word matching from the hook
    const isCorrect = checkWordMatch(currentWord, 0.7) // 70% similarity threshold

    // Enhanced assessment data for teachers
    const assessmentData = {
      transcript: transcript,
      targetWord: currentWord,
      confidence: confidence,
      responseTime: responseTime,
      similarity: isCorrect ? 1.0 : 0.0, // Could be enhanced with actual similarity score
      pronunciationAttempt: {
        spokenText: transcript,
        expectedText: currentWord,
        matchQuality: isCorrect ? 'good' : 'poor',
        confidenceScore: confidence
      }
    }

    console.log('Speech Assessment Data:', assessmentData) // For teacher review
    handleResponse(transcript, isCorrect, assessmentData)
    stopListening()
  }, [
    transcript,
    sessionActive,
    practiceWords,
    currentWordIndex,
    confidence,
    checkWordMatch,
    getResponseTime,
    handleResponse,
    stopListening
  ])

  const handleTextResponse = useCallback(
    (text) => {
      if (!sessionActive) return

      const currentWord = practiceWords[currentWordIndex]
      const isCorrect = text.toLowerCase().trim() === currentWord.toLowerCase()

      handleResponse(text, isCorrect)
    },
    [sessionActive, practiceWords, currentWordIndex, handleResponse]
  )

  const speakWord = useCallback(
    (word) => {
      if (!practiceSettings.speechFeedback) return

      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 0.8
      utterance.volume = 0.8
      speechSynthesis.speak(utterance)
    },
    [practiceSettings.speechFeedback]
  )

  const toggleWordVisibility = () => {
    setShowWord(!showWord)
  }

  const getCurrentWord = () => {
    return practiceWords[currentWordIndex] || ''
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading practice mode...</div>
      </div>
    )
  }

  if (!sessionActive) {
    return (
      <div className={styles.container}>
        <div className={styles.setupPanel}>
          <h1>Practice Mode</h1>

          {recommendations.length > 0 && (
            <div className={styles.recommendations}>
              <h3>📚 Practice Recommendations</h3>
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`${styles.recommendation} ${styles[rec.priority]}`}
                >
                  <div className={styles.recMessage}>{rec.message}</div>
                  <div className={styles.recAction}>{rec.action}</div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.levelSelector}>
            <h3>Reading Level</h3>
            <div className={styles.levelButtons}>
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  className={`${styles.levelButton} ${
                    currentLevel === level ? styles.active : ''
                  }`}
                  onClick={() => setCurrentLevel(level)}
                >
                  Level {level}
                  <span className={styles.levelDesc}>
                    {fryWordService.FRY_WORD_LEVELS[`level${level}`]?.targetAge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modeSelector}>
            <h3>Practice Type</h3>
            <div className={styles.modeButtons}>
              <button
                className={`${styles.modeButton} ${
                  practiceMode === 'recognition' ? styles.active : ''
                }`}
                onClick={() => setPracticeMode('recognition')}
              >
                👁️ Recognition
                <span>See and identify words</span>
              </button>
              <button
                className={`${styles.modeButton} ${
                  practiceMode === 'pronunciation' ? styles.active : ''
                }`}
                onClick={() => setPracticeMode('pronunciation')}
              >
                🗣️ Pronunciation
                <span>Say words aloud</span>
              </button>
              <button
                className={`${styles.modeButton} ${
                  practiceMode === 'spelling' ? styles.active : ''
                }`}
                onClick={() => setPracticeMode('spelling')}
              >
                ✏️ Spelling
                <span>Spell words correctly</span>
              </button>
              <button
                className={`${styles.modeButton} ${
                  practiceMode === 'reading' ? styles.active : ''
                }`}
                onClick={() => setPracticeMode('reading')}
              >
                📖 Reading
                <span>Read words in context</span>
              </button>
            </div>
          </div>

          <div className={styles.settings}>
            <h3>Practice Settings</h3>
            <div className={styles.settingsGrid}>
              <div className={styles.setting}>
                <label>Number of Words</label>
                <select
                  value={practiceSettings.wordCount}
                  onChange={(e) =>
                    setPracticeSettings((prev) => ({
                      ...prev,
                      wordCount: parseInt(e.target.value)
                    }))
                  }
                >
                  <option value={5}>5 words</option>
                  <option value={10}>10 words</option>
                  <option value={15}>15 words</option>
                  <option value={20}>20 words</option>
                </select>
              </div>

              <div className={styles.setting}>
                <label>
                  <input
                    type="checkbox"
                    checked={practiceSettings.enableHints}
                    onChange={(e) =>
                      setPracticeSettings((prev) => ({
                        ...prev,
                        enableHints: e.target.checked
                      }))
                    }
                  />
                  Enable Hints
                </label>
              </div>

              <div className={styles.setting}>
                <label>
                  <input
                    type="checkbox"
                    checked={practiceSettings.autoAdvance}
                    onChange={(e) =>
                      setPracticeSettings((prev) => ({
                        ...prev,
                        autoAdvance: e.target.checked
                      }))
                    }
                  />
                  Auto Advance
                </label>
              </div>

              <div className={styles.setting}>
                <label>
                  <input
                    type="checkbox"
                    checked={practiceSettings.speechFeedback}
                    onChange={(e) =>
                      setPracticeSettings((prev) => ({
                        ...prev,
                        speechFeedback: e.target.checked
                      }))
                    }
                  />
                  Speech Feedback
                </label>
              </div>
            </div>
          </div>

          <button className={styles.startButton} onClick={startPracticeSession}>
            Start Practice Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.practicePanel}>
        <div className={styles.header}>
          <div className={styles.progress}>
            Word {currentWordIndex + 1} of {practiceWords.length}
          </div>
          <div className={styles.score}>
            Score: {score.correct}/{score.total}
          </div>
          <button className={styles.endButton} onClick={endPracticeSession}>
            End Session
          </button>
        </div>

        <div className={styles.wordDisplay}>
          {practiceMode === 'recognition' && (
            <div className={styles.recognitionMode}>
              <div className={styles.word}>{getCurrentWord()}</div>
              <div className={styles.instructions}>
                Do you know this word? Click the buttons below.
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={styles.knowButton}
                  onClick={() => handleResponse(getCurrentWord(), true)}
                >
                  I know this word
                </button>
                <button
                  className={styles.dontKnowButton}
                  onClick={() => handleResponse('unknown', false)}
                >
                  I don't know
                </button>
                {practiceSettings.speechFeedback && (
                  <button
                    className={styles.speakButton}
                    onClick={() => speakWord(getCurrentWord())}
                  >
                    🔊 Hear Word
                  </button>
                )}
              </div>
            </div>
          )}

          {practiceMode === 'pronunciation' && (
            <div className={styles.pronunciationMode}>
              <div className={styles.word}>{getCurrentWord()}</div>
              <div className={styles.instructions}>
                Say this word aloud clearly. The system will listen and provide
                feedback.
              </div>

              {/* Speech Recognition Status */}
              {!isSupported && (
                <div className={styles.browserInfo}>
                  <h4>Speech Recognition Status:</h4>
                  <p>
                    Webkit Support:{' '}
                    {browserSupport?.hasWebkitSpeechRecognition ? '✅' : '❌'}
                  </p>
                  <p>
                    Native Support:{' '}
                    {browserSupport?.hasSpeechRecognition ? '✅' : '❌'}
                  </p>
                  <p>
                    Please ensure you're using Chrome or Edge browser for best
                    results.
                  </p>
                </div>
              )}

              {isSupported ? (
                <div className={styles.speechControls}>
                  <button
                    className={`${styles.micButton} ${
                      isListening ? styles.listening : ''
                    }`}
                    onClick={isListening ? stopListening : startListening}
                  >
                    {isListening ? '🛑 Stop Recording' : '🎤 Start Speaking'}
                  </button>

                  {isListening && (
                    <div className={styles.listeningIndicator}>
                      <div className={styles.pulseIndicator}></div>
                      <span>Listening... Speak clearly!</span>
                    </div>
                  )}

                  {transcript && (
                    <div className={styles.transcriptDisplay}>
                      <div className={styles.transcriptLabel}>You said:</div>
                      <div className={styles.transcript}>"{transcript}"</div>
                      {confidence > 0 && (
                        <div className={styles.confidence}>
                          Confidence: {Math.round(confidence * 100)}%
                        </div>
                      )}
                    </div>
                  )}

                  {speechError && (
                    <div className={styles.speechError}>
                      ⚠️ {speechError} - Please try again
                    </div>
                  )}

                  {transcript && (
                    <button
                      className={styles.submitButton}
                      onClick={handleSpeechResponse}
                    >
                      Submit Answer
                    </button>
                  )}

                  <div className={styles.speechTips}>
                    <h4>💡 Tips for better recognition:</h4>
                    <ul>
                      <li>Speak clearly and at normal speed</li>
                      <li>Ensure your microphone is working</li>
                      <li>Minimize background noise</li>
                      <li>Allow microphone permissions when prompted</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className={styles.noSpeech}>
                  <div className={styles.fallbackMode}>
                    <p>
                      Speech recognition not available. Manual assessment mode:
                    </p>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.correctButton}
                        onClick={() => handleResponse(getCurrentWord(), true)}
                      >
                        ✅ Pronounced Correctly
                      </button>
                      <button
                        className={styles.incorrectButton}
                        onClick={() => handleResponse('incorrect', false)}
                      >
                        ❌ Needs Practice
                      </button>
                      <button
                        className={styles.helpButton}
                        onClick={() => speakWord(getCurrentWord())}
                      >
                        🔊 Hear Word Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {practiceMode === 'spelling' && (
            <div className={styles.spellingMode}>
              {practiceSettings.speechFeedback && (
                <button
                  className={styles.speakButton}
                  onClick={() => speakWord(getCurrentWord())}
                >
                  🔊 Hear Word
                </button>
              )}
              <div className={styles.instructions}>
                Listen to the word and spell it correctly.
              </div>
              <div className={styles.spellingInput}>
                <input
                  type="text"
                  placeholder="Type the word here..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTextResponse(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  autoFocus
                />
              </div>
              {practiceSettings.enableHints && showWord && (
                <div className={styles.hint}>
                  Hint: The word has {getCurrentWord().length} letters
                  <button onClick={toggleWordVisibility}>Hide Hint</button>
                </div>
              )}
            </div>
          )}

          {practiceMode === 'reading' && (
            <div className={styles.readingMode}>
              <div className={styles.sentence}>
                The word{' '}
                <span className={styles.targetWord}>{getCurrentWord()}</span> is
                important to learn.
              </div>
              <div className={styles.instructions}>
                Read this sentence aloud. Focus on the highlighted word.
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={styles.readButton}
                  onClick={() => handleResponse(getCurrentWord(), true)}
                >
                  I read it correctly
                </button>
                {practiceSettings.speechFeedback && (
                  <button
                    className={styles.speakButton}
                    onClick={() => speakWord(getCurrentWord())}
                  >
                    🔊 Hear Word
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`${styles.feedback} ${
              feedback.isCorrect ? styles.correct : styles.incorrect
            }`}
          >
            <div className={styles.feedbackIcon}>
              {feedback.isCorrect ? '✅' : '❌'}
            </div>
            <div className={styles.feedbackMessage}>
              {feedback.isCorrect
                ? 'Excellent! Well done!'
                : `The word was "${feedback.correctWord}"`}
              {!feedback.isCorrect && feedback.studentResponse && (
                <div className={styles.studentAnswer}>
                  You said: "{feedback.studentResponse}"
                </div>
              )}

              {/* Enhanced feedback for speech recognition */}
              {feedback.speechData && (
                <div className={styles.speechFeedback}>
                  <div className={styles.speechDetails}>
                    <div className={styles.speechMetric}>
                      <span className={styles.label}>
                        Recognition Confidence:
                      </span>
                      <span className={styles.value}>
                        {Math.round((feedback.confidence || 0) * 100)}%
                      </span>
                    </div>
                    {feedback.speechData.responseTime && (
                      <div className={styles.speechMetric}>
                        <span className={styles.label}>Response Time:</span>
                        <span className={styles.value}>
                          {(feedback.speechData.responseTime / 1000).toFixed(1)}
                          s
                        </span>
                      </div>
                    )}
                  </div>

                  {!feedback.isCorrect && (
                    <div className={styles.pronunciationTip}>
                      💡 Try speaking more clearly or closer to the microphone
                    </div>
                  )}
                </div>
              )}
            </div>
            {!practiceSettings.autoAdvance && (
              <button className={styles.nextButton} onClick={nextWord}>
                Next Word
              </button>
            )}
          </div>
        )}

        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${((currentWordIndex + 1) / practiceWords.length) * 100}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default StudentPracticeMode
