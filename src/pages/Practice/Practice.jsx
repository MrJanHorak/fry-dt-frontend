import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { getPracticeSession, recordAttempts } from '../../services/learningService'
import { speak, spell, stopSpeaking } from '../../utils/speech'
import { listenForWord, prepareEngine, sayItEngine } from '../../utils/onDeviceSpeech'
import { loadVoskModel } from '../../utils/voskEngine'
import { ACTIVITIES, letterTiles, pickChoices, playChime } from './practiceUtils'
import styles from './Practice.module.css'

const BATCH_SIZE = 5

/**
 * Self-paced, accessible word practice for students.
 *
 * Design choices (UDL / WCAG):
 *  - One word at a time, very large, in the student's chosen font.
 *  - Three ways to show what they know (read aloud, listen & find, build).
 *  - No visible timers and no "game over": missed words get a model
 *    ("This word is said") and come back once more at the end.
 *  - Everything works with keyboard, switch access and screen readers;
 *    feedback is announced in a live region.
 *  - Help ("Hear it", "Spell it") is always available and never punished.
 */
const Practice = () => {
  const { user } = useAuth()
  const { settings } = useAccessibility()
  const studentId = user?.profile

  const [phase, setPhase] = useState('loading') // loading | start | playing | break | done | error
  const [session, setSession] = useState(null)
  const [assignmentId, setAssignmentId] = useState('')
  const [activity, setActivity] = useState('flashcards')
  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [step, setStep] = useState('show') // show | check | feedback
  const [feedback, setFeedback] = useState(null) // { correct, text }
  const [announcement, setAnnouncement] = useState('')
  const [helpUsed, setHelpUsed] = useState(false)
  const [built, setBuilt] = useState([])
  const [tiles, setTiles] = useState([])
  const [choices, setChoices] = useState([])
  const [stats, setStats] = useState({ correct: 0, total: 0 })
  const [saveError, setSaveError] = useState('')
  const [speechStatus, setSpeechStatus] = useState('unknown')
  const [speechEngine, setSpeechEngine] = useState(null) // 'browser' | 'vosk'
  const [speechNote, setSpeechNote] = useState('')

  const shownAt = useRef(0)
  const readingMs = useRef(null) // flashcards: time until "Check"
  const startedAt = useRef(0)
  const pending = useRef([])
  const requeued = useRef(new Set())
  const mainButton = useRef(null)

  const acc = session?.accommodations || {}
  const voice = useMemo(() => session?.voice || {}, [session?.voice])
  const current = queue[index]
  const activityInfo = ACTIVITIES[activity]

  const say = useCallback((text) => speak(text, voice), [voice])

  // ---------- loading ----------
  const load = useCallback(
    async (asgId = '') => {
      setPhase('loading')
      try {
        const data = await getPracticeSession(studentId, asgId)
        setSession(data)
        setPhase('start')
      } catch (err) {
        setSaveError(err.message)
        setPhase('error')
      }
    },
    [studentId]
  )

  useEffect(() => {
    if (studentId) load()
  }, [studentId, load])

  // Which activities this student may use
  const allowedActivities = useMemo(() => {
    const modes = acc.responseModes || ['self-check', 'choice', 'build']
    const fromAssignment = session?.assignment?.activities
    return Object.entries(ACTIVITIES)
      .filter(([, info]) => modes.includes(info.mode))
      // "Say it" only when the browser can recognise speech ON THIS DEVICE
      .filter(([key]) => key !== 'say-it' || speechStatus === 'available')
      .filter(
        ([key]) =>
          !fromAssignment ||
          fromAssignment.includes(key) ||
          (['flashcards', 'say-it'].includes(key) &&
            (fromAssignment.includes('flashcards') || fromAssignment.includes('read-aloud')))
      )
      .map(([key]) => key)
  }, [acc.responseModes, session?.assignment, speechStatus])

  const speechAllowed = (acc.responseModes || []).includes('speech')
  useEffect(() => {
    if (!speechAllowed) return
    sayItEngine().then(({ engine, status }) => {
      setSpeechEngine(engine)
      setSpeechStatus(status)
    })
  }, [speechAllowed])

  const setUpSpeech = async () => {
    setSpeechNote(
      speechEngine === 'vosk'
        ? 'Getting “Say it” ready (about 40 MB from your school’s server, one time only)…'
        : 'Downloading the speech pack. This happens once…'
    )
    const ok = await prepareEngine(speechEngine)
    const { engine, status } = await sayItEngine()
    setSpeechEngine(engine)
    setSpeechStatus(ok && engine === speechEngine ? 'available' : status)
    setSpeechNote(
      ok ? '“Say it” is ready on this device.' : 'Sorry, “Say it” cannot be set up on this device.'
    )
  }

  useEffect(() => {
    if (allowedActivities.length && !allowedActivities.includes(activity)) {
      setActivity(allowedActivities[0])
    }
  }, [allowedActivities, activity])

  // ---------- saving ----------
  const flush = useCallback(async () => {
    if (!pending.current.length || !studentId) return
    const batch = pending.current
    pending.current = []
    try {
      await recordAttempts(studentId, batch)
      setSaveError('')
    } catch (err) {
      pending.current = [...batch, ...pending.current]
      setSaveError('We could not save just now. We will try again.')
    }
  }, [studentId])

  useEffect(() => () => {
    flush()
    stopSpeaking()
  }, [flush])

  // ---------- word setup ----------
  const prepareWord = useCallback(
    (word) => {
      setStep('show')
      setFeedback(null)
      setHelpUsed(false)
      setBuilt([])
      readingMs.current = null
      shownAt.current = performance.now()
      if (!word) return

      if (activity === 'listen-find') {
        setChoices(pickChoices(word, queue, acc.choiceCount || 3))
        setTimeout(() => say(word), 250)
      } else if (activity === 'build-word') {
        setTiles(letterTiles(word))
        setTimeout(() => say(word), 250)
      } else if (acc.autoReadWords) {
        setHelpUsed(true)
        setTimeout(() => say(word), 250)
      }
      setTimeout(() => mainButton.current?.focus(), 50)
    },
    [activity, queue, acc.choiceCount, acc.autoReadWords, say]
  )

  useEffect(() => {
    if (phase === 'playing') prepareWord(queue[index])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index])

  // ---------- starting ----------
  const start = () => {
    const words = (session?.words || []).map((w) => w.word)
    if (!words.length) return
    setQueue(words)
    setIndex(0)
    setStats({ correct: 0, total: 0 })
    requeued.current = new Set()
    startedAt.current = Date.now()
    if (activity === 'say-it' && speechEngine === 'vosk') {
      loadVoskModel().catch(() => {}) // warm up in the background
    }
    setPhase('playing')
    if (settings.readAloudInstructions) say(activityInfo.instruction)
  }

  // ---------- answering ----------
  const record = (correct, extra = {}) => {
    const elapsed =
      readingMs.current ?? Math.round(performance.now() - shownAt.current)
    readingMs.current = null
    pending.current.push({
      word: current,
      correct,
      responseMs: acc.untimed ? undefined : elapsed,
      skill: activityInfo.skill,
      context: 'practice',
      scoredBy: ['flashcards', 'say-it'].includes(activity) ? 'self' : 'choice',
      helpUsed,
      assignmentId: session?.assignment?._id,
      ...extra
    })
    if (pending.current.length >= BATCH_SIZE) flush()
  }

  const showFeedback = (correct) => {
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    if (correct) {
      const text = ['You got it!', 'Great reading!', 'Yes! Nice work!', 'Super!'][
        Math.floor(Math.random() * 4)
      ]
      setFeedback({ correct: true, text })
      setAnnouncement(`${text} The word was ${current}.`)
      if (settings.soundEffects) playChime()
    } else {
      const text = `This word is “${current}”. Let's try it again later.`
      setFeedback({ correct: false, text })
      setAnnouncement(text)
      say(`This word is ${current}`)
      // Error correction: bring a missed word back once at the end
      if (!requeued.current.has(current)) {
        requeued.current.add(current)
        setQueue((q) => [...q, current])
      }
    }
    setStep('feedback')
    setTimeout(() => mainButton.current?.focus(), 50)
  }

  // Flashcards: read, then press Check to hear the model and self-assess
  const handleCheck = () => {
    readingMs.current = Math.round(performance.now() - shownAt.current)
    setStep('check')
    say(current)
    setTimeout(() => mainButton.current?.focus(), 50)
  }
  // Uses the time to "Check" (reading time), not the time to self-assess
  const handleSelfAssess = (correct) => {
    record(correct)
    showFeedback(correct)
  }

  // "Say it": the computer can only CONFIRM a correct read. If it does not
  // hear the word (children's speech is hard for recognisers), the child
  // simply checks themselves, so the machine never marks a child wrong.
  const handleSayIt = async () => {
    stopSpeaking()
    setStep('preparing')
    setAnnouncement('Getting ready')
    const result = await listenForWord(current, {
      engine: speechEngine,
      // Other words the child might say instead help the recognizer decide
      competitors: [...queue, ...pickChoices(current, queue, 4)],
      onStart: () => {
        setStep('listening')
        setAnnouncement('Listening. Read the word now.')
      }
    })
    readingMs.current = Math.round(performance.now() - shownAt.current)
    if (result.matched) {
      record(true, { scoredBy: 'speech' })
      showFeedback(true)
      return
    }
    if (['unavailable', 'not-allowed', 'service-not-allowed', 'audio-capture'].includes(result.reason)) {
      setSpeechNote('The microphone is not available. You can check yourself instead.')
    }
    setStep('check')
    setAnnouncement("I didn't catch that. Listen, then tell me if you read it right.")
    say(current)
    setTimeout(() => mainButton.current?.focus(), 50)
  }

  const handleChoice = (choice) => {
    const correct = choice.toLowerCase() === current.toLowerCase()
    record(correct, correct ? {} : { errorResponse: choice })
    showFeedback(correct)
  }

  const handleTile = (tile) => {
    const next = [...built, tile]
    setBuilt(next)
    const attempt = next.map((t) => t.letter).join('')
    if (attempt.length === current.length) {
      const correct = attempt.toLowerCase() === current.toLowerCase()
      record(correct, correct ? {} : { errorResponse: attempt })
      showFeedback(correct)
    }
  }
  const undoTile = () => setBuilt((b) => b.slice(0, -1))

  const next = () => {
    stopSpeaking()
    const breakMs = (acc.breakReminderMinutes || 0) * 60 * 1000
    if (index + 1 >= queue.length) {
      flush()
      setPhase('done')
      if (settings.readAloudInstructions) say('All done! Great job practising.')
      return
    }
    if (breakMs && Date.now() - startedAt.current > breakMs) {
      startedAt.current = Date.now()
      setPhase('break')
      return
    }
    setIndex((i) => i + 1)
  }

  const helpHear = () => {
    setHelpUsed(true)
    say(current)
  }
  const helpSpell = () => {
    setHelpUsed(true)
    spell(current, voice)
  }

  // Keyboard shortcuts during play (in addition to normal Tab/Enter/Space)
  useEffect(() => {
    if (phase !== 'playing') return undefined
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault()
        if (['flashcards', 'say-it'].includes(activity) && step === 'show') helpHear()
        else say(current)
      }
      if (activity === 'listen-find' && step === 'show' && /^[1-4]$/.test(e.key)) {
        const choice = choices[Number(e.key) - 1]
        if (choice) handleChoice(choice)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ---------- render ----------
  if (!studentId) {
    return <p>Please sign in to practise.</p>
  }

  if (phase === 'loading') {
    return (
      <div className={styles.page} aria-busy="true">
        <p role="status">Getting your words ready…</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className={styles.page}>
        <p role="alert">Sorry, we could not load your words. {saveError}</p>
        <button type="button" className={styles.bigButton} onClick={() => load(assignmentId)}>
          Try again
        </button>
      </div>
    )
  }

  if (phase === 'start') {
    const assignments = session?.assignments || []
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Word practice</h1>

        {assignments.length > 0 && (
          <fieldset className={styles.fieldset}>
            <legend>What do you want to practise?</legend>
            <div className={styles.optionGrid}>
              <label className={styles.option}>
                <input
                  type="radio"
                  name="assignment"
                  checked={assignmentId === ''}
                  onChange={() => {
                    setAssignmentId('')
                    load('')
                  }}
                />
                <span>
                  <strong>My words for today</strong>
                  <span className={styles.optionHint}>A mix picked just for you</span>
                </span>
              </label>
              {assignments.map((a) => (
                <label key={a._id} className={styles.option}>
                  <input
                    type="radio"
                    name="assignment"
                    checked={assignmentId === a._id}
                    onChange={() => {
                      setAssignmentId(a._id)
                      load(a._id)
                    }}
                  />
                  <span>
                    <strong>{a.title}</strong>
                    <span className={styles.optionHint}>
                      From your teacher · {a.masteredCount} of {a.wordCount} words learned
                    </span>
                    {a.note && <span className={styles.optionHint}>“{a.note}”</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {allowedActivities.length > 1 && (
          <fieldset className={styles.fieldset}>
            <legend>How do you want to practise?</legend>
            <div className={styles.optionGrid}>
              {allowedActivities.map((key) => (
                <label key={key} className={styles.option}>
                  <input
                    type="radio"
                    name="activity"
                    checked={activity === key}
                    onChange={() => setActivity(key)}
                  />
                  <span>
                    <span aria-hidden="true" className={styles.optionIcon}>
                      {ACTIVITIES[key].icon}
                    </span>
                    <strong>{ACTIVITIES[key].title}</strong>
                    <span className={styles.optionHint}>{ACTIVITIES[key].description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {speechAllowed && ['downloadable', 'downloading'].includes(speechStatus) && (
          <p>
            <button type="button" className={styles.secondaryButton} onClick={setUpSpeech}>
              🎤 Set up “Say it” on this device
            </button>
            <br />
            <span className={styles.optionHint}>
              One-time download. Speech is recognised on this device. Your voice is never recorded or sent anywhere.
            </span>
          </p>
        )}
        {speechNote && (
          <p role="status" className={styles.optionHint}>
            {speechNote}
          </p>
        )}

        <p className={styles.count}>
          {session?.words?.length
            ? `${session.words.length} words ready`
            : 'No words to practise right now. Great job!'}
        </p>
        <div className={styles.row}>
          <button
            type="button"
            className={styles.bigButton}
            onClick={start}
            disabled={!session?.words?.length}
          >
            Start
          </button>
          <Link to="/settings/reading" className={styles.secondaryLink}>
            Change how words look
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'break') {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Time for a stretch? 🙆</h1>
        <p className={styles.count}>You have been working hard. Stand up, stretch, take a breath.</p>
        <div className={styles.row}>
          <button
            type="button"
            className={styles.bigButton}
            autoFocus
            onClick={() => {
              setIndex((i) => i + 1)
              setPhase('playing')
            }}
          >
            Keep going
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              flush()
              setPhase('done')
            }}
          >
            I'm done for now
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>All done! 🎉</h1>
        <p className={styles.stars} aria-label={`${stats.correct} stars`}>
          {'⭐'.repeat(Math.min(stats.correct, 20))}
        </p>
        <p className={styles.count}>
          You practised {stats.total} {stats.total === 1 ? 'word' : 'words'} and got{' '}
          {stats.correct} right.
        </p>
        {saveError && <p role="alert">{saveError}</p>}
        <div className={styles.row}>
          <button type="button" className={styles.bigButton} autoFocus onClick={() => load(assignmentId)}>
            Practise again
          </button>
          <Link to="/my-progress" className={styles.secondaryLink}>
            See my progress
          </Link>
        </div>
      </div>
    )
  }

  // ---------- playing ----------
  const progressLabel = `Word ${Math.min(index + 1, queue.length)} of ${queue.length}`

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <span className={styles.progressText}>{progressLabel}</span>
        <progress
          className={styles.progress}
          max={queue.length}
          value={index}
          aria-label={progressLabel}
        />
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            flush()
            setPhase('done')
          }}
        >
          Stop
        </button>
      </div>

      <p className={styles.instruction} id="instruction">
        {activityInfo.instruction}
      </p>

      {/* The word card */}
      <section className={styles.card} aria-labelledby="instruction" aria-describedby="feedback">
        {(activity === 'flashcards' || activity === 'say-it') && (
          <p className={styles.word} lang="en">
            {current}
          </p>
        )}

        {activity === 'listen-find' && (
          <>
            <button type="button" className={styles.listenButton} onClick={() => say(current)}>
              🔊 <span>Hear the word again</span>
            </button>
            <div className={styles.choices} role="group" aria-label="Choose the word you heard">
              {choices.map((choice, i) => {
                const isAnswer = step === 'feedback' && choice.toLowerCase() === current.toLowerCase()
                return (
                  <button
                    key={choice}
                    type="button"
                    ref={i === 0 ? mainButton : undefined}
                    className={`${styles.choice} ${isAnswer ? styles.choiceAnswer : ''}`}
                    disabled={step === 'feedback'}
                    onClick={() => handleChoice(choice)}
                    aria-keyshortcuts={String(i + 1)}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {activity === 'build-word' && (
          <>
            <button type="button" className={styles.listenButton} onClick={() => say(current)}>
              🔊 <span>Hear the word again</span>
            </button>
            <p className={styles.buildSlots} aria-hidden="true">
              {current.split('').map((_, i) => (
                <span key={i} className={styles.slot}>
                  {built[i]?.letter || ''}
                </span>
              ))}
            </p>
            <p className="visually-hidden" aria-live="polite">
              {built.length
                ? `You built: ${built.map((t) => t.letter).join(' ')}`
                : `The word has ${current.length} letters.`}
            </p>
            <div className={styles.tiles} role="group" aria-label="Letter tiles">
              {tiles.map((tile, i) => {
                const used = built.some((b) => b.id === tile.id)
                return (
                  <button
                    key={tile.id}
                    type="button"
                    ref={i === 0 ? mainButton : undefined}
                    className={styles.tile}
                    disabled={used || step === 'feedback'}
                    onClick={() => handleTile(tile)}
                    aria-label={`Letter ${tile.letter}`}
                  >
                    {tile.letter}
                  </button>
                )
              })}
            </div>
            {built.length > 0 && step !== 'feedback' && (
              <button type="button" className={styles.secondaryButton} onClick={undoTile}>
                ⌫ Undo
              </button>
            )}
          </>
        )}
      </section>

      <p id="feedback" className={`${styles.feedback} ${feedback ? (feedback.correct ? styles.good : styles.tryAgain) : ''}`}>
        {feedback?.text}
      </p>
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* Actions */}
      <div className={styles.actions}>
        {activity === 'flashcards' && step === 'show' && (
          <>
            <button ref={mainButton} type="button" className={styles.bigButton} onClick={handleCheck}>
              ✓ Check
            </button>
            <button type="button" className={styles.helpButton} onClick={helpHear} aria-keyshortcuts="h">
              🔊 Hear it
            </button>
            <button type="button" className={styles.helpButton} onClick={helpSpell}>
              🔤 Spell it
            </button>
          </>
        )}

        {activity === 'say-it' && step === 'show' && (
          <>
            <button ref={mainButton} type="button" className={styles.bigButton} onClick={handleSayIt}>
              🎤 Say it
            </button>
            <button type="button" className={styles.helpButton} onClick={helpHear} aria-keyshortcuts="h">
              🔊 Hear it
            </button>
            <button type="button" className={styles.helpButton} onClick={helpSpell}>
              🔤 Spell it
            </button>
          </>
        )}

        {activity === 'say-it' && step === 'preparing' && (
          <p className={styles.listening} role="status">
            Getting ready…
          </p>
        )}

        {activity === 'say-it' && step === 'listening' && (
          <p className={styles.listening} role="status">
            <span aria-hidden="true">🎤</span> Listening… read the word now
          </p>
        )}

        {['flashcards', 'say-it'].includes(activity) && step === 'check' && (
          <div role="group" aria-labelledby="self-check-q" className={styles.selfCheck}>
            <p id="self-check-q" className={styles.question}>
              Did you read it right?
            </p>
            <button ref={mainButton} type="button" className={styles.yesButton} onClick={() => handleSelfAssess(true)}>
              👍 Yes
            </button>
            <button type="button" className={styles.noButton} onClick={() => handleSelfAssess(false)}>
              🤔 Not yet
            </button>
            <button type="button" className={styles.helpButton} onClick={() => say(current)}>
              🔊 Hear again
            </button>
          </div>
        )}

        {['listen-find', 'build-word'].includes(activity) && step === 'show' && (
          <button type="button" className={styles.helpButton} onClick={helpSpell}>
            🔤 Spell it for me
          </button>
        )}

        {step === 'feedback' && (
          <button ref={mainButton} type="button" className={styles.bigButton} onClick={next}>
            {index + 1 >= queue.length ? 'Finish' : 'Next word →'}
          </button>
        )}
      </div>

      {saveError && (
        <p className={styles.saveNote} role="status">
          {saveError}
        </p>
      )}
    </div>
  )
}

export default Practice
