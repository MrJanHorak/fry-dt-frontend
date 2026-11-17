import styles from './TakeHomePacket.module.css'

const FONT_FAMILIES = {
  default: "'Lexend', system-ui, sans-serif",
  lexend: "'Lexend', system-ui, sans-serif",
  atkinson: "'Atkinson Hyperlegible', system-ui, sans-serif",
  opendyslexic: "'OpenDyslexic', system-ui, sans-serif"
}

/**
 * One student's printable packet: a short family letter, cut-out word
 * cards and a 5-day practice chart. Uses the student's own reading font
 * so home practice looks the same as school practice.
 */
const TakeHomePacket = ({
  studentName,
  words = [],
  teacherName = '',
  note = '',
  font = 'default',
  include = { letter: true, cards: true, chart: true },
  cardsPerPage = 12
}) => {
  const fontFamily = FONT_FAMILIES[font] || FONT_FAMILIES.default
  const firstName = String(studentName || '').split(/[\s-]/)[0] || 'Your child'

  return (
    <article className={styles.packet} style={{ '--packet-font': fontFamily }} aria-label={`Take-home packet for ${studentName}`}>
      {include.letter && (
        <section className={styles.letter}>
          <h2>Dear family,</h2>
          <p>
            {firstName} is learning to read these <strong>sight words</strong>: common
            words we want readers to know instantly, without sounding them out.
            A few minutes of practice at home makes a big difference.
          </p>
          <h3>5 minutes a day</h3>
          <ol>
            <li>Show one card at a time. Let {firstName} read it.</li>
            <li>
              <strong>Read it quickly?</strong> Great! Put it in a “Got it” pile.
            </li>
            <li>
              <strong>Stuck for more than about 3 seconds?</strong> Say the word,
              have {firstName} say it back while looking at it, and put it back in
              the pile to try again.
            </li>
            <li>Stop while it is still fun. Praise effort, not just right answers.</li>
            <li>Tick the chart each day a word is read quickly. 3 ticks on different days means it is learned!</li>
          </ol>
          {note && (
            <p className={styles.note}>
              <strong>Note from {teacherName || 'the teacher'}:</strong> {note}
            </p>
          )}
          <p className={styles.small}>
            Tip: a word game helps too: hide cards around the room, or ask “Can you
            find the word <em>{words[0] || 'the'}</em> in this book?”
          </p>
          <p>Thank you!{teacherName ? ` – ${teacherName}` : ''}</p>
        </section>
      )}

      {include.chart && words.length > 0 && (
        <section className={styles.chartSection}>
          <h2>
            {firstName}'s practice chart
          </h2>
          <table className={styles.chart}>
            <thead>
              <tr>
                <th scope="col">Word</th>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
                  <th scope="col" key={d}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w}>
                  <th scope="row" className={styles.chartWord}>
                    {w}
                  </th>
                  {[0, 1, 2, 3, 4].map((d) => (
                    <td key={d} aria-label="empty box" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {include.cards && words.length > 0 && (
        <section className={`${styles.cards} ${cardsPerPage === 8 ? styles.cardsLarge : ''}`} aria-label="Word cards to cut out">
          {words.map((w) => (
            <div key={w} className={styles.card}>
              <span className={styles.cardWord}>{w}</span>
              <span className={styles.cardName}>{firstName}</span>
            </div>
          ))}
        </section>
      )}
    </article>
  )
}

export default TakeHomePacket
