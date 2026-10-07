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
/* Shot framing (framing.js) on made-up cut-outs: a person drawn as hair over a face over clothes. */
function person(w, h, cx, top, headRows, opts) {
  opts = opts || {};
  const l = new Uint8Array(w * h);
  const hw = Math.max(2, Math.round(headRows * 0.8));
  for (let y = top; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      if (y < top + headRows * 0.35 && Math.abs(dx) <= hw / 2) l[y * w + x] = 1;
      else if (y < top + headRows && Math.abs(dx) <= hw / 2) l[y * w + x] = Math.abs(dx - (opts.turn || 0)) <= hw / 3 ? 3 : 1;
      else if (y >= top + headRows && Math.abs(dx) <= hw * 1.2) l[y * w + x] = 4;
    }
  return l;
}
function framingClip(name, frames, aspect) {
  const looks = frames.map((f, i) => ({ t: i * 0.25, blobs: w.CurioFraming.blobs(f, 64, 36) }));
  const el = { times: looks.map((l) => l.t), dt: 0.25, parts: null, main: w.CurioFraming.series(looks, aspect || 36 / 64) };
  return Object.assign({}, insp, { name, aspect: aspect || 36 / 64, cuts: [], elements: el });
}
check("shot framing: a person on the left third is moved to the right third (framing.js)", () => {
  const F = w.CurioFraming;
  assert(F && V.GROUPS.find((g) => g.id === "framing" && g.off), "framing is its own group, off unless turned on");
  const n = Math.ceil(insp.duration / 0.25) + 1;
  const right = framingClip("right", Array.from({ length: n }, () => person(64, 36, 43, 6, 10)));
  const left = framingClip("left", Array.from({ length: n }, () => person(64, 36, 21, 6, 10)));
  const bs = F.blobs(person(64, 36, 21, 6, 10), 64, 36);
  assert(bs.length === 1 && bs[0].face && Math.abs(bs[0].face.cx - 21.5 / 64) < 0.02, "one person, face found: " + JSON.stringify(bs[0]));
  assert(Math.abs(F.shot(left, 1).x - 0.336) < 0.02 && Math.abs(F.shot(right, 1).x - 0.68) < 0.02, "eyes on the thirds: " + JSON.stringify([F.shot(left, 1), F.shot(right, 1)]));
  const p = V.plan(right, left, { on: { framing: 1 } });
  assert(p.framing && p.framing.z.length > 5, "a camera path");
  const a = V.at(p, 1).frame;
  /* where the left person's eyes land in the output: (source x - crop left) x zoom */
  const out = (F.shot(left, 1).x - (a.x - 0.5 / a.z)) * a.z;
  assert(Math.abs(out - F.shot(right, 1).x) < 0.03, "the person now sits on the right third: " + out.toFixed(3) + " " + JSON.stringify(a));
  assert(a.z >= 2 && a.z <= 2.5, "zoomed in enough to move them: " + a.z);
  /* the same framing already: nothing to do */
  const same = V.at(V.plan(left, left, { on: { framing: 1 } }), 1).frame;
  assert(Math.abs(same.z - 1) < 0.02 && Math.abs(same.x - 0.5) < 0.02, "same framing, no move: " + JSON.stringify(same));
  /* a closer inspiration (bigger head) zooms in by about the head's ratio */
  const close = framingClip("close", Array.from({ length: n }, () => person(64, 36, 21, 4, 16)));
  const zc = V.at(V.plan(close, left, { on: { framing: 1 } }), 1).frame;
  assert(zc.z > 1.4, "closer: zoomed in " + JSON.stringify(zc));
  /* half the amount: half way */
  const half = V.at(V.plan(right, left, { on: { framing: 0.5 } }), 1).frame;
  const outH = (F.shot(left, 1).x - (half.x - 0.5 / half.z)) * half.z;
  assert(outH > 0.4 && outH < 0.6 && half.z <= 1.75 + 1e-9, "half the amount, half way: " + outH.toFixed(3) + " " + JSON.stringify(half));
});
check("shot framing: never zooms out, never shows an edge, even with a dutch tilt", () => {
  const F = w.CurioFraming;
  for (let i = 0; i < 400; i++) {
    const rnd = (a, b) => a + ((Math.sin(i * 12.9898 + a * 78.233 + b) * 43758.5453) % 1 + 1) % 1 * (b - a);
    const want = { x: rnd(0, 1), y: rnd(0, 1), size: rnd(0.02, 0.6) },
      have = { x: rnd(0, 1), y: rnd(0, 1), size: rnd(0.02, 0.6) },
      roll = rnd(-12, 12),
      aspect = i % 2 ? 9 / 16 : 16 / 9;
    const f = F.solve(want, have, { amount: rnd(0, 1), zmax: 2.5, aspect, roll });
    assert(f.z >= 1, "zoom never below 1: " + JSON.stringify(f));
    /* the crop's four corners, turned by the roll, stay inside the picture (in pixels of a 1000-wide frame) */
    const W = 1000,
      H = W * aspect,
      r = F.rect(Object.assign({ roll }, f), W, H),
      cx = r.x + r.w / 2,
      cy = r.y + r.h / 2,
      c = Math.cos(r.roll),
      s = Math.sin(r.roll);
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([u, v]) => {
      const x = cx + (u * r.w) / 2 * c - (v * r.h) / 2 * s,
        y = cy + (u * r.w) / 2 * s + (v * r.h) / 2 * c;
      assert(x > -0.5 && x < W + 0.5 && y > -0.5 && y < H + 0.5, "a corner off the picture: " + JSON.stringify({ f, roll, x, y }));
    });
  }
  /* a level picture of stripes, and the same turned 6 degrees: the roll is measured */
  const G = (deg) => {
    const g = new Float32Array(128 * 72),
      a = (deg * Math.PI) / 180;
    for (let y = 0; y < 72; y++) for (let x = 0; x < 128; x++) g[y * 128 + x] = Math.floor((-(x - 64) * Math.sin(a) + (y - 36) * Math.cos(a)) / 9) % 2 ? 0.8 : 0.2;
    return g;
  };
  const r0 = F.roll(G(0), 128, 72),
    r6 = F.roll(G(6), 128, 72);
  assert(Math.abs(r0.deg) < 0.5 && r0.conf > 0.5, "level: " + JSON.stringify(r0));
  assert(Math.abs(r6.deg - 6) < 1.5 && r6.conf > 0.35, "rolled 6 degrees: " + JSON.stringify(r6));
});
check("shot framing: the camera moves like an operator (no jitter, eases, follows the person)", () => {
  const F = w.CurioFraming;
  /* a wanted framing that wobbles a little and then jumps once: the camera ignores the wobble and eases over */
  const dt = 0.1,
    want = [];
  for (let i = 0; i < 100; i++) want.push((i < 50 ? 0.4 : 0.6) + 0.012 * Math.sin(i * 2.7) + (i === 20 ? 0.2 : 0));
  const got = F.follow(want, dt, { tol: 0.03, sigma: 0.5 });
  const steps = got.slice(1).map((v, i) => v - got[i]);
  assert(Math.max(...got.slice(0, 40).map((v) => Math.abs(v - got[0]))) < 0.005, "holds still through the wobble and a one-look blink: " + got.slice(0, 40).map((v) => v.toFixed(3)).join(" "));
  assert(Math.max(...steps.map(Math.abs)) < 0.05, "no jump bigger than 5% of the frame in a tenth of a second");
  assert(Math.abs(got[99] - 0.6) < 0.02 && Math.abs(got[0] - 0.4) < 0.02, "gets there");
  /* ease in and out: slow at the start and end of the move, fastest in the middle */
  const mv = steps.slice(35, 65).map(Math.abs);
  const peak = mv.indexOf(Math.max(...mv));
  assert(peak > 8 && peak < 22 && mv[0] < mv[peak] / 4 && mv[mv.length - 1] < mv[peak] / 4, "eases in and out: " + mv.map((v) => v.toFixed(3)).join(" "));
  /* a cut is a jump, not a glide */
  const cut = F.follow(want.map((v, i) => (i < 50 ? 0.3 : 0.7)), dt, { breaks: [50] });
  assert(Math.abs(cut[49] - 0.3) < 0.01 && Math.abs(cut[50] - 0.7) < 0.01, "a cut jumps");
  /* your person walks from the left to the middle: the camera follows them, smoothly */
  const n = Math.ceil(insp.duration / 0.25) + 1;
  const target = framingClip("walk", Array.from({ length: n }, (_, i) => person(64, 36, Math.round(14 + (18 * i) / (n - 1)) + (i % 2), 6, 10)));
  const right = framingClip("right", Array.from({ length: n }, () => person(64, 36, 43, 6, 10)));
  const p = V.plan(right, target, { on: { framing: 1 } });
  const xs = [];
  for (let t = 0; t <= p.duration - 0.05; t += 1 / 30) xs.push(V.at(p, t).frame.x);
  const d = xs.slice(1).map((v, i) => v - xs[i]);
  assert(xs[xs.length - 1] > xs[0] + 0.1, "the crop follows the person to the right: " + xs[0] + " -> " + xs[xs.length - 1]);
  assert(Math.max(...d.map(Math.abs)) < 0.01, "no jitter from frame to frame: " + Math.max(...d.map(Math.abs)));
  assert(d.filter((v) => v < -0.002).length === 0, "never swings back the wrong way");
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
check("borrowed palette: a cool palette on a warm room keeps shadowed skin warm and dark greys from going green or magenta", () => {
  /* a warm room (darks to lights, each color its own spread) and a pale, cool, lavender title card */
  const room = pic(160, 90, (x, y) => {
    const v = 10 + ((x + y * 160) % 230);
    return [v * 0.98 + 4, v * 0.96, v * 0.7];
  });
  const card = pic(160, 90, (x, y) => (x < 4 ? [90, 98, 105] : [205 + (y % 40) * 0.6, 200 + (y % 40) * 0.5, 228 + (y % 25) * 0.6]));
  const want = LK.quantiles(card, 160, 90);
  assert(want.b[4] > want.g[4] && want.r[4] > want.g[4], "the card is cool with a little magenta in its mids: " + JSON.stringify(want));
  const have = LK.quantiles(room, 160, 90);
  /* the pixels under test, laid on the room's first row (the room's quantiles stay as measured) */
  const probes = { shadowSkin: [70, 50, 42], deepSkin: [45, 32, 27], darkGrey: [30, 30, 30], midGrey: [55, 55, 55] };
  const d = new Uint8ClampedArray(room);
  Object.values(probes).forEach((c, i) => d.set(c, i * 4));
  LK.palette(d, 160, 90, want, 1, have);
  const hue = (c) => (Math.atan2(Math.sqrt(3) * (c[1] - c[2]), 2 * c[0] - c[1] - c[2]) * 180) / Math.PI;
  const gm = (c) => c[1] - (c[0] + c[2]) / 2;
  Object.keys(probes).forEach((k, i) => {
    const a = probes[k],
      o = Array.from(d.slice(i * 4, i * 4 + 3));
    assert(o[0] + o[1] + o[2] > a[0] + a[1] + a[2], k + " is lifted toward the pale card: " + o);
    if (/Skin/.test(k)) assert(Math.abs(hue(o) - hue(a)) < 15 && o[0] > o[2] + 8, k + " keeps its hue: " + a + " -> " + o + " (" + hue(a).toFixed(0) + " -> " + hue(o).toFixed(0) + ")");
    else assert(Math.abs(gm(o)) <= 4.5, k + " goes neither green nor magenta: " + o);
  });
  /* away from the darks and skin the palette is as strong as before: the bright parts take the card's cool color */
  let cool = 0,
    n = 0;
  for (let p = 16; p < d.length; p += 4)
    if (0.299 * room[p] + 0.587 * room[p + 1] + 0.114 * room[p + 2] > 150 && LK.skinness(room[p], room[p + 1], room[p + 2]) < 0.05) (cool += d[p + 2] - (d[p] + d[p + 1]) / 2), n++;
  assert(n > 500 && cool / n > 6, "the bright parts that are not skin turn cool: blue over the rest by " + (cool / n).toFixed(1) + " on " + n);
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
check("wider shot: a wider inspiration shrinks the picture (no further than 80%), never when turned off or when it is closer", () => {
  const skin = (d, v) => Object.assign({}, d, { raw: Object.assign({}, d.raw, { skin: d.times.map(() => v), skinX: d.times.map(() => 0.5), skinY: d.times.map(() => 0.5) }) });
  const wide = skin(insp, 0.05),
    close = skin(target, 0.3);
  const a = V.at(V.plan(wide, close, { on: { size: 1 } }), 3);
  assert(a.widen >= 0.8 && a.widen < 0.81 && a.zoom === 1, "wider, held at 80%: " + JSON.stringify([a.widen, a.zoom]));
  const half = V.at(V.plan(skin(insp, 0.25), close, { on: { size: 1 } }), 3).widen;
  assert(half > 0.9 && half < 0.92, "a little wider: about sqrt(0.25 / 0.3) = 0.91: " + half);
  assert(V.at(V.plan(wide, close, { on: { size: 1 }, wider: false }), 3).widen === undefined, "off: never wider");
  assert(V.at(V.plan(wide, close, { on: { light: 1 } }), 3).widen === undefined, "shot size off: never wider");
  const inward = V.at(V.plan(close, skin(target, 0.05), { on: { size: 1 } }), 3);
  assert(inward.widen === undefined && inward.zoom > 1, "a closer inspiration still moves in");
  const W = w.CurioWiden;
  assert(W && W.MIN === 0.8, "widen.js loads with the core");
  const r = W.rect(1000, 500, 0.8);
  assert(r.w === 800 && r.h === 400 && r.x === 100 && r.y === 50, "the picture sits in the middle: " + JSON.stringify(r));
  assert(W.rect(1000, 500, 0.5).w === 800, "never smaller than 80%");
});
check("wider shot, paid: AI paints the new edges on one still frame, priced first and under the caps", () => {
  const store = {};
  const ctx = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)) } };
  ctx.window = ctx;
  require("vm").runInNewContext(fs.readFileSync(path.join(__dirname, "..", "ai.js"), "utf8"), ctx);
  const P = ctx.CurioAI.providers("picture").find((p) => p.id === "fal-outpaint");
  assert(P && P.where === "server" && P.company === "fal", "a paid picture provider on fal.ai");
  const e = P.edges(1000, 500, 0.8);
  assert(e.expand_left === 125 && e.expand_right === 125 && e.expand_top === 63 && e.expand_bottom === 63, "edges for 80%: " + JSON.stringify(e));
  assert(ctx.CurioAI.price(P, { frames: 1 }) > 0 && ctx.CurioAI.price(P, { frames: 1 }) <= ctx.CurioAI.caps().job, "one frame is priced and fits the $1 job cap");
});
check("face swap: on for your own clips, others shown must agree", () => {
  const store = {};
  const ctx = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)) } };
  ctx.window = ctx;
  require("vm").runInNewContext(fs.readFileSync(path.join(__dirname, "..", "ai.js"), "utf8"), ctx);
  const A = ctx.CurioAI;
  assert(A.faceSwap().own === true, "on by default");
  assert(A.faceOk("me.mp4", { others: false }) === null, "only you: allowed");
  assert(/agreed/.test(A.faceOk("party.mp4")), "others may be shown: stopped until they agree");
  A.agree("party.mp4", true);
  assert(A.faceOk("party.mp4") === null && /agreed/.test(A.faceOk("other.mp4")), "agreement is per clip");
  A.setFaceSwap({ own: false });
  assert(/off/.test(A.faceOk("me.mp4", { others: false })), "turned off: stopped");
  A.setFaceSwap({ own: true });
  assert(A.faceOk("party.mp4") === null, "turned back on keeps the agreement");
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
/* ---------- rhythm (video/rhythm.js): beat, accents, and putting them on another clip ---------- */
const RH = w.CurioRhythm;
/* A made-up click track: a click every 60/bpm s from 0.2 s (every 4th one louder), a quiet tick on the off-beats,
   a faint hiss, and silence (no hiss either) from gap[0] to gap[1] if given. 16 kHz. */
