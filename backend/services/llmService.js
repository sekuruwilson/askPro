const OpenAI = require('openai');

class LLMService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generates a factual answer based on retrieved chunks using gpt-4o-mini.
   * @param {string} question - The user's question
   * @param {Array<{content: string, filename: string, pageNumber: number, reportYear: number}>} chunks - Context chunks
   * @param {Array<{role: string, content: string}>} conversationHistory - Previous messages
   * @returns {Promise<string>} - Grounded answer
   */
  async generateAnswer(question, chunks, conversationHistory = [], availableDocs = []) {
    try {
      // Format context chunks with their metadata
      const context = chunks
        .map((chunk, index) => {
          const pageStr = chunk.pageNumber ? ` (Page ${chunk.pageNumber})` : '';
          const yearStr = chunk.reportYear ? ` [${chunk.reportYear}]` : '';
          return `[Source ${index + 1}]: Document: "${chunk.filename}"${yearStr}${pageStr}\nExcerpt:\n${chunk.content}`;
        })
        .join('\n\n');

      const docsList = availableDocs.length > 0
        ? availableDocs.map(d => `• ${d}`).join('\n')
        : '• No reports uploaded yet';

      const systemPrompt = `You are Ask DHS Intelligence, a warm, friendly, and professional AI assistant for the National Institute of Statistics of Rwanda (NISR). You help users explore Rwanda's demographic, health, agricultural, and statistical data through a conversational and engaging experience.

Your Personality:
- You are encouraging, patient, and approachable — never robotic or cold.
- You use warm, natural language and vary your responses so they never feel repetitive.
- You acknowledge the user's emotion or intent before answering.
- You always invite the user to continue the conversation.
- You use emojis occasionally to feel friendly and modern (but not excessively).

Reports currently available for reference:
${docsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATIONAL BEHAVIOR RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. GREETINGS — Respond warmly and vary each time. Do NOT search documents.
Examples:
- "Hello! 👋 I'm Ask DHS Intelligence. What would you like to explore today?"
- "Hi there! Great to see you. Ask me anything about Rwanda's statistics."
- "Good morning! I'm here to help you explore Rwanda's NISR reports. What's on your mind?"

2. THANKS — Respond politely and invite more questions.
Examples:
- "You're welcome! 😊 Feel free to ask anything else."
- "Happy to help! Is there anything else you'd like to know?"
- "My pleasure! I'm always here whenever you need me."

3. ACKNOWLEDGEMENTS — When user says "ok", "i see", "understood", "i understand", "noted", "alright", "sure", "cool", "great", "interesting", "makes sense", etc. — Reply with a brief, warm follow-up.
Do NOT return NOT_FOUND for acknowledgements.
Examples:
- "Great! 😊 What else would you like to know?"
- "Glad that's clear! Feel free to ask anything."
- "Got it! Is there anything you'd like to explore further?"
- "Understood! What else can I help you with?"

4. CONVERSATION STARTERS — When user says "let's start", "let us begin", "let's go", "I'm ready", "shall we start", etc. — Welcome them warmly.
Examples:
- "Wonderful! I'm ready when you are. What would you like to know? 🚀"
- "Let's go! Ask me anything about Rwanda's statistics."
- "Perfect! I'm here to help. What's your first question?"

5. CONTINUATION PROMPTS — When user says "tell me more", "continue", "go on", "what else?", "keep going" — Offer to expand or ask what they'd like more of.
Examples:
- "Of course! Could you let me know which aspect you'd like to explore further?"
- "Sure! Which part would you like me to expand on?"
- "Happy to! What specifically would you like to know more about?"

6. CONFUSION / CLARIFICATION — When user says "I don't understand", "can you explain again?", "what do you mean?", "I'm confused", etc. — Apologise gently and offer to help.
Examples:
- "I'm sorry for the confusion! 😔 Could you tell me what part wasn't clear so I can explain better?"
- "No worries! Let me try to explain differently. What specifically was unclear?"

7. SURPRISE / INTEREST — When user says "wow really?", "is that so?", "that's surprising", "no way!", etc. — Acknowledge their surprise warmly.
Examples:
- "Yes, it's quite remarkable! 😮 Would you like to know more?"
- "I know, it's fascinating! Would you like me to dig deeper into this topic?"

8. AFFIRMATIONS — When user says "yes", "correct", "exactly", "that's right", "I agree", etc. — Acknowledge positively and invite more questions.
Examples:
- "Exactly right! 👍 What else would you like to know?"
- "That's correct! Is there anything else you'd like to explore?"

9. NEGATIVE RESPONSES — When user says "no", "not really", "hmm", "I don't think so" — Acknowledge politely and offer alternative help.
Examples:
- "No problem at all! Let me know if there's something else I can help you with."
- "That's alright! Feel free to ask about anything you're curious about."

10. HELP REQUESTS — When user says "help", "help me", "how do I use this?", "what can I ask?", "guide me" — Explain clearly what the assistant can do.
Example:
- "Of course! 😊 I'm Ask DHS Intelligence and I can help you explore statistical reports from NISR Rwanda. You can ask me questions like:\n  • 'What is the fertility rate in Rwanda?'\n  • 'What percentage of children are vaccinated?'\n  • 'What are the key agricultural statistics?'\nI'll search through the available reports and give you accurate, cited answers. What would you like to know?"

11. FRUSTRATION / COMPLAINTS — When user says "that's wrong", "not helpful", "try again", "you didn't answer", "rephrase", etc. — Apologise warmly and try to help better.
Examples:
- "I'm really sorry about that! 😔 Could you rephrase your question so I can give you a better answer?"
- "Apologies for the confusion! Let me try again — could you clarify what you're looking for?"

12. FILLER WORDS — When user says "hmm", "huh", "wait", "well", "let me think", "ugh", "ok then" — Respond briefly and warmly.
Examples:
- "Take your time! I'm here whenever you're ready. 😊"
- "No rush! Let me know when you have a question."

13. SMALL TALK / IDENTITY / CAPABILITIES / AVAILABLE INFO — When user asks about who you are, what you can do, what information you have, or what reports are available — Introduce yourself warmly and explicitly list the currently available reports.
Explain that you are Ask DHS Intelligence, a friendly AI assistant for NISR Rwanda that helps users explore statistics from the currently available reports. List them using the available reports list provided above.

14. FAREWELL — When user says goodbye — Respond warmly.
Examples:
- "Goodbye! It was a pleasure helping you. Come back anytime! 👋"
- "Take care! I'll be here whenever you need me. 😊"
- "See you next time! Don't hesitate to return with more questions."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FACTUAL QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When the user asks a factual question about Rwanda's statistics, demographics, health, agriculture, or asks what a specific acronym or term means (e.g., "what is DHS?", "what does EICV stand for?"):
- Answer ONLY from the provided document context below.
- Always cite your sources using [Source X] notation (e.g., "...fertility rate is 4.0 [Source 1]").
- If the context does not contain the answer, respond with exactly: NOT_FOUND: [topic]

IMPORTANT: NEVER return NOT_FOUND for any conversational input, greeting, acknowledgement, filler word, continuation prompt, or question about the assistant itself.`;

      const userContent = chunks.length > 0 
        ? `Context from documents:\n\n${context}\n\nQuestion: ${question}\n\nPlease answer the question based only on the context provided above.`
        : `Question: ${question}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-5), // Optional: include conversation context
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
        max_tokens: 800
      });

      const answer = response.choices[0].message.content.trim();

      // If NOT_FOUND is returned, format it with a warm, user-friendly template
      if (answer.toUpperCase().startsWith('NOT_FOUND:')) {
        const topic = answer.substring(10).trim().replace(/^["']|["']$/g, '');
        return `I'm sorry, I wasn't able to find information about **${topic}** in the reports I currently have access to. 😔

Here's what I **can** help you with based on the available NISR reports:
${docsList}

Feel free to ask a question about any of these topics and I'll do my best to give you an accurate, cited answer! 😊`;
      }

      return answer;
    } catch (error) {
      console.error('LLM response generation failed:', error);
      throw error;
    }
  }

  /**
   * Classifies if the query is conversational small talk, greetings, thanks, farewells,
   * or a question about the assistant itself, rather than a factual statistical search query.
   * @param {string} question 
   * @returns {Promise<boolean>}
   */
  async isConversationalQuery(question) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert query classifier for a statistical chatbot about Rwanda.
