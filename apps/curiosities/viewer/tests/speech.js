/* Rate of speech in a real browser: node apps/curiosities/viewer/tests/speech.js
   (Jeremy's notes, 2026-10-04 20:16Z). Every speech balloon in the Words tab has a Speed in syllables a second,
   set with the slider, by tapping once per syllable (button or space bar), or by saying the line into the
   microphone; the note says how long the line takes and warns when it is longer than the panel; playing shows
   the words at that speed, balloon after balloon; no errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
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
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "?viewer=1");
  await page.evaluate(() => {
    localStorage.removeItem("curiosities-viewer-v1");
    localStorage.removeItem("curiosities-viewer-windows-v1");
    localStorage.removeItem("curiosities-viewer-winmode-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen(), null, { timeout: 20000 });
  await page.waitForTimeout(300);

  const L = (f, a) => page.evaluate(f, a);
  const syl = await L(() => [CurioSpeech.syllables("It's gone. I had a year in there."), CurioSpeech.syllables("Wipe your face."), CurioSpeech.syllables("No. No no.")]);
  ok(syl.join(",") === "8,3,3", "syllables are counted: " + syl.join(", "));

  /* panel 7: "It's gone. I had a year in there." */
  await L(() => CurioViewer.select(6));
  await page.click('.cv-tabs [data-tab="words"]');
  await page.waitForTimeout(100);
  ok((await page.locator('[data-sp="rate"]').count()) === 1, "the balloon has a Speed");
  ok(/8 syllables, 1\.8 s/.test(await page.textContent(".cvs-note")), "and says how long the line takes: " + (await page.textContent(".cvs-note")));

  /* slider */
  await page.$eval('[data-sp="rate"]', (el) => {
    el.value = "2";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  ok((await L(() => CurioViewer.live().panel.words[0].rate)) === 2, "the slider sets 2 syllables a second");
  ok(/longer than the panel/.test(await page.textContent(".cvs-note")), "and warns the line is now longer than the panel");

  /* tap it: six taps 200 ms apart */
  await page.click('[data-sp="tap"]');
  const tBefore = await L(() => CurioViewer.time());
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);
  }
  await page.click('[data-sp="tapdone"]');
  const tapped = await L(() => CurioViewer.live().panel.words[0].rate);
  ok(tapped > 4 && tapped < 6.2, `six taps 0.2 s apart set about 5 syllables a second (${tapped})`);
  await page.waitForTimeout(150);
  ok((await L(() => CurioViewer.time())) === tBefore, "the space bar taps instead of playing while tapping");

  /* say it: the microphone isn't allowed in this test browser, so it says to tap instead */
  await page.click('[data-sp="say"]');
  await page.waitForTimeout(400);
  const said = await page.textContent(".cvs-note");
  ok(/microphone isn't available|Listening/.test(said + (await page.textContent(".cvs-btns"))), "Say it asks for the microphone, or says to tap instead");
  /* a voice heard from 0.3 s to 2.3 s for 8 syllables */
  await L(() => CurioSpeech._sayStartFake(0));
  await L(() => CurioSpeech._sayDone(300, 2300));
  const r2 = await L(() => CurioViewer.live().panel.words[0].rate);
  ok(Math.abs(r2 - 8 / 2.15) < 0.15, `a voice heard for 2 s sets ${r2} syllables a second`);
  ok(/Heard 2\.1 s of talking/.test(await page.textContent(".cvs-note")), "and says what it heard");

  /* playing: words appear at that speed */
  await L(() => {
    const p = CurioViewer.live().panel;
    p.words[0].rate = 4;
  });
  const parts = await L(() => {
    const p = CurioViewer.live().panel;
    return [0.1, 0.6, 1.2, 2.1].map((t) => CurioSpeech.reveal(p, 0, t));
  });
  ok(parts[0] === "" && parts[1] === "It's gone." && parts[2].startsWith("It's gone. I had a") && parts[3] === "It's gone. I had a year in there.", "the words come out at 4 syllables a second: " + parts.map((x) => JSON.stringify(x)).join(" → "));
  const two = await L(() => {
    const p = { words: [{ text: "One two three.", rate: 3 }, { text: "Four five.", rate: 2 }] };
    return [CurioSpeech.reveal(p, 1, 0.9), CurioSpeech.reveal(p, 1, 1.6)];
  });
  ok(two[0] === "" && two[1] === "Four", "the second balloon starts when the first is said");
  await page.click('[data-sp="clear"]');
  ok((await L(() => CurioViewer.live().panel.words[0].rate)) === undefined, "Normal takes the speed back out");

  /* play through it with words coming out */
  await L(() => {
    CurioViewer.live().panel.words[0].rate = 3;
    CurioViewer.time(CurioViewer.starts()[6]);
  });
  await L(() => CurioViewer.play(true));
  await page.waitForTimeout(700);
  await L(() => CurioViewer.play(false));
  ok((await L(() => CurioViewer.time())) > (await L(() => CurioViewer.starts()[6])), "the film plays with the words coming out");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
