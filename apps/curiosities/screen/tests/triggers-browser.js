/* Triggers ("curiosity proximity") in a real browser, inside the real app:
   node apps/curiosities/screen/tests/triggers-browser.js   (needs Playwright and Chromium)

   Walks it the way a person would, with a real mouse and real keys: right-click a node, Assign On Trigger…,
   pick a MIDI note, Off, While held; a pad press switches the node off and letting go puts it back; no firing is
   an undo step and the saved film never changes; assigning is one undo step; playback stop puts a latched
   firing back; Map… then click a control makes it the source (and does not press it); a chosen event (one line
   of dialogue at one moment), a section from the markers, the oscillator, typed words standing in for speech,
   the camera's movement, the limits (first N, every Nth, several ranges, only / never in sections, between two
   values, only while playing); a lane's name and a suite card take triggers too; a master node's hook; the
   Triggers and Curiosity Proximity windows; a locked lane (🔒) is left alone. The page must report no errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

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
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioTriggers, null, { timeout: 15000 });
  ok(true, "the Screen opens with triggers loaded");
  const T = (fn, arg) => page.evaluate(fn, arg);
  const fp = () => T(() => window.CurioEngine.fingerprint());
  const undoN = () => T(() => window.CurioEngine.history().undo.length);

  /* A lane with two nodes to work on: Shot size on its track, moments 1 and 3. */
  await page.click('[data-icat="camera"]');
  const lk = await T(() => {
    const E = window.CurioEngine;
    const st = E.state();
    const tr = st.tracks.find((t) => t.curiosities.includes("shotSize")) || st.tracks[0];
    const S = window.CurioScale;
    E.send({ type: "batch", label: "test nodes", commands: [{ type: "setPoint", row: st.rows[0].id, track: tr.id, curiosity: "shotSize", value: S.at("shotSize", 0) }, { type: "setPoint", row: st.rows[2].id, track: tr.id, curiosity: "shotSize", value: S.at("shotSize", 1) }] });
    return tr.id + "|shotSize";
  });
  await page.waitForSelector(`.sl-svg [data-node$="@${lk}"]`, { timeout: 5000 }).catch(() => {});
  const nodeSel = await T((lk) => {
    const st = window.CurioEngine.state();
    return `.sl-svg [data-node="${st.rows[2].id}@${lk}"]`;
  }, lk);
  ok(!!(await page.$(nodeSel)), "the node is on the timeline");
  const row2 = await T(() => window.CurioEngine.state().rows[2].id);
  const trackId = lk.split("|")[0];
  const val = () => T(([r, t]) => window.CurioEngine.value(r, t, "shotSize"), [row2, trackId]);
  /* Moment 2 sits between the two nodes; with the node at moment 3 switched off, the line holds moment 1's. */
  const row1 = await T(() => window.CurioEngine.state().rows[1].id);
  const valMid = () => T(([r, t]) => window.CurioEngine.value(r, t, "shotSize"), [row1, trackId]);

  /* Right-click the node: the timeline's own menu now has Assign On Trigger…. */
  await page.click(nodeSel, { button: "right" });
  ok(await page.$(".sl-linemenu [data-ctr-assign]"), "right-clicking a node offers Assign On Trigger… in its menu");
  ok(await T(() => !!document.querySelector('.sl-linemenu [data-m="remove"]')), "the node menu keeps its own items");
  await page.click(".sl-linemenu [data-ctr-assign]");
  ok(await page.$('.ctr-win[data-ctr="edit"]'), "the trigger editor opens: when + does + limits");
  ok(await T(() => /Shot size node at moment 3/.test(document.querySelector(".ctr-target").textContent)), "it names its target in plain words");
  await page.selectOption('.ctr-win [data-f="when.kind"]', "midi");
  await page.fill('.ctr-win [data-f="when.num"]', "60");
  await page.dispatchEvent('.ctr-win [data-f="when.num"]', "change");
  await page.selectOption('.ctr-win [data-f="does.act"]', "off");
  await page.click('.ctr-win [data-ctr-mode="hold"]');
  const u0 = await undoN();
  const appUndo0 = await T(() => window.CurioStore.history().undo.length);
  await page.click(".ctr-win [data-ctr-save]");
  const tl = await T(() => window.CurioTriggers.list());
  ok(tl.length === 1 && tl[0].when.kind === "midi" && tl[0].when.num === 60 && tl[0].does.act === "off" && tl[0].does.mode === "hold" && tl[0].target.kind === "node", "Assign saves one trigger: MIDI note 60, off, while held, on that node");
  ok((await T(() => window.CurioStore.history().undo.length)) === appUndo0 + 1 && /Assign On Trigger/.test(await T(() => window.CurioStore.history().undo.slice(-1)[0])), "assigning is one undo step");
  const id1 = tl[0].id;

  /* A pad press: the node switches off while held, and nothing is saved or undoable. */
  const f0 = await fp();
  const mid0 = await valMid();
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: true, vel: 100 }));
  ok((await T(() => window.CurioTriggers.performing())).includes("triggers"), "a pad press performs");
  ok((await valMid()) !== mid0, `the node is left out while the pad is down (${mid0} -> ${await valMid()})`);
  ok((await fp()) === f0 && (await undoN()) === u0, "a firing is not an undo step and the saved film is unchanged");
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 61, on: true, vel: 100 }));
  ok((await T((id) => window.CurioTriggers.live(id).fired, id1)) === 1, "another note does not fire it");
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: false }));
  await page.waitForTimeout(50);
  ok((await valMid()) === mid0 && (await T(() => window.CurioTriggers.performing().length)) === 0, "letting go puts it back exactly");

  /* Between two velocities. */
  await T((id) => window.CurioTriggers.set(id, { limits: { lo: 50, hi: 100 } }), id1);
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: true, vel: 20 }));
  ok((await valMid()) === mid0, "a soft hit below the velocity range does nothing");
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: false }));
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: true, vel: 120 }));
  ok((await valMid()) !== mid0, "a hit inside the range fires");
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: false }));

  /* Undo takes the trigger away; redo brings it back. */
  const before = await T(() => window.CurioTriggers.list().length);
  await T(() => window.CurioStore.undo());
  await T(() => window.CurioStore.undo());
  ok((await T(() => window.CurioTriggers.list().length)) === before - 1, "undo takes the assigned trigger back");
  await T(() => window.CurioStore.redo());
  await T(() => window.CurioStore.redo());
  ok((await T(() => window.CurioTriggers.list().length)) === before, "redo brings it back");

  /* Latch, then playback stops: put back. */
  await T((id) => window.CurioTriggers.set(id, { does: { act: "off", mode: "latch" }, limits: {} }), id1);
  await page.click('[data-act="play"]');
  ok(await T(() => window.CurioScreen.playing()), "Play plays");
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: true, vel: 100 }));
  await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: false }));
  ok((await T(() => window.CurioTriggers.performing().length)) === 1, "a latched firing stays after the pad is let go");
  const fpPlay = await fp();
  await page.click('[data-act="play"]');
  await page.waitForTimeout(50);
  ok(!(await T(() => window.CurioScreen.playing())) && (await T(() => window.CurioTriggers.performing().length)) === 0, "stopping playback puts the performance back");
  ok((await fp()) === fpPlay, "and the film is exactly as it was");
  await T(() => window.CurioScreen.setRow(0));

  /* Toggle: each press switches. */
  await T((id) => window.CurioTriggers.set(id, { does: { act: "off", mode: "toggle" } }), id1);
  const tap = () => T(() => (window.CurioTriggers.midi({ kind: "note", num: 60, on: true, vel: 100 }), window.CurioTriggers.midi({ kind: "note", num: 60, on: false })));
  await tap();
  const a1 = await T((id) => window.CurioTriggers.live(id).active, id1);
  await tap();
  const a2 = await T((id) => window.CurioTriggers.live(id).active, id1);
  ok(a1 === true && a2 === false, "toggle switches on one press and back on the next");
  /* Every Nth time, first N times. */
  await T((id) => (window.CurioTriggers.putBack(), window.CurioTriggers.set(id, { does: { act: "off", mode: "hold" }, limits: { count: "nth", n: 2 } })), id1);
  const f0n = await T((id) => window.CurioTriggers.live(id).fired, id1);
  await tap();
  await tap();
  await tap();
  ok((await T((id) => window.CurioTriggers.live(id).fired, id1)) === f0n + 1, "every 2nd time: three presses fire once");
  await T((id) => (window.CurioTriggers.putBack(), window.CurioTriggers.set(id, { limits: { count: "first", n: 2 } })), id1);
  const f1 = await T((id) => window.CurioTriggers.live(id).fired, id1);
  await tap();
  await tap();
  await tap();
  ok((await T((id) => window.CurioTriggers.live(id).fired, id1)) === f1 + 2, "only the first 2 times: three presses fire twice");
  /* Only while playing. */
  await T((id) => (window.CurioTriggers.putBack(), window.CurioTriggers.set(id, { limits: { playing: true } })), id1);
  const f2 = await T((id) => window.CurioTriggers.live(id).fired, id1);
  await tap();
  ok((await T((id) => window.CurioTriggers.live(id).fired, id1)) === f2, "only while playing: a press while stopped does nothing");
  /* Several separate ranges of moments. */
  await T((id) => window.CurioTriggers.set(id, { limits: { ranges: [[1, 1], [4, 5]] } }), id1);
  const inRange = async (j) => {
    await T((j) => (window.CurioTriggers.putBack(), window.CurioScreen.setRow(j)), j);
    const f = await T((id) => window.CurioTriggers.live(id).fired, id1);
    await tap();
    return (await T((id) => window.CurioTriggers.live(id).fired, id1)) > f;
  };
  ok((await inRange(0)) && !(await inRange(1)) && (await inRange(3)), "several ranges: moments 1 and 4 to 5 fire, moment 2 does not");
  await T((id) => (window.CurioTriggers.putBack(), window.CurioTriggers.set(id, { limits: {} })), id1);

  /* The editor's ranges: + Add a range twice gives two separate ranges. */
  await T((id) => window.CurioTriggers.edit(id), id1);
  await page.click(".ctr-win [data-range-add]");
  await page.click(".ctr-win [data-range-add]");
  ok((await T(() => window.CurioTriggers.draft().limits.ranges.length)) === 2, "the editor takes several separate ranges of moments");
  await page.click('.ctr-win[data-ctr="edit"] [data-ctr-close]');

  /* Map…: any control. The next click maps it and does not press it. */
  await page.click(nodeSel, { button: "right" });
  await page.click(".sl-linemenu [data-ctr-assign]");
  await page.selectOption('.ctr-win [data-f="when.kind"]', "control");
  await page.click(".ctr-win [data-ctr-map]");
  ok((await T(() => window.CurioTriggers.controls().length)) > 20, "Map… registers every control on the page through mappable()");
  const speedBefore = await T(() => window.CurioScreen.state().speed);
  const ghostBefore = await T(() => window.CurioScreen.state().ghost);
  await page.click('[data-act="ghost"]');
  ok((await T(() => window.CurioScreen.state().ghost)) === ghostBefore, "the click that maps a button does not press it");
  const mapped = await T(() => window.CurioTriggers.draft().when);
  ok(mapped.kind === "control" && /ghost/.test(mapped.id), `the button becomes the source (${mapped.id})`);
  await page.selectOption('.ctr-win [data-f="does.act"]', "set");
  await page.fill('.ctr-win [data-f="does.value"]', "0");
  await page.dispatchEvent('.ctr-win [data-f="does.value"]', "change");
  await page.click(".ctr-win [data-ctr-save]");
  const id2 = await T(() => window.CurioTriggers.list().slice(-1)[0].id);
  await page.click('[data-act="ghost"]');
  ok((await T((id) => window.CurioTriggers.live(id) && window.CurioTriggers.live(id).fired, id2)) === 1, "pressing the mapped button fires its trigger");
  ok((await T(() => window.CurioScreen.state().ghost)) !== ghostBefore, "and the button still does its own job");
  await page.click('[data-act="ghost"]');
  await T(() => window.CurioTriggers.putBack());
  /* A drop-down as the source, followed continuously. */
  await T((id) => window.CurioTriggers.set(id, { when: { kind: "control", id: window.CurioTriggers.controlId(document.querySelector("select[data-speed]")), label: "Speed" }, does: { act: "follow", mode: "hold" } }), id2);
  await page.selectOption("select[data-speed]", "4");
  ok((await T((id) => window.CurioTriggers.live(id).active, id2)) && (await T((id) => window.CurioTriggers.live(id).value, id2)) === 1, "a drop-down drives follow with its value");
  await page.selectOption("select[data-speed]", String(speedBefore));
  await T(() => window.CurioTriggers.putBack());
  await T((id) => window.CurioTriggers.remove(id), id2);

  /* Events on a track: a line of dialogue, and one chosen line (item 2). */
  const ev = await T(() => {
    const E = window.CurioEngine;
    let st = E.state();
    let ch = st.tracks.find((t) => t.kind === "character");
    const cmds = [];
    if (!ch.curiosities.includes("eyeline.speaking")) cmds.push({ type: "addCuriosity", track: ch.id, curiosity: "eyeline.speaking" });
    cmds.push({ type: "setPoint", row: st.rows[1].id, track: ch.id, curiosity: "eyeline.speaking", value: "speaking" });
    cmds.push({ type: "setPoint", row: st.rows[2].id, track: ch.id, curiosity: "eyeline.speaking", value: "listening" });
    cmds.push({ type: "setPoint", row: st.rows[3].id, track: ch.id, curiosity: "eyeline.speaking", value: "listening" });
    cmds.push({ type: "setPoint", row: st.rows[4].id, track: ch.id, curiosity: "eyeline.speaking", value: "speaking" });
    cmds.push({ type: "setPoint", row: st.rows[0].id, track: ch.id, curiosity: "eyeline.speaking", value: "listening" });
    const r = E.send({ type: "batch", label: "test lines", commands: cmds });
    st = E.state();
    return { ok: r.ok, err: r.error, track: ch.id, rows: st.rows.map((x) => x.id), lines: st.rows.map((x, j) => window.CurioTriggers.eventsAt(j).filter((e) => e.event === "line").length) };
  });
  ok(ev.ok && ev.lines[1] === 1 && ev.lines[4] === 1 && ev.lines[2] === 0, `a line of dialogue is found where a character starts speaking (${ev.lines})`);
  const id3 = await T((ev) => window.CurioTriggers.add({ target: { kind: "suite", from: "curiosity", cur: "shotSize", track: "" }, when: { kind: "event", event: "line", track: ev.track, row: ev.rows[4] }, does: { act: "scale", amount: -100, mode: "hold" } }).id, ev);
  const fires = [];
  for (let j = 0; j < 6; j++) {
    await T((j) => window.CurioScreen.setRow(j), j);
    fires.push(await T((id) => window.CurioTriggers.live(id) ? window.CurioTriggers.live(id).active : false, id3));
  }
  ok(!fires[1] && fires[4] && !fires[5], `one chosen line fires only at its own moment (${fires})`);
  await T((id) => window.CurioTriggers.set(id, { when: { kind: "event", event: "line", track: "", row: "" } }), id3);
  const fires2 = [];
  for (let j = 0; j < 6; j++) {
    await T((j) => window.CurioScreen.setRow(j), j);
    fires2.push(await T((id) => window.CurioTriggers.live(id).active, id3));
  }
  ok(fires2[1] && fires2[4] && !fires2[2], `every line fires at its moment (${fires2})`);
  await T(() => window.CurioTriggers.putBack());
  /* A cut and a panel turn. */
  ok(await T(() => window.CurioTriggers.eventsAt(1).some((e) => e.event === "cut") && window.CurioTriggers.eventsAt(1).some((e) => e.event === "panel") && !window.CurioTriggers.eventsAt(0).some((e) => e.event === "cut")), "a cut and a panel turn come with every new moment joined by a Cut");
  await T(() => window.CurioScreen.transitions.set(2, "fade"));
  ok(await T(() => !window.CurioTriggers.eventsAt(1).some((e) => e.event === "cut")), "a fade into a moment is not a cut");
  await T(() => window.CurioStore.undo());
  /* A character entering frame. */
  ok(await T((ev) => {
    const E = window.CurioEngine;
    const st = E.state();
    const ch = st.tracks.find((t) => t.id === ev.track);
    const cmds = ch.curiosities.includes("bodyEnter") ? [] : [{ type: "addCuriosity", track: ch.id, curiosity: "bodyEnter" }];
    cmds.push({ type: "setPoint", row: st.rows[3].id, track: ch.id, curiosity: "bodyEnter", value: "enters" }, { type: "setPoint", row: st.rows[2].id, track: ch.id, curiosity: "bodyEnter", value: "already" }, { type: "setPoint", row: st.rows[4].id, track: ch.id, curiosity: "bodyEnter", value: "already" });
    E.send({ type: "batch", commands: cmds });
    return window.CurioTriggers.eventsAt(3).some((e) => e.event === "enter" && e.track === ch.id) && !window.CurioTriggers.eventsAt(4).some((e) => e.event === "enter");
  }, ev), "a character entering frame is an event on their track");

  /* Sections from the markers; only in / never in. */
  await T(() => {
    const st = window.CurioEngine.state();
    window.CurioLanes.setMarkers([{ row: st.rows[2].id, color: "red", note: "Act 2" }, { row: st.rows[4].id, color: "blue", note: "Act 3" }]);
  });
  const secs = await T(() => window.CurioTriggers.sections());
  ok(secs.length === 3 && secs[0].label === "Opening" && secs[1].label === "Act 2" && secs[1].from === 2 && secs[1].to === 3, "sections are the markers, each running to the next (" + secs.map((s) => s.label).join(", ") + ")");
  await T(([id, s]) => window.CurioTriggers.set(id, { when: { kind: "section", section: s }, does: { act: "off", mode: "hold" } }), [id3, secs[1].id]);
  const sf = [];
  for (const j of [0, 1, 2, 3, 4]) {
    await T((j) => window.CurioScreen.setRow(j), j);
    sf.push(await T((id) => window.CurioTriggers.live(id).active, id3));
  }
  ok(!sf[1] && sf[2] && sf[3] && !sf[4], `the film reaching Act 2 holds it on through the act (${sf})`);
  await T(([id, s]) => (window.CurioTriggers.putBack(), window.CurioTriggers.set(id, { when: { kind: "lfo", every: 1 }, limits: { sections: { mode: "never", list: [s] } } })), [id3, secs[1].id]);
  const nf0 = await T((id) => window.CurioTriggers.live(id).fired, id3);
  const nf = [];
  for (const j of [0, 1, 2, 3, 4]) {
    await T((j) => window.CurioScreen.setRow(j), j);
    nf.push((await T((id) => window.CurioTriggers.live(id).fired, id3)) - nf0);
  }
  ok(nf.join() === "1,1,1,1,2", `the oscillator fires every other moment, never in Act 2 (${nf})`);
  await T(() => (window.CurioTriggers.putBack(), window.CurioLanes.setMarkers([])));

  /* Speech: typed words stand in where the browser can't listen. */
  await T((id) => window.CurioTriggers.set(id, { when: { kind: "speech", words: "cut to black" }, does: { act: "off", mode: "hold" }, limits: {} }), id3);
  await page.click('[data-ctr-open="prox"]');
  ok(await page.$('.ctr-win[data-ctr="prox"]'), "the bar's Proximity opens the Curiosity Proximity window");
  ok(await page.$(".ctr-win [data-ctr-type]"), "it has a box to type words, the fallback for speech");
  ok(await T(() => typeof window.CurioTriggers.speech.supported === "boolean" && window.CurioTriggers.speech.on === false), "listening is off until switched on");
  await page.fill(".ctr-win [data-ctr-type]", "OK, cut to black now");
  await page.press(".ctr-win [data-ctr-type]", "Enter");
  ok((await T((id) => window.CurioTriggers.live(id).fired, id3)) >= 1, "words heard (or typed) fire the speech trigger");
  await page.fill(".ctr-win [data-ctr-type]", "cut to blue");
  const fs3 = await T((id) => window.CurioTriggers.live(id).fired, id3);
  await page.press(".ctr-win [data-ctr-type]", "Enter");
  ok((await T((id) => window.CurioTriggers.live(id).fired, id3)) === fs3, "other words do not");
  await page.waitForTimeout(1300);
  ok(!(await T((id) => window.CurioTriggers.live(id).active, id3)), "a spoken trigger lets go after a moment");

  /* The camera: off by default, never asked for; movement in a part of the frame fires. */
  ok(await T(() => window.CurioTriggers.camera.on === false && !window.CurioTriggers.camera.stream), "the camera is off by default");
  const m = await T(() => {
    const w = 8;
    const h = 6;
    const a = new Uint8Array(w * h);
    const b = new Uint8Array(w * h);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) b[y * w + x] = 200; /* top left moves */
    return window.CurioTriggers.core.motion(a, b, w, h);
  });
  ok(m.left > 0 && m.right === 0 && m.high > 0 && m.any > 0, "movement is measured per part of the picture, in the browser");
  await T((id) => window.CurioTriggers.set(id, { when: { kind: "body", zone: "right" }, does: { act: "follow", mode: "hold" } }), id3);
  await T(() => window.CurioTriggers.body({ any: 0.3, left: 0, right: 0.2, high: 0 }));
  ok(await T((id) => window.CurioTriggers.live(id).active && window.CurioTriggers.live(id).value > 0.5, id3), "a movement on the right fires and follows how much");
  await T(() => window.CurioTriggers.body({ any: 0, left: 0, right: 0, high: 0 }));
  ok(!(await T((id) => window.CurioTriggers.live(id).active, id3)), "and lets go when still");

  /* A lane's name (its curiosity suite) and a suite card take triggers. */
  await page.click(`.sl-head .sl-name[data-pick="shotSize"]`, { button: "right" });
  ok(await page.$(".ctr-menu [data-ctr-assign]"), "right-clicking a lane's name offers Assign On Trigger… for its suite");
  ok(await T(() => [...document.querySelectorAll(".ctr-menu [data-ctr-edit]")].length >= 1), "and lists the triggers already on it");
  await page.keyboard.press("Escape");
  ok(!(await page.$(".ctr-menu")), "Esc closes it");
  const lanesOfSuite = await T(() => window.CurioTriggers.lanesOf({ kind: "suite", from: "curiosity", cur: "shotSize" }));
  ok(lanesOfSuite.some((x) => x.endsWith("|shotSize")), "a curiosity's suite is its master lane and its settings' lanes");
  await page.click('[data-libtab="templates"]').catch(() => {});
  const card = await page.$('[data-pick-card^="suite|"]');
  if (card) {
    await card.click({ button: "right" });
    ok(await page.$(".ctr-menu [data-ctr-assign]"), "right-clicking a suite card offers Assign On Trigger…");
    await page.click(".ctr-menu [data-ctr-assign]");
    ok(await T(() => window.CurioTriggers.draft() && window.CurioTriggers.draft().target.from === "library"), "for that suite");
    await page.click('.ctr-win[data-ctr="edit"] [data-ctr-close]');
  } else ok(true, "no suite cards in this tab (skipped)");

  /* A master node: the hook trigger(id, on). */
  await T(() => {
    window.__mcalls = [];
    window.CurioMasters = window.CurioMasters || { trigger: (id, on, o) => window.__mcalls.push([id, on, o && o.scale]) };
    const d = document.createElement("span");
    d.setAttribute("data-master", "m1");
    d.setAttribute("data-mnode", "n1");
    d.className = "fake-master";
    d.textContent = "◆";
    d.style.cssText = "position:fixed;left:700px;top:500px;z-index:99;font-size:20px";
    document.body.appendChild(d);
  });
  await page.click(".fake-master", { button: "right" });
  ok(await page.$(".ctr-menu [data-ctr-assign]"), "right-clicking a master node offers Assign On Trigger…");
  await page.click(".ctr-menu [data-ctr-assign]");
  await page.fill('.ctr-win [data-f="when.num"]', "62");
  await page.dispatchEvent('.ctr-win [data-f="when.num"]', "change");
  await page.selectOption('.ctr-win [data-f="does.act"]', "scale");
  await page.fill('.ctr-win [data-f="does.amount"]', "-50");
  await page.dispatchEvent('.ctr-win [data-f="does.amount"]', "change");
  await page.click('.ctr-win [data-ctr-mode="hold"]');
  await page.click(".ctr-win [data-ctr-save]");
  await T(() => (window.CurioTriggers.midi({ kind: "note", num: 62, on: true, vel: 90 }), window.CurioTriggers.midi({ kind: "note", num: 62, on: false })));
  const calls = await T(() => window.__mcalls);
  ok(calls.length === 2 && calls[0][0] === "n1" && calls[0][1] === true && calls[0][2] === -50 && calls[1][1] === null, `a master node is driven through CurioMasters.trigger(id, on, { scale }) (${JSON.stringify(calls)})`);
  ok((await T(() => window.CurioTriggers.forTarget("mnode:n1"))).length === 1, "forTarget lists a master node's triggers for its Proximity view");

  /* The Triggers window. */
  await page.click('[data-ctr-open="list"]');
  ok(await page.$('.ctr-win[data-ctr="list"] .ctr-list li'), "the bar's Triggers opens the Triggers window with every trigger");
  const nOn = await T(() => window.CurioTriggers.list().filter((t) => t.on).length);
  await page.click(`.ctr-win[data-ctr="list"] [data-ctr-onoff="${id1}"]`);
  ok((await T(() => window.CurioTriggers.list().filter((t) => t.on).length)) === nOn - 1, "a trigger switches off from its window");
  const f4 = await T((id) => window.CurioTriggers.live(id).fired, id1);
  await tap();
  ok((await T((id) => window.CurioTriggers.live(id).fired, id1)) === f4, "a switched-off trigger does not fire");

  /* A locked lane (🔒) is left as it is. */
  await T((id) => window.CurioTriggers.set(id, { on: true, does: { act: "off", mode: "hold" }, limits: {} }), id1);
  await T((lk) => {
    const head = [...document.querySelectorAll(".sl-head")].find((h) => h.querySelector(`[data-lk="${lk}"]`));
    const b = head && head.querySelector('[data-act="lane-lock"]');
    if (b) b.click();
  }, lk);
  const isLocked = await T((lk) => window.CurioLanes.isLocked(lk), lk);
  if (isLocked) {
    const midL = await valMid();
    await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: true, vel: 100 }));
    ok((await valMid()) === midL, "a locked lane (🔒) keeps what it plays when a trigger fires");
    await T(() => window.CurioTriggers.midi({ kind: "note", num: 60, on: false }));
    await page.click(nodeSel, { button: "right" });
    if (await page.$(".sl-linemenu [data-ctr-assign]")) {
      await page.click(".sl-linemenu [data-ctr-assign]");
      ok(!(await page.$('.ctr-win[data-ctr="edit"]')), "and its nodes can't take a new trigger");
    }
    await T((lk) => {
      const head = [...document.querySelectorAll(".sl-head")].find((h) => h.querySelector(`[data-lk="${lk}"]`));
      const b = head && head.querySelector('[data-act="lane-lock"]');
      if (b) b.click();
    }, lk);
  } else ok(true, "lock button not found here (skipped)");

  /* Saved with the film's other parts, and back after a reload. */
  const saved = await T(() => window.CurioTriggers.list().length);
  await page.reload();
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioTriggers, null, { timeout: 15000 });
  ok((await T(() => window.CurioTriggers.list().length)) === saved && saved > 0, "triggers come back after a reload");
  ok(await T(() => window.CurioTriggers.performing().length === 0), "and nothing is left performing");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
