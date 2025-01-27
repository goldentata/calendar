import { useContext } from 'react'
import { NoteContext } from '../context/NoteContext'

function SingleNote({ title, content }){
    const { notes, openNoteModal } = useContext(NoteContext)


    return (
        <div onClick={() => openNoteModal({ title, content })} style={{ cursor: 'pointer' }}>
            <h3>{title || "Note Title"}</h3>
            <p>{content || "Note Content"}</p>
        </div>
    )
}

export default SingleNote