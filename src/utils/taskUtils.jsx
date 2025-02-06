export const handleDelete = async (taskId, user, setTasks, setIsModalOpen, endpointStructure, setIsLoaderOn) => {
  if (setIsLoaderOn) setIsLoaderOn(true);
  
  try {
    await fetch(endpointStructure + `/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.access_token}`
      },
    });
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (setIsModalOpen) setIsModalOpen(false);
  } catch (error) {
    console.error('Error deleting task:', error);
  } finally {
    if (setIsLoaderOn) setIsLoaderOn(false);
  }
};
export const extractTaskData = (event) => {
  return {
    id: event.id,
    title: event.title,
    date: event.startStr,
    ...event.extendedProps
  };
};
export const handleComplete = async (task, user, setTasks, setIsModalOpen, endpointStructure, setIsLoaderOn) => {
  if (setIsLoaderOn) setIsLoaderOn(true);

  const updatedTask = {
    ...task,
    date_completed: new Date().toISOString()
  };

  try {
    const response = await fetch(endpointStructure + `/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.access_token}`
      },
      body: JSON.stringify(updatedTask)
    });
    
    const data = await response.json();
    setTasks(prevTasks => prevTasks.map(t => (t.id === data.id ? data : t)));
    if (setIsModalOpen) setIsModalOpen(false);
  } catch (error) {
    console.error('Error completing task:', error);
  } finally {
    if (setIsLoaderOn) setIsLoaderOn(false);
  }
};