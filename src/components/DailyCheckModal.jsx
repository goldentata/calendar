import { useContext, useEffect, useState } from 'react'
import { TaskContext } from '../context/TaskContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faQuestion, faCalendar } from '@fortawesome/free-solid-svg-icons'

export default function DailyCheckModal() {
  const { tasks, setTasks } = useContext(TaskContext)
  const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')
    const [priority, setPriority] = useState('')
    const [date_completed, setDateCompleted] = useState('')
    const [recurrency, setRecurrency] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [unresolvedTasks, setUnresolvedTasks] = useState([])

  useEffect(() => {
    // Check tasks from "yesterday"
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateString = yesterday.toISOString().split('T')[0]

    const tasksToHandle = tasks.filter(t => t.date < dateString && !t.date_completed) 

    const recurringTasksToHandle = tasks.filter(t => t.recurrency !== 'none' & t.recurrency!==null && t.recurrency!="")

    // check if the tasksToHandle are recurring if so, check if it's last occurance was after the completion date
    recurringTasksToHandle.forEach(task => {
        const dateStarted = new Date(task.date)
        const todaysDate = new Date()
        let lastOccurance = dateStarted;
        switch(task.recurrency) {
            case 'daily':
                // keep adding days until the last occurance is the last one before today
                while(dateStarted < todaysDate) {
                    // check if it won't be more than today
                    dateStarted.setDate(dateStarted.getDate() + 1)
                }
                lastOccurance = dateStarted.setDate(dateStarted.getDate() - 1)
            break
            case 'weekly':
                while(dateStarted < todaysDate) {
                    dateStarted.setDate(dateStarted.getDate() + 7)
                }
                lastOccurance = dateStarted.setDate(dateStarted.getDate() - 7)     
            break
            case 'monthly':
                while(dateStarted < todaysDate) {
                    dateStarted.setMonth(dateStarted.getMonth() + 1)
                }
                lastOccurance = dateStarted.setDate(dateStarted.getMonth() - 1)
            break
            case 'yearly':
                while(dateStarted < todaysDate) {
                    dateStarted.setFullYear(dateStarted.getFullYear() + 1)
                }
                lastOccurance = dateStarted.setDate(dateStarted.getFullYear() - 1)
            break
        }

        lastOccurance = new Date(lastOccurance).toISOString().split('T')[0]

        console.log('completed' , task.date_completed)
        console.log(" todaysDate: ", todaysDate)
        console.log("Last occurance: ", lastOccurance)

        // if there's been an occurance of the event since the last completion, add it to the list
        if (task.date_completed < lastOccurance) {
            tasksToHandle.push(task)
        }
    });


    

    if (tasksToHandle.length > 0) {
      setUnresolvedTasks(tasksToHandle)
      setShowModal(true)
    }
  }, [tasks])

  const handleComplete = (selectedTask) => {
    const date_completed = new Date().toISOString().split('T')[0];
    
        const updatedTask = {  date_completed: date_completed }
        fetch(`http:///api/tasks/${selectedTask.id}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedTask)
        })
          .then(response => response.json())
          .then(data => {
            setTasks(prevTasks => prevTasks.map(task => (task.id == data.id ? data : task)))
            setShowModal(false)
          }
          )
          .catch(error => console.error('Error updating task:', error))
  }

  const handleReschedule = (selectedTask) => {
    var todays_date = new Date().toISOString().split('T')[0];
    const updatedTask = { date: todays_date }
    fetch(`/api/tasks/${selectedTask.id}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedTask)
    })
      .then(response => response.json())
      .then(data => {
        setTasks(prevTasks => prevTasks.map(task => (task.id == data.id ? data : task)))
        setShowModal(false)
      }
      )
      .catch(error => console.error('Error updating task:', error))

  }

  
  function helpWithChat(selectedTask) {
    console.log("Help with chat");
    console.log(selectedTask);
    setShowModal(false);
  }


  if (!showModal) return null

  return (
    <div className={`modal ${showModal ? 'show' : ''} `} id="dailyCheckModal">
        <div className="modal-content">
        <div className="modal-header High">
            <h2>You left something behind...</h2>
        </div>
        <div className="modal-body">
      {unresolvedTasks.map(task => (
        <div key={task.id}>
            
          <div className="inline task_reminder">
          {task.title}
          <div className="buttons">
          <button className="square btn-success" onClick={() => handleComplete(task)}> <FontAwesomeIcon icon={faCheck} /> </button>
          <button className="square btn-primary" onClick={() => handleReschedule(task)}> <FontAwesomeIcon icon={faCalendar} /> </button>
          <button className="square " onClick={() => helpWithChat(task)}> <FontAwesomeIcon icon={faQuestion} /> </button>
          </div>
          </div>
        </div>
      ))}
      {/* Optionally hide temporarily, but reappear on reload/timeout */}
    </div>
    </div>
    </div>
  )
}