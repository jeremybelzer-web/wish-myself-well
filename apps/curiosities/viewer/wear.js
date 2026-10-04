/* viewer/wear.js: a person's look, and drawings that stick to a thing (Jeremy, 2026-10-04 22:06Z: "3D characters
   both selectable and draw-able and tweak-able modifiable").
   - Look: each panel's place[id] can carry
       look: words ("spiky red hair, overalls, boots"), read by the 3D characters' own reader (CurioRig.maker.read);
       lookParts: { hair, hairColor, hat, hatColor, top, topColor, bottom, bottomColor, feet, shoesColor, skin,
         build, height }, settings that win over the words (maker's own names; colors as "#rrggbb");
       rig: true, show this person as a full 3D character (drawn by the Viewer thread's viewer/rig-actors.js).
     Until then, and wherever 3D is off, the block figure takes the look's colors, hair, hat, skirt, build and height.
     The words are read once the 3D files have loaded (CurioRig.load(), started the first time a look is seen).
   - Stuck to a thing: a drawing (or any thing) with o.pin = { id, lx, ly, lz, dt, ds } follows that thing in every
     panel: where it is, which way it faces and how big it is. Drawing with the pencil "on things" onto a person
     sticks the drawing to them; the Properties window can stick or unstick anything.
   API: window.CurioWear = { resolve, read, parts, pin, unpin, sync, hold, release, OPTS, SKINS }. */