function clicks(dur, bpm, gap) {
  const rate = 16000,
    pcm = new Float32Array(Math.round(dur * rate)),
    P = 60 / bpm,
    on = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const silent = (t) => gap && t >= gap[0] && t < gap[1];
  for (let i = 0; i < pcm.length; i++) pcm[i] = silent(i / rate) ? 0 : 0.003 * rnd();
  for (let k = 0, t = 0.2; t < dur - 0.05; k++, t = 0.2 + (k * P) / 2) {
    if (silent(t)) continue;
    const beat = k % 2 === 0,
      amp = beat ? (k % 8 === 0 ? 0.9 : 0.5) : 0.12;
    if (beat) on.push(t);
    for (let j = 0; j < 0.03 * rate; j++) {
      const i = Math.round(t * rate) + j;
      if (i < pcm.length) pcm[i] += amp * Math.exp(-j / (0.006 * rate)) * (0.6 * rnd() + 0.4 * Math.sin((2 * Math.PI * 1500 * j) / rate));
    }
  }
  return { pcm, rate, on };
}
check("rhythm: a click track's tempo is found within 3%, and every beat lands on a click", () => {
  [128, 96, 150].forEach((bpm) => {
    const c = clicks(12, bpm);
    const r = RH.find(c.pcm, c.rate, { duration: 12 });
    assert.strictEqual(r.from, "sound", bpm + ": " + r.from + " clarity " + r.clarity);
    assert(Math.abs(r.bpm - bpm) / bpm < 0.03, "tempo " + r.bpm + " for " + bpm);
    const off = r.beats.map((b) => Math.min(...c.on.map((t) => Math.abs(t - b))));
    assert(Math.max(...off) < 0.03, bpm + ": a beat 30 ms or more from any click: " + Math.max(...off).toFixed(3));
    assert(r.beats.length >= c.on.length - 2, bpm + ": beats " + r.beats.length + " of " + c.on.length + " clicks");
    /* the louder clicks are the accents */
    const loud = c.on.filter((_, i) => i % 4 === 0);
    assert(r.accents.length >= loud.length - 1 && r.accents.every((a) => c.on.some((t) => Math.abs(t - a) < 0.04)), "accents on clicks: " + r.accents.join(" "));
  });
});
check("rhythm: no beats come from silence, and a silent clip falls back to its cuts", () => {
  const c = clicks(14, 120, [5, 9.5]);
  const r = RH.find(c.pcm, c.rate, { duration: 14 });
  assert.strictEqual(r.from, "sound");
  const inGap = r.beats.filter((b) => b > 5.05 && b < 9.45);
  assert(!inGap.length, "beats in the silence: " + inGap.join(" "));
  assert(r.beats.some((b) => b > 10) && r.beats.some((b) => b < 4.5), "beats on both sides of the silence");
  const quiet = new Float32Array(16000 * 6);
  const none = RH.find(quiet, 16000, { duration: 6 });
  assert(none.from === "none" && !none.beats.length && !none.accents.length, JSON.stringify(none));
  const cuts = RH.find(quiet, 16000, { duration: 6, cuts: [1, 2.5, 4] });
  assert(cuts.from === "cuts" && cuts.beats.join() === "1,2.5,4" && cuts.period === 1.5, JSON.stringify(cuts));
  assert(RH.of({ cuts: [2], duration: 6 }).beats.join() === "2", "an old dissection uses its cuts");
});
check("rhythm on another clip: jump cuts and punch-ins on the beats, a flash on accents; off changes nothing", () => {
  const c = clicks(6, 120);
  const A = Object.assign({}, insp, { rhythm: RH.find(c.pcm, c.rate, { duration: 6 }) });
  assert(V.GROUPS.some((g) => g.id === "rhythm" && g.off) && V.GROUPS.some((g) => g.id === "music" && g.off), "groups added, off");
  const plain = V.plan(A, target, { on: { light: 1 } });
  assert(!plain.rhythm && V.at(plain, 1).zoom === 1 && !V.at(plain, 1).rhythm, "off by default");
  const p = V.plan(A, target, { on: { rhythm: 1 } });
  const beats = p.rhythm.beats.map((b) => b.t);
  assert(beats.length >= 15, "beats repeat over the longer clip: " + beats.length);
  /* a jump cut: at a beat's frame your clip skips ahead more than one frame */
  const f = Math.ceil(beats[1] * 30 - 1e-6);
  assert(p.src[f] - p.src[f - 1] > 0.15, "jump at the beat: " + (p.src[f] - p.src[f - 1]));
  assert(Math.abs(p.src[f + 3] - p.src[f + 2] - 1 / 30) < 0.002, "plays on normally between beats");
  /* punch-in: close on one beat, wide on the next, with a bump just after each */
  const z = (t) => V.at(p, t).zoom;
  assert(z(beats[0] + 0.2) > 1.2 && z(beats[1] + 0.2) < 1.05, "close then wide: " + z(beats[0] + 0.2) + " " + z(beats[1] + 0.2));
  assert(z(beats[1] + 0.01) > z(beats[1] + 0.3), "a bump that settles");
  const acc = p.rhythm.accents[0];
  assert(V.at(p, acc + 0.02).rhythm.flash > 0.5 && V.at(p, acc + 0.35).rhythm.flash < 0.1, "a quick flash on an accent");
  /* hold and burst: still just after a beat, then faster to catch up */
  const h = V.plan(A, target, { on: { burst: 1 } });
  const g = Math.ceil(h.rhythm.beats[2].t * 30 - 1e-6);
  assert(h.src[g + 2] === h.src[g + 1], "holds after the beat");
  assert(h.src[g + 12] - h.src[g + 11] > 1.2 / 30, "then runs faster: " + (h.src[g + 12] - h.src[g + 11]) * 30);
  assert(Math.abs(h.src[g + 15] - plain.src[g + 15]) < 0.06, "and catches up by the next beat");
  /* the check: after, the picture changes on the beat */
  const after = { times: [], dt: 0.1, raw: { luma: [], std: [], local: [] } };
  for (let t = 0; t < p.duration; t += 0.1) {
    after.times.push(t);
    const a = V.at(p, t);
    after.raw.luma.push(0.4 + (a.rhythm ? a.rhythm.flash * 0.3 : 0) + (a.zoom - 1) * 0.2);
    after.raw.std.push(0.2);
    after.raw.local.push(0);
  }
  const sc = V.score(p, "rhythm", target, after);
  assert(sc.corrAfter > 0.3 && sc.corrAfter > sc.corrBefore + 0.2, JSON.stringify(sc));
});

