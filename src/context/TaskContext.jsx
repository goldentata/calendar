import { createContext, useState, useEffect } from 'react';

export const TaskContext = createContext();

export function TaskProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);



    useEffect(() => {
        fetch('/api/tasks')
            .then(response => response.json())
            .then(data => setTasks(data))
            .catch(error => console.error('Error fetching tasks:', error));
    }, []);

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