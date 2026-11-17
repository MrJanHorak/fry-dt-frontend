// FRY Word List Management System

import { FRY_LISTS } from '../data/fryWords.js'

// Built from the single source of truth in src/data/fryWords.js:
// 10 lists of 100 words in Fry rank order.
const TARGET_AGES = [
  '6-7 years',
  '7-8 years',
  '7-8 years',
  '8-9 years',
  '8-10 years',
  '9-11 years',
  '9-11 years',
  '9-11 years',
  '9-11 years',
  '9-11 years'
]

export const MAX_LEVEL = FRY_LISTS.length

export const FRY_WORD_LEVELS = Object.fromEntries(
  FRY_LISTS.map((list, i) => [
    `level${list.list}`,
    {
      name: `Level ${list.list}: ${list.name}`,
      description: `Fry words ${i * 100 + 1}–${(i + 1) * 100} (suggested by ${list.suggestedBy.toLowerCase()})`,
      standards: list.standards,
      words: list.words,
      difficulty: list.list,
      targetAge: TARGET_AGES[i],
      averageLength:
        Math.round(
          (list.words.reduce((sum, w) => sum + w.length, 0) / list.words.length) * 10
        ) / 10
    }
  ])
)

// Word difficulty assessment based on various factors
export const assessWordDifficulty = (word) => {
  const factors = {
    length: word.length,
    vowelCount: (word.match(/[aeiou]/gi) || []).length,
    consonantClusters: (word.match(/[bcdfghjklmnpqrstvwxyz]{2,}/gi) || [])
      .length,
    syllables: estimateSyllables(word),
    irregularPhonics: isIrregularPhonic(word)
  }

  let difficultyScore = 0

  // Length factor
  if (factors.length <= 3) difficultyScore += 1
  else if (factors.length <= 5) difficultyScore += 2
  else if (factors.length <= 7) difficultyScore += 3
  else difficultyScore += 4

  // Syllable factor
  difficultyScore += factors.syllables

  // Consonant cluster factor
  difficultyScore += factors.consonantClusters * 0.5

  // Irregular phonics factor
  if (factors.irregularPhonics) difficultyScore += 2

  return Math.min(5, Math.max(1, Math.round(difficultyScore / 2)))
}

// Estimate syllables in a word
const estimateSyllables = (word) => {
  const vowelMatches = word.toLowerCase().match(/[aeiouy]+/g)
  let syllableCount = vowelMatches ? vowelMatches.length : 1

  // Adjust for silent e
  if (word.toLowerCase().endsWith('e') && syllableCount > 1) {
    syllableCount--
  }

  return Math.max(1, syllableCount)
}

// Check if word has irregular phonics
const isIrregularPhonic = (word) => {
  const irregularWords = [
    'the',
    'of',
    'was',
    'one',
    'two',
    'said',
    'have',
    'what',
    'were',
    'you',
    'your',
    'said',
    'come',
    'some',
    'would',
    'could',
    'should',
    'though',
    'through',
    'enough',
    'laugh',
    'cough',
    'rough',
    'tough'
  ]

  return irregularWords.includes(word.toLowerCase())
}

// Get words by level
export const getWordsByLevel = (level) => {
  return FRY_WORD_LEVELS[`level${level}`]?.words || []
}

// Get all words up to a certain level
export const getWordsUpToLevel = (maxLevel) => {
  let allWords = []
  for (let i = 1; i <= maxLevel; i++) {
    allWords = allWords.concat(getWordsByLevel(i))
  }
  return allWords
}

// Determine appropriate level for a student based on their performance
export const determineStudentLevel = (assessmentHistory) => {
  if (!assessmentHistory || assessmentHistory.length === 0) {
    return { recommendedLevel: 1, confidence: 'low' }
  }

  // Calculate accuracy by level
  const levelAccuracy = {}

  assessmentHistory.forEach((assessment) => {
    const word = assessment.wordTested
    const level = getWordLevel(word)

    if (level) {
      if (!levelAccuracy[level]) {
        levelAccuracy[level] = { correct: 0, total: 0 }
      }

      const correct =
        assessment.responses?.filter((r) => r.isCorrect).length || 0
      const total = assessment.responses?.length || 1

      levelAccuracy[level].correct += correct
      levelAccuracy[level].total += total
    }
  })

  // Find the highest level with at least 80% accuracy
  let recommendedLevel = 1
  let confidence = 'high'

  for (let level = 1; level <= MAX_LEVEL; level++) {
    if (levelAccuracy[level]) {
      const accuracy = levelAccuracy[level].correct / levelAccuracy[level].total
      if (accuracy >= 0.8 && levelAccuracy[level].total >= 5) {
        recommendedLevel = Math.min(5, level + 1)
      } else if (accuracy < 0.6) {
        confidence = 'medium'
        break
      }
    }
  }

  // Adjust confidence based on data availability
  const totalAssessments = assessmentHistory.length
  if (totalAssessments < 10) confidence = 'low'
  else if (totalAssessments < 20) confidence = 'medium'

  return { recommendedLevel, confidence }
}

