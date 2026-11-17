/**
 * Small text-to-speech helpers built on the browser's speechSynthesis.
 * Speech runs on the device: no audio is recorded or sent anywhere.
 */

export const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

let cachedVoices = []
if (speechSupported()) {
  const load = () => {
    cachedVoices = window.speechSynthesis.getVoices()
  }
  load()
  window.speechSynthesis.addEventListener?.('voiceschanged', load)
}

/**
 * @param {string} text
 * @param {{rate?: number, pitch?: number, voice?: number}} prefs
 *   the student's saved voice settings (voice = index in the voice list)
 */
export function speak(text, prefs = {}) {
  if (!speechSupported() || !text) return Promise.resolve(false)
  window.speechSynthesis.cancel()
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    // Slightly slower than normal by default: clearer for early readers
    utterance.rate = Number(prefs.rate) || 0.85
    utterance.pitch = Number(prefs.pitch) || 1
    const voice =
      cachedVoices[prefs.voice] ||
      cachedVoices.find((v) => v.lang?.startsWith('en') && v.localService) ||
      null
    if (voice) utterance.voice = voice
    utterance.onend = () => resolve(true)
    utterance.onerror = () => resolve(false)
    window.speechSynthesis.speak(utterance)
  })
}

/** Says each letter, then the whole word: "s… a… i… d… said". */
export async function spell(word, prefs = {}) {
  const letters = String(word).replace(/[^a-z']/gi, '').split('')
  await speak(letters.join(', ') + '. ' + word, { ...prefs, rate: 0.7 })
}

export const stopSpeaking = () => {
  if (speechSupported()) window.speechSynthesis.cancel()
}
