/* The engine's tests, with no page: node apps/curiosities/engine/tests/run.js [--seed N] [--rounds N]

   Module tests at each file's edges, then the randomized tests the letter says found most of the bugs:
   - undo and redo: random chains of every kind of command, undone to the start and redone to the end;
     the film must match exactly (by fingerprint and by result);
   - save and reload: random commands, then a second copy of the engine loads what was saved; it must come
     back identical, and the fingerprint check must pass;
   - malformed messages: every command fed wrong, missing and extreme values; nothing may throw, and a refused
     command must change nothing;
   - printing: sending only what changed must leave My film exactly as sending everything every time would,
     using fewer host calls.
   A failure prints the seed, so the same run can be repeated. */
const load = require("./load.js");
const assert = require("assert");

const args = process.argv.slice(2);
const argOf = (name, d) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const SEED = argOf("--seed", (Date.now() % 100000) | 0);
const ROUNDS = argOf("--rounds", 60);

let checks = 0;
let failed = 0;
const failures = [];
function check(name, fn) {
  try {
    fn();
    checks++;
  } catch (e) {
    failed++;
    failures.push(name + ": " + (e && e.message));
    if (failures.length < 15) console.log("FAIL " + name + "\n  " + String(e && e.stack).split("\n").slice(0, 4).join("\n  "));
  }
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m };
};

const t0 = Date.now();
const A = load();
const B = load(); /* a second copy of the app: "after a reload" */
const { E, S, Seeds, Analyze, Host, Fake } = A;
const store = memory();
E.useStorage(store);
B.E.useStorage(store);
/* Values made in the engine's own context have that context's Array and Object, so compare them as JSON. */
const plain = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const same = (a, b, msg) => assert.deepStrictEqual(plain(a), plain(b), msg);
const dests = (res) => JSON.stringify(Object.keys(res.dest).sort().map((k) => [k, res.dest[k], res.why[k]]));

/* ---------- catalog.js ---------- */
check("scale: range snaps and holds at the ends", () => {
  assert.strictEqual(S.fix("volume", 3.4), 3);
  assert.strictEqual(S.fix("volume", 99), 5);
  assert.strictEqual(S.fix("volume", "2"), 2);
  assert.strictEqual(S.fix("volume", "loud"), null);
  assert.strictEqual(S.fix("volume", [3]), null);
  assert.strictEqual(S.fix("volume", true), null);
});
check("scale: words keep their order, emotions go by energy", () => {
  assert.strictEqual(S.pos("cutRate", "slow"), 0);
  assert.strictEqual(S.pos("cutRate", "fast"), 1);
  assert.ok(S.pos("emotion", "angry") > S.pos("emotion", "melancholy"));
  assert.strictEqual(S.at("cutRate", 0.5), "medium");
  assert.strictEqual(S.step("cutRate", "slow", 5), "fast");
  assert.strictEqual(S.step("volume", 1, -3), 1);
  assert.strictEqual(S.fix("cutRate", "FAST"), "fast");
});

/* ---------- state.js: the rewrite ---------- */
function tiny() {
  return {
    rows: [1, 2, 3, 4, 5].map((i) => ({ id: "r" + i, label: "R" + i })),
    tracks: [
      { id: "m", kind: "master", label: "Master", curiosities: ["emotion", "cutRate", "angleCount"] },
      { id: "a", kind: "character", label: "Ana", curiosities: ["volume", "gesture"] },
    ],
    source: {},
  };
}
check("rewrite: source, then lanes, then links, then edits, in that order", () => {
  E.reset();
  assert.ok(E.send({ type: "importFilm", film: tiny() }).ok);
  E.send({ type: "setSource", row: "r1", track: "a", curiosity: "volume", value: 1 });
  E.send({ type: "setSource", row: "r3", track: "a", curiosity: "volume", value: 5 });
  assert.strictEqual(E.value("r3", "a", "volume"), 5);
  E.send({ type: "setPoint", row: "r2", track: "a", curiosity: "volume", value: 2 });
  E.send({ type: "setPoint", row: "r4", track: "a", curiosity: "volume", value: 4 });
  assert.strictEqual(E.value("r3", "a", "volume"), 3, "the lane ramps between its points over the source");
  assert.strictEqual(E.why("r3", "a", "volume"), "lane");
  const l = E.send({ type: "addLink", from: { track: "a", curiosity: "volume" }, to: { track: "a", curiosity: "gesture" }, does: "follow" });
  assert.ok(l.ok, l.error);
  assert.strictEqual(E.value("r4", "a", "gesture"), 4, "gesture follows volume (4 of 1..5 is 3.75 of 0..5)");
  E.send({ type: "edit", row: "r4", track: "a", curiosity: "gesture", value: 0 });
  assert.strictEqual(E.value("r4", "a", "gesture"), 0, "a hand edit wins over the link");
  assert.strictEqual(E.why("r4", "a", "gesture"), "edit");
  E.send({ type: "edit", row: "r5", track: "a", curiosity: "gesture", off: true });
  assert.strictEqual(E.value("r5", "a", "gesture"), null);
});
check("lanes: smooth eases out of one point and into the next; a bad mode is refused", () => {
  E.reset();
  const film = tiny();
  film.rows = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({ id: "r" + i, label: "R" + i }));
  assert.ok(E.send({ type: "importFilm", film }).ok);
  E.send({ type: "setPoint", row: "r1", track: "a", curiosity: "volume", value: 1 });
  E.send({ type: "setPoint", row: "r9", track: "a", curiosity: "volume", value: 5 });
  const run = () => film.rows.map((r) => E.value(r.id, "a", "volume"));
  const ramp = run();
  assert.ok(E.send({ type: "laneMode", track: "a", curiosity: "volume", mode: "smooth" }).ok);
  const smooth = run();
  assert.strictEqual(smooth[0], 1);
  assert.strictEqual(smooth[8], 5, "the points themselves are unchanged");
  assert.strictEqual(smooth[4], ramp[4], "halfway is halfway either way");
  assert.ok(smooth[1] < ramp[1], "smooth leaves the first point slowly (" + smooth + " vs " + ramp + ")");
  assert.ok(smooth[7] >= ramp[7], "and arrives at the last one slowly");
  for (let i = 1; i < 9; i++) assert.ok(smooth[i] >= smooth[i - 1], "and never turns back");
  assert.strictEqual(E.send({ type: "laneMode", track: "a", curiosity: "volume", mode: "wobble" }).ok, false, "a lane ramps, smooths or holds");
  E.save();
  B.E.load();
  same(film.rows.map((r) => B.E.value(r.id, "a", "volume")), smooth, "smooth survives a reload");
});

