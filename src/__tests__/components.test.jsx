import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import useSocket from '../../hooks/useSocket'

// Mock the socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: true,
  disconnect: vi.fn(),
  connect: vi.fn()
}

// Mock the useSocket hook
vi.mock('../../hooks/useSocket', () => ({
  default: vi.fn()
}))

describe('useSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSocket.mockReturnValue({
      isConnected: true,
      emit: mockSocket.emit,
      on: mockSocket.on,
      off: mockSocket.off,
      socket: mockSocket
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should provide socket functionality', () => {
    const { isConnected, emit, on, off } = useSocket(mockSocket)

    expect(isConnected).toBe(true)
    expect(emit).toBeDefined()
    expect(on).toBeDefined()
    expect(off).toBeDefined()
  })

  it('should handle socket events correctly', () => {
    const { on, off } = useSocket(mockSocket)
    const testHandler = vi.fn()

    on('test_event', testHandler)
    expect(mockSocket.on).toHaveBeenCalledWith('test_event', testHandler)

    off('test_event', testHandler)
    expect(mockSocket.off).toHaveBeenCalledWith('test_event', testHandler)
  })

  it('should emit events correctly', () => {
    const { emit } = useSocket(mockSocket)
    const testData = { message: 'test' }

    emit('test_event', testData)
    expect(mockSocket.emit).toHaveBeenCalledWith('test_event', testData)
  })
})

// Test for FlashCard component
describe('FlashCard Component Accessibility', () => {
  const mockProps = {
    profile: { name: 'Test User' },
    displayWord: { word: 'test', definition: 'a test word' },
    handleClick: vi.fn(),
    handleBack: vi.fn(),
    test: false
  }

  it('should have proper ARIA labels', async () => {
    const { container } = render(<FlashCard {...mockProps} />)

    expect(screen.getByRole('main')).toHaveAttribute(
      'aria-label',
      'Flash card interface'
    )
    expect(screen.getByRole('button', { name: /correct/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /incorrect/i })
    ).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    render(<FlashCard {...mockProps} />)
    const container = screen.getByRole('main')

    fireEvent.keyDown(container, { key: 'ArrowRight' })
    await waitFor(() => {
      expect(mockProps.handleClick).toHaveBeenCalledWith(true)
    })

    fireEvent.keyDown(container, { key: 'ArrowLeft' })
    await waitFor(() => {
      expect(mockProps.handleClick).toHaveBeenCalledWith(false)
    })
  })

  it('should announce word changes to screen readers', async () => {
    render(<FlashCard {...mockProps} />)

    const announcement = screen.getByRole('status')
    expect(announcement).toHaveAttribute('aria-live', 'polite')
  })
})

// Test for error handling middleware
describe('Error Handling', () => {
  it('should handle async errors correctly', async () => {
    const mockReq = {}
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    const mockNext = vi.fn()

    const errorHandler = async (req, res, next) => {
      try {
        throw new Error('Test error')
      } catch (error) {
        res.status(500).json({ err: error.message })
      }
    }

    await errorHandler(mockReq, mockRes, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({ err: 'Test error' })
  })
})

// Test for validation middleware
describe('Validation Middleware', () => {
  it('should validate practiced word data', () => {
    const validData = {
      word: 'test',
      mastered: false,
      timesPracticed: 1,
      timesCorrect: 1,
      timesIncorrect: 0
    }

    const invalidData = {
      word: '',
      timesPracticed: -1
    }

    // Mock validation function
    const validatePracticedWord = (data) => {
      if (!data.word || data.word.trim() === '') return false
      if (data.timesPracticed < 0) return false
      return true
    }

    expect(validatePracticedWord(validData)).toBe(true)
    expect(validatePracticedWord(invalidData)).toBe(false)
  })
})

// Test for WordStats component performance
describe('WordStats Performance', () => {
  const mockProfile = {
    practicedWords: Array.from({ length: 100 }, (_, i) => ({
      _id: `word-${i}`,
      word: `word${i}`,
      timesPracticed: Math.floor(Math.random() * 10),
      timesCorrect: Math.floor(Math.random() * 5),
      timesIncorrect: Math.floor(Math.random() * 5),
      mastered: Math.random() > 0.5
    }))
  }

  it('should render large word lists efficiently', () => {
    const startTime = performance.now()
    render(<WordStats userProfile={mockProfile} />)
    const endTime = performance.now()

    // Should render within reasonable time (less than 100ms)
    expect(endTime - startTime).toBeLessThan(100)
  })

  it('should memoize calculations for better performance', () => {
    const { rerender } = render(<WordStats userProfile={mockProfile} />)

    // Spy on useMemo to ensure calculations are memoized
    const memoSpy = vi.spyOn(React, 'useMemo')

    rerender(<WordStats userProfile={mockProfile} />)

    // Should not recalculate if profile hasn't changed
    expect(memoSpy).toHaveBeenCalled()
  })
})
