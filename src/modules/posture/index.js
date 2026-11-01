import { analysePosture, LM } from './analysis.js';
import { recommend } from './yoga.js';
import { Ema } from '../../core/smoothing.js';
import { scoreMetrics } from './analysis.js';

export function createPostureModule() {
  const filters = {};
  let result = null;
  return {
    id: 'posture', name: 'Posture', icon: '🧘',
    update(frame, ctx) {
      const a = analysePosture(frame.landmarks, frame.width / frame.height);
      result = a ? smoothResult(a, filters) : null;
      ctx.shared.posture = result;
    },
    draw(g, frame) {
      if (!result || !frame.landmarks) return;
      const { width: W, height: H, landmarks: lm } = frame;
      const P = (i) => ({ x: (1 - lm[i].x) * W, y: lm[i].y * H }); // mirrored
      const col = (k) => ({ good: '#4ade80', mild: '#facc15', poor: '#f87171' }[result.metrics[k]?.status || 'good']);
      const line = (a, b, k) => {
        const A = P(a), B = P(b);
        g.strokeStyle = col(k); g.lineWidth = 6; g.lineCap = 'round'; g.shadowColor = col(k); g.shadowBlur = 18;
        g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
        // ideal level reference
        const my = (A.y + B.y) / 2;
        g.shadowBlur = 0; g.setLineDash([8, 8]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(Math.min(A.x, B.x) - 30, my); g.lineTo(Math.max(A.x, B.x) + 30, my); g.stroke(); g.setLineDash([]);
      };
      line(LM.L_SH, LM.R_SH, 'shoulderTilt');
      line(LM.L_EAR, LM.R_EAR, 'headTilt');
      if (result.metrics.hipTilt) line(LM.L_HIP, LM.R_HIP, 'hipTilt');
      // plumb line from nose
      const n = P(LM.NOSE);
      g.strokeStyle = col('headShift'); g.lineWidth = 2; g.setLineDash([4, 6]);
      g.beginPath(); g.moveTo(n.x, 0); g.lineTo(n.x, H); g.stroke(); g.setLineDash([]);
      g.shadowBlur = 0;
    },
    panel() {
      if (!result) return '<p class="muted">Step back so your head and shoulders are visible…</p>';
      const rows = Object.entries(result.metrics).map(([k, m]) =>
        `<div class="row"><span>${m.label}</span><div class="bar"><i class="${m.status}" style="width:${Math.max(4, m.severity * 100)}%"></i></div><b>${Math.abs(m.value).toFixed(1)}${m.unit}${m.severity ? ' ' + m.side : ''}</b></div>`).join('');
      const recs = recommend(result).map((r) =>
        `<h4>${r.label}</h4>` + r.poses.map((p) => `<p><b>${p.name}</b><br>${p.how}</p>`).join('')).join('');
      return `<div class="score ${result.score > 80 ? 'good' : result.score > 55 ? 'mild' : 'poor'}">${result.score}<small>/100</small></div>${rows}<div class="recs">${recs || '<p>✨ Beautiful alignment. Keep breathing.</p>'}</div>`;
    },
    onVoice(text) { return /posture|how am i/i.test(text) ? `Your posture score is ${result ? result.score : 'unknown'}` : null; },
  };
}

function smoothResult(a, filters) {
  const raw = {};
  for (const [k, m] of Object.entries(a.metrics)) raw[k] = (filters[k] ||= new Ema(0.4)).push(m.value);
  return scoreMetrics(raw);
}
