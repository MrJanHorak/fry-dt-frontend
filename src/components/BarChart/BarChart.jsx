import { useId } from 'react'

/**
 * Simple accessible bar chart: SVG with a text summary, plus the same data
 * as a table for screen readers and anyone who prefers numbers.
 *
 * @param {{label: string, value: number}[]} data
 */
const W = 640
const H = 200
const PAD = { top: 16, right: 12, bottom: 34, left: 36 }

const BarChart = ({ data = [], title, valueLabel = 'Value', summary }) => {
  const id = useId()
  if (!data.length) return null
  const max = Math.max(1, ...data.map((d) => d.value))
  const niceMax = max <= 5 ? 5 : Math.ceil(max / 5) * 5
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const barW = innerW / data.length
  const y = (v) => PAD.top + innerH - (v / niceMax) * innerH

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
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(niceMax * f)}
              y2={y(niceMax * f)}
              stroke="currentColor"
              strokeOpacity="0.15"
            />
            <text x={PAD.left - 6} y={y(niceMax * f) + 4} textAnchor="end" fontSize="12" fill="currentColor">
              {Math.round(niceMax * f)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={d.label}>
            <rect
              x={PAD.left + i * barW + barW * 0.15}
              y={y(d.value)}
              width={barW * 0.7}
              height={Math.max(0, PAD.top + innerH - y(d.value))}
              rx="3"
              fill="var(--accent)"
            />
            {(i % 2 === 0 || data.length <= 8) && (
              <text
                x={PAD.left + i * barW + barW / 2}
                y={H - 12}
                textAnchor="middle"
                fontSize="11"
                fill="currentColor"
              >
                {d.short || d.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      {summary && <figcaption>{summary}</figcaption>}
      <details>
        <summary>Show as a table</summary>
        <table>
          <caption className="visually-hidden">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td>{d.label}</td>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

export default BarChart
