/* Studio: Rig & pose. A 2D side-view puppet after Maya's skeletons and joints, IK and FK,
   aim / point / parent constraints and HumanIK character posing. A pose reads back as curiosities
   (posture, gesture, stillness, leadPart, arcs); keyed poses play on a beat strip and go to the board. */

(function () {
  let prevKeyOff = null;
  let prevAutoOff = null;
  if (!window.CuriosityStudio) return;

  const KEY = "curiosities-studio-rig-v1";
  const ROOT = { x: 190, y: 200 };
  const FLOOR = 322;
  const CAMERA_X = 392; /* the camera sits to the right of the stage, so "forward" is toward it */

  /* Joint hierarchy. Each bone starts at its parent's end and is rotated relative to its parent.
     The name is the pivot the bone turns on. */
  const BONES = [
    { id: "hips", parent: null, len: 0, name: "Hips" },
    { id: "spine", parent: "hips", len: 48, name: "Spine" },
    { id: "chest", parent: "spine", len: 42, name: "Chest" },
    { id: "neck", parent: "chest", len: 14, name: "Neck" },
    { id: "head", parent: "neck", len: 30, name: "Head" },
    { id: "upperL", parent: "chest", len: 44, name: "Far shoulder", far: true },
    { id: "foreL", parent: "upperL", len: 42, name: "Far elbow", far: true },
    { id: "handL", parent: "foreL", len: 12, name: "Far wrist", far: true },
    { id: "thighL", parent: "hips", len: 62, name: "Far hip", far: true },
    { id: "shinL", parent: "thighL", len: 60, name: "Far knee", far: true },
    { id: "footL", parent: "shinL", len: 20, name: "Far ankle", far: true },
    { id: "upperR", parent: "chest", len: 44, name: "Near shoulder" },
    { id: "foreR", parent: "upperR", len: 42, name: "Near elbow" },
    { id: "handR", parent: "foreR", len: 12, name: "Near wrist" },
    { id: "thighR", parent: "hips", len: 62, name: "Near hip" },
    { id: "shinR", parent: "thighR", len: 60, name: "Near knee" },
    { id: "footR", parent: "shinR", len: 20, name: "Near ankle" },
  ];
  const BY = {};
  BONES.forEach((b) => (BY[b.id] = b));
  /* IK chains: two bones and the end effector bone that keeps its world angle. */
  const CHAINS = {
    armR: { a: "upperR", b: "foreR", end: "handR", label: "near hand" },
    armL: { a: "upperL", b: "foreL", end: "handL", label: "far hand" },
    legR: { a: "thighR", b: "shinR", end: "footR", label: "near foot" },
    legL: { a: "thighL", b: "shinL", end: "footL", label: "far foot" },
  };

  /* Presets in world angles (0 = toward the camera, 90 = down, -90 = up); converted to local rotations. */
  const BASE = { hips: 0, spine: -90, chest: -90, neck: -88, head: -88, upperR: 80, foreR: 70, handR: 70, upperL: 95, foreL: 82, handL: 82, thighR: 86, shinR: 92, footR: 0, thighL: 95, shinL: 92, footL: 0 };
  const PRESETS = {
    neutral: { abs: {} },
    reach: { abs: { spine: -80, chest: -70, neck: -62, head: -58, upperR: 0, foreR: -4, handR: -4, upperL: 120, foreL: 100, handL: 100, thighR: 74, shinR: 96, thighL: 102, shinL: 104, footL: 6 } },
    recoil: { abs: { spine: -100, chest: -112, neck: -116, head: -122, upperR: 35, foreR: -100, handR: -110, upperL: 45, foreL: -92, handL: -100, thighR: 80, shinR: 100, thighL: 104, shinL: 96 }, dx: -14 },
    slump: { abs: { spine: -72, chest: -48, neck: -22, head: -12, upperR: 96, foreR: 96, handR: 100, upperL: 100, foreL: 100, handL: 104, thighR: 94, shinR: 84, thighL: 98, shinL: 86 }, dy: 6 },
    triumphant: { abs: { spine: -92, chest: -100, neck: -100, head: -106, upperR: -112, foreR: -100, handR: -100, upperL: -70, foreL: -82, handL: -82, thighR: 74, shinR: 92, thighL: 106, shinL: 92 } },
    point: { abs: { spine: -86, chest: -86, neck: -84, head: -84, upperR: -6, foreR: -6, handR: -6, upperL: 96, foreL: 86, handL: 86 } },
    shrug: { abs: { spine: -90, chest: -96, neck: -96, head: -80, upperR: 108, foreR: 8, handR: -12, upperL: 118, foreL: 20, handL: 0 } },
  };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function wrap(a) {
    a = ((a + 180) % 360 + 360) % 360 - 180;
    return a;
  }
  const R = Math.PI / 180;

  function absToRel(abs) {
    const rel = {};
    BONES.forEach((b) => {
      const a = abs[b.id] != null ? abs[b.id] : BASE[b.id];
      const pa = b.parent ? (abs[b.parent] != null ? abs[b.parent] : BASE[b.parent]) : 0;
      rel[b.id] = wrap(a - pa);
    });
    return rel;
  }
  function presetPose(name) {
    const p = PRESETS[name] || PRESETS.neutral;
    return { root: { x: ROOT.x + (p.dx || 0), y: ROOT.y + (p.dy || 0) }, rel: absToRel(p.abs), aim: null };
  }
  const NEUTRAL = presetPose("neutral");

  function copyPose(p) {
    return JSON.parse(JSON.stringify(p));
  }

  /* Forward kinematics: world start, end and angle of every bone. Aim constraint overrides the head. */
  function solve(pose, aim) {
    const out = {};
    BONES.forEach((b) => {
      const par = b.parent ? out[b.parent] : null;
      const start = par ? par.end : { x: pose.root.x, y: pose.root.y };
      let abs = (par ? par.abs : 0) + (pose.rel[b.id] || 0);
      if (b.id === "head" && aim) {
        /* the face looks along abs + 90; keep the turn within 65 degrees of the neck */
        const want = Math.atan2(aim.y - start.y, aim.x - start.x) / R - 90;
        abs = par.abs + clamp(wrap(want - par.abs), -65, 65);
      }
      out[b.id] = { start, abs, end: { x: start.x + Math.cos(abs * R) * b.len, y: start.y + Math.sin(abs * R) * b.len } };
    });
    return out;
  }

  /* Two-bone analytic IK in the plane. bend picks which side the elbow or knee folds to. */
  function solveIK(pose, chainId, target, bend) {
    const c = CHAINS[chainId];
    const w = solve(pose, null);
    const A = BY[c.a].len;
    const B = BY[c.b].len;
    const s = w[c.a].start;
    const dx = target.x - s.x;
    const dy = target.y - s.y;
    const d = clamp(Math.hypot(dx, dy), Math.abs(A - B) + 0.5, A + B - 0.01);
    const base = Math.atan2(dy, dx);
    const cosA = clamp((A * A + d * d - B * B) / (2 * A * d), -1, 1);
    const upper = base + bend * Math.acos(cosA);
    const elbow = { x: s.x + Math.cos(upper) * A, y: s.y + Math.sin(upper) * A };
    const tx = s.x + Math.cos(base) * d;
    const ty = s.y + Math.sin(base) * d;
    const lower = Math.atan2(ty - elbow.y, tx - elbow.x);
    const parentAbs = w[c.a].abs - pose.rel[c.a];
    const endAbs = w[c.end].abs; /* the hand or foot keeps its world angle */
    pose.rel[c.a] = wrap(upper / R - parentAbs);
    pose.rel[c.b] = wrap((lower - upper) / R);
    pose.rel[c.end] = wrap(endAbs - lower / R);
  }

  /* ---- reading curiosities from a pose ---- */
  function diffRel(a, b, ids) {
    return ids.reduce((sum, id) => sum + Math.abs(wrap((a.rel[id] || 0) - (b.rel[id] || 0))), 0);
  }
  const HAND_IDS = ["handR", "handL"];
  const ARM_IDS = ["upperR", "foreR", "upperL", "foreL"];
  const BODY_IDS = ["hips", "spine", "chest", "neck", "thighR", "shinR", "thighL", "shinL"];
  const ALL_IDS = BONES.map((b) => b.id);

  function poseDistance(a, b) {
    return diffRel(a, b, ALL_IDS) + Math.hypot(a.root.x - b.root.x, a.root.y - b.root.y) * 2;
  }

  function read(pose, aim) {
    const w = solve(pose, aim);
    /* posture: arm spread, chest lift, folded arms */
    let score = 0;
    ["R", "L"].forEach((s) => {
      const up = w["upper" + s].abs;
      const elev = Math.abs(wrap(up - 90));
      if (elev > 70) score += 0.5;
      const bendAt = Math.abs(wrap(w["fore" + s].abs - up));
      if (bendAt > 100 && Math.hypot(w["fore" + s].end.x - w.chest.end.x, w["fore" + s].end.y - w.chest.end.y) < 45) score -= 0.5;
    });
    const chestTilt = wrap(w.chest.abs + 90); /* positive = rolled forward over the belly */
    if (chestTilt > 18) score -= 1;
    if (chestTilt < -6) score += 1;
    const posture = score >= 1 ? "open" : score <= -1 ? "closed" : "neutral";
    /* gesture size: how far the limbs are from rest */
    const hand = diffRel(pose, NEUTRAL, HAND_IDS);
    const arm = diffRel(pose, NEUTRAL, ARM_IDS);
    const body = diffRel(pose, NEUTRAL, BODY_IDS) + Math.hypot(pose.root.x - NEUTRAL.root.x, pose.root.y - NEUTRAL.root.y);
    const gesture = body > 55 ? "whole body" : arm > 40 ? "arm" : hand > 20 || arm > 15 ? "hand" : "none";
    const gestureNum = clamp(Math.round(arm / 45 + body / 45 + hand / 60), 0, 5);
    /* lean, measured from the hips to the top of the chest, toward the camera at the right */
    const leanPx = w.chest.end.x - w.hips.start.x;
    const lean = leanPx > 8 ? "toward camera" : leanPx < -8 ? "away from camera" : "upright";
    return { posture, gesture, gestureNum, lean, leanPx, w };
  }

  function arcsOf(points) {
    if (points.length < 3) return "straight";
    /* crossing segments make a figure eight */
    function cross(p, q, r, s) {
      const d = (q.x - p.x) * (s.y - r.y) - (q.y - p.y) * (s.x - r.x);
      if (Math.abs(d) < 1e-9) return false;
      const t = ((r.x - p.x) * (s.y - r.y) - (r.y - p.y) * (s.x - r.x)) / d;
      const u = ((r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x)) / d;
      return t > 0 && t < 1 && u > 0 && u < 1;
    }
    for (let i = 0; i < points.length - 1; i++)
      for (let j = i + 2; j < points.length - 1; j++) if (cross(points[i], points[i + 1], points[j], points[j + 1])) return "figure eight";
    const a = points[0];
    const b = points[points.length - 1];
    let chord = Math.hypot(b.x - a.x, b.y - a.y);
    let dev = 0;
    if (chord < 4) {
      chord = Math.max(...points.map((p) => Math.hypot(p.x - a.x, p.y - a.y)));
      return chord > 10 ? "arc" : "straight";
    }
    points.forEach((p) => {
      dev = Math.max(dev, Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / chord);
    });
    return dev / chord > 0.15 ? "arc" : "straight";
  }

  function leadPartOf(a, b, aimA, aimB) {
    const scores = {
      eyes: aimA && aimB ? Math.hypot(aimA.x - aimB.x, aimA.y - aimB.y) / 3 : 0,
      head: diffRel(a, b, ["neck", "head"]),
      hips: diffRel(a, b, ["hips", "spine"]) + Math.hypot(a.root.x - b.root.x, a.root.y - b.root.y),
      hands: diffRel(a, b, ["handR", "handL", "foreR", "foreL", "upperR", "upperL"]) / 3,
    };
    return Object.entries(scores).sort((x, y) => y[1] - x[1])[0][0];
  }

  function ease(t) {
    return (1 - Math.cos(Math.PI * t)) / 2;
  }
  function lerpPose(a, b, t) {
    const out = { root: { x: a.root.x + (b.root.x - a.root.x) * t, y: a.root.y + (b.root.y - a.root.y) * t }, rel: {}, aim: null };
    ALL_IDS.forEach((id) => (out.rel[id] = a.rel[id] + wrap(b.rel[id] - a.rel[id]) * t));
    if (a.aim && b.aim) out.aim = { x: a.aim.x + (b.aim.x - a.aim.x) * t, y: a.aim.y + (b.aim.y - a.aim.y) * t };
    else out.aim = b.aim || a.aim;
    return out;
  }

  /* ---- procedural walk and run, after Maya's walk-cycle workflow ----
     One cycle is two steps. Each foot is planted at its contact point for the stance part of the
     cycle (limbPlanted), then swings to the next contact; legs solve with the two-bone IK. */
  const PX_PER_M = 108; /* the 1.75 m puppet is about 190 px tall */
  const MOODS = {
    proud: { spine: -94, chest: -104, neck: -102, head: -106, time: 1.1, bounce: 0.8, swing: 0.8, stride: 1.05, drop: 0, fore: 12 },
    tired: { spine: -76, chest: -62, neck: -40, head: -26, time: 1.45, bounce: 0.4, swing: 0.35, stride: 0.8, drop: 6, fore: 5 },
    sneaky: { spine: -74, chest: -70, neck: -66, head: -72, time: 1.35, bounce: 0.3, swing: 0.3, stride: 0.85, drop: 14, fore: 75, stance: 0.08 },
    happy: { spine: -90, chest: -95, neck: -97, head: -102, time: 0.85, bounce: 1.5, swing: 1.3, stride: 1, drop: 0, fore: 25 },
  };
  const LAG_IDS = { none: [], hands: ["foreR", "foreL", "handR", "handL"], all: ["neck", "head", "upperR", "upperL", "foreR", "foreL", "handR", "handL"] };

  function cycleInfo(wk) {
    const m = MOODS[wk.mood] || MOODS.happy;
    const run = wk.gait === "run";
    const strideM = wk.stride * m.stride;
    const S = clamp(strideM * PX_PER_M, 20, 150);
    const sf = clamp((run ? 0.38 : 0.62) + (m.stance || 0), 0.3, 0.75); /* stance fraction */
    const T = clamp(((2 * strideM) / wk.speed) * m.time, 0.35, 4); /* seconds per cycle (two steps) */
    const amp = (run ? 9 : 4) * wk.bounce * m.bounce;
    const pass = (sf + 1) / 2 - 0.5;
    const phases = [
      ["contact", 0],
      ["down", 0.1],
      ["passing", pass],
      ["up", pass + 0.08],
    ];
    return { m, run, S, sf, T, amp, strideM, phases };
  }

  function walkPose(wk, p, x0) {
    const c = cycleInfo(wk);
    const m = c.m;
    const abs = { hips: 0, spine: m.spine + (c.run ? 10 : 0), chest: m.chest + (c.run ? 8 : 0), neck: m.neck, head: m.head };
    const A = 28 * wk.swing * m.swing * (c.run ? 1.2 : 1);
    const cs = Math.cos(2 * Math.PI * p);
    abs.upperR = 90 + A * cs; /* near arm swings back while the near leg reaches forward */
    abs.upperL = 90 - A * cs;
    const fb = c.run ? 85 : m.fore;
    abs.foreR = abs.upperR - fb - 10 * Math.max(0, -cs) * wk.swing;
    abs.foreL = abs.upperL - fb - 10 * Math.max(0, cs) * wk.swing;
    abs.handR = abs.foreR;
    abs.handL = abs.foreL;
    const pose = { root: { x: x0 + p * 2 * c.S, y: 204 + m.drop + c.amp * Math.cos(2 * Math.PI * (2 * p - 0.2)) }, rel: absToRel(abs), aim: null };
    const planted = {};
    [
      ["legR", "footR", 0],
      ["legL", "footL", 0.5],
    ].forEach(([cid, foot, o]) => {
      const u = p + o;
      const k = Math.floor(u);
      const q = u - k;
      const contactX = x0 + (k - o) * 2 * c.S + c.sf * c.S;
      let fx = contactX;
      let fy = FLOOR - 4;
      let footAbs = q < 0.08 ? -12 * (1 - q / 0.08) : 0; /* heel strike, then flat */
      planted[cid] = q < c.sf;
      if (!planted[cid]) {
        const t = (q - c.sf) / (1 - c.sf);
        fx = contactX + 2 * c.S * ease(t);
        fy -= Math.sin(Math.PI * t) * (c.run ? 30 : 16);
        footAbs = 28 * Math.sin(Math.PI * t);
      }
      solveIK(pose, cid, { x: fx, y: fy }, -1);
      const w = solve(pose, null);
      pose.rel[foot] = wrap(footAbs - w[CHAINS[cid].b].abs);
    });
    pose.planted = planted;
    return pose;
  }

  const DEFAULTS = () => ({
    mode: "fk",
    pose: copyPose(NEUTRAL),
    bend: { armR: 1, armL: 1, legR: -1, legL: -1 },
    walk: { gait: "walk", stride: 0.7, speed: 1.4, bounce: 0.5, swing: 0.6, mood: "happy" },
    overlap: "none",
    lastChain: "armR",
    aim: { on: true, kind: "point", x: 330, y: 120 },
    prop: { mode: "free", hand: "handR", x: 300, y: 300, ox: 0, oy: 0, oa: 0 },
    keys: [null, null, null, null],
    sel: 0,
    ghost: true,
    perf: { on: false, map: ["upperR", "foreR", "neck", "spine"], cc: [1, 2, 3, 4], active: 0 },
  });

  function injectStyle() {
    if (document.getElementById("studio-rig")) return;
    const st = document.createElement("style");
    st.id = "studio-rig";
    st.textContent = `
      .rig-tool.studio-grid { grid-template-columns: minmax(220px, 300px) minmax(0, 1fr); }
      @media (max-width: 760px) { .rig-tool.studio-grid { grid-template-columns: minmax(0, 1fr); } }
      .rig-tool button { font-family: var(--mono); font-size: 11px; border: 1px solid var(--ink); background: var(--panel); padding: 4px 8px; cursor: pointer; }
      .rig-tool button.on, .rig-tool button.primary { background: var(--ink); color: var(--paper); }
      .rig-tool .rig-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 0 0 12px; }
      .rig-tool .rig-row label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; display: inline-flex; gap: 4px; align-items: center; }
      .rig-tool svg.view { touch-action: none; user-select: none; }
      .rig-tool svg.view [data-h] { cursor: grab; }
      .rig-tool .rig-beats { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 4px; margin: 6px 0; }
      .rig-tool .rig-beats button { padding: 6px 0; text-align: center; }
      .rig-tool .rig-beats button.filled { border-color: var(--saffron); color: var(--saffron); }
      .rig-tool .rig-beats button.sel { outline: 2px solid var(--saffron); outline-offset: 1px; }
      .rig-tool .rig-beats button.off { opacity: 0.3; }
      .rig-tool .rig-perf { display: grid; grid-template-columns: auto minmax(0, 1fr) 56px; gap: 4px 6px; align-items: center; font-family: var(--mono); font-size: 11px; margin: 0 0 8px; }
      .rig-tool .rig-perf .act { color: var(--saffron); font-weight: 600; }
      .rig-tool .rig-perf input { width: 100%; }
      .rig-tool .views { display: grid; gap: 10px; min-width: 0; }
      .rig-autobadge { display: inline-block; margin-left: 6px; padding: 0 4px; font-size: 9px; background: var(--saffron); color: white; letter-spacing: 0.06em; }
      .rig-autobadge[hidden] { display: none; }
    `;
    document.head.appendChild(st);
  }

  function draw(el, api) {
    injectStyle();
    const esc = api.esc;
    const box = api.store(KEY);
    const saved = box.get(null);
    const s = Object.assign(DEFAULTS(), saved || {});
    if (!Array.isArray(s.keys) || s.keys.length < 2) s.keys = [null, null, null, null];
    s.keys = s.keys.slice(0, 8);
    if (!saved || !saved.walk) s.bend = DEFAULTS().bend;
    s.walk = Object.assign(DEFAULTS().walk, s.walk || {});
    let cycle = null; /* the walk-cycle preview while it runs */
    let playing = null;
    let drag = null;
    let midiNote = "";
    let display = null; /* pose shown during playback */

    const jointOpts = (sel) => BONES.map((b) => `<option value="${b.id}"${b.id === sel ? " selected" : ""}>${esc(b.name)}</option>`).join("");

    el.innerHTML = `<div class="studio-grid rig-tool">
      <div>
        <p class="group-label">Mode</p>
        <div class="rig-row" id="rig-mode">
          <button type="button" data-mode="fk">FK: rotate joints</button>
          <button type="button" data-mode="ik">IK: drag hands and feet</button>
          <button type="button" id="rig-bend" title="Flip the bend of the last dragged limb">Flip bend</button>
        </div>
        <p class="cap" id="rig-help"></p>
        <label class="field" style="margin-top:8px">Overlapping action
          <select id="rig-overlap"><option value="none">none: everything arrives together</option><option value="hands">hands: forearms and hands lag the hips</option><option value="all">all: head and arms lag the hips</option></select></label>
        <p class="group-label" style="margin-top:12px">Pose presets <span class="rig-autobadge" id="rig-autobadge" hidden>automated</span></p>
        <div class="rig-row">${Object.keys(PRESETS).map((p) => `<button type="button" data-preset="${p}">${p}</button>`).join("")}</div>
        <p class="group-label">Aim constraint (head looks at)</p>
        <div class="rig-row">
          <label><input type="checkbox" id="rig-aim-on"> on</label>
          <select id="rig-aim-kind" aria-label="Aim target"><option value="point">look-at point</option><option value="prop">the prop</option><option value="person">another person</option></select>
        </div>
        <p class="group-label">Prop constraint</p>
        <label class="field">Prop
          <select id="rig-prop"><option value="free">free (drag it)</option><option value="point">point constraint to near hand</option><option value="parent">parent constraint to near hand</option><option value="parentL">parent constraint to far hand</option></select></label>
        <p class="group-label">Walk / run cycle</p>
        <div class="rig-row">
          <label>Gait <select data-w="gait"><option value="walk">walk</option><option value="run">run</option></select></label>
          <label>Mood <select data-w="mood">${Object.keys(MOODS).map((m) => `<option value="${m}">${m}</option>`).join("")}</select></label>
        </div>
        <label class="field">Stride length <span class="cap mono" data-wv="stride"></span><input type="range" data-w="stride" min="0.3" max="1.4" step="0.05"></label>
        <label class="field">Speed <span class="cap mono" data-wv="speed"></span><input type="range" data-w="speed" min="0.4" max="6" step="0.1"></label>
        <label class="field">Bounce <span class="cap mono" data-wv="bounce"></span><input type="range" data-w="bounce" min="0" max="1" step="0.05"></label>
        <label class="field">Arm swing <span class="cap mono" data-wv="swing"></span><input type="range" data-w="swing" min="0" max="1" step="0.05"></label>
        <div class="rig-row">
          <button type="button" id="rig-cycle">Preview cycle</button>
          <button type="button" id="rig-cycle-key">Key cycle to 8 beats</button>
        </div>
        <p class="cap" id="rig-cycle-note"></p>
        <p class="group-label">Performer</p>
        <div class="rig-row"><label><input type="checkbox" id="rig-perf-on"> live puppeteer</label><button type="button" id="rig-midi">Connect MIDI</button></div>
        <div class="rig-perf" id="rig-perf"></div>
        <p class="cap" id="rig-midi-note">Keys 1 to 4 pick a slot; arrow up and down turn its joint. MIDI CCs set the joint directly.</p>
      </div>
      <div class="views">
        <svg class="view" id="rig-svg" viewBox="0 0 400 340" role="img" aria-label="Side-view puppet"></svg>
        <div class="rig-row">
          <button type="button" id="rig-key" class="primary">Key pose to beat</button>
          <button type="button" id="rig-clear">Clear beat</button>
          <button type="button" id="rig-play">Play</button>
          <label>Beats <select id="rig-count">${[2, 3, 4, 5, 6, 7, 8].map((n) => `<option${n === s.keys.length ? " selected" : ""}>${n}</option>`).join("")}</select></label>
          <label><input type="checkbox" id="rig-ghost"> ghost previous</label>
        </div>
        <div class="rig-beats" id="rig-beats"></div>
        <table class="trace"><tbody id="rig-read"></tbody></table>
        <p class="group-label">Curiosities this pose produces</p>
        <div id="rig-chips"></div>
        <p class="cap">Click a chip to automate it, or open Automate.</p>
        <div class="rig-row">
          <button type="button" class="primary" id="rig-send">Send to board</button>
          <button type="button" id="rig-shelf">Keep on Shelf</button>
          <span class="cap" id="rig-send-note"></span>
        </div>
      </div>
    </div>`;

    const svg = el.querySelector("#rig-svg");
    const $ = (q) => el.querySelector(q);

    function save() {
      box.set(s);
    }
    function propHandId() {
      return s.prop.mode === "parentL" ? "handL" : "handR";
    }
    function otherPerson() {
      return { x: 352, y: 112 };
    }
    function propPos(w) {
      const p = s.prop;
      if (p.mode === "free") return { x: p.x, y: p.y, a: 0 };
      const h = w[propHandId()];
      if (p.mode === "point") return { x: h.end.x + p.ox, y: h.end.y + p.oy, a: p.oa };
      const c = Math.cos(h.abs * R);
      const sn = Math.sin(h.abs * R);
      return { x: h.end.x + p.ox * c - p.oy * sn, y: h.end.y + p.ox * sn + p.oy * c, a: h.abs + p.oa };
    }
    function aimPoint(pose) {
      if (!s.aim.on) return null;
      if (s.aim.kind === "person") return otherPerson();
      if (s.aim.kind === "prop") {
        const w = solve(pose, null);
        return propPos(w);
      }
      return pose.aim || { x: s.aim.x, y: s.aim.y };
    }
    function snapshot() {
      const p = copyPose(s.pose);
      p.aim = s.aim.on && s.aim.kind === "point" ? { x: s.aim.x, y: s.aim.y } : null;
      return p;
    }
    function filledKeys() {
      return s.keys.map((k, i) => ({ k, i })).filter((x) => x.k);
    }

    /* ---- SVG ---- */
    function figure(w, opts) {
      const o = opts || {};
      const lines = [];
      const near = o.ghost ? "#b8892d" : "#1c1712";
      const far = o.ghost ? "#d8c39a" : "#7a7066";
      const order = ["upperL", "foreL", "handL", "thighL", "shinL", "footL", "spine", "chest", "neck", "thighR", "shinR", "footR", "upperR", "foreR", "handR"];
      order.forEach((id) => {
        const b = w[id];
        const width = id === "spine" || id === "chest" ? 16 : id.startsWith("hand") || id.startsWith("foot") ? 6 : id === "neck" ? 7 : 9;
        lines.push(`<line x1="${b.start.x.toFixed(1)}" y1="${b.start.y.toFixed(1)}" x2="${b.end.x.toFixed(1)}" y2="${b.end.y.toFixed(1)}" stroke="${BY[id].far ? far : near}" stroke-width="${width}" stroke-linecap="round"${o.ghost ? ' stroke-opacity="0.45"' : ""}/>`);
      });
      const h = w.head;
      const cx = h.start.x + Math.cos(h.abs * R) * 15;
      const cy = h.start.y + Math.sin(h.abs * R) * 15;
      const face = (h.abs + 90) * R;
      lines.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="15" fill="${o.ghost ? "none" : "#fffaf2"}" stroke="${near}" stroke-width="3"${o.ghost ? ' stroke-opacity="0.45"' : ""}/>`);
      if (!o.ghost) {
        lines.push(`<line x1="${(cx + Math.cos(face) * 11).toFixed(1)}" y1="${(cy + Math.sin(face) * 11).toFixed(1)}" x2="${(cx + Math.cos(face) * 19).toFixed(1)}" y2="${(cy + Math.sin(face) * 19).toFixed(1)}" stroke="${near}" stroke-width="3" stroke-linecap="round"/>`);
        lines.push(`<circle cx="${(cx + Math.cos(face) * 7 + Math.cos(h.abs * R) * 3).toFixed(1)}" cy="${(cy + Math.sin(face) * 7 + Math.sin(h.abs * R) * 3).toFixed(1)}" r="2" fill="${near}"/>`);
      }
      return lines.join("");
    }

    function render() {
      const pose = display || s.pose;
      const aim = aimPoint(pose);
      const w = solve(pose, aim);
      const parts = [];
      parts.push(`<rect x="0" y="0" width="400" height="340" fill="#fffaf2"/>`);
      parts.push(`<line x1="0" y1="${FLOOR}" x2="400" y2="${FLOOR}" stroke="#1c1712" stroke-opacity="0.3"/>`);
      /* camera at the right */
      parts.push(`<g transform="translate(${CAMERA_X - 22},150)" opacity="0.7"><rect x="0" y="-8" width="16" height="16" fill="#1c1712"/><path d="M0,0 L-10,-7 L-10,7 Z" fill="#1c1712"/><text x="-14" y="22" font-family="ui-monospace,monospace" font-size="8" fill="#1c1712">CAMERA</text></g>`);
      if (s.aim.on && s.aim.kind === "person") {
        const op = otherPerson();
        parts.push(`<g fill="#c9bfb2"><circle cx="${op.x}" cy="${op.y + 14}" r="14"/><rect x="${op.x - 10}" y="${op.y + 30}" width="20" height="88" rx="8"/><rect x="${op.x - 8}" y="${op.y + 112}" width="16" height="${FLOOR - op.y - 112}" rx="6"/></g>`);
      }
      /* ghost of the previous keyed beat */
      if (cycle) {
        cycle.ghosts.forEach((g, gi) => {
          const gw = solve(g.pose, null);
          parts.push(figure(gw, { ghost: true }));
          parts.push(`<text x="${gw.hips.start.x.toFixed(1)}" y="${FLOOR + 9 + (gi % 2) * 9}" text-anchor="middle" font-size="8" font-family="ui-monospace,monospace" fill="#b8892d">${esc(g.name)}</text>`);
        });
      } else if (s.ghost) {
        const prevIdx = playing ? playing.from : s.sel - 1;
        const prev = prevIdx >= 0 ? s.keys[prevIdx] : null;
        if (prev) parts.push(figure(solve(prev, prev.aim && s.aim.on && s.aim.kind === "point" ? prev.aim : null), { ghost: true }));
      }
      /* hand path across keyed poses */
      const pts = filledKeys().map(({ k }) => solve(k, null).foreR.end);
      if (pts.length > 1)
        parts.push(`<polyline points="${pts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ")}" fill="none" stroke="#c45c26" stroke-dasharray="3 3"/>` + pts.map((p, i) => `<text x="${(p.x + 4).toFixed(1)}" y="${(p.y - 4).toFixed(1)}" font-size="8" font-family="ui-monospace,monospace" fill="#c45c26">${i + 1}</text>`).join(""));
      parts.push(figure(w));
      /* planted feet get a pin */
      if (pose.planted)
        ["legR", "legL"].forEach((cid) => {
          if (!pose.planted[cid]) return;
          const a = w[CHAINS[cid].b].end;
          parts.push(`<path d="M${a.x.toFixed(1)},${(FLOOR + 1).toFixed(1)} l-4,8 h8 z" fill="#c45c26"><title>planted</title></path>`);
        });
      /* prop */
      const pp = propPos(w);
      parts.push(`<g transform="translate(${pp.x.toFixed(1)},${pp.y.toFixed(1)}) rotate(${(pp.a || 0).toFixed(1)})"><rect x="-7" y="-10" width="14" height="18" rx="2" fill="#3d5a6c" ${s.prop.mode === "free" ? 'data-h="prop"' : ""}/><path d="M7,-6 q7,3 0,9" fill="none" stroke="#3d5a6c" stroke-width="2.5"/></g>`);
      if (s.prop.mode !== "free") {
        const h = w[propHandId()].end;
        parts.push(`<line x1="${h.x.toFixed(1)}" y1="${h.y.toFixed(1)}" x2="${pp.x.toFixed(1)}" y2="${pp.y.toFixed(1)}" stroke="#3d5a6c" stroke-dasharray="2 2"/>`);
      }
      /* aim target */
      if (s.aim.on) {
        const a = aim;
        const hs = w.head.start;
        parts.push(`<line x1="${hs.x.toFixed(1)}" y1="${hs.y.toFixed(1)}" x2="${a.x.toFixed(1)}" y2="${a.y.toFixed(1)}" stroke="#b8892d" stroke-dasharray="4 3" stroke-opacity="0.8"/>`);
        if (s.aim.kind === "point" && !playing) parts.push(`<g data-h="aim"><circle cx="${a.x}" cy="${a.y}" r="9" fill="rgba(184,137,45,0.2)" stroke="#b8892d" stroke-width="2" data-h="aim"/><path d="M${a.x - 13},${a.y} H${a.x + 13} M${a.x},${a.y - 13} V${a.y + 13}" stroke="#b8892d" data-h="aim"/></g>`);
      }
      /* handles */
      if (!playing && !cycle) {
        const perfJ = s.perf.on ? s.perf.map[s.perf.active] : null;
        if (s.mode === "fk") {
          BONES.forEach((b) => {
            if (b.id === "hips") return;
            if (b.id === "head" && s.aim.on) return;
            const e = w[b.id].end;
            const on = drag && drag.id === b.id;
            const pj = perfJ === b.id;
            parts.push(`<circle data-h="${b.id}" cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="${b.len < 15 ? 4.5 : 6}" fill="${on || pj ? "#c45c26" : b.far ? "#efe4d2" : "#fff"}" stroke="#c45c26" stroke-width="2"><title>${esc(b.name)}</title></circle>`);
          });
        } else {
          Object.entries(CHAINS).forEach(([cid, c]) => {
            const e = w[c.b].end;
            parts.push(`<circle data-h="ik:${cid}" cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="8" fill="${cid === s.lastChain ? "#c45c26" : "rgba(196,92,38,0.15)"}" stroke="#c45c26" stroke-width="2"><title>${esc(c.label)}</title></circle>`);
          });
        }
        const r = w.hips.start;
        parts.push(`<rect data-h="root" x="${(r.x - 7).toFixed(1)}" y="${(r.y - 7).toFixed(1)}" width="14" height="14" fill="#fff" stroke="#1c1712" stroke-width="2"><title>Hips: move the whole body</title></rect>`);
      }
      svg.innerHTML = parts.join("");
      readout(pose, aim);
    }

    function curios(pose, aim) {
      const r = read(pose, aim);
      const keyed = filledKeys();
      let stillness = 5;
      let lead = "hands";
      if (keyed.length > 1) {
        let total = 0;
        for (let i = 1; i < keyed.length; i++) total += poseDistance(keyed[i - 1].k, keyed[i].k);
        stillness = clamp(5 - Math.round(total / (keyed.length - 1) / 45), 0, 5);
        lead = leadPartOf(keyed[0].k, keyed[1].k, keyed[0].k.aim, keyed[1].k.aim);
      } else {
        const d = poseDistance(pose, NEUTRAL);
        stillness = clamp(5 - Math.round(d / 60), 0, 5);
        lead = leadPartOf(NEUTRAL, pose, null, null);
      }
      const arcs = arcsOf(keyed.map(({ k }) => solve(k, null).foreR.end));
      return { r, list: [
        { id: "posture", value: r.posture, note: `lean ${r.lean}` },
        { id: "gesture", value: r.gesture, note: `${r.gestureNum} of 5` },
        { id: "stillness", value: String(stillness), note: keyed.length > 1 ? `across ${keyed.length} keys` : "from rest" },
        { id: "leadPart", value: lead, note: keyed.length > 1 ? "first move" : "from rest" },
        { id: "arcs", value: arcs, note: `near hand, ${keyed.length} keys` },
        { id: "overlap", value: s.overlap, note: s.overlap === "none" ? "all parts arrive together" : "lags the hips" },
        { id: "limbPlanted", value: pose.planted && (pose.planted.legR || pose.planted.legL) ? "planted" : "free", note: pose.planted ? `near ${pose.planted.legR ? "down" : "up"}, far ${pose.planted.legL ? "down" : "up"}` : "posed by hand" },
      ] };
    }

    function readout(pose, aim) {
      const c = curios(pose, aim);
      const w = c.r.w;
      const rows = [
        ["Mode", s.mode === "fk" ? "FK (rotate a joint and its children)" : `IK (two-bone, last limb: ${CHAINS[s.lastChain].label}, bend ${s.bend[s.lastChain] > 0 ? "+" : "-"})`],
        ["Posture", c.r.posture],
        ["Gesture size", `${c.r.gesture} (${c.r.gestureNum})`],
        ["Lean", `${c.r.lean} (${c.r.leanPx.toFixed(0)} px)`],
        ["Head turn from neck", `${wrap(w.head.abs - w.neck.abs).toFixed(0)}°`],
        ["Near shoulder / elbow", `${wrap(pose.rel.upperR).toFixed(0)}° / ${wrap(pose.rel.foreR).toFixed(0)}°`],
        ["Keyed beats", `${filledKeys().length} of ${s.keys.length}`],
        ["Cycle", (() => {
          const c = cycleInfo(s.walk);
          return `${s.walk.gait}, ${s.walk.mood}: ${c.strideM.toFixed(2)} m stride, ${c.T.toFixed(2)} s per cycle, ${Math.round(120 / c.T)} steps/min`;
        })()],
      ];
      $("#rig-read").innerHTML = rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="mono">${esc(b)}</td></tr>`).join("");
      $("#rig-chips").innerHTML = c.list.map((x) => `<span class="chip">${esc(x.id)}: ${esc(x.value)} <small style="opacity:.65">${esc(x.note)}</small></span>`).join("");
    }

    function drawChrome() {
      el.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === s.mode));
      $("#rig-help").textContent =
        s.mode === "fk"
          ? "FK: drag a round handle to turn the joint it hangs from. Everything below it follows. Drag the square to move the hips."
          : "IK: drag a hand or foot target. The shoulder and elbow (or hip and knee) solve to reach it. Flip bend folds the limb the other way.";
      $("#rig-aim-on").checked = !!s.aim.on;
      $("#rig-aim-kind").value = s.aim.kind;
      $("#rig-prop").value = s.prop.mode;
      $("#rig-ghost").checked = !!s.ghost;
      $("#rig-overlap").value = s.overlap;
      el.querySelectorAll("[data-w]").forEach((inp) => (inp.value = s.walk[inp.dataset.w]));
      el.querySelectorAll("[data-wv]").forEach((n) => {
        const k = n.dataset.wv;
        n.textContent = k === "stride" ? `${s.walk.stride} m` : k === "speed" ? `${s.walk.speed} m/s` : `${Math.round(s.walk[k] * 100)}%`;
      });
      $("#rig-cycle").textContent = cycle ? "Stop cycle" : "Preview cycle";
      $("#rig-cycle-note").textContent = cycle
        ? "Ghosts mark contact, down, passing and up. Pins mark a planted foot."
        : "Preview walks the puppet across the stage. Keying writes contact, down, passing and up for both steps.";
      $("#rig-perf-on").checked = !!s.perf.on;
      $("#rig-beats").innerHTML = Array.from({ length: 8 }, (_, i) => {
        const inUse = i < s.keys.length;
        const cls = [s.keys[i] ? "filled" : "", i === s.sel ? "sel" : "", inUse ? "" : "off"].join(" ");
        return `<button type="button" data-beat="${i}" class="${cls}" ${inUse ? "" : "disabled"} aria-label="Beat ${i + 1}${s.keys[i] ? ", keyed" : ""}">${i + 1}${s.keys[i] ? "◆" : ""}</button>`;
      }).join("");
      $("#rig-perf").innerHTML = s.perf.map
        .map((j, i) => `<span class="${i === s.perf.active ? "act" : ""}">${i + 1}</span><select data-perf="${i}" aria-label="Slot ${i + 1} joint">${jointOpts(j)}</select><input type="number" min="0" max="127" data-cc="${i}" value="${s.perf.cc[i]}" aria-label="Slot ${i + 1} MIDI CC" title="MIDI CC number">`)
        .join("");
      $("#rig-perf").querySelectorAll("[data-perf]").forEach((sel) =>
        sel.addEventListener("change", () => {
          s.perf.map[Number(sel.dataset.perf)] = sel.value;
          save();
          render();
        })
      );
      $("#rig-perf").querySelectorAll("[data-cc]").forEach((inp) =>
        inp.addEventListener("change", () => {
          s.perf.cc[Number(inp.dataset.cc)] = clamp(Number(inp.value) || 0, 0, 127);
          save();
        })
      );
      $("#rig-beats").querySelectorAll("[data-beat]").forEach((b) =>
        b.addEventListener("click", () => {
          stop();
          s.sel = Number(b.dataset.beat);
          const k = s.keys[s.sel];
          if (k) {
            s.pose = copyPose(k);
            if (k.aim) Object.assign(s.aim, k.aim);
          }
          save();
          drawChrome();
          render();
        })
      );
      $("#rig-play").textContent = playing ? "Stop" : "Play";
      $("#rig-midi-note").textContent = midiNote || "Keys 1 to 4 pick a slot; arrow up and down turn its joint. MIDI CCs set the joint directly.";
      $("#rig-send-note").textContent = "Sends whoMoves, characterSpeed and characterToLens, one per keyed beat.";
    }

    /* ---- dragging ---- */
    function svgPoint(ev) {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const m = svg.getScreenCTM();
      if (!m) return { x: 0, y: 0 };
      const p = pt.matrixTransform(m.inverse());
      return { x: clamp(p.x, 0, 400), y: clamp(p.y, 0, 340) };
    }
    svg.addEventListener("pointerdown", (ev) => {
      const t = ev.target.closest("[data-h]");
      if (!t || playing || cycle) return;
      drag = { id: t.getAttribute("data-h") };
      if (drag.id.startsWith("ik:")) s.lastChain = drag.id.slice(3);
      try {
        svg.setPointerCapture(ev.pointerId);
      } catch (e) {}
      ev.preventDefault();
    });
    svg.addEventListener("pointermove", (ev) => {
      if (!drag) return;
      const p = svgPoint(ev);
      moveTo(drag.id, p);
      render();
    });
    const end = () => {
      if (!drag) return;
      drag = null;
      save();
      render();
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);

    function moveTo(id, p) {
      if (id === "aim") {
        s.aim.x = p.x;
        s.aim.y = p.y;
      } else if (id === "prop") {
        s.prop.x = p.x;
        s.prop.y = p.y;
      } else if (id === "root") {
        s.pose.root.x = clamp(p.x, 60, 340);
        s.pose.root.y = clamp(p.y, 150, 240);
      } else if (id.startsWith("ik:")) {
        const cid = id.slice(3);
        solveIK(s.pose, cid, p, s.bend[cid]);
      } else if (BY[id]) {
        const w = solve(s.pose, aimPoint(s.pose));
        const st = w[id].start;
        const parentAbs = w[id].abs - s.pose.rel[id];
        s.pose.rel[id] = wrap(Math.atan2(p.y - st.y, p.x - st.x) / R - parentAbs);
      }
    }

    /* ---- controls ---- */
    el.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        s.mode = b.dataset.mode;
        save();
        drawChrome();
        render();
      })
    );
    $("#rig-bend").addEventListener("click", () => {
      const cid = s.lastChain;
      s.bend[cid] = -s.bend[cid];
      /* re-solve to the same target so the limb visibly folds the other way */
      const w = solve(s.pose, null);
      solveIK(s.pose, cid, w[CHAINS[cid].b].end, s.bend[cid]);
      save();
      render();
    });
    el.querySelectorAll("[data-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        stop();
        const p = presetPose(b.dataset.preset);
        s.pose = p;
        save();
        render();
      })
    );
    $("#rig-aim-on").addEventListener("change", (e) => {
      s.aim.on = e.target.checked;
      save();
      render();
    });
    $("#rig-aim-kind").addEventListener("change", (e) => {
      s.aim.kind = e.target.value;
      s.aim.on = true;
      save();
      drawChrome();
      render();
    });
    $("#rig-prop").addEventListener("change", (e) => {
      const w = solve(s.pose, aimPoint(s.pose));
      const cur = propPos(w);
      s.prop.mode = e.target.value;
      if (s.prop.mode === "free") {
        s.prop.x = cur.x;
        s.prop.y = cur.y;
      } else {
        /* snap the prop into the hand, then keep that offset (local to the hand for parent) */
        s.prop.ox = s.prop.mode === "point" ? 0 : 6;
        s.prop.oy = s.prop.mode === "point" ? 6 : 0;
        s.prop.oa = 0;
      }
      save();
      render();
    });
    $("#rig-ghost").addEventListener("change", (e) => {
      s.ghost = e.target.checked;
      save();
      render();
    });
    $("#rig-count").addEventListener("change", (e) => {
      const n = Number(e.target.value);
      while (s.keys.length < n) s.keys.push(null);
      s.keys = s.keys.slice(0, n);
      s.sel = Math.min(s.sel, n - 1);
      save();
      drawChrome();
      render();
    });
    $("#rig-key").addEventListener("click", () => {
      stop();
      s.keys[s.sel] = snapshot();
      s.sel = Math.min(s.keys.length - 1, s.sel + 1);
      save();
      drawChrome();
      render();
    });
    $("#rig-clear").addEventListener("click", () => {
      s.keys[s.sel] = null;
      save();
      drawChrome();
      render();
    });

    function stop() {
      stopCycle();
      if (!playing) return;
      cancelAnimationFrame(playing.raf);
      playing = null;
      display = null;
      drawChrome();
      render();
    }
    /* Playback: ease-in-out between keyed rotations, 0.8 s per beat. */
    $("#rig-play").addEventListener("click", () => {
      if (playing) return stop();
      const keyed = filledKeys();
      if (keyed.length < 2) {
        $("#rig-send-note").textContent = "Key at least two beats to play.";
        return;
      }
      const per = 800;
      const LAG = 0.3; /* overlapping parts trail the hips by this fraction of a beat */
      const lagIds = LAG_IDS[s.overlap] || [];
      const t0 = performance.now();
      stopCycle();
      playing = { raf: 0, from: keyed[0].i };
      drawChrome();
      const at = (u) => {
        const seg = clamp(Math.floor(u), 0, keyed.length - 2);
        return lerpPose(keyed[seg].k, keyed[seg + 1].k, ease(clamp(u - seg, 0, 1)));
      };
      const step = (t) => {
        if (!el.isConnected) return;
        const uAll = Math.max(0, (t - t0) / per); /* a frame's timestamp can precede t0 */
        const u = Math.min(uAll, keyed.length - 1);
        const seg = Math.min(keyed.length - 2, Math.floor(u));
        const local = clamp(u - seg, 0, 1);
        playing.from = keyed[seg].i;
        display = at(u);
        if (lagIds.length) {
          const late = at(uAll - LAG);
          lagIds.forEach((id) => (display.rel[id] = late.rel[id]));
        }
        if (display.aim && s.aim.kind === "point") display.aim = Object.assign({}, display.aim);
        s.sel = keyed[local >= 1 ? seg + 1 : seg].i;
        render();
        if (uAll < keyed.length - 1 + (lagIds.length ? LAG : 0)) playing.raf = requestAnimationFrame(step);
        else {
          s.pose = copyPose(keyed[keyed.length - 1].k);
          s.sel = keyed[keyed.length - 1].i;
          playing = null;
          display = null;
          save();
          drawChrome();
          render();
        }
      };
      playing.raf = requestAnimationFrame(step);
    });

    $("#rig-overlap").addEventListener("change", (e) => {
      s.overlap = e.target.value;
      save();
      render();
    });
    el.querySelectorAll("[data-w]").forEach((inp) =>
      inp.addEventListener(inp.tagName === "SELECT" ? "change" : "input", () => {
        const k = inp.dataset.w;
        s.walk[k] = inp.tagName === "SELECT" ? inp.value : Number(inp.value);
        save();
        drawChrome();
        if (cycle) cycle.ghosts = ghostKeys(cycle.x0);
        render();
      })
    );

    /* ---- walk / run cycle ---- */
    function ghostKeys(x0) {
      return cycleInfo(s.walk).phases.map(([name, ph]) => ({ name, pose: walkPose(s.walk, ph, x0) }));
    }
    function stopCycle() {
      if (!cycle) return;
      cancelAnimationFrame(cycle.raf);
      cycle = null;
      display = null;
      drawChrome();
      render();
    }
    function cyclePose(p, x0) {
      const pose = walkPose(s.walk, p, x0);
      const lagIds = LAG_IDS[s.overlap] || [];
      if (lagIds.length) {
        const late = walkPose(s.walk, p - 0.08, x0);
        lagIds.forEach((id) => (pose.rel[id] = late.rel[id]));
      }
      return pose;
    }
    $("#rig-cycle").addEventListener("click", () => {
      if (cycle) return stopCycle();
      stop();
      const t0 = performance.now();
      cycle = { raf: 0, x0: 40, ghosts: ghostKeys(40) };
      drawChrome();
      const step = (t) => {
        if (!el.isConnected || !cycle) return;
        const c = cycleInfo(s.walk);
        const total = (t - t0) / 1000 / c.T;
        const n = Math.max(1, Math.floor(250 / (2 * c.S)));
        const k = Math.floor(total);
        const x0 = 40 + (k % n) * 2 * c.S;
        if (x0 !== cycle.x0) {
          cycle.x0 = x0;
          cycle.ghosts = ghostKeys(x0);
        }
        display = cyclePose(total - k, x0);
        render();
        cycle.raf = requestAnimationFrame(step);
      };
      cycle.raf = requestAnimationFrame(step);
    });
    $("#rig-cycle-key").addEventListener("click", () => {
      stop();
      const c = cycleInfo(s.walk);
      const x0 = 80;
      const list = [];
      c.phases.forEach(([, ph]) => list.push(ph));
      c.phases.forEach(([, ph]) => list.push(ph + 0.5));
      s.keys = list.map((ph) => cyclePose(ph, x0));
      s.sel = 0;
      s.pose = copyPose(s.keys[0]);
      $("#rig-count").value = "8";
      save();
      drawChrome();
      render();
    });

    /* ---- Shelf: one value per keyed beat ---- */
    $("#rig-shelf").addEventListener("click", () => {
      let keyed = filledKeys().map((x) => x.k);
      if (!keyed.length) keyed = [snapshot()];
      const v = { posture: [], gesture: [], stillness: [], leadPart: [], overlap: [] };
      const anyPlanted = keyed.some((k) => k.planted);
      if (anyPlanted) v.limbPlanted = [];
      keyed.forEach((k, i) => {
        const prev = i > 0 ? keyed[i - 1] : NEUTRAL;
        const r = read(k, null);
        v.posture.push(r.posture);
        v.gesture.push(r.gesture);
        v.stillness.push(String(clamp(5 - Math.round(poseDistance(prev, k) / 45), 0, 5)));
        v.leadPart.push(leadPartOf(prev, k, prev.aim, k.aim));
        v.overlap.push(s.overlap);
        if (anyPlanted) {
          const now = k.planted && (k.planted.legR || k.planted.legL) ? "planted" : "free";
          const before = i > 0 && keyed[i - 1].planted ? (keyed[i - 1].planted.legR || keyed[i - 1].planted.legL ? "planted" : "free") : now;
          v.limbPlanted.push(now !== before ? "switches" : now);
        }
      });
      if (api.toShelf) api.toShelf("Rig", v);
      else $("#rig-send-note").textContent = "The Shelf is not available here.";
    });

    /* ---- performer: keyboard and Web MIDI ---- */
    function nudge(slot, delta) {
      const j = s.perf.map[slot];
      s.pose.rel[j] = wrap((s.pose.rel[j] || 0) + delta);
    }
    function onKey(ev) {
      if (!el.isConnected) {
        document.removeEventListener("keydown", onKey);
        return;
      }
      if (!s.perf.on) return;
      const tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (ev.key >= "1" && ev.key <= "4") {
        s.perf.active = Number(ev.key) - 1;
        drawChrome();
        render();
      } else if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
        nudge(s.perf.active, ev.key === "ArrowUp" ? -5 : 5);
        render();
        save();
      } else return;
      ev.preventDefault();
    }
    /* One key listener per tool: a fresh draw removes the last one (and the old page it holds). */
    if (prevKeyOff) prevKeyOff();
    prevKeyOff = () => document.removeEventListener("keydown", onKey);
    document.addEventListener("keydown", onKey);
    $("#rig-perf-on").addEventListener("change", (e) => {
      s.perf.on = e.target.checked;
      save();
      render();
    });
    function onMidi(msg) {
      if (!el.isConnected || !s.perf.on) return;
      const d = msg.data || [];
      if ((d[0] & 0xf0) !== 0xb0) return; /* control change only */
      const slot = s.perf.cc.indexOf(d[1]);
      if (slot < 0) return;
      const j = s.perf.map[slot];
      s.pose.rel[j] = wrap(NEUTRAL.rel[j] + (d[2] / 127 - 0.5) * 180);
      s.perf.active = slot;
      render();
      save();
    }
    $("#rig-midi").addEventListener("click", () => {
      if (!navigator.requestMIDIAccess) {
        midiNote = "This browser has no Web MIDI. Use keys 1 to 4 and the arrow keys.";
        drawChrome();
        return;
      }
      navigator.requestMIDIAccess().then(
        (access) => {
          let n = 0;
          access.inputs.forEach((input) => {
            input.onmidimessage = onMidi;
            n++;
          });
          midiNote = n ? `MIDI: listening on ${n} input${n > 1 ? "s" : ""}. CCs ${s.perf.cc.join(", ")} drive slots 1 to 4.` : "MIDI is allowed but no input is plugged in. Keys 1 to 4 and arrows still work.";
          s.perf.on = true;
          save();
          drawChrome();
        },
        () => {
          midiNote = "MIDI access was refused. Keys 1 to 4 and arrows still work.";
          drawChrome();
        }
      );
    });

    /* ---- board ---- */
    $("#rig-send").addEventListener("click", () => {
      let keyed = filledKeys().map((x) => x.k);
      if (!keyed.length) keyed = [snapshot()];
      const whoMoves = [];
      const characterSpeed = [];
      const characterToLens = [];
      keyed.forEach((k, i) => {
        const other = keyed.length > 1 ? keyed[i > 0 ? i - 1 : 1] : NEUTRAL;
        const d = poseDistance(other, k);
        whoMoves.push(d > 30 ? "speaker" : "neither");
        characterSpeed.push(clamp(1 + Math.round(d / 60), 1, 5));
        const r = read(k, null);
        characterToLens.push(r.leanPx > 8 ? "toward" : r.leanPx < -8 ? "away" : "across");
      });
      api.toBoard("Rig", { whoMoves, characterSpeed, characterToLens });
    });

    /* ---- automation: posture, gesture, stillness and leadPart pick pose presets live ---- */
    const AUTO_POSE = {
      posture: (v) => ({ open: "triumphant", neutral: "neutral", closed: "slump" })[v],
      gesture: (v) => {
        const n = Number(v);
        return n <= 0 ? "neutral" : n === 1 ? "shrug" : n <= 3 ? "point" : "reach";
      },
      stillness: (v) => ["recoil", "reach", "shrug", "point", "slump", "neutral"][clamp(Math.round(Number(v)), 0, 5)],
      leadPart: (v) => v, /* applied as a modifier on the current pose */
    };
    const lastAuto = {};
    function applyLead(v) {
      if (v === "eyes") {
        s.aim.on = true;
        s.aim.kind = "point";
        s.aim.x = 360;
        s.aim.y = 110;
      } else if (v === "head") s.pose.rel.neck = wrap((s.pose.rel.neck || 0) + 18);
      else if (v === "hips") s.pose.root.x = clamp(s.pose.root.x + 14, 60, 340);
      else if (v === "hands") s.pose = presetPose("point");
    }
    function applyAuto(id, v) {
      if (v == null || String(lastAuto[id]) === String(v)) return false;
      lastAuto[id] = v;
      if (playing || cycle) stop();
      if (id === "leadPart") {
        applyLead(v);
        return true;
      }
      const name = AUTO_POSE[id](v);
      if (!name || !PRESETS[name]) return false;
      const root = s.pose.root;
      s.pose = presetPose(name);
      s.pose.root = Object.assign({}, s.pose.root, { x: root.x });
      return true;
    }
    const suiteOn = {};
    if (window.CurioAuto && window.CurioAuto.on) {
      /* One listener per tool: a fresh draw lets go of the last one (and the old page it holds). */
      if (prevAutoOff) prevAutoOff();
      prevAutoOff = () => off();
      const off = window.CurioAuto.on((type, d) => {
        if (!el.isConnected || !svg.isConnected) return off();
        const badge = $("#rig-autobadge");
        if (type === "change") {
          const run = window.CurioAuto.running().filter((k) => k.startsWith("c:") && AUTO_POSE[k.slice(2)]);
          if (badge) {
            badge.hidden = !run.length;
            badge.textContent = run.length ? "automated: " + run.map((k) => k.slice(2)).join(", ") : "automated";
          }
          Object.keys(lastAuto).forEach((id) => !run.includes("c:" + id) && delete lastAuto[id]);
          return;
        }
        if (type !== "tick" || !d || !d.ms) return;
        const panel = (d.panels && d.panels[0]) || {};
        let dirty = false;
        const run = [];
        Object.keys(AUTO_POSE).forEach((id) => {
          if (d.ms["c:" + id] == null) return;
          run.push(id);
          if (applyAuto(id, panel[id])) dirty = true;
        });
        Object.keys(d.ms).forEach((key) => {
          if (!key.startsWith("s:")) return;
          const on = d.ms[key] >= 0.5;
          if (on && !suiteOn[key]) {
            const suite = (typeof SUITES !== "undefined" ? SUITES : []).find((x) => x.id === key.slice(2));
            if (suite && suite.set)
              Object.keys(AUTO_POSE).forEach((id) => {
                if (suite.set[id] != null && !run.includes(id)) {
                  delete lastAuto[id];
                  if (applyAuto(id, suite.set[id])) dirty = true;
                }
              });
          }
          suiteOn[key] = on;
        });
        if (badge) {
          badge.hidden = !run.length;
          if (run.length) badge.textContent = "automated: " + run.join(", ");
        }
        if (dirty) render();
      });
    }

    drawChrome();
    render();
  }

  window.CuriosityStudio.register({
    id: "rig",
    label: "Rig & pose",
    order: 37,
    maya: "Skeletons and joints, IK and FK, constraints (aim, point, parent), HumanIK, character sets",
    draw,
  });
})();
