import { createContext, useState } from 'react'

export const ChatContext = createContext()

export function ChatProvider({ children }) {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [tmpMessage, setTmpMessage] = useState('')

    
    return (
        <ChatContext.Provider value={{ messages, setMessages, newMessage, setNewMessage, tmpMessage, setTmpMessage }}>
            {children}
        </ChatContext.Provider>
    )
}