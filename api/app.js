const express = require('express');
const cors = require('cors');
const supabase = require('./config/db');
const OpenAI = require('openai');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser.json());
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

const endpointStructure = process.env.ENDPOINT_STRUCTURE;

console.log('Endpoint structure:', endpointStructure);


// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).send('No token provided');
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error('Auth error:', error);
      return res.status(401).send('Invalid token');
    }
    
    if (!user) {
      return res.status(401).send('No user found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).send('Authentication failed');
  }
};

app.get(endpointStructure + '/chat', authenticateUser, async (req, res) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching chat:', error);
    res.status(500).send('Server error');
    return;
  } 

  res.json(data);
});


app.delete(endpointStructure + '/chat', authenticateUser, async (req, res) => {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Error deleting chat:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json({ message: 'Chat history cleared' });
});

/***************************************FUNCTIONS THAT CHAT GPT CAN USE **********************************************************/
const createTask = async (title, description, date, priority, userId) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, description, date, priority, user_id: userId }])
    .select();

  if (error) {
    console.error('Error creating task:', error);
    throw new Error('Error creating task');
  }

  return data[0];
};

const updateTask = async (taskId, updates, userId) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error updating task:', error);
    throw new Error('Error updating task');
  }

  return data[0];
};
/***************************************FUNCTIONS THAT CHAT GPT CAN USE **********************************************************/

app.post(endpointStructure + '/chat-stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;
  let chatHistory = [];

  const { data: rows, error: fetchError } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('Error fetching chat history:', fetchError);
    res.status(500).send('Server error');
    return;
  }

  chatHistory = rows.map(row => ({ role: 'user', content: row.message }));
  chatHistory.push({ role: 'user', content: message });

  try {
    var todays_date = new Date().toISOString().split('T')[0];
    var day = new Date().getDay();
    chatHistory.push({
      role: 'system',
      content: `It is ${todays_date} and it is ${day} day of the week. When creating tasks, use the user ID: ${userId}`
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const functions = [
      {
        name: 'createTask',
        description: 'Create a new task',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date' },
            priority: { type: 'string' },
            userId: { type: 'string' }
          },
          required: ['title', 'description', 'date', 'priority', 'userId']
        }
      },
      {
        name: 'updateTask',
        description: 'Update an existing task',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            updates: { type: 'object' },
            userId: { type: 'string' }
          },
          required: ['taskId', 'updates', 'userId']
        }
      }
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatHistory,
      functions,
      store: true,
      stream: true,
    });

    let fullText = '';
    let currentFunctionCall = null;
    let functionCalls = [];
    
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      fullText += token;
      res.write(token);
    
      if (chunk.choices[0]?.delta?.function_call) {
        const { name, arguments: args } = chunk.choices[0].delta.function_call;
        
        if (name) {
          // Start new function call
          currentFunctionCall = { name, arguments: '' };
        }
        
        if (args && currentFunctionCall) {
          // Append arguments
          currentFunctionCall.arguments += args;
          
          // If we detect end of JSON object, save the complete function call
          if (args.includes('}')) {
            functionCalls.push(currentFunctionCall);
            currentFunctionCall = null;
          }
        }
      }
    }
    

    for (const functionCall of functionCalls) {
      try {
        const parsedArgs = JSON.parse(functionCall.arguments);
        if (functionCall.name === 'createTask') {
          const { title, description, date, priority } = parsedArgs;
          fullText += '\nTask created successfully!';
          res.write(fullText);
          await createTask(title, description, date, priority, userId); // Use stored userId
        } else if (functionCall.name === 'updateTask') {
          const { taskId, updates } = parsedArgs;
          fullText += '\nTask updated successfully!';
          res.write(fullText);
          await updateTask(taskId, updates, userId); // Use stored userId
        }
      } catch (error) {
        console.error('Error processing function call:', error);
      }
    }

    
    res.end();
    const { data, error } = await supabase
      .from('chat_history')
      .insert([{ message, response: fullText, user_id: req.user.id }])
      .select();

    if (error) {
      console.error('Error saving chat:', error);
    }

  } catch (error) {
    console.error('Error in /chat-stream:', error);
    if (!res.headersSent) {
      res.status(500).send(error.message);
    }
  }
});


