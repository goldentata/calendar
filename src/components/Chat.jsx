import { useState, useEffect, useContext, useRef } from 'react'
import { ChatContext } from '../context/ChatContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import NewChatButton from './NewChatButton'
import { AuthContext } from '../context/AuthContext'
import { TaskContext } from '../context/TaskContext'
import { LoaderContext } from '../context/LoaderContext'

const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;

function Chat() {
  const { messages, setMessages, newMessage, setNewMessage, tmpMessage, setTmpMessage } = useContext(ChatContext)
  const messagesEndRef = useRef(null)
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef(null)  // Add ref for input

  const [isLoaderOn, setIsLoaderOn] = useState(false);

  const [liveResponse, setLiveResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [taskUpdateProposal, setTaskUpdateProposal] = useState(null);
  const [taskProposal, setTaskProposal] = useState(null);


  const { refreshTasks } = useContext(TaskContext)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }


  // Add parser function after formatResponseToHtml
const parseTaskProposal = (text) => {
  const createMatch = text.match(/<task-proposal>(.*?)<\/task-proposal>/);
  const updateMatch = text.match(/<task-update>(.*?)<\/task-update>/);

  if (createMatch) {
    const proposal = JSON.parse(createMatch[1]);
    const cleanText = text.replace(createMatch[0], '\n💡 Sent task proposal: "' + proposal.title + '"');
    return {
      text: cleanText,
      proposal: proposal,
      type: 'create'
    };
  } else if (updateMatch) {
    const proposal = JSON.parse(updateMatch[1]);
    const cleanText = text.replace(updateMatch[0], '\n✏️ Sent update proposal for a task');
    if (proposal.title == "undefined") {
      proposal.title = "Unchanged";
    }
    if (proposal.description == "undefined" || proposal.description == "null" || proposal.description == "") {
      proposal.description = "Unchanged";
    }
    if (proposal.date == "undefined" || proposal.date == "null" || proposal.date == "") {
      proposal.date = "Unchanged";
    }
    if (proposal.priority == "undefined" || proposal.priority == "null" || proposal.priority == "") {
      proposal.priority = "Unchanged";
    }
    if (proposal.recurrency == "undefined" || proposal.recurrency == "null" || proposal.recurrency == "") {
      proposal.recurrency = "Unchanged";
    }

    return {
      text: cleanText, 
      proposal: proposal,
      type: 'update'
    };
  }
  return { text, proposal: null, type: null };
};

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

  // Function to format response text to HTML
  const formatResponseToHtml = (responseText) => {
    // Replace ** with <strong> for bold text
    let formattedText = responseText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert numbered tasks to an ordered list
    formattedText = formattedText.replace(/(\d+)\.\s/g, '<li>').replace(/(\d+)\.\s/g, '</li><li>');
    formattedText = formattedText.replace(/<li>/, '<ol><li>').replace(/<\/li>$/, '</li></ol>');

    return formattedText;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setIsStreaming(true);
    setLiveResponse('');
    inputRef.current?.blur();

    try {
      // POST to our streaming endpoint
      const response = await fetch(endpointStructure + '/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
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
          setLiveResponse(formatResponseToHtml(accumulatedText)); // display partial if you like

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
            console.log('Final object:', finalObj);
          
          }

          // We’re done! No need to read further
          reader.cancel();
          break;
        } else {
          // If no marker, it's all tokens
          accumulatedText += chunk;
          const { text, proposal, type } = parseTaskProposal(accumulatedText);
          if (proposal) {
            console.log('Proposal:', proposal);
            if (type === 'create') {
              setTaskProposal(proposal);
            } else if (type === 'update') {
              setTaskUpdateProposal(proposal);
            }
            setLiveResponse(formatResponseToHtml(text));
          } else {
            setLiveResponse(formatResponseToHtml(accumulatedText));
          }
        }
      }

      fetch(endpointStructure + '/chat', {
        headers: {
          'Authorization': `Bearer ${user.access_token}` // Add this
        }
      })
        .then(response => response.json())
        .then(
          // set messages and clear tmpMessage
          data => {
            setMessages(data);
            setTmpMessage('');
            setIsStreaming(false);
          }
        )
        .catch(error => console.log(error))
    

      // console log the final response
      console.log('Final response:', accumulatedText);

      // if accumlatedText is Task created successfully! then run TaskContext refreshTasks
      if (accumulatedText.includes('Task created successfully!')) {
        console.log('task created successfully - updating tasks');
        await refreshTasks();
      }

      // Clean up
      reader.releaseLock();
      setNewMessage('');
    } catch (error) {
      console.error('Error streaming:', error);
      
      setIsSending(false);
      inputRef.current?.focus();
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
            <div className="ai_response" dangerouslySetInnerHTML={{ __html: formatResponseToHtml(msg.response) }}></div>
          </div>
        ))}

        <div className={`live_response ${isStreaming ? 'streaming' : ''}`}>
          <div className="user_message">{tmpMessage}</div>
          <div className="ai_response" dangerouslySetInnerHTML={{ __html: liveResponse ? liveResponse : '...' }}></div>
        </div>

        {taskProposal && (
        <div className="task-proposal">
          <h4>Would you like to create this task?</h4>
          <div className="task-proposal-details">
            <p><strong>Title:</strong> {taskProposal.title}</p>
            <p><strong>Description:</strong> {taskProposal.description}</p>
            <p><strong>Date:</strong> {taskProposal.date}</p>
            <p><strong>Priority:</strong> {taskProposal.priority}</p>
          </div>
          <div className="task-proposal-buttons">
            <button onClick={async () => {
               setIsLoaderOn(true);
               try {
                 const response = await fetch(`${endpointStructure}/tasks`, {
                   method: 'POST',
                   headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${user.access_token}`
                   },
                   body: JSON.stringify(taskProposal)
                 });
                 
                 if (response.ok) {
                   await refreshTasks();
                   setTaskProposal(null);
                 }
               } catch (error) {
                 console.error('Error creating task:', error);
               } finally {
                 setIsLoaderOn(false);
               }
            }}>Create Task</button>
            <button onClick={() => setTaskProposal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {taskUpdateProposal && (
          
        

  <div className="task-proposal">
    <h4>Would you like to update this task?</h4>
    <div className="task-proposal-details">
      <p><strong>Title:</strong> {taskUpdateProposal.title}</p>
      <p><strong>Description:</strong> {taskUpdateProposal.description}</p>
      <p><strong>Date:</strong> {taskUpdateProposal.date}</p>
      <p><strong>Priority:</strong> {taskUpdateProposal.priority}</p>
    </div>
    <div className="task-proposal-buttons">
      <button onClick={async () => {
        setIsLoaderOn(true);
        try {
          const response = await fetch(`${endpointStructure}/tasks/${taskUpdateProposal.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.access_token}`
            },
            body: JSON.stringify(taskUpdateProposal)
          });
          
          if (response.ok) {
            await refreshTasks();
            setTaskUpdateProposal(null);
          }
        } catch (error) {
          console.error('Error updating task:', error);
        } finally {
          setIsLoaderOn(false);
        }
      }}>Update Task</button>
      <button onClick={() => setTaskUpdateProposal(null)}>Cancel</button>
    </div>
  </div>
)}

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