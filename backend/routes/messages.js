const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all messages for a conversation ordered by created_at ASC
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await db.query(
      'SELECT id, conversation_id AS "conversationId", role, content, sources, created_at AS "createdAt" FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save a new message
router.post('/', async (req, res) => {
  try {
    const { conversationId, role, content, sources } = req.body;

    if (!conversationId || !role || !content) {
      return res.status(400).json({ error: 'conversationId, role, and content are required' });
    }

    const result = await db.query(
      'INSERT INTO messages (conversation_id, role, content, sources) VALUES ($1, $2, $3, $4) RETURNING id, conversation_id AS "conversationId", role, content, sources, created_at AS "createdAt"',
      [conversationId, role, content, sources ? JSON.stringify(sources) : null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;