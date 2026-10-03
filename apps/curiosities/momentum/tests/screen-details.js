/* The Momentum section in the Screen's Details (momentum/screen-details.js):
     node apps/curiosities/momentum/tests/screen-details.js
     NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/momentum/tests/screen-details.js --browser [--three <three.min.js>] [--shots <dir>]
   With no page: detailsFor() gives every curiosity its family, cue, push, story drive (the same as drive.js, with
   or without it), "Try this" line and plain sentences; it counts how often the curiosity takes attention in a
   reading; estimated films are left out and named; the playhead decides whether the button can move attention;
   and the button's move on the engine's film is one undo step.
   With --browser: the app's Screen, the section under the Details header, a library card, a lane and a Details
   row each change it, the button (one undo step), no page errors, no sideways scroll at 375 pixels, and
   screenshots in --shots (default: the system temp folder). */
const path = require("path");
const fs = require("fs");
const os = require("os");
const vm = require("vm");
const assert = require("assert");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const ROOT = path.join(__dirname, "..", "..");
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "drive.js", "screen-details.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const SD = ctx.CurioMomentumDetails;
const M = ctx.CurioMomentum;
const A = ctx.CurioAttention;
const R = ctx.CurioRates;
const D = ctx.CurioDrive;
const E = ctx.CurioEngine;
const ME = ctx.CurioMomentumEngine;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const studies = core.CuriosityDB.studiesExport().studies;
const readings = studies.map((s) => ({ title: s.title, estimate: false, reading: A.fromStudy(s) }));

ok("screen-details.js loads with no page and through require", () => {
  assert(SD && typeof SD.detailsFor === "function");
  const req = require(path.join(ROOT, "momentum", "screen-details.js"));
  assert.strictEqual(typeof req.detailsFor, "function");
});

ok("a camera curiosity: its family, letter, cue, push and plain sentences, decoration", () => {
  const d = SD.detailsFor("shotSize", readings[0].reading, readings, { row: 0 });
  assert.strictEqual(d.family, "camera");
  assert.deepStrictEqual(d.mark, M.mark("camera"));
  assert.strictEqual(d.cue.id, M.note("shotSize").cue);
  assert.strictEqual(d.push, M.note("shotSize").push);
  assert(d.pushText.startsWith(`Its push is ${d.push} out of 5:`), d.pushText);
  assert.strictEqual(d.drives.kind, "none");
  assert(/decoration/i.test(d.drives.sentence));
  assert(d.sentences[0].includes("Camera family") && d.sentences[0].includes(d.cue.label.toLowerCase()), d.sentences[0]);
  assert(d.tryThis.length > 10 && d.plot.length > 10 && d.theme.length > 10 && d.pull.length > 10);
});

ok("the story kind matches drive.js, and the note's own rule gives the same answer without it", () => {
  const ids = M.all().map((x) => x.id);
  let checked = 0;
  ids.forEach((id) => {
    const withD = SD.detailsFor(id, null, [], {});
    const without = SD.detailsFor(id, null, [], { drive: null });
    const k = D.kindOf(id, {}, D.DEFAULTS).kind || "none";
    assert.strictEqual(withD.drives.kind, k, id);
    assert.strictEqual(without.drives.kind, k, id + " without drive.js");
    checked++;
  });
  assert(checked > 100, "checked " + checked);
  assert.strictEqual(SD.detailsFor("emotion", null, []).drives.kind, "character");
  assert(["plot", "character"].includes(SD.detailsFor("stakes", null, []).drives.kind) || !M.find("stakes"));
});

ok("every push from 0 to 5 has its own meaning, and no sentence uses an em-dash", () => {
  assert.strictEqual(SD.PUSH.length, 6);
  assert.strictEqual(new Set(SD.PUSH).size, 6);
  M.all().slice(0, 400).forEach((x) => {
    const d = SD.detailsFor(x.id, readings[1].reading, readings.concat(R.DEFAULT_FILMS), { row: 2 });
    d.sentences.concat([d.pushText, d.drives.sentence]).forEach((s) => assert(!/—/.test(s), x.id + ": " + s));
    assert(d.push >= 0 && d.push <= 5);
  });
});

