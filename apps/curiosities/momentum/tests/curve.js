/* The momentum curve with no page: node momentum/tests/curve.js
   Loads the shared core and the curiosity database (as tests/run.js does), the momentum core and curve.js, then
   checks the curve on every practice scene, a made-up film that stalls, the window, the stretch, and the plain
   words of each sag's suggestion. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "curve.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const C = ctx.CurioCurve;
const R = ctx.CurioRates;
let n = 0;
const same = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const studies = core.CuriosityDB.studiesExport().studies;

ok("curve.js loads as part of the core with no page", () => {
  assert(C && typeof C.curve === "function" && typeof C.stretch === "function");
  assert.strictEqual(C.DEFAULTS.window, 15);
});
ok("every practice scene draws a curve from 0 to 5 over the whole film, in time order", () => {
  studies.forEach((s) => {
    const c = C.curve(s.beats, {});
    assert(c.points.length >= s.beats.length, s.id + " fewer points than beats");
    c.points.forEach((p, i) => {
      assert(p.value >= 0 && p.value <= 5 && p.raw >= 0 && p.raw <= 5, s.id + " value out of range");
      assert(i === 0 || p.t > c.points[i - 1].t, s.id + " time goes backwards");
      assert(p.family && p.label && Number.isInteger(p.beat) && p.beat >= 0 && p.beat < s.beats.length, s.id + " point fields");
    });
    assert.strictEqual(c.points[0].t, 0);
    assert(Math.abs(c.points[c.points.length - 1].t - c.seconds) < 0.05, s.id + " ends at the film's end");
    assert.strictEqual(c.thirds.length, 3);
    same(c.thirds.map((t) => t.label), ["Beginning", "Middle", "End"]);
    assert(Math.abs(c.thirds[2].to - c.seconds) < 0.05 && c.thirds[0].from === 0);
    c.thirds.forEach((t) => assert(t.mean >= 0 && t.mean <= 5));
  });
});
ok("every beat is a moment on the curve (one point at each beat's start)", () => {
  const s = studies[0];
  const c = C.curve(s.beats, {});
  const beats = new Set(c.points.map((p) => p.beat));
  s.beats.forEach((_, i) => assert(beats.has(i), "beat " + i + " missing"));
});
ok("peaks are high points, at most five, half a window apart", () => {
  studies.forEach((s) => {
    const c = C.curve(s.beats, {});
    const mean = c.points.reduce((a, p) => a + p.value, 0) / c.points.length;
    assert(c.peaks.length <= 5);
    c.peaks.forEach((p) => assert(p.value >= mean - 1e-9, s.id + " peak under the mean"));
    c.peaks.forEach((p, i) => c.peaks.slice(i + 1).forEach((q) => assert(Math.abs(p.t - q.t) >= c.window / 2, s.id + " peaks too close")));
  });
});
ok("sags stay under the low line for at least the minimum, with what held attention and a suggestion", () => {
  let found = 0;
  studies.forEach((s) => {
    const c = C.curve(s.beats, { profiles: R.DEFAULT_FILMS.slice(0, 3) });
    c.sags.forEach((g) => {
      found++;
      assert(g.dur >= C.DEFAULTS.minSag - 0.05, s.id + " sag too short");
      c.points.filter((p) => p.t >= g.from && p.t < g.to).forEach((p) => assert(p.value < c.low, s.id + " sag point above the line"));
      assert(g.family && g.label && g.curiosity);
      assert(g.suggestion && g.suggestion.text.length > 20);
      assert(!/[—]/.test(g.suggestion.text), "no em-dash");
    });
  });
  assert(found > 0, "the practice scenes have at least one sag");
});
/* A film that stalls: one feeling held for a minute, then fast moves between kinds of curiosity. */
function stalling() {
  const beats = [{ at: 0, values: { emotion: "calm" } }];
  for (let t = 10; t <= 60; t += 10) beats.push({ at: t, values: { emotion: "calm" } });
  const ids = ["plotTwist", "music", "angle", "emotion", "setting"];
  const has = ids.filter((id) => ctx.CurioMomentum.find(id));
  let k = 0;
  for (let t = 64; t <= 100; t += 4) {
    const id = has[k++ % has.length];
    const sc = ctx.CurioMomentum.find(id);
    const opts = (sc && sc.options) || ["a", "b", "c"];
    beats.push({ at: t, values: { [id]: opts[k % opts.length] } });
  }
  return beats;
}
ok("a family held past the limit wears the curve down into a sag, and moving attention lifts it", () => {
  const c = C.curve(stalling(), { limit: 10, window: 8, profiles: R.DEFAULT_FILMS.slice(0, 2) });
  assert(c.sags.length >= 1, "no sag");
  const s = c.sags[0];
  assert(s.from < 60 && s.to > 30, `sag at ${s.from} to ${s.to}`);
  assert.strictEqual(s.family, ctx.CurioMomentum.note("emotion").family);
  const early = c.points.find((p) => p.t >= 2).value;
  const mid = c.points.find((p) => p.t >= 50).value;
  assert(mid < early, `worn down: ${early} then ${mid}`);
  assert(s.suggestion.family && s.suggestion.family !== s.family, "the Compass points somewhere else");
});
ok("a wider window smooths the line (less change from moment to moment)", () => {
  const b = studies.find((s) => s.id === "model-diner-standoff") || studies[0];
  const wiggle = (c) => c.points.reduce((a, p, i) => a + (i ? Math.abs(p.value - c.points[i - 1].value) : 0), 0);
  const narrow = C.curve(b.beats, { window: 4 });
  const wide = C.curve(b.beats, { window: 40 });
  assert(wiggle(wide) < wiggle(narrow), `${wiggle(wide)} vs ${wiggle(narrow)}`);
});
ok("stretch lays one film's curve over another's length", () => {
  const a = C.curve(studies[0].beats, {});
  const b = C.curve(studies[1].beats, {});
  const s = C.stretch(b.points, a.seconds);
  assert.strictEqual(s.length, b.points.length);
  assert(Math.abs(s[s.length - 1].t - a.seconds) < 0.05);
  assert.strictEqual(s[0].t, 0);
  same(s.map((p) => p.value), b.points.map((p) => p.value));
});
ok("panels with no clock are spaced by seconds per beat", () => {
  const beats = studies[0].beats.map((b) => ({ values: b.values }));
  const c = C.curve(beats, { secondsPerBeat: 5 });
  assert(Math.abs(c.seconds - beats.length * 5) < 0.05, String(c.seconds));
});
ok("an empty film draws nothing and does not throw", () => {
  const c = C.curve([], {});
  same([c.points.length, c.peaks.length, c.sags.length, c.thirds.length], [0, 0, 0, 0]);
});
ok("the tab's words are plain: no em-dashes and no 'act' jargon", () => {
  const src = fs.readFileSync(path.join(ROOT, "momentum", "curve.js"), "utf8");
  assert(!/—/.test(src), "em-dash in curve.js");
  assert(!/\bact (one|two|three|1|2|3)\b|\bthree-act\b/i.test(src), "acts jargon");
});
console.log(`\n${n} curve checks passed`);
