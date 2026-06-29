const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generates an embedding for a single text string.
 * @param {string} text - The input text to embed
 * @returns {Promise<Array<number>>} The 1536-dimensional vector embedding
 */
async function embedText(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' ')
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding creation failed:', error);
    throw error;
  }
}

/**
 * Generates embeddings for a batch of text strings, in chunks of 100.
 * @param {Array<string>} texts - The array of text strings to embed
 * @returns {Promise<Array<Array<number>>>} The array of embeddings
 */
async function embedBatch(texts) {
  if (!texts || texts.length === 0) return [];
  
  try {
    const embeddings = [];
    const batchSize = 100;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, i + batchSize).map(t => t.replace(/\n/g, ' '));
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batchTexts
      });

      const batchEmbeddings = response.data.map(item => item.embedding);
      embeddings.push(...batchEmbeddings);

      // Add a small delay if there are more batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return embeddings;
  } catch (error) {
    console.error('Batch embedding creation failed:', error);
    throw error;
  }
}

module.exports = {
  embedText,
  embedBatch
};