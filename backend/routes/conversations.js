const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all conversations ordered by created_at DESC
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, title, created_at FROM conversations ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new conversation
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    const result = await db.query(
      'INSERT INTO conversations (title) VALUES ($1) RETURNING id, title, created_at',
      [title || 'New Conversation']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a conversation (foreign key cascade deletes messages)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM conversations WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;