import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ReviewDetailPage from './pages/ReviewDetailPage'
import LocationDetailPage from './pages/LocationDetailPage'
import DuplicatesPage from './pages/DuplicatesPage'
import NewRatingPage from './pages/NewRatingPage'
import UnlockAdminPage from './pages/UnlockAdminPage'
import { isAdmin } from './utils/admin'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div>
        <header style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Rate Wings</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.95rem' }}>Find the best wings near you</p>
          <nav style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <NavLink
              to="/"
              end
              style={({ isActive }) => ({
                color: isActive ? '#c00' : '#666',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              Find
            </NavLink>
            <NavLink
              to="/new-rating"
              style={({ isActive }) => ({
                color: isActive ? '#c00' : '#666',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              Rate
            </NavLink>
            {isAdmin() && (
              <NavLink
                to="/duplicates"
                style={({ isActive }) => ({
                  color: isActive ? '#c00' : '#666',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                Merge duplicates
              </NavLink>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/locations/:id" element={<LocationDetailPage />} />
            <Route path="/new-rating" element={<NewRatingPage />} />
            <Route path="/matt" element={<UnlockAdminPage />} />
            <Route path="/duplicates" element={<DuplicatesPage />} />
            <Route path="/reviews/:id" element={<ReviewDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
