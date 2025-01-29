import { useState, useContext, useEffect } from 'react'
import { NoteContext  } from '../context/NoteContext';

function NoteModal(props){
    
    const { selectedNote, isModalOpen, setIsModalOpen, setNotes } = useContext(NoteContext)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [id, setId] = useState('')

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
            fetch(`http://localhost:3000/notes/${selectedNote.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedNote)
            })
            .then(response => response.json())
            .then(data => {
                setNotes(prevNotes => prevNotes.map(note => (note.id === data.id ? data : note)))
                setIsModalOpen(false)
            })
            .catch(error => console.error('Error updating note:', error))
        } else {
            fetch('http://localhost:3000/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedNote)
            })
            .then(response => response.json())
            .then(data => {
                setNotes(prevNotes => [...prevNotes, data])
                setIsModalOpen(false)
            })
            .catch(error => console.error('Error saving note:', error))
        }
    }

    const handleDelete = () => {
        console.log(selectedNote);
        fetch(`http://localhost:3000/notes/${selectedNote.id}`, {
            method: 'DELETE'
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
            <h2>{selectedNote.id ? 'Edit Note' : 'New Note'}</h2>
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
    )
}

export default NoteModal