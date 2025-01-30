import { useState, useEffect, useContext, useRef } from 'react'
import { ChatContext } from '../context/ChatContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import  NewChatButton  from './NewChatButton'
import { AuthContext } from '../context/AuthContext'


const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;


function Chat() {

    const { messages, setMessages, newMessage, setNewMessage } = useContext(ChatContext)
    const messagesEndRef = useRef(null)
    const [ isSending, setIsSending ] = useState(false)
    const inputRef = useRef(null)  // Add ref for input

    const [liveResponse, setLiveResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [tmpMessage, setTmpMessage] = useState('')

    

    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages]);



      const { user } = useContext(AuthContext)
    
    
    
      useEffect(() => {
        if (user) {
          fetch(endpointStructure + '/chat', {
            headers: {
              'Authorization': `Bearer ${user.access_token}` // Add this
            }
          })
          .then(response => response.json())
          .then(data => setMessages(data))
          .catch(error => console.log(error))
        }
      }, [user])

  // Submit handler

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setIsStreaming(true);
    setLiveResponse('');
    inputRef.current?.blur();

    try {
      // POST to our streaming endpoint
      const response = await fetch(endpointStructure+'/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  'Authorization': `Bearer ${user.access_token}`  },
        body: JSON.stringify({ message: newMessage }),
      });

      setTmpMessage(newMessage);


      // ReadableStream from `fetch`
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let accumulatedText = '';

      // We'll read the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk into text
        const chunk = decoder.decode(value, { stream: true });

        // Check if we have the special marker `[[DONE]]`
        const doneMarkerIndex = chunk.indexOf('[[DONE]]');

        if (doneMarkerIndex !== -1) {
          // Everything before the marker is still AI tokens
          const partialChunk = chunk.slice(0, doneMarkerIndex);
          accumulatedText += partialChunk;
          setLiveResponse(accumulatedText); // display partial if you like

          // After the marker, we have our final JSON
          const jsonPart = chunk.slice(doneMarkerIndex + '[[DONE]]'.length);

          let finalObj;
          try {
            finalObj = JSON.parse(jsonPart);
          } catch (err) {
            console.error('Error parsing final JSON:', err);
          }

          // finalObj should be your { id, message, response }
          if (finalObj) {
            setMessages((prev) => [...prev, finalObj]);
            setIsStreaming(false);
          }

          // We’re done! No need to read further
          reader.cancel();
          break;
        } else {
          // If no marker, it's all tokens
          accumulatedText += chunk;
          // If you want "live streaming" in the UI:
          setLiveResponse(accumulatedText);
        }
      }

      // Clean up
      reader.releaseLock();
      setNewMessage('');
    } catch (error) {
      console.error('Error streaming:', error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

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

                <div className={`live_response ${isStreaming ? 'streaming' : ''}`}>
                     <div className="user_message">{tmpMessage}</div>
                    <div className="ai_response">{liveResponse ? liveResponse : '...'}</div>
                </div>
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