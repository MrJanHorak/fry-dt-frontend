import { getFryList, getListWords } from '../../data/fryWords'

export const shuffle = (items) => {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Picks answer choices for "listen & find": the target plus distractors that
 * look a bit alike (same first letter or similar length) so the child has to
 * look at the whole word, without being tricky homophones of each other.
 */
export function pickChoices(target, pool = [], count = 3) {
  const lower = target.toLowerCase()
  const list = getFryList(target) || 1
  const candidates = [...new Set([...pool, ...getListWords(list), ...getListWords(Math.max(1, list - 1))])]
    .filter((w) => w.toLowerCase() !== lower && /^[a-z]+$/i.test(w))

  const score = (w) =>
    (w[0].toLowerCase() === lower[0] ? 2 : 0) +
    (Math.abs(w.length - target.length) <= 1 ? 1 : 0) +
    Math.random()

  const distractors = candidates
    .sort((a, b) => score(b) - score(a))
    .slice(0, Math.max(1, count - 1))
  return shuffle([target, ...distractors])
}

/** Letter tiles for "build the word". */
export const letterTiles = (word) =>
  shuffle(
    word.split('').map((letter, i) => ({ id: `${i}-${letter}`, letter }))
  )

/** Activity metadata. `mode` matches accommodations.responseModes. */
export const ACTIVITIES = {
  flashcards: {
    mode: 'self-check',
    title: 'Read it',
    icon: '📖',
    description: 'Read the word out loud, then check.',
    instruction: 'Read the word out loud. Then press Check to hear it.',
    skill: 'expressive'
  },
  'listen-find': {
    mode: 'choice',
    title: 'Listen & find',
    icon: '👂',
    description: 'Hear a word and find it.',
    instruction: 'Listen to the word. Then find it.',
    skill: 'receptive'
  },
  'say-it': {
    mode: 'speech',
    title: 'Say it',
    icon: '🎤',
    description: 'Read the word to the computer. Your voice stays on this device.',
    instruction: 'Press the microphone, then read the word out loud.',
    skill: 'expressive'
  },
  'build-word': {
    mode: 'build',
    title: 'Build it',
    icon: '🧩',
    description: 'Hear a word and build it with letters.',
    instruction: 'Listen to the word. Then tap the letters in order to build it.',
    skill: 'receptive'
  }
}

/** Gentle success sound (no audio files needed). */
export function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.0001, now + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.32)
    })
    setTimeout(() => ctx.close(), 800)
  } catch {
    /* sound is optional */
  }
}