app.get(endpointStructure + '/tasks', authenticateUser, async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json(data);
});

app.post(endpointStructure + '/tasks', authenticateUser, async (req, res) => {
  const { title, description, date, priority, date_completed, recurrency } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, description, date, priority, date_completed, recurrency, user_id: req.user.id }])
    .select();

  const object_id = data[0].id;

  if (error) {
    console.error('Error adding task:', error);
    res.status(500).send('Server error');
    return;
  } else{
    const { data, error } = await supabase
      .from('history_logs')
      .insert([{ object_type: 'task', object_id: object_id, user_id: req.user.id, action: 'create', note: 'Task created: '+title + ' with date: '+date }]);
  }

  res.status(201).json(data[0]);
});


app.put(endpointStructure + '/tasks/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { title, description, date, priority, date_completed, recurrency } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ title, description, date, priority, date_completed, recurrency })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) {
    console.error('Error updating task:', error);
    res.status(500).send('Server error');
    return;
  } else{
        const { data, error } = await supabase
          .from('history_logs')
          .insert([{ object_type: 'task', object_id: id, user_id: req.user.id, action: 'update', note: 'Task updated: '+title + ' with date: '+date }]);
  }

  res.json(data[0]);
});

app.put(endpointStructure + '/tasks/:id/complete', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { date_completed } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ date_completed })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) {
    console.error('Error completing task:', error);
    res.status(500).send('Server error');
    return;
  } else {
            const { data, error } = await supabase
              .from('history_logs')
              .insert([{ object_type: 'task', object_id: id, user_id: req.user.id, action: 'complete', note: 'Task completed with date: '+date_completed }]);
  }

  res.json(data[0]);
});

app.put(endpointStructure + '/tasks/:id/reschedule', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ date })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) {
    console.error('Error rescheduling task:', error);
    res.status(500).send('Server error');
    return;
  } else{
    const { data, error } = await supabase
      .from('history_logs')
      .insert([{ object_type: 'task', object_id: id, user_id: req.user.id, action: 'reschedule', note: 'Task ID: '+id+'rescheduled with date: '+date }]);
  }

  res.json(data[0]);
});


app.delete(endpointStructure + '/tasks/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Server error');
    return;
  } else{
    const { data, error } = await supabase
      .from('history_logs')
      .insert([{ object_type: 'task', object_id: id, user_id: req.user.id, action: 'delete', note: 'Task ID: '+id+' deleted' }]);
  }

  res.status(204).send();
});

app.get(endpointStructure + '/notes', authenticateUser, async (req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', req.user.id)
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    res.status(500).send('Server error');
    return;
  } 

  res.json(data);
});

app.post(endpointStructure + '/notes', authenticateUser, async (req, res) => {
  const { title, content } = req.body;

  const { data, error } = await supabase
    .from('notes')
    .insert([{ title, content, user_id: req.user.id }])
    .select();

    const object_id = data[0].id;

  if (error) {
    console.error('Error adding note:', error);
    res.status(500).send('Server error');
    return;
  } else{
    const { data, error } = await supabase
      .from('history_logs')
      .insert([{ object_type: 'note', object_id: object_id, user_id: req.user.id, action: 'create', note: 'Note created: '+title }]);
  }

  res.status(201).json(data[0]);
});

app.put(endpointStructure + '/notes/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  const { data, error } = await supabase
    .from('notes')
    .update({ title, content })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) {
    console.error('Error updating note:', error);
    res.status(500).send('Server error');
    return;
  } else {
    const { data, error } = await supabase
      .from('history_logs')
      .insert([{ object_type: 'note', object_id: id, user_id: req.user.id, action: 'update', note: 'Note updated: '+title }]);
  }

  res.json(data[0]);
});

app.delete(endpointStructure + '/notes/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Error deleting note:', error);
    res.status(500).send('Server error');
    return;
  } else {
    const { data, error } = await supabase
      .from('history_logs')
      .insert([{ object_type: 'note', object_id: id, user_id: req.user.id, action: 'delete', note: 'Note ID: '+id+' deleted' }]);
  }

  res.status(204).send();
});

// routing path
app.get(endpointStructure + '/', (req, res) => {
  res.send('Wrong endpoint!');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});