ok("it counts the stretches a curiosity holds attention, the moves to it and its seconds", () => {
  const r = readings[0].reading;
  const seg = r.segments[1];
  const id = seg.curiosity;
  const d = SD.detailsFor(id, r, [], {});
  const segs = r.segments.filter((s) => s.curiosity === id);
  assert.strictEqual(d.mine.takes, segs.length);
  assert.strictEqual(d.mine.moves, r.stats.moves.filter((m) => m.curiosity === id).length);
  assert(Math.abs(d.mine.seconds - segs.reduce((a, s) => a + s.dur, 0)) < 0.1);
  assert(d.mine.sentence.startsWith("In My film it takes attention"), d.mine.sentence);
  const none = SD.detailsFor("noSuchCuriosityAtAll", r, [], {});
  assert.strictEqual(none.mine.takes, 0);
  assert.strictEqual(none.mine.sentence, "In My film it never takes attention yet.");
  /* Engine keys ("emotion@master") count as the curiosity itself. */
  const keyed = { segments: [{ curiosity: "emotion", family: "feeling", dur: 6, beat: 0 }], stats: { moves: [{ curiosity: "emotion@char1" }] }, seconds: 6 };
  const k = SD.countIn(keyed, "emotion");
  assert.deepStrictEqual([k.takes, k.moves, k.seconds, k.share], [1, 1, 6, 1]);
});

ok("the curated films: traced films are counted, estimate-only films are left out and named", () => {
  const id = readings[0].reading.segments[0].curiosity;
  const d = SD.detailsFor(id, null, readings.concat(R.DEFAULT_FILMS), {});
  assert.strictEqual(d.films.counted.length, readings.length);
  assert.strictEqual(d.films.skipped.length, R.DEFAULT_FILMS.length);
  const total = readings.reduce((a, f) => a + f.reading.segments.filter((s) => s.curiosity === id).length, 0);
  assert.strictEqual(d.films.takes, total);
  assert(d.films.sentence.includes(`In the ${readings.length} curated films with a trace`), d.films.sentence);
  assert(d.films.sentence.includes("only Claude's estimates"), d.films.sentence);
  assert(SD.detailsFor(id, null, R.DEFAULT_FILMS, {}).films.sentence.startsWith("No curated film has a trace yet"));
  assert.strictEqual(d.mine, null, "no reading of My film, no sentence about it");
});

ok("the playhead: the button moves attention only when another family holds it there", () => {
  const r = readings[0].reading;
  const s = r.segments[1];
  const same = SD.detailsFor(s.curiosity, r, [], { row: s.beat });
  assert.strictEqual(same.here.family, s.family);
  assert.strictEqual(same.canMove, false);
  const other = M.all().find((x) => x.family !== s.family);
  const d = SD.detailsFor(other.id, r, [], { row: s.beat });
  assert.strictEqual(d.canMove, true);
  assert.strictEqual(SD.holdingAt(r, s.beat), s);
  assert.strictEqual(SD.detailsFor(other.id, r, [], {}).here, null, "no playhead, no button");
});

ok("Use it to move attention here: this curiosity steps one notch at the playhead, one undo step", () => {
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const st = E.state();
  const reading = A.read(ME.beats(), { secondsPerBeat: 3, limit: 20 });
  const row = Math.min(2, st.rows.length - 1);
  const held = SD.holdingAt(reading, row);
  /* A curiosity already on a track, of another family than the one holding attention there. */
  let pick = null;
  st.tracks.forEach((t) => t.curiosities.forEach((c) => !pick && ctx.CurioScale.known(c) && M.familyOf(c) !== (held && held.family) && (pick = c)));
  assert(pick, "a curiosity of another family is on a track");
  const d = SD.detailsFor(pick, reading, [], { row });
  assert(d.canMove);
  const undo = E.history().undo.length;
  const msg = SD.useHere(d);
  assert.strictEqual(E.history().undo.length, undo + 1, "one undo step: " + msg);
  assert(/Undo takes it back/.test(msg), msg);
  assert(E.history().undo.slice(-1)[0], "the step has a label");
  E.undo();
  assert.strictEqual(E.history().undo.length, undo);
  assert.strictEqual(SD.useHere(Object.assign({}, d, { canMove: false })), "Nothing to move here.");
});

