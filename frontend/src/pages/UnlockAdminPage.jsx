import { useState } from 'react'
import { Link } from 'react-router-dom'
import { setAdmin, clearAdmin } from '../utils/admin'

export default function UnlockAdminPage() {
  const [step, setStep] = useState('first') // 'first' | 'second' | 'off' | 'on'
  const [message, setMessage] = useState(null)

  const handleFirst = (isMatt) => {
    if (!isMatt) {
      clearAdmin()
      setMessage('Admin mode off.')
      setStep('off')
      return
    }
    setStep('second')
  }

  const handleSecond = (isMatt) => {
    if (!isMatt) {
      clearAdmin()
      setMessage('Admin mode off.')
      setStep('off')
      return
    }
    setAdmin()
    setMessage('Admin mode on.')
    setStep('on')
    window.location.href = '/'
  }

  if (step === 'off') {
    return (
      <div style={{ maxWidth: 400, margin: 'auto', padding: 40, textAlign: 'center' }}>
        <p>{message}</p>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/">← Search</Link>
        </p>
      </div>
    )
  }

  if (step === 'first') {
    return (
      <div style={{ maxWidth: 400, margin: 'auto', padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Are you Matt?</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => handleFirst(true)} style={{ padding: '0.5rem 1.5rem' }}>
            Yes
          </button>
          <button type="button" onClick={() => handleFirst(false)} style={{ padding: '0.5rem 1.5rem' }}>
            No
          </button>
        </div>
      </div>
    )
  }

  // step === 'second'
  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 40, textAlign: 'center' }}>
      <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Are you really Matt?</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => handleSecond(true)} style={{ padding: '0.5rem 1.5rem' }}>
          Yes
        </button>
        <button type="button" onClick={() => handleSecond(false)} style={{ padding: '0.5rem 1.5rem' }}>
          No
        </button>
      </div>
    </div>
  )
}
