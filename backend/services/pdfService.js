const pdfParse = require('pdf-parse');

/**
 * Extract text per page from a PDF buffer.
 * @param {Buffer} buffer - Raw PDF file bytes (from Multer memoryStorage)
 * @returns {Promise<{ pages: Array<{pageNum: number, text: string}>, numPages: number }>}
 */
async function extractText(buffer) {
  try {
    // Collect each page's text via the pagerender callback
    const pageTexts = [];

    const options = {
      pagerender: async (pageData) => {
        const textContent = await pageData.getTextContent();
        const strings = textContent.items.map(item => item.str);
        pageTexts.push({
          pageNum: pageData.pageNumber,
          text: strings.join(' ').trim()
        });
        return strings.join(' ');
      }
    };

    const data = await pdfParse(buffer, options);
    const numPages = data.numpages || pageTexts.length || 1;

    // If pagerender populated our array, use it; otherwise fall back to full text split estimate
    if (pageTexts.length > 0) {
      const hasContent = pageTexts.some(p => p.text.length > 0);
      if (hasContent) {
        return { pages: pageTexts, numPages };
      }
    }

    // Fallback: no per-page data — wrap full text as a single "page"
    const fullText = data.text ? data.text.trim() : '';
    if (!fullText) {
      throw new Error(
        'No selectable text found in this PDF. ' +
        'It may be a scanned image — please upload a text-based PDF.'
      );
    }
    return {
      pages: [{ pageNum: 1, text: fullText }],
      numPages
    };
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

module.exports = extractText;