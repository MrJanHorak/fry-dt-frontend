/**
 * Performance Widget
 * A compact performance monitoring widget for the navigation bar
 */

import React, { useState } from 'react'
import { usePerformanceContext } from '../../contexts/PerformanceContext'
import PerformanceMonitor from '../PerformanceMonitor/PerformanceMonitor'
import './PerformanceWidget.css'

const PerformanceWidget = () => {
  const {
    isMonitoring,
    performanceData,
    backendMetrics,
    alerts,
    showPerformancePanel,
    startMonitoring,
    stopMonitoring,
    togglePerformancePanel
  } = usePerformanceContext()

  const [showTooltip, setShowTooltip] = useState(false)

  // Calculate overall health status
  const getHealthStatus = () => {
    const totalAlerts =
      alerts.length + (performanceData?.frontendAlerts?.length || 0)
    const criticalAlerts = alerts.filter(
      (alert) => alert.type === 'critical'
    ).length

    if (criticalAlerts > 0) return 'critical'
    if (totalAlerts > 0) return 'warning'
    return 'healthy'
  }

  const healthStatus = getHealthStatus()
  const totalAlerts =
    alerts.length + (performanceData?.frontendAlerts?.length || 0)

  // Get key metrics for tooltip
  const getKeyMetrics = () => {
    const metrics = []

    if (performanceData?.webVitals?.lcp) {
      metrics.push(`LCP: ${performanceData.webVitals.lcp.value.toFixed(0)}ms`)
    }

    if (backendMetrics?.requests?.avgResponseTime) {
      metrics.push(`API: ${backendMetrics.requests.avgResponseTime}ms`)
    }

    if (backendMetrics?.system?.memoryUsage) {
      metrics.push(`Memory: ${backendMetrics.system.memoryUsage}%`)
    }

    return metrics
  }

  const keyMetrics = getKeyMetrics()

  return (
    <div className="performance-widget">
      {/* Toggle Monitoring Button */}
      <button
        className={`performance-toggle ${
          isMonitoring ? 'monitoring' : 'stopped'
        }`}
        onClick={isMonitoring ? stopMonitoring : startMonitoring}
        title={
          isMonitoring
            ? 'Stop Performance Monitoring'
            : 'Start Performance Monitoring'
        }
        aria-label={
          isMonitoring
            ? 'Stop Performance Monitoring'
            : 'Start Performance Monitoring'
        }
      >
        <span className="monitor-icon">{isMonitoring ? '⏸️' : '▶️'}</span>
      </button>

      {/* Performance Status Indicator */}
      {isMonitoring && (
        <div
          className="performance-status"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={togglePerformancePanel}
        >
          <div className={`status-indicator ${healthStatus}`}>
            <span className="status-dot"></span>
            {totalAlerts > 0 && (
              <span className="alert-count">{totalAlerts}</span>
            )}
          </div>

          {/* Tooltip */}
          {showTooltip && (
            <div className="performance-tooltip">
              <div className="tooltip-header">
                <strong>Performance Status</strong>
                <span className={`status-text ${healthStatus}`}>
                  {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                </span>
              </div>

              {keyMetrics.length > 0 && (
                <div className="tooltip-metrics">
                  {keyMetrics.map((metric, index) => (
                    <div key={index} className="metric-item">
                      {metric}
                    </div>
                  ))}
                </div>
              )}

              {totalAlerts > 0 && (
                <div className="tooltip-alerts">
                  <strong>
                    {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
                  </strong>
                  <div className="alert-summary">Click to view details</div>
                </div>
              )}

              <div className="tooltip-action">
                Click to {showPerformancePanel ? 'hide' : 'show'} details
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Performance Panel */}
      {showPerformancePanel && (
        <div className="performance-panel-overlay">
          <div className="performance-panel">
            <div className="panel-header">
              <h3>Performance Monitor</h3>
              <button
                className="close-button"
                onClick={togglePerformancePanel}
                aria-label="Close Performance Panel"
              >
                ✕
              </button>
            </div>
            <div className="panel-content">
              <PerformanceMonitor />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceWidget
