// Volume Keeper — content script.
// Routes every <video>/<audio> on the page through a Web Audio gain + EQ node,
// so we can boost/lower volume WITHOUT chrome.tabCapture (which is what breaks
// fullscreen and shows the "sharing" indicator in tabCapture-based competitors).
//
// Three P0s this solves vs. the incumbent:
//   1. Fullscreen never breaks   -> no tabCapture, we only touch media elements.
//   2. Per-site memory           -> settings persisted by origin, auto-restored.
//   3. No sudden volume blast     -> gain changes ramp smoothly (setTargetAtTime).

(() => {
  const MAX_GAIN = 6; // 600%
  const RAMP = 0.06; // seconds — smooth enough to kill pops, fast enough to feel instant
  const KEY = "site:" + location.origin;

  // EQ presets mirror the incumbent's loved "voice"/"bass" boosts.
  const EQ = {
    none: { type: "peaking", frequency: 0, Q: 1, gain: 0 },
    voice: { type: "peaking", frequency: 1500, Q: 1, gain: 12 },
    bass: { type: "lowshelf", frequency: 350, Q: 1, gain: 6 },
  };

  let ctx = null;
  let gainNode = null;
  let biquad = null;
  const hooked = new WeakSet();

  // Desired state. Loaded from storage; defaults are a no-op (100%, no EQ).
  let state = { gain: 1, eq: "none" };

  function ensureGraph() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = ctx.createGain();
    gainNode.gain.value = state.gain;
    biquad = ctx.createBiquadFilter();
    applyEq();
    // sources -> gain -> biquad -> destination
    gainNode.connect(biquad);
    biquad.connect(ctx.destination);
  }

  function applyEq() {
    if (!biquad) return;
    const p = EQ[state.eq] || EQ.none;
    biquad.type = p.type;
    biquad.frequency.value = p.frequency;
    biquad.Q.value = p.Q;
    biquad.gain.value = p.gain;
  }

  function applyGain() {
    if (!gainNode) return;
    if (ctx.state === "suspended") ctx.resume();
    // Ramp instead of instant assignment -> no "sudden blast" bug.
    gainNode.gain.setTargetAtTime(state.gain, ctx.currentTime, RAMP);
  }

  function hook(el) {
    if (hooked.has(el)) return;
    try {
      ensureGraph();
      // crossOrigin hint reduces tainting on CORS-capable servers.
      if (!el.crossOrigin) el.crossOrigin = "anonymous";
      const src = ctx.createMediaElementSource(el);
      src.connect(gainNode);
      hooked.add(el);
    } catch (e) {
      // createMediaElementSource throws if the element was already captured
      // elsewhere; ignore and leave that element on its default output.
    }
  }

  function hookAll() {
    document.querySelectorAll("video, audio").forEach(hook);
  }

  // Only build the audio graph once the user actually wants a non-default value;
  // a page at 100%/no-EQ stays completely untouched (matches "only active when working").
  function activateIfNeeded() {
    if (state.gain === 1 && state.eq === "none") return;
    hookAll();
    applyGain();
    applyEq();
  }

  function setState(next) {
    if (typeof next.gain === "number") state.gain = Math.max(0, Math.min(MAX_GAIN, next.gain));
    if (typeof next.eq === "string" && EQ[next.eq]) state.eq = next.eq;
    ensureGraph();
    hookAll();
    applyGain();
    applyEq();
    persist();
  }

  function persist() {
    try {
      chrome.storage.local.set({ [KEY]: { gain: state.gain, eq: state.eq } });
    } catch (e) {}
  }

  // Restore this site's saved setting, then keep watching for new media.
  function init() {
    try {
      chrome.storage.local.get(KEY, (res) => {
        const saved = res && res[KEY];
        if (saved) {
          if (typeof saved.gain === "number") state.gain = saved.gain;
          if (typeof saved.eq === "string") state.eq = saved.eq;
        }
        activateIfNeeded();
      });
    } catch (e) {}

    const mo = new MutationObserver(() => {
      if (state.gain !== 1 || state.eq !== "none") hookAll();
    });
    const start = () => mo.observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) start();
    else document.addEventListener("DOMContentLoaded", start);

    // Resume the context on the first user gesture (autoplay policy).
    const resume = () => {
      if (ctx && ctx.state === "suspended") ctx.resume();
    };
    window.addEventListener("click", resume, { once: false, passive: true });
    window.addEventListener("keydown", resume, { passive: true });
  }

  chrome.runtime.onMessage.addListener((msg, _s, send) => {
    if (msg.type === "getState") send({ gain: state.gain, eq: state.eq, origin: location.origin });
    else if (msg.type === "setState") { setState(msg); send({ ok: true, gain: state.gain, eq: state.eq }); }
    return true;
  });

  init();
})();
