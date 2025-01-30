import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'

function SignupModal() {
  const { signUp, showSignupModal, setShowSignupModal, setShowLoginModal } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isConfirmation, setIsConfirmation] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await signUp(email, password)
      setIsConfirmation(true)
      // Auto switch to login after 5 seconds
      setTimeout(() => {
        setShowSignupModal(false)
        setShowLoginModal(true)
      }, 5000)
    } catch (error) {
      setError(error.message)
    }
  }

  if (!showSignupModal) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Sign Up</h2>
        </div>
        <div className="modal-body">
          {isConfirmation ? (
            <div className="confirmation-message">
              <h3>Thanks for signing up!</h3>
              <p>Please check your email to confirm your account.</p>
              <p>You will be redirected to login in a few seconds...</p>
              <button onClick={() => {
                setShowSignupModal(false)
                setShowLoginModal(true)
              }}>
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <p className="error">{error}</p>}
              <div>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="buttons">
                <button type="submit">Sign Up</button>
                <button type="button" onClick={() => {
                  setShowSignupModal(false)
                  setShowLoginModal(true)
                }}>Already have an account?</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
export default SignupModal