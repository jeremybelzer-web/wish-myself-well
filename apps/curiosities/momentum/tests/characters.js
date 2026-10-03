/* Who we watch (characters.js), with no page: node momentum/tests/characters.js
   Loads the app core like tests/run.js, then the momentum core and characters.js, and checks that attention is
   given to the character whose value changed, Master and Camera count as the film itself, the times add up,
   the longest unwatched stretch and the warnings are right, and the engine's own film reads. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "characters.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const W = ctx.CurioWatch;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

/* A small film: 20 moments, Ida and Bo, Master and Camera, one character who never changes. */
function film(script) {
  const rows = Array.from({ length: 20 }, (_, i) => ({ id: "r" + i, label: "Moment " + (i + 1) }));
  const tracks = [
    { id: "master", kind: "master", label: "Master", curiosities: ["setting"] },
    { id: "camera", kind: "camera", label: "Camera", curiosities: ["shotSize"] },
    { id: "ida", kind: "character", label: "Ida", curiosities: ["volume", "gesture"] },
    { id: "bo", kind: "character", label: "Bo", curiosities: ["volume", "gesture"] },
    { id: "cy", kind: "character", label: "Cy", curiosities: ["volume"] },
  ];
  const base = { "setting@master": "courtyard", "shotSize@camera": "medium", "volume@ida": 1, "gesture@ida": 1, "volume@bo": 1, "gesture@bo": 1, "volume@cy": 1 };
  const vals = rows.map(() => Object.assign({}, base));
  script(vals);
  return { rows, tracks, value: (r, t, c) => vals[Number(r.slice(1))][c + "@" + t] };
}
/* From moment i on, the value is v. */
const from = (vals, i, k, v) => vals.slice(i).forEach((x) => (x[k] = v));

ok("whose value changed takes attention; Master and Camera are the film itself", () => {
  const res = W.watch(
    film((v) => {
      from(v, 2, "volume@ida", 4);
      from(v, 5, "volume@bo", 3);
      from(v, 8, "shotSize@camera", "close-up");
      from(v, 11, "gesture@ida", 4);
    }),
    { secondsPerBeat: 3, limit: 12 }
  );
  const at = (i) => res.strip[i].who;
  assert.strictEqual(at(2), "ida");
  assert.strictEqual(at(5), "bo", "the same curiosity on another track moves who we watch");
  assert.strictEqual(at(8), "film");
  assert.strictEqual(at(12), "ida");
  assert.strictEqual(res.strip.length, 20);
  const byId = Object.fromEntries(res.characters.map((c) => [c.id, c]));
  const sum = res.characters.reduce((a, c) => a + c.seconds, 0) + res.film.seconds + res.strip.filter((x) => !x.who).length * 3;
  assert.strictEqual(sum, res.seconds, "times add up to the film");
  assert(byId.ida.seconds > byId.bo.seconds, "Ida is watched longest");
  assert.strictEqual(res.characters[0].id, "ida", "sorted, most watched first");
  assert(byId.ida.families.some((f) => f.family === "voice"), "Ida pulls attention with her voice");
  assert(byId.ida.families.some((f) => f.family === M().familyOf("gesture")), "and her gestures");
  assert.strictEqual(byId.bo.families.length, 1);
  assert(byId.cy.never && byId.cy.seconds === 0 && byId.cy.share === 0);
  assert(Math.abs(byId.ida.share + byId.bo.share + byId.cy.share + res.film.share - (res.seconds - res.strip.filter((x) => !x.who).length * 3) / res.seconds) < 0.01);
});
function M() {
  return ctx.CurioMomentum;
}

ok("the longest unwatched stretch and the warnings", () => {
  const res = W.watch(
    film((v) => {
      from(v, 1, "volume@ida", 4);
      from(v, 3, "volume@bo", 4);
      for (let i = 4; i < 20; i++) v[i]["volume@bo"] = (i % 2) + 2;
    }),
    { secondsPerBeat: 3, gapLimit: 30 }
  );
  const ida = res.characters.find((c) => c.id === "ida");
  assert.strictEqual(ida.longestGap, 51, "Ida goes unwatched from moment 4 to the end");
  assert.strictEqual(ida.gapFrom, 9);
  assert.strictEqual(ida.gapTo, 60);
  assert.strictEqual(ida.status, "crit");
  const texts = res.warnings.map((w) => w.text);
  assert(texts.some((t) => /^Ida has not held attention for 51 seconds \(from 0:09 to 1:00\)\. Give Ida a line, a look or a move\.$/.test(t)), texts.join(" | "));
  assert(texts.some((t) => /^Cy never holds attention/.test(t)));
  assert(!texts.some((t) => /^Bo /.test(t)), "Bo is watched often");
  assert(texts.every((t) => !/—/.test(t)), "no em-dashes");
  const relaxed = W.watch(film(() => {}), { gapLimit: 1000 });
  assert(relaxed.warnings.every((w) => /never/.test(w.text)));
});

ok("an empty or character-less film reads without errors", () => {
  const empty = W.watch({ rows: [], tracks: [], value: () => null });
  assert.deepStrictEqual([empty.characters.length, empty.strip.length, empty.warnings.length], [0, 0, 0]);
  const noChars = W.watch({ rows: [{ id: "a" }, { id: "b" }], tracks: [{ id: "m", kind: "master", curiosities: ["setting"] }], value: (r) => (r === "a" ? "courtyard" : "street") });
  assert.strictEqual(noChars.characters.length, 0);
  assert(noChars.strip.every((x) => x.who === "film"));
});

ok("the engine's starter film reads by character", () => {
  const E = ctx.CurioEngine;
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const res = W.fromEngine({ secondsPerBeat: 3 });
  const chars = E.state().tracks.filter((t) => t.kind === "character");
  assert.strictEqual(res.characters.length, chars.length);
  assert.deepStrictEqual(res.characters.map((c) => c.label).sort(), chars.map((t) => t.label).sort());
  assert.strictEqual(res.strip.length, E.state().rows.length);
  assert(res.strip.some((x) => x.who && x.who !== "film"), "some character takes attention");
});

console.log(`\n${n} who-we-watch checks passed`);
