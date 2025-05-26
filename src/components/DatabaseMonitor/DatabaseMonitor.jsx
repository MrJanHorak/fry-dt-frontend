/**
 * Database Monitor Component
 * Provides real-time database performance monitoring and optimization insights
 */

import React, { useState, useEffect, useContext } from 'react'
import { PerformanceContext } from '../../contexts/PerformanceContext'
import './DatabaseMonitor.css'

const DatabaseMonitor = () => {
  const { performanceData } = useContext(PerformanceContext)
  const [databaseData, setDatabaseData] = useState({
    health: null,
    indexes: [],
    queryStats: {},
    performance: {},
    recommendations: [],
    loading: true,
    error: null
  })
  const [activeTab, setActiveTab] = useState('health')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch database health data
  const fetchDatabaseHealth = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/database/health', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDatabaseData((prev) => ({
        ...prev,
        health: data.data,
        loading: false,
        error: null
      }))
    } catch (error) {
      console.error('Error fetching database health:', error)
      setDatabaseData((prev) => ({
        ...prev,
        error: error.message,
        loading: false
      }))
    }
  }

  // Fetch database indexes
  const fetchDatabaseIndexes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/database/indexes', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDatabaseData((prev) => ({
        ...prev,
        indexes: data.data
      }))
    } catch (error) {
      console.error('Error fetching database indexes:', error)
    }
  }

  // Fetch query statistics
  const fetchQueryStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/database/query-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDatabaseData((prev) => ({
        ...prev,
        queryStats: data.data
      }))
    } catch (error) {
      console.error('Error fetching query stats:', error)
    }
  }

  // Fetch performance metrics
  const fetchPerformanceMetrics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/database/performance', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDatabaseData((prev) => ({
        ...prev,
        performance: data.data
      }))
    } catch (error) {
      console.error('Error fetching performance metrics:', error)
    }
  }

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/database/recommendations', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDatabaseData((prev) => ({
        ...prev,
        recommendations: data.data.recommendations || []
      }))
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    }
  }

  // Optimize database
  const optimizeDatabase = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/database/optimize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      alert('Database optimization completed successfully!')
      // Refresh all data
      await Promise.all([
        fetchDatabaseHealth(),
        fetchDatabaseIndexes(),
        fetchQueryStats(),
        fetchPerformanceMetrics(),
        fetchRecommendations()
      ])
    } catch (error) {
      console.error('Error optimizing database:', error)
      alert('Database optimization failed: ' + error.message)
    }
  }

  // Create indexes
  const createIndexes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/database/create-indexes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      alert('Database indexes created successfully!')
      await fetchDatabaseIndexes()
    } catch (error) {
      console.error('Error creating indexes:', error)
      alert('Index creation failed: ' + error.message)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchDatabaseHealth(),
        fetchDatabaseIndexes(),
        fetchQueryStats(),
        fetchPerformanceMetrics(),
        fetchRecommendations()
      ])
    }

    fetchAllData()

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getHealthStatus = (health) => {
    if (!health) return 'unknown'
    if (health.connectionState === 'connected' && health.responseTime < 100)
      return 'excellent'
    if (health.connectionState === 'connected' && health.responseTime < 500)
      return 'good'
    if (health.connectionState === 'connected') return 'fair'
    return 'poor'
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (databaseData.loading) {
    return (
      <div className="database-monitor loading">
        <div className="loading-spinner"></div>
        <p>Loading database metrics...</p>
      </div>
    )
  }

  if (databaseData.error) {
    return (
      <div className="database-monitor error">
        <h3>Database Monitor Error</h3>
        <p>{databaseData.error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <div className="database-monitor">
      <div className="monitor-header">
        <h2>Database Monitor</h2>
        <div className="monitor-controls">
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button onClick={optimizeDatabase} className="optimize-btn">
            Optimize Database
          </button>
          <button onClick={createIndexes} className="index-btn">
            Create Indexes
          </button>
        </div>
      </div>

      <div className="monitor-tabs">
        <button
          className={activeTab === 'health' ? 'active' : ''}
          onClick={() => setActiveTab('health')}
        >
          Health
        </button>
        <button
          className={activeTab === 'indexes' ? 'active' : ''}
          onClick={() => setActiveTab('indexes')}
        >
          Indexes
        </button>
        <button
          className={activeTab === 'queries' ? 'active' : ''}
          onClick={() => setActiveTab('queries')}
        >
          Query Stats
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={activeTab === 'recommendations' ? 'active' : ''}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      <div className="monitor-content">
        {activeTab === 'health' && databaseData.health && (
          <div className="health-tab">
            <div className="health-overview">
              <div
                className={`health-status ${getHealthStatus(
                  databaseData.health
                )}`}
              >
                <h3>
                  Overall Health:{' '}
                  {getHealthStatus(databaseData.health).toUpperCase()}
                </h3>
              </div>
              <div className="health-metrics">
                <div className="metric">
                  <label>Connection State:</label>
                  <span
                    className={
                      databaseData.health.connectionState === 'connected'
                        ? 'connected'
                        : 'disconnected'
                    }
                  >
                    {databaseData.health.connectionState}
                  </span>
                </div>
                <div className="metric">
                  <label>Response Time:</label>
                  <span>{databaseData.health.responseTime}ms</span>
                </div>
                <div className="metric">
                  <label>Database Name:</label>
                  <span>{databaseData.health.dbName}</span>
                </div>
                <div className="metric">
                  <label>Collections:</label>
                  <span>{databaseData.health.collections?.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'indexes' && (
          <div className="indexes-tab">
            <h3>Database Indexes ({databaseData.indexes.length})</h3>
            <div className="indexes-list">
              {databaseData.indexes.map((index, i) => (
                <div key={i} className="index-item">
                  <div className="index-header">
                    <strong>{index.collection}</strong>
                    <span className="index-count">
                      {index.indexes.length} indexes
                    </span>
                  </div>
                  <div className="index-details">
                    {index.indexes.map((idx, j) => (
                      <div key={j} className="index">
                        <span className="index-name">{idx.name}</span>
                        <span className="index-keys">
                          {JSON.stringify(idx.key)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="queries-tab">
            <h3>Query Statistics</h3>
            <div className="query-stats">
              {Object.entries(databaseData.queryStats).map(
                ([collection, stats]) => (
                  <div key={collection} className="collection-stats">
                    <h4>{collection}</h4>
                    <div className="stats-grid">
                      <div className="stat">
                        <label>Total Operations:</label>
                        <span>{stats.totalOps || 0}</span>
                      </div>
                      <div className="stat">
                        <label>Average Response Time:</label>
                        <span>{stats.avgResponseTime || 0}ms</span>
                      </div>
                      <div className="stat">
                        <label>Slow Queries:</label>
                        <span>{stats.slowQueries || 0}</span>
                      </div>
                      <div className="stat">
                        <label>Documents Examined:</label>
                        <span>{stats.docsExamined || 0}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-tab">
            <h3>Performance Metrics</h3>
            <div className="performance-grid">
              <div className="metric-card">
                <h4>Memory Usage</h4>
                <div className="metric-value">
                  {formatBytes(databaseData.performance.memoryUsage || 0)}
                </div>
              </div>
              <div className="metric-card">
                <h4>Active Connections</h4>
                <div className="metric-value">
                  {databaseData.performance.activeConnections || 0}
                </div>
              </div>
              <div className="metric-card">
                <h4>Operations/sec</h4>
                <div className="metric-value">
                  {databaseData.performance.operationsPerSecond || 0}
                </div>
              </div>
              <div className="metric-card">
                <h4>Cache Hit Ratio</h4>
                <div className="metric-value">
                  {(
                    (databaseData.performance.cacheHitRatio || 0) * 100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            <h3>Optimization Recommendations</h3>
            {databaseData.recommendations.length === 0 ? (
              <div className="no-recommendations">
                <p>
                  No recommendations available. Your database is performing
                  well!
                </p>
              </div>
            ) : (
              <div className="recommendations-list">
                {databaseData.recommendations.map((rec, i) => (
                  <div key={i} className={`recommendation ${rec.priority}`}>
                    <div className="rec-header">
                      <span className="rec-type">{rec.type}</span>
                      <span className="rec-priority">{rec.priority}</span>
                    </div>
                    <div className="rec-message">{rec.message}</div>
                    {rec.action && (
                      <div className="rec-action">
                        <strong>Suggested action:</strong> {rec.action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DatabaseMonitor
