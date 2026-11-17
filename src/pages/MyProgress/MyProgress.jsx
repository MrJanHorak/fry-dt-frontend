import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getProgressSummary } from '../../services/learningService'
import { FRY_LISTS } from '../../data/fryWords'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import styles from '../Teacher/Teacher.module.css'

/**
 * Child-friendly progress page. Celebrates words learned; does not show
 * percentages, rankings or anything that compares the child to others.
 */
const MyProgress = () => {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.profile) return
    getProgressSummary(user.profile)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [user?.profile])

  if (error) return <p role="alert">{error}</p>
  if (!data) return <p role="status">Loading…</p>

  const learning = data.words.filter((w) => ['learning', 'review', 'not-known'].includes(w.status))

  return (
    <div className={styles.page}>
      <h1>My words</h1>
      <p className={styles.big}>
        You know <strong>{data.totals.mastered}</strong>{' '}
        {data.totals.mastered === 1 ? 'word' : 'words'}! ⭐
      </p>

      {data.assignments.length > 0 && (
        <section aria-labelledby="my-assignments">
          <h2 id="my-assignments">From my teacher</h2>
          <ul className={styles.cardList}>
            {data.assignments.map((a) => (
              <li key={a._id} className={styles.card}>
                <h3>{a.title}</h3>
                {a.note && <p>{a.note}</p>}
                <ul className={styles.wordChips} aria-label={`Words in ${a.title}`}>
                  {a.progress.map((p) => (
                    <li key={p.word}>
                      <span className={styles.chipWord}>{p.word}</span>
                      <StatusBadge status={p.status} short />
                    </li>
                  ))}
                </ul>
                <Link className={styles.button} to="/practice">
                  Practise these
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="my-lists">
        <h2 id="my-lists">My word lists</h2>
        <ul className={styles.listGrid}>
          {data.lists
            .filter((l) => l.list <= Math.max(data.workingList + 1, 2))
            .map((l) => {
              const known = l.mastered + l.review
              return (
                <li key={l.list} className={styles.card}>
                  <h3>{FRY_LISTS[l.list - 1].name}</h3>
                  <p>
                    <strong>{known}</strong> of 100 words
                  </p>
                  <meter min="0" max="100" value={known} aria-label={`${known} of 100 words in ${FRY_LISTS[l.list - 1].name}`} className={styles.meter} />
                </li>
              )
            })}
        </ul>
      </section>

      {learning.length > 0 && (
        <section aria-labelledby="my-learning">
          <h2 id="my-learning">Words I'm learning</h2>
          <ul className={styles.wordChips}>
            {learning.slice(0, 30).map((w) => (
              <li key={w.word}>
                <span className={styles.chipWord}>{w.word}</span>
                <StatusBadge status={w.status} short />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p>
        <Link className={styles.button} to="/practice">
          Practise now
        </Link>
      </p>
    </div>
  )
}

export default MyProgress
