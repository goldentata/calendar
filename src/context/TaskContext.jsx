import { createContext, useState, useEffect } from 'react';

export const TaskContext = createContext();

export function TaskProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetch('http://localhost:3000/tasks')
            .then(response => response.json())
            .then(data => setTasks(data))
            .catch(error => console.log(error));
    }, []);

    const openTaskModal = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    return (
        <TaskContext.Provider value={{ tasks, selectedTask, isModalOpen, setIsModalOpen, openTaskModal }}>
            {children}
        </TaskContext.Provider>
    );
}
