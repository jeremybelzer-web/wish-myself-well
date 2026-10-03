/* rig/staging.js: "More than one actor", an add-on for the 3D characters view (CurioRig.extend).

   The 3D view showed one character at a time. Directing is mostly about how people stand: to each other and to
   the camera. This add-on puts up to 4 actors in the same 3D view and stages them.

   - Cast: actor 1 is the view's own character (the menu at the top). Actors 2 to 4 can be any of the free
     characters, any character made from words (each one saved in rig/maker.js, built with CurioRig.maker.dress),
     or an object (the desk lamp, the young tree). Your own .glb files and cut-outs stay actor 1 only.
   - Where they stand (presets in plain words): face to face, side by side, one behind the other, over the
     shoulder, circle, standoff (far apart, facing), huddle. How far apart is a curiosity slider (blocking.distance,
     the catalog's "Distance between them", 0 to 5 on the timeline): touching, intimate, personal, social, far,
     public. "Closer to the camera" picks who stands nearest the lens.
   - Eyelines (the catalog's eyeline curiosity: no one meets, glances, one holds the look, both hold) and "Who is
     speaking": everyone else turns their head to the speaker (head aim, inside what a neck can turn).
   - Blocking: "walks to" moves an actor to a mark or to another actor over time with the walk rule ("Ida walks over
     to Nessa and shrugs" walks, stops at the chosen distance, turns to her and plays the shrug from gestures.js).
   - The line (the 180-degree rule): a line on the floor between two actors, the camera's side shaded green. When
     the camera crosses it, the line turns red and the view says so: the audience will feel the two swapped sides.
   - On the Screen (rig/screen.js), when the timeline has more than one character track and "Everyone together" is
     on, the other tracks join the view as actors 2 to 4, played by their own cast pick and following their own
     track's lanes (motion, pace, spine, feelings, acting moves); the character picked in Who is the one speaking.

   How each actor is held (the honest limits):
   - Actor 1 is the view's own model and gets every rule and add-on as before. Its holder is put inside a stage
     group (scene > stage > holder > model), so moving and turning it to its mark never fights the add-ons that set
     holder.position (feet, Drop it, acting moves).
   - Actors 2 to 4 are separate copies, each with its own skeleton (the .glb parsed again, so no shared bones), its
     own stage group, holder, joint table and a ctx of its own. Each frame they get a lighter rule pass: the rest
     pose, their clip or the rule-made walk and run (or hops, for objects), Spine and Breathing, joint limits, the
     eyeline head aim, and the add-ons that act per body: the stoop of an old made character (maker.js), Face and
     feelings (faces.js) and Acting moves (gestures.js). Not on actors 2 to 4: your own joint poses, Line through
     the body, Twist, Balance, Even or uneven, Follow-through, Feet and hands IK, wind and Drop it, the Sketch
     look and the Light add-on's cartoon shading (they still cast shadows). Their sliders start at the defaults;
     the style sliders (How far joints bend, Loose parts, How big the face goes, Blinks, the acting timing) are
     shared with actor 1.
   - The camera add-on frames everyone in a wide shot (its whole-body box becomes the group's); closer shots stay
     on actor 1. With the camera not following, "Keep everyone in the picture" moves the orbit's middle to the
     group and backs off until all fit.

   Saved in the 3D view's prefs (curiosities-rig3d-v1) as prefs.staging = { cast: [{ who, name }], name0, preset,
   front, speaker, look, frame, line, lineA, lineB }.
   window.CurioRigStaging = { PRESETS, layout(preset, n, d, cheat), meters(v), state(ctl), ready(ctl),
     cast(list, ctl), preset(id, ctl), walkTo(i, target, ctl), beat(text, ctl), speaker(i, ctl), line(on, a, b, ctl),
     sameSide(ctl), lookError(i, ctl), front(i, ctl) } */
