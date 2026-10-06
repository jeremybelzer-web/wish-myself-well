/* The Paintings menu's data, with no browser: node apps/curiosities/paintings/tests/run.js
   Exactly 62 paintings, each with a name, an artist, five valid hex colours in the source's order and 2 to 5
   category tags from the 14; every row matches Jeremy's spec (tests/expected.txt); the default is painting 7,
   The Great Wave Off Kanagawa; the credit line is kept. */
const fs = require("fs");
const path = require("path");

let fails = 0;
const ok = (cond, msg) => {
  console.log((cond ? "ok   " : "FAIL ") + msg);
  if (!cond) fails++;
};

require(path.join(__dirname, "..", "paintings-data.js"));
const P = globalThis.CURIO_PAINTINGS;
ok(!!P && Array.isArray(P.list), "paintings-data.js sets CURIO_PAINTINGS");
const L = P.list;
ok(L.length === 62, "exactly 62 paintings: " + L.length);
ok(P.categories.length === 14, "14 categories");
const hex = /^#[0-9A-F]{6}$/;
const bad = L.filter((p) => !p.name || !p.artist || !Array.isArray(p.colors) || p.colors.length !== 5 || !p.colors.every((c) => hex.test(c)));
ok(!bad.length, "each has a name, an artist and five valid hex colours" + (bad.length ? ": " + bad.map((p) => p.name).join(", ") : ""));
const badTags = L.filter((p) => !Array.isArray(p.tags) || p.tags.length < 2 || p.tags.length > 5 || !p.tags.every((t) => P.categories.includes(t)));
ok(!badTags.length, "each has 2 to 5 category tags from the 14" + (badTags.length ? ": " + badTags.map((p) => p.name).join(", ") : ""));

const rows = fs
  .readFileSync(path.join(__dirname, "expected.txt"), "utf8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split(" | "));
ok(rows.length === 62, "the spec's table has 62 rows");
const off = [];
rows.forEach(([n, name, artist, cats, cols], k) => {
  const p = L[k];
  if (+n !== k + 1 || !p || p.name !== name || p.artist !== artist || p.tags.join(", ") !== cats || p.colors.join(" ") !== cols) off.push(n + " " + name);
});
ok(!off.length, "every painting matches the spec, in order (name, artist, tags, the five colours in order)" + (off.length ? ": " + off.join("; ") : ""));
ok(P.defaultIndex === 6 && L[P.defaultIndex].name === "The Great Wave Off Kanagawa", "the default is 7, The Great Wave Off Kanagawa");
ok(P.credit === "All color palettes compiled by: https://colorlisa.com/", "the credit line is kept in the data file");

console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
