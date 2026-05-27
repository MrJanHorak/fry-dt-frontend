import * as tokenService from './tokenService'
import { AUTH_API_BASE_URL as BASE_URL } from '../config/runtime'

const getErrorMessage = (payload, fallback) => {
  if (payload?.details?.length) {
    return payload.details.join(', ')
  }

  return payload?.err || payload?.msg || payload?.error?.message || fallback
}

async function signup(user) {
  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(user)
    })
    const json = await res.json()
    if (!res.ok || json.err) {
      throw new Error(getErrorMessage(json, 'Unable to create account'))
    }
    if (json.token) {
      tokenService.setToken(json.token)
    }

    return {
      ...json,
      user: tokenService.getUserFromToken()
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

async function addStudent(user) {
  try {
    const res = await fetch(`${BASE_URL}/addStudent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenService.getToken()}`
      },
      body: JSON.stringify(user)
    })
    const json = await res.json()
    if (!res.ok || json.err) {
      throw new Error(getErrorMessage(json, 'Unable to add student'))
    }
    return json
  } catch (err) {
    console.log(err)
    throw err
  }
}

function getUser() {
  return tokenService.getUserFromToken()
}

function logout() {
  tokenService.removeToken()
}

async function login(credentials) {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(credentials)
    })
    const json = await res.json()
    if (!res.ok || json.err) {
      throw new Error(getErrorMessage(json, 'Unable to sign in'))
    }
    if (json.token) {
      tokenService.setToken(json.token)
    }

    return {
      ...json,
      user: tokenService.getUserFromToken()
    }
  } catch (err) {
    throw err
  }
}

async function changePassword(id, pw) {
  const credentials = {
    student: id,
    newPw: pw
  }

  try {
    const res = await fetch(`${BASE_URL}/changePassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenService.getToken()}`
      },
      body: JSON.stringify(credentials)
    })
    const json = await res.json()

    if (!res.ok || json.err) {
      throw new Error(getErrorMessage(json, 'Unable to change password'))
    }
  } catch (err) {
    throw err
  }
}

export { signup, getUser, logout, login, addStudent, changePassword }
