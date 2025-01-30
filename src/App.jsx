import './assets/App.css'
import './assets/Calendar.css'
import Header from './components/Header'
import Main from './components/Main' 
import Footer from './components/Footer'
import { NoteProvider } from './context/NoteContext'
import { TaskProvider } from './context/TaskContext'
import { ChatProvider } from './context/ChatContext'
import { AuthProvider, AuthContext } from './context/AuthContext'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/SignUp'
import { useContext, useEffect } from 'react'


function AppContent() {

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Main />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}


function App() {
  return (
    <>
    <AuthProvider>
      <ChatProvider>
        <TaskProvider>
          <NoteProvider>
            <AppContent />
          </NoteProvider>
        </TaskProvider>
      </ChatProvider>
    </AuthProvider>
    </>
  )
}

export default App
