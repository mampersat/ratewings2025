import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_BASE } from '../api'

function formatReviewDate(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { dateStyle: 'short' })
  } catch {
    return '—'
  }
}

export default function LocationDetailPage() {
  const { id } = useParams()
  const [location, setLocation] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviewsError, setReviewsError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setReviewsError(null)
    fetch(`${API_BASE}/locations/by-id/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Location not found' : 'Failed to load location')
        return res.json()
      })
      .then((locData) => {
        if (!cancelled) setLocation(locData)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    fetch(`${API_BASE}/reviews/?location_id=${id}&limit=500`)
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(t?.slice(0, 80) || `Reviews error ${res.status}`)
          })
        }
        return res.json()
      })
      .then((reviewsData) => {
        if (!cancelled) {
          const list = Array.isArray(reviewsData) ? reviewsData : []
          list.sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0
            return tb - ta
          })
          setReviews(list)
        }
      })
      .catch((err) => {
        if (!cancelled) setReviewsError(err?.message || 'Could not load reviews')
      })
    return () => { cancelled = true }
  }, [id])

  if (loading) return <div style={{ maxWidth: 700, margin: 'auto', padding: 20, textAlign: 'left' }}>Loading…</div>
  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: 'auto', padding: 20, textAlign: 'left' }}>
        <p>{error}</p>
        <Link to="/">← Find</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20, textAlign: 'left' }}>
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/">← Find</Link>
      </p>
      <article data-surface="light" style={{ border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem', background: '#fff' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>{location.name}</h2>
        {location.address && (
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Address:</strong> {location.address}
          </p>
        )}
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Rating:</strong>{' '}
          {location.average_rating != null
            ? <>{Number(location.average_rating) % 1 === 0 ? Math.round(Number(location.average_rating)) : Number(location.average_rating).toFixed(1)}<span className="rating-out-of">/10</span></>
            : 'No ratings yet'}
          {location.average_heat != null && (
            <> · <strong>Heat:</strong> {Number(location.average_heat) % 1 === 0 ? Math.round(Number(location.average_heat)) : Number(location.average_heat).toFixed(1)}<span className="rating-out-of">/10</span></>
          )}
          {location.review_count != null && location.review_count > 0 && (
            <> ({location.review_count} review{location.review_count !== 1 ? 's' : ''})</>
          )}
        </p>
        <p style={{ margin: '0.75rem 0 0' }}>
          <Link to={`/new-rating?location_id=${location.id}`} style={{ color: '#646cff' }}>Add rating</Link>
        </p>
      </article>

      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Reviews</h3>
      {reviewsError ? (
        <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 8, marginBottom: 8 }}>
          <p style={{ margin: 0 }}>{reviewsError}</p>
          <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>
            If you see this after adding review location features, run: <code style={{ background: '#fff', padding: '2px 6px' }}>cd backend && python3 add_review_lat_lon.py</code>
          </p>
        </div>
      ) : reviews.length === 0 ? (
        <p style={{ color: '#666' }}>No reviews yet for this location.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem 0.75rem' }}>Review</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Rating</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Heat</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Date</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Comment</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((rev) => (
              <tr key={rev.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <Link to={`/reviews/${rev.id}`}>#{rev.id}</Link>
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>{rev.rating % 1 === 0 ? Math.round(rev.rating) : rev.rating}<span className="rating-out-of">/10</span></td>
                <td style={{ padding: '0.5rem 0.75rem' }}>{rev.heat != null ? <>{rev.heat % 1 === 0 ? Math.round(rev.heat) : rev.heat}<span className="rating-out-of">/10</span></> : '—'}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>{formatReviewDate(rev.created_at)}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>{rev.comment ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
