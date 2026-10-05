/* node core/site-check.js : before the app goes online, check that every file the page loads is in git.
   A web host (GitHub Pages, Cloudflare Pages) serves only what is committed, so a file that exists on one
   computer but was never added would be missing online. Reads index.html, every <folder>/load.js file list,
   the 3D matrix files workspaces.js loads, and the install files (sw.js, manifest.webmanifest, icon.svg).
   require("./site-check.js").siteFiles() gives the same list (the desktop check uses it too). */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const APP = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(APP, f), "utf8");

function siteFiles() {
const html = read("index.html");
const want = new Set(["index.html", "sw.js", "manifest.webmanifest", "icon.svg"]);
for (const m of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)) {
  if (!/^(https?:|data:|#)/.test(m[1])) want.add(m[1]);
}
/* A folder's load.js adds <folder>.css and its FILES list when the page runs. */
for (const f of [...want]) {
  const m = f.match(/^(\w[\w-]*)\/load\.js$/);
  if (!m) continue;
  const src = read(f);
  const list = src.match(/const FILES = (\[[^\]]*\])/);
  if (list) JSON.parse(list[1]).forEach((x) => want.add(m[1] + "/" + x));
  if (/\.css"/.test(src)) want.add(`${m[1]}/${m[1]}.css`);
}
/* The 3D character matrix loads on demand from workspaces.js. */
const ws = read("workspaces.js");
for (const m of ws.matchAll(/"(character-matrix\/[\w.-]+\.(?:js|css))"/g)) want.add(m[1]);
/* The 3D characters (rig/rig.js) load their loader and model files on demand. */
if (want.has("rig/rig.js")) for (const m of read("rig/rig.js").matchAll(/"(rig\/[\w/.-]+\.(?:js|glb))"/g)) want.add(m[1]);
return [...want];
}
module.exports = { siteFiles };
if (require.main !== module) return;

const want = new Set(siteFiles());
const tracked = new Set(execFileSync("git", ["ls-files"], { cwd: APP, encoding: "utf8" }).split("\n").filter(Boolean));

const missing = [...want].filter((f) => !tracked.has(f)).sort();
const onDisk = missing.filter((f) => fs.existsSync(path.join(APP, f)));
if (missing.length) {
  console.log("Not in git, so missing online:");
  missing.forEach((f) => console.log("  " + f + (onDisk.includes(f) ? "  (on this computer only: git add it)" : "  (not found anywhere)")));
  process.exit(1);
}
console.log(`site ok: all ${want.size} files the page loads are committed`);
