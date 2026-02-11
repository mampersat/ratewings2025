import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'

export default function NewRatingPage() {
  const [locations, setLocations] = useState([])
  const [useExisting, setUseExisting] = useState(true)
  const [locationId, setLocationId] = useState('')
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const [heat, setHeat] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null) // { locationId, reviewId } or error message

  useEffect(() => {
    fetch(`${API_BASE}/locations/?limit=500`)
      .then((res) => res.json())
      .then(setLocations)
      .catch(() => setLocations([]))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess(null)
    try {
      let locId = null
      if (useExisting) {
        locId = Number(locationId)
        if (!locId) {
          alert('Please select a location')
          setSubmitting(false)
          return
        }
      } else {
        if (!newName.trim()) {
          alert('Please enter a location name')
          setSubmitting(false)
          return
        }
        const locRes = await fetch(`${API_BASE}/locations/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim(), address: newAddress.trim() || undefined }),
        })
        if (!locRes.ok) {
          const err = await locRes.json().catch(() => ({}))
          throw new Error(err.detail || 'Failed to add location')
        }
        const locData = await locRes.json()
        locId = locData.id
      }

      const reviewRes = await fetch(`${API_BASE}/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locId,
          rating: Number(rating),
          comment: comment.trim() || undefined,
          heat: heat === '' ? undefined : Number(heat),
        }),
      })
      if (!reviewRes.ok) {
        const err = await reviewRes.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to add review')
      }
      const reviewData = await reviewRes.json()
      setSuccess({ locationId: locId, reviewId: reviewData.id })
      setLocationId('')
      setNewName('')
      setNewAddress('')
      setRating('')
      setComment('')
      setHeat('')
    } catch (err) {
      setSuccess({ error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: 'auto', padding: 20, textAlign: 'left' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>New Rating</h2>
      <p style={{ color: '#666', marginBottom: '1.25rem' }}>
        Rate a wing location. Choose an existing location or add a new one, then add your rating.
      </p>

      {success && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            background: success.error ? '#fee' : '#e8f5e9',
            color: success.error ? '#c00' : '#1a1a1a',
          }}
        >
          {success.error ? (
            success.error
          ) : (
            <>
              Rating added.{' '}
              <Link to={`/reviews/${success.reviewId}`}>View review</Link>
              {' · '}
              <Link to={`/locations/${success.locationId}`}>View location</Link>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="radio"
              checked={useExisting}
              onChange={() => setUseExisting(true)}
            />
            {' '}Use existing location
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="radio"
              checked={!useExisting}
              onChange={() => setUseExisting(false)}
            />
            {' '}Add new location
          </label>
        </div>

        {useExisting ? (
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="location-select" style={{ display: 'block', marginBottom: 4 }}>Location</label>
            <select
              id="location-select"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required={useExisting}
              style={{ width: '100%', padding: 8 }}
            >
              <option value="">Select location…</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}{loc.address ? ` — ${loc.address}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="new-name" style={{ display: 'block', marginBottom: 4 }}>Location name</label>
            <input
              id="new-name"
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />
            <label htmlFor="new-address" style={{ display: 'block', marginBottom: 4 }}>Address (optional)</label>
            <input
              id="new-address"
              type="text"
              placeholder="Address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="rating" style={{ display: 'block', marginBottom: 4 }}>Rating (0–10)</label>
          <input
            id="rating"
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={rating}
            required
            onChange={(e) => setRating(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="heat" style={{ display: 'block', marginBottom: 4 }}>Heat (0–10, optional)</label>
          <input
            id="heat"
            type="number"
            min={0}
            max={10}
            step={1}
            value={heat}
            onChange={(e) => setHeat(e.target.value)}
            placeholder=""
            style={{ width: '100%', padding: 8, marginBottom: '1rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="comment" style={{ display: 'block', marginBottom: 4 }}>Comment (optional)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit rating'}
        </button>
      </form>
    </div>
  )
}
