import * as tokenService from './tokenService'
const BASE_URL = 'http://localhost:3000/api/auth'

async function signup(user) {
  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(user)
    })
    const json = await res.json()
    if (json.token) {
      tokenService.setToken(json.token)
    }
    if (json.err) {
      throw new Error(json.err)
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
    if (json.err) {
      throw new Error(json.err)
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
    if (json.token) {
      tokenService.setToken(json.token)
    }
    if (json.err) {
      throw new Error(json.err)
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

    if (json.err) {
      throw new Error(json.err)
    }
  } catch (err) {
    throw err
  }
}

export { signup, getUser, logout, login, addStudent, changePassword }
