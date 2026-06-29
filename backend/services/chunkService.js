/**
 * Chunks a PDF page-by-page so that no chunk ever crosses a page boundary.
 * Each page is split into sub-chunks only if the page text is too long.
 * Every chunk is tagged with the EXACT page number it came from.
 *
 * @param {Array<{pageNum: number, text: string}>} pages - Per-page text from pdfService
 * @param {number} wordsPerChunk - Max words per chunk (default 400)
 * @returns {Array<{content: string, chunkIndex: number, pageNumber: number}>}
 */
function chunkText(pages, wordsPerChunk = 400) {
  if (!pages || pages.length === 0) return [];

  const chunks = [];
  let chunkIndex = 0;

  for (const page of pages) {
    if (!page.text || page.text.trim().length < 80) {
      // Skip nearly-empty pages (cover pages, page numbers, blank pages)
      continue;
    }

    const words = page.text.split(/\s+/).filter(w => w.length > 0);

    if (words.length <= wordsPerChunk) {
      // Short page — treat the entire page as one chunk
      chunks.push({
        content: words.join(' '),
        chunkIndex: chunkIndex++,
        pageNumber: page.pageNum
      });
    } else {
      // Long page — split into sub-chunks, ALL tagged with this page's number
      let i = 0;
      while (i < words.length) {
        const slice = words.slice(i, i + wordsPerChunk);
        const content = slice.join(' ').trim();
        if (content.length >= 80) {
          chunks.push({
            content,
            chunkIndex: chunkIndex++,
            pageNumber: page.pageNum  // always the SAME page number for all sub-chunks
          });
        }
        i += wordsPerChunk; // no overlap needed — same page, sequential
      }
    }
  }

  return chunks;
}

module.exports = chunkText;