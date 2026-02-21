const express = require('express');
const db = require('../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/community
 * Get all public dreams (includes reaction counts)
 */
router.get('/', async (req, res) => {
    try {
        // Query public dreams, joining with user table to get usernames
        const result = await db.query(`
            SELECT d.id, d.title, d.content, d.date, d.emotions, d.created_at, u.username as author_name, u.nickname as author_nickname, u.profile_image_url, a.analysis_text as overall_interpretation
            FROM dreams d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN analyses a ON a.dream_id = d.id
            WHERE d.is_public = ? OR d.is_public = ?
            ORDER BY d.created_at DESC
        `, [true, 1]); // Handle both PostgreSQL true and SQLite 1

        // Deduplicate dreams (in case of multiple analyses causing duplicate rows)
        const uniqueRowsMap = new Map();
        for (const row of result.rows) {
            if (!uniqueRowsMap.has(row.id)) {
                uniqueRowsMap.set(row.id, row);
            }
        }
        const uniqueRows = Array.from(uniqueRowsMap.values());

        const dreamIds = uniqueRows.map(d => d.id);
        let reactionsRows = [];
        if (dreamIds.length > 0) {
            const placeholders = dreamIds.map(() => '?').join(',');
            const rQuery = await db.query(`
                SELECT target_id, emoji, COUNT(*) as count 
                FROM reactions 
                WHERE target_type = 'dream' AND target_id IN (${placeholders}) 
                GROUP BY target_id, emoji
            `, dreamIds);
            reactionsRows = rQuery.rows || rQuery;
        }

        const dreams = uniqueRows.map(dream => {
            const reacts = reactionsRows.filter(r => r.target_id === dream.id);
            const reactMap = {};
            reacts.forEach(r => reactMap[r.emoji] = parseInt(r.count));

            return {
                ...dream,
                display_name: dream.author_nickname || dream.author_name,
                emotions: dream.emotions ? JSON.parse(dream.emotions) : [],
                reactions: reactMap
            };
        });

        res.json({ dreams });
    } catch (error) {
        console.error('Community dreams retrieval error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/community/react
 * Toggle an emoji reaction on a dream or comment (Auth required)
 */
router.post('/react', authenticateToken, async (req, res) => {
    const { target_type, target_id, emoji } = req.body;
    const allowedTypes = ['dream', 'comment'];
    const allowedEmojis = ['👍', '❤️', '😊', '😢', '😮'];

    if (!allowedTypes.includes(target_type) || !target_id || !allowedEmojis.includes(emoji)) {
        return res.status(400).json({ error: 'Invalid reaction parameters' });
    }

    try {
        // Check if reaction already exists
        const existing = await db.get(
            'SELECT id FROM reactions WHERE target_type = ? AND target_id = ? AND user_id = ? AND emoji = ?',
            [target_type, target_id, req.user.id, emoji]
        );

        if (existing) {
            // Un-react (toggle off)
            await db.query('DELETE FROM reactions WHERE id = ?', [existing.id]);
            return res.json({ message: 'Reaction removed', added: false });
        } else {
            // Add reaction (toggle on)
            await db.query(
                'INSERT INTO reactions (target_type, target_id, user_id, emoji) VALUES (?, ?, ?, ?)',
                [target_type, target_id, req.user.id, emoji]
            );
            return res.status(201).json({ message: 'Reaction added', added: true });
        }
    } catch (error) {
        console.error('Reaction error:', error);
        res.status(500).json({ error: 'Server error parsing reactions' });
    }
});

/**
 * PUT /api/community/:dreamId/visibility
 * Toggle public status of a dream (Auth required)
 */
router.put('/:dreamId/visibility', authenticateToken, async (req, res) => {
    const dreamId = req.params.dreamId;
    const { isPublic } = req.body;

    try {
        // Ensure the dream belongs to the user
        const dream = await db.get('SELECT id FROM dreams WHERE id = ? AND user_id = ?', [dreamId, req.user.id]);
        if (!dream) {
            return res.status(404).json({ error: 'Dream not found or unauthorized' });
        }

        const publicValue = db.isPostgres ? (isPublic === true) : (isPublic ? 1 : 0);

        await db.query('UPDATE dreams SET is_public = ? WHERE id = ?', [publicValue, dreamId]);

        res.json({ message: 'Visibility updated successfully', isPublic: isPublic });
    } catch (error) {
        console.error('Visibility update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/community/:dreamId/comments
 * Get comments for a specific dream (Includes replies and reaction counts)
 */
router.get('/:dreamId/comments', async (req, res) => {
    const dreamId = req.params.dreamId;
    const userId = req.user ? req.user.id : null; // Optional auth logic

    try {
        const result = await db.query(`
            SELECT c.id, c.content, c.parent_id, c.created_at, u.username as author_name, u.nickname as author_nickname, u.profile_image_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.dream_id = ?
            ORDER BY c.created_at ASC
        `, [dreamId]);

        // Optional: Get reactions for these comments
        const commentIds = result.rows.map(c => c.id);
        let reactionsRows = [];
        if (commentIds.length > 0) {
            const placeholders = commentIds.map(() => '?').join(',');
            const rQuery = await db.query(`
                SELECT target_id, emoji, COUNT(*) as count 
                FROM reactions 
                WHERE target_type = 'comment' AND target_id IN (${placeholders}) 
                GROUP BY target_id, emoji
            `, commentIds);
            reactionsRows = rQuery.rows || rQuery;
        }

        const comments = result.rows.map(c => {
            const reacts = reactionsRows.filter(r => r.target_id === c.id);
            const reactMap = {};
            reacts.forEach(r => reactMap[r.emoji] = parseInt(r.count));

            return {
                ...c,
                display_name: c.author_nickname || c.author_name,
                reactions: reactMap
            };
        });

        res.json({ comments });
    } catch (error) {
        console.error('Comments retrieval error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/community/:dreamId/comments
 * Add a comment (or reply) to a dream (Auth required)
 */
router.post('/:dreamId/comments', authenticateToken, async (req, res) => {
    const dreamId = req.params.dreamId;
    const { content, parent_id } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Comment content is required' });
    }

    try {
        let insertId;
        if (parent_id) {
            // Verify parent comment exists and belongs to this dream
            const parent = await db.get('SELECT id FROM comments WHERE id = ? AND dream_id = ?', [parent_id, dreamId]);
            if (!parent) return res.status(400).json({ error: 'Invalid parent comment' });

            const result = await db.query(
                'INSERT INTO comments (dream_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
                [dreamId, req.user.id, parent_id, content.trim()]
            );
            insertId = result.insertId;
        } else {
            const result = await db.query(
                'INSERT INTO comments (dream_id, user_id, content) VALUES (?, ?, ?)',
                [dreamId, req.user.id, content.trim()]
            );
            insertId = result.insertId;
        }

        res.status(201).json({
            message: 'Comment added successfully',
            commentId: insertId
        });
    } catch (error) {
        console.error('Comment creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
