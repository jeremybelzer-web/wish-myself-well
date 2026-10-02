/* Only in the one-page link (the artifact viewer). The viewer blocks plain downloads and pop-up dialogs, so:
   a download asks the viewer to save through the page's downloads permission (.curio files save as .curio.json,
   which Open project reads); alert shows a short note; confirm asks you to press the same button again;
   prompt takes its suggested answer. */
(function () {
  /* The file pickers are refused inside the viewer; use the plain file input and the save permission. */
  try { window.showSaveFilePicker = undefined; window.showOpenFilePicker = undefined; } catch (e) {}
  const blobs = new Map();
  const made = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (b) => { const u = made(b); if (b instanceof Blob) blobs.set(u, b); return u; };
  let note;
  function say(text, ms) {
    if (!document.body) return;
    if (!note) {
      note = document.createElement("div");
      note.setAttribute("role", "status");
      note.style.cssText = "position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;max-width:520px;margin:0 auto;padding:10px 14px;background:#1c1712;color:#f6efe3;border:2px solid #e07a1f;font:14px/1.4 system-ui,sans-serif;box-shadow:4px 4px 0 rgba(0,0,0,.25)";
      note.onclick = () => (note.hidden = true);
      document.body.appendChild(note);
    }
    note.textContent = text;
    note.hidden = false;
    clearTimeout(say.t);
    say.t = setTimeout(() => (note.hidden = true), ms || 5000);
  }
  let dl = null;
  const getDl = () => dl || (dl = window.claude && window.claude.use ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null));
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    const href = this.href || "";
    if (!this.hasAttribute("download") || !/^(blob|data):/.test(href)) return click.call(this);
    let name = this.getAttribute("download") || "curiomatic.json";
    if (/\.curio$/i.test(name)) name += ".json";
    const blob = blobs.get(href);
    const data = blob ? Promise.resolve(blob) : fetch(href).then((r) => r.blob());
    Promise.all([getDl(), data]).then(([d, b]) => {
      if (!d) return say("Saving files isn't available on this link. Your work stays in this browser.");
      return d.save({ filename: name, data: b }).then(
        () => say("Saved " + name + "."),
        (e) => { if (e && e.code !== "declined") say("That file couldn't be saved here (" + (e.code || "error") + ")."); }
      );
    }).catch(() => say("That file couldn't be saved here."));
  };
  window.alert = (m) => say(String(m), 7000);
  let asked = null;
  window.confirm = (m) => {
    const now = Date.now();
    if (asked && asked.m === m && now - asked.t < 6000) { asked = null; if (note) note.hidden = true; return true; }
    asked = { m, t: now };
    say(m + " Press the same button again to go ahead.", 6000);
    return false;
  };
  window.prompt = (m, d) => (d == null ? null : String(d));
})();
