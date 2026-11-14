import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listAssignments,
  archiveAssignment,
  getAssignmentProgress
} from '../../services/learningService'
import AssignmentForm from '../../components/AssignmentForm/AssignmentForm'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import useRoster from './useRoster'
import styles from './Teacher.module.css'

const AssignmentProgress = ({ id }) => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    getAssignmentProgress(id).then(setData).catch((e) => setError(e.message))
  }, [id])

  if (error) return <p role="alert">{error}</p>
  if (!data) return <p role="status">Loading progress…</p>

  return (
    <table className={styles.table}>
      <caption className="visually-hidden">Progress on {data.assignment.title}</caption>
      <thead>
        <tr>
          <th scope="col">Student</th>
          <th scope="col">Done</th>
          <th scope="col">Words</th>
        </tr>
      </thead>
      <tbody>
        {data.students.map((s) => (
          <tr key={s.studentId}>
            <th scope="row">
              <Link to={`/students/${s.studentId}`}>{s.name}</Link>
            </th>
            <td>
              {s.doneCount} / {s.words.length}
              {!s.practiced && <span className={styles.muted}> (not started)</span>}
            </td>
            <td>
              <ul className={styles.wordChips}>
                {s.words.map((w) => (
                  <li key={w.word}>
                    <span className={styles.chipWord}>{w.word}</span>
                    <StatusBadge status={w.status} short />
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const Assignments = () => {
  const { roster } = useRoster()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // {} for new, assignment for edit
  const [open, setOpen] = useState(null)
  const [status, setStatus] = useState('active')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAssignments(await listAssignments(status))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className={styles.page}>
      <h1>Assignments</h1>
      <div className={styles.toolbar}>
        <button type="button" className={styles.button} onClick={() => setEditing({})}>
          + New assignment
        </button>
        <label className={styles.field}>
          Show
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <Link to="/class" className={styles.buttonSecondary}>
          Class progress
        </Link>
      </div>

      {editing && (
        <AssignmentForm
          roster={roster}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}

      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading…</p>
      ) : assignments.length === 0 ? (
        <p>No {status} assignments.</p>
      ) : (
        <ul className={styles.cardList} style={{ gridTemplateColumns: '1fr' }}>
          {assignments.map((a) => (
            <li key={a._id} className={styles.card}>
              <h2 style={{ marginTop: 0 }}>{a.title}</h2>
              <p className={styles.muted}>
                {a.students.map((s) => s.name).join(', ')} · {a.words.length} words
                {a.dueDate && ` · due ${new Date(a.dueDate).toLocaleDateString()}`}
              </p>
              <p>{a.words.join(', ')}</p>
              <div className={styles.toolbar}>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  aria-expanded={open === a._id}
                  onClick={() => setOpen(open === a._id ? null : a._id)}
                >
                  {open === a._id ? 'Hide progress' : 'Show progress'}
                </button>
                {a.status === 'active' && (
                  <>
                    <button type="button" className={styles.buttonSecondary} onClick={() => setEditing(a)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={async () => {
                        await archiveAssignment(a._id)
                        load()
                      }}
                    >
                      Archive
                    </button>
                  </>
                )}
              </div>
              {open === a._id && <AssignmentProgress id={a._id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Assignments
