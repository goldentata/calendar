import { useContext } from 'react'
import { ChatContext } from '../context/ChatContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../context/AuthContext'

const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;

function NewChatButton(){
    const { setNewMessage, setMessages, setTmpMessage } = useContext(ChatContext)
    const { user } = useContext(AuthContext)

    function clearChat() {
        setNewMessage('')
        setTmpMessage('')

        fetch(endpointStructure+'/chat', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.access_token}` 
              },
        })
            .then(response => response.json())
            .then(data => {
                setMessages([])
            })
            .catch(error => console.error('Error clearing chat:', error))
    }

    return (
        <div className="newChatButton" onClick={() => clearChat()} style={{ cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faPlus} />
        </div>
    )
 
}

export default NewChatButton;