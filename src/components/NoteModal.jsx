import { useState, useContext, useEffect } from 'react'
import { NoteContext  } from '../context/NoteContext';
import { AuthContext } from '../context/AuthContext';

const endpointStructure = await import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;
function NoteModal(props){
    
    const { selectedNote, isModalOpen, setIsModalOpen, setNotes } = useContext(NoteContext)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [id, setId] = useState('')
    const { user } = useContext(AuthContext)


    useEffect(() => {
        if (selectedNote) {
            setId(selectedNote.id)
            setTitle(selectedNote.title)
            setContent(selectedNote.content)
        }
    }, [selectedNote])

    if (!isModalOpen) return null

    const handleSubmit = () => {
        const updatedNote = { title, content }
        if(selectedNote.id){
            fetch(endpointStructure+`/notes/${selectedNote.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.access_token}` 
                },
                body: JSON.stringify(updatedNote)
            })
            .then(response => response.json())
            .then(data => {
                setNotes(prevNotes => prevNotes.map(note => (note.id == data.id ? data : note)))
                setIsModalOpen(false)
            })
            .catch(error => console.error('Error updating note:', error))
        } else {
            fetch(endpointStructure+'/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.access_token}` 
                },
                body: JSON.stringify(updatedNote)
            })
            .then(response => response.json())
            .then(data => {
                setNotes(prevNotes => [data, ...prevNotes])
                setIsModalOpen(false)
            })
            .catch(error => console.error('Error saving note:', error))
        }
    }

    const handleDelete = () => {
        fetch(endpointStructure+`/notes/${selectedNote.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.access_token}` 
            },
        })
        .then(() => {
            setNotes(prevNotes => prevNotes.filter(note => note.id !== selectedNote.id))
            setIsModalOpen(false)
        })
        .catch(error => console.error('Error deleting note:', error))
    }

    return (
        <div className={`modal ${isModalOpen ? 'show' : ''}`} id="noteModal">
            <div className="modal-content">
                <div className='modal-header'>
            <h2>{selectedNote.id ? 'Edit Note' : 'New Note'}</h2>
            </div>
            <div className="modal-body">
                <label>Title</label>
                <input type="text"
                    value={title} 
                    onChange={ (e) => setTitle(e.target.value) 
                 } required />
                <label>Content</label>
                <textarea 
                    value={content} 
                    onChange={ (e) => setContent(e.target.value) } required />
                    <div className="buttons">
                <button type="submit" onClick={() => handleSubmit()}>Save</button>  
                <button  className="delete"  onClick={() => handleDelete()}>Delete</button>  
                <button className="self_right" onClick={() => setIsModalOpen(false)}>Close Modal</button>
                </div>
                </div>
            </div>
        </div>
    )
}

export default NoteModal