/* The local bridge: lets VCV Rack, TouchOSC, Max, a Maya or Blender script, or anything else on this
   computer move curiosities, using the message format in ../bridge.js (core/README.md).

   - WebSocket on ws://127.0.0.1:7577: send JSON messages ({type: "set", key, m}, {type: "trigger", ...},
     {type: "list"}); every client receives {type: "value", key, m} for each running parameter, about 30
     times a second, and replies to its own requests.
   - OSC over UDP: listens on 127.0.0.1:7000 (/curio/set/c/angleHeight 0.42, /curio/trigger/s/noir 1) and
     sends /curio/value/... to 127.0.0.1:7001.
   Only this computer can connect (127.0.0.1). Pass wsPort, oscIn or oscOut as false to leave one off, or 0 for a spare port.

   start({ handle, values }) takes two async functions: the desktop app runs them in its window
   (CurioBridge.handle and CurioBridge.values); `node bridge-server.js` runs them on the core with no
   window (core/headless.js), for trying a VCV module or an OSC controller without the app. */
const dgram = require("dgram");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const osc = require("./osc.js");

/* fromOsc and toOsc straight from ../bridge.js (they need nothing else), so the addresses never drift. */
function addresses(appDir) {
  const ctx = {};
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(appDir || path.join(__dirname, ".."), "bridge.js"), "utf8"), ctx);
  return { fromOsc: ctx.CurioBridge.fromOsc, toOsc: ctx.CurioBridge.toOsc };
}

const DEFAULTS = { host: "127.0.0.1", wsPort: 7577, oscIn: 7000, oscOutHost: "127.0.0.1", oscOut: 7001, rate: 30 };

function start(options) {
  const o = Object.assign({}, DEFAULTS, options);
  const { handle, values } = o;
  const log = o.log || (() => {});
  const codec = o.fromOsc && o.toOsc ? o : addresses(o.appDir);
  const fromOsc = codec.fromOsc;
  const toOsc = codec.toOsc;
  const closers = [];

  /* WebSocket */
  let wss = null;
  if (o.wsPort !== false) {
    const { WebSocketServer } = require("ws");
    wss = new WebSocketServer({ host: o.host, port: o.wsPort });
    wss.on("connection", (sock) => {
      sock.on("message", async (data) => {
        let reply;
        try {
          reply = await handle(String(data));
        } catch (e) {
          reply = { type: "error", error: String(e.message || e) };
        }
        if (reply) sock.send(JSON.stringify(reply));
      });
    });
    wss.on("listening", () => log(`bridge: WebSocket on ws://${o.host}:${wss.address().port}`));
    closers.push(() => new Promise((r) => (wss.clients.forEach((c) => c.terminate()), wss.close(r))));
  }

  /* OSC */
  let udp = null;
  if (o.oscIn !== false || o.oscOut !== false) {
    udp = dgram.createSocket("udp4");
    udp.on("message", async (buf) => {
      let msgs = [];
      try {
        msgs = osc.decode(buf);
      } catch (e) {
        return;
      }
      for (const m of msgs) {
        const msg = fromOsc(m.address, m.args);
        if (msg && msg.type !== "value") await handle(msg);
      }
    });
    udp.on("error", (e) => log("bridge: OSC " + e.message));
    if (o.oscIn !== false) udp.bind(o.oscIn, o.host, () => log(`bridge: OSC in on ${o.host}:${udp.address().port}, out to ${o.oscOutHost}:${o.oscOut}`));
    else udp.bind(0, o.host);
    closers.push(() => new Promise((r) => udp.close(r)));
  }

  /* Values out */
  let last = "";
  const timer = setInterval(async () => {
    let list;
    try {
      list = (await values()) || [];
    } catch (e) {
      return;
    }
    const text = JSON.stringify(list);
    if (text === last) return;
    last = text;
    if (wss) list.forEach((v) => wss.clients.forEach((c) => c.readyState === 1 && c.send(JSON.stringify(v))));
    if (udp && o.oscOut !== false)
      for (const v of list) {
        const { address, args } = toOsc(v);
        udp.send(osc.encode(address, args), o.oscOut, o.oscOutHost);
      }
  }, Math.round(1000 / o.rate));
  closers.push(() => clearInterval(timer));

  return {
    wss,
    udp,
    close: () => Promise.all(closers.map((c) => c())),
  };
}

module.exports = { start, addresses, DEFAULTS };

/* node bridge-server.js : the bridge on the core with no window. */
if (require.main === module) {
  const core = require("../core/headless.js").load();
  setInterval(() => core.tick(), 1000 / 60);
  const B = core.CurioBridge;
  start({ handle: async (m) => B.handle(m), values: async () => B.values(), log: console.log });
  console.log(`bridge: ${B.handle({ type: "list" }).params.length} parameters (headless core, no window)`);
}
