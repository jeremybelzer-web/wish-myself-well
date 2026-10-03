/* The Video window's arithmetic, in Node with no page: node apps/curiosities/video/tests/run.js
   Made-up frames and sound stand in for real clips, so every check knows the right answer. */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ROOT = path.join(__dirname, "..", "..");
const CORE = JSON.parse(fs.readFileSync(path.join(ROOT, "core", "files.json"), "utf8")).files;
const VIDEO = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files.json"), "utf8"));
const core = require(path.join(ROOT, "core", "headless.js")).load({ files: CORE.concat(VIDEO.core.map((f) => "video/" + f)) });
const w = core.window;
const V = w.CurioVideo,
  E = w.CurioEngine;

let failed = 0,
  passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log("ok   " + name);
  } catch (e) {
    failed++;
    console.log("FAIL " + name + "\n     " + (e && e.message));
  }
}

/* A frame W x H: a pattern whose brightness is b (0..1), tinted warm by warm, slid right by sx pixels. */
const GW = 64,
  GH = 36;
function frame(b, warm, sx, w0, h0, scene) {
  const W = w0 || GW,
    H = h0 || GH;
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const u = (x - (sx || 0) * (W / GW) + 1000 * W) % W;
      const tex = scene ? 0.5 + 0.5 * Math.cos(u / 7 + y / 2) : 0.5 + 0.5 * Math.sin(u / 3) * Math.cos(y / 4); /* a second scene has another pattern */
      const v = Math.max(0, Math.min(1, b * (0.6 + 0.8 * tex)));
      const p = (y * W + x) * 4;
      d[p] = 255 * Math.min(1, v * (1 + warm));
      d[p + 1] = 255 * v;
      d[p + 2] = 255 * Math.min(1, v * (1 - warm));
      d[p + 3] = 255;
    }
  return d;
}
/* A made-up clip: brightness from fn(t), camera slide from slide(t) (pixels), cuts where cut(t) is true. */
function makeClip(name, dur, fps, fn, opts) {
  opts = opts || {};
  const samples = [];
  let prev = null,
    prevF = null;
  for (let i = 0; i < Math.round(dur * fps); i++) {
    const t = i / fps;
    const sx = opts.slide ? opts.slide(t) : 0;
    const scene = opts.scene ? opts.scene(t) : 0;
    const px = frame(fn(t), opts.warm ? opts.warm(t) : 0, sx, GW, GH, scene);
    const pxF = frame(fn(t), opts.warm ? opts.warm(t) : 0, sx, GW * 2, GH * 2, scene);
    const g = V.toGray(px, GW, GH),
      gf = V.toGray(pxF, GW * 2, GH * 2);
    samples.push({ t, s: V.frameStats(px, GW, GH), m: prev ? V.motion(prev, g, GW, GH, 5, { prev: prevF, cur: gf, w: GW * 2, h: GH * 2 }) : null });
    prev = g;
    prevF = gf;
  }
  return { name, duration: dur, aspect: GH / GW, samples, gw: GW, sound: opts.sound || null };
}
/* Sound: 16 kHz, loudness from loud(t) (0..1), syllable bumps at syl per second while talk(t). */
function makeSound(dur, loud, talk, syl) {
  const rate = 16000,
    pcm = new Float32Array(Math.round(dur * rate));
  for (let i = 0; i < pcm.length; i++) {
    const t = i / rate;
    const on = talk(t);
    const bump = on ? Math.pow(Math.sin(Math.PI * syl * t), 2) : 0; /* syl bumps a second */
    pcm[i] = 0.002 * Math.sin(i * 0.37) + (on ? loud(t) * (0.15 + 0.85 * bump) * Math.sin((2 * Math.PI * 220 * i) / rate) : 0);
  }
  return V.envelope(pcm, rate);
}

check("frame stats: brightness, warmth and color strength read back", () => {
  const dark = V.frameStats(frame(0.2, 0, 0), GW, GH),
    bright = V.frameStats(frame(0.7, 0, 0), GW, GH),
    warm = V.frameStats(frame(0.5, 0.3, 0), GW, GH);
  assert(bright.luma > dark.luma + 0.2, "brighter frame reads brighter");
  assert(warm.warm > 0.05 && Math.abs(bright.warm) < 0.01, "a warm tint reads warm");
  assert(warm.sat > bright.sat, "a tint is more color");
});
check("motion: a slide of 2.5 pixels is found to a fraction of a pixel", () => {
  const a = frame(0.5, 0, 0),
    b = frame(0.5, 0, 2.5);
  const fa = frame(0.5, 0, 0, GW * 2, GH * 2),
    fb = frame(0.5, 0, 2.5, GW * 2, GH * 2);
  const m = V.motion(V.toGray(a, GW, GH), V.toGray(b, GW, GH), GW, GH, 5, { prev: V.toGray(fa, GW * 2, GH * 2), cur: V.toGray(fb, GW * 2, GH * 2), w: GW * 2, h: GH * 2 });
  assert(Math.abs(m.dx - 2.5) < 0.6, "dx " + m.dx);
  assert(Math.abs(m.dy) < 0.6, "dy " + m.dy);
});

