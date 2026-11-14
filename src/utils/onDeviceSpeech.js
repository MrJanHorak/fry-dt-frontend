/**
 * ON-DEVICE-ONLY speech recognition.
 *
 * Children's voices must never leave the device. Browsers' default speech
 * recognition (e.g. Chrome) sends audio to a cloud service, so this module
 * only ever runs recognition when the browser confirms it will process
 * locally (Web Speech API `processLocally`). If that cannot be confirmed,
 * speech features are simply unavailable. There is no cloud fallback.
 *
 * Nothing is recorded or stored: audio goes straight to the browser's
 * local recognizer and only the words it heard come back.
 */

const LANG = 'en-US'

const getCtor = () =>
  typeof window === 'undefined'
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null

/**
 * @returns {Promise<'available'|'downloadable'|'downloading'|'unavailable'|'unsupported'>}
 */
export async function onDeviceStatus(lang = LANG) {
  const SR = getCtor()
  if (!SR || typeof SR.available !== 'function') return 'unsupported'
  try {
    return await SR.available({ langs: [lang], processLocally: true })
  } catch {
    return 'unsupported'
  }
}

/** Downloads the on-device language pack (call from a button click). */
export async function installOnDevice(lang = LANG) {
  const SR = getCtor()
  if (!SR || typeof SR.install !== 'function') return false
  try {
    return Boolean(await SR.install({ langs: [lang], processLocally: true }))
  } catch {
    return false
  }
}

/**
 * Creates a recognizer that is guaranteed to run locally, or throws.
 * Supports both shapes of the API that browsers have shipped.
 */
export function createLocalRecognizer({ lang = LANG, maxAlternatives = 5, interimResults = false, continuous = false } = {}) {
  const SR = getCtor()
  if (!SR) throw new Error('Speech recognition is not supported in this browser')
  const recognition = new SR()
  recognition.lang = lang
  recognition.maxAlternatives = maxAlternatives
  recognition.interimResults = interimResults
  recognition.continuous = continuous

  let local = false
  if ('processLocally' in recognition) {
    recognition.processLocally = true
    local = recognition.processLocally === true
  } else if ('options' in recognition) {
    recognition.options = { langs: [lang], processLocally: true }
    local = recognition.options?.processLocally === true
  }
  if (!local) {
    throw new Error('On-device speech recognition is not available, so the microphone stays off.')
  }
  return recognition
}

// Words a child can say identically but a recognizer may spell differently.
const SOUND_ALIKES = [
  ['to', 'two', 'too', '2'],
  ['there', 'their', "they're"],
  ['for', 'four', 'fore', '4'],
  ['one', 'won', '1'],
  ['write', 'right', 'rite'],
  ['know', 'no'],
  ['knew', 'new'],
  ['by', 'buy', 'bye'],
  ['i', 'eye'],
  ['be', 'bee'],
  ['see', 'sea'],
  ['would', 'wood'],
  ['here', 'hear'],
  ['its', "it's"],
  ['your', "you're"],
  ['our', 'hour'],
  ['son', 'sun'],
  ['eight', 'ate', '8'],
  ['road', 'rode'],
  ['whole', 'hole'],
  ['made', 'maid'],
  ['some', 'sum'],
  ['which', 'witch'],
  ['week', 'weak'],
  ['sea', 'see'],
  ['red', 'read'],
  ['three', '3'],
  ['five', '5'],
  ['six', '6'],
  ['seven', '7'],
  ['nine', '9'],
  ['ten', '10'],
  ['hundred', '100']
]

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .trim()

export function acceptableForms(target) {
  const key = normalize(target)
  const forms = new Set([key])
  for (const group of SOUND_ALIKES) {
    if (group.includes(key)) group.forEach((w) => forms.add(w))
  }
  return forms
}

/**
 * Did any of the recognizer's guesses contain the target word
 * (or a word that sounds exactly the same)?
 */
export function heardWord(target, transcripts = []) {
  const forms = acceptableForms(target)
  const multiWord = normalize(target).includes(' ')
  return transcripts.some((t) => {
    const text = normalize(t)
    if (multiWord) return text.includes(normalize(target))
    return text.split(/\s+/).some((token) => forms.has(token))
  })
}

/**
 * Listens once for a single word.
 * Resolves { matched, heard: string[], reason } and never rejects.
 */
export function listenForWord(target, { timeoutMs = 7000, onStart } = {}) {
  return new Promise((resolve) => {
    let recognition
    try {
      recognition = createLocalRecognizer()
    } catch (err) {
      resolve({ matched: false, heard: [], reason: 'unavailable', message: err.message })
      return
    }

    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        recognition.abort()
      } catch {
        /* already stopped */
      }
      resolve(result)
    }

    const timer = setTimeout(() => finish({ matched: false, heard: [], reason: 'timeout' }), timeoutMs)

    recognition.onstart = () => onStart?.()
    recognition.onresult = (event) => {
      const heard = []
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          heard.push(event.results[i][j].transcript)
        }
      }
      finish({ matched: heardWord(target, heard), heard, reason: 'result' })
    }
    recognition.onnomatch = () => finish({ matched: false, heard: [], reason: 'nomatch' })
    recognition.onerror = (event) =>
      finish({ matched: false, heard: [], reason: event.error || 'error' })
    recognition.onend = () => finish({ matched: false, heard: [], reason: 'no-speech' })

    try {
      recognition.start()
    } catch {
      finish({ matched: false, heard: [], reason: 'error' })
    }
  })
}
