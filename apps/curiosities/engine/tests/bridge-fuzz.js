/* Feed the app's bridge (bridge.js, owned by the platform thread) wrong, missing and extreme values, and
   report what throws or changes saved work. Report only: it does not fail the engine's tests.
   node apps/curiosities/engine/tests/bridge-fuzz.js */
const load = require("./load.js");
const c = load();
const B = c.CurioBridge;
const BAD = [undefined, null, NaN, Infinity, -1, 1e12, "", "x".repeat(50000), "__proto__", "constructor", true, [], {}, [1, 2], { a: 1 }];
const TYPES = ["set", "trigger", "stopAll", "list", "panels", "apply", "value", "nope", undefined, null, 42];
const FIELDS = ["key", "m", "on", "ids", "label", "values", "type"];
const found = new Map();
let seed = 99;
const R = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(R() * a.length)];
for (let i = 0; i < 20000; i++) {
  const msg = { type: pick(TYPES) };
  FIELDS.forEach((f) => R() < 0.5 && (msg[f] = R() < 0.3 ? pick(["c:angleHeight", "s:noir", "p:handheld-gesture", "ps:long-form", "c:arcStage@Nessa", 0.5, 1]) : pick(BAD)));
  if (msg.type === "set" && R() < 0.3) msg.key = "c:" + pick(BAD);
  try {
    B.handle(msg);
    c.tick();
  } catch (e) {
    const k = String(e && e.message).slice(0, 120);
    if (!found.has(k)) found.set(k, JSON.stringify(msg, (kk, v) => (typeof v === "string" && v.length > 40 ? v.slice(0, 20) + "…(" + v.length + ")" : v)));
  }
  try {
    B.fromOsc(pick(["/curio/set/c/angleHeight", "/curio/trigger", "/curio/", "", "/curio/set/c/__proto__", null]), [pick(BAD)]);
  } catch (e) {
    const k = "fromOsc: " + String(e && e.message).slice(0, 120);
    if (!found.has(k)) found.set(k, "OSC");
  }
}
let saved = null;
try {
  saved = JSON.parse(c.localStorage.getItem("curiosities-automation-v1") || "null");
} catch (e) {
  found.set("saved automation is no longer JSON", "");
}
console.log(found.size ? found.size + " ways a bad message threw:" : "No bad message threw.");
for (const [k, v] of found) console.log(" - " + k + "\n   e.g. " + v);
console.log("Saved automation after the run: " + (saved ? Object.keys(saved.patches || {}).length + " patches" : "none"));
/* Values out of range in what was saved. */
const odd = [];
const walk = (x, p) => {
  if (typeof x === "number" && (!isFinite(x) || Math.abs(x) > 1e6)) odd.push(p + " = " + x);
  else if (typeof x === "string" && x.length > 1000) odd.push(p + " is a " + x.length + "-character string");
  else if (x && typeof x === "object") Object.keys(x).forEach((k) => walk(x[k], p + "." + k));
};
walk(saved, "automation");
console.log(odd.length ? odd.length + " odd saved values, e.g. " + odd.slice(0, 5).join("; ") : "No odd values saved.");
