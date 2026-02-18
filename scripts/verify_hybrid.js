
const { initDatabase } = require('../database/init');
const db = require('../database/db');

async function testHybridDB() {
    console.log('Testing Hybrid DB Implementation...');
    console.log('Mode:', db.isPostgres ? 'PostgreSQL' : 'SQLite');

    try {
        await initDatabase();

        // Test Insert
        const suffix = Math.floor(Math.random() * 10000);
        const username = `testuser_${suffix}`;
        const email = `test_${suffix}@example.com`;

        console.log(`Creating user: ${username}`);
        const userRes = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, 'hashed_pass']
        );
        const userId = userRes.insertId;
        console.log('User created with ID:', userId);

        // Test Query
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        console.log('User retrieved:', user ? 'Success' : 'Failed');
        if (user.username !== username) throw new Error('Username mismatch');

        console.log('Verification Successful!');
    } catch (err) {
        console.error('Verification Failed:', err);
    } finally {
        // Close just for script cleanup
        await db.close();
    }
}

testHybridDB();
