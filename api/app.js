const express = require('express');
const cors = require('cors');
const supabase = require('./config/db');
const OpenAI = require('openai');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();
const {Pinecone:PineconeClient} = require('@pinecone-database/pinecone')
const client = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY});
  



app.use(bodyParser.json());
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

const endpointStructure = process.env.ENDPOINT_STRUCTURE;

console.log('Endpoint structure:', endpointStructure);


// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const formatResponseToHtml = (responseText) => {
  // Replace ** with <strong> for bold text
  let formattedText = responseText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert numbered tasks to an ordered list
  formattedText = formattedText.replace(/(\d+)\.\s/g, '<li>').replace(/(\d+)\.\s/g, '</li><li>');
  formattedText = formattedText.replace(/<li>/, '<ol><li>').replace(/<\/li>$/, '</li></ol>');

  return formattedText;
};

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error('Error generating embedding:', err);
    return null;
  }
}


async function upsertToPinecone(vectors, user_id) {
  // vectors: array of { id, values: <embedding array>, metadata }
  try {
    // get your pinecone index
    const index = client.Index(process.env.PINECONE_INDEX);

    // upsert
    const upsertResponse = await index.namespace(user_id).upsert(vectors)

    return upsertResponse;
  } catch (err) {
    console.error('Error upserting vectors to Pinecone:', err);
  }
}

module.exports = {
  generateEmbedding,
  upsertToPinecone,
};





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


