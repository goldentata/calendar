const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const OpenAI = require('openai');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser.json());
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

function formatResponse(text) {
  let formatted = text;

  // Find and format numbered lists properly
  formatted = formatted.replace(/(?:(^|\n)(?:\d+\.\s+[^\n]+\n?)+)/g, match => {
      const listItems = match.trim().split('\n').map(item => {
          return `<li>${item.replace(/^\d+\.\s+/, '')}</li>`;
      }).join('');
      return `<ol>${listItems}</ol>`;
  });

  // Convert "Steps:" or "Step-by-step:" to ordered list
  formatted = formatted.replace(/(?:Steps|Step-by-step):\n((?:(?:\d+\.|[-*])\s.*\n?)*)/g, 
      (match, list) => {
          const listItems = list.trim().split('\n').map(item => {
              return `<li>${item.replace(/(?:\d+\.|-|\*)\s+/, '')}</li>`;
          }).join('');
          return `<ol>${listItems}</ol>`;
      }
  );

  // Convert bold text
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert paragraphs (excluding lists)
  formatted = formatted.split('\n\n')
      .map(p => p.includes('<ol>') ? p : `<p>${p}</p>`)
      .join('');

  return formatted;
}

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/chat', (req, res) => {
  db.all('SELECT * FROM chat_history ORDER BY id ASC', (err, rows) => {
    if (err) {
      console.error('Error fetching chat:', err);
      res.status(500).send('Server error');
      return;
    }
    console.log(rows);
    res.json(rows);
  });
});

// clear chat
app.delete('/chat', (req, res) => {
  db.run('DELETE FROM chat_history', function (err) {
    if (err) {
      console.error('Error deleting chat:', err);
      res.status(500).send('Server error');
      return;
    }
    res.json({ message: 'Chat history cleared' });
  });
});

app.post('/chat-stream', async (req, res) => {
  
  const openai = new OpenAI();
  const { message } = req.body;
  let chatHistory = [];
  db.all('SELECT * FROM chat_history ORDER BY id ASC', async (err, rows) => {
    if (err) {
      console.error('Error fetching chat history:', err);
      res.status(500).send('Server error');
      return;
    }
    chatHistory = rows.map(row => ({ role: 'user', content: row.message }));
  
  chatHistory.push({ role: 'user', content: message });
  try {
    var todays_date = new Date().toISOString().split('T')[0];
    var day = new Date().getDay();
    chatHistory.push({ role: 'system', content: 'The above is a conversation with an AI assistant. Try to keep your replies short, but helpful. If you do not have enough data to give an accurate answer please say so. This is a conversation so user will follow with answers. It is ' + todays_date + ' and it is ' + day + ' day of the week.' });

    

    // Required for chunked encoding in many Node/Express setups
    // so the client receives partial chunks rather than buffering everything.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Make a streaming request to OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatHistory,
      store: true, 
      stream: true,
    });

    // We'll accumulate everything to store in DB at the end:
    let fullText = '';

    // Stream tokens back to the client as soon as they arrive
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      fullText += token;
      // Write each token to the response immediately
      res.write(token);
    }


    // insert to db
    db.run(
      'INSERT INTO chat_history (message, response) VALUES (?, ?)',
      [message, fullText],
      function (err) {
        if (err) {
          console.error('Error saving chat:', err);
          res.status(500).send('Server error');
          return;
        }
        var finalChunk = `\n[[DONE]]`;

        //{ id, message, response }
        finalChunk += `{ "id": ${this.lastID}, "message": "${message}", "response": "${fullText}" }`;
        res.write(finalChunk);
        res.end();
      }
    );

    


  } catch (error) {
    console.error('Error in /chat-stream:', error);
    res.status(500).send(error.message);
  }
});
});

// Endpoint to send message and get AI response
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  

  // Fetch all previous messages
  let chatHistory = [];
  db.all('SELECT * FROM chat_history ORDER BY id ASC', async (err, rows) => {
    if (err) {
      console.error('Error fetching chat history:', err);
      res.status(500).send('Server error');
      return;
    }
    chatHistory = rows.map(row => ({ role: 'user', content: row.message }));
  
  chatHistory.push({ role: 'user', content: message });

  try {

    // add system prompt to chat history
    chatHistory.push({ role: 'system', content: 'The above is a conversation with an AI assistant. Try to keep your replies short, but helpful. If you do not have enough data to give an accurate answer please say so. This is a conversation so user will follow with answers.' });

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatHistory,
    });

    const aiResponse = completion.choices[0].message.content;
    const formattedResponse = formatResponse(aiResponse);


   

    // Save to database
    db.run(
      'INSERT INTO chat_history (message, response) VALUES (?, ?)',
      [message, formattedResponse],
      function (err) {
        if (err) {
          console.error('Error saving chat:', err);
          res.status(500).send('Server error');
          return;
        }
        res.json({ 
          id: this.lastID, 
          message, 
          response: formattedResponse 
        });
      }
    );
  } catch (error) {
    console.error('Error with OpenAI:', error);
    res.status(500).send('AI Service error');
  }
});

});

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

// Endpoint to complete an existing task
app.put('/tasks/:id/complete', (req, res) => {
  const { id } = req.params;
  const { date_completed } = req.body;
  db.run(
    'UPDATE tasks SET date_completed = ? WHERE id = ?',
    [date_completed, id],
    function (err) {
      if (err) {
        console.error('Error completing task:', err);
        res.status(500).send('Server error');
        return;
      }
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated task:', err);
          res.status(500).send('Server error');
          return;
        }
        res.json(row);
      });
    }
  );
});

// Endpoint to complete an existing task
app.put('/tasks/:id/reschedule', (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  db.run(
    'UPDATE tasks SET date = ? WHERE id = ?',
    [date, id],
    function (err) {
      if (err) {
        console.error('Error completing task:', err);
        res.status(500).send('Server error');
        return;
      }
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated task:', err);
          res.status(500).send('Server error');
          return;
        }
        res.json(row);
      });
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
  db.all('SELECT * FROM notes ORDER BY id DESC', (err, rows) => {
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
        'UPDATE notes SET title = ?, content = ? WHERE id = ?',
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

