import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FRY_LISTS, getListWords, getGroupWords } from '../../data/fryWords'
import { getProgressSummary, recordAttempts } from '../../services/learningService'
import { shuffle } from '../Practice/practiceUtils'
import AssignmentForm from '../../components/AssignmentForm/AssignmentForm'
import useRoster from './useRoster'
import styles from './Teacher.module.css'

/**
 * Teacher-scored 1:1 word-reading assessment (benchmark / progress probe).
 *
 * Procedure (common in curriculum-based measurement):
 *  - Words appear one at a time, in random order to avoid sequence cues.
 *  - The child reads aloud; the adult scores. Self-corrections count as
 *    correct. Hesitating longer than the automaticity threshold is
 *    recorded as not automatic (calculated by the server).
 *  - Optional stop rule: end after N misses in a row to avoid frustration.
 *  - The adult never tells the child the word during the assessment.
 */
const Benchmark = () => {
  const { id } = useParams()
  const { roster } = useRoster()
  const [student, setStudent] = useState(null)
  const [summary, setSummary] = useState(null)
  const [phase, setPhase] = useState('setup') // setup | running | done
  const [list, setList] = useState(1)
  const [scope, setScope] = useState('all') // all | g1..g4 | unmastered
  const [randomOrder, setRandomOrder] = useState(true)
  const [stopAfter, setStopAfter] = useState(5)
  const [words, setWords] = useState([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState([]) // {word, correct, responseMs}
  const [saved, setSaved] = useState([])
  const [error, setError] = useState('')
  const [assigning, setAssigning] = useState(null)
  const shownAt = useRef(0)
  const unsent = useRef([])
  const correctBtn = useRef(null)

  useEffect(() => {
    getProgressSummary(id)
      .then((data) => {
        setSummary(data)
        setStudent(data.student)
        setList(data.workingList)
      })
      .catch((e) => setError(e.message))
  }, [id])

  const flush = useCallback(async () => {
    if (!unsent.current.length) return
    const batch = unsent.current
    unsent.current = []
    try {
      const res = await recordAttempts(id, batch)
      setSaved((s) => [...s, ...res.results])
    } catch (err) {
      unsent.current = [...batch, ...unsent.current]
      setError(`Could not save yet: ${err.message}. Results are kept and will retry.`)
    }
  }, [id])

  const begin = () => {
    let pool = getListWords(list)
    if (scope.startsWith('g')) pool = getGroupWords(list, Number(scope.slice(1)))
    if (scope === 'unmastered') {
      const mastered = new Set(
        (summary?.words || [])
          .filter((w) => w.status === 'mastered')
          .map((w) => w.word.toLowerCase())
      )
      pool = pool.filter((w) => !mastered.has(w.toLowerCase()))
    }
    setWords(randomOrder ? shuffle(pool) : pool)
    setIndex(0)
    setResults([])
    setSaved([])
    setPhase('running')
  }

  useEffect(() => {
    if (phase === 'running') {
      shownAt.current = performance.now()
      correctBtn.current?.focus()
    }
  }, [phase, index])

  const finish = useCallback(async () => {
    await flush()
    setPhase('done')
  }, [flush])

  const score = useCallback(
    (correct) => {
      const word = words[index]
      const entry = {
        word,
        correct,
        responseMs: Math.round(performance.now() - shownAt.current),
        context: 'benchmark',
        scoredBy: 'teacher',
        skill: 'expressive',
        sessionId: `bench-${id}-${new Date().toISOString().slice(0, 10)}`
      }
      const nextResults = [...results, entry]
      setResults(nextResults)
      unsent.current.push(entry)
      if (unsent.current.length >= 10) flush()

      const tail = nextResults.slice(-stopAfter)
      const hitStopRule =
        stopAfter > 0 && tail.length === stopAfter && tail.every((r) => !r.correct)
      if (hitStopRule || index + 1 >= words.length) {
        finish()
      } else {
        setIndex(index + 1)
      }
    },
    [words, index, results, stopAfter, id, flush, finish]
  )

  const undo = () => {
    if (!results.length) return
    // Only unsent results can be undone
    if (unsent.current.length) {
      unsent.current.pop()
      setResults((r) => r.slice(0, -1))
      setIndex((i) => Math.max(0, i - 1))
    }
  }

  useEffect(() => {
    if (phase !== 'running') return undefined
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'c' || k === 'arrowright') {
        e.preventDefault()
        score(true)
      } else if (k === 'x' || k === 'arrowleft') {
        e.preventDefault()
        score(false)
      } else if (k === 'u') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (error && !student) return <p role="alert">{error}</p>
  if (!student) return <p role="status">Loading…</p>

  if (phase === 'setup') {
    const acc = student.accommodations || {}
    return (
      <div className={styles.page}>
        <p>
          <Link to={`/students/${id}`}>← {student.name}</Link>
        </p>
        <h1>1:1 word assessment: {student.name}</h1>
        <div className={styles.notice}>
          <p>
            <strong>How to give it:</strong> sit beside {student.name} and say “Read
            each word. If you don't know one, say ‘pass’.” Score each word as they
            read. Self-corrections count as correct. Don't tell them the words.
          </p>
          <p>
            {acc.untimed
              ? 'Untimed accommodation: only accuracy is recorded.'
              : `Words read correctly within ${acc.automaticitySeconds || 3} seconds are recorded as automatic.`}
          </p>
        </div>

        <div className={styles.formGrid} style={{ marginTop: '1rem' }}>
          <label className={styles.field}>
            List
            <select value={list} onChange={(e) => setList(Number(e.target.value))}>
              {FRY_LISTS.map((l) => (
                <option key={l.list} value={l.list}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Words
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">All 100</option>
              <option value="g1">Words 1–25</option>
              <option value="g2">Words 26–50</option>
              <option value="g3">Words 51–75</option>
              <option value="g4">Words 76–100</option>
              <option value="unmastered">Only words not yet mastered</option>
            </select>
          </label>
          <label className={styles.field}>
            Stop rule
            <select value={stopAfter} onChange={(e) => setStopAfter(Number(e.target.value))}>
              <option value={0}>Off – show every word</option>
              <option value={3}>Stop after 3 misses in a row</option>
              <option value={5}>Stop after 5 misses in a row</option>
              <option value={10}>Stop after 10 misses in a row</option>
            </select>
          </label>
        </div>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
          <input type="checkbox" checked={randomOrder} onChange={(e) => setRandomOrder(e.target.checked)} />
          Random order (recommended)
        </label>
        <button type="button" className={styles.button} onClick={begin}>
          Begin
        </button>
      </div>
    )
  }

  if (phase === 'running') {
    return (
      <div className={styles.page} aria-label={`Assessment for ${student.name}`}>
        <p className={styles.muted}>
          {student.name} · word {index + 1} of {words.length} ·{' '}
          {results.filter((r) => r.correct).length} correct so far
        </p>
        <p className={styles.benchWord} lang="en" aria-live="polite">
          {words[index]}
        </p>
        <div className={styles.benchActions}>
          <button ref={correctBtn} type="button" className={`${styles.button} ${styles.correctBtn}`} onClick={() => score(true)}>
            ✓ Correct <span className={styles.kbd}>C</span>
          </button>
          <button type="button" className={`${styles.button} ${styles.incorrectBtn}`} onClick={() => score(false)}>
            ✗ Not yet <span className={styles.kbd}>X</span>
          </button>
        </div>
        <div className={styles.toolbar} style={{ marginTop: '1rem' }}>
          <button type="button" className={styles.buttonSecondary} onClick={undo} disabled={!unsent.current.length}>
            Undo last <span className={styles.kbd}>U</span>
          </button>
          <button type="button" className={styles.buttonSecondary} onClick={finish}>
            End now
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
      </div>
    )
  }

  const correct = results.filter((r) => r.correct)
  const missed = results.filter((r) => !r.correct).map((r) => r.word)
  const automatic = saved.filter((r) => r.automatic).length
  const stoppedEarly = results.length < words.length

  return (
    <div className={styles.page}>
      <h1>Results: {student.name}</h1>
      {stoppedEarly && (
        <p className={styles.notice}>
          Stopped after {results.length} of {words.length} words
          {stopAfter > 0 && results.slice(-stopAfter).every((r) => !r.correct)
            ? ` (${stopAfter} misses in a row)`
            : ''}
          .
        </p>
      )}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {correct.length}/{results.length}
          </span>
          read correctly
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{automatic}</span>
          read automatically
        </div>
      </div>
      {error && <p role="alert">{error}</p>}

      {missed.length > 0 && (
        <>
          <h2>Not yet known</h2>
          <p style={{ fontSize: '1.2rem' }}>{missed.join(', ')}</p>
          {!assigning && (
            <button
              type="button"
              className={styles.button}
              onClick={() =>
                setAssigning({
                  title: `${student.name}: from assessment`,
                  students: [id],
                  words: missed.slice(0, 8)
                })
              }
            >
              Assign these for practice
            </button>
          )}
          {assigning && (
            <AssignmentForm
              roster={roster}
              initial={assigning}
              onCancel={() => setAssigning(null)}
              onSaved={() => setAssigning(null)}
            />
          )}
        </>
      )}

      <div className={styles.toolbar} style={{ marginTop: '1.5rem' }}>
        <Link className={styles.buttonSecondary} to={`/students/${id}`}>
          Back to {student.name}
        </Link>
        <button type="button" className={styles.buttonSecondary} onClick={() => setPhase('setup')}>
          Assess again
        </button>
      </div>
    </div>
  )
}

export default Benchmark
