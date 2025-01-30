import { createContext, useEffect, useState, useContext } from 'react'
import { AuthContext } from './AuthContext'

export const NoteContext = createContext()

const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;
export function NoteProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useContext(AuthContext)

  useEffect(() => {
    if (user) {
        console.log('Fetching notes for user:', user)
      fetch(endpointStructure + '/notes', {
        headers: {
          'Authorization': `Bearer ${user.access_token}` // Add this
        }
      })
      .then(response => response.json())
      .then(data => setNotes(data))
      .catch(error => console.log(error))
    }
  }, [user])

  const openNoteModal = (note) => {
    setSelectedNote(note)
    setIsModalOpen(true)
  }

  const newNoteModal = () => {
    setSelectedNote({
      id: '',
      title: '',
      content: ''
    })
    setIsModalOpen(true)
  }

  return (
    <NoteContext.Provider value={{ notes, selectedNote, isModalOpen, setIsModalOpen, openNoteModal, setNotes, newNoteModal }}>
      {children}
    </NoteContext.Provider>
  )
}