// Wellness heuristics from skin-region pixels. NOT a medical diagnosis.
// Input: RGBA pixel array (Uint8ClampedArray) of a skin patch (e.g. forehead/cheeks).
export function skinStats(rgba) {
  let r = 0, g = 0, b = 0, n = 0;
  const lums = [];
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; n++;
    lums.push(0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]);
  }
  if (!n) return null;
  r /= n; g /= n; b /= n;
  const lum = lums.reduce((a, c) => a + c, 0) / n;
  const variance = lums.reduce((a, c) => a + (c - lum) ** 2, 0) / n;
  return { r, g, b, lum, texture: Math.sqrt(variance) };
}

export function assessHealth(stats, { posture } = {}) {
  if (!stats) return null;
  const { r, g, b, lum, texture } = stats;
  const tips = [];
  let score = 80;
  const redness = r / (g + 1);
  const yellow = (r + g) / 2 / (b + 1);
  if (lum < 70) { tips.push('Lighting is dim; improve light for a more reliable reading.'); score -= 5; }
  if (lum > 225) { tips.push('Lighting is very bright; reduce glare for a more reliable reading.'); score -= 5; }
  if (redness > 1.55) { tips.push('Skin looks flushed: stay hydrated, limit caffeine/alcohol and check stress and sun exposure.'); score -= 10; }
  else if (redness < 1.12) { tips.push('Complexion looks pale: consider iron- and B12-rich foods, sleep and sunlight; see a doctor if persistent.'); score -= 10; }
  if (yellow > 1.9 && redness < 1.4) { tips.push('A yellowish cast was detected; if it persists, have a doctor check it.'); score -= 8; }
  if (texture > 28) { tips.push('Uneven skin tone/texture: hydrate, use sunscreen and aim for 7-9h sleep.'); score -= 8; }
  if (posture && posture.score < 60) { tips.push('Poor posture can affect breathing and energy: follow the posture module yoga suggestions.'); score -= 7; }
  if (!tips.length) tips.push('Complexion looks balanced. Keep up hydration, sleep and movement.');
  return { score: Math.max(0, Math.min(100, score)), tips, disclaimer: 'Wellness estimate only, not a medical diagnosis.' };
}
