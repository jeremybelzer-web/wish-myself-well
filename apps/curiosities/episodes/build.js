/* episodes/build.js: turns a story file (plain Markdown, one "- " line per second of film) into a storyboard.
     node apps/curiosities/episodes/build.js [story.md] [name]
   With no arguments it builds every *.md story in episodes/stories/. For each story it writes:
     episodes/<name>.json  a storyboard file the Storyboard opens with "Open a storyboard file";
     episodes/<name>.js    the same scenes for the Storyboard's "Show episodes" row (window.CURIO_EPISODES).

   The story format is explained at the top of each story file. In short: a "## " heading starts a scene, its
   "Key: value" lines set the scene (Where, Who, Light, Air, Color, Feeling, Comedy), and every "- " line is one
   panel of one second: a shot word (WIDE, MEDIUM, CLOSE, TINY, BLACK), optional camera words split by commas,
   then what we see, then optional spoken words after a dash (— Name: "words"), a feeling in brackets
   ([anxious 3]) and a hold in seconds ((3s) = three panels of the same picture).

   A storyboard scene holds at most 24 panels (CuriosityStoryboard.MAX_PER), so a longer story scene becomes
   pages: "Scene 1. The napkin (1 of 2)". Every panel carries seconds: 1, so the flip book plays it as film.
   Pure Node, no packages. parse(text) and toScenes(story) are exported for tests. */
const fs = require("fs");
const path = require("path");

const PER_PAGE = 24;
const SHOT = { WIDE: "wide", MEDIUM: "medium", CLOSE: "close", TINY: "insert", BLACK: "wide" };
const FEELINGS = ["loving", "joyful", "curious", "melancholy", "anxious", "fearful", "angry", "triumphant", "absurd", "dreamlike"];
const LIGHT = { dusk: "dusk", flat: "flat", lamp: "practical", practical: "practical", "hard sun": "hard", hard: "hard", moon: "moon", night: "moon" };
const AIR = { still: "still", wind: "wind", crowd: "crowd", rain: "water", water: "water", moving: "transit", transit: "transit" };
const COLOR = { "very warm": "very warm", warm: "warm", neutral: "neutral", cool: "cool", "very cool": "very cool" };
const COMEDY = [
  "understatement", "irony", "deadpan", "the straight one and the funny one", "banter", "misunderstanding", "status play",
  "fish out of water", "reversal", "callback", "running gag", "rule of three", "escalation", "cringe", "absurdity", "slapstick",
];
/* Camera words a panel line may carry after its shot word, and the curiosity each one sets. */
const CAMERA = {
  low: { angleHeight: "low" },
  high: { angleHeight: "high" },
  overhead: { angleHeight: "overhead" },
  floor: { angleHeight: "floor" },
  tilted: { dutch: "tilted" },
  "push in": { cameraMove: "push in" },
  "pull out": { cameraMove: "pull out" },
  circle: { cameraMove: "orbit", moveFollows: "character" },
  follow: { cameraMove: "track", moveFollows: "character" },
  pan: { cameraMove: "pan" },
  zoom: { cameraMove: "zoom" },
  crane: { cameraMove: "crane" },
  still: { cameraCarry: "locked", cameraMove: "none" },
  shaky: { cameraCarry: "handheld" },
  "through the lens": { pov: "a person", colorRange: "vivid color" },
  setup: { comicBeat: "setup planted" },
  payoff: { comicBeat: "payoff lands" },
};
/* Every panel sets the board's live controls, so a panel looks the same whatever My film is set to. */
const BASE = {
  angleHeight: "eye", dutch: "level", pov: "nobody", cameraCarry: "smooth", cameraMove: "none", moveSpeed: 2, moveFollows: "neither",
  moveOn: "action", characterPath: "still", characterSpeed: 2, characterToLens: "across", whoMoves: "neither", bodyEnter: "already",
  objectKind: "prop", objectPath: "still", objectSpeed: 2, objectEnter: "stays", temperature: "mild", volume: 3,
  dynamicRange: "wide", breath: "ignore breath", eating: "none", angleChange: "on the action", exit: "stay", comicBeat: "nothing",
};
/* Cheap guesses from the words of a panel: what moves, and how loud. */
const GUESS = [
  [/\b(walks?|crosses|runs?|putters off|steps)\b/i, { characterPath: "cross", whoMoves: "speaker" }],
  [/\b(climbs into|bangs open|enters|comes in)\b/i, { bodyEnter: "enters" }],
  [/\b(leans|reaches)\b/i, { characterPath: "approach" }],
  [/\b(phone|screen|dashboard|drone|clock|calendar|blocks?)\b/i, { objectKind: "screen" }],
  [/\b(mango|dish|sandwich|noodles|plate|food|eats?)\b/i, { objectKind: "food" }],
  [/\b(tuk-tuk)\b/i, { objectKind: "vehicle" }],
  [/\b(door|curtain|glove box)\b/i, { objectKind: "door", objectPath: "open" }],
  [/\b(takes?|pass(es)?|holds? (it )?out|hands?)\b/i, { objectPath: "pass" }],
  [/\b(drinks?|holds? up|lifts?|puts on)\b/i, { objectPath: "lift" }],
  [/\b(drags?|slips|snaps back)\b/i, { objectPath: "slide" }],
  [/\b(eats?|eating)\b/i, { eating: "speak while eating" }],
  [/\bwhispers?\b|quietly/i, { volume: 1 }],
  [/\blaughs?\b|bangs|loud/i, { volume: 4 }],
];

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* text -> { title, scenes: [{ name, set: {Where, Who, ...}, lines: [{ raw, n }] }] } */
function parse(text) {
  const story = { title: "", scenes: [] };
  let scene = null;
  String(text)
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const line = raw.trim();
      if (/^# /.test(line) && !story.title) story.title = line.slice(2).trim();
      else if (/^## /.test(line)) {
        const name = line.slice(3).trim();
        scene = /^(how to|story pieces)/i.test(name) ? null : { name, set: {}, lines: [] };
        if (scene) story.scenes.push(scene);
      } else if (scene && /^- /.test(line)) scene.lines.push({ raw: line.slice(2).trim(), n: i + 1 });
      else if (scene && /^[A-Z][a-z]+: /.test(line) && !scene.lines.length) {
        const k = line.indexOf(":");
        scene.set[line.slice(0, k)] = line.slice(k + 1).trim();
      }
    });
  return story;
}

