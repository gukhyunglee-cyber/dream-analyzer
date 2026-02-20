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
                nickname VARCHAR(255),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                birth_date VARCHAR(50),
                gender VARCHAR(50),
                profile_image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` :
      `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                nickname TEXT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                birth_date TEXT,
                gender TEXT,
                profile_image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`;

    await db.query(userSchema);

    // Migration: Add nickname to users
    try {
      if (isPg) {
        await db.query(`ALTER TABLE users ADD COLUMN nickname VARCHAR(255)`);
      } else {
        await db.query(`ALTER TABLE users ADD COLUMN nickname TEXT`);
      }
      console.log('Added nickname column to users table');
    } catch (err) {
      // Column likely exists, ignore
    }

    try {
      if (isPg) {
        await db.query(`ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500)`);
      } else {
        await db.query(`ALTER TABLE users ADD COLUMN profile_image_url TEXT`);
      }
      console.log('Added profile_image_url column to users table');
    } catch (err) {
      // Column likely exists, ignore
    }

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
                is_public BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` :
      `CREATE TABLE IF NOT EXISTS dreams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                emotions TEXT,
                is_public BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`;

    await db.query(dreamSchema);

    // Migration: Add updated_at column and is_public if they don't exist
    try {
      await db.query(`ALTER TABLE dreams ADD COLUMN updated_at ${isPg ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP`);
      console.log('Added updated_at column to dreams table');
    } catch (err) {
      // Column likely exists, ignore
    }

    try {
      if (isPg) {
        await db.query(`ALTER TABLE dreams ADD COLUMN is_public BOOLEAN DEFAULT false`);
      } else {
        await db.query(`ALTER TABLE dreams ADD COLUMN is_public INTEGER DEFAULT 0`);
      }
      console.log('Added is_public column to dreams table');
    } catch (err) {
      // Column likely exists, ignore
    }

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
                individuation_insights TEXT,
                recommendations TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` :
      `CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dream_id INTEGER NOT NULL,
                analysis_text TEXT NOT NULL,
                archetypes TEXT,
                symbols TEXT,
                psychological_state TEXT,
                individuation_insights TEXT,
                recommendations TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE
            )`;

    await db.query(analysisSchema);

    // Migration for Analyses table missing columns
    try {
      await db.query(`ALTER TABLE analyses ADD COLUMN individuation_insights TEXT`);
      console.log('Added individuation_insights column to analyses table');
    } catch (err) { }
    try {
      await db.query(`ALTER TABLE analyses ADD COLUMN recommendations TEXT`);
      console.log('Added recommendations column to analyses table');
    } catch (err) { }

    console.log('Analyses table ready');

    // Comments Table (Community)
    const commentSchema = isPg ?
      `CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                dream_id INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` :
      `CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dream_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                parent_id INTEGER,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
            )`;

    await db.query(commentSchema);

    // Migration for parent_id in Comments
    try {
      if (isPg) {
        await db.query(`ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE`);
      } else {
        await db.query(`ALTER TABLE comments ADD COLUMN parent_id INTEGER`);
      }
      console.log('Added parent_id column to comments table');
    } catch (err) {
      // Column likely exists
    }

    console.log('Comments table ready');

    // Reactions Table (Community)
    const reactionSchema = isPg ?
      `CREATE TABLE IF NOT EXISTS reactions (
                id SERIAL PRIMARY KEY,
                target_type VARCHAR(50) NOT NULL, -- 'dream' or 'comment'
                target_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                emoji VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(target_type, target_id, user_id, emoji)
            )` :
      `CREATE TABLE IF NOT EXISTS reactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_type TEXT NOT NULL,
                target_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                emoji TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(target_type, target_id, user_id, emoji),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`;

    await db.query(reactionSchema);
    console.log('Reactions table ready');

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