(function () {
  const R = window.CurioRig;
  if (!R || !R.extend) return;
  const ID = "staging";
  const LABEL = "More than one actor";
  const MAX = 4;
  const DEG = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ---------- the sliders (curiosities, so the timeline can drive them) ---------- */
  const DIST = "blocking.distance";
  const EYE = "eyeline";
  const DIST_WORDS = ["touching", "intimate", "personal", "social", "far", "public"];
  /* center to center, in meters (the figures are 1.7 high) */
  const DIST_M = [0.42, 0.62, 1.15, 2.3, 3.7, 5.2];
  const DIST_SAY = {
    touching: "Touching: a hug, a fight, a slow dance.",
    intimate: "Intimate (about half a meter): only for people very close, or a threat. Whispers and secrets.",
    personal: "Personal (about an arm's length): friends and family talking.",
    social: "Social (a couple of meters): strangers, work, across a desk or a counter.",
    far: "Far (across a room): people keeping their distance.",
    public: "Public (many meters): a speech, a stage, a standoff across a street.",
  };
  const EYE_WORDS = ["no one meets", "glances", "one holds the look", "both hold"];
  const SLIDERS = [
    { id: DIST, lens: "blocking", label: "How far apart", scale: DIST_WORDS, start: 2 },
    { id: EYE, lens: "eyeline", label: "Eyelines", scale: EYE_WORDS, start: 3 },
  ];
  const meters = (v) => {
    const t = clamp(v, 0, 1) * (DIST_M.length - 1);
    const i = Math.min(DIST_M.length - 2, Math.floor(t));
    return lerp(DIST_M[i], DIST_M[i + 1], t - i);
  };

  const PRESETS = [
    { id: "face to face", say: "Turned to each other, side-on to the camera: the classic two people talking.", dist: "personal" },
    { id: "side by side", say: "Shoulder to shoulder, both facing the camera: friends on a bench, a team.", dist: "personal" },
    { id: "one behind the other", say: "In a line going away from the camera. The one in front looks bigger and more important.", dist: "personal" },
    { id: "over the shoulder", say: "One with their back to the camera, the other facing it: we look past one shoulder at the other face.", dist: "personal" },
    { id: "circle", say: "Everyone around a middle: a meeting, a campfire, a game.", dist: "personal" },
    { id: "standoff", say: "Far apart and facing each other: a duel, an argument across a room.", dist: "public" },
    { id: "huddle", say: "Close together, heads in: a team planning, friends sharing a secret.", dist: "intimate" },
  ];

  /* ---------- where each one stands ----------
     Slots for n actors, in meters on the floor (x to the right, z toward the camera's front), each with a point
     it faces (or "front": toward the camera's front). Slot 0 is the one nearest the camera when cheat is on
     (someone is picked for Closer to the camera). */
  function layout(preset, n, d, cheat) {
    const s = [];
    const P = (x, z, fx, fz) => s.push({ x, z, fx, fz });
    if (preset === "side by side") {
      const sp = Math.max(d, 0.55);
      for (let i = 0; i < n; i++) P((i - (n - 1) / 2) * sp, cheat && i === 0 ? Math.min(0.9, sp * 0.6) : 0, null, null);
      if (cheat && n > 1) {
        /* the one in front moves to the middle; the rest close the gap */
        const others = s.slice(1).map((p, i) => (i - (n - 2) / 2) * sp);
        s[0].x = 0;
        others.forEach((x, i) => (s[i + 1].x = x));
      }
    } else if (preset === "one behind the other") {
      const sp = Math.max(d, 0.6);
      for (let i = 0; i < n; i++) P((i % 2 ? 1 : -1) * 0.2, ((n - 1) / 2 - i) * sp, null, null);
    } else if (preset === "over the shoulder") {
      const g = Math.max(d, 0.6);
      P(0.5, g / 2, -0.15, -g / 2);
      if (n > 1) P(-0.15, -g / 2, 0.5, g / 2);
      for (let i = 2; i < n; i++) P(-0.15 + (i === 2 ? -0.8 : 0.8), -g / 2 - 0.3, 0.5, g / 2);
    } else if (preset === "circle" || preset === "huddle") {
      const sp = Math.max(d, preset === "huddle" ? 0.44 : 0.5);
      const r = n <= 2 ? sp / 2 : sp / (2 * Math.sin(Math.PI / n));
      const t0 = cheat ? 0 : Math.PI / n;
      for (let i = 0; i < n; i++) {
        const t = t0 + (2 * Math.PI * i) / n;
        P(r * Math.sin(t), r * Math.cos(t), 0, 0);
      }
    } else {
      /* face to face and standoff: two sides facing across; a second pair stands behind the first */
      const g = Math.max(d, 0.4);
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0;
        const z = -Math.floor(i / 2) * 0.9;
        P(left ? -g / 2 : g / 2, z, left ? g / 2 : -g / 2, z);
      }
      if (cheat) {
        /* a cheated two-shot: the line turns a little so the one picked is nearer the lens */
        const a = 0.38;
        s.forEach((p) => {
          const rot = (x, z) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
          [p.x, p.z] = rot(p.x, p.z);
          if (p.fx != null) [p.fx, p.fz] = rot(p.fx, p.fz);
        });
      }
    }
    /* centered on the middle of the floor */
    const xs = s.map((p) => p.x);
    const zs = s.map((p) => p.z);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    return s.map((p) => {
      const x = p.x - cx;
      const z = p.z - cz;
      const yaw = p.fx == null ? 0 : Math.atan2(p.fx - cx - x, p.fz - cz - z);
      return { x, z, yaw, lean: preset === "huddle" };
    });
  }

  /* ---------- small 3D helpers (the same rules as rig.js, for the extra actors) ---------- */
  const PACE = { dragging: 0.4, slow: 0.7, normal: 1, brisk: 1.4, frantic: 2 };
  const SHARED = /^(rigRulesLens\.(limits|floppy)|faceLens\.|actingLens\.(size|speed|windup|hold|settle|pause)|faceDraw|faceBody|faceFilm)/;
  const PER_BODY = ["maker", "faces", "gestures"];
  const bufs = new Map();
  function fetchBuf(url) {
    if (!bufs.has(url))
      bufs.set(
        url,
        fetch(url).then((r) => {
          if (!r.ok) throw new Error("could not load " + url);
          return r.arrayBuffer();
        })
      );
    const p = bufs.get(url);
    p.catch(() => bufs.delete(url));
    return p;
  }
  function disposeTree(o) {
    if (!o) return;
    o.traverse((n) => {
      if (n.geometry) n.geometry.dispose();
      if (n.isSkinnedMesh && n.skeleton) n.skeleton.dispose();
      [].concat(n.material || []).forEach((m) => {
        Object.keys(m).forEach((k) => m[k] && m[k].isTexture && m[k].dispose());
        m.dispose();
      });
    });
  }
  /* each joint's own bend, side and twist directions in its rest pose (as rig.js computeAxes) */
  function axesOf(T, model, bones, rig) {
    model.updateMatrixWorld(true);
    const fwd = new T.Vector3(0, 0, 1);
    const up = new T.Vector3(0, 1, 0);
    const right = new T.Vector3(1, 0, 0);
    const hp = new T.Vector3();
    if (rig.hips) rig.hips.getWorldPosition(hp);
    const pos = (b) => b.getWorldPosition(new T.Vector3());
    const dirs = new Map();
    bones.forEach((b) => {
      const p = pos(b);
      const ks = b.children.filter((k) => k.isBone);
      let d = null;
      if (ks.length) {
        const tip = new T.Vector3();
        ks.forEach((k) => tip.add(pos(k)));
        tip.multiplyScalar(1 / ks.length);
        d = tip.sub(p);
      }
      if ((!d || d.length() < 1e-5) && b.parent && b.parent.isBone) d = p.clone().sub(pos(b.parent));
      if (!d || d.length() < 1e-5) d = up.clone();
      dirs.set(b, d.normalize());
    });
    const info = new Map();
    bones.forEach((b) => {
      const r = rig.roles.get(b) || { role: "other", side: "", index: 0 };
      const d = dirs.get(b);
      let bend = new T.Vector3().crossVectors(d, fwd);
      if (bend.length() < 0.25) bend = new T.Vector3().crossVectors(d, up);
      bend.normalize();
      const p = pos(b);
      const out = r.side ? right.clone().multiplyScalar(p.x >= hp.x ? 1 : -1) : right.clone();
      let side = new T.Vector3().crossVectors(d, out);
      if (side.length() < 0.25) side = new T.Vector3().crossVectors(d, fwd).cross(d);
      side.normalize();
      const wq = b.getWorldQuaternion(new T.Quaternion()).invert();
      info.set(b, { role: r.role, side: r.side, index: r.index, rest: b.quaternion.clone(), axes: { bend: bend.applyQuaternion(wq), side: side.applyQuaternion(wq), twist: d.clone().applyQuaternion(wq) }, invRestWorld: wq.clone(), prev: null });
    });
    return info;
  }
  function rotateWorldWith(T, b, q) {
    b.updateMatrixWorld(true);
    const pw = b.parent.getWorldQuaternion(new T.Quaternion());
    const bw = b.getWorldQuaternion(new T.Quaternion());
    b.quaternion.copy(pw.invert().multiply(q.clone().multiply(bw)));
    b.updateMatrixWorld(true);
  }
  /* where the face points now: the head's rest front (+z) carried by its turn since the rest pose */
  function faceDir(c) {
    const T = c.THREE;
    const h = c.rig && c.rig.head;
    const inf = h && c.info.get(h);
    if (!inf) return new T.Vector3(0, 0, 1);
    return new T.Vector3(0, 0, 1).applyQuaternion(h.getWorldQuaternion(new T.Quaternion()).multiply(inf.invRestWorld)).normalize();
  }
  /* turn the neck and head toward a point, w from 0 to 1, inside what a neck can do (as rig.js aim) */
  function aimHead(c, target, w) {
    const T = c.THREE;
    const rig = c.rig;
    if (!rig || !rig.head || w < 0.01) return;
    c.model.updateMatrixWorld(true);
    const hp = rig.head.getWorldPosition(new T.Vector3());
    const want = target.clone().sub(hp);
    if (want.lengthSq() < 1e-6) return;
    want.normalize();
    const full = new T.Quaternion().setFromUnitVectors(faceDir(c), want);
    const angle = 2 * Math.acos(clamp(full.w, -1, 1));
    const cap = c.limitOf(rig.head).twist[1] + (rig.neck.length ? c.limitOf(rig.neck[0]).twist[1] : 0);
    const k = (angle > 1e-4 ? Math.min(1, (Math.max(10, cap) * DEG) / angle) : 1) * clamp(w, 0, 1);
    const delta = new T.Quaternion().slerp(full, k);
    const chain = rig.neck.length ? [rig.neck[0], rig.head] : rig.object && rig.chest && rig.chest !== rig.head ? [rig.chest, rig.head] : [rig.head];
    const share = chain.length === 2 ? [0.4, 1] : [1];
    let done = new T.Quaternion();
    chain.forEach((b, i) => {
      const part = new T.Quaternion().slerp(delta, share[i]);
      c.rotateWorld(b, done.clone().invert().premultiply(part));
      done = part;
    });
  }
  /* heads in: the back bends forward a little and the arms come down and in (a huddle) */
  function lean(c, deg) {
    const T = c.THREE;
    const r = c.rig;
    if (!r || r.object || r.quadruped || !r.spine.length) return;
    ["L", "R"].forEach((s) => {
      const b = r.arms[s][0];
      const inf = b && c.info.get(b);
      if (!inf) return;
      b.quaternion.multiply(new T.Quaternion().setFromAxisAngle(inf.axes.side, -62 * DEG)).multiply(new T.Quaternion().setFromAxisAngle(inf.axes.bend, 28 * DEG));
      const el = r.arms[s][1];
      const ie = el && c.info.get(el);
      if (ie) el.quaternion.multiply(new T.Quaternion().setFromAxisAngle(ie.axes.bend, 35 * DEG));
    });
    c.model.updateMatrixWorld(true);
    const axis = new T.Vector3(1, 0, 0).applyQuaternion(c.holder.getWorldQuaternion(new T.Quaternion())).normalize();
    const back = r.spine.slice(-2);
    back.forEach((b) => c.rotateWorld(b, new T.Quaternion().setFromAxisAngle(axis, (deg * DEG) / back.length)));
  }

  /* ---------- per view ---------- */
  const STATE = new WeakMap(); /* ctx -> staging state; it lives across loads (ctx.data is emptied on each one) */
  const S = (ctx) => {
    let st = STATE.get(ctx);
    if (!st) STATE.set(ctx, (st = { actors: [], p0: { x: 0, z: 0, yaw: 0, walk: null, offMark: false, eyeW: 0 }, seq: 0, warned: new Set() }));
    return st;
  };
  const P = (ctx) => {
    const p = (ctx.prefs.staging = Object.assign({ cast: [], name0: "", preset: "face to face", front: -1, speaker: -1, look: true, frame: true, line: false, lineA: 0, lineB: 1 }, ctx.prefs.staging));
    if (!Array.isArray(p.cast)) p.cast = [];
    p.cast = p.cast.filter((x) => x && typeof x.who === "string").slice(0, MAX - 1);
    return p;
  };
  const screenCtl = (ctx) => {
    const RS = window.CurioRigScreen;
    const c = RS && RS.controller && RS.controller();
    return c && c.ctx === ctx ? RS : null;
  };
  const together = (RS) => !RS.together || RS.together();

  /* the characters an extra actor can be: the free ones, each made-from-words character, the objects */
  function choices() {
    const out = [];
    R.CHARACTERS.filter((c) => !c.object && c.id !== "made").forEach((c) => out.push({ id: c.id, label: c.label, group: "Free characters" }));
    if (R.maker && R.maker.store && R.maker.dress)
      try {
        R.maker.store().list.forEach((m) => out.push({ id: "made:" + m.id, label: m.name, group: "Made from your words" }));
      } catch (e) {
        /* no saved characters */
      }
    R.CHARACTERS.filter((c) => c.object).forEach((c) => out.push({ id: c.id, label: c.label, group: "Objects" }));
    return out;
  }
  function labelOf(who) {
    const c = choices().find((x) => x.id === who);
    if (c) return c.label;
    const k = R.CHARACTERS.find((x) => x.id === who);
    return k ? k.label : who;
  }
  function madeText(who) {
    const s = R.maker.store();
    const id = who.slice(5);
    const m = s.list.find((x) => x.id === id) || s.list.find((x) => x.id === s.cur) || s.list[0];
    return m ? m.text : R.maker.START;
  }
  function primaryName(ctx) {
    const p = P(ctx);
    if (p.name0) return p.name0;
    if (ctx.prefs.character === "made" && R.maker && R.maker.store) {
      try {
        const s = R.maker.store();
        const m = s.list.find((x) => x.id === s.cur);
        if (m) return m.name;
      } catch (e) {}
    }
    const c = R.CHARACTERS.find((x) => x.id === ctx.prefs.character);
    return c ? c.label : "Actor 1";
  }

  /* All actors as one list: [actor 1 (the view's own), the extras...], each with the same fields. */
  function everyone(ctx) {
    const st = S(ctx);
    const one = { primary: true, ctx, name: st.screenNames ? st.screenNames[0] : primaryName(ctx), who: ctx.prefs.character, g: st.stage0, ready: !!ctx.model };
    Object.assign(one, { get pos() { return st.p0; } });
    return [one].concat(st.actors.map((a) => Object.assign(a, { get pos() { return a.p; } })));
  }
  const live = (a) => a.ready && a.ctx && a.ctx.model;
  const active = (ctx) => !!ctx.model && S(ctx).actors.length > 0;

  /* ---------- an extra actor ---------- */
  function subCtx(ctx, a) {
    const el = {
      closest: (s) => (ctx.el && ctx.el.closest ? ctx.el.closest(s) : null),
      querySelector: () => null,
      querySelectorAll: () => [],
      dataset: {},
    };
    const valFor = (id) => {
      const s = R.SLIDERS.find((x) => x.id === id);
      const tl = timelineOf(ctx, a);
      if (tl[id] != null) return tl[id];
      if (a.prefs.values[id] != null) return a.prefs.values[id];
      if (!s || SHARED.test(id)) return ctx.val(id);
      return s.start / Math.max(1, s.scale.length - 1);
    };
    return {
      get THREE() {
        return ctx.THREE;
      },
      get scene() {
        return ctx.scene;
      },
      get camera() {
        return ctx.camera;
      },
      get renderer() {
        return ctx.renderer;
      },
      get clock() {
        return ctx.clock;
      },
      holder: a.holder,
      model: a.model,
      bones: a.bones,
      rig: a.rig,
      info: a.info,
      prefs: a.prefs,
      el,
      val: valFor,
      pick(id) {
        const s = R.SLIDERS.find((x) => x.id === id);
        return s ? s.scale[Math.round(clamp(valFor(id), 0, 1) * (s.scale.length - 1))] : "";
      },
      rotateWorld: (b, q) => rotateWorldWith(ctx.THREE, b, q),
      limitOf(b) {
        const r = a.info.get(b);
        const L = R.LIMITS[(r && r.role) || "other"] || R.LIMITS.other;
        if (ctx.prefs.rules && ctx.prefs.rules.limits === false) return { bend: [-180, 180], side: [-180, 180], twist: [-180, 180], say: L.say };
        return L;
      },
      save() {},
      status() {},
      data: (id) => (a.data[id] = a.data[id] || {}),
      actor: a,
    };
  }
  /* the timeline's values for an actor's own track (on the Screen), read once a frame */
  function timelineOf(ctx, a) {
    if (!a.track) return {};
    if (a.tlAt === ctx.clock && a.tl) return a.tl;
    a.tlAt = ctx.clock;
    a.tl = {};
    const E = window.CurioEngine;
    const Sc = window.CurioScreen;
    if (!E || !Sc || !Sc.isOpen || !Sc.isOpen() || !Sc.row) return a.tl;
    let st = null;
    try {
      st = E.state();
    } catch (e) {
      return a.tl;
    }
    const r = st && st.rows && st.rows[Sc.row()];
    const t = st && (st.tracks || []).find((x) => x.id === a.track);
    if (!r || !t) return a.tl;
    R.SLIDERS.forEach((s) => {
      if (!(t.curiosities || []).includes(s.id)) return;
      const lane = st.lanes && st.lanes[t.id + "|" + s.id];
      if (!lane || lane.on === false) return;
      let v = null;
      try {
        v = E.value(r.id, t.id, s.id);
      } catch (e) {}
      const n = s.scale.length - 1;
      let x = null;
      if (typeof v === "string") x = s.scale.indexOf(v) < 0 ? null : s.scale.indexOf(v) / n;
      else if (typeof v === "number" && isFinite(v)) x = Number.isInteger(v) || v > 1 ? clamp(v, 0, n) / n : clamp(v, 0, 1);
      if (x != null) a.tl[s.id] = x;
    });
    return a.tl;
  }
  /* run the per-body add-ons on an extra actor; on the Screen they read that actor's own track */
  function perBody(ctx, a, name, dt) {
    const RS = window.CurioRigScreen;
    const swap = RS && a.track;
    if (swap) window.CurioRigScreen = Object.assign({}, RS, { shown: () => a.track, controller: () => ({ ctx: a.ctx }) });
    try {
      R.extensions().forEach((x) => {
        if (!PER_BODY.includes(x.id) || typeof x[name] !== "function") return;
        if (x.id === "maker" && name !== "afterBase") return; /* the maker's build runs through CurioRig.maker.dress */
        try {
          x[name](a.ctx, dt);
        } catch (e) {
          const k = x.id + name;
          const st = S(ctx);
          if (!st.warned.has(k)) console.warn("3D add-on staging (" + x.id + " " + name + " on " + a.name + "): " + e.message);
          st.warned.add(k);
        }
      });
    } finally {
      if (swap) window.CurioRigScreen = RS;
    }
  }
  function newActor(ctx, who, name, track) {
    return { who, name, track: track || "", p: { x: 0, z: 0, yaw: 0 }, walk: null, offMark: false, eyeW: 0, data: {}, prefs: { character: /^made(:|$)/.test(who) ? "made" : who, values: {}, joints: {}, parts: {}, rules: ctx.prefs.rules }, ready: false, token: 0 };
  }
  function loadActor(ctx, a) {
    const T = ctx.THREE;
    const my = ++a.token;
    a.error = "";
    const made = /^made(:|$)/.test(a.who);
    const c = R.CHARACTERS.find((x) => x.id === (made ? "rigged-figure" : a.who)) || R.CHARACTERS[0];
    a.loading = (async () => {
      let gltf;
      if (c.make) gltf = { scene: R.makeObject(c.make), animations: [] };
      else {
        const buf = await fetchBuf(c.file);
        if (a.token !== my || a.gone) return;
        gltf = await new Promise((res, rej) => new T.GLTFLoader().parse(buf, "", res, rej));
      }
      if (a.token !== my || a.gone || !ctx.scene) return disposeTree(gltf.scene);
      buildActor(ctx, a, gltf, made ? madeText(a.who) : null);
    })().catch((e) => {
      a.error = String((e && e.message) || e);
      ctx.status && ctx.status(`Could not bring in ${a.name}: ${a.error}`);
    });
    return a.loading;
  }
  function buildActor(ctx, a, gltf, words) {
    const T = ctx.THREE;
    const g = new T.Group();
    g.name = "actor " + a.name;
    const holder = new T.Group();
    const model = gltf.scene;
    holder.add(model);
    g.add(holder);
    ctx.scene.add(g);
    model.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(model);
    const size = box.getSize(new T.Vector3());
    model.scale.multiplyScalar(1.7 / Math.max(size.y, size.x * 0.8, size.z * 0.8, 1e-6));
    model.updateMatrixWorld(true);
    const b2 = new T.Box3().setFromObject(model);
    const ctr = b2.getCenter(new T.Vector3());
    model.position.x -= ctr.x;
    model.position.z -= ctr.z;
    model.position.y -= b2.min.y;
    model.updateMatrixWorld(true);
    let bones = [];
    model.traverse((o) => {
      if (o.isSkinnedMesh) {
        o.frustumCulled = false;
        o.skeleton.bones.forEach((b) => !bones.includes(b) && bones.push(b));
      }
    });
    if (!bones.length) model.traverse((o) => o.isBone && bones.push(o));
    let chained = false;
    if (!bones.length) {
      bones = R.autoRig(model, 5) || [];
      chained = bones.length > 0;
    }
    const rig = chained ? R.chainRig(bones) : R.classify(bones);
    Object.assign(a, { g, holder, model, bones, rig, info: axesOf(T, model, bones, rig), clips: gltf.animations || [], action: null, actionKey: "", objH: b2.max.y - b2.min.y });
    a.mixer = a.clips.length ? new T.AnimationMixer(model) : null;
    a.ctx = subCtx(ctx, a);
    if (words != null && R.maker && R.maker.dress) {
      try {
        R.maker.dress(a.ctx, words);
      } catch (e) {
        console.warn("3D add-on staging (maker on " + a.name + "): " + e.message);
      }
    }
    perBody(ctx, a, "built", 0);
    const shadows = ctx.renderer && ctx.renderer.shadowMap && ctx.renderer.shadowMap.enabled;
    model.traverse((o) => o.isMesh && ((o.castShadow = !!shadows), (o.receiveShadow = !!shadows)));
    a.ready = true;
    /* one pass where it was made (facing the front), so the drawn face is measured the right way round */
    actorFrame(ctx, a, 1 / 60, true);
    placeAll(ctx, true);
  }
  function disposeActor(ctx, a) {
    a.gone = true;
    a.token++;
    if (a.mixer) {
      a.mixer.stopAllAction();
      if (a.model) a.mixer.uncacheRoot(a.model);
    }
    const drops = a.data.gestures && a.data.gestures.drops;
    if (drops && drops.pts) {
      if (drops.pts.parent) drops.pts.parent.remove(drops.pts);
      disposeTree(drops.pts);
    }
    if (a.g) {
      if (a.g.parent) a.g.parent.remove(a.g);
      disposeTree(a.g);
    }
    a.g = a.holder = a.model = null;
    a.bones = [];
    a.ready = false;
  }

  /* who is cast: the saved list, or on the Screen the other character tracks */
  function wanted(ctx) {
    const RS = screenCtl(ctx);
    const st = S(ctx);
    if (RS) {
      st.screenNames = null;
      if (!together(RS)) return [];
      let tracks = [];
      try {
        tracks = window.CurioEngine.state().tracks.filter((t) => t.kind === "character");
      } catch (e) {}
      if (tracks.length < 2) return [];
      const shown = RS.shown();
      const me = tracks.find((t) => t.id === shown) || tracks[0];
      st.screenNames = [me.label || "Actor 1"];
      return tracks
        .filter((t) => t !== me)
        .slice(0, MAX - 1)
        .map((t) => ({ who: RS.cast(t.id), name: t.label || "Actor", track: t.id }));
    }
    st.screenNames = null;
    return P(ctx).cast.map((c) => ({ who: c.who, name: c.name || labelOf(c.who), track: "" }));
  }
  function syncCast(ctx) {
    if (!ctx.scene || !ctx.THREE || !ctx.THREE.GLTFLoader) return;
    const st = S(ctx);
    const want = wanted(ctx);
    const sig = JSON.stringify(want);
    if (sig === st.castSig) return;
    st.castSig = sig;
    const keep = [];
    want.forEach((w, i) => {
      const old = st.actors[i];
      if (old && old.who === w.who) {
        old.name = w.name;
        old.track = w.track;
        if (old.g) old.g.name = "actor " + w.name;
        keep.push(old);
      } else {
        if (old) disposeActor(ctx, old);
        const a = newActor(ctx, w.who, w.name, w.track);
        keep.push(a);
        loadActor(ctx, a);
      }
    });
    st.actors.slice(want.length).forEach((a) => disposeActor(ctx, a));
    st.actors = keep;
    const p = P(ctx);
    const n = keep.length + 1;
    if (p.front >= n) p.front = -1;
    if (p.speaker >= n) p.speaker = -1;
    if (p.lineA >= n) p.lineA = 0;
    if (p.lineB >= n || p.lineB === p.lineA) p.lineB = p.lineA === 0 ? 1 : 0;
    if (!keep.length) {
      endWalk(ctx, null);
      Object.assign(st.p0, { x: 0, z: 0, yaw: 0, offMark: false });
      if (st.stage0) st.stage0.position.set(0, 0, 0), st.stage0.rotation.set(0, 0, 0);
    }
    st.lineSide = null;
    placeAll(ctx, true);
    draw(ctx);
  }

  /* ---------- placing and walking ---------- */
  function marks(ctx) {
    const st = S(ctx);
    const p = P(ctx);
    const n = st.actors.length + 1;
    const RS = screenCtl(ctx);
    const front = RS ? -1 : p.front;
    const slots = layout(p.preset, n, meters(ctx.val(DIST)), front >= 0);
    const order = front >= 0 ? [front].concat([...Array(n).keys()].filter((i) => i !== front)) : [...Array(n).keys()];
    const out = [];
    order.forEach((who, k) => (out[who] = slots[k]));
    return out;
  }
  /* snap everyone who is on their mark (and not walking) to it */
  function placeAll(ctx, now) {
    const st = S(ctx);
    if (!active(ctx)) return;
    const m = marks(ctx);
    const all = everyone(ctx);
    st.lean = m[0] && m[0].lean;
    all.forEach((a, i) => {
      const s = m[i];
      const p = a.pos;
      if (!s || p.walk || p.offMark) return;
      if (now || Math.hypot(p.x - s.x, p.z - s.z) > 1e-4 || Math.abs(p.yaw - s.yaw) > 1e-4) {
        p.x = s.x;
        p.z = s.z;
        p.yaw = s.yaw;
      }
    });
  }
  const turnToward = (from, to, max) => {
    let d = to - from;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return from + clamp(d, -max, max);
  };
  const MOTION = "rigRulesLens.motion";
  function endWalk(ctx, a) {
    const st = S(ctx);
    if (a && a.p) return (a.p.walk = null);
    if (st.p0.walk && st.savedMotion !== undefined) {
      if (st.savedMotion === null) delete ctx.prefs.values[MOTION];
      else ctx.prefs.values[MOTION] = st.savedMotion;
      st.savedMotion = undefined;
    }
    st.p0.walk = null;
  }
  /* i walks to a target: another actor's index (stops at the chosen distance, facing them), { x, z }, or "mark" */
  function walkTo(ctx, i, target, then) {
    const st = S(ctx);
    const all = everyone(ctx);
    const a = all[i];
    if (!a || !active(ctx)) return false;
    const p = a.pos;
    let to = null;
    let face = null;
    let home = false;
    if (typeof target === "number" && all[target] && target !== i) {
      const b = all[target].pos;
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const L = Math.hypot(dx, dz) || 1;
      /* "walks over to" stops at the chosen distance, and never further than talking distance (personal) */
      const stop = Math.max(0.5, Math.min(meters(ctx.val(DIST)), DIST_M[2], L));
      to = { x: b.x + (dx / L) * stop, z: b.z + (dz / L) * stop };
      face = target;
    } else if (target === "mark") {
      const m = marks(ctx)[i];
      to = { x: m.x, z: m.z };
      face = { yaw: m.yaw };
      home = true;
    } else if (target && typeof target.x === "number") to = { x: target.x, z: target.z };
    if (!to) return false;
    if (a.primary && !p.walk) {
      st.savedMotion = Object.prototype.hasOwnProperty.call(ctx.prefs.values, MOTION) ? ctx.prefs.values[MOTION] : null;
      ctx.prefs.values[MOTION] = 2 / 3; /* walking, while the walk lasts */
    }
    p.walk = { to, face, then: then || "", home };
    st.lineSide = null;
    return true;
  }
  function stepWalks(ctx, dt) {
    const st = S(ctx);
    const all = everyone(ctx);
    let moving = false;
    all.forEach((a, i) => {
      const p = a.pos;
      const w = p.walk;
      if (!w) {
        if (p.yawWant != null) {
          p.yaw = turnToward(p.yaw, p.yawWant, dt * 5);
          if (Math.abs(p.yaw - p.yawWant) < 1e-3) p.yawWant = null;
        }
        return;
      }
      moving = true;
      const c = a.primary ? ctx : a.ctx;
      const pace = c ? PACE[c.pick("rigRulesLens.pace")] || 1 : 1;
      const dx = w.to.x - p.x;
      const dz = w.to.z - p.z;
      const L = Math.hypot(dx, dz);
      const step = 1.15 * pace * dt;
      if (L > 0.03) p.yaw = turnToward(p.yaw, Math.atan2(dx, dz), dt * 6);
      if (L <= step || L < 0.005) {
        p.x = w.to.x;
        p.z = w.to.z;
        const f = w.face;
        if (typeof f === "number" && all[f]) p.yawWant = Math.atan2(all[f].pos.x - p.x, all[f].pos.z - p.z);
        else if (f && typeof f.yaw === "number") p.yawWant = f.yaw;
        p.offMark = !w.home;
        if (a.primary) endWalk(ctx, null);
        else endWalk(ctx, a);
        p.arrived = (p.arrived || 0) + 1;
        if (w.then && R.gestures && c) R.gestures.play({ ctx: c }, w.then);
      } else {
        p.x += (dx / L) * step;
        p.z += (dz / L) * step;
      }
    });
    if (moving) st.lineSide = null; /* people walking change the line; only a camera move counts as crossing */
  }
  function applyStage(ctx) {
    const st = S(ctx);
    const fp = ctx.data("faces");
    everyone(ctx).forEach((a) => {
      if (!a.g) return;
      /* actor 1's drawn face is measured on its first frame: hold it at the middle, facing front, until then */
      if (a.primary && fp && fp.pending) return a.g.position.set(0, 0, 0), a.g.rotation.set(0, 0, 0);
      a.g.position.set(a.pos.x, 0, a.pos.z);
      a.g.rotation.set(0, a.pos.yaw, 0);
      a.g.updateMatrixWorld(true);
    });
    if (st.stage0) st.stage0.updateMatrixWorld(true);
  }

  /* ---------- the lighter rule pass for an extra actor ---------- */
  function actorFrame(ctx, a, dt, first) {
    if (!live(a)) return;
    const T = ctx.THREE;
    const c = a.ctx;
    const rig = a.rig;
    a.bones.forEach((b) => b.quaternion.copy(a.info.get(b).rest));
    a.holder.position.y = 0;
    a.holder.scale.set(1, 1, 1);
    const motion = a.p.walk ? "walking" : c.pick(MOTION);
    const pace = PACE[c.pick("rigRulesLens.pace")] || 1;
    /* a clip of its own, when it has one */
    const useful = (k) => k && k.tracks.some((t) => t.times.length >= 6);
    const list = a.clips.filter(useful);
    const find = (re) => list.find((k) => re.test(k.name || ""));
    const clip = motion === "walking" ? find(/walk/i) || list[0] || null : motion === "running" ? find(/run/i) || find(/walk/i) || list[0] || null : motion === "looking around" ? find(/survey|idle|look/i) || null : null;
    const key = clip ? clip.uuid : "";
    if (key !== a.actionKey) {
      const next = clip && a.mixer ? a.mixer.clipAction(clip) : null;
      if (next) {
        next.reset().play();
        if (a.action) a.action.crossFadeTo(next, 0.3, false);
      } else if (a.action) a.action.fadeOut(0.3);
      a.action = next;
      a.actionKey = key;
    }
    if (a.action) a.action.setEffectiveTimeScale(pace);
    if (a.mixer) a.mixer.update(dt);
    perBody(ctx, a, "afterBase", dt);
    /* driven poses (Spine and Breathing) and the rule-made walk, run or hops */
    const add = new Map();
    const amp = rig.object ? 1.8 : 1;
    const put = (b, k, v) => {
      if (!b) return;
      const o = add.get(b) || { bend: 0, side: 0, twist: 0 };
      o[k] += v * amp;
      add.set(b, o);
    };
    const t = ctx.clock + (a.phase || (a.phase = Math.random() * 3));
    if (!ctx.prefs.rules || ctx.prefs.rules.driven !== false) {
      const slump = c.val("rigRulesLens.slump");
      rig.spine.forEach((b) => put(b, "bend", -8 + slump * 34));
      rig.neck.forEach((b) => put(b, "bend", -4 + slump * 22));
      put(rig.head, "bend", -4 + slump * 18);
      ["L", "R"].forEach((s) => !rig.quadruped && put(rig.arms[s][0], "bend", slump * 10));
    }
    if (!ctx.prefs.rules || ctx.prefs.rules.breath !== false) {
      const bv = Math.round(c.val("rigRulesLens.breath") * 3);
      const w = Math.sin(t * [0, 0.25, 0.5, 0.9][bv] * Math.max(0.7, pace) * Math.PI * 2);
      const ba = [0, 1.5, 4, 8][bv];
      put(rig.chest, "bend", -ba * w);
      put(rig.neck[0], "bend", ba * 0.4 * w);
    }
    a.made = "";
    if (rig.object && !a.action && (motion === "walking" || motion === "running")) {
      const run = motion === "running";
      const ph = t * (run ? 2.0 : 1.3) * pace * Math.PI * 2;
      a.holder.position.y = Math.max(0, Math.sin(ph)) * (run ? 0.3 : 0.14) * a.objH;
      rig.spine.forEach((b) => put(b, "bend", (Math.cos(ph) * (run ? 16 : 9)) / amp));
      a.made = "hops";
    } else if (!a.action && (motion === "walking" || motion === "running") && !rig.quadruped && rig.legs.L.length) {
      const run = motion === "running";
      const ph = t * (run ? 1.5 : 0.95) * pace * Math.PI * 2;
      const A = run ? 42 : 24;
      [["L", 0], ["R", Math.PI]].forEach(([s, off]) => {
        const q = ph + off;
        put(rig.legs[s][0], "bend", A * Math.sin(q));
        put(rig.legs[s][1], "bend", -Math.max(0, Math.sin(q + 1.2)) * (run ? 85 : 45) - 4);
        put(rig.legs[s][2], "bend", 10 * Math.sin(q - 0.6));
        put(rig.arms[s][0], "bend", -A * 0.75 * Math.sin(q));
        put(rig.arms[s][1], "bend", run ? 75 : 14 + 8 * Math.max(0, -Math.sin(q)));
        if (!run) put(rig.arms[s][0], "side", -12);
      });
      rig.spine.forEach((b) => put(b, "twist", (6 * Math.sin(ph)) / (rig.spine.length || 1)));
      put(rig.hips, "twist", -5 * Math.sin(ph));
      put(rig.hips, "bend", run ? 12 : 3);
      a.made = run ? "run" : "walk";
    }
    add.forEach((o, b) => {
      const r = a.info.get(b);
      if (!r) return;
      const L = c.limitOf(b);
      const v = { bend: clamp(o.bend, L.bend[0], L.bend[1]), side: clamp(o.side, L.side[0], L.side[1]), twist: clamp(o.twist, L.twist[0], L.twist[1]) };
      const q = new T.Quaternion();
      if (v.bend) q.multiply(new T.Quaternion().setFromAxisAngle(r.axes.bend, v.bend * DEG));
      if (v.side) q.multiply(new T.Quaternion().setFromAxisAngle(r.axes.side, v.side * DEG));
      if (v.twist) q.multiply(new T.Quaternion().setFromAxisAngle(r.axes.twist, v.twist * DEG));
      b.quaternion.multiply(q);
    });
    a.model.updateMatrixWorld(true);
    if (!first) {
      if (S(ctx).lean && !a.p.walk) lean(c, 14);
      eyeline(ctx, a, dt);
    }
    a.model.updateMatrixWorld(true);
    perBody(ctx, a, "afterRules", dt);
    a.model.updateMatrixWorld(true);
  }

  /* ---------- eyelines: who looks at whom ---------- */
  function headAt(T, a) {
    const c = a.primary ? a.ctx : a.ctx;
    const r = c && c.rig;
    if (!r || !c.model) return null;
    if (r.head) return r.head.getWorldPosition(new T.Vector3());
    return new T.Box3().setFromObject(c.model).getCenter(new T.Vector3());
  }
  /* how much actor a looks at whom now: { at: index, w } */
  function lookPlan(ctx, i) {
    const p = P(ctx);
    const all = everyone(ctx);
    const sp = p.speaker;
    if (!p.look || sp < 0 || !all[sp] || all.length < 2) return null;
    const mode = ctx.pick(EYE);
    if (mode === "no one meets") return null;
    if (i !== sp) {
      if (mode === "glances") return { at: sp, w: Math.sin(ctx.clock * 0.9 + i * 1.9) > 0.15 ? 1 : 0 };
      return { at: sp, w: 1 };
    }
    if (mode !== "both hold") return null;
    /* the speaker looks back at the one in front of them */
    const T = ctx.THREE;
    const me = all[sp].pos;
    const fwd = new T.Vector3(Math.sin(me.yaw), 0, Math.cos(me.yaw));
    let best = -1;
    let bestS = -Infinity;
    all.forEach((b, j) => {
      if (j === sp) return;
      const d = new T.Vector3(b.pos.x - me.x, 0, b.pos.z - me.z);
      const s = d.normalize().dot(fwd) - d.length() * 0.01;
      if (s > bestS) (bestS = s), (best = j);
    });
    return best >= 0 ? { at: best, w: 1 } : null;
  }
  function eyeline(ctx, a, dt) {
    const all = everyone(ctx);
    const i = a.primary ? 0 : all.indexOf(a);
    const pl = a.pos.walk ? null : lookPlan(ctx, i);
    const want = pl ? pl.w : 0;
    const k = 1 - Math.exp(-(dt || 1 / 60) * 6);
    a.pos.eyeW = lerp(a.pos.eyeW || 0, want, k);
    if (pl) a.pos.eyeAt = pl.at;
    const at = all[a.pos.eyeAt];
    if (a.pos.eyeW < 0.01 || !at || !live(at.primary ? Object.assign({}, at, { ctx }) : at)) return;
    const target = headAt(ctx.THREE, at.primary ? Object.assign({}, at, { ctx }) : at);
    if (target) aimHead(a.primary ? ctx : a.ctx, target, a.pos.eyeW);
  }

  /* ---------- the line (the 180-degree rule) ---------- */
  function lineParts(ctx, st) {
    if (st.line) return st.line;
    const T = ctx.THREE;
    const g = new T.Group();
    g.name = "the line";
    const strip = new T.Mesh(new T.PlaneGeometry(1, 0.035), new T.MeshBasicMaterial({ color: 0xffc83d, transparent: true, opacity: 0.95, depthWrite: false }));
    strip.rotation.x = -Math.PI / 2;
    strip.position.y = 0.006;
    strip.renderOrder = 3;
    const safe = new T.Mesh(new T.PlaneGeometry(1, 2.6), new T.MeshBasicMaterial({ color: 0x3fbf6a, transparent: true, opacity: 0.16, depthWrite: false }));
    safe.rotation.x = -Math.PI / 2;
    safe.position.y = 0.004;
    safe.renderOrder = 2;
    const ends = [0, 1].map(() => {
      const m = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.012, 20), strip.material);
      m.position.y = 0.008;
      g.add(m);
      return m;
    });
    g.add(strip, safe);
    g.visible = false;
    ctx.scene.add(g);
    st.line = { g, strip, safe, ends };
    return st.line;
  }
  const cross2 = (ax, az, bx, bz) => ax * bz - az * bx;
  function screenX(ctx, a) {
    const T = ctx.THREE;
    const p = new T.Vector3(a.pos.x, 1, a.pos.z).project(ctx.camera);
    return p.x;
  }
  function updateLine(ctx) {
    const st = S(ctx);
    const p = P(ctx);
    const all = everyone(ctx);
    const A = all[p.lineA];
    const B = all[p.lineB];
    const on = p.line && active(ctx) && A && B && A !== B;
    if (!on) {
      if (st.line) st.line.g.visible = false;
      st.crossed = false;
      st.lineSide = null;
      return;
    }
    const L = lineParts(ctx, st);
    const dx = B.pos.x - A.pos.x;
    const dz = B.pos.z - A.pos.z;
    const len = Math.hypot(dx, dz) || 1e-3;
    const phi = Math.atan2(-dz, dx);
    L.g.visible = true;
    L.g.position.set((A.pos.x + B.pos.x) / 2, 0, (A.pos.z + B.pos.z) / 2);
    L.g.rotation.set(0, phi, 0);
    const long = len + 3.2;
    L.strip.scale.set(long, 1, 1);
    L.safe.scale.set(long, 1, 1);
    L.ends[0].position.x = -len / 2;
    L.ends[1].position.x = len / 2;
    const cam = ctx.camera.position;
    const c = cross2(dx / len, dz / len, cam.x - A.pos.x, cam.z - A.pos.z);
    const side = c >= 0 ? 1 : -1;
    if (st.lineSide == null) {
      st.lineSide = side;
      st.crossed = false;
      st.leftName = screenX(ctx, A) <= screenX(ctx, B) ? A.name : B.name;
      st.rightName = st.leftName === A.name ? B.name : A.name;
    } else if (Math.abs(c) > 0.08) st.crossed = side !== st.lineSide;
    L.safe.position.z = st.lineSide * 1.3;
    const red = st.crossed;
    L.strip.material.color.setHex(red ? 0xff4a4a : 0xffc83d);
    L.safe.material.color.setHex(0x3fbf6a);
  }
  function warnText(ctx) {
    const st = S(ctx);
    if (!st.crossed) return "";
    return `The camera crossed the line. The audience will feel the two swapped sides: ${st.leftName} was on the left of the picture and is now on the right, and ${st.rightName} the other way round. Move the camera back to the green side, or keep it here and press "Use this side from now on".`;
  }

  /* ---------- the camera: frame everyone ---------- */
  function groupBox(ctx) {
    const T = ctx.THREE;
    const box = new T.Box3();
    everyone(ctx).forEach((a) => {
      const m = a.primary ? ctx.model : a.model;
      if (m) box.union(new T.Box3().setFromObject(m));
    });
    return box;
  }
  function frameEveryone(ctx) {
    const T = ctx.THREE;
    const st = S(ctx);
    const cam = ctx.camera;
    const info = window.CurioRigCamera && window.CurioRigCamera.info && window.CurioRigCamera.info();
    if (info && info.follow) return;
    const box = st.box || groupBox(ctx);
    if (box.isEmpty()) return;
    const ctr = box.getCenter(new T.Vector3());
    const rad = box.getBoundingSphere(new T.Sphere()).radius;
    const P0 = cam.position.clone();
    const dir = cam.getWorldDirection(new T.Vector3());
    const flat = dir.x * dir.x + dir.z * dir.z;
    if (flat < 1e-6) return;
    const s = -(P0.x * dir.x + P0.z * dir.z) / flat; /* where the orbit looks: above the middle of the floor */
    const target = P0.clone().addScaledVector(dir, s);
    const dist0 = P0.distanceTo(target);
    const vf = (cam.fov * DEG) / 2;
    const hf = Math.atan(Math.tan(vf) * (cam.aspect || 1.5));
    const need = (rad * 1.02) / Math.sin(Math.min(vf, hf));
    const look = new T.Vector3(ctr.x, target.y, ctr.z);
    cam.position.copy(look).addScaledVector(dir, -Math.max(dist0, need));
    cam.lookAt(look);
    cam.updateMatrixWorld(true);
  }

  /* ---------- the panel ---------- */
  const CSS = `.stg-row{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;margin:.25rem 0}
.stg-row input[type=text]{width:7.5rem;min-width:0}
.stg-row select{max-width:11rem}
.stg-chips{display:flex;flex-wrap:wrap;gap:.25rem;margin:.25rem 0}
.stg-chips button[aria-pressed="true"]{outline:2px solid #e8a038;font-weight:600}
.stg-warn{background:#5a1a1a;color:#ffe2d6;border-radius:.3rem;padding:.35rem .5rem}
.stg-ov{position:absolute;left:.5rem;right:.5rem;top:.5rem;pointer-events:none;background:#000b;color:#ffd5c8;border:1px solid #ff6a5a;border-radius:.35rem;padding:.35rem .55rem;font-size:.8rem;line-height:1.3}
.stg-ov[hidden]{display:none}
.stg-tag{position:absolute;pointer-events:none;transform:translate(-50%,-100%);background:#000a;color:#fff;border-radius:.3rem;padding:0 .3rem;font-size:.72rem;white-space:nowrap}
.stg-sec h5{margin:.55rem 0 .15rem;font-size:.82rem}`;
  function css() {
    if (document.getElementById("rig-staging-css")) return;
    const st = document.createElement("style");
    st.id = "rig-staging-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const box = (ctx) => ctx.el.querySelector(`[data-ext="${ID}"]`);
  const q = (ctx, n) => {
    const b = box(ctx);
    return b && b.querySelector(`[data-stg="${n}"]`);
  };
  function options(names, sel, extra) {
    return (extra || "") + names.map((n, i) => `<option value="${i}"${i === sel ? " selected" : ""}>${esc(n)}</option>`).join("");
  }
  /* redraw the parts of the panel that depend on who is cast */
  function draw(ctx) {
    const b = box(ctx);
    if (!b) return;
    const st = S(ctx);
    const p = P(ctx);
    const RS = screenCtl(ctx);
    const all = everyone(ctx);
    const names = all.map((a) => a.name);
    const ch = choices();
    const groups = [...new Set(ch.map((c) => c.group))];
    const pickWho = (who) => groups.map((g) => `<optgroup label="${esc(g)}">${ch.filter((c) => c.group === g).map((c) => `<option value="${esc(c.id)}"${c.id === who ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</optgroup>`).join("");
    q(ctx, "cast").innerHTML =
      `<div class="stg-row"><b>1</b> <input type="text" data-stg-name="0" value="${esc(names[0])}" aria-label="Name of actor 1" maxlength="30"> <small>played by the character picked at the top</small></div>` +
      st.actors
        .map((a, i) => {
          const state = a.error ? " (could not load)" : a.ready ? "" : " (loading…)";
          return `<div class="stg-row"><b>${i + 2}</b> <input type="text" data-stg-name="${i + 1}" value="${esc(a.name)}" aria-label="Name of actor ${i + 2}" maxlength="30"> <select data-stg-who="${i}" aria-label="Who plays actor ${i + 2}"${RS ? " disabled" : ""}>${pickWho(a.who)}</select> <button type="button" data-stg-drop="${i}" aria-label="Take ${esc(a.name)} out" title="Take ${esc(a.name)} out"${RS ? " disabled" : ""}>×</button><small>${esc(state)}</small></div>`;
        })
        .join("");
    q(ctx, "add").disabled = !!RS || st.actors.length >= MAX - 1;
    q(ctx, "add").textContent = st.actors.length >= MAX - 1 ? "4 actors is the most" : "Add an actor";
    q(ctx, "more").hidden = !st.actors.length;
    q(ctx, "front").innerHTML = options(names, p.front, `<option value="-1"${p.front < 0 ? " selected" : ""}>nobody: keep them even</option>`);
    q(ctx, "speaker").innerHTML = options(names, p.speaker, `<option value="-1"${p.speaker < 0 ? " selected" : ""}>nobody</option>`);
    q(ctx, "walker").innerHTML = options(names, 0);
    q(ctx, "walk-to").innerHTML = names.map((n, i) => `<option value="${i}"${i === 1 ? " selected" : ""}>${esc(n)}</option>`).join("") + `<option value="mark">their own mark</option><option value="middle">the middle</option><option value="front">the front, near the camera</option>`;
    q(ctx, "lineA").innerHTML = options(names, p.lineA);
    q(ctx, "lineB").innerHTML = options(names, p.lineB);
    b.querySelectorAll("[data-stg-preset]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.stgPreset === p.preset)));
    const pr = PRESETS.find((x) => x.id === p.preset);
    q(ctx, "preset-say").textContent = pr ? pr.say : "";
  }
  function setDistance(ctx, word) {
    const s = SLIDERS[0];
    const i = s.scale.indexOf(word);
    const inp = ctx.el.querySelector(`[data-slider="${DIST}"]`);
    if (i < 0 || (inp && inp.disabled)) return;
    ctx.prefs.values[DIST] = i / (s.scale.length - 1);
    if (inp) {
      inp.value = i;
      const w = inp.closest(".rig-row") && inp.closest(".rig-row").querySelector("[data-word]");
      if (w) w.textContent = word;
    }
  }
  function setPreset(ctx, id) {
    const pr = PRESETS.find((x) => x.id === id);
    if (!pr) return false;
    const st = S(ctx);
    const p = P(ctx);
    p.preset = id;
    setDistance(ctx, pr.dist);
    everyone(ctx).forEach((a) => {
      if (a.primary) endWalk(ctx, null);
      else endWalk(ctx, a);
      a.pos.offMark = false;
      a.pos.yawWant = null;
    });
    st.lineSide = null;
    placeAll(ctx, true);
    ctx.save();
    draw(ctx);
    return true;
  }

  /* ---------- a beat in words: "Ida walks over to Nessa and shrugs" ---------- */
  const WALK_RE = /\b(walks?|walking|goes|go|crosses|cross|runs?|steps?|moves?|heads?|wanders?|strolls?|rushes|rush|hurries|hurry|comes?|backs? away)\b/;
  const SPEAK_RE = /\b(says?|speaks?|talks?|tells?|asks?|shouts?|whispers?|yells?|answers?|replies|explains?)\b/;
  function findName(names, text, from) {
    let best = null;
    names.forEach((n, i) => {
      if (!n) return;
      const re = new RegExp("\\b" + n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g");
      re.lastIndex = from || 0;
      const m = re.exec(text);
      if (m && (!best || m.index < best.at)) best = { i, at: m.index, end: m.index + m[0].length };
    });
    return best;
  }
  function beat(ctx, text) {
    const all = everyone(ctx);
    const names = all.map((a) => a.name);
    const said = [];
    let subject = null;
    String(text || "")
      .toLowerCase()
      .split(/[.;!?]+|,?\s+then\s+|\s*,\s*(?=[a-z]+ (?:walks?|says?|looks?))/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((clause) => {
        const who = findName(names, clause);
        if (who && who.at < 4 + (clause.match(/^(and |then |now |suddenly )/) || [""])[0].length) subject = who.i;
        else if (who && !subject && subject !== 0) subject = who.i;
        if (subject == null) return;
        const name = names[subject];
        const everyoneLooks = clause.match(/\b(everyone|everybody|they all|all) looks? at (\w+)/);
        if (everyoneLooks) {
          const t = findName(names, clause, everyoneLooks.index);
          if (t) {
            speaker(ctx, t.i);
            said.push(`Everyone looks at ${names[t.i]}.`);
          }
        }
        let move = null;
        if (R.gestures && R.gestures.read) {
          const g = R.gestures.read(clause.replace(WALK_RE, " "));
          if (g && g.id) move = g.id;
        }
        const w = clause.match(WALK_RE);
        if (w) {
          const rest = clause.slice(w.index + w[0].length);
          const t = findName(names, rest);
          let target = null;
          let where = "";
          if (t && t.i !== subject) (target = t.i), (where = names[t.i]);
          else if (/\b(middle|center|centre)\b/.test(rest)) (target = { x: 0, z: 0 }), (where = "the middle");
          else if (/\b(camera|front|us|audience)\b/.test(rest)) (target = { x: 0, z: 1.6 }), (where = "the front");
          else if (/\b(back|away)\b/.test(rest)) (target = { x: all[subject].pos.x, z: all[subject].pos.z - 1.8 }), (where = "the back");
          else if (/\b(mark|place|spot)\b/.test(rest)) (target = "mark"), (where = "their mark");
          if (target != null && walkTo(ctx, subject, target, move)) {
            said.push(`${name} walks to ${where}${move ? ", then " + move : ""}.`);
            return;
          }
        }
        if (SPEAK_RE.test(clause)) {
          speaker(ctx, subject);
          said.push(`${name} is speaking: the others look at ${name}.`);
        }
        if (move) {
          const c = all[subject].primary ? ctx : all[subject].ctx;
          if (c && R.gestures.play({ ctx: c }, move)) said.push(`${name}: ${move}.`);
        }
      });
    return said;
  }
  function speaker(ctx, i) {
    const p = P(ctx);
    p.speaker = i;
    ctx.save();
    const s = q(ctx, "speaker");
    if (s) s.value = String(i);
  }

  /* ---------- the add-on ---------- */
  R.extend({
    id: ID,
    label: LABEL,
    sliders: SLIDERS,
    setup(ctx) {
      const st = S(ctx);
      const T = ctx.THREE;
      st.stage0 = new T.Group();
      st.stage0.name = "actor 1";
      ctx.scene.add(st.stage0);
      const view = ctx.renderer.domElement.parentElement;
      if (view && !view.querySelector(".stg-ov")) {
        css();
        if (getComputedStyle(view).position === "static") view.style.position = "relative";
        const o = document.createElement("div");
        o.className = "stg-ov";
        o.hidden = true;
        o.setAttribute("role", "status");
        view.appendChild(o);
        st.ov = o;
      }
    },
    built(ctx) {
      const st = S(ctx);
      if (!st.stage0 || !ctx.holder) return;
      /* the view's own character goes inside its stage group; a holder left from an earlier load goes away */
      st.stage0.children.slice().forEach((c) => c !== ctx.holder && st.stage0.remove(c));
      st.stage0.add(ctx.holder);
      st.castSig = st.castSig || "";
      syncCast(ctx);
      placeAll(ctx, true);
      draw(ctx);
    },
    afterRules(ctx, dt) {
      const st = S(ctx);
      if (!ctx.model) return;
      if (!st.syncAt || ctx.clock - st.syncAt > 0.4) {
        st.syncAt = ctx.clock;
        syncCast(ctx);
      }
      if (!active(ctx)) {
        if (st.stage0 && (st.stage0.position.lengthSq() || st.stage0.rotation.y)) st.stage0.position.set(0, 0, 0), st.stage0.rotation.set(0, 0, 0);
        if (st.camSet) {
          /* the camera frames the one character again */
          st.camSet = false;
          const cd = ctx.data("camera");
          if (cd) cd.box = new ctx.THREE.Box3().setFromObject(ctx.model);
        }
        return;
      }
      placeAll(ctx, false);
      stepWalks(ctx, dt);
      applyStage(ctx);
      /* actor 1: heads in for a huddle, then the eyeline */
      ctx.model.updateMatrixWorld(true);
      if (st.lean && !st.p0.walk) lean(ctx, 14);
      eyeline(ctx, Object.assign(everyone(ctx)[0], { ctx }), dt);
      ctx.model.updateMatrixWorld(true);
      st.actors.forEach((a) => actorFrame(ctx, a, dt, false));
      /* the camera's wide shot keeps everyone in it */
      st.box = groupBox(ctx);
      const cd = ctx.data("camera");
      if (cd && !st.box.isEmpty()) (cd.box = st.box.clone()), (st.camSet = true);
    },
    beforeRender(ctx, dt) {
      const st = S(ctx);
      if (st.stage0 && ctx.holder !== undefined) st.stage0.children.slice().forEach((c) => c !== ctx.holder && st.stage0.remove(c));
      const on = active(ctx);
      if (on) {
        st.actors.forEach((a) => live(a) && perBody(ctx, a, "beforeRender", dt));
        if (P(ctx).frame !== false) frameEveryone(ctx);
      }
      updateLine(ctx);
      const text = warnText(ctx);
      if (st.ov) {
        st.ov.hidden = !text;
        if (st.ov.textContent !== text) st.ov.textContent = text;
      }
      if (st.sayDist && st.distWord !== ctx.pick(DIST)) (st.distWord = ctx.pick(DIST)), st.sayDist();
      const w = q(ctx, "warn");
      if (w) {
        w.hidden = !text;
        if (w.textContent !== text) w.textContent = text;
        q(ctx, "newside").hidden = !text;
      }
      /* name tags over the heads, so you know who is who */
      const view = ctx.renderer.domElement.parentElement;
      if (view) {
        const all = on ? everyone(ctx) : [];
        const tags = (st.tags = st.tags || []);
        while (tags.length < all.length) {
          const t = document.createElement("span");
          t.className = "stg-tag";
          view.appendChild(t);
          tags.push(t);
        }
        const cv = ctx.renderer.domElement;
        const T = ctx.THREE;
        const placed = [];
        tags.forEach((t, i) => {
          const a = all[i];
          const h = a && headAt(T, a.primary ? Object.assign({}, a, { ctx }) : a);
          if (!h || P(ctx).tags === false) return (t.hidden = true);
          h.y += 0.28;
          const pr = h.project(ctx.camera);
          t.hidden = pr.z > 1 || Math.abs(pr.x) > 1.1 || Math.abs(pr.y) > 1.1;
          const x = cv.offsetLeft + ((pr.x + 1) / 2) * cv.clientWidth;
          let y = cv.offsetTop + ((1 - pr.y) / 2) * cv.clientHeight;
          /* names that would sit on top of each other step up */
          while (placed.some((p) => Math.abs(p[0] - x) < 70 && Math.abs(p[1] - y) < 17)) y -= 18;
          placed.push([x, y]);
          t.style.left = x + "px";
          t.style.top = y + "px";
          if (t.textContent !== a.name) t.textContent = a.name;
        });
      }
    },
    panel(ctx) {
      css();
      const p = P(ctx);
      return `<div class="stg-sec"><h4 title="In Maya: several characters referenced into one scene, blocked with locators and aim constraints">More than one actor</h4>
        <p class="cap">Put up to 4 actors in the same shot. Directing is mostly about where people stand: to each other, and to the camera.</p>
        <div data-stg="cast"></div>
        <button type="button" data-stg="add">Add an actor</button>
        <div data-stg="more" hidden>
          <h5>Where they stand</h5>
          <div class="stg-chips">${PRESETS.map((x) => `<button type="button" data-stg-preset="${esc(x.id)}" title="${esc(x.say)}" aria-pressed="${x.id === p.preset}">${esc(x.id)}</button>`).join("")}</div>
          <p class="cap" data-stg="preset-say"></p>
          <div data-stg="sliders"></div>
          <p class="cap" data-stg="dist-say"></p>
          <div class="stg-row"><label>Closer to the camera <select data-stg="front"></select></label></div>
          <div class="stg-row"><label>Who is speaking <select data-stg="speaker"></select></label></div>
          <label class="rig-rule"><input type="checkbox" data-stg="look"${p.look ? " checked" : ""}> <b>Everyone looks at whoever is speaking</b> <small>Their heads turn to the speaker (Eyelines above says how much).</small></label>
          <label class="rig-rule"><input type="checkbox" data-stg="frame"${p.frame !== false ? " checked" : ""}> <b>Keep everyone in the picture</b> <small>The view backs off and centers on the group. Off: it turns around the middle, as before.</small></label>
          <label class="rig-rule"><input type="checkbox" data-stg="tags"${p.tags !== false ? " checked" : ""}> <b>Show their names</b></label>
          <h5>Moving someone (blocking)</h5>
          <div class="stg-row"><select data-stg="walker" aria-label="Who walks"></select> walks to <select data-stg="walk-to" aria-label="Where to"></select> <button type="button" data-stg="go">Go</button></div>
          <form class="stg-row" data-stg="beat-form"><input type="text" data-stg="beat" style="flex:1;width:auto" placeholder="e.g. ${esc("Ida walks over to Nessa and shrugs")}" aria-label="A beat in words"><button type="submit">Play it</button></form>
          <p class="cap" data-stg="said" role="status"></p>
          <h5 title="In film: the axis of action">The line (the 180-degree rule)</h5>
          <label class="rig-rule"><input type="checkbox" data-stg="line"${p.line ? " checked" : ""}> <b>Show the line between</b> <select data-stg="lineA" aria-label="First person on the line"></select> and <select data-stg="lineB" aria-label="Second person on the line"></select></label>
          <p class="cap">Picture a line on the floor through two people. Keep the camera on one side of it (the green side) from shot to shot. If it crosses, the audience will feel the two swapped sides: the one who was on the left is suddenly on the right.</p>
          <p class="stg-warn" data-stg="warn" hidden></p>
          <button type="button" data-stg="newside" hidden>Use this side from now on</button>
        </div></div>`;
    },
    wire(ctx, b) {
      const st = S(ctx);
      /* How far apart and Eyelines live here, next to the rest of the staging */
      const home = b.querySelector('[data-stg="sliders"]');
      SLIDERS.forEach((s) => {
        const row = ctx.el.querySelector(`[data-sliders] [data-row="${s.id}"], [data-rig="sliders"] [data-row="${s.id}"]`);
        if (row) home.appendChild(row);
      });
      ctx.el.querySelectorAll('[data-rig="sliders"] h5.rig-group').forEach((h) => h.textContent === LABEL && h.remove());
      const sayDist = () => {
        const s = q(ctx, "dist-say");
        if (s) s.textContent = DIST_SAY[ctx.pick(DIST)] || "";
      };
      sayDist();
      b.addEventListener("input", (e) => e.target.dataset && e.target.dataset.slider === DIST && sayDist());
      st.sayDist = sayDist;
      b.addEventListener("change", (e) => {
        const t = e.target;
        const p = P(ctx);
        if (t.dataset.stgName != null) {
          const i = Number(t.dataset.stgName);
          const name = t.value.trim().slice(0, 30);
          if (i === 0) p.name0 = name;
          else if (p.cast[i - 1]) p.cast[i - 1].name = name || labelOf(p.cast[i - 1].who);
          ctx.save();
          syncCast(ctx);
          draw(ctx);
        } else if (t.dataset.stgWho != null) {
          const i = Number(t.dataset.stgWho);
          if (!p.cast[i]) return;
          const was = p.cast[i];
          const auto = !was.name || was.name === labelOf(was.who);
          p.cast[i] = { who: t.value, name: auto ? labelOf(t.value) : was.name };
          ctx.save();
          syncCast(ctx);
        } else if (t.dataset.stg === "front") {
          p.front = Number(t.value);
          st.lineSide = null;
          everyone(ctx).forEach((a) => (a.pos.offMark = false));
          placeAll(ctx, true);
          ctx.save();
        } else if (t.dataset.stg === "speaker") speaker(ctx, Number(t.value));
        else if (["look", "frame", "line", "tags"].includes(t.dataset.stg)) {
          p[t.dataset.stg] = t.checked;
          st.lineSide = null;
          ctx.save();
        } else if (t.dataset.stg === "lineA" || t.dataset.stg === "lineB") {
          p[t.dataset.stg] = Number(t.value);
          st.lineSide = null;
          ctx.save();
        }
      });
      b.addEventListener("click", (e) => {
        const t = e.target.closest("button");
        if (!t) return;
        const p = P(ctx);
        if (t.dataset.stgPreset) setPreset(ctx, t.dataset.stgPreset);
        else if (t.dataset.stgDrop != null) {
          p.cast.splice(Number(t.dataset.stgDrop), 1);
          ctx.save();
          syncCast(ctx);
        } else if (t.dataset.stg === "add") {
          if (p.cast.length >= MAX - 1) return;
          const ch = choices();
          const used = new Set(p.cast.map((c) => c.who).concat([ctx.prefs.character]));
          const pick = ch.find((c) => !used.has(c.id) && c.group !== "Objects") || ch[0];
          p.cast.push({ who: pick.id, name: labelOf(pick.id) });
          ctx.save();
          syncCast(ctx);
        } else if (t.dataset.stg === "go") {
          const i = Number(q(ctx, "walker").value);
          const v = q(ctx, "walk-to").value;
          const target = v === "mark" ? "mark" : v === "middle" ? { x: 0, z: 0 } : v === "front" ? { x: 0, z: 1.6 } : Number(v);
          const ok = walkTo(ctx, i, target);
          q(ctx, "said").textContent = ok ? `${everyone(ctx)[i].name} walks.` : "Pick someone else to walk to.";
        } else if (t.dataset.stg === "newside") {
          st.lineSide = null;
          st.crossed = false;
        }
      });
      b.querySelector('[data-stg="beat-form"]').addEventListener("submit", (e) => {
        e.preventDefault();
        const said = beat(ctx, q(ctx, "beat").value);
        q(ctx, "said").textContent = said.length ? said.join(" ") : `Try "${everyone(ctx)[1] ? everyone(ctx)[1].name : "Ida"} walks over to ${everyone(ctx)[0].name} and shrugs", "${everyone(ctx)[0].name} says", or "everyone looks at ${everyone(ctx)[0].name}".`;
      });
      draw(ctx);
    },
  });

  /* ---------- for tests and other tools ---------- */
  const C = (ctl) => {
    const c = ctl || R.current();
    return c && c.ctx ? c.ctx : null;
  };
  window.CurioRigStaging = {
    PRESETS,
    SLIDERS,
    layout,
    meters,
    /* set the extra actors: [{ who, name }] (who: a character id, "made:<id>", or an object id) */
    cast(list, ctl) {
      const ctx = C(ctl);
      if (!ctx) return false;
      P(ctx).cast = (list || []).slice(0, MAX - 1).map((x) => ({ who: x.who, name: x.name || labelOf(x.who) }));
      ctx.save();
      syncCast(ctx);
      return true;
    },
    name(i, name, ctl) {
      const ctx = C(ctl);
      const p = P(ctx);
      if (i === 0) p.name0 = name;
      else if (p.cast[i - 1]) p.cast[i - 1].name = name;
      ctx.save();
      syncCast(ctx);
      draw(ctx);
    },
    ready(ctl) {
      const ctx = C(ctl);
      return ctx ? Promise.all(S(ctx).actors.map((a) => a.loading)).then(() => true) : Promise.resolve(false);
    },
    preset: (id, ctl) => setPreset(C(ctl), id),
    front(i, ctl) {
      const ctx = C(ctl);
      P(ctx).front = i;
      everyone(ctx).forEach((a) => (a.pos.offMark = false));
      placeAll(ctx, true);
      draw(ctx);
    },
    walkTo: (i, target, ctl, then) => walkTo(C(ctl), i, target, then),
    beat: (text, ctl) => beat(C(ctl), text),
    speaker: (i, ctl) => speaker(C(ctl), i),
    line(on, a, b, ctl) {
      const ctx = C(ctl);
      const p = P(ctx);
      p.line = on !== false;
      if (a != null) p.lineA = a;
      if (b != null) p.lineB = b;
      S(ctx).lineSide = null;
      const box = q(ctx, "line");
      if (box) box.checked = p.line;
      draw(ctx);
    },
    sameSide(ctl) {
      const st = S(C(ctl));
      st.lineSide = null;
      st.crossed = false;
    },
    /* degrees between where actor i's face points and the head it should look at */
    lookError(i, ctl) {
      const ctx = C(ctl);
      const T = ctx.THREE;
      const all = everyone(ctx);
      const a = all[i];
      const pl = lookPlan(ctx, i);
      if (!a || !pl) return null;
      const me = a.primary ? Object.assign({}, a, { ctx }) : a;
      const to = all[pl.at].primary ? Object.assign({}, all[pl.at], { ctx }) : all[pl.at];
      const h = headAt(T, me);
      const want = headAt(T, to).sub(h).normalize();
      return Math.acos(clamp(faceDir(me.ctx).dot(want), -1, 1)) / DEG;
    },
    state(ctl) {
      const ctx = C(ctl);
      if (!ctx) return null;
      const st = S(ctx);
      const p = P(ctx);
      const T = ctx.THREE;
      return {
        active: active(ctx),
        preset: p.preset,
        distance: ctx.pick(DIST),
        meters: meters(ctx.val(DIST)),
        eyeline: ctx.pick(EYE),
        speaker: p.speaker,
        front: p.front,
        line: { on: !!p.line, visible: !!(st.line && st.line.g.visible), crossed: !!st.crossed, side: st.lineSide, warn: warnText(ctx), overlay: !!(st.ov && !st.ov.hidden) },
        actors: everyone(ctx).map((a, i) => {
          const me = a.primary ? Object.assign({}, a, { ctx }) : a;
          const ok = a.primary ? !!ctx.model : live(a);
          const f = ok ? faceDir(me.ctx) : null;
          const h = ok ? headAt(T, me) : null;
          return { i, name: a.name, who: a.who, track: a.track || "", loaded: ok, error: a.error || "", bones: ok ? me.ctx.bones.length : 0, head: !!(ok && me.ctx.rig && me.ctx.rig.head), x: a.pos.x, z: a.pos.z, yaw: a.pos.yaw, face: f ? [f.x, f.y, f.z] : null, headAt: h ? h.toArray() : null, walking: !!a.pos.walk, arrived: a.pos.arrived || 0, offMark: !!a.pos.offMark, motion: a.primary ? "" : a.made || (a.action ? a.action.getClip().name : ""), gesture: R.gestures && me.ctx && me.ctx.rig ? (R.gestures.state({ ctx: me.ctx }) || {}).playing : "" };
        }),
      };
    },
  };
})();
