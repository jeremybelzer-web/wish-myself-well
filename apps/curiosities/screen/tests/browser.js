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
  await page.click('.sl-mode[data-lk$="|transitionKind"]');
  ok(await page.evaluate(() => { const st = window.CurioEngine.state(); const lk = Object.keys(st.lanes).find((k) => k.endsWith("|transitionKind")); return st.lanes[lk].mode === "hold"; }), "a lane can jump between nodes instead of gliding");
  await page.click('[data-icat="transitions"]');
  await page.click('[data-group="suite"]');
  ok((await page.$$('.sc-card[data-card="suite"]')).length >= 1, "the sidebar opens the category's suites");
  await page.fill("[data-lib-search]", "freeze");
  ok(await page.$('[data-pick-card="curiosity|freezeFrame"]'), "the library search finds curiosities in any category");
  await page.fill("[data-lib-search]", "");
  await page.click('[data-act="clear-lanes"]');
  await page.screenshot({ path: path.join(SHOTS, "screen-1b-transitions.png") });

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
