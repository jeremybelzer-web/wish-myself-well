/* Momentum checks with no page: node momentum/tests/run.js
   Loads the shared core and the curiosity database (core/headless.js), then the momentum core, and checks
   that every curiosity has a momentum note, the attention model reads the practice scenes, the meter warns
   when one family holds attention too long, and the film rates are complete and marked as estimates. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "perform.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const M = ctx.CurioMomentum;
const A = ctx.CurioAttention;
const R = ctx.CurioRates;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

ok("every curiosity in the database and the catalog has a full momentum note", () => {
  const all = M.all();
  assert(all.length >= core.CuriosityDB.data.curiosities.length, "fewer notes than curiosities");
  const cues = M.CUES.map((c) => c.id);
  all.forEach((x) => {
    ["plot", "theme", "pull", "tryThis"].forEach((k) => assert(typeof x[k] === "string" && x[k].length > 20, `${x.id} has no ${k}`));
    assert(!/\{name\}/.test(x.plot + x.theme + x.pull + x.tryThis), `${x.id} kept a {name}`);
    assert(x.push >= 0 && x.push <= 5, `${x.id} push`);
    assert(cues.includes(x.cue), `${x.id} cue ${x.cue}`);
    assert(M.family(x.family), `${x.id} family ${x.family}`);
  });
});
ok("every workspace in the database belongs to one attention family", () => {
  const ws = new Set(core.CuriosityDB.data.workspaces.map((w) => w.id));
  const covered = new Set(M.FAMILIES.flatMap((f) => f.workspaces));
  ws.forEach((w) => assert(covered.has(w), "workspace " + w + " has no family"));
});
ok("written notes name real curiosities", () => {
  Object.keys(M.WRITTEN).forEach((id) => assert(M.find(id), id));
});
ok("Jeremy's examples have real notes (written here or in the database): clothes and setting", () => {
  ["mainEra", "mainCost", "setting", "weather", "setLayout"].forEach((id) => assert(["written", "database"].includes(M.note(id).source), id + " " + M.note(id).source));
});
ok("the practice scenes read as attention stretches that add up to the film", () => {
  const list = core.CuriosityDB.studiesExport().studies;
  assert(list.length > 0);
  list.forEach((s) => {
    const r = A.fromStudy(s);
    assert(r.segments.length > 0, s.title);
    const sum = r.segments.reduce((a, g) => a + g.dur, 0);
    assert(Math.abs(sum - r.seconds) < 0.05, `${s.title}: ${sum} vs ${r.seconds}`);
    const share = Object.values(r.stats.familyShare).reduce((a, v) => a + v, 0);
    assert(Math.abs(share - 1) < 0.02, `${s.title} shares add to ${share}`);
    assert(r.stats.momentum >= 0 && r.stats.momentum <= 5);
  });
});
ok("one family held too long warns; changing it often does not", () => {
  const still = Array.from({ length: 12 }, (_, i) => ({ at: i * 5, values: { emotion: i % 2 ? "angry" : "melancholy" } }));
  const r = A.read(still, { limit: 20 });
  assert(r.warnings.length === 1, "expected one warning, got " + r.warnings.length);
  assert(/Feeling|Lines/.test(r.warnings[0].text));
  const varied = ["emotion", "shotSize", "music", "characterPath", "setting", "comedyDevice"].map((id, i) => {
    const c = M.find(id);
    const opts = (c.options || (c.sliders && c.sliders[0] && c.sliders[0].scale) || ["a", "b"]).slice(0, 2);
    return { at: i * 5, values: { [id]: opts[1] || opts[0] } };
  });
  assert.strictEqual(A.read(varied, { limit: 20 }).warnings.length, 0);
});
ok("music stopping is a quiet audio cue", () => {
  const r = A.read([{ at: 0, values: { shotSize: "wide" } }, { at: 4, values: { shotSize: "wide", noMusic: "none" } }, { at: 8, values: { music: "none" } }], {});
  const last = r.segments[r.segments.length - 1];
  assert.strictEqual(last.cue, "audio");
});
ok("a live recorder climbs while nothing changes", () => {
  const rec = A.live({ limit: 10 });
  rec.push({ emotion: "joyful" }, 0);
  rec.push({ emotion: "angry" }, 3);
  const r = rec.reading({ end: 30 });
  assert(r.stats.currentRun.dur >= 30, "run " + r.stats.currentRun.dur);
  assert(r.warnings.length >= 1);
});
ok("the default film list is complete and every row is marked as an estimate", () => {
  assert(R.DEFAULT_FILMS.length >= 10);
  R.DEFAULT_FILMS.forEach((p) => {
    assert.strictEqual(p.estimate, true, p.id);
    const fs = Object.values(p.familyShare).reduce((a, v) => a + v, 0);
    const cs = Object.values(p.cueShare).reduce((a, v) => a + v, 0);
    assert(Math.abs(fs - 1) < 0.02, `${p.id} family shares add to ${fs}`);
    assert(Math.abs(cs - 1) < 0.02, `${p.id} cue shares add to ${cs}`);
    Object.keys(p.familyShare).forEach((f) => assert(M.family(f), p.id + " " + f));
    Object.keys(p.cueShare).forEach((c) => assert(M.CUES.find((x) => x.id === c), p.id + " " + c));
  });
});
ok("a traced film measures into a profile with the same fields, marked measured", () => {
  const s = core.CuriosityDB.studiesExport().studies[0];
  const p = R.measure(s);
  assert.strictEqual(p.estimate, false);
  ["switchesPerMinute", "medianDwell", "medianFamilyRun", "familyShare", "cueShare"].forEach((k) => assert(p[k] != null, k));
  const avg = R.average([p, R.DEFAULT_FILMS[0]]);
  assert(avg.estimate, "an average with an estimate in it is marked");
  const lines = R.compare(A.fromStudy(s).stats, R.DEFAULT_FILMS[0]);
  assert(lines.length >= 1 && lines.every((l) => typeof l === "string"));
});
ok("the compass points away from the family holding attention, with reasons and a try-this", () => {
  const C = ctx.CurioCompass;
  const still = Array.from({ length: 10 }, (_, i) => ({ at: i * 4, values: { emotion: i % 2 ? "angry" : "melancholy" } }));
  const r = A.read(still, { limit: 20 });
  const res = C.point(r, [R.DEFAULT_FILMS[0]]);
  assert(res.now && res.options.length > 3);
  assert(res.options.every((o) => o.family !== res.now.family), "the current family is never the next");
  assert(res.options[0].reasons.length > 0 && res.options[0].note, "reasons and a note");
  assert.strictEqual(res.basis, "shares");
  const measured = core.CuriosityDB.studiesExport().studies.map((s) => R.measure(s));
  const res2 = C.point(r, measured);
  assert.strictEqual(res2.basis, "measured");
  assert(res2.options.some((o) => o.parts.follow > 0), "measured films teach which family follows which");
});
ok("the compass makes a real move on a board", () => {
  const C = ctx.CurioCompass;
  const live = core.CURIOSITIES.filter((c) => c.live && Array.isArray(c.options));
  const fam = M.familyOf(live[0].id);
  const vals = Object.fromEntries(live.map((c) => [c.id, c.options[0]]));
  const mv = C.move({ family: fam, curiosity: null }, { values: () => vals });
  assert(mv && live.find((c) => c.id === mv.id).options.includes(mv.value) && mv.value !== vals[mv.id]);
});
ok("the engine's film gets attention and cue lanes, and a too-long stretch gets a link that the engine takes", () => {
  const E = ctx.CurioEngine;
  const ME = ctx.CurioMomentumEngine;
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const L = ME.lanes({ limit: 6 });
  assert.strictEqual(L.attention.length, E.state().rows.length);
  assert.strictEqual(L.cue.length, E.state().rows.length);
  assert(L.attention.every((c) => c.family));
  const sg = ME.suggestions({ limit: 6 });
  assert(sg.length >= 1, "a stretch past 6 seconds");
  const before = E.state().links.length;
  assert(ME.addSuggestion(sg[0]).ok);
  assert.strictEqual(E.state().links.length, before + 1);
  E.undo();
  assert.strictEqual(E.state().links.length, before, "one undo step");
  const band = ME.band({ limit: 6 });
  assert.strictEqual(band.lanes.map((l) => l.id).join(","), "attention,cue");
});
ok("the Screen's view of the engine film reads one value per curiosity, and a Compass move is one engine undo step", () => {
  const E = ctx.CurioEngine;
  const ME = ctx.CurioMomentumEngine;
  const st = E.state();
  const flat = ME.flatBeats();
  assert.strictEqual(flat.length, st.rows.length);
  assert(flat.every((b) => Object.keys(b.values).every((k) => !k.includes("@"))), "no track suffixes");
  const r = ctx.CurioAttention.read(flat, { limit: 12 });
  const c = ctx.CurioCompass.point(r, [ctx.CurioRates.DEFAULT_FILMS[0]]);
  const row = st.rows[2].id;
  let mv = null;
  for (const o of c.options) if ((mv = ME.moveAt(o, row))) break;
  assert(mv, "some option moves");
  assert.strictEqual(ctx.CurioMomentum.familyOf(mv.curiosity), mv.family);
  const before = E.history().undo.length;
  assert(ME.applyMove(mv).ok);
  assert.strictEqual(String(E.value(row, mv.track, mv.curiosity)), String(mv.value));
  assert.strictEqual(E.history().undo.length, before + 1);
  E.undo();
  assert.strictEqual(E.history().undo.length, before, "one undo step");
  /* A family no track has yet adds its curiosity to a track first. */
  const onTracks = new Set();
  st.tracks.forEach((t) => t.curiosities.forEach((x) => onTracks.add(ctx.CurioMomentum.familyOf(x))));
  const missing = ctx.CurioMomentum.FAMILIES.find((f) => !onTracks.has(f.id) && ME.moveAt({ family: f.id }, row));
  if (missing) {
    const m2 = ME.moveAt({ family: missing.id }, row);
    assert.strictEqual(m2.commands[0].type, "addCuriosity");
    assert(ME.applyMove(m2).ok);
    E.undo();
  }
});
ok("perform follows a board and sends the meter to the bridge", () => {
  const P = ctx.CurioPerform;
  const listeners = [];
  let vals = { emotion: "joyful" };
  ctx.CuriosityBoard = { panels: () => [vals], values: () => vals, on: (fn) => (listeners.push(fn), () => {}) };
  assert(P.start());
  P.tick();
  const msgs = ctx.CurioBridge.values().filter((m) => m.key && m.key.startsWith("m:"));
  assert.strictEqual(msgs.map((m) => m.key).sort().join(","), "m:attention,m:compass,m:family,m:momentum,m:over");
  assert(msgs.every((m) => m.m >= 0 && m.m <= 1));
  const osc = ctx.CurioBridge.toOsc(msgs.find((m) => m.key === "m:attention"));
  assert.strictEqual(osc.address, "/curio/value/m/attention");
  P.stop();
  assert.strictEqual(ctx.CurioBridge.values().filter((m) => m.key && m.key.startsWith("m:")).length, 0, "nothing sent once stopped");
  delete ctx.CuriosityBoard;
});
console.log(`\n${n} momentum checks passed`);
