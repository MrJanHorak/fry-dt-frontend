import React, { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

import { issueLoginCard } from '../../services/authService'

/**
 * Printable QR login cards, one per student.
 *
 * Each card holds a personal, random login code created by the server.
 * Printing new cards cancels the previous cards for those students, so a
 * lost card can simply be re-printed.
 */
const CreateQr = ({ students = [] }) => {
  const [cards, setCards] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const generate = async () => {
      setLoading(true)
      setError('')
      try {
        const results = await Promise.all(
          students.map((student) => issueLoginCard(student._id))
        )
        if (!cancelled) setCards(results)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (students.length) generate()
    else setLoading(false)

    return () => {
      cancelled = true
    }
  }, [students])

  if (loading) return <p role="status">Creating login cards…</p>
  if (error) return <p role="alert">{error}</p>
  if (!cards.length) return <p>Add students first, then print their cards.</p>

  return (
    <div className="qr-card-page">
      <style>{`
        .qr-card-page { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px;
          font-family: system-ui, sans-serif; }
        .qr-card { width: 240px; border: 2px solid #222; border-radius: 12px;
          text-align: center; break-inside: avoid; page-break-inside: avoid; }
        .qr-card h2 { margin: 0; padding: 12px; font-size: 1.4rem; }
        .qr-card .qr { padding: 16px; background: #fff; }
        .qr-card .hint { font-size: 0.85rem; padding: 0 12px 12px; }
        .print-bar { width: 100%; }
        @media print { .print-bar { display: none; } }
      `}</style>
      <div className="print-bar">
        <button type="button" onClick={() => window.print()}>
          Print cards
        </button>
        <p>
          Older cards for these students no longer work. Keep cards somewhere
          safe, like a reading folder.
        </p>
      </div>
      {cards.map((card) => (
        <div key={card.profileId} className="qr-card">
          <h2>{card.name}</h2>
          <div className="qr">
            <QRCode
              value={card.qrValue}
              size={180}
              title={`Login card for ${card.name}`}
            />
          </div>
          <p className="hint">Hold up to the camera on the Sign In page</p>
        </div>
      ))}
    </div>
  )
}

export default CreateQr
