import { useState } from 'react'
import AddLocationForm from '../components/AddLocationForm'
import LocationList from '../components/LocationList'

export default function LocationsPage() {
  const [refresh, setRefresh] = useState(0)
  const handleRefresh = () => setRefresh((r) => r + 1)

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20, textAlign: 'left' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Locations</h2>
      <AddLocationForm onAdd={handleRefresh} />
      <LocationList refresh={refresh} />
    </div>
  )
}
