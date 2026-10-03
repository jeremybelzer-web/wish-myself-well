/* One look per family on every Momentum tab (momentum/notes.js: CurioMomentum.mark and CurioMomentum.status).
   node momentum/tests/marks.js
   Checks that all 13 families have their own letter and a color whose letter ink is readable, that the
   Fresh / Getting long / Too long marks follow the limit, and that no momentum file keeps its own copy of
   the colors, the letters or the status marks: every file that draws a family uses the shared ones. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const DIR = path.join(ROOT, "momentum");

const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
const file = path.join(DIR, "notes.js");
vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
const M = ctx.CurioMomentum;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

ok("notes.js also works through require, with the same marks", () => {
  const R = require(file);
  assert.strictEqual(typeof R.mark, "function");
  assert.deepStrictEqual(R.mark("camera"), { family: "camera", letter: "Ca", color: "#4a3aa7", ink: "#ffffff", label: "Camera" });
});

ok("all 13 families have their own letter, a color, an ink and a label", () => {
  assert.strictEqual(M.FAMILIES.length, 13);
  const marks = M.FAMILIES.map((f) => M.mark(f.id));
  marks.forEach((m, i) => {
    const f = M.FAMILIES[i];
    assert(m.letter && m.letter.length <= 2, f.id + " has no short letter");
    assert(/^#[0-9a-f]{6}$/.test(m.color), f.id + " has no color");
    assert(m.ink === "#ffffff" || m.ink === "#1c1712", f.id + " has no ink");
    assert.strictEqual(m.label, f.label);
  });
  const letters = marks.map((m) => m.letter);
  assert.strictEqual(new Set(letters).size, 13, "two families share a letter: " + letters.join(" "));
  assert.strictEqual(JSON.stringify(Object.keys(M.LETTERS).sort()), JSON.stringify(M.FAMILIES.map((f) => f.id).sort()));
});

ok("eight families have the validated colors and the other five are gray", () => {
  const colored = [...M.FAMILIES.filter((f) => M.mark(f.id).color !== M.OTHER).map((f) => f.id)];
  assert.deepStrictEqual(colored.sort(), ["camera", "comedy", "feeling", "movement", "music", "place", "plot", "voice"]);
  assert.strictEqual(M.OTHER, "#a8a39a");
  assert.strictEqual(new Set(colored.map((f) => M.mark(f).color)).size, 8, "two families share a color");
  assert.strictEqual(M.mark("nothing-like-this").color, M.OTHER);
  assert.strictEqual(M.mark(null).letter, "");
});

ok("the letter's ink is the more readable of dark and white on its color", () => {
  M.FAMILIES.forEach((f) => {
    const m = M.mark(f.id);
    const other = m.ink === "#ffffff" ? "#1c1712" : "#ffffff";
    assert(M.contrast(m.color, m.ink) >= M.contrast(m.color, other), f.id);
    /* Bold letters need 3 to 1; every family clears 4.4 to 1. */
    assert(M.contrast(m.color, m.ink) >= 4.4, f.id + " ink contrast " + M.contrast(m.color, m.ink).toFixed(2));
  });
});

ok("status: under three quarters of the limit is Fresh, up to the limit Getting long, past it Too long", () => {
  const s = (sec, lim) => M.status(sec, lim);
  assert.deepStrictEqual([s(0, 20).key, s(14.9, 20).key, s(15, 20).key, s(20, 20).key, s(20.1, 20).key], ["fresh", "fresh", "long", "long", "over"]);
  assert.deepStrictEqual([s(5, 20).icon, s(16, 20).icon, s(30, 20).icon], ["●", "▲", "■"]);
  assert.deepStrictEqual([s(5, 20).words, s(16, 20).words, s(30, 20).words], ["Fresh", "Getting long", "Too long"]);
  assert.deepStrictEqual([s(5, 20).cls, s(16, 20).cls, s(30, 20).cls], ["good", "warn", "crit"]);
  assert.strictEqual(s(30, 20).text, "Too long");
  assert.strictEqual(s(null, 20).words, "Nothing yet");
  assert.strictEqual(s(16).key, "long", "the limit defaults to 20 seconds");
});

/* Every momentum file but notes.js. */
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".js") && f !== "notes.js" && f !== "load.js");
const FAMILY_HEX = Object.values(M.COLORS);
const src = (f) => fs.readFileSync(path.join(DIR, f), "utf8");

ok("no momentum file keeps its own colors, letters or status marks", () => {
  files.forEach((f) => {
    const s = src(f);
    assert(!/\b(COLORS|LETTERS)\s*=\s*\{/.test(s), f + " defines its own COLORS or LETTERS map");
    assert(!/#a8a39a/i.test(s), f + " has its own gray for other families");
    const hexes = FAMILY_HEX.filter((h) => s.toLowerCase().includes(h));
    assert(hexes.length < 3, f + " copies the family colors: " + hexes.join(" "));
    assert(!/icon:\s*"[●▲■]"/.test(s), f + " builds its own Fresh / Getting long / Too long marks");
    assert(!/\["[●▲■]",\s*"(Fresh|Getting long|Too long)"\]/.test(s), f + " builds its own status marks");
    assert(!/charAt\(0\)\.toUpperCase\(\)/.test(s) || !/famLabel/.test(s.slice(s.search(/charAt\(0\)\.toUpperCase\(\)/) - 60, s.search(/charAt\(0\)\.toUpperCase\(\)/))), f + " makes its own family letters");
  });
});

ok("every momentum file that draws a family's swatch or letter uses CurioMomentum.mark", () => {
  const drawers = files.filter((f) => /mo-fam|background:\$\{[^}]*(famColor|colorOf)\(|\.letter\b/.test(src(f)));
  assert(drawers.length >= 12, "found only " + drawers.join(", "));
  drawers.forEach((f) => assert(/\.mark\(/.test(src(f)), f + " draws families without CurioMomentum.mark"));
});

console.log(`${n} marks checks passed`);
