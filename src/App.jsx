import './assets/App.css'
import './assets/Calendar.css'
import Header from './components/Header'
import Main from './components/Main' 
import Footer from './components/Footer'
import { NoteProvider } from './context/NoteContext'
import { TaskProvider } from './context/TaskContext'

function App() {
  return (
    <>
    
    <TaskProvider>
    <NoteProvider>
    <div className="App">
      <Header />
      <Main />
      <Footer />
    </div>
    </NoteProvider>
    </TaskProvider>
    </>
  )
}

export default App
