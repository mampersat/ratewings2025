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
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [mode, setMode] = useState('city'); // 'city' or 'nearby'
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch locations whenever searchTerm or filters change
    fetchLocations();
  }, [searchTerm, lat, lon, filters, mode]);

  const fetchLocations = async () => {
    try {
      const params = new URLSearchParams();
      if (mode === 'city' && searchTerm) {
        params.set('search', searchTerm);
      }
      if (mode === 'nearby' && lat && lon) {
        params.set('lat', String(lat));
        params.set('lon', String(lon));
      }
      if (filters.minRating > 0) {
        params.set('min_rating', String(filters.minRating));
      }
      if (filters.sortBy) {
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
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);
        setSearchTerm('');
        setMode('nearby');
      },
      (error) => {
        alert('Unable to retrieve your location.');
      }
    );
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
            disabled={mode === 'nearby'}
          />
          {/* <button onClick={handleFindNearMe} style={{ marginLeft: 8 }}>
            Find Near Me
          </button> */}
        </div>
        <div style={{ marginTop: 8, fontStyle: 'italic', color: '#888' }}>
          {mode === 'nearby' && lat && lon ? (
            <>Searching near your location ({lat.toFixed(4)}, {lon.toFixed(4)})</>
          ) : (
            <>Search by location name or address</>
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
                      {Number(location.average_rating).toFixed(1)}/10
                    </span>
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
                    {Number(location.average_rating).toFixed(1)}/10
                  </span>
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