/* ---------- motion feel (video/shutter.js): smear, picture rate, and putting them on another clip ---------- */
const SH = w.CurioShutter;
/* A checkered square on a dark background at x (pixels), 128 x 72 gray, smeared along x by L pixels. */
function square(x, L) {
  const W = 128,
    H = 72,
    g = new Float32Array(W * H);
  const n = Math.max(1, Math.ceil(L * 4));
  for (let y = 0; y < H; y++)
    for (let xx = 0; xx < W; xx++) {
      let s = 0;
      for (let k = 0; k < n; k++) {
        const u = xx - x + (n > 1 ? (k / (n - 1) - 0.5) * L : 0),
          v = y - 20;
        const inside = u >= 0 && u < 32 && v >= 0 && v < 32;
        s += inside ? ((Math.floor(u / 4) + Math.floor(v / 4)) % 2 ? 0.9 : 0.55) : 0.1;
      }
      g[y * W + xx] = s / n;
    }
  return g;
}
/* Frames 1/60 s apart of the square moving `per` pixels a picture at `rate` pictures a second, smeared L. */
function squareBurst(per, rate, L) {
  const fr = [];
  for (let i = 0; i < 48; i++) fr.push({ t: i / 60, g: square(20 + Math.floor((i / 60) * rate) * per, L) });
  return fr;
}
const toRGBA = (g) => {
  const d = new Uint8ClampedArray(g.length * 4);
  for (let i = 0; i < g.length; i++) d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = Math.round(g[i] * 255), (d[i * 4 + 3] = 255);
  return d;
};
const fromRGBA = (d) => Float32Array.from({ length: d.length / 4 }, (_, i) => d[i * 4] / 255);
check("motion feel: a smeared moving square measures as smeary, a crisp one as crisp", () => {
  const crisp = SH.burst(squareBurst(6, 30, 0), 128, 72),
    half = SH.burst(squareBurst(6, 30, 3), 128, 72),
    full = SH.burst(squareBurst(6, 30, 6), 128, 72);
  assert(crisp.shutter != null && crisp.shutter < 60, "crisp: " + JSON.stringify(crisp));
  assert(full.shutter > 180 && full.shutter > half.shutter && half.shutter > crisp.shutter + 40, "smear grows: " + [crisp.shutter, half.shutter, full.shutter]);
  assert(Math.abs(crisp.v * 128 - 6) < 1.5, "it moves 6 pixels a picture: " + crisp.v * 128);
  assert(Math.abs(crisp.rate - 30) < 2, "30 pictures a second: " + crisp.rate);
});
check("motion feel: a stepped sequence measures as choppy at its own rate", () => {
  [12, 8].forEach((rate) => {
    const m = SH.burst(squareBurst(4, rate, 0), 128, 72);
    assert(Math.abs(m.rate - rate) < 1.5, rate + " pictures a second measured as " + m.rate);
  });
  const sum = SH.summary([SH.burst(squareBurst(4, 12, 0), 128, 72), SH.burst(squareBurst(4, 12, 0), 128, 72), null]);
  assert(sum.choppy > 0.6 && Math.abs(sum.rate - 12) < 1.5, JSON.stringify(sum));
  const still = SH.burst(squareBurst(0, 30, 0), 128, 72);
  assert(still.rate == null && still.shutter == null, "nothing moves, nothing measured: " + JSON.stringify(still));
});
check("motion feel applied: smearing a crisp moving square makes it measure smeary", () => {
  const fr = squareBurst(6, 30, 0);
  /* smear each new picture along its movement since the last (360 degrees: k = 1) */
  const out = fr.map((f, i) => {
    const prev = fr[Math.max(0, i - 2 - (i % 2))].g;
    const F = SH.flow(prev, f.g, 128, 72);
    const d = toRGBA(f.g);
    if (i >= 2) SH.smear(d, 128, 72, F, 1);
    return { t: f.t, g: fromRGBA(d) };
  });
  const before = SH.burst(fr, 128, 72),
    after = SH.burst(out.slice(2), 128, 72);
  assert(after.shutter > before.shutter + 120, "smearier: " + before.shutter + " -> " + after.shutter);
  /* amount 0 (k = 0) changes nothing */
  const d = toRGBA(fr[10].g),
    copy = new Uint8ClampedArray(d);
  SH.smear(d, 128, 72, SH.flow(fr[8].g, fr[10].g, 128, 72), 0);
  assert(d.every((v, i) => v === copy[i]), "k = 0 leaves the picture alone");
});
check("motion feel in the plan: off by default, amount 0 changes nothing, choppy holds to the inspiration's rate", () => {
  assert(V.GROUPS.some((g) => g.id === "shutter" && g.off && g.needs === "shutter"), "the group is there, off");
  const A = Object.assign({}, insp, { shutter: { shutter: 300, rate: 8, choppy: 1 } }),
    B = Object.assign({}, target, { shutter: { shutter: 20, rate: 30, choppy: 0 } });
  assert(!V.at(V.plan(A, B, {}), 1).shutter, "off by default");
  assert(!V.at(V.plan(A, B, { on: { shutter: 0 } }), 1).shutter, "amount 0: nothing");
  const s = V.at(V.plan(A, B, { on: { shutter: 1 } }), 1).shutter;
  assert(s.rate === 8 && s.angle === 280 && s.trails > 0, JSON.stringify(s));
  const h = V.at(V.plan(A, B, { on: { shutter: 0.5 } }), 1).shutter;
  assert(h.rate > 8 && h.rate < 24 && h.angle === 140, "half way: " + JSON.stringify(h));
  /* the check: closer to the inspiration after */
  const p = V.plan(A, B, { on: { shutter: 1 } });
  const sc = V.score(p, "shutter", B, { times: [], shutter: { shutter: 260, rate: 8.2 } });
  assert(sc.gapAfter < sc.gapBefore * 0.3 && /8 pictures/.test(sc.text), JSON.stringify(sc));
});
const RL = w.CurioRelight;
/* A made-up person: a round face (lit by light [x, y, z], or evenly when null), hair on top, clothes below, on a grey set. */
function personFrame(W, H, light) {
  const labels = new Uint8Array(W * H),
    d = new Uint8ClampedArray(W * H * 4);
  const cx = W / 2,
    cy = H * 0.42,
    rx = W * 0.16,
    ry = H * 0.3;
  const L = light ? (() => { const m = Math.hypot(...light); return light.map((v) => v / m); })() : null;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x,
        p = i * 4;
      const u = (x - cx) / rx,
        v = (y - cy) / ry,
        r2 = u * u + v * v;
      let c = [100, 100, 100];
      if (r2 < 1) {
        labels[i] = v < -0.75 ? 1 : 3;
        const s = L ? 0.2 + 0.8 * Math.max(0, u * L[0] + v * L[1] + Math.sqrt(1 - r2) * L[2]) : 0.75;
        c = labels[i] === 1 ? [40, 30, 25] : [230 * s, 170 * s, 140 * s];
      } else if (y > cy && y <= cy + ry * 1.25 && Math.abs(x - cx) < rx * 0.4) {
        labels[i] = 2; /* the neck */
        c = [150, 110, 90];
      } else if (y > cy + ry * 1.25 && Math.abs(x - cx) < rx * 1.8) {
        labels[i] = 4;
        c = [60, 70, 120];
      }
      d[p] = c[0];
      d[p + 1] = c[1];
      d[p + 2] = c[2];
      d[p + 3] = 255;
    }
  return { labels, d, W, H };
}
const halves = (f, d) => {
  let l = 0,
    nl = 0,
    r = 0,
    nr = 0;
  for (let i = 0; i < f.W * f.H; i++) {
    if (f.labels[i] !== 3) continue;
    const Y = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    if (i % f.W < f.W / 2) (l += Y), nl++;
    else (r += Y), nr++;
  }
  return { left: l / nl, right: r / nr };
};

