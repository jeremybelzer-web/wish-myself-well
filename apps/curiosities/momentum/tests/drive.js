/* Story drive (momentum/drive.js) with no page: node apps/curiosities/momentum/tests/drive.js
   The browser check is tests/drive-browser.js.
   Checks: every move of attention in the practice scenes gets a kind (plot, character, theme or none) and
      a plain reason, the totals add up, a film that only changes its look reads as decoration only, a feeling
      changing with a camera move makes that move drive the story, a curiosity coming back changed is an echo,
      the empty stretches are measured in seconds, the suggestion is a story family, and "Make this move here"
      on the engine's film is one undo step that turns an empty move into one that drives the story.
 */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "drive.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const D = ctx.CurioDrive;
const M = ctx.CurioMomentum;
const A = ctx.CurioAttention;
const R = ctx.CurioRates;
const E = ctx.CurioEngine;
const ME = ctx.CurioMomentumEngine;
let n = 0;
const same = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const studies = core.CuriosityDB.studiesExport().studies;
const KINDS = ["plot", "character", "theme", "none"];

ok("drive.js loads as part of the core with no page, with four kinds", () => {
  assert(D && typeof D.drive === "function" && typeof D.suggest === "function" && typeof D.headline === "function");
  same(D.KINDS.map((k) => k.id), KINDS);
  same(D.KINDS.map((k) => k.letter), ["P", "C", "T", "D"]);
});
ok("every move in every practice scene is read, with a kind and one plain sentence", () => {
  let total = 0;
  studies.forEach((s) => {
    const r = D.drive(s.beats, {});
    const reading = A.read(s.beats, {});
    assert.strictEqual(r.moves.length, reading.stats.moves.length, s.id + " one entry per move");
    r.moves.forEach((m, i) => {
      total++;
      assert(KINDS.includes(m.drives), s.id + " kind " + m.drives);
      assert.strictEqual(m.at, reading.stats.moves[i].at, s.id + " same time as attention.js");
      assert.strictEqual(m.label, reading.stats.moves[i].label);
      assert(typeof m.why === "string" && m.why.length > 30 && /\.$/.test(m.why), s.id + " why: " + m.why);
      assert(!/—/.test(m.why), "no em-dash");
      assert.strictEqual(m.drives === "none", m.by === null);
    });
    const t = r.totals;
    assert.strictEqual(t.moves, r.moves.length);
    assert.strictEqual(KINDS.reduce((a, k) => a + t.counts[k], 0), t.moves);
    assert.strictEqual(t.driving, t.moves - t.counts.none);
    assert(t.share >= 0 && t.share <= 1);
    assert(t.longestEmpty >= 0 && t.longestEmpty <= r.seconds);
  });
  assert(total >= 20, "the practice scenes have moves to read: " + total);
});
ok("the practice scenes are not all one answer: some moves drive the story and some only decorate", () => {
  const all = studies.flatMap((s) => D.drive(s.beats, {}).moves);
  assert(all.some((m) => m.drives === "none"), "some decoration");
  assert(all.some((m) => m.drives === "character"), "some character");
  assert(all.some((m) => m.drives === "plot"), "some plot");
});
ok("the headline is one plain sentence with the counts", () => {
  const r = D.drive(studies[0].beats, {});
  const h = D.headline(r);
  assert(/^\d+ of \d+ times attention moves, the story moves too\.$|^Every one of the \d+ times/.test(h), h);
  assert(/nothing to read/.test(D.headline(D.drive([], {}))));
});

