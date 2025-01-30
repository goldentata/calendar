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
console.log(endpointStructure);

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get(endpointStructure+'/chat', async (req, res) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching chat:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json(data);
});

app.delete(endpointStructure+'/chat', async (req, res) => {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .neq('id', 0); // Delete all rows

  if (error) {
    console.error('Error deleting chat:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json({ message: 'Chat history cleared' });
});

app.post(endpointStructure+'/chat-stream', async (req, res) => {
  const { message } = req.body;
  let chatHistory = [];

  const { data: rows, error: fetchError } = await supabase
    .from('chat_history')
    .select('*')
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
      content: 'The above is a conversation with an AI assistant. Try to keep your replies short, but helpful. If you do not have enough data to give an accurate answer please say so. This is a conversation so user will follow with answers. It is ' + todays_date + ' and it is ' + day + ' day of the week.'
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatHistory,
      store: true,
      stream: true,
    });

    let fullText = '';

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      fullText += token;
      res.write(token);
    }

    const { data, error } = await supabase
      .from('chat_history')
      .insert([{ message, response: fullText }]).select();

    if (error) {
      console.error('Error saving chat:', error);
      res.status(500).send('Server error');
      return;
    }


    var finalChunk = `\n[[DONE]]`;
    finalChunk += `{ "id": ${data[0].id}, "message": "${message}", "response": "${fullText}" }`;
    res.write(finalChunk);
    res.end();

  } catch (error) {
    console.error('Error in /chat-stream:', error);
    res.status(500).send(error.message);
  }
});

app.post(endpointStructure+'/chat', async (req, res) => {
  const { message } = req.body;
  let chatHistory = [];

  const { data: rows, error: fetchError } = await supabase
    .from('chat_history')
    .select('*')
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('Error fetching chat history:', fetchError);
    res.status(500).send('Server error');
    return;
  }

  chatHistory = rows.map(row => ({ role: 'user', content: row.message }));
  chatHistory.push({ role: 'user', content: message });

  try {
    chatHistory.push({
      role: 'system',
      content: 'The above is a conversation with an AI assistant. Try to keep your replies short, but helpful. If you do not have enough data to give an accurate answer please say so. This is a conversation so user will follow with answers.'
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatHistory,
    });

    const aiResponse = completion.choices[0].message.content;
    const formattedResponse = formatResponse(aiResponse);

    const { data, error } = await supabase
      .from('chat_history')
      .insert([{ message, response: formattedResponse }]).select();

    if (error) {
      console.error('Error saving chat:', error);
      res.status(500).send('Server error');
      return;
    }

    res.json({
      id: data[0].id,
      message,
      response: formattedResponse
    });

  } catch (error) {
    console.error('Error with OpenAI:', error);
    res.status(500).send('AI Service error');
  }
});

app.get(endpointStructure+'/tasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*');

    console.log(data);

  if (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json(data);
});

app.post(endpointStructure+'/tasks', async (req, res) => {
  const { title, description, date, priority, date_completed, recurrency } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, description, date, priority, date_completed, recurrency }]).select();

  if (error) {
    console.error('Error adding task:', error);
    res.status(500).send('Server error');
    return;
  }

  res.status(201).json(data[0]);
});

app.put(endpointStructure+'/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, date, priority, date_completed, recurrency } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ title, description, date, priority, date_completed, recurrency })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating task:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json(data[0]);
});

app.put(endpointStructure+'/tasks/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { date_completed } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ date_completed })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error completing task:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json(data[0]);
});

app.put(endpointStructure+'/tasks/:id/reschedule', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ date })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error rescheduling task:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json(data[0]);
});

app.delete(endpointStructure+'/tasks/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Server error');
    return;
  }

  res.status(204).send();
});

app.get(endpointStructure+'/notes', async (req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json(data);
});

app.post(endpointStructure+'/notes', async (req, res) => {
  const { title, content } = req.body;

  const { data, error } = await supabase
    .from('notes')
    .insert([{ title, content }]).select();

  if (error) {
    console.error('Error adding note:', error);
    res.status(500).send('Server error');
    return;
  }

  res.status(201).json(data[0]);
});

app.put(endpointStructure+'/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  const { data, error } = await supabase
    .from('notes')
    .update({ title, content })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating note:', error);
    res.status(500).send('Server error');
    return;
  }

  res.json(data[0]);
});

app.delete(endpointStructure+'/notes/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting note:', error);
    res.status(500).send('Server error');
    return;
  }

  res.status(204).send();
});

// routing path
app.get(endpointStructure+'/', (req, res) => {
  res.send('Wrong endpoint!');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});