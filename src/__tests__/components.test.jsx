import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen
} from '@testing-library/react'
import useSocket from '../hooks/useSocket'
import FlashCard from '../components/FlashCard/FlashCard'
import WordStats from '../components/WordStats/WordStats'

const mockSpeak = vi.fn(() => true)
const mockGetPreferredVoice = vi.fn(() => null)

vi.mock('../hooks/useSpeechSynthesis', () => ({
  default: vi.fn(() => ({
    speak: mockSpeak,
    speaking: false,
    supported: true,
    error: null,
    getPreferredVoice: mockGetPreferredVoice
  }))
}))

describe('useSocket hook', () => {
  let mockSocket

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connected: true,
      disconnect: vi.fn(),
      id: 'socket-1'
    }
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('reports connection state for a provided socket instance', () => {
    const { result } = renderHook(() => useSocket(mockSocket))

    expect(result.current.socket).toBe(mockSocket)
    expect(result.current.isConnected).toBe(true)
  })

  it('subscribes and unsubscribes listeners through the socket instance', () => {
    const { result } = renderHook(() => useSocket(mockSocket))
    const handler = vi.fn()

    result.current.on('test_event', handler)
    expect(mockSocket.on).toHaveBeenCalledWith('test_event', handler)

    result.current.off('test_event', handler)
    expect(mockSocket.off).toHaveBeenCalledWith('test_event', handler)
  })

  it('emits events when the socket is connected', () => {
    const { result } = renderHook(() => useSocket(mockSocket))
    const payload = { message: 'hello' }

    result.current.emit('test_event', payload)

    expect(mockSocket.emit).toHaveBeenCalledWith('test_event', payload)
  })
})

describe('FlashCard component', () => {
  const baseProps = {
    profile: { rate: 1, pitch: 1, volume: 1, voice: 0 },
    displayWord: 'test',
    handleClick: vi.fn(),
    handleBack: vi.fn(),
    isTest: true
  }

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the flashcard controls and current word', () => {
    render(<FlashCard {...baseProps} />)

    expect(
      screen.getByRole('main', { name: /flashcard practice/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'test' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /previous word/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next word/i })).toBeInTheDocument()
  })

  it('handles keyboard navigation shortcuts', () => {
    render(<FlashCard {...baseProps} />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(baseProps.handleBack).toHaveBeenCalledTimes(1)
    expect(baseProps.handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('WordStats component', () => {
  const populatedProfile = {
    practicedWords: [
      {
        _id: 'word-1',
        word: 'the',
        timesPracticed: 5,
        timesCorrect: 4,
        timesIncorrect: 1,
        recordOfWrongs: ['teh']
      },
      {
        _id: 'word-2',
        word: 'and',
        timesPracticed: 2,
        timesCorrect: 2,
        timesIncorrect: 0,
        recordOfWrongs: []
      }
    ]
  }

  afterEach(() => {
    cleanup()
  })

  it('renders practiced word statistics', () => {
    render(<WordStats userProfile={populatedProfile} />)

    expect(
      screen.getByRole('main', { name: /word statistics/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/Total Practiced Words: 2/i)).toBeInTheDocument()
    expect(screen.getByText('the')).toBeInTheDocument()
    expect(screen.getByText('and')).toBeInTheDocument()
  })

  it('shows the empty state when there are no practiced words', () => {
    render(<WordStats userProfile={{ practicedWords: [] }} />)

    expect(screen.getByText(/No practiced words yet/i)).toBeInTheDocument()
  })
})
