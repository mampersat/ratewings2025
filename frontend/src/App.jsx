import { useState } from 'react'
import LocationList from './components/LocationList'
import AddLocationForm from './components/AddLocationForm'
import ReviewList from './components/ReviewList'
import AddReviewForm from './components/AddReviewForm'
import './App.css'

function App() {
  // Used to trigger refresh after adding
  const [refresh, setRefresh] = useState(0)

  const handleRefresh = () => setRefresh((r) => r + 1)

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Chicken Wing Rating App</h1>
      <AddLocationForm onAdd={handleRefresh} />
      <LocationList refresh={refresh} />
      <AddReviewForm onAdd={handleRefresh} refresh={refresh} />
      <ReviewList refresh={refresh} />
    </div>
  )
}

export default App
