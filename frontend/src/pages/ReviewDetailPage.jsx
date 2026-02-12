import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'

const RATING_OPTIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10] // 1–10, skip 3

export default function ReviewDetailPage() {
  const { id } = useParams()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [locations, setLocations] = useState([])
  const [editLocationId, setEditLocationId] = useState('')
  const [editRating, setEditRating] = useState('')
  const [editComment, setEditComment] = useState('')
  const [editHeat, setEditHeat] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchReview = () => {
    return fetch(`${API_BASE}/reviews/by-id/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Review not found' : 'Failed to load review')
        return res.json()
      })
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchReview()
      .then((data) => {
        if (!cancelled) {
          setReview(data)
          setEditLocationId(String(data.location_id))
          setEditRating(String(data.rating))
          setEditComment(data.comment ?? '')
          setEditHeat(data.heat != null ? String(data.heat) : '')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!editing) return
    fetch(`${API_BASE}/locations/?limit=500`)
      .then((res) => res.json())
      .then(setLocations)
  }, [editing])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const body = {}
    if (Number(editLocationId) !== review.location_id) body.location_id = Number(editLocationId)
    if (Number(editRating) !== review.rating) body.rating = Number(editRating)
    if ((editComment || '') !== (review.comment || '')) body.comment = editComment || null
    const newHeat = editHeat === '' ? null : Number(editHeat)
    if (newHeat !== review.heat) body.heat = newHeat
    if (Object.keys(body).length === 0) {
      setEditing(false)
      setSaving(false)
      return
    }
    try {
      const res = await fetch(`${API_BASE}/reviews/by-id/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to save')
      const updated = await fetchReview()
      setReview(updated)
      setEditing(false)
    } catch (err) {
      alert(err.message || 'Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditLocationId(String(review.location_id))
    setEditRating(String(review.rating))
    setEditComment(review.comment ?? '')
    setEditHeat(review.heat != null ? String(review.heat) : '')
    setEditing(false)
  }

  if (loading) return <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: 'left' }}>Loading…</div>
  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: 'left' }}>
        <p>{error}</p>
        <Link to="/reviews">Back to reviews</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: 'left' }}>
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/reviews" style={{ color: '#646cff' }}>← Back to reviews</Link>
      </p>
      <article data-surface="light" style={{ border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', background: '#fff' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Review #{review.id}</h2>

        {!editing ? (
          <>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Rating:</strong> {review.rating % 1 === 0 ? Math.round(review.rating) : review.rating}<span className="rating-out-of">/10</span>
              {review.heat != null && (
                <> · <strong>Heat:</strong> {review.heat % 1 === 0 ? Math.round(review.heat) : review.heat}<span className="rating-out-of">/10</span></>
              )}
            </p>
            {(review.location_name || review.location_id) && (
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Location:</strong>{' '}
                {review.location_name ?? `ID ${review.location_id}`}
                {review.location_address && ` — ${review.location_address}`}
              </p>
            )}
            {review.comment && (
              <p style={{ margin: '0.5rem 0', whiteSpace: 'pre-wrap' }}>{review.comment}</p>
            )}
            <p style={{ marginTop: '1rem' }}>
              <button type="button" onClick={() => setEditing(true)}>Edit review</button>
            </p>
          </>
        ) : (
          <form onSubmit={handleSave} style={{ marginTop: '0.5rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="edit-location" style={{ display: 'block', marginBottom: 4 }}>Location</label>
              <select
                id="edit-location"
                value={editLocationId}
                required
                onChange={(e) => setEditLocationId(e.target.value)}
                style={{ width: '100%', padding: 6 }}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}{loc.address ? ` — ${loc.address}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="edit-rating" style={{ display: 'block', marginBottom: 4 }}>Rating</label>
              <select
                id="edit-rating"
                value={editRating}
                required
                onChange={(e) => setEditRating(e.target.value)}
                style={{ width: '100%', padding: 6 }}
              >
                <option value="">Select…</option>
                {RATING_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="edit-heat" style={{ display: 'block', marginBottom: 4 }}>Heat (optional)</label>
              <select
                id="edit-heat"
                value={editHeat}
                onChange={(e) => setEditHeat(e.target.value)}
                style={{ width: '100%', padding: 6 }}
              >
                <option value="">—</option>
                {RATING_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="edit-comment" style={{ display: 'block', marginBottom: 4 }}>Comment</label>
              <textarea
                id="edit-comment"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: 6 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={handleCancel} disabled={saving}>Cancel</button>
            </div>
          </form>
        )}
      </article>
    </div>
  )
}
