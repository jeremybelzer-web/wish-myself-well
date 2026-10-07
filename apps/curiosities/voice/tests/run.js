/* The voice command reader with no page: node apps/curiosities/voice/tests/run.js
   Checks numbers, fillers, chains, the fixed shapes, and that a list of real Screen action names is found
   from the way people say them (voice/tests/said.json: [said, the label it should find]). */
const fs = require("fs");
const path = require("path");
const W = require("../commands.js");

let fails = 0;
const ok = (cond, msg, extra) => {
  console.log((cond ? "ok   " : "FAIL ") + msg + (!cond && extra !== undefined ? "\n       got " + JSON.stringify(extra) : ""));
  if (!cond) fails++;
};

/* Numbers. */
[
  ["moment twelve", "moment 12"],
  ["twenty one", "21"],
  ["a hundred and five", "105"],
  ["three point five", "3.5"],
  ["fifty percent", "50%"],
  ["one hundred", "100"],
  ["go for it", "go for it"],
  ["oh no", "oh no"],
].forEach(([a, b]) => ok(W.numbers(a) === b, `numbers: "${a}" -> "${b}"`, W.numbers(a)));

/* Fillers. */
[
  ["Um, could you please go to moment 3", "go to moment 3"],
  ["hey curio open the export menu", "open the export menu"],
  ["Okay so let's play", "play"],
  ["I want to undo that, thanks", "undo that"],
].forEach(([a, b]) => ok(W.clean(a) === b, `clean: "${a}" -> "${b}"`, W.clean(a)));

/* Chains. */
ok(JSON.stringify(W.chain("go to moment 3 and then play")) === JSON.stringify(["go to moment 3", "play"]), 'chain: "and then" splits');
ok(JSON.stringify(W.chain("next moment, then undo. Then play")) === JSON.stringify(["next moment", "undo", "play"]), "chain: commas, then, full stops");
ok(W.chain("cut and paste").length === 1, 'chain: a plain "and" does not split');

/* Fixed shapes. */
const P = (t) => W.pattern(W.clean(t));
[
  ["go to moment 7", { kind: "moment", n: 7 }],
  ["moment two", { kind: "moment", n: 2 }],
  ["jump to frame 4", { kind: "moment", n: 4 }],
  ["go to the end", { kind: "moment", n: -1 }],
  ["back 3 moments", { kind: "step", by: -3 }],
  ["forward two frames", { kind: "step", by: 2 }],
  ["undo", { kind: "undo", n: 1 }],
  ["pause", { kind: "stop" }],
  ["undo that twice", { kind: "undo", n: 2 }],
  ["redo 4 times", { kind: "redo", n: 4 }],
  ["number 2", { kind: "pick", n: 2 }],
  ["the second one", { kind: "pick", n: 2 }],
  ["3", { kind: "pick", n: 3 }],
  ["type a lonely diner", { kind: "type", text: "a lonely diner" }],
  ["set lens length to 85", { kind: "set", what: "lens length", value: 85, unit: "" }],
  ["make the saturation 40 percent", null],
  ["set saturation to forty percent", { kind: "set", what: "saturation", value: 40, unit: "%" }],
  ["what can I say", { kind: "help" }],
  ["stop listening", { kind: "sleep" }],
  ["scroll down", { kind: "scroll", dir: "down", big: false }],
  ["never mind", { kind: "cancel" }],
].forEach(([t, want]) => {
  const got = P(t);
  ok(JSON.stringify(got) === JSON.stringify(want), `shape: "${t}"`, got);
});

/* Real names (the Screen's actions and the app's bar), said the way people say them. */
const LABELS = JSON.parse(fs.readFileSync(path.join(__dirname, "labels.json"), "utf8")).map((label) => ({ label }));
const SAID = JSON.parse(fs.readFileSync(path.join(__dirname, "said.json"), "utf8"));
let right = 0;
SAID.forEach(([said, want]) => {
  const top = W.rank(W.clean(said), LABELS, 3);
  const good = top[0] && top[0].it.label === want && (!top[1] || top[0].s - top[1].s >= 2.5 || W.norm(top[0].it.label) === W.clean(said));
  if (good) right++;
  else console.log(`     miss "${said}" -> ${top.map((x) => `${x.it.label} ${x.s.toFixed(1)}`).join(" | ") || "nothing"} (wanted ${want})`);
});
const share = right / SAID.length;
ok(share >= 0.9, `real names said aloud: ${right} of ${SAID.length} (${Math.round(share * 100)}%) found first and clearly (needs 90%)`);

console.log(fails ? `\n${fails} failed` : "\nall voice reader checks passed");
process.exit(fails ? 1 : 0);
