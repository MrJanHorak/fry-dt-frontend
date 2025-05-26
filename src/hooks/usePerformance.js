import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for performance monitoring
 * Provides utilities for measuring and tracking performance metrics
 */
export const usePerformance = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [metrics, setMetrics] = useState({})

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

  return {
    isSupported,
    metrics,
    measureNavigation,
    measureResources,
    markTime,
    measureTime,
    clearMarks,
    getMemoryInfo,
    observePerformance,
    getNetworkInfo,
    measureFrameRate,
    performance: window.performance
  }
}
