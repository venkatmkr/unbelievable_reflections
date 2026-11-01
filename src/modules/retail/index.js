import { LM } from '../posture/analysis.js';

// Built-in garments are drawn procedurally; add your own image via the file picker (PNG with transparency).
export const GARMENTS = [
  { id: 'red', name: 'Crimson dress', color: '#c81e4a' },
  { id: 'blue', name: 'Midnight dress', color: '#1e3a8a' },
  { id: 'green', name: 'Emerald dress', color: '#047857' },
  { id: 'gold', name: 'Golden dress', color: '#b8860b' },
];

// Where the garment goes: shoulders -> hips (extended to knee length for dresses).
export function garmentBox(lm, W, H, extend = 1.6) {
  const sh = [lm[LM.L_SH], lm[LM.R_SH]], hp = [lm[LM.L_HIP], lm[LM.R_HIP]];
  if (!sh.every(Boolean)) return null;
  const sx = sh.map((p) => (1 - p.x) * W), sy = sh.map((p) => p.y * H);
  const cx = (sx[0] + sx[1]) / 2, shY = (sy[0] + sy[1]) / 2;
  const shW = Math.abs(sx[0] - sx[1]);
  const hipY = hp.every(Boolean) ? ((hp[0].y + hp[1].y) / 2) * H : shY + shW * 1.7;
  const angle = Math.atan2(sy[1] - sy[0], sx[1] - sx[0]) + Math.PI * (sx[1] < sx[0] ? 1 : 0);
  return { cx, shY, shW, torso: hipY - shY, length: (hipY - shY) * extend, angle: ((angle + Math.PI) % (2 * Math.PI)) - Math.PI };
}

export function createRetailModule() {
  let selected = null, image = null;
  return {
    id: 'retail', name: 'Try-On', icon: '👗',
    select(id) { selected = GARMENTS.find((x) => x.id === id) || null; image = null; },
    setImage(img) { image = img; selected = { id: 'custom', name: 'Custom' }; },
    draw(g, frame) {
      if (!selected || !frame.landmarks) return;
      const b = garmentBox(frame.landmarks, frame.width, frame.height);
      if (!b) return;
      g.save();
      g.translate(b.cx, b.shY); g.rotate(b.angle * 0.5);
      const w = b.shW * 1.5, top = -b.torso * 0.08;
      if (image) {
        g.globalAlpha = 0.92;
        g.drawImage(image, -w / 2, top, w, b.length);
      } else {
        g.globalAlpha = 0.82; g.fillStyle = selected.color;
        g.beginPath();
        g.moveTo(-b.shW * 0.55, top); g.lineTo(b.shW * 0.55, top);
        g.lineTo(b.shW * 0.5, b.torso * 0.95);       // waist
        g.lineTo(b.shW * 0.95, b.length);             // flared skirt
        g.lineTo(-b.shW * 0.95, b.length);
        g.lineTo(-b.shW * 0.5, b.torso * 0.95);
        g.closePath(); g.fill();
        g.globalAlpha = 0.25; g.fillStyle = '#fff';
        g.beginPath(); g.ellipse(-b.shW * 0.2, b.torso * 0.4, b.shW * 0.08, b.torso * 0.35, 0, 0, 7); g.fill();
      }
      g.restore();
    },
    panel() {
      return GARMENTS.map((x) => `<button data-garment="${x.id}" class="${selected?.id === x.id ? 'on' : ''}" style="border-left:8px solid ${x.color}">${x.name}</button>`).join('') +
        `<button data-garment="">No garment</button><label class="file">Upload garment PNG<input type="file" id="garment-file" accept="image/*"></label>`;
    },
    onClick(target) {
      if (target.dataset && 'garment' in target.dataset) this.select(target.dataset.garment);
    },
    onFile(file) {
      const img = new Image(); img.onload = () => this.setImage(img); img.src = URL.createObjectURL(file);
    },
  };
}
