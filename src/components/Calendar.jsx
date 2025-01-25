import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'

function Calendar() {
  return (
    <section id="calendar">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={[
          // your events here
          { title: 'Event 1', date: '2025-01-20' },
          { title: 'Event 2', date: '2025-01-21' },
          { title: 'Event 3', date: '2025-02-21' },
          { title: 'Event 4', date: '2025-02-02' }
        ]}
        height="85vh"
      /> 
    </section>
  )
}

export default Calendar
