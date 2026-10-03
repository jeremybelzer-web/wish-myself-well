// The one-page app with the sample film (showcase.js) built in, for the Curiomatic app link.
//   node docs/beta/one-page/showcase-bundle.js . curiomatic.html   (from apps/curiosities)
// Runs bundle.js, then puts showcase.js right after the shim, before any app script reads its settings.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const [APP, OUT] = process.argv.slice(2);
execFileSync(process.execPath, [path.join(__dirname, "bundle.js"), APP, OUT], { stdio: "inherit" });
const page = fs.readFileSync(OUT, "utf8");
const code = fs.readFileSync(path.join(__dirname, "showcase.js"), "utf8").replace(/<\/script/gi, "<\\/script");
const at = page.indexOf("</script>") + "</script>".length;
fs.writeFileSync(OUT, page.slice(0, at) + "\n<script>\n" + code + "\n</script>" + page.slice(at));
console.log("with the sample film");
