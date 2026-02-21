const express = require('express');
const db = require('../database/db'); // Updated import
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/dreams
 * Create a new dream entry
 */
router.post('/', authenticateToken, async (req, res) => {
    const { date, title, content, emotions } = req.body;

    if (!date || !title || !content) {
        return res.status(400).json({ error: 'Date, title, and content are required' });
    }

    try {
        const emotionsStr = Array.isArray(emotions) ? JSON.stringify(emotions) : emotions;

        const result = await db.query(
            'INSERT INTO dreams (user_id, date, title, content, emotions) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, date, title, content, emotionsStr]
        );

        res.status(201).json({
            message: 'Dream saved successfully',
            dreamId: result.insertId
        });
    } catch (error) {
        console.error('Dream creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/dreams
 * Get all dreams for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM dreams WHERE user_id = ? ORDER BY date DESC',
            [req.user.id]
        );

        const dreams = result.rows;

        // Parse emotions JSON
        const parsedDreams = dreams.map(dream => ({
            ...dream,
            emotions: dream.emotions ? JSON.parse(dream.emotions) : []
        }));

        res.json({ dreams: parsedDreams });
    } catch (error) {
        console.error('Dreams retrieval error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/dreams/:id
 * Get a specific dream by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
    const dreamId = req.params.id;

    try {
        const dream = await db.get(
            'SELECT * FROM dreams WHERE id = ? AND user_id = ?',
            [dreamId, req.user.id]
        );

        if (!dream) {
            return res.status(404).json({ error: 'Dream not found' });
        }

        // Get analysis if exists
        const analysis = await db.get(
            'SELECT * FROM analyses WHERE dream_id = ?',
            [dreamId]
        );

        const parsedDream = {
            ...dream,
            emotions: dream.emotions ? JSON.parse(dream.emotions) : []
        };

        if (analysis) {
            parsedDream.analysis = {
                ...analysis,
                archetypes: analysis.archetypes ? JSON.parse(analysis.archetypes) : [],
                symbols: analysis.symbols ? JSON.parse(analysis.symbols) : {}
            };
        }

        res.json({ dream: parsedDream });
    } catch (error) {
        console.error('Dream retrieval error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/dreams/:id
 * Update a dream
 */
router.put('/:id', authenticateToken, async (req, res) => {
    const dreamId = req.params.id;
    const { date, title, content, emotions } = req.body;

    if (!date || !title || !content) {
        return res.status(400).json({ error: 'Date, title, and content are required' });
    }

    try {
        // Verify ownership
        const existingDream = await db.get(
            'SELECT id FROM dreams WHERE id = ? AND user_id = ?',
            [dreamId, req.user.id]
        );

        if (!existingDream) {
            return res.status(404).json({ error: 'Dream not found' });
        }

        const emotionsStr = Array.isArray(emotions) ? JSON.stringify(emotions) : emotions;

        await db.query(
            'UPDATE dreams SET date = ?, title = ?, content = ?, emotions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [date, title, content, emotionsStr, dreamId]
        );

        res.json({ message: 'Dream updated successfully' });
    } catch (error) {
        console.error('Dream update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * DELETE /api/dreams/:id
 * Delete a dream
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const dreamId = req.params.id;

    try {
        let query = 'DELETE FROM dreams WHERE id = ? AND user_id = ?';
        let params = [dreamId, req.user.id];

        if (req.user.is_admin) {
            query = 'DELETE FROM dreams WHERE id = ?';
            params = [dreamId];
        }

        const result = await db.query(query, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Dream not found' });
        }

        res.json({ message: 'Dream deleted successfully' });
    } catch (error) {
        console.error('Dream deletion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
