import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import * as profileService from '../../services/profileService'
import styles from './styles.module.css'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [testSessions, setTestSessions] = useState([])
  const [progressData, setProgressData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [filters, setFilters] = useState({
    testType: 'all',
    wordLevel: 'all',
    sessionType: 'all'
  })

  // New state for speech recognition monitoring
  const [activeSpeechSessions, setActiveSpeechSessions] = useState([])
  const [speechMetrics, setSpeechMetrics] = useState({
    totalActiveSessions: 0,
    averageConfidence: 0,
    studentsNeedingHelp: [],
    totalWordsCompleted: 0
  })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(null)

  useEffect(() => {
    if (user?.profile) {
      loadStudents()
    }
  }, [user])

  useEffect(() => {
    if (selectedStudent) {
      loadStudentData()
    }
  }, [selectedStudent, dateRange, filters])

  useEffect(() => {
    if (activeTab === 'monitoring') {
      loadActiveSpeechSessions()
    }
  }, [activeTab, selectedStudent])

  useEffect(() => {
    if (autoRefresh && activeTab === 'monitoring') {
      const interval = setInterval(() => {
        loadActiveSpeechSessions()
      }, 5000) // Refresh every 5 seconds
      setRefreshInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }
  }, [autoRefresh, activeTab])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const profileData = await profileService.getProfile(user.profile)
      setStudents(profileData.students || [])
      if (profileData.students?.length > 0) {
        setSelectedStudent(profileData.students[0])
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStudentData = async () => {
    if (!selectedStudent) return

    try {
      setLoading(true)

      // Load assessments with filters
      const assessmentParams = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(filters.testType !== 'all' && { testType: filters.testType }),
        ...(filters.wordLevel !== 'all' && { wordLevel: filters.wordLevel })
      })

      const assessmentData = await profileService.getAssessments(
        selectedStudent._id,
        assessmentParams.toString()
      )
      setAssessments(assessmentData)

      // Load test sessions with filters
      const sessionParams = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(filters.sessionType !== 'all' && {
          sessionType: filters.sessionType
        })
      })

      const sessionData = await profileService.getTestSessions(
        selectedStudent._id,
        sessionParams.toString()
      )
      setTestSessions(sessionData)

      // Load progress data
      const progress = await profileService.getStudentProgress(
        selectedStudent._id
      )
      setProgressData(progress)
    } catch (error) {
      console.error('Error loading student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveSpeechSessions = async () => {
    try {
      // Get active pronunciation practice sessions for all students
      const activeSessionsData = await profileService.getActiveSpeechSessions(
        user.profile
      )
      setActiveSpeechSessions(activeSessionsData.sessions || [])

      // Calculate real-time metrics
      const metrics = calculateSpeechMetrics(activeSessionsData.sessions || [])
      setSpeechMetrics(metrics)
    } catch (error) {
      console.error('Error loading active speech sessions:', error)
    }
  }

  const calculateSpeechMetrics = (sessions) => {
    if (!sessions.length) {
      return {
        totalActiveSessions: 0,
        averageConfidence: 0,
        studentsNeedingHelp: [],
        totalWordsCompleted: 0
      }
    }

    const totalSessions = sessions.length
    const totalConfidence = sessions.reduce(
      (sum, session) => sum + (session.currentConfidence || 0),
      0
    )
    const averageConfidence = Math.round(totalConfidence / totalSessions)

    const totalWords = sessions.reduce(
      (sum, session) => sum + (session.wordsCompleted || 0),
      0
    )

    const studentsNeedingHelp = sessions.filter(
      (session) =>
        session.currentConfidence < 70 ||
        session.averageResponseTime > 4000 ||
        session.strugglingWords?.length > 0
    )

    return {
      totalActiveSessions: totalSessions,
      averageConfidence,
      studentsNeedingHelp,
      totalWordsCompleted: totalWords
    }
  }

  const calculateOverallAccuracy = useCallback(() => {
    if (!assessments.length) return 0
    const totalResponses = assessments.reduce(
      (sum, assessment) => sum + (assessment.responses?.length || 0),
      0
    )
    const correctResponses = assessments.reduce(
      (sum, assessment) =>
        sum + (assessment.responses?.filter((r) => r.correct).length || 0),
      0
    )
    return totalResponses > 0
      ? ((correctResponses / totalResponses) * 100).toFixed(1)
      : 0
  }, [assessments])

  const calculateAverageResponseTime = useCallback(() => {
    if (!assessments.length) return 0
    const allResponseTimes = assessments.flatMap(
      (assessment) => assessment.responses?.map((r) => r.timeSpent) || []
    )
    return allResponseTimes.length > 0
      ? (
          allResponseTimes.reduce((sum, time) => sum + time, 0) /
          allResponseTimes.length /
          1000
        ).toFixed(1)
      : 0
  }, [assessments])

  const getRecentTrends = useCallback(() => {
    if (!assessments.length) return { improving: false, declining: false }

    const sortedAssessments = [...assessments].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    )

    if (sortedAssessments.length < 3)
      return { improving: false, declining: false }

    const recent = sortedAssessments.slice(-3)
    const accuracies = recent.map((assessment) => {
      const total = assessment.responses?.length || 0
      const correct = assessment.responses?.filter((r) => r.correct).length || 0
      return total > 0 ? correct / total : 0
    })

    const isImproving =
      accuracies[2] > accuracies[0] && accuracies[1] <= accuracies[2]
    const isDeclining =
      accuracies[2] < accuracies[0] && accuracies[1] >= accuracies[2]

    return { improving: isImproving, declining: isDeclining }
  }, [assessments])

  const getWordLevelDistribution = useCallback(() => {
    if (!assessments.length) return {}

    const levelCounts = {}
    assessments.forEach((assessment) => {
      // Process each word in the assessment's words array
      const words = assessment.words || []
      words.forEach((word) => {
        // Determine word level based on FRY word lists (simplified)
        let level = 'unknown'
        if (word && word.length <= 3) level = 'level-1'
        else if (word && word.length <= 5) level = 'level-2'
        else if (word && word.length <= 7) level = 'level-3'
        else level = 'level-4+'

        levelCounts[level] = (levelCounts[level] || 0) + 1
      })
    })

    return levelCounts
  }, [assessments])

  const exportData = () => {
    if (!selectedStudent || !assessments.length) return

    const csvData = [
      [
        'Date',
        'Word',
        'Test Type',
        'Correct',
        'Response Time (s)',
        'Attempts',
        'Teacher Notes'
      ],
      ...assessments.flatMap(
        (assessment) =>
          assessment.responses?.map((response) => [
            new Date(assessment.date).toLocaleDateString(),
            response.word,
            assessment.testType,
            response.correct ? 'Yes' : 'No',
            ((response.timeSpent || 0) / 1000).toFixed(2),
            response.attempts || 1,
            assessment.teacherNotes || ''
          ]) || []
      )
    ]

    const csvContent = csvData.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedStudent.name}-progress-report-${
      new Date().toISOString().split('T')[0]
    }.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading && !students.length) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    )
  }

  if (!students.length) {
    return (
      <div className={styles.container}>
        <div className={styles.noStudents}>
          <h2>No Students Found</h2>
          <p>Add students to your profile to view their progress.</p>
        </div>
      </div>
    )
  }

  const trends = getRecentTrends()
  const wordLevelDist = getWordLevelDistribution()

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Teacher Dashboard</h1>
        <div className={styles.controls}>
          <select
            value={selectedStudent?._id || ''}
            onChange={(e) =>
              setSelectedStudent(students.find((s) => s._id === e.target.value))
            }
            className={styles.studentSelect}
          >
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name}
              </option>
            ))}
          </select>
          <button onClick={exportData} className={styles.exportBtn}>
            Export Data
          </button>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.dateRange}>
          <label>Date Range:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
          />
        </div>

        <div className={styles.filterControls}>
          <select
            value={filters.testType}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, testType: e.target.value }))
            }
          >
            <option value="all">All Test Types</option>
            <option value="recognition">Recognition</option>
            <option value="pronunciation">Pronunciation</option>
            <option value="spelling">Spelling</option>
            <option value="reading">Reading</option>
          </select>

          <select
            value={filters.sessionType}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, sessionType: e.target.value }))
            }
          >
            <option value="all">All Sessions</option>
            <option value="individual">Individual</option>
            <option value="group">Group</option>
            <option value="practice">Practice</option>
            <option value="assessment">Assessment</option>
          </select>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === 'overview' ? styles.active : ''
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'assessments' ? styles.active : ''
          }`}
          onClick={() => setActiveTab('assessments')}
        >
          Assessments
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'sessions' ? styles.active : ''
          }`}
          onClick={() => setActiveTab('sessions')}
        >
          Test Sessions
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'analytics' ? styles.active : ''
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'monitoring' ? styles.active : ''
          }`}
          onClick={() => setActiveTab('monitoring')}
        >
          Speech Monitoring
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Overall Accuracy</h3>
                <div className={styles.statValue}>
                  {calculateOverallAccuracy()}%
                </div>
                {trends.improving && (
                  <div className={styles.trend}>📈 Improving</div>
                )}
                {trends.declining && (
                  <div className={styles.trend}>📉 Needs attention</div>
                )}
              </div>

              <div className={styles.statCard}>
                <h3>Average Response Time</h3>
                <div className={styles.statValue}>
                  {calculateAverageResponseTime()}s
                </div>
              </div>

              <div className={styles.statCard}>
                <h3>Total Assessments</h3>
                <div className={styles.statValue}>{assessments.length}</div>
              </div>

              <div className={styles.statCard}>
                <h3>Test Sessions</h3>
                <div className={styles.statValue}>{testSessions.length}</div>
              </div>
            </div>

            <div className={styles.recentActivity}>
              <h3>Recent Activity</h3>
              {loading ? (
                <div className={styles.loading}>Loading recent activity...</div>
              ) : assessments.length > 0 ? (
                <div className={styles.activityList}>
                  {assessments.slice(0, 5).map((assessment, index) => (
                    <div key={index} className={styles.activityItem}>
                      <div className={styles.activityDate}>
                        {new Date(assessment.date).toLocaleDateString()}
                      </div>
                      <div className={styles.activityDetails}>
                        <strong>
                          {assessment.words?.join(', ') || 'No words'}
                        </strong>{' '}
                        - {assessment.testType}
                        <span className={styles.accuracy}>
                          {assessment.responses?.filter((r) => r.correct)
                            .length || 0}
                          /{assessment.responses?.length || 0} correct
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noData}>No recent activity</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className={styles.assessments}>
            <h3>Assessment History</h3>
            {loading ? (
              <div className={styles.loading}>Loading assessments...</div>
            ) : assessments.length > 0 ? (
              <div className={styles.assessmentList}>
                {assessments.map((assessment, index) => (
                  <div key={index} className={styles.assessmentItem}>
                    <div className={styles.assessmentHeader}>
                      <h4>{assessment.words?.join(', ') || 'No words'}</h4>
                      <span className={styles.testType}>
                        {assessment.testType}
                      </span>
                      <span className={styles.date}>
                        {new Date(assessment.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.assessmentDetails}>
                      <div className={styles.responses}>
                        {assessment.responses?.map((response, idx) => (
                          <span
                            key={idx}
                            className={`${styles.response} ${
                              response.correct
                                ? styles.correct
                                : styles.incorrect
                            }`}
                            title={`${response.word}: ${
                              response.correct ? 'Correct' : 'Incorrect'
                            }`}
                          >
                            {response.correct ? '✓' : '✗'}
                          </span>
                        ))}
                      </div>
                      {assessment.teacherNotes && (
                        <div className={styles.notes}>
                          <strong>Notes:</strong> {assessment.teacherNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noData}>
                No assessments found for the selected period
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className={styles.sessions}>
            <h3>Test Session History</h3>
            {loading ? (
              <div className={styles.loading}>Loading test sessions...</div>
            ) : testSessions.length > 0 ? (
              <div className={styles.sessionList}>
                {testSessions.map((session, index) => (
                  <div key={index} className={styles.sessionItem}>
                    <div className={styles.sessionHeader}>
                      <h4>{session.sessionType} Session</h4>
                      <span className={styles.date}>
                        {new Date(session.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.sessionDetails}>
                      <div className={styles.sessionStats}>
                        <span>Words: {session.wordsUsed?.length || 0}</span>
                        <span>
                          Duration:{' '}
                          {Math.round(
                            (new Date(session.endTime) -
                              new Date(session.startTime)) /
                              60000
                          )}
                          min
                        </span>
                        {session.results && (
                          <span>
                            Accuracy:{' '}
                            {(
                              (session.results.correctWords /
                                session.results.totalWords) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        )}
                      </div>
                      {session.wordsUsed && (
                        <div className={styles.wordsUsed}>
                          <strong>Words:</strong> {session.wordsUsed.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noData}>
                No test sessions found for the selected period
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className={styles.analytics}>
            <h3>Performance Analytics</h3>
            <div className={styles.analyticsGrid}>
              <div className={styles.chartCard}>
                <h4>Word Level Distribution</h4>
                <div className={styles.levelChart}>
                  {Object.entries(wordLevelDist).map(([level, count]) => (
                    <div key={level} className={styles.levelBar}>
                      <span className={styles.levelLabel}>{level}</span>
                      <div className={styles.levelProgress}>
                        <div
                          className={styles.levelFill}
                          style={{
                            width: `${
                              (count /
                                Math.max(...Object.values(wordLevelDist))) *
                              100
                            }%`
                          }}
                        ></div>
                      </div>
                      <span className={styles.levelCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.chartCard}>
                <h4>Test Type Performance</h4>
                <div className={styles.testTypeChart}>
                  {['recognition', 'pronunciation', 'spelling', 'reading'].map(
                    (testType) => {
                      const typeAssessments = assessments.filter(
                        (a) => a.testType === testType
                      )
                      const accuracy =
                        typeAssessments.length > 0
                          ? (typeAssessments.reduce((sum, assessment) => {
                              const total = assessment.responses?.length || 0
                              const correct =
                                assessment.responses?.filter((r) => r.correct)
                                  .length || 0
                              return sum + (total > 0 ? correct / total : 0)
                            }, 0) /
                              typeAssessments.length) *
                            100
                          : 0

                      return (
                        <div key={testType} className={styles.testTypeBar}>
                          <span className={styles.testTypeLabel}>
                            {testType}
                          </span>
                          <div className={styles.testTypeProgress}>
                            <div
                              className={styles.testTypeFill}
                              style={{ width: `${accuracy}%` }}
                            ></div>
                          </div>
                          <span className={styles.testTypeAccuracy}>
                            {accuracy.toFixed(1)}%
                          </span>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className={styles.monitoring}>
            <div className={styles.monitoringHeader}>
              <h3>🎤 Live Speech Recognition Monitoring</h3>
              <div className={styles.monitoringControls}>
                <label className={styles.autoRefreshToggle}>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  Auto Refresh (5s)
                </label>
                <button
                  onClick={loadActiveSpeechSessions}
                  className={styles.refreshButton}
                >
                  🔄 Refresh Now
                </button>
                <div className={styles.lastUpdated}>
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className={styles.metricsOverview}>
              <div className={styles.metricCard}>
                <h4>Active Sessions</h4>
                <div className={styles.metricValue}>
                  {speechMetrics.totalActiveSessions}
                </div>
              </div>
              <div className={styles.metricCard}>
                <h4>Average Confidence</h4>
                <div
                  className={`${styles.metricValue} ${
                    speechMetrics.averageConfidence >= 80
                      ? styles.good
                      : speechMetrics.averageConfidence >= 60
                      ? styles.ok
                      : styles.poor
                  }`}
                >
                  {speechMetrics.averageConfidence}%
                </div>
              </div>
              <div className={styles.metricCard}>
                <h4>Words Practiced</h4>
                <div className={styles.metricValue}>
                  {speechMetrics.totalWordsCompleted}
                </div>
              </div>
              <div className={styles.metricCard}>
                <h4>Need Attention</h4>
                <div
                  className={`${styles.metricValue} ${
                    speechMetrics.studentsNeedingHelp.length > 0
                      ? styles.alert
                      : styles.good
                  }`}
                >
                  {speechMetrics.studentsNeedingHelp.length}
                </div>
              </div>
            </div>

            {speechMetrics.studentsNeedingHelp.length > 0 && (
              <div className={styles.alertSection}>
                <h4>🚨 Students Needing Attention</h4>
                <div className={styles.alertList}>
                  {speechMetrics.studentsNeedingHelp.map((student, index) => (
                    <div key={index} className={styles.alertItem}>
                      <span className={styles.studentName}>{student.name}</span>
                      <div className={styles.alertReasons}>
                        {student.currentConfidence < 70 && (
                          <span className={styles.alertBadge}>
                            Low Confidence ({student.currentConfidence}%)
                          </span>
                        )}
                        {student.averageResponseTime > 4000 && (
                          <span className={styles.alertBadge}>
                            Slow Response (
                            {(student.averageResponseTime / 1000).toFixed(1)}s)
                          </span>
                        )}
                        {student.strugglingWords?.length > 0 && (
                          <span className={styles.alertBadge}>
                            Struggling with:{' '}
                            {student.strugglingWords.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                Loading active sessions...
              </div>
            ) : activeSpeechSessions.length > 0 ? (
              <div className={styles.sessionGrid}>
                <h4>Active Speech Recognition Sessions</h4>
                <div className={styles.sessionList}>
                  {activeSpeechSessions.map((session, index) => (
                    <div key={index} className={styles.sessionCard}>
                      <div className={styles.sessionHeader}>
                        <h5>{session.studentName}</h5>
                        <div className={styles.sessionTime}>
                          Started:{' '}
                          {new Date(session.startTime).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className={styles.sessionMetrics}>
                        <div className={styles.metric}>
                          <label>Current Word:</label>
                          <span className={styles.currentWord}>
                            {session.currentWord || 'Loading...'}
                          </span>
                        </div>

                        <div className={styles.metric}>
                          <label>Confidence:</label>
                          <span
                            className={`${styles.confidence} ${
                              session.confidence >= 80
                                ? styles.good
                                : session.confidence >= 60
                                ? styles.ok
                                : styles.poor
                            }`}
                          >
                            {session.confidence?.toFixed(1) || 0}%
                          </span>
                        </div>

                        <div className={styles.metric}>
                          <label>Response Time:</label>
                          <span
                            className={`${styles.responseTime} ${
                              session.averageResponseTime <= 2000
                                ? styles.good
                                : session.averageResponseTime <= 4000
                                ? styles.ok
                                : styles.poor
                            }`}
                          >
                            {session.averageResponseTime
                              ? (session.averageResponseTime / 1000).toFixed(1)
                              : 0}
                            s
                          </span>
                        </div>

                        <div className={styles.metric}>
                          <label>Progress:</label>
                          <span className={styles.progress}>
                            {session.wordsCompleted || 0}/
                            {session.totalWords || 10} words
                          </span>
                        </div>
                      </div>

                      {session.recentAttempts &&
                        session.recentAttempts.length > 0 && (
                          <div className={styles.recentActivity}>
                            <h6>Recent Attempts:</h6>
                            <div className={styles.attempts}>
                              {session.recentAttempts
                                .slice(-3)
                                .map((attempt, idx) => (
                                  <div key={idx} className={styles.attempt}>
                                    <span className={styles.attemptWord}>
                                      {attempt.word}
                                    </span>
                                    <span
                                      className={`${styles.attemptResult} ${
                                        attempt.correct
                                          ? styles.correct
                                          : styles.incorrect
                                      }`}
                                    >
                                      {attempt.correct ? '✅' : '❌'}{' '}
                                      {attempt.confidence}%
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      {session.errors && session.errors.length > 0 && (
                        <div className={styles.sessionErrors}>
                          <h6>Recent Issues:</h6>
                          <div className={styles.errorList}>
                            {session.errors.slice(-2).map((error, idx) => (
                              <div key={idx} className={styles.errorItem}>
                                {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.noSessions}>
                <div className={styles.noSessionsIcon}>🎤</div>
                <h4>No Active Speech Recognition Sessions</h4>
                <p>
                  Students will appear here when they start pronunciation
                  practice
                </p>
                <p>Guide students to:</p>
                <ol>
                  <li>Navigate to Student Practice Mode</li>
                  <li>Select "Pronunciation" practice</li>
                  <li>Ensure microphone permissions are enabled</li>
                  <li>Start practicing sight words</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherDashboard
