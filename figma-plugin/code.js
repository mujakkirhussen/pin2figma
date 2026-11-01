figma.showUI(__html__, { width: 300, height: 380 });

// Every pin is scaled to the same height (width follows the image's ratio),
// top-aligned, left to right. A row is full at ROW_WIDTH px; then a new row starts.
const ROW_HEIGHT = 1000;
const GAP = 40;
const ROW_WIDTH = 10000;
let n = 0;
let row = null; // { startX, x, y, h }

function pinNodes() {
  return figma.currentPage.children.filter(
    (c) => c.type === "RECTANGLE" && c.name.indexOf("Pin ") === 0 &&
      c.fills.length && c.fills[0].type === "IMAGE"
  );
}

function startRow() {
  const ex = pinNodes();
  if (ex.length) {
    // continue below the pins already on the page
    return {
      startX: Math.min.apply(null, ex.map((r) => r.x)),
      y: Math.max.apply(null, ex.map((r) => r.y + r.height)) + GAP,
    };
  }
  return {
    startX: Math.round(figma.viewport.center.x - 500),
    y: Math.round(figma.viewport.center.y - 300),
  };
}

async function addPin(bytes, pinUrl) {
  const image = figma.createImage(bytes);
  const size = await image.getSizeAsync();
  const h = ROW_HEIGHT;
  const w = Math.max(1, Math.round((size.width * ROW_HEIGHT) / size.height));

  if (!row) {
    const s = startRow();
    row = { startX: s.startX, x: s.startX, y: s.y, h: 0 };
  }
  if (row.x > row.startX && row.x + w - row.startX > ROW_WIDTH) {
    row.y += row.h + GAP;
    row.x = row.startX;
    row.h = 0;
  }

  const rect = figma.createRectangle();
  rect.name = "Pin " + (n + 1) + " (" + size.width + "×" + size.height + ")";
  rect.resize(w, h);
  rect.x = row.x;
  rect.y = row.y;
  rect.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];
  if (pinUrl) rect.setPluginData("pin", pinUrl);
  figma.currentPage.appendChild(rect);
  figma.currentPage.selection = [rect];
  figma.viewport.scrollAndZoomIntoView([rect]);

  row.x += w + GAP;
  row.h = Math.max(row.h, h);
  n++;
  return size;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "pin" && msg.type !== "test") return;
  try {
    const size = await addPin(msg.bytes, msg.pin);
    figma.notify("Pin added: " + size.width + "×" + size.height + " px");
    figma.ui.postMessage({ type: "result", ok: true, n, w: size.width, h: size.height });
  } catch (e) {
    figma.notify("Pin import failed: " + e.message, { error: true });
    figma.ui.postMessage({ type: "result", ok: false, error: String(e && e.message || e) });
  }
};
