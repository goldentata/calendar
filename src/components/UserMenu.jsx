import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, useContext } from 'react'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../context/AuthContext'
import { Link } from 'react-router-dom'

function UserMenu() {
    const { user, signOut, setShowLoginModal, setShowSignupModal } = useContext(AuthContext)
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
            {user ? (
              <button onClick={signOut}>Logout</button>
            ) : (
              <>
                <button onClick={() => setShowLoginModal(true)}>Login</button>
                <button onClick={() => setShowSignupModal(true)}>Sign Up</button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

export default UserMenu