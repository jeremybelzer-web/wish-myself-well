/* rig/camera.js: the Camera add-on for the 3D view (CurioRig.extend).

   The 3D view's camera follows the app's camera curiosities, so a curiosity lane on the timeline frames the
   shot: Shot size (insert, close, medium, wide), Angle height (floor, low, eye, high, overhead), Lens length
   (wide, normal, long: the field of view and how far back the camera must stand) and Dutch / level (the
   horizon tilts), plus three sliders of the lens cameraLensLens in data/db-maya.js: Wide or long, Shake and
   Dark corners. Framing aims at the character: close is head and shoulders, medium is waist up, wide is the
   whole body with room, insert is a hand (or the tip, for an object, or a front foot, for an animal). With more
   than one actor (rig/staging.js), wide keeps everyone and the closer shots are on actor 1, or on the actor the
   staging names in ctx.data("camera").subject (the Screen's Who it frames lane, shotSize.who).

   In Maya: camera attributes (Focal Length, Angle of View, Film Back), framing a shot, the Camera Sequencer.

   The panel has "Camera follows the curiosities" (off: drag to turn around it, as before) and "Snapshot",
   which saves the frame as a PNG. When the toggle has never been touched, the camera follows by itself as
   soon as the timeline drives any of these sliders. */
(function () {
  if (!window.CurioRig || typeof window.CurioRig.extend !== "function") return;

  const SHOTS = ["insert", "close", "medium", "wide"];
  const HEIGHTS = ["floor", "low", "eye", "high", "overhead"];
  const LENSES = ["wide", "normal", "long"];
  /* the lens in millimeters at wide, normal and long, on a 24 mm high frame (a full-frame still camera) */
  const MM = [24, 40, 85];
  const FRAME_MM = 24;
  const TILT = 15; /* degrees the horizon leans when tilted */
  const CAMERA_IDS = ["shotSize", "angleHeight", "lensLength", "dutch", "cameraLensLens.length", "cameraLensLens.shake", "cameraLensLens.vignette"];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const DEG = Math.PI / 180;
  const base = new WeakMap(); /* camera -> its own field of view, given back when following stops */
  let lastInfo = null;

  /* The timeline's values for this view, when the Screen drives it. */
  function timeline(ctx) {
    const c = window.CurioRig.current && window.CurioRig.current();
    return c && c.ctx === ctx && typeof c.timeline === "function" ? c.timeline() : {};
  }
  function following(ctx) {
    const p = ctx.prefs.camera || {};
    if (p.follow === true) return true;
    if (p.follow === false) return false;
    const tl = timeline(ctx);
    return CAMERA_IDS.some((id) => tl[id] != null);
  }
  /* Two sliders say how long the lens is (the catalog's Lens length and the lens's Wide or long). The panel
     keeps them together; the timeline wins, the lens's own lane first. */
  function lensValue(ctx) {
    const tl = timeline(ctx);
    if (tl["cameraLensLens.length"] != null) return tl["cameraLensLens.length"];
    if (tl.lensLength != null) return tl.lensLength;
    return ctx.val("cameraLensLens.length");
  }
  const mmAt = (v) => (v <= 0.5 ? MM[0] * Math.pow(MM[1] / MM[0], v / 0.5) : MM[1] * Math.pow(MM[2] / MM[1], (v - 0.5) / 0.5));
  const pos = (THREE, b) => b.getWorldPosition(new THREE.Vector3());

  /* ---------- what each shot size keeps in the frame ---------- */
  function boxOf(THREE, pts, pad) {
    const b = new THREE.Box3();
    pts.forEach((p) => b.expandByPoint(p));
    if (pad) b.expandByScalar(pad);
    return b;
  }
  /* Who a close-up or medium shot is on: actor 1 (the view's own character), or the actor the staging add-on
     names in ctx.data("camera").subject (the Screen's Who it frames lane, rig/staging.js). A wide shot keeps
     everyone (data.box is the whole group then). */
  function subjectOf(ctx) {
    const s = ctx.data("camera").subject;
    return s && s.model && s.rig && s.bones ? s : ctx;
  }
  /* A box for each of the four shot sizes, in the scene's units, from where the joints are right now. */
  function shotBoxes(ctx) {
    const THREE = ctx.THREE;
    const d = ctx.data("camera");
    const whole = d.box ? d.box.clone() : new THREE.Box3(new THREE.Vector3(-0.4, 0, -0.4), new THREE.Vector3(0.4, 1.7, 0.4));
    const H = Math.max(0.3, whole.max.y - whole.min.y);
    const L = Math.max(H, whole.max.x - whole.min.x, whole.max.z - whole.min.z);
    const wide = whole.clone().expandByScalar(L * 0.08);
    const sub = subjectOf(ctx);
    const r = sub.rig;
    const out = { wide, medium: wide, close: wide, insert: wide };
    if (!r || !sub.model) return out;
    const up = (p, h) => p.clone().add(new THREE.Vector3(0, h, 0));
    const last = (list) => list[list.length - 1];
    if (r.object) {
      const chain = sub.bones.slice();
      const tip = r.head ? pos(THREE, r.head) : up(whole.getCenter(new THREE.Vector3()), H / 2);
      const n = chain.length;
      const top = (from) => chain.slice(from).map((b) => pos(THREE, b)).concat([tip]);
      out.medium = boxOf(THREE, top(Math.floor(n * 0.4)), H * 0.14);
      out.close = boxOf(THREE, top(Math.max(0, n - 2)), H * 0.12);
      out.insert = boxOf(THREE, [tip], H * 0.08);
      return out;
    }
    if (!r.head) return out;
    const head = pos(THREE, r.head);
    const headTop = d.headTop != null && sub === ctx ? d.headTop : H * 0.1;
    if (r.quadruped) {
      const neck = r.neck.length ? pos(THREE, r.neck[0]) : head;
      const chest = r.chest ? pos(THREE, r.chest) : neck;
      const foot = r.arms.L.length ? pos(THREE, last(r.arms.L)) : r.legs.L.length ? pos(THREE, last(r.legs.L)) : head;
      out.close = boxOf(THREE, [head, neck, up(head, headTop)], L * 0.08);
      out.medium = boxOf(THREE, [head, neck, chest, up(head, headTop)].concat(r.arms.L.length ? [pos(THREE, r.arms.L[0])] : []), L * 0.1);
      out.insert = boxOf(THREE, [foot], L * 0.07);
      return out;
    }
    const top = up(head, headTop + H * 0.03);
    const shoulders = ["L", "R"].filter((s) => r.arms[s].length).map((s) => pos(THREE, r.arms[s][0]));
    const sh = shoulders.length ? shoulders : [r.chest ? pos(THREE, r.chest) : up(head, -H * 0.12)];
    const shY = sh.reduce((a, p) => a + p.y, 0) / sh.length;
    const below = (y) => sh.map((p) => new THREE.Vector3(p.x, y, p.z));
    out.close = boxOf(THREE, [head, top].concat(below(shY - H * 0.1)), H * 0.035);
    const hipY = r.hips ? pos(THREE, r.hips).y : head.y - H * 0.45;
    out.medium = boxOf(THREE, [head, top].concat(sh, below(hipY - H * 0.04)), H * 0.05);
    const handArm = r.arms.R.length ? r.arms.R : r.arms.L;
    /* the hand reaches past the wrist joint: aim a little further along the forearm */
    let hand = head;
    if (handArm.length) {
      hand = pos(THREE, last(handArm));
      if (handArm.length > 1) hand.add(hand.clone().sub(pos(THREE, handArm[handArm.length - 2])).multiplyScalar(0.25));
    }
    out.insert = boxOf(THREE, [hand], H * 0.08);
    return out;
  }
  /* The frame for a slider position between two shot sizes: the boxes blended. */
  function shotFrame(ctx, v) {
    const THREE = ctx.THREE;
    const boxes = shotBoxes(ctx);
    const t = clamp(v, 0, 1) * (SHOTS.length - 1);
    const i = Math.min(SHOTS.length - 2, Math.floor(t));
    const f = t - i;
    const a = boxes[SHOTS[i]];
    const b = boxes[SHOTS[i + 1]];
    const sa = a.getSize(new THREE.Vector3());
    const sb = b.getSize(new THREE.Vector3());
    return { center: a.getCenter(new THREE.Vector3()).lerp(b.getCenter(new THREE.Vector3()), f), height: lerp(sa.y, sb.y, f), across: lerp(Math.max(sa.x, sa.z), Math.max(sb.x, sb.z), f) };
  }

  /* ---------- where the camera goes ---------- */
  function aimFor(ctx) {
    const THREE = ctx.THREE;
    const cam = ctx.camera;
    const fr = shotFrame(ctx, ctx.val("shotSize"));
    const mm = mmAt(clamp(lensValue(ctx), 0, 1));
    const fov = 2 * Math.atan(FRAME_MM / 2 / mm);
    const tanV = Math.tan(fov / 2);
    const tanH = tanV * (cam.aspect || 1.5);
    /* far enough back that the frame fits both ways, plus half its depth so the camera is not inside it */
    const dist = Math.max(fr.height / 2 / tanV, fr.across / 2 / tanH) + fr.across / 2;
    /* how high the camera stands: an angle up or down to the middle of the frame; eye height is the head's */
    let eye = 0;
    const r = subjectOf(ctx).rig;
    if (r && r.head && !r.object) eye = Math.asin(clamp((pos(THREE, r.head).y - fr.center.y) / dist, -0.6, 0.6));
    const ELEV = [-40 * DEG, -22 * DEG, eye, 30 * DEG, 80 * DEG];
    const hv = clamp(ctx.val("angleHeight"), 0, 1) * (ELEV.length - 1);
    const hi = Math.min(ELEV.length - 2, Math.floor(hv));
    const elev = lerp(ELEV[hi], ELEV[hi + 1], hv - hi);
    const roll = clamp(ctx.val("dutch"), 0, 1) * TILT * DEG;
    return { center: fr.center, dist, elev, fov: fov / DEG, roll, mm };
  }

  /* the words for what the frame is doing now */
  function describe(ctx, a) {
    const word = (v, list) => list[Math.round(clamp(v, 0, 1) * (list.length - 1))];
    return `${word(ctx.val("shotSize"), SHOTS)} shot, ${word(lensValue(ctx), LENSES)} lens (${Math.round(a.mm)} mm), camera ${word(ctx.val("angleHeight"), ["on the floor", "low", "at eye height", "high", "overhead"])}, horizon ${ctx.val("dutch") > 0.5 ? "tilted" : "level"}`;
  }

  /* ---------- the picture: dark corners and a snapshot ---------- */
  function vignetteCss(v) {
    if (v <= 0.01) return "";
    return `radial-gradient(ellipse at center, rgba(0, 0, 0, 0) ${Math.round(70 - 30 * v)}%, rgba(0, 0, 0, ${(0.75 * v).toFixed(2)}) 100%)`;
  }
  function snapshot(ctx) {
    const src = ctx.renderer.domElement;
    const out = document.createElement("canvas");
    out.width = src.width;
    out.height = src.height;
    const g = out.getContext("2d");
    ctx.renderer.render(ctx.scene, ctx.camera);
    g.drawImage(src, 0, 0);
    const v = ctx.val("cameraLensLens.vignette");
    if (v > 0.01) {
      const w = out.width;
      const h = out.height;
      const grad = g.createRadialGradient(w / 2, h / 2, (Math.hypot(w, h) / 2) * (0.7 - 0.3 * v), w / 2, h / 2, Math.hypot(w, h) / 2);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${0.75 * v})`);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }
    return out.toDataURL("image/png");
  }
  function download(url, name) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  window.CurioRig.extend({
    id: "camera",
    label: "Camera",
    sliders: [
      { id: "shotSize", lens: "shotSize", label: "Shot size", scale: SHOTS, start: 2 },
      { id: "angleHeight", lens: "angleHeight", label: "Angle height", scale: HEIGHTS, start: 2 },
      { id: "lensLength", lens: "lensLength", label: "Lens length", scale: LENSES, start: 1 },
      { id: "dutch", lens: "dutch", label: "Horizon level or tilted", scale: ["level", "tilted"], start: 0 },
      { id: "cameraLensLens.length", lens: "cameraLensLens", group: "The camera lens", label: "Wide or long", scale: LENSES, start: 1 },
      { id: "cameraLensLens.shake", lens: "cameraLensLens", group: "The camera lens", label: "Shake", scale: ["none", "barely", "a little", "clear", "strong", "violent"], start: 0 },
      { id: "cameraLensLens.vignette", lens: "cameraLensLens", group: "The camera lens", label: "Dark corners", scale: ["none", "subtle", "heavy"], start: 0 },
    ],
    setup(ctx) {
      if (!base.has(ctx.camera)) base.set(ctx.camera, ctx.camera.fov);
      const view = ctx.renderer.domElement.parentElement;
      if (view && !view.querySelector("[data-cam-vignette]")) {
        if (getComputedStyle(view).position === "static") view.style.position = "relative";
        const o = document.createElement("div");
        o.dataset.camVignette = "";
        o.style.cssText = "position:absolute;left:0;top:0;width:100%;height:0;pointer-events:none;border-radius:.4rem";
        view.appendChild(o);
      }
    },
    built(ctx) {
      const THREE = ctx.THREE;
      const d = ctx.data("camera");
      ctx.model.updateMatrixWorld(true);
      d.box = new THREE.Box3().setFromObject(ctx.model);
      const r = ctx.rig;
      const H = d.box.max.y - d.box.min.y;
      d.headTop = r && r.head && !r.object ? clamp(d.box.max.y - pos(THREE, r.head).y, 0.02, H * 0.25) : null;
      d.now = null;
    },
    panel(ctx) {
      const on = following(ctx);
      return `<h4 title="In Maya: camera attributes (Focal Length, Angle of View) and the Camera Sequencer">Camera</h4>
        <p class="cap">The camera can frame the shot from the camera curiosities above: how much of the body, how high, which lens, a tilted horizon. A camera lane on the timeline turns this on by itself.</p>
        <label class="rig-rule" title="In Maya: looking through a shot camera instead of the free perspective view"><input type="checkbox" data-cam="follow"${on ? " checked" : ""}> <b>Camera follows the curiosities</b> <small>Off: drag to turn around it and scroll to zoom, as before. On: you can still drag to walk around the shot.</small></label>
        <p class="cap" data-cam="now"></p>
        <button type="button" data-cam="snap" title="In Maya: Playblast or Render one frame">Snapshot</button> <small>Saves this frame as a picture (PNG).</small>`;
    },
    wire(ctx, box) {
      box.querySelector('[data-cam="follow"]').addEventListener("change", (e) => {
        ctx.prefs.camera = Object.assign({}, ctx.prefs.camera, { follow: e.target.checked });
        ctx.save();
      });
      box.querySelector('[data-cam="snap"]').addEventListener("click", () => {
        const word = SHOTS[Math.round(clamp(ctx.val("shotSize"), 0, 1) * 3)];
        download(snapshot(ctx), `curiomatic-${following(ctx) ? word + "-shot" : "view"}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`);
        ctx.status("Snapshot saved");
      });
      /* the two lens-length sliders move together */
      const pair = { lensLength: "cameraLensLens.length", "cameraLensLens.length": "lensLength" };
      if (ctx.el.dataset.camPair) return;
      ctx.el.dataset.camPair = "1";
      ctx.el.addEventListener("input", (e) => {
        const id = e.target.dataset && e.target.dataset.slider;
        if (!pair[id]) return;
        const other = ctx.el.querySelector(`[data-slider="${pair[id]}"]`);
        if (!other || other.disabled) return;
        other.value = e.target.value;
        ctx.prefs.values[pair[id]] = ctx.prefs.values[id];
        const w = other.closest(".rig-row") && other.closest(".rig-row").querySelector("[data-word]");
        if (w) w.textContent = LENSES[Math.round(Number(e.target.value))];
        ctx.save();
      });
    },
    beforeRender(ctx, dt) {
      const cam = ctx.camera;
      const box = ctx.el.querySelector('[data-ext="camera"]');
      const on = !!ctx.model && following(ctx);
      const tick = box && box.querySelector('[data-cam="follow"]');
      if (tick && ctx.model && tick.checked !== on) tick.checked = on;
      const nowEl = box && box.querySelector('[data-cam="now"]');
      /* dark corners, over the 3D view */
      const ov = ctx.el.querySelector("[data-cam-vignette]");
      if (ov) {
        const h = ctx.renderer.domElement.clientHeight + "px";
        if (ov.style.height !== h) ov.style.height = h;
        const css = vignetteCss(ctx.val("cameraLensLens.vignette"));
        if (ov.dataset.css !== css) {
          ov.dataset.css = css;
          ov.style.backgroundImage = css || "none";
        }
      }
      const d = ctx.data("camera");
      if (!on) {
        const f = base.get(cam) || 35;
        if (cam.fov !== f) {
          cam.fov = f;
          cam.updateProjectionMatrix();
        }
        d.now = null;
        lastInfo = { follow: false, fov: cam.fov };
        if (nowEl && nowEl.textContent) nowEl.textContent = "";
        return;
      }
      const want = aimFor(ctx);
      /* glide to the new frame in about a quarter of a second, so a change on the timeline reads as a move */
      if (!d.now) d.now = { center: want.center.clone(), dist: want.dist, elev: want.elev, fov: want.fov, roll: want.roll };
      else {
        const k = 1 - Math.exp(-(dt || 1 / 60) * 10);
        d.now.center.lerp(want.center, k);
        ["dist", "elev", "fov", "roll"].forEach((n) => (d.now[n] = lerp(d.now[n], want[n], k)));
      }
      const n = d.now;
      /* the orbit still says which side the camera is on, so dragging walks around the shot */
      const yaw = Math.atan2(cam.position.x, cam.position.z);
      const ce = Math.cos(n.elev);
      cam.position.set(n.center.x + Math.sin(yaw) * ce * n.dist, n.center.y + Math.sin(n.elev) * n.dist, n.center.z + Math.cos(yaw) * ce * n.dist);
      if (cam.position.y < 0.05) cam.position.y = 0.05;
      if (Math.abs(cam.fov - n.fov) > 1e-4) {
        cam.fov = n.fov;
        cam.updateProjectionMatrix();
      }
      cam.lookAt(n.center);
      cam.rotateZ(n.roll);
      const shake = ctx.val("cameraLensLens.shake");
      if (shake > 0.001) {
        const t = ctx.clock;
        const amp = shake * 1.6 * DEG;
        cam.rotateX(amp * (Math.sin(t * 13.1) * 0.6 + Math.sin(t * 29.7 + 1.3) * 0.4));
        cam.rotateY(amp * (Math.sin(t * 11.3 + 2.1) * 0.6 + Math.sin(t * 23.9 + 0.4) * 0.4));
      }
      cam.updateMatrixWorld(true);
      const sub = subjectOf(ctx);
      lastInfo = { follow: true, fov: n.fov, mm: want.mm, roll: n.roll / DEG, elev: n.elev / DEG, dist: n.dist, center: n.center.toArray(), want: want.center.toArray(), on: sub !== ctx && sub.actor ? sub.actor.name || "" : "" };
      const text = "Now: " + describe(ctx, want) + ".";
      if (nowEl && nowEl.textContent !== text) nowEl.textContent = text;
    },
  });

  /* for tests and other tools: what the camera did on the last frame, and a picture of the frame */
  window.CurioRigCamera = {
    info: () => (lastInfo ? JSON.parse(JSON.stringify(lastInfo)) : null),
    snapshot: () => {
      const c = window.CurioRig.current && window.CurioRig.current();
      return c && c.ctx && c.ctx.renderer ? snapshot(c.ctx) : "";
    },
  };
})();
