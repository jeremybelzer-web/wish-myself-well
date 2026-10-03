/* A window for every curiosity (Jeremy, 2026-10-03 14:59Z: "individual automation windows for each curiosity ...
   by defining the parameters that are automatable for each one").

   Each data/windows/win-<category>.js file calls CuriosityWindows.add(id, { sliders, window }) for the
   curiosities whose home is that category on the Screen:
     sliders  more graded, automatable settings of the curiosity's own, in the database's short form
              ["headroom", "Space above the head", ["none", "a little", "plenty"], "Plain words."] or
              ["speed", "Speed", [0, 100, "%"], "Plain words."]. They are added to the row (stable ids).
     window   how its window looks: faces (visual controls), groups (headings for the sliders) and presets
              (one click sets several sliders at once). Slider ids name the curiosity's own sliders; "setting"
              or the row's main id is its main setting.
   Faces (drawn by screen/windows.js):
     { face: "tiles", slider, icons?: { option: "emoji" }, colors?: { option: "#hex" } }  big buttons per option
     { face: "dial", slider }                       a big knob for a number
     { face: "pad", x, y, xLabel?, yLabel? }        drag a dot across two sliders at once
     { face: "swatches", slider, colors: { option: "#hex" } }   color chips
     { face: "frame", x?, y?, size? }               a person in the picture: where across, how high, how big
     { face: "compass", slider, angles: { option: degrees } }   a direction (0 = up, 90 = right)
     { face: "mixer", sliders: [ids] }              a row of upright faders, like a sound desk
     { face: "ladder", slider }                     an ordered scale as rungs, low at the bottom
     { face: "balance", slider, left?, right? }     a see-saw between two ends
   Rows another file never loaded (an editing row in a Node check without db-editing.js) are skipped. */
(function (root) {
  const DB = root.CuriosityDB || (typeof require !== "undefined" ? require("../curiosity-db.js") : null);
  const FACES = ["tiles", "dial", "pad", "swatches", "frame", "compass", "mixer", "ladder", "balance"];
  const W = { FACES, specs: {}, added: {}, skipped: [], files: [] };
  W.add = function (id, def) {
    if (!DB || !DB.find(id) || DB.find(id).level !== "curiosity") return W.skipped.push(id), null;
    def = def || {};
    const before = new Set(DB.find(id).sliders.map((s) => s.id));
    if (def.sliders && def.sliders.length) DB.curiosity({ id, sliders: def.sliders });
    const row = DB.find(id);
    W.added[id] = row.sliders.filter((s) => !before.has(s.id)).map((s) => s.id);
    if (def.window) {
      W.specs[id] = def.window;
      row.window = def.window;
    }
    return row;
  };
  W.get = (id) => W.specs[id] || null;
  /* Every problem with the windows, as plain lines (used by check-windows.js and the Screen's tests). */
  W.check = function () {
    const out = [];
    Object.keys(W.specs).forEach((id) => {
      const c = DB.find(id);
      const spec = W.specs[id];
      const sl = (sid) => c.sliders.find((s) => s.id === sid || (sid === "setting" && s.id === c.main));
      const need = (sid, where) => (sl(sid) ? sl(sid) : (out.push(`${id}: ${where} names unknown slider "${sid}"`), null));
      (spec.faces || []).forEach((f, i) => {
        const where = `face ${i + 1} (${f.face})`;
        if (!FACES.includes(f.face)) return out.push(`${id}: ${where} is not a known face`);
        const one = (k, kind) => {
          if (f[k] == null) return out.push(`${id}: ${where} needs "${k}"`);
          const s = need(f[k], where);
          if (s && kind === "scale" && !s.scale) out.push(`${id}: ${where} "${k}" must be a word scale`);
          if (s && kind === "range" && !s.range) out.push(`${id}: ${where} "${k}" must be a number range`);
          return s;
        };
        const opts = (map, s) => map && s && s.scale && Object.keys(map).forEach((o) => s.scale.includes(o) || out.push(`${id}: ${where} "${o}" is not on ${s.id}'s scale`));
        if (f.face === "tiles") opts(f.icons, one("slider", "scale")), opts(f.colors, sl(f.slider));
        if (f.face === "dial") one("slider", "range");
        if (f.face === "ladder") one("slider", "scale");
        if (f.face === "balance") one("slider");
        if (f.face === "swatches") opts(f.colors, one("slider", "scale"));
        if (f.face === "compass") opts(f.angles, one("slider", "scale"));
        if (f.face === "pad") one("x"), one("y");
        if (f.face === "frame") ["x", "y", "size"].filter((k) => f[k] != null).length ? ["x", "y", "size"].forEach((k) => f[k] != null && need(f[k], where)) : out.push(`${id}: ${where} needs x, y or size`);
        if (f.face === "mixer") Array.isArray(f.sliders) && f.sliders.length >= 2 ? f.sliders.forEach((s) => need(s, where)) : out.push(`${id}: ${where} needs two or more sliders`);
      });
      (spec.groups || []).forEach((g) => (g.label ? (g.sliders || []).forEach((s) => need(s, `group "${g.label}"`)) : out.push(`${id}: a group has no label`)));
      (spec.presets || []).forEach((p) => {
        if (!p.label) out.push(`${id}: a preset has no label`);
        const keys = Object.keys(p.set || {});
        if (!keys.length) out.push(`${id}: preset "${p.label}" sets nothing`);
        keys.forEach((k) => {
          const s = need(k, `preset "${p.label}"`);
          const v = p.set[k];
          if (s && s.scale && !s.scale.includes(v)) out.push(`${id}: preset "${p.label}" sets ${k} to "${v}", not on its scale`);
          if (s && s.range && !(typeof v === "number" && v >= s.range.min && v <= s.range.max)) out.push(`${id}: preset "${p.label}" sets ${k} to ${v}, outside ${s.range.min} to ${s.range.max}`);
        });
      });
    });
    return out;
  };
  if (DB) DB.windows = W;
  root.CuriosityWindows = W;
  if (typeof module !== "undefined") module.exports = W;
})(typeof window !== "undefined" ? window : globalThis);