check("links: a follower holds its new value until its own material changes", () => {
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  E.send({ type: "setSource", row: "r2", track: "m", curiosity: "emotion", value: "angry" });
  E.send({ type: "setSource", row: "r3", track: "m", curiosity: "emotion", value: "angry" });
  E.send({ type: "addLink", from: { track: "m", curiosity: "emotion" }, to: { track: "m", curiosity: "cutRate" }, does: "set", value: "fast", from_is: null });
  assert.strictEqual(E.value("r1", "m", "cutRate"), "fast", "a set link with no condition fires from the start");
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  E.send({ type: "setSource", row: "r2", track: "m", curiosity: "emotion", value: "angry" });
  E.send({ type: "addLink", from: { track: "m", curiosity: "emotion", is: "angry" }, to: { track: "m", curiosity: "cutRate" }, does: "set", value: "fast" });
  same(["r1", "r2", "r3", "r4"].map((r) => E.value(r, "m", "cutRate")), ["medium", "fast", "fast", "fast"]);
  E.send({ type: "setSource", row: "r4", track: "m", curiosity: "cutRate", value: "slow" });
  same(["r3", "r4", "r5"].map((r) => E.value(r, "m", "cutRate")), ["fast", "slow", "medium"], "the hold stops where your own material changes");
});
check("links: within delays the follower, every pulses, scope limits", () => {
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  E.send({ type: "setSource", row: "r2", track: "a", curiosity: "volume", value: 5 });
  const l = E.send({ type: "addLink", from: { track: "a", curiosity: "volume", change: "rises" }, to: { track: "a", curiosity: "gesture" }, does: "rise", amount: 0.2, within: 2 });
  assert.ok(l.ok, l.error);
  assert.strictEqual(E.value("r2", "a", "gesture"), 3);
  assert.strictEqual(E.value("r4", "a", "gesture"), 4, "rises one step two rows later");
  E.send({ type: "removeLink", link: l.link });
  const p = E.send({ type: "addLink", from: { track: "m", curiosity: "emotion" }, to: { track: "m", curiosity: "angleCount" }, does: "rise", amount: 0.15, every: 2, scope: { from: "r1", to: "r4" } });
  assert.ok(p.ok, p.error);
  const counts = ["r1", "r2", "r3", "r4", "r5"].map((r) => E.value(r, "m", "angleCount"));
  same(counts, [5, 5, 6, 6, 6], "pulses at rows 1 and 3, held after");
});
check("links: a chain reaction runs through followers, and a loop stops", () => {
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  E.send({ type: "setSource", row: "r3", track: "m", curiosity: "emotion", value: "angry" });
  E.send({ type: "addLink", from: { track: "m", curiosity: "emotion" }, to: { track: "a", curiosity: "volume" }, does: "follow" });
  E.send({ type: "addLink", from: { track: "a", curiosity: "volume" }, to: { track: "a", curiosity: "gesture" }, does: "follow" });
  E.send({ type: "addLink", from: { track: "a", curiosity: "gesture" }, to: { track: "m", curiosity: "cutRate" }, does: "follow" });
  E.send({ type: "addLink", from: { track: "m", curiosity: "cutRate" }, to: { track: "a", curiosity: "volume" }, does: "moveWith", amount: 0.25 });
  assert.strictEqual(E.value("r3", "m", "cutRate"), "fast");
  const chain = E.chains().find((c) => c[0].fromRow === "r3");
  assert.ok(chain && chain.length >= 3, "emotion -> volume -> gesture -> cutting rate");
  assert.ok(E.result().events.length < 200, "the loop is cut off");
});
check("commands: a refused command changes nothing and says why", () => {
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  const fp = E.fingerprint();
  const r = E.send({ type: "setSource", row: "r1", track: "a", curiosity: "volume", value: "very loud" });
  assert.strictEqual(r.ok, false);
  assert.ok(/fit/.test(r.error));
  assert.strictEqual(E.fingerprint(), fp);
  assert.strictEqual(E.send({ type: "nope" }).ok, false);
  assert.strictEqual(E.send(null).ok, false);
});

/* ---------- random commands ---------- */
const CURS = ["emotion", "cutRate", "angleCount", "volume", "gesture", "shotSize", "emotionIntensity", "setting", "timeOfDay"];
function randomCommand(R, st) {
  const pick = (a) => a[Math.floor(R() * a.length)];
  const row = () => (st.rows.length ? pick(st.rows).id : "r1");
  const tr = () => (st.tracks.length ? pick(st.tracks) : { id: "x", curiosities: ["volume"] });
  const valueFor = (c) => {
    const d = S.domain(c);
    return d.kind === "range" ? d.min + Math.floor(R() * (d.max - d.min + 1)) : pick(d.options.length ? d.options : ["x"]);
  };
  const cellish = () => {
    const t = tr();
    const c = t.curiosities.length ? pick(t.curiosities) : "volume";
    return { row: row(), track: t.id, curiosity: c, value: valueFor(c) };
  };
  const end = () => {
    const t = tr();
    return { track: t.id, curiosity: t.curiosities.length ? pick(t.curiosities) : "volume" };
  };
  const kind = pick(["setSource", "setSource", "setSource", "clearSource", "edit", "edit", "editOff", "clearEdit", "addRow", "removeRow", "renameRow", "moveRow", "addTrack", "removeTrack", "renameTrack", "addCuriosity", "removeCuriosity", "setPoint", "setPoint", "removePoint", "laneMode", "clearLane", "addLink", "addLink", "updateLink", "removeLink", "toggleLink", "addRef", "carry", "removeRef", "rename", "printAuto", "batch", "importLinks", "importLinks", "toggleSuite", "removeSuite", "printFrom"]);
  switch (kind) {
    case "editOff":
      return Object.assign({ type: "edit", off: true }, cellish());
    case "addRow":
      return { type: "addRow", at: Math.floor(R() * (st.rows.length + 1)), label: "Row " + Math.floor(R() * 99) };
    case "removeRow":
    case "renameRow":
      return { type: kind, row: row(), label: "Renamed " + Math.floor(R() * 99) };
    case "moveRow":
      return { type: kind, row: row(), to: Math.floor(R() * Math.max(1, st.rows.length)) };
    case "addTrack":
      return { type: kind, label: "Track " + Math.floor(R() * 99), kind: pick(["master", "camera", "character", "look"]), curiosities: [pick(CURS), pick(CURS)] };
    case "removeTrack":
    case "renameTrack":
      return { type: kind, track: tr().id, label: "T" + Math.floor(R() * 99) };
    case "addCuriosity":
      return { type: kind, track: tr().id, curiosity: pick(CURS) };
    case "removeCuriosity":
      return Object.assign({ type: kind }, end());
    case "laneMode":
    case "clearLane": {
      const lanes = Object.keys(st.lanes);
      const [t, c] = lanes.length ? pick(lanes).split("|") : [tr().id, "volume"];
      return { type: kind, track: t, curiosity: c, mode: pick(["ramp", "smooth", "hold"]), on: R() < 0.8 };
    }
    case "addLink": {
      const l = { type: kind, from: end(), to: end(), does: pick(["follow", "oppose", "rise", "fall", "moveWith", "set"]), amount: Math.round(R() * 100) / 100, within: Math.floor(R() * 3), every: R() < 0.2 ? 1 + Math.floor(R() * 3) : 0 };
      if (R() < 0.3) l.from.is = valueFor(l.from.curiosity);
      if (R() < 0.3) l.from.change = pick(["rises", "drops"]);
      l.value = valueFor(l.to.curiosity);
      if (R() < 0.2 && st.rows.length) l.scope = { from: row(), to: row() };
      return l;
    }
    case "updateLink":
    case "removeLink":
    case "toggleLink": {
      const id = st.links.length ? pick(st.links).id : "l1";
      return { type: kind, link: id, changes: { amount: Math.round(R() * 100) / 100, within: Math.floor(R() * 4), on: R() < 0.7 } };
    }
    case "addRef": {
      const n = 2 + Math.floor(R() * 6);
      return { type: kind, ref: { name: "Ref", rows: Array.from({ length: n }, (_, i) => "Row " + i), lanes: { emotion: Array.from({ length: n }, () => valueFor("emotion")), cutRate: Array.from({ length: n }, () => valueFor("cutRate")) } } };
    }
    case "carry":
      return { type: kind, ref: st.refs.length ? pick(st.refs).id : "ref1", curiosity: pick(["emotion", "cutRate"]), track: tr().id, onto: pick(["emotion", "cutRate", "volume"]) };
    case "removeRef":
      return { type: kind, ref: st.refs.length ? pick(st.refs).id : "ref1" };
    case "rename":
      return { type: kind, name: "Film " + Math.floor(R() * 999) };
    case "printAuto":
      return { type: kind, on: R() < 0.5 };
    case "printFrom":
      return { type: kind, from: Math.floor(R() * Math.max(1, st.rows.length)) };
    case "importLinks": {
      /* A small pack in the database's shape: track hints, a group, a chance, sometimes a lens slider. */
      const n = 1 + Math.floor(R() * 4);
      const links = Array.from({ length: n }, (_, i) => {
        const from = { curiosity: pick(CURS.concat(["shotSize.headroom"])), track: pick(["master", "camera", "character", "nowhere"]) };
        const to = { curiosity: pick(CURS), track: pick(["master", "camera", "character"]) };
        const l = { id: "p:r" + Math.floor(R() * 30) + (R() < 0.3 ? "#" + i : ""), label: "Random " + i, from, to, does: pick(["rise", "fall", "moveWith", "set", "follow"]), amount: Math.round(R() * 100) / 100, within: Math.floor(R() * 4) };
        if (l.does === "set") l.value = valueFor(to.curiosity);
        if (R() < 0.3) l.from.is = valueFor(from.curiosity);
        if (R() < 0.3) l.chance = Math.round(R() * 100) / 100;
        return l;
      });
      const pack = { format: "curiosities-links", version: 1, links, groups: [{ id: "ps:g" + Math.floor(R() * 4), label: "Group", links: links.filter(() => R() < 0.6).map((l) => l.id) }] };
      const m = { type: kind, pack, addLanes: R() < 0.5 };
      if (R() < 0.3) m.only = [pick(links).id];
      return m;
    }
    case "toggleSuite":
    case "removeSuite":
      return { type: kind, suite: st.suites.length ? pick(st.suites).id : "s1", on: R() < 0.5, links: R() < 0.5 };
    case "batch":
      return { type: "batch", commands: [Object.assign({ type: "setSource" }, cellish()), Object.assign({ type: "setPoint" }, cellish())] };
    default:
      return Object.assign({ type: kind }, cellish());
  }
}
const KINDS_SEEN = new Set();

check("randomized undo and redo: back to the start and forward to the end, exactly", () => {
  const R = rng(SEED);
  for (let round = 0; round < ROUNDS; round++) {
    E.reset();
    E.send({ type: "importFilm", film: Seeds.starter(["Ana", "Ben"]) });
    E.send({ type: "batch", commands: Seeds.letterLinks(E.state()) });
    const startFp = E.fingerprint();
    const startSteps = E.history().undo.length;
    const startRes = dests(E.result());
    const fps = [startFp];
    const n = 5 + Math.floor(R() * 40);
    for (let i = 0; i < n; i++) {
      const cmd = randomCommand(R, E.state());
      const out = E.send(cmd);
      if (out.ok && !out.unchanged) {
        KINDS_SEEN.add(cmd.type + (cmd.off ? ":off" : ""));
        fps.push(E.fingerprint());
      }
    }
    const endFp = E.fingerprint();
    const endRes = dests(E.result());
    for (let i = fps.length - 1; i > 0; i--) {
      assert.ok(E.undo(), "undo step " + i);
      assert.strictEqual(E.fingerprint(), fps[i - 1], "seed " + SEED + " round " + round + ": undo to step " + (i - 1));
    }
    assert.strictEqual(E.history().undo.length, startSteps);
    assert.strictEqual(dests(E.result()), startRes, "seed " + SEED + " round " + round + ": the result at the start");
    for (let i = 1; i < fps.length; i++) {
      assert.ok(E.redo());
      assert.strictEqual(E.fingerprint(), fps[i], "seed " + SEED + " round " + round + ": redo to step " + i);
    }
    assert.strictEqual(E.fingerprint(), endFp);
    assert.strictEqual(dests(E.result()), endRes);
  }
});
check("randomized save and reload: a second copy loads the same film", () => {
  const R = rng(SEED + 1);
  for (let round = 0; round < ROUNDS; round++) {
    E.reset();
    E.send({ type: "importFilm", film: Seeds.starter(["Ana"]) });
    const n = 3 + Math.floor(R() * 30);
    for (let i = 0; i < n; i++) E.send(randomCommand(R, E.state()));
    assert.ok(E.check().ok, "seed " + SEED + " round " + round + ": the film would not come back the same");
    B.E.load();
    assert.ok(B.E.lastCheck().ok, "seed " + SEED + " round " + round + ": fingerprint after reload: " + JSON.stringify(B.E.lastCheck()));
    assert.strictEqual(B.E.fingerprint(), E.fingerprint(), "seed " + SEED + " round " + round + ": same state");
    assert.strictEqual(dests(B.E.result()), dests(E.result()), "seed " + SEED + " round " + round + ": same result");
  }
});
check("save and reload: a damaged save is caught by the fingerprint", () => {
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  const saved = JSON.parse(store.getItem(E.KEY));
  saved.state.source["r1|a|volume"] = "not a volume";
  store.setItem(E.KEY, JSON.stringify(saved));
  B.E.load();
  assert.strictEqual(B.E.lastCheck().ok, true, "a dropped bad value that was never part of the fingerprint is fine");
  saved.fp = "x.y";
  store.setItem(E.KEY, JSON.stringify(saved));
  B.E.load();
  assert.strictEqual(B.E.lastCheck().ok, false);
});

/* ---------- malformed messages ---------- */
const BAD = () => [undefined, null, NaN, Infinity, -Infinity, -1, 0, 1e12, -1e12, 0.5, "", " ", "x".repeat(100000), "__proto__", "constructor", "r1|a|volume", true, false, [], [1, 2], {}, JSON.parse('{"__proto__": {"polluted": 1}}'), () => 1, Object.create(null)];
const short = (m) => {
  try {
    return JSON.stringify(m).slice(0, 200);
  } catch (e) {
    return String(m);
  }
};
check("malformed messages: nothing throws, refusals change nothing, the state stays valid", () => {
  const R = rng(SEED + 2);
  let sent = 0;
  E.reset();
  E.send({ type: "importFilm", film: Seeds.starter(["Ana", "Ben"]) });
  E.send({ type: "batch", commands: Seeds.letterLinks(E.state()) });
  for (let round = 0; round < ROUNDS * 20; round++) {
    const base = randomCommand(R, E.state());
    const msg = JSON.parse(JSON.stringify(base));
    const fields = Object.keys(msg).filter((k) => k !== "type");
    const hits = 1 + Math.floor(R() * 3);
    for (let h = 0; h < hits; h++) {
      const f = R() < 0.1 ? "type" : fields[Math.floor(R() * fields.length)] || "row";
      const list = BAD();
      const bad = list[Math.floor(R() * list.length)];
      if (R() < 0.15) delete msg[f];
      else if (msg[f] && typeof msg[f] === "object" && R() < 0.5) {
        const sub = Object.keys(msg[f]);
        msg[f][sub[Math.floor(R() * sub.length)] || "x"] = bad;
      } else msg[f] = bad;
    }
    const before = E.fingerprint();
    let out;
    try {
      out = E.send(msg);
    } catch (e) {
      throw new Error("seed " + SEED + " round " + round + ": threw on " + short(msg) + ": " + e.message);
    }
    sent++;
    assert.ok(out && typeof out.ok === "boolean", "an answer with ok");
    if (!out.ok) assert.strictEqual(E.fingerprint(), before, "seed " + SEED + " round " + round + ": a refused command changed the film: " + short(msg));
    const st = E.state();
    assert.strictEqual(E.canon(E.normalize(st)), E.canon(st), "seed " + SEED + " round " + round + ": the state is no longer valid after " + short(msg));
    assert.strictEqual({}.polluted, undefined, "no prototype pollution");
  }
  assert.ok(sent > 0);
  /* Messages that are not objects at all. */
  BAD().concat([42, "setSource", [{ type: "setSource" }]]).forEach((m) => assert.strictEqual(E.send(m).ok, false));
});

