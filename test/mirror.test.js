import test from 'node:test';
import assert from 'node:assert/strict';
import { Mirror } from '../src/core/registry.js';
import { analysePosture, LM, scoreMetrics } from '../src/modules/posture/analysis.js';
import { recommend } from '../src/modules/posture/yoga.js';
import { assessHealth, skinStats } from '../src/modules/health/analysis.js';
import { garmentBox } from '../src/modules/retail/index.js';

const pose = (over = {}) => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  Object.assign(lm[LM.NOSE], { x: 0.5, y: 0.2 });
  Object.assign(lm[LM.L_EAR], { x: 0.46, y: 0.2 }); Object.assign(lm[LM.R_EAR], { x: 0.54, y: 0.2 });
  Object.assign(lm[LM.L_SH], { x: 0.4, y: 0.4 }); Object.assign(lm[LM.R_SH], { x: 0.6, y: 0.4 });
  Object.assign(lm[LM.L_HIP], { x: 0.43, y: 0.7 }); Object.assign(lm[LM.R_HIP], { x: 0.57, y: 0.7 });
  for (const [i, v] of Object.entries(over)) Object.assign(lm[i], v);
  return lm;
};

test('registry enables modules and isolates failures', async () => {
  const m = new Mirror(); let ran = 0;
  m.register({ id: 'a', name: 'A', update() { throw new Error('x'); } }).register({ id: 'b', name: 'B', update() { ran++; } });
  assert.throws(() => m.register({ id: 'a', name: 'dup' }));
  await m.enable('a'); await m.enable('b');
  const err = console.error; console.error = () => {};
  m.run('update'); console.error = err;
  assert.equal(ran, 1);
  m.disable('b'); assert.equal(m.activeModules().length, 1);
});

test('perfect posture scores 100', () => {
  const a = analysePosture(pose());
  assert.equal(a.score, 100); assert.deepEqual(a.issues, []);
});

test('tilted shoulders are detected and mapped to yoga', () => {
  const a = analysePosture(pose({ [LM.R_SH]: { x: 0.6, y: 0.46 } }));
  assert.ok(a.metrics.shoulderTilt.severity > 0.5);
  assert.equal(a.issues[0], 'shoulderTilt');
  assert.ok(recommend(a)[0].poses.length > 0);
});

test('missing landmarks yield null; scoreMetrics ignores unknown', () => {
  assert.equal(analysePosture(null), null);
  assert.equal(scoreMetrics({ nope: 3 }).score, 0);
});

test('health assessment', () => {
  const px = new Uint8ClampedArray(16 * 4).map((_, i) => [200, 150, 130, 255][i % 4]);
  const h = assessHealth(skinStats(px));
  assert.ok(h.score > 0 && h.tips.length && h.disclaimer);
  assert.equal(assessHealth(null), null);
});

test('garment box anchors to shoulders and hips (mirrored)', () => {
  const b = garmentBox(pose(), 1000, 1000);
  assert.equal(Math.round(b.cx), 500); assert.equal(Math.round(b.torso), 300);
});
