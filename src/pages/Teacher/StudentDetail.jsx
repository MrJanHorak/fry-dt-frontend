import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FRY_LISTS } from '../../data/fryWords'
import { downloadCsv, getProgressSummary, saveProfileSettings } from '../../services/learningService'
import ProgressChart from '../../components/ProgressChart/ProgressChart'
import StatusBadge, { STATUS_INFO, STATUS_ORDER } from '../../components/StatusBadge/StatusBadge'
import AssignmentForm from '../../components/AssignmentForm/AssignmentForm'
import useRoster from './useRoster'
import styles from './Teacher.module.css'

const RESPONSE_MODES = [
  { value: 'self-check', label: 'Read aloud & self-check' },
  { value: 'choice', label: 'Listen & find (no speaking needed)' },
  { value: 'build', label: 'Build the word with letter tiles' },
  {
    value: 'speech',
    label:
      'Say it: speech recognition ON THIS DEVICE ONLY (built-in browser recognition, or a speech pack from your school server on Chromebooks; voice is never recorded or sent)'
  }
]

/** Teacher/parent editor for IEP/504-style accommodations. */
const AccommodationsEditor = ({ studentId, value, onSaved }) => {
  const [acc, setAcc] = useState(value)
  const [state, setState] = useState('')
  const set = (k, v) => setAcc((a) => ({ ...a, [k]: v }))

  const save = async (e) => {
    e.preventDefault()
    setState('Saving…')
    try {
      await saveProfileSettings(studentId, { accommodations: acc })
      setState('Saved')
      onSaved?.()
    } catch (err) {
      setState(err.message)
    }
  }

  const toggleMode = (mode) => {
    const modes = new Set(acc.responseModes || [])
    modes.has(mode) ? modes.delete(mode) : modes.add(mode)
    set('responseModes', [...modes])
  }

  return (
    <form onSubmit={save} className={styles.card} aria-labelledby="acc-h">
      <h2 id="acc-h" style={{ marginTop: 0 }}>
        Accommodations
      </h2>
      <p className={styles.muted}>
        Use these to match a student's IEP or 504 plan. They change how
        practice works and how mastery is measured for this student only.
      </p>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          Time to count as “automatic” (seconds)
          <input
            type="number"
            min="1"
            max="30"
            value={acc.automaticitySeconds}
            disabled={acc.untimed}
            onChange={(e) => set('automaticitySeconds', Number(e.target.value))}
          />
          <span className={styles.fieldHint}>Standard is 3 seconds.</span>
        </label>
        <label className={styles.field}>
          Words per practice session
          <input type="number" min="3" max="30" value={acc.wordsPerSession} onChange={(e) => set('wordsPerSession', Number(e.target.value))} />
        </label>
        <label className={styles.field}>
          New/unknown words per session
          <input type="number" min="1" max="10" value={acc.newWordsPerSession} onChange={(e) => set('newWordsPerSession', Number(e.target.value))} />
          <span className={styles.fieldHint}>Fewer = less frustration.</span>
        </label>
        <label className={styles.field}>
          Answer choices in Listen &amp; find
          <select value={acc.choiceCount} onChange={(e) => set('choiceCount', Number(e.target.value))}>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
        <label className={styles.field}>
          Break reminder (minutes, 0 = off)
          <input type="number" min="0" max="60" value={acc.breakReminderMinutes} onChange={(e) => set('breakReminderMinutes', Number(e.target.value))} />
        </label>
      </div>

      <ul className={styles.checkList} style={{ flexDirection: 'column', marginTop: '1rem' }}>
        <li>
          <label>
            <input type="checkbox" checked={acc.untimed} onChange={(e) => set('untimed', e.target.checked)} />
            Untimed (no time limits; mastery is based on accuracy only)
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" checked={acc.autoReadWords} onChange={(e) => set('autoReadWords', e.target.checked)} />
            Read each word aloud automatically
          </label>
        </li>
        <li>
          <label>
            <input
              type="checkbox"
              checked={acc.receptiveCountsForMastery}
              onChange={(e) => set('receptiveCountsForMastery', e.target.checked)}
            />
            Count Listen &amp; find / Build toward mastery (for non-speaking or AAC users)
          </label>
        </li>
      </ul>

      <fieldset className={styles.fieldset} style={{ marginTop: '1rem' }}>
        <legend>Ways this student can answer</legend>
        <ul className={styles.checkList}>
          {RESPONSE_MODES.map((m) => (
            <li key={m.value}>
              <label>
                <input
                  type="checkbox"
                  checked={(acc.responseModes || []).includes(m.value)}
                  onChange={() => toggleMode(m.value)}
                />
                {m.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <label className={styles.field}>
        Private notes (adults only)
        <textarea rows={2} maxLength={500} value={acc.notes || ''} onChange={(e) => set('notes', e.target.value)} />
      </label>

      <div className={styles.toolbar} style={{ marginTop: '1rem' }}>
        <button type="submit" className={styles.button}>
          Save accommodations
        </button>
        <span role="status" aria-live="polite">
          {state}
        </span>
      </div>
    </form>
  )
}

/** Progress-monitoring goal (baseline → target by a date). */
const GoalEditor = ({ studentId, goal, currentMastered, onSaved }) => {
  const [target, setTarget] = useState(goal?.targetWords || Math.min(1000, currentMastered + 50))
  const [date, setDate] = useState(goal?.targetDate ? String(goal.targetDate).slice(0, 10) : '')
  const [state, setState] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setState('Saving…')
    try {
      await saveProfileSettings(studentId, {
        goal: {
          targetWords: Number(target),
          targetDate: date,
          baselineWords: goal?.baselineWords ?? currentMastered,
          baselineDate: goal?.baselineDate || new Date().toISOString().slice(0, 10)
        }
      })
      setState('Saved')
      onSaved?.()
    } catch (err) {
      setState(err.message)
    }
  }

  return (
    <form onSubmit={save} className={styles.toolbar} aria-label="Set a goal">
      <label className={styles.field}>
        Goal: words mastered
        <input type="number" min={currentMastered} max="1000" value={target} onChange={(e) => setTarget(e.target.value)} required />
      </label>
      <label className={styles.field}>
        By
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <button type="submit" className={styles.buttonSecondary}>
        {goal ? 'Update goal' : 'Set goal'}
      </button>
      <span role="status" aria-live="polite">
        {state}
      </span>
    </form>
  )
}

const StudentDetail = () => {
  const { id } = useParams()
  const { roster } = useRoster()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('needs')
  const [assigning, setAssigning] = useState(null)
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    getProgressSummary(id).then(setData).catch((e) => setError(e.message))
  }, [id])
  useEffect(load, [load])

  const words = useMemo(() => {
    if (!data) return []
    if (filter === 'needs') return data.words.filter((w) => ['not-known', 'learning', 'review'].includes(w.status))
    if (filter === 'all') return data.words
    return data.words.filter((w) => w.status === filter)
  }, [data, filter])

  if (error) return <p role="alert">{error}</p>
  if (!data) return <p role="status">Loading…</p>

  const { student, totals } = data
  const rate = totals.automaticityRate

  return (
    <div className={styles.page}>
      <p>
        <Link to="/class">← Class progress</Link>
      </p>
      <h1>{student.name}</h1>
      <p className={styles.muted}>
        {student.grade === 0 ? 'Kindergarten' : `Grade ${student.grade}`}
      </p>

      <div className={styles.toolbar}>
        <Link className={styles.button} to={`/students/${id}/benchmark`}>
          Start 1:1 assessment
        </Link>
        <Link className={styles.buttonSecondary} to={`/students/${id}/print`}>
          🖨 Take-home packet
        </Link>
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={() =>
            downloadCsv(`/api/progress/${id}/export.csv`, 'words.csv').catch((e) => setMessage(e.message))
          }
        >
          ⬇ Words CSV
        </button>
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={() =>
            setAssigning({
              title: `${student.name}: practice words`,
              students: [id],
              words: data.words
                .filter((w) => ['not-known', 'learning', 'review'].includes(w.status))
                .slice(0, 8)
                .map((w) => w.word)
            })
          }
        >
          Assign practice words
        </button>
      </div>

      {message && <p role="status" className={styles.notice}>{message}</p>}
      {assigning && (
        <AssignmentForm
          roster={roster}
          initial={assigning}
          onCancel={() => setAssigning(null)}
          onSaved={() => {
            setAssigning(null)
            setMessage('Words assigned.')
            load()
          }}
        />
      )}

      <section aria-labelledby="overview-h">
        <h2 id="overview-h">Overview</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totals.mastered}</span> words mastered
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{FRY_LISTS[data.workingList - 1].name}</span>
            working list
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {rate === null ? '—' : `${Math.round(rate * 100)}%`}
            </span>
            {data.criteria.untimed
              ? 'automaticity (untimed: not measured)'
              : `of correct reads were automatic (≤ ${data.criteria.automaticitySeconds}s, last 30 days)`}
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totals.attempts}</span> words read in total
          </div>
        </div>
      </section>

      <section aria-labelledby="trend-h">
        <h2 id="trend-h">Progress monitoring</h2>
        <ProgressChart points={data.trend} goal={data.goal} title={`${student.name}: words mastered per week`} />
        <GoalEditor studentId={id} goal={data.goal} currentMastered={totals.mastered} onSaved={load} />
      </section>

      <section aria-labelledby="lists-h">
        <h2 id="lists-h">By list</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">List</th>
              {STATUS_ORDER.map((s) => (
                <th scope="col" key={s}>
                  {STATUS_INFO[s].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.lists
              .filter((l) => l.list <= data.workingList + 1 || l['not-yet'] < 100)
              .map((l) => (
                <tr key={l.list}>
                  <th scope="row">{FRY_LISTS[l.list - 1].name}</th>
                  {STATUS_ORDER.map((s) => (
                    <td key={s}>{l[s]}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="words-h">
        <h2 id="words-h">Words</h2>
        <label className={styles.field} style={{ maxWidth: 320 }}>
          Show
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="needs">Needs work (not known, learning, review)</option>
            <option value="all">All attempted words</option>
            {STATUS_ORDER.filter((s) => s !== 'not-yet').map((s) => (
              <option key={s} value={s}>
                {STATUS_INFO[s].label}
              </option>
            ))}
          </select>
        </label>
        {words.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Word</th>
                <th scope="col">Status</th>
                <th scope="col">Days correct</th>
                <th scope="col">Correct / tries</th>
                <th scope="col">Avg. time</th>
                <th scope="col">List</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.word}>
                  <th scope="row" style={{ fontSize: '1.15rem' }}>{w.word}</th>
                  <td><StatusBadge status={w.status} /></td>
                  <td>{w.masteryDays} / {data.criteria.masteryDays}</td>
                  <td>{w.correct} / {w.attempts}</td>
                  <td>{w.avgResponseMs ? `${(w.avgResponseMs / 1000).toFixed(1)}s` : '—'}</td>
                  <td>{w.fryList || 'custom'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No words in this view.</p>
        )}
      </section>

      <section aria-labelledby="acc-section">
        <h2 id="acc-section" className="visually-hidden">Accommodations</h2>
        {student.accommodations && (
          <AccommodationsEditor studentId={id} value={student.accommodations} onSaved={load} />
        )}
      </section>
    </div>
  )
}

export default StudentDetail