/* ---------- host.js with the fake host ---------- */
check("host: reads My film's panels as rows and its live controls as material", () => {
  const fake = Fake.board({ values: { angleCount: 4, volume: 2 } });
  const host = Host.board(fake);
  const film = host.read();
  assert.strictEqual(film.rows.length, 4);
  assert.strictEqual(film.source["r1|char1|volume"], 2);
  E.reset();
  assert.ok(E.send({ type: "importFilm", film }).ok);
});
check("host: printing only what changed leaves My film as printing everything every time", () => {
  const R = rng(SEED + 3);
  const fakeA = Fake.board({ values: { angleCount: 8 } });
  const hostA = Host.board(fakeA);
  E.reset();
  E.send({ type: "importFilm", film: hostA.read() });
  E.send({ type: "batch", commands: Seeds.letterLinks(E.state()) });
  let fullCalls = 0;
  let printsSkipped = 0;
  for (let i = 0; i < ROUNDS * 3; i++) {
    E.send(randomCommand(R, E.state()));
    const out = hostA.print(E.state(), E.result());
    assert.ok(!out.error, out.error);
    if (!out.sent) printsSkipped++;
    if (R() < 0.3) hostA.print(E.state(), E.result()); /* printing twice in a row sends nothing new */
    const fakeB = Fake.board({ values: { angleCount: 8 } });
    const hostB = Host.board(fakeB);
    hostB.print(E.state(), E.result());
    fullCalls += hostB.calls();
    same(fakeA.applied(), fakeB.applied(), "seed " + SEED + " step " + i + ": the board differs");
    same(fakeA.panels(), fakeB.panels());
  }
  assert.ok(printsSkipped > 0, "some prints were skipped as unchanged");
});
check("host: printing replaces a Shelf strand, and taking it back restores it", () => {
  const fake = Fake.board({ values: { angleCount: 3 } });
  fake.apply("Shelf: a study", { volume: [1, 5, 1] });
  const host = Host.board(fake);
  E.reset();
  E.send({ type: "importFilm", film: host.read() });
  host.print(E.state(), E.result());
  assert.strictEqual(fake.applied().label, "Engine");
  assert.ok(host.unprint());
  same(fake.applied(), { label: "Shelf: a study", values: { volume: [1, 5, 1] } });
});
check("host: a broken host gives an answer, not a crash, and the film is untouched", () => {
  const fake = Fake.board({});
  const host = Host.board(fake);
  E.reset();
  E.send({ type: "importFilm", film: host.read() });
  const fp = E.fingerprint();
  fake.broken = "*";
  const out = host.print(E.state(), E.result());
  assert.ok(out.error);
  assert.ok(host.read().error);
  assert.strictEqual(E.fingerprint(), fp);
});
check("fake host: enforces what was measured on the real board", () => {
  const f = Fake.board({ values: { angleCount: 0 } });
  assert.strictEqual(f.count(), 1, "rule 1");
  f.set("emotion", "angry");
  assert.strictEqual(f.values().emotion, undefined, "rule 2");
  f.apply("Shelf", { volume: [1, 2] });
  f.set("volume", 4);
  assert.strictEqual(f.applied(), null, "rule 3");
  f.apply("Automation", { volume: [5] });
  f.apply("Shelf", { cameraCarry: ["locked"] });
  assert.strictEqual(f.panels()[0].volume, 5, "rule 4 and 5");
  const a = f.applied();
  a.values.cameraCarry[0] = "handheld";
  assert.strictEqual(f.applied().values.cameraCarry[0], "locked", "rule 6");
});

/* ---------- analyze.js ---------- */
const SCRIPT = [
  "INT. KITCHEN - NIGHT",
  "",
  "Ana paces. She glances at the clock.",
  "",
  "ANA",
  "(whispering)",
  "Where is he?",
  "",
  "BEN (O.S.)",
  "I'm here! I'm HERE!",
  "",
  "EXT. ROOF - DAWN",
  "",
  "They sit. She smiles.",
  "",
  "ANA",
  "I love this.",
  "",
  "INT. CAR - DAY",
  "",
  "BEN",
  "Ha!",
].join("\n");
check("analysis: a script gives one row per scene and keeps no text", () => {
  const ref = Analyze.script(SCRIPT, "Test");
  assert.strictEqual(ref.rows.length, 3);
  same(ref.lanes.timeOfDay, ["night", "dawn", "day"]);
  same(ref.lanes.intExt, ["interior", "exterior", "interior"]);
  assert.strictEqual(ref.lanes.emotion[0], "anxious");
  assert.strictEqual(ref.lanes.peopleCount[0], 2);
  const kept = JSON.stringify(ref);
  ["clock", "Where is he", "love this", "KITCHEN", "ANA", "Ben"].forEach((w) => assert.ok(!kept.includes(w), "kept the text: " + w));
});
check("analysis: a shot list reads columns or the words in each row", () => {
  const ref = Analyze.shotList("Shot,Size,Angle,Movement,Duration\n1,WS,high,static,8\n2,CU,low,handheld push,1.2", "S");
  same(ref.lanes.shotSize, ["wide", "close"]);
  same(ref.lanes.cutRate, ["slow", "fast"]);
  same(ref.lanes.cameraCarry, ["locked", "handheld"]);
  assert.strictEqual(Analyze.detect("Shot,Size\n1,WS"), "shotList");
});
check("analysis: carry a reference curiosity onto your film as a lane", () => {
  E.reset();
  E.send({ type: "importFilm", film: Seeds.starter(["Ana"]) });
  const ref = Analyze.script(SCRIPT, "Test");
  const added = E.send({ type: "addRef", ref });
  assert.ok(added.ok, added.error);
  const c = E.send({ type: "carry", ref: added.ref, curiosity: "emotion", track: "master" });
  assert.ok(c.ok, c.error);
  assert.strictEqual(E.value("r1", "master", "emotion"), "anxious");
  assert.strictEqual(E.why("r8", "master", "emotion"), "lane");
  const c2 = E.send({ type: "carry", ref: added.ref, curiosity: "volume", track: "char1", onto: "gesture" });
  assert.ok(c2.ok, c2.error);
});
check("analysis: survives anything pasted", () => {
  const R = rng(SEED + 4);
  for (let i = 0; i < 200; i++) {
    let s = "";
    const n = Math.floor(R() * 400);
    for (let j = 0; j < n; j++) s += R() < 0.1 ? "\n" : R() < 0.1 ? "INT. " : String.fromCharCode(32 + Math.floor(R() * 95));
    const a = Analyze.script(s);
    const b = Analyze.shotList(s);
    assert.ok(Array.isArray(a.rows) && Array.isArray(b.rows));
    if (a.rows.length && Object.keys(a.lanes).length) assert.ok(E.send({ type: "addRef", ref: a }).ok || E.state().refs.length >= E.LIMIT.refs);
  }
  [null, undefined, 42, {}, "", "\n\n\n"].forEach((x) => {
    Analyze.script(x);
    Analyze.shotList(x);
  });
});
check("analysis: the app's reference scenes", () => {
  const ref = Analyze.scenes(A.window.SCENES || (typeof SCENES !== "undefined" ? SCENES : []).slice(0, 2));
  assert.ok(ref.rows.length >= 0);
});