check("key light: a face lit from the left is measured as lit from the left, with a hard shadow side", () => {
  const f = personFrame(160, 90, [-0.85, -0.1, 0.5]);
  const m = RL.measure(f.labels, f.d, f.W, f.H);
  assert.strictEqual(m.side, "left", JSON.stringify(m));
  assert(m.lx < -0.7 && m.ratio > 2 && m.conf > 0.3, JSON.stringify(m));
  const r = RL.measure(personFrame(160, 90, [0.85, -0.1, 0.5]).labels, personFrame(160, 90, [0.85, -0.1, 0.5]).d, 160, 90);
  assert.strictEqual(r.side, "right", JSON.stringify(r));
  const flat = RL.measure(personFrame(160, 90, null).labels, personFrame(160, 90, null).d, 160, 90);
  assert(flat.side === "front" && flat.ratio < 1.2, JSON.stringify(flat));
  const empty = RL.measure(new Uint8Array(160 * 90), personFrame(160, 90, null).d, 160, 90);
  assert.strictEqual(empty.conf, 0);
});

check("key light: relighting from the right makes the right half brighter, softly; amount 0 changes nothing", () => {
  const src = personFrame(160, 90, [-0.85, -0.1, 0.5]); /* lit from the left */
  const want = RL.measure(personFrame(160, 90, [0.85, -0.1, 0.5]).labels, personFrame(160, 90, [0.85, -0.1, 0.5]).d, 160, 90);
  const have = RL.measure(src.labels, src.d, 160, 90);
  const before = halves(src, src.d);
  assert(before.left > before.right);
  /* drawn at twice the cut-out's size, as in the app */
  const big = personFrame(320, 180, [-0.85, -0.1, 0.5]);
  const d = new Uint8ClampedArray(big.d);
  assert(RL.apply(d, 320, 180, { w: 160, h: 90, labels: src.labels }, { amount: 1, want, have }));
  const after = halves(big, d);
  assert(after.right > after.left * 1.15, JSON.stringify({ before, after }));
  /* no halo: the set a few pixels (one cut-out pixel and a half) away from the people barely changes */
  let glow = 0;
  for (let y = 3; y < 177; y++)
    for (let x = 3; x < 317; x++) {
      let close = false;
      for (let dy = -3; dy <= 3 && !close; dy++) for (let dx = -3; dx <= 3; dx++) if (big.labels[(y + dy) * 320 + x + dx]) close = true;
      if (close) continue;
      const i = (y * 320 + x) * 4;
      glow = Math.max(glow, Math.abs(d[i] - big.d[i]));
    }
  assert(glow < 12, "the set around the people changed by " + glow);
  /* amount 0: the very same pixels */
  const z = new Uint8ClampedArray(big.d);
  RL.apply(z, 320, 180, { w: 160, h: 90, labels: src.labels }, { amount: 0, want, have });
  assert(z.every((v, i) => v === big.d[i]));
  /* the plan: off by default, and at() hands the want and have over when on */
  const mk = (light, n) => RL.series([0, 0.5, 1].map((t) => ({ t, m: RL.measure(light.labels, light.d, 160, 90) })));
  const A = Object.assign({}, insp, { light: mk(personFrame(160, 90, [0.85, -0.1, 0.5])) }),
    B = Object.assign({}, insp, { light: mk(src) });
  assert(!V.at(V.plan(A, B, {}), 0.2).relight, "off by default");
  const a = V.at(V.plan(A, B, { on: { relight: 0.8 } }), 0.2).relight;
  assert(a && a.amount === 0.8 && a.want.side === "right" && a.have.side === "left", JSON.stringify(a));
  const sc = V.score(V.plan(A, B, { on: { relight: 1 } }), "relight", B, { times: [0, 0.5, 1], light: mk(personFrame(160, 90, [0.85, -0.1, 0.5])) });
  assert(sc.gapAfter < 0.2 && sc.gapBefore > 1.5 && /right/.test(sc.note), JSON.stringify(sc));
});
/* ---------- the newer measures as lanes (video/lanes.js) ---------- */
/* An inspiration with every newer measure: a palette that turns teal and a picture that turns soft and grainy
   half way, black bars (a 2.4:1 picture), its main person on the left third then the right third, and a beat. */
