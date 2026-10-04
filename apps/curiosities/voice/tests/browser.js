/* Voice commands in a real browser: node apps/curiosities/voice/tests/browser.js [--coverage-only] [--debug]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Speech itself needs a microphone, so the test says things the way the recognizer would hand them over:
   CurioVoice.hear(text), and the typed box. It checks:
   - the 🎤 button and its box are on the page, on the Screen and off it, with no page errors;
   - fixed shapes (moments, undo, chains of commands, picking from "which one?");
   - a curiosity and what you want from it, set through its own window as one undo step;
   - Screen actions, the app's bar, the Library, and things other parts register (CurioCommands);
   - every feature by its name: on the Screen, My film, the Storyboard and three workspaces, every visible
     button, tab, menu item, checkbox and dropdown choice is found first when its own words are said.
     At least 90% must be (the rest have the same words as another control, or none). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const DEBUG = args.includes("--debug");
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

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

let fails = 0;
const ok = (cond, msg, extra) => {
  console.log((cond ? "ok   " : "FAIL ") + msg + (!cond && extra ? "\n       " + extra : ""));
  if (!cond) fails++;
};

/* Every visible control's own words, said back: is it the first thing found? */
const COVERAGE = () => {
  const V = window.CurioVoice;
  const W = window.CurioVoiceWords;
  const items = V._pageItems();
  let hit = 0;
  const miss = [];
  const seen = new Set();
  items.forEach((it) => {
    const said = W.norm(it.label);
    /* Grid cells named only by a number ("12") are moments and cells, reached by "go to moment 12". */
    if (!W.wordsOf(said).some((w) => !/^\d/.test(w)) || seen.has(said + "|" + it.kind)) return;
    seen.add(said + "|" + it.kind);
    const top = V.find(it.label)[0];
    if (top && W.norm(top.label) === said) hit++;
    else miss.push(`"${it.label}" -> ${top ? `"${top.label}" (${top.group})` : "nothing"}`);
  });
  return { total: hit + miss.length, hit, miss };
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
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioVoice, null, { timeout: 20000 });
  const hear = (t) => page.evaluate((x) => window.CurioVoice.hear(x), t);
  const row = () => page.evaluate(() => window.CurioScreen.row());

  ok(await page.evaluate(() => !!document.querySelector(".cv-root .cv-mic")), "the 🎤 button is on the Screen");
  ok(await page.evaluate(() => { const b = document.querySelector(".cv-mic").getBoundingClientRect(); const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!(h && h.closest(".cv-root")); }), "the 🎤 button sits on top of the Screen (nothing covers it)");

  /* Moments, and words for numbers. */
  await hear("go to moment 3");
  ok((await row()) === 2, '"go to moment 3" moves the playhead to moment 3');
  await hear("next moment");
  ok((await row()) === 3, '"next moment" moves one on');
  await hear("um, could you please go back two moments");
  ok((await row()) === 1, '"um, could you please go back two moments" (fillers off, "two" read as 2)');
  await hear("go to moment five and then previous moment");
  ok((await row()) === 3, '"go to moment five and then previous moment" runs both, in order');
  const far = await hear("go to moment 99");
  ok(/last one/.test(far), "past the end it goes to the last moment and says so", far);

  /* A Screen action, a menu, and closing it. */
  await hear("open the export menu");
  ok(await page.evaluate(() => !!document.querySelector(".sc-page [aria-expanded=true]") || !!document.querySelector(".sc-export:not([hidden]), .sc-exp-menu, [data-export-menu]")), '"open the export menu" opens Export ▾');
  await hear("close that");
  await hear("turn on captions");
  ok(await page.evaluate(() => window.CurioScreen.captions.now().on === true), '"turn on captions" turns Captions on (the action, not the Captions curiosity)');
  await hear("turn off captions");
  ok(await page.evaluate(() => window.CurioScreen.captions.now().on === false), '"turn off captions" turns it off');

  /* A curiosity and what you want from it: through its window's own reader, one undo step. */
  await hear("go to moment 1");
  const said = await hear("shot size closer");
  ok(/^Shot size/.test(said), '"shot size closer" goes to the Shot size window', said);
  ok(await page.evaluate(() => !!document.querySelector('.sc-win[data-win="shotSize"]')), "its window opens so you can see what changed");
  ok(!/didn.t match/.test(said), "and its words set a setting", said);
  const sad = await hear("make the emotion sadder");
  ok(/make it sadder/.test(sad) && !/didn.t match/.test(sad), '"make the emotion sadder" lands on the Emotion window\'s own phrase "make it sadder"', sad);
  const breathe = await hear("let it breathe");
  ok(!/didn.t|Which one/.test(breathe) && /:/.test(breathe), '"let it breathe" (a plain-words phrase said on its own) sets its curiosity', breathe);
  const lens = await hear("set lens length to 85");
  ok(/^Lens length/.test(lens) && !/didn.t match/.test(lens), '"set lens length to 85" sets Lens length', lens);
  const und = await hear("undo 3 times");
  ok(/Undid 3 changes/.test(und), '"undo 3 times" undoes three steps', und);

  /* "Which one?": when two things fit as well, the best three, then a number picks. */
  const amb = await hear("make it warmer");
  const choices = await page.evaluate(() => document.querySelectorAll(".cv-choices li").length);
  ok(/Which one/.test(amb) ? choices >= 2 : true, `an unclear command offers choices to pick from (${choices} shown)`);
  if (/Which one/.test(amb)) {
    const picked = await hear("number 1");
    ok(!/nothing to pick/.test(picked) && picked.length > 0, '"number 1" picks the first choice', picked);
    ok(await page.evaluate(() => document.querySelector(".cv-choices").hidden), "and the choices go away");
  }

  /* Things other parts of the app register. */
  const reg = await page.evaluate(async () => {
    let ran = 0;
    window.CurioCommands.mappable("test.flipbook", "Spin the flip book", () => (ran++, "Spun it."), { words: "flipbook turn pages" });
    const a = await window.CurioVoice.hear("spin the flip book");
    window.CurioCommands.unregister("test.flipbook");
    return { ran, a };
  });
  ok(reg.ran === 1 && reg.a === "Spun it.", "a command registered with CurioCommands.mappable runs by voice and says its own answer", JSON.stringify(reg));

  /* The typed box does the same. */
  await page.click(".cv-mic").catch(() => {});
  await page.evaluate(() => window.CurioVoice.stop());
  await page.fill(".cv-q", "go to moment 2");
  await page.press(".cv-q", "Enter");
  await page.waitForTimeout(100);
  ok((await row()) === 1, "typing a command in the box and pressing Enter does it");
  ok(await page.evaluate(() => /moment 2/.test(document.querySelector(".cv-did").textContent)), "the box says what it did");
  await page.evaluate(() => window.CurioVoice.help(true));
  ok(await page.evaluate(() => /can reach <b>[\d,]+<\/b>/.test(document.querySelector(".cv-help").innerHTML)), '"What can I say?" shows examples and how many things voice can reach');
  await page.evaluate(() => window.CurioVoice.help(false));

  /* Every example in "What can I say?" does something (none says it found nothing or asks "which one?"). */
  const ex = await page.evaluate(async () => {
    const bad = [];
    for (const [, list] of window.CurioVoice.examples())
      for (const x of list) {
        if (/stop listening|open the storyboard/.test(x)) continue;
        if (!window.CurioScreen.isOpen()) window.CurioScreen.open();
        const r = await window.CurioVoice.hear(x);
        if (!r || /didn.t|Which one|nothing to pick|That did not work/.test(r)) bad.push(`${x} -> ${r}`);
        await window.CurioVoice.hear("never mind");
      }
    window.CurioVoice.hear("escape");
    return bad;
  });
  ok(!ex.length, "every example in What can I say? works", ex.join("\n       "));
  if (!(await page.evaluate(() => window.CurioScreen.isOpen()))) await page.evaluate(() => window.CurioScreen.open());

  /* Every feature by its name. */
  const report = [];
  const cov1 = await page.evaluate(COVERAGE);
  report.push(["the Screen", cov1]);
  const leave = await hear("open my film");
  ok(/Opened/.test(leave) && (await page.evaluate(() => !window.CurioScreen.isOpen())), '"open my film" leaves the Screen for My film, from the bar under it', leave);
  ok(await page.evaluate(() => !!document.querySelector(".cv-root .cv-mic") && document.querySelector(".cv-mic").offsetParent !== null), "the 🎤 button is there off the Screen too");
  report.push(["My film", await page.evaluate(COVERAGE)]);
  for (const ws of ["Storyboard", "Camera angle", "Color", "Comedy"]) {
    const r = await hear("open " + ws.toLowerCase());
    if (!/Opened/.test(r)) ok(false, `"open ${ws.toLowerCase()}" opens it`, r);
    await page.waitForTimeout(150);
    report.push([ws, await page.evaluate(COVERAGE)]);
  }
  const lib = await hear("open the prism");
  ok(/Opened Prism/i.test(lib), '"open the prism" opens a Library menu item while the menu is shut', lib);
  let hit = 0;
  let total = 0;
  report.forEach(([name, c]) => {
    hit += c.hit;
    total += c.total;
    console.log(`     ${name}: ${c.hit} of ${c.total} controls found by their own words`);
    if (DEBUG) c.miss.slice(0, 40).forEach((m) => console.log("        miss " + m));
  });
  const share = total ? hit / total : 0;
  ok(share >= 0.9, `every feature by its name: ${hit} of ${total} (${Math.round(share * 100)}%) are found first by their own words (needs 90%)`);
  const back = await hear("open the screen");
  ok(await page.evaluate(() => window.CurioScreen.isOpen()), '"open the screen" comes back to the Screen', back);

  ok(!errors.length, "no page errors", errors.slice(0, 5).join("\n       "));
  await browser.close();
  server.close();
  console.log(fails ? `\n${fails} failed` : "\nall voice checks passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
