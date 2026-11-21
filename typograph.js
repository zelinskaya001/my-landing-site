/* Typograph — keeps short words from hanging at the end of a line.
   On load (and for any text added later, e.g. the form's thank-you message) it puts a non-breaking space
   after short function words of 1–3 letters (articles, prepositions, conjunctions, particles — English and
   Russian) and before a dash. Only text is touched: never attributes, form fields, scripts or styles. */
(() => {
  const NBSP = ' ';
  const SHORT = [
    // English
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'of', 'by', 'for', 'per', 'off', 'up', 'via',
    'and', 'or', 'but', 'nor', 'so', 'yet', 'if', 'as', 'no', 'not',
    // Russian
    'в', 'во', 'с', 'со', 'к', 'ко', 'и', 'а', 'но', 'на', 'по', 'за', 'не', 'ни', 'о', 'об', 'у', 'из', 'от',
    'до', 'без', 'для', 'при', 'про', 'под', 'над', 'что', 'как', 'же', 'ли', 'бы',
  ];
  // a short word on its own (not the end of a longer or hyphenated word) followed by ordinary spaces
  const AFTER_SHORT = new RegExp(`(?<![\\p{L}\\p{N}'’\\-])(${SHORT.join('|')})[ \\t\\r\\n]+(?=\\S)`, 'giu');
  const BEFORE_DASH = /(?<=\S)[ \t\r\n]+(?=[–—])/g;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE', 'SVG']);

  const fixText = s => s.replace(AFTER_SHORT, `$1${NBSP}`).replace(BEFORE_DASH, NBSP);

  function typograph(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      const p = root.parentElement;
      if (!p || SKIP.has(p.tagName.toUpperCase()) || p.isContentEditable) return;
      const t = fixText(root.nodeValue);
      if (t !== root.nodeValue) root.nodeValue = t;   // unchanged text is left alone (no loops with the observer)
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || SKIP.has(root.tagName.toUpperCase())) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(typograph);
  }

  const start = () => {
    typograph(document.body);
    new MutationObserver(records => records.forEach(r => {
      if (r.type === 'characterData') typograph(r.target);
      else r.addedNodes.forEach(typograph);
    })).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.typograph = typograph; // e.g. typograph(element) after inserting text by hand
})();
