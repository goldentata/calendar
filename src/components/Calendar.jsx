import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { useContext } from 'react'
import { TaskContext  } from '../context/TaskContext'

function Calendar() {

  const { tasks, openTaskModal } = useContext(TaskContext)
  
  // Map tasks to calendar events format
  const events = tasks.map(task => ({
    title: task.title,
    date: task.date,
    extendedProps: {
      title: task.title,
      date : task.date,
      description: task.description
    }
  }))

  return (
    <section id="calendar">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick= {(info) => openTaskModal(info.event.extendedProps)}
        height="85vh"
      /> 
    </section>
  )
}

export default Calendar