app.post(endpointStructure + '/search-vector', authenticateUser, async (req, res) => {
  const { query } = req.body;
  const userId = req.user.id;

  try {
    // 1. Generate embedding from user's query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Use Pinecone to query the top matches
    const index = client.Index(process.env.PINECONE_INDEX);

    const searchResponse = await index.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
    });

    // The "matches" array has results sorted by similarity
    const matches = searchResponse.matches;

    // 3. Return them in the response
    res.json({ matches });
  } catch (error) {
    console.error('Error searching Pinecone:', error);
    res.status(500).send('Error searching');
  }
});

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

  if (error) throw new Error('Error updating task');

  // Refresh Pinecone index
  try {
    const index = client.Index(process.env.PINECONE_INDEX);
    const textForEmbedding = `${updates.title}\n ${updates.date} \n ${updates.description}`;
    const embedding = await generateEmbedding(textForEmbedding);

    if (embedding) {
      await upsertToPinecone([{
        id: taskId.toString(),
        values: embedding,
        metadata: {
          user_id: userId,
          title: updates.title,
          description: updates.description,
          date: updates.date,
          type: 'task',
        },
      }], userId);
    }
  } catch (err) {
    console.error('Error updating Pinecone:', err);
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

  // quick openai query to convert the message to a certain date if user is asking about something like "tomorrow"
  let date_conversion;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 5 seconds timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", 
            content: `Check users message, if it is mentioning a point in time like "what is my schedule tomorrow"
             rewrite users message to explain the context but keep it as you were the author. In example before the good response would be "what is my schedule on Y-m-d". Otherwise respond with the same content, today is  ${new Date().toISOString().split('T')[0]}, which is ${new Date().getDay()} day of the week. 
             Decide whether this question requires some further context that we need from the vector database. Example details we may need are task details, so if user talks about anything that could be a task or event we should search Pinecone.
             RESPOND WITH A JSON OBJECT CONTAINING MESSAGE, PINECONE (true/false)
             `},
          { role: "user", content: message }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const message_conversion = await response.json();


    json_string = message_conversion.choices[0].message.content;

    console.log(json_string);
     date_conversion = JSON.parse(json_string).message;
     if(date_conversion == undefined)
      date_conversion = JSON.parse(json_string).MESSAGE;
    var response_requires_pinecone = JSON.parse(json_string).pinecone;
    if(response_requires_pinecone == undefined)
      response_requires_pinecone = JSON.parse(json_string).PINECONE;


    
    


  } catch (error) {
    console.error('Error with OpenAI API:', error);
    date_conversion = message; // Fallback to the original message
  }

  var tmpMessage = date_conversion;

  // Extract the date from the converted message (assuming the date is in YYYY-MM-DD format)
  const dateMatch = tmpMessage.match(/\d{4}-\d{2}-\d{2}/);
  const queryDate = dateMatch ? dateMatch[0] : null;

  console.log(tmpMessage);
  console.log('-----------------------')

  // NEW: do a Pinecone search with the user's message
  let pineconeContext = '';
  if(response_requires_pinecone==true){
  try {
    const queryEmbedding = await generateEmbedding(tmpMessage);
    const index = client.Index(process.env.PINECONE_INDEX);
    const searchResponse = await index.namespace(userId).query({
      vector: queryEmbedding,
      topK: 8,
      includeMetadata: true,
      filter: queryDate ? { date: queryDate, user_id: userId } : { user_id: userId },
    });

    // Build a context string from the top matches
    if (searchResponse.matches?.length > 0) {
      pineconeContext = searchResponse.matches
        .map((match) => {
          const md = match.metadata;
          // Example: "Task Title: ...; Description: ..."
          return `Task/Event ID: ${match.id}\n Title: ${md.title}\nDescription: ${md.description}\nType: ${md.type}\nDate: ${md.date}\nRecurrency: ${md.recurrency}\nPriority: ${md.priority}`;
        })
        .join('\n\n');
    }
  } catch (error) {
    console.error('Error searching Pinecone in chat-stream:', error);
  }
}

  chatHistory = rows.map(row => ({ role: 'user', content: row.message }));
  chatHistory.push({ role: 'user', content: message });

  try {
    var todays_date = new Date().toISOString().split('T')[0];
    var day = new Date().getDay();
    chatHistory.push({
      role: 'system',
      content: `It is ${todays_date} and it is ${day} day of the week. 
      When creating tasks, use the user ID: ${userId}. Please make sure user may also be asking about their existing tasks`
    });

   
    // Now inject the vector-search results as additional context
    if (pineconeContext) {
      chatHistory.push({
        role: 'system',
        content: `Relevant user data:\n${pineconeContext}`
      });
    }

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
        description: 'Update an existing task. Make sure to always provide all fields, even if they are unchanged.',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'number' },
            updates: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                date: { type: 'string', format: 'date' },
                priority: { type: 'string' },
                recurrency: { type: 'string' }
              }
            }
          },
          required: ['taskId', 'updates']
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
          fullText += `\n<task-proposal>{"title":"${title}","description":"${description}","date":"${date}","priority":"${priority}"}</task-proposal>`;
          res.write(fullText);
          //await createTask(title, description, date, priority, userId); 
        } else if (functionCall.name === 'updateTask') {
          const { taskId, updates } = parsedArgs;
          fullText += `\n<task-update>{"id":${taskId},"title":"${updates.title}","description":"${updates.description}","date":"${updates.date}","priority":"${updates.priority}"}</task-update>`;
          res.write(fullText);
          //await updateTask(taskId, updates, userId); // Use stored userId
        }
      } catch (error) {
        console.error('Error processing function call:', error);
      }
    }

    const cleanTaskProposal = (text) => {
      const createMatch = text.match(/<task-proposal>(.*?)<\/task-proposal>/);
      const updateMatch = text.match(/<task-update>(.*?)<\/task-update>/);
    
      if (createMatch) {
        const proposal = JSON.parse(createMatch[1]);
        return text.replace(createMatch[0], `💡 Sent task proposal: "${proposal.title}"`);
      } else if (updateMatch) {
        const proposal = JSON.parse(updateMatch[1]);
        return text.replace(updateMatch[0], `✏️ Sent update proposal for task: "${proposal.title}"`);
      }
      return text;
    };


    const formattedResponse = formatResponseToHtml(cleanTaskProposal(fullText));


    res.end();
    const { data, error } = await supabase
      .from('chat_history')
      .insert([{ message, response: formattedResponse, user_id: req.user.id }])
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

 // Generate the embedding for the newly created task, then upsert to Pinecone
  try {
    const index = client.Index(process.env.PINECONE_INDEX);
    console.log(index);
    const stats = await index.describeIndexStats();
    if(stats.namespaces[req.user.id] == undefined){
    } else{
      await index.namespace(req.user.id).deleteAll();
    }

    // get all tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id);

      // upsert all tasks to Pinecone
      const embeddings = tasks.map(async (task) => {
          const textForEmbedding = `${task.title}\n ${task.date} \n ${task.description}`;
          const embedding = await generateEmbedding(textForEmbedding);
            if (embedding) {

              // set default values
              if(task.date_completed == null){
                task.date_completed = '';
              }
              if(task.recurrency == null){
                task.recurrency = '';
              }
              if(task.priority == null){
                task.priority = '';
              }


              await upsertToPinecone([
            {
              id: task.id.toString(),
              values: embedding,
              metadata: {
                user_id: task.user_id,
                title: task.title,
                description: task.description,
                date: task.date,
                recurrency: task.recurrency,
                type: 'task',
              },
            },
              ], task.user_id);
            }         
        });
  } catch (err) {
    console.error('Error in upserting new task to Pinecone:', err);
  }

  res.status(201).json(data[0]);
});


app.put(endpointStructure + '/tasks/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { title, description, date, priority, date_completed, recurrency } = req.body;

  // Create an object with only the fields that are not "Unchanged"
  const updates = {};
  if (title !== 'Unchanged') updates.title = title;
  if (description !== 'Unchanged') updates.description = description;
  if (date !== 'Unchanged') updates.date = date;
  if (priority !== 'Unchanged') updates.priority = priority;
  if (date_completed !== 'Unchanged') updates.date_completed = date_completed;
  if (recurrency !== 'Unchanged') updates.recurrency = recurrency;

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
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

module.exports = app;