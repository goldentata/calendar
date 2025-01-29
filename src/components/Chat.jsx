import { useState, useEffect, useContext, useRef } from 'react'
import { ChatContext } from '../context/ChatContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import  NewChatButton  from './NewChatButton'


function Chat() {

    const { messages, setMessages, newMessage, setNewMessage } = useContext(ChatContext)
    const messagesEndRef = useRef(null)
    const [ isSending, setIsSending ] = useState(false)
    const inputRef = useRef(null)  // Add ref for input

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages]);

    useEffect(() => {
        // Load chat history
        fetch('http://localhost:3000/chat')
            .then(response => response.json())
            .then(data => setMessages(data))
            .catch(error => console.error('Error fetching chat:', error))
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()

        setIsSending(true)
        inputRef.current?.blur()  //
        
        fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: newMessage })
        })
            .then(response => response.json())
            .then(data => {
                setMessages(prevMessages => [...prevMessages, data])
                setNewMessage('')
                setIsSending(false)
                inputRef.current?.focus() 
            })
            .catch(error => console.error('Error sending message:', error))
    }

    return (
        <div className="chat_container">
            <NewChatButton />
            <div className="chat_history">
                {messages.map(msg => (
                    <div key={msg.id} className="chat_message" id={msg.id}>
                        <div className="user_message" dangerouslySetInnerHTML={{ __html: msg.message }}></div>
                        <div className="ai_response" dangerouslySetInnerHTML={{ __html: msg.response }}></div>
                    </div>
                ))}
            </div>
            <div ref={messagesEndRef} />
            <form onSubmit={handleSubmit} className={`chat_input ${isSending ? 'sending' : ''}`}>
                <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    ref={inputRef} 
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <button type="submit">
                <FontAwesomeIcon icon={faPaperPlane} /></button>
            </form>
        </div>
    )
}

export default Chat