/* The inspiration: dark for 2 s, bright for 2 s, dark again; a camera that sways; someone talking fast. */
const insp = V.analyze(
  makeClip("Get well Rupa.mp4", 6, 12, (t) => (t >= 2 && t < 4 ? 0.75 : 0.25), {
    slide: (t) => 3 * Math.sin(t * 1.5),
    warm: () => 0.2,
    sound: makeSound(6, (t) => (t < 3 ? 0.1 : 0.6), (t) => t % 2 < 1.4, 5),
  })
);
check("dissect: every lane has values and the brightness lanes change where the clip does", () => {
  ["valueKey", "setBrightness", "contrast", "warmCool", "cameraMove", "cutRate", "volume", "pace", "emotion"].forEach((id) => assert(insp.nodes[id] && insp.nodes[id].length, "no lane " + id));
  const n = insp.nodes.valueKey;
  assert(n.length === 3, "valueKey nodes " + JSON.stringify(n));
  assert(n[0].value === "low key" && n[1].value === "high key" && n[2].value === "low key", JSON.stringify(n));
  assert(Math.abs(n[1].t - 2) < 0.4 && Math.abs(n[2].t - 4) < 0.4, "changes at 2 s and 4 s: " + JSON.stringify(n));
  assert(insp.how.emotion.how === "estimated" && insp.how.valueKey.how === "measured");
});
check("dissect: loudness rises where the sound does, and talking is found", () => {
  const v = insp.nodes.volume;
  const top = (a, b) => Math.max(...v.filter((n) => n.t >= a && n.t < b).map((n) => n.value));
  assert(v.length >= 2 && top(3, 6) > top(0, 3), JSON.stringify(v));
  assert(insp.speech.phrases.length >= 2, "phrases " + insp.speech.phrases.length);
  const syl = insp.speech.phrases.reduce((s, p) => s + p.syll, 0) / insp.speech.phrases.reduce((s, p) => s + p.end - p.start, 0);
  assert(syl > 3 && syl < 7, "syllables a second " + syl);
});
check("dissect: a cut is found and a sway is not a cut", () => {
  const d = V.analyze(makeClip("cuts", 6, 12, (t) => (t < 3 ? 0.35 : 0.8), { scene: (t) => (t < 3 ? 0 : 1), warm: (t) => (t < 3 ? 0.3 : -0.2), slide: (t) => 2 * Math.sin(t * 2) }));
  assert.deepStrictEqual(d.cuts.length, 1, "cuts " + JSON.stringify(d.cuts));
  assert(Math.abs(d.cuts[0] - 3) < 0.2);
  assert(insp.cuts.length === 0, "sway read as cut: " + JSON.stringify(insp.cuts));
});
check("a node only where a value changes, never for a one-look flicker", () => {
  const d = V.analyze(makeClip("flicker", 4, 12, (t) => (Math.abs(t - 1.5) < 0.05 ? 0.9 : 0.4)));
  assert.strictEqual(d.nodes.valueKey.length, 1, JSON.stringify(d.nodes.valueKey));
});

