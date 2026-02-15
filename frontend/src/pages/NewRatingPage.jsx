import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../api'

const RATING_OPTIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10] // 1–10, skip 3

// whereMode: 'skip' | 'my_location' | 'pick'
export default function NewRatingPage() {
  const [searchParams] = useSearchParams()
  const locationIdFromUrl = searchParams.get('location_id')
  const [locations, setLocations] = useState([])
  const [whereMode, setWhereMode] = useState('skip') // skip | my_location | pick
  const [lat, setLat] = useState(null)
  const [lon, setLon] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [locationId, setLocationId] = useState('')
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const [heat, setHeat] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null) // { locationId, reviewId } or { error }

  useEffect(() => {
    fetch(`${API_BASE}/locations/?limit=500`)
      .then((res) => res.json())
      .then(setLocations)
      .catch(() => setLocations([]))
  }, [])

  useEffect(() => {
    if (locationIdFromUrl) {
      setLocationId(locationIdFromUrl)
      setWhereMode('pick')
    }
  }, [locationIdFromUrl])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }
    setLocationError(null)
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLon(position.coords.longitude)
        setWhereMode('my_location')
        setLocationLoading(false)
      },
      (err) => {
        setLocationLoading(false)
        setLocationError(err.code === 1 ? 'Permission denied' : err.message || 'Could not get location')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  // Optional: try to get coords in background on load so "Use my location" is one tap
  useEffect(() => {
    if (whereMode !== 'skip' || locationIdFromUrl) return
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLon(position.coords.longitude)
        setLocationLoading(false)
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess(null)
    try {
      let locId = null
      let sendLat = null
      let sendLon = null

      // Only send location_id if user explicitly picked/created a place. Skip / no selection = no location_id (backend uses Unassigned).
      if (whereMode === 'pick') {
        if (locationId) {
          locId = Number(locationId)
        } else if (newName.trim()) {
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
        // else: pick mode but nothing selected → same as skip, don't set locId
      } else if (whereMode === 'my_location' && lat != null && lon != null) {
        sendLat = lat
        sendLon = lon
      }

      const body = {
        rating: Number(rating),
        comment: comment.trim() || undefined,
        heat: heat === '' ? undefined : Number(heat),
      }
      if (locId != null) body.location_id = locId
      if (sendLat != null) body.lat = sendLat
      if (sendLon != null) body.lon = sendLon

      const reviewRes = await fetch(`${API_BASE}/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!reviewRes.ok) {
        const err = await reviewRes.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to add review')
      }
      const reviewData = await reviewRes.json()
      // Only show "View location" when user explicitly picked a place (not Unassigned)
      const resolvedLocId = locId != null ? locId : null
      setSuccess({ locationId: resolvedLocId, reviewId: reviewData.id })
      setLocationId('')
      setNewName('')
      setNewAddress('')
      setRating('')
      setComment('')
      setHeat('')
      setWhereMode('skip')
      setLat(null)
      setLon(null)
    } catch (err) {
      setSuccess({ error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: 'auto', padding: 20, textAlign: 'left' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Rate</h2>
      <p style={{ color: '#666', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
        Add a rating. You can set the place now or leave it for later—curators can attach it to a location.
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
              {success.locationId && (
                <>
                  {' · '}
                  <Link to={`/locations/${success.locationId}`}>View location</Link>
                </>
              )}
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="rating" style={{ display: 'block', marginBottom: 4 }}>Rating</label>
          <select
            id="rating"
            value={rating}
            required
            onChange={(e) => setRating(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          >
            <option value="">Select…</option>
            {RATING_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="heat" style={{ display: 'block', marginBottom: 4 }}>Heat (optional)</label>
          <select
            id="heat"
            value={heat}
            onChange={(e) => setHeat(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          >
            <option value="">—</option>
            {RATING_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="comment" style={{ display: 'block', marginBottom: 4 }}>Comment (optional)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Where, what you had, etc."
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: '1.25rem', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
          <span style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: '#555' }}>Where? (optional — curators can set later)</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => { setWhereMode('skip'); setLat(null); setLon(null); setLocationId(''); setNewName(''); setNewAddress(''); setLocationError(null); }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: whereMode === 'skip' ? '2px solid #0a0' : '1px solid #ccc',
                background: whereMode === 'skip' ? '#e8f5e9' : '#f5f5f5',
                color: '#1a1a1a',
              }}
            >
              No location
            </button>
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationLoading}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: whereMode === 'my_location' ? '2px solid #0a0' : '1px solid #ccc',
                background: whereMode === 'my_location' ? '#e8f5e9' : '#f5f5f5',
                color: '#1a1a1a',
              }}
            >
              {locationLoading ? 'Getting location…' : lat != null ? '✓ Use my location' : 'Use my location'}
            </button>
            <button
              type="button"
              onClick={() => { setWhereMode('pick'); setLat(null); setLon(null); setLocationError(null); }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: whereMode === 'pick' ? '2px solid #0a0' : '1px solid #ccc',
                background: whereMode === 'pick' ? '#e8f5e9' : '#f5f5f5',
                color: '#1a1a1a',
              }}
            >
              Pick a place
            </button>
          </div>
          {locationError && (
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#c00' }}>{locationError}</p>
          )}
          {whereMode === 'pick' && (
            <div style={{ marginTop: 12 }}>
              <select
                value={locationId}
                onChange={(e) => { setLocationId(e.target.value); setNewName(''); setNewAddress(''); }}
                style={{ width: '100%', padding: 8, marginBottom: 8 }}
              >
                <option value="">No location (curator will set later)</option>
                {locations.filter((loc) => loc.name !== 'Unassigned').map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}{loc.address ? ` — ${loc.address}` : ''}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: 4 }}>Or add new place:</div>
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ width: '100%', padding: 8, marginBottom: 6 }}
              />
              <input
                type="text"
                placeholder="Address (optional)"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} style={{ padding: '8px 16px' }}>
          {submitting ? 'Submitting…' : 'Submit rating'}
        </button>
      </form>
    </div>
  )
}
