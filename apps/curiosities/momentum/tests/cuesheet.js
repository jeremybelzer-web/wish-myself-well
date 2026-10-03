/* The cue sheet: node apps/curiosities/momentum/tests/cuesheet.js [--browser] [--three <three.min.js>] [--shots <dir>]
   With no page: loads the shared core and the curiosity database (as tests/run.js does), the momentum core and
   cuesheet.js, then checks the frame math at 24, 25 and 30 frames a second, the cue and hold columns, the
   animator's notes, CSV quoting, the Maya JSON, and the Maya Python (labels with quotes and other characters are
   escaped; with python3 on the machine, the script is run against a stand-in for maya.cmds, both with
   Time Slider bookmarks and with the locator fallback, and it must never delete anything).
   With --browser (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed): the app's page,
   the Momentum window's Cue sheet tab, the frames-a-second switch, the CSV and JSON downloads (real download
   events), Copy for Maya, a phone width (375 pixels, no sideways scroll), and no page errors. Screenshots go to
   --shots (default: the system temp folder). */
const path = require("path");
const fs = require("fs");
const os = require("os");
const vm = require("vm");
const assert = require("assert");
const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const ROOT = path.join(__dirname, "..", "..");
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
const run = (f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
};
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "cuesheet.js"].forEach(run);
const CS = ctx.CurioCueSheet;
const A = ctx.CurioAttention;
const M = ctx.CurioMomentum;
let n = 0;
const plain = (x) => JSON.parse(JSON.stringify(x));
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const studies = core.CuriosityDB.studiesExport().studies;
const diner = studies.find((s) => /diner/.test(s.id)) || studies[0];

/* Panels with no clock: each moment lasts secondsPerBeat. A curiosity changes every few panels. */
function panels(count, every) {
  const ids = ["emotion", "plotTwist", "music", "angle"].filter((id) => M.find(id));
  const beats = [];
  for (let i = 0; i < count; i++) {
    const values = {};
    if (i % every === 0) {
      const id = ids[(i / every) % ids.length];
      const opts = (M.find(id).options || ["a", "b", "c"]).slice(0, 3);
      values[id] = opts[Math.floor(i / every / ids.length) % opts.length];
    }
    beats.push({ values });
  }
  return beats;
}

