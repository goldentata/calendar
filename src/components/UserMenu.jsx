import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, useContext } from 'react'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../context/AuthContext'
import { Link } from 'react-router-dom'

function UserMenu() {
  const { user, signOut } = useContext(AuthContext)
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="user-menu" onClick={toggleMenu}>
      <div>
        <FontAwesomeIcon icon={faUser} />
      </div>
      {isOpen && (
        <div className="dropdown-menu">
          <ul>
            {user ? (
              <>
                <li><button onClick={signOut}>Logout</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/signup">Sign Up</Link></li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default UserMenu