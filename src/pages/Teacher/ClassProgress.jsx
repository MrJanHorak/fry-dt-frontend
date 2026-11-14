import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FRY_LISTS } from '../../data/fryWords'
import { getClassProgress } from '../../services/learningService'
import StatusBadge, { STATUS_INFO, STATUS_ORDER } from '../../components/StatusBadge/StatusBadge'
import AssignmentForm from '../../components/AssignmentForm/AssignmentForm'
import useRoster from './useRoster'
import styles from './Teacher.module.css'

/**
 * Whole-class view for one Fry list: who knows which words, which words
 * the class struggles with most, and suggested small groups. Any set of
 * words/students can be turned into an assignment in one step.
 */
const ClassProgress = () => {
  const { roster } = useRoster()
  const [list, setList] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(null) // { students, words, title }
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getClassProgress(list))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [list])

  useEffect(() => {
    load()
  }, [load])

  const listInfo = FRY_LISTS[list - 1]

  return (
    <div className={styles.page}>
      <h1>Class progress</h1>

      <div className={styles.toolbar}>
        <label className={styles.field}>
          Fry list
          <select value={list} onChange={(e) => setList(Number(e.target.value))}>
            {FRY_LISTS.map((l) => (
              <option key={l.list} value={l.list}>
                {l.name} (suggested by {l.suggestedBy.toLowerCase()})
              </option>
            ))}
          </select>
        </label>
        <Link to="/assignments" className={styles.buttonSecondary}>
          View assignments
        </Link>
      </div>
      <p className={styles.muted}>
        Standards: {listInfo.standards}. A word is <strong>mastered</strong>{' '}
        after it is read correctly and automatically (within about 3 seconds, or
        the student's accommodation) on 3 separate days.
      </p>

      {message && (
        <p role="status" className={styles.notice}>
          {message}
        </p>
      )}

      {assigning && (
        <AssignmentForm
          roster={roster}
          initial={assigning}
          onCancel={() => setAssigning(null)}
          onSaved={() => {
            setAssigning(null)
            setMessage('Assignment created. Students will see it in Practice.')
          }}
        />
      )}

      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading class data…</p>}

      {data && !loading && (
        <>
          {data.rows.length === 0 ? (
            <p>No students yet. Add students on your Profile page.</p>
          ) : (
            <>
              <div className={styles.twoCol}>
                <section aria-labelledby="most-missed" className={styles.card}>
                  <h2 id="most-missed" style={{ marginTop: 0 }}>
                    Words the class needs most
                  </h2>
                  {data.mostMissed.length ? (
                    <>
                      <ol>
                        {data.mostMissed.slice(0, 10).map((w) => (
                          <li key={w.word}>
                            <strong>{w.word}</strong> – {w.needCount} of{' '}
                            {data.rows.length} students
                          </li>
                        ))}
                      </ol>
                      <button
                        type="button"
                        className={styles.button}
                        onClick={() =>
                          setAssigning({
                            title: `${listInfo.name}: class tricky words`,
                            words: data.mostMissed.slice(0, 5).map((w) => w.word),
                            students: [
                              ...new Set(
                                data.mostMissed
                                  .slice(0, 5)
                                  .flatMap((w) => w.students.map((s) => s.studentId))
                              )
                            ]
                          })
                        }
                      >
                        Assign top 5 to students who need them
                      </button>
                    </>
                  ) : (
                    <p>No gaps found yet in this list. Assess or practise first.</p>
                  )}
                </section>

                <section aria-labelledby="groups" className={styles.card}>
                  <h2 id="groups" style={{ marginTop: 0 }}>
                    Suggested small groups
                  </h2>
                  {data.suggestedGroups.length ? (
                    <ul style={{ paddingLeft: '1.2rem' }}>
                      {data.suggestedGroups.map((g, i) => (
                        <li key={i} style={{ marginBottom: '0.75rem' }}>
                          <strong>{g.students.map((s) => s.name).join(', ')}</strong>
                          <br />
                          Shared words: {g.words.join(', ')}
                          <br />
                          <button
                            type="button"
                            className={styles.buttonSecondary}
                            onClick={() =>
                              setAssigning({
                                title: `Group ${i + 1}: ${g.words.slice(0, 3).join(', ')}…`,
                                words: g.words,
                                students: g.students.map((s) => s.studentId)
                              })
                            }
                          >
                            Assign to this group
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Groups appear when two or more students share the same gaps.</p>
                  )}
                  <h3>By working list</h3>
                  <ul style={{ paddingLeft: '1.2rem' }}>
                    {data.levelGroups.map((g) => (
                      <li key={g.workingList}>
                        {FRY_LISTS[g.workingList - 1].name}:{' '}
                        {g.students.map((s) => s.name).join(', ')}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <h2 id="heatmap-h">Every student, every word</h2>
              <ul className={styles.legend} aria-label="Legend">
                {STATUS_ORDER.map((s) => (
                  <li key={s}>
                    <StatusBadge status={s} />
                  </li>
                ))}
              </ul>
              <div className={styles.heatmapWrap} tabIndex={0} role="region" aria-labelledby="heatmap-h">
                <table className={styles.heatmap}>
                  <caption className="visually-hidden">
                    Status of each student on each word in {listInfo.name}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.cornerCell}>
                        Student
                      </th>
                      <th scope="col" className={styles.sumCell}>
                        Mastered
                      </th>
                      {data.words.map((w) => (
                        <th scope="col" key={w}>
                          {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.studentId}>
                        <th scope="row">
                          <Link to={`/students/${row.studentId}`}>{row.name}</Link>
                        </th>
                        <td>
                          <span className={styles.cell} style={{ width: 'auto', padding: '0 0.4rem' }}>
                            {row.masteredInList}/100
                          </span>
                        </td>
                        {data.words.map((w) => {
                          const status = row.statuses[w]
                          return (
                            <td key={w}>
                              <span
                                className={`${styles.cell} ${styles[`cell-${status}`]}`}
                                title={`${row.name} – ${w}: ${STATUS_INFO[status].label}`}
                              >
                                <span aria-hidden="true">{STATUS_INFO[status].symbol}</span>
                                <span className="visually-hidden">{STATUS_INFO[status].label}</span>
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ClassProgress
