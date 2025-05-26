import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for performance monitoring
 * Provides utilities for measuring and tracking performance metrics
 */
export const usePerformance = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [metrics, setMetrics] = useState({})
  const [webVitals, setWebVitals] = useState({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  })
  const [customMetrics, setCustomMetrics] = useState({})
  const [measurements, setMeasurements] = useState({})

  useEffect(() => {
    setIsSupported('performance' in window && 'PerformanceObserver' in window)
  }, [])

  const measureNavigation = useCallback(() => {
    if (!isSupported) return null

    const navigation = performance.getEntriesByType('navigation')[0]
    if (!navigation) return null

    return {
      domContentLoaded:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnect: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.requestStart,
      domProcessing: navigation.domComplete - navigation.domLoading,
      redirectTime: navigation.redirectEnd - navigation.redirectStart,
      unloadTime: navigation.unloadEventEnd - navigation.unloadEventStart
    }
  }, [isSupported])

  const measureResources = useCallback(() => {
    if (!isSupported) return []

    const resources = performance.getEntriesByType('resource')
    return resources.map((resource) => ({
      name: resource.name,
      type: resource.initiatorType,
      size: resource.transferSize,
      duration: resource.duration,
      startTime: resource.startTime
    }))
  }, [isSupported])

  const markTime = useCallback(
    (name) => {
      if (!isSupported) return
      performance.mark(name)
    },
    [isSupported]
  )

  const measureTime = useCallback(
    (name, startMark, endMark) => {
      if (!isSupported) return null

      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name, 'measure')[0]
        return measure ? measure.duration : null
      } catch (error) {
        console.warn('Performance measurement failed:', error)
        return null
      }
    },
    [isSupported]
  )

  const clearMarks = useCallback(() => {
    if (!isSupported) return
    performance.clearMarks()
    performance.clearMeasures()
  }, [isSupported])

  const getMemoryInfo = useCallback(() => {
    if (!isSupported || !('memory' in performance)) return null

    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    }
  }, [isSupported])

  const observePerformance = useCallback(
    (callback, entryTypes = ['measure', 'navigation', 'resource']) => {
      if (!isSupported) return null

      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          callback(entries)
        })

        observer.observe({ entryTypes })
        return observer
      } catch (error) {
        console.warn('PerformanceObserver failed:', error)
        return null
      }
    },
    [isSupported]
  )

  const getNetworkInfo = useCallback(() => {
    if (!('connection' in navigator)) return null

    const connection = navigator.connection
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }, [])

  const measureFrameRate = useCallback((duration = 1000) => {
    return new Promise((resolve) => {
      let frames = 0
      const startTime = performance.now()

      const countFrame = () => {
        frames++
        const currentTime = performance.now()

        if (currentTime - startTime < duration) {
          requestAnimationFrame(countFrame)
        } else {
          const actualDuration = currentTime - startTime
          const fps = Math.round((frames * 1000) / actualDuration)
          resolve(fps)
        }
      }

      requestAnimationFrame(countFrame)
    })
  }, [])

  // Initialize Web Vitals observer
  useEffect(() => {
    if (!isSupported) return

    // Initialize webVitals with default structure
    setWebVitals({
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null
    })

    // Set up performance observers for web vitals
    try {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        setWebVitals((prev) => ({
          ...prev,
          lcp: {
            value: lastEntry.startTime,
            rating: lastEntry.startTime > 2500 ? 'poor' : 'good'
          }
        }))
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          setWebVitals((prev) => ({
            ...prev,
            fid: {
              value: entry.processingStart - entry.startTime,
              rating:
                entry.processingStart - entry.startTime > 100 ? 'poor' : 'good'
            }
          }))
        })
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        setWebVitals((prev) => ({
          ...prev,
          cls: { value: clsValue, rating: clsValue > 0.1 ? 'poor' : 'good' }
        }))
      }).observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.warn('Performance observers not fully supported:', error)
    }
  }, [isSupported])

  // Start measurement function
  const startMeasurement = useCallback(
    (name) => {
      if (!isSupported) return
      const startTime = performance.now()
      setMeasurements((prev) => ({
        ...prev,
        [name]: { startTime, endTime: null }
      }))
      return startTime
    },
    [isSupported]
  )

  // End measurement function
  const endMeasurement = useCallback(
    (name) => {
      if (!isSupported) return null
      const endTime = performance.now()
      setMeasurements((prev) => {
        const measurement = prev[name]
        if (measurement) {
          const duration = endTime - measurement.startTime
          return {
            ...prev,
            [name]: { ...measurement, endTime, duration }
          }
        }
        return prev
      })
      return measurements[name]?.duration
    },
    [isSupported, measurements]
  )

  // Measure component function
  const measureComponent = useCallback(
    (componentName, fn) => {
      if (!isSupported) return fn()
      const startTime = performance.now()
      const result = fn()
      const endTime = performance.now()

      setCustomMetrics((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [componentName]: {
            renderTime: endTime - startTime,
            timestamp: new Date().toISOString()
          }
        }
      }))

      return result
    },
    [isSupported]
  )

  // Measure function
  const measureFunction = useCallback(
    (functionName, fn) => {
      if (!isSupported) return fn()
      const startTime = performance.now()
      const result = fn()
      const endTime = performance.now()

      setCustomMetrics((prev) => ({
        ...prev,
        functions: {
          ...prev.functions,
          [functionName]: {
            executionTime: endTime - startTime,
            timestamp: new Date().toISOString()
          }
        }
      }))

      return result
    },
    [isSupported]
  )

  // Export metrics function
  const exportMetrics = useCallback(() => {
    return {
      webVitals,
      customMetrics,
      measurements,
      navigation: measureNavigation(),
      resources: measureResources(),
      memory: getMemoryInfo(),
      timestamp: new Date().toISOString()
    }
  }, [
    webVitals,
    customMetrics,
    measurements,
    measureNavigation,
    measureResources,
    getMemoryInfo
  ])

  return {
    isSupported,
    metrics,
    webVitals,
    customMetrics,
    measurements,
    measureNavigation,
    measureResources,
    markTime,
    measureTime,
    clearMarks,
    getMemoryInfo,
    observePerformance,
    getNetworkInfo,
    measureFrameRate,
    startMeasurement,
    endMeasurement,
    measureComponent,
    measureFunction,
    exportMetrics,
    performance: window.performance
  }
}
