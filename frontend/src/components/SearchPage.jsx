import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAdmin } from '../utils/admin';
import './SearchPage.css';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    minRating: 0,
    sortBy: 'rating' // 'rating', 'name', 'reviews'
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
      handleFilterChange('sortBy', 'rating');
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
        <h2 className="search-title">Search by location name or find near you</h2>
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
            <>Search by location name or address, or sort by Near me</>
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
              <div className="location-rating-box">
                {location.average_rating != null && location.review_count > 0 ? (
                  <>
                    <span className="location-rating-value">
                      Rating {Number(location.average_rating) % 1 === 0 ? Math.round(Number(location.average_rating)) : Number(location.average_rating).toFixed(1)}
                      <span className="rating-out-of">/10</span>
                    </span>
                    {location.average_heat != null && (
                      <span className="location-rating-value">
                        Heat {Number(location.average_heat) % 1 === 0 ? Math.round(Number(location.average_heat)) : Number(location.average_heat).toFixed(1)}
                        <span className="rating-out-of">/10</span>
                      </span>
                    )}
                    <span className="location-rating-meta">
                      {location.review_count} review{location.review_count !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <span className="location-rating-none">No ratings yet</span>
                )}
              </div>
              {location.distance !== undefined && location.distance !== null && (
                <p><strong>Distance:</strong> {location.distance.toFixed(2)} miles</p>
              )}
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
            <div className="location-rating-box">
              {location.average_rating != null && location.review_count > 0 ? (
                <>
                  <span className="location-rating-value">
                    Rating {Number(location.average_rating) % 1 === 0 ? Math.round(Number(location.average_rating)) : Number(location.average_rating).toFixed(1)}
                    <span className="rating-out-of">/10</span>
                  </span>
                  {location.average_heat != null && (
                    <span className="location-rating-value">
                      Heat {Number(location.average_heat) % 1 === 0 ? Math.round(Number(location.average_heat)) : Number(location.average_heat).toFixed(1)}
                      <span className="rating-out-of">/10</span>
                    </span>
                  )}
                  <span className="location-rating-meta">
                    {location.review_count} review{location.review_count !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <span className="location-rating-none">No ratings yet</span>
              )}
            </div>
            {location.distance !== undefined && location.distance !== null && (
              <p><strong>Distance:</strong> {location.distance.toFixed(2)} miles</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
} 