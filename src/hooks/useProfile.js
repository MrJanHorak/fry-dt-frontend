/**
 * Custom hook for managing user profile data
 * Handles fetching, caching, and updating profile information
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import * as profileService from '../services/profileService'

const useProfile = (profileId, options = {}) => {
  const {
    autoFetch = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    retryAttempts = 3
  } = options

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  // Check if data is stale
  const isStale = useMemo(() => {
    if (!lastFetch) return true
    return Date.now() - lastFetch > cacheTime
  }, [lastFetch, cacheTime])

  // Fetch profile data with retry logic
  const fetchProfile = useCallback(
    async (forceRefresh = false) => {
      if (!profileId) return

      // Don't fetch if data is fresh and not forcing refresh
      if (!forceRefresh && !isStale && profile) {
        return profile
      }

      setLoading(true)
      setError(null)

      let attempts = 0
      while (attempts < retryAttempts) {
        try {
          const profileData = await profileService.show(profileId)
          setProfile(profileData)
          setLastFetch(Date.now())
          setLoading(false)
          return profileData
        } catch (err) {
          attempts++
          console.error(`Profile fetch attempt ${attempts} failed:`, err)

          if (attempts >= retryAttempts) {
            setError(err.message || 'Failed to fetch profile')
            setLoading(false)
            throw err
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempts) * 1000)
          )
        }
      }
    },
    [profileId, isStale, profile, retryAttempts]
  )

  // Update profile data optimistically
  const updateProfile = useCallback(
    async (updates) => {
      if (!profileId) return

      // Optimistic update
      const previousProfile = profile
      setProfile((current) => ({ ...current, ...updates }))

      try {
        const updatedProfile = await profileService.update(profileId, updates)
        setProfile(updatedProfile)
        setLastFetch(Date.now())
        return updatedProfile
      } catch (err) {
        // Revert on error
        setProfile(previousProfile)
        setError(err.message || 'Failed to update profile')
        throw err
      }
    },
    [profileId, profile]
  )

  // Add practiced word
  const addPracticedWord = useCallback(
    async (wordData) => {
      if (!profileId) return

      try {
        const updatedWords = await profileService.addPracticedWord(
          profileId,
          wordData
        )
        setProfile((current) => ({
          ...current,
          practicedWords: updatedWords
        }))
        setLastFetch(Date.now())
        return updatedWords
      } catch (err) {
        setError(err.message || 'Failed to add practiced word')
        throw err
      }
    },
    [profileId]
  )

  // Update practiced word
  const updatePracticedWord = useCallback(
    async (wordId, wordData) => {
      if (!profileId || !wordId) return

      try {
        const updatedWord = await profileService.updatePracticedWord(
          profileId,
          wordId,
          wordData
        )
        setProfile((current) => ({
          ...current,
          practicedWords: current.practicedWords.map((word) =>
            word._id === wordId ? updatedWord : word
          )
        }))
        setLastFetch(Date.now())
        return updatedWord
      } catch (err) {
        setError(err.message || 'Failed to update practiced word')
        throw err
      }
    },
    [profileId]
  )

  // Remove student from profile
  const removeStudent = useCallback(
    async (studentId) => {
      if (!profileId || !studentId) return

      try {
        const updatedStudents = await profileService.removeStudentFromProfile(
          profileId,
          studentId
        )
        setProfile((current) => ({
          ...current,
          students: updatedStudents
        }))
        setLastFetch(Date.now())
        return updatedStudents
      } catch (err) {
        setError(err.message || 'Failed to remove student')
        throw err
      }
    },
    [profileId]
  )

  // Refresh profile data
  const refresh = useCallback(() => {
    return fetchProfile(true)
  }, [fetchProfile])

  // Clear cache
  const clearCache = useCallback(() => {
    setProfile(null)
    setLastFetch(null)
    setError(null)
  }, [])

  // Auto-fetch on mount and when profileId changes
  useEffect(() => {
    if (autoFetch && profileId) {
      fetchProfile()
    }
  }, [profileId, autoFetch, fetchProfile])

  // Computed values
  const practiceStats = useMemo(() => {
    if (!profile?.practicedWords?.length) {
      return {
        totalWords: 0,
        totalPracticed: 0,
        averageAccuracy: 0,
        totalCorrect: 0,
        totalIncorrect: 0
      }
    }

    const words = profile.practicedWords
    const totalWords = words.length
    const totalPracticed = words.reduce(
      (sum, word) => sum + (word.timesPracticed || 0),
      0
    )
    const totalCorrect = words.reduce(
      (sum, word) => sum + (word.timesCorrect || 0),
      0
    )
    const totalIncorrect = words.reduce(
      (sum, word) => sum + (word.timesIncorrect || 0),
      0
    )
    const averageAccuracy =
      totalPracticed > 0 ? (totalCorrect / totalPracticed) * 100 : 0

    return {
      totalWords,
      totalPracticed,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      totalCorrect,
      totalIncorrect
    }
  }, [profile?.practicedWords])

  return {
    profile,
    loading,
    error,
    isStale,
    practiceStats,
    fetchProfile,
    updateProfile,
    addPracticedWord,
    updatePracticedWord,
    removeStudent,
    refresh,
    clearCache
  }
}

export default useProfile
