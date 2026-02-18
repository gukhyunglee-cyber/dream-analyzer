const express = require('express');
const db = require('../database/db'); // Updated import
const { authenticateToken } = require('../middleware/auth');
const { getAIService } = require('../services/aiService');

const router = express.Router();

/**
 * POST /api/analysis/analyze
 * Analyze a dream using AI (Jungian analysis)
 */
router.post('/analyze', authenticateToken, async (req, res) => {
    const { dreamId } = req.body;

    if (!dreamId) {
        return res.status(400).json({ error: 'Dream ID is required' });
    }

    try {
        // Get the dream and user info
        const dream = await db.get(
            `SELECT d.*, u.birth_date, u.gender 
       FROM dreams d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.id = ? AND d.user_id = ?`,
            [dreamId, req.user.id]
        );

        if (!dream) {
            return res.status(404).json({ error: 'Dream not found' });
        }

        // Prepare user info for analysis
        const userInfo = {
            birth_date: dream.birth_date,
            gender: dream.gender
        };

        // Call AI service
        const aiService = getAIService();
        const result = await aiService.analyzeDream(dream.content, userInfo);

        if (!result.success) {
            return res.status(500).json({ error: 'AI analysis failed: ' + result.error });
        }

        const analysis = result.analysis;

        // Save analysis to database
        const insertResult = await db.query(
            `INSERT INTO analyses (dream_id, analysis_text, archetypes, symbols, psychological_state)
           VALUES (?, ?, ?, ?, ?)`,
            [
                dreamId,
                analysis.overall_interpretation || '',
                JSON.stringify(analysis.archetypes || []),
                JSON.stringify(analysis.symbols || {}),
                analysis.psychological_state || ''
            ]
        );

        res.json({
            message: 'Analysis completed successfully',
            analysisId: insertResult.insertId,
            analysis: {
                overall_interpretation: analysis.overall_interpretation,
                archetypes: analysis.archetypes,
                symbols: analysis.symbols,
                psychological_state: analysis.psychological_state,
                individuation_insights: analysis.individuation_insights,
                recommendations: analysis.recommendations
            }
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/analysis/:dreamId
 * Get analysis for a specific dream
 */
router.get('/:dreamId', authenticateToken, async (req, res) => {
    const dreamId = req.params.dreamId;

    try {
        // Verify dream belongs to user
        const dream = await db.get(
            'SELECT id FROM dreams WHERE id = ? AND user_id = ?',
            [dreamId, req.user.id]
        );

        if (!dream) {
            return res.status(404).json({ error: 'Dream not found' });
        }

        // Get analysis
        const analysis = await db.get(
            'SELECT * FROM analyses WHERE dream_id = ? ORDER BY created_at DESC LIMIT 1',
            [dreamId]
        );

        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        res.json({
            analysis: {
                id: analysis.id,
                dreamId: analysis.dream_id,
                overall_interpretation: analysis.analysis_text,
                archetypes: JSON.parse(analysis.archetypes || '[]'),
                symbols: JSON.parse(analysis.symbols || '{}'),
                psychological_state: analysis.psychological_state,
                created_at: analysis.created_at
            }
        });

    } catch (error) {
        console.error('Analysis retrieval error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
