import { useState, useContext } from 'react'
import { NoteContext  } from '../context/NoteContext';

function NoteModal(props){
    
    const { selectedNote, isModalOpen, setIsModalOpen } = useContext(NoteContext)

    if (!isModalOpen) return null


    console.log(selectedNote);
    return (
        <div className={`modal ${isModalOpen ? 'show' : ''}`} id="noteModal">
            <div className="modal-content">
                <h2>{selectedNote?.title}</h2>
                <p>{selectedNote?.content}</p>
                <button onClick={() => setIsModalOpen(false)}>Close Modal</button>
            </div>
        </div>
    )
}

export default NoteModal