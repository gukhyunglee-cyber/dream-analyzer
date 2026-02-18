const db = require('./db');

async function initDatabase() {
  console.log('Initializing database tables...');

  try {
    const isPg = db.isPostgres;

    // Users Table
    const userSchema = isPg ?
      `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                birth_date VARCHAR(50),
                gender VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` :
      `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                birth_date TEXT,
                gender TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`;

    await db.query(userSchema);
    console.log('Users table ready');

    // Dreams Table
    const dreamSchema = isPg ?
      `CREATE TABLE IF NOT EXISTS dreams (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                date VARCHAR(50) NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                emotions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` :
      `CREATE TABLE IF NOT EXISTS dreams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                emotions TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`;

    await db.query(dreamSchema);
    console.log('Dreams table ready');

    // Analyses Table
    const analysisSchema = isPg ?
      `CREATE TABLE IF NOT EXISTS analyses (
                id SERIAL PRIMARY KEY,
                dream_id INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
                analysis_text TEXT NOT NULL,
                archetypes TEXT,
                symbols TEXT,
                psychological_state TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` :
      `CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dream_id INTEGER NOT NULL,
                analysis_text TEXT NOT NULL,
                archetypes TEXT,
                symbols TEXT,
                psychological_state TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE
            )`;

    await db.query(analysisSchema);
    console.log('Analyses table ready');

    console.log('Database initialization complete');

  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
}

// Export simplified interface (remove getDb since we use db.js now)
// We keep getDb temporarily if some code still imports it, but it should be deprecated.
function getDb() {
  throw new Error("getDb() is deprecated. Use database/db.js instead.");
}

module.exports = { initDatabase, getDb };
