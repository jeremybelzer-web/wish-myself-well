// Packs apps/curiosities/index.html and everything it loads into one page for the Curiomatic artifact link.
//   node docs/beta/one-page/bundle.js . curiomatic.html   (from apps/curiosities; publish with capabilities {downloads: true})
const fs = require("fs"), path = require("path");
const APP = process.argv[2], OUT = process.argv[3];
const read = (f) => fs.readFileSync(path.join(APP, f), "utf8");
const js = (code) => "<script>\n" + code.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--") + "\n</script>";
const css = (code, id) => `<style${id ? ` id="${id}"` : ""}>\n` + code.replace(/<\/style/gi, "<\\/style") + "\n</style>";
const html = read("index.html");
let head = html.slice(html.indexOf("<head>") + 6, html.indexOf("</head>"));
let body = html.slice(html.indexOf("<body>") + 6, html.lastIndexOf("</body>"));
head = head
  .replace(/<meta charset[^>]*>/, "").replace(/<meta name="viewport"[^>]*>/, "")
  .replace(/<link rel="manifest"[^>]*>/, "").replace(/<link rel="icon"[^>]*>/, "").replace(/<meta name="theme-color"[^>]*>/, "")
  .replace(/<link rel="stylesheet" href="styles.css"[^>]*>/, () => css(read("styles.css")));
// A folder's load.js adds <folder>.css and its FILES list at run time; inline them instead.
const loader = (dir) => {
  const src = read(dir + "/load.js");
  const files = JSON.parse(src.match(/const FILES = (\[[^\]]*\])/)[1]);
  const flag = src.match(/window\.(__\w+) = true/)[1];
  return [css(read(`${dir}/${dir}.css`)), js(`window.${flag} = true;`), ...files.map((f) => js(read(dir + "/" + f)))];
};
const matrix = () => [
  // The 3D character matrix, ready before Archetype opens (workspaces.js then mounts it directly).
  css(read("character-matrix/matrix.css"), "ws-matrix-css"),
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
  js(read("character-matrix/data.js")),
  js(read("character-matrix/matrix.js")),
];
const seen = [];
body = body.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  seen.push(src);
  if (src === "offline.js") return "";
  const m2 = src.match(/^(\w+)\/load\.js$/);
  if (m2) return loader(m2[1]).join("\n");
  if (/^https?:/.test(src)) return m;
  return js(read(src));
});
const bad = body.match(/<script src="(?!https:\/\/cdnjs)[^"]*"/); if (bad) console.log("note: text contains", bad[0]);
body = body.replace(/(\s*)$/, "\n" + matrix().join("\n") + "$1");
const page = `<title>Curiomatic</title>\n${js(fs.readFileSync(path.join(__dirname, "shim.js"), "utf8"))}\n${head.replace(/<title>[^<]*<\/title>/, "")}\n${body}\n`;
fs.writeFileSync(OUT, page);
console.log(seen.length, "scripts;", (page.length / 1e6).toFixed(2), "MB");
