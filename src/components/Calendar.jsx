import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useContext } from 'react'
import { TaskContext } from '../context/TaskContext'

function Calendar() {
  const { tasks, openTaskModal, openEmptyTaskModal } = useContext(TaskContext)
  
  // Map tasks to calendar events format
  const events = tasks.map(task => ({
    title: task.title,
    date: task.date,
    extendedProps: {
      id: task.id,
      title: task.title,
      date: task.date,
      description: task.description,
      priority: task.priority,
      date_completed: task.date_completed,
      recurrency: task.recurrency
    }
  }))

  return (
    <section id="calendar">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => openTaskModal(info.event.extendedProps)}
        dateClick={(info) => openEmptyTaskModal(info.dateStr)}
        height="85vh"
      /> 
    </section>
  )
}

export default Calendar