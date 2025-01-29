import { useContext } from 'react'
import { NoteContext } from '../context/NoteContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'


function NewNoteButton(){
    const { notes, newNoteModal } = useContext(NoteContext)

    return (
        <div onClick={() => newNoteModal()} style={{ cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faPlus} />
        </div>
    )

}

export default NewNoteButton;