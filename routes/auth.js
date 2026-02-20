const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for profile images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/uploads/profiles');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    const { username, nickname, email, password, birth_date, gender } = req.body;

    // Validation
    if (!username || !email || !password || !nickname) {
        return res.status(400).json({ error: 'Username, nickname, email, and password are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);

        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.query(
            'INSERT INTO users (username, nickname, email, password_hash, birth_date, gender) VALUES (?, ?, ?, ?, ?, ?)',
            [username, nickname, email, password_hash, birth_date || null, gender || null]
        );

        const userId = result.insertId;

        // Generate JWT token
        const token = jwt.sign(
            { id: userId, username, nickname, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: userId, username, nickname, email, profile_image_url: null }
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
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

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
            { id: user.id, username: user.username, nickname: user.nickname, email: user.email, profile_image_url: user.profile_image_url },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                email: user.email,
                birth_date: user.birth_date,
                gender: user.gender,
                profile_image_url: user.profile_image_url
            }
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
        const user = await db.get(
            'SELECT id, username, nickname, email, birth_date, gender, profile_image_url, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/auth/me
 * Alias for getting the user profile, used by global nav
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.get(
            'SELECT id, username, nickname, email, birth_date, gender, profile_image_url, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/auth/profile
 * Update user profile (nickname, email, password, birth_date, gender, profile_image)
 */
router.put('/profile', authenticateToken, upload.single('profile_image'), async (req, res) => {
    const { nickname, email, password, birth_date, gender } = req.body;
    let updateFields = [];
    let queryParams = [];

    // Check email uniqueness if passed
    if (email && email.trim() !== '') {
        const existing = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim(), req.user.id]);
        if (existing) {
            return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
        }
        updateFields.push('email = ?');
        queryParams.push(email.trim());
    }

    if (nickname && nickname.trim() !== '') {
        updateFields.push('nickname = ?');
        queryParams.push(nickname.trim());
    }

    if (password && password.trim() !== '') {
        const password_hash = await bcrypt.hash(password, 10);
        updateFields.push('password_hash = ?');
        queryParams.push(password_hash);
    }

    // Optional fields can be updated or emptied
    if (birth_date !== undefined) {
        updateFields.push('birth_date = ?');
        queryParams.push(birth_date);
    }

    if (gender !== undefined) {
        updateFields.push('gender = ?');
        queryParams.push(gender);
    }

    // Image upload handling
    if (req.file) {
        updateFields.push('profile_image_url = ?');
        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        queryParams.push(imageUrl);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: '수정할 정보가 없습니다.' });
    }

    queryParams.push(req.user.id);
    const queryStr = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    try {
        await db.query(queryStr, queryParams);

        // Fetch updated user to return
        const updatedUser = await db.get(
            'SELECT id, username, nickname, email, birth_date, gender, profile_image_url, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            message: '프로필이 성공적으로 수정되었습니다.',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;
