/* Writes curiosities_resolve/catalog.json: every curiosity id with its scale (options, or min and max), so the
   Resolve scripts can keep only known curiosities with values on their scales even with the app closed.
   Run it again when the curiosity list changes:  node resolve/make_catalog.js   (from apps/curiosities) */
const fs = require("fs");
const path = require("path");
const core = require("../core/headless.js").load();
const out = {};
core.CURIOSITIES.forEach((c) => {
  if (c.kind === "select") out[c.id] = { kind: "select", options: c.options };
  else if (c.kind === "range") out[c.id] = { kind: "range", min: c.min, max: c.max };
  else if (c.kind === "tag") out[c.id] = { kind: "tag" };
});
const file = path.join(__dirname, "curiosities_resolve", "catalog.json");
fs.writeFileSync(file, JSON.stringify({ note: "Made by make_catalog.js from the app's curiosity list. Do not edit by hand.", count: Object.keys(out).length, curiosities: out }) + "\n");
console.log(`catalog.json: ${Object.keys(out).length} curiosities${core.CuriosityDB ? " (with the curiosity database)" : ""}`);
