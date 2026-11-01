// Exponential moving average for jitter-free yet responsive values.
export class Ema {
  constructor(alpha = 0.35) { this.alpha = alpha; this.v = null; }
  push(x) {
    if (!Number.isFinite(x)) return this.v;
    this.v = this.v === null ? x : this.v + this.alpha * (x - this.v);
    return this.v;
  }
}
