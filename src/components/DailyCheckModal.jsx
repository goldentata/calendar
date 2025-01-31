import { useContext, useEffect, useState } from 'react'
import { TaskContext } from '../context/TaskContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faQuestion, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../context/AuthContext'

const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;
export default function DailyCheckModal() {
  const { user } = useContext(AuthContext)
  const { tasks, setTasks } = useContext(TaskContext)

  const [showModal, setShowModal] = useState(false)
  const [unresolvedTasks, setUnresolvedTasks] = useState([])

  useEffect(() => {
    
    // Check tasks from "todayt"
    const today = new Date()
    const dateString = today.toISOString().split('T')[0]

    // Filter tasks that are before today & not completed
    const tasksToHandle = tasks.filter(t =>
      t.date < dateString &&
      (!t.date_completed || t.date_completed === '' || t.date_completed === null)
    )

    if (JSON.stringify(tasksToHandle) !== JSON.stringify(unresolvedTasks)) {
      setUnresolvedTasks(tasksToHandle)
    }    


    const recurringTasksToHandle = tasks.filter(t => t.recurrency !== 'none' & t.recurrency!==null && t.recurrency!="")
    // filter recurring tasks and remove those that date starts after today
    recurringTasksToHandle.forEach(task => {
        const dateStarted = new Date(task.date)
        const todaysDate = new Date()
        if (dateStarted > todaysDate) {
            recurringTasksToHandle.splice(recurringTasksToHandle.indexOf(task), 1)
        }
    })

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
                  lastOccurance = dateStarted.setMonth(dateStarted.getMonth() - 1)

              break
              case 'yearly':
                  while(dateStarted < todaysDate) {
                      dateStarted.setFullYear(dateStarted.getFullYear() + 1)
                  }
                  lastOccurance = dateStarted.setFullYear(dateStarted.getFullYear() - 1)
              break
          }

          lastOccurance = new Date(lastOccurance).toISOString().split('T')[0]

          
          

          // if there's been an occurance of the event since the last completion, add it to the list
          if (task.date_completed < lastOccurance) {
              tasksToHandle.push(task)
          }
        
    });

    // check for duplicates
    const uniqueTasks = Array.from(new Set(tasksToHandle.map(task => task.id)))
    .map(id => tasksToHandle.find(task => task.id === id));



    if (JSON.stringify(uniqueTasks) !== JSON.stringify(unresolvedTasks)){
      setUnresolvedTasks(uniqueTasks)
      if(uniqueTasks.length > 0){
        setShowModal(true)
      }
    }
  }, [tasks])

  const handleComplete = (selectedTask) => {
    const date_completed = new Date().toISOString().split('T')[0];
    
        const updatedTask = {  date_completed: date_completed }
        fetch(endpointStructure+`/tasks/${selectedTask.id}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}` 
          },
          body: JSON.stringify(updatedTask)
        })
          .then(response => response.json())
          .then(data => {
           // setTasks(prevTasks => prevTasks.map(task => (task.id == data.id ? data : task)))
         //   setShowModal(false)
          }
          )
          .catch(error => console.error('Error updating task:', error))
  }

  const handleReschedule = (selectedTask) => {
    var todays_date = new Date().toISOString().split('T')[0];
    const updatedTask = { date: todays_date }
    fetch(endpointStructure+`/tasks/${selectedTask.id}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.access_token}` 
      },
      body: JSON.stringify(updatedTask)
    })
      .then(response => response.json())
      .then(data => {
       // setTasks(prevTasks => prevTasks.map(task => (task.id == data.id ? data : task)))
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
      {unresolvedTasks.map((task, index) => (
        <div key={index}>
            
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