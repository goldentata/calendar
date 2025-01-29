import { useContext } from 'react'
import { NoteContext } from '../context/NoteContext'

function SingleNote({ id, title, content }){
    const { notes, openNoteModal } = useContext(NoteContext)


    return (
        <div onClick={() => openNoteModal({ id, title, content })} className="single-note">
            <h3>{title || "Note Title"}</h3>
            <p>{content || "Note Content"}</p>
        </div>
    )
}

export default SingleNote