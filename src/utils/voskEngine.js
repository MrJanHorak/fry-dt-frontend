/**
 * Vosk speech recognition running entirely in this browser tab
 * (WebAssembly in a Web Worker). Used for "Say it" on devices whose browser
 * has no built-in on-device recognizer, e.g. Chromebooks.
 *
 * Privacy:
 *  - Audio goes from the microphone straight into the in-page recognizer.
 *    It is never recorded, stored or sent anywhere.
 *  - The speech model is downloaded from the school's own server
 *    (backend: npm run fetch:vosk-model), not from a third party.
 *  - The microphone is switched off as soon as each word is heard.
 *
 * Accuracy: the recognizer only listens for the target word, words that
 * sound the same, and a few other words from the session (a "grammar"),
 * plus "[unk]" for anything else. This makes it much better at answering
 * "did they say *said*?" than open dictation, and less likely to credit a
 * different word.
 */
import { API_BASE_URL } from '../config/runtime'
import { acceptableForms, heardWord } from './speechMatch'

export const VOSK_MODEL_URL =
  import.meta.env.VITE_VOSK_MODEL_URL ||
  `${API_BASE_URL}/models/vosk-model-small-en-us.tar.gz`

const READY_KEY = 'fry-vosk-ready'
// Generous: ~40 MB over slow school wifi, then unpacking in the worker
export const MODEL_LOAD_TIMEOUT_MS = 180000
let modelPromise = null
let modelLoaded = false

export function voskSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof WebAssembly === 'object' &&
    typeof Worker !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    Boolean(window.AudioContext || window.webkitAudioContext)
  )
}

/** 'available' | 'downloadable' | 'unsupported' */
export async function voskStatus() {
  if (!voskSupported()) return 'unsupported'
  if (modelLoaded) return 'available'
  try {
    // Is the school's server hosting the model?
    const res = await fetch(VOSK_MODEL_URL, { method: 'HEAD' })
    if (!res.ok) return 'unsupported'
  } catch {
    return 'unsupported'
  }
  let readyBefore = false
  try {
    readyBefore = localStorage.getItem(READY_KEY) === '1'
  } catch {
    /* storage unavailable */
  }
  // Downloaded before on this device: the browser cache makes loading quick
  return readyBefore ? 'available' : 'downloadable'
}

/** Loads (once per page) the model in a background worker. */
export function loadVoskModel() {
  if (!modelPromise) {
    modelPromise = import('vosk-browser')
      .then(
        (Vosk) =>
          // vosk-browser's createModel() never settles if the model fails to
          // load, so wait for "load" or "error" ourselves, with a timeout.
          new Promise((resolve, reject) => {
            const model = new Vosk.Model(VOSK_MODEL_URL)
            const fail = (reason) => {
              clearTimeout(timer)
              try {
                // Stop the background worker outright: vosk-browser's own
                // terminate() throws inside the worker when no model loaded
                if (model.worker?.terminate) model.worker.terminate()
                else model.terminate()
              } catch {
                /* worker already gone */
              }
              reject(new Error(reason))
            }
            const timer = setTimeout(
              () => fail('The speech pack took too long to load'),
              MODEL_LOAD_TIMEOUT_MS
            )
            model.on('load', (message) => {
              if (message?.result) {
                clearTimeout(timer)
                resolve(model)
              } else {
                fail('The speech pack could not be loaded')
              }
            })
            model.on('error', (message) =>
              fail(message?.error || 'The speech pack could not be loaded')
            )
          })
      )
      .then((model) => {
        modelLoaded = true
        try {
          localStorage.setItem(READY_KEY, '1')
        } catch {
          /* ignore */
        }
        return model
      })
      .catch((err) => {
        modelPromise = null
        throw err
      })
  }
  return modelPromise
}

const WORDLIKE = /^[a-z']+$/

/** The small list of words the recognizer is allowed to choose from. */
export function buildGrammar(target, competitors = []) {
  const forms = [...acceptableForms(target)].filter((w) => WORDLIKE.test(w))
  const others = competitors
    .map((w) => String(w).toLowerCase().trim())
    .filter((w) => WORDLIKE.test(w) && !forms.includes(w))
  return [...new Set([...forms, ...others])].slice(0, 20).concat('[unk]')
}

/**
 * Listens for one word. Resolves { matched, heard, reason }; never rejects.
 */
export async function listenWithVosk(
  target,
  { competitors = [], timeoutMs = 7000, onStart } = {}
) {
  let model
  try {
    model = await loadVoskModel()
  } catch (err) {
    return { matched: false, heard: [], reason: 'unavailable', message: err?.message }
  }

  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      video: false
    })
  } catch (err) {
    return {
      matched: false,
      heard: [],
      reason: err?.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture'
    }
  }

  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx()
  const recognizer = new model.KaldiRecognizer(
    ctx.sampleRate,
    JSON.stringify(buildGrammar(target, competitors))
  )
  const source = ctx.createMediaStreamSource(stream)
  // ScriptProcessor is what vosk-browser's own examples use; output is silent
  const processor = ctx.createScriptProcessor(4096, 1, 1)

  return new Promise((resolve) => {
    let settled = false
    const heard = []
    let timer
    let graceTimer

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      clearTimeout(graceTimer)
      try {
        processor.disconnect()
        source.disconnect()
      } catch {
        /* already disconnected */
      }
      // Turn the microphone off straight away
      stream.getTracks().forEach((track) => track.stop())
      ctx.close?.().catch?.(() => {})
      try {
        recognizer.remove()
      } catch {
        /* already removed */
      }
      resolve(result)
    }

    recognizer.on('result', (message) => {
      const text = (message?.result?.text || '').trim()
      if (!text) return // silence
      heard.push(text)
      const words = text
        .split(/\s+/)
        .filter((w) => w !== '[unk]')
        .join(' ')
      finish({ matched: heardWord(target, [words]), heard, reason: 'result' })
    })
    recognizer.on('error', () => finish({ matched: false, heard, reason: 'error' }))

    processor.onaudioprocess = (event) => {
      if (settled) return
      try {
        recognizer.acceptWaveform(event.inputBuffer)
      } catch {
        /* skip a bad buffer */
      }
    }
    source.connect(processor)
    processor.connect(ctx.destination)
    onStart?.()

    timer = setTimeout(() => {
      // Ask for whatever was heard so far, then give up shortly after
      try {
        recognizer.retrieveFinalResult()
      } catch {
        /* ignore */
      }
      graceTimer = setTimeout(
        () => finish({ matched: false, heard, reason: 'timeout' }),
        800
      )
    }, timeoutMs)
  })
}