ok("the button prefers this exact curiosity, even when another of its family is already on a track", () => {
  const st = E.state();
  const reading = A.read(ME.beats(), { secondsPerBeat: 3, limit: 20 });
  const row = Math.min(2, st.rows.length - 1);
  const onTrack = new Set([].concat(...st.tracks.map((t) => t.curiosities)).map((c) => M.baseId(c)));
  const held = SD.holdingAt(reading, row);
  /* A known curiosity, not on any track, of a family that has one on a track and is not holding attention. */
  const want = M.all().find((x) => ctx.CurioScale.known(x.id) && !onTrack.has(x.id) && x.family !== (held && held.family) && [...onTrack].some((c) => M.familyOf(c) === x.family));
  assert(want, "a curiosity to try");
  const d = SD.detailsFor(want.id, reading, [], { row });
  const mv = SD.pickMove(d);
  assert(mv && M.baseId(mv.curiosity) === want.id, `picked ${mv && mv.curiosity} for ${want.id}`);
  assert.strictEqual(mv.commands[0].type, "addCuriosity");
  assert.strictEqual(mv.commands.length, 2);
  const p = SD.preview(d);
  assert(p && p.mv && typeof p.moves === "boolean");
  /* wouldMove agrees with applying it and reading again. */
  const undo = E.history().undo.length;
  ME.applyMove(mv);
  const after = SD.holdingAt(A.read(ME.beats(), { secondsPerBeat: 3, limit: 20 }), row);
  assert.strictEqual(after && after.family === want.family && after.beat === row, p.moves, "the preview matches what happened");
  E.undo();
  assert.strictEqual(E.history().undo.length, undo);
});

console.log(`\n${n} screen details checks passed`);

