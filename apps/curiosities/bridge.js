/* Bridge: one message format for everything outside the app that moves a curiosity, suite, proximity or
   proximity suite (a VCV Rack module, OSC from TouchOSC or Max, a Maya, Blender or Unreal bridge, the
   desktop app). Every carrier (WebSocket, OSC, a Qt web channel) sends these same small messages; MIDI keeps
   its own bindings in automation.js. Part of the shared core (core/README.md).

   Messages (plain objects, or JSON text):
     { type: "set", key: "c:angleHeight", m: 0.42 }   steer a parameter's main lane, 0 (setting A) to 1 (B)
     { type: "trigger", key: "s:noir", on: true }      switch a parameter on or off (its own gate or toggle mode)
     { type: "stopAll" }                               stop every running parameter
     { type: "list" }                                  ask what can be moved
     { type: "panels", ids: ["shotSize", ...] }        what each storyboard panel plays now (ids optional)
     { type: "apply", label: "Blender camera", values: { shotSize: ["wide", "close"] } }
                                                       play values on the board panel by panel, as a named strand
     { type: "timeline" }                              the engine's whole film: every moment, not just 8 panels
   Replies and news going out:
     { type: "params", params: [{ key, level, label }] }
     { type: "panels", panels: [{ <curiosity id>: value }] }
     { type: "timeline", name, rows: [{ id, label }], tracks: [{ id, kind, label }], panels: [{ <curiosity id>: value }],
       byTrack: { <track id>: [{ <curiosity id>: value }] } }
     { type: "value", key, m }                         a running parameter's position, 0 to 1 (and addSource values:
                                                       m:attention, m:over, m:momentum, m:family, m:compass)
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
    /* The engine's whole film, every moment (My film's panels stop at 8): engine/host.js timeline(). */
    if (msg.type === "timeline") {
      const E = window.CurioEngine;
      const H = window.CurioHost;
      return E && H && H.timeline ? H.timeline(E.state(), E.result()) : { type: "error", error: "the engine is not loaded" };
    }
    if (msg.type === "list") return { type: "params", params: A.PARAMS.map((p) => ({ key: p.key, level: p.level, label: p.label })) };
    /* The board: a tool bridge (Blender, Unreal) reads what each panel plays and can write a strand back. */
    if (msg.type === "panels" || msg.type === "apply") {
      const board = window.CuriosityBoard;
      if (!board) return { type: "error", error: "no board here" };
      if (msg.type === "apply") {
        board.apply(String(msg.label || "Bridge"), msg.values && typeof msg.values === "object" ? msg.values : {});
        return null;
      }
      const ids = Array.isArray(msg.ids) ? msg.ids : typeof CURIOSITIES !== "undefined" ? CURIOSITIES.map((c) => c.id) : [];
      return {
        type: "panels",
        panels: board.panels().map((st) => {
          const out = {};
          ids.forEach((id) => st[id] != null && st[id] !== "" && (out[id] = st[id]));
          return out;
        }),
      };
    }
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

  /* Other parts of the app can send values out too: addSource(fn), fn() -> [{ type: "value", key, m }].
     Momentum (momentum/perform.js) adds m:attention, m:over, m:momentum, m:family and m:compass, each 0 to 1,
     which go out over OSC as /curio/value/m/<name>. The bridge's own values come first; a source that throws or
     sends something that is not a value is skipped. */
  const sources = [];
  function addSource(fn) {
    if (typeof fn !== "function") return () => {};
    sources.push(fn);
    return () => {
      const i = sources.indexOf(fn);
      if (i >= 0) sources.splice(i, 1);
    };
  }

  /* Where every running parameter sits now, for a bridge to send out. */
  function values() {
    const A = auto();
    const out = A ? A.running().map((key) => ({ type: "value", key, m: A.m(key) })) : [];
    sources.forEach((fn) => {
      let got;
      try {
        got = fn();
      } catch (e) {
        return;
      }
      (Array.isArray(got) ? got : []).forEach((v) => {
        if (v && typeof v.key === "string" && Number.isFinite(v.m)) out.push({ type: "value", key: v.key, m: clamp(v.m) });
      });
    });
    return out;
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

  window.CurioBridge = { handle, values, addSource, fromOsc, toOsc, TIMELINE: true };
})();
