import React from 'react'
import './WordStats.css'

const WordStats = ({ userProfile }) => {
  const words = userProfile.practicedWords.map((word) => {
    let correctPercent = (
      (word.timesCorrect / word.timesPracticed) *
      100
    ).toFixed(2)
    let incorrectPercent = (
      (word.timesIncorrect / word.timesPracticed) *
      100
    ).toFixed(2)

    return (
      <div key={word._id} className="practiced-words">
        <h2>{word.word}</h2>
        <p>
          <b>Times Practiced: </b>
          {word.timesPracticed}{' '}
        </p>
        <div id="stats-container">
          <div
            className={
              correctPercent > 0
                ? 'spelled-correctly-progressBar'
                : 'spelled-correctly-progressBar-none'
            }
          >
            <p>
              <b>Spelled correctly: </b>
              {word.timesCorrect}
            </p>
            <progress max="100" value={correctPercent}>
              {correctPercent}
            </progress>
            <p>
              <b> That is: </b>
              {correctPercent}%
            </p>
          </div>
          <div
            className={
              incorrectPercent > 0
                ? 'spelled-incorrectly-progressBar'
                : 'spelled-incorrectly-progressBar-none'
            }
          >
            <p>
              <b>Spelled incorrectly: </b> {word.timesIncorrect}
            </p>
            <progress max="100" value={incorrectPercent}>
              {incorrectPercent}
            </progress>
            <p>
              <b> That is: </b>
              {incorrectPercent}%
            </p>
          </div>
        </div>
        <b>wrong attempts: </b>
        {word.recordOfWrongs.join(', ')}
      </div>
    )
  })

  return (
    <>
      {userProfile.practicedWords.length === 0 && (
        <div>
          <h2>Loading ...</h2>
        </div>
      )}
      {userProfile.practicedWords.length && (
        <div id="word-stats">
          <h3>Total Practiced Words: {userProfile.practicedWords.length}</h3>
          {words}
        </div>
      )}
    </>
  )
}

export default WordStats
