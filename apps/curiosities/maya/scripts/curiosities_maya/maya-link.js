/* Injected into the Curiosities app by the Maya panel (panel.py), never loaded by index.html.
   Sends what each storyboard panel plays (its camera curiosities, running automation included) to Maya
   whenever it changes, and takes a camera read back from Maya as the applied strand "Maya camera". */
(function () {
  if (window.CurioMaya || typeof QWebChannel === "undefined" || !window.qt) return;
  const IDS = ["shotSize", "lensLength", "angleHeight", "dutch", "depthOfField", "motionBlur", "cameraShake", "cameraCarry", "cameraMove", "moveSpeed", "shotDuration"];
  let host = null;
  let last = "";

  function panels() {
    if (!window.CuriosityBoard) return [];
    return window.CuriosityBoard.panels().map((st) => {
      const out = {};
      IDS.forEach((id) => st[id] != null && st[id] !== "" && (out[id] = st[id]));
      return out;
    });
  }
  function send(force) {
    if (!host) return;
    const text = JSON.stringify({ panels: panels() });
    if (!force && text === last) return;
    last = text;
    host.panels(text);
  }
  /* One dict of curiosities per panel, from Maya, played on the board panel by panel. */
  function readBack(per) {
    if (!window.CuriosityBoard || !Array.isArray(per)) return;
    const values = {};
    IDS.forEach((id) => {
      if (per.some((p) => p && p[id] != null)) values[id] = per.map((p) => (p && p[id] != null ? p[id] : ""));
    });
    window.CuriosityBoard.apply("Maya camera", values);
  }
  window.CurioMaya = { ids: IDS, panels, send, readBack };

  new QWebChannel(qt.webChannelTransport, (channel) => {
    host = channel.objects.curioHost;
    send(true);
    if (window.CuriosityBoard) window.CuriosityBoard.on(() => send());
    setInterval(() => send(), 200); /* running automation moves the panels between board events */
  });
})();
