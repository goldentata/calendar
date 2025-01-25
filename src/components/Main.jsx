import Sidebar from './Sidebar'
import Calendar from './Calendar'
import SingleNote from './SingleNote'
import TaskModal from './TaskModal'

function Main() {
    return (
      <main>
        <Sidebar title="Chat"/>
        <Calendar />
        <Sidebar title="Notes">
            <SingleNote />
            <SingleNote />
            <SingleNote />
        </Sidebar>
        <TaskModal />
      </main>
    )
  }
  
  export default Main