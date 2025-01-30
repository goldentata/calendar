import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

function LoginModal() {
  const { signIn, showLoginModal, setShowLoginModal, setShowSignupModal, user } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      setShowLoginModal(false)
    } catch (error) {
        console.log(error.message)
        if(error.message=="Email not confirmed")
        {
            setError("Please check your email for the confirmation link.")
        } else{
            setError(error.message)
        }
    }
  }

  if (!showLoginModal) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Login</h2>
        </div>
        <div className="modal-body">
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
              <button type="submit">Login</button>
              <button type="button" onClick={() => {
                setShowLoginModal(false)
                setShowSignupModal(true)
              }}>Need an account?</button>
              {user && ( // Only show close button if user is logged in
                <button 
                  type="button" 
                  className="self_right" 
                  onClick={() => setShowLoginModal(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginModal