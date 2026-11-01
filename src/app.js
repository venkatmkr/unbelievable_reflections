import { Mirror } from './core/registry.js';
import { startVoice } from './core/voice.js';
import { createPostureModule } from './modules/posture/index.js';
import { createRetailModule } from './modules/retail/index.js';
import { createHealthModule } from './modules/health/index.js';

// To add a module: create {id,name,icon,update,draw,panel} and add it to this list.
const modules = [createPostureModule(), createRetailModule(), createHealthModule()];

const $ = (s) => document.querySelector(s);
const video = $('#cam'), canvas = $('#view'), g = canvas.getContext('2d');
const mirror = new Mirror();
const ctx = { shared: {} };
let current = 'posture';

async function loadPose() {
  const base = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const { PoseLandmarker, FilesetResolver } = await import(`${base}/vision_bundle.mjs`);
  const fs = await FilesetResolver.forVisionTasks(`${base}/wasm`);
  return PoseLandmarker.createFromOptions(fs, {
    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: 'GPU' },
    runningMode: 'VIDEO', numPoses: 1,
  });
}

function renderTabs() {
  $('#tabs').innerHTML = modules.map((m) => `<button data-tab="${m.id}" class="${m.id === current ? 'on' : ''}">${m.icon} ${m.name}</button>`).join('');
}
function renderPanel() {
  const m = mirror.modules.get(current);
  $('#panel').innerHTML = m.panel();
}

async function main() {
  modules.forEach((m) => mirror.register(m));
  for (const m of modules) await mirror.enable(m.id, ctx);
  renderTabs();
  $('#tabs').onclick = (e) => { if (e.target.dataset.tab) { current = e.target.dataset.tab; renderTabs(); renderPanel(); } };
  $('#panel').onclick = (e) => { const m = mirror.modules.get(current); m.onClick?.(e.target); renderPanel(); };
  $('#panel').onchange = (e) => { if (e.target.files?.[0]) mirror.modules.get(current).onFile?.(e.target.files[0]); };

  $('#status').textContent = 'Requesting camera & microphone…';
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: true }).catch(() =>
    navigator.mediaDevices.getUserMedia({ video: true }));
  video.srcObject = stream; await video.play();
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  $('#status').textContent = 'Loading pose model…';
  const pose = await loadPose();
  $('#status').textContent = '';

  startVoice((t) => {
    const a = mirror.activeModules();
    const hit = a.map((m) => m.onVoice?.(t)).find(Boolean);
    if (hit) speechSynthesis.speak(new SpeechSynthesisUtterance(hit));
    const tab = modules.find((m) => new RegExp(m.name, 'i').test(t));
    if (tab) { current = tab.id; renderTabs(); renderPanel(); }
  });

  let last = 0, panelT = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (video.readyState < 2 || now === last) return;
    last = now;
    const res = pose.detectForVideo(video, now);
    const frame = { video, width: canvas.width, height: canvas.height, landmarks: res.landmarks?.[0] || null };
    g.save(); g.translate(canvas.width, 0); g.scale(-1, 1); g.drawImage(video, 0, 0); g.restore();
    mirror.run('update', frame, ctx);
    mirror.run('draw', g, frame, ctx);
    if (now - panelT > 250 && !document.activeElement?.matches('input')) { panelT = now; renderPanel(); }
  };
  requestAnimationFrame(loop);
}
main().catch((e) => { $('#status').textContent = 'Error: ' + e.message; });
