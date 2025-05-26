import React, { useMemo } from 'react'
import './WordStats.css'
import { WordStatsSkeleton } from '../Loading/Loading'

const WordStats = ({ userProfile }) => {
  // Memoize the calculated words to prevent recalculation on every render
  const calculatedWords = useMemo(() => {
    if (!userProfile?.practicedWords?.length) return []

    return userProfile.practicedWords.map((word) => {
      const correctPercent =
        word.timesPracticed > 0
          ? ((word.timesCorrect / word.timesPracticed) * 100).toFixed(2)
          : '0.00'

      const incorrectPercent =
        word.timesPracticed > 0
          ? ((word.timesIncorrect / word.timesPracticed) * 100).toFixed(2)
          : '0.00'

      return {
        ...word,
        correctPercent: parseFloat(correctPercent),
        incorrectPercent: parseFloat(incorrectPercent)
      }
    })
  }, [userProfile?.practicedWords])

  // Memoize the rendered words to prevent re-rendering
  const renderedWords = useMemo(() => {
    return calculatedWords.map((word) => (
      <div key={word._id} className="practiced-words">
        <h2>{word.word}</h2>
        <p>
          <b>Times Practiced: </b>
          {word.timesPracticed}
        </p>
        <div id="stats-container">
          <div
            className={
              word.correctPercent > 0
                ? 'spelled-correctly-progressBar'
                : 'spelled-correctly-progressBar-none'
            }
          >
            <p>
              <b>Spelled correctly: </b>
              {word.timesCorrect}
            </p>
            <progress
              max="100"
              value={word.correctPercent}
              aria-label={`Correct percentage: ${word.correctPercent}%`}
            >
              {word.correctPercent}%
            </progress>
            <p>
              <b>That is: </b>
              {word.correctPercent}%
            </p>
          </div>
          <div
            className={
              word.incorrectPercent > 0
                ? 'spelled-incorrectly-progressBar'
                : 'spelled-incorrectly-progressBar-none'
            }
          >
            <p>
              <b>Spelled incorrectly: </b> {word.timesIncorrect}
            </p>
            <progress
              max="100"
              value={word.incorrectPercent}
              aria-label={`Incorrect percentage: ${word.incorrectPercent}%`}
            >
              {word.incorrectPercent}%
            </progress>
            <p>
              <b>That is: </b>
              {word.incorrectPercent}%
            </p>
          </div>
        </div>
        <div>
          <b>Wrong attempts: </b>
          {word.recordOfWrongs?.length > 0
            ? word.recordOfWrongs.join(', ')
            : 'None'}
        </div>
      </div>
    ))
  }, [calculatedWords])

  // Loading state with better UX
  if (!userProfile || !userProfile.practicedWords) {
    return <WordStatsSkeleton />
  }

  // Empty state
  if (userProfile.practicedWords.length === 0) {
    return (
      <div className="empty-state">
        <h2>No practiced words yet</h2>
        <p>Start practicing to see your progress here!</p>
      </div>
    )
  }

  return (
    <div id="word-stats" role="main" aria-label="Word statistics">
      <h3>Total Practiced Words: {userProfile.practicedWords.length}</h3>
      <div className="words-container">{renderedWords}</div>
    </div>
  )
}

export default WordStats
