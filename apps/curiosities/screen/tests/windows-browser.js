/* Every curiosity's window in a real browser: node apps/curiosities/screen/tests/windows-browser.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Opens the window of every curiosity on the Screen, one by one, and checks that each face its data asks for
   (data/windows/win-*.js) is drawn, that its groups list its settings, and that the page reports no errors.
   Then works one window the way a person would: a preset (several settings at the playhead, one undo step),
   a tile, a shape drawn over the whole film (Rise), Surprise me, and a drag on a pad. */
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
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g/.test(m.text()) && errors.push(m.text()));
  await page.goto(base + "index.html?screen=1");
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
  ok(await page.evaluate(() => !!window.CurioWindowFaces && !!window.CuriosityWindows), "the window faces and the window data load");

  /* Every curiosity's window, one at a time. */
  const report = await page.evaluate(() => {
    const L = window.CurioLevels;
    const W = window.CuriosityWindows;
    const out = { total: 0, withSpec: 0, missingFaces: [], missingGroups: [], unknownKeys: [], threw: [] };
    const all = L.CATEGORIES.flatMap((cat) => L.curiosities(cat.id).filter((x) => L.categoryOf(x.id) === cat.id));
    all.forEach((c) => {
      out.total++;
      try {
        window.CurioScreen.openWin(c.id);
        const win = document.querySelector(`.sc-win[data-win="${c.id}"]`);
        const sp = W.get(c.id);
        if (sp) {
          out.withSpec++;
          const drawn = win.querySelectorAll(".cw-face").length;
          if (drawn !== (sp.faces || []).length) out.missingFaces.push(`${c.id} (${drawn} of ${(sp.faces || []).length})`);
          const heads = [...win.querySelectorAll(".sc-wpart h4")].map((h) => h.textContent);
          (sp.groups || []).forEach((g) => heads.includes(g.label) || out.missingGroups.push(`${c.id}: ${g.label}`));
        }
        /* Every setting the window offers is a lane the engine knows. */
        win.querySelectorAll("[data-set]").forEach((b) => window.CurioScale.known(b.dataset.set) || out.unknownKeys.push(`${c.id}: ${b.dataset.set}`));
        win.querySelector("[data-win-close]").click();
      } catch (e) {
        out.threw.push(`${c.id}: ${e.message}`);
      }
    });
    return out;
  });
  ok(report.total > 400, `there are ${report.total} curiosities on the Screen`);
  ok(report.withSpec === report.total, `every curiosity has its own window spec (${report.withSpec} of ${report.total})`);
  ok(!report.threw.length, "every window opens: " + (report.threw.slice(0, 5).join("; ") || "none threw"));
  ok(!report.missingFaces.length, "every window draws all its faces: " + (report.missingFaces.slice(0, 8).join(", ") || "all drawn"));
  ok(!report.missingGroups.length, "every window shows its groups: " + (report.missingGroups.slice(0, 8).join(", ") || "all shown"));
  ok(!report.unknownKeys.length, "every control in every window is a lane the engine knows: " + (report.unknownKeys.slice(0, 8).join(", ") || "all known"));
  const faceKinds = await page.evaluate(() => {
    const seen = {};
    Object.values(window.CuriosityWindows.specs).forEach((s) => (s.faces || []).forEach((f) => (seen[f.face] = (seen[f.face] || 0) + 1)));
    return seen;
  });
  console.log("     faces used: " + JSON.stringify(faceKinds));
  ok(Object.keys(faceKinds).length >= 7, "the windows use many kinds of face, not one for all");

  /* One window worked by hand: the first curiosity with a preset, a pad and a word scale to shape. */
  const pick = await page.evaluate(() => {
    const W = window.CuriosityWindows;
    const find = (test) => Object.keys(W.specs).find((id) => test(W.specs[id], window.CurioLevels.get("curiosity", id)));
    return {
      preset: find((s) => (s.presets || []).length >= 2),
      pad: find((s) => (s.faces || []).some((f) => f.face === "pad")),
      tiles: find((s) => (s.faces || []).some((f) => f.face === "tiles")),
    };
  });
  ok(pick.preset && pick.pad && pick.tiles, `windows to try: ${pick.preset}, ${pick.pad}, ${pick.tiles}`);

  await page.evaluate(() => window.CurioScreen.setRow(2));
  await page.evaluate((id) => window.CurioScreen.openWin(id), pick.preset);
  const win = `.sc-win[data-win="${pick.preset}"]`;
  await page.screenshot({ path: path.join(SHOTS, "windows-1-preset.png") });
  const presetWant = await page.evaluate((id) => {
    const c = window.CurioLevels.get("curiosity", id);
    const p = window.CuriosityWindows.get(id).presets[0];
    return Object.entries(p.set).map(([sid, v]) => {
      const s = c.sliders.find((x) => x.id === sid || (sid === "setting" && x.id === c.main));
      const key = s.id === c.main || s.id === "setting" ? (window.CurioScale.known(id) ? id : id + "." + s.id) : id + "." + s.id;
      return [key, v];
    });
  }, pick.preset);
  const undoBefore = await page.evaluate(() => (window.CurioEngine.history ? window.CurioEngine.history().undo.length : null));
  await page.click(`${win} [data-cw-preset="${pick.preset}|0"]`);
  const after = await page.evaluate((want) => {
    const st = window.CurioEngine.state();
    const r = st.rows[2];
    return want.map(([k, v]) => {
      const t = st.tracks.find((x) => x.curiosities.includes(k));
      return [k, v, t ? window.CurioEngine.value(r.id, t.id, k) : undefined];
    });
  }, presetWant);
  ok(after.every(([, v, got]) => String(v) === String(got)), "a preset sets every one of its settings at the playhead: " + JSON.stringify(after));
  if (undoBefore != null) ok((await page.evaluate(() => window.CurioEngine.history().undo.length)) === undoBefore + 1, "a preset is one undo step");

  /* A tile sets its setting. */
  await page.evaluate((id) => window.CurioScreen.openWin(id), pick.tiles);
  const tileBtn = await page.$(`.sc-win[data-win="${pick.tiles}"] .cw-tiles button:not(.on)`);
  const tileKey = await tileBtn.evaluate((b) => [b.dataset.set, b.dataset.v]);
  await tileBtn.click();
  ok(await page.evaluate(([k, v]) => {
    const st = window.CurioEngine.state();
    const t = st.tracks.find((x) => x.curiosities.includes(k));
    return t && String(window.CurioEngine.value(st.rows[2].id, t.id, k)) === v;
  }, tileKey), `a tile sets ${tileKey[0]} to ${tileKey[1]}`);
  ok(await page.$(`.sc-win[data-win="${pick.tiles}"] .cw-tiles button.on`), "the picked tile lights up");

  /* Shape over my film: Rise writes a node on every moment, rising. */
  const n = await page.evaluate(() => window.CurioEngine.state().rows.length);
  await page.click(`.sc-win[data-win="${pick.tiles}"] [data-cw-shape="${pick.tiles}|rise"]`);
  const shaped = await page.evaluate((cid) => {
    const sel = document.querySelector(`[data-cw-shape-pick="${cid}"]`);
    const c = window.CurioLevels.get("curiosity", cid);
    const s = c.sliders.find((x) => x.id === sel.value);
    const k = s.id === c.main ? (window.CurioScale.known(cid) ? cid : cid + "." + s.id) : cid + "." + s.id;
    const st = window.CurioEngine.state();
    const t = st.tracks.find((x) => x.curiosities.includes(k));
    const vals = st.rows.map((r) => window.CurioScale.pos(k, window.CurioEngine.value(r.id, t.id, k)));
    return { k, vals };
  }, pick.tiles);
  ok(shaped.vals.length === n && shaped.vals[0] <= shaped.vals[n - 1] && shaped.vals.every((v, i) => i === 0 || v >= shaped.vals[i - 1] - 1e-9), `Rise draws ${shaped.k} upward across all ${n} moments`);

  /* Surprise me sets every own setting at the playhead. */
  await page.click(`.sc-win[data-win="${pick.tiles}"] [data-cw-surprise="${pick.tiles}"]`);
  ok(!errors.length, "Surprise me runs without errors");

  /* A pad: drag to the top right sets both its settings near their tops. */
  await page.evaluate((id) => window.CurioScreen.openWin(id), pick.pad);
  const padSel = `.sc-win[data-win="${pick.pad}"] .cw-pad`;
  const box = await (await page.$(padSel)).boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.03, { steps: 4 });
  await page.mouse.up();
  const padVals = await page.evaluate((sel) => {
    const [x, y] = document.querySelector(sel).dataset.xy.split("|");
    const st = window.CurioEngine.state();
    const r = st.rows[window.CurioScreen.row()];
    return [x, y].map((k) => {
      const t = st.tracks.find((tt) => tt.curiosities.includes(k));
      return t ? window.CurioScale.pos(k, window.CurioEngine.value(r.id, t.id, k)) : null;
    });
  }, padSel);
  ok(padVals.every((p) => p != null && p >= 0.75), "dragging the pad to its top right sets both settings high: " + JSON.stringify(padVals));
  await page.screenshot({ path: path.join(SHOTS, "windows-2-pad.png") });

  /* The orbit (Jeremy, 15:01Z: a camera angle is a 3D relationship to the subject): drag the camera to the
     subject's right in the view from above, then above them in the view from the side. */
  await page.evaluate(() => window.CurioScreen.openWin("cameraPlace"));
  const orb = '.sc-win[data-win="cameraPlace"]';
  const drag = async (sel, fx, fy) => {
    const el = await page.$(sel);
    await el.scrollIntoViewIfNeeded();
    const b = await el.boundingBox();
    await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.8);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * fx, b.y + b.height * fy, { steps: 4 });
    await page.mouse.up();
  };
  const orbVal = (k) => page.evaluate((k) => {
    const st = window.CurioEngine.state();
    const t = st.tracks.find((x) => x.curiosities.includes(k));
    return t ? window.CurioEngine.value(st.rows[window.CurioScreen.row()].id, t.id, k) : null;
  }, k);
  await drag(`${orb} [data-orbit-top] svg`, 0.85, 0.5);
  const around = await orbVal("cameraPlace");
  ok(around > 70 && around < 110, `from above, dragging to their right puts the camera about 90° around (${around}°)`);
  await drag(`${orb} [data-orbit-side] svg`, 0.5, 0.15);
  const height = await orbVal("cameraPlace.height");
  ok(height > 30, `from the side, dragging up puts the camera above them (${height}°)`);
  await page.screenshot({ path: path.join(SHOTS, "windows-3-orbit.png") });

  /* Say what you want (Jeremy, 15:02Z): plain words set the settings. */
  const say = async (text) => {
    await page.fill(`${orb} [data-cw-say-text="cameraPlace"]`, text);
    await page.press(`${orb} [data-cw-say-text="cameraPlace"]`, "Enter");
  };
  await say("45 degrees to the right, 3 meters away");
  ok((await orbVal("cameraPlace")) === 45 && (await orbVal("cameraPlace.distance")) === 3, "\"45 degrees to the right, 3 meters away\" sets around 45° and 3 m");
  await say("a bit closer");
  const closer = await orbVal("cameraPlace.distance");
  ok(closer < 3 && closer >= 2, `"a bit closer" brings the camera a little nearer (${closer} m)`);
  await say("20 degrees below");
  ok((await orbVal("cameraPlace.height")) === -20, "\"20 degrees below\" puts the camera under their eyes");
  await say("god's eye");
  ok((await orbVal("cameraPlace.height")) === 90, "naming a preset (God's eye) uses it");
  const tiny = await page.evaluate(() => {
    const c = window.CurioLevels.get("curiosity", "shotSize");
    const h = { sliderId: (cc, s) => (s.id === cc.main || s.id === "setting" ? (window.CurioScale.known(cc.id) ? cc.id : cc.id + "." + s.id) : cc.id + "." + s.id), ctx: { value: () => undefined } };
    return window.CurioWindowFaces.interpret(c, "close", h).set;
  });
  ok(tiny.some(([k, v]) => k === "shotSize" && v === "close"), "a word from a list (\"close\") picks it: " + JSON.stringify(tiny));
  ok(await page.$('.sc-inspector .sc-finetune'), "Details rows open the window with Fine-tune");

  /* The "Do it" button does the same as Enter. */
  await page.fill(`${orb} [data-cw-say-text="cameraPlace"]`, "30 degrees to the left");
  await page.click(`${orb} [data-cw-say="cameraPlace"]`);
  ok((await orbVal("cameraPlace")) === -30, "the Do it button reads the box (\"30 degrees to the left\")");

  /* Plain-words phrases written for each curiosity (data/windows/say-*.js) set their settings. */
  const phr = await page.evaluate(() => {
    const W = window.CuriosityWindows;
    const ids = Object.keys(W.phrases || {});
    const h = (cc) => ({ sliderId: (c2, s) => (s.id === c2.main || s.id === "setting" ? (window.CurioScale.known(c2.id) ? c2.id : c2.id + "." + s.id) : c2.id + "." + s.id), ctx: { value: () => undefined } });
    let tried = 0, hit = 0;
    const miss = [];
    ids.forEach((id) => {
      const c = window.CurioLevels.get("curiosity", id);
      if (!c) return;
      Object.keys(W.phrases[id]).forEach((ph) => {
        tried++;
        const r = window.CurioWindowFaces.interpret(c, ph, h(c));
        if (r.set.length) hit++;
        else if (miss.length < 5) miss.push(id + ": " + ph);
      });
    });
    return { ids: ids.length, tried, hit, miss };
  });
  ok(phr.ids > 300 && phr.hit === phr.tried, `every written phrase sets something (${phr.hit} of ${phr.tried} phrases, ${phr.ids} curiosities)` + (phr.miss.length ? ": " + phr.miss.join("; ") : ""));

  /* How many times and how much: Rise twice at half depth climbs, drops back, climbs again, inside the middle half. */
  const twice = await page.evaluate(() => window.CurioWindowFaces.shapeItems("cameraPlace", "rise", 9, 0, 8, 2, 0.5).map(([k, j, v]) => window.CurioScale.pos(k, v)));
  ok(twice.length === 9 && twice[3] > twice[0] && twice[5] < twice[3] && twice.every((p) => p >= 0.24 && p <= 0.76), "a shape can play twice and swing only halfway: " + JSON.stringify(twice.map((p) => Math.round(p * 100) / 100)));

  /* MIDI learn: click 🎹, move a knob, and that knob writes the setting at the playhead. */
  await page.evaluate(() => (window.CurioAuto.connectMidi = () => Promise.resolve(true)));
  await page.click(`${orb} [data-cw-midi="cameraPlace.distance"]`);
  ok(await page.$(`${orb} [data-cw-midi="cameraPlace.distance"].learning`), "the 🎹 button listens after a click");
  await page.evaluate(() => {
    const feed = window.CurioWindowFaces.midi.feed;
    feed("midi", { kind: "cc", num: 21, val: 64 });
    feed("midi", { kind: "cc", num: 21, val: 127 });
  });
  await page.waitForTimeout(500);
  ok((await orbVal("cameraPlace.distance")) === (await page.evaluate(() => window.CurioScale.at("cameraPlace.distance", 1))), "a learned knob turned all the way sets the distance to its top");
  ok(await page.evaluate(() => window.CurioWindowFaces.midi.bindings()["cc:21"] === "cameraPlace.distance"), "the knob is remembered for that setting");
  ok(await page.$(`${orb} [data-cw-midi="cameraPlace.distance"].on`), "the 🎹 button shows which knob moves it");

  ok(!errors.length, "no errors on the page" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
