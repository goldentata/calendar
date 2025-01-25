import Sidebar from './Sidebar'
import Calendar from './Calendar'
import SingleNote from './SingleNote'
import TaskModal from './TaskModal'

function Main() {
    return (
      <main>
        <Sidebar />
        <Calendar />
        <Sidebar>
            <SingleNote />
            <SingleNote />
            <SingleNote />
        </Sidebar>
        <TaskModal />
      </main>
    )
  }
  
  export default Main