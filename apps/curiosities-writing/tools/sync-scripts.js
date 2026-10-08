/* Rewrites the database script tags in index.html from Curiomatic's data/files.json, so the writing app loads
   the same files in the same order and shares every curiosity by id. Run after files.json changes:
   node apps/curiosities-writing/tools/sync-scripts.js */
const fs = require("fs");
const path = require("path");
const HTML = path.join(__dirname, "..", "index.html");

function block() {
  const files = require("../../curiosities/data/files.json");
  return files.map((f) => `    <script src="../curiosities/data/${f}"></script>`).join("\n");
}

function sync(write) {
  const html = fs.readFileSync(HTML, "utf8");
  const re = /(<!-- film-db:start -->)[\s\S]*?(<!-- film-db:end -->)/;
  if (!re.test(html)) throw new Error("index.html has no film-db block");
  const next = html.replace(re, (m, a, b) => a + "\n" + block() + "\n    " + b);
  if (write && next !== html) fs.writeFileSync(HTML, next);
  return next === html;
}

module.exports = { sync };
if (require.main === module) console.log(sync(true) ? "index.html already in step" : "index.html updated");
