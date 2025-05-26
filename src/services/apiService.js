/**
 * Enhanced API Service with Performance Monitoring
 * Wraps API calls with performance tracking and error handling
 */

import React from 'react'
import { usePerformanceContext } from '../contexts/PerformanceContext'

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000'
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    }
    this.performanceContext = null
  }

  /**
   * Set performance context for tracking
   */
  setPerformanceContext(context) {
    this.performanceContext = context
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * Make an API request with performance tracking
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint}`
    const requestOptions = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...this.getAuthHeaders(),
        ...options.headers
      }
    }

    // Use performance context if available, otherwise use direct fetch
    if (this.performanceContext && this.performanceContext.measureApiRequest) {
      return await this.performanceContext.measureApiRequest(
        url,
        requestOptions
      )
    } else {
      return await fetch(url, requestOptions)
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    const response = await this.request(endpoint, {
      method: 'GET',
      ...options
    })

    if (!response.ok) {
      throw new Error(
        `GET ${endpoint} failed: ${response.status} ${response.statusText}`
      )
    }

    return await response.json()
  }

  /**
   * POST request
   */
  async post(endpoint, data = null, options = {}) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
      ...options
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message ||
          `POST ${endpoint} failed: ${response.status} ${response.statusText}`
      )
    }

    return await response.json()
  }

  /**
   * PUT request
   */
  async put(endpoint, data = null, options = {}) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
      ...options
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message ||
          `PUT ${endpoint} failed: ${response.status} ${response.statusText}`
      )
    }

    return await response.json()
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
      ...options
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message ||
          `DELETE ${endpoint} failed: ${response.status} ${response.statusText}`
      )
    }

    return await response.json()
  }

  /**
   * Performance monitoring endpoints
   */
  async getPerformanceMetrics() {
    return await this.get('/api/performance/metrics')
  }

  async getPerformanceSummary() {
    return await this.get('/api/performance/summary')
  }

  async getHealthStatus() {
    return await this.get('/api/performance/health')
  }

  async getPerformanceAlerts() {
    return await this.get('/api/performance/alerts')
  }

  async resetPerformanceMetrics() {
    return await this.post('/api/performance/reset')
  }

  async exportPerformanceMetrics() {
    const response = await this.request('/api/performance/export', {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(
        `Export failed: ${response.status} ${response.statusText}`
      )
    }

    // Handle file download
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-metrics-${
      new Date().toISOString().split('T')[0]
    }.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Authentication endpoints
   */
  async signIn(credentials) {
    return await this.post('/api/auth/signin', credentials)
  }

  async signUp(userData) {
    return await this.post('/api/auth/signup', userData)
  }

  async signOut() {
    return await this.post('/api/auth/signout')
  }

  /**
   * Profile endpoints
   */
  async getProfile() {
    return await this.get('/api/profiles/profile')
  }

  async updateProfile(profileData) {
    return await this.put('/api/profiles/profile', profileData)
  }

  async updateAvatar(avatarData) {
    return await this.put('/api/profiles/add-photo', avatarData)
  }

  /**
   * Health check
   */
  async healthCheck() {
    return await this.get('/health')
  }
}

// Create singleton instance
const apiService = new ApiService()

// React hook for using API service with performance context
export const useApiService = () => {
  const performanceContext = usePerformanceContext()

  // Set performance context on the API service
  React.useEffect(() => {
    if (performanceContext) {
      apiService.setPerformanceContext(performanceContext)
    }
  }, [performanceContext])

  return apiService
}

export default apiService
