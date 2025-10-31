// backend/backendLogic.js
// Word Rewriter — background script
// Handles rewriting text for clarity with different tones
// Expanded with smart contractions and context-aware "ain't" handling

console.log('Word Rewriter background script loaded');

// ----------------------------
// Helper: Contractions map
// ----------------------------
const CONTRACTIONS = {
  "can't": "cannot",
  "won't": "will not",
  "n't": " not", // e.g., didn't → did not
  "'re": " are",
  "'m": " am",
  "'ll": " will",
  "'ve": " have",
  "'d": " would",
  "'s": " is" // careful: context sensitive
};

// ----------------------------
// Class: TextProcessor
// ----------------------------
class TextProcessor {
  // Main entry: receives payload { input, tone }
  process(payload) {
    const { input, tone } = payload;
    // Step 1: rewrite text according to tone
    return this.rewriteText(input, tone);
  }

  // Rewrite text: split sentences, apply tone and contractions
  rewriteText(text, tone = 'neutral') {
    if (!text) return '';

    // Split into sentences (simple split on punctuation)
    const sentences = String(text).split(/(?<=[.!?])\s+/);

    // Apply tone and expand contractions for each sentence
    const rewrittenSentences = sentences.map(sentence => {
      let s = sentence.trim();
      s = this.expandContractions(s); // expand common contractions intelligently
      s = this.replaceAintWithContext(s); // handle "ain't" depending on subject
      s = this.applyTone(s, tone); // apply tone-specific rules
      return s;
    });

    // Rejoin sentences
    return rewrittenSentences.join(' ');
  }

  // Expand standard contractions
  expandContractions(sentence) {
    let s = sentence;

    for (const [contr, full] of Object.entries(CONTRACTIONS)) {
      const regex = new RegExp(`\\b${contr}\\b`, 'gi');
      s = s.replace(regex, full);
    }

    return s;
  }

  // Replace "ain't" based on preceding subject
  replaceAintWithContext(sentence) {
    return sentence.replace(/\b(\w+)\s+ain't\b/gi, (match, subj) => {
      const sub = subj.toLowerCase();

      if (sub === 'i') return 'am not';
      if (['he', 'she', 'it', 'that'].includes(sub)) return 'is not';
      return 'are not'; // default for plural/other subjects
    });
  }

  // Apply tone-specific transformations
  applyTone(sentence, tone) {
    let result = sentence;

    // Neutral tone: no additional changes

    // Formal tone: replace casual words with formal equivalents
    if (tone === 'formal') {
      result = result
        .replace(/\b(get)\b/gi, 'obtain')
        .replace(/\b(show)\b/gi, 'demonstrate')
        .replace(/\b(use)\b/gi, 'utilize');
    }

    // Concise tone: shorten common verbose phrases
    else if (tone === 'concise') {
      result = result
        .replace(/\b(due to the fact that)\b/gi, 'because')
        .replace(/\b(in order to)\b/gi, 'to')
        .replace(/\b(as a result of)\b/gi, 'because');
    }

    // Friendly tone: add exclamation, casual greetings
    else if (tone === 'friendly') {
      result = result
        .replace(/\b(hello)\b/gi, 'hey there')
        .replace(/\b(please)\b/gi, 'pls')
        .replace(/\./g, '!');
    }

    // Beginner-friendly: simple language
    else if (tone === 'beginner') {
      result = result
        .replace(/\b(utilize)\b/gi, 'use')
        .replace(/\b(obtain)\b/gi, 'get')
        .replace(/\b(demonstrate)\b/gi, 'show');
    }

    // Capitalize first letter and ensure punctuation
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
      if (!/[.!?]$/.test(result)) result += '.';
    }

    return result;
  }
}

// ----------------------------
// Initialize processor
// ----------------------------
const processor = new TextProcessor();

// ----------------------------
// Chrome message listener
// ----------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Ping check
    if (request.type === 'PING') {
      sendResponse({ ok: true, message: 'Ready' });
      return true;
    }

    // Process text
    if (request.type === 'PROCESS_TEXT') {
      const input = String(request.input || '').trim();
      if (!input) {
        sendResponse({ ok: false, error: 'Empty input' });
        return true;
      }

      const result = processor.process(request);
      sendResponse({ ok: true, result });
      return true;
    }
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
    return true;
  }

  // Unknown request
  sendResponse({ ok: false, error: 'Unknown request type' });
  return true;
});