function lanesClip() {
  const barred = (d) => {
    for (let y = 0; y < 180; y++) if (y < 30 || y >= 150) for (let x = 0; x < 320; x++) d.set([4, 3, 5], (y * 320 + x) * 4);
    return d;
  };
  const looks = LK.series([0, 1, 2, 3, 4, 5, 6].map((t) => ({ t, m: LK.measure(barred(t < 3 ? scenePic(320, 180, 0, 0) : scenePic(320, 180, 0.6, 0.02, [0.55, 0.95, 1])), 320, 180) })));
  const n = 25;
  const fc = framingClip("moves", Array.from({ length: n }, (_, i) => person(64, 36, i < 12 ? 21 : 43, 4, 14, { turn: 2 })));
  const c = clicks(6, 120);
  return Object.assign({}, insp, { name: "lanes", title: "lanes", looks, elements: fc.elements, rhythm: RH.find(c.pcm, c.rate, { duration: 6 }), cuts: [1.2, 2.2, 3.2, 4.2] });
}
check("newer measures are lanes: palette, grain, frame shape, shot framing and rhythm, each with nodes where it changes", () => {
  const d = lanesClip();
  const lanes = V.lanesOf(d);
  if (process.env.SHOW_LANES) lanes.forEach((c) => console.log("     " + c.id + " (" + c.how + "): " + c.nodes.map((x) => x.t + "=" + x.value).join(", ")));
  const by = {};
  lanes.forEach((c) => (by[c.id] = c));
  ["colorFilter", "filterHue", "colorRange.filmStock", "aspect", "aspect.letterbox", "cameraLensLens.vignette", "composition", "shotSize.headroom", "shotSize", "composition.facing", "music.tempo", "music.energy", "music.cutSync"].forEach((id) => assert(by[id] && by[id].nodes.length, "no lane " + id + ": " + lanes.map((c) => c.id).join(" ")));
  lanes.forEach((c) => assert(c.how === "measured" || c.how === "estimated", c.id + " says how it was found"));
  lanes.forEach((c) => assert(/^[A-Z]/.test(c.name || w.CurioScale.label(c.id)), c.id + " has a plain name"));
  /* the palette and the grain change half way, and say so with a node */
  const v = (id) => by[id].nodes.map((x) => x.value);
  assert(v("colorFilter")[0] === "none" && v("colorFilter").length === 2 && v("colorFilter")[1] !== "none" && Math.abs(by.colorFilter.nodes[1].t - 3) <= 1, "the tint comes in half way: " + JSON.stringify(by.colorFilter.nodes));
  assert(v("filterHue").join() === "teal" || v("filterHue").join() === "blue", "a teal grade leans teal: " + v("filterHue"));
  assert(v("colorRange.filmStock")[0] === "clean digital" && v("colorRange.filmStock").length === 2, "grain comes in: " + JSON.stringify(by["colorRange.filmStock"].nodes));
  assert(v("aspect").join() === "2.39" && v("aspect.letterbox").join() === "thick", "a 2.4:1 picture in bars: " + v("aspect") + " " + v("aspect.letterbox"));
  /* the eyes move from the left third to the right third: one node; the skin guess at shot size gives way to the head's size */
  assert(v("composition").join() === "left third,right third" && Math.abs(by.composition.nodes[1].t - 3) < 0.6, "eyes: " + JSON.stringify(by.composition.nodes));
  assert(lanes.filter((c) => c.id === "shotSize").length === 1 && /head/.test(by.shotSize.from), "one shot size lane, from the head");
  assert(v("music.tempo").join() === "120", "tempo " + v("music.tempo"));
  assert(v("music.cutSync").join() === "cuts on the beat", "cuts on the beat: " + v("music.cutSync"));
  /* without the newer measures, the older lanes only */
  assert.deepStrictEqual(V.lanesOf(insp).map((c) => c.id), V.LIST.filter((c) => insp.nodes[c.id]).map((c) => c.id));
});
check("newer lanes go onto My film and into the reference, as one undo step", () => {
  const d = lanesClip();
  E.send({ type: "importFilm", film: { rows: [1, 2, 3, 4, 5, 6].map((i) => ({ id: "r" + i, label: "Moment " + i })), tracks: w.CurioTracks.forCast(["Rupa"]) } });
  const before = JSON.stringify(E.state().lanes);
  const cmds = V.engineCommands(d, E.state());
  const ids = new Set(cmds.filter((c) => c.type === "setPoint").map((c) => c.curiosity));
  ["colorFilter", "filterHue", "colorRange.filmStock", "aspect", "aspect.letterbox", "composition", "shotSize.headroom", "composition.facing", "music.tempo", "music.energy", "music.cutSync", "valueKey"].forEach((id) => assert(ids.has(id), "no engine lane for " + id));
  const ref = V.toRef(d);
  const r = E.send({ type: "batch", label: "Lanes from lanes", commands: cmds.concat({ type: "addRef", ref }) });
  assert(r.ok, r.error);
  const lane = (id) => E.state().lanes[Object.keys(E.state().lanes).find((k) => k.endsWith("|" + id))];
  assert(lane("composition") && lane("composition").mode === "hold" && Object.keys(lane("composition").points).length === 2, "eyes lane: " + JSON.stringify(lane("composition")));
  assert(lane("music.tempo") && Object.values(lane("music.tempo").points).join() === "120", "tempo lane");
  assert(Object.keys(E.state().lanes).find((k) => k.endsWith("|composition")).startsWith(E.state().tracks.find((t) => t.kind === "camera").id + "|"), "framing goes on the camera track");
  const kept = E.state().refs[E.state().refs.length - 1];
  ["colorFilter", "composition", "music.tempo", "aspect"].forEach((id) => assert(kept.lanes[id] && kept.lanes[id].some((x) => x != null), "the reference carries " + id));
  E.undo();
  assert.strictEqual(JSON.stringify(E.state().lanes), before, "one undo takes it all back");
  assert(!E.state().refs.some((x) => x.name === "lanes"), "and the reference");
});


