const DEFAULT_BACKEND_ORIGIN = 'http://localhost:3000'

const trimTrailingSlash = (value) => value?.replace(/\/+$/, '')

export const API_BASE_URL =
  trimTrailingSlash(import.meta.env.VITE_API_URL) || DEFAULT_BACKEND_ORIGIN

export const SOCKET_URL =
  trimTrailingSlash(import.meta.env.VITE_SOCKET_URL) || API_BASE_URL

export const AUTH_API_BASE_URL = `${API_BASE_URL}/api/auth`
export const PROFILES_API_BASE_URL = `${API_BASE_URL}/api/profiles`
