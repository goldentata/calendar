const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database file
const dbPath = path.resolve(__dirname, 'calendar.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');

    // check if there are entries, if there are - skip

    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT
      )
    `);

    // Insert dummy data If there are not any yet
    db.run(`SELECT * FROM tasks`, (err, rows) => {
      if (err) {
        db.run(`INSERT INTO tasks (title, description, date) VALUES ('Task 1', 'Description 1', '2025-01-21')`);
        db.run(`INSERT INTO tasks (title, description, date) VALUES ('Task 2', 'Description 2', '2025-01-22')`);
        db.run(`INSERT INTO tasks (title, description, date) VALUES ('Task 3', 'Description 3', '2025-02-03')`);
        db.run(`INSERT INTO notes (title, content) VALUES ('Note 1', 'Content 1')`);
        db.run(`INSERT INTO notes (title, content) VALUES ('Note 2', 'Content 2')`);
      }
    });




  }
});

module.exports = db;