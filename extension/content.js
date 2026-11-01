// One floating button that follows whichever pin image the mouse is over.
const btn = document.createElement("button");
btn.id = "p2f-btn";
btn.textContent = "→ Figma";
document.documentElement.appendChild(btn);

let current = null;
let hideTimer = null;

function pinImgAt(el) {
  const img = el && el.closest && el.closest("img");
  if (img && /pinimg\.com/.test(img.src) && img.width > 120) return img;
  // Pinterest overlays the image with links/divs, so look at what's underneath
  const pin = el && el.closest && el.closest('[data-test-id="pin"], [data-grid-item], [role="listitem"]');
  const inner = pin && pin.querySelector('img[src*="pinimg.com"]');
  return inner && inner.width > 120 ? inner : null;
}

function show(img) {
  clearTimeout(hideTimer);
  current = img;
  const r = img.getBoundingClientRect();
  btn.className = "";
  btn.textContent = "→ Figma";
  btn.style.display = "block";
  // bottom-left of the image: Pinterest uses the top for board name + Save
  const BTN_H = 30;
  const top = Math.min(r.bottom - BTN_H - 12, window.innerHeight - BTN_H - 10);
  btn.style.top = Math.max(top, 10) + "px";
  btn.style.left = Math.max(r.left + 12, 10) + "px";
}

document.addEventListener("mouseover", (e) => {
  if (e.target === btn) return clearTimeout(hideTimer);
  const img = pinImgAt(e.target);
  if (img) show(img);
  else {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => (btn.style.display = "none"), 250);
  }
});
window.addEventListener("scroll", () => (btn.style.display = "none"), { passive: true });

function best(src) {
  // 236x / 474x / 736x -> originals (fallback keeps 736x)
  return {
    url: src.replace(/\/\d+x\//, "/originals/"),
    fallback: src.replace(/\/\d+x\//, "/736x/"),
  };
}

btn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!current) return;
  const { url, fallback } = best(current.currentSrc || current.src);
  btn.textContent = "Sending…";
  chrome.runtime.sendMessage(
    { type: "send", payload: { url, fallback, pin: location.href, width: Math.round(current.getBoundingClientRect().width) } },
    (res) => {
      if (res && res.ok) {
        btn.className = "ok";
        btn.textContent = "✓ Sent";
      } else {
        btn.className = "err";
        btn.textContent = res && res.offline ? "Server off" : "Failed";
      }
      setTimeout(() => (btn.style.display = "none"), 1200);
    }
  );
}, true);
