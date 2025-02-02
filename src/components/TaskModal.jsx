import { useContext, useState, useEffect } from 'react'
import { TaskContext } from '../context/TaskContext'
import { ChatContext } from '../context/ChatContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestion, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../context/AuthContext'
import { LoaderContext  } from '../context/LoaderContext'
import Editor from 'react-simple-wysiwyg';



const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;
function TaskModal() {
  const { selectedTask, isModalOpen, setIsModalOpen, setTasks } = useContext(TaskContext)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [id, setId] = useState('')
  const [priority, setPriority] = useState('')
  const [date_completed, setDateCompleted] = useState('')
  const [recurrency, setRecurrency] = useState('')
  const { setNewMessage } = useContext(ChatContext)
  const { user } = useContext(AuthContext)
  const { setIsLoaderOn } = useContext(LoaderContext)


  function helpWithChat(selectedTask) {
    const message = `I need help with task "${selectedTask.title}". Description: ${selectedTask.description} Can you help me do this task?`

        setNewMessage(message)
    setIsModalOpen(false);

  }


  useEffect(() => {
    if (selectedTask) {
      console.log(selectedTask)
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
    setIsLoaderOn(true);
    e.preventDefault()
    const updatedTask = { title, description, date , priority, date_completed, recurrency }

    if (selectedTask.id) {
      // Update existing task
      fetch(endpointStructure+`/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}` 
        },
        body: JSON.stringify(updatedTask)
      })
        .then(response => response.json())
        .then(data => {
          setTasks(prevTasks => prevTasks.map(task => (task.id == data.id ? data : task)))
          setIsModalOpen(false)
          setIsLoaderOn(false);
        })
        .catch(error => console.error('Error updating task:', error))
    } else {
      // Create new task
      fetch(endpointStructure+'/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify(updatedTask)
      })
        .then(response => response.json())
        .then(data => {
          setTasks(prevTasks => [...prevTasks, data])
          setIsModalOpen(false)
          setIsLoaderOn(false);
        })
        .catch(error => console.error('Error saving task:', error))
    }
  }

  const handleCompleted = (date_completed) => {
    setIsLoaderOn(true);
    const updatedTask = { title, description, date , priority, date_completed: date_completed, recurrency }
    fetch(endpointStructure+`/tasks/${selectedTask.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.access_token}`
      },
      body: JSON.stringify(updatedTask)
    })
      .then(response => response.json())
      .then(data => {
        setTasks(prevTasks => prevTasks.map(task => (task.id == data.id ? data : task)))
        setIsModalOpen(false)
        setIsLoaderOn(false);
      }
      )
      .catch(error => console.error('Error updating task:', error))
  }

  const handleIncomplete = (date_completed) => {
    setIsLoaderOn(true);
    const updatedTask = { title, description, date , priority, date_completed: date_completed, recurrency, id: selectedTask.id }
    fetch(endpointStructure+`/tasks/${selectedTask.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.access_token}` 
      },
      body: JSON.stringify(updatedTask)
    })
      .then(response => response.json())
      .then(data => {
        setTasks(prevTasks => prevTasks.map(task => (task.id == data.id ? data : task)))
        setIsModalOpen(false)
        setIsLoaderOn(false);
      }
      )
      .catch(error => console.error('Error updating task:', error))
  }

  const handleDelete = () => {
    setIsLoaderOn(true);
    fetch(endpointStructure+`/tasks/${selectedTask.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.access_token}` 
      },
    })
      .then(() => {
        setTasks(prevTasks => prevTasks.filter(task => task.id != selectedTask.id))
        setIsModalOpen(false)
        setIsLoaderOn(false);
      })
      .catch(error => console.error('Error deleting task:', error))
  }

  const handlePriorityChange = (e) => {
    console.log('New priority:', e.target.value);
    setPriority(e.target.value);
  };

  if (!isModalOpen) return null

  var datenow = new Date(); 
  datenow = datenow.toISOString().split('T')[0];

  return (
    <div className={`modal ${isModalOpen ? 'show' : ''}`} id="taskModal">

      <div className="modal-content">
      <div className={`modal-header ${selectedTask.priority}`}>
          <h2>{selectedTask.id ? 'Edit: '+selectedTask.title : 'Add Task'}</h2>
        </div>
        <div className="modal-body">
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
          

            <Editor value={description} onChange={(e) => setDescription(e.target.value)} />
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
                                onChange={(e) => handlePriorityChange(e)}
                                required
                            > 
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
          </div>
          {selectedTask.id &&    <div>
                <label>Completed</label>
                <div className="inline">
                <input
                type="date"
                value={date_completed}
                onChange={(e) => setDateCompleted(e.target.value)}
                
                />
                <button className="square btn-success" type="button" onClick={() => handleCompleted( datenow )}><FontAwesomeIcon icon={faCheck} /></button>
                <button className="square btn-danger" type="button" onClick={() => handleIncomplete( '' )}><FontAwesomeIcon icon={faTimes} /></button>
                <button className="square" type="button" onClick={() => helpWithChat(selectedTask)}> <FontAwesomeIcon icon={faQuestion} /></button>
                </div>
            </div>
      }
            <div>
                <label>Recurrency</label>
                <select 
                value={recurrency}
                onChange={(e) => setRecurrency(e.target.value)}
                required
                > 
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                </select>
            </div>
            <div className="buttons">
            <button type="submit">Save</button>
            {selectedTask.id && <button type="button" className="delete" onClick={handleDelete}>Delete</button>}

            <button type="button" onClick={() => setIsModalOpen(false)} className="self_right">Cancel</button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}

export default TaskModal