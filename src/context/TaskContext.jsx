import { createContext, useState } from 'react'

export const TaskContext = createContext()

export function TaskProvider({ children }) {

    const [ selectedTask, setSelectedTask ] = useState(null)
    const [ isModalOpen, setIsModalOpen ] = useState(false)

    const tasks = [ 
        { title: "Task 1", description: "Description 1", date: '2025-01-21' },
        { title: "Task 2", description: "Description 2", date: '2025-01-22' },
        { title: "Task 3", description: "Description 3", date: '2025-02-03' },
    ]

    const openTaskModal = (task) => {
        setSelectedTask(task)
        setIsModalOpen(true)
    }

    return (
        <TaskContext.Provider value={{     tasks, 
            selectedTask, 
            isModalOpen, 
            setIsModalOpen,
            openTaskModal  }}>
            {children}
        </TaskContext.Provider>
    )
}

