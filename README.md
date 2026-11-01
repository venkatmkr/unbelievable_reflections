# Unbelievable Reflections

A modular smart mirror that runs in the browser (iMac / Windows / anything with a webcam + mic).

* **Posture** – realtime pose tracking (MediaPipe) with colour-glowing deviation overlays, per-metric bars, a 0-100 score, and yoga pose corrections for the worst deviations.
* **Try-On (retail)** – pick a dress (or upload a transparent PNG) and it is fitted to your shoulders/hips live.
* **Health** – estimates complexion/wellness hints from a skin patch. Wellness guidance only, not a medical diagnosis.
* **Voice** – microphone commands, e.g. say "posture" or "health" (Web Speech API).

## Run
```
npm start      # http://localhost:8080 (camera needs localhost/https); needs internet for the pose model CDN
npm test
```

## Adding a module
Create `{ id, name, icon, update(frame, ctx), draw(g, frame, ctx), panel(), onVoice?(text) }` and add it to the `modules` list in `src/app.js`. Modules share data via `ctx.shared` (e.g. `ctx.shared.posture`). A failing module never affects the others.
