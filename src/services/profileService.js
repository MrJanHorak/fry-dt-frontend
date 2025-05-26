import * as tokenService from './tokenService'
const BASE_URL = 'http://localhost:3000/api/profiles'

export const getProfileById = async (profileId) => {
  if (profileId === null || profileId === undefined) {
    return null
  } else {
    try {
      const res = await fetch(`${BASE_URL}/${profileId}`, {
        headers: {
          Authorization: `Bearer ${tokenService.getToken()}`
        }
      })
      const data = await res.json()
      return data
    } catch (error) {
      throw error
    }
  }
}

export const updateProfile = async (profileId, updatedProfile) => {
  try {
    const res = await fetch(`${BASE_URL}/${profileId}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${tokenService.getToken()}`
      },
      body: JSON.stringify(updatedProfile)
    })
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

export const createPracticedWordRecord = async (profileId, word) => {
  try {
    const res = await fetch(`${BASE_URL}/${profileId}/practicedWords`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${tokenService.getToken()}`
      },
      body: JSON.stringify(word)
    })
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

export const updatePracticedWord = async (profileId, practicedWordId, word) => {
  try {
    const res = await fetch(
      `${BASE_URL}/${profileId}/practicedWords/${practicedWordId}`,
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${tokenService.getToken()}`
        },
        body: JSON.stringify(word)
      }
    )
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

export const removeStudent = async (profileId, studentId) => {
  try {
    const res = await fetch(
      `${BASE_URL}/${profileId}/removeStudent/${studentId}`,
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${tokenService.getToken()}`
        }
      }
    )
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

// Assessment functions
export const addAssessment = async (profileId, assessmentData) => {
  try {
    const res = await fetch(`${BASE_URL}/${profileId}/assessments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${tokenService.getToken()}`
      },
      body: JSON.stringify(assessmentData)
    })
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

export const updateAssessment = async (
  profileId,
  assessmentId,
  assessmentData
) => {
  try {
    const res = await fetch(
      `${BASE_URL}/${profileId}/assessments/${assessmentId}`,
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${tokenService.getToken()}`
        },
        body: JSON.stringify(assessmentData)
      }
    )
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

export const getAssessments = async (profileId, queryParams = '') => {
  try {
    const url = queryParams
      ? `${BASE_URL}/${profileId}/assessments?${queryParams}`
      : `${BASE_URL}/${profileId}/assessments`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenService.getToken()}`
      }
    })
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

// Test session functions
export const addTestSession = async (profileId, sessionData) => {
  try {
    const res = await fetch(`${BASE_URL}/${profileId}/testSessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${tokenService.getToken()}`
      },
      body: JSON.stringify(sessionData)
    })
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

export const updateTestSession = async (profileId, sessionId, sessionData) => {
  try {
    const res = await fetch(
      `${BASE_URL}/${profileId}/testSessions/${sessionId}`,
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${tokenService.getToken()}`
        },
        body: JSON.stringify(sessionData)
      }
    )
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

export const getTestSessions = async (profileId, queryParams = '') => {
  try {
    const url = queryParams
      ? `${BASE_URL}/${profileId}/testSessions?${queryParams}`
      : `${BASE_URL}/${profileId}/testSessions`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenService.getToken()}`
      }
    })
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

// Progress tracking functions
export const getStudentProgress = async (profileId) => {
  try {
    const res = await fetch(`${BASE_URL}/${profileId}/progress`, {
      headers: {
        Authorization: `Bearer ${tokenService.getToken()}`
      }
    })
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}

// Convenience function for getting profile (alias for existing function)
export const getProfile = async (profileId) => {
  return getProfileById(profileId)
}

// Speech recognition monitoring functions
export const getActiveSpeechSessions = async (profileId) => {
  try {
    const res = await fetch(`${BASE_URL}/${profileId}/speech-sessions`, {
      headers: {
        Authorization: `Bearer ${tokenService.getToken()}`
      }
    })
    const data = await res.json()
    return data
  } catch (error) {
    throw error
  }
}
