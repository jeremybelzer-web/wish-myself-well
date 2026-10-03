/* node check.js (after npm install): the bridge on the headless core, end to end over WebSocket and OSC.
   Uses spare ports, so it runs beside the desktop app. */
const assert = require("assert");
const dgram = require("dgram");
const WebSocket = require("ws");
const osc = require("./osc.js");
const bridge = require("./bridge-server.js");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* The installer (npm run dist) copies the app's files with the filter in package.json. Every file the page
   loads must match it, or the installed app opens with parts missing. Same glob rules as electron-builder:
   * stays inside a folder, ** crosses folders. */
{
  const filter = require("./package.json").build.extraResources[0].filter;
  const rx = filter.map((g) => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*") + "$"));
  const left = require("../core/site-check.js").siteFiles().filter((f) => !rx.some((r) => r.test(f)));
  assert.deepStrictEqual(left, [], "files the page loads that the installer would leave out: add them to build.extraResources in package.json");
}

(async () => {
  /* OSC codec */
  const enc = osc.encode("/curio/set/c/angleHeight", [0.5, 3, "x", true]);
  const dec = osc.decode(enc)[0];
  assert.strictEqual(dec.address, "/curio/set/c/angleHeight");
  assert.deepStrictEqual(dec.args, [0.5, 3, "x", true]);

  const core = require("../core/headless.js").load();
  const B = core.CurioBridge;
  const ticker = setInterval(() => core.tick(), 16);
  const outSock = dgram.createSocket("udp4");
  const received = [];
  outSock.on("message", (b) => received.push(...osc.decode(b)));
  await new Promise((r) => outSock.bind(0, "127.0.0.1", r));

  /* Values go to every OSC target: two listeners each get them. */
  const outSock2 = dgram.createSocket("udp4");
  const received2 = [];
  outSock2.on("message", (b) => received2.push(...osc.decode(b)));
  await new Promise((r) => outSock2.bind(0, "127.0.0.1", r));
  assert.deepStrictEqual(bridge.outTargets("7001, 10.0.0.2:9000", "127.0.0.1"), [{ host: "127.0.0.1", port: 7001 }, { host: "10.0.0.2", port: 9000 }]);

  const server = bridge.start({
    wsPort: 0,
    oscIn: 0,
    oscOut: `${outSock.address().port},127.0.0.1:${outSock2.address().port}`,
    handle: async (m) => B.handle(m),
    values: async () => B.values(),
  });
  await new Promise((r) => server.wss.on("listening", r));
  await wait(100);

  /* WebSocket: list, set, values come back */
  const ws = new WebSocket(`ws://127.0.0.1:${server.wss.address().port}`);
  const msgs = [];
  ws.on("message", (d) => msgs.push(JSON.parse(String(d))));
  await new Promise((r) => ws.on("open", r));
  ws.send(JSON.stringify({ type: "list" }));
  await wait(150);
  const list = msgs.find((m) => m.type === "params");
  assert(list && list.params.length > 100, "list over WebSocket");
  ws.send(JSON.stringify({ type: "set", key: "c:angleHeight", m: 0.25 }));
  await wait(200);
  assert.strictEqual(core.CurioAuto.m("c:angleHeight"), 0.25, "set over WebSocket steers the parameter");
  assert(msgs.some((m) => m.type === "value" && m.key === "c:angleHeight" && m.m === 0.25), "values stream to WebSocket clients");
  assert(received.some((m) => m.address === "/curio/value/c/angleHeight"), "values go out over OSC");
  assert(received2.some((m) => m.address === "/curio/value/c/angleHeight"), "values go to the second OSC target too");

  /* OSC in */
  const sender = dgram.createSocket("udp4");
  sender.send(osc.encode("/curio/set/c/shotSize", [0.75]), server.udp.address().port, "127.0.0.1");
  await wait(200);
  assert(Math.abs(core.CurioAuto.m("c:shotSize") - 0.75) < 1e-6, "set over OSC steers the parameter");
  sender.send(osc.encode("/curio/trigger/c/shotSize", [0]), server.udp.address().port, "127.0.0.1");
  await wait(200);
  assert(!core.CurioAuto.running().includes("c:shotSize"), "trigger off over OSC stops it");

  ws.close();
  sender.close();
  outSock.close();
  outSock2.close();
  clearInterval(ticker);
  await server.close();
  console.log("desktop bridge ok: OSC codec, WebSocket list/set/values, OSC set/trigger/values");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
