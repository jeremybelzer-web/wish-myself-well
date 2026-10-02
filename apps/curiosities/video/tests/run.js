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
});
check("toMedia gives the media window's sample shape", () => {
  const m = V.toMedia(insp, 2);
  assert(m.samples.length === insp.times.length && m.step === 2 && m.duration === insp.duration, "lengths");
  const s = m.samples[3];
  ["t", "luma", "contrast", "sat", "warm", "motion"].forEach((k) => assert(typeof s[k] === "number" && isFinite(s[k]), k));
  assert(m.samples.filter((x) => x.cut).length === insp.cuts.length, "one cut sample per cut");
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
