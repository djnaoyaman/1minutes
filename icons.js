// Decorative exhibition symbols are geometry, never platform emoji glyphs.
const symbols = {
  "wait": "<circle cx=\"24\" cy=\"24\" r=\"2.5\" fill=\"currentColor\" stroke=\"none\"/>",
  "flow": "<path d=\"M10 36 36 10M13 10h23v23\"/>",
  "anticipation": "<path d=\"M14 5h20v38H14zM30 5v38\"/>",
  "count": "<circle cx=\"24\" cy=\"24\" r=\"18\"/>",
  "overload": "<path d=\"M6 6h36v36H6zM18 6v36M30 6v36M6 18h36M6 30h36\"/>",
  "stillness": "<circle cx=\"24\" cy=\"24\" r=\"18\"/><path d=\"M24 6a18 18 0 0 0 0 36z\" fill=\"currentColor\" stroke=\"none\"/>",
  "memory": "<path d=\"m13 10 29 0-7 28H6z\"/>",
  "choice": "<path d=\"M24 43V25M9 7v10l15 10 15-10V7\"/>",
  "repetition": "<path d=\"M7 13h34M7 24h34M7 35h34\"/>",
  "novelty": "<path d=\"M24 3v42M3 24h42M9 9l30 30M9 39 39 9\"/>",
  "rhythm": "<path d=\"M3 24C10 1 17 1 24 24s14 23 21 0\"/>",
  "synchrony": "<circle cx=\"15\" cy=\"24\" r=\"12\" stroke-dasharray=\"2 4\"/><circle cx=\"33\" cy=\"24\" r=\"12\" stroke-dasharray=\"2 4\"/>"
};
export function exhibitIcon(id) {
  const shape = symbols[id];
  if (!shape) throw new Error(`Unknown exhibition icon: ${id}`);
  return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter">${shape}</svg>`;
}
export const arrowIcon = exhibitIcon('flow');
