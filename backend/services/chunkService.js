/**
 * Split pages of text into overlapping word-based chunks.
 * @param {Array<{pageNum: number, text: string}>} pages - Array of page objects with pageNum and text
 * @param {number} chunkSize - Number of words per chunk (default 500)
 * @param {number} overlap - Overlapping words between chunks (default 50)
 * @returns {Array<{content: string, chunkIndex: number, pageNumber: number}>}
 */
function chunkText(pages, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let globalIndex = 0;

  for (const page of pages) {
    const pageText = page.text ? page.text.trim() : '';
    if (!pageText) continue;

    // Split by whitespace to get words
    const words = pageText.split(/\s+/);
    if (words.length === 0 || (words.length === 1 && words[0] === '')) continue;

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkWords = words.slice(start, end);
      const content = chunkWords.join(' ').trim();

      // Filter out chunks shorter than 100 characters to skip page numbers, headers, and noise
      if (content.length >= 100) {
        chunks.push({
          content,
          chunkIndex: globalIndex++,
          pageNumber: page.pageNum
        });
      }

      // Advance start by step size (chunkSize - overlap)
      const step = chunkSize - overlap;
      if (step <= 0) {
        start += chunkSize; // Fallback if overlap is somehow >= chunkSize
      } else {
        start += step;
      }
    }
  }

  return chunks;
}

module.exports = chunkText;