import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAdmin } from '../utils/admin';
import './SearchPage.css';

const iconColor = '#3d2914';
const RatingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor} aria-hidden>
    <path d="M12 2l3 6.5 6.5.5-5 4.5 2 6.5L12 17l-4.5 3 2-6.5-5-4.5 6.5-.5L12 2z" />
  </svg>
);
const FlameIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor} aria-hidden>
    <path d="M12 22c4.97 0 9-3.58 9-8 0-4.5-2.5-6.5-4-8-1.5 1.5-2 4-3 6-.75 1.5-2 3-3 3s-2-.5-2-2c0-2 1-4 2-6-2 0-4 2-5 4-1 2-1 4 0 6 1 2 2 3 3 3z" />
  </svg>
);
const WalkingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor} aria-hidden>
    <path d="M12 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-2 4h1l2 4-2 2v8h-2v-6l-2-2 1-4h2z" />
  </svg>
);
const AirplaneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor} aria-hidden>
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
);
const RocketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor} aria-hidden>
    <path d="M12 2L9 6H4v2h2l2 8H8l1 4h6l1-4h-1l2-8h2V6h-5l-3-4zm0 4.5l1.5 2h-3L12 6.5zM9 8h6l-1.5 6h-3L9 8z" />
  </svg>
);

function getDistanceIcon(miles) {
  if (miles == null) return null;
  const m = Number(miles);
  if (m < 5) return <WalkingIcon />;
  if (m < 1000) return <AirplaneIcon />;
  return <RocketIcon />;
}
function formatStatRating(v) {
  if (v == null) return '—';
  const n = Number(v);
  return n % 1 === 0 ? Math.round(n) : n.toFixed(1);
}
function formatDistance(miles) {
  if (miles == null) return null;
  const m = Number(miles);
  return m < 1 ? `${m.toFixed(1)} mi` : `${Math.round(m)} mi`;
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    minRating: 0,
    sortBy: 'recently_reviewed' // 'recently_reviewed', 'date_created', 'rating', 'name', 'reviews', 'heat', 'nearme'
  });
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [mode, setMode] = useState('city'); // 'city' or 'nearby'
  const navigate = useNavigate();

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationError(null);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);
        setMode('nearby');
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        const msg =
          err.code === 1 ? 'Location permission denied.'
          : err.code === 2 ? 'Location unavailable (e.g. network error).'
          : err.code === 3 ? 'Location request timed out.'
          : `Unable to get location: ${err.message || err.code}`;
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (filters.sortBy === 'nearme' && lat == null && lon == null && !locationLoading && !locationError) {
      requestLocation();
    }
  }, [filters.sortBy]);

  useEffect(() => {
    fetchLocations();
  }, [searchTerm, lat, lon, filters, mode]);

  const fetchLocations = async () => {
    try {
      const params = new URLSearchParams();
      if (mode === 'city' && searchTerm) {
        params.set('search', searchTerm);
      }
      const useCoords = (mode === 'nearby' || filters.sortBy === 'nearme') && lat != null && lon != null;
      if (useCoords) {
        params.set('lat', String(lat));
        params.set('lon', String(lon));
        params.set('max_distance', '20');
        params.set('sort_by', filters.sortBy === 'nearme' ? 'rating' : filters.sortBy);
      }
      if (filters.minRating > 0) {
        params.set('min_rating', String(filters.minRating));
      }
      if (!useCoords && filters.sortBy && filters.sortBy !== 'nearme') {
        params.set('sort_by', filters.sortBy);
      }
      params.set('limit', '100');
      const url = `http://localhost:8000/locations/?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setMode('city');
  };

  const handleFindNearMe = () => {
    handleFilterChange('sortBy', 'nearme');
  };

  const clearLocation = () => {
    setLat(null);
    setLon(null);
    setLocationError(null);
    setMode('city');
    if (filters.sortBy === 'nearme') {
      handleFilterChange('sortBy', 'recently_reviewed');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleSelect = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mergeSelected = () => {
    if (selectedIds.size < 2) return;
    const ids = Array.from(selectedIds).join(',');
    navigate(`/duplicates?ids=${encodeURIComponent(ids)}`);
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h2 className="search-title">Find by location name or near you</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Location name or address..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <button type="button" onClick={handleFindNearMe} className="find-near-me-btn" disabled={locationLoading}>
            {locationLoading ? 'Getting location…' : 'Find Near Me'}
          </button>
        </div>
        {(lat != null && lon != null) && (
          <div className="your-location-bar" data-surface="light">
            <strong>Your location:</strong>{' '}
            <span className="your-location-coords">{lat.toFixed(6)}, {lon.toFixed(6)}</span>
            {' · '}
            <button type="button" onClick={requestLocation} className="location-link-btn" disabled={locationLoading}>
              Refresh
            </button>
            {' · '}
            <button type="button" onClick={clearLocation} className="location-link-btn">
              Clear
            </button>
          </div>
        )}
        {locationError && (
          <div className="location-error" role="alert">
            {locationError}
            {' '}
            <button type="button" onClick={requestLocation} className="location-link-btn" disabled={locationLoading}>
              Try again
            </button>
          </div>
        )}
        <div style={{ marginTop: 8, fontStyle: 'italic', color: '#888' }}>
          {(mode === 'nearby' || filters.sortBy === 'nearme') && lat != null && lon != null ? (
            <>Within 20 miles, then sorted by dropdown below</>
          ) : (
            <>Find by location name or address, or sort by Near me</>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Minimum rating:</label>
          <select
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
          >
            <option value={0}>Any rating</option>
            <option value={5}>5+</option>
            <option value={6}>6+</option>
            <option value={7}>7+</option>
            <option value={8}>8+</option>
            <option value={9}>9+</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="recently_reviewed">Recently reviewed</option>
            <option value="date_created">Date created</option>
            <option value="rating">Highest rating</option>
            <option value="name">Name A–Z</option>
            <option value="reviews">Most reviews</option>
            <option value="heat">Hottest</option>
            <option value="nearme">Near me</option>
          </select>
        </div>
      </div>

      {isAdmin() && selectedIds.size >= 2 && (
        <div className="merge-selected-bar" data-surface="light">
          <button type="button" onClick={mergeSelected} className="merge-selected-btn">
            Merge selected ({selectedIds.size}) →
          </button>
        </div>
      )}
      <div className="results-section">
        {locations.map(location => isAdmin() ? (
          <div
            key={location.id}
            className="location-card location-card-with-checkbox"
            data-surface="light"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(location.id)}
              onChange={(e) => toggleSelect(e, location.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${location.name}`}
            />
            <div className="location-card-content">
              <h3>
                <Link to={`/locations/${location.id}`}>{location.name}</Link>
              </h3>
              <p>{location.address}</p>
              <div className="location-stats-pills">
                <span className="stat-pill stat-pill-rating" title="Rating">
                  <RatingIcon />
                  <span>{location.average_rating != null && location.review_count > 0 ? formatStatRating(location.average_rating) : '—'}</span>
                </span>
                <span className="stat-pill stat-pill-heat" title="Heat">
                  <FlameIcon />
                  <span>{location.average_heat != null ? formatStatRating(location.average_heat) : '—'}</span>
                </span>
                {location.distance != null && (
                  <span className="stat-pill stat-pill-distance" title="Distance">
                    {getDistanceIcon(location.distance)}
                    <span>{formatDistance(location.distance)}</span>
                  </span>
                )}
              </div>
              {location.review_count != null && location.review_count > 0 && (
                <p className="location-review-meta">{location.review_count} review{location.review_count !== 1 ? 's' : ''}</p>
              )}
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                <Link to={`/new-rating?location_id=${location.id}`} onClick={(e) => e.stopPropagation()} style={{ color: '#646cff' }}>
                  Add rating
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <Link
            key={location.id}
            to={`/locations/${location.id}`}
            className="location-card location-card-link"
            data-surface="light"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <h3>{location.name}</h3>
            <p>{location.address}</p>
            <div className="location-stats-pills">
              <span className="stat-pill stat-pill-rating" title="Rating">
                <RatingIcon />
                <span>{location.average_rating != null && location.review_count > 0 ? formatStatRating(location.average_rating) : '—'}</span>
              </span>
              <span className="stat-pill stat-pill-heat" title="Heat">
                <FlameIcon />
                <span>{location.average_heat != null ? formatStatRating(location.average_heat) : '—'}</span>
              </span>
              {location.distance != null && (
                <span className="stat-pill stat-pill-distance" title="Distance">
                  {getDistanceIcon(location.distance)}
                  <span>{formatDistance(location.distance)}</span>
                </span>
              )}
            </div>
            {location.review_count != null && location.review_count > 0 && (
              <p className="location-review-meta">{location.review_count} review{location.review_count !== 1 ? 's' : ''}</p>
            )}
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
              <Link to={`/new-rating?location_id=${location.id}`} onClick={(e) => e.stopPropagation()} style={{ color: '#646cff' }}>
                Add rating
              </Link>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
} 