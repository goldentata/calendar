import { useContext } from 'react'
import { TaskContext } from '../context/TaskContext'



function TaskModal(props){

    const { selectedTask, isModalOpen, setIsModalOpen } = useContext(TaskContext)

    if (!isModalOpen) return null

    console.log(selectedTask);
    return (
        <div className={`modal ${isModalOpen ? 'show' : ''}`} id="taskModal">
            <div className="modal-content">
                <h2>{selectedTask.title}</h2>
                <p>{selectedTask.description}</p>
                <button onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
        </div>
    )
}

export default TaskModal