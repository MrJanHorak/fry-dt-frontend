import React, { useState, useEffect, useRef } from 'react'
import { usePerformance } from '../../hooks/usePerformance'
import './PerformanceMonitor.css'

/**
 * Performance monitoring dashboard component
 * Tracks Core Web Vitals, load times, memory usage, and network performance
 */
const PerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    memoryUsage: null,
    networkInfo: null,
    frameRate: 0,
    responseTime: 0
  })

  const [isRecording, setIsRecording] = useState(false)
  const intervalRef = useRef(null)
  const { performance: perfAPI } = usePerformance()

  // Core Web Vitals measurement
  useEffect(() => {
    if (!isVisible) return

    const measureCoreWebVitals = () => {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setMetrics((prev) => ({
              ...prev,
              firstContentfulPaint: entry.startTime
            }))
          }
        }
      })

      try {
        fcpObserver.observe({ entryTypes: ['paint'] })
      } catch (e) {
        console.warn('Paint timing not supported')
      }

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1]
          setMetrics((prev) => ({
            ...prev,
            largestContentfulPaint: lastEntry.startTime
          }))
        }
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP not supported')
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          setMetrics((prev) => ({
            ...prev,
            firstInputDelay: entry.processingStart - entry.startTime
          }))
        }
      })

      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        console.warn('FID not supported')
      }

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        setMetrics((prev) => ({ ...prev, cumulativeLayoutShift: clsValue }))
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('CLS not supported')
      }

      return () => {
        fcpObserver.disconnect()
        lcpObserver.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
      }
    }

    const cleanup = measureCoreWebVitals()
    return cleanup
  }, [isVisible])

  // Memory and network monitoring
  useEffect(() => {
    if (!isVisible || !isRecording) return

    const updateMetrics = async () => {
      // Memory usage
      if ('memory' in performance) {
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          }
        }))
      }

      // Network information
      if ('connection' in navigator) {
        setMetrics((prev) => ({
          ...prev,
          networkInfo: {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
          }
        }))
      }

      // Frame rate estimation
      let lastTime = performance.now()
      let frameCount = 0

      const measureFPS = () => {
        frameCount++
        const currentTime = performance.now()
        if (currentTime - lastTime >= 1000) {
          setMetrics((prev) => ({ ...prev, frameRate: frameCount }))
          frameCount = 0
          lastTime = currentTime
        }
        if (isRecording) {
          requestAnimationFrame(measureFPS)
        }
      }

      if (isRecording) {
        requestAnimationFrame(measureFPS)
      }

      // API response time test
      const startTime = performance.now()
      try {
        await fetch('/health')
        const endTime = performance.now()
        setMetrics((prev) => ({ ...prev, responseTime: endTime - startTime }))
      } catch (error) {
        console.warn('Health check failed:', error)
      }
    }

    intervalRef.current = setInterval(updateMetrics, 2000)
    updateMetrics()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isVisible, isRecording])

  // Load time measurement
  useEffect(() => {
    if (!isVisible) return

    const loadTime = performance.timing
      ? performance.timing.loadEventEnd - performance.timing.navigationStart
      : 0

    setMetrics((prev) => ({ ...prev, loadTime }))
  }, [isVisible])

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const clearMetrics = () => {
    setMetrics({
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      memoryUsage: null,
      networkInfo: null,
      frameRate: 0,
      responseTime: 0
    })
  }

  const getScoreColor = (metric, value) => {
    const thresholds = {
      firstContentfulPaint: { good: 1800, needs: 3000 },
      largestContentfulPaint: { good: 2500, needs: 4000 },
      firstInputDelay: { good: 100, needs: 300 },
      cumulativeLayoutShift: { good: 0.1, needs: 0.25 },
      responseTime: { good: 200, needs: 500 }
    }

    const threshold = thresholds[metric]
    if (!threshold) return 'neutral'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.needs) return 'needs-improvement'
    return 'poor'
  }

  const exportMetrics = () => {
    const dataStr = JSON.stringify(metrics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })

    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-metrics-${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!isVisible) return null

  return (
    <div
      className="performance-monitor"
      role="region"
      aria-label="Performance monitoring dashboard"
    >
      <div className="performance-header">
        <h2>Performance Monitor</h2>
        <div className="performance-controls">
          <button
            onClick={toggleRecording}
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? '⏹️ Stop' : '▶️ Record'}
          </button>
          <button onClick={clearMetrics} className="clear-btn">
            🗑️ Clear
          </button>
          <button onClick={exportMetrics} className="export-btn">
            📊 Export
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Core Web Vitals */}
        <div className="metric-section">
          <h3>Core Web Vitals</h3>

          <div
            className={`metric-card ${getScoreColor(
              'firstContentfulPaint',
              metrics.firstContentfulPaint
            )}`}
          >
            <div className="metric-label">First Contentful Paint</div>
            <div className="metric-value">
              {metrics.firstContentfulPaint.toFixed(2)}ms
            </div>
            <div className="metric-description">
              Time until first content renders
            </div>
          </div>

          <div
            className={`metric-card ${getScoreColor(
              'largestContentfulPaint',
              metrics.largestContentfulPaint
            )}`}
          >
            <div className="metric-label">Largest Contentful Paint</div>
            <div className="metric-value">
              {metrics.largestContentfulPaint.toFixed(2)}ms
            </div>
            <div className="metric-description">
              Time until largest content renders
            </div>
          </div>

          <div
            className={`metric-card ${getScoreColor(
              'firstInputDelay',
              metrics.firstInputDelay
            )}`}
          >
            <div className="metric-label">First Input Delay</div>
            <div className="metric-value">
              {metrics.firstInputDelay.toFixed(2)}ms
            </div>
            <div className="metric-description">
              Delay before first interaction
            </div>
          </div>

          <div
            className={`metric-card ${getScoreColor(
              'cumulativeLayoutShift',
              metrics.cumulativeLayoutShift
            )}`}
          >
            <div className="metric-label">Cumulative Layout Shift</div>
            <div className="metric-value">
              {metrics.cumulativeLayoutShift.toFixed(3)}
            </div>
            <div className="metric-description">Visual stability score</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="metric-section">
          <h3>Performance Metrics</h3>

          <div className="metric-card">
            <div className="metric-label">Page Load Time</div>
            <div className="metric-value">
              {(metrics.loadTime / 1000).toFixed(2)}s
            </div>
            <div className="metric-description">Total page load duration</div>
          </div>

          <div
            className={`metric-card ${getScoreColor(
              'responseTime',
              metrics.responseTime
            )}`}
          >
            <div className="metric-label">API Response Time</div>
            <div className="metric-value">
              {metrics.responseTime.toFixed(2)}ms
            </div>
            <div className="metric-description">
              Health endpoint response time
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Frame Rate</div>
            <div className="metric-value">{metrics.frameRate} FPS</div>
            <div className="metric-description">
              Current rendering performance
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="metric-section">
          <h3>System Information</h3>

          {metrics.memoryUsage && (
            <div className="metric-card">
              <div className="metric-label">Memory Usage</div>
              <div className="metric-value">
                {(metrics.memoryUsage.used / 1024 / 1024).toFixed(2)} MB
              </div>
              <div className="metric-description">
                Used: {(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)}MB /
                Total: {(metrics.memoryUsage.total / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
          )}

          {metrics.networkInfo && (
            <div className="metric-card">
              <div className="metric-label">Network</div>
              <div className="metric-value">
                {metrics.networkInfo.effectiveType}
              </div>
              <div className="metric-description">
                {metrics.networkInfo.downlink}Mbps downlink,{' '}
                {metrics.networkInfo.rtt}ms RTT
                {metrics.networkInfo.saveData && ' (Data Saver: ON)'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="performance-footer">
        <small>
          Monitoring status: {isRecording ? 'Active' : 'Inactive'} | Last
          updated: {new Date().toLocaleTimeString()}
        </small>
      </div>
    </div>
  )
}

export default PerformanceMonitor