async function browserChecks() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  const three = arg("--three", "");
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = await new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch();
  const errors = [];
  let failed = 0;
  const check = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  async function newPage(viewport) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html?screen=1");
    if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'))))
      await page.evaluate(() => {
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
    await page.waitForFunction(() => window.CurioMomentumDetails && window.CurioScreen, null, { timeout: 15000 });
    await page.evaluate(() => !window.CurioScreen.isOpen() && window.CurioScreen.open());
    await page.waitForSelector(".sc-inspector > .mo-sd .mo-sd-h", { timeout: 8000 });
    return page;
  }
  const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))));
  /* What the section shows, and what it should show for the Screen's selection. */
  const look = (page) =>
    page.evaluate(() => {
      const el = document.querySelector(".sc-inspector > .mo-sd");
      const sel = window.CurioScreen.state().sel;
      const M = window.CurioMomentum;
      const id = sel.level === "curiosity" ? M.baseId(sel.id) : null;
      const fam = id ? M.familyOf(id) : null;
      const head = document.querySelector(".sc-inspector > .sc-insp-h");
      return {
        id,
        under: !!(el && head && el.previousElementSibling === head),
        name: (el.querySelector(".mo-sd-name") || {}).textContent || "",
        label: id ? M.note(id).label : "",
        chip: (el.querySelector(".mo-sd-chip") || {}).textContent || "",
        letter: fam ? M.mark(fam).letter : "",
        famText: (el.querySelector(".mo-sd-fam b") || {}).textContent || "",
        famLabel: fam ? M.mark(fam).label : "",
        text: el.textContent,
        button: el.querySelector('[data-mo-sd="move"]') ? { disabled: el.querySelector('[data-mo-sd="move"]').disabled } : null,
      };
    });
  try {
    const page = await newPage({ width: 1440, height: 900 });
    await settle(page);
    let v = await look(page);
    check(v.under, "the Momentum section sits just under the Details header");
    check(v.id && v.name === v.label && v.chip === v.letter && v.famText === v.famLabel, `it follows the selection: ${v.label}, family ${v.famLabel} (${v.chip})`);
    check(/Its push is \d out of 5/.test(v.text) && /Try this:/.test(v.text) && /In My film/.test(v.text) && /curated film/.test(v.text), "it says the push, Try this, My film and the curated films in sentences");
    await page.screenshot({ path: path.join(SHOTS, "screen-details-1440.png") });
    await page.locator(".sc-inspector").screenshot({ path: path.join(SHOTS, "screen-details-panel.png") });

    /* A library card of another curiosity. */
    const first = v.id;
    const card = await page.evaluate((cur) => {
      const b = [...document.querySelectorAll('.sc-lib [data-pick-card^="curiosity|"]')].find((x) => x.dataset.pickCard.split("|")[1] !== cur);
      return b ? b.dataset.pickCard : null;
    }, first);
    if (!card) check(false, "the library has a curiosity card");
    else {
      await page.click(`.sc-lib [data-pick-card="${card}"]`);
      await settle(page);
      v = await look(page);
      check(v.id && v.id !== first && v.name === v.label && v.chip === v.letter && v.under, `picking a library card updates it: ${v.label} (${v.famLabel})`);
    }

    /* A lane on the timeline: the Screen redraws Details without telling on(fn); the section comes back. Two
       library cards' + put their curiosities on the timeline first. */
    for (let k = 0; k < 2; k++) {
      const add = await page.evaluate((k) => {
        const b = document.querySelectorAll('.sc-lib [data-add-card^="curiosity|"]')[k];
        return b ? b.dataset.addCard : null;
      }, k);
      if (add) {
        await page.click(`.sc-lib [data-add-card="${add}"]`);
        await settle(page);
      }
    }
    v = await look(page);
    const lane = await page.evaluate((cur) => {
      const b = [...document.querySelectorAll(".sc-timeline .sl-name[data-pick]")].find((x) => window.CurioMomentum.baseId(x.dataset.pick) !== cur);
      return b ? b.dataset.pick : null;
    }, v.id);
    if (!lane) console.log("skip no lane on the timeline to pick");
    else {
      const before = v.id;
      await page.click(`.sc-timeline .sl-name[data-pick="${lane}"]`);
      await settle(page);
      v = await look(page);
      check(v.id && v.id !== before && v.name === v.label && v.under, `picking a lane updates it: ${v.label} (${v.famLabel})`);
    }

    /* A row in Details ("Look through it" on a curiosity name). */
    const row = await page.evaluate((cur) => {
      const b = [...document.querySelectorAll(".sc-inspector .sc-cur-name[data-select-cur]")].find((x) => window.CurioMomentum.baseId(x.dataset.selectCur) !== cur);
      return b ? b.dataset.selectCur : null;
    }, v.id);
    if (row) {
      await page.click(`.sc-inspector .sc-cur-name[data-select-cur="${row}"]`);
      await settle(page);
      v = await look(page);
      check(v.id === window_base(row) && v.name === v.label && v.under, `picking a row in Details updates it: ${v.label}`);
    }

    /* The playhead and the button: find a curiosity on a track whose family is not holding attention there. */
    const prep = await page.evaluate(() => {
      const E = window.CurioEngine;
      const SD = window.CurioMomentumDetails;
      const st = E.state();
      /* Only curiosities that can be picked on screen: the lanes on the timeline. */
      const cands = [...document.querySelectorAll(".sc-timeline .sl-name[data-pick]")].map((b) => b.dataset.pick);
      for (let r = 1; r < st.rows.length; r++)
        for (const c of cands) {
          const d = SD.read(c, r);
          const p = d && d.canMove ? SD.preview(d) : null;
          if (p && p.moves) return { cur: c, row: r };
        }
      return null;
    });
    if (!prep) check(false, "some curiosity could move attention at some moment");
    else {
      await page.evaluate((p) => {
        window.CurioScreen.setRow(p.row);
        const b = document.querySelector(`.sc-timeline .sl-name[data-pick="${p.cur}"]`);
        if (b) b.click();
        else document.querySelector(`[data-select-cur="${p.cur}"]`) ? document.querySelector(`[data-select-cur="${p.cur}"]`).click() : null;
      }, prep);
      await settle(page);
      v = await look(page);
      check(v.id === window_base(prep.cur), `${prep.cur} is picked as a lane or a row`);
      check(v.button && !v.button.disabled, `the button is offered for ${v.label} at moment ${prep.row + 1}`);
      const undo = await page.evaluate(() => window.CurioEngine.history().undo.length);
      await page.click('.mo-sd [data-mo-sd="move"]');
      await settle(page);
      await page.evaluate(() => {
        const box = document.querySelector(".sc-inspector");
        box.scrollTop = 0;
      });
      const after = await page.evaluate(() => ({ undo: window.CurioEngine.history().undo.length, flash: (document.querySelector(".mo-sd .mo-sd-flash") || {}).textContent || "" }));
      check(after.undo === undo + 1 && /Undo takes it back/.test(after.flash), `the button is one undo step: "${after.flash}"`);
      await page.locator(".sc-inspector").screenshot({ path: path.join(SHOTS, "screen-details-moved.png") });
      await page.evaluate(() => window.CurioEngine.undo());
      await settle(page);
      check((await page.evaluate(() => window.CurioEngine.history().undo.length)) === undo, "Undo takes it back");
    }

    /* The plot, themes and attention notes open and stay open across a redraw. */
    await page.click(".mo-sd .mo-sd-more summary");
    await settle(page);
    await page.evaluate(() => window.CurioScreen.setRow(0));
    await settle(page);
    check(await page.evaluate(() => document.querySelector(".mo-sd .mo-sd-more").open && /The plot:/.test(document.querySelector(".mo-sd .mo-sd-more").textContent)), "the plot, themes and attention notes open and stay open");
    await page.click(".mo-sd .mo-sd-more summary");
    await settle(page);

    /* Fold and unfold. */
    await page.click('.mo-sd [data-mo-sd="fold"]');
    await settle(page);
    check(await page.evaluate(() => !document.querySelector(".mo-sd .mo-sd-body") && document.querySelector(".mo-sd").classList.contains("folded")), "Hide folds the section to its header");
    await page.click('.mo-sd [data-mo-sd="fold"]');
    await settle(page);
    check(await page.evaluate(() => !!document.querySelector(".mo-sd .mo-sd-body")), "Show opens it again");
    await page.close();

    const phone = await newPage({ width: 375, height: 800 });
    await settle(phone);
    const w = await phone.evaluate(() => {
      const el = document.querySelector(".sc-inspector > .mo-sd");
      el.scrollIntoView();
      const r = el.getBoundingClientRect();
      const sc = document.querySelector(".sc-page");
      return { doc: document.documentElement.scrollWidth, page: sc.scrollWidth, cw: sc.clientWidth, left: r.left, right: r.right };
    });
    check(w.doc <= 375 && w.page <= w.cw + 1 && w.left >= 0 && w.right <= 376, `no sideways scroll at 375 pixels (page ${w.doc}, Screen ${w.page} of ${w.cw}, section ${Math.round(w.left)} to ${Math.round(w.right)})`);
    await phone.screenshot({ path: path.join(SHOTS, "screen-details-375.png") });
    await phone.close();
  } finally {
    await browser.close();
    server.close();
  }
  check(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  if (failed) {
    console.log(failed + " browser checks failed");
    process.exit(1);
  }
  console.log("screen details browser checks passed; screenshots in " + SHOTS);
}
function window_base(id) {
  return M.baseId(id);
}
if (args.includes("--browser"))
  browserChecks().catch((e) => {
    console.error(e);
    process.exit(1);
  });
