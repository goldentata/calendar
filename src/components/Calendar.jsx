import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import { useContext } from 'react'
import { TaskContext } from '../context/TaskContext'
function Calendar() {
  const { tasks, openTaskModal, openEmptyTaskModal, setTasks } = useContext(TaskContext)
  
  // Map tasks to calendar events format
  const events = tasks.map(task => ({
    // title: task.date_completed ? "✓ " + task.title : task.title,
    title: task.title,
    date: task.date,
    //className: task.date_completed ? 'completed' : '',
    className: task.date_completed ,
    extendedProps: {
      id: task.id,
      title: task.title,
      date: task.date,
      description: task.description,
      priority: task.priority,
      date_completed: task.date_completed,
      recurrency: task.recurrency
    },
   
  })
)

events.forEach(event => {
  if(event.extendedProps.recurrency !== 'none' && event.extendedProps.recurrency !== null && event.extendedProps.recurrency !== "") {
    event.rrule = {
      freq: event.extendedProps.recurrency ? event.extendedProps.recurrency : 'weekly',
      interval: 1,
      dtstart: event.date,
    }
  }
});

  return (
    <section id="calendar">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, rrulePlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => openTaskModal(info.event.extendedProps)}
        dateClick={(info) => openEmptyTaskModal(info.dateStr)}
        editable={true}
        firstDay={1}

        eventDrop={(info) => {
          // We'll handle updating the "date" in the database.
          const updatedTask = {
            ...info.event.extendedProps,
            date: info.event.startStr
          }
          // PUT or PATCH request to update the task in your API
          fetch(`http://localhost:3000/tasks/${updatedTask.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTask)
          })
            .then(response => response.json())
            .then(data => {
              // Reschedule in your context:
              setTasks(prevTasks =>
                prevTasks.map(task => (task.id == data.id ? data : task))
              )
            })
            .catch(error => console.error('Error updating task date:', error))
        }}
        eventDidMount={(info) => {
          // Modify title after mounting
          var start_date = new Date(info.event.start)
          var completed_date = new Date(info.event.extendedProps.date_completed)
          
          var is_reccuring_event = info.event.extendedProps.recurrency !== 'none' && info.event.extendedProps.recurrency !== null && info.event.extendedProps.recurrency !== ""
 
          // if start is after extendedProps.completed_date then add class "completed"
          if ((completed_date >= start_date && is_reccuring_event) || (!is_reccuring_event && completed_date!="Invalid Date")) {
            info.el.classList.add('completed')
            var title = info.el.getElementsByClassName('fc-event-title')[0]
            title.innerHTML = "✓ " + title.innerHTML
          }

          // if reccurence is not none, null nor empty, add class infinity symbol to the title
          if (is_reccuring_event) {
            var title = info.el.getElementsByClassName('fc-event-title')[0]
            if (completed_date < start_date) {
              title.innerHTML = "∞ " + title.innerHTML
            }
          }

          if (info.event.extendedProps.priority === 'High') {
            info.el.classList.add('High')
          }
          if (info.event.extendedProps.priority === 'Medium') {
            info.el.classList.add('Medium')
          }
          if (info.event.extendedProps.priority === 'Low') {
            info.el.classList.add('Low')
          }
        }}
        height="85vh"
      /> 
    </section>
  )
}

export default Calendar