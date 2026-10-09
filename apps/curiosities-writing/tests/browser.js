/* node apps/curiosities-writing/tests/browser.js
   Opens the writing app and Curiomatic with ?writing=1 in Chromium: the language curiosities, suites, sparks and
   elixirs are automatable lanes there, the Screen's search finds them and adds a lane, and without the flag
   Curiomatic is unchanged. Uses Curiomatic's playwright (npm install in apps/curiosities). */
const path = require("path");
const assert = require("assert");
const { chromium } = require(require.resolve("playwright", { paths: [path.join(__dirname, "../../curiosities"), process.cwd()] }));
const FILM = "file://" + path.join(__dirname, "../../curiosities/index.html");
const WRITING = "file://" + path.join(__dirname, "../index.html");

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const errors = [];
  const page = async (url) => {
    const p = await browser.newPage({ viewport: { width: 1500, height: 950 } });
    p.on("pageerror", (e) => errors.push(url + ": " + e.message));
    await p.goto(url);
    await p.waitForTimeout(2500);
    return p;
  };
  const read = (p) => p.evaluate(() => ({
    simile: typeof CURIOSITIES !== "undefined" && CURIOSITIES.some((c) => c.id === "simile"),
    lanes: (window.CurioAuto && CurioAuto.FACETS && CurioAuto.FACETS.simile) || [],
    suite: typeof SUITES !== "undefined" && SUITES.some((s) => s.id === "w-song-hook"),
    spark: typeof PROXIMITIES !== "undefined" && PROXIMITIES.some((x) => x.id === "w-long-then-punch"),
    elixir: ((window.CurioAuto && CurioAuto.PROXIMITY_SUITES) || []).some((x) => x.id === "w-the-hook"),
    study: typeof CURIOSITIES !== "undefined" && CURIOSITIES.some((c) => c.id === "mosaicRhyme") && ((window.CurioAuto && CurioAuto.PROXIMITY_SUITES) || []).some((x) => x.id === "w-sermon"),
  }));

  let p = await page(WRITING);
  assert.ok(await p.locator("a[href*='writing=1']").count() >= 3, "the writing app links to Curiomatic's views");
  await p.close();

  p = await page(FILM);
  const plain = await read(p);
  assert.ok(!plain.simile && !plain.suite && !plain.elixir, "without ?writing=1 Curiomatic has no writing rows");
  await p.close();

  p = await page(FILM + "?writing=1&screen=1");
  const w = await read(p);
  assert.ok(w.simile && w.suite && w.spark && w.elixir && w.study, "with ?writing=1 every level is there: " + JSON.stringify(w));
  assert.ok(w.lanes.includes("simile.byCharacter") && w.lanes.includes("simile.byVoice"), "a curiosity's sliders are lanes");
  const box = p.locator("input[placeholder='Search every curiosity']").first();
  await box.fill("simile");
  await p.waitForTimeout(600);
  await p.locator('[data-add-card="curiosity|simile"]').filter({ visible: true }).first().click();
  await p.waitForTimeout(800);
  const added = await p.evaluate(() => /Simile is on the timeline/.test(document.body.innerText));
  assert.ok(added, "the Screen adds Simile as a lane");
  await p.close();

  p = await page(FILM + "?writing=1&relations=1");
  const near = await p.evaluate(() => window.CurioRelations && document.body.innerText.includes("Related to"));
  assert.ok(near, "the relationship map opens and knows proximities");
  await p.close();

  await browser.close();
  assert.deepStrictEqual(errors, [], "page errors");
  console.log("OK. Writing curiosities are automatable in Curiomatic's views");
})().catch((e) => { console.error(e.message); process.exit(1); });
