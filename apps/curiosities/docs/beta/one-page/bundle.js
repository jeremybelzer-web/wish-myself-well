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
// rig/load.js fetches the 3D files when someone first opens 3D. The link has no files to fetch, so the code rides
// along in the page: a small hook hands each file load.js (or rig.js, for GLTFLoader.js) asks for to the page as an
// inline script, then reports it loaded. The .glb characters ride along too (artifacts do not serve .glb files):
// fetch answers rig/models/<name>.glb from the copy in the page.
const rig = () => {
  const src = read("rig/load.js");
  const files = JSON.parse(src.match(/const FILES = (\[[^\]]*\])/)[1]).concat("GLTFLoader.js");
  const code = {};
  files.forEach((f) => (code["rig/" + f] = read("rig/" + f)));
  const models = {};
  fs.readdirSync(path.join(APP, "rig/models")).filter((f) => f.endsWith(".glb")).forEach((f) => (models["rig/models/" + f] = fs.readFileSync(path.join(APP, "rig/models", f)).toString("base64")));
  const hook = `(function () {
  const CODE = ${JSON.stringify(code)};
  const head = document.head, add = head.appendChild.bind(head);
  const MODELS = ${JSON.stringify(models)};
  const key = (u) => (u || "").replace(/^.*?(?=rig\\/)/, "");
  const get = window.fetch.bind(window);
  window.fetch = function (u, o) {
    const m = MODELS[key(typeof u === "string" ? u : u && u.url)];
    if (m == null) return get(u, o);
    const bin = atob(m), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return Promise.resolve(new Response(bytes, { headers: { "content-type": "model/gltf-binary" } }));
  };
  head.appendChild = function (n) {
    const k = n && (n.tagName === "SCRIPT" ? key(n.getAttribute("src")) : n.tagName === "LINK" && n.rel === "preload" ? key(n.getAttribute("href")) : "");
    if (!k || CODE[k] == null) return add(n);
    if (n.tagName === "LINK") return n;
    const s = document.createElement("script");
    s.text = CODE[k];
    s.dataset.inlined = k;
    add(s);
    setTimeout(() => n.onload && n.onload({ type: "load", target: n }), 0);
    return n;
  };
})();`;
  return [js(hook), js(src)];
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
  if (src === "rig/load.js") return rig().join("\n");
  const m2 = src.match(/^(\w+)\/load\.js$/);
  if (m2) return loader(m2[1]).join("\n");
  if (/^https?:/.test(src)) return m;
  return js(read(src));
});
const bad = body.match(/<script src="(?!https:\/\/cdnjs)[^"]*"/); if (bad) console.log("note: text contains", bad[0]);
body = body.replace(/(\s*)$/, "\n" + matrix().join("\n") + "$1");
// The charset comes first: opened straight from disk, a page without one is read as Windows-1252, which garbles
// non-ASCII text and breaks regular expressions that use it (the Screen then never loads).
const page = `<meta charset="utf-8">\n<title>Curiomatic</title>\n${js(fs.readFileSync(path.join(__dirname, "shim.js"), "utf8"))}\n${head.replace(/<title>[^<]*<\/title>/, "")}\n${body}\n`;
fs.writeFileSync(OUT, page);
console.log(seen.length, "scripts;", (page.length / 1e6).toFixed(2), "MB");
