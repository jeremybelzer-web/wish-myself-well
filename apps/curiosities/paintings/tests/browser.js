/* The Paintings menu in a real browser: node apps/curiosities/paintings/tests/browser.js [--shots dir]
   (needs Playwright and Chromium).

   Paint ▾ sits in the Viewer's bar and opens the Paintings window: 62 rows, the painting in force lit. A click
   on a row chooses it, lights it and is one undo step; Undo puts the one before back. A random opening painting
   is not saved with the project until a click or Keep it with this project; Keep these colours as the default
   survives a reload, Back to random forgets it. Control-click on empty space opens the paint strip along the
   edge away from the click, with seven rows (the painting in force first), and Control-click closes it. Pick a
   swatch, click a thing: it takes exactly that hex in one undo step, and keeps it after moving and a reload.
   Forget the colours puts the thing's own colour back. No page errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", "");
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

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
  const base = `http://127.0.0.1:${server.address().port}/index.html?viewer=1`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const L = (f, a) => page.evaluate(f, a);
  const ready = async () => {
    await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioPaintings && document.querySelector(".cv-bar .cvp-btn"), null, { timeout: 30000 });
    await page.waitForTimeout(300);
  };
  const fresh = async (keepPref) => {
    await L((k) => {
      localStorage.removeItem("curiosities-viewer-v1");
      localStorage.removeItem("curiosities-viewer-windows-v1");
      if (!k) localStorage.removeItem("curio-paintings-default-v1");
    }, !!keepPref);
    await page.reload();
    await ready();
  };
  const saved = () => L(() => JSON.parse(localStorage.getItem("curiosities-viewer-v1") || "{}"));
  const settle = () => page.waitForTimeout(400);
  const undo = async () => {
    await page.click('.cv-bar [data-act="undo"]');
    await page.waitForTimeout(150);
  };

  await page.goto(base);
  await fresh(false);

  /* ---- the window ---- */
  const s0 = await L(() => CurioPaintings.inForce());
  ok(s0.from === "opening", "a new project opens on a random painting: " + s0.name);
  await page.click(".cv-bar .cvp-btn");
  await page.click('.cvp-menu [data-m="win"]');
  ok(await L(() => CurioPaintings.isOpen()), "Paint ▾ ▸ Paintings opens the window");
  ok((await L(() => document.querySelectorAll(".cvp-win .cvp-row").length)) === 62, "the window lists all 62 paintings");
  ok((await L(() => [...document.querySelectorAll(".cvp-win .cvp-row .cvp-sw")].every((s) => s.children.length === 5))), "every row has a five-colour swatch");
  ok((await L(() => [...document.querySelectorAll(".cvp-win .cvp-row.on")].map((r) => +r.dataset.pick))).join() === String(s0.i), "the painting in force is the one lit row");
  ok(/picked at random for this opening/.test(await L(() => document.querySelector(".cvp-hint").textContent)), "the hint line says it was picked at random");
  ok(/a random painting/.test(await L(() => document.querySelector(".cvp-defaults").textContent)), "the default row says: At every opening: a random painting");
  const sw = await L(() => [...document.querySelectorAll('.cvp-row[data-pick="0"] .cvp-sw i')].map((i) => getComputedStyle(i).backgroundColor));
  ok(sw.join() === ["rgb(242, 99, 134)", "rgb(245, 136, 175)", "rgb(164, 217, 132)", "rgb(252, 188, 82)", "rgb(253, 129, 78)"].join(), "Flowers, 1964 shows its own five colours, in order");
  ok(!("painting" in (await saved())), "nothing about the painting is in the saved film yet");

  /* grouped by kind */
  const groups = await L(() => [...document.querySelectorAll(".cvp-win .cvp-group")].map((h) => h.textContent));
  const ids = await L(() => [...document.querySelectorAll(".cvp-win .cvp-row")].map((r) => +r.dataset.pick));
  ok(groups.length >= 8 && new Set(ids).size === 62 && groups[0] === "Neon", "All shows the paintings grouped by kind, each once: " + groups.join(", "));
  await page.click('.cvp-win [data-kind="Neon"]');
  const neon = await L(() => [...document.querySelectorAll(".cvp-win .cvp-row")].map((r) => CurioPaintings.list()[+r.dataset.pick].tags.includes("Neon")));
  ok(neon.length === 9 && neon.every(Boolean), "the Neon chip shows the 9 neon paintings together");
  await page.click('.cvp-win [data-kind="Neutral"]');
  const neutral = await L(() => [...document.querySelectorAll(".cvp-win .cvp-row")].map((r) => CurioPaintings.list()[+r.dataset.pick].tags.includes("Neutral")));
  ok(neutral.length === 41 && neutral.every(Boolean), "the Neutral chip shows the 41 neutral ones together");
  await page.click('.cvp-win [data-kind="all"]');
  ok((await L(() => document.querySelectorAll(".cvp-win .cvp-row").length)) === 62, "All shows the 62 again");

  const pick = s0.i === 9 ? 10 : 9;
  const cols0 = await L(() => CurioViewer.live().film.objects.map((o) => o.color));
  await page.click(`.cvp-row[data-pick="${pick}"]`);
  await settle();
  const s1 = await L(() => CurioPaintings.inForce());
  ok(s1.i === pick && s1.from === "project", "a click on a row chooses that painting: " + s1.name);
  ok((await L(() => [...document.querySelectorAll(".cvp-win .cvp-row.on")].map((r) => +r.dataset.pick))).join() === String(pick), "and lights its row");
  ok((await saved()).painting === pick, "a chosen painting is saved with the project");
  ok(new RegExp("take the colours of " + s1.name).test(await L(() => document.querySelector(".cvp-status").textContent)), "the status line says My film: N things take the colours of <name> — <artist>");
  const cols1 = await L(() => CurioViewer.live().film.objects.map((o) => o.color));
  ok(cols1.length > 0 && cols1.every((c, k) => c === s1.colors[k % 5]), "choosing a painting recolours every thing in the film with its five, in turn: " + cols1.join(" "));
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "paintings-window.png") });
  await undo();
  const s2 = await L(() => CurioPaintings.inForce());
  ok(s2.i === s0.i && s2.from === "opening", "one Undo puts the painting before back");
  const cols2 = await L(() => CurioViewer.live().film.objects.map((o) => o.color));
  ok(cols2.join() === cols0.join(), "and the same Undo puts the things' own colours back: " + cols2.join(" "));
  ok((await L(() => [...document.querySelectorAll(".cvp-win .cvp-row.on")].map((r) => +r.dataset.pick))).join() === String(s0.i), "and the lit row follows");

  /* ---- Keep it with this project ---- */
  await page.click('.cvp-win [data-cvp="keep"]');
  await settle();
  ok((await L(() => CurioPaintings.inForce())).from === "project" && (await saved()).painting === s0.i, "Keep it with this project saves the random painting");
  ok(!(await L(() => !!document.querySelector('.cvp-win [data-cvp="keep"]'))), "and Keep it with this project goes away");
  await page.reload();
  await ready();
  const s3 = await L(() => CurioPaintings.inForce());
  ok(s3.i === s0.i && s3.from === "project", "a project that saved a painting opens on it");

  /* ---- Another random painting ---- */
  await L(() => CurioPaintings.open());
  await page.click('.cvp-win [data-cvp="random"]');
  await settle();
  const s4 = await L(() => CurioPaintings.inForce());
  ok(s4.i !== s0.i && s4.from === "now", "Another random painting jumps to a different one: " + s4.name);
  ok(!("painting" in (await saved())), "and it is not kept with the project");
  ok(await L(() => !!document.querySelector('.cvp-win [data-cvp="keep"]')), "Keep it with this project shows again");
  await undo();
  ok((await L(() => CurioPaintings.inForce())).i === s0.i, "one Undo takes Another random painting back");
  await L(() => CurioPaintings.anotherRandom());
  await settle();
  await page.reload();
  await ready();
  ok((await L(() => CurioPaintings.inForce())).from === "opening", "a random pick is forgotten at the next opening");

  /* ---- the default ---- */
  await fresh(false);
  const r0 = await L(() => CurioPaintings.inForce());
  await L(() => CurioPaintings.open());
  await page.click('.cvp-win [data-cvp="default"]');
  ok((await L(() => CurioPaintings.defaultIndex())) === r0.i, "Keep these colours as the default remembers it");
  ok(/the default ✓/.test(await L(() => document.querySelector(".cvp-defaults").textContent)), "the row says: the default ✓");
  ok(!(await saved()).painting, "the default is not put in the project");
  await fresh(true);
  const r1 = await L(() => CurioPaintings.inForce());
  ok(r1.i === r0.i && r1.from === "default", "the default survives a restart: " + r1.name);
  await L(() => CurioPaintings.open());
  ok(await L(() => !!document.querySelector('.cvp-win [data-cvp="unkeep"]')), "Back to random is offered");
  await page.click('.cvp-win [data-cvp="unkeep"]');
  ok((await L(() => CurioPaintings.defaultIndex())) === null, "Back to random forgets the default");
  await page.reload();
  await ready();
  ok((await L(() => CurioPaintings.inForce())).from === "opening", "and the next opening is random again");
  await L(() => CurioPaintings.close());

  /* ---- the paint strip ---- */
  /* find empty space and a thing in My film's picture */
  const spots = await L(() => {
    const c = CurioViewer.live().canvas;
    const r = c.getBoundingClientRect();
    let empty = null;
    let lowEmpty = null;
    let thing = null;
    for (let y = r.top + 20; y < r.bottom - 20; y += 12)
      for (let x = r.left + 20; x < r.right - 20; x += 12) {
        if (document.elementFromPoint(x, y) !== c) continue;
        const p = CurioViewer.pickAt({ clientX: x, clientY: y });
        if (!p && y < r.top + r.height * 0.4 && !empty) empty = { x, y };
        if (!p && y > r.top + r.height * 0.6 && !lowEmpty) lowEmpty = { x, y };
        if (p && p.obj && !thing && y > r.top + r.height * 0.3 && y < r.bottom - r.height * 0.3) thing = { x, y, id: p.obj };
      }
    return { empty, lowEmpty, thing };
  });
  ok(!!(spots.empty && spots.lowEmpty && spots.thing), "found empty space and a thing in the picture");
  const ctrlClick = async (p) => {
    await page.keyboard.down("Control");
    await page.mouse.click(p.x, p.y);
    await page.keyboard.up("Control");
    await page.waitForTimeout(150);
  };
  await ctrlClick(spots.lowEmpty);
  ok(await L(() => CurioPaintings.stripOpen()), "Control-click on empty space opens the paint strip");
  ok((await L(() => document.querySelector(".cvp-strip").dataset.side)) === "top", "clicked in the lower half, it lies along the top");
  ok(await L(() => !!document.querySelector(".cv-win.is-mine .cvp-strip")), "it is in My film's window");
  const rows = await L(() => [...document.querySelectorAll(".cvp-strip .cvp-srow")].map((r) => +r.dataset.row));
  const f0 = (await L(() => CurioPaintings.inForce())).i;
  ok(rows.length === 7 && rows[0] === f0 && rows[1] === (f0 + 1) % 62 && rows[6] === (f0 + 6) % 62, "seven rows: the painting in force first, then the next six");
  ok((await L(() => [...document.querySelectorAll(".cvp-strip .cvp-srow")].every((r) => r.querySelectorAll(".cvp-cell").length === 5))), "each row has five swatches");
  const cell = await L(() => {
    const b = document.querySelector(".cvp-strip .cvp-cell").getBoundingClientRect();
    return [Math.round(b.width), Math.round(b.height)];
  });
  ok(cell.join() === "36,22", "a swatch is 36 × 22: " + cell.join(" × "));
  ok(/THE PAINT/.test(await L(() => document.querySelector(".cvp-head").textContent)) && /no colour held/.test(await L(() => document.querySelector(".cvp-head").textContent)), "the head line says THE PAINT and no colour held");
  await ctrlClick(spots.lowEmpty);
  ok(!(await L(() => CurioPaintings.stripOpen())), "Control-click again closes it");
  await page.waitForTimeout(600);
  await ctrlClick(spots.empty);
  ok((await L(() => document.querySelector(".cvp-strip").dataset.side)) === "bottom", "clicked in the upper half, it lies along the bottom");

  /* pick a colour, click a thing */
  await page.click('.cvp-strip .cvp-srow:nth-child(1) .cvp-cell:nth-child(4)');
  const hex = await L(() => CurioPaintings.held());
  ok(hex === (await L(() => CurioPaintings.inForce().colors[2])), "a click on a swatch holds its colour: " + hex);
  ok(await L(() => !!document.querySelector(".cvp-strip .cvp-cell.held")) && /a colour is held/.test(await L(() => document.querySelector(".cvp-head").textContent)), "the held swatch is outlined and the head says a colour is held");
  const before = await L((id) => CurioViewer.film().objects.find((o) => o.id === id).color, spots.thing.id);
  await page.mouse.click(spots.thing.x, spots.thing.y);
  await settle();
  const after = await L((id) => CurioViewer.film().objects.find((o) => o.id === id).color, spots.thing.id);
  ok(after === hex, `the thing clicked takes exactly that colour: ${before} -> ${after}`);
  ok(await L(() => CurioPaintings.held()) === hex, "the colour stays held");
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "paintings-strip.png") });
  await undo();
  ok((await L((id) => CurioViewer.film().objects.find((o) => o.id === id).color, spots.thing.id)) === before, "one Undo takes the colour back");
  await page.mouse.click(spots.thing.x, spots.thing.y);
  await settle();
  await L((id) => {
    CurioViewer.pick(id);
    CurioViewer.nudge(1, 0);
    CurioViewer.nudge(1, 0);
  }, spots.thing.id);
  await settle();
  ok((await L((id) => CurioViewer.film().objects.find((o) => o.id === id).color, spots.thing.id)) === hex, "the colour stays with the thing when it moves");
  await page.reload();
  await ready();
  ok((await L((id) => CurioViewer.film().objects.find((o) => o.id === id).color, spots.thing.id)) === hex, "and after saving and reloading");
  await page.click(".cv-bar .cvp-btn");
  await page.click('.cvp-menu [data-m="forget"]');
  await settle();
  ok((await L((id) => CurioViewer.film().objects.find((o) => o.id === id).color, spots.thing.id)) === before, "Forget the colours puts the thing's own colour back");
  ok(/My film: the colours forgotten/.test(await L(() => document.querySelector(".cvp-status").textContent)), "the status line says My film: the colours forgotten");
  await undo();
  ok((await L((id) => CurioViewer.film().objects.find((o) => o.id === id).color, spots.thing.id)) === hex, "one Undo takes Forget back");

  /* Recolor the app: its own tab, its own painting */
  const themeNow = () =>
    L(() => {
      const v = getComputedStyle(document.querySelector(".cv-root.cv-viewer"));
      const a = CurioPaintings.appPainting();
      return { ground: v.getPropertyValue("--c-ground").trim(), accent: v.getPropertyValue("--c-accent").trim(), a, want: a == null ? null : CurioPaintTheme.palette(CurioPaintings.list()[a].colors), sheet: !!document.getElementById("cvp-theme") };
    });
  let th = await themeNow();
  ok(th.a === null && !th.sheet && th.ground === "#0f0f10", "the app starts in its own colours");
  await L(() => CurioPaintings.open());
  const tabs = await L(() => [...document.querySelectorAll(".cvp-tabs button")].map((b) => b.textContent));
  ok(tabs.join("|") === "Recolor project elements|Recolor the app", "the window has two tabs: " + tabs.join(", "));
  await page.click('.cvp-win [data-cvp="tab-app"]');
  ok((await L(() => document.querySelectorAll(".cvp-win .cvp-row").length)) === 62 && !(await L(() => !!document.querySelector(".cvp-win .cvp-row.on"))), "Recolor the app lists all 62, none lit yet");
  const proj = (await L(() => CurioPaintings.inForce())).i;
  const appPick = proj === 13 ? 14 : 13;
  await page.click(`.cvp-win .cvp-row[data-pick="${appPick}"]`);
  await settle();
  th = await themeNow();
  ok(th.a === appPick && th.ground === th.want.bg && th.accent === th.want.accent, `a click there recolours the app: background ${th.ground}, accent ${th.accent}`);
  ok((await L(() => CurioPaintings.inForce())).i === proj, "and leaves the project's painting alone");
  /* every colour, not only the ones on tokens */
  const every = await L(() => {
    const P = CurioPaintTheme.palette(CurioPaintings.list()[CurioPaintings.appPainting()].colors);
    const rgb = (h) => { const d = document.createElement("i"); d.style.color = h; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    const a = document.createElement("div");
    a.setAttribute("style", "color:#fde68a; background:#1b1c21");
    document.body.appendChild(a);
    const st = document.createElement("style");
    st.textContent = ".cvp-t2 { color: #22d3ee; border: 1px solid #ffd166; }";
    document.head.appendChild(st);
    const b = document.createElement("div");
    b.className = "cvp-t2";
    document.body.appendChild(b);
    const cv = document.createElement("canvas");
    document.body.appendChild(cv);
    const g = cv.getContext("2d");
    g.fillStyle = "#fde68a";
    g.strokeStyle = "#3a3a42";
    return new Promise((res) =>
      setTimeout(() => {
        const out = {
          inline: getComputedStyle(a).color === rgb(CurioPaintTheme.map(P, "#fde68a")),
          added: getComputedStyle(b).color === rgb(CurioPaintTheme.map(P, "#22d3ee")) && getComputedStyle(b).borderTopColor === rgb(CurioPaintTheme.map(P, "#ffd166")),
          canvas: g.fillStyle === CurioPaintTheme.map(P, "#fde68a").toLowerCase() && g.strokeStyle !== "#3a3a42",
          bodyBg: getComputedStyle(document.body).backgroundColor === rgb(P.bg),
          thing: (() => { const o = CurioViewer.live().film.objects[0]; return !o || CurioRecolor.map(o.color) === o.color; })(),
        };
        window.__cvpT = [a, st, b, cv];
        res(out);
      }, 300)
    );
  });
  ok(every.inline && every.added && every.canvas && every.bodyBg, "every colour takes the painting: inline styles, styles added later, canvas lines and the page " + JSON.stringify(every));
  ok(every.thing, "but the film's own things keep their colours (they are the other tab's)");
  const back = await L((k) => {
    const [a, st, b, cv] = window.__cvpT || [];
    CurioPaintings.setAppPainting(null);
    const out = a ? { inline: a.getAttribute("style"), added: getComputedStyle(b).color } : null;
    [a, st, b, cv].forEach((x) => x && x.remove());
    CurioPaintings.setAppPainting(k);
    return out;
  }, appPick);
  ok(back && back.inline === "color:#fde68a; background:#1b1c21" && back.added === "rgb(34, 211, 238)", "and every colour it changed is put back: " + JSON.stringify(back));
  ok((await L(() => [...document.querySelectorAll(".cvp-win .cvp-row.on")].map((r) => +r.dataset.pick))).join() === String(appPick), "the app's painting is lit in that tab");
  await page.click('.cvp-win [data-cvp="tab-project"]');
  ok((await L(() => [...document.querySelectorAll(".cvp-win .cvp-row.on")].map((r) => +r.dataset.pick))).join() === String(proj), "Recolor project elements still lights the project's painting");
  const other = proj === 20 ? 21 : 20;
  await page.click(`.cvp-win .cvp-row[data-pick="${other}"]`);
  await settle();
  ok((await L(() => CurioPaintings.inForce())).i === other && (await themeNow()).a === appPick, "choosing for the project doesn't change the app's colours");
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "paintings-app.png") });
  await page.reload();
  await ready();
  th = await themeNow();
  ok(th.a === appPick && th.ground === th.want.bg, "the app's colours are remembered on this device");
  await L(() => {
    CurioPaintings.open();
    CurioPaintings.tab("app");
  });
  await page.click('.cvp-win [data-cvp="app-own"]');
  th = await themeNow();
  ok(th.a === null && !th.sheet && th.ground === "#0f0f10", "The app's own colours puts the usual look back");
  /* a light painting gives a light app with dark words */
  const lt = await L(() => {
    const i = CurioPaintings.list().findIndex((p) => CurioPaintTheme.isLight(p.colors));
    CurioPaintings.setAppPainting(i);
    const P = CurioPaintTheme.palette(CurioPaintings.list()[i].colors);
    const t = getComputedStyle(document.querySelector(".cv-root.cv-viewer"));
    const out = { mode: P.mode, ground: t.getPropertyValue("--c-ground").trim(), text: t.getPropertyValue("--c-text").trim(), lumG: CurioPaintTheme.lum(P.bg), lumT: CurioPaintTheme.lum(P.text) };
    CurioPaintings.setAppPainting(null);
    return out;
  });
  ok(lt.mode === "light" && lt.lumG > lt.lumT && lt.ground !== "#0f0f10", "a light painting gives a light app with dark words: " + JSON.stringify(lt));

  /* a phone */
  await page.setViewportSize({ width: 390, height: 844 });
  await L(() => CurioPaintings.open());
  const ww = await L(() => document.querySelector(".cvp-win").getBoundingClientRect());
  ok(ww.left >= 0 && ww.right <= 390, "on a phone the window fits the screen");

  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