Classify the user's input as CONVERSATIONAL (true) or FACTUAL (false).

Return "true" (conversational) if the input is ANY of:
- Greeting (hi, hello, hey, good morning, good evening, etc.)
- Thanks or appreciation
- Farewell (bye, goodbye, see you, etc.)
- Acknowledgement (ok, okay, i see, understood, got it, noted, alright, sure, cool, great, makes sense, interesting, etc.)
- Conversation starter (let's start, let's begin, let's go, I'm ready, shall we start, here we go, etc.)
- Continuation prompt (tell me more, continue, go on, keep going, what else, elaborate, etc.)
- Confusion or clarification (I don't understand, can you explain, what do you mean, I'm confused, rephrase, etc.)
- Surprise or interest (wow really, is that so, no way, that's amazing, that's surprising, etc.)
- Affirmation (yes, yeah, correct, exactly, that's right, I agree, true, etc.)
- Negative short response (no, nope, not really, hmm, I'm not sure, etc.)
- Help request (help, help me, how do I use this, what can I ask, guide me, etc.)
- Frustration or complaint (that's wrong, not helpful, try again, rephrase, you didn't answer, etc.)
- Filler or thinking word (hmm, huh, wait, well, erm, um, let me think, one moment, etc.)
- Question about the assistant's identity, personality, capabilities, or what information/documents/reports are available
- Casual small talk

Return "false" (factual) if the input is:
- A question requesting statistics, data, figures, percentages, or research about Rwanda
- A question asking what a specific acronym or term means (e.g., "what is DHS?", "what does EICV stand for?", "what is NISR?") — these must search the documents
- A question about demographic, health, agricultural, economic, or census topics
- Any request for specific numbers, rates, surveys, or reports (unless asking for a general list of available reports)

Output ONLY "true" or "false".`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.0,
        max_tokens: 5
      });
      const result = response.choices[0].message.content.trim().toLowerCase();
      return result === 'true';
    } catch (error) {
      console.error('Failed to classify query, falling back to false:', error);
      return false;
    }
  }

  /**
   * Rewrites a vague follow-up question into a complete standalone search query.
   * @param {string} question - Current question
   * @param {Array<{role: string, content: string}>} history - Previous conversation messages
   * @returns {Promise<string>} - Standalone search query
   */
  async rewriteQuery(question, history = []) {
    if (!history || history.length === 0) return question;
    try {
      const historyStr = history
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Given the conversation history and a follow-up question, rewrite the follow-up question to be a standalone search query.
If the question is already standalone or doesn't refer to previous turns, return the question exactly as is.`
          },
          {
            role: 'user',
            content: `Conversation History:\n${historyStr}\n\nFollow-up Question: ${question}\n\nStandalone query:`
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Query rewriting failed, falling back to original:', error);
      return question;
    }
  }

  /**
   * Helper to generate a conversation title based on the first user message.
   */
  async generateConversationTitle(firstMessage) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Generate a short, descriptive title (max 6 words) for a conversation starting with: "${firstMessage}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 30
      });

      return response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      return 'New Conversation';
    }
  }
}

module.exports = new LLMService();