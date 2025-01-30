import './assets/App.css'
import './assets/Calendar.css'
import Header from './components/Header'
import Main from './components/Main' 
import Footer from './components/Footer'
import { NoteProvider } from './context/NoteContext'
import { TaskProvider } from './context/TaskContext'
import { ChatProvider } from './context/ChatContext'
import { AuthProvider } from './context/AuthContext'
import LoginModal from './components/LoginModal'
import SignupModal from './components/SignupModal'

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <TaskProvider>
          <NoteProvider>
            <div className="App">
              <Header />
              <Main />
              <Footer />
              <LoginModal />
              <SignupModal />
            </div>
          </NoteProvider>
        </TaskProvider>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App