/* Bridge: one message format for everything outside the app that moves a curiosity, suite, proximity or
   proximity suite (a VCV Rack module, OSC from TouchOSC or Max, a Maya, Blender or Unreal bridge, the
   desktop app). Every carrier (WebSocket, OSC, a Qt web channel) sends these same small messages; MIDI keeps
   its own bindings in automation.js. Part of the shared core (core/README.md).

   Messages (plain objects, or JSON text):
     { type: "set", key: "c:angleHeight", m: 0.42 }   steer a parameter's main lane, 0 (setting A) to 1 (B)
     { type: "trigger", key: "s:noir", on: true }      switch a parameter on or off (its own gate or toggle mode)
     { type: "stopAll" }                               stop every running parameter
     { type: "list" }                                  ask what can be moved
   Replies and news going out:
     { type: "params", params: [{ key, level, label }] }
     { type: "value", key, m }                         a running parameter's position, 0 to 1
     { type: "error", error }

   Keys are automation.js keys: "c:<curiosity>", "s:<suite>", "p:<proximity>", "ps:<proximity suite>",
   with "@<character>" for one character's own patch. OSC addresses carry the same thing:
     /curio/set/c/angleHeight 0.42     /curio/trigger/s/noir 1     /curio/stopAll     /curio/value/c/angleHeight 0.42

   window.CurioBridge = { handle(msg) -> reply or null, values() -> [value messages], fromOsc(address, args),
   toOsc(msg) -> { address, args } }. */
(function () {
  const clamp = (x) => Math.max(0, Math.min(1, Number(x) || 0));
  const auto = () => window.CurioAuto;
  const known = (key) => !!(auto() && auto().param(key));

  function handle(msg) {
    if (typeof msg === "string") {
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        return { type: "error", error: "not JSON" };
      }
    }
    const A = auto();
    if (!A) return { type: "error", error: "automation is not loaded" };
    if (!msg || typeof msg.type !== "string") return { type: "error", error: "no type" };
    if (msg.type === "list") return { type: "params", params: A.PARAMS.map((p) => ({ key: p.key, level: p.level, label: p.label })) };
    if (msg.type === "stopAll") {
      A.stopAll();
      return null;
    }
    if (!known(msg.key)) return { type: "error", error: "unknown key " + msg.key };
    if (msg.type === "set") {
      A.set(msg.key, { mod: "manual", manual: clamp(msg.m) });
      if (!A.running().includes(msg.key)) A.start(msg.key);
      return null;
    }
    if (msg.type === "trigger") {
      A.trigger(msg.key, !!msg.on);
      return null;
    }
    return { type: "error", error: "unknown type " + msg.type };
  }

  /* Where every running parameter sits now, for a bridge to send out. */
  function values() {
    const A = auto();
    if (!A) return [];
    return A.running().map((key) => ({ type: "value", key, m: A.m(key) }));
  }

  /* "/curio/set/c/angleHeight", [0.42] -> { type: "set", key: "c:angleHeight", m: 0.42 } */
  function fromOsc(address, args) {
    const parts = String(address || "").split("/").filter(Boolean);
    if (parts[0] !== "curio") return null;
    const type = parts[1];
    const key = parts.length > 3 ? parts[2] + ":" + parts.slice(3).join("/") : undefined;
    const a = (args || [])[0];
    if (type === "set" || type === "value") return { type, key, m: Number(a) };
    if (type === "trigger") return { type, key, on: Number(a) > 0 || a === true };
    return { type };
  }
  function toOsc(msg) {
    const path = msg.key ? "/" + msg.key.replace(":", "/") : "";
    const args = msg.type === "trigger" ? [msg.on ? 1 : 0] : "m" in msg ? [msg.m] : [];
    return { address: "/curio/" + msg.type + path, args };
  }

  window.CurioBridge = { handle, values, fromOsc, toOsc };
})();
