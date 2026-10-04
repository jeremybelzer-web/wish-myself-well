/* "Make a character from words" (rig/maker.js) in a real browser:
   node apps/curiosities/rig/tests/maker.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the words are read (hair styles and colors, face, hats, clothes, extras with their own colors, shoes,
   size and age, whole looks, "no ..." and famous names kept original); the first version's saved { text } still
   loads; the panel keeps several characters (keep as new, rename, switch, delete) in the same localStorage key;
   Surprise me writes a description it can read; every piece touches the rest of the body (nothing floats); a kid
   is smaller and an old character stoops; the face parts carry their names for rig/faces.js; no page errors.
   Screenshots of four made characters go to --shots (default /mnt/project-files/maya-app/3d-characters when it
   exists) as maker-plus-*.png. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const arg = (name, d) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : d;
};
const THREE_FILE = arg("--three", "");
const SHOTS = arg("--shots", fs.existsSync("/mnt/project-files/maya-app/3d-characters") ? "/mnt/project-files/maya-app/3d-characters" : "");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".webmanifest": "application/manifest+json" };
const KEY = "curiosities-rig3d-made-v1";
let failed = 0;
const ok = (cond, what) => {
  console.log((cond ? "ok   " : "FAIL ") + what);
  if (!cond) failed++;
};
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

/* In the page: the made character now on screen, measured. */
function measure() {
  const c = CurioRig.current();
  const T = c.ctx.THREE;
  const model = c.ctx.model;
  model.updateMatrixWorld(true);
  const parts = [];
  model.traverse((o) => o.userData.made && parts.push(o));
  const boxes = parts.map((o) => new T.Box3().setFromObject(o).expandByScalar(0.012));
  /* pieces that touch are one group; everything should be one group */
  const group = parts.map((_, i) => i);
  const find = (i) => (group[i] === i ? i : (group[i] = find(group[i])));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (boxes[i].intersectsBox(boxes[j])) group[find(i)] = find(j);
  const roots = new Set(parts.map((_, i) => find(i)));
  const main = [...roots].map((r) => parts.filter((_, i) => find(i) === r).length).sort((a, b) => b - a);
  const loose = parts.filter((_, i) => find(i) !== find(parts.indexOf(c.ctx.data("made").head))).map((o) => o.geometry.type + " on " + (o.parent && o.parent.name));
  const all = new T.Box3();
  parts.forEach((o) => all.expandByObject(o));
  const w = (b) => b.getWorldPosition(new T.Vector3());
  const r = c.rig();
  const faces = {};
  parts.forEach((o) => o.userData.face && (faces[o.userData.face] = (faces[o.userData.face] || 0) + 1));
  return {
    err: c.error(),
    parts: parts.length,
    groups: main.length,
    loose: loose.slice(0, 6),
    onBones: parts.every((o) => o.parent && o.parent.isBone),
    height: all.max.y - all.min.y,
    floor: all.min.y,
    headAhead: w(r.head).z - w(r.hips).z,
    faces,
    said: (document.querySelector('.rig-dlg [data-maker="said"]') || {}).textContent || "",
  };
}

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on maker/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const frames = (n) => page.evaluate((n) => new Promise((r) => { const go = () => (n-- > 0 ? requestAnimationFrame(go) : r()); go(); }), n);
  /* type words in the panel and press the button */
  const make = async (text) => {
    await page.fill('.rig-dlg [data-maker="text"]', text);
    await page.click('.rig-dlg [data-maker="make"]');
    await page.evaluate(() => CurioRig.current().ready);
    await frames(4);
    return page.evaluate(measure);
  };
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.click('.rig-dlg [data-rig="front"]');
    const cv = await page.$(".rig-dlg canvas");
    const bb = await cv.boundingBox();
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width / 2 + 70, bb.y + bb.height / 2, { steps: 5 });
    await page.mouse.up();
    /* the zoom carries over between shots: all the way out, then a set number of steps in */
    for (let i = 0; i < 25; i++) await page.mouse.wheel(0, 100);
    for (let i = 0; i < 13; i++) await page.mouse.wheel(0, -100);
    await frames(6);
    await page.locator(".rig-dlg .rig-view").screenshot({ path: path.join(SHOTS, name + ".png") });
  };
  try {
    await page.goto(base + "index.html?screen=0");
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    await page.evaluate(() => CurioRig.load());
    await page.waitForFunction(() => window.CurioRig && CurioRig.maker && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    await page.evaluate(`window.measure = ${measure.toString()}`);

    /* ----- reading the words ----- */
    const read = await page.evaluate(() => {
      const r = (t) => CurioRig.maker.read(t);
      const W = (p, k) => (p.wear[k] ? p.wear[k].word || "yes" : "");
      const out = {};
      let p = r("Can you make a character from a description? Like Sonic the Hedgehog hair? And looks like a hick from Tennessee with overalls. Red hair.");
      out.user = { hair: p.hair, red: p.hairColor === 0x8e140e, bottom: p.bottom, hat: p.hat, said: p.said.join(", ") };
      p = r("an old man with bushy eyebrows, a mustache, round glasses and a yellow scarf");
      out.old = { old: p.old, gray: p.hairWord, brows: p.brows, mustache: p.mustache, glasses: W(p, "glasses"), scarf: W(p, "scarf"), build: p.build };
      p = r("a kid with red pigtails, freckles, a purple hoodie, a green backpack, short shorts and light blue sneakers");
      out.kid = { kid: p.kid, hair: p.hair, hairWord: p.hairWord, freckles: p.freckles, top: p.top + " " + p.topWord, bag: W(p, "backpack"), bottom: p.bottom, feet: p.feet + " " + p.shoesWord };
      p = r("short brown hair, a white shirt, a navy bow tie, a tweed vest, a black top hat, gray trousers, a belt and brown shoes");
      out.dressy = { hair: p.hair, height: p.height, top: p.top + " " + p.topWord, bow: W(p, "bowtie"), vest: W(p, "vest"), hat: p.hat + " " + p.hatWord, belt: W(p, "belt"), bottom: p.bottom + " " + p.bottomWord, feet: p.feet + " " + p.shoesWord };
      p = r("a tall woman with blond braids, sunglasses, gold earrings, a crown, a red cape, a green skirt, white gloves and sandals");
      out.tall = { height: p.height, hair: p.hair + " " + p.hairWord, sun: W(p, "sunglasses"), ear: W(p, "earrings"), hat: p.hat, cape: W(p, "cape"), bottom: p.bottom + " " + p.bottomWord, gloves: W(p, "gloves"), feet: p.feet };
      p = r("a grumpy man in a tartan kilt, a beanie, a sweater, an apron, a tie, a bun, a headband, barefoot");
      out.more = { mouth: p.mouth, bottom: p.bottom, hat: p.hat, top: p.top, apron: !!p.wear.apron, tie: !!p.wear.tie, hair: p.hair, feet: p.feet };
      p = r("a cowboy with no hat, a black leather jacket, a mohawk and a bandana");
      out.no = { hat: p.hat, top: p.top + " " + p.topWord, hair: p.hair };
      out.misc = ["a ponytail", "long hair", "curly hair", "bald", "a buzz cut", "a mohawk", "a chef hat", "a wizard hat", "a baseball cap", "a cowboy hat", "a straw hat", "a dress", "boots", "a hoodie", "a goatee", "a long beard"].map((t) => {
        const q = r(t);
        return [t, q.hair, q.hat, q.bottom, q.feet, q.top, q.beard].join("|");
      });
      out.nothing = r("hello there").found;
      out.surprises = Array.from({ length: 30 }, () => CurioRig.maker.surprise()).map((t) => ({ t, p: r(t) })).map(({ t, p }) => ({ t, found: p.found, n: p.said.length }));
      return out;
    });
    ok(read.user.hair === "spiky" && read.user.red && read.user.bottom === "overalls" && read.user.hat === "straw" && /hedgehog look, not the game character/.test(read.user.said) && !/sonic/i.test(read.user.said), `the first request: spiky red hair, overalls, a country look, and never the game character ("${read.user.said}")`);
    ok(read.old.old && read.old.gray === "gray" && read.old.brows === "bushy" && read.old.mustache && read.old.glasses && read.old.scarf === "yellow" && read.old.build === 1, `old, gray hair, bushy eyebrows, mustache, glasses, a yellow scarf (and round glasses are not a round body) ${JSON.stringify(read.old)}`);
    ok(read.kid.kid && read.kid.hair === "pigtails" && read.kid.hairWord === "red" && read.kid.freckles && read.kid.top === "hoodie purple" && read.kid.bag === "green" && read.kid.bottom === "shorts" && read.kid.feet === "sneakers light blue", `a kid with red pigtails, freckles, a purple hoodie, a green backpack, shorts and light blue sneakers ${JSON.stringify(read.kid)}`);
    ok(read.dressy.height === 1 && read.dressy.top === "shirt white" && read.dressy.bow === "navy" && read.dressy.vest === "tweed" && read.dressy.hat === "top black" && read.dressy.belt === "yes" && read.dressy.bottom === "trousers gray" && read.dressy.feet === "shoes brown", `each thing gets its own color, and "short hair" is not a short person ${JSON.stringify(read.dressy)}`);
    ok(read.tall.height > 1 && read.tall.hair === "braids blond" && read.tall.sun && read.tall.ear === "gold" && read.tall.hat === "crown" && read.tall.cape === "red" && read.tall.bottom === "skirt green" && read.tall.gloves === "white" && read.tall.feet === "sandals", `tall, braids, sunglasses, earrings, crown, cape, skirt, gloves, sandals ${JSON.stringify(read.tall)}`);
    ok(read.more.mouth === "frown" && read.more.bottom === "kilt" && read.more.hat === "beanie" && read.more.top === "sweater" && read.more.apron && read.more.tie && read.more.hair === "bun" && read.more.feet === "bare", `grumpy, kilt, beanie, sweater, apron, tie, bun, bare feet ${JSON.stringify(read.more)}`);
    ok(read.no.hat === "" && read.no.top === "jacket black" && read.no.hair === "mohawk", `"no hat" takes the cowboy hat off; a black leather jacket is black ${JSON.stringify(read.no)}`);
    const want = ["ponytail", "long", "curly", "none", "buzz", "mohawk"];
    ok(want.every((h, i) => read.misc[i].split("|")[1] === h), "hair styles: " + read.misc.slice(0, 6).join(", "));
    const hats = ["chef", "wizard", "cap", "cowboy", "straw"];
    ok(hats.every((h, i) => read.misc[6 + i].split("|")[2] === h), "hats: " + read.misc.slice(6, 11).join(", "));
    ok(read.misc[11].split("|")[3] === "dress" && read.misc[12].split("|")[4] === "boots" && read.misc[13].split("|")[5] === "hoodie" && read.misc[14].split("|")[6] === "goatee" && read.misc[15].split("|")[6] === "long", "dress, boots, hoodie, goatee, long beard");
    ok(read.nothing === false, "words with no look in them say so");
    ok(read.surprises.every((s) => s.found && s.n >= 5), `every Surprise me description is read back (${(read.surprises.filter((s) => !(s.found && s.n >= 5)).map((s) => s.n + ": " + s.t).join(" / ") || "all read")})`);

    /* ----- the first version's saved words still load ----- */
    await page.evaluate((KEY) => {
      localStorage.removeItem("curiosities-rig3d-v1");
      localStorage.setItem(KEY, JSON.stringify({ text: "Red hair. A blue t-shirt and boots." }));
      CurioRig.open({ character: "made" });
    }, KEY);
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    await frames(4);
    const first = await page.evaluate(() => ({
      chips: [...document.querySelectorAll('.rig-dlg [data-maker-pick]')].map((b) => b.textContent),
      text: document.querySelector('.rig-dlg [data-maker="text"]').value,
      m: measure(),
    }));
    ok(!first.m.err && first.chips.length === 1 && first.text === "Red hair. A blue t-shirt and boots." && first.m.parts > 30, `the first version's saved words load as one character (${first.chips.join()}, ${first.m.parts} pieces)`);
    ok(first.m.onBones && first.m.groups === 1, `every piece hangs on a joint and touches the body (${first.m.groups} group${first.m.groups === 1 ? "" : "s"} ${first.m.loose.join(", ")})`);
    ok(first.m.faces.head === 1 && first.m.faces.eye >= 2 && first.m.faces.brow === 2 && first.m.faces.mouth === 1, `face parts are named for the faces add-on ${JSON.stringify(first.m.faces)}`);

    /* ----- keep several ----- */
    await page.fill('.rig-dlg [data-maker="text"]', "an old man with bushy eyebrows, a mustache, round glasses and a yellow scarf");
    await page.click('.rig-dlg [data-maker="new"]');
    await page.evaluate(() => CurioRig.current().ready);
    await page.fill('.rig-dlg [data-maker="name"]', "Grandpa Joe");
    await page.dispatchEvent('.rig-dlg [data-maker="name"]', "change");
    let st = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
    ok(st.list.length === 2 && st.list[1].name === "Grandpa Joe" && st.cur === st.list[1].id && /yellow scarf/.test(st.text), `"Keep as a new one" adds a second character, it can be named, and "text" is still the current words (${st.list.map((x) => x.name).join(", ")})`);
    await page.click(`.rig-dlg [data-maker-pick="${st.list[0].id}"]`);
    await page.evaluate(() => CurioRig.current().ready);
    const back = await page.evaluate((KEY) => ({ text: document.querySelector('.rig-dlg [data-maker="text"]').value, name: document.querySelector('.rig-dlg [data-maker="name"]').value, st: JSON.parse(localStorage.getItem(KEY)), cur: document.querySelector('.rig-dlg .maker-chip[aria-current="true"]').textContent }), KEY);
    ok(back.text === "Red hair. A blue t-shirt and boots." && back.st.cur === back.st.list[0].id && back.st.text === back.text && /My character/.test(back.cur), "clicking a name switches to that character " + JSON.stringify(back));
    await page.click(`.rig-dlg [data-maker-pick="${st.list[1].id}"]`);
    await page.evaluate(() => CurioRig.current().ready);
    await frames(6);
    const oldMan = await page.evaluate(measure);
    /* the same words without "old": the head stays over the hips */
    const youngMan = await make("a man with bushy eyebrows, a mustache, round glasses and a yellow scarf");
    ok(oldMan.headAhead > youngMan.headAhead + 0.02, `an old character stoops a little (head ${oldMan.headAhead.toFixed(3)} ahead of the hips, ${youngMan.headAhead.toFixed(3)} when not old)`);
    ok(oldMan.groups === 1 && youngMan.groups === 1, `glasses, scarf and mustache touch the body (${oldMan.loose.join(", ")})`);
    await make("an old man with bushy eyebrows, a mustache, round glasses and a yellow scarf, a brown vest, a belt");
    await shot("maker-plus-old-man-glasses-scarf");
    st = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
    ok(st.list[1].name === "Grandpa Joe" && /brown vest/.test(st.list[1].text) && st.list[0].text === "Red hair. A blue t-shirt and boots.", "Make it again saves the words into the current character only");

    /* ----- Surprise me ----- */
    const before = await page.evaluate(() => document.querySelector('.rig-dlg [data-maker="text"]').value);
    await page.click('.rig-dlg [data-maker="surprise"]');
    await page.evaluate(() => CurioRig.current().ready);
    await frames(4);
    const sur = await page.evaluate((KEY) => ({ text: document.querySelector('.rig-dlg [data-maker="text"]').value, st: JSON.parse(localStorage.getItem(KEY)), m: measure() }), KEY);
    ok(sur.text !== before && sur.st.list.length === 3 && sur.st.text === sur.text && /^Read as: /.test(sur.m.said) && sur.m.parts > 30, `Surprise me writes a new character and makes it: "${sur.text}"`);
    ok(sur.m.groups === 1, `the surprise has no floating pieces (${sur.m.loose.join(", ")})`);
    let loose = [];
    for (let i = 0; i < 6; i++) {
      await page.click('.rig-dlg [data-maker="surprise"]');
      await page.evaluate(() => CurioRig.current().ready);
      await frames(2);
      const m = await page.evaluate(measure);
      if (m.groups !== 1 || m.err) loose.push(m.said + " → " + m.loose.join(", "));
    }
    ok(!loose.length, "six more surprises, none with floating pieces" + (loose.length ? ": " + loose.join(" | ") : ""));
    /* delete the surprises; the list never goes empty */
    let left = await page.evaluate(() => document.querySelectorAll(".rig-dlg [data-maker-del]").length);
    while (left > 2) {
      await page.click(".rig-dlg [data-maker-del] >> nth=-1");
      left = await page.evaluate(() => document.querySelectorAll(".rig-dlg [data-maker-del]").length);
    }
    st = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
    ok(st.list.length === 2 && st.list.some((x) => x.name === "Grandpa Joe") && st.list.some((x) => x.id === st.cur), "× deletes a character and the current one moves to one that is left");

    /* ----- sizes, and more looks (screenshots) ----- */
    const grown = await make("spiky red hair swept back like Sonic, looks like a hick from Tennessee with overalls");
    await shot("maker-plus-spiky-red-country");
    const kid = await make("a kid with red pigtails, freckles, a purple hoodie, a green backpack, shorts and light blue sneakers");
    ok(kid.height < grown.height * 0.82 && Math.abs(kid.floor) < 0.03, `a kid is smaller and still stands on the floor (${kid.height.toFixed(2)} against ${grown.height.toFixed(2)})`);
    ok(kid.groups === 1, `the kid's pigtails, backpack and sneakers touch the body (${kid.loose.join(", ")})`);
    await shot("maker-plus-kid-pigtails-backpack");
    const tall = await make("a tall woman with blond braids, sunglasses, gold earrings, a crown, a red cape, a green skirt, white gloves and sandals");
    ok(tall.height > grown.height * 1.04, `tall is taller (${tall.height.toFixed(2)})`);
    ok(tall.groups === 1, `braids, crown, cape, skirt and sandals touch the body (${tall.loose.join(", ")})`);
    const more = [];
    for (const t of ["a grumpy chef with a mustache, a bow tie, a white apron and black shoes", "a pirate with long black hair, a goatee, a blue bandana, a vest, a belt and bare feet", "a punk with a pink mohawk, a black leather jacket, a tartan kilt and boots", "a wizard with a blue pointy hat, a long beard, a blue cape", "curly brown hair, a black top hat, a green tie, a white shirt", "a surprised skater with a cap, a hoodie, shorts, sneakers and a backpack", "a man with a buzz cut, a beanie, a headband, a sweater, a scarf and gloves"]) {
      const m = await make(t);
      if (m.groups !== 1 || m.err) more.push(t + " → " + m.loose.join(", "));
    }
    ok(!more.length, "chef, pirate, punk, wizard, top hat, skater and beanie looks have no floating pieces" + (more.length ? ": " + more.join(" | ") : ""));
    await make("a grumpy queen with long purple hair, a gold crown, sunglasses, a red cape, a green dress, white gloves and sandals");
    await shot("maker-plus-queen-cape-sunglasses");

    /* it still moves with the rules */
    const walk = await page.evaluate(async () => {
      const c = CurioRig.current();
      const r = c.rig();
      c.set("rigRulesLens.motion", "walking");
      /* sample the knee several times: one gap can land on the same point of the stride */
      const a = c.where(r.legs.L[1]);
      let most = 0;
      for (let i = 0; i < 8; i++) {
        await new Promise((res) => setTimeout(res, 110));
        const b = c.where(r.legs.L[1]);
        most = Math.max(most, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
      }
      c.set("rigRulesLens.motion", "standing still");
      return most;
    });
    ok(walk > 0.01, `a made character walks (the knee moved ${walk.toFixed(3)})`);
    await page.evaluate(() => document.querySelector(".rig-dlg").close());
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 4).join(" | ") : ""));
  } catch (e) {
    ok(false, "ran to the end: " + e.message);
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? `${failed} failed` : "all passed");
  process.exit(failed ? 1 : 0);
})();
