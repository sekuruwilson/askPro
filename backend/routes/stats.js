const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    // 1. Total documents count
    const docCountRes = await db.query('SELECT COUNT(*) AS count FROM documents');
    const totalDocuments = parseInt(docCountRes.rows[0].count, 10);

    // 2. Total conversations count
    const convCountRes = await db.query('SELECT COUNT(*) AS count FROM conversations');
    const totalConversations = parseInt(convCountRes.rows[0].count, 10);

    // 3. Total questions count (user messages)
    const questionCountRes = await db.query("SELECT COUNT(*) AS count FROM messages WHERE role = 'user'");
    const totalQuestions = parseInt(questionCountRes.rows[0].count, 10);

    // 4. Recent conversations with message counts
    const recentConvRes = await db.query(`
      SELECT c.id, c.title, COALESCE(COUNT(m.id), 0)::integer AS message_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      GROUP BY c.id, c.title, c.created_at
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    const recentConversations = recentConvRes.rows;

    // 5. Query Activity (questions asked per day for the last 7 days)
    const activityRes = await db.query(`
      SELECT 
        TO_CHAR(d.day, 'YYYY-MM-DD') AS label,
        COALESCE(COUNT(m.id), 0)::integer AS count
      FROM (
        SELECT GENERATE_SERIES(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS day
      ) d
      LEFT JOIN messages m ON m.created_at::date = d.day AND m.role = 'user'
      GROUP BY d.day
      ORDER BY d.day ASC
    `);
    const recentActivity = activityRes.rows;

    res.json({
      totalDocuments,
      totalConversations,
      totalQuestions,
      recentConversations,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
