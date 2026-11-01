// Pure posture maths on MediaPipe Pose landmarks (normalised x/y/z, 33 points).
export const LM = { NOSE: 0, L_EAR: 7, R_EAR: 8, L_SH: 11, R_SH: 12, L_HIP: 23, R_HIP: 24 };

// Angle (degrees) of the line a->b relative to horizontal, in pixel space. Result in (-90, 90].
export function lineTilt(a, b, aspect = 1) {
  let deg = (Math.atan2((b.y - a.y), (b.x - a.x) * aspect) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg <= -90) deg += 180;
  return deg;
}
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 });
const ok = (p) => p && (p.visibility === undefined || p.visibility > 0.5);

// Each metric: warn = degrees/ratio where it becomes noticeable, max = where it's severe.
export const METRICS = {
  shoulderTilt: { label: 'Shoulder level', unit: '°', warn: 2, max: 10 },
  hipTilt: { label: 'Hip level', unit: '°', warn: 2, max: 10 },
  headTilt: { label: 'Head tilt', unit: '°', warn: 3, max: 12 },
  headShift: { label: 'Head centring', unit: '%', warn: 8, max: 30 },
  trunkLean: { label: 'Spine lean', unit: '°', warn: 3, max: 12 },
  forwardHead: { label: 'Forward head', unit: '%', warn: 15, max: 60 },
};

export function analysePosture(lm, aspect = 16 / 9) {
  if (!lm || ![LM.L_SH, LM.R_SH, LM.L_EAR, LM.R_EAR, LM.NOSE].every((i) => ok(lm[i]))) return null;
  const lsh = lm[LM.L_SH], rsh = lm[LM.R_SH];
  const shW = Math.hypot((rsh.x - lsh.x) * aspect, rsh.y - lsh.y) || 1e-6;
  const shMid = mid(lsh, rsh);
  const earMid = mid(lm[LM.L_EAR], lm[LM.R_EAR]);
  const raw = {
    shoulderTilt: lineTilt(lsh, rsh, aspect),
    headTilt: lineTilt(lm[LM.L_EAR], lm[LM.R_EAR], aspect),
    headShift: ((lm[LM.NOSE].x - shMid.x) * aspect / shW) * 100,
    // ears ahead of shoulders (smaller z = closer to camera)
    forwardHead: Math.max(0, ((shMid.z - earMid.z) / (shW / aspect)) * 100),
  };
  if (ok(lm[LM.L_HIP]) && ok(lm[LM.R_HIP])) {
    const hMid = mid(lm[LM.L_HIP], lm[LM.R_HIP]);
    raw.hipTilt = lineTilt(lm[LM.L_HIP], lm[LM.R_HIP], aspect);
    raw.trunkLean = (Math.atan2((shMid.x - hMid.x) * aspect, hMid.y - shMid.y) * 180) / Math.PI;
  }
  return scoreMetrics(raw);
}

export function scoreMetrics(raw) {
  const metrics = {};
  let total = 0, n = 0;
  for (const [k, v] of Object.entries(raw)) {
    const m = METRICS[k];
    if (!m || !Number.isFinite(v)) continue;
    const mag = Math.abs(v);
    const severity = Math.min(1, Math.max(0, (mag - m.warn) / (m.max - m.warn)));
    metrics[k] = { ...m, value: v, severity, status: severity === 0 ? 'good' : severity < 0.5 ? 'mild' : 'poor', side: v < 0 ? 'left' : 'right' };
    total += severity; n++;
  }
  const score = n ? Math.round(100 * (1 - total / n)) : 0;
  return { metrics, score, issues: Object.entries(metrics).filter(([, m]) => m.severity > 0).sort((a, b) => b[1].severity - a[1].severity).map(([k]) => k) };
}
