/* VCV checks with no browser: the jack bank fits its MIDI room, every item has exactly one jack, and the bridge
   moves the right item for a CC on port 1 and on a second cable (port 2).  node apps/curiosities/vcv/tests/run.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const VCV = path.join(__dirname, "..");
const bank = require(path.join(VCV, "curiosity-jacks.json"));
let fails = 0;
const t = (name, fn) => {
  try {
    fn();
    console.log("ok   " + name);
  } catch (e) {
    fails++;
    console.log("FAIL " + name + ": " + e.message);
  }
};

t("every database item has one jack, and no two jacks share a port, channel and CC", () => {
  const DB = require("../../data/load-db.js");
  const c = DB.counts();
  const want = c.curiosities + c.suites + c.proximities + c.proximitySuites;
  assert.strictEqual(bank.jacks.length, want, "jacks " + bank.jacks.length + " vs items " + want);
  const seen = new Set();
  bank.jacks.forEach((j) => {
    const id = (j.port || 1) + ":" + j.channel + ":" + j.cc;
    assert(!seen.has(id), "two jacks on " + id);
    seen.add(id);
    assert(j.channel >= 1 && j.channel <= 15, j.key + " is on channel " + j.channel + " (16 is Focus)");
    assert(j.cc >= 1 && j.cc <= 112, j.key + " has CC " + j.cc);
  });
  assert.strictEqual(new Set(bank.jacks.map((j) => j.key)).size, bank.jacks.length, "a key has two jacks");
});

t("modules 1 to 105 stay on port 1, so jacks made before ports existed did not move", () => {
  bank.jacks.forEach((j) => assert.strictEqual(j.port || 1, Math.floor((j.module - 1) / 105) + 1, j.key));
});

/* A tiny stand-in for the app, enough for bridge.js. */
function loadBridge(jacks) {
  const moved = [];
  const patches = {};
  const auto = {
    param: (k) => jacks.some((j) => j[0] === k),
    patch: (k) => (patches[k] = patches[k] || { running: false }),
    start: (k) => (patches[k].running = true),
    lanes: () => [],
    set: (k) => moved.push(k),
    setLane: () => {},
  };
  const ctx = {
    window: { CURIOSITY_VCV: { focus: { channel: 16, ccs: [1] }, jacks }, CurioAuto: auto },
    document: { readyState: "complete", body: null, addEventListener() {} }, /* no body: the badge is not drawn */
    navigator: {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout: (fn) => (fn(), 0),
    clearTimeout() {},
  };
  ctx.window.document = ctx.document;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(VCV, "bridge.js"), "utf8"), ctx);
  return { V: ctx.window.CurioVCV, moved, patches };
}

t("the bridge sends a CC to the item on the cable it came in on", () => {
  const jacks = [
    ["c:music", 1, 5, "Music", "audio", 1, 5],
    ["c:laugh", 1, 5, "Laugh", "comedy", 106, 5, 2],
  ];
  const { V, patches } = loadBridge(jacks);
  assert.strictEqual(V.ports(), 2);
  assert(V.feed([0xb0, 5, 127], 1), "port 1 CC did nothing");
  assert(patches["c:music"] && patches["c:music"].manual === 1 && !patches["c:laugh"], "port 1 moved the wrong item");
  assert(V.feed([0xb0, 5, 0], 2), "port 2 CC did nothing");
  assert(patches["c:laugh"] && patches["c:laugh"].manual === 0, "port 2 did not move Laugh");
  assert(!V.feed([0xb0, 6, 0], 2), "an unused CC moved something");
});

t("cable names pick the port", () => {
  const { V } = loadBridge([["c:a", 1, 1, "A", "w", 1, 1], ["c:b", 1, 1, "B", "w", 106, 1, 2]]);
  assert.strictEqual(V.portOf("IAC Driver Bus 1"), 1);
  assert.strictEqual(V.portOf("IAC Driver Bus 2"), 2);
  assert.strictEqual(V.portOf("Curiosities 2"), 2);
  assert.strictEqual(V.portOf("loopMIDI Port"), 1);
  assert.strictEqual(V.portOf("Curiosities 3"), 1, "a port the bank does not use falls back to 1");
  assert.strictEqual(V.portOf(""), 1);
  const one = loadBridge([["c:a", 1, 1, "A", "w", 1, 1]]).V;
  assert.strictEqual(one.portOf("IAC Driver Bus 2"), 1, "with one port, every cable is port 1");
});

if (fails) {
  console.log(fails + " VCV check(s) failed");
  process.exit(1);
}
console.log("VCV checks OK");
