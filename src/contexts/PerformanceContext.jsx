/**
 * Performance Context
 * Provides performance monitoring functionality throughout the React application
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'
import { usePerformance } from '../hooks/usePerformance'

const PerformanceContext = createContext()

export { PerformanceContext }

export const usePerformanceContext = () => {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error(
      'usePerformanceContext must be used within a PerformanceProvider'
    )
  }
  return context
}

export const PerformanceProvider = ({ children }) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [performanceData, setPerformanceData] = useState(null)
  const [backendMetrics, setBackendMetrics] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)

  const {
    webVitals,
    customMetrics,
    startMeasurement,
    endMeasurement,
    measureComponent,
    measureFunction,
    exportMetrics
  } = usePerformance()

  /**
   * Fetch backend performance metrics
   */
  const fetchBackendMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/performance/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBackendMetrics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch backend metrics:', error)
    }
  }, [])

  /**
   * Fetch performance alerts
   */
  const fetchAlerts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/performance/alerts', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAlerts(data.data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch performance alerts:', error)
    }
  }, [])

  /**
   * Start performance monitoring
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)

    // Update metrics every 30 seconds
    const interval = setInterval(() => {
      fetchBackendMetrics()
      fetchAlerts()
    }, 30000)

    // Initial fetch
    fetchBackendMetrics()
    fetchAlerts()

    return () => clearInterval(interval)
  }, [fetchBackendMetrics, fetchAlerts])

  /**
   * Stop performance monitoring
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  /**
   * Toggle performance panel visibility
   */
  const togglePerformancePanel = useCallback(() => {
    setShowPerformancePanel((prev) => !prev)
  }, [])

  /**
   * Export all performance data
   */
  const exportAllMetrics = useCallback(async () => {
    const frontendMetrics = exportMetrics()

    const allMetrics = {
      frontend: frontendMetrics,
      backend: backendMetrics,
      alerts,
      timestamp: new Date().toISOString(),
      exportType: 'complete'
    }

    const dataStr = JSON.stringify(allMetrics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fry-tool-performance-${
      new Date().toISOString().split('T')[0]
    }.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [exportMetrics, backendMetrics, alerts])

  /**
   * Measure API request performance
   */
  const measureApiRequest = useCallback(async (url, options = {}) => {
    const startTime = performance.now()
    const requestId = `api-${Date.now()}`

    try {
      const response = await fetch(url, options)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record custom metric
      if (window.customMetrics) {
        window.customMetrics.apiRequests =
          window.customMetrics.apiRequests || []
        window.customMetrics.apiRequests.push({
          url: url.replace(/\/\d+/g, '/:id'), // Clean URL
          method: options.method || 'GET',
          status: response.status,
          duration,
          timestamp: new Date().toISOString(),
          requestId
        })
      }

      return response
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record failed request
      if (window.customMetrics) {
        window.customMetrics.apiRequests =
          window.customMetrics.apiRequests || []
        window.customMetrics.apiRequests.push({
          url: url.replace(/\/\d+/g, '/:id'),
          method: options.method || 'GET',
          status: 'error',
          duration,
          error: error.message,
          timestamp: new Date().toISOString(),
          requestId
        })
      }

      throw error
    }
  }, [])

  /**
   * Check performance thresholds and create alerts
   */
  const checkPerformanceThresholds = useCallback(() => {
    const newAlerts = []

    // Check Web Vitals thresholds
    if (webVitals.lcp && webVitals.lcp.value > 2500) {
      newAlerts.push({
        type: 'warning',
        category: 'web_vitals',
        message: `LCP is slow: ${webVitals.lcp.value.toFixed(
          0
        )}ms (threshold: 2500ms)`,
        timestamp: new Date().toISOString()
      })
    }

    if (webVitals.fid && webVitals.fid.value > 100) {
      newAlerts.push({
        type: 'warning',
        category: 'web_vitals',
        message: `FID is slow: ${webVitals.fid.value.toFixed(
          0
        )}ms (threshold: 100ms)`,
        timestamp: new Date().toISOString()
      })
    }

    if (webVitals.cls && webVitals.cls.value > 0.1) {
      newAlerts.push({
        type: 'warning',
        category: 'web_vitals',
        message: `CLS is high: ${webVitals.cls.value.toFixed(
          3
        )} (threshold: 0.1)`,
        timestamp: new Date().toISOString()
      })
    }

    // Check memory usage
    if (customMetrics.memoryInfo && customMetrics.memoryInfo.usedJSHeapSize) {
      const memoryUsage =
        customMetrics.memoryInfo.usedJSHeapSize /
        customMetrics.memoryInfo.totalJSHeapSize
      if (memoryUsage > 0.8) {
        newAlerts.push({
          type: 'warning',
          category: 'memory',
          message: `High memory usage: ${(memoryUsage * 100).toFixed(
            1
          )}% (threshold: 80%)`,
          timestamp: new Date().toISOString()
        })
      }
    }

    return newAlerts
  }, [webVitals, customMetrics])

  // Update performance data when metrics change
  useEffect(() => {
    const frontendAlerts = checkPerformanceThresholds()

    setPerformanceData({
      webVitals,
      customMetrics,
      frontendAlerts,
      timestamp: new Date().toISOString()
    })
  }, [webVitals, customMetrics, checkPerformanceThresholds])

  // Auto-start monitoring in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      startMonitoring()
    }
  }, [startMonitoring])

  const value = {
    // State
    isMonitoring,
    performanceData,
    backendMetrics,
    alerts,
    showPerformancePanel,

    // Actions
    startMonitoring,
    stopMonitoring,
    togglePerformancePanel,
    exportAllMetrics,
    measureApiRequest,
    fetchBackendMetrics,
    fetchAlerts,

    // Performance measurement functions
    startMeasurement,
    endMeasurement,
    measureComponent,
    measureFunction,

    // Data
    webVitals,
    customMetrics
  }

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  )
}
