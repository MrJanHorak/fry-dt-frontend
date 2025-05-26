import { Buffer } from 'buffer'

function setToken(token) {
  localStorage.setItem('token', token)
}

function getToken() {
  let token = localStorage.getItem('token')
  if (token) {
    try {
      // Validate token structure before parsing
      const parts = token.split('.')
      if (parts.length !== 3) {
        console.warn('Invalid token format: token does not have 3 parts')
        localStorage.removeItem('token')
        return null
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64'))
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.log('Token expired, removing from storage')
        localStorage.removeItem('token')
        token = null
      }
    } catch (error) {
      console.error('Error parsing token:', error)
      localStorage.removeItem('token')
      token = null
    }
  } else {
    localStorage.removeItem('token')
  }
  return token
}

function getUserFromToken() {
  const token = getToken()
  return token
    ? JSON.parse(Buffer.from(token.split('.')[1], 'base64')).user
    : null
}

function removeToken() {
  localStorage.removeItem('token')
}

export { setToken, getToken, getUserFromToken, removeToken }
