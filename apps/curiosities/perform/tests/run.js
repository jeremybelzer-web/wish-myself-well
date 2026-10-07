/* The recorder with no page: node apps/curiosities/perform/tests/run.js */
const path = require("path");
const P = require(path.join(__dirname, "..", "transport.js"));
const { recorder, clean, summary, due, fmt } = P.core;
let fails = 0;
const ok = (c, m) => {
  console.log((c ? "ok   " : "FAIL ") + m);
  if (!c) fails++;
};

const r = recorder();
ok(!r.add("panel", { i: 1 }, 1), "nothing is kept before Record");
r.start(10);
ok(r.on(), "Record is on");
r.add("panel", { i: 3 }, 10.5);
r.add("layer", { name: "triggers", layer: { lanes: { a: 1 } } }, 11);
ok(!r.add("layer", { name: "triggers", layer: { lanes: { a: 1 } } }, 11.2), "the same Catalyst layer twice in a row is one event");
r.add("layer", { name: "triggers", layer: null }, 12);
r.add("edit", { msg: { type: "set", v: 2 } }, 12.5);
ok(!r.add("bogus", {}, 12.6), "an unknown kind is refused");
const take = r.stop(14);
ok(!r.on(), "Record is off");
ok(take.events.length === 4, "four events kept");
ok(Math.abs(take.length - 4) < 1e-9, "the take lasts as long as the recording");
ok(take.events[0].t === 0.5 && take.events[0].i === 3, "times are from the start of the take");
ok(summary(take) === "1 panel jump, 2 Catalyst moves, 1 curiosity change", "summary in plain words: " + summary(take));
ok(due(take, 0.5, 2).length === 2 && due(take, 2, 4).length === 1, "events come due in their stretch");
ok(clean({ events: [{ t: 2, k: "panel", i: 1 }, { t: 1, k: "play", on: true }, { t: -1, k: "panel" }, { t: 1, k: "x" }] }).events.map((e) => e.k).join() === "play,panel", "clean sorts by time and drops bad events");
ok(clean(null) === null && clean({}) === null, "clean refuses what is not a take");
ok(fmt(65.25) === "1:05.3" && fmt(0) === "0:00.0", "time reads as minutes and seconds");
console.log(fails ? fails + " failed" : "all passed");
process.exit(fails ? 1 : 0);
