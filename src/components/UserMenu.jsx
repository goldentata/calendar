import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { faUser } from '@fortawesome/free-solid-svg-icons'

function UserMenu(){

    const [ isOpen, setIsOpen ] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="user-menu" onClick={toggleMenu}>
        <div>
            <FontAwesomeIcon icon={faUser} />
        </div>
        {isOpen && (
            <div className="dropdown-menu">
                <ul>
                    <li>Settings</li>
                    <li>Logout</li>
                </ul>
            </div>
        )}
        </div>
    )
}

export default UserMenu;