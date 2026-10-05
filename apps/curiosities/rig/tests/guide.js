/* "Start here" (rig/guide.js) in a real browser, inside the real app:
   node apps/curiosities/rig/tests/guide.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: Start here is the first thing in the 3D view's side column, with 8 Try this cards, each saying what it
   shows and what to try next; the Words popover lists the panels' film and 3D words from the app's glossary
   (skeleton and the 180-degree line among them) and Escape closes it, not the window. Each card, pressed like a
   person would, runs without page errors and does its job: Ida is built from words (red hair, a country look);
   the diner scene is built with both people and the set; a double take plays; Sad goes all the way up (and Show
   me where scrolls to its slider); two people face to face with a
   close-up and the 180-degree line; the country road at sunset is kept as a new set (and picked again, not
   doubled, the second time); 12 pencil drawings land in the storyboard as a new scene and the look goes back;
   the beat's lanes are keyed on the timeline as one undo step. Hide is remembered when the window opens again
   (and Show too). On a phone the 3D picture comes before Start here and nothing is wider than the screen.
   Screenshots go to --shots (default /mnt/project-files/maya-app/3d-characters when it exists) as
   guide-start-here.png and guide-start-here-phone.png. */
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

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on|Storyboard/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const ctxOf = () => page.evaluate(() => !!(window.CurioRig.current() && window.CurioRig.current().ctx));
  const openWin = async () => {
    await page.evaluate(() => window.CurioRig.open());
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.waitForFunction(() => window.CurioRig.current() && window.CurioRig.current().ctx.model, null, { timeout: 30000 });
  };
  /* press a card's Try this, wait until the guide says how it went */
  const press = async (id) => {
    const before = await page.evaluate(() => document.querySelector('.rig-dlg [data-guide="out"]').textContent);
    await page.click(`.rig-dlg [data-guide-run="${id}"]`);
    await page.waitForFunction(() => !document.querySelector(".rig-dlg [data-guide-run]").disabled && !/^Working/.test(document.querySelector('.rig-dlg [data-guide="out"]').textContent), null, { timeout: 120000, polling: 200 });
    const out = await page.evaluate(() => document.querySelector('.rig-dlg [data-guide="out"]').textContent);
    return { out, changed: out !== before, done: /^Done\./.test(out) };
  };
  try {
    await page.goto(base + "index.html?screen=1");
    await page.evaluate(() => {
      ["curiosities-rig3d-screen-view-v1", "curiosities-rig3d-cast-v1", "curiosities-rig3d-v1", "curiosities-rig3d-beat-v1", "curiosities-rig3d-made-v1", "curiosities-rig3d-sets-v1", "curiosities-storyboard-v1", "curio-rig3d-guide-v1"].forEach((k) => localStorage.removeItem(k));
    });
    await page.reload();
    /* the 3D files may load on first use (rig/load.js): ask for them, when that exists */
    await page.waitForFunction(() => window.CurioRig, null, { timeout: 20000 });
    await page.evaluate(() => (window.CurioRig.load ? window.CurioRig.load() : null));
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioRig && window.CurioRigGuide && window.CurioRigScene && window.CurioEngine && window.CuriosityStoryboard && window.CuriosityGlossary, null, { timeout: 20000 });
    ok(await page.evaluate(() => CurioRig.extensions().some((x) => x.id === "guide")), "Start here is an add-on of the 3D view (CurioRig.extend)");
    /* a clean cast on the timeline, with room after the playhead */
    await page.evaluate(() => {
      const E = window.CurioEngine;
      const st = E.state();
      const cmds = st.tracks.filter((t) => t.kind === "character").map((t) => ({ type: "removeTrack", track: t.id }));
      for (let i = st.rows.length; i < 10; i++) cmds.push({ type: "addRow" });
      if (cmds.length) E.send({ type: "batch", label: "Test: a clean cast", commands: cmds });
      window.CurioScreen.setRow(1);
    });

    await openWin();
    ok(await ctxOf(), "the 3D window is open");
    const layout = await page.evaluate(() => {
      const side = document.querySelector(".rig-dlg .rig-panel");
      const g = side.firstElementChild;
      const cards = [...g.querySelectorAll(".rig-guide-card")].map((c) => ({ id: c.dataset.card, title: c.querySelector("b").textContent, shows: c.querySelector("p").textContent, next: c.querySelector("p.nx").textContent, btn: !!c.querySelector("[data-guide-run]") }));
      return { first: g.dataset.ext, open: !g.classList.contains("is-closed"), cards, before: g.compareDocumentPosition(side.querySelector("[data-rig='ask-form']")) & Node.DOCUMENT_POSITION_FOLLOWING, once: document.querySelectorAll('.rig-dlg [data-ext="guide"]').length };
    });
    ok(layout.first === "guide" && layout.before && layout.once === 1, "Start here is the first thing in the side column, above Tell it what you want, and only once");
    ok(layout.open, "it starts open the first time");
    ok(layout.cards.length >= 6 && layout.cards.length <= 8 && layout.cards.every((c) => c.btn && c.shows.length > 20 && c.next.length > 20), `${layout.cards.length} Try this cards, each saying what it shows and what to try next`);

    /* the Words popover */
    await page.click('.rig-dlg [data-guide="words"]');
    const words = await page.evaluate(() => {
      const box = document.querySelector('.rig-dlg [data-guide="words-box"]');
      const dts = [...box.querySelectorAll("dt")].map((x) => x.textContent);
      const dds = [...box.querySelectorAll("dd")].map((x) => x.textContent);
      return { shown: !box.hidden, dts, short: dds.every((t) => t.length < 260), terms: window.CuriosityGlossary.terms.map((t) => t.term) };
    });
    ok(words.shown && words.dts.length >= 15, `the Words popover lists ${words.dts.length} words (${words.dts.join(", ")})`);
    ok(["skeleton", "joint", "rig", "IK", "eyeline", "blocking", "180-degree line", "close-up", "wide shot", "flip book"].every((w) => words.dts.includes(w)) && words.short, "skeleton, joint, rig, IK, eyeline, blocking, 180-degree line, close-up, wide shot and flip book are there, each short");
    ok(words.terms.includes("skeleton") && words.terms.includes("180-degree line"), "they come from the app's glossary, which now has skeleton and the 180-degree line too");
    await page.keyboard.press("Escape");
    ok(await page.evaluate(() => document.querySelector('.rig-dlg [data-guide="words-box"]').hidden && document.querySelector(".rig-dlg").open), "Escape closes the Words popover and leaves the 3D window open");

    /* 1. a character from words */
    let r = await press("character");
    const ida = await page.evaluate(() => {
      const ctx = CurioRig.current().ctx;
      const s = CurioRig.maker.store();
      const cur = s.list.find((x) => x.id === s.cur);
      let made = 0;
      ctx.model.traverse((o) => o.isMesh && o.userData.made && made++);
      const plan = CurioRig.maker.read(cur.text);
      return { character: ctx.prefs.character, name: cur.name, made, hair: plan.hairColor || plan.hairWord || "", said: plan.said.join(", "), panelName: document.querySelector('.rig-dlg [data-maker="name"]').value };
    });
    ok(r.done && ida.character === "made" && ida.name === "Ida" && ida.panelName === "Ida" && ida.made > 10, `A character from words: Ida is built from ${ida.made} shapes and shows in the maker's panel ("${r.out.slice(0, 90)}…")`);
    ok(/red/.test(ida.said) && /country/.test(ida.said), `she has red hair and a country look (read as: ${ida.said})`);
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.evaluate(() => (document.querySelector(".rig-dlg .rig-panel").scrollTop = 0));
      await page.locator(".rig-dlg").screenshot({ path: path.join(SHOTS, "guide-start-here.png") });
    }

    /* 2. a whole scene from one sentence */
    r = await press("diner");
    const diner = await page.evaluate(() => {
      const ctx = CurioRig.current().ctx;
      const s = CurioRigScene.state(ctx);
      const a = CurioRigStaging.actors({ ctx }) || [];
      const set = CurioRigSets.state(ctx);
      return { cast: s.plan.cast.map((c) => c.name), actors: a.length, loaded: a.every((x) => x.loaded), place: set.place, time: set.time, plays: s.plays, box: document.querySelector('.rig-dlg [data-scene="text"]').value };
    });
    ok(r.done && diner.cast.join() === "Ida,Nessa" && diner.actors === 2 && diner.loaded && diner.plays >= 1, `A whole scene from one sentence: Ida and Nessa are built and the beat plays (${diner.actors} actors)`);
    ok(diner.place === "diner" && diner.time === "night" && /diner at night/.test(diner.box), `the diner set is built at night, and the words are in the scene's box (${diner.place}, ${diner.time})`);

    /* 3. a double take */
    await page.waitForFunction(() => !CurioRigScene.state(CurioRig.current().ctx).playing, null, { timeout: 60000, polling: 200 });
    const playedBefore = await page.evaluate(() => CurioRig.gestures.state().played || 0);
    r = await press("take");
    const take = await page.evaluate(() => CurioRig.gestures.state());
    ok(r.done && take.playing === "double take" && take.played > playedBefore, `A double take plays (${take.playing})`);

    /* a feeling on the face */
    r = await press("feeling");
    const feel = await page.evaluate(() => {
      const v = CurioRig.current().ctx.prefs.values;
      return { sad: v["feelingFaceLens.sad"], happy: v["feelingFaceLens.happy"] || 0, word: document.querySelector('.rig-dlg [data-row="feelingFaceLens.sad"] [data-word]').textContent };
    });
    ok(r.done && feel.sad > 0.95 && feel.happy === 0, `A feeling on the face: Sad all the way up on its slider (${feel.word})`);
    await page.click('.rig-dlg [data-guide-where]');
    await page.waitForTimeout(700);
    ok(await page.evaluate(() => {
      const row = document.querySelector('.rig-dlg [data-row="feelingFaceLens.sad"]');
      const side = document.querySelector(".rig-dlg .rig-panel").getBoundingClientRect();
      const b = row.getBoundingClientRect();
      return row.classList.contains("rig-flash") && b.top >= side.top - 2 && b.top < side.bottom;
    }), "Show me where scrolls to the slider that did it and lights it up");

    /* 4. face to face, with a close-up */
    r = await press("facing");
    const facing = await page.evaluate(() => {
      const ctx = CurioRig.current().ctx;
      const s = CurioRigScene.state(ctx);
      const a = CurioRigStaging.actors({ ctx }) || [];
      return { preset: s.plan.preset, actors: a.length, line: ctx.prefs.staging && ctx.prefs.staging.line, lineBox: document.querySelector('.rig-dlg [data-stg="line"]').checked, set: CurioRigSets.state(ctx).on, cam: JSON.stringify(s.plan.camera || s.plan.steps.map((x) => x.cam).filter(Boolean)), shot: ctx.prefs.values["shotSize"] };
    });
    ok(r.done && facing.preset === "face to face" && facing.actors === 2, `Face to face: two people facing (${facing.preset})`);
    ok(/close/.test(facing.cam), `with a close-up (${facing.cam})`);
    ok(facing.line && facing.lineBox && !facing.set, "the 180-degree line is on (its box ticked), and the diner set is cleared");

    /* 5. a country road at sunset */
    const nSets = await page.evaluate(() => CurioRig.sets.store().list.length);
    r = await press("road");
    const road = await page.evaluate(() => {
      const ctx = CurioRig.current().ctx;
      const st = CurioRigSets.state(ctx);
      return { on: st.on, place: st.place, time: st.time, kinds: st.pieces.map((p) => p.kind), n: CurioRig.sets.store().list.length };
    });
    ok(r.done && road.on && road.place === "road" && road.time === "sunset" && road.kinds.includes("fence") && road.kinds.includes("tree"), `A country road at sunset: ${road.place} at ${road.time} with ${[...new Set(road.kinds)].join(", ")}`);
    ok(road.n === nSets + 1, "it is kept as a new set, so the person's own set is not written over");
    r = await press("road");
    ok(r.done && (await page.evaluate(() => CurioRig.sets.store().list.length)) === nSets + 1, "pressed again, the same set is picked, not added twice");

    /* 6. a pencil flip book */
    const sb0 = await page.evaluate(() => ({ scenes: CuriosityStoryboard.data().scenes.length, look: CurioRig.current().ctx.prefs.sketchLook || "off" }));
    r = await press("flip");
    const flip = await page.evaluate(() => {
      const d = CuriosityStoryboard.data();
      const s = d.scenes[d.scenes.length - 1];
      return { scenes: d.scenes.length, n: s ? s.panels.length : 0, pics: s ? s.panels.filter((p) => p.pic).length : 0, unique: s ? new Set(s.panels.map((p) => p.pic)).size : 0, look: CurioRig.current().ctx.prefs.sketchLook || "off" };
    });
    ok(r.done && flip.scenes === sb0.scenes + 1 && flip.n === 12 && flip.pics === 12, `A pencil flip book: ${flip.n} drawings land in the storyboard as a new scene ("${r.out.slice(0, 80)}…")`);
    ok(flip.unique >= 5, `the drawings move (${flip.unique} different)`);
    ok(flip.look === sb0.look, `the Sketch look goes back to how it was (${flip.look})`);

    /* 7. the beat on the timeline */
    const pre = await page.evaluate(() => ({ undo: CurioEngine.history().undo.length }));
    r = await press("timeline");
    const lanes = await page.evaluate(() => {
      const st = CurioEngine.state();
      const ida = st.tracks.find((t) => t.kind === "character" && /Ida/.test(t.name || t.label || ""));
      const keyed = Object.keys(st.lanes).filter((k) => /actingLens\.move|feelingFaceLens|eyeline\.speaking|setting\.place/.test(k));
      return { chars: st.tracks.filter((t) => t.kind === "character").length, ida: !!ida, keyed: keyed.length, kinds: [...new Set(keyed.map((k) => k.split("|")[1]))], undo: CurioEngine.history().undo.length };
    });
    ok(r.done && lanes.chars >= 2 && lanes.keyed >= 4 && lanes.undo === pre.undo + 1, `Put the beat on the timeline: ${lanes.chars} character tracks, lanes keyed (${lanes.kinds.join(", ")}), one undo step`);

    /* hide, and it stays hidden */
    await page.click('.rig-dlg [data-guide="toggle"]');
    const hid = await page.evaluate(() => {
      const g = document.querySelector('.rig-dlg [data-ext="guide"]');
      return { closed: g.classList.contains("is-closed"), cards: g.querySelector(".rig-guide-cards").offsetHeight, h: g.offsetHeight, key: localStorage.getItem("curio-rig3d-guide-v1") };
    });
    ok(hid.closed && hid.cards === 0 && hid.h < 60 && /"open":false/.test(hid.key), `Hide folds it to one line (${hid.h}px) and remembers it (${hid.key})`);
    await page.evaluate(() => document.querySelector(".rig-dlg").close());
    await openWin();
    ok(await page.evaluate(() => document.querySelector('.rig-dlg [data-ext="guide"]').classList.contains("is-closed") && document.querySelector('.rig-dlg [data-guide="toggle"]').textContent === "Show"), "opened again, it is still folded, with a Show button");
    await page.reload();
    await page.waitForFunction(() => window.CurioRig, null, { timeout: 20000 });
    await page.evaluate(() => (window.CurioRig.load ? window.CurioRig.load() : null));
    await page.waitForFunction(() => window.CurioRig && window.CurioRigGuide, null, { timeout: 20000 });
    await openWin();
    ok(await page.evaluate(() => document.querySelector('.rig-dlg [data-ext="guide"]').classList.contains("is-closed")), "after a reload too");
    await page.click('.rig-dlg [data-guide="toggle"]');
    ok(await page.evaluate(() => !document.querySelector('.rig-dlg [data-ext="guide"]').classList.contains("is-closed") && /"open":true/.test(localStorage.getItem("curio-rig3d-guide-v1"))), "Show opens it again and remembers that");

    /* a phone: the picture first, nothing wider than the screen */
    await page.evaluate(() => document.querySelector(".rig-dlg").close());
    await page.setViewportSize({ width: 390, height: 800 });
    await openWin();
    const phone = await page.evaluate(() => {
      const c = document.querySelector(".rig-dlg canvas").getBoundingClientRect();
      const g = document.querySelector('.rig-dlg [data-ext="guide"]').getBoundingClientRect();
      const wide = [...document.querySelectorAll('.rig-dlg [data-ext="guide"] *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).length;
      return { canvasTop: c.top, canvasBottom: c.bottom, guideTop: g.top, vh: window.innerHeight, wide, gw: g.width };
    });
    ok(phone.canvasBottom <= phone.vh && phone.guideTop >= phone.canvasBottom - 1, `on a phone the 3D picture is on screen (bottom at ${Math.round(phone.canvasBottom)} of ${phone.vh}px) and Start here comes after it`);
    ok(phone.wide === 0, "nothing in Start here is wider than the phone's screen");
    await page.click('.rig-dlg [data-guide="words"]');
    const pw = await page.evaluate(() => {
      const b = document.querySelector('.rig-dlg [data-guide="words-box"]').getBoundingClientRect();
      return { left: b.left, right: b.right, w: window.innerWidth };
    });
    ok(pw.left >= 0 && pw.right <= pw.w, "the Words popover fits on the phone's screen");
    await page.keyboard.press("Escape");
    if (SHOTS) {
      await page.evaluate(() => {
        const d = document.querySelector(".rig-dlg");
        const g = document.querySelector('.rig-dlg [data-ext="guide"]');
        d.scrollTop += g.getBoundingClientRect().top - d.getBoundingClientRect().top - 260;
      });
      await page.screenshot({ path: path.join(SHOTS, "guide-start-here-phone.png") });
    }

    ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
  } catch (e) {
    console.log("FAIL " + (e && e.stack ? e.stack : e));
    failed++;
  }
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} check(s) failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})();