(function () {
  if (window.CurioWear) return;
  const V = window.CurioViewer;
  if (!V || !V.onParts || !V.onChange) return;
  const DEG = Math.PI / 180;
  const L = () => V.live();
  const film = () => L().film;
  const obj = (id) => film().objects.find((o) => o.id === id);
  const r3 = (v) => Math.round(v * 1000) / 1000;

  /* ---------- the choices, in the 3D characters' own words ---------- */
  const OPTS = {
    hair: [["short", "Short"], ["buzz", "Buzz cut"], ["spiky", "Spiky"], ["mohawk", "Mohawk"], ["long", "Long"], ["curly", "Curly"], ["bun", "Bun"], ["ponytail", "Ponytail"], ["pigtails", "Pigtails"], ["braids", "Braids"], ["none", "Bald"]],
    hat: [["", "No hat"], ["cap", "Cap"], ["cowboy", "Cowboy hat"], ["straw", "Straw hat"], ["top", "Top hat"], ["chef", "Chef hat"], ["wizard", "Pointy hat"], ["crown", "Crown"], ["beanie", "Beanie"], ["bandana", "Bandana"], ["headband", "Headband"]],
    top: [["tshirt", "T-shirt"], ["shirt", "Shirt"], ["tank", "Tank top"], ["jacket", "Jacket"], ["hoodie", "Hoodie"], ["sweater", "Sweater"], ["dress", "Dress top"]],
    bottom: [["trousers", "Trousers"], ["shorts", "Shorts"], ["overalls", "Overalls"], ["skirt", "Skirt"], ["dress", "Dress"], ["kilt", "Kilt"]],
    feet: [["shoes", "Shoes"], ["sneakers", "Sneakers"], ["boots", "Boots"], ["sandals", "Sandals"], ["bare", "Bare feet"]],
  };
  const SKINS = { pale: "#f3d6c2", fair: "#f0cdb4", light: "#eac0a0", olive: "#c79a6b", tan: "#c58c5c", golden: "#d6a06a", brown: "#8d5a3a", dark: "#5c3a24", deep: "#4a2c1c" };
  const BASE = { hair: "short", hairColor: "#4a3020", hat: "", hatColor: "#3a3a40", top: "tshirt", topColor: "#7d8a96", bottom: "trousers", bottomColor: "#3d4a5e", feet: "shoes", shoesColor: "#2a2420", skin: "#eac0a0", build: 1, height: 1 };
  const hex = (v) => (typeof v === "number" ? "#" + (v & 0xffffff).toString(16).padStart(6, "0") : typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null);

  /* ---------- reading the words (the 3D characters' reader, loaded on first use) ---------- */
  const cache = {};
  let loading = false;
  function reader() {
    const R = window.CurioRig;
    return R && R.maker && typeof R.maker.read === "function" ? R.maker.read : null;
  }
  function startLoad() {
    const R = window.CurioRig;
    if (loading || reader() || !R || typeof R.load !== "function") return;
    loading = true;
    try {
      Promise.resolve(R.load()).then(
        () => {
          loading = false;
          Object.keys(cache).forEach((k) => delete cache[k]);
          V.redraw();
        },
        () => (loading = "failed")
      );
    } catch (e) {
      loading = "failed";
    }
  }
  /* the words, read into maker's fields, or null while the reader is loading (or missing) */
  function read(text) {
    const t = String(text || "").trim();
    if (!t) return null;
    if (cache[t]) return cache[t];
    const rd = reader();
    if (!rd) {
      startLoad();
      return null;
    }
    let p = null;
    try {
      p = rd(t);
    } catch (e) {}
    if (!p) return null;
    const out = { said: (p.said || []).filter(Boolean) };
    Object.keys(BASE).forEach((k) => {
      if (p[k] == null) return;
      out[k] = /Color$|^skin$/.test(k) ? hex(p[k]) || BASE[k] : p[k];
    });
    if (p.hatColor == null && p.hat) out.hatColor = BASE.hatColor;
    return (cache[t] = out);
  }
  /* everything about a person's look in one panel: the words, then the settings that win over them */
  function resolve(place, def) {
    const out = Object.assign({}, BASE);
    if (def) {
      if (hex(def.color)) out.topColor = hex(def.color);
      if (hex(def.pants)) out.bottomColor = hex(def.pants);
      if (hex(def.skin)) out.skin = hex(def.skin);
      if (hex(def.hair)) out.hairColor = hex(def.hair);
    }
    const w = place && place.look ? read(place.look) : null;
    if (w) Object.keys(w).forEach((k) => w[k] != null && (out[k] = w[k]));
    const lp = place && place.lookParts;
    if (lp) Object.keys(lp).forEach((k) => lp[k] != null && lp[k] !== "" && (out[k] = lp[k]));
    if (lp && lp.hat === "") out.hat = "";
    out.said = w ? w.said : [];
    return out;
  }
  const hasLook = (pl) => !!(pl && (pl.look || (pl.lookParts && Object.keys(pl.lookParts).length)));

  /* ---------- the block figure wears the look ---------- */
  function parts(list, def, place) {
    if (!def || def.kind !== "person" || !hasLook(place)) return list;
    const lk = resolve(place, def);
    const was = {
      shirt: (def.color || "#4a7bd0").toLowerCase(),
      pants: (def.pants || "#2d2f3a").toLowerCase(),
      skin: (def.skin || "#c98d63").toLowerCase(),
      hair: (def.hair || "#1d1712").toLowerCase(),
    };
    const bald = lk.hair === "none" || lk.hair === "buzz";
    const legSkin = lk.bottom === "shorts" || lk.bottom === "skirt" || lk.bottom === "dress" || lk.bottom === "kilt";
    const wb = Math.max(0.6, Math.min(1.7, Number(lk.build) || 1));
    const hh = Math.max(0.7, Math.min(1.3, Number(lk.height) || 1));
    const sx = 0.55 + 0.45 * wb;
    let out = list.map((p) => {
      const c = (p.color || "").toLowerCase();
      let color = p.color;
      if (c === was.shirt) color = lk.topColor;
      else if (c === was.pants) {
        /* legs show below shorts and skirts: the lower legs take the skin color */
        const lower = p.box && p.at && p.at[1] < 0.5 && p.box[1] > 0.3;
        color = legSkin && lower ? lk.skin : lk.bottomColor;
      } else if (c === was.skin) color = lk.skin;
      else if (c === was.hair) color = bald ? lk.skin : lk.hairColor;
      return Object.assign({}, p, { color });
    });
    /* more of the look: long hair down the back, a bun, a hat, a skirt */
    const head = out.find((p) => p.box && p.at && Math.abs(p.at[1] - 1.62) < 0.02 && Math.abs(p.at[0]) < 0.01);
    if (head) {
      const at = head.at;
      const extra = [];
      if (lk.hair === "long" || lk.hair === "braids") extra.push({ box: [0.3, 0.42, 0.07], at: [at[0], at[1] - 0.12, at[2] - 0.15], color: lk.hairColor });
      if (lk.hair === "curly") extra.push({ box: [0.37, 0.16, 0.36], at: [at[0], at[1] + 0.17, at[2] - 0.01], color: lk.hairColor });
      if (lk.hair === "spiky" || lk.hair === "mohawk") for (let i = -1; i <= 1; i++) extra.push({ box: [lk.hair === "mohawk" ? 0.06 : 0.08, 0.14, 0.08], at: [at[0] + (lk.hair === "mohawk" ? 0 : i * 0.09), at[1] + 0.24, at[2] + i * (lk.hair === "mohawk" ? 0.09 : 0.02)], color: lk.hairColor });
      if (lk.hair === "bun" || lk.hair === "ponytail") extra.push({ box: [0.12, 0.12, 0.12], at: [at[0], at[1] + (lk.hair === "bun" ? 0.24 : 0.02), at[2] - 0.19], color: lk.hairColor });
      if (lk.hair === "pigtails") [-1, 1].forEach((s) => extra.push({ box: [0.08, 0.2, 0.08], at: [at[0] + s * 0.19, at[1] - 0.02, at[2] - 0.05], color: lk.hairColor }));
      const hc = lk.hatColor || BASE.hatColor;
      const top = at[1] + 0.19;
      if (lk.hat === "top") extra.push({ box: [0.36, 0.03, 0.36], at: [at[0], top, at[2]], color: hc }, { box: [0.24, 0.3, 0.24], at: [at[0], top + 0.16, at[2]], color: hc });
      else if (lk.hat === "cowboy" || lk.hat === "straw") extra.push({ box: [0.52, 0.03, 0.52], at: [at[0], top, at[2]], color: hc }, { box: [0.26, 0.14, 0.26], at: [at[0], top + 0.08, at[2]], color: hc });
      else if (lk.hat === "chef") extra.push({ box: [0.28, 0.32, 0.28], at: [at[0], top + 0.16, at[2]], color: hc });
      else if (lk.hat === "wizard") extra.push({ box: [0.3, 0.08, 0.3], at: [at[0], top + 0.03, at[2]], color: hc }, { box: [0.18, 0.2, 0.18], at: [at[0], top + 0.17, at[2]], color: hc }, { box: [0.08, 0.16, 0.08], at: [at[0], top + 0.34, at[2]], color: hc });
      else if (lk.hat === "crown") extra.push({ box: [0.3, 0.1, 0.3], at: [at[0], top + 0.04, at[2]], color: hc, glow: true });
      else if (lk.hat === "cap") extra.push({ box: [0.31, 0.08, 0.31], at: [at[0], top + 0.02, at[2]], color: hc }, { box: [0.26, 0.02, 0.14], at: [at[0], top - 0.01, at[2] + 0.2], color: hc });
      else if (lk.hat === "beanie") extra.push({ box: [0.31, 0.12, 0.31], at: [at[0], top + 0.04, at[2]], color: hc });
      else if (lk.hat === "bandana" || lk.hat === "headband") extra.push({ box: [0.3, 0.05, 0.3], at: [at[0], at[1] + 0.1, at[2]], color: hc });
      out = out.concat(extra);
    }
    if (lk.bottom === "skirt" || lk.bottom === "dress" || lk.bottom === "kilt") out.push({ box: [0.5, lk.bottom === "dress" ? 0.42 : 0.26, 0.34], at: [0, lk.bottom === "dress" ? 0.7 : 0.78, 0], color: lk.bottomColor });
    if (wb === 1 && hh === 1) return out;
    /* build makes them wider, height taller */
    const sc = (v, i) => (v == null ? v : v.map((n, k) => (k === 1 ? n * hh : k === 0 ? n * sx : k === 2 ? n * (0.7 + 0.3 * wb) : n)));
    return out.map((p) => Object.assign({}, p, p.box ? { box: sc(p.box) } : null, p.at ? { at: sc(p.at) } : null, p.pivot ? { pivot: sc(p.pivot) } : null));
  }
  V.onParts(parts);

  /* ---------- stuck to a thing ---------- */
  function offsetIn(tp, dp) {
    const t = (tp.turn || 0) * DEG;
    const ts = tp.size || 1;
    const vx = (dp.x || 0) - (tp.x || 0);
    const vz = (dp.z || 0) - (tp.z || 0);
    return {
      lx: r3((vx * Math.cos(t) - vz * Math.sin(t)) / ts),
      lz: r3((vx * Math.sin(t) + vz * Math.cos(t)) / ts),
      ly: r3(((dp.y || 0) - (tp.y || 0)) / ts),
      dt: Math.round((dp.turn || 0) - (tp.turn || 0)),
      ds: r3((dp.size || 1) / ts),
    };
  }
  function follow(pin, tp, dp) {
    const t = (tp.turn || 0) * DEG;
    const ts = tp.size || 1;
    dp.x = r3((tp.x || 0) + (pin.lx * Math.cos(t) + pin.lz * Math.sin(t)) * ts);
    dp.z = r3((tp.z || 0) + (-pin.lx * Math.sin(t) + pin.lz * Math.cos(t)) * ts);
    dp.y = r3(Math.max(0, (tp.y || 0) + pin.ly * ts));
    dp.turn = Math.round((tp.turn || 0) + pin.dt);
    dp.size = r3(pin.ds * ts);
    dp.show = tp.show !== false;
  }
  /* stick thing `id` to thing `to`, where it is now (in the panel you are on) */
  function pin(id, to) {
    const o = obj(id);
    const pl = L().panel.place;
    if (!o || !to || to === id || !obj(to) || !pl[id] || !pl[to]) return false;
    /* no loops: what it sticks to cannot be stuck to it */
    for (let t = obj(to), n = 0; t && t.pin && n < 20; t = obj(t.pin.id), n++) if (t.pin.id === id) return false;
    o.pin = Object.assign({ id: to }, offsetIn(pl[to], pl[id]));
    sync();
    return true;
  }
  function unpin(id) {
    const o = obj(id);
    if (o) delete o.pin;
  }
  /* things being dragged by hand keep their spot; on release they stick again where they were left */
  let held = [];
  const hold = (ids) => (held = (ids || []).slice());
  function release() {
    const pl = L().panel.place;
    held.forEach((id) => {
      const o = obj(id);
      if (o && o.pin && pl[o.pin.id] && pl[id]) Object.assign(o.pin, offsetIn(pl[o.pin.id], pl[id]));
    });
    held = [];
    sync();
  }
  function sync() {
    const f = film();
    if (!f) return 0;
    let n = 0;
    const stuck = f.objects.filter((o) => o.pin && !held.includes(o.id));
    stuck.forEach((o) => {
      if (!obj(o.pin.id)) return delete o.pin;
      f.panels.forEach((q) => {
        const tp = q.place[o.pin.id];
        const dp = q.place[o.id];
        if (tp && dp) follow(o.pin, tp, dp), n++;
      });
    });
    return n;
  }
  V.onChange(sync);
  setTimeout(sync, 0);
  /* a look seen for the first time starts loading the reader */
  setTimeout(() => {
    try {
      if (film().panels.some((q) => Object.keys(q.place).some((k) => q.place[k] && q.place[k].look))) startLoad();
    } catch (e) {}
  }, 0);

  window.CurioWear = { resolve, read, parts, pin, unpin, sync, hold, release, hasLook, OPTS, SKINS, BASE, reader: () => !!reader(), load: startLoad };
})();
