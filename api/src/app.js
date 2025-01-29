const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const app = express();

app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Endpoint for tasks
app.get('/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', (err, rows) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).send('Server error');
      return;
    }
    res.json(rows);
  });
});

// Endpoint to add a new task
app.post('/tasks', (req, res) => {
  const { title, description, date, priority, date_completed, recurrency } = req.body;
  console.log(req.body);
  db.run(
    'INSERT INTO tasks (title, description, date, priority, date_completed, recurrency) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, date, priority, date_completed, recurrency],
    function (err) {
      if (err) {
        console.error('Error adding task:', err);
        res.status(500).send('Server error');
        return;
      }
      res.status(201).json({ id: this.lastID, title, description, date, priority, date_completed, recurrency });
    }
  );
});

// Endpoint to update an existing task
app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, date, priority, date_completed, recurrency } = req.body;
  console.log(req.body);
  db.run(
    'UPDATE tasks SET title = ?, description = ?, date = ?, priority = ?, date_completed = ?, recurrency = ? WHERE id = ?',
    [title, description, date, priority, date_completed, recurrency, id],
    function (err) {
      if (err) {
        console.error('Error updating task:', err);
        res.status(500).send('Server error');
        return;
      }
      res.json({ id, title, description, date, priority, date_completed, recurrency });
    }
  );
});

// Endpoint to delete a task
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('Error deleting task:', err);
        res.status(500).send('Server error');
        return;
      }
      res.status(204).send();
    });
  });

// Endpoint for notes
app.get('/notes', (req, res) => {
  db.all('SELECT * FROM notes', (err, rows) => {
    if (err) {
      console.error('Error fetching notes:', err);
      res.status(500).send('Server error');
      return;
    }
    res.json(rows);
  });
});

app.post('/notes', (req, res) => {
    const { title, content } = req.body;
    db.run(
        'INSERT INTO notes (title, content) VALUES (?, ?)',
        [title, content],
        function (err) {
        if (err) {
            console.error('Error adding note:', err);
            res.status(500).send('Server error');
            return;
        }
        res.status(201).json({ id: this.lastID, title, content });
        }
    );
    }
);

app.put('/notes/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    db.run(
        'UPDATE notes SET title = ?, content = ?, priority = ?, date_completed = ?, recurrency = ? WHERE id = ?',
        [title, content, id],
        function (err) {
        if (err) {
            console.error('Error updating note:', err);
            res.status(500).send('Server error');
            return;
        }
        res.json({ id, title, content });
        }
    );
    }
);

app.delete('/notes/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM notes WHERE id = ?', [id], function (err) {
        if (err) {
        console.error('Error deleting note:', err);
        res.status(500).send('Server error');
        return;
        }
        res.status(204).send();
    });
    }
);

// routing path
app.get('/', (req, res) => {
    res.send('Wrong endpoint!');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});