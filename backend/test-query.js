require('dotenv').config({ override: true });
const db = require('./db');
const embedService = require('./services/embedService');

async function test() {
  const question = "what is the average farm size in the East province?";
  console.log(`Generating embedding for: "${question}"...`);
  const embedding = await embedService.embedText(question);
  
  console.log('Querying database...');
  const result = await db.query(
    `SELECT dc.chunk_index, dc.content, d.original_name, 1 - (dc.embedding <=> $1::vector) AS similarity
     FROM document_chunks dc
     JOIN documents d ON dc.document_id = d.id
     WHERE d.status = 'ready'
     ORDER BY dc.embedding <=> $1::vector
     LIMIT 10`,
    [JSON.stringify(embedding)]
  );

  console.log('\n--- Query Results ---');
  result.rows.forEach((row, i) => {
    console.log(`\nRank ${i + 1}: Chunk ${row.chunk_index} | Similarity: ${row.similarity}`);
    console.log(row.content.substring(0, 300) + '...');
  });
  
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
