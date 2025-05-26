/**
 * Custom hook for managing speech synthesis
 * Provides text-to-speech functionality with enhanced controls
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const useSpeechSynthesis = (options = {}) => {
  const {
    rate = 1,
    pitch = 1,
    volume = 1,
    voice = null,
    lang = 'en-US'
  } = options

  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const [voices, setVoices] = useState([])
  const [error, setError] = useState(null)

  const utteranceRef = useRef(null)
  const synthRef = useRef(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      setSupported(true)

      // Load voices
      const loadVoices = () => {
        const availableVoices = synthRef.current.getVoices()
        setVoices(availableVoices)
      }

      // Load voices immediately
      loadVoices()

      // Load voices when they become available (some browsers load them asynchronously)
      synthRef.current.addEventListener('voiceschanged', loadVoices)

      return () => {
        if (synthRef.current) {
          synthRef.current.removeEventListener('voiceschanged', loadVoices)
        }
      }
    } else {
      setSupported(false)
      setError('Speech synthesis not supported in this browser')
    }
  }, [])

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // Speak text
  const speak = useCallback(
    (text, customOptions = {}) => {
      if (!supported || !synthRef.current || !text) {
        setError(
          'Cannot speak: Speech synthesis not available or no text provided'
        )
        return false
      }

      // Cancel any ongoing speech
      synthRef.current.cancel()

      try {
        const utterance = new SpeechSynthesisUtterance(text)

        // Apply options
        utterance.rate = customOptions.rate ?? rate
        utterance.pitch = customOptions.pitch ?? pitch
        utterance.volume = customOptions.volume ?? volume
        utterance.lang = customOptions.lang ?? lang

        // Set voice
        const selectedVoice = customOptions.voice ?? voice
        if (selectedVoice) {
          if (typeof selectedVoice === 'string') {
            // Find voice by name
            const foundVoice = voices.find((v) => v.name === selectedVoice)
            if (foundVoice) {
              utterance.voice = foundVoice
            }
          } else {
            // Voice object provided directly
            utterance.voice = selectedVoice
          }
        } else {
          // Use default voice for the language
          const defaultVoice = voices.find((v) =>
            v.lang.startsWith(utterance.lang.split('-')[0])
          )
          if (defaultVoice) {
            utterance.voice = defaultVoice
          }
        }

        // Event handlers
        utterance.onstart = () => {
          setSpeaking(true)
          setError(null)
        }

        utterance.onend = () => {
          setSpeaking(false)
          utteranceRef.current = null
        }

        utterance.onerror = (event) => {
          setSpeaking(false)
          setError(`Speech synthesis error: ${event.error}`)
          utteranceRef.current = null
        }

        utterance.onpause = () => {
          setSpeaking(false)
        }

        utterance.onresume = () => {
          setSpeaking(true)
        }

        utteranceRef.current = utterance
        synthRef.current.speak(utterance)
        return true
      } catch (err) {
        setError(`Failed to speak: ${err.message}`)
        return false
      }
    },
    [supported, rate, pitch, volume, voice, lang, voices]
  )

  // Pause speaking
  const pause = useCallback(() => {
    if (synthRef.current && speaking) {
      synthRef.current.pause()
    }
  }, [speaking])

  // Resume speaking
  const resume = useCallback(() => {
    if (synthRef.current && !speaking && utteranceRef.current) {
      synthRef.current.resume()
    }
  }, [speaking])

  // Stop speaking
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setSpeaking(false)
      utteranceRef.current = null
    }
  }, [])

  // Get voices by language
  const getVoicesByLanguage = useCallback(
    (language) => {
      return voices.filter((voice) => voice.lang.startsWith(language))
    },
    [voices]
  )

  // Get preferred voice for language
  const getPreferredVoice = useCallback(
    (language = 'en') => {
      const languageVoices = getVoicesByLanguage(language)

      // Prefer local voices over remote ones
      const localVoices = languageVoices.filter((voice) => voice.localService)
      if (localVoices.length > 0) {
        return localVoices[0]
      }

      return languageVoices[0] || voices[0]
    },
    [voices, getVoicesByLanguage]
  )

  return {
    speak,
    pause,
    resume,
    stop,
    speaking,
    supported,
    voices,
    error,
    getVoicesByLanguage,
    getPreferredVoice
  }
}

export default useSpeechSynthesis
