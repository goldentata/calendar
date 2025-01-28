import { createContext, useEffect, useState } from 'react'

export const NoteContext = createContext()

export function NoteProvider({ children }) {
    const [notes, setNotes] = useState([])
    const [selectedNote, setSelectedNote] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)


    useEffect(() => {
        fetch('http://localhost:3000/notes')
            .then(response => response.json())
            .then(data => setNotes(data))
            .catch(error => console.log(error))
    }, [])

 
    const openNoteModal = (note) => {
        setSelectedNote(note)
        setIsModalOpen(true)
    }

    return (
        <NoteContext.Provider value={{ notes, selectedNote, isModalOpen, setIsModalOpen, openNoteModal }}>
            {children}
        </NoteContext.Provider>
    )
}