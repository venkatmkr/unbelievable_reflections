// Optional microphone voice commands via Web Speech API (e.g. "posture", "try on red", "health").
export function startVoice(onText) {
  const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = true; r.interimResults = false;
  r.onresult = (e) => onText(e.results[e.results.length - 1][0].transcript.trim());
  r.onend = () => { try { r.start(); } catch {} };
  r.start();
  return r;
}
