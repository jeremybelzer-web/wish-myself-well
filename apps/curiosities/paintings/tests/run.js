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

/* section 4: the app wearing the five, readable for every painting */
require(path.join(__dirname, "..", "theme.js"));
const T = globalThis.CurioPaintTheme;
const C = T.contrast;
const unread = [];
L.forEach((p) => {
  const q = T.palette(p.colors);
  const layers = [q.panel, q.raised, q.hover];
  const why = [];
  if (T.lum(q.bg) > 0.025) why.push("background luminance " + T.lum(q.bg).toFixed(3));
  if (C(q.text, q.bg) < 7) why.push("text " + C(q.text, q.bg).toFixed(2) + ":1");
  [["dimmed text", q.dim], ["accent", q.accent]].forEach(([n, c]) => C(c, q.bg) < 5.5 && why.push(n + " " + C(c, q.bg).toFixed(2) + ":1"));
  [["text", q.text], ["dimmed text", q.dim], ["accent", q.accent]].forEach(([n, c]) => layers.forEach((l) => C(c, l) < 4.5 && why.push(n + " on a panel " + C(c, l).toFixed(2) + ":1")));
  if (C(q.ink, q.accent) < 4.5) why.push("words on the accent " + C(q.ink, q.accent).toFixed(2) + ":1");
  if (why.length) unread.push(p.name + " (" + why.join(", ") + ")");
});
ok(!unread.length, "for all 62 paintings the app's colours are readable: background luminance 0.025 or less, text 7:1, dimmed text and accent 5.5:1, and 4.5:1 on every panel layer and on the accent" + (unread.length ? ": " + unread.join("; ") : ""));
const flowers = T.palette(L[0].colors);
ok(flowers.text !== flowers.dim && !/^#f[0-9a-f]f[0-9a-f]f[0-9a-f]$/i.test(flowers.accent), "Flowers, 1964 keeps a coloured accent instead of washing everything out: " + JSON.stringify(flowers));
ok(rows.every(([, , , , cols], k) => L[k].colors.join(" ") === cols), "making them readable never changes a painting's own swatch");

console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
