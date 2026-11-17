/**
 * Word status shown with a symbol, a word AND a colour, so it never relies
 * on colour alone (WCAG 1.4.1). Symbols are hidden from screen readers;
 * the text label is read instead.
 */
export const STATUS_INFO = {
  mastered: { label: 'Mastered', short: 'Got it', symbol: '★' },
  review: { label: 'Review', short: 'Review', symbol: '↻' },
  learning: { label: 'Learning', short: 'Learning', symbol: '◐' },
  'not-known': { label: 'Not yet known', short: 'Not yet', symbol: '○' },
  'not-yet': { label: 'Not assessed', short: 'New', symbol: '·' }
}

export const STATUS_ORDER = ['mastered', 'review', 'learning', 'not-known', 'not-yet']

const StatusBadge = ({ status = 'not-yet', short = false, className = '' }) => {
  const info = STATUS_INFO[status] || STATUS_INFO['not-yet']
  return (
    <span className={`status-badge status-${status} ${className}`}>
      <span aria-hidden="true">{info.symbol}</span>
      {short ? info.short : info.label}
    </span>
  )
}

export default StatusBadge
