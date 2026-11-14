import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  acceptableForms,
  createLocalRecognizer,
  heardWord,
  listenForWord,
  onDeviceStatus
} from '../utils/onDeviceSpeech'

/** A fake recognizer; `local` controls whether processLocally "sticks". */
function installFake({ local = true, available = 'available', results = null, error = null } = {}) {
  class FakeRecognition {
    constructor() {
      this._local = false
      FakeRecognition.last = this
    }
    get processLocally() {
      return this._local
    }
    set processLocally(v) {
      this._local = local ? v : false
    }
    start() {
      setTimeout(() => {
        this.onstart?.()
        if (error) this.onerror?.({ error })
        else if (results) {
          const list = [results.map((t) => ({ transcript: t, confidence: 0.9 }))]
          this.onresult?.({ results: list })
        } else this.onend?.()
      }, 0)
    }
    abort() {}
  }
  FakeRecognition.available = vi.fn(async () => available)
  FakeRecognition.install = vi.fn(async () => true)
  window.SpeechRecognition = FakeRecognition
  return FakeRecognition
}

afterEach(() => {
  delete window.SpeechRecognition
})

describe('matching what was heard', () => {
  it('accepts the word and words that sound the same', () => {
    expect(heardWord('two', ['to'])).toBe(true)
    expect(heardWord('there', ["they're"])).toBe(true)
    expect(heardWord('one', ['1'])).toBe(true)
    expect(heardWord('said', ['I said it'])).toBe(true)
    expect(acceptableForms('write').has('right')).toBe(true)
  })

  it('does not accept a different word', () => {
    expect(heardWord('said', ['sad', 'set'])).toBe(false)
    expect(heardWord('was', ['saw'])).toBe(false)
  })
})

describe('on-device only', () => {
  it('reports unsupported when the browser has no on-device API', async () => {
    window.SpeechRecognition = class {}
    expect(await onDeviceStatus()).toBe('unsupported')
  })

  it('refuses to create a recognizer that would use the cloud', () => {
    installFake({ local: false })
    expect(() => createLocalRecognizer()).toThrow(/microphone stays off/)
  })

  it('creates a local recognizer when processLocally is honoured', () => {
    installFake({ local: true })
    const r = createLocalRecognizer()
    expect(r.processLocally).toBe(true)
    expect(r.maxAlternatives).toBe(5)
  })
})

describe('listenForWord', () => {
  it('confirms a correct read', async () => {
    installFake({ results: ['said', 'set'] })
    const result = await listenForWord('said')
    expect(result.matched).toBe(true)
  })

  it('never throws and reports when nothing matched', async () => {
    installFake({ results: ['banana'] })
    expect((await listenForWord('said')).matched).toBe(false)
    installFake({ error: 'not-allowed' })
    expect(await listenForWord('said')).toMatchObject({ matched: false, reason: 'not-allowed' })
  })

  it('does not start at all without on-device support', async () => {
    installFake({ local: false })
    expect(await listenForWord('said')).toMatchObject({ matched: false, reason: 'unavailable' })
  })
})
