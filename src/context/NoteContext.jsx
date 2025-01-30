import { createContext, useEffect, useState, useContext } from 'react'
import { AuthContext } from './AuthContext'

export const NoteContext = createContext()

const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;
export function NoteProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useContext(AuthContext)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      async function fetchNotes() {
          if (!user || !isLoading) return;

          try {
              const response = await fetch(endpointStructure + '/notes', {
                  headers: {
                      'Authorization': `Bearer ${user.access_token}`
                  }
              });
              const data = await response.json();
              setNotes(data);
          } catch (error) {
              console.error('Error fetching notes:', error);
          } finally {
              setIsLoading(false);
          }
      }

      fetchNotes();
  }, [user, isLoading]);

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