/* Made-up films, beat by beat. */
const at = (list) => list.map((values, i) => ({ at: i * 4, values }));
ok("a film that only changes how it looks is decoration only, and the empty stretch runs to the end", () => {
  const sizes = ["wide", "close", "medium", "insert", "wide", "close"];
  const lights = ["dim", "soft", "neutral", "bright and warm", "dim", "soft"];
  const beats = at(sizes.map((s, i) => ({ emotion: "calm", shotSize: i % 2 ? "wide" : s, lightingLens: i % 2 ? lights[i] : "dim" })));
  const r = D.drive(beats, {});
  assert(r.moves.length >= 3, "moves: " + r.moves.length);
  r.moves.forEach((m) => assert.strictEqual(m.drives, "none", m.label + " " + m.why));
  assert.strictEqual(r.totals.share, 0);
  assert.strictEqual(r.totals.emptyRuns.length, 1);
  const run = r.totals.emptyRuns[0];
  assert.strictEqual(run.from, r.moves[0].at);
  assert.strictEqual(run.to, r.seconds, "runs to the end of the film");
  assert.strictEqual(r.totals.longestEmpty, Math.round((r.seconds - r.moves[0].at) * 10) / 10);
  assert(/only decorates/.test(r.moves[0].why));
});
ok("a camera move with a feeling changing a moment later drives the story (character)", () => {
  const beats = at([{ shotSize: "wide", emotion: "calm" }, { shotSize: "close", emotion: "calm" }, { shotSize: "close", emotion: "angry" }, { shotSize: "close", emotion: "angry" }]);
  const r = D.drive(beats, {});
  const m = r.moves[0];
  assert.strictEqual(M.familyOf("shotSize"), "camera");
  assert.strictEqual(m.label, M.note("shotSize").label);
  assert.strictEqual(m.drives, "character", m.why);
  assert.strictEqual(m.by.curiosity, "emotion");
  assert(/1 moment later/.test(m.why), m.why);
});
ok("a plot curiosity taking attention drives the plot, and the reason uses its own words", () => {
  const beats = at([{ shotSize: "wide", stakes: "pride" }, { shotSize: "close", stakes: "pride" }, { shotSize: "close", stakes: "a life" }]);
  const r = D.drive(beats, {});
  const last = r.moves[r.moves.length - 1];
  assert.strictEqual(last.curiosity, "stakes");
  assert.strictEqual(last.drives, "plot", last.why);
  assert(last.by.own && last.note === M.note("stakes").plot);
});
ok("the beat's own 'Pushes the story' slider decides when it is set", () => {
  const beats = at([{ shotSize: "wide", lightingLens: "dim" }, { shotSize: "close", lightingLens: "dim" }, { shotSize: "close", lightingLens: "bright and warm", "lightingLens.push": 5 }]);
  const r = D.drive(beats, {});
  const last = r.moves[r.moves.length - 1];
  assert.strictEqual(last.curiosity, "lightingLens");
  assert(last.drives !== "none" && last.by.own, last.why);
  const plain = D.drive(at([{ shotSize: "wide", lightingLens: "dim" }, { shotSize: "close", lightingLens: "dim" }, { shotSize: "close", lightingLens: "bright and warm" }]), {});
  assert.strictEqual(plain.moves[plain.moves.length - 1].drives, "none");
});
ok("a curiosity coming back changed after a while is an echo: a theme", () => {
  /* The coat holds attention, then the story moves on for 40 seconds, then the coat comes back worn. */
  const b = [{ mainWear: "new", shotSize: "wide" }];
  b.push({ mainWear: "worn", shotSize: "wide" });
  for (let i = 0; i < 10; i++) b.push({ mainWear: "worn", shotSize: ["close", "medium"][i % 2], stakes: ["pride", "a relationship"][i % 2] });
  b.push({ mainWear: "torn", shotSize: "medium", stakes: "a relationship" });
  const opts = M.find("mainWear");
  assert(opts, "mainWear is a curiosity");
  const r = D.drive(at(b), {});
  const last = r.moves[r.moves.length - 1];
  assert.strictEqual(last.curiosity, "mainWear", JSON.stringify(r.moves.map((m) => m.label)));
  assert.strictEqual(last.drives, "theme", last.why);
  assert(/came back \d+ seconds after/.test(last.why) && /"worn" to "torn"/.test(last.why), last.why);
  assert.strictEqual(r.echoes.length, 1);
  assert.strictEqual(r.echoes[0].curiosity, "mainWear");
  assert.strictEqual(r.echoes[0].times, 1);
  /* A camera coming back is not an echo. */
  r.echoes.forEach((e) => assert(!["camera", "cut"].includes(M.familyOf(e.curiosity))));
});
ok("the suggestion for an empty stretch is a story family with a curiosity that pushes the story", () => {
  const sizes = ["wide", "close", "medium", "insert", "wide", "close"];
  const beats = at(sizes.map((s) => ({ emotion: "calm", shotSize: s })));
  const r = D.drive(beats, {});
  const s = D.suggest(beats, r.totals.emptyRuns[0], R.DEFAULT_FILMS.slice(0, 2), {});
  assert(D.STORY_FAMILIES.includes(s.family), s.family);
  assert(s.curiosity && s.note && s.label);
});
ok("the measured data stays measured: drive() reads the beats only, never the estimates", () => {
  const src = fs.readFileSync(path.join(ROOT, "momentum", "drive.js"), "utf8");
  assert(!/DEFAULT_FILMS/.test(src), "drive.js never reads the estimated films");
  assert(!/—/.test(src), "no em-dash in drive.js");
});
ok("Make this move here on the engine's film: one undo step that makes an empty move drive the story", () => {
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const st = E.state();
  /* Wear the starter down: the camera and the light keep changing while nothing in the story does. */
  const sizes = ["wide", "close", "medium", "insert"];
  const placeOpts = ctx.CurioScale.domain("setting").options;
  const cmds = [];
  st.rows.forEach((row, i) => {
    /* Even moments: the shot size changes. Odd moments: the place changes. Nothing else moves. */
    cmds.push({ type: "setPoint", row: row.id, track: "camera", curiosity: "shotSize", value: sizes[Math.floor((i + 1) / 2) % sizes.length] });
    cmds.push({ type: "setPoint", row: row.id, track: "master", curiosity: "setting", value: placeOpts[Math.floor(i / 2) % placeOpts.length] });
    cmds.push({ type: "setPoint", row: row.id, track: "master", curiosity: "emotion", value: "curious" });
    cmds.push({ type: "setPoint", row: row.id, track: "char1", curiosity: "volume", value: 2 });
    cmds.push({ type: "setPoint", row: row.id, track: "char2", curiosity: "volume", value: 2 });
  });
  ["shotSize@camera", "setting@master", "emotion@master", "volume@char1", "volume@char2"].forEach((k) => {
    const [c, t] = k.split("@");
    cmds.push({ type: "laneMode", track: t, curiosity: c, mode: "hold" });
  });
  const sent = E.send({ type: "batch", label: "test: decorate", commands: cmds });
  assert(sent.ok, JSON.stringify(sent));
  const before = D.drive(ME.beats(), {});
  assert(before.totals.counts.none >= 2, "empty moves: " + JSON.stringify(before.totals.counts));
  const run = before.totals.emptyRuns[0];
  assert(run.row, "the stretch names its engine row");
  const s = D.suggest(ME.beats(), run, R.DEFAULT_FILMS.slice(0, 2), {});
  const mv = ME.moveAt(s, run.row);
  assert(mv, "the engine has a move for " + s.family);
  const undo = E.history().undo.length;
  assert(ME.applyMove(mv).ok);
  assert.strictEqual(E.history().undo.length, undo + 1, "one undo step");
  const after = D.drive(ME.beats(), {});
  assert(after.totals.driving > before.totals.driving, `more moves drive the story (${before.totals.driving} to ${after.totals.driving})`);
  E.undo();
  assert.strictEqual(D.drive(ME.beats(), {}).totals.driving, before.totals.driving, "Undo takes it back");
});
console.log(`\n${n} story drive checks passed`);
