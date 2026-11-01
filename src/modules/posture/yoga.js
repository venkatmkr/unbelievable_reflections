// Yogic corrections mapped to posture issues. General wellness guidance, not medical advice.
export const YOGA = {
  shoulderTilt: [
    { name: 'Parvatasana (Mountain/arms-up pose)', how: 'Interlace fingers, raise arms overhead, and lengthen both sides of the waist equally. 5 slow breaths.' },
    { name: 'Gomukhasana arms (Cow-face arms)', how: 'Reach one arm up and one behind your back; hold 30s each side to even out shoulder tension.' },
  ],
  hipTilt: [
    { name: 'Trikonasana (Triangle)', how: 'Wide stance, hinge sideways, keep both hips stacked. 30s each side.' },
    { name: 'Supta Baddha Konasana', how: 'Lie down, soles together, let hips release evenly for 1-2 minutes.' },
  ],
  headTilt: [
    { name: 'Greeva Sanchalana (Neck rolls)', how: 'Slow half-circles, ear toward each shoulder, never forcing. 5 each way.' },
    { name: 'Tadasana (Mountain)', how: 'Stand tall, crown of head lifting, chin level, gaze at the horizon.' },
  ],
  headShift: [
    { name: 'Tadasana (Mountain)', how: 'Align nose over the centre of your collarbones; feel weight equal on both feet.' },
  ],
  trunkLean: [
    { name: 'Ardha Chakrasana (Half wheel)', how: 'Hands on lower back, gently arch and return to centre. 5 breaths.' },
    { name: 'Utthita Trikonasana', how: 'Side stretch to the shorter side first to rebalance the spine.' },
  ],
  forwardHead: [
    { name: 'Bhujangasana (Cobra)', how: 'Lift chest, draw shoulders back, keep the neck long. 5 breaths.' },
    { name: 'Matsyasana (Fish)', how: 'Open the chest and let the head release back; counters screen slouch.' },
    { name: 'Chin tucks (Jalandhara prep)', how: 'Glide chin straight back, hold 5s, repeat 10 times.' },
  ],
};

export function recommend(analysis, limit = 3) {
  if (!analysis) return [];
  return analysis.issues.slice(0, limit).map((k) => ({ issue: k, label: analysis.metrics[k].label, poses: YOGA[k] || [] }));
}
