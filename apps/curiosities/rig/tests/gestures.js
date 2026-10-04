/* Acting moves (rig/gestures.js) in a real browser:
   node apps/curiosities/rig/tests/gestures.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the add-on and its Acting moves sliders and buttons are in the 3D window; every move changes the pose of
   the Plain figure and then gives it back exactly (rest pose again); How big scales a move; How fast, Wind-up,
   Hold, Settle and Comedy timing change its timing the way their words say; Cesium Man, the desk lamp and the
   character made from words do moves too (the lamp's double take turns its shade); nothing goes through the
   floor during a pratfall; a move plays on top of a walk; words in "Tell it what you want" play a move and pass
   the rest of the sentence to the rules; on the Screen, a node on the Acting move lane plays the move when the
   playhead reaches it, and "Key this on the timeline" keys a move typed in words. No page errors. */
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
const SHOTS = arg("--shots", "");
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

/* In the page: helpers on window.T_ for measuring how far the body is from where it was. */
const HELPERS = () => {
  const frames = (k) => new Promise((r) => { const go = () => (k-- > 0 ? requestAnimationFrame(go) : r()); go(); });
  const G = () => CurioRig.gestures;
  window.T_ = {
    frames,
    ctl: () => (window.T_.use ? window.T_.use() : CurioRig.current()),
    snap() {
      const c = T_.ctl();
      return { q: c.bones().map((b) => b.quaternion.clone()), y: c.ctx.holder.position.y, rx: c.ctx.holder.rotation.x };
    },
    /* degrees of turn, summed over every joint, plus the body's rise and tip, from a snapshot */
    dev(s0) {
      const c = T_.ctl();
      const bs = c.bones();
      let sum = 0;
      bs.forEach((b, i) => (sum += (2 * Math.acos(Math.min(1, Math.abs(b.quaternion.dot(s0.q[i]))))) * 57.2958));
      return sum + Math.abs(c.ctx.holder.position.y - s0.y) * 100 + Math.abs(c.ctx.holder.rotation.x - s0.rx) * 57.3;
    },
    /* play a move, sample it at n moments, return the biggest change, the lowest surface point and the end */
    async run(move, n) {
      const c = T_.ctl();
      await frames(20);
      const s0 = T_.snap();
      G().play(c, move);
      G().seek(c, 0);
      await frames(2);
      const total = G().state(c).total;
      let peak = 0;
      let low = 9;
      const phases = new Set();
      for (let i = 1; i < n; i++) {
        G().seek(c, (total * i) / n);
        await frames(4);
        const st = G().state(c);
        phases.add(st.phase);
        peak = Math.max(peak, T_.dev(s0));
        low = Math.min(low, st.low);
      }
      G().seek(c, total + 0.05);
      await frames(2);
      G().seek(c, null);
      await frames(40);
      return { peak, back: T_.dev(s0), low, total, phases: [...phases], playing: G().state(c).playing };
    },
  };
};

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const load = async (id) => {
    await page.selectOption('.rig-dlg [data-rig="character"]', id);
    await page.evaluate(() => CurioRig.current().ready);
  };
  try {
    await page.goto(base + "index.html?screen=0");
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    await page.evaluate(() => CurioRig.load());
    await page.waitForFunction(() => window.CurioRig && CurioRig.gestures && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(await page.evaluate(() => CurioRig.extensions().some((x) => x.id === "gestures")), "Acting moves is part of the 3D view");
    const lens = await page.evaluate(() => {
      const c = (window.CURIOSITIES || []).find((x) => x.id === "actingLens") || (window.CuriosityDB && CuriosityDB.get && CuriosityDB.get("curiosity", "actingLens"));
      return c ? { label: c.label, sliders: (c.sliders || []).map((s) => s.id) } : null;
    });
    ok(lens && /Acting moves/.test(lens.label) && ["move", "size", "speed", "windup", "hold", "settle", "pause", "cue"].every((s) => lens.sliders.includes(s)), "the Acting moves lens is in the curiosity database with its sliders " + JSON.stringify(lens && lens.sliders));
    const words = await page.evaluate(() => {
      const r = {};
      ["does a double take", "shrugs", "she slips on a banana peel", "facepalms", "spits out his coffee", "slowly turns to the camera", "freezes in shock", "his knees knock", "does a victory dance", "waves hello", "points", "nods", "shakes her head", "hands on hips", "crosses his arms", "sighs", "looks around", "jumps for joy", "takes a bow"].forEach((t) => (r[t] = (CurioRig.gestures.read(t) || {}).id));
      r.mixed = CurioRig.gestures.read("sleepy, and shrugs");
      r.none = CurioRig.gestures.read("walk fast");
      return r;
    });
    const want = ["double take", "shrug", "pratfall", "facepalm", "spit take", "slow burn", "freeze in shock", "wobbly knees", "victory dance", "wave", "point", "nod yes", "shake no", "hands on hips", "cross arms", "sigh", "look around", "jump for joy", "bow"];
    const got = Object.keys(words).filter((k) => k !== "mixed" && k !== "none").map((k) => words[k]);
    ok(JSON.stringify(got) === JSON.stringify(want), "phrases map to moves: " + got.join(", "));
    ok(words.mixed && words.mixed.id === "shrug" && words.mixed.rest === "sleepy" && words.none === null, `"sleepy, and shrugs" is a shrug and leaves "sleepy" for the rules; "walk fast" is no move`);

    await page.evaluate(() => {
      localStorage.setItem("curiosities-rig3d-v1", JSON.stringify({ character: "rigged-figure", rules: { breath: false } }));
      document.querySelector("#lib-menu [data-rig3d]").click();
    });
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    const err = await page.evaluate(() => CurioRig.current().error());
    if (!THREE_FILE && err) {
      ok(/three\.js/.test(err), "without three.js the window says it is needed (" + err + ")");
    } else {
      ok(!err, "the Plain figure loads" + (err ? ": " + err : ""));
      await page.evaluate(HELPERS);
      const panel = await page.evaluate(() => ({
        rows: ["actingLens.move", "actingLens.size", "actingLens.speed", "actingLens.windup", "actingLens.hold", "actingLens.settle", "actingLens.pause", "actingLens.cue"].every((id) => document.querySelector(`.rig-dlg [data-row="${id}"]`)),
        buttons: [...document.querySelectorAll('.rig-dlg [data-ext="gestures"] [data-gest]')].map((b) => b.dataset.gest),
        words: document.querySelector('.rig-dlg [data-ext="gestures"]').textContent,
      }));
      ok(panel.rows, "the Acting moves sliders are in the panel (move, How big, How fast, Wind-up, Hold, Settle, Comedy timing, Play it)");
      ok(panel.buttons.length === 19 && /Comedy/.test(panel.words) && /Everyday/.test(panel.words) && /anticipation/.test(panel.words), `a play button for each of the ${panel.buttons.length} moves, in Comedy and Everyday, with the timing explained in plain words`);

      /* every move changes the pose, then gives it back */
      const res = {};
      for (const m of want) res[m] = await page.evaluate((m) => T_.run(m, 10), m);
      const bad = want.filter((m) => !(res[m].peak > 12 && res[m].back < 1.5 && !res[m].playing));
      ok(!bad.length, "Plain figure: every move changes the pose and returns to rest" + (bad.length ? ": " + bad.map((m) => `${m} peak ${res[m].peak.toFixed(1)} back ${res[m].back.toFixed(2)}`).join("; ") : ` (peaks ${want.map((m) => res[m].peak.toFixed(0)).join(", ")})`));
      ok(res.pratfall.low > -0.01 && res["jump for joy"].low > -0.01 && res.bow.low > -0.01, `nothing goes through the floor (lowest point: pratfall ${res.pratfall.low.toFixed(3)}, jump ${res["jump for joy"].low.toFixed(3)}, bow ${res.bow.low.toFixed(3)})`);
      const phases = await page.evaluate(() => {
        const G = CurioRig.gestures;
        return G.plan(G.MOVES[0], false, { size: "normal", speed: "normal", windup: "clear", hold: "short", settle: "eases back", pause: "a beat" }).segs.map((s) => s.phase);
      });
      ok(["act", "antic", "pause", "pay", "hold", "settle"].every((p) => phases.includes(p)) && phases.indexOf("pause") < phases.indexOf("antic") && phases.indexOf("antic") < phases.indexOf("pay"), "a double take: look, look back, pause, wind-up, payoff, hold, settle (" + phases.join(", ") + ")");

      /* How big */
      const set = (o) => page.evaluate((o) => Object.entries(o).forEach(([k, v]) => CurioRig.current().set("actingLens." + k, v)), o);
      await set({ size: "tiny" });
      const tiny = await page.evaluate(() => T_.run("sigh", 10));
      const tinyDt = await page.evaluate(() => T_.run("double take", 10));
      await set({ size: "huge" });
      const huge = await page.evaluate(() => T_.run("sigh", 10));
      const hugeDt = await page.evaluate(() => T_.run("double take", 10));
      await set({ size: "normal" });
      ok(huge.peak > tiny.peak * 2.5 && hugeDt.peak > tinyDt.peak * 1.5 && res.sigh.peak > tiny.peak && res.sigh.peak < huge.peak, `How big scales the move (sigh: tiny ${tiny.peak.toFixed(0)}, normal ${res.sigh.peak.toFixed(0)}, huge ${huge.peak.toFixed(0)}; double take: ${tinyDt.peak.toFixed(0)} to ${hugeDt.peak.toFixed(0)})`);

      /* timing: read the plan the sliders make */
      const timing = await page.evaluate(() => {
        const G = CurioRig.gestures;
        const mv = G.MOVES.find((m) => m.id === "double take");
        const base = { size: "normal", speed: "normal", windup: "clear", hold: "short", settle: "eases back", pause: "a beat" };
        const P = (o) => G.plan(mv, false, Object.assign({}, base, o));
        const dur = (p, ph) => p.segs.filter((s) => s.phase === ph).reduce((a, s) => a + s.d, 0);
        return {
          slow: P({ speed: "very slow" }).total, fast: P({ speed: "snappy" }).total,
          noPause: dur(P({ pause: "no pause" }), "pause"), longPause: dur(P({ pause: "painfully long" }), "pause"),
          noWind: P({ windup: "none" }).segs.some((s) => s.phase === "antic"), bigWind: Math.abs(P({ windup: "big" }).segs.find((s) => s.phase === "antic").to["spine.0"]), clearWind: Math.abs(P({}).segs.find((s) => s.phase === "antic").to["spine.0"]),
          noHold: dur(P({ hold: "no hold" }), "hold"), longHold: dur(P({ hold: "long" }), "hold"),
          dead: P({ settle: "stops dead" }).segs.slice(-1)[0], wobble: P({ settle: "overshoots and wobbles" }).segs.slice(-1)[0],
          payOvershoot: P({ settle: "overshoots and wobbles" }).segs.find((s) => s.phase === "pay").e,
          pauseBeforePay: (() => { const s = P({}).segs; const i = s.findIndex((x) => x.phase === "pause"); return i >= 0 && s.slice(i + 1).some((x) => x.phase === "pay"); })(),
        };
      });
      ok(timing.fast < timing.slow / 2, `How fast: snappy ${timing.fast.toFixed(2)}s, very slow ${timing.slow.toFixed(2)}s`);
      ok(timing.noPause === 0 && timing.longPause > 1.5 && timing.pauseBeforePay, `Comedy timing: a pause just before the payoff, none to ${timing.longPause.toFixed(1)}s`);
      ok(!timing.noWind && timing.bigWind > timing.clearWind, "Wind-up: none leaves it out; big winds up further");
      ok(timing.longHold > timing.noHold * 5, `Hold the pose: ${timing.noHold.toFixed(2)}s to ${timing.longHold.toFixed(2)}s`);
      ok(timing.dead.d < timing.wobble.d && timing.wobble.e === "wobble" && timing.payOvershoot === "back", "Settle: stops dead is quick; overshoots and wobbles goes past and wobbles back, and the payoff overshoots too");
      const wob = await page.evaluate(() => {
        const G = CurioRig.gestures;
        const p = G.plan(G.MOVES.find((m) => m.id === "point"), false, { size: "normal", speed: "normal", windup: "clear", hold: "short", settle: "overshoots and wobbles", pause: "a beat" });
        return p.segs.slice(-1)[0].e;
      });
      ok(wob === "wobble", "every move takes the settle slider");

      /* on top of a walk */
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "walking"));
      const walk = await page.evaluate(async () => {
        const c = CurioRig.current();
        await T_.frames(10);
        CurioRig.gestures.play(c, "wave");
        CurioRig.gestures.seek(c, 0.9);
        await T_.frames(6);
        const arm = c.rig().arms.R;
        const hand = c.where(arm[2])[1] > c.where(arm[0])[1];
        const leg = c.turned(c.rig().legs.L[0]);
        CurioRig.gestures.seek(c, null);
        return { hand, playing: c.playing(), leg };
      });
      ok(walk.hand && /walk/.test(walk.playing), `a wave plays on top of the walk: the hand is up while the legs keep walking (${walk.playing})`);
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "standing still"));
      await page.evaluate(() => T_.frames(60));

      /* words */
      await page.fill('.rig-dlg [data-rig="ask"]', "does a double take");
      await page.click('.rig-dlg [data-rig="ask-form"] button');
      await page.waitForTimeout(100);
      const w1 = await page.evaluate(() => ({ st: CurioRig.gestures.state(), said: document.querySelector('.rig-dlg [data-rig="said"]').textContent, input: document.querySelector('.rig-dlg [data-rig="ask"]').value }));
      ok(w1.st.playing === "double take" && /Acting move: double take/.test(w1.said) && !/No words it knows/.test(w1.said) && w1.input === "does a double take", `Tell it what you want plays the move ("${w1.said.slice(0, 60)}")`);
      await page.fill('.rig-dlg [data-rig="ask"]', "sleepy, and shrugs");
      await page.click('.rig-dlg [data-rig="ask-form"] button');
      await page.waitForTimeout(100);
      const w2 = await page.evaluate(() => ({ st: CurioRig.gestures.state(), spine: CurioRig.current().ctx.pick("rigRulesLens.slump"), said: document.querySelector('.rig-dlg [data-rig="said"]').textContent }));
      ok(w2.st.playing === "shrug" && w2.spine === "slumped" && /sleepy/.test(w2.said), `"sleepy, and shrugs" shrugs and makes it sleepy (Spine: ${w2.spine})`);
      await page.click('.rig-dlg [data-rig="undo-ask"]').catch(() => {});
      /* a play button, and Play it on the cue slider */
      await page.click('.rig-dlg [data-ext="gestures"] [data-gest="bow"]');
      await page.evaluate(() => T_.frames(3));
      const b = await page.evaluate(() => ({ st: CurioRig.gestures.state(), move: CurioRig.current().ctx.pick("actingLens.move"), now: document.querySelector('.rig-dlg [data-gest-now]').textContent }));
      ok(b.st.playing === "bow" && b.move === "bow" && /Playing: bow/.test(b.now), `the play button plays it and says so ("${b.now}")`);
      const cue = await page.evaluate(async () => {
        const c = CurioRig.current();
        const n0 = CurioRig.gestures.state(c).played;
        c.set("actingLens.cue", "go");
        await T_.frames(3);
        const n1 = CurioRig.gestures.state(c).played;
        c.set("actingLens.cue", "wait");
        c.set("actingLens.move", "nod yes");
        await T_.frames(3);
        return { again: n1 === n0 + 1, nod: CurioRig.gestures.state(c).playing };
      });
      ok(cue.again && cue.nod === "nod yes", "Play it turning to go plays the move again; picking another move plays it");
      await page.evaluate(() => T_.frames(200));

      /* other bodies */
      for (const id of ["cesium-man", "made"]) {
        await load(id);
        const r = {};
        for (const m of ["double take", "shrug", "pratfall", "cross arms"]) r[m] = await page.evaluate((m) => T_.run(m, 8), m);
        const bad2 = Object.keys(r).filter((m) => !(r[m].peak > 12 && r[m].back < 1.5 && r[m].low > -0.015));
        ok(!bad2.length, `${id}: moves change the pose, stay above the floor and return to rest` + (bad2.length ? ": " + bad2.map((m) => `${m} peak ${r[m].peak.toFixed(1)} back ${r[m].back.toFixed(2)} low ${r[m].low.toFixed(3)}`).join("; ") : ""));
      }
      await load("desk-lamp");
      const lamp = {};
      for (const m of want) lamp[m] = await page.evaluate((m) => T_.run(m, 8), m);
      const bad3 = want.filter((m) => !(lamp[m].peak > 8 && lamp[m].back < 1.5 && lamp[m].low > -0.015));
      ok(!bad3.length, "the desk lamp does every move along its chain and returns to rest" + (bad3.length ? ": " + bad3.map((m) => `${m} peak ${lamp[m].peak.toFixed(1)} back ${lamp[m].back.toFixed(2)} low ${lamp[m].low.toFixed(3)}`).join("; ") : ""));
      const snapTip = await page.evaluate(async () => {
        const c = CurioRig.current();
        await T_.frames(10);
        const tip = c.rig().head;
        const t0 = c.turned(tip);
        const G = CurioRig.gestures;
        G.play(c, "double take");
        const p = G.plan(G.MOVES[0], true, { size: "normal", speed: "normal", windup: "clear", hold: "short", settle: "eases back", pause: "a beat" });
        const pay = p.segs.find((s) => s.phase === "pay");
        G.seek(c, pay.t0 + pay.d + 0.05);
        await T_.frames(8);
        const t1 = c.turned(tip);
        G.seek(c, null);
        return { t0, t1 };
      });
      ok(snapTip.t1 > snapTip.t0 + 40, `the lamp's double take snaps its shade round (${snapTip.t0.toFixed(0)}° to ${snapTip.t1.toFixed(0)}°)`);
      ok(lamp.pratfall.peak > 60, "the lamp's pratfall tips it right over");
      await page.evaluate(() => document.querySelector(".rig-dlg").close());
    }

    /* On the Screen: a node on the Acting move lane plays it; words can be keyed */
    if (THREE_FILE) {
      await page.goto(base + "index.html?screen=1");
      await page.evaluate(() => {
        localStorage.removeItem("curiosities-rig3d-screen-view-v1");
        localStorage.removeItem("curiosities-rig3d-cast-v1");
        localStorage.setItem("curiosities-rig3d-v1", JSON.stringify({ character: "rigged-figure", rules: { breath: false } }));
      });
      await page.reload();
      await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioRigScreen && document.querySelector('[data-panel="rig3d"] [data-r3s="toggle"]'), null, { timeout: 15000 });
      await page.evaluate(() => window.CurioScreen.setRow(0));
      await page.click('[data-panel="rig3d"] [data-r3s="toggle"]');
      await page.waitForFunction(() => window.CurioRigScreen.controller());
      await page.evaluate(() => window.CurioRigScreen.controller().ready);
      await page.waitForTimeout(300);
      const wrote = await page.evaluate(() => {
        const E = window.CurioEngine;
        const st = E.state();
        const id = "actingLens.move";
        const who = window.CurioRigScreen.shown();
        let track = (st.tracks.find((t) => t.curiosities.includes(id)) || {}).id;
        const cmds = [];
        if (!track) {
          track = who || window.CurioLanes.trackFor(id, st);
          cmds.push({ type: "addCuriosity", track, curiosity: id });
        }
        cmds.push({ type: "setPoint", row: st.rows[2].id, track, curiosity: id, value: "shrug" });
        const r = E.send({ type: "batch", label: "Acting move for the test", commands: cmds });
        return { ok: r.ok, error: r.error, track };
      });
      ok(wrote.ok, "an Acting move node is written on the timeline" + (wrote.ok ? "" : ": " + wrote.error));
      await page.waitForTimeout(300);
      const before = await page.evaluate(() => CurioRig.gestures.state(window.CurioRigScreen.controller()).played);
      await page.evaluate(() => window.CurioScreen.setRow(2));
      await page.waitForTimeout(400);
      const at = await page.evaluate(() => CurioRig.gestures.state(window.CurioRigScreen.controller()));
      ok(at.played === before + 1 && at.playing === "shrug", `the playhead reaching the node plays the shrug (${at.playing || "nothing"})`);
      await page.evaluate(() => window.CurioScreen.setRow(3));
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => CurioRig.gestures.state(window.CurioRigScreen.controller()).played);
      ok(after === at.played, "a moment without a node does not play it again");
      if (SHOTS) {
        fs.mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({ path: path.join(SHOTS, "gestures-screen.png") });
      }
      await page.evaluate(() => window.CurioScreen.setRow(1));
      await page.fill('[data-panel="rig3d"] [data-r3s="ask"]', "does a double take");
      await page.click('[data-panel="rig3d"] .r3s-ask button');
      const said = await page.textContent('[data-panel="rig3d"] [data-r3s="said"]');
      const playing = await page.evaluate(() => CurioRig.gestures.state(window.CurioRigScreen.controller()).playing);
      ok(playing === "double take" && /Acting move: double take/.test(said), `the Screen's Tell it what to do plays the move ("${said.slice(0, 70)}")`);
      await page.click('[data-panel="rig3d"] [data-r3s="key"]');
      const keyed = await page.evaluate(() => {
        const st = window.CurioEngine.state();
        const t = st.tracks.find((x) => x.curiosities.includes("actingLens.move"));
        const lane = t && st.lanes[t.id + "|actingLens.move"];
        return lane && lane.points[st.rows[1].id];
      });
      ok(keyed === "double take", `Key this on the timeline keys the move at the playhead (${keyed})`);
    }
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 4).join(" | ") : ""));
  } catch (e) {
    ok(false, "ran to the end: " + ((e && e.stack) || e));
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? `${failed} failed` : "all passed");
  process.exit(failed ? 1 : 0);
})();
