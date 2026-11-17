import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---- fake vosk-browser ----------------------------------------------------
const recognizerState = { grammar: null, removed: false, emit: null }
const modelBehaviour = { mode: 'load' } // 'load' | 'fail' | 'error'
class FakeModel {
  constructor() {
    this.handlers = {}
    this.terminated = false
    this.worker = { terminate: () => (this.terminated = true) }
    FakeModel.last = this
    setTimeout(() => {
      if (modelBehaviour.mode === 'load') this.handlers.load?.({ result: true })
      if (modelBehaviour.mode === 'fail') this.handlers.load?.({ result: false })
      if (modelBehaviour.mode === 'error') this.handlers.error?.({ error: 'bad model' })
    }, 0)
  }
  on(event, fn) {
    this.handlers[event] = fn
  }
  terminate() {
    this.terminated = true
  }
  get KaldiRecognizer() {
    return FakeRecognizer
  }
}
vi.mock('vosk-browser', () => ({
  Model: FakeModel,
  createModel: vi.fn(async () => ({
    KaldiRecognizer: class {
      constructor(sampleRate, grammar) {
        recognizerState.grammar = JSON.parse(grammar)
        recognizerState.removed = false
        this.handlers = {}
        recognizerState.emit = (event, msg) => this.handlers[event]?.(msg)
      }
      on(event, fn) {
        this.handlers[event] = fn
      }
    }
  }))
}))

class FakeRecognizer {
  constructor(sampleRate, grammar) {
    recognizerState.grammar = JSON.parse(grammar)
    recognizerState.removed = false
    this.handlers = {}
    recognizerState.emit = (event, msg) => this.handlers[event]?.(msg)
  }
  on(event, fn) {
    this.handlers[event] = fn
  }
  acceptWaveform() {}
  retrieveFinalResult() {}
  remove() {
    recognizerState.removed = true
  }
}

// ---- fake microphone + audio graph ----------------------------------------
let trackStopped
function installAudio({ deny = false } = {}) {
  trackStopped = false
  const stream = { getTracks: () => [{ stop: () => (trackStopped = true) }] }
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => {
        if (deny) throw Object.assign(new Error('denied'), { name: 'NotAllowedError' })
        return stream
      })
    }
  })
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() })
  window.AudioContext = class {
    sampleRate = 48000
    destination = {}
    createMediaStreamSource = node
    createScriptProcessor = node
    close = vi.fn(async () => {})
  }
  globalThis.WebAssembly = globalThis.WebAssembly || {}
  globalThis.Worker = globalThis.Worker || class {}
}

const flush = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})
afterEach(() => {
  delete window.SpeechRecognition
  vi.restoreAllMocks()
})

describe('grammar', () => {
  it('lists the target, sound-alikes and competitors, plus [unk]', async () => {
    const { buildGrammar } = await import('../utils/voskEngine')
    const g = buildGrammar('two', ['said', 'Was', '<bad>'])
    expect(g).toEqual(expect.arrayContaining(['two', 'to', 'too', 'said', 'was']))
    expect(g).not.toContain('2') // digits are not words the model knows
    expect(g.at(-1)).toBe('[unk]')
  })
})

describe('listenWithVosk', () => {
  it('confirms the target word and switches the microphone off', async () => {
    installAudio()
    const { listenWithVosk } = await import('../utils/voskEngine')
    const onStart = vi.fn()
    const promise = listenWithVosk('said', { competitors: ['sad'], onStart })
    await flush()
    await flush()
    expect(onStart).toHaveBeenCalled()
    expect(recognizerState.grammar).toEqual(['said', 'sad', '[unk]'])
    recognizerState.emit('result', { result: { text: '' } }) // silence is ignored
    recognizerState.emit('result', { result: { text: 'said' } })
    const result = await promise
    expect(result.matched).toBe(true)
    expect(trackStopped).toBe(true)
    expect(recognizerState.removed).toBe(true)
  })

  it('does not credit a different word or unknown speech', async () => {
    installAudio()
    const { listenWithVosk } = await import('../utils/voskEngine')
    let p = listenWithVosk('said', { competitors: ['sad'] })
    await flush(); await flush()
    recognizerState.emit('result', { result: { text: 'sad' } })
    expect((await p).matched).toBe(false)

    p = listenWithVosk('said')
    await flush(); await flush()
    recognizerState.emit('result', { result: { text: '[unk]' } })
    expect((await p).matched).toBe(false)
  })

  it('reports a blocked microphone without throwing', async () => {
    installAudio({ deny: true })
    const { listenWithVosk } = await import('../utils/voskEngine')
    expect(await listenWithVosk('said')).toMatchObject({ matched: false, reason: 'not-allowed' })
  })
})

describe('model loading', () => {
  it('fails cleanly (and stops the worker) when the model is bad', async () => {
    for (const mode of ['fail', 'error']) {
      vi.resetModules()
      modelBehaviour.mode = mode
      installAudio()
      const { loadVoskModel, listenWithVosk } = await import('../utils/voskEngine')
      await expect(loadVoskModel()).rejects.toThrow(/could not be loaded|bad model/)
      expect(FakeModel.last.terminated).toBe(true)
      expect(await listenWithVosk('said')).toMatchObject({ matched: false, reason: 'unavailable' })
    }
    modelBehaviour.mode = 'load'
  })
})

describe('engine choice', () => {
  it('prefers the browser on-device recognizer when it is ready', async () => {
    class SR {}
    SR.available = async () => 'available'
    window.SpeechRecognition = SR
    const { sayItEngine } = await import('../utils/onDeviceSpeech')
    expect(await sayItEngine()).toEqual({ engine: 'browser', status: 'available' })
  })

  it('falls back to Vosk when the school server hosts the model', async () => {
    installAudio()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true })
    const { sayItEngine } = await import('../utils/onDeviceSpeech')
    expect(await sayItEngine()).toEqual({ engine: 'vosk', status: 'downloadable' })
  })

  it('offers nothing when neither engine is available (no cloud fallback)', async () => {
    installAudio()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false })
    const { sayItEngine } = await import('../utils/onDeviceSpeech')
    expect(await sayItEngine()).toEqual({ engine: null, status: 'unsupported' })
  })
})
