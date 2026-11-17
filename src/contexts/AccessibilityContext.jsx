import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useAuth } from './AuthContext'
import { getProfileById } from '../services/profileService'
import { saveProfileSettings } from '../services/learningService'

/**
 * Reading & display preferences, applied to <html> so every page benefits.
 * Saved on the device right away and to the student's profile when signed in
 * (so the same settings follow them to any classroom device).
 */
export const DEFAULT_ACCESSIBILITY = {
  font: 'default',
  textScale: 1,
  letterSpacing: 'normal',
  lineSpacing: 'normal',
  theme: 'default',
  reduceMotion: false,
  soundEffects: true,
  readAloudInstructions: true,
  largeTargets: false,
  focusMode: false
}

const STORAGE_KEY = 'fry-accessibility'

const readStored = () => {
  try {
    return { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return { ...DEFAULT_ACCESSIBILITY }
  }
}

const AccessibilityContext = createContext(null)

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider')
  return ctx
}

export function applyToDocument(settings, root = document.documentElement) {
  root.dataset.font = settings.font
  root.dataset.theme = settings.theme
  root.dataset.letterSpacing = settings.letterSpacing
  root.dataset.lineSpacing = settings.lineSpacing
  root.dataset.reduceMotion = String(Boolean(settings.reduceMotion))
  root.dataset.largeTargets = String(Boolean(settings.largeTargets))
  root.dataset.focusMode = String(Boolean(settings.focusMode))
  root.style.setProperty('--a11y-text-scale', String(settings.textScale || 1))
}

export function AccessibilityProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState(readStored)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const saveTimer = useRef(null)

  // Apply whenever settings change
  useEffect(() => {
    applyToDocument(settings)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [settings])

  // Load the signed-in user's saved preferences
  useEffect(() => {
    if (!user?.profile) return
    let cancelled = false
    getProfileById(user.profile)
      .then((profile) => {
        if (!cancelled && profile?.accessibility) {
          setSettings((current) => ({ ...current, ...profile.accessibility }))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user?.profile])

  const updateSettings = useCallback(
    (changes) => {
      setSettings((current) => {
        const next = { ...current, ...changes }
        if (user?.profile) {
          clearTimeout(saveTimer.current)
          setSaveState('saving')
          saveTimer.current = setTimeout(() => {
            saveProfileSettings(user.profile, { accessibility: next })
              .then(() => setSaveState('saved'))
              .catch(() => setSaveState('error'))
          }, 600)
        }
        return next
      })
    },
    [user?.profile]
  )

  const resetSettings = useCallback(
    () => updateSettings(DEFAULT_ACCESSIBILITY),
    [updateSettings]
  )

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings, saveState }),
    [settings, updateSettings, resetSettings, saveState]
  )

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export default AccessibilityContext
