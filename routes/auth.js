const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    const { username, email, password, birth_date, gender } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    try {
        const db = getDb();

        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }

            if (row) {
                db.close();
                return res.status(409).json({ error: 'User already exists' });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, 10);

            // Insert user
            db.run(
                'INSERT INTO users (username, email, password_hash, birth_date, gender) VALUES (?, ?, ?, ?, ?)',
                [username, email, password_hash, birth_date || null, gender || null],
                function (err) {
                    if (err) {
                        db.close();
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    const userId = this.lastID;

                    // Generate JWT token
                    const token = jwt.sign(
                        { id: userId, username, email },
                        process.env.JWT_SECRET,
                        { expiresIn: '7d' }
                    );

                    db.close();
                    res.status(201).json({
                        message: 'User created successfully',
                        token,
                        user: { id: userId, username, email }
                    });
                }
            );
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const db = getDb();

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            db.close();

            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    birth_date: user.birth_date,
                    gender: user.gender
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/auth/profile
 * Get user profile (protected route)
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const db = getDb();

        db.get('SELECT id, username, email, birth_date, gender, created_at FROM users WHERE id = ?',
            [req.user.id],
            (err, user) => {
                db.close();

                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json({ user });
            }
        );
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
