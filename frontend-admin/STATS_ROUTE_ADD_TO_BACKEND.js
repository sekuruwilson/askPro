const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/stats — admin dashboard overview
router.get('/', async (req, res) => {
  try {
    const [docsResult, convsResult, msgsResult, recentConvsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM documents WHERE status = 'ready'`),
      pool.query(`SELECT COUNT(*) FROM conversations`),
      pool.query(`SELECT COUNT(*) FROM messages WHERE role = 'user'`),
      pool.query(`
        SELECT c.id, c.title, c.created_at,
               COUNT(m.id)::int AS message_count
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 10
      `),
    ]);

    // Build activity data from recent conversations
    const recentActivity = recentConvsResult.rows.slice(0, 6).map(conv => ({
      label: conv.title?.slice(0, 20) || 'Untitled',
      count: conv.message_count,
    }));

    res.json({
      totalDocuments:     parseInt(docsResult.rows[0].count),
      totalConversations: parseInt(convsResult.rows[0].count),
      totalQuestions:     parseInt(msgsResult.rows[0].count),
      recentConversations: recentConvsResult.rows,
      recentActivity,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
