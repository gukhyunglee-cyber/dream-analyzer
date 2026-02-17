const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'dreams.db');

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
    });

    // Create tables
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          birth_date TEXT,
          gender TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('Users table ready');
      });

      // Dreams table
      db.run(`
        CREATE TABLE IF NOT EXISTS dreams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          emotions TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating dreams table:', err);
        else console.log('Dreams table ready');
      });

      // Analyses table
      db.run(`
        CREATE TABLE IF NOT EXISTS analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dream_id INTEGER NOT NULL,
          analysis_text TEXT NOT NULL,
          archetypes TEXT,
          symbols TEXT,
          psychological_state TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating analyses table:', err);
        else console.log('Analyses table ready');
      });
    });

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        reject(err);
      } else {
        console.log('Database initialization complete');
        resolve();
      }
    });
  });
}

function getDb() {
  return new sqlite3.Database(DB_PATH);
}

module.exports = { initDatabase, getDb, DB_PATH };