/* ---------- speed ---------- */
/* ---------- link packs: the curiosity database's export ---------- */
const DB_LINKS = (() => {
  try {
    return require("../../data/curiosity-links.json");
  } catch (e) {
    return null;
  }
})();
check("links: a pack places each end on the track that has its curiosity, or the hinted one", () => {
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  const pack = {
    format: "curiosities-links",
    version: 1,
    links: [
      { id: "p:a", label: "Feeling leads volume", from: { curiosity: "emotion", track: "master", change: "any" }, to: { curiosity: "volume", track: "character" }, does: "moveWith", amount: 0.5, within: 1 },
      { id: "p:b#1", label: "Angles lead shot size", from: { curiosity: "angleCount", track: "master" }, to: { curiosity: "shotSize", track: "camera" }, does: "rise", amount: 0.25, within: 0 },
      { id: "p:c", label: "Gesture leads cut rate", from: { curiosity: "gesture", track: "character" }, to: { curiosity: "cutRate", track: "master" }, does: "rise", amount: 0.25, within: 0 },
    ],
    groups: [{ id: "ps:x", label: "Body and edit", links: ["p:a", "p:c"] }],
  };
  let r = E.send({ type: "importLinks", pack });
  assert.ok(r.ok, r.error);
  assert.strictEqual(r.added, 2);
  assert.strictEqual(r.waiting, 1, "shot size is on no track, so its link waits");
  assert.strictEqual(E.state().suites.length, 1);
  assert.ok(E.state().links.every((l) => l.suite === E.state().suites[0].id));
  /* Asking for one link with addLanes puts the missing curiosity on a track (no camera track: Master). */
  r = E.send({ type: "importLinks", pack, only: ["p:b#1"], addLanes: true });
  assert.ok(r.ok, r.error);
  assert.strictEqual(r.added, 1);
  assert.ok(E.state().tracks[0].curiosities.includes("shotSize"));
  /* Again: nothing new, links updated in place, and a link switched off stays off. */
  E.send({ type: "toggleLink", link: E.state().links[0].id, on: false });
  r = E.send({ type: "importLinks", pack });
  assert.strictEqual(r.added || 0, 0);
  assert.strictEqual(E.state().links[0].on, false);
  /* Switching the suite off stops its links firing; removing it keeps the links unless asked. */
  const before = E.result().events.length;
  E.send({ type: "setSource", row: "r3", track: "m", curiosity: "emotion", value: "angry" });
  E.send({ type: "toggleLink", link: E.state().links[0].id, on: true });
  const on = E.result().events.filter((e) => e.link === E.state().links[0].id).length;
  E.send({ type: "toggleSuite", suite: E.state().suites[0].id, on: false });
  assert.ok(on > 0 && E.result().events.filter((e) => e.link === E.state().links[0].id).length === 0, "a suite switched off silences its links");
  assert.ok(before >= 0);
  E.send({ type: "removeSuite", suite: E.state().suites[0].id });
  assert.strictEqual(E.state().links.length, 3);
  assert.ok(E.state().links.every((l) => !l.suite));
  same(E.drift(), []);
});
check("links: chance fires the same way every time; a lane can set up its own payoff", () => {
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  ["r1", "r2", "r3", "r4", "r5"].forEach((r, i) => E.send({ type: "setSource", row: r, track: "m", curiosity: "emotion", value: ["curious", "angry", "curious", "angry", "curious"][i] }));
  E.send({ type: "addLink", from: { track: "m", curiosity: "emotion" }, to: { track: "m", curiosity: "cutRate" }, does: "rise", amount: 0.5, chance: 0.5 });
  const a = JSON.stringify(E.result().dest);
  E.send({ type: "rename", name: "again" });
  assert.strictEqual(JSON.stringify(E.result().dest), a);
  assert.strictEqual(E.state().links[0].chance, 0.5);
  /* "within 2 rows of the feeling being angry, it becomes joyful" */
  const r = E.send({ type: "addLink", from: { track: "m", curiosity: "emotion", is: "angry" }, to: { track: "m", curiosity: "emotion" }, does: "set", value: "joyful", within: 2 });
  assert.ok(r.ok, r.error);
  assert.strictEqual(E.result().dest["r4|m|emotion"], "joyful");
  assert.strictEqual(E.send({ type: "addLink", from: { track: "m", curiosity: "emotion", is: "angry" }, to: { track: "m", curiosity: "emotion" }, does: "set", value: "joyful", within: 0 }).ok, false, "a same-lane link must look ahead");
});
check("links: the curiosity database's own export loads, a group at a time", () => {
  if (!DB_LINKS) return; /* the export arrives with the database's branch */
  E.reset();
  E.send({ type: "importFilm", film: Seeds.starter(["Ana", "Ben"]) });
  let total = 0;
  DB_LINKS.groups.forEach((g) => {
    const r = E.send({ type: "importLinks", pack: DB_LINKS, only: [g.id], addLanes: true });
    if (r.ok) total += r.added || 0;
  });
  assert.ok(total > 50, "groups added " + total + " links");
  assert.ok(E.state().links.length <= E.LIMIT.links);
  same(E.drift(), []);
  assert.ok(E.check().ok);
});
check("links: the app's own proximities become a pack (the database's export, or converted)", () => {
  const pack = Seeds.dbPack();
  assert.ok(pack.links.length >= 100, pack.links.length + " links");
  assert.ok((pack.groups || pack.suites).length >= 20);
  E.reset();
  E.send({ type: "importFilm", film: Seeds.starter() });
  const r = E.send({ type: "importLinks", pack });
  assert.ok(r.ok && r.added > 0, r.error);
});
check("scale: a lens slider from the database works as a curiosity", () => {
  if (!S.known("shotSize.headroom")) return;
  assert.strictEqual(S.domain("shotSize.headroom").kind, "range");
  assert.strictEqual(S.fix("shotSize.headroom", 9), 5);
  assert.ok(/Shot size/.test(S.label("shotSize.headroom")));
});
check("saving: a film saved by the first version loads without a false alarm", () => {
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  const st = JSON.parse(JSON.stringify(E.state()));
  st.v = 1;
  delete st.suites;
  st.print = { auto: false };
  const store = {};
  const mem = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] };
  store["curiosities-engine-v1"] = JSON.stringify({ format: "curiosities-engine", v: 1, fp: E.fingerprint(st), state: st });
  E.useStorage(mem);
  assert.ok(E.load());
  assert.ok(E.lastCheck().ok, E.lastCheck().note);
  E.useStorage(null);
});

