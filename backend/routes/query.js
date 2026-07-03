const express = require('express');
const router = express.Router();
const db = require('../db');
const embedService = require('../services/embedService');
const llmService = require('../services/llmService');

// Helper to translate filename to a clean, user-friendly full-word name (bolded in Markdown) without extensions
function formatDocumentName(originalName) {
  // Remove file extension
  let cleanName = originalName.replace(/\.[^/.]+$/, "");
  
  const lower = cleanName.toLowerCase();
  if (lower.includes("rdh7") || lower.includes("dhs")) {
    return "Demographic and Health Survey (DHS)";
  }
  if (lower.includes("ahs") || lower.includes("agricultural")) {
    return "Agricultural Household Survey (AHS)";
  }
  if (lower.includes("eicv")) {
    return "Integrated Household Living Conditions Survey (EICV)";
  }
  if (lower.includes("census")) {
    return "National Population and Housing Census";
  }

  // Fallback: title case the file name after replacing dashes/underscores with spaces
  cleanName = cleanName.replace(/[_-]/g, " ").trim();
  return cleanName.split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.substring(1))
    .join(' ');
}

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

    // 1.5. Detect all conversational inputs to bypass vector search
    const cleanQuery = question.trim().replace(/[!?.,\s]+$/, '').trim();

    // Greetings
    const GREETING_REGEX = /^(hello(\s+there|\s+assistant|\s+dhs)?|hi(\s+there|\s+assistant|\s+dhs)?|hey(\s+there)?|greetings|good\s+morning|good\s+afternoon|good\s+evening|howdy|yo)$/i;
    // Thanks
    const THANKS_REGEX = /^(thank\s+you(\s+very\s+much|\s+so\s+much)?|thanks(\s+a\s+lot|\s+so\s+much|\s+again)?|appreciate\s+it|many\s+thanks)$/i;
    // Farewells
    const FAREWELL_REGEX = /^(goodbye|bye(\s+bye)?|see\s+you(\s+later)?|farewell|take\s+care|have\s+a\s+(good|great)\s+day)$/i;
    // Small talk / identity
    const SMALL_TALK_REGEX = /^(how\s+are\s+you(\s+doing|\s+today|\s+doing\s+today)?|who\s+are\s+you|what\s+can\s+you\s+do|what\s+are\s+you|tell\s+me\s+about\s+yourself|how'?s\s+it\s+going|what'?s\s+up|sup)$/i;
    // Short acknowledgements
    const ACKNOWLEDGEMENT_REGEX = /^(ok|okay|alright(\s+then)?|got\s+it|i\s+see|i\s+understand|understood|noted|makes\s+sense|sure(\s+thing)?|of\s+course|that\s+makes\s+sense|interesting|cool|great|nice|wow|perfect|excellent|sounds\s+good|fair\s+enough|no\s+(problem|worries)|i\s+got?\s+it|roger\s+that|right|yep|yup|nope|indeed|absolutely|definitely|certainly|very\s+well|i\s+hear\s+you)$/i;
    // Conversation starters / openers
    const STARTER_REGEX = /^(let'?s?\s+(now\s+)?(start|begin|go)|let\s+us\s+(now\s+)?(start|begin|go)|i'?m\s+ready|shall\s+we\s+(start|begin)|let\s+me\s+ask\s+you\s+(something|a\s+question)|ready|here\s+we\s+go|let'?s\s+do\s+this)$/i;
    // Continuation prompts
    const CONTINUATION_REGEX = /^(tell\s+me\s+more|continue|go\s+on|keep\s+going|and(\s+then)?|what\s+else|more(\s+please)?|elaborate|expand(\s+on\s+that)?|go\s+ahead)$/i;
    // Confusion / clarification requests
    const CONFUSION_REGEX = /^(i\s+(don'?t|do\s+not)\s+understand|can\s+you\s+(explain|clarify|rephrase|say\s+that\s+again)(\s+that|\s+please)?|what\s+do\s+you\s+mean|i'?m\s+confused|could\s+you\s+clarify|please\s+explain|i\s+didn'?t\s+get\s+that|say\s+that\s+again(\s+please)?|repeat\s+that(\s+please)?)$/i;
    // Surprise / interest
    const SURPRISE_REGEX = /^(wow\s+really|really|is\s+that\s+so|that'?s\s+(surprising|amazing|incredible|interesting|a\s+lot|huge)|no\s+way|seriously|are\s+you\s+serious|unbelievable)$/i;
    // Affirmations
    const AFFIRMATION_REGEX = /^(yes|yeah|yep|yup|correct|exactly|that'?s\s+right|i\s+agree|true|precisely|spot\s+on|you'?re\s+right|right\s+on|for\s+sure)$/i;
    // Negative short responses
    const NEGATIVE_REGEX = /^(no|nope|nah|not\s+really|i\s+(don'?t|do\s+not)\s+think\s+so|i'?m\s+not\s+sure|not\s+sure)$/i;
    // Help requests
    const HELP_REGEX = /^(help|help\s+me|i\s+need\s+help|how\s+do\s+i\s+use\s+this|what\s+can\s+i\s+ask|guide\s+me|show\s+me\s+how|how\s+does\s+this\s+work)$/i;
    // Frustration / complaints
    const FRUSTRATION_REGEX = /^(that'?s\s+(wrong|incorrect|not\s+right|not\s+helpful|not\s+what\s+i\s+(asked|wanted|needed|meant))|you\s+didn'?t\s+answer(\s+my\s+question)?|try\s+again|rephrase(\s+that)?|not\s+helpful|wrong\s+answer|that\s+doesn'?t\s+help|that\s+is\s+not\s+what\s+i\s+asked|incorrect)$/i;
    // Filler / thinking words
    const FILLER_REGEX = /^(hmm+|hm|huh|ugh|wait|well|ok\s+then|erm|um|uhh?|let\s+me\s+think|give\s+me\s+a\s+moment|one\s+moment|one\s+sec|just\s+a\s+(moment|sec))$/i;
    // Capabilities / Info requests
    const CAPABILITIES_REGEX = /^(what|which)\s+(information|documents|reports|data|files)\s+(do\s+you\s+have|are\s+available|can\s+you\s+(provide|give|search))((\s+right\s+now|\s+currently))?|tell\s+me\s+(about\s+)?(all\s+)?(the\s+)?(information|documents|reports|data)\s+(you\s+have|available)|list\s+(all\s+)?(your\s+)?(documents|reports|information)/i;

    let isConversational =
      GREETING_REGEX.test(cleanQuery)     ||
      THANKS_REGEX.test(cleanQuery)       ||
      FAREWELL_REGEX.test(cleanQuery)     ||
      SMALL_TALK_REGEX.test(cleanQuery)   ||
      ACKNOWLEDGEMENT_REGEX.test(cleanQuery) ||
      STARTER_REGEX.test(cleanQuery)      ||
      CONTINUATION_REGEX.test(cleanQuery) ||
      CONFUSION_REGEX.test(cleanQuery)    ||
      SURPRISE_REGEX.test(cleanQuery)     ||
      AFFIRMATION_REGEX.test(cleanQuery)  ||
      NEGATIVE_REGEX.test(cleanQuery)     ||
      HELP_REGEX.test(cleanQuery)         ||
      FRUSTRATION_REGEX.test(cleanQuery)  ||
      FILLER_REGEX.test(cleanQuery)       ||
      CAPABILITIES_REGEX.test(cleanQuery);

    // Fallback: use LLM classifier for natural phrasing not caught by regex
    // NOTE: Acronym questions ("what is DHS?") are intentionally classified as FACTUAL
    // so they get answered from the documents, not from the LLM's built-in knowledge.
    if (!isConversational) {
      isConversational = await llmService.isConversationalQuery(question);
    }

    let chunksForLLM = [];
    let sources = [];

    if (!isConversational) {
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
      chunksForLLM = relevantChunks.map(chunk => ({
        content: chunk.excerpt,
        filename: chunk.document,
        pageNumber: chunk.page_number || null,
        reportYear: chunk.report_year || null
      }));

      // 7. Format sources for the response
      sources = relevantChunks.map(chunk => ({
        document: chunk.document,
        page_number: chunk.page_number || null,
        report_year: chunk.report_year || null,
        excerpt: chunk.excerpt,
        similarity: parseFloat(chunk.similarity || 0)
      }));
    }

    // 5.5. Get all available document names for fallback response formatting (deduplicated by friendly name)
    const docsResult = await db.query(
      `SELECT DISTINCT ON (original_name) original_name, year FROM documents WHERE status = 'ready' ORDER BY original_name ASC, year DESC`
    );
    // Further deduplicate by formatted display name to avoid e.g. two DHS documents showing as same label
    const seenNames = new Set();
    const availableDocs = docsResult.rows.reduce((acc, d) => {
      const formatted = `**${formatDocumentName(d.original_name)}**${d.year ? ` (${d.year})` : ''}`;
      if (!seenNames.has(formatted)) {
        seenNames.add(formatted);
        acc.push(formatted);
      }
      return acc;
    }, []);

    // 6. Generate RAG answer (pass the ORIGINAL question, not rewritten — for natural response)
    const answer = await llmService.generateAnswer(question, chunksForLLM, conversationHistory, availableDocs);

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