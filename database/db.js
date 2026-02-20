const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Configure environment
const isPostgres = !!process.env.DATABASE_URL;

let db;
let pool;

if (isPostgres) {
    console.log('Using PostgreSQL database');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    console.log('Using SQLite database');
    const DB_PATH = path.join(__dirname, '..', 'dreams.db');
    db = new sqlite3.Database(DB_PATH);
}

/**
 * Execute a query with parameters
 * Abstraction for SQLite vs PostgreSQL differences
 * @param {string} text SQL query
 * @param {Array} params Query parameters
 */
async function query(text, params = []) {
    if (isPostgres) {
        // Convert ? to $1, $2, etc.
        let i = 1;
        const sql = text.replace(/\?/g, () => `$${i++}`);

        // Handle INSERT ... RETURNING id manually if needed
        // but standardized behavior: return { rows, rowCount, insertId }

        // For basic insert returning ID, we append RETURNING id if it's an insert
        // This is a simplification but works for our simple app
        let finalSql = sql;
        if (sql.trim().toUpperCase().startsWith('INSERT') && !sql.toUpperCase().includes('RETURNING')) {
            finalSql += ' RETURNING id';
        }

        try {
            const res = await pool.query(finalSql, params);
            return {
                rows: res.rows,
                rowCount: res.rowCount,
                insertId: res.rows[0]?.id // Common pattern for single insert
            };
        } catch (err) {
            console.error('Database query error:', err);
            throw err;
        }
    } else {
        return new Promise((resolve, reject) => {
            const method = text.trim().toUpperCase().startsWith('SELECT') ? 'all' : 'run';

            if (method === 'all') {
                db.all(text, params, (err, rows) => {
                    if (err) {
                        console.error('Database query error:', err);
                        reject(err);
                    }
                    else resolve({ rows: rows, rowCount: rows.length });
                });
            } else {
                db.run(text, params, function (err) {
                    if (err) {
                        console.error('Database query error:', err);
                        reject(err);
                    }
                    else resolve({
                        rows: [],
                        rowCount: this.changes,
                        insertId: this.lastID
                    });
                });
            }
        });
    }
}

/**
 * Get a single row
 */
async function get(text, params = []) {
    const result = await query(text, params);
    return result.rows[0];
}

/**
 * Helper to close connection (mainly for tests/shutdown)
 */
function close() {
    if (isPostgres) return pool.end();
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = {
    query,
    get,
    close,
    isPostgres
};
