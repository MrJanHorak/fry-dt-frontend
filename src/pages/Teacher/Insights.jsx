import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadCsv, getInsights } from '../../services/learningService'
import BarChart from '../../components/BarChart/BarChart'
import styles from './Teacher.module.css'

const GOAL_LABEL = {
  'on-track': { text: 'On track', symbol: '✓', status: 'mastered' },
  met: { text: 'Goal met', symbol: '★', status: 'mastered' },
  below: { text: 'Below goal line', symbol: '!', status: 'not-known' },
  none: { text: 'No goal set', symbol: '·', status: 'not-yet' }
}

const SUGGESTION = {
  'no-practice': 'Check in, assign a short set or send a take-home packet.',
  'below-goal': 'Consider more frequent practice or a smaller word set.',
  stalled: 'Try fewer new words per session or a 1:1 assessment.',
  'low-accuracy': 'Lower “new words per session” in their accommodations.'
}

const pct = (v) => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`)

const relativeDay = (iso) => {
  if (!iso) return 'Never'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

const COLUMNS = [
  { key: 'name', label: 'Student', get: (r) => r.name.toLowerCase() },
  { key: 'lastPracticed', label: 'Last practised', get: (r) => (r.lastPracticed ? new Date(r.lastPracticed).getTime() : 0) },
  { key: 'practiceDays', label: 'Days practised', get: (r) => r.practiceDays },
  { key: 'attempts', label: 'Words read', get: (r) => r.attempts },
  { key: 'mastered', label: 'Mastered', get: (r) => r.mastered },
  { key: 'masteredGained', label: 'New this period', get: (r) => r.masteredGained },
  { key: 'accuracy', label: 'Recent accuracy', get: (r) => r.accuracy ?? -1 },
  { key: 'automaticityRate', label: 'Automatic', get: (r) => r.automaticityRate ?? -1 },
  { key: 'goal', label: 'Goal', get: (r) => ['below', 'on-track', 'met', 'none'].indexOf(r.goal.status) }
]

/**
 * Class Insights: the teacher's at-a-glance view of practice and progress,
 * with the students who may need attention first.
 */
const Insights = () => {
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'ascending' })
  const [exportState, setExportState] = useState('')

  const load = useCallback(() => {
    setError('')
    getInsights(days)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [days])
  useEffect(load, [load])

  const rows = useMemo(() => {
    if (!data) return []
    const col = COLUMNS.find((c) => c.key === sort.key)
    const sign = sort.dir === 'ascending' ? 1 : -1
    return [...data.students].sort((a, b) => {
      const av = col.get(a)
      const bv = col.get(b)
      return (av > bv ? 1 : av < bv ? -1 : 0) * sign
    })
  }, [data, sort])

  const toggleSort = (key) =>
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === 'ascending' ? 'descending' : 'ascending'
    }))

  const exportCsv = async () => {
    setExportState('Preparing…')
    try {
      await downloadCsv(`/api/progress/class/export.csv?days=${days}`, 'class-progress.csv')
      setExportState('Downloaded')
    } catch (e) {
      setExportState(e.message)
    }
  }

  if (error) return <p role="alert">{error}</p>
  if (!data) return <p role="status">Loading class insights…</p>

  const { totals } = data
  const asDate = (d) => new Date(`${d}T12:00:00Z`)
  const weekday = (d) => asDate(d).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })
  const fmtDay = (d) =>
    `${weekday(d)} ${asDate(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
  const chartData = data.daily.map((d) => ({ label: fmtDay(d.date), short: weekday(d.date), value: d.students }))
  const busiest = data.daily.reduce((m, d) => (d.students > m.students ? d : m), data.daily[0])

  return (
    <div className={styles.page}>
      <h1>Class insights</h1>

      <div className={styles.toolbar}>
        <label className={styles.field}>
          Period
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </label>
        <button type="button" className={styles.buttonSecondary} onClick={exportCsv}>
          ⬇ Download CSV
        </button>
        <span role="status" aria-live="polite" className={styles.muted}>
          {exportState}
        </span>
        <Link to="/class" className={styles.buttonSecondary}>
          Word-by-word view
        </Link>
      </div>

      {totals.students === 0 ? (
        <p>No students yet. Add students on your Profile page.</p>
      ) : (
        <>
          <section aria-labelledby="totals-h">
            <h2 id="totals-h" className="visually-hidden">
              Summary
            </h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {totals.activeStudents}/{totals.students}
                </span>
                students practised
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{totals.wordsMastered}</span>
                words newly mastered
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{totals.attempts}</span>
                words read
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{pct(totals.automaticityRate)}</span>
                of correct reads automatic (timed students)
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {totals.withGoals ? `${totals.onTrack}/${totals.withGoals}` : '—'}
                </span>
                {totals.withGoals ? 'on track for their goal' : 'no goals set yet'}
              </div>
            </div>
          </section>

          <section aria-labelledby="attention-h">
            <h2 id="attention-h">Needs attention ({data.attention.length})</h2>
            {data.attention.length === 0 ? (
              <p>Everyone is practising and on track. 🎉</p>
            ) : (
              <ul className={styles.cardList}>
                {data.attention.map((s) => (
                  <li key={s.studentId} className={styles.card}>
                    <h3>{s.name}</h3>
                    <ul style={{ paddingLeft: '1.2rem', margin: '0 0 0.75rem' }}>
                      {s.flags.map((f) => (
                        <li key={f.code}>
                          <strong>{f.text}</strong>
                          <br />
                          <span className={styles.muted}>{SUGGESTION[f.code]}</span>
                        </li>
                      ))}
                    </ul>
                    <div className={styles.toolbar} style={{ marginBottom: 0 }}>
                      <Link className={styles.button} to={`/students/${s.studentId}`}>
                        Open {s.name}
                      </Link>
                      <Link className={styles.buttonSecondary} to={`/students/${s.studentId}/print`}>
                        🖨 Packet
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="activity-h">
            <h2 id="activity-h">Practice over the last 14 days</h2>
            <BarChart
              data={chartData}
              title="Students who practised each day"
              valueLabel="Students who practised"
              summary={`Busiest day: ${fmtDay(busiest.date)} with ${busiest.students} of ${totals.students} students.`}
            />
          </section>

          <section aria-labelledby="students-h">
            <h2 id="students-h">All students</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <caption className="visually-hidden">
                  Practice and progress for the last {days} days. Column headers sort the table.
                </caption>
                <thead>
                  <tr>
                    {COLUMNS.map((c) => (
                      <th
                        scope="col"
                        key={c.key}
                        aria-sort={sort.key === c.key ? sort.dir : 'none'}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          style={{ font: 'inherit', fontWeight: 700, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                        >
                          {c.label}
                          <span aria-hidden="true">
                            {sort.key === c.key ? (sort.dir === 'ascending' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const goal = GOAL_LABEL[r.goal.status]
                    return (
                      <tr key={r.studentId}>
                        <th scope="row">
                          <Link to={`/students/${r.studentId}`}>{r.name}</Link>
                        </th>
                        <td>{relativeDay(r.lastPracticed)}</td>
                        <td>{r.practiceDays}</td>
                        <td>{r.attempts}</td>
                        <td>{r.mastered}</td>
                        <td>{r.masteredGained > 0 ? `+${r.masteredGained}` : '0'}</td>
                        <td>{pct(r.accuracy)}</td>
                        <td>{r.automaticityRate === null ? 'not measured' : pct(r.automaticityRate)}</td>
                        <td>
                          <span className={`status-badge status-${goal.status}`}>
                            <span aria-hidden="true">{goal.symbol}</span> {goal.text}
                          </span>
                          {r.goal.expected !== null && r.goal.status !== 'met' && (
                            <span className={styles.muted} style={{ display: 'block', fontSize: '0.85em' }}>
                              expected {r.goal.expected} today
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <p className={styles.muted}>
            Flags are prompts for your judgement, not labels. They only appear to
            a student's own teachers and parents.
          </p>
        </>
      )}
    </div>
  )
}

export default Insights
