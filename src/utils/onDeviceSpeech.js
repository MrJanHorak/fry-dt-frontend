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

import { acceptableForms, heardWord } from './speechMatch'
import { listenWithVosk, loadVoskModel, voskStatus } from './voskEngine'

export { acceptableForms, heardWord }

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

/**
 * Listens once for a single word with the browser's ON-DEVICE recognizer.
 * Resolves { matched, heard: string[], reason } and never rejects.
 */
export function listenWithBrowser(target, { timeoutMs = 7000, onStart } = {}) {
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

/**
 * Picks the engine for "Say it", most private/accurate first:
 *  1. the browser's built-in on-device recognizer (ready now)
 *  2. the browser's on-device recognizer after a one-time language download
 *  3. Vosk running in this page, with the speech model from the school's
 *     own server (works on Chromebooks and other browsers)
 * Never a cloud service.
 *
 * @returns {Promise<{engine: 'browser'|'vosk'|null, status: string}>}
 */
export async function sayItEngine() {
  const native = await onDeviceStatus()
  if (native === 'available') return { engine: 'browser', status: 'available' }
  if (native === 'downloadable' || native === 'downloading') {
    return { engine: 'browser', status: native }
  }
  const vosk = await voskStatus()
  if (vosk !== 'unsupported') return { engine: 'vosk', status: vosk }
  return { engine: null, status: 'unsupported' }
}

/** One-time setup for the chosen engine (call from a button press). */
export async function prepareEngine(engine) {
  if (engine === 'browser') return installOnDevice()
  if (engine === 'vosk') {
    try {
      await loadVoskModel()
      return true
    } catch {
      return false
    }
  }
  return false
}

/**
 * Listens once for a word using the chosen engine.
 * @param {string} target
 * @param {{engine?: 'browser'|'vosk', competitors?: string[], timeoutMs?: number, onStart?: Function}} options
 */
export function listenForWord(target, { engine = 'browser', ...options } = {}) {
  return engine === 'vosk'
    ? listenWithVosk(target, options)
    : listenWithBrowser(target, options)
}
