import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

function Signup() {
  const { signUp } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await signUp(email, password)
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      {error && <p>{error}</p>}
      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Sign Up</button>
    </form>
  )
}

export default Signup