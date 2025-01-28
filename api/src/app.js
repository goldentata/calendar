const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Enable CORS

// Endpoint for tasks
app.get('/tasks', (req, res) => {
  const tasks = [
    { id: 1, title: "Task 1", description: "Description 1", date: '2025-01-21' },
    { id: 2, title: "Task 2", description: "Description 2", date: '2025-01-22' },
    { id: 3, title: "Task 3", description: "Description 3", date: '2025-02-03' },
  ];
  res.json(tasks);
});

// Endpoint for notes
app.get('/notes', (req, res) => {
  const notes = [
    { id: 1, title: "Note 1", content: "Content 1" },
    { id: 2, title: "Note 2", content: "Content 2" },
    { id: 3, title: "Note 3", content: "Content 3" },
  ];
  res.json(notes);
});

// routing path
app.get('/', (req, res) => {
    res.send('Wrong endpoint!');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});