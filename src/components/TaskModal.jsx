import { useContext, useState, useEffect } from 'react'
import { TaskContext } from '../context/TaskContext'

function TaskModal() {
  const { selectedTask, isModalOpen, setIsModalOpen, setTasks } = useContext(TaskContext)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [id, setId] = useState('')
  const [priority, setPriority] = useState('')
  const [date_completed, setDateCompleted] = useState('')
  const [recurrency, setRecurrency] = useState('')

  console.log(selectedTask)

  useEffect(() => {
    if (selectedTask) {
      setId(selectedTask.id || '')
      setTitle(selectedTask.title || '')
      setDescription(selectedTask.description || '')
      setDate(selectedTask.date || '')
        setPriority(selectedTask.priority || 'High')
        setDateCompleted(selectedTask.date_completed || '')
        setRecurrency(selectedTask.recurrency || 'none')
    }
  }, [selectedTask])

  const handleSubmit = (e) => {
    e.preventDefault()
    const updatedTask = { title, description, date , priority, date_completed, recurrency }

    if (selectedTask.id) {
      // Update existing task
      fetch(`http://localhost:3000/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
      })
        .then(response => response.json())
        .then(data => {
          setTasks(prevTasks => prevTasks.map(task => (task.id === data.id ? data : task)))
          setIsModalOpen(false)
        })
        .catch(error => console.error('Error updating task:', error))
    } else {
      // Create new task
      fetch('http://localhost:3000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
      })
        .then(response => response.json())
        .then(data => {
          setTasks(prevTasks => [...prevTasks, data])
          setIsModalOpen(false)
        })
        .catch(error => console.error('Error saving task:', error))
    }
  }

  const handleDelete = () => {
    fetch(`http://localhost:3000/tasks/${selectedTask.id}`, {
      method: 'DELETE'
    })
      .then(() => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== selectedTask.id))
        setIsModalOpen(false)
      })
      .catch(error => console.error('Error deleting task:', error))
  }


  if (!isModalOpen) return null

  return (
    <div className={`modal ${isModalOpen ? 'show' : ''}`} id="taskModal">
      <div className="modal-content">
        <h2>{selectedTask.id ? 'Edit Task' : 'Add Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
                            <label>Priority</label>
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                required
                            > 
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
          </div>
            <div>
                <label>Date Completed</label>
                <input
                type="date"
                value={date_completed}
                onChange={(e) => setDateCompleted(e.target.value)}
                
                />
            </div>
            <div>
                <label>Recurrency</label>
                <input
                type="text"
                value={recurrency}
                onChange={(e) => setRecurrency(e.target.value)}
                required
                />
            </div>
            <div className="buttons">
            <button type="submit">Save</button>
            {selectedTask.id && <button type="button" className="delete" onClick={handleDelete}>Delete</button>}

            <button type="button" onClick={() => setIsModalOpen(false)} className="self_right">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal