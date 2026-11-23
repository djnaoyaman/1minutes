// Events contain public exhibition IDs only, never measurements or answers.
(() => {
  'use strict';
  if (window.trackOneMinute) return;
  const id = 'G-L3X8XHP35G';
  const names = new Set(['experience_start', 'experience_complete', 'share']);
  const fields = new Set(['experience_type', 'content_id', 'content_type', 'item_id', 'method']);
  const pages = new Set(['/1minutes/', '/1minutes/index.html', '/1minutes/breath.html', '/1minutes/frequency.html', '/1minutes/sensory.html']);
  window.trackOneMinute = (name, params = {}) => {
    if (location.origin !== 'https://djnaoyaman.github.io' || !pages.has(location.pathname) || !names.has(name) || window['ga-disable-' + id] || typeof window.gtag !== 'function') return;
    try {
      const safe = {send_to:id, page_location:'https://djnaoyaman.github.io' + location.pathname, page_referrer:''};
      for (const [key, value] of Object.entries(params)) {
        if (fields.has(key) && typeof value === 'string' && /^[a-z0-9_-]{1,60}$/.test(value)) safe[key] = value;
      }
      window.gtag('event', name, safe);
    } catch { /* The experience stays usable if analytics is unavailable. */ }
  };
})();
