/* Every curiosity's window in a real browser: node apps/curiosities/screen/tests/windows-browser.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Opens the window of every curiosity on the Screen, one by one, and checks that each face its data asks for
   (data/windows/win-*.js) is drawn, that its groups list its settings, and that the page reports no errors.
   Then works one window the way a person would: a preset (several settings at the playhead, one undo step),
   a tile, a shape drawn over the whole film (Rise), Surprise me, and a drag on a pad; then the hand-made faces
   (wheel, curve, stage) with the mouse, a finger and the arrow keys. */
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
  /* The live picture stays pinned at the top of the window, so bring the pad to the middle of the window first. */
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), padSel);
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

  /* The live picture (Jeremy, 17:44Z: "see the results on the screen"): it redraws while a slider is dragged. */
  ok(await page.$(`${orb} [data-cw-look] svg`), "the window opens with a live picture");
  const redraw = await page.evaluate((orb) => {
    const box = document.querySelector(`${orb} [data-cw-look]`);
    const r = document.querySelector(`${orb} input[type=range][data-set="cameraPlace.distance"]`);
    if (!box || !r) return null;
    const before = box.innerHTML;
    r.value = r.max;
    r.dispatchEvent(new Event("input", { bubbles: true }));
    return before !== box.innerHTML;
  }, orb);
  ok(redraw === true, "dragging a slider redraws the live picture before the node is set");
  ok(await page.$(`${orb} .sc-chips button[data-set="cameraPlace.subject"]`), "a list with no order is chips to tap, not a menu");

  /* Fixes from the testing thread's bug list. */
  const words2 = await page.evaluate(() => {
    const I = (id, text, vals) => {
      const c = window.CurioLevels.get("curiosity", id);
      const h = { sliderId: (cc, s) => (s.id === cc.main || s.id === "setting" ? (window.CurioScale.known(cc.id) ? cc.id : cc.id + "." + s.id) : cc.id + "." + s.id), ctx: { value: (k) => (vals || {})[k] } };
      return window.CurioWindowFaces.interpret(c, text, h).set.map(([k, v]) => k + "=" + v);
    };
    return { hero: I("cameraPlace", "hero from below"), notSo: I("shotSize", "not so close"), roll: I("cameraPlace", "10 degrees roll"), twice: I("clipSpeed", "2x"), half: I("clipSpeed", "50%"), more: I("emotion", "more", { emotion: "curious", "emotion.arousal": 2 }) };
  });
  ok(words2.hero.includes("cameraPlace.height=-30") && words2.hero.includes("cameraPlace.distance=1.5"), "a preset's full name still applies the whole preset when a phrase is inside it: " + words2.hero);
  ok(await page.evaluate(() => ["featureRate", "contrastMap"].every((id) => window.CurioScale.domain(id).kind === "range")), "number main settings (featureRate, contrastMap) are numbers on the timeline, not on/off");
  ok(words2.notSo.includes("shotSize=medium"), "\"not so close\" steps back to medium: " + words2.notSo);
  ok(words2.roll.includes("cameraPlace.roll=10"), "\"10 degrees roll\" sets the roll: " + words2.roll);
  ok(words2.twice.includes("clipSpeed.percent=200") && words2.half.includes("clipSpeed.percent=50"), "\"2x\" and \"50%\" set the clip speed: " + words2.twice + " / " + words2.half);
  ok(words2.more.some((x) => /^emotion\.arousal=3$/.test(x)), "a bare \"more\" on Emotion turns it up rather than changing the feeling: " + words2.more);
  const pickKept = await page.evaluate(async (orb) => {
    const sel = document.querySelector(`${orb} [data-cw-shape-pick="cameraPlace"]`);
    sel.value = "height";
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector(`${orb} [data-cw-shape="cameraPlace|rise"]`).click();
    await new Promise((r) => setTimeout(r, 200));
    return document.querySelector(`${orb} [data-cw-shape-pick="cameraPlace"]`).value;
  }, orb);
  ok(pickKept === "height", `the shape's setting stays picked after a shape is drawn (${pickKept})`);
  ok(await page.evaluate(() => { const d = window.CurioScale.domain("lensLength.mm"); return Math.abs(((d.max - d.min) / d.step) % 1) < 1e-9; }), "number settings can reach their top value (lens length in mm)");

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

  /* The hand-made faces: a color wheel, a curve over my film and a floor plan from above. Each is dragged with
     the mouse, moved with touch (pointer events) and the arrow keys, and writes its settings. */
  const valAt = (k, j) => page.evaluate(([k, j]) => {
    const st = window.CurioEngine.state();
    const t = st.tracks.find((x) => x.curiosities.includes(k));
    const r = st.rows[j == null ? window.CurioScreen.row() : j];
    return t && r ? window.CurioEngine.value(r.id, t.id, k) : null;
  }, [k, j]);
  const undos = () => page.evaluate(() => (window.CurioEngine.history ? window.CurioEngine.history().undo.length : null));
  const focusedHand = () => page.evaluate(() => (document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.handFocus || null : null));
  const handFaces = await page.evaluate(() => {
    const seen = { wheel: [], curve: [], stage: [] };
    Object.entries(window.CuriosityWindows.specs).forEach(([id, s]) => (s.faces || []).forEach((f) => seen[f.face] && seen[f.face].push(id)));
    return seen;
  });
  ok(handFaces.wheel.length >= 5 && handFaces.curve.length >= 5 && handFaces.stage.length >= 5, `hand-made faces in use: ${handFaces.wheel.length} wheels, ${handFaces.curve.length} curves, ${handFaces.stage.length} stages`);
  /* Every one of them is drawn as itself (not its fallback) in its window. */
  const handDrawn = await page.evaluate((all) => {
    const miss = [];
    Object.entries(all).forEach(([kind, ids]) => ids.forEach((id) => {
      window.CurioScreen.openWin(id);
      if (!document.querySelector(`.sc-win[data-win="${id}"] .cw-${kind}-face [data-cw-hand]`)) miss.push(`${id} (${kind})`);
      document.querySelector(`.sc-win[data-win="${id}"] [data-win-close]`).click();
    }));
    return miss;
  }, handFaces);
  ok(!handDrawn.length, "every wheel, curve and stage draws itself: " + (handDrawn.join(", ") || "all drawn"));

  /* Wheel (degrees): drag the dot to the right edge: hue about 90°, strength near the top. */
  await page.evaluate(() => window.CurioScreen.openWin("filterHue"));
  const fw = '.sc-win[data-win="filterHue"]';
  const disc = `${fw} .cw-wheel-disc`;
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), disc);
  let db = await (await page.$(disc)).boundingBox();
  const lookBefore = await page.evaluate((w) => document.querySelector(`${w} [data-cw-look]`).innerHTML, fw);
  let undo0 = await undos();
  await page.mouse.move(db.x + db.width * 0.5, db.y + db.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(db.x + db.width * 0.97, db.y + db.height * 0.5, { steps: 5 });
  const lookMid = await page.evaluate((w) => document.querySelector(`${w} [data-cw-look]`).innerHTML, fw);
  await page.mouse.up();
  const hue = await valAt("filterHue.hueAngle");
  const tint = await valAt("filterHue.tintStrength");
  ok(hue >= 80 && hue <= 100 && tint >= 85, `dragging the wheel's dot to its right edge sets the color to about 90° and strong (${hue}°, ${tint}%)`);
  ok(lookMid !== lookBefore, "the live picture redraws while the wheel's dot moves");
  if (undo0 != null) ok((await undos()) === undo0 + 1, "one wheel drag is one undo step");
  ok(await page.$(`${fw} .cw-wheel-face [data-cw-midi="filterHue.hueAngle"]`), "the wheel shows 🎹 MIDI learn for its settings");
  ok(await page.$eval(disc, (e) => e.getAttribute("role") === "slider" && /Color wheel/.test(e.getAttribute("aria-label")) && e.tabIndex === 0), "the wheel is a labeled slider you can tab to");
  await page.focus(disc);
  await page.keyboard.press("ArrowRight");
  ok((await valAt("filterHue.hueAngle")) === Math.min(360, hue + 15), `the right arrow turns the color 15° (${await valAt("filterHue.hueAngle")}°)`);
  await page.keyboard.press("ArrowDown");
  ok((await valAt("filterHue.tintStrength")) < tint, `the down arrow makes it weaker (${await valAt("filterHue.tintStrength")}%)`);
  ok((await focusedHand()) === "wheel", "the keyboard stays on the wheel after it writes");

  /* Wheel (words): aim at the "blue" label: the accent becomes blue; the middle-out distance sets its strength. */
  await page.evaluate(() => window.CurioScreen.openWin("colorAccent"));
  const aw = '.sc-win[data-win="colorAccent"]';
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), `${aw} .cw-wheel-disc`);
  const aim = await page.evaluate((aw) => {
    const d = document.querySelector(`${aw} .cw-wheel-disc`).getBoundingClientRect();
    const l = [...document.querySelectorAll(`${aw} .cw-wheel-l`)].find((x) => x.textContent === "blue").getBoundingClientRect();
    const cx = d.left + d.width / 2;
    const cy = d.top + d.height / 2;
    const vx = l.left + l.width / 2 - cx;
    const vy = l.top + l.height / 2 - cy;
    const n = Math.hypot(vx, vy);
    return [cx + (vx / n) * d.width * 0.25, cy + (vy / n) * d.width * 0.25];
  }, aw);
  await page.mouse.click(aim[0], aim[1]);
  const acc = [await valAt("colorAccent.accentHue"), await valAt("colorAccent.accentVsRest")];
  ok(acc[0] === "blue" && acc[1] >= 40 && acc[1] <= 60, `aiming at blue, halfway out, picks blue at about half strength (${acc.join(", ")})`);

  /* Touch: the same wheel moved by a finger (pointer events with pointerType touch). */
  const touchDrag = (sel, from, to) => page.evaluate(([sel, from, to]) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const pt = (p) => ({ clientX: r.left + r.width * p[0], clientY: r.top + r.height * p[1], pointerType: "touch", isPrimary: true, bubbles: true, pointerId: 7 });
    el.dispatchEvent(new PointerEvent("pointerdown", pt(from)));
    window.dispatchEvent(new PointerEvent("pointermove", pt([(from[0] + to[0]) / 2, (from[1] + to[1]) / 2])));
    window.dispatchEvent(new PointerEvent("pointermove", pt(to)));
    window.dispatchEvent(new PointerEvent("pointerup", pt(to)));
  }, [sel, from, to]);
  await touchDrag(`${aw} .cw-wheel-disc`, [0.5, 0.5], [0.5, 0.02]);
  ok((await valAt("colorAccent.accentHue")) === "red", `a finger dragged to the top of the wheel picks red (${await valAt("colorAccent.accentHue")})`);

  /* Curve: drag the first point to the top and the last to the bottom: tension falls across every moment. */
  await page.evaluate(() => window.CurioScreen.setRow(0));
  await page.evaluate(() => window.CurioScreen.openWin("tensionCurve"));
  const tw = '.sc-win[data-win="tensionCurve"]';
  const curveSel = `${tw} .cw-curve-box`;
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), curveSel);
  const nRows = await page.evaluate(() => window.CurioEngine.state().rows.length);
  const dragCurve = async (fx, toY) => {
    const b = await (await page.$(`${curveSel} svg`)).boundingBox();
    await page.mouse.move(b.x + b.width * fx, b.y + b.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * fx, b.y + b.height * toY, { steps: 4 });
    await page.mouse.up();
  };
  undo0 = await undos();
  await dragCurve(0.02, 0.0);
  await dragCurve(0.98, 1.0);
  const tens = [];
  for (let j = 0; j < nRows; j++) tens.push(await valAt("tensionCurve", j));
  ok(tens[0] === 5 && tens[nRows - 1] === 0 && tens.every((v) => v != null), `dragging the curve's ends writes every moment, from 5 down to 0: ${JSON.stringify(tens)}`);
  if (undo0 != null) ok((await undos()) === undo0 + 2, "each curve drag is one undo step");
  ok((await focusedHand()) === "curve", "the curve keeps the keyboard after a drag");
  /* The last drag picked the last point; the left arrow picks the one before it, up lifts it. */
  await page.keyboard.press("ArrowLeft");
  const picked = await page.$eval(curveSel, (e) => e.getAttribute("aria-valuetext"));
  const pm = /^Point (\d+) of (\d+), moment (\d+)/.exec(picked) || [];
  ok(pm[1] && Number(pm[1]) === Number(pm[2]) - 1, `the left arrow picks the point before (${picked})`);
  const mid = Number(pm[3]) - 1;
  const before = await valAt("tensionCurve", mid);
  await page.keyboard.press("ArrowUp");
  ok((await valAt("tensionCurve", mid)) > before, `the up arrow lifts that point (moment ${mid + 1}: ${before} to ${await valAt("tensionCurve", mid)})`);

  /* Curve on a word scale: the arc stage, raised at the end by a finger. */
  await page.evaluate(() => window.CurioScreen.openWin("arcStage"));
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), '.sc-win[data-win="arcStage"] .cw-curve-box');
  await touchDrag('.sc-win[data-win="arcStage"] .cw-curve-box svg', [0.99, 0.5], [0.99, 0]);
  ok((await valAt("arcStage", nRows - 1)) === "change", `a finger lifting the last point of the arc ends it at "change" (${await valAt("arcStage", nRows - 1)})`);

  /* Stage: drag the mover to the still one's right and far away. */
  await page.evaluate(() => window.CurioScreen.setRow(2));
  await page.evaluate(() => window.CurioScreen.openWin("whoMoves"));
  const sw = '.sc-win[data-win="whoMoves"]';
  const floor = `${sw} .cw-stage-floor`;
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), floor);
  const fb = await (await page.$(floor)).boundingBox();
  const tok = await (await page.$(`${sw} .cw-tok`)).boundingBox();
  undo0 = await undos();
  await page.mouse.move(tok.x + tok.width / 2, tok.y + tok.height / 2);
  await page.mouse.down();
  await page.mouse.move(fb.x + fb.width * 0.96, fb.y + fb.height * 0.5, { steps: 5 });
  await page.mouse.up();
  const ar = await valAt("whoMoves.circleAround");
  const gap = await valAt("whoMoves.endGap");
  ok(ar >= 80 && ar <= 100 && gap >= 7, `dragging the mover to the far right ends them about 90° around and far off (${ar}°, ${gap} m)`);
  if (undo0 != null) ok((await undos()) === undo0 + 1, "one stage drag is one undo step");
  ok((await focusedHand()) === "tok1", "the moved person keeps the keyboard");
  await page.keyboard.press("ArrowRight");
  ok((await valAt("whoMoves.circleAround")) === Math.min(180, ar + 15), `the right arrow moves them 15° around (${await valAt("whoMoves.circleAround")}°)`);
  await page.keyboard.press("ArrowDown");
  ok((await valAt("whoMoves.endGap")) < gap, `the down arrow brings them nearer (${await valAt("whoMoves.endGap")} m)`);

  /* Stage with the camera: a finger drags it behind the walkers. */
  await page.evaluate(() => window.CurioScreen.openWin("walkAndTalk"));
  const ww = '.sc-win[data-win="walkAndTalk"]';
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), `${ww} .cw-stage-floor`);
  const camAt = await page.$eval(`${ww} .cw-tok.cam`, (e) => [parseFloat(e.style.left) / 100, parseFloat(e.style.top) / 100]);
  await touchDrag(`${ww} .cw-stage-floor`, camAt, [0.5, 0.08]);
  const behind = await valAt("walkAndTalk.camAround");
  ok(Math.abs(behind) >= 165, `a finger drags the camera behind the walkers (${behind}°)`);

  /* A face whose setting is missing draws its fallback instead. */
  const fall = await page.evaluate(() => {
    const c = window.CurioLevels.get("curiosity", "filterHue");
    const fake = Object.assign({}, c, { sliders: c.sliders.filter((s) => s.id !== "hueAngle"), window: { faces: [{ face: "wheel", hue: "hueAngle", strength: "tintStrength", fallback: { face: "dial", slider: "tintStrength" } }, { face: "curve", slider: "nothingHere" }, { face: "stage", tokens: [{ who: "person" }, { who: "person", about: 0, distance: "nothingHere" }], fallback: { face: "dial", slider: "tintStrength" } }] } });
    const h = { esc: (s) => String(s), sliderId: (cc, s) => (s.id === cc.main ? "filterHue" : "filterHue." + s.id), keyBtn: () => "", controlHtml: () => "", ctx: { value: () => undefined, edit: true, beats: [{}, {}, {}] } };
    const out = window.CurioWindowFaces.html(fake, h);
    return { dial: (out.match(/cw-dial-face/g) || []).length, hand: /data-cw-hand/.test(out) };
  });
  ok(fall.dial === 2 && !fall.hand, `a wheel or stage missing a setting draws its fallback dial instead (${JSON.stringify(fall)})`);
  ok(!errors.length, "the hand-made faces run without errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));

  /* At phone width a new window stays on the screen, so its × can be tapped. */
  await page.setViewportSize({ width: 390, height: 844 });
  const phone = await page.evaluate(() => {
    window.CurioScreen.openWin("lensLength");
    const w = document.querySelector('.sc-win[data-win="lensLength"]');
    const r = w && w.getBoundingClientRect();
    return r ? [r.left, r.right] : null;
  });
  ok(phone && phone[0] >= 0 && phone[1] <= 390, "at phone width a new window opens inside the screen: " + JSON.stringify(phone));
  ok(!errors.length, "no errors on the page" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
