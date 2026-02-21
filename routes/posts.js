const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/posts
 * Get all posts for the bulletin board (Notice Board)
 */
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.id, p.title, p.content, p.created_at, u.username as author_name, u.nickname as author_nickname, u.profile_image_url
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `);

        const posts = result.rows.map(post => ({
            ...post,
            display_name: post.author_nickname || post.author_name
        }));

        res.json({ posts });
    } catch (error) {
        console.error('Posts retrieval error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', authenticateToken, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
            [req.user.id, title, content]
        );

        res.status(201).json({
            message: 'Post created successfully',
            postId: result.insertId
        });
    } catch (error) {
        console.error('Post creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
