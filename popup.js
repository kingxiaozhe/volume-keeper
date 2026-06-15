const slider = document.getElementById("slider");
const pct = document.getElementById("pct");
const hostEl = document.getElementById("host");
const ui = document.getElementById("ui");
const eqButtons = [...document.querySelectorAll(".eq button")];
const limiterBox = document.getElementById("limiter");
const asDefaultBox = document.getElementById("asDefault");

let tabId = null;

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function send(partial) {
  chrome.tabs.sendMessage(tabId, { type: "setState", ...partial }, () => void chrome.runtime.lastError);
  if (asDefaultBox.checked) saveAsDefault();
}

function saveAsDefault() {
  chrome.tabs.sendMessage(tabId, { type: "setDefault" }, () => void chrome.runtime.lastError);
}

function render(s) {
  const v = Math.round(s.gain * 100);
  slider.value = v;
  pct.textContent = v + "%";
  eqButtons.forEach((b) => b.classList.toggle("active", b.dataset.eq === s.eq));
  limiterBox.checked = s.limiter !== false;
}

function setVolume(v) {
  v = Math.max(0, Math.min(600, v));
  slider.value = v;
  pct.textContent = v + "%";
  send({ gain: v / 100 });
}

slider.addEventListener("input", () => setVolume(Number(slider.value)));

// Scroll over the slider to fine-tune (a common, loved volume-booster gesture).
slider.addEventListener("wheel", (e) => {
  e.preventDefault();
  setVolume(Number(slider.value) + (e.deltaY < 0 ? 5 : -5));
}, { passive: false });

eqButtons.forEach((b) =>
  b.addEventListener("click", () => {
    eqButtons.forEach((x) => x.classList.toggle("active", x === b));
    send({ eq: b.dataset.eq });
  })
);

limiterBox.addEventListener("change", () => send({ limiter: limiterBox.checked }));

asDefaultBox.addEventListener("change", () => { if (asDefaultBox.checked) saveAsDefault(); });

document.getElementById("reset").addEventListener("click", () => {
  render({ gain: 1, eq: "none", limiter: limiterBox.checked });
  chrome.tabs.sendMessage(tabId, { type: "reset" }, () => void chrome.runtime.lastError);
});

(async () => {
  const tab = await getActiveTab();
  tabId = tab.id;
  try { hostEl.textContent = new URL(tab.url).host; } catch { hostEl.textContent = tab.url || ""; }
  chrome.tabs.sendMessage(tabId, { type: "getState" }, (res) => {
    if (chrome.runtime.lastError || !res) {
      // Content script not present (chrome:// page, store page, etc.).
      hostEl.textContent += " — not available on this page";
      ui.classList.add("disabled");
      return;
    }
    render(res);
  });
})();