/* ---------- printing past 8 moments ---------- */
check("host: My film shows a window of the film; print.from moves it", () => {
  const fake = Fake.board({ values: { angleCount: 4 } });
  const h = Host.board(fake);
  E.reset();
  E.send({ type: "importFilm", film: Seeds.starter() });
  for (let i = 0; i < 6; i++) E.send({ type: "addRow" });
  assert.strictEqual(E.state().rows.length, 14);
  let p = h.print(E.state(), E.result());
  same([p.from, p.count, p.of], [0, 4, 14]);
  const cur = p.printed[0];
  const tr = E.state().tracks.find((t) => t.curiosities.includes(cur)).id;
  same(fake.applied().values[cur], E.state().rows.slice(0, 4).map((r) => E.result().dest[r.id + "|" + tr + "|" + cur]));
  E.send({ type: "printFrom", from: 12 });
  p = h.print(E.state(), E.result());
  same([p.from, p.count], [12, 2]);
  same(fake.applied().values[cur], E.state().rows.slice(12).map((r) => E.result().dest[r.id + "|" + tr + "|" + cur]));
  E.send({ type: "removeRow", row: E.state().rows[13].id });
  E.send({ type: "removeRow", row: E.state().rows[12].id });
  assert.strictEqual(E.state().print.from, 11, "the window follows the film when rows go");
  same(E.drift(), []);
});
check("host: the storyboard reads and takes the whole film, with or without its own door", () => {
  const scenes = [{ id: "a", name: "Kitchen", panels: Array.from({ length: 20 }, (_, i) => ({ v: { emotion: i % 2 ? "angry" : "loving", volume: 1 + (i % 5) }, line: { who: i % 2 ? "Ana" : "Ben", text: "x" } })) }];
  const store = { "curiosities-storyboard-v1": JSON.stringify({ scenes }) };
  const mem = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)) };
  const plain = { KEY: "curiosities-storyboard-v1", data: () => JSON.parse(store["curiosities-storyboard-v1"]) };
  const sb = Host.storyboard(plain, { storage: mem });
  const film = sb.read([0]);
  assert.strictEqual(film.rows.length, 20);
  same(film.tracks.filter((t) => t.kind === "character").map((t) => t.label), ["Ben", "Ana"]);
  E.reset();
  E.send({ type: "importFilm", film });
  for (let i = 0; i < 10; i++) E.send({ type: "addRow" });
  assert.strictEqual(E.state().rows.length, 30);
  let out = sb.print(E.state(), E.result());
  assert.ok(out.reload, "without putScenes the page must reload");
  let saved = JSON.parse(store["curiosities-storyboard-v1"]).scenes;
  same(saved.map((s) => [s.engine === true, s.panels.length]), [[false, 20], [true, 24], [true, 6]]);
  assert.strictEqual(saved[1].panels[3].v.emotion, E.result().dest[E.state().rows[3].id + "|master|emotion"]);
  /* Printing again replaces the engine's scenes and keeps yours. */
  E.send({ type: "removeRow", row: E.state().rows[29].id });
  sb.print(E.state(), E.result());
  saved = JSON.parse(store["curiosities-storyboard-v1"]).scenes;
  same(saved.map((s) => s.panels.length), [20, 24, 5]);
  assert.ok(sb.unprint());
  same(JSON.parse(store["curiosities-storyboard-v1"]).scenes.map((s) => s.name), ["Kitchen"]);
  /* With its own door, no reload. */
  let put = null;
  const door = Object.assign({}, plain, { putScenes: (tag, list) => (put = [tag, list]) });
  out = Host.storyboard(door, { storage: mem }).print(E.state(), E.result());
  assert.strictEqual(out.reload, false);
  assert.strictEqual(put[0], "engine");
  same(put[1].map((s) => s.panels.length), [24, 5]);
});
check("bridge: a tool can ask for the whole film as a timeline", () => {
  E.reset();
  E.send({ type: "importFilm", film: Seeds.starter(["Ana", "Ben"]) });
  for (let i = 0; i < 8; i++) E.send({ type: "addRow" });
  const B = A.window.CurioBridge;
  /* bridge.js answers "timeline" itself once it carries the engine's patch; until then the engine teaches it. */
  if (!B.TIMELINE) {
    assert.ok(Host.extendBridge());
    assert.ok(!Host.extendBridge(), "only once");
  } else assert.ok(!Host.extendBridge(), "bridge.js answers it itself");
  const t = B.handle({ type: "timeline" });
  assert.strictEqual(t.type, "timeline");
  assert.strictEqual(t.panels.length, 16);
  assert.strictEqual(t.byTrack.char2.length, 16);
  assert.strictEqual(t.panels[5].emotion, E.result().dest[E.state().rows[5].id + "|master|emotion"]);
  assert.strictEqual(B.handle(JSON.stringify({ type: "timeline" })).rows.length, 16);
  assert.strictEqual(B.handle({ type: "list" }).type, "params", "everything else still reaches bridge.js");
});

check("store: the engine's changes are on the app-wide undo list too, and its own Undo stays in step", () => {
  const C = A.window.CurioStore;
  E.reset();
  E.send({ type: "importFilm", film: tiny() });
  const v = () => E.value("r2", "a", "volume");
  const start = v();
  assert.ok(E.send({ type: "setPoint", row: "r2", track: "a", curiosity: "volume", value: 2 }).ok);
  assert.ok(E.send({ type: "setPoint", row: "r2", track: "a", curiosity: "volume", value: 4 }).ok);
  assert.strictEqual(C.history().undo.slice(-1)[0], "Engine: Set an automation point");
  assert.ok(C.undo());
  assert.strictEqual(v(), 2, "the page's undo undoes the engine's newest step");
  assert.ok(C.redo());
  assert.strictEqual(v(), 4, "and redoes it");
  assert.ok(E.undo(), "the engine's own Undo");
  assert.strictEqual(v(), 2);
  assert.ok(C.undo(), "the page's undo skips the step the engine already undid");
  assert.strictEqual(v(), start, "and undoes the one before it");
  assert.ok(E.redo());
  assert.strictEqual(v(), 2, "the engine's own Redo still works after the page's undo");
});

