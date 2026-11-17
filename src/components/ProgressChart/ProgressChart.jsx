import { useId } from 'react'

/**
 * Progress-monitoring graph (words mastered per week) with an optional
 * goal "aim line", the standard MTSS/IEP way to judge if an intervention
 * is working. Includes a text summary and a data table for screen readers.
 */
const W = 640
const H = 260
const PAD = { top: 20, right: 20, bottom: 40, left: 48 }

const ProgressChart = ({ points = [], goal = null, title = 'Words mastered over time' }) => {
  const id = useId()
  if (!points.length) return <p>No progress data yet.</p>

  const toTime = (d) => new Date(d).getTime()
  const times = points.map((p) => toTime(p.weekEnding))
  let minT = Math.min(...times)
  let maxT = Math.max(...times)
  const aim =
    goal?.targetWords && goal?.targetDate
      ? {
          x1: toTime(goal.baselineDate || points[0].weekEnding),
          y1: goal.baselineWords ?? points[0].mastered,
          x2: toTime(goal.targetDate),
          y2: goal.targetWords
        }
      : null
  if (aim) {
    minT = Math.min(minT, aim.x1)
    maxT = Math.max(maxT, aim.x2)
  }
  const maxY = Math.max(10, ...points.map((p) => p.mastered), aim?.y2 || 0)
  const niceMax = Math.ceil(maxY / 10) * 10

  const x = (t) => PAD.left + ((t - minT) / Math.max(1, maxT - minT)) * (W - PAD.left - PAD.right)
  const y = (v) => H - PAD.bottom - (v / niceMax) * (H - PAD.top - PAD.bottom)

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(toTime(p.weekEnding))},${y(p.mastered)}`).join(' ')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f))
  const first = points[0]
  const last = points[points.length - 1]
  const fmt = (d) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })

  const summary =
    `From ${fmt(first.weekEnding)} to ${fmt(last.weekEnding)}, words mastered went from ` +
    `${first.mastered} to ${last.mastered}.` +
    (aim ? ` Goal: ${aim.y2} words by ${fmt(goal.targetDate)}.` : '')

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-labelledby={`${id}-t ${id}-d`}
        style={{ maxWidth: W, color: 'var(--text)' }}
      >
        <title id={`${id}-t`}>{title}</title>
        <desc id={`${id}-d`}>{summary}</desc>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity="0.15" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="currentColor">
              {t}
            </text>
          </g>
        ))}
        {[first, last].map((p) => (
          <text key={p.weekEnding} x={x(toTime(p.weekEnding))} y={H - 12} textAnchor="middle" fontSize="12" fill="currentColor">
            {fmt(p.weekEnding)}
          </text>
        ))}
        {aim && (
          <g>
            <line
              x1={x(aim.x1)}
              y1={y(aim.y1)}
              x2={x(aim.x2)}
              y2={y(aim.y2)}
              stroke="var(--status-review)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <text x={x(aim.x2) - 4} y={y(aim.y2) - 8} textAnchor="end" fontSize="12" fill="var(--status-review)">
              Goal {aim.y2}
            </text>
          </g>
        )}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" />
        {points.map((p) => (
          <circle key={p.weekEnding} cx={x(toTime(p.weekEnding))} cy={y(p.mastered)} r="4" fill="var(--accent)" />
        ))}
      </svg>
      <figcaption>{summary}</figcaption>
      <details>
        <summary>Show as a table</summary>
        <table>
          <caption className="visually-hidden">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Week ending</th>
              <th scope="col">Words mastered</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.weekEnding}>
                <td>{fmt(p.weekEnding)}</td>
                <td>{p.mastered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

export default ProgressChart
