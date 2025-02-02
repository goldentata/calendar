const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey,  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

async function createTables() {
  // Create tasks table
  const { error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (tasksError) {
    const { error: createTasksError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          date TEXT
        );
      `
    });

    if (createTasksError) {
      console.error('Error creating tasks table:', createTasksError);
    } else {
      console.log('Tasks table created successfully.');
    }
  }

  // Create notes table
  const { error: notesError } = await supabase
    .from('notes')
    .select('*')
    .limit(1);

  if (notesError) {
    const { error: createNotesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT
        );
      `
    });

    if (createNotesError) {
      console.error('Error creating notes table:', createNotesError);
    } else {
      console.log('Notes table created successfully.');
    }
  }

  // Create chat_history table
  const { error: chatHistoryError } = await supabase
    .from('chat_history')
    .select('*')
    .limit(1);

  if (chatHistoryError) {
    const { error: createChatHistoryError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_history (
          id SERIAL PRIMARY KEY,
          message TEXT NOT NULL,
          response TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (createChatHistoryError) {
      console.error('Error creating chat_history table:', createChatHistoryError);
    } else {
      console.log('Chat history table created successfully.');
    }
  }
}


module.exports = supabase;