/* ---------- the shared store (engine/store.js): one undo list for the app's parts ---------- */
check("store: parts change by commands, undo in place across parts, and keep their own saved keys", () => {
  const C = A.window.CurioStore;
  const mem = memory();
  C.useStorage(mem);
  mem.setItem("curiosities-test-a-v1", JSON.stringify({ n: 3 }));
  const fixA = (x) => ({ n: Math.max(0, Math.min(9, Number(x && x.n) || 0)) });
  const a = C.part("test-a", { key: "curiosities-test-a-v1", initial: () => ({ n: 0 }), normalize: fixA, commands: { add: (d, m) => (d.n += m.by), boom: () => { throw new Error("no"); } } });
  const b = C.part("test-b", { key: "curiosities-test-b-v1", initial: () => ({ s: "" }), normalize: (x) => ({ s: String((x && x.s) || "").slice(0, 5) }), commands: { set: (d, m) => (d.s = m.s) } });
  const view = a.view();
  assert.strictEqual(view.n, 3, "a part starts from its saved key");
  let told = 0;
  a.on(() => told++);
  assert.ok(a.send({ type: "add", by: 2 }).ok);
  assert.strictEqual(view.n, 5, "the view is the same object, updated in place");
  assert.strictEqual(JSON.parse(mem.getItem("curiosities-test-a-v1")).n, 5);
  assert.ok(a.send({ type: "add", by: 100 }).ok);
  assert.strictEqual(view.n, 9, "normalized");
  assert.ok(b.send({ type: "set", s: "hello world" }).ok);
  assert.strictEqual(b.view().s, "hello");
  assert.strictEqual(a.send({ type: "boom" }).ok, false);
  assert.strictEqual(a.send({ type: "nope" }).ok, false);
  assert.strictEqual(view.n, 9, "a refused command changes nothing");
  assert.ok(a.send({ type: "add", by: 0 }).unchanged, "no change, no step");
  same(C.history().undo.slice(-3), ["add", "add", "set"]);
  C.undo();
  assert.strictEqual(b.view().s, "", "undo reaches the part that changed last");
  C.undo();
  assert.strictEqual(view.n, 5);
  assert.strictEqual(JSON.parse(mem.getItem("curiosities-test-a-v1")).n, 5, "undo saves");
  C.redo();
  assert.strictEqual(view.n, 9);
  assert.ok(told >= 4, "views are told");
  /* A dragged slider: sends with the same merge text inside MERGE_MS are one step. */
  const steps = C.history().undo.length;
  a.send({ type: "add", by: -1, merge: "drag" });
  a.send({ type: "add", by: -1, merge: "drag" });
  a.send({ type: "add", by: -1, merge: "drag" });
  assert.strictEqual(C.history().undo.length, steps + 1);
  C.undo();
  assert.strictEqual(view.n, 9);
  /* Running automation: saved, never a step. */
  a.send({ type: "add", by: -4 }, { record: false });
  assert.strictEqual(C.history().undo.length, steps);
  assert.ok(C.owns("curiosities-test-a-v1") && !C.owns("curiosities-other-v1"));
  assert.throws(() => C.part("test-a", {}), /new name/);
  C.useStorage(null);
});

check("speed: a full rewrite of the biggest film is quick", () => {
  E.reset();
  const rows = Array.from({ length: E.LIMIT.rows }, (_, i) => ({ id: "r" + i, label: "R" + i }));
  const tracks = Array.from({ length: E.LIMIT.tracks }, (_, i) => ({ id: "t" + i, kind: "other", label: "T" + i, curiosities: CURS.slice() }));
  E.send({ type: "importFilm", film: { rows, tracks, source: {} } });
  const links = [];
  for (let i = 0; i < 120; i++) links.push({ type: "addLink", from: { track: "t" + (i % 16), curiosity: CURS[i % CURS.length] }, to: { track: "t" + ((i + 1) % 16), curiosity: CURS[(i + 3) % CURS.length] }, does: "follow", amount: 0.5 });
  E.send({ type: "batch", commands: links });
  const t = Date.now();
  for (let i = 0; i < 10; i++) E.send({ type: "setSource", row: "r" + i, track: "t0", curiosity: "emotion", value: i % 2 ? "angry" : "loving" });
  const ms = (Date.now() - t) / 10;
  console.log("  one change on a 64 x 16 x 9 film with 120 links: " + ms.toFixed(1) + " ms (rewrite, undo snapshot, save)");
  assert.ok(ms < 500);
});

check("every command leaves a state that needs no fixing to survive a reload", () => {
  const d = E.drift();
  assert.strictEqual(d.length, 0, d.length ? "a " + d[0].type + " command left:\n" + d[0].before.slice(0, 600) + "\nwhich reload turns into:\n" + d[0].after.slice(0, 600) : "");
});

check("load.js adds the same files, in the same order, as files.json lists", () => {
  const fs = require("fs");
  const path = require("path");
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files.json"), "utf8"));
  const src = fs.readFileSync(path.join(__dirname, "..", "load.js"), "utf8");
  const inLoad = JSON.parse(src.match(/const FILES = (\[[^\]]*\])/)[1]);
  same(inLoad, list.core.concat(list.screens));
});

const kinds = [...KINDS_SEEN].sort();
console.log("\nseed " + SEED + ", " + ROUNDS + " rounds; command kinds exercised in undo/redo: " + kinds.length + " (" + kinds.join(", ") + ")");
console.log(checks + " passed, " + failed + " failed, in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
if (failed) {
  console.log(failures.join("\n"));
  process.exit(1);
}
