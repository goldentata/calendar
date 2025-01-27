import { createContext, useState } from 'react'

export const NoteContext = createContext()

export function NoteProvider({ children }) {
    const [selectedNote, setSelectedNote] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const notes = [
        { title: "Note 1", content: "Content 1" },
        { title: "Note 2", content: "Content 2" },
        { title: "Note 3", content: "Content 3" },
    ]

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