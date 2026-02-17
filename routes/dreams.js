const express = require('express');
const { getDb } = require('../database/init');
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
        const db = getDb();
        const emotionsStr = Array.isArray(emotions) ? JSON.stringify(emotions) : emotions;

        db.run(
            'INSERT INTO dreams (user_id, date, title, content, emotions) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, date, title, content, emotionsStr],
            function (err) {
                db.close();

                if (err) {
                    console.error('Dream creation error:', err);
                    return res.status(500).json({ error: 'Failed to save dream' });
                }

                res.status(201).json({
                    message: 'Dream saved successfully',
                    dreamId: this.lastID
                });
            }
        );
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
        const db = getDb();

        db.all(
            'SELECT * FROM dreams WHERE user_id = ? ORDER BY date DESC',
            [req.user.id],
            (err, dreams) => {
                db.close();

                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                // Parse emotions JSON
                const parsedDreams = dreams.map(dream => ({
                    ...dream,
                    emotions: dream.emotions ? JSON.parse(dream.emotions) : []
                }));

                res.json({ dreams: parsedDreams });
            }
        );
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
        const db = getDb();

        db.get(
            'SELECT * FROM dreams WHERE id = ? AND user_id = ?',
            [dreamId, req.user.id],
            (err, dream) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!dream) {
                    db.close();
                    return res.status(404).json({ error: 'Dream not found' });
                }

                // Get analysis if exists
                db.get(
                    'SELECT * FROM analyses WHERE dream_id = ?',
                    [dreamId],
                    (err, analysis) => {
                        db.close();

                        if (err) {
                            return res.status(500).json({ error: 'Database error' });
                        }

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
                    }
                );
            }
        );
    } catch (error) {
        console.error('Dream retrieval error:', error);
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
        const db = getDb();

        db.run(
            'DELETE FROM dreams WHERE id = ? AND user_id = ?',
            [dreamId, req.user.id],
            function (err) {
                db.close();

                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Dream not found' });
                }

                res.json({ message: 'Dream deleted successfully' });
            }
        );
    } catch (error) {
        console.error('Dream deletion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
