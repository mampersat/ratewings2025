import { useState, useEffect } from 'react';
import './SearchPage.css';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    minRating: 0,
    maxRating: 10,
    priceRange: 'all', // 'budget', 'moderate', 'premium'
    sortBy: 'rating' // 'rating', 'name', 'reviews'
  });
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [mode, setMode] = useState('city'); // 'city' or 'nearby'

  useEffect(() => {
    // Fetch locations whenever searchTerm or filters change
    fetchLocations();
  }, [searchTerm, lat, lon, filters, mode]);

  const fetchLocations = async () => {
    try {
      let url = 'http://localhost:8000/locations/';
      const params = [];
      if (mode === 'city' && searchTerm) {
        params.push(`search=${encodeURIComponent(searchTerm)}`);
      }
      if (mode === 'nearby' && lat && lon) {
        params.push(`lat=${encodeURIComponent(lat)}`);
        params.push(`lon=${encodeURIComponent(lon)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
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

  // No client-side filtering by name or address; backend handles it
  const filteredLocations = locations;

  return (
    <div className="search-page">
      <div className="search-header">
        <h2 className="search-title">Search by city or find near you</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Enter city or state..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
            disabled={mode === 'nearby'}
          />
          <button onClick={handleFindNearMe} style={{ marginLeft: 8 }}>
            Find Near Me
          </button>
        </div>
        <div style={{ marginTop: 8, fontStyle: 'italic', color: '#888' }}>
          {mode === 'nearby' && lat && lon ? (
            <>Searching near your location ({lat.toFixed(4)}, {lon.toFixed(4)})</>
          ) : (
            <>Searching by city or state</>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Rating:</label>
          <select 
            value={filters.minRating} 
            onChange={(e) => handleFilterChange('minRating', e.target.value)}
          >
            <option value="0">Any Rating</option>
            <option value="5">5+</option>
            <option value="6">6+</option>
            <option value="7">7+</option>
            <option value="8">8+</option>
            <option value="9">9+</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Price Range:</label>
          <select 
            value={filters.priceRange} 
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="budget">Budget</option>
            <option value="moderate">Moderate</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select 
            value={filters.sortBy} 
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="rating">Rating</option>
            <option value="name">Name</option>
            <option value="reviews">Most Reviews</option>
          </select>
        </div>
      </div>

      <div className="results-section">
        {filteredLocations.map(location => (
          <div key={location.id} className="location-card">
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
          </div>
        ))}
      </div>
    </div>
  );
} 