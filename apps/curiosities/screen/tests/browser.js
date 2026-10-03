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
    const el = document.querySelector('.sc-player > .sc-dock[data-panel="test-dock"]');
    return { added, r, told, text: el && el.textContent };
  });
  ok(hook.added && hook.text === "docked" && hook.r === 2 && hook.told >= 2, "other threads can dock a panel, read the playhead and hear every move");
  ok(await page.evaluate(() => /^00:00:00:06 /.test(document.querySelector(".sc-tc").textContent) === false && /00:00:00:00/.test(document.querySelector(".sc-tc").textContent)), "the clock starts at zero");
  await page.evaluate(() => { document.querySelector('.sc-dock[data-panel="test-dock"]').remove(); });

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

  /* Zoom and scroll, fine lines, area copy and paste, curves, curiosity windows (Jeremy, 20:26Z). */
  await page.click('[data-view="screen"]');
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
    ok((await page.$$('.sl [data-act^="area-"]')).length === 4, "a selected area shows Reverse, Flip, Stretch ×2 and Squeeze ½");
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
    ok(info.heads.length >= 2 && info.heads.every((h) => /\d+ lanes? · \d+ with nodes/.test(h.text)), "lanes are grouped under a header per category, each saying how many lanes it holds and how many have nodes (" + info.heads.map((h) => h.text.replace(/\s+/g, " ").trim()).join(" | ") + ")");
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
  await page.click('[data-view="screen"]');
  await page.click('.sc-viewer.mine .sc-vname');
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
  await page.click('[data-view="screen"]');
  await page.screenshot({ path: path.join(SHOTS, "screen-6-phone.png") });
  const overflow = await page.evaluate(() => document.querySelector(".sc-page").scrollWidth - window.innerWidth);
  ok(overflow <= 1, "no sideways scroll on a phone (" + overflow + ")");
  await page.setViewportSize({ width: 1440, height: 1000 });

  /* Reload: the Screen comes back, the film is the same. */
  const fp = await page.evaluate(() => window.CurioEngine.fingerprint());
  await page.reload();
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
  ok((await page.evaluate(() => window.CurioEngine.fingerprint())) === fp, "the film survives a reload");
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
