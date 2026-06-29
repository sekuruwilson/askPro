require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

// Import routes
const documentsRouter = require('./routes/documents');
const conversationsRouter = require('./routes/conversations');
const messagesRouter = require('./routes/messages');
const queryRouter = require('./routes/query');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/documents', documentsRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/query', queryRouter);
app.use('/api/stats', statsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize database schema and start server
async function startServer() {
  try {
    // 1. Test database connection
    console.log('Testing PostgreSQL connection...');
    await db.query('SELECT 1');
    console.log('✅ Connected to PostgreSQL database.');

    // 2. Auto-initialize tables
    console.log('Verifying database schema...');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await db.query(sql);
      console.log('✅ Database schema verified/initialized successfully.');
    } else {
      console.warn('⚠️ Warning: db/schema.sql file not found. Skipping auto-initialization.');
    }

    // 3. Listen on port
    app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start backend server:', error);
    process.exit(1);
  }
}

startServer();