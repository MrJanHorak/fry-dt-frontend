/**
 * UX Testing Monitor Component
 * Provides comprehensive UX testing and monitoring capabilities
 */

import React, { useState, useEffect, useContext } from 'react'
import { PerformanceContext } from '../../contexts/PerformanceContext'
import './UXTestingMonitor.css'

const UXTestingMonitor = () => {
  const { performanceData } = useContext(PerformanceContext)
  const [uxData, setUxData] = useState({
    testResults: null,
    feedback: [],
    loading: false,
    error: null,
    lastTestRun: null
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [testType, setTestType] = useState('full')
  const [feedbackForm, setFeedbackForm] = useState({
    category: 'usability',
    rating: 5,
    feedback: '',
    userAgent: navigator.userAgent,
    url: window.location.href
  })

  // Run UX tests
  const runUXTests = async (type = 'full') => {
    setUxData((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const token = localStorage.getItem('token')
      const endpoint =
        type === 'full' ? '/api/ux/test/full' : `/api/ux/test/${type}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: window.location.href,
          options: {
            mobile: window.innerWidth <= 768,
            desktop: window.innerWidth > 768
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setUxData((prev) => ({
        ...prev,
        testResults: data.data,
        loading: false,
        error: null,
        lastTestRun: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error running UX tests:', error)
      setUxData((prev) => ({
        ...prev,
        error: error.message,
        loading: false
      }))
    }
  }

  // Submit feedback
  const submitFeedback = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ux/feedback', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackForm)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      alert('Feedback submitted successfully!')

      // Reset form
      setFeedbackForm({
        category: 'usability',
        rating: 5,
        feedback: '',
        userAgent: navigator.userAgent,
        url: window.location.href
      })

      // Refresh feedback list
      await fetchFeedback()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback: ' + error.message)
    }
  }

  // Fetch feedback
  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ux/feedback', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setUxData((prev) => ({
        ...prev,
        feedback: data.data || []
      }))
    } catch (error) {
      console.error('Error fetching feedback:', error)
    }
  }

  // Auto-fetch feedback on component mount
  useEffect(() => {
    fetchFeedback()
  }, [])

  const getScoreColor = (score) => {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    return 'poor'
  }

  const formatScore = (score) => {
    return typeof score === 'number' ? Math.round(score) : 'N/A'
  }

  const getTestCategoryIcon = (category) => {
    const icons = {
      'Core Web Vitals': '⚡',
      Accessibility: '♿',
      'Responsive Design': '📱',
      'User Flow': '🔄',
      Performance: '🚀',
      'Content Quality': '📝',
      Navigation: '🧭'
    }
    return icons[category] || '📊'
  }

  return (
    <div className="ux-testing-monitor">
      <div className="monitor-header">
        <h2>UX Testing Monitor</h2>
        <div className="test-controls">
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            disabled={uxData.loading}
          >
            <option value="full">Full Test Suite</option>
            <option value="core-web-vitals">Core Web Vitals</option>
            <option value="accessibility">Accessibility</option>
            <option value="responsive">Responsive Design</option>
            <option value="user-flow">User Flow</option>
            <option value="performance">Performance</option>
            <option value="content">Content Quality</option>
            <option value="navigation">Navigation</option>
          </select>
          <button
            onClick={() => runUXTests(testType)}
            disabled={uxData.loading}
            className="run-test-btn"
          >
            {uxData.loading ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {uxData.lastTestRun && (
        <div className="last-test-info">
          Last test run: {new Date(uxData.lastTestRun).toLocaleString()}
        </div>
      )}

      <div className="monitor-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'details' ? 'active' : ''}
          onClick={() => setActiveTab('details')}
        >
          Test Details
        </button>
        <button
          className={activeTab === 'recommendations' ? 'active' : ''}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
        <button
          className={activeTab === 'feedback' ? 'active' : ''}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback
        </button>
      </div>

      <div className="monitor-content">
        {uxData.loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Running UX tests... This may take a few moments.</p>
          </div>
        )}

        {uxData.error && (
          <div className="error-state">
            <h3>Error Running Tests</h3>
            <p>{uxData.error}</p>
            <button onClick={() => runUXTests(testType)}>Retry</button>
          </div>
        )}

        {!uxData.loading &&
          !uxData.error &&
          activeTab === 'overview' &&
          uxData.testResults && (
            <div className="overview-tab">
              <div className="overall-score">
                <div
                  className={`score-circle ${getScoreColor(
                    uxData.testResults.overallScore
                  )}`}
                >
                  <span className="score-number">
                    {formatScore(uxData.testResults.overallScore)}
                  </span>
                  <span className="score-label">Overall UX Score</span>
                </div>
              </div>

              <div className="test-categories">
                {Object.entries(uxData.testResults.testResults || {}).map(
                  ([category, results]) => (
                    <div key={category} className="category-card">
                      <div className="category-header">
                        <span className="category-icon">
                          {getTestCategoryIcon(category)}
                        </span>
                        <h3>{category}</h3>
                      </div>
                      <div
                        className={`category-score ${getScoreColor(
                          results.score
                        )}`}
                      >
                        {formatScore(results.score)}
                      </div>
                      <div className="category-summary">
                        <div className="summary-item">
                          <span>Tests: {results.tests?.length || 0}</span>
                        </div>
                        <div className="summary-item">
                          <span>
                            Passed:{' '}
                            {results.tests?.filter((t) => t.passed).length || 0}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span>Issues: {results.issues?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {!uxData.loading &&
          !uxData.error &&
          activeTab === 'details' &&
          uxData.testResults && (
            <div className="details-tab">
              <h3>Detailed Test Results</h3>
              {Object.entries(uxData.testResults.testResults || {}).map(
                ([category, results]) => (
                  <div key={category} className="category-details">
                    <div className="category-title">
                      <span className="category-icon">
                        {getTestCategoryIcon(category)}
                      </span>
                      <h4>{category}</h4>
                      <span
                        className={`category-badge ${getScoreColor(
                          results.score
                        )}`}
                      >
                        {formatScore(results.score)}
                      </span>
                    </div>

                    <div className="tests-list">
                      {results.tests?.map((test, i) => (
                        <div
                          key={i}
                          className={`test-item ${
                            test.passed ? 'passed' : 'failed'
                          }`}
                        >
                          <div className="test-header">
                            <span className="test-status">
                              {test.passed ? '✅' : '❌'}
                            </span>
                            <span className="test-name">{test.name}</span>
                            <span className="test-value">{test.value}</span>
                          </div>
                          {test.description && (
                            <div className="test-description">
                              {test.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {results.issues && results.issues.length > 0 && (
                      <div className="issues-section">
                        <h5>Issues Found:</h5>
                        <div className="issues-list">
                          {results.issues.map((issue, i) => (
                            <div key={i} className="issue-item">
                              <div className="issue-type">{issue.type}</div>
                              <div className="issue-message">
                                {issue.message}
                              </div>
                              {issue.element && (
                                <div className="issue-element">
                                  Element: {issue.element}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

        {!uxData.loading &&
          !uxData.error &&
          activeTab === 'recommendations' &&
          uxData.testResults && (
            <div className="recommendations-tab">
              <h3>UX Improvement Recommendations</h3>
              {uxData.testResults.recommendations &&
              uxData.testResults.recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {uxData.testResults.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className={`recommendation ${rec.priority || 'medium'}`}
                    >
                      <div className="rec-header">
                        <span className="rec-category">{rec.category}</span>
                        <span className="rec-priority">
                          {rec.priority || 'medium'}
                        </span>
                      </div>
                      <div className="rec-title">{rec.title}</div>
                      <div className="rec-description">{rec.description}</div>
                      {rec.action && (
                        <div className="rec-action">
                          <strong>Action:</strong> {rec.action}
                        </div>
                      )}
                      {rec.impact && (
                        <div className="rec-impact">
                          <strong>Expected Impact:</strong> {rec.impact}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-recommendations">
                  <p>
                    No recommendations available. Run a test to get personalized
                    UX improvement suggestions!
                  </p>
                </div>
              )}
            </div>
          )}

        {activeTab === 'feedback' && (
          <div className="feedback-tab">
            <div className="feedback-section">
              <h3>Submit Feedback</h3>
              <div className="feedback-form">
                <div className="form-group">
                  <label>Category:</label>
                  <select
                    value={feedbackForm.category}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({
                        ...prev,
                        category: e.target.value
                      }))
                    }
                  >
                    <option value="usability">Usability</option>
                    <option value="performance">Performance</option>
                    <option value="accessibility">Accessibility</option>
                    <option value="design">Design</option>
                    <option value="content">Content</option>
                    <option value="navigation">Navigation</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Rating (1-10):</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={feedbackForm.rating}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({
                        ...prev,
                        rating: parseInt(e.target.value)
                      }))
                    }
                  />
                  <span className="rating-value">{feedbackForm.rating}/10</span>
                </div>

                <div className="form-group">
                  <label>Feedback:</label>
                  <textarea
                    value={feedbackForm.feedback}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({
                        ...prev,
                        feedback: e.target.value
                      }))
                    }
                    placeholder="Share your thoughts about the user experience..."
                    rows="4"
                  />
                </div>

                <button
                  onClick={submitFeedback}
                  className="submit-feedback-btn"
                  disabled={!feedbackForm.feedback.trim()}
                >
                  Submit Feedback
                </button>
              </div>
            </div>

            <div className="feedback-history">
              <h3>Recent Feedback ({uxData.feedback.length})</h3>
              {uxData.feedback.length === 0 ? (
                <div className="no-feedback">
                  <p>No feedback submitted yet.</p>
                </div>
              ) : (
                <div className="feedback-list">
                  {uxData.feedback.slice(0, 10).map((fb, i) => (
                    <div key={i} className="feedback-item">
                      <div className="feedback-header">
                        <span className="feedback-category">{fb.category}</span>
                        <span className="feedback-rating">
                          ⭐ {fb.rating}/10
                        </span>
                        <span className="feedback-date">
                          {new Date(fb.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="feedback-text">{fb.feedback}</div>
                      {fb.url && fb.url !== window.location.href && (
                        <div className="feedback-url">Page: {fb.url}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!uxData.loading && !uxData.error && !uxData.testResults && (
          <div className="no-results">
            <div className="empty-state">
              <h3>No Test Results</h3>
              <p>
                Run your first UX test to get comprehensive insights about user
                experience.
              </p>
              <button
                onClick={() => runUXTests('full')}
                className="start-testing-btn"
              >
                Start Testing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UXTestingMonitor