function feelingOf(s) {
  const m = /\b([a-z]+)\s+([0-5])\b/i.exec(String(s || ""));
  return m && FEELINGS.includes(m[1].toLowerCase()) ? { emotion: m[1].toLowerCase(), emotionIntensity: Number(m[2]) } : null;
}

/* One panel line -> { seconds, panel } (panel without the per-second copies). */
function readLine(raw, feel, sceneVals, people) {
  let s = raw;
  let hold = 1;
  s = s.replace(/\((\d+)s\)/g, (_, n) => ((hold = Math.max(1, Math.min(60, Number(n)))), ""));
  s = s.replace(/\[([^\]]+)\]/g, (_, f) => {
    const got = feelingOf(f);
    if (got) Object.assign(feel, got);
    return "";
  });
  let words = null;
  const say = /[—–]\s*([^:"“]+?):\s*["“](.*?)["”]\s*$/.exec(s);
  if (say) {
    words = { who: say[1].trim(), text: say[2].trim() };
    s = s.slice(0, say.index);
  }
  const v = Object.assign({}, BASE, sceneVals, feel);
  const head = /^([A-Z]+)((?:,\s*[a-zA-Z ]+?)*)\.\s*/.exec(s);
  let shot = "MEDIUM";
  if (head && SHOT[head[1]]) {
    shot = head[1];
    head[2]
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
      .forEach((w) => CAMERA[w] && Object.assign(v, CAMERA[w]));
    s = s.slice(head[0].length);
  }
  const what = s.trim().replace(/\s+/g, " ");
  GUESS.forEach(([re, set]) => re.test(what) && Object.keys(set).forEach((k) => (v[k] = set[k])));
  v.shotSize = SHOT[shot];
  if (shot === "BLACK") Object.assign(v, { colorRange: "black and white", lighting: "flat", peopleCount: 1, cameraMove: "none", cameraCarry: "locked" });
  else v.peopleCount = shot === "CLOSE" || shot === "TINY" ? 1 : Math.max(1, Math.min(8, people));
  if (v.cameraMove !== "none") v.moveOn = words ? "line" : "action";
  if (words) v.angleChange = "on the line";
  const panel = { v, line: words || { who: "", text: "—" }, what: shot === "BLACK" ? "Black screen. " + what : what, seconds: 1 };
  return { hold, panel };
}

/* story -> storyboard scenes (pages of up to 24 one-second panels). */
function toScenes(story, tag) {
  const out = [];
  let clock = 0;
  story.scenes.forEach((sc, si) => {
    const set = sc.set;
    const sceneVals = {};
    const light = LIGHT[String(set.Light || "").toLowerCase()];
    if (light) sceneVals.lighting = light;
    const air = AIR[String(set.Air || "").toLowerCase()];
    if (air) sceneVals.envMotion = air;
    const color = COLOR[String(set.Color || "").toLowerCase()];
    if (color) sceneVals.warmCool = color;
    const comedy = String(set.Comedy || "").toLowerCase();
    if (COMEDY.includes(comedy)) sceneVals.comedyDevice = comedy;
    const who = String(set.Who || "")
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x && !/^nobody$/i.test(x));
    const feel = feelingOf(set.Feeling) || { emotion: "curious", emotionIntensity: 1 };
    const panels = [];
    sc.lines.forEach((l) => {
      const { hold, panel } = readLine(l.raw, feel, sceneVals, who.length);
      for (let k = 0; k < hold; k++) panels.push(Object.assign(JSON.parse(JSON.stringify(panel)), { storyLine: l.n, at: clock + panels.length }));
    });
    const pages = Math.max(1, Math.ceil(panels.length / PER_PAGE));
    /* Pages share the scene evenly (36 seconds is 18 and 18, not 24 and 12). */
    const size = Math.ceil(panels.length / pages);
    for (let p = 0; p < pages; p++) {
      const part = panels.slice(p * size, (p + 1) * size);
      const from = clock + p * size;
      out.push({
        name: sc.name + (pages > 1 ? ` (${p + 1} of ${pages})` : ""),
        note: [set.Where, `${stamp(from)} to ${stamp(from + part.length)}`].filter(Boolean).join(" · "),
        story: -1,
        [tag || "episode"]: true,
        episodeScene: si,
        board: { id: slug(story.title || "episode"), title: story.title, slug: set.Where || sc.name, people: who },
        panels: part,
      });
    }
    clock += panels.length;
  });
  return out;
}
function stamp(sec) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function build(file, name) {
  const story = parse(fs.readFileSync(file, "utf8"));
  const scenes = toScenes(story);
  const seconds = scenes.reduce((n, s) => n + s.panels.length, 0);
  const dir = __dirname;
  const id = name || path.basename(file, ".md");
  const made = new Date().toISOString();
  fs.writeFileSync(path.join(dir, id + ".json"), JSON.stringify({ made, title: story.title, seconds, scenes }) + "\n");
  fs.writeFileSync(
    path.join(dir, id + ".js"),
    `/* Built by episodes/build.js from ${path.basename(file)}. Do not edit by hand: edit the story and build again. */\n` +
      `(window.CURIO_EPISODES = window.CURIO_EPISODES || []).push(${JSON.stringify({ id, title: story.title, seconds, scenes })});\n`
  );
  return { id, title: story.title, scenes: scenes.length, seconds };
}

if (require.main === module) {
  const [file, name] = process.argv.slice(2);
  const stories = path.join(__dirname, "stories");
  const files = file ? [file] : fs.readdirSync(stories).filter((f) => f.endsWith(".md")).map((f) => path.join(stories, f));
  files.forEach((f) => {
    const r = build(f, file ? name : null);
    console.log(`${r.id}: ${r.title} · ${r.scenes} storyboard scenes · ${r.seconds} panels = ${stamp(r.seconds)} of film`);
  });
}
module.exports = { parse, toScenes, readLine, build, PER_PAGE };
