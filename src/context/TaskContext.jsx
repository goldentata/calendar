import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext'

export const TaskContext = createContext();

const endpointStructure = await import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;
export function TaskProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useContext(AuthContext)



  useEffect(() => {
    if (user) {
      fetch(endpointStructure + '/tasks', {
        headers: {
          'Authorization': `Bearer ${user.access_token}` // Add this
        }
      })
      .then(response => response.json())
      .then(data => setTasks(data))
      .catch(error => console.log(error))
    }
  }, [user])


    const openTaskModal = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const openEmptyTaskModal = (date) => {
        setSelectedTask({ id: '', title: '', description: '', date, priority: '', date_completed: '', recurrency: '' });
        setIsModalOpen(true);
    };

    return (
        <TaskContext.Provider value={{ tasks, setTasks, selectedTask, isModalOpen, setIsModalOpen, openTaskModal, openEmptyTaskModal }}>
            {children}
        </TaskContext.Provider>
    );
}