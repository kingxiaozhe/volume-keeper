const slider = document.getElementById("slider");
const pct = document.getElementById("pct");
const hostEl = document.getElementById("host");
const ui = document.getElementById("ui");
const eqButtons = [...document.querySelectorAll(".eq button")];

let tabId = null;

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function render(gain, eq) {
  const v = Math.round(gain * 100);
  slider.value = v;
  pct.textContent = v + "%";
  eqButtons.forEach((b) => b.classList.toggle("active", b.dataset.eq === eq));
}

function push(partial) {
  chrome.tabs.sendMessage(tabId, { type: "setState", ...partial }, () => void chrome.runtime.lastError);
}

slider.addEventListener("input", () => {
  pct.textContent = slider.value + "%";
  push({ gain: Number(slider.value) / 100 });
});

eqButtons.forEach((b) =>
  b.addEventListener("click", () => {
    eqButtons.forEach((x) => x.classList.toggle("active", x === b));
    push({ eq: b.dataset.eq });
  })
);

document.getElementById("reset").addEventListener("click", () => {
  render(1, "none");
  push({ gain: 1, eq: "none" });
});

(async () => {
  const tab = await getActiveTab();
  tabId = tab.id;
  try {
    hostEl.textContent = new URL(tab.url).host;
  } catch {
    hostEl.textContent = tab.url || "";
  }
  chrome.tabs.sendMessage(tabId, { type: "getState" }, (res) => {
    if (chrome.runtime.lastError || !res) {
      // Content script not present (chrome:// page, store page, etc.).
      hostEl.textContent += " — not available on this page";
      ui.classList.add("disabled");
      return;
    }
    render(res.gain, res.eq);
  });
})();
