/**
 * Monitoring Dashboard Component
 * Central hub for all monitoring and testing capabilities
 */

import React, { useState, useContext } from 'react'
import { PerformanceContext } from '../../contexts/PerformanceContext'
import PerformanceWidget from '../PerformanceWidget/PerformanceWidget'
import DatabaseMonitor from '../DatabaseMonitor/DatabaseMonitor'
import UXTestingMonitor from '../UXTestingMonitor/UXTestingMonitor'
import './MonitoringDashboard.css'

const MonitoringDashboard = () => {
  const { performanceData } = useContext(PerformanceContext)
  const [activeSection, setActiveSection] = useState('overview')
  const [isVisible, setIsVisible] = useState(false)

  const getSectionIcon = (section) => {
    const icons = {
      overview: '📊',
      performance: '⚡',
      database: '🗄️',
      ux: '👥',
      alerts: '🔔'
    }
    return icons[section] || '📈'
  }

  const getOverviewStats = () => {
    const stats = {
      totalRequests: performanceData?.totalRequests || 0,
      avgResponseTime: performanceData?.avgResponseTime || 0,
      errorCount: performanceData?.errorCount || 0,
      uptime: performanceData?.uptime || 0
    }

    return stats
  }

  const getSystemHealth = () => {
    const stats = getOverviewStats()
    let score = 100

    // Deduct points based on performance metrics
    if (stats.avgResponseTime > 1000) score -= 20
    else if (stats.avgResponseTime > 500) score -= 10

    if (stats.errorCount > 10) score -= 30
    else if (stats.errorCount > 5) score -= 15

    if (stats.uptime < 95) score -= 25
    else if (stats.uptime < 98) score -= 10

    return Math.max(0, score)
  }

  const getHealthStatus = (score) => {
    if (score >= 90)
      return { status: 'excellent', color: '#28a745', label: 'Excellent' }
    if (score >= 75) return { status: 'good', color: '#17a2b8', label: 'Good' }
    if (score >= 60) return { status: 'fair', color: '#ffc107', label: 'Fair' }
    return { status: 'poor', color: '#dc3545', label: 'Poor' }
  }

  const formatUptime = (uptime) => {
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000))
    const hours = Math.floor(
      (uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    )
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000))

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const healthScore = getSystemHealth()
  const health = getHealthStatus(healthScore)
  const stats = getOverviewStats()

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-toggle">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="toggle-btn"
          title="Toggle Monitoring Dashboard"
        >
          📊 Monitoring {isVisible ? '▼' : '▶'}
        </button>
      </div>

      {isVisible && (
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Monitoring Dashboard</h1>
            <div className="system-health">
              <div
                className="health-indicator"
                style={{ backgroundColor: health.color }}
              >
                {healthScore}
              </div>
              <div className="health-label">
                <span>System Health</span>
                <span className="health-status">{health.label}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-navigation">
            <button
              className={activeSection === 'overview' ? 'active' : ''}
              onClick={() => setActiveSection('overview')}
            >
              {getSectionIcon('overview')} Overview
            </button>
            <button
              className={activeSection === 'performance' ? 'active' : ''}
              onClick={() => setActiveSection('performance')}
            >
              {getSectionIcon('performance')} Performance
            </button>
            <button
              className={activeSection === 'database' ? 'active' : ''}
              onClick={() => setActiveSection('database')}
            >
              {getSectionIcon('database')} Database
            </button>
            <button
              className={activeSection === 'ux' ? 'active' : ''}
              onClick={() => setActiveSection('ux')}
            >
              {getSectionIcon('ux')} UX Testing
            </button>
          </div>

          <div className="dashboard-main">
            {activeSection === 'overview' && (
              <div className="overview-section">
                <div className="overview-header">
                  <h2>System Overview</h2>
                  <div className="last-updated">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                <div className="metrics-grid">
                  <div className="metric-card requests">
                    <div className="metric-icon">🔄</div>
                    <div className="metric-info">
                      <div className="metric-value">
                        {stats.totalRequests.toLocaleString()}
                      </div>
                      <div className="metric-label">Total Requests</div>
                    </div>
                  </div>

                  <div className="metric-card response-time">
                    <div className="metric-icon">⚡</div>
                    <div className="metric-info">
                      <div className="metric-value">
                        {stats.avgResponseTime}ms
                      </div>
                      <div className="metric-label">Avg Response Time</div>
                    </div>
                  </div>

                  <div className="metric-card errors">
                    <div className="metric-icon">❌</div>
                    <div className="metric-info">
                      <div className="metric-value">{stats.errorCount}</div>
                      <div className="metric-label">Error Count</div>
                    </div>
                  </div>

                  <div className="metric-card uptime">
                    <div className="metric-icon">⏱️</div>
                    <div className="metric-info">
                      <div className="metric-value">
                        {formatUptime(stats.uptime)}
                      </div>
                      <div className="metric-label">Uptime</div>
                    </div>
                  </div>
                </div>

                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  <div className="actions-grid">
                    <button
                      onClick={() => setActiveSection('performance')}
                      className="action-btn performance"
                    >
                      📈 View Performance Details
                    </button>
                    <button
                      onClick={() => setActiveSection('database')}
                      className="action-btn database"
                    >
                      🗄️ Check Database Health
                    </button>
                    <button
                      onClick={() => setActiveSection('ux')}
                      className="action-btn ux"
                    >
                      🧪 Run UX Tests
                    </button>
                    <button
                      onClick={() =>
                        window.open('/api/performance/export', '_blank')
                      }
                      className="action-btn export"
                    >
                      📊 Export Performance Data
                    </button>
                  </div>
                </div>

                <div className="status-indicators">
                  <h3>Service Status</h3>
                  <div className="status-grid">
                    <div className="status-item">
                      <div className="status-dot online"></div>
                      <span>API Server</span>
                      <span className="status-label">Online</span>
                    </div>
                    <div className="status-item">
                      <div className="status-dot online"></div>
                      <span>Database</span>
                      <span className="status-label">Connected</span>
                    </div>
                    <div className="status-item">
                      <div className="status-dot online"></div>
                      <span>Performance Monitor</span>
                      <span className="status-label">Active</span>
                    </div>
                    <div className="status-item">
                      <div className="status-dot online"></div>
                      <span>UX Testing</span>
                      <span className="status-label">Ready</span>
                    </div>
                  </div>
                </div>

                <div className="recent-alerts">
                  <h3>Recent Alerts</h3>
                  <div className="alerts-list">
                    {performanceData?.recentAlerts?.length > 0 ? (
                      performanceData.recentAlerts
                        .slice(0, 5)
                        .map((alert, index) => (
                          <div
                            key={index}
                            className={`alert-item ${alert.level}`}
                          >
                            <div className="alert-icon">
                              {alert.level === 'error'
                                ? '🚨'
                                : alert.level === 'warning'
                                ? '⚠️'
                                : 'ℹ️'}
                            </div>
                            <div className="alert-content">
                              <div className="alert-message">
                                {alert.message}
                              </div>
                              <div className="alert-time">
                                {new Date(alert.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="no-alerts">
                        <div className="no-alerts-icon">✅</div>
                        <div className="no-alerts-message">
                          No recent alerts. System is running smoothly!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'performance' && (
              <div className="performance-section">
                <PerformanceWidget expanded={true} />
              </div>
            )}

            {activeSection === 'database' && (
              <div className="database-section">
                <DatabaseMonitor />
              </div>
            )}

            {activeSection === 'ux' && (
              <div className="ux-section">
                <UXTestingMonitor />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MonitoringDashboard
