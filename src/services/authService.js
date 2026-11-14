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

async function postJson(path, body, { auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = `Bearer ${tokenService.getToken()}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {})
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.err) {
    throw new Error(getErrorMessage(json, 'Something went wrong'))
  }
  return json
}

/** Teacher/parent: create (or replace) a student's personal QR login card. */
async function issueLoginCard(studentProfileId) {
  return postJson(`/students/${studentProfileId}/login-card`, {}, { auth: true })
}

/** QR card values look like "frydt:<url-encoded name>:<code>". */
function parseLoginCard(text) {
  if (typeof text !== 'string' || !text.startsWith('frydt:')) return null
  const rest = text.slice('frydt:'.length)
  const splitAt = rest.lastIndexOf(':')
  if (splitAt <= 0) return null
  try {
    return {
      name: decodeURIComponent(rest.slice(0, splitAt)),
      code: rest.slice(splitAt + 1)
    }
  } catch {
    return null
  }
}

async function qrLogin(cardText) {
  const card = parseLoginCard(cardText)
  if (!card) throw new Error('That QR code is not a login card.')
  const json = await postJson('/qr-login', card)
  if (json.token) tokenService.setToken(json.token)
  return { ...json, user: tokenService.getUserFromToken() }
}

export {
  signup,
  getUser,
  logout,
  login,
  addStudent,
  changePassword,
  issueLoginCard,
  qrLogin,
  parseLoginCard
}
