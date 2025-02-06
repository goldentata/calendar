import { useContext } from 'react'
import { TaskContext } from '../context/TaskContext'
import { AuthContext } from '../context/AuthContext'

const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE

function EventContextMenu() {
  const { openTaskModal, setTasks } = useContext(TaskContext)
  const { user } = useContext(AuthContext)
  
  return (
    <div className="context-menu" id="context-menu">
      <ul>
        <li><a href="#" id="edit" onClick={  }>Edit</a></li>
        <li><a href="#" id="delete">Delete</a></li>
      </ul>
    </div>
  )
}

// Separate show function
function show = (event, x, y) => {
  const contextMenu = document.getElementById('context-menu')
  contextMenu.style.top = y + 'px'
  contextMenu.style.left = x + 'px'
  contextMenu.classList.add('show')
  
  const handleClick = (e) => {
    e.preventDefault()
    if(e.target.id === 'edit') {
      const taskData = {
        id: event.id,
        title: event.title.replace(/^[✓∞]\s/, ''),
        date: event.startStr,
        ...event.extendedProps
      }
      openTaskModal(taskData)
    } else if(e.target.id === 'delete') {
      fetch(`${endpointStructure}/tasks/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      })
      .then(() => {
        setTasks(prevTasks => prevTasks.filter(task => task.id != event.id))
      })
      .catch(error => console.error('Error deleting task:', error))
    }
    contextMenu.classList.remove('show')
    document.removeEventListener('click', handleClick)
  }
  
  document.addEventListener('click', handleClick)
}

export default EventContextMenu
export { show }
