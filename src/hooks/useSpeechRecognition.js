/**
 * Custom hook for managing speech recognition
 * Provides speech-to-text functionality for sight word testing
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const useSpeechRecognition = (options = {}) => {
  const {
    continuous = false,
    interimResults = true,
    lang = 'en-US',
    maxAlternatives = 1,
    grammars = null
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState(null)
  const [supported, setSupported] = useState(false)

  const recognitionRef = useRef(null)
  const startTimeRef = useRef(null)

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      setSupported(true)
      recognitionRef.current = new SpeechRecognition()

      const recognition = recognitionRef.current

      // Configure recognition settings
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = lang
      recognition.maxAlternatives = maxAlternatives

      // Set up grammar if provided
      if (grammars && window.SpeechGrammarList) {
        const speechRecognitionList = new window.SpeechGrammarList()
        speechRecognitionList.addFromString(grammars, 1)
        recognition.grammars = speechRecognitionList
      }

      // Handle speech recognition results
      recognition.onresult = (event) => {
        let interim = ''
        let final = ''
        let maxConfidence = 0

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript

          if (result.isFinal) {
            final += transcript
            maxConfidence = Math.max(maxConfidence, result[0].confidence || 0)
          } else {
            interim += transcript
          }
        }

        setInterimTranscript(interim)
        if (final) {
          setFinalTranscript(final)
          setTranscript(final)
          setConfidence(maxConfidence)
        }
      }

      // Handle recognition start
      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
        startTimeRef.current = Date.now()
        console.log('Speech recognition started')
      }

      // Handle recognition end
      recognition.onend = () => {
        setIsListening(false)
        console.log('Speech recognition ended')
      }

      // Handle recognition errors
      recognition.onerror = (event) => {
        setError(event.error)
        setIsListening(false)
        console.error('Speech recognition error:', event.error)
      }

      // Handle no speech detected
      recognition.onnomatch = () => {
        setError('No speech was recognized')
        console.log('No speech recognized')
      }
    } else {
      setSupported(false)
      setError('Speech recognition not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [continuous, interimResults, lang, maxAlternatives, grammars])

  // Start listening
  const startListening = useCallback(() => {
    if (!supported) {
      setError('Speech recognition not supported')
      return
    }

    if (recognitionRef.current && !isListening) {
      setTranscript('')
      setInterimTranscript('')
      setFinalTranscript('')
      setConfidence(0)
      setError(null)

      try {
        recognitionRef.current.start()
      } catch (err) {
        setError('Failed to start speech recognition')
        console.error('Error starting recognition:', err)
      }
    }
  }, [supported, isListening])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Abort listening
  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      setIsListening(false)
    }
  }, [])

  // Reset transcript and state
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setFinalTranscript('')
    setConfidence(0)
    setError(null)
  }, [])

  // Get response time in milliseconds
  const getResponseTime = useCallback(() => {
    if (startTimeRef.current && finalTranscript) {
      return Date.now() - startTimeRef.current
    }
    return 0
  }, [finalTranscript])

  // Check if word matches expected word (with fuzzy matching)
  const checkWordMatch = useCallback(
    (expectedWord, threshold = 0.8) => {
      if (!finalTranscript || !expectedWord) return false

      const spoken = finalTranscript.toLowerCase().trim()
      const expected = expectedWord.toLowerCase().trim()

      // Exact match
      if (spoken === expected) return true

      // Check if spoken word contains expected word
      if (spoken.includes(expected) || expected.includes(spoken)) return true

      // Simple similarity check (Levenshtein distance)
      const similarity = calculateSimilarity(spoken, expected)
      return similarity >= threshold
    },
    [finalTranscript]
  )

  // Calculate similarity between two strings
  const calculateSimilarity = (str1, str2) => {
    const track = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i
    }

    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    const distance = track[str2.length][str1.length]
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength
  }

  return {
    // State
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    confidence,
    error,
    supported,

    // Actions
    startListening,
    stopListening,
    abortListening,
    resetTranscript,

    // Utilities
    getResponseTime,
    checkWordMatch,

    // Browser compatibility info
    browserSupport: {
      supported,
      hasWebkitSpeechRecognition: !!window.webkitSpeechRecognition,
      hasSpeechRecognition: !!window.SpeechRecognition
    }
  }
}

export default useSpeechRecognition
