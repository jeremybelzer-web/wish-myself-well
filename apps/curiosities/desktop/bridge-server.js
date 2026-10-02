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
/* The ports can be changed with environment variables: CURIO_WS_PORT, CURIO_OSC_IN, CURIO_OSC_OUT (a list). */
function fromEnv(env) {
  const o = {};
  if (env.CURIO_WS_PORT) o.wsPort = Number(env.CURIO_WS_PORT);
  if (env.CURIO_OSC_IN) o.oscIn = Number(env.CURIO_OSC_IN);
  if (env.CURIO_OSC_OUT) o.oscOut = env.CURIO_OSC_OUT;
  return o;
}

function outTargets(spec, host) {
  if (spec === false || spec == null || spec === "") return [];
  const parts = Array.isArray(spec) ? spec : String(spec).split(",");
  return parts
    .map((p) => String(p).trim())
    .filter(Boolean)
    .map((p) => (p.includes(":") ? { host: p.slice(0, p.lastIndexOf(":")), port: Number(p.slice(p.lastIndexOf(":") + 1)) } : { host, port: Number(p) }))
    .filter((t) => t.port > 0);
}

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
    if (o.oscIn !== false) udp.bind(o.oscIn, o.host, () => log(`bridge: OSC in on ${o.host}:${udp.address().port}`));
    else udp.bind(0, o.host);
    closers.push(() => new Promise((r) => udp.close(r)));
  }

  /* Values out. UDP goes to one listener per port, so values can go to several: oscOut is a port, a list of
     ports, or "host:port" text, comma-separated ("7001,7002", "127.0.0.1:7001,192.168.1.20:9000"). */
  const targets = outTargets(o.oscOut, o.oscOutHost);
  if (targets.length) log(`bridge: OSC values out to ${targets.map((t) => t.host + ":" + t.port).join(", ")}`);

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
    if (udp && targets.length)
      for (const v of list) {
        const { address, args } = toOsc(v);
        const packet = osc.encode(address, args);
        targets.forEach((t) => udp.send(packet, t.port, t.host));
      }
  }, Math.round(1000 / o.rate));
  closers.push(() => clearInterval(timer));

  return {
    wss,
    udp,
    close: () => Promise.all(closers.map((c) => c())),
  };
}

module.exports = { start, addresses, outTargets, fromEnv, DEFAULTS };

/* node bridge-server.js : the bridge on the core with no window. */
if (require.main === module) {
  const core = require("../core/headless.js").load();
  setInterval(() => core.tick(), 1000 / 60);
  const B = core.CurioBridge;
  start(Object.assign(fromEnv(process.env), { handle: async (m) => B.handle(m), values: async () => B.values(), log: console.log }));
  console.log(`bridge: ${B.handle({ type: "list" }).params.length} parameters (headless core, no window)`);
}
