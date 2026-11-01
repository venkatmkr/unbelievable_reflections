// Module system: every feature is a plugin registered with the Mirror.
// A module is { id, name, icon, init(ctx), update(frame, ctx), draw(g, frame, ctx), panel(), onVoice?(text), destroy?() }.
export class Mirror {
  constructor() {
    this.modules = new Map();
    this.active = new Set();
    this.listeners = new Map();
  }
  register(mod) {
    for (const k of ['id', 'name']) if (!mod[k]) throw new Error(`Module missing "${k}"`);
    if (this.modules.has(mod.id)) throw new Error(`Duplicate module id: ${mod.id}`);
    this.modules.set(mod.id, mod);
    this.emit('registered', mod);
    return this;
  }
  async enable(id, ctx = {}) {
    const mod = this.modules.get(id);
    if (!mod) throw new Error(`Unknown module: ${id}`);
    if (this.active.has(id)) return;
    if (mod.init) await mod.init({ ...ctx, mirror: this });
    this.active.add(id);
    this.emit('enabled', mod);
  }
  disable(id) {
    const mod = this.modules.get(id);
    if (!mod || !this.active.delete(id)) return;
    if (mod.destroy) mod.destroy();
    this.emit('disabled', mod);
  }
  activeModules() {
    return [...this.active].map((id) => this.modules.get(id));
  }
  // Runs a hook on every active module; one failing module never breaks the others.
  run(hook, ...args) {
    for (const m of this.activeModules()) {
      try { if (m[hook]) m[hook](...args); } catch (e) { console.error(`[${m.id}] ${hook} failed`, e); }
    }
  }
  on(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, []);
    this.listeners.get(evt).push(fn);
  }
  emit(evt, data) {
    (this.listeners.get(evt) || []).forEach((fn) => fn(data));
  }
}
