const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const pdfService = require('../services/pdfService');
const chunkService = require('../services/chunkService');
const embedService = require('../services/embedService');

// Multer memory storage configuration (keeps files in RAM)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Helper: Extract publication year from text or filename
function extractYear(filename, text) {
  const fileYearMatch = filename.match(/\b(19\d{2}|20\d{2})\b/);
  if (fileYearMatch) return parseInt(fileYearMatch[0], 10);
  
  const textYearMatch = text.substring(0, 2000).match(/\b(19\d{2}|20\d{2})\b/);
  if (textYearMatch) return parseInt(textYearMatch[0], 10);
  
  return new Date().getFullYear();
}

// Helper: Determine category from filename
function extractCategory(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('census')) return 'Census';
  if (lower.includes('eicv')) return 'EICV';
  if (lower.includes('dhs')) return 'DHS';
  return 'Other';
}

// POST /api/documents - Upload and index PDF
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const originalName = req.file.originalname;
  const filename = `${Date.now()}-${originalName}`;
  const fileSize = req.file.size;

  let documentId;
  try {
    // 1. Insert record in 'processing' status
    const docInsertRes = await db.query(
      `INSERT INTO documents (filename, original_name, file_size, status) 
       VALUES ($1, $2, $3, 'processing') RETURNING id`,
      [filename, originalName, fileSize]
    );
    documentId = docInsertRes.rows[0].id;

    // 2. Extract text per page and page count from the buffer
    const { pages, numPages } = await pdfService(req.file.buffer);

    // 3. Chunk page-aware text with overlap
    const chunks = chunkService(pages);
    if (chunks.length === 0) {
      throw new Error('PDF yielded no select text chunks. It might be scanned or image-only.');
    }

    // 4. Create embeddings in batches of 100
    const chunkContents = chunks.map(c => c.content);
    const embeddings = await embedService.embedBatch(chunkContents);

    // 5. Insert chunks with embeddings into document_chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      
      await db.query(
        `INSERT INTO document_chunks (document_id, content, chunk_index, page_number, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
        [documentId, chunk.content, chunk.chunkIndex, chunk.pageNumber || null, JSON.stringify(embedding)]
      );
    }

    // 6. Infer metadata
    const fullText = pages.map(p => p.text).join(' ');
    const year = extractYear(originalName, fullText);
    const category = extractCategory(originalName);
    const description = `${category} report published in ${year}. Contains ${chunks.length} chunks.`;

    // 7. Update status to 'ready'
    await db.query(
      `UPDATE documents 
       SET status = 'ready', page_count = $1, category = $2, year = $3, description = $4 
       WHERE id = $5`,
      [numPages, category, year, description, documentId]
    );

    res.json({
      id: documentId,
      original_name: originalName,
      chunks: chunks.length,
      message: 'Document uploaded and indexed successfully'
    });

  } catch (error) {
    console.error('Error processing uploaded document:', error);
    if (documentId) {
      // Mark as failed in DB
      await db.query(`UPDATE documents SET status = 'failed' WHERE id = $1`, [documentId]);
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/documents - Get all documents
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, original_name, file_size, status, page_count, category, year, created_at 
       FROM documents 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/documents/:id - Delete document (cascade deletes chunks)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM documents WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;