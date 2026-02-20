const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/admin/stats
 * Get total number of registered users
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(id) as total_users FROM users');
        const count = result.rows ? result.rows[0].total_users : (result[0] ? result[0].total_users : 0);

        res.json({ totalUsers: parseInt(count, 10) });
    } catch (error) {
        console.error('Stats retrieval error:', error);
        res.status(500).json({ error: 'Server error while fetching stats' });
    }
});

/**
 * GET /api/admin/stats/detailed
 * Get detailed platform demographic statistics
 */
router.get('/stats/detailed', authenticateToken, async (req, res) => {
    try {
        const usersQuery = await db.query('SELECT birth_date, gender FROM users');
        const rows = usersQuery.rows || usersQuery;

        const genderStats = { '남성': 0, '여성': 0, '기타': 0, '미상': 0 };
        const ageStats = { '10대 이하': 0, '20대': 0, '30대': 0, '40대': 0, '50대 이상': 0, '미상': 0 };

        const currentYear = new Date().getFullYear();

        rows.forEach(row => {
            // Gender
            if (row.gender === '남성' || row.gender === 'male' || row.gender === 'M') genderStats['남성']++;
            else if (row.gender === '여성' || row.gender === 'female' || row.gender === 'F') genderStats['여성']++;
            else if (row.gender === '기타' || row.gender === 'other') genderStats['기타']++;
            else genderStats['미상']++;

            // Age
            if (row.birth_date) {
                const birthYear = parseInt(row.birth_date.substring(0, 4));
                if (!isNaN(birthYear)) {
                    const age = currentYear - birthYear;
                    if (age < 20) ageStats['10대 이하']++;
                    else if (age < 30) ageStats['20대']++;
                    else if (age < 40) ageStats['30대']++;
                    else if (age < 50) ageStats['40대']++;
                    else ageStats['50대 이상']++;
                } else {
                    ageStats['미상']++;
                }
            } else {
                ageStats['미상']++;
            }
        });

        res.json({ genderStats, ageStats });
    } catch (error) {
        console.error('Detailed stats error:', error);
        res.status(500).json({ error: 'Server error while fetching detailed stats' });
    }
});

module.exports = router;
