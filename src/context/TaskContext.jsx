import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './AuthContext'

export const TaskContext = createContext();

const endpointStructure = import.meta.env.VITE_FRONTEND_ENDPOINT_STRUCTURE;
export function TaskProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useContext(AuthContext)
  const { signOut, setShowLoginModal } = useContext(AuthContext);


  const [isLoading, setIsLoading] = useState(true);
    const initRef = useRef(false);
    useEffect(() => {
        if (!user || initRef.current) return;
        initRef.current = true;

        const fetchTasks = async () => {
            try {
                const response = await fetch(endpointStructure + '/tasks', {
                    headers: {
                        'Authorization': `Bearer ${user.access_token}`
                    }
                });

                if (response.status === 401) {
                    // Trigger user logout and show login modal
                    await signOut();
                    setShowLoginModal(true);
                    return;
                }

                const data = await response.json();
                setTasks(data);
                localStorage.setItem('cachedTasks', JSON.stringify(data));
            } catch (error) {
                console.error('Error fetching tasks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [user]);


    const refreshTasks = async () => {
        try {
            const response = await fetch(endpointStructure + '/tasks', {
                headers: {
                    'Authorization': `Bearer ${user.access_token}`
                }
            });
    
            if (response.status === 401) {
                await signOut();
                setShowLoginModal(true);
                return;
            }
    
            const data = await response.json();
            setTasks(data);
            localStorage.setItem('cachedTasks', JSON.stringify(data));
        } catch (error) {
            console.error('Error refreshing tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    
    const openTaskModal = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const openEmptyTaskModal = (date) => {
        setSelectedTask({ id: '', title: '', description: '', date, priority: '', date_completed: '', recurrency: '' });
        setIsModalOpen(true);
    };

    return (
        <TaskContext.Provider value={{ tasks, setTasks, selectedTask, isModalOpen, setIsModalOpen, openTaskModal, openEmptyTaskModal, refreshTasks }}>
            {children}
        </TaskContext.Provider>
    );
}