import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'

export default function ReviewDetailPage() {
  const { id } = useParams()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/reviews/by-id/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Review not found' : 'Failed to load review')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setReview(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

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
      <article style={{ border: '1px solid #eee', borderRadius: 8, padding: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Review #{review.id}</h2>
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Rating:</strong> {review.rating}/10
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
      </article>
    </div>
  )
}
