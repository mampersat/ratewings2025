import { useState } from 'react'
import AddReviewForm from '../components/AddReviewForm'
import ReviewList from '../components/ReviewList'

export default function ReviewsPage() {
  const [refresh, setRefresh] = useState(0)
  const handleRefresh = () => setRefresh((r) => r + 1)

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: 'left' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Reviews</h2>
      <AddReviewForm onAdd={handleRefresh} refresh={refresh} />
      <ReviewList refresh={refresh} />
    </div>
  )
}
