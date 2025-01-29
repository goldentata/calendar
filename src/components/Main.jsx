import {useContext } from 'react'
import { NoteContext } from '../context/NoteContext'
import Sidebar from './Sidebar'
import Calendar from './Calendar'
import SingleNote from './SingleNote'
import TaskModal from './TaskModal'
import NoteModal from './NoteModal'
import NewNoteButton from './NewNoteButton'

function Main() {
 const {notes, newNoteModal} = useContext(NoteContext);


    return (
      <main>
        <Sidebar title="Chat"/>
        <Calendar />
        <Sidebar title="Notes" >
          <NewNoteButton onClick={newNoteModal} />
            {notes.map((note, index) => ( 
              <SingleNote
                key = {index}
                id = {note.id}
                title = {note.title}
                content = {note.content}
              />
            ))}
        </Sidebar>
        <TaskModal />
        <NoteModal />
      </main>
    )
  }
  
  export default Main