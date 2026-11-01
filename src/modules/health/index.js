import { skinStats, assessHealth } from './analysis.js';
import { LM } from '../posture/analysis.js';

export function createHealthModule() {
  let result = null, tick = 0;
  const cv = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  return {
    id: 'health', name: 'Health', icon: '❤️',
    update(frame, ctx) {
      if (!cv || !frame.landmarks || ++tick % 15) return; // sample ~4x/sec
      const lm = frame.landmarks, { width: W, height: H } = frame;
      const nose = lm[LM.NOSE], ear = Math.abs(lm[LM.L_EAR].x - lm[LM.R_EAR].x) * W;
      const s = Math.max(8, ear * 0.5);
      // forehead/cheek patch around the nose, above it
      const x = nose.x * W - s / 2, y = nose.y * H - s * 1.6;
      cv.width = cv.height = 16;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(frame.video, x, y, s, s, 0, 0, 16, 16);
      result = assessHealth(skinStats(g.getImageData(0, 0, 16, 16).data), { posture: ctx.shared.posture });
    },
    panel() {
      if (!result) return '<p class="muted">Face the camera in good light…</p>';
      return `<div class="score ${result.score > 70 ? 'good' : 'mild'}">${result.score}<small>/100</small></div><ul>${result.tips.map((t) => `<li>${t}</li>`).join('')}</ul><p class="muted">${result.disclaimer}</p>`;
    },
  };
}
