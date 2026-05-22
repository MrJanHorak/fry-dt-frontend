import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getUser())
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(() => {
    const currentUser = authService.getUser()
    setUser(currentUser)
    return currentUser
  }, [])

  useEffect(() => {
    try {
      refreshUser()
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [refreshUser])

  const login = async (credentials) => {
    try {
      const authData = await authService.login(credentials)
      const currentUser = refreshUser()
      return { ...authData, user: currentUser }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const value = {
    user,
    login,
    logout,
    loading,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