/* Your clip: steady middle brightness, no sway, quiet, longer than the inspiration. */
const target = V.analyze(makeClip("Get well Rupa we love you.mp4", 9, 12, () => 0.45, { sound: makeSound(9, () => 0.2, (t) => t % 3 < 2, 3) }));
check("apply light at the same rate: the gain follows the inspiration's dark-bright-dark, repeating", () => {
  const p = V.plan(insp, target, { on: { light: 1 } });
  const g = (t) => V.at(p, t).luma;
  assert(g(1) < 0.8 && g(3) > 1.3 && g(5) < 0.8, [g(1), g(3), g(5)].join(" "));
  assert(g(7) < 0.8 && g(9 - 0.1) > 1.3 ? true : g(7) < 0.8, "repeats: 7 s is 1 s into the second time round (dark) " + g(7));
});
check("apply light stretched: the inspiration's 6 s spread over 9 s", () => {
  const p = V.plan(insp, target, { on: { light: 1 }, mode: "stretch" });
  assert(V.at(p, 4.5).luma > 1.3 && V.at(p, 1).luma < 0.8 && V.at(p, 8).luma < 0.8);
});
check("paint: the gain brightens pixels, warmth tints them, and nothing else changes when off", () => {
  const d = frame(0.4, 0, 0);
  const before = V.frameStats(d, GW, GH);
  const x = new Uint8ClampedArray(d);
  V.paint(x, GW, GH, { luma: 1.5, contrast: 1, sat: 1, warm: 0.2 }, before.luma);
  const after = V.frameStats(x, GW, GH);
  assert(after.luma > before.luma * 1.3 && after.warm > before.warm + 0.05);
  const y = new Uint8ClampedArray(d);
  V.paint(y, GW, GH, { luma: 1, contrast: 1, sat: 1, warm: 0 }, before.luma);
  assert.deepStrictEqual(Array.from(y), Array.from(d));
});
check("every group on its own changes only its own part of the frame", () => {
  V.GROUPS.forEach((g) => {
    const on = {};
    V.GROUPS.forEach((x) => (on[x.id] = x.id === g.id ? 1 : 0));
    const a = V.at(V.plan(insp, target, { on }), 3);
    const touched = [a.luma !== 1 && "luma", a.contrast !== 1 && "contrast", a.sat !== 1 && "sat", a.warm !== 0 && "warm", (a.dx !== 0 || a.dy !== 0) && "slide", a.gainDb !== 0 && "sound", a.line && "line"].filter(Boolean);
    const allowed = { light: ["luma"], contrast: ["contrast"], color: ["sat"], warmth: ["warm"], shake: ["slide"], move: ["slide"], size: [], cuts: [], speed: [], loud: ["sound"], dialogue: ["line"] }[g.id];
    touched.forEach((x) => assert(allowed.includes(x), g.id + " touched " + x));
  });
});
check("apply loudness: the gain makes the clip louder where the inspiration is", () => {
  const p = V.plan(insp, target, { on: { loud: 1 } });
  assert(V.at(p, 4.5).gainDb > V.at(p, 1).gainDb + 6, V.at(p, 4.5).gainDb + " vs " + V.at(p, 1).gainDb);
});
check("apply cuts: a jump forward where the inspiration cuts", () => {
  const cutInsp = V.analyze(makeClip("cuts", 6, 12, (t) => (t < 3 ? 0.35 : 0.8), { scene: (t) => (t < 3 ? 0 : 1), warm: (t) => (t < 3 ? 0.3 : -0.2) }));
  assert.strictEqual(cutInsp.cuts.length, 1);
  const p = V.plan(cutInsp, target, { on: { cuts: 1 } });
  const span = (t) => V.at(p, t + 0.2).src - V.at(p, t - 0.2).src;
  assert(span(cutInsp.cuts[0]) > 0.7, "across the cut " + span(cutInsp.cuts[0]));
  assert(Math.abs(span(1) - 0.4) < 0.05, "elsewhere " + span(1));
});
check("apply movement speed: faster where the inspiration moves more", () => {
  const busy = V.analyze(makeClip("busy", 6, 12, () => 0.5, { slide: (t) => (t > 3 ? 4 * Math.sin(t * 9) : 0) }));
  busy.raw.local = busy.times.map((t) => (t > 3 ? 0.05 : 0.005));
  const calm = Object.assign({}, target, { raw: Object.assign({}, target.raw, { local: target.times.map(() => 0.02) }) });
  const p = V.plan(busy, calm, { on: { speed: 1 } });
  const rate = (t) => (V.at(p, t + 0.5).src - V.at(p, t).src) / 0.5;
  assert(rate(4) > rate(1) * 1.3, rate(4) + " vs " + rate(1));
});
check("dialogue: one line per phrase of the inspiration, on the title's topic, syllables close", () => {
  const p = V.plan(insp, target, { on: { dialogue: 1 } });
  assert(p.lines.length >= 3, "lines " + p.lines.length);
  p.lines.forEach((l) => assert(Math.abs(l.syll - l.want) <= Math.max(2, l.want * 0.25), JSON.stringify(l)));
  assert(p.lines.some((l) => /Rupa/.test(l.text)), "the name from the title");
  assert(p.lines.every((l) => l.end <= p.duration + 1e-6));
  assert(V.syllables("we love you so much") === 5 && V.syllables("everyone") >= 3);
  assert.strictEqual(V.topicOf("The Cube + Swing Theme ver 5.mov").kind, "show");
});
check("onto My film: one lane per curiosity, a node only where it changes, accepted as one undo step", () => {
  E.send({ type: "importFilm", film: { rows: [1, 2, 3, 4, 5, 6].map((i) => ({ id: "r" + i, label: "Moment " + i })), tracks: w.CurioTracks.forCast(["Rupa"]) } });
  const cmds = V.engineCommands(insp, E.state());
  const r = E.send({ type: "batch", commands: cmds });
  assert(r.ok, r.error);
  const lane = E.state().lanes["master|valueKey"];
  assert(lane && lane.mode === "hold", "a valueKey lane that holds");
  assert.deepStrictEqual(Object.keys(lane.points), ["r1", "r3", "r5"], JSON.stringify(lane.points));
  const again = E.send({ type: "batch", commands: V.engineCommands(insp, E.state()) });
  assert(again.ok, "a second time replaces the lanes: " + again.error);
  E.undo();
  E.undo();
  assert(!E.state().lanes["master|valueKey"], "undone");
  const ref = E.send({ type: "addRef", ref: V.toRef(insp) });
  assert(ref.ok, ref.error);
});
check("graphics laid over: off unless asked, keyed so a pale background drops out and color stays", () => {
  assert(!V.at(V.plan(insp, target, {}), 1).overlay, "off by default");
  const p = V.plan(insp, target, { on: { overlay: 1 } });
  const o = V.at(p, 1).overlay;
  assert(o && o.t >= 0 && o.t <= insp.duration, JSON.stringify(o));
  const px = new Uint8ClampedArray([240, 240, 250, 255, 30, 90, 200, 255, 20, 20, 40, 255, 180, 180, 180, 255]);
  V.keyOut(px, 1);
  assert(px[3] < 30, "pale lavender drops out " + px[3]);
  assert(px[7] > 240, "blue stays " + px[7]);
  assert(px[11] > 240, "dark text stays " + px[11]);
  assert(px[15] < 30, "light grey checkerboard drops out " + px[15]);
  const empty = new Uint8ClampedArray([0, 0, 0, 0]);
  V.keyOut(empty, 1);
  assert(empty[3] === 0, "an empty (see-through) pixel stays see-through, not black " + empty[3]);
});
check("toMedia gives the media window's sample shape", () => {
  const m = V.toMedia(insp, 2);
  assert(m.samples.length === insp.times.length && m.step === 2 && m.duration === insp.duration, "lengths");
  const s = m.samples[3];
  ["t", "luma", "contrast", "sat", "warm", "motion"].forEach((k) => assert(typeof s[k] === "number" && isFinite(s[k]), k));
  assert(m.samples.filter((x) => x.cut).length === insp.cuts.length, "one cut sample per cut");
});
check("element cut-outs: stats, series and what to change", () => {
  /* a 10x10 frame: clothes (4) in the lower half are teal on the left, the rest is set (0) */
  const w = 10, h = 10, labels = new Uint8Array(w * h), rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const y = (i / w) | 0, x = i % w;
    if (y >= 5) labels[i] = x < 5 ? 4 : 1;
    const teal = labels[i] === 4 && x < 2;
    rgba.set(teal ? [20, 180, 170, 255] : [120, 110, 100, 255], i * 4);
  }
  const st = V.partStats(labels, rgba, w, h);
  assert(Math.abs(st.person.area - 0.5) < 1e-9 && Math.abs(st.clothes.area - 0.25) < 1e-9, "areas " + JSON.stringify(st.person));
  assert(st.clothes.vg > st.clothes.g && st.clothes.vr < st.clothes.r, "the vivid color leans to the teal: " + JSON.stringify(st.clothes));
  assert(st.person.bottom === 1 && st.person.top === 0.5, "people's top and bottom");
  const E = V.elementSeries([{ t: 0, stats: st }, { t: 1, stats: st }, { t: 2, stats: st }]);
  assert(E.times.length === 3 && E.parts.clothes.area.length === 3, "series");
  const small = V.partStats(labels.map((l, i) => (i % w < 7 ? l : 0)), rgba, w, h);
  const A = Object.assign({}, insp, { elements: E }), B = Object.assign({}, insp, { elements: V.elementSeries([{ t: 0, stats: small }, { t: 2, stats: small }]) });
  const p = V.plan(A, B, { on: { wardrobe: 1, figure: 1, set: 1 } });
  const a = V.at(p, 1);
  assert(a.parts && a.parts.clothes && a.parts.clothes.color[1] > a.parts.clothes.color[0], "clothes take the inspiration's teal: " + JSON.stringify(a.parts));
  assert(a.parts.person && a.parts.person.scale > 1, "smaller people are made bigger: " + JSON.stringify(a.parts.person));
  assert(a.parts.background && a.parts.background.amount === 1, "the set comes from the inspiration");
  assert(!V.at(V.plan(insp, insp, { on: { wardrobe: 1 } }), 1).parts, "no cut-outs, no element changes");
  /* camera angle: lots of hair over a low face reads as seen from above; a big face and little hair, from below */
  const head = (hairRows, faceRows, y0) => {
    const l = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const y = (i / w) | 0;
      if (y >= y0 && y < y0 + hairRows) l[i] = 1;
      else if (y >= y0 + hairRows && y < y0 + hairRows + faceRows) l[i] = 3;
    }
    return V.partStats(l, rgba, w, h);
  };
  const above = V.elementSeries([{ t: 0, stats: head(3, 2, 5) }, { t: 2, stats: head(3, 2, 5) }]);
  const below = V.elementSeries([{ t: 0, stats: head(1, 4, 1) }, { t: 2, stats: head(1, 4, 1) }]);
  assert(V.angleCue(above, 1) > 0.3 && V.angleCue(below, 1) < -0.3, "angle guesses " + V.angleCue(above, 1) + " " + V.angleCue(below, 1));
  const pa = V.plan(Object.assign({}, insp, { elements: above }), Object.assign({}, insp, { elements: below }), { on: { angle: 1 } });
  assert(V.at(pa, 1).parts.angle.tilt > 0.5, "a clip seen from below is tipped to look from higher: " + JSON.stringify(V.at(pa, 1).parts));
  assert(V.angleCue(E, 1) === null || typeof V.angleCue(E, 1) === "number", "no faces or hair: no guess");
});
/* ---------- looks (video/looks.js): palette, grain and softness, frame shape ---------- */
const LK = w.CurioLooks;
function pic(W, H, f) {
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = f(x, y),
        p = (y * W + x) * 4;
      d[p] = c[0];
      d[p + 1] = c[1];
      d[p + 2] = c[2];
      d[p + 3] = 255;
    }
  return d;
}
const chan = (d, c) => {
  let s = 0;
  for (let i = c; i < d.length; i += 4) s += d[i];
  return s / (d.length / 4);
};
let seed = 11;
const noise = () => {
  let u = 0;
  for (let i = 0; i < 12; i++) u += (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  return u - 6;
};
/* a checkered scene, softened by blur (0..1) and with grain (0..1 brightness) */
function scenePic(W, H, blur, grain, tint) {
  const d = pic(W, H, (x, y) => {
    const v = 70 + 110 * ((Math.floor(x / 20) + Math.floor(y / 20)) % 2) + 20 * Math.sin(x / 9);
    return tint ? [v * tint[0], v * tint[1], v * tint[2]] : [v, v, v];
  });
  if (blur) LK.texture(d, W, H, -blur, W / LK.LOOK_W);
  if (grain) for (let i = 0; i < W * H; i++) for (let c = 0, e = noise() * grain * 255; c < 3; c++) d[i * 4 + c] += e;
  return d;
}
const looksOf = (make, dur, W, H) => LK.series([0, 1, 2, 3].map((k) => ({ t: (k * dur) / 3, m: LK.measure(make(k), W || 320, H || 180) })));
check("frame shape: letterbox bars and the picture's shape are found, and drawn on another clip", () => {
  const barred = pic(320, 240, (x, y) => (y < 40 || y >= 200 ? [4, 3, 5] : [90 + (x % 50), 120, 80 + (y % 30)]));
  const b = LK.barsOf(barred, 320, 240);
  assert(Math.abs(b.top - 1 / 6) < 0.01 && Math.abs(b.bottom - 1 / 6) < 0.01 && b.left === 0 && b.right === 0, JSON.stringify(b));
  assert(LK.barsOf(pic(64, 36, () => [0, 0, 0]), 64, 36) === null, "an all-black frame is not bars");
  assert(LK.barsOf(pic(64, 36, () => [120, 90, 60]), 64, 36).top === 0, "no bars");
  const A = LK.series([{ t: 0, m: LK.measure(barred, 320, 240) }]);
  assert(Math.abs(A.aspect - 2) < 0.02, "a 4:3 frame with bars holds a 2:1 picture: " + A.aspect);
  const flat = pic(320, 180, () => [150, 150, 150]);
  const p = V.plan(Object.assign({}, insp, { looks: A }), Object.assign({}, target, { looks: looksOf(() => flat, 9) }), { on: { shape: 1 } });
  const a = V.at(p, 1);
  assert(a.looks && a.looks.shape && !a.looks.palette && !a.looks.texture, "only the frame shape: " + JSON.stringify(a.looks));
  const d = new Uint8ClampedArray(flat);
  LK.shape(d, 320, 180, a.looks.shape);
  const got = LK.barsOf(d, 320, 180);
  assert(Math.abs(320 / (180 * (1 - got.top - got.bottom)) - 2) < 0.05, "16:9 becomes a 2:1 picture: " + JSON.stringify(got));
  /* a tall inspiration gives side bars; half the amount, half the bars */
  const half = new Uint8ClampedArray(flat);
  LK.shape(half, 320, 180, { aspect: 9 / 16, vignette: 0, amount: 0.5 });
  const side = LK.barsOf(half, 320, 180);
  assert(side.left > 0.15 && side.left < 0.2 && side.top === 0, JSON.stringify(side));
  /* the tall window follows the people: someone on the left stays in the picture, moved to the middle */
  const left = pic(320, 180, (x) => (x < 80 ? [200, 40, 40] : [40, 40, 200]));
  LK.shape(left, 320, 180, { aspect: 9 / 16, vignette: 0, amount: 1, cx: 0.12, cy: 0.5 });
  assert(left[(90 * 320 + 160) * 4] > 150 && left[(90 * 320 + 10) * 4] === 0, "the red person is in the middle, bars at the sides");
  /* vignette: the edges made as much darker as asked */
  const v = new Uint8ClampedArray(flat);
  LK.shape(v, 320, 180, { aspect: null, vignette: LK.vigAmount(0.4, 0), amount: 1 });
  const Y = new Float32Array(320 * 180).map((_, i) => v[i * 4] / 255);
  assert(Math.abs(LK.vigOf(Y, 320, 180) - 0.4) < 0.03, "vignette " + LK.vigOf(Y, 320, 180));
});
check("borrowed palette: each color's mean moves to the inspiration's, skin keeps its hue, and the check sees it", () => {
  const blue = pic(160, 90, (x, y) => [30 + y, 60 + y, 120 + y]),
    green = pic(160, 90, (x) => [40 + x / 2, 60 + x, 50 + x * 0.6]);
  const d = new Uint8ClampedArray(green);
  LK.palette(d, 160, 90, LK.quantiles(blue, 160, 90), 1);
  /* the colors land on the inspiration's (each color against the brightness), the brightness moves half way */
  const tint = (x, c) => chan(x, c) - (0.299 * chan(x, 0) + 0.587 * chan(x, 1) + 0.114 * chan(x, 2));
  const Y = (x) => 0.299 * chan(x, 0) + 0.587 * chan(x, 1) + 0.114 * chan(x, 2);
  [0, 1, 2].forEach((c) => assert(Math.abs(tint(d, c) - tint(blue, c)) < 5, "color " + c + ": " + tint(d, c) + " vs " + tint(blue, c)));
  assert(Math.abs(Y(d) - (Y(green) + Y(blue)) / 2) < 4, "brightness half way: " + [Y(green), Y(d), Y(blue)]);
  const halfway = new Uint8ClampedArray(green);
  LK.palette(halfway, 160, 90, LK.quantiles(blue, 160, 90), 0.5);
  assert(Math.abs(tint(halfway, 2) - (tint(green, 2) + tint(blue, 2)) / 2) < 5, "half the amount, half way");
  /* skin: a face-colored patch keeps most of its warmth while the green scene turns blue */
  const face = pic(160, 90, (x) => (x < 40 ? [205, 150, 120] : [40 + x / 2, 60 + x, 50 + x * 0.6]));
  LK.palette(face, 160, 90, LK.quantiles(blue, 160, 90), 1);
  const p0 = (20 * 160 + 20) * 4;
  assert(face[p0] > face[p0 + 2] + 40, "skin stays warm: " + Array.from(face.slice(p0, p0 + 3)));
  /* over time, through the plan: the gap to the inspiration's palette shrinks */
  const A = looksOf(() => blue, 6, 160, 90),
    B = looksOf(() => green, 9, 160, 90);
  const p = V.plan(Object.assign({}, insp, { looks: A }), Object.assign({}, target, { looks: B }), { on: { palette: 1 } });
  const a = V.at(p, 2);
  assert(a.looks.palette.amount === 1 && a.looks.palette.q.b[4] > 0.5, JSON.stringify(a.looks.palette.q.b));
  const after = { times: [0.5, 2, 4], looks: LK.series([0.5, 2, 4].map((t) => ({ t, m: LK.measure(d, 160, 90) }))) };
  const sc = V.score(p, "palette", Object.assign({}, target, { looks: B }), after);
  assert(sc.gapAfter < sc.gapBefore / 2, JSON.stringify(sc));
});
check("grain and softness: grain is measured, a soft grainy inspiration softens a crisp clip and adds its grain", () => {
  const crisp = scenePic(320, 180, 0, 0),
    soft = scenePic(320, 180, 0.6, 0.03);
  const mc = LK.measure(crisp, 320, 180),
    ms = LK.measure(soft, 320, 180);
  assert(Math.abs(LK.measure(scenePic(320, 180, 0, 0.04), 320, 180).grain - 0.04) < 0.005, "grain of 0.04 measured");
  assert(mc.grain < 0.002 && ms.grain > 0.02 && ms.sharp < mc.sharp * 0.7, JSON.stringify([mc.grain, mc.sharp, ms.grain, ms.sharp]));
  const p = V.plan(Object.assign({}, insp, { looks: looksOf(() => scenePic(320, 180, 0.6, 0.03), 6) }), Object.assign({}, target, { looks: looksOf(() => crisp, 9) }), { on: { grain: 1 } });
  const t = V.at(p, 1).looks.texture;
  assert(t.k < -0.2 && t.grain > 0.02, JSON.stringify(t));
  const d = new Uint8ClampedArray(crisp);
  LK.texture(d, 320, 180, t.k, 1);
  LK.grain(d, 320, 180, t.grain, 5, 1);
  const m = LK.measure(d, 320, 180);
  assert(Math.abs(m.grain - ms.grain) < 0.01 && Math.abs(m.sharp - ms.sharp) < Math.abs(mc.sharp - ms.sharp) / 2, "now as grainy and soft: " + JSON.stringify([m.grain, m.sharp]));
  const half = V.at(V.plan(p.insp, p.target, { on: { grain: 0.5 } }), 1).looks.texture;
  assert(half.k > t.k && half.grain < t.grain, "half the amount, less change");
  assert(!V.at(V.plan(p.insp, p.target, { on: { light: 1 } }), 1).looks, "off: no looks change");
  assert(V.GROUPS.find((g) => g.id === "shape").off && !V.GROUPS.find((g) => g.id === "palette").off, "frame shape is off unless turned on");
});
check("paid AI: a price first, and caps that stop it", () => {
  const store = {};
  const ctx = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)) } };
  ctx.window = ctx;
  require("vm").runInNewContext(fs.readFileSync(path.join(__dirname, "..", "ai.js"), "utf8"), ctx);
  const A = ctx.CurioAI;
  assert(A.caps().job === 1 && A.caps().day === 5, "default caps $1 a job, $5 a day");
  assert(A.check(0.5) === null && /job cap/.test(A.check(2)), "a $2 job is stopped by the $1 cap");
  const sam = A.providers("cutout").find((p) => p.id === "fal-sam2");
  assert(A.price(sam, { seconds: 5 }) > 0 && A.price(sam, { seconds: 5 }) < 1, "a 5-second cut-out is priced under a dollar");
  /* falRun refuses past a cap before sending anything (no fetch exists here, so reaching it would fail differently) */
  A.falRun("fal-ai/x", {}, { estimate: 3 }).then(
    () => ((process.exitCode = 1), console.log("FAIL falRun ran past the cap")),
    (e) => /cap/.test(e.message) || ((process.exitCode = 1), console.log("FAIL falRun past the cap: " + e.message))
  );
  A.setCaps({ day: 0.3 });
  assert(/day cap/.test(A.check(0.5)) && A.caps().job === 1, "the day cap stops it too");
  assert(!JSON.stringify(store).includes("curiosities-ai-spent"), "spending is not saved in project files");
});
/* The steadier cut-out (mask.js), on made-up masks: no page or AI needed for these parts. */
const MK = (() => {
  const ctx = {};
  ctx.window = ctx;
  require("vm").runInNewContext(fs.readFileSync(path.join(__dirname, "..", "mask.js"), "utf8"), ctx);
  return ctx.CurioMask.tidy;
})();
/* a 40 x 30 mask: a person (clothes) in a box, with a hole and a speck */
function madeUp() {
  const w = 40,
    h = 30,
    L = new Uint8Array(w * h);
  for (let y = 5; y < 28; y++) for (let x = 10; x < 25; x++) L[y * w + x] = y < 9 ? 3 : 4;
  for (let y = 15; y < 17; y++) for (let x = 15; x < 18; x++) L[y * w + x] = 0; /* a 6-pixel hole in the clothes */
  L[3 * w + 33] = 4; /* a 1-pixel speck */
  for (let y = 18; y < 24; y++) for (let x = 0; x < 6; x++) L[y * w + x] = 0; /* set touching the edge stays set */
  return { w, h, L };
}
check("cut-out clean-up: specks dropped, small holes filled with the element around them", () => {
  const { w, h, L } = madeUp();
  const fix = MK.cleanLabels(L, w, h, { island: 0.01, hole: 0.02 });
  assert(L[3 * w + 33] === 0 && fix[3 * w + 33] === 1, "the speck is gone");
  assert(L[15 * w + 16] === 4 && fix[15 * w + 16] === 2, "the hole is filled with clothes");
  assert(L[0] === 0 && L[20 * w + 2] === 0 && L[12 * w + 30] === 0, "the set stays set");
  assert(L[6 * w + 12] === 3, "the face stays face");
});
check("cut-out clean-up: a big gap stays open, a far-away person alone is kept", () => {
  const w = 40,
    h = 30,
    L = new Uint8Array(w * h);
  for (let y = 2; y < 28; y++) for (let x = 5; x < 35; x++) L[y * w + x] = 4;
  for (let y = 8; y < 22; y++) for (let x = 12; x < 28; x++) L[y * w + x] = 0; /* 224 px, more than 2% of 1200 */
  MK.cleanLabels(L, w, h, { island: 0.01, hole: 0.02 });
  assert(L[15 * w + 20] === 0, "a gap bigger than a hole stays open");
  /* a gap the AI is sure of stays open even when small; one it half saw (motion blur) is filled */
  const { L: L2 } = madeUp(),
    sure = new Float32Array(w * h),
    half = new Float32Array(w * h).fill(0.4);
  MK.cleanLabels(L2, w, h, { island: 0.001, hole: 0.02 }, sure);
  assert(L2[15 * w + 16] === 0, "a sure gap stays open");
  const { L: L3 } = madeUp();
  MK.cleanLabels(L3, w, h, { island: 0.001, hole: 0.02 }, half);
  assert(L3[15 * w + 16] === 4, "a half-seen hole is filled");
  const L4 = new Uint8Array(w * h);
  L4[10 * w + 10] = L4[10 * w + 11] = 2;
  MK.cleanLabels(L4, w, h, { island: 0.01, hole: 0.02 });
  assert(L4[10 * w + 10] === 2, "the only person in the frame stays, however small");
});
check("cut-out steadying: flicker is damped, a cut or a jump in time starts fresh", () => {
  const n = 100,
    gray = new Uint8Array(n).fill(100);
  const conf = (p) => [new Float32Array(n).fill(1 - p), new Float32Array(n).fill(p)];
  const prev = { gray, conf: conf(1), t: 1 };
  /* a still picture: the AI flickers to 0.2 for one frame; blended, the person stays above half */
  const c = conf(0.2);
  assert(MK.blend(c, gray, prev, 1.04, 0.45) && c[1][0] > 0.5, "one bad frame doesn't drop the person: " + c[1][0]);
  assert(MK.argmax(c, n)[0] === 1, "still labeled a person");
  /* where the picture moved a lot, the new frame counts more */
  const moved = new Uint8Array(n).fill(170),
    c2 = conf(0.2),
    prev2 = { gray: new Uint8Array(n).fill(150), conf: conf(1), t: 1 };
  MK.blend(c2, moved, prev2, 1.04, 0.45);
  assert(c2[1][0] < c[1][0], "moving pixels follow the new frame faster");
  const c3 = conf(0.2);
  assert(!MK.blend(c3, new Uint8Array(n).fill(220), prev, 1.04, 0.45) && Math.abs(c3[1][0] - 0.2) < 1e-6, "a cut is not blended");
  assert(!MK.blend(conf(0.2), gray, prev, 3, 0.45) && !MK.blend(conf(0.2), gray, prev, 0.5, 0.45), "a jump in time is not blended");
  assert(!MK.blend(conf(0.2), gray, null, 1, 0.45), "the first frame stands alone");
});

