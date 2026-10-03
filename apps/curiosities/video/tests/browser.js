/* The Video window in a real browser, inside the real app: node apps/curiosities/video/tests/browser.js
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   The page makes its own two clips (a canvas and a tone, recorded as .webm), so no video files are needed:
   the inspiration goes dark and bright every second and gets loud with it; your clip is a steady grey with a
   moving square. Then, the way a person would: bring both in, see the lanes and their nodes, put them on My
   film, apply light only and check it follows the inspiration, apply everything and save a video, swap the
   clips, and find the window's button on the Screen. Screenshots go to --shots (default: the temp folder). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
/* --mediapipe DIR: a local copy of @mediapipe/tasks-vision (its package folder) with the selfie multiclass model
   beside it, for the AI cut-out checks (the sandbox can't reach the CDN). */
const MP = arg("--mediapipe", "");
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split("?")[0]);
      const p = MP && u.startsWith("/__mp/") ? path.join(MP, u.slice(6)) : path.join(ROOT, u.replace(/^\/+/, ""));
      if (MP && u.startsWith("/__mp/")) {
        if (!fs.existsSync(p)) {
          res.writeHead(404);
          return res.end();
        }
        res.writeHead(200, { "content-type": /\.[mc]?js$/.test(p) ? "text/javascript" : /\.wasm$/.test(p) ? "application/wasm" : "application/octet-stream" });
        return fs.createReadStream(p).pipe(res);
      }
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
  const url = "http://127.0.0.1:" + server.address().port + "/index.html?screen=0";
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e && e.message)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g|cdnjs|^INFO: /.test(m.text()) && errors.push(m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.CurioVideoUI && window.CurioEngine && window.CurioClip, null, { timeout: 30000 });
  ok(true, "the Video window loads with the app");

  /* Two made-up clips, recorded in the page. */
  await page.evaluate(async () => {
    async function make(name, secs, draw, loud) {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 180;
      const x = c.getContext("2d");
      const ac = new AudioContext();
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const dest = ac.createMediaStreamDestination();
      osc.frequency.value = 220;
      osc.connect(g).connect(dest);
      osc.start();
      const stream = c.captureStream(30);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start(100);
      const t0 = performance.now();
      await new Promise((done) => {
        const tick = () => {
          const t = (performance.now() - t0) / 1000;
          if (t > secs) return done();
          draw(x, t);
          g.gain.value = loud(t);
          requestAnimationFrame(tick);
        };
        tick();
      });
      await new Promise((r) => {
        rec.onstop = r;
        rec.stop();
      });
      osc.stop();
      ac.close();
      return new File(chunks, name, { type: "video/webm" });
    }
    const lit = (t) => Math.floor(t) % 2 === 1;
    window.__a = await make(
      "Get well test.webm",
      4.2,
      (x, t) => {
        const v = lit(t) ? 220 : 50;
        x.fillStyle = `rgb(${v + 30},${v},${v - 30})`;
        x.fillRect(0, 0, 320, 180);
        x.fillStyle = "#333";
        for (let i = 0; i < 8; i++) x.fillRect(i * 40 + 5, 60 + 20 * Math.sin(i), 20, 40);
      },
      (t) => (lit(t) ? 0.5 : 0.03)
    );
    /* A letterboxed clip: bright grey picture between black bars. */
    window.__lb = await make(
      "Letterboxed.webm",
      2.2,
      (x) => {
        x.fillStyle = "#000";
        x.fillRect(0, 0, 320, 180);
        x.fillStyle = "#c8c8c8";
        x.fillRect(0, 40, 320, 100);
        x.fillStyle = "#555";
        x.fillRect(100, 70, 40, 40);
      },
      () => 0.1
    );
    window.__b = await make(
      "My test clip.webm",
      4.2,
      (x, t) => {
        x.fillStyle = "#808080";
        x.fillRect(0, 0, 320, 180);
        x.fillStyle = "#204060";
        x.fillRect(40 + t * 50, 70, 40, 40);
        x.fillStyle = "#602020";
        x.fillRect(200, 20 + t * 20, 30, 30);
      },
      () => 0.1
    );
  });
  ok(true, "two clips recorded in the page");

  const lb = await page.evaluate(async () => {
    const c = await window.CurioClip.open(window.__lb, "Letterboxed.webm");
    const d = await window.CurioClip.dissect(c);
    return { luma: d.raw.luma[3], aspect: d.aspect, picture: d.looks && d.looks.aspect };
  });
  ok(lb.luma > 0.6 && lb.aspect < 0.4, "black bars are left out of the measures: " + JSON.stringify(lb));
  ok(lb.picture > 2.8 && lb.picture < 3.6, "its picture shape is found from the bars (a 3.2:1 picture): " + lb.picture);

  if (MP) {
    const b = "http://127.0.0.1:" + server.address().port + "/__mp/";
    await page.evaluate((b) => window.CurioMask.configure({ lib: b + "package/vision_bundle.mjs", wasm: b + "package/wasm", models: { parts: b + "selfie_multiclass_256x256.tflite" } }), b);
    ok(await page.evaluate(() => window.CurioMask.load()), "the AI cut-out loads (MediaPipe in the browser)");
  }
  await page.evaluate(() => window.CurioVideoUI.open());
  ok(await page.isVisible(".vd-page"), "the window opens");
  ok(await page.evaluate(() => !!(window.CurioDepth && window.CurioDepth.tilt && !window.CurioDepth.ready())), "the depth warp is loaded (its AI waits until a camera angle change is drawn)");
  ok((await page.locator(".vd-drop").count()) === 2, "two drop boxes to start");
  await page.evaluate(() => window.CurioVideoUI.bring("a", window.__a));
  await page.evaluate(() => window.CurioVideoUI.bring("b", window.__b));
  const st = await page.evaluate(() => {
    const s = window.CurioVideoUI.state();
    return { a: s.a && { nodes: s.a.nodes, raw: !!s.a.raw.db, dur: s.a.duration }, b: !!s.b };
  });
  ok(st.a && st.b, "both clips are taken apart");
  ok(st.a && st.a.raw, "the inspiration's sound is read");
  const dt = await page.evaluate(async () => {
    const clip = await window.CurioClip.open(window.__b),
      v = clip.video;
    await window.CurioClip.seek(v, Math.min(1, clip.duration / 2));
    const W = v.videoWidth,
      H = v.videoHeight;
    const draw = (zoom, detail) => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const x = c.getContext("2d", { willReadFrequently: true });
      window.CurioClip.drawApplied(x, v, { zoom, luma: 1, contrast: 1, sat: 1 }, W, H, { captions: false, detail });
      return x.getImageData(0, 0, W, H).data;
    };
    /* how hard the edges are: the sum of squared steps between neighbours */
    const edges = (d) => {
      let e = 0;
      for (let i = 4; i < d.length; i += 4) e += (d[i + 1] - d[i - 3]) ** 2;
      return e;
    };
    /* the sharpen on its own (the deblock smooths tile steps away, which this measure would count as edges) */
    window.CurioDetail.configure({ deblock: 0 });
    const plain = draw(2.5, false),
      sharp = draw(2.5, true);
    window.CurioDetail.configure({ deblock: 1 });
    const full = draw(2.5, true);
    let changed = 0;
    for (let i = 0; i < full.length; i++) if (Math.abs(full[i] - plain[i]) > 2) changed++;
    const one = draw(1, true),
      oneOff = draw(1, false);
    let same = true;
    for (let i = 0; i < one.length; i++) if (one[i] !== oneOff[i]) same = false;
    return { gain: edges(sharp) / Math.max(1, edges(plain)), changed: changed / full.length, same, box: !!document.querySelector("[data-detail]") };
  });
  /* The sharpen itself is proven on made-up edges in run.js; on the recorded clip (it varies run to run, and the
     crop is drawn from a block-aligned copy) the edge measure sits near 1, so this checks the zoom path runs, is
     not softer, and leaves an unzoomed frame alone. */
  ok(dt.gain > 0.98 && dt.changed > 0.005 && dt.same, "sharper zooms: a 2.5x zoom is drawn through it and is no softer, no zoom is untouched: " + JSON.stringify(dt));
  ok(dt.box, "the Sharper zooms switch shows");
  const key = st.a && st.a.nodes.valueKey;
  ok(key && key.length >= 3, "the light lane changes as the clip goes dark and bright: " + JSON.stringify(key));
  ok((await page.locator(".vd-lane").count()) >= 15, "a lane per curiosity: " + (await page.locator(".vd-lane").count()));
  ok((await page.locator(".vd-ai").count()) === 1, "the AI cut-outs box shows");
  if (MP) {
    const el = await page.evaluate(() => {
      const s = window.CurioVideoUI.state();
      return s.a.elements && { n: s.a.elements.times.length, parts: Object.keys(s.a.elements.parts) };
    });
    ok(el && el.n >= 2 && el.parts.includes("clothes"), "each clip's elements are found automatically: " + JSON.stringify(el));
    ok((await page.locator("text=Elements (AI cut-outs)").count()) === 1, "element lanes show");
    const fr = await page.evaluate(() => {
      const s = window.CurioVideoUI.state();
      const m = s.a.elements && s.a.elements.main;
      const p = window.CurioVideo.plan(s.a, s.b, { on: { framing: 1 }, framing: { tilt: true } });
      const a = window.CurioVideo.at(p, 0.5);
      return { main: !!(m && m.times.length === s.a.elements.times.length), roll: !!(s.a.raw.roll && s.a.raw.roll[0]), frame: a.frame, row: !!document.querySelector('[data-on="framing"]') };
    });
    ok(fr.main && fr.roll && fr.row && (!fr.frame || fr.frame.z >= 1), "shot framing: the main person and the roll are measured, and the group is there: " + JSON.stringify(fr));
    const kl = await page.evaluate(() => {
      const s = window.CurioVideoUI.state();
      const p = window.CurioVideo.plan(s.a, s.b, { on: { relight: 1 } });
      window.CurioVideo.at(p, 0.5);
      return { a: !!(s.a.light && s.a.light.times.length >= 2), b: !!(s.b.light && s.b.light.times.length >= 2), off: !!document.querySelector('[data-on="relight"]:not(:checked)') };
    });
    ok(kl.a && kl.b && kl.off, "key light: each clip's light is measured, and the group is there, off: " + JSON.stringify(kl));
    await page.click('[data-act="ai-preview"]');
    ok(/Blue: clothes/.test(await page.textContent(".vd-note")), "Show what it found tints the cut-out");
    /* Make a puppet: only with Maya's rig (CurioRig.fromCutout); a stand-in records what it is handed. */
    const real = await page.evaluate(() => !!(window.CurioRig && window.CurioRig.fromCutout));
    if (!real) await page.evaluate(() => (window.CurioRig = { fromCutout: (c, name) => (window.__puppet = { w: c.width, h: c.height, name }) }));
    else await page.evaluate(() => { const f = window.CurioRig.fromCutout; window.CurioRig.fromCutout = (c, name) => ((window.__puppet = { w: c.width, h: c.height, name }), f(c, name)); });
    await page.click('[data-act="ai-preview"]');
    await page.click('[data-act="ai-puppet"]');
    const pup = await page.evaluate(() => window.__puppet || null);
    const said = await page.textContent(".vd-note");
    ok((pup && pup.w > 0 && pup.h > 0) || /no people/.test(said), "Make a puppet hands the cut-out to the rig: " + JSON.stringify(pup) + " " + said);
    /* Escape with the puppet's dialog open leaves the Video window open; then the dialog is closed for the rest. */
    if (await page.evaluate(() => !!document.querySelector("dialog[open]"))) {
      await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
      ok(await page.evaluate(() => !document.querySelector(".vd-page").hidden), "Escape on the puppet's dialog keeps the Video window open");
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach((d) => d.close()));
    }
  }
  ok((await page.locator(".vd-node").count()) >= 3, "nodes drawn where values change");
  await page.screenshot({ path: path.join(SHOTS, "video-lanes.png"), fullPage: false });
  /* The newer measures are lanes too (video/lanes.js): the look of the picture at least (every clip has one). */
  const newer = await page.evaluate(() => [...document.querySelectorAll(".vd-lanes [data-lane]")].map((b) => b.dataset.lane));
  ok(["colorRange.filmStock", "texture", "aspect", "aspect.letterbox", "cameraLensLens.vignette", "colorFilter"].every((id) => newer.includes(id)), "palette, grain and softness and frame shape show as lanes: " + newer.join(" "));
  ok((await page.locator(".vd-group h4", { hasText: "Look of the picture" }).count()) === 1, "under their own heading");
  const looksGroup = page.locator(".vd-group", { has: page.locator("h4", { hasText: "Look of the picture" }) });
  await looksGroup.scrollIntoViewIfNeeded();
  await looksGroup.screenshot({ path: path.join(SHOTS, "video-lanes-look.png") });

  /* Onto My film. */
  await page.click('[data-act="to-film"]');
  const lanes = await page.evaluate(() => Object.keys(window.CurioEngine.state().lanes).filter((k) => /valueKey|volume/.test(k)));
  ok(lanes.length >= 2, "lanes put on My film: " + lanes.join(", "));
  const looksOnFilm = await page.evaluate(() => Object.keys(window.CurioEngine.state().lanes).filter((k) => /\|(colorRange\.filmStock|texture|aspect)$/.test(k)));
  ok(looksOnFilm.length >= 3, "the look of the picture goes on My film too: " + looksOnFilm.join(", "));
  ok(await page.evaluate(() => { const r = window.CurioEngine.state().refs; return !!(r.length && r[r.length - 1].lanes.texture); }), "and into the reference, to carry onto another film");
  const said = await page.textContent(".vd-note");
  ok(/Put \d+ lanes on My film/.test(said), "says what it did: " + said);

  /* Light only, then check. */
  await page.click('[data-all="0"]');
  await page.check('[data-on="light"]');
  await page.click('[data-act="check"]');
  await page.waitForFunction(() => window.CurioVideoUI.state().checks && window.CurioVideoUI.state().checks.light, null, { timeout: 120000 });
  const light = await page.evaluate(() => window.CurioVideoUI.state().checks.light);
  ok(light.corrAfter > 0.7 && light.corrAfter > light.corrBefore + 0.3, "your clip now goes light and dark with the inspiration: " + JSON.stringify(light));
  ok((await page.locator(".vd-check .good").count()) === 1, "the check shows on the light row");

  /* The inspiration's warm palette only, then check. */
  await page.uncheck('[data-on="light"]');
  await page.check('[data-on="palette"]');
  await page.click('[data-act="check"]');
  await page.waitForFunction(() => window.CurioVideoUI.state().checks && window.CurioVideoUI.state().checks.palette, null, { timeout: 120000 });
  const pal = await page.evaluate(() => window.CurioVideoUI.state().checks.palette);
  ok(pal.gapAfter < pal.gapBefore * 0.7, "your clip now has the inspiration's palette: " + JSON.stringify(pal));

  /* Rhythm: the inspiration's beat (or its cuts or loudest sounds) is found when it comes in; turned on with its
     music under yours, the check sees the picture change on the beat, and the saved sound carries its music. */
  const rh = await page.evaluate(() => window.CurioVideoUI.state().a.rhythm);
  ok(rh && /^(sound|cuts|accents|none)$/.test(rh.from), "the inspiration's rhythm is found: " + JSON.stringify(rh && { from: rh.from, bpm: rh.bpm, beats: rh.beats }));
  ok((await page.locator('[data-on="rhythm"]:not(:checked)').count()) === 1 && (await page.locator('[data-on="music"]:not(:checked)').count()) === 1, "Rhythm and Its music under yours are there, off");
  const mix = await page.evaluate(async () => {
    const A = window.CurioVideoUI.state().a,
      B = window.CurioVideoUI.state().b;
    const a = await window.CurioClip.open(window.__a),
      b = await window.CurioClip.open(window.__b);
    const [sa, sb] = [await window.CurioClip.pcm(a), await window.CurioClip.pcm(b)];
    const rms = (d, t0, t1) => {
      let s = 0;
      for (let i = Math.round(t0 * sb.rate); i < Math.round(t1 * sb.rate); i++) s += d[i] * d[i];
      return Math.sqrt(s / ((t1 - t0) * sb.rate));
    };
    const p = window.CurioVideo.plan(A, B, { on: { music: 1 } });
    const own = window.CurioClip.appliedPcm(p, sb).data,
      withM = window.CurioClip.appliedPcm(p, sb, sa).data;
    /* the inspiration is loud from 1 to 2 s and quiet from 2 to 3 s */
    return { loud: rms(withM, 1.2, 1.8) - rms(own, 1.2, 1.8), quiet: rms(withM, 2.2, 2.8) - rms(own, 2.2, 2.8) };
  });
  ok(mix.loud > 0.05 && mix.loud > mix.quiet + 0.05, "its music is mixed under your sound, loud where it is loud: " + JSON.stringify(mix));
  /* the made-up inspiration has only two loud starts (no beat, no cuts): give it four beats so the check runs */
  if (!rh || rh.beats.length < 4) await page.evaluate(() => (window.CurioVideoUI.state().a.rhythm = window.CurioRhythm.fromCuts([0.5, 1.5, 2.5, 3.5], 4.2)));
  {
    await page.uncheck('[data-on="palette"]');
    await page.check('[data-on="rhythm"]');
    await page.check('[data-on="music"]');
    await page.click('[data-act="check"]');
    await page.waitForFunction(() => window.CurioVideoUI.state().checks && window.CurioVideoUI.state().checks.rhythm, null, { timeout: 120000 });
    const rc = await page.evaluate(() => window.CurioVideoUI.state().checks.rhythm);
    ok(rc.corrAfter > rc.corrBefore, "your clip now changes on the inspiration's beat: " + JSON.stringify(rc));
  }
  /* Motion feel: measured when a clip comes in (smear and picture rate), off until turned on; its check runs. */
  {
    const sh = await page.evaluate(() => [window.CurioVideoUI.state().a.shutter, window.CurioVideoUI.state().b.shutter].map((s) => s && { rate: s.rate, shutter: s.shutter, n: s.moments.length }));
    ok(sh[0] && sh[1] && sh[0].n >= 1, "both clips' motion feel is measured: " + JSON.stringify(sh));
    ok((await page.locator('[data-on="shutter"]:not(:checked)').count()) === 1, "Motion feel is there, off");
    await page.uncheck('[data-on="rhythm"]');
    await page.uncheck('[data-on="music"]');
    await page.check('[data-on="shutter"]');
    await page.click('[data-act="check"]');
    await page.waitForFunction(() => window.CurioVideoUI.state().checks && window.CurioVideoUI.state().checks.shutter, null, { timeout: 120000 });
    const sc = await page.evaluate(() => window.CurioVideoUI.state().checks.shutter);
    ok(sc.feature === "shutter" && (sc.text || sc.note), "the motion feel check reports: " + JSON.stringify(sc));
    await page.uncheck('[data-on="shutter"]');
  }

  /* Everything, played and saved. */
  await page.click('[data-all="1"]');
  ok((await page.locator(".vd-dialogue li").count()) >= 1, "new lines fitted to the inspiration's talking");
  await page.click('[data-act="save"]');
  await page.waitForSelector(".vd-actions a[download]", { timeout: 60000 });
  const size = await page.evaluate(async () => (await (await fetch(document.querySelector(".vd-actions a[download]").href)).blob()).size);
  ok(size > 10000, "a saved video: " + size + " bytes");
  await page.screenshot({ path: path.join(SHOTS, "video-applied.png"), fullPage: false });

  /* Swap: your clip becomes the inspiration. */
  const before = await page.evaluate(() => window.CurioVideoUI.state().a.name);
  await page.click('[data-act="swap"]');
  const after = await page.evaluate(() => window.CurioVideoUI.state().a.name);
  ok(before !== after && /My test clip/.test(after), "swap puts your clip first");

  /* The Screen's bar has the button. */
  await page.click('[data-act="close"]');
  ok(!(await page.isVisible(".vd-page")), "closes");
  if (await page.evaluate(() => !!window.CurioScreen)) {
    await page.evaluate(() => window.CurioScreen.open());
    await page.waitForSelector(".sc-bar [data-video-open]", { timeout: 5000 }).catch(() => {});
    ok((await page.locator(".sc-bar [data-video-open]").count()) === 1, "the Screen's bar has Import a video");
    await page.click(".sc-bar [data-video-open]");
    ok(await page.isVisible(".vd-page"), "and it opens the window");
  }
  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
