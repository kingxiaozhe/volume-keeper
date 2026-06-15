// Volume Keeper — content script (ISOLATED world).
//
// Runs in an isolated world ON PURPOSE: a separate JS realm whose AudioContext
// does NOT collide with the page's own Web Audio graph. (YouTube already owns its
// <video> via Web Audio in the MAIN world; a MAIN-world createMediaElementSource
// throws and silences playback. The isolated world avoids that conflict — this is
// what makes boosting work on YouTube, the #1 use case.)
//
// Audio graph (built lazily, only when the user wants a non-default value):
//   each <video>/<audio> -> [shared] gain -> EQ biquad -> limiter -> analyser -> destination

(() => {
  const MAX_GAIN = 6;
  const RAMP = 0.06; // gain ramp (s) -> kills the "sudden blast" the incumbent has
  const SITE_KEY = "site:" + location.origin;
  const DEFAULT_KEY = "default";

  const EQ = {
    none: { type: "peaking", frequency: 0, Q: 1, gain: 0 },
    voice: { type: "peaking", frequency: 1500, Q: 1, gain: 12 },
    bass: { type: "lowshelf", frequency: 350, Q: 1, gain: 6 },
  };

  let ctx = null, gain = null, biquad = null, limiter = null, analyser = null;
  const hooked = new WeakSet();
  let state = { gain: 1, eq: "none", limiter: true };

  const isActive = () => state.gain !== 1 || state.eq !== "none";

  function buildGraph() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gain = ctx.createGain();
    gain.gain.value = state.gain;
    biquad = ctx.createBiquadFilter();
    limiter = ctx.createDynamicsCompressor();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    gain.connect(biquad);
    biquad.connect(limiter);
    limiter.connect(analyser);
    analyser.connect(ctx.destination);
    applyEq();
    applyLimiter();
  }

  function applyEq() {
    if (!biquad) return;
    const p = EQ[state.eq] || EQ.none;
    biquad.type = p.type;
    biquad.frequency.value = p.frequency;
    biquad.Q.value = p.Q;
    biquad.gain.value = p.gain;
  }

  // Brick-wall-ish limiter to tame the "over-boost distorts" complaint. Disabled =
  // transparent (ratio 1) so the signal passes through unchanged.
  function applyLimiter() {
    if (!limiter) return;
    if (state.limiter) {
      limiter.threshold.value = -1.0;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.05;
    } else {
      limiter.threshold.value = 0;
      limiter.knee.value = 0;
      limiter.ratio.value = 1;
    }
  }

  function applyGain() {
    if (!gain) return;
    if (ctx.state === "suspended") ctx.resume();
    gain.gain.setTargetAtTime(state.gain, ctx.currentTime, RAMP);
  }

  function hook(el) {
    if (hooked.has(el) || !isActive()) return;
    try {
      buildGraph();
      ctx.createMediaElementSource(el).connect(gain);
      hooked.add(el);
    } catch (e) {
      // Already routed, or protected media — leave it on the default output.
    }
  }

  function hookAll() {
    if (!isActive()) return;
    document.querySelectorAll("video, audio").forEach(hook);
  }

  function setState(next) {
    if (typeof next.gain === "number") state.gain = Math.max(0, Math.min(MAX_GAIN, next.gain));
    if (typeof next.eq === "string" && EQ[next.eq]) state.eq = next.eq;
    if (typeof next.limiter === "boolean") state.limiter = next.limiter;
    if (isActive()) {
      buildGraph();
      hookAll();
      applyGain();
      applyEq();
      applyLimiter();
    }
  }

  function persist() {
    try { chrome.storage.local.set({ [SITE_KEY]: { ...state } }); } catch (e) {}
  }

  function probe() {
    if (!analyser) return { rms: 0, gain: state.gain, ctx: ctx ? ctx.state : "none", media: document.querySelectorAll("video,audio").length };
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) { const d = v - 128; sum += d * d; }
    return { rms: Number(Math.sqrt(sum / buf.length).toFixed(2)), gain: state.gain, ctx: ctx.state, media: document.querySelectorAll("video,audio").length };
  }

  // Restore: site-specific setting wins; otherwise inherit the global default.
  function init() {
    try {
      chrome.storage.local.get([SITE_KEY, DEFAULT_KEY], (res) => {
        const saved = (res && res[SITE_KEY]) || (res && res[DEFAULT_KEY]);
        if (saved) {
          if (typeof saved.gain === "number") state.gain = saved.gain;
          if (typeof saved.eq === "string") state.eq = saved.eq;
          if (typeof saved.limiter === "boolean") state.limiter = saved.limiter;
        }
        if (isActive()) { buildGraph(); hookAll(); applyGain(); applyEq(); applyLimiter(); }
      });
    } catch (e) {}

    const mo = new MutationObserver(hookAll);
    const start = () => mo.observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) start();
    else document.addEventListener("DOMContentLoaded", start);

    const resume = () => { if (ctx && ctx.state === "suspended") ctx.resume(); };
    window.addEventListener("click", resume, { passive: true });
    window.addEventListener("keydown", resume, { passive: true });
  }

  chrome.runtime.onMessage.addListener((msg, _s, send) => {
    if (msg.type === "getState") send({ ...state, origin: location.origin });
    else if (msg.type === "setState") { setState(msg); persist(); send({ ok: true, ...state }); }
    else if (msg.type === "setDefault") { try { chrome.storage.local.set({ [DEFAULT_KEY]: { ...state } }); } catch (e) {} send({ ok: true }); }
    else if (msg.type === "reset") { setState({ gain: 1, eq: "none" }); persist(); send({ ok: true, ...state }); }
    else if (msg.type === "probe") send(probe());
  });

  init();
})();
