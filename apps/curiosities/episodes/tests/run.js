/* node apps/curiosities/episodes/tests/run.js : the story-file converter and the built episodes.
   Checks: a small story becomes one-second panels with the right shot, camera words, feeling, words and holds;
   long scenes split into even pages of at most 24; every built episode matches its story file (build again
   after editing a story); every panel value is one the app knows. */
const fs = require("fs");
const path = require("path");
const B = require("../build.js");

let failed = 0;
const ok = (cond, what) => {
  console.log((cond ? "ok   " : "FAIL ") + what);
  if (!cond) failed++;
};

const small = `# Test story

## Scene 1. A test
Where: A kitchen
Who: Ana, Bo
Light: lamp
Air: rain
Color: warm
Feeling: curious 2
Comedy: deadpan

- WIDE, high, push in. The kitchen.
- CLOSE. Ana looks up. — Ana: "Hello there." (3s) [joyful 4]
- TINY, still, payoff. A cup.
- BLACK. THE END (2s)

## Story pieces to add
- this is not a panel
`;
const story = B.parse(small);
ok(story.title === "Test story" && story.scenes.length === 1, "the story has its title and one scene (notes section skipped)");
const sc = B.toScenes(story);
const ps = sc[0].panels;
ok(ps.length === 7, "holds make one panel per second: 1 + 3 + 1 + 2 = 7");
ok(ps.every((p) => p.seconds === 1), "every panel lasts one second");
ok(ps[0].v.shotSize === "wide" && ps[0].v.angleHeight === "high" && ps[0].v.cameraMove === "push in", "WIDE, high, push in");
ok(ps[0].v.lighting === "practical" && ps[0].v.envMotion === "water" && ps[0].v.warmCool === "warm" && ps[0].v.comedyDevice === "deadpan", "scene settings: lamp, rain, warm, deadpan");
ok(ps[0].v.emotion === "curious" && ps[0].v.emotionIntensity === 2, "the scene's feeling to start");
ok(ps[1].line.who === "Ana" && ps[1].line.text === "Hello there." && ps[1].v.shotSize === "close", "spoken words and CLOSE");
ok(ps[1].v.emotion === "joyful" && ps[4].v.emotion === "joyful", "a feeling carries on to the next panels");
ok(ps[4].v.shotSize === "insert" && ps[4].v.cameraCarry === "locked" && ps[4].v.comicBeat === "payoff lands", "TINY, still, payoff");
ok(ps[5].v.colorRange === "black and white" && /THE END/.test(ps[5].what), "BLACK is a black card with its words");
ok(sc[0].note.includes("A kitchen") && sc[0].board.people.join() === "Ana,Bo", "where and who");

const long = "# L\n\n## Scene 1. Long\nWho: A\n\n" + Array.from({ length: 36 }, (_, i) => `- WIDE. Moment ${i + 1}.`).join("\n");
const pages = B.toScenes(B.parse(long));
ok(pages.length === 2 && pages[0].panels.length === 18 && pages[1].panels.length === 18, "36 seconds split into two even pages of 18");
ok(pages[1].name === "Scene 1. Long (2 of 2)" && /0:18 to 0:36/.test(pages[1].note), "pages are named and timed");

/* Built episodes match their stories, and use only values the app knows. */
global.window = global;
require("../../catalog.js");
const known = Object.fromEntries((global.CURIOSITIES || []).map((c) => [c.id, c]));
const stories = path.join(__dirname, "..", "stories");
fs.readdirSync(stories)
  .filter((f) => f.endsWith(".md"))
  .forEach((f) => {
    const id = f.replace(/\.md$/, "");
    const built = JSON.parse(fs.readFileSync(path.join(__dirname, "..", id + ".json"), "utf8"));
    const fresh = B.toScenes(B.parse(fs.readFileSync(path.join(stories, f), "utf8")));
    ok(JSON.stringify(fresh) === JSON.stringify(built.scenes), `${id}.json matches stories/${f} (run node episodes/build.js after editing)`);
    const js = fs.readFileSync(path.join(__dirname, "..", id + ".js"), "utf8");
    ok(js.includes(JSON.stringify(built.scenes)), `${id}.js matches ${id}.json`);
    ok(built.scenes.every((s) => s.panels.length >= 1 && s.panels.length <= B.PER_PAGE), `${id}: every page has 1 to ${B.PER_PAGE} panels`);
    const bad = new Set();
    built.scenes.forEach((s) =>
      s.panels.forEach((p) =>
        Object.entries(p.v).forEach(([k, v]) => {
          const c = known[k];
          if (!c) return; /* lens values live in other catalogs (the app's database) */
          if (c.options && !c.options.includes(v)) bad.add(`${k}=${v}`);
          if (c.kind === "range" && (v < c.min || v > c.max)) bad.add(`${k}=${v}`);
        })
      )
    );
    ok(!bad.size, `${id}: every value is on its curiosity's scale${bad.size ? " (" + [...bad].join(", ") + ")" : ""}`);
  });

console.log(failed ? `\n${failed} failed` : "\nepisodes ok");
process.exit(failed ? 1 : 0);
