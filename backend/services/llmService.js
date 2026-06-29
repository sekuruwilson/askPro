const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generates an answer to the question using context from the retrieved chunks.
 * @param {string} question - The user's question
 * @param {Array<{content: string, filename: string}>} chunks - Retrieved document chunks
 * @param {Array<{role: string, content: string}>} conversationHistory - Past conversation messages
 * @returns {Promise<string>} The generated answer
 */
async function generateAnswer(question, chunks, conversationHistory = []) {
  try {
    const context = chunks
      .map((chunk, index) => {
        const pageInfo = chunk.pageNumber ? `, Page ${chunk.pageNumber}` : '';
        const yearInfo = chunk.reportYear ? ` (${chunk.reportYear})` : '';
        return `[Source ${index + 1}] Report: "${chunk.filename}"${yearInfo}${pageInfo}:\n${chunk.content}`;
      })
      .join('\n\n');

    const systemPrompt = `You are a statistical research assistant for the National Institute of Statistics of Rwanda (NISR). You answer questions strictly using the provided document context, with full academic rigour.

Follow these rules:

1. GREETINGS: If the user's message is a greeting or casual remark (e.g. "hey", "hello", "hi"), respond warmly, introduce yourself as the Ask DHS Intelligence assistant, and invite them to ask a question about Rwanda's statistics.

2. COMPLETENESS: Always give the FULL, COMPLETE answer. Never summarise or truncate data. If the context contains a breakdown (e.g. percentages per category, per province, per age group), list ALL values — do not cherry-pick one or two.

3. STRUCTURED OUTPUT: Present data using markdown tables wherever applicable. Use bullet lists for narrative findings. Do not write long unbroken paragraphs of numbers.

4. CITATIONS — MANDATORY: After every fact, table, or figure, you MUST cite the exact source in this format:
   > *Source: [Report Name], Page [X]*
   This is non-negotiable. Researchers must be able to trace every figure back to its exact report and page.

5. PROVINCE NAMES: In context tables, the labels "East", "West", "North", "South" refer to "Eastern Province", "Western Province", "Northern Province", "Southern Province" respectively.

6. NOT FOUND: For factual questions where the context has no answer, respond with exactly: "not found in documents". Do not invent or extrapolate data.

7. TONE: Be clear, precise, and professional. Avoid vague summaries when exact data is available.`;


    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })).slice(-10), // Keep last 10 messages for conversation context
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}\n\nPlease answer the question based only on the context provided above.`
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.1,
      max_tokens: 2000
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('LLM answer generation failed:', error);
    throw error;
  }
}

/**
 * Rewrites a follow-up question into a complete standalone search query
 * using the conversation history, so vague references like "they" or "it"
 * are expanded into full, searchable phrases.
 *
 * @param {string} question - The current user question (may be vague)
 * @param {Array<{role: string, content: string}>} conversationHistory - Prior messages
 * @returns {Promise<string>} A complete, standalone search query
 */
async function rewriteQuery(question, conversationHistory = []) {
  // If there's no history, the question is already standalone
  if (conversationHistory.length === 0) return question;

  // Build a short summary of recent conversation for context
  const recentHistory = conversationHistory.slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.substring(0, 300)}`)
    .join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a search query rewriter for a statistical document database.
Given a conversation history and a follow-up question, rewrite the follow-up question into a single, complete, self-contained search query that captures the full intent — including any context implied by pronouns ("they", "it", "those", "them") or references from prior messages.
Return ONLY the rewritten query, nothing else. No explanations, no quotes.`
        },
        {
          role: 'user',
          content: `Conversation so far:\n${recentHistory}\n\nFollow-up question: "${question}"\n\nRewritten standalone search query:`
        }
      ],
      temperature: 0,
      max_tokens: 80
    });
    const rewritten = response.choices[0].message.content.trim();
    console.log(`[Query rewrite] "${question}" → "${rewritten}"`);
    return rewritten || question;
  } catch (err) {
    console.warn('Query rewrite failed, using original:', err.message);
    return question;
  }
}

/**
 * Generates a short title for a new conversation based on the first message content.
 * @param {string} firstMessage - The first message in the conversation
 * @returns {Promise<string>} A short title (max 6 words)
 */
async function generateConversationTitle(firstMessage) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Generate a short, descriptive title (max 6 words) for a conversation that starts with this message: "${firstMessage}". Return only the title text.`
        }
      ],
      temperature: 0.7,
      max_tokens: 30
    });

    return response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Failed to generate conversation title:', error);
    return 'New Conversation';
  }
}

module.exports = {
  generateAnswer,
  rewriteQuery,
  generateConversationTitle
};