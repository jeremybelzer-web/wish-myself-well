/* The Screen in a real browser, inside the real app: node apps/curiosities/screen/tests/browser.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   index.html is served with <script src="screen/load.js"> added as its last script (the line the app thread
   adds), so this works before that patch lands. It walks the Screen the way a person would: the Screen opens
   on start, pick each level, change a control in the inspector (a node appears), add an inspiration viewer,
   take a curiosity from two films and blend it, click a lane to add nodes, join two nodes across lanes (a
   proximity), copy and paste it, move a node (its partner moves too), switch to Arrange, show all potential
   curiosities and suites, change a track's curiosity, undo, reload. The page must report no errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split("?")[0]);
      const p = path.join(ROOT, url.replace(/^\/+/, "") || "index.html");
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      if (p.endsWith(path.join(ROOT, "index.html"))) {
        let html = fs.readFileSync(p, "utf8");
        if (!html.includes("screen/load.js")) html = html.replace("</body>", '    <script src="screen/load.js"></script>\n  </body>');
        return res.end(html);
      }
      fs.createReadStream(p).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

let fails = 0;
const ok = (cond, msg) => {
  console.log((cond ? "ok   " : "FAIL ") + msg);
  if (!cond) fails++;
};

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ executablePath: fs.existsSync("/opt/pw-browsers/chromium") ? undefined : undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g/.test(m.text()) && errors.push(m.text()));
  await page.goto(base + "index.html?screen=1");
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
  ok(true, "the Screen opens on start");
  ok(await page.evaluate(() => window.CurioEngine.state().rows.length > 0), "my film has moments");
  ok((await page.$$(".sc-viewer")).length === 2, "one inspiration viewer and my film by default");
  ok((await page.$$(".sc-icons [data-icat]")).length >= 16, "the categories are the library's row of icon tabs, like CapCut's");
  /* CapCut's four panels: library top left, Player in the middle, Details on the right, the timeline below. */
  const geo0 = await page.evaluate(() => Object.fromEntries([".sc-lib", ".sc-player", ".sc-inspector", ".sc-timeline"].map((q) => { const r = document.querySelector(q).getBoundingClientRect(); return [q, { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width }]; })));
  ok(geo0[".sc-lib"].r <= geo0[".sc-player"].l && geo0[".sc-player"].r <= geo0[".sc-inspector"].l, "library, Player and Details sit left to right");
  ok(geo0[".sc-timeline"].t >= geo0[".sc-player"].b && geo0[".sc-timeline"].w > 1300, "the timeline runs full width under them");
  ok(await page.evaluate(() => { const c = getComputedStyle(document.querySelector(".sc-page")).backgroundColor.match(/\d+/g).map(Number); return c[0] < 40 && c[1] < 40 && c[2] < 40; }), "the Screen is dark like CapCut");
  ok(await page.evaluate(() => document.querySelector(".sc-details").textContent === "Details"), "the inspector is CapCut's Details panel");
  await page.screenshot({ path: path.join(SHOTS, "screen-1-start.png") });

  /* The editing curiosities from Final Cut Pro and CapCut: the Transitions tab, a card, its +, a control. */
  await page.click('[data-icat="transitions"]');
  ok(await page.$('.sc-card [data-pick-card="curiosity|transitionKind"]'), "the Transitions tab shows its curiosities as cards");
  await page.click('[data-add-card="curiosity|transitionKind"]');
  ok(await page.evaluate(() => window.CurioScreen.state().lanes.includes("transitionKind")), "a card's + puts the curiosity on the timeline");
  ok(await page.evaluate(() => [...document.querySelectorAll(".sl-name")].some((b) => b.textContent === "Transition style")), "its lane shows in the timeline");
  await page.evaluate(() => {
    const s = document.querySelector('.sc-inspector select[data-set="transitionKind"]');
    s.value = "cross dissolve";
    s.dispatchEvent(new Event("change", { bubbles: true }));
  });
  ok(await page.evaluate(() => Object.keys(window.CurioEngine.state().lanes).some((k) => k.endsWith("|transitionKind"))), "Details writes a transition node into my film");
  ok(await page.evaluate(() => !!document.querySelector('.sc-viewer.mine [data-cat="transitions"]')), "my film's frame draws the transition");
  await page.click('[data-pick-card="curiosity|transitionKind"]');
  ok(await page.evaluate(() => window.CurioScreen.state().sel.id === "transitionKind"), "clicking a card looks through it");
  /* Curiosity-first CapCut panels: a picked card shows its settings as tiles; a tile drops a node at the playhead. */
  const allNodes = () => page.evaluate(() => Object.values(window.CurioEngine.state().lanes).reduce((a, l) => a + Object.keys(l.points).length, 0));
  ok((await page.$$('.sc-card.on [data-drop="transitionKind"]')).length >= 10, "a picked curiosity card shows its settings as tiles, like CapCut's effect grid");
  await page.click('.sc-card.on [data-drop="transitionKind"][data-v="wipe"]');
  ok(await page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|transitionKind")); return lk && st.lanes[lk].points[st.rows[0].id] === "wipe"; }), "a tile drops that setting as a node at the playhead");
  /* Templates: every suite, dropped at the playhead as nodes. */
  await page.click('[data-libtab="templates"]');
  ok((await page.$$('.sc-card[data-card="suite"]')).length >= 1 && (await page.$$(".sc-side .sc-pill")).length >= 5, "the Templates tab lists suites by category");
  const n0 = await allNodes();
  await page.click('.sc-card[data-card="suite"] .sc-plus');
  ok((await allNodes()) >= n0 + 2, "a template's + drops each member as a node on its own lane");
  await page.keyboard.press("Control+z");
  ok((await allNodes()) === n0, "and one undo takes the whole template back");
  /* ADVANCED: Final Cut Pro's features, out of the main grids. */
  await page.click('[data-libtab="advanced"]');
  const advCards = await page.evaluate(() => [...document.querySelectorAll(".sc-grid .sc-card strong")].map((x) => x.textContent));
  ok(advCards.includes("Multicam angle switching") && advCards.includes("Color wheels"), "the ADVANCED tab lists Final Cut Pro's own curiosities");
  ok(await page.evaluate(() => /ADVANCED/.test(document.querySelector(".sc-inspector .sc-cat-h").textContent)), "Details shows the advanced curiosities while ADVANCED is open");
  await page.click('.sc-side .sc-pill:last-child');
  ok((await page.$$('.sc-card[data-card="fcp"]')).length >= 20, "ADVANCED maps every other Final Cut Pro feature to where it lives here");
  await page.click('.sc-card[data-card="fcp"] [data-pick-card="curiosity|clipSpeed"]');
  ok(await page.evaluate(() => window.CurioScreen.state().sel.id === "clipSpeed"), "a mapped feature opens its curiosity");
  await page.click('[data-icat="grade"]');
  ok(await page.evaluate(() => { const all = [...document.querySelectorAll(".sc-side .sc-pill")]; return !document.body.textContent.includes("Color wheels") || ![...document.querySelectorAll(".sc-grid .sc-card strong, .sc-inspector strong")].some((x) => x.textContent === "Color wheels"); }), "the Filters category keeps Final Cut Pro's own curiosities out of its grid and Details");
  await page.click('[data-icat="transitions"]');
  await page.click('[data-pick-card="curiosity|transitionKind"]');
  /* My film: an outliner of every automated curiosity. */
  await page.click('[data-libtab="mine"]');
  ok(await page.evaluate(() => [...document.querySelectorAll('.sc-card[data-card="curiosity"] strong')].some((x) => x.textContent === "Transition style")), "the My film tab lists what is automated (Maya's Outliner)");
  /* Maya's channel box keys: the diamond in Details. */
  const keyed = await page.evaluate(() => { const b = document.querySelector(".sc-inspector .sc-key.here"); return b ? b.dataset.key : null; });
  ok(keyed === "transitionKind", "Details marks a control keyed at this moment with a filled diamond");
  await page.click('.sc-inspector .sc-key.here[data-key="transitionKind"]');
  ok(!(await page.$('.sc-inspector .sc-key.here[data-key="transitionKind"]')), "clicking it takes the key off");
  await page.click('.sc-inspector .sc-key[data-key="transitionKind"]');
  ok(!!(await page.$('.sc-inspector .sc-key.here[data-key="transitionKind"]')), "clicking again sets the key");
  /* Maya's graph editor curves: glide or jump. */
  const laneMode = () => page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|transitionKind")); return st.lanes[lk].mode; });
  await page.click('.sl-mode[data-lk$="|transitionKind"]');
  const m1 = await laneMode();
  ok(m1 === "smooth" || m1 === "hold", "Glide switches to Smooth (or to Jump on an engine without smooth): " + m1);
  if (m1 === "smooth") {
    await page.evaluate(() => { const E = window.CurioEngine; const st = E.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|transitionKind")); E.send({ type: "setPoint", row: st.rows[4].id, track: lk.split("|")[0], curiosity: "transitionKind", value: "zoom" }); });
    ok(await page.evaluate(() => [...document.querySelectorAll(".sl-auto")].some((p) => /C/.test(p.getAttribute("d")))), "a smooth lane is drawn as a curve");
    await page.keyboard.press("Control+z");
    await page.click('.sl-mode[data-lk$="|transitionKind"]');
  }
  ok((await laneMode()) === "hold", "a lane can jump between nodes instead of gliding");
  await page.click('[data-icat="transitions"]');
  await page.click('[data-group="suite"]');
  ok((await page.$$('.sc-card[data-card="suite"]')).length >= 1, "the sidebar opens the category's suites");
  await page.fill("[data-lib-search]", "freeze");
  ok(await page.$('[data-pick-card="curiosity|freezeFrame"]'), "the library search finds curiosities in any category");
  await page.fill("[data-lib-search]", "");
  /* Favorites and Recently used (CapCut's star on any effect, and its Recently used list). */
  {
    const FK = "curiosities-screen-faves-v1";
    const fv = () => page.evaluate(() => window.CurioScreen.faves.now());
    const fp0 = await page.evaluate(() => window.CurioEngine.fingerprint());
    await page.click('[data-icat="transitions"]');
    await page.click(".sc-side .sc-pill:first-child");
    const sel0 = await page.evaluate(() => JSON.stringify(window.CurioScreen.state().sel));
    const curRef = await page.evaluate(() => { const s = window.CurioScreen.state().sel; return [...document.querySelectorAll('.sc-grid .sc-card[data-card="curiosity"] [data-fave]')].map((b) => b.dataset.fave).find((r) => r !== "curiosity|" + s.id); });
    const star = await page.$eval(`[data-fave="${curRef}"]`, (b) => ({ tag: b.tagName, pressed: b.getAttribute("aria-pressed"), label: b.getAttribute("aria-label"), name: b.closest(".sc-card").querySelector("strong").textContent }));
    ok(star.tag === "BUTTON" && star.pressed === "false" && star.label.includes(star.name), "every card has a star button with aria-pressed and a label naming the item (" + star.label + ")");
    ok((await page.$$(".sc-grid .sc-card[data-card='curiosity']")).length === (await page.$$(".sc-grid .sc-card[data-card='curiosity'] [data-fave]")).length, "every curiosity card in the grid has a star");
    await page.click(`[data-fave="${curRef}"]`);
    ok((await page.evaluate(() => JSON.stringify(window.CurioScreen.state().sel))) === sel0, "clicking the star does not pick the card");
    ok((await page.$eval(`[data-fave="${curRef}"]`, (b) => b.getAttribute("aria-pressed") + b.textContent)) === "true★" && (await fv()).faves.join() === curRef, "the star fills and the item is a favorite");
    await page.click('[data-group="suite"]');
    const suiteRef = await page.$eval('.sc-card[data-card="suite"] [data-fave]', (b) => b.dataset.fave);
    const suiteName = await page.$eval('.sc-card[data-card="suite"] strong', (s) => s.textContent);
    await page.focus(`[data-fave="${suiteRef}"]`);
    await page.keyboard.press("Enter");
    ok((await fv()).faves.join() === curRef + "," + suiteRef && (await page.evaluate(() => JSON.stringify(window.CurioScreen.state().sel))) === sel0, "a suite's star works from the keyboard, also without picking it");
    ok(await page.evaluate(() => document.querySelector(".sc-icons button").dataset.libtab === "faves" && /Favorites/.test(document.querySelector(".sc-icons button").textContent)), "★ Favorites is the first tab in the library's icon row");
    await page.click('[data-libtab="faves"]');
    const shown = () => page.evaluate(() => { const h = [...document.querySelectorAll(".sc-grid .sc-fave-h")].map((x) => x.textContent); const secs = {}; let cur = ""; [...document.querySelector(".sc-grid").children].forEach((el) => { if (el.matches(".sc-fave-h")) cur = el.textContent; else if (el.matches(".sc-cards")) secs[cur] = [...el.querySelectorAll("[data-fave]")].map((b) => b.dataset.fave); }); return { h, secs }; });
    let s = await shown();
    ok(JSON.stringify(s.secs.Starred) === JSON.stringify([curRef, suiteRef]), "the Favorites tab lists every starred item as cards, in the order starred");
    ok(s.h[0] === "Recently used" && s.secs["Recently used"][0] === "curiosity|transitionKind", "Recently used sits at the top of the Favorites tab, newest first (" + (s.secs["Recently used"] || []).slice(0, 3).join(",") + ")");
    /* Pick 14 different curiosities from a search: recently used keeps the last 12, no repeats. */
    await page.click('[data-icat="camera"]');
    await page.fill("[data-lib-search]", "e");
    const picked = await page.evaluate(() => { const out = []; for (let i = 0; i < 14; i++) { const b = document.querySelectorAll('.sc-grid [data-pick-card^="curiosity|"]')[i]; out.push(b.dataset.pickCard); b.click(); } document.querySelectorAll('.sc-grid [data-pick-card^="curiosity|"]')[5].click(); return out; });
    let r = (await fv()).recent;
    ok(r.length === 12 && new Set(r).size === 12 && r[0] === picked[5] && r[1] === picked[13] && !r.includes(picked[0]), "recently used updates on each pick: newest first, at most 12, no repeats");
    const fp1 = await page.evaluate(() => window.CurioEngine.fingerprint());
    await page.fill("[data-lib-search]", "");
    await page.click('[data-libtab="faves"]');
    await page.click(`.sc-grid [data-add-card="${suiteRef}"]`);
    ok((await fv()).recent[0] === suiteRef, "putting something into the film puts it at the top of recently used");
    await page.keyboard.press("Control+z");
    /* Search covers Favorites. */
    await page.fill("[data-lib-search]", suiteName.slice(0, 6));
    ok(await page.evaluate((ref) => !!document.querySelector(`.sc-grid [data-fave="${ref}"]`) && /favorite/.test(document.querySelector(".sc-grid-h").textContent), suiteRef), "search in the Favorites tab finds a starred suite");
    await page.click('[data-icat="camera"]');
    await page.fill("[data-lib-search]", suiteName.slice(0, 6));
    ok(await page.evaluate((ref) => !!document.querySelector(`.sc-grid [data-fave="${ref}"]`) && [...document.querySelectorAll(".sc-fave-h")].some((h) => /Favorites/.test(h.textContent)), suiteRef), "search in any tab finds favorites too, suites included");
    await page.fill("[data-lib-search]", "");
    /* A saved id the database no longer has is skipped; the list survives a reload. */
    await page.evaluate((k) => { const p = JSON.parse(localStorage.getItem(k)); p.faves.push("suite|gone-for-good"); localStorage.setItem(k, JSON.stringify(p)); }, FK);
    const before = await fv();
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
    const after = await fv();
    ok(JSON.stringify(after.recent) === JSON.stringify(before.recent) && after.faves.slice(0, 2).join() === curRef + "," + suiteRef, "favorites and recently used survive a reload");
    await page.click('[data-libtab="faves"]');
    s = await shown();
    ok(JSON.stringify(s.secs.Starred) === JSON.stringify([curRef, suiteRef]), "an id the database no longer has is skipped quietly");
    /* Unstar from the Favorites tab; the last one gone shows the plain empty state. */
    await page.click(`.sc-grid [data-fave="${curRef}"]`);
    await page.click(`.sc-grid [data-fave="${suiteRef}"]`);
    ok(await page.evaluate(() => /Star anything in the library to keep it here/.test(document.querySelector(".sc-grid").textContent)), "with nothing starred the Favorites tab says: Star anything in the library to keep it here");
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fp1 && fp1 === fp0, "stars, picks and recently used leave the film unchanged (not in the film, not in undo)");
    ok(!(await page.evaluate((k) => Object.keys(JSON.parse(localStorage.getItem("curiosities-engine-v1") || "{}")).some((x) => /fave/i.test(x)), FK)), "nothing about favorites is saved with the film");
    /* Back to where the walk-through was: the Transitions tab, looking through Transition style. */
    await page.click('[data-icat="transitions"]');
    await page.click(".sc-side .sc-pill:first-child");
    await page.click('[data-pick-card="curiosity|transitionKind"]');
    if ((await page.evaluate(() => window.CurioScreen.state().sel.id)) !== "transitionKind") await page.click('[data-pick-card="curiosity|transitionKind"]');
  }
  await page.click('[data-act="clear-lanes"]');
  await page.screenshot({ path: path.join(SHOTS, "screen-1b-transitions.png") });

  /* Hooks for panels from other threads (the momentum meter): row(), on(fn), addPanel(spec). */
  const hook = await page.evaluate(() => {
    let told = 0;
    window.CurioScreen.on(() => told++);
    const added = window.CurioScreen.addPanel({ id: "test-dock", label: "Test dock", place: "player", mount: (el) => (el.textContent = "docked") });
    window.CurioScreen.setRow(2);
    const r = window.CurioScreen.row();
    window.CurioScreen.setRow(0);
    const el = document.querySelector('.sc-player .sc-dock[data-panel="test-dock"]');
    return { added, r, told, text: el && el.textContent };
  });
  ok(hook.added && hook.text === "docked" && hook.r === 2 && hook.told >= 2, "other threads can dock a panel, read the playhead and hear every move");
  ok(await page.evaluate(() => /^00:00:00:06 /.test(document.querySelector(".sc-tc").textContent) === false && /00:00:00:00/.test(document.querySelector(".sc-tc").textContent)), "the clock starts at zero");
  /* Two docked panels stack in the Screen's own column beside the Player instead of sitting on top of each other. */
  const stack = await page.evaluate(() => {
    window.CurioScreen.addPanel({ id: "test-dock-2", label: "Second dock", place: "player", mount: (el) => (el.innerHTML = '<div style="height:24px">second</div>') });
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const a = r('.sc-dock[data-panel="test-dock"]'), b = r('.sc-dock[data-panel="test-dock-2"]'), v = r(".sc-player > .sc-viewers");
    return { below: b.top >= a.bottom - 1, sameCol: Math.abs(a.left - b.left) < 1, beside: a.left >= v.right - 1, col: !!document.querySelector('.sc-player > .sc-docks > .sc-dock[data-panel="test-dock-2"]') };
  });
  ok(stack.col && stack.below && stack.sameCol && stack.beside, "two docked panels stack in one column beside the viewers, never on top of each other");
  /* Every docked panel keeps part of the column in view; a slim bar can sit in a strip under the Player; the column
     shrinks to a strip only when every panel in it is folded. */
  const docks2 = await page.evaluate(() => {
    const S = window.CurioScreen;
    S.addPanel({ id: "test-dock-tall", label: "Tall", place: "player", mount: (el) => (el.innerHTML = '<div style="height:2000px">tall</div>') });
    S.addPanel({ id: "test-dock-bar", label: "Bar", place: "under", mount: (el) => (el.textContent = "a slim bar") });
    const col = document.querySelector(".sc-player > .sc-docks").getBoundingClientRect();
    const last = document.querySelector('.sc-dock[data-panel="test-dock-tall"]').previousElementSibling ? document.querySelector('.sc-docks > .sc-dock:last-child').getBoundingClientRect() : null;
    const two = document.querySelector('.sc-dock[data-panel="test-dock-2"]').getBoundingClientRect();
    const bar = document.querySelector('.sc-player > .sc-under > .sc-dock[data-panel="test-dock-bar"]');
    const w0 = col.width;
    document.querySelectorAll(".sc-docks > .sc-dock").forEach((d) => d.classList.add("folded"));
    const w1 = document.querySelector(".sc-player > .sc-docks").getBoundingClientRect().width;
    document.querySelectorAll(".sc-docks > .sc-dock").forEach((d, i) => i && d.classList.remove("folded"));
    const w2 = document.querySelector(".sc-player > .sc-docks").getBoundingClientRect().width;
    document.querySelectorAll(".sc-docks > .sc-dock").forEach((d) => d.classList.remove("folded"));
    S.removePanel("test-dock-tall");
    S.removePanel("test-dock-bar");
    return { inView: two.bottom <= col.bottom + 1 && two.height > 10 && (!last || last.top < col.bottom), bar: !!bar, w0, w1, w2 };
  });
  ok(docks2.inView, "a tall docked panel scrolls inside itself, so the panels after it stay in view");
  ok(docks2.bar, 'place "under" puts a slim bar in a strip under the Player');
  ok(docks2.w1 < 50 && docks2.w2 > 150 && docks2.w0 > 150, `the column shrinks to a strip only when every panel in it is folded (${Math.round(docks2.w0)} → ${Math.round(docks2.w1)} → ${Math.round(docks2.w2)}px)`);
  /* Keys typed in a tool window over the Screen belong to that tool, not the film behind it. */
  const keyGuard = await page.evaluate(() => {
    window.CurioScreen.setRow(1);
    const d = document.createElement("dialog");
    d.innerHTML = '<button type="button">in the tool</button>';
    document.body.appendChild(d);
    d.showModal();
    d.querySelector("button").focus();
    const send = (key, o) => d.querySelector("button").dispatchEvent(new KeyboardEvent("keydown", Object.assign({ key, bubbles: true, cancelable: true }, o || {})));
    const undo0 = window.CurioEngine.history().undo.length;
    send("ArrowRight");
    send(" ");
    const out = { row: window.CurioScreen.row(), undo: window.CurioEngine.history().undo.length === undo0 };
    d.close();
    d.remove();
    return out;
  });
  ok(keyGuard.row === 1 && keyGuard.undo, "arrows and Space inside a tool window leave the film behind it alone");
  ok(await page.evaluate(() => window.CurioScreen.removePanel("test-dock") && window.CurioScreen.removePanel("test-dock-2") && !document.querySelector('.sc-dock[data-panel^="test-dock"]')), "a docked panel can be taken off again");

  /* Maya's ghosting, the play range, and the momentum box. */
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.evaluate(() => window.CurioScreen.setRow(1));
  await page.keyboard.press("g");
  ok((await page.$$(".sc-viewer.mine .sc-ghost")).length === 2, "G shows ghosts of the moments before and after");
  await page.keyboard.press("g");
  await page.keyboard.press("i");
  await page.evaluate(() => window.CurioScreen.setRow(3));
  await page.keyboard.press("o");
  ok(JSON.stringify(await page.evaluate(() => window.CurioScreen.state().range)) === "[1,3]" && (await page.$$(".sl-out")).length >= 2, "I and O set a play range, drawn on the timeline");
  await page.evaluate(() => window.CurioScreen.setRow(3));
  await page.keyboard.press("l");
  await page.waitForTimeout(1300);
  await page.keyboard.press("k");
  ok(await page.evaluate(() => { const r = window.CurioScreen.row(); return r >= 1 && r <= 3; }), "Play loops inside the range");
  await page.click('[data-act="range-clear"]');
  ok(!(await page.evaluate(() => window.CurioScreen.state().range)), "the range clears");

  /* The whole film at a glance: a frame per moment under the viewers; click or drag to jump (decision 74). */
  const ovN = await page.evaluate(() => [document.querySelectorAll(".sc-ov-f").length, window.CurioEngine.state().rows.length]);
  ok(ovN[0] > 1 && ovN[0] === ovN[1], "the whole-film strip shows every moment (" + ovN[0] + ")");
  const ovFit = await page.evaluate(() => { const s = document.querySelector(".sc-ov-strip"); return s.scrollWidth <= s.clientWidth + 1; });
  ok(ovFit, "the whole film fits in the strip without scrolling");
  await page.click('.sc-ov-f[data-ov="2"]');
  ok((await page.evaluate(() => window.CurioScreen.row())) === 2 && !!(await page.$('.sc-ov-f.on[data-ov="2"]')), "clicking a frame in the strip jumps the playhead there");
  const ovBox = await (await page.$(".sc-ov-strip")).boundingBox();
  await page.mouse.move(ovBox.x + 3, ovBox.y + ovBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(ovBox.x + ovBox.width - 3, ovBox.y + ovBox.height / 2, { steps: 6 });
  await page.mouse.up();
  ok((await page.evaluate(() => window.CurioScreen.row())) === ovN[1] - 1, "dragging along the strip scrubs to the end of the film");
  const lanesBox = await (await page.$(".sl-lanes")).boundingBox();
  await page.mouse.move(lanesBox.x + 40, lanesBox.y + 10);
  await page.keyboard.down("Control");
  for (let k = 0; k < 6; k++) await page.mouse.wheel(0, -200);
  await page.keyboard.up("Control");
  await page.waitForTimeout(100);
  const ovWin = await page.evaluate(() => { const w = document.querySelector(".sc-ov-win"); return w && !w.hidden ? parseFloat(w.style.width) : null; });
  ok(ovWin > 0 && ovWin < 100, "when the timeline is zoomed in, a box on the strip shows which part it is showing (" + ovWin + ")");
  await page.click('.sc-ov-f[data-ov="' + (ovN[1] - 1) + '"]');
  const ovSeen = await page.evaluate(() => { const sc = document.querySelector(".sl-scroll"); const p = sc.querySelector(".sl-lanes .sl-play"); const hw = sc.querySelector(".sl-heads").offsetWidth; const x = Number(p.getAttribute("x")); return [x, sc.scrollLeft, sc.clientWidth, hw, sc.scrollWidth, document.querySelectorAll(".sl-scroll").length]; });
  ok(ovSeen[0] >= ovSeen[1] - 1 && ovSeen[0] <= ovSeen[1] + ovSeen[2] - ovSeen[3], "jumping from the strip scrolls the timeline so the playhead is in view (" + ovSeen + ")");
  await page.click('[data-act="zoom-fit"]');
  await page.click('.sc-ov-f[data-ov="1"]');
  await page.screenshot({ path: path.join(SHOTS, "screen-1d-whole-film.png") });
  await page.click('[data-act="overview"]');
  ok((await page.$$(".sc-ov-f")).length === 0 && !!(await page.$('[data-act="overview"]')), "the strip folds away and comes back");
  await page.click('[data-act="overview"]');
  await page.evaluate(() => window.CurioScreen.setRow(0));
  ok(await page.evaluate(() => !!document.querySelector(".sc-cur.sel .sc-mom")), "the picked curiosity shows its momentum: how it drives the story");

  /* CapCut's keyboard shortcuts and layouts. */
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.click('[data-act="shortcuts"]');
  ok((await page.$$(".sc-keys-in p")).length >= 40, "the Shortcuts button lists CapCut's keys (" + (await page.$$(".sc-keys-in p")).length + ")");
  await page.screenshot({ path: path.join(SHOTS, "screen-1c-shortcuts.png") });
  await page.keyboard.press("Escape");
  ok(!(await page.$(".sc-keys")), "Esc closes the list");
  const T = () => page.evaluate(() => window.CurioLanes.tools());
  const m0 = (await T()).markers.length;
  await page.keyboard.press("m");
  ok((await T()).markers.length === m0 + 1 && !!(await page.$(".sl-marker")), "M adds a marker at the playhead");
  await page.keyboard.press("m");
  ok((await T()).markers.length === m0, "M again takes it off");
  /* ⇧[ and ⇧]: previous and next marker, like CapCut; the status line says when there is none that way. */
  {
    const keep = await page.evaluate(() => JSON.stringify(window.CurioLanes.tools().markers));
    const rowNow = () => page.evaluate(() => window.CurioScreen.row());
    const said = () => page.evaluate(() => document.querySelector(".sl-msg").textContent);
    await page.evaluate(() => { const t = window.CurioLanes.tools(); const st = window.CurioEngine.state(); t.markers = [{ row: st.rows[4].id, color: "red", note: "the joke lands" }, { row: st.rows[1].id, color: "orange", note: "" }]; window.CurioScreen.setRow(0); });
    await page.keyboard.press("Shift+BracketRight");
    const r1 = await rowNow();
    await page.keyboard.press("Shift+BracketRight");
    const r2 = await rowNow();
    const s2 = await said();
    ok(r1 === 1 && r2 === 4 && /marker, at moment 5: the joke lands/.test(s2), "⇧] moves the playhead to the next marker, then the one after (" + r1 + ", " + r2 + ": " + s2 + ")");
    await page.keyboard.press("Shift+BracketRight");
    const s3 = await said();
    ok((await rowNow()) === 4 && /No marker after moment 5/.test(s3), "with no marker further on, ⇧] stays put and the status line says so (" + s3 + ")");
    await page.keyboard.press("Shift+BracketLeft");
    const r4 = await rowNow();
    await page.keyboard.press("Shift+BracketLeft");
    const s5 = await said();
    ok(r4 === 1 && (await rowNow()) === 1 && /No marker before moment 2/.test(s5), "⇧[ goes back to the previous marker, and says when there is none before it (" + s5 + ")");
    await page.evaluate(() => { window.CurioLanes.tools().markers = []; window.CurioScreen.setRow(2); });
    await page.keyboard.press("Shift+BracketRight");
    ok((await rowNow()) === 2 && /no markers yet/.test(await said()), "with no markers at all, the status line says to press M");
    await page.evaluate((k) => { window.CurioLanes.tools().markers = JSON.parse(k); window.CurioScreen.setRow(0); }, keep);
    await page.click('[data-act="shortcuts"]');
    const listed = await page.$$eval(".sc-keys-in p", (ps) => ps.map((p) => p.textContent));
    ok(listed.some((t) => /^⇧\[Previous marker/.test(t)) && listed.some((t) => /^⇧\]Next marker/.test(t)), "the Shortcuts window lists ⇧[ Previous marker and ⇧] Next marker");
    await page.keyboard.press("Escape");
  }
  await page.keyboard.press("Control+Equal");
  ok((await T()).zoom > 1, "⌘+ zooms the timeline in");
  await page.keyboard.press("Shift+Z");
  ok((await T()).zoom === 1, "⇧Z fits the timeline");
  await page.keyboard.press("b");
  ok((await T()).tool === "split", "B is Split mode");
  await page.keyboard.press("a");
  ok((await T()).tool === "select", "A is Select mode");
  await page.keyboard.press("Backquote");
  ok((await T()).linkage === false, "~ turns linkage off");
  await page.keyboard.press("Backquote");
  await page.click('[data-act="link-settings"]');
  ok((await page.$$(".sl-linkset [data-kind]")).length >= 16, "Linkage settings lists a tick for every kind of node, like CapCut's box");
  await page.click('.sl-linkset [data-kind="feeling"]');
  await page.click('.sl-linkset [data-l="done"]');
  ok((await T()).linkKinds.feeling === false, "unticking Feeling leaves feeling nodes behind");
  await page.click('[data-act="link-settings"]');
  ok(!(await page.$eval(".sl-linkset [data-kind-all]", (b) => b.checked)), "Select all shows unticked while a kind is off");
  await page.screenshot({ path: path.join(SHOTS, "screen-1e-linkage-settings.png") });
  await page.click(".sl-linkset [data-kind-all]");
  await page.click('.sl-linkset [data-l="done"]');
  ok(Object.keys((await T()).linkKinds).length === 0, "Select all ticks every kind again");
  await page.keyboard.press("p");
  ok((await T()).magnet === true, "P turns the main track magnet on");
  await page.keyboard.press("p");
  const nodeCount = () => page.evaluate(() => Object.values(window.CurioEngine.state().lanes).reduce((a, l) => a + Object.keys(l.points).length, 0));
  const p0 = await nodeCount();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Control+b");
  ok((await nodeCount()) === p0 + 1, "⌘B splits the lane's line at the playhead with a node");
  await page.keyboard.press("Control+z");
  ok((await nodeCount()) === p0, "⌘Z undoes it");
  await page.keyboard.press("ArrowLeft");
  for (const [lay, test, msg] of [
    ["right", (g) => g.player.l >= g.insp.r - 1 && g.player.b > g.tl.t, "Player on the right runs full height beside the timeline"],
    ["media", (g) => g.lib.b > g.tl.t && g.tl.l >= g.lib.r - 1, "Library full height runs down the left beside the timeline"],
    ["details", (g) => g.insp.b > g.tl.t && g.tl.r <= g.insp.l + 1, "Details full height runs down the right beside the timeline"],
    ["center", (g) => g.tl.t >= g.player.b - 1, "the default layout puts the timeline under everything"],
  ]) {
    await page.selectOption("[data-pick-layout]", lay);
    const g = await page.evaluate(() => Object.fromEntries([["lib", ".sc-lib"], ["player", ".sc-player"], ["insp", ".sc-inspector"], ["tl", ".sc-timeline"]].map(([k, q]) => { const r = document.querySelector(q).getBoundingClientRect(); return [k, { l: r.left, r: r.right, t: r.top, b: r.bottom }]; })));
    ok(test(g), msg);
    if (lay === "right") await page.screenshot({ path: path.join(SHOTS, "screen-1d-player-right.png") });
  }

  for (const lv of ["suite", "proximity", "proximitySuite", "curiosity"]) {
    await page.click(`[data-level="${lv}"]`);
    ok(await page.evaluate((l) => window.CurioScreen.state().sel.level === l, lv), "looks through a " + lv);
  }
  await page.screenshot({ path: path.join(SHOTS, "screen-2-levels.png") });

  /* Inspector: change shot size at moment 1 via its control. */
  await page.selectOption("[data-pick-item]", "shotSize");
  await page.click('[data-icat="camera"]').catch(() => {});
  if (!(await page.$('.sc-cat.open [data-select-cur="shotSize"]'))) await page.click('[data-icat="camera"]');
  const before = await page.evaluate(() => Object.keys(window.CurioEngine.state().lanes).length);
  await page.evaluate(() => {
    const r = document.querySelector('.sc-inspector [data-step-set="shotSize"]');
    r.value = "0";
    r.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const lane = await page.evaluate(() => window.CurioEngine.state().lanes["camera|shotSize"]);
  ok(lane && Object.keys(lane.points).length >= 1, "an inspector control writes a node at the playhead");
  ok((await page.$$(".sl-node")).length >= 1, "the node shows in the automation lane");

  /* Add a second inspiration viewer and blend. */
  await page.click('[data-act="add-insp"]');
  ok((await page.$$(".sc-viewer.insp")).length === 2, "a second inspiration viewer is added");
  for (const v of ["v1", "v2"]) {
    await page.click(`[data-focus="${v}"].sc-vname`);
    if (!(await page.$('.sc-cat.open [data-take="shotSize"]'))) await page.click('[data-icat="camera"]');
    await page.check('[data-take="shotSize"]');
  }
  await page.click('[data-blend="shotSize"]');
  const pts = await page.evaluate(() => Object.keys((window.CurioEngine.state().lanes["camera|shotSize"] || { points: {} }).points).length);
  ok(pts === (await page.evaluate(() => window.CurioEngine.state().rows.length)), "the blend writes a node on every moment");
  await page.screenshot({ path: path.join(SHOTS, "screen-3-blend.png") });

  /* Pick a proximity suite so two lanes show, then join nodes. */
  await page.click('[data-focus="mine"].sc-vname');
  await page.click('[data-level="suite"]');
  await page.selectOption("[data-pick-item]", { index: 0 });
  const laneCount = await page.evaluate(() => document.querySelectorAll(".sl-head:not(.sl-cliphead)").length);
  ok(laneCount >= 2, "a suite shows its members as lanes (" + laneCount + ")");
  const box = await page.$eval(".sl-svg", (s) => { const r = s.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
  const geo = await page.evaluate(() => {
    const heads = [...document.querySelectorAll(".sl-heads > div")];
    const svg = document.querySelector(".sl-svg").getBoundingClientRect();
    const lanes = [...document.querySelectorAll(".sl-head:not(.sl-cliphead)")].map((h) => { const r = h.getBoundingClientRect(); return r.top + r.height / 2; });
    return { lanes, n: window.CurioEngine.state().rows.length, w: svg.width };
  });
  const col = geo.w / geo.n;
  await page.mouse.click(box.x + col * 1.5, geo.lanes[0]);
  await page.mouse.click(box.x + col * 3.5, geo.lanes[1] - 8);
  const nodes = await page.$$eval(".sl-node", (ns) => ns.map((n) => n.dataset.node));
  ok(nodes.length >= 2, "clicking lanes adds nodes");
  const a = await page.$eval(`.sl-node[data-node$="${nodes[0].split("@")[1]}"]`, (n) => { const r = n.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, key: n.dataset.node }; });
  const lk2 = await page.evaluate(() => { const ns = [...document.querySelectorAll(".sl-node")]; const lk0 = ns[0].dataset.node.split("@")[1]; const o = ns.find((n) => n.dataset.node.split("@")[1] !== lk0); if (!o) return null; const r = o.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, key: o.dataset.node }; });
  ok(!!lk2, "there are nodes on two lanes");
  const linksBefore = await page.evaluate(() => window.CurioEngine.state().links.length);
  if (lk2) {
    const first = await page.evaluate(() => { const n = document.querySelector(".sl-node"); const r = n.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(first.x, first.y);
    await page.mouse.down();
    await page.mouse.move((first.x + lk2.x) / 2, (first.y + lk2.y) / 2, { steps: 5 });
    await page.mouse.move(lk2.x, lk2.y, { steps: 5 });
    await page.mouse.up();
  }
  const linksAfter = await page.evaluate(() => window.CurioEngine.state().links.filter((l) => l.scope).length);
  ok(linksAfter >= 1 && (await page.evaluate(() => window.CurioEngine.state().links.length)) === linksBefore + 1, "dropping a node on another lane's node joins them");
  ok((await page.$$(".sl-link")).length >= 1, "the proximity line is drawn");
  await page.screenshot({ path: path.join(SHOTS, "screen-4-proximity.png") });

  /* Move one node sideways: its partner moves too. */
  const link = await page.evaluate(() => window.CurioEngine.state().links.find((l) => l.scope));
  const ix = (st, id) => st.rows.findIndex((r) => r.id === id);
  const moved = await page.evaluate((link) => {
    const st = window.CurioEngine.state();
    const key = link.scope.from + "@" + link.from.track + "|" + link.from.curiosity;
    const sh = window.CurioLanes.shiftCommands(st, key, 1, false);
    const r = window.CurioEngine.send({ type: "batch", label: "test move", commands: sh.cmds });
    const l2 = window.CurioEngine.state().links.find((l) => l.id === link.id);
    const i = (id) => st.rows.findIndex((r) => r.id === id);
    return { ok: r.ok, from: i(l2.scope.from) - i(link.scope.from), to: i(l2.scope.to) - i(link.scope.to) };
  }, link);
  ok(moved.ok && moved.from === 1 && moved.to === 1, "moving a joined node moves its partner and the line");

  /* Copy and paste the proximity at another moment. */
  await page.evaluate(() => window.CurioScreen.setRow(4));
  await page.click(".sl-node");
  const sel = await page.evaluate(() => {
    const l = window.CurioEngine.state().links.find((x) => x.scope);
    return l.scope.from + "@" + l.from.track + "|" + l.from.curiosity;
  });
  const cp = await page.evaluate((k) => window.CurioLanes.copyGroup(k), sel);
  ok(cp.ok && cp.links === 1 && cp.nodes === 2, "copy takes both nodes and the line");
  const pa = await page.evaluate(() => window.CurioLanes.paste(0));
  ok(pa.ok && (await page.evaluate(() => window.CurioEngine.state().links.filter((l) => l.scope).length)) === 2, "paste puts the pair and its line in another scene");

  /* Window layouts: one window (only my film), three windows (two inspiration films). */
  await page.click('[data-wins="1"]');
  ok((await page.$$(".sc-viewer")).length === 1, "the one-window layout shows only my film");
  await page.click('[data-wins="3"]');
  ok((await page.$$(".sc-viewer.insp")).length === 2, "the three-window layout shows two inspiration films and mine");
  const films = await page.$$eval("[data-film]", (ss) => ss.map((x) => x.value));
  ok(new Set(films).size === films.length, "each new inspiration viewer starts on a different film");

  /* Arrange view. */
  await page.click('[data-view="arrange"]');
  ok(await page.evaluate(() => document.querySelector(".sc-viewers").hidden), "Arrange hides the viewers by default");
  ok((await page.$$(".sl-clip")).length > 0, "film clip tracks sit at the top of the timeline");
  await page.click('[data-act="show-all"]');
  await page.click('[data-open-cat="comedy"]');
  const lanesAll = await page.evaluate(() => document.querySelectorAll(".sl-head:not(.sl-cliphead)").length);
  ok(lanesAll > 20, "Show all potential curiosities lists a category's curiosities as tracks (" + lanesAll + ")");
  await page.click('[data-act="show-suites"]');
  const firstSuite = await page.$("[data-open-suite]");
  if (firstSuite) {
    await page.evaluate(() => document.querySelector(".sc-chips details").open = true);
    await page.click("[data-open-suite]");
  }
  ok(!!firstSuite, "Show all potential curiosity suites lists suites by category");
  await page.screenshot({ path: path.join(SHOTS, "screen-5-arrange.png"), fullPage: false });
  /* Change a track's curiosity with its dropdown. */
  const swap = await page.evaluate(() => {
    const s = document.querySelector('.sl-pick[data-lane-cur="shotSize"]');
    if (!s) return "no dropdown";
    s.value = "angleHeight";
    s.dispatchEvent(new Event("change", { bubbles: true }));
    const st = window.CurioEngine.state();
    return !st.lanes["camera|shotSize"] && !!Object.keys(st.lanes).find((k) => k.endsWith("|angleHeight")) ? "ok" : "not moved";
  });
  ok(swap === "ok", "a track's dropdown changes its curiosity and keeps the nodes (" + swap + ")");
  await page.evaluate(() => window.CurioEngine.undo());
  ok(await page.evaluate(() => !!window.CurioEngine.state().lanes["camera|shotSize"]), "undo brings it back");

  /* Zoom and scroll, fine lines, area copy and paste, curves, curiosity windows (Jeremy, 20:26Z). The button: the
     Screen's page also carries data-view="screen" while that view is on, and a click on it lands mid-page. */
  await page.click('button[data-view="screen"]');
  await page.evaluate(() => { const E = window.CurioEngine; const st = E.state(); const t = st.tracks.find((x) => x.curiosities.includes("emotionIntensity")) || st.tracks[0]; if (!t.curiosities.includes("emotionIntensity")) E.send({ type: "addCuriosity", track: t.id, curiosity: "emotionIntensity" }); const cmds = [0, 2, 5, 7].map((j, k) => ({ type: "setPoint", row: st.rows[j].id, track: t.id, curiosity: "emotionIntensity", value: [1, 4, 0, 5][k] })); E.send({ type: "batch", label: "test lane", commands: cmds }); });
  await page.evaluate(() => { window.CurioLanes.tools().zoom = 1; window.CurioLanes.tools().laneH = 50; });
  await page.click('[data-pick-card="curiosity|transitionKind"]').catch(() => {});
  await page.evaluate(() => { const ids = ["emotionIntensity", "shotSize"]; const p = JSON.parse(localStorage.getItem("curiosities-screen-v1")); });
  await page.evaluate(() => window.CurioScreen.state());
  /* put two lanes on the timeline via the Details window buttons is slower; use the + of the cards instead */
  await page.click('[data-icat="feeling"]').catch(() => {});
  await page.evaluate(() => window.CurioScreen.openWin("emotionIntensity"));
  await page.click('.sc-win [data-win-lane="emotionIntensity"]');
  await page.evaluate(() => window.CurioScreen.openWin("shotSize"));
  await page.click('.sc-win[data-win="shotSize"] [data-win-lane="shotSize"]');
  ok((await page.$$(".sc-win")).length === 2, "⧉ windows open for several curiosities at once");
  await page.click('.sc-win[data-win="shotSize"] .sc-frames button[data-v="close"]');
  ok(await page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|shotSize")); return lk && st.lanes[lk].points[st.rows[window.CurioScreen.row()].id] === "close"; }), "Shot size's window: clicking a frame around the person sets the shot size here");
  await page.click('.sc-win[data-win="shotSize"] [data-win-close]');
  await page.click('.sc-win[data-win="emotionIntensity"] [data-win-close]');
  const fineCount = () => page.$$eval(".sl-svg .sl-fine", (x) => x.length);
  const f0 = await fineCount();
  const rulerEl = await page.$(".sl-top");
  const rb = await rulerEl.boundingBox();
  await page.mouse.move(rb.x + 120, rb.y + rb.height - 6);
  await page.mouse.down();
  await page.mouse.move(rb.x + 120, rb.y + rb.height + 60, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  const z1 = await page.evaluate(() => window.CurioLanes.tools().zoom);
  ok(z1 > 1.5, "dragging down on the ruler zooms in (" + z1.toFixed(2) + ")");
  ok((await fineCount()) > f0, "zooming in shows more fine grid lines (" + f0 + " to " + (await fineCount()) + ")");
  await page.mouse.move(rb.x + 120, rb.y + rb.height - 6);
  await page.mouse.down();
  await page.mouse.move(rb.x + 120, rb.y + rb.height - 50, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  ok((await page.evaluate(() => window.CurioLanes.tools().zoom)) < z1, "dragging up on the ruler zooms out");
  await page.evaluate(() => (window.CurioLanes.tools().zoom = 3));
  await page.evaluate(() => window.CurioScreen.setRow(0));
  await page.evaluate(() => (document.querySelector(".sl-scroll").scrollLeft = 0));
  const sc0 = await page.$eval(".sl-scroll", (x) => x.scrollLeft);
  await page.mouse.move(rb.x + 300, rb.y + rb.height - 6);
  await page.mouse.down();
  await page.mouse.move(rb.x + 150, rb.y + rb.height - 6, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  ok((await page.$eval(".sl-scroll", (x) => x.scrollLeft)) > sc0, "dragging sideways on the ruler scrolls the timeline");
  const headEl = await page.$(".sl-heads .sl-head");
  const hb = await headEl.boundingBox();
  const lh0 = await page.evaluate(() => window.CurioLanes.tools().laneH || 50);
  await page.mouse.move(hb.x + hb.width - 30, hb.y + hb.height - 4);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width + 50, hb.y + hb.height - 4, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  const lh1 = await page.evaluate(() => window.CurioLanes.tools().laneH);
  ok(lh1 > lh0 * 1.5, "dragging right on the lane names makes lanes taller (" + lh0 + " to " + lh1 + ")");
  ok((await page.$$(".sl-svg .sl-vfine, .sl-svg .sl-vmajor")).length > 0, "a taller lane shows fine value lines");
  await page.evaluate(() => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; sc.scrollTop = 0; });
  const st0 = await page.$eval(".sl-scroll", (x) => x.scrollTop);
  await page.mouse.move(hb.x + hb.width - 30, hb.y + hb.height - 4);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width - 30, hb.y + hb.height - 84, { steps: 6 });
  await page.mouse.up();
  ok((await page.$eval(".sl-scroll", (x) => x.scrollTop)) >= st0, "dragging up and down on the lane names scrolls the lanes");
  const svEl = await page.$(".sl-scroll");
  const sb = await svEl.boundingBox();
  await page.mouse.move(sb.x + sb.width * 0.6, sb.y + Math.min(sb.height - 10, 90));
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -200);
  await page.keyboard.up("Control");
  ok((await page.evaluate(() => window.CurioLanes.tools().zoom)) > 3, "a pinch (or ⌘/Ctrl and scroll) zooms the grid");
  await page.evaluate(() => { window.CurioLanes.tools().zoom = 1; window.CurioLanes.tools().laneH = 60; });
  await page.evaluate(() => window.CurioScreen.setRow(0));
  /* Area: drag across empty space on the lanes, copy, select another lane, paste (values keep their place on the scale). */
  const laneIx = await page.evaluate(() => { const names = [...document.querySelectorAll(".sl-heads .sl-head")].map((h) => h.textContent); return { a: names.findIndex((t) => /Strength of the feeling|emotion intensity/i.test(t)), b: names.findIndex((t) => /Shot size/.test(t)) }; });
  ok(laneIx.a >= 0 && laneIx.b >= 0, "both lanes are on the timeline");
  const abox = await page.evaluate((a) => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; sc.scrollTop = 0; const top = document.querySelector(".sl-top").offsetHeight; sc.scrollTop = Math.max(0, document.querySelectorAll(".sl-bg")[a].getBBox().y); const r = document.querySelectorAll(".sl-bg")[a].getBoundingClientRect(); const n = window.CurioEngine.state().rows.length; return { x: r.x, y: r.y, w: r.width, h: r.height, n }; }, laneIx.a);
  const colW = abox.w / abox.n;
  await page.mouse.move(abox.x + colW * 0.1, abox.y + 2);
  await page.mouse.down();
  await page.mouse.move(abox.x + colW * 3.9, abox.y + abox.h - 2, { steps: 8 });
  await page.mouse.up();
  const ar = await page.evaluate(() => document.querySelector(".sl-area") && true);
  ok(ar, "dragging across empty space selects an area");
  await page.click('.sl [data-act="copy"]');
  ok(await page.evaluate(() => window.CurioLanes.clip() && window.CurioLanes.clip().kind === "area"), "Copy selection keeps the area's automation");
  const shotHead = (await page.$$(".sl-heads .sl-head"))[laneIx.b];
  const shb = await (await shotHead.$(".sl-sub")).boundingBox();
  await page.mouse.click(shb.x + shb.width - 4, shb.y + 2);
  ok(await page.evaluate(() => !!document.querySelector(".sl-heads .sl-head.on")), "clicking a lane's name area selects the whole lane");
  await page.click('.sl [data-act="paste"]');
  const pasted = await page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|shotSize")); const pts = st.lanes[lk].points; return [0, 2].map((j) => pts[st.rows[j].id]); });
  const expect = await page.evaluate(() => [1, 4].map((v) => window.CurioScale.at("shotSize", window.CurioScale.pos("emotionIntensity", v))));
  ok(pasted[0] === expect[0] && pasted[1] === expect[1] && pasted[0] !== pasted[1], "pasting Strength of the feeling onto Shot size keeps each value's place on the new scale (" + pasted.join(", ") + ")");
  const lanesNow = () => page.evaluate(() => { const l = window.CurioEngine.state().lanes; return JSON.stringify(Object.keys(l).sort().map((k) => [k, l[k]])); });
  const beforeUndo = await lanesNow();
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Control+Shift+z");
  const afterRedo = await lanesNow();
  ok(afterRedo === beforeUndo, "⌘Z then ⇧⌘Z gives back exactly the same film (one undo is one step, also with the app-wide undo list)");
  await page.keyboard.press("Control+z");
  ok(await page.evaluate(() => Object.keys(window.CurioEngine.state().lanes).some((k) => k.endsWith("|emotionIntensity"))), "one ⌘Z undoes only the paste, not the steps before it");
  /* Area tools: Reverse, Flip, Stretch ×2 and Squeeze ½ on a selected area, each one undo step; then My film's
     clip track shows a storyboard frame per moment when zoomed in. Strength of the feeling has 1, 4, 0, 5 at
     moments 1, 3, 6, 8. */
  {
    const box2 = await page.evaluate((a) => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; sc.scrollTop = Math.max(0, document.querySelectorAll(".sl-bg")[a].getBBox().y); const r = document.querySelectorAll(".sl-bg")[a].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, n: window.CurioEngine.state().rows.length }; }, laneIx.a);
    const cw = box2.w / box2.n;
    /* Moments 1 to 4 of this lane (selected again before each tool: Stretch and Squeeze resize the area). */
    const select = async () => {
      await page.evaluate(() => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; });
      /* Let go of the last area first: a press inside a selected area drags it sideways instead of starting a box. */
      await page.focus(".sl");
      await page.keyboard.press("Escape");
      await page.mouse.move(box2.x + cw * 0.1, box2.y + 2);
      await page.mouse.down();
      await page.mouse.move(box2.x + cw * 3.9, box2.y + box2.h - 2, { steps: 8 });
      await page.mouse.up();
    };
    await select();
    ok((await page.$$('.sl [data-act^="area-"]')).length === 7, "a selected area shows Reverse, Flip, Stretch ×2, Squeeze ½, Freeze, Shape ▾ and Take from the film");
    const pts = () => page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|emotionIntensity")); return st.rows.slice(0, 8).map((r) => (st.lanes[lk].points[r.id] == null ? null : st.lanes[lk].points[r.id])); });
    const orig = await pts();
    const tool = async (act) => { await select(); await page.click(`.sl [data-act="${act}"]`); const p = await pts(); await page.keyboard.press("Control+z"); return p; };
    const rv = await tool("area-reverse");
    ok(rv[3] === orig[0] && rv[1] === orig[2] && rv[0] == null && rv[2] == null && rv[5] === orig[5], "Reverse mirrors the area's nodes in time (" + rv.join(",") + ")");
    ok(JSON.stringify(await pts()) === JSON.stringify(orig), "one ⌘Z takes Reverse back");
    const fp = await tool("area-flip");
    const flipped = await page.evaluate((o) => [o[0], o[2]].map((v) => window.CurioScale.fix("emotionIntensity", window.CurioScale.at("emotionIntensity", 1 -window.CurioScale.pos("emotionIntensity", v)))), orig);
    ok(String(fp[0]) === String(flipped[0]) && String(fp[2]) === String(flipped[1]) && fp[5] === orig[5], "Flip turns each node's setting upside down on its scale (" + fp.join(",") + " for " + flipped.join(",") + ")");
    ok(JSON.stringify(await pts()) === JSON.stringify(orig), "one ⌘Z takes Flip back");
    const sp = await tool("area-stretch");
    ok(sp[0] === orig[0] && sp[4] === orig[2] && sp[2] == null && sp[5] == null && sp[7] === orig[7], "Stretch ×2 spreads the nodes out to twice as long (" + sp.join(",") + ")");
    ok(JSON.stringify(await pts()) === JSON.stringify(orig), "one ⌘Z takes Stretch back");
    const sq = await tool("area-squeeze");
    ok(sq[0] === orig[0] && sq[1] === orig[2] && sq[2] == null && sq[5] === orig[5], "Squeeze ½ pulls the nodes together (" + sq.join(",") + ")");
    ok(JSON.stringify(await pts()) === JSON.stringify(orig), "one ⌘Z takes Squeeze back");
    /* Freeze: moment 1's setting held at moments 1 and 4, the node at moment 3 gone, everything between still. */
    const plays = () => page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|emotionIntensity")); const at = lk.indexOf("|"); return st.rows.slice(0, 8).map((r) => String(window.CurioEngine.value(r.id, lk.slice(0, at), lk.slice(at + 1)))); });
    await select();
    await page.click('.sl [data-act="area-freeze"]');
    const fzPlays = await plays();
    const fz = await pts();
    const fzArea = await page.evaluate(() => !!document.querySelector(".sl-area") && !!document.querySelector('.sl [data-act="area-freeze"]'));
    await page.keyboard.press("Control+z");
    ok(String(fz[0]) === String(orig[0]) && String(fz[3]) === String(orig[0]) && fz[2] == null && fz[5] === orig[5] && fzPlays.slice(0, 4).every((v) => v === String(orig[0])), "Freeze holds moment 1's setting still over the selection (" + fz.join(",") + ")");
    ok(fzArea && JSON.stringify(await pts()) === JSON.stringify(orig), "the selection stays after Freeze, and one ⌘Z takes it back");
    /* Shape ▾ > Rise and fall: low at both ends of the selection, up to its highest in the middle. */
    await select();
    await page.click('.sl [data-act="area-shape"]');
    ok((await page.$$(".sl-shapemenu [data-preset]")).length === 6, "Shape ▾ opens a menu of six shapes");
    await page.click('.sl-shapemenu [data-preset="riseFall"]');
    const rf = await plays();
    const rfKeep = await page.evaluate(() => !document.querySelector(".sl-shapemenu") && !!document.querySelector(".sl-area") && /Rise and fall/.test(document.querySelector(".sl-msg").textContent));
    await page.keyboard.press("Control+z");
    const lowest = String(Math.min(orig[0], orig[2]));
    ok(rf[0] === lowest && rf[3] === lowest && [rf[1], rf[2]].includes(String(orig[2])) && rf[5] === String(orig[5]), "Rise and fall goes up from the lane's lowest to its highest and back down inside the selection (" + rf.slice(0, 6).join(",") + ")");
    ok(rfKeep && JSON.stringify(await pts()) === JSON.stringify(orig), "the menu closes, the selection stays, and one ⌘Z takes the shape back");
    const thumbs = () => page.$$eval(".sl-topsvg .sl-clip.mine image.sl-thumb", (x) => x.map((i) => i.getAttribute("href").slice(0, 19)));
    await page.evaluate(() => { window.CurioLanes.tools().zoom = 0.25; window.CurioScreen.setRow(0); });
    const few = await thumbs();
    await page.evaluate(() => { window.CurioLanes.tools().zoom = 3; window.CurioScreen.setRow(0); document.querySelector(".sl-scroll").scrollLeft = 0; document.querySelector(".sl-scroll").scrollTop = 0; });
    const many = await thumbs();
    ok(few.length === 0 && many.length === box2.n && many.every((h) => h === "data:image/svg+xml;"), "zoomed in, My film's clip track shows a storyboard frame for each moment (" + few.length + " zoomed out, " + many.length + " zoomed in)");
    await page.waitForTimeout(150);
    const tl = await page.$(".sc-timeline");
    if (tl) await tl.screenshot({ path: path.join(SHOTS, "screen-6b-area-tools-thumbs.png") });
    await page.evaluate(() => { window.CurioLanes.tools().zoom = 1; window.CurioLanes.tools().laneH = 60; window.CurioScreen.setRow(0); });
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    ok((await page.$$('.sl [data-act^="area-"]')).length === 0 && JSON.stringify(await pts()) === JSON.stringify(orig), "Esc lets go of the area and its tools hide");

    /* Save as suite clip (CapCut's compound clip, kept to use again): name it in a small pop-up, find it in
       Suite clips ▾, drop it at the playhead (one undo step), as an analogy, and rename it. The reload and
       Delete are checked at the end, after the film's own reload. */
    await page.evaluate(() => localStorage.removeItem("curiosities-suite-clips-v1"));
    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-suite-clips-v1") || "[]"));
    /* Moments 1 to 4 of the lane again, measured afresh (the lanes are taller now). */
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    const bx = await page.evaluate((a) => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; sc.scrollTop = Math.max(0, document.querySelectorAll(".sl-bg")[a].getBBox().y); const r = document.querySelectorAll(".sl-bg")[a].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, n: window.CurioEngine.state().rows.length }; }, laneIx.a);
    const cw2 = bx.w / bx.n;
    await page.mouse.move(bx.x + cw2 * 0.1, bx.y + 2);
    await page.mouse.down();
    await page.mouse.move(bx.x + cw2 * 3.9, bx.y + bx.h - 2, { steps: 8 });
    await page.mouse.up();
    ok(!!(await page.$('.sl .sl-areatools [data-act="suite-save"]')), "a selected area's tools offer Save as suite clip");
    await page.click('.sl [data-act="suite-save"]');
    ok(await page.evaluate(() => { const p = document.querySelector(".sl-suitepop"); return !!p && document.activeElement === p.querySelector("[data-suite-name]"); }), "it asks for a name in a small pop-up in the timeline, ready to type");
    await page.fill(".sl-suitepop [data-suite-name]", "the slow reveal");
    await page.keyboard.press("Enter");
    const sv = await saved();
    ok(sv.length === 1 && sv[0].name === "the slow reveal" && sv[0].span === 3 && sv[0].lanes.some((l) => l.cur === "emotionIntensity") && !(await page.$(".sl-suitepop")), "Enter saves it as a suite clip in curiosities-suite-clips-v1 (" + (sv[0] ? sv[0].name + ", " + (sv[0].span + 1) + " moments" : "nothing") + ")");
    ok(await page.evaluate(() => /Saved "the slow reveal" as a suite clip/.test(document.querySelector(".sl-msg").textContent) && /Suite clips 1 ▾/.test(document.querySelector('[data-act="suite-list"]').textContent)), "it says so, and the toolbar's Suite clips ▾ counts it");
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.CurioScreen.setRow(4));
    await page.click('.sl [data-act="suite-list"]');
    const li = await page.evaluate(() => [...document.querySelectorAll(".sl-suitelist li")].map((x) => ({ name: x.querySelector(".sl-suitename").textContent, what: x.querySelector(".sl-suitewhat").textContent, acts: [...x.querySelectorAll("button")].map((b) => b.textContent) })));
    const plain = await page.evaluate(() => window.CurioScale.label("emotionIntensity"));
    ok(li.length === 1 && li[0].name === "the slow reveal" && /^4 moments long · /.test(li[0].what) && li[0].what.includes(plain) && !li[0].what.includes("emotionIntensity"), "Suite clips ▾ lists it with how many moments long and its curiosities in plain words (" + (li[0] ? li[0].what : "") + ")");
    ok(li[0] && ["Drop at the playhead", "Drop as an analogy", "Rename", "Delete"].every((t) => li[0].acts.includes(t)), "each clip offers Drop at the playhead, Drop as an analogy, Rename and Delete");
    const fpBefore = await page.evaluate(() => window.CurioEngine.fingerprint());
    await page.click(".sl-suitelist [data-suite-drop]");
    const dropped = await pts();
    ok(String(dropped[4]) === String(orig[0]) && String(dropped[6]) === String(orig[2]) && dropped[5] == null && JSON.stringify(dropped.slice(0, 4)) === JSON.stringify(orig.slice(0, 4)), "Drop at the playhead puts the clip's nodes in starting at moment 5 (" + dropped.join(",") + ")");
    ok(await page.evaluate(() => /Dropped "the slow reveal" at moment 5/.test(document.querySelector(".sl-msg").textContent)), "it says where it dropped and onto which lanes");
    await page.keyboard.press("Control+z");
    ok(JSON.stringify(await pts()) === JSON.stringify(orig) && (await page.evaluate(() => window.CurioEngine.fingerprint())) === fpBefore, "one ⌘Z takes the whole drop back");
    await page.click('.sl [data-act="suite-list"]');
    await page.click(".sl-suitelist [data-suite-analogy]");
    const an = await pts();
    const anMsg = await page.evaluate(() => document.querySelector(".sl-msg").textContent);
    ok(/as an analogy at moment 5/.test(anMsg) && an[4] != null && an[6] != null, "Drop as an analogy drops it too, starting from each lane's own setting (" + an.join(",") + ")");
    await page.keyboard.press("Control+z");
    ok(JSON.stringify(await pts()) === JSON.stringify(orig), "one ⌘Z takes the analogy back");
    await page.click('.sl [data-act="suite-list"]');
    await page.click(".sl-suitelist [data-suite-rename]");
    ok(await page.evaluate(() => document.querySelector(".sl-suitepop [data-suite-name]").value === "the slow reveal"), "Rename opens the name pop-up with its name");
    await page.fill(".sl-suitepop [data-suite-name]", "the slower reveal");
    await page.click('.sl-suitepop [data-l="ok"]');
    ok((await saved()).map((c) => c.name).join() === "the slower reveal" && (await page.evaluate(() => /Renamed "the slow reveal" to "the slower reveal"/.test(document.querySelector(".sl-msg").textContent))), "Rename changes only its name");
    await page.evaluate(() => window.CurioScreen.setRow(0));
  }
  /* Moving an area: drag the selected block sideways (CapCut: a group of clips) and every node in it moves by whole
     moments, one undo step; Alt when letting go copies. Strength of the feeling has 1, 4, 0, 5 at moments 1, 3, 6, 8. */
  {
    const film = () => page.evaluate(() => { const st = window.CurioEngine.state(); return JSON.stringify([Object.keys(st.lanes).sort().map((k) => [k, st.lanes[k]]), st.links]); });
    const pts = () => page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|emotionIntensity")); return st.rows.slice(0, 8).map((r) => (st.lanes[lk].points[r.id] == null ? null : st.lanes[lk].points[r.id])); });
    let bx = await page.evaluate((a) => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; sc.scrollTop = Math.max(0, document.querySelectorAll(".sl-bg")[a].getBBox().y); const r = document.querySelectorAll(".sl-bg")[a].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, n: window.CurioEngine.state().rows.length }; }, laneIx.a);
    const cw = bx.w / bx.n;
    /* Where the lane is now (the toolbar's message can wrap onto a second line and push the lanes down). */
    const measure = async () => (bx = await page.evaluate((a) => { const r = document.querySelectorAll(".sl-bg")[a].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, n: window.CurioEngine.state().rows.length }; }, laneIx.a));
    const select = async () => {
      /* Let go of any area first, so the press starts a new box instead of dragging the old one. */
      await page.focus(".sl");
      await page.keyboard.press("Escape");
      await measure();
      await page.mouse.move(bx.x + cw * 0.1, bx.y + 2);
      await page.mouse.down();
      await page.mouse.move(bx.x + cw * 2.9, bx.y + bx.h - 2, { steps: 8 });
      await page.mouse.up();
      await measure();
    };
    const orig = await pts();
    const before = await film();
    await select();
    ok(await page.evaluate(() => /sideways to move/.test(document.querySelector(".sl-msg").textContent)), "with an area selected, the toolbar says it can be dragged sideways (Alt copies)");
    /* Press inside the area (on empty space) and drag right by two moments. */
    await page.mouse.move(bx.x + cw * 1.5, bx.y + 3);
    await page.mouse.down();
    await page.mouse.move(bx.x + cw * 2.6, bx.y + 3, { steps: 4 });
    await page.mouse.move(bx.x + cw * 3.5, bx.y + 3, { steps: 4 });
    ok(await page.evaluate(() => !!document.querySelector(".sl-svg .sl-areaghost") && document.querySelector(".sl-svg").classList.contains("sl-areamoving")), "while dragging, a preview of the block slides along");
    const tl = await page.$(".sc-timeline");
    if (tl) await tl.screenshot({ path: path.join(SHOTS, "screen-6c-area-drag.png") });
    await page.mouse.up();
    const mv = await pts();
    ok(mv[0] == null && mv[2] === orig[0] && mv[4] === orig[2] && mv[5] === orig[5] && mv[7] === orig[7], "dragging the area right by two moments moves its nodes two moments later (" + mv.join(",") + ")");
    ok(await page.evaluate(() => { const a = document.querySelector(".sl-area"); return a && /Moved 2 nodes 2 moments later/.test(document.querySelector(".sl-msg").textContent); }), "the area follows the block and a plain message says what moved");
    await page.keyboard.press("Control+z");
    ok((await film()) === before, "one ⌘Z brings back the exact film");
    /* Alt while letting go: a copy three moments later, over the node at moment 6. */
    await select();
    await page.mouse.move(bx.x + cw * 1.5, bx.y + 3);
    await page.mouse.down();
    await page.mouse.move(bx.x + cw * 4.5, bx.y + 3, { steps: 8 });
    await page.keyboard.down("Alt");
    await page.mouse.move(bx.x + cw * 4.55, bx.y + 3);
    ok(await page.evaluate(() => !!document.querySelector(".sl-svg .sl-areaghost.copy")), "holding Alt shows the preview as a copy");
    await page.mouse.up();
    await page.keyboard.up("Alt");
    const cp = await pts();
    ok(cp[0] === orig[0] && cp[2] === orig[2] && cp[3] === orig[0] && cp[5] === orig[2] && cp[7] === orig[7], "Alt-dragging copies the area's nodes and the originals stay (" + cp.join(",") + ")");
    await page.keyboard.press("Control+z");
    ok((await film()) === before, "one ⌘Z takes the copy back");
    /* The old gestures still work with an area selected: a node outside it drags alone; a click outside lets go. */
    await select();
    const n8 = await page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|emotionIntensity")); const c = document.querySelector(`.sl-node[data-node="${st.rows[7].id}@${lk}"]`); const r = c.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, in: c.classList.contains("in") }; });
    await page.mouse.move(n8.x, n8.y);
    await page.mouse.down();
    await page.mouse.move(n8.x - cw, n8.y, { steps: 6 });
    await page.mouse.up();
    const one = await pts();
    ok(!n8.in && one[6] === orig[7] && one[7] == null && one[0] === orig[0] && one[2] === orig[2], "a node outside the area still drags on its own (" + one.join(",") + ")");
    await page.keyboard.press("Control+z");
    await select();
    await page.mouse.click(bx.x + cw * 6.5, bx.y + 3);
    ok(!(await page.$(".sl-area")) && (await film()) === before, "a click on empty space outside the area still lets go of it");
    await measure();
    await page.mouse.move(bx.x + cw * 4.1, bx.y + 2);
    await page.mouse.down();
    await page.mouse.move(bx.x + cw * 5.9, bx.y + bx.h - 2, { steps: 8 });
    await page.mouse.up();
    ok(await page.evaluate(() => { const a = document.querySelector(".sl-area"); return !!a && Math.abs(Number(a.getAttribute("x")) - 4 * (Number(a.getAttribute("width")) / 2)) < 2; }), "dragging across empty space outside a selection still draws a new one");
    await page.focus(".sl");
    await page.keyboard.press("Escape");
  }
  /* Lane heads: Off (👁), Solo (S) and Lock (🔒), like CapCut's track buttons. Off is the engine lane's `on` (one undo
     step); Solo turns the other lanes off as one batch and pressing it again restores them; Lock is a view setting
     that stops the timeline from changing a lane's nodes. Strength of the feeling has 1, 4, 0, 5 at moments 1, 3, 6, 8. */
  {
    const film = () => page.evaluate(() => { const st = window.CurioEngine.state(); return JSON.stringify([Object.keys(st.lanes).sort().map((k) => [k, st.lanes[k]]), st.links]); });
    const onMap = () => page.evaluate(() => { const l = window.CurioEngine.state().lanes; return JSON.stringify(Object.keys(l).sort().map((k) => [k, l[k].on])); });
    const lkOf = (cur) => page.evaluate((c) => Object.keys(window.CurioEngine.state().lanes).find((k) => k.endsWith("|" + c)), cur);
    const lkE = await lkOf("emotionIntensity");
    const lkS = await lkOf("shotSize");
    const btn = (act, lk) => `.sl-heads [data-act="${act}"][data-lk="${lk}"]`;
    const headOf = (lk) => `.sl-heads .sl-head:has([data-act="lane-lock"][data-lk="${lk}"])`;
    const press = async (act, lk) => { await page.hover(headOf(lk)); await page.click(btn(act, lk)); };
    const msgText = () => page.$eval(".sl-msg", (x) => x.textContent);
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    const before = await film();
    ok(lkE && lkS && (await page.$(btn("lane-off", lkE))) && (await page.$(btn("lane-solo", lkE))) && (await page.$(btn("lane-lock", lkE))), "each lane's header has Off, Solo and Lock buttons");
    ok(await page.$eval(btn("lane-off", lkE), (b) => b.title.length > 30 && /stops changing the film/.test(b.title)), "the Off button says in plain words what it does");
    /* Off */
    await press("lane-off", lkE);
    ok(await page.evaluate((lk) => window.CurioEngine.state().lanes[lk].on === false, lkE), "👁 turns the lane's automation off in the engine (on: false)");
    ok(await page.evaluate((lk) => { const h = document.querySelector(`.sl-heads .sl-head:has([data-lk="${lk}"])`); const i = Number(h.dataset.i); const st = window.CurioEngine.state(); const n = Object.keys(st.lanes[lk].points).length; const offNodes = [...document.querySelectorAll(`.sl-node.off[data-lane="${i}"]`)].length; return h.classList.contains("is-off") && offNodes === n && !!document.querySelector(".sl-auto.off"); }, lkE), "an off lane is drawn dimmed: its header, its nodes and its dashed line");
    ok(await page.$eval(btn("lane-off", lkE), (b) => b.classList.contains("on") && b.getBoundingClientRect().width > 4), "the Off button stays showing while the lane is off");
    await page.focus(".sl");
    await page.keyboard.press("Control+z");
    ok((await film()) === before, "one ⌘Z turns it back on (the exact film)");
    /* Solo, by keyboard: focus the S button and press Enter. */
    const map0 = await onMap();
    await page.focus(btn("lane-solo", lkS));
    ok(await page.$eval(btn("lane-solo", lkS), (b) => b.getBoundingClientRect().width > 4), "a lane's buttons show when one of them has keyboard focus");
    await page.keyboard.press("Enter");
    ok(await page.evaluate((lk) => { const l = window.CurioEngine.state().lanes; return l[lk].on && Object.keys(l).filter((k) => k !== lk).every((k) => !l[k].on); }, lkS), "S plays only this lane's automation: every other lane is off");
    ok(await page.evaluate((lk) => document.querySelector(`.sl-heads .sl-head:has([data-lk="${lk}"])`).classList.contains("is-solo") && document.activeElement && document.activeElement.dataset.act === "lane-solo", lkS), "the soloed lane is marked, and focus stays on its S button");
    await page.keyboard.press("Enter");
    ok((await onMap()) === map0 && (await film()) === before, "pressing S again brings the other lanes back the way they were");
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    /* Lock: no adding by clicking, no dragging, area paste skips it. */
    const pts = () => page.evaluate((lk) => JSON.stringify(window.CurioEngine.state().lanes[lk].points), lkE);
    const p0 = await pts();
    await press("lane-lock", lkE);
    ok(await page.evaluate((lk) => window.CurioLanes.tools().locks[lk] === true && JSON.parse(localStorage.getItem("curiosities-screen-tools-v1")).locks[lk] === true, lkE), "🔒 keeps the lock in the timeline's tools (a view setting, not film data)");
    ok(await page.evaluate((lk) => document.querySelector(`.sl-heads .sl-head:has([data-lk="${lk}"])`).classList.contains("is-locked") && !!document.querySelector(".sl-svg .sl-lockbg"), lkE), "a locked lane looks locked: its header and a hatched lane");
    ok((await film()) === before, "locking changes nothing in the film");
    const bx = await page.evaluate((a) => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; sc.scrollTop = Math.max(0, document.querySelectorAll(".sl-bg")[a].getBBox().y); const r = document.querySelectorAll(".sl-bg")[a].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, n: window.CurioEngine.state().rows.length }; }, laneIx.a);
    const cw = bx.w / bx.n;
    await page.mouse.click(bx.x + cw * 1.5, bx.y + 4);
    ok((await pts()) === p0 && /locked/.test(await msgText()), "clicking an empty spot on a locked lane adds no node, with a plain message");
    const n8 = await page.evaluate((lk) => { const st = window.CurioEngine.state(); const c = document.querySelector(`.sl-node[data-node="${st.rows[7].id}@${lk}"]`); const r = c.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, lkE);
    await page.mouse.move(n8.x, n8.y);
    await page.mouse.down();
    await page.mouse.move(n8.x - cw, n8.y - 10, { steps: 6 });
    await page.mouse.up();
    ok((await pts()) === p0 && (await film()) === before, "a locked lane's node can't be dragged");
    await page.mouse.dblclick(n8.x, n8.y);
    ok((await pts()) === p0, "or removed with a double-click");
    /* Copy the locked lane (copying is fine), select from it to Shot size, paste: the locked lane is skipped, Shot size takes it. */
    const subOf = async (i) => (await (await page.$$(".sl-heads .sl-head"))[i].$(".sl-sub")).boundingBox();
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    let sb = await subOf(laneIx.a);
    await page.mouse.click(sb.x + sb.width - 4, sb.y + 2);
    await page.click('.sl [data-act="copy"]');
    sb = await subOf(laneIx.a);
    await page.mouse.click(sb.x + sb.width - 4, sb.y + 2);
    sb = await subOf(laneIx.b);
    await page.keyboard.down("Shift");
    await page.mouse.click(sb.x + sb.width - 4, sb.y + 2);
    await page.keyboard.up("Shift");
    const spread = await page.evaluate(() => { const a = document.querySelectorAll(".sl-heads .sl-head.on"); return a.length; });
    await page.click('.sl [data-act="paste"]');
    ok((await pts()) === p0 && /Skipped 1 locked lane/.test(await msgText()), "area paste over several lanes skips the locked one and says so (" + spread + " lanes selected)");
    const pastedIn = (await film()) !== before;
    ok(pastedIn, "the unlocked lanes in the selection were pasted into");
    await page.focus(".sl");
    if (pastedIn) await page.keyboard.press("Control+z");
    await page.keyboard.press("Escape");
    ok((await film()) === before, "and ⌘Z takes the paste back");
    /* A screenshot with one lane locked and another off, then everything back. */
    await press("lane-off", lkS);
    await page.mouse.move(2, 2);
    await page.evaluate((i) => { const sc = document.querySelector(".sl-scroll"); sc.scrollTop = Math.max(0, Math.min(...i.map((k) => document.querySelectorAll(".sl-bg")[k].getBBox().y)) - 20); }, [laneIx.a, laneIx.b]);
    await page.waitForTimeout(120);
    const tlh = await page.$(".sc-timeline");
    if (tlh) await tlh.screenshot({ path: path.join(SHOTS, "screen-6d-lane-heads.png") });
    await page.focus(".sl");
    await page.keyboard.press("Control+z");
    await press("lane-lock", lkE);
    ok(await page.evaluate((lk) => !window.CurioLanes.tools().locks[lk] && !document.querySelector(".sl-svg .sl-lockbg"), lkE), "🔒 again unlocks the lane");
    ok((await film()) === before, "the film is exactly as it was");
  }
  /* Lane groups (CapCut's folding track groups): a header per category with its counts and ▸/▾; a folded group is one
     thin row with a dot where any of its lanes has a node; folds are a view setting; an area skips folded lanes. */
  {
    const film = () => page.evaluate(() => window.CurioEngine.fingerprint() + JSON.stringify(window.CurioEngine.state().lanes));
    const before = await film();
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    const info = await page.evaluate(() => {
      const st = window.CurioEngine.state();
      const lkE = Object.keys(st.lanes).find((k) => k.endsWith("|emotionIntensity"));
      const cat = window.CurioLevels.categoryOf("emotionIntensity");
      const label = window.CurioLevels.CATEGORIES.find((c) => c.id === cat).label;
      const heads = [...document.querySelectorAll(".sl-heads .sl-ghead")].map((h) => ({ id: h.dataset.group, text: h.textContent }));
      return { lkE, cat, label, heads, lanes: document.querySelectorAll(".sl-heads .sl-head").length };
    });
    ok(info.heads.length >= 2 && info.heads.every((h) => /· \d+ · \d+●/.test(h.text)), "lanes are grouped under a header per category, each saying how many lanes it holds and how many have nodes (" + info.heads.map((h) => h.text.replace(/\s+/g, " ").trim()).join(" | ") + ")");
    const gh = info.heads.find((h) => h.id === info.cat);
    ok(!!gh && gh.text.includes(info.label) && /▾/.test(gh.text), "Strength of the feeling sits under " + info.label + ", the category Details puts it in, open (▾)");
    ok(!!(await page.$('.sl-tools [data-act="fold-all"]')), "the timeline toolbar has Fold all");
    const fold = `.sl-heads [data-act="fold"][data-group="${info.cat}"]`;
    await page.click(fold);
    const folded = await page.evaluate((o) => {
      const st = window.CurioEngine.state();
      const t = JSON.parse(localStorage.getItem("curiosities-screen-tools-v1") || "{}");
      const dots = [...document.querySelectorAll(`.sl-gdot[data-group="${o.cat}"]`)].map((d) => Number(d.dataset.gdot));
      const pts = Object.keys(st.lanes[o.lkE].points).map((r) => st.rows.findIndex((x) => x.id === r));
      const h = document.querySelector(`.sl-heads .sl-ghead[data-group="${o.cat}"]`);
      return { saved: !!(t.folds && t.folds[o.cat]), gone: !document.querySelector(`.sl-heads .sl-head [data-lk="${o.lkE}"]`), dots, pts, arrow: h && /▸/.test(h.textContent), expanded: document.querySelector(`.sl-heads [data-act="fold"][data-group="${o.cat}"]`).getAttribute("aria-expanded"), focus: document.activeElement && document.activeElement.dataset.act };
    }, info);
    ok(folded.gone && folded.arrow && folded.expanded === "false" && folded.focus === "fold", "▾ folds the group: its lanes are tucked away, the arrow turns to ▸ and focus stays on it");
    ok(folded.pts.length > 0 && folded.pts.every((j) => folded.dots.includes(j)), "the folded row has a dot at every moment where one of its lanes has a node (" + folded.dots.join(",") + ")");
    ok(folded.saved && (await film()) === before, "the fold is kept in the timeline's tools, and the film is unchanged (not an undo step)");
    /* An area dragged across every lane leaves the folded lanes out. */
    const sv = await page.evaluate(() => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; sc.scrollTop = 0; const bgs = [...document.querySelectorAll(".sl-bg")]; const a = bgs[0].getBoundingClientRect(); const b = bgs[bgs.length - 1].getBoundingClientRect(); return { x: a.x, y: a.y, w: a.width, y2: b.y + b.height, n: window.CurioEngine.state().rows.length, lanes: bgs.length }; });
    const cwG = sv.w / sv.n;
    await page.mouse.move(sv.x + cwG * 0.2, sv.y + 2);
    await page.mouse.down();
    await page.mouse.move(sv.x + cwG * 2.8, Math.min(sv.y2 - 2, sv.y + 600), { steps: 8 });
    await page.mouse.up();
    const picked = await page.evaluate((lk) => ({ on: document.querySelectorAll(".sl-heads .sl-head.on").length, area: !!document.querySelector(".sl-area"), hasE: [...document.querySelectorAll(".sl-heads .sl-head.on")].some((h) => h.querySelector(`[data-lk="${lk}"]`)) }), info.lkE);
    ok(picked.area && picked.on >= 1 && !picked.hasE, "an area dragged across the lanes skips the folded group's lanes (" + picked.on + " lanes taken)");
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    /* A dot moves the playhead to its moment. */
    const dj = folded.dots[folded.dots.length - 1];
    await page.evaluate(() => window.CurioScreen.setRow(0));
    await page.evaluate((o) => { const d = document.querySelector(`.sl-gdot[data-group="${o.cat}"][data-gdot="${o.dj}"]`); const sc = document.querySelector(".sl-scroll"); sc.scrollTop = Math.max(0, Number(d.getAttribute("cy")) - 30); sc.scrollLeft = Math.max(0, Number(d.getAttribute("cx")) - 200); }, { cat: info.cat, dj });
    await page.waitForTimeout(100);
    const dot = await page.$(`.sl-gdot[data-group="${info.cat}"][data-gdot="${dj}"]`);
    const db = await dot.boundingBox();
    await page.mouse.click(db.x + db.width / 2, db.y + db.height / 2);
    ok((await page.evaluate(() => window.CurioScreen.row())) === dj, "clicking a folded row's dot moves the playhead to that moment");
    await page.screenshot({ path: path.join(SHOTS, "screen-6e-lane-groups.png") });
    /* Fold all, then Open all. */
    await page.click('.sl-tools [data-act="fold-all"]');
    const all = await page.evaluate(() => ({ heads: document.querySelectorAll(".sl-heads .sl-head").length, groups: document.querySelectorAll(".sl-heads .sl-ghead.is-folded").length, total: document.querySelectorAll(".sl-heads .sl-ghead").length, btn: !!document.querySelector('.sl-tools [data-act="open-all"]') }));
    ok(all.heads === 0 && all.groups === all.total && all.btn, "Fold all folds every group to one row each, and the button now says Open all");
    await page.click('.sl-tools [data-act="open-all"]');
    const back = await page.evaluate(() => ({ heads: document.querySelectorAll(".sl-heads .sl-head").length, folded: document.querySelectorAll(".sl-heads .sl-ghead.is-folded").length, folds: Object.keys(window.CurioLanes.tools().folds).length }));
    ok(back.heads === info.lanes && back.folded === 0 && back.folds === 0, "Open all brings every lane back (" + back.heads + " lanes)");
    ok((await film()) === before, "folding and opening never changed the film");
    /* The header fits the 190px name column: a short count ("Camera · 5 · 4●") with the full wording in its
       tooltip and aria-label. */
    const fit = await page.evaluate(() => [...document.querySelectorAll(".sl-heads .sl-ghead")].map((h) => {
      const c = h.querySelector(".sl-gcount");
      const b = h.querySelector(".sl-fold");
      return { text: h.textContent.replace(/\s+/g, " ").trim(), w: h.getBoundingClientRect().width, cRight: c.getBoundingClientRect().right, hRight: h.getBoundingClientRect().right, cClip: c.scrollWidth > c.clientWidth + 1, tip: c.title, aria: b.getAttribute("aria-label") || "" };
    }));
    ok(fit.length >= 2 && fit.every((h) => /· \d+ · \d+●$/.test(h.text) && h.cRight <= h.hRight + 0.5 && !h.cClip), "each group header's count shows in full inside the name column (" + fit.map((h) => h.text + " @" + Math.round(h.w) + "px").join(" | ") + ")");
    ok(fit.every((h) => /: \d+ lanes?, \d+ with nodes$/.test(h.tip) && /: \d+ lanes?, \d+ with nodes\. (Fold|Open) /.test(h.aria)), "the full wording (\"" + (fit[0] || {}).tip + "\") is in the tooltip and the fold button's aria-label");
    /* Picking a curiosity whose group is folded opens that group (and only that one) and scrolls to its lane. */
    const other = info.heads.find((h) => h.id !== info.cat);
    const selBefore = await page.evaluate(() => window.CurioScreen.state().sel);
    await page.click(fold);
    if (other) await page.click(`.sl-heads [data-act="fold"][data-group="${other.id}"]`);
    await page.evaluate(() => { const sc = document.querySelector(".sl-scroll"); sc.scrollTop = sc.scrollHeight; });
    await page.evaluate(() => window.CurioScreen.openWin("emotionIntensity"));
    await page.click('.sc-win[data-win="emotionIntensity"] [data-select-cur="emotionIntensity"]');
    const shown = await page.evaluate((o) => {
      const t = window.CurioLanes.tools();
      const head = [...document.querySelectorAll(".sl-heads .sl-head")].find((h) => h.querySelector(`[data-lk="${o.lkE}"]`));
      const sc = document.querySelector(".sl-scroll").getBoundingClientRect();
      const top = document.querySelector(".sl-top").getBoundingClientRect().bottom;
      const r = head && head.getBoundingClientRect();
      return { open: !t.folds[o.cat], other: o.other ? !!t.folds[o.other] : true, head: !!head, inView: !!r && r.top >= top - 1 && r.bottom <= sc.bottom + 1, msg: document.querySelector(".sl-msg").textContent };
    }, { lkE: info.lkE, cat: info.cat, other: other && other.id });
    ok(shown.open && shown.head, "picking a curiosity in its window opens its folded group, so its lane shows (" + shown.msg + ")");
    ok(shown.inView, "and the timeline scrolls so its lane is in view");
    ok(shown.other, "another folded group stays folded");
    await page.click('.sc-win[data-win="emotionIntensity"] [data-win-close="emotionIntensity"]');
    /* Look through what was picked before again, so the tests after this see the same timeline. */
    await page.click(`[data-level="${selBefore.level}"]`);
    await page.selectOption("[data-pick-item]", selBefore.id);
    /* A redraw because the film changed does not open a group you folded again. */
    await page.click(fold);
    await page.evaluate(() => { const E = window.CurioEngine; const st = E.state(); const t = st.tracks[0]; E.send({ type: "setPoint", row: st.rows[0].id, track: t.id, curiosity: t.curiosities[0], value: E.value(st.rows[0].id, t.id, t.curiosities[0]) }); E.undo(); });
    ok(await page.evaluate((c) => !!window.CurioLanes.tools().folds[c], info.cat), "a change to the film never opens a folded group");
    await page.evaluate(() => { const t = window.CurioLanes.tools(); Object.keys(t.folds).forEach((k) => delete t.folds[k]); localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(t)); });
    ok((await film()) === before, "picking and folding never changed the film");
    await page.evaluate(() => window.CurioScreen.setRow(0));
  }
  /* Curves: a line between two nodes, shaped and written into the moments between. */
  await page.evaluate(() => document.querySelector(".sl-svg") && window.CurioScreen.setRow(1));
  const segA = await page.evaluate(() => { const s = [...document.querySelectorAll(".sl-seghit")].find((x) => /emotionIntensity\|r1\|r3|emotionIntensity\|/.test(x.dataset.seg)); return s ? s.dataset.seg : null; });
  ok(!!segA, "each line between two nodes can be picked");
  await page.evaluate((sk) => { const segs = [...document.querySelectorAll(".sl-seghit")]; const hit = segs.find((x) => x.dataset.seg === sk); hit.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); }, segA);
  ok(!!(await page.$(".sl-curves")), "double-clicking a line opens the curves pop-up");
  ok((await page.$$(".sl-curves .cv-fine")).length > 10, "the pop-up previews the curve on a fine grid");
  const wide = await page.evaluate(() => { const E = window.CurioEngine; const st = E.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|emotionIntensity")); return lk; });
  await page.evaluate((lk) => { const st = window.CurioEngine.state(); const lanes = window.CurioScreen; }, wide);
  const segWide = await page.evaluate(() => { const s = [...document.querySelectorAll(".sl-seghit")].map((x) => x.dataset.seg).find((k) => /\|emotionIntensity\|r3\|r6$/.test(k)); return s; });
  if (segWide) {
    await page.evaluate((sk) => { const hit = [...document.querySelectorAll(".sl-seghit")].find((x) => x.dataset.seg === sk); hit.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); }, segWide);
    await page.click('.sl-curves [data-shape="slowStart"]');
    await page.click('.sl-curves [data-l="apply"]');
    const between = await page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|emotionIntensity")); return [3, 4].map((j) => st.lanes[lk].points[st.rows[j].id]); });
    ok(between.every((v) => v != null), "Apply writes the curve into the moments between (" + between.join(", ") + ")");
    ok((await page.$$(".sl-node.sl-cpt")).length >= 2, "curve points are drawn small, and the line follows the curve");
  } else ok(false, "found the line from moment 3 to 6");
  /* Windows: Emotion's feeling pad and Comedy's joke timing. */
  await page.evaluate(() => window.CurioScreen.openWin("emotion"));
  ok(!!(await page.$('.sc-win[data-win="emotion"] .sc-pad')), "Emotion's window has a feeling pad");
  await page.click('.sc-win[data-win="emotion"] .sc-pad button[data-v="joyful"]');
  ok(await page.evaluate(() => { const st = window.CurioEngine.state(); const t = st.tracks.find((x) => x.curiosities.includes("emotion")); return t && window.CurioEngine.value(st.rows[window.CurioScreen.row()].id, t.id, "emotion") === "joyful"; }), "clicking a feeling on the pad sets it here");
  ok((await page.$$('.sc-win[data-win="emotion"] .sc-wctl')).length >= 3, "the window lists every slider the curiosity has");
  await page.evaluate(() => window.CurioScreen.setRow(0));
  await page.evaluate(() => window.CurioScreen.openWin("comedyDevice"));
  await page.click('.sc-win[data-win="comedyDevice"] [data-joke="three"]');
  ok(await page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|comicBeat")); return lk && ["setup planted", "building", "payoff lands"].every((v, j) => st.lanes[lk].points[st.rows[j].id] === v); }), "Comedy's window: Rule of three writes setup, build and payoff on three moments");
  /* Camera height, camera moves and how much color have hand-made windows too (decision 75). */
  const laneVal = (suffix) => page.evaluate((sfx) => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|" + sfx)); return lk ? st.lanes[lk].points[st.rows[window.CurioScreen.row()].id] : undefined; }, suffix);
  await page.evaluate(() => window.CurioScreen.setRow(1));
  await page.evaluate(() => window.CurioScreen.openWin("angleHeight"));
  ok((await page.$$('.sc-win[data-win="angleHeight"] .sc-heights button')).length === 5, "Camera height's window draws five camera heights around a person");
  await page.click('.sc-win[data-win="angleHeight"] .sc-heights button[data-v="low"]');
  ok((await laneVal("angleHeight")) === "low", "clicking the low camera sets a low angle here");
  await page.screenshot({ path: path.join(SHOTS, "screen-7b-camera-height.png") });
  await page.click('.sc-win[data-win="angleHeight"] [data-win-close]');
  await page.evaluate(() => window.CurioScreen.openWin("cameraMove"));
  ok((await page.$$('.sc-win[data-win="cameraMove"] .sc-moves button')).length >= 8, "Camera move's window shows a picture for every move");
  await page.click('.sc-win[data-win="cameraMove"] .sc-moves button[data-v="orbit"]');
  ok((await laneVal("cameraMove")) === "orbit", "clicking a move's picture sets that move here");
  await page.screenshot({ path: path.join(SHOTS, "screen-7c-camera-moves.png") });
  await page.click('.sc-win[data-win="cameraMove"] [data-win-close]');
  await page.evaluate(() => window.CurioScreen.openWin("colorRange"));
  await page.click('.sc-win[data-win="colorRange"] .sc-hues button[data-v="teal"]');
  ok((await laneVal("colorRange.paletteHue")) === "teal", "clicking a swatch sets the film's main color here");
  ok(await page.$eval('.sc-win[data-win="colorRange"] .sc-colors button[data-v="vivid color"] .sc-chips i', (i) => /hsl|rgb/.test(getComputedStyle(i).backgroundColor) && getComputedStyle(i).backgroundColor !== "rgba(0, 0, 0, 0)"), "the color choices are painted in the main color");
  await page.click('.sc-win[data-win="colorRange"] .sc-colors button[data-v="muted color"]');
  ok(/muted color/.test(String((await laneVal("colorRange")) || (await laneVal("colorRange.setting")))), "clicking a color choice sets how much color there is here");
  await page.screenshot({ path: path.join(SHOTS, "screen-7-windows.png") });
  while (await page.$(".sc-win [data-win-close]")) await page.click(".sc-win [data-win-close]");
  ok((await page.$$(".sc-win")).length === 0, "windows close");

  /* Keyframe jumps (CapCut's ◀ ◆ ▶ in Details) and the Player's Ratio menu (frame shape). */
  /* Clicked on the elements themselves. The Screen's page also carries data-view="screen", so the selector names the
     button; a click that lands on the page by position hits the Player's Play button. */
  await page.$eval('button[data-view="screen"]', (b) => b.click());
  await page.$eval(".sc-viewer.mine .sc-vname", (b) => b.click());
  /* The checks below read and write at the playhead, so nothing may be playing: a running Play moves the playhead
     and redraws Details every 1.1s, which closes an open ⋯ menu, moves the row the Ratio node is looked for at
     and moves the attention glow. */
  ok((await page.$eval('[data-act="play"]', (b) => b.textContent)) === "Play", "nothing is playing before the keyframe checks");
  const kid = await page.evaluate(() => (document.querySelector(".sc-inspector .sc-cur .sc-key[data-key]") || {}).dataset?.key);
  ok(!!kid, "Details has a key diamond to work with (" + kid + ")");
  /* Clear its lane, then set keys at moments 2 and 5 with the diamond. */
  await page.evaluate((id) => {
    const E = window.CurioEngine, st = E.state(), t = st.tracks.find((x) => x.curiosities.includes(id)), lane = t && st.lanes[t.id + "|" + id];
    if (lane) E.send({ type: "batch", label: "clear", commands: Object.keys(lane.points).map((r) => ({ type: "removePoint", row: r, track: t.id, curiosity: id })) });
  }, kid);
  const knav = (dir) => page.evaluate(([id, dir]) => { const k = [...document.querySelectorAll(".sc-inspector .sc-key[data-key]")].find((b) => b.dataset.key === id); const n = k && k.closest(".sc-knav"); const b = n && n.querySelector(`[data-dir="${dir}"]`); return b ? { dis: b.disabled, to: b.dataset.keyJump } : null; }, [kid, dir]);
  const clickKey = async () => page.evaluate((id) => [...document.querySelectorAll(".sc-inspector .sc-key[data-key]")].find((b) => b.dataset.key === id).click(), kid);
  await page.evaluate(() => window.CurioScreen.setRow(1));
  ok((await knav("prev")) === null, "no arrows while the curiosity has no nodes");
  await clickKey();
  await page.evaluate(() => window.CurioScreen.setRow(4));
  await clickKey();
  await page.evaluate(() => window.CurioScreen.setRow(2));
  const p2 = await knav("prev"), n2 = await knav("next");
  ok(p2 && !p2.dis && p2.to === "1" && n2 && !n2.dis && n2.to === "4", "between keys, ◀ and ▶ point at moments 2 and 5");
  await page.evaluate((id) => [...document.querySelectorAll(".sc-inspector .sc-key[data-key]")].find((b) => b.dataset.key === id).closest(".sc-knav").querySelector('[data-dir="next"]').click(), kid);
  ok((await page.evaluate(() => window.CurioScreen.row())) === 4, "▶ jumps the playhead to the next key");
  ok((await knav("next")).dis && !(await knav("prev")).dis, "on the last key ▶ is greyed and ◀ is not");
  await page.evaluate((id) => [...document.querySelectorAll(".sc-inspector .sc-key[data-key]")].find((b) => b.dataset.key === id).closest(".sc-knav").querySelector('[data-dir="prev"]').click(), kid);
  ok((await page.evaluate(() => window.CurioScreen.row())) === 1, "◀ jumps the playhead to the previous key");
  ok((await knav("prev")).dis && !(await knav("next")).dis, "on the first key ◀ is greyed and ▶ is not");
  ok(await page.evaluate((id) => [...document.querySelectorAll(".sc-inspector .sc-key[data-key]")].find((b) => b.dataset.key === id).classList.contains("here"), kid), "the diamond still shows the key here");
  /* A Details row's ⋯ menu (CapCut's Apply to all and Reset): each item is one undo step, says what it did in the
     status line, and a locked lane is refused. kid has keys at moments 2 and 5. */
  {
    const laneOf = () => page.evaluate((id) => { const E = window.CurioEngine, st = E.state(), t = st.tracks.find((x) => x.curiosities.includes(id)), lane = t && st.lanes[t.id + "|" + id]; return { lk: t && t.id + "|" + id, mode: lane && lane.mode, at: lane ? st.rows.map((r, j) => (lane.points[r.id] != null ? j : -1)).filter((j) => j >= 0) : [], vals: st.rows.map((r) => String(t ? E.value(r.id, t.id, id) : "")) }; }, kid);
    /* The film's lanes in a fixed order (an undo can bring a lane back in another place in the list). */
    const lanesNow = () => page.evaluate(() => { const l = window.CurioEngine.state().lanes; return JSON.stringify(Object.keys(l).sort().map((k) => [k, l[k].on, l[k].mode, Object.keys(l[k].points).sort().map((r) => [r, l[k].points[r]])])); });
    const more = `.sc-inspector [data-cur-menu="${kid}"]`;
    const said = () => page.$eval(".sc-toast", (t) => t.textContent);
    const items = () => page.$$eval(".sc-cur-menu [data-cur-apply]", (b) => b.map((x) => x.dataset.curApply).join());
    const pick = async (act) => { await page.click(more); await page.click(`.sc-cur-menu [data-cur-apply="${act}"]`); };
    const undoes = (before) => page.keyboard.press("Control+z").then(lanesNow).then((f) => f === before);
    ok(!!(await page.$(more)), "each Details row has a ⋯ menu");
    await page.evaluate(() => { document.querySelector(".sl").focus(); });
    await page.keyboard.press("Escape");
    const atMore = await page.$eval(more, (b) => { b.scrollIntoView({ block: "nearest" }); const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el === b ? "" : `covered by ${el && el.tagName}.${el && String((el.className && (el.className.baseVal ?? el.className)) || "")} at ${Math.round(r.left)},${Math.round(r.top)}`; });
    if (atMore) console.log("note: the ⋯ button is " + atMore);
    await page.click(more);
    ok((await items()) === "all,reset,clear" && (await page.$eval(more, (b) => b.getAttribute("aria-expanded"))) === "true", "with no stretch selected the menu offers all through the film, reset and clear (" + (await items()) + ")");
    ok((await page.evaluate(() => document.activeElement.dataset.curApply)) === "all", "the menu takes keyboard focus on its first item");
    await page.keyboard.press("ArrowDown");
    ok((await page.evaluate(() => document.activeElement.dataset.curApply)) === "reset", "the arrow keys move through it");
    await page.keyboard.press("Escape");
    ok(!(await page.$(".sc-cur-menu")) && (await page.evaluate((k) => document.activeElement && document.activeElement.dataset.curMenu === k, kid)), "Esc closes it and gives focus back to ⋯");
    await page.click(more);
    await page.click(".sc-details");
    ok(!(await page.$(".sc-cur-menu")), "a click anywhere else closes it");
    await page.focus(more);
    await page.keyboard.press("Enter");
    ok(!!(await page.$(".sc-cur-menu")), "⋯ opens from the keyboard too");
    await page.keyboard.press("Escape");

    const before = await lanesNow();
    await page.evaluate(() => window.CurioScreen.setRow(4));
    const l0 = await laneOf();
    const here = l0.vals[4];
    await pick("all");
    let l = await laneOf();
    let msg = await said();
    ok(l.at.join() === "0" && l.mode === "hold" && l.vals.every((v) => v === here), "Use this all through the film leaves one node at moment 1 with the playhead's setting, and the lane jumps so it stays flat (" + l.at.join() + ", " + l.mode + ")");
    ok(/all through the film/.test(msg) && /Undo takes it back\.$/.test(msg), "it says so in the status line (" + msg + ")");
    ok(await undoes(before), "one undo takes it back");

    await pick("reset");
    l = await laneOf();
    msg = await said();
    ok(l.at.join() === "0" && l.vals.every((v) => v === l0.vals[0]) && /how the scene starts/.test(msg) && /Undo takes it back\.$/.test(msg), "Reset to how the scene starts takes off the nodes after moment 1 and keeps the start (" + msg + ")");
    ok(await undoes(before), "one undo takes Reset back");

    await pick("clear");
    l = await laneOf();
    msg = await said();
    ok(l.at.length === 0 && /lane is clear/.test(msg) && /Undo takes it back\.$/.test(msg), "Clear this lane takes every node off (" + msg + ")");
    await pick("reset");
    ok(/nothing to reset/.test(await said()), "Reset on a lane with nothing to reset says so plainly (" + (await said()) + ")");
    ok(await undoes(before), "one undo brings the cleared lane back");

    /* The selected stretch: drag across moments 1 to 3 on this lane, then use the playhead's setting there. */
    const bx = await page.evaluate((lk) => { const heads = [...document.querySelectorAll(".sl-heads .sl-head")]; const i = heads.findIndex((h) => h.querySelector(`[data-lk="${lk}"]`)); if (i < 0) return null; const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; sc.scrollTop = Math.max(0, document.querySelectorAll(".sl-bg")[i].getBBox().y); const r = document.querySelectorAll(".sl-bg")[i].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, n: window.CurioEngine.state().rows.length }; }, l0.lk);
    ok(!!bx, "the curiosity's lane is on the timeline");
    if (bx) {
      const cw = bx.w / bx.n;
      await page.mouse.move(bx.x + cw * 0.1, bx.y + 2);
      await page.mouse.down();
      await page.mouse.move(bx.x + cw * 2.9, bx.y + bx.h - 2, { steps: 8 });
      await page.mouse.up();
      ok(!!(await page.$(".sl-area")), "a stretch is selected on the timeline");
      await page.click(more);
      ok((await items()) === "all,stretch,reset,clear" && /moment 1 to moment 3/.test(await page.$eval('[data-cur-apply="stretch"]', (b) => b.textContent)), "with a stretch selected the menu offers Use this in the selected stretch (" + (await items()) + ")");
      await page.click('.sc-cur-menu [data-cur-apply="stretch"]');
      l = await laneOf();
      msg = await said();
      ok(l.at.join() === "0,2,4" && [0, 1, 2].every((j) => l.vals[j] === here) && l.vals[4] === l0.vals[4], "it holds the playhead's setting from moment 1 to moment 3, the node inside taken off, the rest kept (" + l.at.join() + ")");
      ok(/from moment 1 to moment 3/.test(msg) && /Undo takes it back\.$/.test(msg), "and says so (" + msg + ")");
      ok(await undoes(before), "one undo takes the stretch back");
      await page.focus(".sl");
      await page.keyboard.press("Escape");
    }

    /* A locked lane is refused, and nothing changes. */
    await page.evaluate((lk) => (window.CurioLanes.tools().locks[lk] = true), l0.lk);
    await pick("clear");
    msg = await said();
    ok(/locked/.test(msg) && (await lanesNow()) === before, "a locked lane is refused with a plain message and left as it is (" + msg + ")");
    await page.evaluate((lk) => delete window.CurioLanes.tools().locks[lk], l0.lk);
  }
  /* Look ▾ (CapCut's Copy attributes and Paste attributes, for a whole moment): copy moment 3's look, paste it on
     moment 6 (one undo step), paste it over a stretch, skip a locked lane, and the ⌥⌘C and ⌥⌘V shortcuts. */
  {
    const said = () => page.$eval(".sc-toast", (t) => t.textContent);
    const lanesNow = () => page.evaluate(() => { const l = window.CurioEngine.state().lanes; return JSON.stringify(Object.keys(l).sort().map((k) => [k, l[k].on, l[k].mode, Object.keys(l[k].points).sort().map((r) => [r, l[k].points[r]])])); });
    const lookItems = () => page.$$eval(".sc-mlook-menu [data-look]", (b) => b.map((x) => x.dataset.look + (x.disabled ? "-off" : "")).join());
    /* Every curiosity on a track, as Details reads it: the track it is on, and what it plays at moment j. */
    const plays = (j) => page.evaluate((j) => { const E = window.CurioEngine, S = window.CurioScale, st = E.state(), out = {}; st.tracks.forEach((t) => t.curiosities.forEach((c) => { if (c in out || !S.known(c)) return; const tr = st.tracks.find((x) => x.curiosities.includes(c)); out[c] = String(S.fix(c, E.value(st.rows[j].id, tr.id, c))); })); return out; }, j);
    const nodeAt = (j) => page.evaluate((j) => { const st = window.CurioEngine.state(), out = {}; Object.keys(st.lanes).forEach((lk) => { const v = st.lanes[lk].points[st.rows[j].id]; if (v != null) out[lk.split("|")[1]] = String(v); }); return out; }, j);
    await page.evaluate(() => { document.querySelector(".sl").focus(); });
    await page.keyboard.press("Escape");
    /* Make moment 3 differ from moments 6 to 8 on three lanes no link changes, so the paste has something to change:
       a node at moment 3, and nodes keeping what moments 6, 7 and 8 play now (one node alone would hold everywhere). */
    const made = await page.evaluate(() => {
      const E = window.CurioEngine, S = window.CurioScale, st = E.state(), cmds = [], curs = [];
      const linked = new Set(st.links.map((l) => l.to && l.to.curiosity));
      st.tracks.forEach((t) => t.curiosities.forEach((c) => {
        if (curs.length >= 3 || curs.includes(c) || linked.has(c) || !S.known(c) || S.domain(c).kind !== "choice" || st.tracks.find((x) => x.curiosities.includes(c)) !== t) return;
        const opts = S.domain(c).options, here = [5, 6, 7].map((j) => E.value(st.rows[j].id, t.id, c));
        const v = opts.find((o) => !here.map(String).includes(String(o)) && String(o) !== String(E.value(st.rows[2].id, t.id, c)));
        if (v == null || here.some((x) => x == null)) return;
        curs.push(c);
        cmds.push({ type: "setPoint", row: st.rows[2].id, track: t.id, curiosity: c, value: v });
        [5, 6, 7].forEach((j, i) => cmds.push({ type: "setPoint", row: st.rows[j].id, track: t.id, curiosity: c, value: S.fix(c, here[i]) }));
      }));
      E.send({ type: "batch", label: "Test: moment 3's look", commands: cmds });
      return curs;
    });
    await page.evaluate(() => window.CurioScreen.setRow(2));
    const look = ".sc-inspector [data-look-menu]";
    ok(!!(await page.$(look)) && /Moment 3/.test(await page.$eval(".sc-insp-h", (h) => h.textContent)), "Details' header for My film has a Look ▾ menu");
    await page.click(look);
    ok((await lookItems()) === "copy,paste-off" && (await page.evaluate(() => document.activeElement.dataset.look)) === "copy", "with nothing copied yet it offers Copy this moment's look, and Paste is greyed (" + (await lookItems()) + ")");
    await page.keyboard.press("Escape");
    ok(!(await page.$(".sc-mlook-menu")) && (await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute("data-look-menu"))), "Esc closes it and gives focus back to Look ▾");
    const fp0 = await page.evaluate(() => window.CurioEngine.fingerprint());
    const at3 = await plays(2);
    await page.click(look);
    await page.click('.sc-mlook-menu [data-look="copy"]');
    let msg = await said();
    const kept = await page.evaluate(() => JSON.parse(sessionStorage.getItem("curiosities-screen-look-v1") || "null"));
    const n3 = Object.keys(at3).length;
    ok(new RegExp("^Copied moment 3's look: " + n3 + " settings\\.$").test(msg), "Copy says how many settings it took (" + msg + ")");
    ok(kept && kept.from === 2 && Object.keys(kept.values).length === n3 && Object.keys(at3).every((c) => String(kept.values[c]) === at3[c]), "the copied look is every setting moment 3 plays, kept for this tab in sessionStorage");
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fp0 && !(await page.evaluate(() => /look/i.test(localStorage.getItem("curiosities-engine-v1") || ""))), "copying changes nothing in the film and is not saved with it");

    /* Paste at moment 6. */
    await page.evaluate(() => window.CurioScreen.setRow(5));
    const before = await lanesNow();
    const at6 = await plays(5);
    const differ = Object.keys(at3).filter((c) => at3[c] !== at6[c]);
    await page.click(look);
    ok((await lookItems()) === "copy,paste" && /Moment 3's look .* onto moment 6/.test(await page.$eval('[data-look="paste"]', (b) => b.textContent)), "after a copy, Paste the look here names both moments");
    await page.click('.sc-mlook-menu [data-look="paste"]');
    msg = await said();
    const after6 = await plays(5);
    const nodes6 = await nodeAt(5);
    ok(new RegExp("^Pasted moment 3's look onto moment 6: " + differ.length + " settings? changed, " + (n3 - differ.length) + " already matched\\.").test(msg) && /Undo takes it back\.$/.test(msg), "Paste says how many settings changed and how many already matched (" + msg + ")");
    ok(differ.length >= made.length && differ.every((c) => nodes6[c] === at3[c]), "every setting that differed gets a node at moment 6 with moment 3's setting (" + differ.length + ")");
    const still = Object.keys(at3).filter((c) => after6[c] !== at3[c]);
    ok(made.every((c) => after6[c] === at3[c]) && (still.length === 0 || /a link or a pin/.test(msg)), "moment 6 now plays moment 3's look" + (still.length ? " (a link or a pin still changes " + still.join(", ") + ", and the message says so)" : ""));
    ok(await page.keyboard.press("Control+z").then(lanesNow).then((f) => f === before), "one undo takes the whole paste back");

    /* Paste into a selected stretch: moments 6 to 8. */
    const bx = await page.evaluate(() => { const sc = document.querySelector(".sl-scroll"); sc.scrollLeft = 0; const bg = document.querySelector(".sl-bg"); if (!bg) return null; sc.scrollTop = Math.max(0, bg.getBBox().y); const r = bg.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, n: window.CurioEngine.state().rows.length }; });
    ok(!!bx && bx.n >= 8, "a lane is on the timeline to select a stretch on");
    if (bx) {
      const cw = bx.w / bx.n;
      await page.mouse.move(bx.x + cw * 5.1, bx.y + 2);
      await page.mouse.down();
      await page.mouse.move(bx.x + cw * 7.9, bx.y + bx.h - 2, { steps: 8 });
      await page.mouse.up();
      ok(!!(await page.$(".sl-area")), "a stretch is selected on the timeline");
      await page.click(look);
      ok((await lookItems()) === "copy,paste,stretch" && /from moment 6 to moment 8/.test(await page.$eval('[data-look="stretch"]', (b) => b.textContent)), "with a stretch selected Look ▾ offers Paste into the selected stretch (" + (await lookItems()) + ")");
      await page.click('.sc-mlook-menu [data-look="stretch"]');
      msg = await said();
      const ends = [await nodeAt(5), await nodeAt(7)];
      const mid = [await plays(5), await plays(6), await plays(7)];
      ok(/^Pasted moment 3's look onto moments 6 to 8: \d+ settings? changed, held from start to end, \d+ already matched\./.test(msg) && /Undo takes it back\.$/.test(msg), "it says what it did (" + msg + ")");
      ok(made.every((c) => ends[0][c] === at3[c] && ends[1][c] === at3[c] && mid.every((m) => m[c] === at3[c])), "every lane that changed has a node at the start and the end of the stretch, and plays the look all through it");
      ok(await page.keyboard.press("Control+z").then(lanesNow).then((f) => f === before), "one undo takes the stretch back");
      await page.focus(".sl");
      await page.keyboard.press("Escape");
    }

    /* A locked lane is skipped, and ⌥⌘V pastes at the playhead (no stretch selected now). */
    const lockLk = await page.evaluate((c) => { const st = window.CurioEngine.state(); return st.tracks.find((t) => t.curiosities.includes(c)).id + "|" + c; }, made[0]);
    await page.evaluate((lk) => (window.CurioLanes.tools().locks[lk] = true), lockLk);
    await page.evaluate(() => window.CurioScreen.setRow(7));
    const at8 = await nodeAt(7);
    const clip0 = await page.evaluate(() => localStorage.getItem("curiosities-screen-clip-v1"));
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("Control+Alt+KeyV");
    msg = await said();
    const after8 = await nodeAt(7);
    ok(/^Pasted moment 3's look onto moment 8/.test(msg) && /1 locked lane was skipped/.test(msg) && after8[made[0]] === at8[made[0]] && made.slice(1).every((c) => after8[c] === at3[c]), "⌥⌘V pastes at the playhead, and a locked lane is skipped and named (" + msg + ")");
    ok(await page.keyboard.press("Control+z").then(lanesNow).then((f) => f === before), "one undo takes that paste back");
    await page.evaluate((lk) => delete window.CurioLanes.tools().locks[lk], lockLk);

    /* ⌥⌘C copies the playhead's moment; it is not ⌘C (the node clipboard stays as it was). */
    await page.evaluate(() => window.CurioScreen.setRow(0));
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("Control+Alt+KeyC");
    msg = await said();
    ok(/^Copied moment 1's look: \d+ settings\.$/.test(msg) && (await page.evaluate(() => JSON.parse(sessionStorage.getItem("curiosities-screen-look-v1")).from)) === 0, "⌥⌘C copies the playhead's moment (" + msg + ")");
    ok((await page.evaluate(() => localStorage.getItem("curiosities-screen-clip-v1"))) === clip0 && (await lanesNow()) === before, "⌥⌘C and ⌥⌘V do not set off ⌘C, ⌘V or anything else");
    await page.keyboard.press("?");
    const listed = await page.$$eval(".sc-keys-in p", (ps) => ps.map((p) => p.textContent));
    ok(listed.some((t) => /^⌥⌘CCopy this moment's look/.test(t)) && listed.some((t) => /^⌥⌘VPaste the look here/.test(t)), "the Shortcuts window lists ⌥⌘C and ⌥⌘V");
    await page.keyboard.press("Escape");
    /* Take back the test's own three nodes at moment 3. */
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("Control+z");
  }
  /* Ratio. */
  ok(!!(await page.$(".sc-transport select[data-ratio]")), "the Player's transport bar has a Ratio menu");
  const shape = () => page.evaluate(() => { const f = document.querySelector(".sc-viewer.mine .sc-frame"), r = f.getBoundingClientRect(), s = f.querySelector("svg").getBoundingClientRect(), i = document.querySelector(".sc-viewer.insp .sc-frame"), ir = i && i.getBoundingClientRect(); return { shape: f.dataset.shape, w: r.width, h: r.height, sw: s.width, sh: s.height, cx: s.left + s.width / 2 - (r.left + r.width / 2), insp: ir ? ir.width / ir.height : null }; });
  const wide0 = await shape();
  const setRatio = (v) => page.evaluate((v) => { const s = document.querySelector(".sc-transport select[data-ratio]"); s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); }, v);
  await setRatio("vertical 9:16");
  ok(await page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|canvasFill.ratio")); return lk && st.lanes[lk].points[st.rows[window.CurioScreen.row()].id] === "vertical 9:16"; }), "Ratio writes a Frame shape node at the playhead");
  const tall = await shape();
  ok(tall.shape === "vertical" && tall.h > tall.w * 1.5 && wide0.w > wide0.h, `my film's frame turns vertical (${Math.round(tall.w)}×${Math.round(tall.h)}, was ${Math.round(wide0.w)}×${Math.round(wide0.h)})`);
  ok(Math.abs(tall.sw - tall.w) < 2 && Math.abs(tall.sh - tall.h) < 2 && Math.abs(tall.cx) < 2 && (await page.evaluate(() => document.querySelector(".sc-viewer.mine .sc-frame > svg").getAttribute("preserveAspectRatio"))) === "xMidYMid slice", "the picture is cropped to fill the vertical frame, centered");
  ok(tall.insp == null || tall.insp > 1.5, "inspiration films keep their own shape");
  ok(await page.evaluate(() => document.querySelector(".sc-transport select[data-ratio]").value === "vertical 9:16"), "the menu shows the shape at the playhead");
  await page.screenshot({ path: path.join(SHOTS, "screen-8-ratio-keyjumps.png") });
  await setRatio("cinema 2.39");
  const cin = await shape();
  ok(cin.shape === "cinema" && Math.abs(cin.w / cin.h - 2.39) < 0.05, "cinema makes the frame extra wide (" + (cin.w / cin.h).toFixed(2) + ")");
  await setRatio("wide 16:9");
  ok((await shape()).shape === "wide", "back to wide");

  /* Guides (CapCut's Player guides): Guides ▾ in the transport bar, any combination, over my film only, in its
     frame shape, saved in the Screen's view, never an undo step, never in the way of a click. */
  {
    const gd = () => page.evaluate(() => {
      const f = document.querySelector(".sc-viewer.mine .sc-frame");
      const r = f.getBoundingClientRect();
      const o = f.querySelector(".sc-gd");
      const rel = (el) => { const b = el.getBoundingClientRect(); return { l: (b.left - r.left) / r.width, t: (b.top - r.top) / r.height, w: b.width / r.width, h: b.height / r.height }; };
      return {
        on: o ? [...o.querySelectorAll("[data-gd]")].map((g) => g.dataset.gd) : [],
        box: o && rel(o),
        thirds: o ? [...o.querySelectorAll('[data-gd="thirds"] .sc-gd-v')].map((e) => rel(e).l) : [],
        thirdsH: o ? [...o.querySelectorAll('[data-gd="thirds"] .sc-gd-h')].map((e) => rel(e).t) : [],
        golden: o ? [...o.querySelectorAll('[data-gd="golden"] .sc-gd-v')].map((e) => rel(e).l) : [],
        cross: o && o.querySelector(".sc-gd-cross") ? rel(o.querySelector(".sc-gd-cross")) : null,
        action: o && o.querySelector(".sc-gd-box.action") ? rel(o.querySelector(".sc-gd-box.action")) : null,
        title: o && o.querySelector(".sc-gd-box.title") ? rel(o.querySelector(".sc-gd-box.title")) : null,
        spot: o && o.querySelector(".sc-gd-spot") ? { el: rel(o.querySelector(".sc-gd-spot")), par: o.querySelector(".sc-gd-att").getAttribute("preserveAspectRatio"), cap: o.querySelector(".sc-gd-cap").textContent } : null,
        insp: document.querySelectorAll(".sc-viewer.insp .sc-gd").length,
        pe: o ? getComputedStyle(o).pointerEvents : null,
        shape: f.dataset.shape, w: r.width, h: r.height,
      };
    });
    const tick = (id) => page.click(`.sc-guides-menu [data-guide="${id}"]`);
    const near = (a, b, e) => Math.abs(a - b) < (e || 0.015);
    await page.evaluate(() => window.CurioScreen.setRow(1));
    ok(!!(await page.$('.sc-transport [data-act="guides-menu"]')) && !(await page.$(".sc-guides-menu")) && (await gd()).on.length === 0, "the transport bar has a Guides ▾ menu, closed, with nothing drawn yet");
    await page.click('[data-act="guides-menu"]');
    const items = await page.evaluate(() => [...document.querySelectorAll(".sc-guides-menu label")].map((l) => ({ id: l.querySelector("input").dataset.guide, tip: l.title, text: l.textContent.trim() })));
    ok(items.map((x) => x.id).join() === "thirds,center,safe,golden,attention" && items.every((x) => x.tip.startsWith(x.text + ":")), "it lists Thirds, Center cross, Safe areas, Golden ratio and Where attention is, each with a plain tooltip");
    const fp0 = await page.evaluate(() => window.CurioEngine.fingerprint());
    await tick("thirds");
    let g = await gd();
    ok(g.on.join() === "thirds" && g.thirds.length === 2 && near(g.thirds[0], 1 / 3) && near(g.thirds[1], 2 / 3) && near(g.thirdsH[0], 1 / 3) && near(g.thirdsH[1], 2 / 3), "Thirds draws two lines each way at a third and two thirds (" + g.thirds.map((x) => x.toFixed(3)).join(", ") + ")");
    ok(g.insp === 0, "guides draw over my film only, not the inspiration films");
    ok(!!(await page.$(".sc-guides-menu")), "the menu stays open while you tick");
    await tick("center");
    g = await gd();
    ok(g.cross && near(g.cross.l + g.cross.w / 2, 0.5) && near(g.cross.t + g.cross.h / 2, 0.5), "Center cross marks the middle");
    await tick("safe");
    g = await gd();
    ok(g.action && g.title && near(g.action.l, 0.05) && near(g.action.w, 0.9) && near(g.title.l, 0.1) && near(g.title.h, 0.8), "Safe areas draw the action box at 90% and the title box at 80%");
    await tick("golden");
    g = await gd();
    ok(g.golden.length === 2 && near(g.golden[0], 0.382) && near(g.golden[1], 0.618), "Golden ratio draws its lines at 38% and 62%");
    await tick("attention");
    g = await gd();
    ok(g.spot && g.spot.el.w > 0.05 && g.spot.el.l >= -0.2 && g.spot.el.l < 1 && /^Eyes on: /.test(g.spot.cap), "Where attention is glows on part of the picture (" + (g.spot && g.spot.cap) + ")");
    ok(g.on.join() === "thirds,center,safe,golden,attention" && g.thirds.length === 2 && g.cross && g.action, "all five combine at once");
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fp0, "guides change nothing in the film (no undo steps)");
    ok(JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-screen-v1")).guides)) === JSON.stringify(["thirds", "center", "safe", "golden", "attention"]), "the guides are kept in the Screen's view (curiosities-screen-v1, guides)");
    ok(g.pe === "none" && near(g.box.l, 0) && near(g.box.w, 1) && near(g.box.h, 1), "the overlay covers the frame exactly and lets clicks through");
    await page.screenshot({ path: path.join(SHOTS, "screen-8b-guides.png") });
    /* A click anywhere else closes the menu; a click on the frame still reaches it. */
    await page.click(".sc-viewer.insp .sc-frame");
    ok(!(await page.$(".sc-guides-menu")) && (await page.evaluate(() => window.CurioScreen.state().focus)) !== "mine", "a click outside closes the menu (and picks the inspiration film)");
    const hit = await page.evaluate(() => { const r = document.querySelector(".sc-viewer.mine .sc-frame").getBoundingClientRect(); const x = r.left + r.width / 3, y = r.top + r.height / 3; const el = document.elementFromPoint(x, y); return { x, y, inGd: !!el.closest(".sc-gd"), inFrame: !!el.closest(".sc-viewer.mine .sc-frame") }; });
    await page.mouse.click(hit.x, hit.y);
    ok(!hit.inGd && hit.inFrame && (await page.evaluate(() => window.CurioScreen.state().focus)) === "mine", "a click right where the thirds lines cross still reaches my film's frame");
    /* The guides follow the vertical frame shape. */
    await setRatio("vertical 9:16");
    g = await gd();
    ok(g.shape === "vertical" && g.h > g.w * 1.5 && near(g.box.w, 1) && near(g.box.h, 1) && near(g.thirds[0], 1 / 3) && near(g.action.w, 0.9) && near(g.cross.l + g.cross.w / 2, 0.5), `in the vertical frame the guides take its shape (${Math.round(g.w)}×${Math.round(g.h)})`);
    ok(g.spot && g.spot.par === "xMidYMid slice", "the attention glow is cropped with the picture, so it stays on the same spot");
    await page.screenshot({ path: path.join(SHOTS, "screen-8c-guides-vertical.png") });
    await setRatio("wide 16:9");
    /* A reload keeps them; turning them off clears them; ⌘; still flips the thirds guide. */
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
    await page.evaluate(() => window.CurioScreen.setRow(1));
    g = await gd();
    ok(g.on.join() === "thirds,center,safe,golden,attention", "the guides survive a reload");
    await page.click('[data-act="guides-menu"]');
    ok((await page.evaluate(() => [...document.querySelectorAll(".sc-guides-menu input")].filter((i) => i.checked).length)) === 5, "the menu shows them ticked after the reload");
    for (const id of ["thirds", "center", "safe", "golden", "attention"]) await tick(id);
    ok((await gd()).on.length === 0 && !(await page.$(".sc-viewer.mine .sc-gd")), "unticking every guide clears the frame");
    await page.click('[data-act="guides-menu"]');
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("Control+;");
    ok((await gd()).on.join() === "thirds", "⌘; turns the thirds guide on");
    await page.keyboard.press("Control+;");
    ok((await gd()).on.length === 0, "and off again");
  }

  /* Compare ◐ (CapCut's before/after compare slider): a toggle and a select in the transport bar split my film's
     frame; left of a draggable line is the film I'm learning from or my film when I opened the Screen. A view
     setting kept in curiosities-screen-v1 (compare), never an undo step, never in the way of a click. */
  {
    const cmp = () => page.evaluate(() => {
      const f = document.querySelector(".sc-viewer.mine .sc-frame");
      const r = f.getBoundingClientRect();
      const c = f.querySelector(".sc-cmp");
      const rel = (el) => { const b = el.getBoundingClientRect(); return { l: (b.left - r.left) / r.width, t: (b.top - r.top) / r.height, w: b.width / r.width, h: b.height / r.height }; };
      const line = c && c.querySelector("[data-cmp-line]");
      const pic = c && c.querySelector(".sc-cmp-pic svg");
      const lb = line && line.getBoundingClientRect();
      return {
        on: !!c, with: c && c.dataset.cmp, box: c && rel(c),
        lineX: lb ? (lb.left + lb.width / 2 - r.left) / r.width : null, lineY: lb ? lb.top + lb.height / 2 : null, lineCX: lb ? lb.left + lb.width / 2 : null,
        pic: pic ? pic.innerHTML : null, par: pic && pic.getAttribute("preserveAspectRatio"),
        main: f.querySelector(":scope > svg").innerHTML,
        insp: (document.querySelector(".sc-viewer.insp .sc-frame > svg") || {}).innerHTML,
        labels: c ? [...c.querySelectorAll(".sc-cmp-lab")].map((l) => ({ text: l.textContent, ...rel(l) })) : [],
        clip: c && c.querySelector(".sc-cmp-pic") ? getComputedStyle(c.querySelector(".sc-cmp-pic")).clipPath : null,
        pe: c ? getComputedStyle(c).pointerEvents : null,
        saved: (JSON.parse(localStorage.getItem("curiosities-screen-v1")) || {}).compare,
        sel: (document.querySelector(".sc-transport [data-compare-with]") || {}).value,
        shape: f.dataset.shape, w: r.width, h: r.height, left: r.left, top: r.top,
      };
    });
    const near = (a, b, e) => Math.abs(a - b) < (e || 0.02);
    await page.evaluate(() => window.CurioScreen.setRow(1));
    const fp0 = await page.evaluate(() => window.CurioEngine.fingerprint());
    const undo0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
    ok(!!(await page.$('.sc-transport [data-act="compare"]')) && !!(await page.$(".sc-transport select[data-compare-with]")) && !(await cmp()).on, "the transport bar has Compare ◐ and a select of what to compare with, off to start");
    ok((await page.evaluate(() => [...document.querySelectorAll(".sc-transport [data-compare-with] option")].map((o) => o.textContent).join("|"))) === "The film I'm learning from|When I opened the Screen", "the select offers the film I'm learning from and when I opened the Screen");
    /* Toggle on: the film I'm learning from at the matching moment, left of a line in the middle. */
    await page.click('.sc-transport [data-act="compare"]');
    let c = await cmp();
    ok(c.on && c.with === "insp" && near(c.box.l, 0) && near(c.box.w, 1) && near(c.box.h, 1) && near(c.lineX, 0.5), "Compare ◐ splits my film's frame with a line in the middle");
    ok(c.pic && c.pic === c.insp && c.pic !== c.main, "left of the line is the inspiration film's frame at the matching moment");
    ok(c.labels.length === 2 && /^Learning from: /.test(c.labels[0].text) && c.labels[0].l < 0.1 && c.labels[0].t < 0.15 && c.labels[1].text === "My film now" && c.labels[1].l + c.labels[1].w > 0.9 && c.labels[1].t < 0.15, "small labels at the top corners name each side (" + c.labels.map((l) => l.text).join(" / ") + ")");
    ok(c.pe === "none", "the split lets clicks through except on the line");
    const hit = await page.evaluate(() => { const r = document.querySelector(".sc-viewer.mine .sc-frame").getBoundingClientRect(); /* Halfway between the frame's left edge and the line's own grab area, so a narrow frame still has room. */ const ln = document.querySelector(".sc-viewer.mine .sc-cmp-line").getBoundingClientRect(); const el = document.elementFromPoint((r.left + ln.left) / 2, r.top + r.height * 0.6); return { inCmp: !!el.closest(".sc-cmp"), inFrame: !!el.closest(".sc-viewer.mine .sc-frame"), what: (() => { const a = []; let n = el; while (n && a.length < 5) { a.push((n.tagName || "") + "." + String((n.className && (n.className.baseVal ?? n.className)) || "")); n = n.parentElement; } return a.join(" < ") + " frame " + [r.left, r.top, r.width, r.height].map(Math.round).join(","); })() }; });
    ok(!hit.inCmp && hit.inFrame, "a click on the left picture still reaches my film's frame" + (hit.inFrame && !hit.inCmp ? "" : ` (hit ${hit.what})`));
    /* Drag the line. */
    await page.mouse.move(c.lineCX, c.lineY);
    await page.mouse.down();
    await page.mouse.move(c.left + c.w * 0.4, c.lineY, { steps: 3 });
    await page.mouse.move(c.left + c.w * 0.25, c.lineY, { steps: 3 });
    await page.mouse.up();
    c = await cmp();
    ok(near(c.lineX, 0.25) && near(c.saved.split, 25, 1.5) && /inset\(0(px)? 7[45]/.test(c.clip || ""), "dragging the line moves the split (" + (c.saved && c.saved.split) + "%, " + c.clip + ")");
    ok((await page.evaluate(() => window.CurioScreen.row())) === 1, "dragging the line doesn't move the playhead");
    /* Keyboard: focus the line and use ← →. */
    await page.focus(".sc-cmp [data-cmp-line]");
    const s0 = (await cmp()).saved.split;
    for (let k = 0; k < 3; k++) await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    c = await cmp();
    ok(near(c.saved.split, s0 + 4, 0.01) && near(c.lineX, (s0 + 4) / 100) && (await page.evaluate(() => window.CurioScreen.row())) === 1 && (await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute("data-cmp-line"))), "← → on the focused line move the split, not the playhead (" + c.saved.split + "%)");
    /* When I opened the Screen: the film as it was on open; a change since shows on the right only. */
    await page.evaluate(() => { const s = document.querySelector(".sc-transport [data-compare-with]"); s.value = "open"; s.dispatchEvent(new Event("change", { bubbles: true })); });
    c = await cmp();
    ok(c.with === "open" && c.sel === "open" && c.labels[0].text === "When I opened the Screen" && c.pic === c.main, "\"When I opened the Screen\" shows my film as it was then (no change yet, so the same picture)");
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fp0 && (await page.evaluate(() => window.CurioEngine.history().undo.length)) === undo0, "Compare changes nothing in the film and adds no undo steps");
    const before = c.pic;
    const changed = await page.evaluate(() => {
      const E = window.CurioEngine;
      const st = E.state();
      const t = st.tracks.find((x) => x.curiosities.includes("shotSize"));
      if (!t) return false;
      const row = st.rows[window.CurioScreen.row()].id;
      const now = E.value(row, t.id, "shotSize");
      return E.send({ type: "setPoint", row, track: t.id, curiosity: "shotSize", value: now === "insert" ? "wide" : "insert" }).ok;
    });
    c = await cmp();
    ok(changed && c.pic === before && c.main !== before, "after a change, the left still shows the film as it was and the right shows it now");
    await page.evaluate(() => window.CurioEngine.undo());
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fp0, "the film is back as it was");
    /* Guides sit over the split. */
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("Control+;");
    ok(await page.evaluate(() => { const c = document.querySelector(".sc-viewer.mine .sc-cmp"), g = document.querySelector(".sc-viewer.mine .sc-gd"); return !!(c && g && c.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING); }), "the guides are drawn over the split");
    await page.keyboard.press("Control+;");
    await page.screenshot({ path: path.join(SHOTS, "screen-8d-compare.png") });
    /* Saved across a reload. */
    const kept = (await cmp()).saved;
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
    await page.evaluate(() => window.CurioScreen.setRow(1));
    c = await cmp();
    ok(c.on && c.with === "open" && c.sel === "open" && near(c.lineX, kept.split / 100) && JSON.stringify(c.saved) === JSON.stringify(kept), "Compare, its choice and the split survive a reload (" + JSON.stringify(kept) + ")");
    /* The vertical frame: the split takes its shape and the left picture is cropped the same way. */
    await page.evaluate(() => { const s = document.querySelector(".sc-transport [data-compare-with]"); s.value = "insp"; s.dispatchEvent(new Event("change", { bubbles: true })); });
    await setRatio("vertical 9:16");
    c = await cmp();
    ok(c.shape === "vertical" && c.h > c.w * 1.5 && near(c.box.l, 0) && near(c.box.w, 1) && near(c.box.h, 1) && c.par === "xMidYMid slice" && near(c.lineX, kept.split / 100) && c.labels.every((l) => l.l >= -0.01 && l.l + l.w <= 1.01), `in the vertical frame the split takes its shape (${Math.round(c.w)}×${Math.round(c.h)})`);
    await page.screenshot({ path: path.join(SHOTS, "screen-8e-compare-vertical.png") });
    await setRatio("wide 16:9");
    /* Off again. */
    await page.click('.sc-transport [data-act="compare"]');
    ok(!(await cmp()).on && (await cmp()).saved.on === false, "Compare ◐ again turns it off");
  }

  /* Captions (CapCut's captions, from marker notes): a toggle and a select in the transport bar put the note of
     the moment at the playhead at the bottom of my film's frame, or a dimmer "What's happening" line when the
     moment has no note. A view setting kept in curiosities-screen-v1 (captions), never in the way of a click. */
  {
    const cap = () => page.evaluate(() => {
      const f = document.querySelector(".sc-viewer.mine .sc-frame");
      const r = f.getBoundingClientRect();
      const c = f.querySelector(".sc-cap");
      const p = c && c.querySelector("p");
      const b = p && p.getBoundingClientRect();
      const cs = p && getComputedStyle(p);
      return {
        on: !!(document.querySelector('.sc-transport [data-act="captions"]') || {}).classList?.contains("on"),
        kind: c ? c.dataset.cap : null, text: p ? p.textContent : null,
        box: b && { l: (b.left - r.left) / r.width, t: (b.top - r.top) / r.height, r: (b.right - r.left) / r.width, b: (b.bottom - r.top) / r.height },
        cx: b ? b.left + b.width / 2 : null, cy: b ? b.top + b.height / 2 : null,
        lines: cs ? Math.round(b.height / parseFloat(cs.lineHeight)) : 0,
        /* How many lines the note would take with no limit: a copy without the two-line clamp. */
        clipped: p ? (() => { const q = p.cloneNode(true); q.style.cssText = "display:block;-webkit-line-clamp:none;line-clamp:none;position:absolute;visibility:hidden;width:" + b.width + "px"; p.parentNode.appendChild(q); const n = Math.round(q.getBoundingClientRect().height / parseFloat(cs.lineHeight)); q.remove(); return n > 2; })() : false, clamp: cs ? cs.webkitLineClamp : null,
        fontPx: cs ? parseFloat(cs.fontSize) : 0, color: cs ? cs.color : null, auto: c ? !!c.querySelector(".sc-cap-auto") : false,
        pe: c ? [getComputedStyle(c).pointerEvents, cs.pointerEvents] : null, z: c ? getComputedStyle(c).zIndex : null,
        saved: (JSON.parse(localStorage.getItem("curiosities-screen-v1")) || {}).captions,
        mode: (document.querySelector(".sc-transport [data-captions-mode]") || {}).value,
        shape: f.dataset.shape, w: r.width, h: r.height,
      };
    });
    const rowId = (j) => page.evaluate((j) => window.CurioEngine.state().rows[j].id, j);
    const setMarks = (list) => page.evaluate((list) => { const t = window.CurioLanes.tools(); const ids = list.map((m) => m.row); t.markers = t.markers.filter((m) => !ids.includes(m.row)).concat(list); }, list);
    const ids = [await rowId(2), await rowId(3), await rowId(4), await rowId(5)];
    const marksBefore = await page.evaluate(() => JSON.stringify(window.CurioLanes.tools().markers));
    await page.evaluate((ids) => { const t = window.CurioLanes.tools(); t.markers = t.markers.filter((m) => !ids.includes(m.row)); }, ids);
    await setMarks([{ row: ids[0], color: "blue", note: "the joke lands" }, { row: ids[2], color: "red", note: "she finally says it" }, { row: ids[3], color: "purple", note: "Attention moves to the voice", auto: true }]);
    await page.evaluate(() => window.CurioScreen.setRow(2));
    const fp0 = await page.evaluate(() => window.CurioEngine.fingerprint());
    ok(!!(await page.$('.sc-transport [data-act="captions"]')) && !(await page.$(".sc-transport select[data-captions-mode]")) && !(await cap()).on && (await cap()).kind === null, "the transport bar has Captions, off to start, with no caption drawn (and no select taking room)");
    await page.click('.sc-transport [data-act="captions"]');
    ok((await page.evaluate(() => [...document.querySelectorAll(".sc-transport [data-captions-mode] option")].map((o) => o.textContent).join("|"))) === "My notes only|My notes and what changes", "turned on, a select next to it offers my notes only, or my notes and what changes");
    await page.evaluate(() => document.querySelector(".sc-viewer.mine .sc-frame").scrollIntoView({ block: "center" }));
    let c = await cap();
    ok(c.on && c.kind === "note" && c.text === "the joke lands" && c.saved.on === true && c.saved.mode === "notes", "Captions shows the marker's note on the playhead's moment (" + c.text + ")");
    ok(c.box && c.box.b > 0.75 && c.box.b <= 1 && c.box.l >= 0 && c.box.r <= 1 && Math.abs((c.box.l + c.box.r) / 2 - 0.5) < 0.03, "the caption sits at the bottom of my film's frame, centered, like a subtitle");
    ok(c.pe && c.pe.every((x) => x === "none"), "the caption lets every click through");
    const hit = await page.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y); return { inCap: !!el.closest(".sc-cap"), inFrame: !!el.closest(".sc-viewer.mine .sc-frame") }; }, { x: c.cx, y: c.cy });
    ok(!hit.inCap && hit.inFrame, "a click on the caption reaches my film's frame");
    await page.evaluate(() => window.CurioScreen.setRow(4));
    c = await cap();
    ok(c.kind === "note" && c.text === "she finally says it", "it changes with the playhead (" + c.text + ")");
    await page.evaluate(() => window.CurioScreen.setRow(3));
    ok((await cap()).kind === null, "with my notes only, a moment with no note has no caption");
    await page.evaluate(() => window.CurioScreen.setRow(5));
    c = await cap();
    ok(c.kind === "auto" && c.auto && /^Attention moves to the voice \(auto\)$/.test(c.text), "an auto marker's note shows too, marked (auto) (" + c.text + ")");
    /* A note written in the timeline shows right away, without moving the playhead. */
    await page.evaluate((id) => { window.CurioLanes.tools().markers.find((m) => m.row === id).note = "a turn I like"; window.CurioLanes.tools().markers.find((m) => m.row === id).auto = false; }, ids[3]);
    await page.click(".sc-transport .sc-tc");
    await page.waitForTimeout(50);
    c = await cap();
    ok(c.kind === "note" && c.text === "a turn I like", "a changed note shows in the caption right away (" + c.text + ")");
    /* My notes and what changes: a moment with no note gets a dimmer "What's happening" line. */
    const changed = await page.evaluate((id) => {
      const E = window.CurioEngine;
      const st = E.state();
      const t = st.tracks.find((x) => x.curiosities.includes("shotSize"));
      if (!t) return false;
      const before = E.value(st.rows[2].id, t.id, "shotSize");
      return E.send({ type: "setPoint", row: id, track: t.id, curiosity: "shotSize", value: before === "insert" ? "wide" : "insert" }).ok;
    }, ids[1]);
    await page.evaluate(() => window.CurioScreen.setRow(3));
    await page.evaluate(() => { const s = document.querySelector(".sc-transport [data-captions-mode]"); s.value = "changes"; s.dispatchEvent(new Event("change", { bubbles: true })); });
    c = await cap();
    ok(changed && c.kind === "hint" && /^What's happening .*Shot size: .+ → .+/.test(c.text) && c.mode === "changes" && c.saved.mode === "changes", "\"My notes and what changes\" shows what changed on a moment with no note (" + c.text + ")");
    const hintAlpha = (c.color.match(/[\d.]+/g) || []).map(Number)[3];
    ok(hintAlpha != null && hintAlpha < 0.9, "the \"What's happening\" line is dimmer than a note (" + c.color + ")");
    await page.evaluate(() => window.CurioScreen.setRow(2));
    ok((await cap()).text === "the joke lands", "a note still wins over what changes");
    await page.evaluate(() => window.CurioEngine.undo());
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fp0, "Captions change nothing in the film");
    /* Two lines at most, with an ellipsis. */
    await setMarks([{ row: ids[0], color: "blue", note: "the joke lands, and then the second joke lands on top of it, and the whole room falls apart laughing for a very long time while the camera holds still" }]);
    await page.evaluate(() => window.CurioScreen.setRow(2));
    c = await cap();
    ok(c.lines <= 2 && c.clipped && c.clamp === "2", "a long note keeps to two lines with an ellipsis (" + c.lines + " lines)");
    await page.screenshot({ path: path.join(SHOTS, "screen-8f-captions.png") });
    /* Saved across a reload (the markers are saved too, as the timeline saves them). */
    await setMarks([{ row: ids[0], color: "blue", note: "the joke lands" }]);
    await page.evaluate(() => localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(window.CurioLanes.tools())));
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
    await page.evaluate(() => window.CurioScreen.setRow(2));
    c = await cap();
    ok(c.on && c.mode === "changes" && JSON.stringify(c.saved) === JSON.stringify({ on: true, mode: "changes" }) && c.text === "the joke lands", "Captions and the choice survive a reload");
    /* The vertical frame: the caption stays inside its shape. */
    await setRatio("vertical 9:16");
    c = await cap();
    ok(c.shape === "vertical" && c.h > c.w * 1.5 && c.box && c.box.l >= 0 && c.box.r <= 1.001 && c.box.b <= 1 && c.box.b > 0.7 && c.lines <= 2 && c.fontPx >= 10, `in the vertical frame the caption stays inside its shape (${Math.round(c.w)}×${Math.round(c.h)}, ${c.fontPx}px)`);
    await page.screenshot({ path: path.join(SHOTS, "screen-8g-captions-vertical.png") });
    await setRatio("wide 16:9");
    /* It sits over the guides and under the Compare line. */
    await page.keyboard.press("Control+;");
    await page.click('.sc-transport [data-act="compare"]');
    ok(await page.evaluate(() => { const f = document.querySelector(".sc-viewer.mine .sc-frame"), c = f.querySelector(".sc-cap"), g = f.querySelector(".sc-gd"), l = f.querySelector(".sc-cmp-line"); return !!(c && g && l && g.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) && Number(getComputedStyle(c).zIndex) < Number(getComputedStyle(l).zIndex); }), "the caption is drawn over the guides and under the Compare line");
    await page.click('.sc-transport [data-act="compare"]');
    await page.keyboard.press("Control+;");
    /* Full player view (⇧⌘F) shows the caption too, bigger. */
    const small = (await cap()).fontPx;
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("Control+Shift+F");
    c = await cap();
    ok((await page.evaluate(() => document.querySelector(".sc-page").dataset.fullplayer === "1")) && c.text === "the joke lands" && c.fontPx > small, "the caption shows in full player view, bigger (" + c.fontPx + "px)");
    await page.keyboard.press("Escape");
    /* Off again, and the markers put back as they were. */
    await page.click('.sc-transport [data-act="captions"]');
    c = await cap();
    ok(!c.on && c.kind === null && c.saved.on === false, "Captions again turns them off");
    await page.evaluate((m) => { window.CurioLanes.tools().markers = JSON.parse(m); localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(window.CurioLanes.tools())); }, marksBefore);
  }

  /* Markers with a color and a note (CapCut's markers): add one, double-click its flag to write a note and pick
     a color, find it in the Markers list, jump to it, delete it; an old save (plain row ids) still loads. */
  {
    const MK = () => page.evaluate(() => window.CurioLanes.tools().markers);
    const rowId = (j) => page.evaluate((j) => window.CurioEngine.state().rows[j].id, j);
    const r2 = await rowId(2);
    await page.evaluate((id) => { const t = window.CurioLanes.tools(); t.markers = t.markers.filter((m) => m.row !== id); window.CurioScreen.setRow(2); }, r2);
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); const sc = document.querySelector(".sc-lanes .sl-scroll"); if (sc) sc.scrollLeft = 0; });
    await page.keyboard.press("m");
    let mk = (await MK()).find((m) => m.row === r2);
    ok(mk && mk.color === "orange" && mk.note === "", "M adds a marker that has a color (orange to start) and an empty note");
    const flag = '.sl-topsvg .sl-marker[data-marker="2"] path';
    await page.dblclick(flag);
    ok(!!(await page.$(".sl-mkpop")), "double-clicking a marker's flag opens its pop-up");
    ok((await page.$$(".sl-mkpop [data-mk-color]")).length === 6, "the pop-up offers six colors");
    await page.fill(".sl-mkpop [data-mk-note]", "the joke lands");
    await page.click('.sl-mkpop [data-mk-color="blue"]');
    await page.screenshot({ path: path.join(SHOTS, "screen-9-marker-popup.png") });
    await page.click('.sl-mkpop [data-l="done"]');
    mk = (await MK()).find((m) => m.row === r2);
    ok(!(await page.$(".sl-mkpop")) && mk && mk.note === "the joke lands" && mk.color === "blue", "Done keeps the note and the color");
    ok(await page.$eval('.sl-topsvg .sl-marker[data-marker="2"]', (g) => /the joke lands/.test(g.querySelector("title").textContent) && /#4dabf7/i.test(g.getAttribute("style"))), "the flag is drawn blue with the note as its tooltip");
    ok(/^the joke/.test(await page.$eval('.sl-topsvg .sl-marker[data-marker="2"] .sl-mklabel', (t) => t.textContent).catch(() => "")), "the note is written beside the flag when there is room");
    await page.dblclick(flag);
    await page.keyboard.press("Escape");
    ok(!(await page.$(".sl-mkpop")), "Esc closes the marker pop-up");
    /* The Markers list: jump to a marker. */
    await page.evaluate(() => window.CurioScreen.setRow(0));
    await page.click('[data-act="marker-list"]');
    const item = await page.$('.sl-marklist [data-mk-go="2"]');
    ok(item && /Moment 3/.test(await item.textContent()) && /the joke lands/.test(await item.textContent()) && !!(await item.$(".sl-mkdot")), "Markers ▾ lists the marker with its moment, color dot and note");
    await page.screenshot({ path: path.join(SHOTS, "screen-9b-marker-list.png") });
    await item.click();
    ok((await page.evaluate(() => window.CurioScreen.row())) === 2 && !(await page.$(".sl-marklist")), "clicking it in the list moves the playhead there");
    /* Right-click opens the same pop-up; Delete takes the marker off. */
    await page.click(flag, { button: "right" });
    ok(!!(await page.$(".sl-mkpop")), "right-clicking a flag opens its pop-up too");
    await page.click('.sl-mkpop [data-l="delete"]');
    ok(!(await MK()).some((m) => m.row === r2) && !(await page.$('.sl-topsvg .sl-marker[data-marker="2"]')), "Delete marker takes it off");
    /* An old save: a plain list of row ids. */
    const r4 = await rowId(4);
    await page.evaluate((id) => { const t = JSON.parse(localStorage.getItem("curiosities-screen-tools-v1")) || {}; t.markers = [id]; localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(t)); }, r4);
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
    const oldM = await MK();
    ok(oldM.length === 1 && oldM[0].row === r4 && oldM[0].color === "orange" && oldM[0].note === "" && !!(await page.$('.sl-topsvg .sl-marker[data-marker="4"]')), "an old saved marker list (plain row ids) still loads, as orange markers");
    await page.evaluate(() => { const t = window.CurioLanes.tools(); t.markers = []; localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(t)); window.CurioScreen.setRow(0); });
  }

  /* Auto markers (Mark the turns, the film's "Beats"): markers where attention moves, the feeling changes or a
     track jumps, each with a plain note; Clear auto markers takes only those off and a marker of your own stays. */
  {
    const MK = () => page.evaluate(() => window.CurioLanes.tools().markers);
    const r1 = await page.evaluate(() => window.CurioEngine.state().rows[1].id);
    await page.evaluate((id) => { const t = window.CurioLanes.tools(); t.markers = [{ row: id, color: "blue", note: "my own note" }]; localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(t)); window.CurioScreen.setRow(0); }, r1);
    /* The feeling: joyful for the first half of the film, anxious for the rest (one undo step, taken back below). */
    await page.evaluate(() => { const E = window.CurioEngine; const st = E.state(); const t = st.tracks.find((x) => x.curiosities.includes("emotion")); const half = Math.floor(st.rows.length / 2); E.send({ type: "batch", label: "test feeling", commands: st.rows.map((r, j) => ({ type: "setPoint", row: r.id, track: t.id, curiosity: "emotion", value: j < half ? "joyful" : "anxious" })) }); window.CurioScreen.setRow(0); });
    const rHalf = await page.evaluate(() => window.CurioEngine.state().rows[Math.floor(window.CurioEngine.state().rows.length / 2)].id);
    await page.click('[data-act="marker-list"]');
    ok(!!(await page.$('.sl-marklist [data-l="mark-turns"]')) && !(await page.$('.sl-marklist [data-l="clear-auto"]')), "Markers ▾ offers Mark the turns (and no Clear auto markers before there are any)");
    await page.click('.sl-marklist [data-l="mark-turns"]');
    const after = await MK();
    const auto = after.filter((m) => m.auto);
    console.log("     auto markers: " + auto.map((m) => m.color + " " + m.note).join(" | "));
    ok(auto.length >= 2 && auto.every((m) => m.note && ["purple", "red", "yellow"].includes(m.color)), "Mark the turns puts markers on the sample film, each with a color by kind and a note (" + auto.length + ")");
    const half = after.find((m) => m.row === rHalf);
    ok(half && half.auto && /feeling turns from joyful to anxious/.test(half.note), "where the feeling changes, the note says so in plain words (" + (half && half.note) + ")");
    ok(auto.some((m) => m.color === "purple" && /^attention moves from \S+.* to \S/.test(m.note)), "where attention moves to something else, a purple marker says from what to what");
    const own = after.find((m) => m.row === r1);
    ok(own && !own.auto && own.note === "my own note" && own.color === "blue" && after.filter((m) => m.row === r1).length === 1, "a marker of your own on a turn is kept as it is, not doubled");
    ok((await page.$$(".sl-topsvg .sl-marker")).length === after.length, "every auto marker is drawn as a flag on the ruler");
    ok(!!(await page.$(".sl-marklist .sl-mkauto")) && !!(await page.$('.sl-marklist [data-l="clear-auto"]')), "the list tags the auto markers and now offers Clear auto markers");
    await page.screenshot({ path: path.join(SHOTS, "screen-9c-auto-markers.png") });
    await page.click('.sl-marklist [data-l="mark-turns"]');
    ok((await MK()).length === after.length, "pressing Mark the turns again does not add duplicates");
    await page.click('.sl-marklist [data-l="clear-auto"]');
    const left = await MK();
    ok(left.length === 1 && left[0].row === r1 && left[0].note === "my own note", "Clear auto markers takes off only the auto ones; your marker survives");
    await page.keyboard.press("Escape");
    await page.evaluate(() => { window.CurioEngine.undo(); const t = window.CurioLanes.tools(); t.markers = []; localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(t)); window.CurioScreen.setRow(0); });
  }

  /* The Attention track (CapCut's waveform under the clips, for attention): a band right under My film's clip
     track with a colored block per moment, a filled line, a key; a click jumps there; the toolbar toggle hides it.
     Momentum's own Attention lane takes its place when it is docked, so it is taken off for these checks. */
  {
    const momLane = await page.evaluate(() => !!(window.CurioMomentumLane && window.CurioMomentumLane.attached && window.CurioMomentumLane.attached()));
    if (momLane) {
      ok(await page.evaluate(() => !document.querySelector(".sl-topsvg .sl-att") && !document.querySelector('[data-act="attention-track"]')), "with Momentum's Attention lane docked, the band and its toggle step aside (attention shows once)");
      await page.evaluate(() => { window.CurioMomentumLane.detach(); window.dispatchEvent(new Event("resize")); });
    }
    const band = () => page.evaluate(() => {
      const g = document.querySelector(".sl-topsvg .sl-att");
      if (!g) return null;
      const bg = g.querySelector(".sl-attbg").getBoundingClientRect();
      const mine = [...document.querySelectorAll(".sl-topsvg .sl-clip.mine rect")].map((r) => r.getBoundingClientRect());
      const ruler = document.querySelector(".sl-topsvg .sl-rulerbg");
      const blocks = [...g.querySelectorAll(".sl-attblock")];
      return { state: g.dataset.attTrack, top: bg.top, bottom: bg.bottom, mineBottom: mine.length ? Math.max(...mine.map((r) => r.bottom)) : null, rulerTop: ruler ? ruler.getBoundingClientRect().top : null, blocks: blocks.length, families: [...new Set(blocks.map((b) => b.dataset.family))], w: blocks[0] ? blocks[0].getBoundingClientRect().width : 0, title: blocks[0] ? blocks[0].querySelector("title").textContent : "", line: !!g.querySelector(".sl-attline") && !!g.querySelector(".sl-attarea"), html: g.innerHTML, keys: [...document.querySelectorAll(".sl-atthead .sl-attkey")].map((k) => k.textContent), note: (g.querySelector(".sl-attnote") || {}).textContent || "" };
    });
    await page.evaluate(() => { const t = window.CurioLanes.tools(); delete t.attention; localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(t)); window.CurioScreen.setRow(0); });
    const b0 = await band();
    ok(b0 && b0.state === "on" && b0.blocks > 0 && b0.line, "the Attention track is on by default: colored blocks and a filled line (" + (b0 && b0.blocks) + " blocks)");
    ok(b0 && b0.mineBottom != null && b0.top >= b0.mineBottom - 1 && b0.bottom <= b0.rulerTop + 1, "it sits right under My film's clip track, above the ruler");
    ok(b0 && b0.keys.length === b0.families.length && b0.keys.length > 0 && /attention is on .+\. How strongly the film pulls forward: \d+%/.test(b0.title), "the key names each family shown, and a block's tooltip names what holds attention (" + (b0 && b0.keys.join(", ")) + ")");
    const target = await page.evaluate(() => { const bl = [...document.querySelectorAll(".sl-topsvg .sl-attblock")].map((b) => Number(b.dataset.att)); return bl.find((j) => j >= 2) ?? bl[bl.length - 1]; });
    await page.click(`.sl-topsvg .sl-attblock[data-att="${target}"]`);
    ok((await page.evaluate(() => window.CurioScreen.row())) === target, "clicking the Attention track moves the playhead to that moment (" + target + ")");
    /* It follows zoom like the other tracks. */
    await page.click('[data-act="zoom-in"]');
    const bz = await band();
    ok(bz && bz.w > b0.w * 1.2, "zooming in widens its blocks with the moments (" + Math.round(b0.w) + "px to " + Math.round(bz.w) + "px)");
    await page.click('[data-act="zoom-fit"]');
    /* It redraws when nodes change: a feeling that swings every moment moves attention to Feeling. */
    await page.evaluate(() => { const E = window.CurioEngine; const st = E.state(); const t = st.tracks.find((x) => x.curiosities.includes("emotion")); E.send({ type: "batch", label: "test attention", commands: st.rows.map((r, j) => ({ type: "setPoint", row: r.id, track: t.id, curiosity: "emotion", value: j % 2 ? "joyful" : "anxious" })) }); });
    const b1 = await band();
    ok(b1 && b1.html !== bz.html && b1.families.includes("feeling"), "it redraws when nodes change (now: " + (b1 && b1.families.join(", ")) + ")");
    await page.evaluate(() => window.CurioEngine.undo());
    await page.screenshot({ path: path.join(SHOTS, "screen-9d-attention-track.png") });
    /* The toolbar toggle, kept in the timeline tools. */
    ok(await page.evaluate(() => document.querySelector('[data-act="attention-track"]').getAttribute("aria-pressed") === "true"), "the toolbar's Attention toggle shows it is on");
    await page.click('[data-act="attention-track"]');
    ok(!(await band()) && !(await page.$(".sl-atthead")) && (await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-screen-tools-v1")).attention === false)), "Attention off hides the track and is kept in curiosities-screen-tools-v1");
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
    if (momLane) {
      await page.waitForFunction(() => window.CurioMomentumLane && window.CurioMomentumLane.attached(), null, { timeout: 15000 });
      await page.evaluate(() => { window.CurioMomentumLane.detach(); window.dispatchEvent(new Event("resize")); });
    }
    ok(!(await band()), "it stays hidden after a reload");
    await page.click('[data-act="attention-track"]');
    ok((await band()).state === "on", "Attention on brings it back");
    /* Without the momentum code: nothing drawn, one plain line. */
    await page.evaluate(() => { window.__att = window.CurioAttention; delete window.CurioAttention; });
    await page.click('[data-act="attention-track"]');
    await page.click('[data-act="attention-track"]');
    const bn = await band();
    ok(bn && bn.state === "none" && bn.blocks === 0 && !bn.line && /isn't loaded/.test(bn.note), "without the momentum code it draws nothing and says so in one line");
    await page.evaluate(() => { window.CurioAttention = window.__att; delete window.__att; window.CurioScreen.setRow(0); });
    if (momLane) await page.evaluate(() => { window.CurioMomentumLane.attach(); window.dispatchEvent(new Event("resize")); });
  }

  /* Film lines: the inspiration film picked in the Player drawn as a faint dashed line in each lane (stretched
     to My film's length); they follow the picked film, the toolbar toggle hides them (kept across a reload), and
     Take from the film writes the film's settings into a selected area as nodes, one undo step. */
  {
    /* The picked film, read the way the Screen reads it: the viewer picked in the Player, else the first. */
    const expected = () => page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem("curiosities-screen-v1"));
      let list = window.CuriosityStudy && window.CuriosityStudy.studies ? window.CuriosityStudy.studies() : [];
      list = (list.length ? list : window.CuriosityDB.data.scenes).filter((f) => f && Array.isArray(f.beats) && f.beats.length);
      const v = p.insp.find((x) => x.id === p.focus) || p.insp[0];
      const f = list.find((x) => x.id === v.film) || list[0];
      const n = window.CurioEngine.state().rows.length;
      const name = String(f.title || f.name || f.id).replace(/^Model scene: /, "");
      const lanes = [...document.querySelectorAll(".sl-heads [data-pick]")].map((b) => b.dataset.pick);
      const want = {};
      lanes.forEach((cur) => { const k = window.CurioLanes.filmLine(f.beats, n, cur).filter((x) => x != null).length; if (k) want[cur] = k; });
      return { id: f.id, name, lanes, want };
    });
    const drawn = () => page.evaluate(() => [...document.querySelectorAll(".sl-svg .sl-film")].map((p) => ({ cur: p.dataset.filmLine, pts: (p.getAttribute("d").match(/[ML]/g) || []).length, title: p.querySelector("title").textContent, dash: getComputedStyle(p).strokeDasharray })));
    await page.evaluate(() => { const t = window.CurioLanes.tools(); delete t.filmLines; localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(t)); window.CurioScreen.setRow(0); });
    let ex = await expected();
    let d = await drawn();
    ok(ex.lanes.length > 0 && Object.keys(ex.want).length > 0 && d.length === Object.keys(ex.want).length, "Film lines are on by default: one dashed line per lane the inspiration film sets (" + d.length + " of " + ex.lanes.length + " lanes)");
    ok(d.every((x) => ex.want[x.cur] === x.pts && x.title.startsWith(ex.name) && x.dash !== "none"), "each line has a point at every moment the film has a setting, stretched to My film's length, named after " + ex.name);
    ok(ex.lanes.filter((c) => !ex.want[c]).every((c) => !d.some((x) => x.cur === c)), "a lane the film has no setting for draws no line (" + ex.lanes.filter((c) => !ex.want[c]).length + " such lanes)");
    const tip = await page.$eval('[data-act="film-lines"]', (b) => ({ t: b.title, on: b.getAttribute("aria-pressed"), text: b.textContent.trim() }));
    ok(tip.text === "Film lines" && tip.on === "true" && tip.t.includes(ex.name), "the toolbar's Film lines toggle is on and names the film in its tooltip");
    await page.screenshot({ path: path.join(SHOTS, "screen-9e-film-lines.png") });
    /* Pick another film in the Player: a second viewer on a different film, then its Inspect. */
    const firstId = ex.id;
    if ((await page.$$(".sc-viewer.insp")).length < 2) await page.click('[data-act="add-insp"]');
    const v2 = await page.$$eval(".sc-viewer.insp", (vs) => vs[1].dataset.viewer);
    await page.click(`[data-focus="${v2}"].sc-vname`);
    await page.waitForTimeout(100);
    ex = await expected();
    d = await drawn();
    ok(ex.id !== firstId && d.length === Object.keys(ex.want).length && d.every((x) => ex.want[x.cur] === x.pts && x.title.startsWith(ex.name)), "picking another inspiration film in the Player redraws the lines from that film (" + ex.name + ")");
    ok((await page.$eval('[data-act="film-lines"]', (b) => b.title)).includes(ex.name), "the tooltip follows the picked film");
    /* The toggle, kept in the timeline tools across a reload. */
    await page.click('[data-act="film-lines"]');
    ok((await drawn()).length === 0 && (await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-screen-tools-v1")).filmLines === false)), "Film lines off hides every line and is kept in curiosities-screen-tools-v1");
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
    ok((await drawn()).length === 0 && (await page.$eval('[data-act="film-lines"]', (b) => b.getAttribute("aria-pressed"))) === "false", "they stay hidden after a reload");
    await page.click('[data-act="film-lines"]');
    ok((await drawn()).length === Object.keys((await expected()).want).length, "Film lines on brings them back");
    /* Take from the film: select moments 1 to 4 of a lane the film sets, then press it. */
    ex = await expected();
    const cur = Object.keys(ex.want)[0];
    const box = await page.evaluate((c) => {
      const sc = document.querySelector(".sl-scroll");
      sc.scrollLeft = 0;
      const ly = document.querySelector(`.sl-svg .sl-film[data-film-line="${c}"]`).getBoundingClientRect();
      const bg = [...document.querySelectorAll(".sl-svg .sl-bg")].find((b) => { const r = b.getBoundingClientRect(); return r.top <= ly.top + 1 && r.bottom >= ly.bottom - 1; });
      sc.scrollTop = Math.max(0, bg.getBBox().y);
      const r = bg.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, n: window.CurioEngine.state().rows.length };
    }, cur);
    const cw = box.w / box.n;
    await page.focus(".sl");
    await page.keyboard.press("Escape");
    await page.mouse.move(box.x + cw * 0.1, box.y + 2);
    await page.mouse.down();
    await page.mouse.move(box.x + cw * 3.9, box.y + box.h - 2, { steps: 8 });
    await page.mouse.up();
    const takeBtn = await page.$('.sl [data-act="area-take"]');
    ok(!!takeBtn && (await takeBtn.textContent()).trim() === "Take from the film" && (await takeBtn.getAttribute("title")).includes(ex.name), "a selected area shows Take from the film, naming the film");
    const filmNow = () => page.evaluate(() => { const st = window.CurioEngine.state(); return JSON.stringify([Object.keys(st.lanes).sort().map((k) => [k, st.lanes[k]]), st.links]); });
    const before = await filmNow();
    await page.click('.sl [data-act="area-take"]');
    const got = await page.evaluate(({ c, id }) => {
      const st = window.CurioEngine.state();
      const lk = Object.keys(st.lanes).find((k) => k.endsWith("|" + c));
      let list = window.CuriosityStudy && window.CuriosityStudy.studies ? window.CuriosityStudy.studies() : [];
      list = (list.length ? list : window.CuriosityDB.data.scenes).filter((f) => f && Array.isArray(f.beats) && f.beats.length);
      const f = list.find((x) => x.id === id);
      const line = window.CurioLanes.filmLine(f.beats, st.rows.length, c);
      return { line: line.slice(0, 4).map(String), pts: st.rows.slice(0, 4).map((r) => (lk && st.lanes[lk].points[r.id] != null ? String(st.lanes[lk].points[r.id]) : "none")), msg: document.querySelector(".sl-msg").textContent };
    }, { c: cur, id: ex.id });
    ok(got.line.some((v) => v !== "null") && got.line.every((v, j) => v === "null" || v === got.pts[j]), "Take from the film writes the film's settings as nodes in the selection (" + got.pts.join(",") + " for " + got.line.join(",") + ")");
    ok(/^Took .+ Undo takes it back/.test(got.msg), "it says what it did in plain words (" + got.msg + ")");
    await page.keyboard.press("Control+z");
    ok((await filmNow()) === before, "one ⌘Z takes it all back");
    await page.focus(".sl");
    await page.keyboard.press("Escape");
  }

  /* Export ▾ (CapCut's Export button): the storyboard sheet in a new tab, this frame as PNG and SVG, the
     settings list as CSV. The anchor's click is stubbed so each download is recorded with its name and content. */
  {
    await page.evaluate(() => {
      window.__dl = [];
      const real = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (!this.download) return real.call(this);
        const rec = { name: this.download, href: this.href, size: 0, text: "" };
        window.__dl.push(rec);
        rec.done = fetch(this.href).then((r) => r.blob()).then(async (b) => { rec.size = b.size; rec.type = b.type; if (!/png/.test(b.type)) rec.text = await b.text(); });
      };
    });
    const r1 = await page.evaluate(() => window.CurioEngine.state().rows[1].id);
    await page.evaluate((id) => { const t = window.CurioLanes.tools(); t.markers = [{ row: id, color: "green", note: 'cut, then <b>"pause"</b>' }]; window.CurioScreen.setRow(1); }, r1);
    ok(!!(await page.$('.sc-bar [data-act="export"]')) && (await page.$eval('.sc-bar [data-act="export"]', (b) => b.textContent.trim())) === "Export ▾", "the top bar has an Export ▾ button");
    await page.click('.sc-bar [data-act="export"]');
    ok(await page.$eval(".sc-export-menu", (m) => !m.hidden && ["sheet", "png", "svg", "csv"].every((k) => m.querySelector(`[data-export="${k}"]`))), "Export ▾ opens a menu: Storyboard sheet, PNG, SVG, Settings list");
    await page.screenshot({ path: path.join(SHOTS, "screen-10-export-menu.png") });
    const n = await page.evaluate(() => window.CurioEngine.state().rows.length);
    const [sheet] = await Promise.all([page.waitForEvent("popup", { timeout: 10000 }), page.click('[data-export="sheet"]')]);
    await sheet.waitForLoadState();
    const info = await sheet.evaluate(() => ({ figs: document.querySelectorAll("figure.f").length, svgs: document.querySelectorAll("figure.f svg").length, notes: [...document.querySelectorAll(".mk")].map((p) => p.textContent), bold: document.querySelectorAll(".mk b").length, print: !!document.querySelector("[data-print]"), m2: (document.querySelectorAll("figure.f")[1] || {}).textContent || "" }));
    ok(info.figs === n && info.svgs === n, `the storyboard sheet opens in a new tab with one frame per moment (${info.figs} of ${n})`);
    ok(info.notes.length === 1 && info.notes[0] === 'cut, then <b>"pause"</b>' && info.bold === 0 && /Moment 2/.test(info.m2), "the marker's note shows on its moment, as plain text");
    await sheet.click('[data-per="2"]');
    ok(info.print && (await sheet.evaluate(() => getComputedStyle(document.querySelector(".grid")).gridTemplateColumns.split(" ").length)) === 2, "the sheet has a Print button and 2, 3 or 4 frames per row");
    await sheet.screenshot({ path: path.join(SHOTS, "screen-10b-storyboard-sheet.png") });
    await sheet.close();
    ok(await page.$eval(".sc-export-menu", (m) => m.hidden), "the menu closes after a pick");
    for (const k of ["svg", "png", "csv"]) {
      await page.click('.sc-bar [data-act="export"]');
      await page.click(`[data-export="${k}"]`);
    }
    await page.waitForFunction(() => window.__dl.length >= 3, null, { timeout: 10000 });
    await page.evaluate(() => Promise.all(window.__dl.map((d) => d.done)));
    const dl = await page.evaluate(() => window.__dl.map(({ name, href, size, type, text }) => ({ name, href, size, type, text })));
    console.log("     downloads: " + dl.map((d) => d.name + " (" + d.size + " bytes)").join(", "));
    const by = (ext) => dl.find((d) => d.name.endsWith("." + ext));
    ok(dl.every((d) => /^curiomatic-[a-z0-9-]+\.(svg|png|csv)$/.test(d.name) && d.href.startsWith("blob:")), "each download is a blob saved under a name starting with curiomatic-");
    ok(by("svg") && /moment-2\.svg$/.test(by("svg").name) && /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(by("svg").text), "This frame as SVG saves the current moment's frame");
    ok(by("png") && /moment-2\.png$/.test(by("png").name) && by("png").type === "image/png" && by("png").size > 2000, "This frame as PNG saves a picture of it");
    const rows = by("csv") ? by("csv").text.replace(/^﻿/, "").trim().split("\r\n") : [];
    ok(rows.length === n + 1 && /^Moment,Time,Marker note,/.test(rows[0]) && rows[2].includes('"cut, then <b>""pause""</b>"'), "the settings list has a header and one row per moment, with the marker note quoted (" + (rows[0] || "").slice(0, 80) + "…)");
    ok(rows[0].includes("Shot size") && !rows[0].includes("shotSize"), "the header uses plain labels, not code names");
    await page.evaluate(() => { const t = window.CurioLanes.tools(); t.markers = []; window.CurioScreen.setRow(0); });
  }

  /* History ▾ (the History panel of editing apps): the steps you can undo, newest first, under Now, and the steps
     you can redo over it. Clicking one presses undo or redo that many times, through the same path as ⌘Z. */
  {
    const rowsOf = () => page.evaluate(() => { const ts = [...document.querySelector(".sc-bar").children].filter((c) => !c.classList.contains("sc-what")).map((c) => Math.round(c.getBoundingClientRect().top)); return ts.sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 16).length; });
    ok(!!(await page.$('.sc-bar [data-act="history"]')) && (await page.$eval('.sc-bar [data-act="history"]', (b) => b.textContent.trim())) === "History ▾", "the top bar has a History ▾ button");
    ok((await rowsOf()) <= 2, "at 1440px the top bar still fits on two rows with History ▾ in it (" + (await rowsOf()) + ")");
    const fps = await page.evaluate(() => {
      const E = window.CurioEngine;
      const st = E.state();
      const track = (st.tracks.find((t) => t.curiosities.includes("shotSize")) || {}).id;
      const out = [E.fingerprint()];
      ["wide", "close", "insert"].forEach((v, i) => {
        E.send({ type: "setPoint", row: st.rows[2].id, track, curiosity: "shotSize", value: v, label: "History test " + "ABC"[i] });
        out.push(E.fingerprint());
      });
      return out;
    });
    const store = await page.evaluate(() => !!(window.CurioStore && window.CurioStore.external));
    await page.click('.sc-bar [data-act="history"]');
    const menu = () => page.evaluate(() => { const m = document.querySelector(".sc-hist-menu"); return { hidden: m.hidden, cur: (m.querySelector(".sc-hist-cur") || {}).textContent || "", undo: [...m.querySelectorAll('[data-hist^="undo"]')].map((b) => b.textContent), redo: [...m.querySelectorAll('[data-hist^="redo"]')].map((b) => b.textContent), text: m.textContent, now: !!m.querySelector(".sc-hist-now") }; });
    let mm = await menu();
    ok(!mm.hidden && mm.cur === "History test C" && mm.undo[0] === "History test B" && mm.undo[1] === "History test A" && mm.now, "History ▾ lists the steps newest first under Now, by their plain names (" + [mm.cur].concat(mm.undo.slice(0, 3)).join(" | ") + ")" + (store ? ", from the app-wide undo list" : ""));
    ok(!/Engine:/.test(mm.text), "the engine's steps show without a code prefix");
    const redoBefore = await page.evaluate(() => (window.CurioStore && window.CurioStore.external ? window.CurioStore : window.CurioEngine).history().redo.length);
    await page.click('.sc-hist-menu [data-hist="undo:2"]');
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fps[1], "clicking an older step goes back to just after it (two undos: the film is as it was after A)");
    ok((await page.evaluate(() => (window.CurioStore && window.CurioStore.external ? window.CurioStore : window.CurioEngine).history().redo.length)) === redoBefore + 2, "it pressed undo exactly twice on the same undo list ⌘Z uses");
    mm = await menu();
    ok(!mm.hidden && mm.cur === "History test A" && mm.redo.slice(-2).join() === "History test C,History test B", "the menu stays open and shows the redo part over Now, the next one nearest (" + mm.redo.slice(-2).join(" | ") + ")");
    await page.screenshot({ path: path.join(SHOTS, "screen-11-history.png") });
    await page.click('.sc-hist-menu [data-hist="redo:2"]');
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fps[3] && (await menu()).cur === "History test C" && !(await menu()).redo.length, "clicking a redo step goes forward to just after it (two redos)");
    await page.click('.sc-hist-menu [data-hist="undo:1"]');
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fps[2], "one step back is one undo");
    await page.keyboard.press("Control+Shift+z");
    await page.waitForFunction(() => (document.querySelector(".sc-hist-cur") || {}).textContent === "History test C", null, { timeout: 2000 }).catch(() => {});
    ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fps[3] && (await menu()).cur === "History test C", "⇧⌘Z redoes it and the open list follows");
    /* Refresh while open: a change to the film, and a step on the app-wide list from outside the Screen. */
    await page.evaluate(() => { const E = window.CurioEngine; const st = E.state(); E.send({ type: "setPoint", row: st.rows[3].id, track: (st.tracks.find((t) => t.curiosities.includes("shotSize")) || {}).id, curiosity: "shotSize", value: "wide", label: "History test D" }); });
    await page.waitForFunction(() => (document.querySelector(".sc-hist-cur") || {}).textContent === "History test D", null, { timeout: 3000 }).catch(() => {});
    mm = await menu();
    ok(!mm.hidden && mm.cur === "History test D" && mm.undo[0] === "History test C", "the open list refreshes when the film changes");
    if (store) {
      await page.evaluate(() => window.CurioStore.external("test", { label: "A change somewhere else", undo: () => true, redo: () => true }));
      await page.waitForFunction(() => (document.querySelector(".sc-hist-cur") || {}).textContent === "A change somewhere else", null, { timeout: 3000 }).catch(() => {});
      ok((await menu()).cur === "A change somewhere else", "and when a step lands on the app-wide list from elsewhere in the app");
      await page.evaluate(() => window.CurioStore.undo());
    }
    /* Keyboard: Esc closes and gives focus back; Enter opens with focus inside; arrows move. */
    await page.keyboard.press("Escape");
    ok((await menu()).hidden, "Esc closes History");
    await page.focus('.sc-bar [data-act="history"]');
    await page.keyboard.press("Enter");
    ok(!(await menu()).hidden && (await page.evaluate(() => !!document.activeElement.closest(".sc-hist-menu"))), "Enter on History ▾ opens it with focus on a step");
    const f1 = await page.evaluate(() => document.activeElement.dataset.hist);
    await page.keyboard.press("ArrowDown");
    const f2 = await page.evaluate(() => document.activeElement.dataset.hist);
    ok(f1 && f2 && f1 !== f2, "the arrow keys move through the steps (" + f1 + " → " + f2 + ")");
    await page.keyboard.press("Escape");
    ok((await menu()).hidden && (await page.evaluate(() => document.activeElement.dataset.act === "history")), "Esc closes it and focus goes back to History ▾");
    await page.click('.sc-bar [data-act="history"]');
    await page.mouse.click(700, 600);
    ok((await menu()).hidden, "a click anywhere else closes it");
    /* Empty state: nothing on either list. */
    await page.evaluate(() => { window.__h = [window.CurioStore && window.CurioStore.history, window.CurioEngine.history]; const none = () => ({ undo: [], redo: [] }); if (window.CurioStore) window.CurioStore.history = none; window.CurioEngine.history = none; });
    await page.click('.sc-bar [data-act="history"]');
    mm = await menu();
    ok(!mm.hidden && mm.text.trim() === "Nothing to undo yet." && !mm.undo.length && !mm.redo.length, "with nothing to undo it says so plainly");
    await page.evaluate(() => { if (window.CurioStore) window.CurioStore.history = window.__h[0]; window.CurioEngine.history = window.__h[1]; });
    await page.keyboard.press("Escape");
  }

  /* Phone width. */
  await page.setViewportSize({ width: 390, height: 900 });
  await page.click('[data-act="close"]');
  const reach = await page.evaluate(() => [...document.querySelectorAll(".tabs-top > *")].filter((el) => el.offsetParent !== null).map((el) => { const r = el.getBoundingClientRect(); return { id: el.id || el.className || el.textContent.trim().slice(0, 12), right: r.right }; }));
  ok(reach.every((x) => x.right <= 390), "on a phone every button in the bar's top row fits, Library included (" + reach.map((x) => x.id + ":" + Math.round(x.right)).join(", ") + ")");
  for (const w of [360, 320]) {
    await page.setViewportSize({ width: w, height: 900 });
    const over = await page.evaluate(() => { const t = document.querySelector(".tabs-top"); return Math.max(t.scrollWidth - t.clientWidth, ...[...t.children].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().right - t.getBoundingClientRect().right)); });
    ok(over <= 0.5, `at ${w}px the bar's top row fits (${Math.round(over)}px over)`);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.click("#lib-btn");
  await page.click('#lib-menu [data-screen="screen"]');
  ok(await page.evaluate(() => window.CurioScreen.isOpen()), "on a phone the Library opens the Screen");
  await page.click('button[data-view="screen"]');
  await page.screenshot({ path: path.join(SHOTS, "screen-6-phone.png") });
  const overflow = await page.evaluate(() => document.querySelector(".sc-page").scrollWidth - window.innerWidth);
  ok(overflow <= 1, "no sideways scroll on a phone (" + overflow + ")");
  const phoneHeads = await page.evaluate(() => [...document.querySelectorAll(".sl-heads .sl-ghead")].map((h) => { const c = h.querySelector(".sl-gcount"); const b = h.querySelector(".sl-fold"); return { text: h.textContent.replace(/\s+/g, " ").trim(), w: Math.round(h.getBoundingClientRect().width), fits: c.getBoundingClientRect().right <= h.getBoundingClientRect().right + 0.5 && c.scrollWidth <= c.clientWidth + 1, name: b.getBoundingClientRect().width, size: parseFloat(getComputedStyle(c).fontSize) }; }));
  ok(phoneHeads.length >= 1 && phoneHeads.every((h) => h.fits && h.name >= 24 && h.size >= 10), "on a phone the group headers still fit their narrower name column, counts in full and the name readable (" + phoneHeads.map((h) => h.text + " @" + h.w + "px").join(" | ") + ")");
  /* Pop-ups on a phone stay on screen: Guides ▾ and Suite clips ▾ never make the page scroll sideways. */
  {
    const sideways = () => page.evaluate(() => document.querySelector(".sc-page").scrollWidth - window.innerWidth);
    await page.click('[data-act="guides-menu"]');
    const gm = await page.evaluate(() => { const r = document.querySelector(".sc-guides-menu").getBoundingClientRect(); return { l: r.left, r: r.right }; });
    ok(gm.l >= 0 && gm.r <= 390 && (await sideways()) <= 1, "on a phone Guides ▾ opens on screen (" + Math.round(gm.l) + "–" + Math.round(gm.r) + "px)");
    await page.click('[data-act="guides-menu"]');
    await page.click('.sl [data-act="suite-list"]');
    await page.waitForTimeout(100);
    const sl = await page.evaluate(() => { const p = document.querySelector(".sl-suitelist").getBoundingClientRect(), s = document.querySelector(".sl").getBoundingClientRect(); return { r: p.right, edge: s.right }; });
    ok(sl.r <= sl.edge + 1 && (await sideways()) <= 1, "on a phone Suite clips ▾ stays inside the timeline (" + Math.round(sl.r) + " ≤ " + Math.round(sl.edge) + "px)");
    await page.focus(".sl");
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });

  /* Reload: the Screen comes back, the film is the same. */
  const fp = await page.evaluate(() => window.CurioEngine.fingerprint());
  await page.reload();
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
  ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fp, "the film survives a reload");
  /* The suite clip saved earlier is still there after the reload; Delete asks once more, then takes it off. */
  {
    const names = await page.evaluate(() => window.CurioLanes.suiteClips().map((c) => c.name));
    ok(names.join() === "the slower reveal" && (await page.evaluate(() => /Suite clips 1 ▾/.test(document.querySelector('[data-act="suite-list"]').textContent))), "the suite clip survives a reload (" + names.join(",") + ")");
    await page.click('.sl [data-act="suite-list"]');
    await page.click(".sl-suitelist [data-suite-delete]");
    ok((await page.$$(".sl-suitelist li")).length === 1 && (await page.$eval(".sl-suitelist [data-suite-delete]", (b) => b.textContent)) === "Delete for good?", "Delete asks once more before taking a clip off");
    await page.click(".sl-suitelist [data-suite-delete]");
    ok((await page.$$(".sl-suitelist li")).length === 0 && JSON.parse(await page.evaluate(() => localStorage.getItem("curiosities-suite-clips-v1"))).length === 0 && (await page.evaluate(() => window.CurioEngine.fingerprint())) === fp, "Delete takes the suite clip off the list and leaves the film alone");
    await page.keyboard.press("Escape");
  }
  await page.click('[data-act="close"]');
  ok(await page.evaluate(() => !window.CurioScreen.isOpen()), "Back to the app closes it");
  await page.click("[data-screen]");
  ok(await page.evaluate(() => window.CurioScreen.isOpen()), "the bar's Screen button opens it");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
