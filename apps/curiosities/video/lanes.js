/* video/lanes.js: the newer measures of a clip as lanes, like the older ones (light, color, camera, cutting,
   sound): one lane per curiosity with a node wherever it changes, shown in the clip's lane list, put on My film
   ("Put these on my film's automation lanes") and kept in the engine reference (cross-pollinate). Each lane uses
   a curiosity the app already has, or one of its graded sliders ("shotSize.headroom").

   - Look of the picture (looks.js): the palette's tint (colorFilter, filterHue), grain (colorRange.filmStock),
     crisp or soft (texture, from data/db-editing.js, so only where the app loads it), the picture's shape
     (aspect), black bars (aspect.letterbox), dark edges (cameraLensLens.vignette).
   - Shot framing (framing.js, from the AI cut-outs): where the eyes sit (composition), room above the head
     (shotSize.headroom), how close from the head's size (shotSize, in place of the skin guess), which way they
     face (composition.facing), room in front of them (shotSize.breathing), the horizon's tilt (dutch), and how
     high the camera seems (angleHeight, a guess).
   - Rhythm (rhythm.js): tempo (music.tempo), how driving the beat is (music.energy, a guess), cuts on the beat
     (music.cutSync).

   Part of the video core (no page), loaded after rhythm.js.
   window.CurioVideoLanes
   - MORE: the lanes this file adds [{ id, name, group, track, how, from, unit? }]
   - of(dissection) -> every lane of a clip, the older ones first: [{ id, name?, group, track, how, from, nodes }]
     (CurioVideo.lanesOf calls it; kept until the clip's looks, cut-outs or rhythm change) */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const V = () => root.CurioVideo;
  const S = () => root.CurioScale;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const band = (x, cuts, opts) => {
    let i = 0;
    while (i < cuts.length && x >= cuts[i]) i++;
    return opts[i];
  };
  const median = (a) => {
    if (!a.length) return 0;
    const b = a.slice().sort((x, y) => x - y);
    return b.length % 2 ? b[b.length >> 1] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2;
  };

  /* ---------- reading the measures at one moment ---------- */
  /* The palette's tint: how far each color's darks, mids and lights lean from grey (mids count double), as a hue
     (degrees) and a strength (0..1 of full brightness). */
  function tintAt(L, t) {
    const LK = root.CurioLooks;
    if (!L || !L.q || !L.q.length || !LK) return null;
    const pick = [1, 4, 4, 7];
    let a = 0,
      b = 0;
    pick.forEach((k) => {
      const at = (c) => V().sampleAt(L, L.q.map((x) => x[c][k]), t);
      const r = at("r"),
        g = at("g"),
        bl = at("b");
      a += (2 * r - g - bl) / 2;
      b += (Math.sqrt(3) / 2) * (g - bl);
    });
    a /= pick.length;
    b /= pick.length;
    return { hue: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360, strength: Math.hypot(a, b) };
  }
  const hueName = (h) => (h < 15 || h >= 345 ? "red" : h < 40 ? "orange" : h < 70 ? "yellow" : h < 160 ? "green" : h < 200 ? "teal" : h < 255 ? "blue" : "purple");
  const tintStrength = (s) => band(s, [0.02, 0.06, 0.12], ["none", "light", "strong", "the whole picture"]);
  const lk = (L, key, t) => V().sampleAt(L, L[key], t);
  const grainOf = (g) => band(g, [0.004, 0.012, 0.03], ["clean digital", "slight grain", "film grain", "old film"]);
  const textureOf = (sharp, grain) => (sharp < 0.15 ? "soft" : grain >= 0.015 ? "gritty" : sharp < 0.27 ? "natural" : "crisp");
  /* The picture's shape, wide to tall, as the frame shapes the catalog names. */
  const aspectOf = (a) => (a >= 1.2 && a < 1.55 ? "1.33" : a >= 1.55 && a < 2.1 ? "1.85" : a >= 2.1 && a < 2.7 ? "2.39" : "custom");
  const barsOf = (b) => {
    const s = Math.max(b.top + b.bottom, b.left + b.right);
    return s <= 0 ? "none" : s < 0.15 ? "thin" : "thick";
  };
  const shot = (d, t) => (root.CurioFraming ? root.CurioFraming.shot(d, t) : null);
  /* Room above the head: from the top of the head (half a head above the eyes) to the top of the frame. */
  const headroom = (s) => Math.round(clamp((s.y - 0.5 * s.size) / 0.3, 0, 1) * 5);
  const sizeOf = (size) => band(size, [0.1, 0.25, 0.55], ["wide", "medium", "close", "insert"]);
  const facingOf = (f) => (f < -0.25 ? "left" : f > 0.25 ? "right" : "toward the camera");
  const breathing = (s) => (Math.abs(s.facing) < 0.25 ? null : Math.round(clamp(((s.facing > 0 ? 1 - s.x : s.x) - 0.15) / 0.6, 0, 1) * 5));
  /* Rhythm near t: the beats within three seconds either side. */
  const near = (list, t, w) => (list || []).filter((x) => Math.abs(x - t) <= w);
  function tempoAt(R, t) {
    const b = near(R.beats, t, 3);
    if (b.length < 3) return null;
    let bpm = 60 / median(b.slice(1).map((x, i) => x - b[i]));
    while (bpm > 200) bpm /= 2;
    while (bpm < 40) bpm *= 2;
    return Math.round(bpm);
  }
  /* How driving the beat is (0..5): beats and hard hits a second, within two seconds either side. */
  const driveAt = (R, t) => Math.round(clamp((near(R.beats, t, 2).length / 4) * 0.8 + (near(R.accents, t, 2).length / 4) * 2, 0, 5));
  /* How many of the cuts near t land within 80 ms of a beat. */
  function syncAt(d, R, t) {
    const c = near(d.cuts, t, 4);
    if (c.length < 2) return null;
    const on = c.filter((x) => R.beats.some((b) => Math.abs(b - x) <= 0.08)).length / c.length;
    return on >= 0.75 ? "cuts on the beat" : on >= 0.4 ? "loosely" : "ignores the beat";
  }

  /* ---------- the lanes ---------- */
  const PIC = "Look of the picture",
    FR = "Shot framing",
    RH = "Rhythm";
  /* src: which times to read at (looks, elements, samples or rhythm); val(d, t, src) -> a value or null. */
  const MORE = [
    { id: "colorFilter", name: "Palette: how strong its tint", group: PIC, track: "master", how: "measured", from: "how far its darks, mids and lights lean away from grey (the color grade)", src: "looks", val: (d, t) => { const c = tintAt(d.looks, t); return c && tintStrength(c.strength); } },
    { id: "filterHue", name: "Palette: which color it leans to", group: PIC, track: "master", how: "measured", from: "the color its darks, mids and lights lean toward (the color grade)", src: "looks", val: (d, t) => { const c = tintAt(d.looks, t); return c && c.strength >= 0.02 ? hueName(c.hue) : null; } },
    { id: "colorRange.filmStock", name: "Grain", group: PIC, track: "master", how: "measured", from: "how much grain is in the flat parts of the picture", src: "looks", val: (d, t) => grainOf(lk(d.looks, "grain", t)) },
    { id: "texture", name: "Crisp or soft", group: PIC, track: "master", how: "measured", from: "how crisp the strongest edges are (and grain on top: gritty)", src: "looks", val: (d, t) => textureOf(lk(d.looks, "sharp", t), lk(d.looks, "grain", t)) },
    { id: "aspect", name: "Picture shape", group: PIC, track: "master", how: "measured", from: "the picture's width against its height, inside any black bars", src: "looks", val: (d) => (d.looks.aspect ? aspectOf(d.looks.aspect) : null) },
    { id: "aspect.letterbox", name: "Black bars", group: PIC, track: "master", how: "measured", from: "dark rows or columns all the way across the edges", src: "looks", val: (d) => (d.looks.bars ? barsOf(d.looks.bars) : null) },
    { id: "cameraLensLens.vignette", name: "Dark edges (vignette)", group: PIC, track: "master", how: "measured", from: "how much darker the edges are than the middle", src: "looks", val: (d, t) => band(lk(d.looks, "vig", t), [0.15, 0.35], ["none", "subtle", "heavy"]) },
    { id: "composition", name: "Where the eyes sit", group: FR, track: "camera", how: "measured", from: "the main person's eyes, left third, middle or right third (AI cut-out)", src: "elements", val: (d, t) => { const s = shot(d, t); return s && band(s.x, [0.42, 0.58], ["left third", "center", "right third"]); } },
    { id: "shotSize.headroom", name: "Room above the head", group: FR, track: "camera", how: "measured", from: "the space from the top of the main person's head to the top of the frame (AI cut-out)", src: "elements", val: (d, t) => { const s = shot(d, t); return s && headroom(s); } },
    { id: "shotSize", name: "How close (head size)", group: FR, track: "camera", how: "measured", from: "how much of the frame's height the main person's head fills (AI cut-out)", src: "elements", val: (d, t) => { const s = shot(d, t); return s && s.size > 0 ? sizeOf(s.size) : null; } },
    { id: "composition.facing", name: "Which way they face", group: FR, track: "camera", how: "estimated", from: "the face against the hair, and which way the main person moves (AI cut-out)", src: "elements", val: (d, t) => { const s = shot(d, t); return s && facingOf(s.facing); } },
    { id: "shotSize.breathing", name: "Room in front of them", group: FR, track: "camera", how: "estimated", from: "the space left in the way the main person faces or walks (AI cut-out)", src: "elements", val: (d, t) => { const s = shot(d, t); return s && breathing(s); } },
    { id: "dutch", name: "Horizon tilt", group: FR, track: "camera", how: "measured", from: "how far the picture's straight lines (walls, doors, horizons) are rolled from level", src: "samples", val: (d, t) => { const r = root.CurioFraming ? root.CurioFraming.rollAt(d, t) : null; return r == null ? null : Math.abs(r) >= 2.5 ? "tilted" : "level"; } },
    { id: "angleHeight", name: "Camera height", group: FR, track: "camera", how: "estimated", from: "more hair against faces, and people lower in the frame, means seen from above (AI cut-out)", src: "elements", val: (d, t) => { const a = d.elements.parts ? V().angleCue(d.elements, t) : null; return a == null ? null : a > 0.3 ? "high" : a < -0.3 ? "low" : "eye"; } },
    { id: "music.tempo", name: "Tempo", unit: "beats a minute", group: RH, track: "master", how: "measured", from: "how far apart the beats in its sound are", src: "rhythm", val: (d, t) => tempoAt(d.rhythm, t) },
    { id: "music.energy", name: "How driving the beat is", group: RH, track: "master", how: "estimated", from: "how many beats and hard hits there are a second", src: "rhythm", val: (d, t) => driveAt(d.rhythm, t) },
    { id: "music.cutSync", name: "Cuts on the beat", group: RH, track: "master", how: "measured", from: "how many of its cuts land on a beat of its sound", src: "rhythm", val: (d, t) => syncAt(d, d.rhythm, t) },
  ];

  /* The times each source is read at. */
  function timesOf(d, src) {
    if (src === "looks") return d.looks && d.looks.times && d.looks.times.length ? d.looks.times : null;
    if (src === "elements") {
      const el = d.elements;
      if (!el) return null;
      const m = el.main && el.main.times && el.main.times.length ? el.main : el;
      return m.times && m.times.length ? m.times : null;
    }
    if (src === "samples") return d.raw && d.raw.roll && d.times && d.times.length ? d.times : null;
    /* rhythm: only a beat heard in the sound (a beat taken from the cuts is the cutting rate, already a lane) */
    if (src === "rhythm") {
      if (!d.rhythm || d.rhythm.from !== "sound" || !d.rhythm.beats || !d.rhythm.beats.length) return null;
      const out = [];
      for (let t = 0; t < d.duration; t += 0.25) out.push(Math.round(t * 1000) / 1000);
      return out;
    }
    return null;
  }
  function build(d) {
    const minHold = Math.max(0.4, Math.min(1.5, (d.duration || 0) / 40));
    const more = [];
    MORE.forEach((c) => {
      const times = timesOf(d, c.src);
      if (!times) return;
      let curve;
      try {
        curve = times.map((t) => {
          const v = c.val(d, t);
          return v == null ? null : S() ? S().fix(c.id, v) : v;
        });
      } catch (e) {
        return;
      }
      if (curve.every((v) => v == null)) return;
      /* a change has to hold for two looks at least (one look on its own is a flicker); a tempo, a second and a half */
      const dt = times.length > 1 ? (times[times.length - 1] - times[0]) / (times.length - 1) : 1;
      const nodes = V().nodesOf(curve, times, Math.max(minHold, 1.5 * dt, c.src === "rhythm" ? 1.5 : 0));
      if (!nodes.length) return;
      /* the first look holds from the clip's start, as the older lanes do */
      if (nodes[0].t === times[0]) nodes[0] = { t: 0, value: nodes[0].value };
      more.push(Object.assign({}, c, { nodes }));
    });
    /* The older lanes first; a newer lane with the same curiosity (shot size from the head) takes its place. */
    const ids = new Set(more.map((c) => c.id));
    const old = V()
      .LIST.filter((c) => d.nodes && d.nodes[c.id] && !ids.has(c.id))
      .map((c) => Object.assign({}, c, { how: (d.how && d.how[c.id] && d.how[c.id].how) || c.how, nodes: d.nodes[c.id] }));
    return old.concat(more);
  }
  const cache = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function of(d) {
    if (!d || !V()) return [];
    const key = [d.nodes, d.looks, d.elements, d.elements && d.elements.main, d.rhythm, d.raw];
    const hit = cache && cache.get(d);
    if (hit && hit.key.every((x, i) => x === key[i])) return hit.lanes;
    const lanes = build(d);
    if (cache) cache.set(d, { key, lanes });
    return lanes;
  }

  root.CurioVideoLanes = { MORE, of, tintAt };
})();
