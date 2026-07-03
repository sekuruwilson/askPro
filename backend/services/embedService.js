const OpenAI = require('openai');

class EmbedService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'text-embedding-3-small';
  }

  /**
   * Embeds a single text string.
   * @param {string} text
   * @returns {Promise<Array<number>>}
   */
  async embedText(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding creation failed:', error);
      throw error;
    }
  }

  /**
   * Embeds an array of text strings in batches of 100 to prevent OpenAI rate limit issues.
   * @param {Array<string>} texts
   * @returns {Promise<Array<Array<number>>>}
   */
  async embedBatch(texts) {
    try {
      const batchSize = 100;
      const embeddings = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
        });
        
        // Extract embeddings in order
        const batchEmbeddings = response.data.map(item => item.embedding);
        embeddings.push(...batchEmbeddings);
      }

      return embeddings;
    } catch (error) {
      console.error('Batch embedding creation failed:', error);
      throw error;
    }
  }
}

module.exports = new EmbedService();