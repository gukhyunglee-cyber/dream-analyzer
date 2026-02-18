
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'dreams.db');
console.log('Checking database at:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    console.log('Connected to database.');
});

db.serialize(() => {
    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (err) console.error("Error counting users:", err);
        else console.log("Users count:", row.count);
    });

    db.get("SELECT count(*) as count FROM dreams", (err, row) => {
        if (err) console.error("Error counting dreams:", err);
        else console.log("Dreams count:", row.count);
    });
    db.get("SELECT count(*) as count FROM analyses", (err, row) => {
        if (err) console.error("Error counting analyses:", err);
        else console.log("Analyses count:", row.count);
    });
});

db.close();
