chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type !== "send") return;
  fetch("http://127.0.0.1:3737/pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg.payload),
  })
    .then((r) => reply({ ok: r.ok }))
    .catch(() => reply({ ok: false, offline: true }));
  return true;
});
