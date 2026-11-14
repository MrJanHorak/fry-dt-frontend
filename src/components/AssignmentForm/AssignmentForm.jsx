import { useId, useMemo, useState } from 'react'
import { FRY_LISTS, getGroupWords } from '../../data/fryWords'
import { createAssignment, updateAssignment } from '../../services/learningService'
import styles from '../../pages/Teacher/Teacher.module.css'

const ACTIVITY_OPTIONS = [
  { value: 'flashcards', label: 'Read it (flashcards)' },
  { value: 'listen-find', label: 'Listen & find' },
  { value: 'build-word', label: 'Build the word' }
]

const parseWords = (text) =>
  text
    .split(/[\s,;]+/)
    .map((w) => w.trim())
    .filter(Boolean)

/**
 * Create or edit an assignment: pick students, words and activities.
 */
const AssignmentForm = ({
  roster = [],
  initial = {},
  onSaved,
  onCancel
}) => {
  const id = useId()
  const [title, setTitle] = useState(initial.title || '')
  const [note, setNote] = useState(initial.note || '')
  const [studentIds, setStudentIds] = useState(
    new Set((initial.students || []).map((s) => String(s._id || s.studentId || s)))
  )
  const [wordText, setWordText] = useState((initial.words || []).join(', '))
  const [activities, setActivities] = useState(
    new Set(initial.activities || ['flashcards', 'listen-find', 'build-word'])
  )
  const [dueDate, setDueDate] = useState(
    initial.dueDate ? String(initial.dueDate).slice(0, 10) : ''
  )
  const [targetDays, setTargetDays] = useState(initial.targetDays || 3)
  const [pickList, setPickList] = useState(1)
  const [pickGroup, setPickGroup] = useState(1)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const words = useMemo(() => [...new Set(parseWords(wordText))], [wordText])

  const toggle = (set, setter, value) => {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    setter(next)
  }

  const addGroup = () => {
    const merged = [...new Set([...words, ...getGroupWords(pickList, pickGroup)])]
    setWordText(merged.join(', '))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!studentIds.size) return setError('Choose at least one student.')
    if (!words.length) return setError('Add at least one word.')
    if (words.length > 50) return setError('Use 50 words or fewer per assignment.')
    if (!activities.size) return setError('Choose at least one activity.')

    const payload = {
      title: title.trim() || `Words for ${new Date().toLocaleDateString()}`,
      note: note.trim(),
      students: [...studentIds],
      words,
      activities: [...activities],
      targetDays: Number(targetDays),
      dueDate: dueDate || undefined
    }
    setSaving(true)
    try {
      const saved = initial._id
        ? await updateAssignment(initial._id, payload)
        : await createAssignment(payload)
      onSaved?.(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} aria-labelledby={`${id}-h`} className={styles.card}>
      <h2 id={`${id}-h`} style={{ marginTop: 0 }}>
        {initial._id ? 'Edit assignment' : 'New assignment'}
      </h2>

      {error && (
        <p role="alert" className={styles.notice}>
          {error}
        </p>
      )}

      <div className={styles.formGrid}>
        <label className={styles.field}>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Tricky words – Group B" />
        </label>
        <label className={styles.field}>
          Due date (optional)
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label className={styles.field}>
          Counts as done after
          <select value={targetDays} onChange={(e) => setTargetDays(e.target.value)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'day' : 'separate days'} correct
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.field} style={{ marginTop: '1rem' }}>
        Message for the student (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="You can do it!" />
      </label>

      <fieldset className={styles.fieldset} style={{ marginTop: '1rem' }}>
        <legend>Students ({studentIds.size} chosen)</legend>
        {roster.length ? (
          <>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() =>
                setStudentIds(
                  studentIds.size === roster.length
                    ? new Set()
                    : new Set(roster.map((s) => String(s._id)))
                )
              }
            >
              {studentIds.size === roster.length ? 'Clear all' : 'Select all'}
            </button>
            <ul className={styles.checkList}>
              {roster.map((s) => (
                <li key={s._id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={studentIds.has(String(s._id))}
                      onChange={() => toggle(studentIds, setStudentIds, String(s._id))}
                    />
                    {s.name}
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Add students on your Profile page first.</p>
        )}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Words ({words.length})</legend>
        <label className={styles.field}>
          Type or paste words, separated by commas or spaces
          <textarea rows={3} value={wordText} onChange={(e) => setWordText(e.target.value)} />
        </label>
        <div className={styles.toolbar} style={{ marginTop: '0.75rem' }}>
          <label className={styles.field}>
            Add a group from list
            <select value={pickList} onChange={(e) => setPickList(Number(e.target.value))}>
              {FRY_LISTS.map((l) => (
                <option key={l.list} value={l.list}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Group
            <select value={pickGroup} onChange={(e) => setPickGroup(Number(e.target.value))}>
              {[1, 2, 3, 4].map((g) => (
                <option key={g} value={g}>
                  Words {(g - 1) * 25 + 1}–{g * 25}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className={styles.buttonSecondary} onClick={addGroup}>
            Add these 25 words
          </button>
        </div>
        <p className={styles.fieldHint}>
          Tip: research on sight-word learning suggests teaching only a few new
          words at a time. Practice sessions mix in at most a few unknown words.
        </p>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Activities students can use</legend>
        <ul className={styles.checkList}>
          {ACTIVITY_OPTIONS.map((a) => (
            <li key={a.value}>
              <label>
                <input
                  type="checkbox"
                  checked={activities.has(a.value)}
                  onChange={() => toggle(activities, setActivities, a.value)}
                />
                {a.label}
              </label>
            </li>
          ))}
        </ul>
        <p className={styles.fieldHint}>
          A student's accommodations can limit these further (e.g. no
          read-aloud for a non-speaking student).
        </p>
      </fieldset>

      <div className={styles.toolbar}>
        <button type="submit" className={styles.button} disabled={saving}>
          {saving ? 'Saving…' : initial._id ? 'Save changes' : 'Assign words'}
        </button>
        {onCancel && (
          <button type="button" className={styles.buttonSecondary} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default AssignmentForm
