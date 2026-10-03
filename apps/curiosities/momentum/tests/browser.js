/* Momentum in a real browser: node apps/curiosities/momentum/tests/browser.js [--three <three.min.js>] [--shots <dir>]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   1. The app with momentum/load.js added (as index.html will once the app thread adds the line): the Library
      menu has Momentum; it opens; every film source reads; the meter, ring and timeline draw; Film rates
      measures a curated film; Momentum notes filters.
   2. Live: change My film while the meter follows it; the meter climbs while nothing changes.
   3. The standalone page, momentum/index.html, at phone width with no sideways scroll.
   4. The Screen (screen/, CapCut layout, with its Player): the momentum panel docks beside the Player, follows
      the playhead, its ribbon moves the playhead, "Make this move here" is one undo step, it folds to a slim
      meter, sits under the Player in the "Player on the right" layout, and fits a phone. Skipped when the
      Screen has no Player panel yet.
   The page must report no errors. Screenshots go to --shots (default: the system temp folder). */
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
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
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
let failed = 0;
const ok = (cond, text) => {
  console.log((cond ? "ok   " : "FAIL ") + text);
  if (!cond) failed++;
};

(async () => {
  const server = await serve();
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch();
  const errors = [];
  const three = arg("--three", "");
  async function newPage(viewport) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    return page;
  }

  /* 1. In the app. */
  const page = await newPage({ width: 1360, height: 900 });
  await page.goto(base + "index.html");
  const hasLine = await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'));
  if (!hasLine) {
    await page.evaluate(() => {
      const s = document.createElement("script");
      s.src = "momentum/load.js";
      document.body.appendChild(s);
    });
  }
  await page.waitForFunction(() => window.CurioMomentumUI, null, { timeout: 10000 });
  ok(await page.evaluate(() => !!document.querySelector("#lib-menu [data-momentum]")), "Library menu has Momentum");
  await page.evaluate(() => {
    document.getElementById("lib-btn").click();
  });
  await page.click("#lib-menu [data-momentum]");
  await page.waitForSelector(".mo-dlg[open] .mo-meter");
  ok(true, "Momentum opens with the meter");
  const sources = await page.$$eval('.mo-dlg select[data-m="source"] option', (o) => o.map((x) => x.value));
  ok(sources.includes("live") && sources.includes("board") && sources.some((s) => s.startsWith("study:")), `film sources: ${sources.length}`);
  for (const s of sources.filter((x) => x !== "live")) {
    await page.selectOption('.mo-dlg select[data-m="source"]', s);
    const drawn = await page.evaluate(() => ({ ring: !!document.querySelector(".mo-dlg .mo-pie svg, .mo-dlg .mo-empty"), tl: !!document.querySelector(".mo-dlg .mo-tl, .mo-dlg .mo-empty") }));
    ok(drawn.ring && drawn.tl, "reads " + s);
  }
  const study = sources.find((s) => s.startsWith("study:"));
  await page.selectOption('.mo-dlg select[data-m="source"]', study);
  const box = await page.$(".mo-dlg .mo-tl-band");
  const bb = await box.boundingBox();
  await page.mouse.move(bb.x + bb.width * 0.4, bb.y + 10);
  ok(await page.evaluate(() => !document.querySelector(".mo-dlg .mo-tip").hidden), "timeline hover shows a tooltip");
  await page.screenshot({ path: path.join(SHOTS, "momentum-attention.png"), fullPage: false });
  await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 600));
  await page.screenshot({ path: path.join(SHOTS, "momentum-attention-2.png"), fullPage: false });

  await page.click('.mo-dlg [data-tab="rates"]');
  const before = await page.$$eval(".mo-dlg .mo-rates tbody tr", (r) => r.length);
  await page.click(".mo-dlg [data-measure]");
  const after = await page.$$eval(".mo-dlg .mo-rates tbody tr", (r) => r.length);
  ok(after === before + 1, `measuring adds a row (${before} to ${after})`);
  ok(await page.evaluate(() => [...document.querySelectorAll(".mo-dlg .mo-badge")].some((b) => b.textContent === "measured")), "measured row is marked measured");
  await page.screenshot({ path: path.join(SHOTS, "momentum-rates.png") });

  await page.click('.mo-dlg [data-tab="notes"]');
  await page.fill('.mo-dlg input[data-m="nfind"]', "clothes");
  const notes = await page.$$eval(".mo-dlg .mo-note", (n) => n.length);
  ok(notes > 3, `notes filter for clothes: ${notes}`);
  await page.screenshot({ path: path.join(SHOTS, "momentum-notes.png") });

  /* Compass: points somewhere and makes a real move on My film. */
  await page.click('.mo-dlg [data-tab="compass"]');
  await page.selectOption('.mo-dlg select[data-m="source"]', "board");
  await page.waitForSelector(".mo-dlg .mo-compass-svg");
  ok(await page.evaluate(() => !!document.querySelector(".mo-dlg .mo-needle") && document.querySelectorAll(".mo-dlg .mo-opt").length >= 1), "compass draws a needle and options");
  const beforeVals = await page.evaluate(() => JSON.stringify(window.CuriosityBoard.values()));
  await page.click(".mo-dlg [data-compass-move]");
  const afterVals = await page.evaluate(() => JSON.stringify(window.CuriosityBoard.values()));
  const flashText = await page.evaluate(() => (document.querySelector(".mo-dlg .mo-flash") || {}).textContent || "");
  ok(beforeVals !== afterVals || /No control/.test(flashText), "Make this move changes My film (or says why not): " + flashText);
  await page.screenshot({ path: path.join(SHOTS, "momentum-compass.png") });

  /* On the engine: lanes for every moment and a suggestion the engine takes. */
  await page.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
  await page.fill('.mo-dlg input[data-m="limit"]', "6").catch(() => {});
  await page.evaluate(() => {
    const el = document.querySelector('.mo-dlg input[data-m="limit"]');
    if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.click('.mo-dlg [data-tab="engine"]');
  const cells = await page.$$eval(".mo-dlg .mo-lanes tbody tr:first-child td", (t) => t.length);
  const rows = await page.evaluate(() => window.CurioEngine.state().rows.length);
  ok(cells === rows && rows > 0, `attention lane has a cell per moment (${cells} of ${rows})`);
  const links0 = await page.evaluate(() => window.CurioEngine.state().links.length);
  if (await page.$(".mo-dlg [data-sugg]")) {
    await page.click(".mo-dlg [data-sugg]");
    ok((await page.evaluate(() => window.CurioEngine.state().links.length)) === links0 + 1, "a suggestion adds one engine link");
  } else ok(false, "a suggestion was offered at a 6 second limit");
  await page.screenshot({ path: path.join(SHOTS, "momentum-engine.png") });
  await page.evaluate(() => {
    const el = document.querySelector('.mo-dlg input[data-m="limit"]');
    if (el) {
      el.value = "";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  /* Perform: follows My film, sends to the bridge, opens the stage meter. */
  await page.click('.mo-dlg [data-tab="perform"]');
  await page.click('.mo-dlg [data-pf="start"]');
  await page.evaluate(() => {
    const B = window.CuriosityBoard;
    const c = CURIOSITIES.find((x) => x.live && Array.isArray(x.options) && x.options.length > 2);
    B.set(c.id, c.options[1]);
  });
  await page.waitForTimeout(600);
  const bridge = await page.evaluate(() => window.CurioBridge.values().filter((m) => m.key && m.key.startsWith("m:")).map((m) => m.key));
  ok(bridge.length === 5, "bridge carries the meter: " + bridge.join(", "));
  await page.click('.mo-dlg [data-pf="stage"]');
  await page.waitForSelector(".mo-stage[open] .mo-stage-fam");
  await page.screenshot({ path: path.join(SHOTS, "momentum-stage.png") });
  await page.click(".mo-stage [data-stage-close]");
  ok(await page.evaluate(() => !document.querySelector(".mo-stage").open), "stage meter closes");
  await page.click('.mo-dlg [data-pf="stop"]');
  await page.screenshot({ path: path.join(SHOTS, "momentum-perform.png") });

  /* 2. Live. */
  await page.click('.mo-dlg [data-tab="attention"]');
  await page.selectOption('.mo-dlg select[data-m="source"]', "live");
  await page.evaluate(() => {
    const B = window.CuriosityBoard;
    const live = CURIOSITIES.filter((c) => c.live && Array.isArray(c.options));
    live.slice(0, 3).forEach((c) => B.set(c.id, c.options[c.options.length - 1]));
  });
  await page.waitForTimeout(2300);
  const climb = await page.evaluate(() => document.querySelector(".mo-dlg .mo-meter").getAttribute("aria-valuenow"));
  ok(Number(climb) >= 2, `live meter climbs while nothing changes (${climb} s)`);
  await page.keyboard.press("Escape");

  /* 3. Standalone, phone width. */
  const phone = await newPage({ width: 375, height: 800 });
  await phone.goto(base + "momentum/index.html");
  await phone.waitForSelector(".mo-meter");
  const wide = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(wide <= 0, `no sideways scroll at phone width (${wide}px over)`);
  await phone.screenshot({ path: path.join(SHOTS, "momentum-phone.png"), fullPage: true });

  /* 4. Beside the Screen's Player. */
  const sp = await newPage({ width: 1440, height: 900 });
  await sp.goto(base + "index.html?screen=1");
  if (!(await sp.evaluate(() => document.querySelector('script[src="momentum/load.js"]')))) {
    await sp.evaluate(() => {
      const s = document.createElement("script");
      s.src = "momentum/load.js";
      document.body.appendChild(s);
    });
  }
  await sp.waitForFunction(() => window.CurioMomentumScreen && window.CurioScreen, null, { timeout: 10000 }).catch(() => {});
  await sp.evaluate(() => window.CurioScreen && !window.CurioScreen.isOpen() && window.CurioScreen.open());
  const hasPlayer = await sp.waitForSelector(".sc-page .sc-player", { timeout: 5000 }).then(() => true, () => false);
  if (!hasPlayer) console.log("skip the Screen has no Player panel here (it arrives with the CapCut layout)");
  else {
    await sp.waitForSelector(".sc-player > .mo-sp .mo-sp-film", { timeout: 8000 });
    const side = await sp.evaluate(() => {
      const p = document.querySelector(".sc-player").getBoundingClientRect();
      const m = document.querySelector(".sc-player > .mo-sp").getBoundingClientRect();
      const v = document.querySelector(".sc-player > .sc-viewers").getBoundingClientRect();
      return { inside: m.right <= p.right + 1 && m.left >= p.left - 1, beside: m.left >= v.right - 1, w: Math.round(m.width) };
    });
    ok(side.inside && side.beside, `momentum panel sits beside the Player's viewers (${side.w}px wide)`);
    const films = await sp.evaluate(() => [document.querySelectorAll(".mo-sp .mo-sp-film").length, document.querySelectorAll(".sc-viewer").length]);
    ok(films[0] === films[1], `one meter per viewer (${films[0]} meters, ${films[1]} viewers)`);
    const subOf = () => sp.evaluate(() => document.querySelector('.mo-sp .mo-sp-film[data-kind="mine"] .mo-sp-name small').textContent);
    const before = await subOf();
    await sp.click('.sc-transport [data-act="next"]');
    await sp.waitForTimeout(150);
    const after = await subOf();
    ok(before !== after && /moment 2 of/.test(after), `panel follows the playhead (${before} → ${after})`);
    const rib = await sp.$('.mo-sp-rib[data-rib="mine"]');
    const box = await rib.boundingBox();
    await sp.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
    await sp.waitForTimeout(150);
    const jumped = await sp.evaluate(() => [/moment (\d+) of (\d+)/.exec(document.querySelector(".sc-viewer.mine .sc-vsub").textContent), document.querySelector('.mo-sp .mo-sp-film[data-kind="mine"] .mo-sp-name small').textContent]);
    ok(jumped[0] && Number(jumped[0][1]) > 2 && jumped[1].includes("moment " + jumped[0][1] + " of"), `ribbon moves the playhead (to ${jumped[0] && jumped[0][1]})`);
    const n0 = await sp.evaluate(() => window.CurioEngine.history().undo.length);
    const hasMove = await sp.$(".mo-sp [data-mo-sp=move]");
    if (hasMove) {
      await hasMove.click();
      await sp.waitForTimeout(150);
      const moved = await sp.evaluate(() => [window.CurioEngine.history().undo.length, window.CurioEngine.history().undo.slice(-1)[0] || "", document.querySelector(".mo-sp-flash") && document.querySelector(".mo-sp-flash").textContent]);
      ok(moved[0] === n0 + 1 && /Momentum: move attention/.test(String(moved[1])), `"Make this move here" is one undo step (${moved[1]})`);
      await sp.screenshot({ path: path.join(SHOTS, "momentum-screen.png") });
      await sp.evaluate(() => window.CurioEngine.undo());
      ok((await sp.evaluate(() => window.CurioEngine.history().undo.length)) === n0, "undo takes the move back");
    } else ok(false, "the Compass offers a move");
    await sp.click(".mo-sp [data-mo-sp=fold]");
    const slim = await sp.evaluate(() => [document.querySelector(".mo-sp").classList.contains("folded"), Math.round(document.querySelector(".mo-sp").getBoundingClientRect().width)]);
    ok(slim[0] && slim[1] <= 40, `folds to a slim meter (${slim[1]}px)`);
    await sp.click(".mo-sp [data-mo-sp=fold]");
    if (await sp.$("select[data-pick-layout]")) {
      await sp.selectOption("select[data-pick-layout]", "right");
      await sp.waitForTimeout(150);
      const under = await sp.evaluate(() => {
        const m = document.querySelector(".sc-player > .mo-sp").getBoundingClientRect();
        const t = document.querySelector(".sc-player > .sc-transport").getBoundingClientRect();
        return m.top >= t.bottom - 1;
      });
      ok(under, "in the Player-on-the-right layout the panel sits under the Player");
      await sp.screenshot({ path: path.join(SHOTS, "momentum-screen-right.png") });
      await sp.selectOption("select[data-pick-layout]", "center");
    }
    await sp.setViewportSize({ width: 390, height: 844 });
    await sp.waitForTimeout(200);
    const over = await sp.evaluate(() => {
      const pg = document.querySelector(".sc-page");
      const m = document.querySelector(".mo-sp").getBoundingClientRect();
      return [pg.scrollWidth - pg.clientWidth, Math.round(m.width)];
    });
    ok(over[0] <= 0 && over[1] > 200, `fits a phone under the Player (${over[0]}px over, ${over[1]}px wide)`);
    await sp.evaluate(() => document.querySelector(".mo-sp").scrollIntoView());
    await sp.screenshot({ path: path.join(SHOTS, "momentum-screen-phone.png") });
  }

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})();