ok("cuesheet.js loads as part of the core with no page, and adds no tab without the window", () => {
  ["cueRows", "toCsv", "toMayaJson", "mayaPython", "pyStr"].forEach((f) => assert.strictEqual(typeof CS[f], "function", f));
  assert.strictEqual(CS.addTab(), false);
});
ok("frame math: a moment is secondsPerBeat x fps frames, starting on frame 1, end to end with no gap", () => {
  const beats = panels(12, 3);
  [24, 25, 30].forEach((fps) => {
    [3, 2, 1].forEach((spb) => {
      const rows = CS.cueRows(A.read(beats, { secondsPerBeat: spb, limit: 20 }), { fps, secondsPerBeat: spb, beats });
      assert.strictEqual(rows.length, 12);
      assert.strictEqual(rows[0].startFrame, 1);
      rows.forEach((r, i) => {
        assert.strictEqual(r.frames, spb * fps, `fps ${fps}, ${spb} s: moment ${i + 1} has ${r.frames} frames`);
        assert.strictEqual(r.endFrame - r.startFrame + 1, r.frames);
        assert.strictEqual(r.startFrame, 1 + Math.round(i * spb * fps));
        if (i) assert.strictEqual(r.startFrame, rows[i - 1].endFrame + 1, "no gap or overlap");
        assert.strictEqual(r.fps, fps);
      });
      assert.strictEqual(rows[11].endFrame, 12 * spb * fps);
    });
  });
  /* 2.5 seconds at 25 frames a second is 62.5 frames: moments take 63 and 62 in turn, and the film still ends on time. */
  const half = CS.cueRows(A.read(beats, { secondsPerBeat: 2.5 }), { fps: 25, secondsPerBeat: 2.5 });
  assert(half.every((r) => r.frames === 62 || r.frames === 63));
  assert.strictEqual(half[11].endFrame, 750);
  /* At 24 frames a second, 3 seconds is 72 frames: 1 to 72, 73 to 144. */
  const r24 = CS.cueRows(A.read(beats, { secondsPerBeat: 3 }), { fps: 24, secondsPerBeat: 3 });
  assert.deepStrictEqual(plain([r24[0].startFrame, r24[0].endFrame, r24[1].startFrame, r24[1].endFrame]), [1, 72, 73, 144]);
  /* An unknown rate falls back to 24; a start frame can be set. */
  assert.strictEqual(CS.cueRows(A.read(beats, {}), { fps: 60 })[0].fps, 24);
  assert.strictEqual(CS.cueRows(A.read(beats, {}), { fps: 25, startFrame: 1001 })[1].startFrame, 1001 + 75);
});
ok("a curated film keeps its own times: frames follow each moment's time", () => {
  const reading = A.read(diner.beats, { limit: 20 });
  const rows = CS.cueRows(reading, { fps: 25, beats: diner.beats });
  assert.strictEqual(rows.length, diner.beats.length);
  rows.forEach((r, i) => {
    assert.strictEqual(r.startFrame, 1 + Math.round(r.at * 25), "moment " + (i + 1));
    if (i) assert.strictEqual(r.startFrame, rows[i - 1].endFrame + 1);
  });
  const end = reading.segments[reading.segments.length - 1].to;
  assert.strictEqual(rows[rows.length - 1].endFrame, Math.round(end * 25), "the last moment runs to the end of the film");
});
ok("what holds attention, the cue (blank when attention stayed) and the hold match the reading", () => {
  studies.forEach((s) => {
    const reading = A.read(s.beats, { limit: 20 });
    const rows = CS.cueRows(reading, { beats: s.beats });
    const starts = new Set(reading.segments.map((g) => g.beat));
    rows.forEach((r, j) => {
      if (!r.family) return assert(!starts.size || j < Math.min(...starts), s.id + ": empty only before the first change");
      const seg = [...reading.segments].reverse().find((g) => g.beat <= j);
      assert.strictEqual(r.curiosity, seg.curiosity, s.id);
      assert.strictEqual(r.family, seg.family, s.id);
      assert.strictEqual(r.familyLabel, M.family(seg.family).label);
      if (starts.has(j)) {
        assert(r.change && r.cue === seg.cue && r.cueLabel && !/cue/i.test(r.cueLabel), s.id + ": a change has its cue");
      } else assert(!r.change && r.cue === "" && r.cueLabel === "", s.id + ": blank when attention stayed");
      assert(["Fresh", "Getting long", "Too long"].includes(r.status.text));
      assert(/^[●▲■]$/.test(r.status.icon));
      assert(/^#[0-9a-f]{6}$/i.test(r.color));
    });
    assert.strictEqual(rows.filter((r) => r.change).length, reading.segments.length, s.id + ": one change per stretch");
  });
});
ok("held so far climbs while one family holds attention, and the status follows the limit", () => {
  const beats = panels(16, 8);
  const rows = CS.cueRows(A.read(beats, { secondsPerBeat: 3, limit: 20 }), { fps: 24, secondsPerBeat: 3, limit: 20 });
  assert.deepStrictEqual(plain(rows.slice(0, 8).map((r) => r.held)), [3, 6, 9, 12, 15, 18, 21, 24]);
  assert.deepStrictEqual(plain(rows.slice(0, 8).map((r) => r.status.text)), ["Fresh", "Fresh", "Fresh", "Fresh", "Getting long", "Getting long", "Too long", "Too long"]);
  assert.strictEqual(rows[8].held, 3, "a move starts the clock again");
});
ok("animator's notes come from the numbers: start, change, hold with the frame to change by", () => {
  const beats = panels(16, 8);
  const rows = CS.cueRows(A.read(beats, { secondsPerBeat: 3, limit: 20 }), { fps: 24, secondsPerBeat: 3, limit: 20 });
  assert(/^Start: .+ takes attention first, with an? \w+ cue, on frame 1\.$/.test(rows[0].note), rows[0].note);
  /* The limit (20 s) is reached at frame 1 + 20 x 24 = 481. */
  assert.strictEqual(rows[1].limitFrame, 481);
  assert(/^Hold: .+ is still fresh after 6 seconds; it gets too long at frame 481\.$/.test(rows[1].note), rows[1].note);
  assert.strictEqual(rows[4].note, `Hold: attention is getting long on ${rows[4].familyLabel}; plan a change by frame 481.`);
  assert(/^Too long: .+ since frame 481\. Change something here\.$/.test(rows[7].note), rows[7].note);
  assert(/^Change: an? \w+ cue moves attention from .+ to .+ on frame 577\.$/.test(rows[8].note), rows[8].note);
  studies.forEach((s) => CS.cueRows(A.read(s.beats, {}), { beats: s.beats }).forEach((r) => assert(r.note && !/—|cue cue|undefined|NaN/.test(r.note), s.id + ": " + r.note)));
});
ok("CSV: a header, one line per moment, quotes doubled, commas and line breaks quoted, formulas made text", () => {
  const rows = CS.cueRows(A.read(diner.beats, { limit: 20 }), { beats: diner.beats });
  const csv = CS.toCsv(rows);
  const lines = csv.trim().split("\r\n");
  assert.strictEqual(lines.length, rows.length + 1);
  assert(lines[0].startsWith("Moment,Time,Seconds,Start frame,End frame,Frames,Frames a second,Family,Letter,What holds attention,Curiosity id,Cue,"));
  const fake = Object.assign({}, rows[1], { label: 'Say "hi", then\nleave', note: "=HYPERLINK(1)", familyLabel: "-x", curiosity: "@a" });
  const line = CS.toCsv([fake]).split("\r\n").slice(1).join("\r\n");
  assert(line.includes('"Say ""hi"", then\nleave"'), line);
  assert(line.includes(",'=HYPERLINK(1)") && line.includes(",'-x,") && line.includes(",'@a,"), line);
  /* A simple CSV reader gets the same number of cells back on every line. */
  const parse = (text) => {
    const out = [[]];
    let cell = "";
    let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") out[out.length - 1].push(cell), (cell = "");
      else if (c === "\r" && text[i + 1] === "\n") out[out.length - 1].push(cell), (cell = ""), out.push([]), i++;
      else cell += c;
    }
    return out.filter((r) => r.length);
  };
  const table = parse(CS.toCsv(rows.concat([fake])));
  assert(table.every((r) => r.length === CS.COLUMNS.length), "every line has every column");
  assert.strictEqual(table[table.length - 1][9], 'Say "hi", then\nleave');
  assert.strictEqual(table[1][3], String(rows[0].startFrame));
});
ok("Maya JSON: the documented format, frame numbers, family, cue and curiosity id", () => {
  const rows = CS.cueRows(A.read(diner.beats, { limit: 20 }), { fps: 30, beats: diner.beats });
  const j = JSON.parse(CS.toMayaJson(rows, { title: "Diner", limit: 20 }));
  assert.strictEqual(j.format, "curiomatic-momentum-cues");
  assert.strictEqual(j.version, 1);
  assert.strictEqual(j.fps, 30);
  assert.strictEqual(j.film, "Diner");
  assert.strictEqual(j.startFrame, 1);
  assert.strictEqual(j.endFrame, rows[rows.length - 1].endFrame);
  assert.strictEqual(j.moments.length, rows.length);
  const ch = rows.filter((r) => r.change);
  assert.strictEqual(j.cues.length, ch.length);
  j.cues.forEach((c, i) => {
    assert.strictEqual(c.name, "momentum_cue_" + String(i + 1).padStart(4, "0"));
    assert.strictEqual(c.frame, ch[i].startFrame);
    assert.strictEqual(c.family, ch[i].family);
    assert.strictEqual(c.curiosity, ch[i].curiosity);
    assert(M.CUES.some((x) => x.id === c.cue));
  });
  assert(j.moments.every((m) => Number.isInteger(m.startFrame) && Number.isInteger(m.endFrame)));
});
ok("Python strings: quotes, backslashes, line breaks and other characters are escaped, ASCII only", () => {
  assert.strictEqual(CS.pyStr('Say "hi"'), '"Say \\"hi\\""');
  assert.strictEqual(CS.pyStr("it's"), '"it\'s"');
  assert.strictEqual(CS.pyStr("a\\b"), '"a\\\\b"');
  assert.strictEqual(CS.pyStr("one\ntwo\r\tthree"), '"one\\ntwo\\r\\tthree"');
  assert.strictEqual(CS.pyStr("café ☕ 😀"), '"caf\\u00e9 \\u2615 \\U0001f600"');
  assert.strictEqual(CS.pyStr("\u0000\u007f"), '"\\x00\\x7f"');
  assert(/^[\x20-\x7e]*$/.test(CS.pyStr('"""\'\'\'\n#import os')));
});
ok("the Maya script: one cue per change, only adds, never deletes, and a hostile label stays a string", () => {
  const rows = CS.cueRows(A.read(diner.beats, { limit: 20 }), { beats: diner.beats });
  const evil = rows.map((r) => (r.change ? Object.assign({}, r, { label: 'Ida\'s "big" line\n")\nimport os; os.remove("x")#' }) : r));
  const py = CS.mayaPython(evil, { title: 'Bad "title"\nimport os' });
  assert(py.includes("import maya.cmds as cmds"));
  assert(!/\b(delete|remove|rename|currentTime|file\(|os\.|subprocess)\s*\(/.test(py.replace(/"(?:[^"\\]|\\.)*"/g, '""')), "nothing outside strings deletes or moves anything");
  assert.strictEqual((py.match(/^ {4}\("momentum_cue_\d{4}"/gm) || []).length, rows.filter((r) => r.change).length);
  assert(py.includes("timeSliderBookmark") && py.includes("spaceLocator") && py.includes("except Exception"));
  assert(!py.split("\n").some((l) => /^import os/.test(l)), "a title or label never makes its own line");
});
ok("the Maya script runs in Python against a stand-in Maya: bookmarks, then the locator fallback", () => {
  const py3 = spawnSync("python3", ["--version"]);
  if (py3.status !== 0) return console.log("   (python3 not found: skipped running the script)");
  const rows = CS.cueRows(A.read(diner.beats, { limit: 20 }), { beats: diner.beats });
  const evil = rows.map((r) => (r.change ? Object.assign({}, r, { label: 'Ida\'s "big" line\\ café\n' }) : r));
  const script = CS.mayaPython(evil, { title: "Diner" });
  const changes = rows.filter((r) => r.change);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cuesheet-py-"));
  fs.mkdirSync(path.join(dir, "maya"));
  fs.writeFileSync(path.join(dir, "maya", "__init__.py"), "");
  /* A stand-in maya.cmds: records every call. BOOKMARKS=0 removes timeSliderBookmark; =2 makes it fail. */
  fs.writeFileSync(
    path.join(dir, "maya", "cmds.py"),
    `import os, json
CALLS = []
def _rec(name):
    def f(*a, **k):
        CALLS.append([name, list(a), {key: (list(v) if isinstance(v, tuple) else v) for key, v in k.items()}])
        if name == "spaceLocator":
            return [k.get("name")]
        if name == "timeSliderBookmark" and os.environ.get("BOOKMARKS") == "2":
            raise RuntimeError("no bookmarks here")
        if name == "loadPlugin":
            raise RuntimeError("no plugin")
    return f
for _n in ["spaceLocator", "addAttr", "setAttr", "setKeyframe", "loadPlugin"]:
    globals()[_n] = _rec(_n)
if os.environ.get("BOOKMARKS") != "0":
    timeSliderBookmark = _rec("timeSliderBookmark")
def __getattr__(name):
    raise AttributeError(name)
`
  );
  fs.writeFileSync(path.join(dir, "cues.py"), script);
  fs.writeFileSync(path.join(dir, "run.py"), `import json, sys\nsys.path.insert(0, ${JSON.stringify(dir)})\nexec(open(${JSON.stringify(path.join(dir, "cues.py"))}, encoding="ascii").read())\nimport maya.cmds\nprint(json.dumps(maya.cmds.CALLS))\n`);
  const go = (mode) => {
    const r = spawnSync("python3", [path.join(dir, "run.py")], { env: Object.assign({}, process.env, { BOOKMARKS: mode }), encoding: "utf8" });
    assert.strictEqual(r.status, 0, "python: " + r.stderr);
    const out = r.stdout.trim().split("\n");
    return { said: out[0], calls: JSON.parse(out[out.length - 1]) };
  };
  const names = (calls, k) => calls.filter((c) => c[0] === k);
  const b = go("1");
  assert.strictEqual(b.said, `Momentum cues: ${changes.length} bookmarks, 0 locators.`);
  const marks = names(b.calls, "timeSliderBookmark");
  assert.strictEqual(marks.length, changes.length);
  assert.deepStrictEqual(plain(marks.map((c) => c[2].time[0])), plain(changes.map((r) => r.startFrame)));
  assert(marks[0][2].name.includes('Ida\'s "big" line\\ café\n'), "the label arrives in Maya exactly: " + marks[0][2].name);
  [go("0"), go("2")].forEach((l) => {
    assert.strictEqual(l.said, `Momentum cues: 0 bookmarks, ${changes.length} locators.`);
    const locs = names(l.calls, "spaceLocator");
    assert.deepStrictEqual(plain(locs.map((c) => c[2].name)), plain(changes.map((_, i) => "momentum_cue_" + String(i + 1).padStart(4, "0"))));
    const on = names(l.calls, "setKeyframe").filter((c) => c[2].value === 1);
    assert.deepStrictEqual(plain(on.map((c) => c[2].time)), plain(changes.map((r) => r.startFrame)), "visibility keyed on at each change's frame");
    assert(l.calls.every((c) => ["spaceLocator", "addAttr", "setAttr", "setKeyframe", "loadPlugin", "timeSliderBookmark"].includes(c[0])), "only adds");
  });
  fs.rmSync(dir, { recursive: true, force: true });
});
ok("an empty film gives no rows and the exports still work", () => {
  const rows = CS.cueRows(A.read([], {}), {});
  assert.deepStrictEqual(plain(rows), []);
  assert.strictEqual(CS.toCsv(rows).split("\r\n").filter(Boolean).length, 1);
  assert.strictEqual(JSON.parse(CS.toMayaJson(rows, {})).cues.length, 0);
  assert(CS.mayaPython(rows, {}).includes("CUES = [\n]"));
  CS.cueRows(null, null);
});
ok("file names are plain, and the words have no em-dashes", () => {
  assert.strictEqual(CS.fileName("The Diner: standoff!", "csv"), "the-diner-standoff-cue-sheet.csv");
  assert.strictEqual(CS.fileName("", "json"), "film-cue-sheet.json");
  assert(!/—/.test(fs.readFileSync(path.join(ROOT, "momentum", "cuesheet.js"), "utf8")));
});
console.log(`\n${n} cue sheet checks passed`);

/* ---------------------------------------------------------------- in a real browser */
async function browserChecks() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  const three = arg("--three", "");
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = await new Promise((resolve) => {
    const sv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    sv.listen(0, "127.0.0.1", () => resolve(sv));
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
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base.replace(/\/$/, "") }).catch(() => {});
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    return page;
  }
  async function openApp(page) {
    await page.goto(base + "index.html");
    if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]')))) {
      await page.evaluate(() => {
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
    }
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioCueSheet, null, { timeout: 10000 });
  }

  const page = await newPage({ width: 1280, height: 900 });
  await openApp(page);
  await page.evaluate(() => document.getElementById("lib-btn").click());
  await page.click("#lib-menu [data-momentum]");
  await page.waitForSelector(".mo-dlg[open]");
  const tabs = await page.$$eval(".mo-dlg [role=tab]", (b) => b.map((x) => x.dataset.tab + ":" + x.textContent.trim()));
  check(tabs.includes("cuesheet:Cue sheet"), 'Momentum has a "Cue sheet" tab: ' + tabs.join(", "));
  await page.click('.mo-dlg [data-tab="cuesheet"]');
  await page.waitForSelector(".mo-dlg .mcs");
  const study = await page.$$eval(".mo-dlg [data-cs-source] option", (o) => o.map((x) => x.value).filter((v) => v.startsWith("study:")));
  check(study.length >= 1, "curated films to put on a cue sheet: " + study.length);
  await page.selectOption(".mo-dlg [data-cs-source]", study.find((s) => /diner/.test(s)) || study[0]);
  await page.waitForSelector(".mo-dlg .mcs-table tbody tr");
  const read = () =>
    page.evaluate(() => {
      const rows = [...document.querySelectorAll(".mo-dlg .mcs-table tbody tr")];
      return {
        lede: document.querySelector(".mo-dlg .mcs-lede").textContent,
        sum: document.querySelector(".mo-dlg .mcs-sum").textContent,
        n: rows.length,
        frames: rows.map((r) => r.children[1].textContent.trim()),
        status: rows.map((r) => r.children[4].textContent.trim()),
        cues: rows.map((r) => r.children[3].textContent.trim()),
        notes: rows.map((r) => r.children[5].textContent.trim()),
        heads: [...document.querySelectorAll(".mo-dlg .mcs-table th")].map((h) => h.textContent),
      };
    });
  const at24 = await read();
  check(/one still picture/.test(at24.lede) && /24 of them make one second/.test(at24.lede), "frames are explained in plain words");
  check(at24.n > 3 && /^1 to \d+/.test(at24.frames[0]), `one row per moment, from frame 1 (${at24.n} rows, first ${at24.frames[0]})`);
  check(["Time", "Frames", "What holds attention", "Cue that moved it here", "Held so far", "Animator's note"].every((h) => at24.heads.includes(h)), "every column: " + at24.heads.join(", "));
  check(at24.status.every((s) => /[●▲■] (Fresh|Getting long|Too long)/.test(s)), "held so far has an icon plus words");
  check(at24.cues.some((c) => c === "") && at24.cues.some((c) => /^(Visual|Audio|Thought|Movement|Plot)/.test(c)), "the cue column is blank where attention stayed");
  check(at24.notes.some((t) => /plan a change by frame \d+|since frame \d+/.test(t)), "an animator's note names a frame");
  await page.screenshot({ path: path.join(SHOTS, "cuesheet-tab.png") });

  /* The frames-a-second switch. */
  await page.selectOption(".mo-dlg [data-cs-fps]", "30");
  await page.waitForFunction(() => /30 frames a second/.test(document.querySelector(".mo-dlg .mcs-sum").textContent));
  const at30 = await read();
  const endOf = (f) => Number(f.match(/to (\d+)/)[1]);
  check(endOf(at30.frames[at30.n - 1]) === Math.round((endOf(at24.frames[at24.n - 1]) / 24) * 30), `30 frames a second: the film ends on frame ${endOf(at30.frames[at30.n - 1])} (was ${endOf(at24.frames[at24.n - 1])} at 24)`);
  check(/30 of them make one second/.test(at30.lede), "the explanation follows the rate");
  await page.selectOption(".mo-dlg [data-cs-fps]", "25");
  await page.waitForFunction(() => /25 frames a second/.test(document.querySelector(".mo-dlg .mcs-sum").textContent));
  check((await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-momentum-cuesheet-v1")).fps)) === 25, "the rate is remembered");
  await page.selectOption(".mo-dlg [data-cs-fps]", "24");
  await page.waitForFunction(() => /24 frames a second/.test(document.querySelector(".mo-dlg .mcs-sum").textContent));

  /* Only the moves. */
  await page.check(".mo-dlg [data-cs-only]");
  await page.waitForFunction(() => document.querySelector(".mo-dlg [data-cs-only]").checked);
  const only = await read();
  check(only.n < at24.n && only.cues.every((c) => c !== ""), `only the moments where attention moves: ${only.n} of ${at24.n}`);
  await page.uncheck(".mo-dlg [data-cs-only]");

  /* CSV download. */
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('.mo-dlg [data-cs="csv"]')]);
  const csvName = dl.suggestedFilename();
  const csvFile = path.join(SHOTS, csvName);
  await dl.saveAs(csvFile);
  const csv = fs.readFileSync(csvFile, "utf8").replace(/^﻿/, "");
  check(/-cue-sheet\.csv$/.test(csvName), "the CSV downloads: " + csvName);
  check(csv.startsWith("Moment,Time,") && csv.trim().split("\r\n").length === at24.n + 1, "the CSV has a header and one line per moment");
  /* JSON download. */
  const [dj] = await Promise.all([page.waitForEvent("download"), page.click('.mo-dlg [data-cs="json"]')]);
  const jsonFile = path.join(SHOTS, dj.suggestedFilename());
  await dj.saveAs(jsonFile);
  let j = {};
  try {
    j = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  } catch (e) {}
  check(j.format === "curiomatic-momentum-cues" && j.fps === 24 && j.moments.length === at24.n && j.cues.length > 0, "the Maya JSON downloads in its format");

  /* Copy for Maya. */
  await page.click('.mo-dlg [data-cs="py"]');
  await page.waitForFunction(() => !document.querySelector(".mo-dlg .mcs-said").hidden);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
  check(clip.includes("import maya.cmds as cmds") && clip.includes('"momentum_cue_0001"') && /timeSliderBookmark/.test(clip), "Copy for Maya puts the Python script on the clipboard");
  check(/Copied the Maya script/.test(await page.$eval(".mo-dlg .mcs-said", (e) => e.textContent)), "it says what to do with it");
  await page.screenshot({ path: path.join(SHOTS, "cuesheet-copied.png") });

  /* The engine's film. */
  await page.evaluate(() => window.CurioEngine && window.CurioSeeds && window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
  await page.evaluate(() => window.CurioMomentumUI.draw());
  if (await page.$('.mo-dlg [data-cs-source] option[value="engine"]')) {
    await page.selectOption(".mo-dlg [data-cs-source]", "engine");
    await page.waitForSelector(".mo-dlg .mcs-table tbody tr");
    const eng = await read();
    check(/Each moment lasts \d/.test(eng.sum) && /^1 to /.test(eng.frames[0]), "the engine's film: each moment lasts Seconds per panel: " + eng.frames[0]);
  }

  /* Phone width. */
  const phone = await newPage({ width: 375, height: 800 });
  await openApp(phone);
  await phone.evaluate(() => window.CurioMomentumUI.open("cuesheet"));
  await phone.waitForSelector(".mo-dlg .mcs");
  const first = await phone.$$eval(".mo-dlg [data-cs-source] option", (o) => o.map((x) => x.value).find((v) => /diner/.test(v)) || o.map((x) => x.value).find((v) => v.startsWith("study:")));
  await phone.selectOption(".mo-dlg [data-cs-source]", first);
  await phone.waitForSelector(".mo-dlg .mcs-table tbody tr");
  const fit = await phone.evaluate(() => {
    const d = document.querySelector(".mo-dlg");
    const right = Math.max(...[...document.querySelectorAll(".mo-dlg .mcs *")].map((e) => e.getBoundingClientRect().right));
    return { page: document.documentElement.scrollWidth - window.innerWidth, dlg: d.scrollWidth - d.clientWidth, right, w: window.innerWidth };
  });
  check(fit.page <= 0 && fit.dlg <= 0, `no sideways scroll at phone width (page ${fit.page}px, window ${fit.dlg}px over)`);
  check(fit.right <= fit.w, `the cue sheet fits the phone (${Math.round(fit.right)} of ${fit.w})`);
  await phone.screenshot({ path: path.join(SHOTS, "cuesheet-phone.png") });
  await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 700));
  await phone.screenshot({ path: path.join(SHOTS, "cuesheet-phone-lower.png") });

  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  if (failed) {
    console.log(failed + " cue sheet browser checks failed");
    process.exit(1);
  }
  console.log("cue sheet browser checks passed; screenshots in " + SHOTS);
}
if (args.includes("--browser"))
  browserChecks().catch((e) => {
    console.error(e);
    process.exit(1);
  });
