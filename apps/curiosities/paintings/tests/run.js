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
  if (q.mode === "dark" ? T.lum(q.bg) > 0.025 : T.lum(q.bg) < 0.6) why.push(q.mode + " background luminance " + T.lum(q.bg).toFixed(3));
  if (C(q.text, q.bg) < 7) why.push("text " + C(q.text, q.bg).toFixed(2) + ":1");
  [["dimmed text", q.dim], ["accent", q.accent]].forEach(([n, c]) => C(c, q.bg) < 5.5 && why.push(n + " " + C(c, q.bg).toFixed(2) + ":1"));
  [["text", q.text], ["dimmed text", q.dim], ["accent", q.accent]].forEach(([n, c]) => layers.forEach((l) => C(c, l) < 4.5 && why.push(n + " on a panel " + C(c, l).toFixed(2) + ":1")));
  if (C(q.ink, q.accent) < 4.5) why.push("words on the accent " + C(q.ink, q.accent).toFixed(2) + ":1");
  if ((q.mode === "dark") !== (T.lum(q.text) > T.lum(q.bg))) why.push("the words are not light on dark or dark on light");
  q.five.forEach((c) => C(c, q.bg) < 4.5 && why.push("painting colour " + c + " " + C(c, q.bg).toFixed(2) + ":1"));
  if (why.length) unread.push(p.name + " (" + why.join(", ") + ")");
});
ok(!unread.length, "for all 62 paintings the app's colours are readable: a dark background (luminance 0.025 or less) or a light one (0.6 or more) with the words the other way, text 7:1, dimmed text and accent 5.5:1, and 4.5:1 on every panel layer and on the accent" + (unread.length ? ": " + unread.join("; ") : ""));
const flowers = T.palette(L[0].colors);
ok(flowers.text !== flowers.dim && !/^#f[0-9a-f]f[0-9a-f]f[0-9a-f]$/i.test(flowers.accent), "Flowers, 1964 keeps a coloured accent instead of washing everything out: " + JSON.stringify(flowers));
const modes = L.map((p) => T.palette(p.colors).mode);
ok(modes.includes("light") && modes.includes("dark"), "light paintings get a light app and dark ones a dark app: " + modes.filter((m) => m === "light").length + " light");
/* every colour of the app goes to one of the painting's */
const q7 = T.palette(L[6].colors);
const allowed = new Set([q7.bg, q7.panel, q7.raised, q7.hover, q7.line, q7.dim, q7.text, ...q7.five]);
ok(allowed.has(T.map(q7, "#fde68a")) && allowed.has(T.map(q7, "#22d3ee")) && T.map(q7, "#000") === q7.bg && T.map(q7, "#ffffff") === q7.text, "the storyboard yellow, the cyan accent, near-black and white become the painting's colours: " + ["#fde68a", "#22d3ee", "#000", "#fff"].map((c) => T.map(q7, c)).join(" "));
ok(/^rgba\(/.test(T.map(q7, "rgba(255,255,255,0.4)")) && T.mapText(q7, "1px solid #3a3a42") !== "1px solid #3a3a42", "see-through colours keep their see-through, and colours inside CSS text are found");
const lightOne = L.findIndex((p) => T.palette(p.colors).mode === "light");
const ql = T.palette(L[lightOne].colors);
ok(T.lum(T.map(ql, "#ececee")) < T.lum(T.map(ql, "#0f0f10")), "on a light painting the app's light words turn dark and its dark ground turns light");
ok(rows.every(([, , , , cols], k) => L[k].colors.join(" ") === cols), "making them readable never changes a painting's own swatch");

console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
