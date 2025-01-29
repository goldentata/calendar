import { useContext } from 'react'
import { ChatContext } from '../context/ChatContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'


function NewChatButton(){
    const { setNewMessage, setMessages } = useContext(ChatContext)

    function clearChat() {
        const message = ''
        setNewMessage(message)

        fetch('http://localhost:3000/chat', {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                console.log(data)
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