/* ---------- detail.js: sharper zooms ---------- */
const DT = w.CurioDetail;
/* A source row with a hard edge (dark 40 to light 200) blown up `z` times with linear smoothing, as a browser does. */
function blownUp(z, W, H) {
  const src = (u) => (u < 8 ? 40 : 200);
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / z - 0.5,
        u0 = Math.floor(u),
        f = u - u0;
      const v = src(u0) * (1 - f) + src(u0 + 1) * f;
      const p = (y * W + x) * 4;
      d[p] = d[p + 1] = d[p + 2] = v;
      d[p + 3] = 255;
    }
  return d;
}
/* the steepest step between two neighbours along row y */
function steepest(d, W, y) {
  let m = 0;
  for (let x = 1; x < W; x++) m = Math.max(m, Math.abs(d[(y * W + x) * 4 + 1] - d[(y * W + x - 1) * 4 + 1]));
  return m;
}

check("detail: a blown-up edge gets sharper, never past its own darkest and lightest", () => {
  const z = 2.5,
    W = 40,
    H = 12;
  const d = blownUp(z, W, H);
  const before = steepest(d, W, 6);
  DT.sharpen(d, W, H, z);
  const after = steepest(d, W, 6);
  assert(after > before * 1.1, `steepest step ${before} -> ${after}`);
  for (let i = 0; i < W * H; i++) assert(d[i * 4] >= 40 && d[i * 4] <= 200, "overshoot to " + d[i * 4]);
  /* gray stays gray: brightness is sharpened, not color */
  for (let i = 0; i < W * H; i++) assert(d[i * 4] === d[i * 4 + 2]);
  /* the app's way: sharpened at the source's own size before it is blown up (a soft source edge) */
  const sw = 16,
    s0 = new Uint8ClampedArray(sw * H * 4);
  for (let i = 0; i < sw * H; i++) {
    const x = i % sw;
    s0[i * 4] = s0[i * 4 + 1] = s0[i * 4 + 2] = [40, 40, 40, 40, 40, 40, 55, 85, 155, 185, 200, 200, 200, 200, 200, 200][x];
    s0[i * 4 + 3] = 255;
  }
  const s1 = new Uint8ClampedArray(s0);
  DT.sharpen(s1, sw, H, z, { before: true });
  assert(steepest(s1, sw, 6) > steepest(s0, sw, 6), "not steeper at the source's size");
  for (let i = 0; i < sw * H; i++) assert(s1[i * 4] >= 40 && s1[i * 4] <= 200, "overshoot to " + s1[i * 4]);
});

