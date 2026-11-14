/**
 * API calls for progress tracking, practice sessions and assignments.
 */
import { API_BASE_URL } from '../config/runtime'
import { getToken } from './tokenService'

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = json?.details?.length ? `: ${json.details.join(', ')}` : ''
    throw new Error((json?.err || `Request failed (${res.status})`) + detail)
  }
  return json
}

// Progress
export const getProgressSummary = (studentId) =>
  request(`/api/progress/${studentId}/summary`)

export const getPracticeSession = (studentId, assignmentId) =>
  request(
    `/api/progress/${studentId}/practice${
      assignmentId ? `?assignment=${encodeURIComponent(assignmentId)}` : ''
    }`
  )

export const recordAttempts = (studentId, attempts) =>
  request(`/api/progress/${studentId}/attempts`, {
    method: 'POST',
    body: { attempts }
  })

export const getClassProgress = (list = 1) =>
  request(`/api/progress/class?list=${list}`)

// Assignments
export const listAssignments = (status) =>
  request(`/api/assignments${status ? `?status=${status}` : ''}`)

export const createAssignment = (data) =>
  request('/api/assignments', { method: 'POST', body: data })

export const updateAssignment = (id, data) =>
  request(`/api/assignments/${id}`, { method: 'PUT', body: data })

export const archiveAssignment = (id) =>
  request(`/api/assignments/${id}`, { method: 'DELETE' })

export const getAssignmentProgress = (id) =>
  request(`/api/assignments/${id}/progress`)

// Profile settings
export const saveProfileSettings = (profileId, data) =>
  request(`/api/profiles/${profileId}`, { method: 'PUT', body: data })