// Get the level that a specific word belongs to
export const getWordLevel = (word) => {
  for (let level = 1; level <= MAX_LEVEL; level++) {
    if (getWordsByLevel(level).includes(word.toLowerCase())) {
      return level
    }
  }
  return null
}

// Generate a balanced word set for testing
export const generateTestWordSet = (level, count = 10, options = {}) => {
  const {
    includeReview = true,
    reviewPercentage = 0.3,
    difficultyVariation = true
  } = options

  let availableWords = []

  // Add words from current level
  availableWords = availableWords.concat(getWordsByLevel(level))

  // Add review words from previous levels
  if (includeReview && level > 1) {
    const reviewCount = Math.floor(count * reviewPercentage)
    const reviewWords = getWordsUpToLevel(level - 1)
    availableWords = availableWords.concat(
      shuffleArray(reviewWords).slice(0, reviewCount)
    )
  }

  // Shuffle and select words
  const selectedWords = shuffleArray(availableWords).slice(0, count)

  // Add difficulty variation if requested
  if (difficultyVariation && level < MAX_LEVEL) {
    const challengeCount = Math.floor(count * 0.1)
    const challengeWords = getWordsByLevel(level + 1)
    if (challengeWords.length > 0) {
      selectedWords.splice(
        -challengeCount,
        challengeCount,
        ...shuffleArray(challengeWords).slice(0, challengeCount)
      )
    }
  }

  return selectedWords
}

// Utility function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get practice recommendations based on student performance
export const getPracticeRecommendations = (studentProgress) => {
  const recommendations = []

  if (!studentProgress || !studentProgress.assessments) {
    return [
      {
        type: 'start',
        priority: 'high',
        message: 'Begin with Level 1 basic sight words',
        action: 'Start assessment to determine reading level'
      }
    ]
  }

  const recentAssessments = studentProgress.assessments.filter(
    (a) =>
      new Date(a.dateCompleted) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )

  if (recentAssessments.length === 0) {
    recommendations.push({
      type: 'assessment',
      priority: 'medium',
      message: 'No recent assessments found',
      action: 'Schedule a new assessment to track progress'
    })
  }

  // Analyze accuracy trends
  const overallAccuracy = calculateOverallAccuracy(recentAssessments)

  if (overallAccuracy < 0.6) {
    recommendations.push({
      type: 'review',
      priority: 'high',
      message: 'Accuracy below 60% - needs additional practice',
      action: 'Focus on reviewing previously learned words'
    })
  } else if (overallAccuracy > 0.9) {
    recommendations.push({
      type: 'advance',
      priority: 'medium',
      message: 'High accuracy achieved - ready for next level',
      action: 'Introduce words from the next difficulty level'
    })
  }

  // Check for specific test type weaknesses
  const testTypePerformance = analyzeTestTypePerformance(recentAssessments)

  Object.entries(testTypePerformance).forEach(([testType, accuracy]) => {
    if (accuracy < 0.7) {
      recommendations.push({
        type: 'skill',
        priority: 'medium',
        message: `${testType} skills need improvement (${(
          accuracy * 100
        ).toFixed(1)}% accuracy)`,
        action: `Focus on ${testType} practice exercises`
      })
    }
  })

  return recommendations
}

// Helper function to calculate overall accuracy
const calculateOverallAccuracy = (assessments) => {
  if (!assessments.length) return 0

  const totalResponses = assessments.reduce(
    (sum, assessment) => sum + (assessment.responses?.length || 0),
    0
  )
  const correctResponses = assessments.reduce(
    (sum, assessment) =>
      sum + (assessment.responses?.filter((r) => r.isCorrect).length || 0),
    0
  )

  return totalResponses > 0 ? correctResponses / totalResponses : 0
}

// Helper function to analyze performance by test type
const analyzeTestTypePerformance = (assessments) => {
  const testTypes = ['recognition', 'pronunciation', 'spelling', 'reading']
  const performance = {}

  testTypes.forEach((testType) => {
    const typeAssessments = assessments.filter((a) => a.testType === testType)
    performance[testType] = calculateOverallAccuracy(typeAssessments)
  })

  return performance
}

export default {
  FRY_WORD_LEVELS,
  assessWordDifficulty,
  getWordsByLevel,
  getWordsUpToLevel,
  determineStudentLevel,
  getWordLevel,
  generateTestWordSet,
  getPracticeRecommendations
}
