const express = require('express');
const router = express.Router();
const db = require('../db');
const embedService = require('../services/embedService');
const llmService = require('../services/llmService');

// POST /api/query
router.post('/', async (req, res) => {
  try {
    const { question, conversationId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    // 1. Get conversation history first (needed for query rewriting)
    let conversationHistory = [];
    if (conversationId) {
      const historyResult = await db.query(
        'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 10',
        [conversationId]
      );
      conversationHistory = historyResult.rows.reverse();
    }

    // 2. Rewrite vague follow-up questions into complete standalone search queries
    const searchQuery = await llmService.rewriteQuery(question, conversationHistory);

    // 3. Generate embedding from the (possibly rewritten) query
    const queryEmbedding = await embedService.embedText(searchQuery);

    // 4. Perform vector search using pgvector cosine distance <=>
    const vectorSearchQuery = `
      SELECT 
        dc.content AS excerpt, 
        dc.page_number,
        d.original_name AS document,
        d.year AS report_year,
        1 - (dc.embedding <=> $1::vector) AS similarity
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE d.status = 'ready'
      ORDER BY dc.embedding <=> $1::vector
      LIMIT 8
    `;

    const similarityResult = await db.query(vectorSearchQuery, [JSON.stringify(queryEmbedding)]);
    const relevantChunks = similarityResult.rows;

    // 5. Map chunks for llmService — include report name and page number for citation
    const chunksForLLM = relevantChunks.map(chunk => ({
      content: chunk.excerpt,
      filename: chunk.document,
      pageNumber: chunk.page_number || null,
      reportYear: chunk.report_year || null
    }));

    // 6. Generate RAG answer (pass the ORIGINAL question, not rewritten — for natural response)
    const answer = await llmService.generateAnswer(question, chunksForLLM, conversationHistory);

    // 7. Format sources for the response
    const sources = relevantChunks.map(chunk => ({
      document: chunk.document,
      page_number: chunk.page_number || null,
      report_year: chunk.report_year || null,
      excerpt: chunk.excerpt,
      similarity: parseFloat(chunk.similarity || 0)
    }));


    res.json({
      answer,
      sources
    });
  } catch (error) {
    console.error('Query processing failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;