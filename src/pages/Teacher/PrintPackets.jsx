import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getAssignmentProgress, getProgressSummary } from '../../services/learningService'
import TakeHomePacket from '../../components/TakeHomePacket/TakeHomePacket'
import styles from './Teacher.module.css'

const NEEDS_WORK = ['not-known', 'learning', 'review']
const MAX_WORDS = 12

/**
 * Printable take-home packets: one student (/students/:id/print) or every
 * student on an assignment (/assignments/:id/print).
 */
const PrintPackets = ({ mode = 'student' }) => {
  const { id } = useParams()
  const { user } = useAuth()
  const [packets, setPackets] = useState(null) // [{ name, font, sources: {key: words[]} }]
  const [source, setSource] = useState('auto')
  const [include, setInclude] = useState({ letter: true, cards: true, chart: true })
  const [cardsPerPage, setCardsPerPage] = useState(12)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        if (mode === 'assignment') {
          const data = await getAssignmentProgress(id)
          setNote(data.assignment.note || '')
          setPackets(
            data.students.map((s) => {
              // Words not yet done come first
              const ordered = [...s.words].sort((a, b) => Number(a.done) - Number(b.done))
              return {
                key: s.studentId,
                name: s.name,
                font: 'default',
                sources: { auto: ordered.map((w) => w.word).slice(0, MAX_WORDS) },
                sourceLabels: { auto: data.assignment.title }
              }
            })
          )
        } else {
          const data = await getProgressSummary(id)
          const needs = data.words.filter((w) => NEEDS_WORK.includes(w.status)).map((w) => w.word)
          const assigned = data.assignments.flatMap((a) =>
            a.progress.filter((p) => p.status !== 'mastered').map((p) => p.word)
          )
          const sources = {
            auto: [...new Set([...assigned, ...needs])].slice(0, MAX_WORDS),
            needs: needs.slice(0, MAX_WORDS)
          }
          const sourceLabels = {
            auto: 'Assigned words, then words that need work',
            needs: 'Words that need work'
          }
          data.assignments.forEach((a) => {
            sources[a._id] = a.words.slice(0, MAX_WORDS)
            sourceLabels[a._id] = `Assignment: ${a.title}`
          })
          setPackets([
            {
              key: id,
              name: data.student.name,
              font: data.student.accessibility?.font || 'default',
              sources,
              sourceLabels
            }
          ])
        }
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [id, mode])

  const sourceOptions = useMemo(
    () => (packets?.length === 1 ? Object.entries(packets[0].sourceLabels) : []),
    [packets]
  )

  if (error) return <p role="alert">{error}</p>
  if (!packets) return <p role="status">Preparing packets…</p>

  const back = mode === 'assignment' ? '/assignments' : `/students/${id}`

  return (
    <div className={styles.page}>
      <div className="no-print">
        <p>
          <Link to={back}>← Back</Link>
        </p>
        <h1>Take-home practice packet{packets.length > 1 ? 's' : ''}</h1>
        <p className={styles.muted}>
          Each packet has a short letter for the family, a 5-day practice chart
          and word cards to cut out (up to {MAX_WORDS} words, so practice stays
          short). Cards use each student's reading font.
        </p>

        <div className={styles.toolbar}>
          {sourceOptions.length > 1 && (
            <label className={styles.field}>
              Words
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                {sourceOptions.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={styles.field}>
            Card size
            <select value={cardsPerPage} onChange={(e) => setCardsPerPage(Number(e.target.value))}>
              <option value={12}>Standard (12 per page)</option>
              <option value={8}>Large (8 per page)</option>
            </select>
          </label>
          <label className={styles.field} style={{ flex: '1 1 260px' }}>
            Note to family (optional)
            <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <ul className={styles.checkList}>
          {[
            ['letter', 'Family letter'],
            ['chart', 'Practice chart'],
            ['cards', 'Word cards']
          ].map(([key, label]) => (
            <li key={key}>
              <label>
                <input
                  type="checkbox"
                  checked={include[key]}
                  onChange={(e) => setInclude({ ...include, [key]: e.target.checked })}
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
        <p>
          <button type="button" className={styles.button} onClick={() => window.print()}>
            🖨 Print {packets.length > 1 ? `${packets.length} packets` : 'packet'}
          </button>
        </p>
        <hr />
      </div>

      {packets.map((p) => {
        const words = p.sources[source] || p.sources.auto || []
        return words.length ? (
          <TakeHomePacket
            key={p.key}
            studentName={p.name}
            words={words}
            teacherName={user?.name}
            note={note}
            font={p.font}
            include={include}
            cardsPerPage={cardsPerPage}
          />
        ) : (
          <p key={p.key} className="no-print">
            {p.name}: no words to practise right now.
          </p>
        )
      })}
    </div>
  )
}

export default PrintPackets
