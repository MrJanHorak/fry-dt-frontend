import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { FRY_LISTS, ALL_FRY_WORDS, getFryRank, getGroupWords } from '../data/fryWords'
import { pickChoices, letterTiles, ACTIVITIES } from '../pages/Practice/practiceUtils'
import StatusBadge from '../components/StatusBadge/StatusBadge'
import ProgressChart from '../components/ProgressChart/ProgressChart'
import { applyToDocument, DEFAULT_ACCESSIBILITY } from '../contexts/AccessibilityContext'
import { parseLoginCard } from '../services/authService'

import { AuthProvider } from '../contexts/AuthContext'

afterEach(cleanup)

describe('Fry word data (frontend copy)', () => {
  it('has 1,000 unique words in 10 lists', () => {
    expect(FRY_LISTS).toHaveLength(10)
    expect(new Set(ALL_FRY_WORDS.map((w) => w.toLowerCase())).size).toBe(1000)
    expect(getGroupWords(1, 1)).toHaveLength(25)
    expect(getFryRank('oil')).toBe(88)
  })
})

describe('practice helpers', () => {
  it('builds the requested number of distinct choices including the answer', () => {
    for (const count of [2, 3, 4]) {
      const choices = pickChoices('said', [], count)
      expect(choices).toHaveLength(count)
      expect(choices).toContain('said')
      expect(new Set(choices).size).toBe(count)
    }
  })

  it('makes one tile per letter', () => {
    const tiles = letterTiles('there')
    expect(tiles.map((t) => t.letter).sort().join('')).toBe('eehrt')
    expect(new Set(tiles.map((t) => t.id)).size).toBe(5)
  })

  it('maps activities to accommodation response modes', () => {
    expect(ACTIVITIES.flashcards.mode).toBe('self-check')
    expect(ACTIVITIES['listen-find'].skill).toBe('receptive')
  })
})

describe('StatusBadge', () => {
  it('shows a text label, not colour alone', () => {
    render(<StatusBadge status="mastered" />)
    expect(screen.getByText('Mastered')).toBeTruthy()
  })
})

describe('ProgressChart', () => {
  it('describes the trend in text and offers a data table', () => {
    render(
      <ProgressChart
        points={[
          { weekEnding: '2026-10-01', mastered: 10 },
          { weekEnding: '2026-10-08', mastered: 18 }
        ]}
        goal={{ targetWords: 50, targetDate: '2026-12-01', baselineWords: 10, baselineDate: '2026-10-01' }}
      />
    )
    expect(screen.getAllByText(/went from 10 to 18/).length).toBeGreaterThan(0)
    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getByRole('img')).toBeTruthy()
  })
})

describe('accessibility settings', () => {
  it('applies preferences to the document', () => {
    const root = document.createElement('html')
    applyToDocument(
      { ...DEFAULT_ACCESSIBILITY, font: 'opendyslexic', theme: 'high-contrast', textScale: 1.5, reduceMotion: true },
      root
    )
    expect(root.dataset.font).toBe('opendyslexic')
    expect(root.dataset.theme).toBe('high-contrast')
    expect(root.dataset.reduceMotion).toBe('true')
    expect(root.style.getPropertyValue('--a11y-text-scale')).toBe('1.5')
  })

  it('renders labelled controls that change settings', async () => {
    const { AccessibilityProvider } = await import('../contexts/AccessibilityContext')
    const { default: AccessibilitySettings } = await import(
      '../components/AccessibilitySettings/AccessibilitySettings'
    )
    render(
      <MemoryRouter>
        <AuthProvider>
          <AccessibilityProvider>
            <AccessibilitySettings />
          </AccessibilityProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    const dyslexic = screen.getByLabelText(/OpenDyslexic/)
    fireEvent.click(dyslexic)
    expect(document.documentElement.dataset.font).toBe('opendyslexic')

    fireEvent.click(screen.getByRole('switch', { name: /Less movement/ }))
    expect(document.documentElement.dataset.reduceMotion).toBe('true')
  })
})

describe('QR login cards', () => {
  it('parses card values and rejects other QR codes', () => {
    expect(parseLoginCard('frydt:Emma%20H:abc-123')).toEqual({ name: 'Emma H', code: 'abc-123' })
    expect(parseLoginCard('https://example.com')).toBeNull()
  })
})

describe('TakeHomePacket', () => {
  it('prints a family letter, a chart row and a card per word', async () => {
    const { default: TakeHomePacket } = await import('../components/TakeHomePacket/TakeHomePacket')
    render(<TakeHomePacket studentName="Emma H" words={['said', 'were']} teacherName="Ms H" note="Great job!" />)
    expect(screen.getByText('Dear family,')).toBeTruthy()
    expect(screen.getByText(/Great job!/)).toBeTruthy()
    expect(screen.getAllByText('said')).toHaveLength(3) // tip + chart + card
    expect(screen.getAllByText('were')).toHaveLength(2) // chart + card
    expect(screen.getByText("Emma's practice chart")).toBeTruthy()
  })
})