check("detail: zoom 1 changes nothing; flat areas and faint grain stay as they are", () => {
  const d = blownUp(2.5, 40, 12),
    keep = new Uint8ClampedArray(d);
  DT.sharpen(d, 40, 12, 1);
  assert(d.every((v, i) => v === keep[i]), "zoom 1 changed pixels");
  assert.strictEqual(DT.amountAt(1), 0);
  /* a flat gray with +-2 of grain, at 2.5x */
  const W = 48,
    H = 32,
    f = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const v = 120 + ((i * 7919) % 5) - 2;
    f[i * 4] = f[i * 4 + 1] = f[i * 4 + 2] = v;
    f[i * 4 + 3] = 255;
  }
  const g = new Uint8ClampedArray(f);
  DT.sharpen(g, W, H, 2.5);
  let most = 0;
  for (let i = 0; i < g.length; i++) most = Math.max(most, Math.abs(g[i] - f[i]));
  assert(most <= 1, "grain boosted by " + most);
});

check("detail: small 8x8 block steps are softened, real edges are kept", () => {
  const W = 32,
    H = 16,
    d = new Uint8ClampedArray(W * H * 4);
  /* blocks 100 / 106 / 100 / 220 across */
  const lvl = [100, 106, 100, 220];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      d[p] = d[p + 1] = d[p + 2] = lvl[x >> 3];
      d[p + 3] = 255;
    }
  DT.deblock(d, W, H, 0, 0, 1);
  const at = (x) => d[(4 * W + x) * 4];
  assert(Math.abs(at(8) - at(7)) < 6 && Math.abs(at(16) - at(15)) < 6, `block steps ${at(7)}|${at(8)} ${at(15)}|${at(16)}`);
  assert(at(23) === 100 && at(24) === 220, "the real edge moved");
  /* with the frame shifted by 3 pixels the grid moves too: x = 5, 13, 21 */
  const e = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const x = i % W;
    e[i * 4] = e[i * 4 + 1] = e[i * 4 + 2] = x < 5 ? 100 : 106;
    e[i * 4 + 3] = 255;
  }
  DT.deblock(e, W, H, 3, 0, 1);
  assert(e[(4 * W + 4) * 4] > 100 && e[(4 * W + 5) * 4] < 106);
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
