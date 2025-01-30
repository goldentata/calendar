import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import { useContext } from 'react'
import { TaskContext } from '../context/TaskContext'
import { AuthContext } from '../context/AuthContext'

const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;
function Calendar() {
  const { tasks, openTaskModal, openEmptyTaskModal, setTasks } = useContext(TaskContext)
  const { user } = useContext(AuthContext)
  




const getEventClasses = (event) => {
  const classes = [];
  const start_date = new Date(event.start);
  const completed_date = new Date(event.extendedProps.date_completed);
  const is_recurring = event.extendedProps.recurrency !== 'none' && 
                      event.extendedProps.recurrency !== null && 
                      event.extendedProps.recurrency !== "";

  // Add completion status
  if ((completed_date >= start_date && is_recurring) || 
      (!is_recurring && completed_date != "Invalid Date")) {
    classes.push('completed');
  }

  // Add priority class
  if (event.extendedProps.priority) {
    classes.push(event.extendedProps.priority);
  }

  return classes.join(' ');
};

const transformEvents = (tasks) => {
  return tasks.map(task => {
    const baseEvent = {
      id: task.id,
      title: getEventTitle(task),
      start: task.date,
      className: getEventClasses({
        start: task.date,
        extendedProps: {
          date_completed: task.date_completed,
          recurrency: task.recurrency,
          priority: task.priority
        }
      }),
      extendedProps: {
        description: task.description,
        priority: task.priority,
        date_completed: task.date_completed,
        recurrency: task.recurrency,
        id : task.id
      }
    };

    // Add rrule for recurring events
    if (task.recurrency !== 'none' && task.recurrency !== null && task.recurrency !== "") {
      baseEvent.rrule = {
        freq: task.recurrency,
        interval: 1,
        dtstart: task.date
      };
    }

    return baseEvent;
  });
};

const getEventTitle = (task) => {
  const start_date = new Date(task.date);
  const completed_date = new Date(task.date_completed);
  const is_recurring = task.recurrency !== 'none' && 
                      task.recurrency !== null && 
                      task.recurrency !== "";
  
  let prefix = '';
  if ((completed_date >= start_date && is_recurring) || 
      (!is_recurring && completed_date != "Invalid Date")) {
    prefix = '✓ ';
  } else if (is_recurring) {
    prefix = '∞ ';
  }
  
  return prefix + task.title;
};



  return (
    <section id="calendar">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, rrulePlugin]}
        initialView="dayGridMonth"
        events={transformEvents(tasks)}
        eventClick={(info) => {
          const taskData = {
            id: info.event.id,
            title: info.event.title.replace(/^[✓∞]\s/, ''), // Remove prefix
            date: info.event.startStr,
            ...info.event.extendedProps
          };
          openTaskModal(taskData);
        }}
        dateClick={(info) => openEmptyTaskModal(info.dateStr)}
        editable={true}
        eventDidMount={(info) => {
          const completedDate  = info.event.extendedProps.date_completed;
          const startDate = info.event.startStr;
          if(completedDate < startDate) {
            if(info.event.extendedProps.recurrency !== 'none' && info.event.extendedProps.recurrency !== null && info.event.extendedProps.recurrency !== "") {
              info.el.classList.remove('completed')
              if(!info.event.title.startsWith('∞')) {
                info.event.setProp('title', '∞ ' + info.event.title.replace(/^[✓]\s/, ''))
              }
            }
          }
        }}
        firstDay={1}

        eventDrop={(info) => {
          // We'll handle updating the "date" in the database.
          const updatedTask = {
            ...info.event.extendedProps,
            date: info.event.startStr
          }


          // PUT or PATCH request to update the task in your API
          fetch(endpointStructure+`/tasks/${updatedTask.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.access_token}`
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
       
        height="85vh"
      /> 
    </section>
  )
}

export default Calendar