check("cut-out clean-up: a narrow bite out of a person's edge is closed, grow and shrink are exact", () => {
  const w = 30,
    h = 30,
    L = new Uint8Array(w * h);
  for (let y = 5; y < 25; y++) for (let x = 5; x < 25; x++) L[y * w + x] = 4;
  for (let y = 12; y < 14; y++) for (let x = 20; x < 25; x++) L[y * w + x] = 0; /* a 2-pixel slit from the edge */
  MK.cleanLabels(L, w, h, { island: 0.001, hole: 0.02, close: 2 });
  assert(L[12 * w + 22] === 4 && L[13 * w + 24] === 4, "the slit is closed");
  assert(L[12 * w + 27] === 0 && L[2 * w + 2] === 0, "outside stays set");
  const m = new Uint8Array(w * h);
  m[15 * w + 15] = 1;
  const g = MK.boxAny(m, w, h, 2);
  assert(g[13 * w + 17] === 1 && g[12 * w + 15] === 0 && g.reduce((a, b) => a + b) === 25, "grow by 2 is a 5 x 5 square");
  assert(MK.boxAll(g, w, h, 2).reduce((a, b) => a + b) === 1, "and shrinking it back leaves the one pixel");
});
check("cut-out: a blurred arm, half clothes and half skin, is still person", () => {
  const c = [[0.4], [0], [0.3], [0.3], [0], [0]].map((a) => Float32Array.from(a));
  assert(MK.argmax(c, 1)[0] === 2, "person (skin) wins over the set at 0.4");
  c[0][0] = 0.6;
  assert(MK.argmax(c, 1)[0] === 0, "and the set wins at 0.6");
});
check("camera angle by depth: made-up depth and the warp (depth.js)", () => {
  const ctx = { Math, Float32Array, Uint8Array, Uint8ClampedArray, Int32Array };
  ctx.window = ctx;
  require("vm").runInNewContext(fs.readFileSync(path.join(__dirname, "..", "depth.js"), "utf8"), ctx);
  const D = ctx.CurioDepth;
  /* made-up depth: a person standing in the lower middle of a 40 x 30 cut-out */
  const w = 40,
    h = 30,
    labels = new Uint8Array(w * h);
  for (let y = 8; y < 26; y++) for (let x = 16; x < 24; x++) labels[y * w + x] = y < 11 ? 1 : y < 14 ? 3 : 4;
  const g = D.guess(labels, w, h);
  assert(g[29 * w] > g[20 * w] && g[20 * w] > g[2 * w] - 1e-6, "the floor gets nearer toward the bottom");
  assert(Math.abs(g[20 * w + 20] - g[9 * w + 20]) < 0.05, "one person is one depth, feet to hair");
  assert(g[9 * w + 20] > g[9 * w + 5] + 0.3, "the person is in front of the wall behind them");
  /* the warp: far stripes behind a near square */
  const W = 60,
    H = 40,
    px = new Uint8ClampedArray(W * H * 4),
    near = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x,
        sq = x >= 24 && x < 36 && y >= 14 && y < 26;
      const v = sq ? 250 : y % 8 < 4 ? 40 : 120;
      px.set([v, sq ? 0 : v, sq ? 0 : v, 255], i * 4);
      near[i] = sq ? 0.9 : 0.1;
    }
  const same = D.warp(px, W, H, near, W, H, 0, { ref: 0.9 });
  let diff = 0;
  for (let i = 0; i < px.length; i++) diff += Math.abs(same[i] - px[i]);
  assert(diff / px.length < 0.5, "no tilt, no change: " + diff / px.length);
  const up = D.warp(px, W, H, near, W, H, 1, { ref: 0.9, refY: 0.5, lift: 0.1, pitch: 0, zoom: 0, fit: false });
  const at = (d, x, y) => d[(y * W + x) * 4 + 1];
  assert(at(up, 30, 15) === 0 && at(up, 30, 24) === 0, "the near square (the people) stays where it was");
  /* from higher up the far stripes slide up by 0.1 x 40 x 0.8 = 3.2 rows */
  const row = (d, x) => {
    for (let y = 1; y < H; y++) if (at(d, x, y) > 80 && at(d, x, y - 1) <= 80) return y;
  };
  const moved = row(px, 5) - row(up, 5);
  assert(moved >= 3 && moved <= 4, "the set behind slides up: " + moved + " rows");
  /* what the square uncovered (just above it, the set that was behind it) is filled from the stripes, not from the square, and nothing is left empty */
  assert(at(up, 30, 12) > 20 && at(up, 30, 12) < 140, "the uncovered strip is filled from the set: " + at(up, 30, 12));
  for (let i = 3; i < up.length; i += 4) assert(up[i] === 255, "every pixel drawn");
  /* pitch: the people's row still stays put while the picture turns */
  const turned = D.warp(px, W, H, near, W, H, 1, { ref: 0.9, refY: 0.5 });
  assert(at(turned, 30, 20) === 0, "turning the camera keeps the people in place");
  const lower = D.warp(px, W, H, near, W, H, -1, { ref: 0.9, lift: 0.1, pitch: 0, zoom: 0, fit: false });
  assert(row(px, 5) - row(lower, 5) < 0, "from lower down the set slides down instead");
});
check("bad input never throws", () => {
  V.analyze({ name: "", duration: 0, samples: [] });
  V.analyze({ name: "x", duration: 1, samples: [{ t: 0, s: V.frameStats(frame(0.5, 0, 0), GW, GH), m: null }] });
  V.speech(null);
  V.fitDialogue("", []);
  const p = V.plan(insp, V.analyze({ name: "x", duration: 1, samples: [{ t: 0, s: V.frameStats(frame(0.5, 0, 0), GW, GH), m: null }] }), {});
  V.at(p, 0);
  V.at(p, 99);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
