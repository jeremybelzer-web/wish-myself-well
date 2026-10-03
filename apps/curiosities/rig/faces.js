/* rig/faces.js: "Face and feelings", an add-on for the 3D characters view (CurioRig.extend).

   Emotion is one of the app's biggest curiosities (every character has an emotional road), and comedy lives in
   faces too. This add-on gives every 3D character a face that shows a feeling, and lets the body join in.

   Sliders (each one a curiosity, so it can be automated from the timeline like any other):
   - Happy, Sad, Angry, Scared, Surprised, Disgusted (feelingFaceLens in data/db-emotion.js), mixed in any amount
   - How big the face goes: blank, subtle, clear, big, extreme (a cartoon take) (faceLens.expression)
   - Blinks: never .. all the time (faceLens.blinks, 0 to 5 on the timeline)
   - Where the eyes look: ahead, left, right (as you look at the character's front), up, down, at the camera
     (feelingFaceLens.look). Only the eyes move; Movement rules' "Where the eyes go" turns the head.

   Following the film: when the Screen is open, the face also follows the Emotion lanes at the playhead, the
   film's emotional road: the feeling of the beat (emotion: joyful, melancholy, fearful...), how bad or good it
   is (emotion.valence), the strength of the feeling (emotionIntensity), the facial expression (faceIntensity),
   how much the character shows (emoShown) and where they are on their road (emoRoadCharacter). It reads the
   character track the Screen's 3D panel shows (CurioRigScreen.shown()), else the first character track with
   that lane, else the film's own track (Master). Each feeling is the larger of its slider and the film's.
   "Follow the film's feelings" turns this off (prefs.faceFilm).

   How the face is made:
   - A character with blend shapes (morph targets) whose names match (smile, frown, blink, jawOpen, mouthOpen,
     browUp, browDown, sneer, eyeWide, or the feeling names themselves) is moved through them. No face is drawn.
   - Everything else (the Plain figure, Cesium Man, the Fox, made-from-words characters, objects) gets a simple
     drawn face hung on the head joint (on an object, its tip): two eyes (white, a pupil and a shine), two brows
     and a mouth. The brows tilt and lift, the eyes widen, narrow and blink, the pupils look, and the mouth is
     one shape whose corners curve up or down, opens, stretches and lifts on one side. Each part is placed by
     casting a ray at the front of the head, so it sits on the face (or on a beard or a mask) wherever it is.
   - Made from words (rig/maker.js): the maker hangs its own head ball and two dark eyes on the head joint.
     This add-on hides the maker's eyes (and puts them back when the face is turned off) so the eyes never
     double up. It finds them by a flag first: mesh.userData.face === "eye" (eyes) and "head" (the head ball);
     without the flags, a small dark sphere with userData.made on the head joint is an eye, and the first sphere
     hung there is the head. Anything flagged userData.face === "mouth" or "brow" is hidden the same way. Every
     part this add-on makes carries userData.faceMade = true.
   Body: sad sinks the head and rolls the shoulders forward; scared pulls the arms in and hunches with a small
   tremble; happy bounces; angry leans in; surprised pulls the head back; disgust turns the head away. Small
   turns after every other rule (afterRules), off with "The body joins in" (prefs.faceBody).

   window.CurioRigFaces = { state(ctx), blink(ctx), film(ctx), MORPHS } for tests and other tools. */
(function () {
  const R = window.CurioRig;
  if (!R || !R.extend) return;
  const F = "feelingFaceLens.";
  const AMOUNT = ["not at all", "a little", "clearly", "very"];
  const FEELINGS = ["happy", "sad", "angry", "scared", "surprised", "disgust"];
  const SLIDERS = [
    { id: F + "happy", lens: "feelingFaceLens", label: "Happy", scale: AMOUNT, start: 0 },
    { id: F + "sad", lens: "feelingFaceLens", label: "Sad", scale: AMOUNT, start: 0 },
    { id: F + "angry", lens: "feelingFaceLens", label: "Angry", scale: AMOUNT, start: 0 },
    { id: F + "scared", lens: "feelingFaceLens", label: "Scared", scale: AMOUNT, start: 0 },
    { id: F + "surprised", lens: "feelingFaceLens", label: "Surprised", scale: AMOUNT, start: 0 },
    { id: F + "disgust", lens: "feelingFaceLens", label: "Disgusted", scale: AMOUNT, start: 0 },
    { id: "faceLens.expression", lens: "faceLens", label: "How big the face goes", scale: ["blank", "subtle", "clear", "big", "extreme"], start: 2 },
    { id: "faceLens.blinks", lens: "faceLens", label: "Blinks", scale: ["never", "rarely", "now and then", "often", "a lot", "all the time"], start: 2 },
    { id: F + "look", lens: "feelingFaceLens", label: "Where the eyes look", scale: ["ahead", "left", "right", "up", "down", "at the camera"], start: 0 },
  ];
  /* how big: blank .. extreme (a cartoon take goes past real faces) */
  const SIZE = [0.12, 0.5, 1, 1.4, 1.9];
  /* blinks a minute for each step */
  const BLINKS = [0, 6, 14, 24, 40, 60];
  /* The film's feeling of the beat as a face (the Emotion of the beat curiosity's words). */
  const BEAT = {
    loving: { happy: 0.6 },
    joyful: { happy: 1 },
    curious: { surprised: 0.35, happy: 0.2 },
    melancholy: { sad: 0.9 },
    anxious: { scared: 0.6, sad: 0.25 },
    fearful: { scared: 1 },
    angry: { angry: 1 },
    triumphant: { happy: 1, surprised: 0.2 },
    absurd: { surprised: 0.7, happy: 0.35 },
    dreamlike: { happy: 0.25, sad: 0.1 },
  };
  const ROAD = { "lowest point": { sad: 0.9 }, falling: { sad: 0.45 }, steady: {}, rising: { happy: 0.4 }, "highest point": { happy: 0.85 } };
  const SHOWN = { "fully hidden": 0.2, "mostly hidden": 0.45, "leaks out": 0.7, "mostly shown": 1, "fully shown": 1.25 };
  /* Blend shape names, matched loosely (ARKit, Mixamo, VRM and plain names). */
  const MORPHS = [
    ["smile", /smile|happy|joy|^fun$/i],
    ["frown", /frown|sorrow|^sad$/i],
    ["open", /jaw.?open|mouth.?open|^open$|^aa?$|mouth_?a$/i],
    ["blinkL", /(blink|eyes?.?clos\w*|close).*(_l|left|\.l|l)$/i],
    ["blinkR", /(blink|eyes?.?clos\w*|close).*(_r|right|\.r|r)$/i],
    ["blink", /blink|eyes?.?clos|^close$/i],
    ["wide", /eye.?wide|eyes?.?open|wide/i],
    ["browUp", /brow.*(up|rais)|brow.?inner.?up/i],
    ["browDown", /brow.*(down|lower)|^angry$|anger/i],
    ["sneer", /sneer|disgust/i],
    ["surprised", /surpris|shock/i],
    ["scared", /fear|scared|afraid/i],
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const D = (ctx) => ctx.data("faces");
  const on = (ctx, k) => ctx.prefs[k] !== false;

  /* ---------- the film's emotional road, at the playhead ---------- */
  function filmFeeling(ctx) {
    const E = window.CurioEngine;
    const S = window.CurioScreen;
    if (!E || !S || !S.isOpen || !S.isOpen() || !S.row) return null;
    let st = null;
    try {
      st = E.state();
    } catch (e) {
      return null;
    }
    const r = st && st.rows && st.rows[S.row()];
    if (!r) return null;
    const tracks = st.tracks || [];
    const inScreen = ctx.el && ctx.el.closest && ctx.el.closest('[data-panel="rig3d"]');
    const shown = inScreen && window.CurioRigScreen && window.CurioRigScreen.shown ? window.CurioRigScreen.shown() : null;
    let from = "";
    const read = (id) => {
      const has = (t) => (t.curiosities || []).includes(id) && st.lanes && !(st.lanes[t.id + "|" + id] && st.lanes[t.id + "|" + id].on === false);
      const t = (shown && tracks.find((x) => x.id === shown && has(x))) || tracks.find((x) => x.kind === "character" && has(x)) || tracks.find(has);
      if (!t) return null;
      let v = null;
      try {
        v = E.value(r.id, t.id, id);
      } catch (e) {}
      if (v == null || v === "") return null;
      if (!from || t.kind === "character") from = t.kind === "character" ? t.label || "this character" : "the film";
      return v;
    };
    const w = {};
    const add = (o, k) => Object.keys(o).forEach((f) => (w[f] = Math.max(w[f] || 0, o[f] * (k == null ? 1 : k))));
    const word = read("emotion");
    const said = [];
    if (BEAT[word]) add(BEAT[word]), said.push(word);
    else {
      const val = Number(read("emotion.valence"));
      if (isFinite(val) && val) add(val > 0 ? { happy: val / 5 } : { sad: -val / 5 }), said.push(val > 0 ? "a good feeling" : "a bad feeling");
    }
    const road = read("emoRoadCharacter");
    if (ROAD[road] && !said.length) add(ROAD[road]), said.push(road + " on the road");
    let size = 1;
    const strong = Number(read("emotionIntensity"));
    const face = Number(read("faceIntensity"));
    const k = Math.max(isFinite(strong) ? strong : -1, isFinite(face) ? face : -1);
    if (k >= 0) {
      size *= 0.35 + clamp(k, 0, 5) * 0.17;
      said.push(["barely there", "faint", "mild", "clear", "strong", "overwhelming"][Math.round(clamp(k, 0, 5))]);
    }
    const shownWord = read("emoShown");
    if (SHOWN[shownWord]) (size *= SHOWN[shownWord]), said.push(shownWord);
    if (!said.length) return null;
    return { w, size, said: said.join(", "), from: from || "the film" };
  }

  /* ---------- what the face should do now ---------- */
  function target(ctx) {
    const d = D(ctx);
    const w = {};
    FEELINGS.forEach((f) => (w[f] = clamp(ctx.val(F + f) || 0, 0, 1)));
    let size = SIZE[Math.round(clamp(ctx.val("faceLens.expression"), 0, 1) * 4)];
    if (on(ctx, "faceFilm")) {
      if (!d.filmAt || Math.abs(ctx.clock - d.filmAt) > 0.15) {
        d.filmAt = ctx.clock;
        d.film = filmFeeling(ctx);
      }
      if (d.film) FEELINGS.forEach((f) => (w[f] = Math.max(w[f], clamp((d.film.w[f] || 0) * d.film.size, 0, 1.3))));
    } else d.film = null;
    const g = (f) => w[f] * size;
    const p = {
      curve: g("happy") * 1 - g("sad") * 0.85 - g("angry") * 0.5 - g("disgust") * 0.35 - g("scared") * 0.2,
      open: g("surprised") * 0.95 + g("scared") * 0.45 + Math.max(0, g("happy") - 0.6) * 0.5 + Math.max(0, g("angry") - 0.7) * 0.4,
      width: 1 + g("happy") * 0.22 + g("scared") * 0.3 - g("surprised") * 0.38 - g("angry") * 0.12 - g("sad") * 0.08,
      side: g("disgust") * 0.7,
      eye: 1 + g("surprised") * 0.45 + g("scared") * 0.4 - g("angry") * 0.38 - g("happy") * 0.22 - g("sad") * 0.18 - g("disgust") * 0.35,
      browUp: g("surprised") * 1 + g("scared") * 0.6 + g("sad") * 0.2 + g("happy") * 0.12 - g("angry") * 0.7 - g("disgust") * 0.45,
      browTilt: g("sad") * 1 + g("scared") * 0.75 - g("angry") * 1.05 - g("disgust") * 0.3,
      browIn: g("angry") * 0.5 + g("scared") * 0.3 + g("disgust") * 0.2,
    };
    p.curve = clamp(p.curve, -1.6, 1.6);
    p.open = clamp(p.open, 0, 1.6);
    p.width = clamp(p.width, 0.45, 1.6);
    p.eye = clamp(p.eye, 0.25, 1.9);
    p.browUp = clamp(p.browUp, -1.2, 1.8);
    p.browTilt = clamp(p.browTilt, -1.5, 1.5);
    return { p, w, size };
  }

  /* ---------- finding the head and the maker's parts ---------- */
  function worldVisible(o) {
    for (let n = o; n; n = n.parent) if (!n.visible) return false;
    return true;
  }
  function headBox(ctx) {
    const T = ctx.THREE;
    const model = ctx.model;
    const head = ctx.rig.head;
    model.updateMatrixWorld(true);
    /* the maker's head ball */
    const spheres = head.children.filter((c) => c.isMesh && c.userData.made && c.geometry && c.geometry.type === "SphereGeometry");
    const ball = head.children.find((c) => c.isMesh && c.userData.face === "head") || spheres.find((c) => !c.userData.hairCap);
    if (ball) {
      const s = ball.getWorldScale(new T.Vector3());
      const r = ball.geometry.parameters.radius;
      return { c: ball.getWorldPosition(new T.Vector3()), rx: r * s.x, ry: r * s.y, made: true };
    }
    /* skinned: the points moved mostly by the head joint, the neck joints or anything below the head joint
       (ears, jaw), at or above the head joint (the Plain figure's head cube hangs on its neck joints) */
    const box = new T.Box3();
    const v = new T.Vector3();
    const hy = head.getWorldPosition(new T.Vector3()).y;
    const quad = ctx.rig.quadruped; /* an animal's snout hangs below its head joint: only the head counts */
    const near = new Set([head].concat(quad ? [] : ctx.rig.neck || []));
    head.traverse((b) => b.isBone && near.add(b));
    model.traverse((o) => {
      if (!o.isSkinnedMesh || !worldVisible(o)) return;
      const ids = new Set(o.skeleton.bones.map((b, i) => (near.has(b) ? i : -1)).filter((i) => i >= 0));
      if (!ids.size) return;
      const g = o.geometry;
      const pos = g.attributes.position;
      const si = g.attributes.skinIndex;
      const sw = g.attributes.skinWeight;
      if (!pos || !si || !sw) return;
      o.skeleton.update(); /* before the first frame is drawn the joint matrices are not filled in yet */
      const step = Math.max(1, Math.floor(pos.count / 20000));
      const get = ["getX", "getY", "getZ", "getW"];
      for (let i = 0; i < pos.count; i += step) {
        let wt = 0;
        for (let k = 0; k < 4; k++) if (ids.has(si[get[k]](i))) wt += sw[get[k]](i);
        if (wt < 0.5) continue;
        v.fromBufferAttribute(pos, i);
        if (o.boneTransform) o.boneTransform(i, v);
        v.applyMatrix4(o.matrixWorld);
        if (v.y < hy - 1e-4 && !ctx.rig.object && !quad) continue;
        box.expandByPoint(v);
      }
    });
    if (!box.isEmpty()) {
      const size = box.getSize(new T.Vector3());
      const c = box.getCenter(new T.Vector3());
      /* a long head (a fox's snout, a lamp's shade) gets a face on its front, sized by its width */
      return { c, rx: Math.max(size.x / 2, 1e-3), ry: Math.max(size.y / 2, 1e-3), front: box.max.z, made: false };
    }
    const H = new T.Box3().setFromObject(model).getSize(new T.Vector3()).y || 1.7;
    const c = head.getWorldPosition(new T.Vector3());
    c.y += H * 0.05;
    return { c, rx: H * 0.06, ry: H * 0.07, made: false };
  }
  /* The maker's eyes (and any flagged face parts): hidden while this face is drawn. */
  function makerParts(ctx, hb) {
    const out = [];
    const T = ctx.THREE;
    ctx.rig.head.children.forEach((c) => {
      if (!c.isMesh || c.userData.faceMade) return;
      const f = c.userData.face;
      if (f === "eye" || f === "mouth" || f === "brow") return out.push(c);
      if (f || !c.userData.made || !c.geometry || c.geometry.type !== "SphereGeometry") return;
      const r = c.geometry.parameters.radius * c.getWorldScale(new T.Vector3()).x;
      const col = c.material && c.material.color;
      const dark = col && col.r + col.g + col.b < 0.35;
      if (dark && r < Math.min(hb.rx, hb.ry) * 0.25) out.push(c);
    });
    return out;
  }

  /* ---------- building the drawn face ---------- */
  function build(ctx) {
    const T = ctx.THREE;
    const d = D(ctx);
    const model = ctx.model;
    const head = ctx.rig.head;
    const hb = headBox(ctx);
    const Rw = Math.min(hb.rx, hb.ry * 1.2);
    const grp = new T.Group();
    grp.name = "face";
    grp.userData.faceMade = true;
    grp.position.copy(hb.c);
    ctx.holder.add(grp);
    grp.updateMatrixWorld(true);
    head.attach(grp);
    grp.updateMatrixWorld(true);
    d.group = grp;
    d.R = Rw;
    d.hb = hb;

    /* where the front of the head is: cast rays from in front at what is drawn there */
    const targets = [];
    model.traverse((o) => o.isMesh && !o.userData.faceMade && worldVisible(o) && targets.push(o));
    d.hidden = makerParts(ctx, hb);
    const hiddenSet = new Set(d.hidden);
    const ray = new T.Raycaster();
    /* the head's own front, right and up, as it is turned now (its rest pose faces +z) */
    const hi = ctx.info && ctx.info.get(head);
    const hq = hi && hi.invRestWorld ? head.getWorldQuaternion(new T.Quaternion()).multiply(hi.invRestWorld) : ctx.holder.getWorldQuaternion(new T.Quaternion());
    const fwd = new T.Vector3(0, 0, 1).applyQuaternion(hq).normalize();
    const right = new T.Vector3(1, 0, 0).applyQuaternion(hq).normalize();
    const up = new T.Vector3(0, 1, 0).applyQuaternion(hq).normalize();
    const reach = Math.max(hb.rx, hb.ry) * 4;
    const spot = (x, y) => {
      const from = hb.c.clone().addScaledVector(right, x * hb.rx).addScaledVector(up, y * hb.ry).addScaledVector(fwd, reach);
      ray.set(from, fwd.clone().negate());
      ray.far = reach + Math.max(hb.rx, hb.ry) * 0.4;
      const hit = ray.intersectObjects(targets, false).find((h) => !hiddenSet.has(h.object));
      let p;
      let n = fwd.clone();
      if (hit) {
        p = hit.point.clone();
        if (hit.face) n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        if (n.dot(fwd) < 0.2) n = fwd.clone();
        n.lerp(fwd, 0.5).normalize();
      } else {
        const z = Math.sqrt(Math.max(0.05, 1 - x * x - y * y));
        p = hb.c.clone().addScaledVector(right, x * hb.rx).addScaledVector(up, y * hb.ry).addScaledVector(fwd, (hb.front != null ? hb.front - hb.c.z : z * Math.max(hb.rx, hb.ry * 0.9)));
      }
      p.addScaledVector(n, Rw * 0.02);
      /* into the face group's own frame */
      const local = grp.worldToLocal(p.clone());
      const gq = grp.getWorldQuaternion(new T.Quaternion()).invert();
      const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), n.clone().applyQuaternion(gq).normalize());
      return { p: local, q, hit: !!hit, depth: hit ? hit.point.clone().sub(hb.c).dot(fwd) : null };
    };
    const sc = 1 / grp.getWorldScale(new T.Vector3()).x;
    const e = Rw * 0.2 * sc; /* eye size, in the group's units */
    const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.45, metalness: 0 }, o || {}));
    const white = mat(0xf7f5ef, { roughness: 0.3 });
    const black = mat(0x141418, { roughness: 0.25 });
    const shine = new T.MeshBasicMaterial({ color: 0xffffff });
    let browColor = 0x2e2119;
    const cap = ctx.rig.head.children.find((c) => c.isMesh && c.userData.hairCap && c.material && c.material.color);
    if (cap) browColor = cap.material.color.clone().multiplyScalar(0.45).getHex(); /* darker than the hair, so they show on it */
    const browMat = mat(browColor, { roughness: 0.8 });
    const mouthMat = mat(0x6e1e26, { roughness: 0.7, side: T.DoubleSide, emissive: 0x1a0406 });
    const lipMat = mat(0xb0565a, { roughness: 0.6, side: T.DoubleSide });
    const tag = (o) => {
      o.traverse((n) => {
        n.userData.faceMade = true;
        n.castShadow = false;
        n.receiveShadow = false;
      });
      return o;
    };
    /* Where the eyes and mouth go. The mouth moves up when the spot below is a hole or far behind the eyes
       (a lamp shade's opening); an animal's mouth is low on its snout. */
    let eyeY = 0.14;
    let mouthY = ctx.rig.quadruped ? -0.7 : -0.42;
    const eyeD = spot(0.38, eyeY).depth;
    for (let i = 0; i < 8 && eyeD != null; i++) {
      const md = spot(0, mouthY).depth;
      if (md != null && md > eyeD - 0.3 * Rw) break;
      mouthY += 0.1;
      if (mouthY > eyeY - 0.38) eyeY = Math.min(0.62, mouthY + 0.38);
    }
    if (ctx.rig.quadruped) {
      /* an animal: the mouth goes just under the tip of the snout, the front-most point below the eyes */
      let best = null;
      for (let y = -0.2; y >= -1.0; y -= 0.05) {
        const dd = spot(0, y).depth;
        if (dd != null && (!best || dd > best.d + 1e-4)) best = { y, d: dd };
      }
      if (best) mouthY = Math.max(-1, best.y - 0.12);
    }
    d.layout = { eyeY, mouthY };
    d.eyes = [-1, 1].map((s) => {
      const at = spot(s * 0.38, eyeY);
      const holder = new T.Group();
      holder.position.copy(at.p);
      holder.quaternion.copy(at.q);
      const eye = new T.Group(); /* scaled for open, wide and blinks */
      holder.add(eye);
      const ball = new T.Mesh(new T.SphereGeometry(e, 20, 14), white);
      ball.scale.z = 0.45;
      eye.add(ball);
      const pupil = new T.Group();
      eye.add(pupil);
      const pu = new T.Mesh(new T.SphereGeometry(e * 0.52, 16, 12), black);
      pu.scale.z = 0.5;
      pu.position.z = e * 0.3;
      pupil.add(pu);
      const sh = new T.Mesh(new T.SphereGeometry(e * 0.14, 8, 6), shine);
      sh.position.set(e * 0.17, e * 0.18, e * 0.52);
      pupil.add(sh);
      grp.add(tag(holder));
      const brow = new T.Mesh(new T.BoxGeometry(e * 1.7, e * 0.34, e * 0.3), browMat);
      let bAt = spot(s * 0.38, eyeY + ((e / sc) * 1.75) / hb.ry);
      if (!bAt.hit || (eyeD != null && bAt.depth < eyeD - 0.15 * Rw)) {
        /* nothing to sit on above the eye (between a fox's ears): hang the brow just over the eye */
        bAt = { p: at.p.clone().add(new T.Vector3(0, e * 1.6, 0).applyQuaternion(at.q)), q: at.q.clone() };
      }
      const bh = new T.Group();
      bh.position.copy(bAt.p);
      bh.quaternion.copy(bAt.q);
      bh.add(brow);
      grp.add(tag(bh));
      return { s, holder, eye, pupil, brow, browHome: bh.position.clone(), browHolder: bh, home: at.p.clone() };
    });
    /* the mouth: one ribbon whose top and bottom edges are curves */
    const N = 18;
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3));
    const idx = [];
    for (let i = 0; i < N; i++) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    geo.setIndex(idx);
    const flat = new Float32Array((N + 1) * 2 * 3);
    for (let i = 2; i < flat.length; i += 3) flat[i] = 1; /* lit from the front, like the face it sits on */
    geo.setAttribute("normal", new T.BufferAttribute(flat, 3));
    const mouth = new T.Mesh(geo, mouthMat);
    mouth.frustumCulled = false;
    const lipGeo = geo.clone();
    lipGeo.setAttribute("position", new T.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3));
    const lip = new T.Mesh(lipGeo, lipMat); /* a thin lower lip under the opening */
    lip.frustumCulled = false;
    const mAt = spot(0, mouthY);
    const mh = new T.Group();
    mh.position.copy(mAt.p);
    mh.quaternion.copy(mAt.q);
    mh.add(mouth);
    mh.add(lip);
    grp.add(tag(mh));
    /* How much the mouth wraps around the head: measured, so it hugs a round head and stays flat on a flat one
       (a box head), instead of sinking its corners into the face. */
    const mw = Rw * (ctx.rig.quadruped ? 0.6 : 0.86);
    const cD = [-1, 1].map((k) => spot((k * mw * 0.6) / hb.rx, mouthY).depth);
    let bend = 0;
    if (mAt.depth != null && cD[0] != null && cD[1] != null) {
      const drop = mAt.depth - (cD[0] + cD[1]) / 2; /* how far the face falls back at the corners */
      bend = clamp((2 * drop) / Math.pow(mw * 0.6, 2), 0, 2 / Math.max(hb.rx, 1e-3)) / sc;
    }
    d.mouth = { mesh: mouth, lip, N, w: mw * sc, t: Rw * 0.075 * sc, bend, holder: mh };
    d.e = e;
    d.spotHits = [d.eyes[0], d.eyes[1]].length;
    d.hidden.forEach((m) => (m.visible = false));
    d.drawn = true;
  }

  function shapeMouth(d, p) {
    const m = d.mouth;
    const N = m.N;
    const pos = m.mesh.geometry.attributes.position;
    const lp = m.lip.geometry.attributes.position;
    const w = m.w * p.width;
    const lift = m.w * 0.3; /* how far the corners move for a full curve */
    const gap = m.w * 0.42 * p.open;
    const t = m.t;
    let hiC = -Infinity;
    let midY = 0;
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * 2 - 1; /* -1 .. 1 across */
      const x = (u * w) / 2;
      const shape = u * u; /* 0 in the middle, 1 at the corners */
      const center = p.curve * lift * (shape - 0.35) + p.side * lift * 0.9 * Math.max(0, u) * shape;
      const round = Math.sqrt(Math.max(0, 1 - shape)); /* an open mouth is round, closed at the corners */
      const top = center + t / 2 + gap * 0.35 * round;
      const bot = center - t / 2 - gap * 0.65 * round - (p.curve > 0 ? p.curve * lift * 0.25 * round : 0);
      const z = -(x * x) * 0.5 * m.bend; /* wraps around the head */
      pos.setXYZ(i * 2, x, top, z);
      pos.setXYZ(i * 2 + 1, x, bot, z);
      lp.setXYZ(i * 2, x * 0.86, bot + t * 0.05, z + t * 0.05);
      lp.setXYZ(i * 2 + 1, x * 0.86, bot - t * 0.45 * (0.3 + round), z + t * 0.05);
      if (i === 0) hiC = center;
      if (i === N / 2) midY = center;
    }
    pos.needsUpdate = true;
    lp.needsUpdate = true;
    m.lip.visible = p.open > 0.15; /* a lower lip shows only when the mouth opens */
    m.mesh.geometry.computeBoundingSphere();
    m.cornerLift = hiC - midY; /* corners above the middle: a smile */
  }

  function setMorphs(ctx, d, p, lid, w) {
    const v = {
      smile: clamp(p.curve, 0, 1),
      frown: clamp(-p.curve, 0, 1),
      open: clamp(p.open, 0, 1),
      blink: lid,
      blinkL: lid,
      blinkR: lid,
      wide: clamp((p.eye - 1) * 2, 0, 1),
      browUp: clamp(p.browUp, 0, 1),
      browDown: clamp(-p.browUp, 0, 1),
      sneer: clamp(p.side * 1.4, 0, 1),
      surprised: clamp(w.surprised, 0, 1),
      scared: clamp(w.scared, 0, 1),
    };
    d.morphs.forEach(({ mesh, map }) => map.forEach(([i, k]) => (mesh.morphTargetInfluences[i] = v[k])));
    d.morphNow = v;
  }

  /* ---------- the body joins in ---------- */
  function body(ctx, w, size, dt) {
    const T = ctx.THREE;
    const rig = ctx.rig;
    if (!rig || !rig.head || rig.object) return;
    const hq = ctx.holder.getWorldQuaternion(new T.Quaternion());
    const X = new T.Vector3(1, 0, 0).applyQuaternion(hq);
    const Y = new T.Vector3(0, 1, 0).applyQuaternion(hq);
    const Z = new T.Vector3(0, 0, 1).applyQuaternion(hq);
    const k = Math.min(size, 1.5);
    const g = (f) => clamp(w[f], 0, 1.3) * k;
    const DEG = Math.PI / 180;
    const turn = (b, axis, deg) => b && Math.abs(deg) > 0.01 && ctx.rotateWorld(b, new T.Quaternion().setFromAxisAngle(axis, deg * DEG));
    const t = ctx.clock;
    const quad = rig.quadruped;
    const neck = rig.neck[0];
    /* sad: head sinks, chest folds, shoulders roll forward */
    const down = g("sad") * 9 + g("angry") * 4 + g("scared") * 4 - g("surprised") * 7 - g("disgust") * 4 - g("happy") * 2;
    turn(rig.chest, X, g("sad") * 6 + g("angry") * 4 + g("scared") * 5 - g("surprised") * 3);
    turn(neck, X, down * 0.4);
    turn(rig.head, X, down * 0.6);
    turn(rig.head, Y, g("disgust") * 12 + Math.sin(t * 1.3) * g("happy") * 3);
    turn(rig.head, Z, Math.sin(t * 3.2) * g("happy") * 4);
    if (!quad)
      ["L", "R"].forEach((s) => {
        const a = rig.arms[s][0];
        if (!a) return;
        const side = a.getWorldPosition(new T.Vector3()).sub(rig.hips.getWorldPosition(new T.Vector3())).dot(X) > 0 ? 1 : -1;
        turn(a, X, g("sad") * 8 + g("scared") * 6);
        /* scared: arms pull in to the body */
        turn(a, Z, -side * g("scared") * 10 + side * g("happy") * 4);
      });
    /* scared trembles a little; happy has a bounce */
    if (g("scared") > 0.05) turn(rig.chest || rig.head, Z, Math.sin(t * 38) * g("scared") * 0.9);
    const bounce = g("happy") * 0.018 * Math.abs(Math.sin(t * Math.PI * 1.7));
    ctx.holder.position.y += bounce;
    D(ctx).bounce = bounce;
  }

  /* ---------- each frame ---------- */
  function frame(ctx, dt) {
    const d = D(ctx);
    if (!ctx.model || !ctx.rig || !ctx.rig.head) return;
    const T = ctx.THREE;
    if (d.pending) {
      d.pending = false;
      try {
        build(ctx);
      } catch (e) {
        d.drawn = false;
        console.warn("3D add-on faces: " + e.message);
      }
    }
    const want = target(ctx);
    /* ease toward the target so a change of feeling reads as a change, not a jump */
    const k = 1 - Math.exp(-dt * 9);
    d.p = d.p || Object.assign({}, want.p);
    Object.keys(want.p).forEach((x) => (d.p[x] = lerp(d.p[x], want.p[x], k)));
    d.w = want.w;
    d.size = want.size;
    const p = d.p;
    /* blinks */
    const rate = BLINKS[Math.round(clamp(ctx.val("faceLens.blinks"), 0, 1) * 5)];
    if (d.nextBlink == null) d.nextBlink = ctx.clock + 0.6;
    if (rate && ctx.clock >= d.nextBlink && d.blinkAt == null) {
      d.blinkAt = ctx.clock;
      d.blinks = (d.blinks || 0) + 1;
      d.nextBlink = ctx.clock + (60 / rate) * (0.6 + Math.random() * 0.8);
    }
    if (!rate && d.nextBlink < ctx.clock) d.nextBlink = ctx.clock + 1;
    let lid = 0;
    if (d.blinkAt != null) {
      const u = (ctx.clock - d.blinkAt) / 0.16;
      if (u >= 1) d.blinkAt = null;
      else lid = Math.sin(u * Math.PI);
    }
    d.lid = lid;
    if (d.morphs && d.morphs.length) setMorphs(ctx, d, p, lid, d.w);
    if (d.drawn && d.group) {
      const showFace = on(ctx, "faceDraw");
      d.group.visible = showFace;
      d.hidden.forEach((m) => (m.visible = !showFace));
      if (showFace) {
        const look = ctx.pick(F + "look");
        d.eyes.forEach((E) => {
          const open = Math.max(0.06, p.eye * (1 - lid * 0.94));
          const wide = Math.max(1, Math.min(1.35, 0.8 + p.eye * 0.2));
          E.eye.scale.set(wide, open, wide);
          /* pupils: left and right as you look at the character's front */
          const off = d.e * 0.42;
          let lx = 0;
          let ly = 0;
          if (look === "left") lx = -off;
          else if (look === "right") lx = off;
          else if (look === "up") ly = off * 0.8;
          else if (look === "down") ly = -off * 0.8;
          else if (look === "at the camera") {
            const cam = ctx.camera.position.clone();
            const local = E.holder.worldToLocal(cam).normalize();
            lx = clamp(local.x, -1, 1) * off * 1.2;
            ly = clamp(local.y, -1, 1) * off * 1.2;
          }
          E.pupil.position.set(lerp(E.pupil.position.x, lx, k * 1.5), lerp(E.pupil.position.y, ly, k * 1.5), 0);
          const pupilSize = 1 - Math.max(0, p.eye - 1) * 0.35;
          E.pupil.scale.setScalar(pupilSize);
          /* brows: lift, tilt (inner end up for sad and scared, down for angry), pull together */
          const bh = E.browHolder;
          bh.position.copy(E.browHome);
          bh.position.y += p.browUp * d.e * 0.55 + (lid ? -lid * d.e * 0.15 : 0);
          bh.position.x -= E.s * p.browIn * d.e * 0.35;
          E.brow.rotation.z = -E.s * p.browTilt * 0.42;
        });
        /* rebuild the mouth only when its shape changed (saves a buffer upload every frame) */
        const sig = [p.curve, p.open, p.width, p.side].map((x) => x.toFixed(4)).join();
        if (sig !== d.mouthSig) (d.mouthSig = sig), shapeMouth(d, p);
      }
    }
    if (on(ctx, "faceBody")) body(ctx, d.w, d.size, dt);
    else d.bounce = 0;
    /* what the face shows, in words, now and then */
    if (!d.saidAt || ctx.clock - d.saidAt > 0.5) {
      d.saidAt = ctx.clock;
      const box = ctx.el.querySelector('[data-ext="faces"] [data-faces="now"]');
      if (box) {
        const top = FEELINGS.map((f) => [f, d.w[f]]).filter((x) => x[1] > 0.08).sort((a, b) => b[1] - a[1]);
        const name = { happy: "happy", sad: "sad", angry: "angry", scared: "scared", surprised: "surprised", disgust: "disgusted" };
        const feel = top.length ? top.map((x) => (x[1] < 0.4 ? "a little " : x[1] > 0.85 ? "very " : "") + name[x[0]]).join(" and ") : "calm";
        const mode = d.morphs && d.morphs.length ? "its own face shapes" : d.drawn ? "a drawn face" : "no face found";
        const txt = `Now: ${feel}${d.film ? ` (following ${d.film.from}: ${d.film.said})` : ""}. Using ${mode}.`;
        if (box.textContent !== txt) box.textContent = txt;
      }
    }
  }

  function built(ctx) {
    const d = D(ctx);
    d.morphs = [];
    d.drawn = false;
    d.hidden = [];
    if (!ctx.model || !ctx.rig || !ctx.rig.head) return;
    /* blend shapes with names we know */
    let mouthShapes = 0;
    ctx.model.traverse((o) => {
      if (!o.isMesh || !o.morphTargetDictionary || !o.morphTargetInfluences) return;
      const map = [];
      Object.keys(o.morphTargetDictionary).forEach((name) => {
        const hit = MORPHS.find(([, re]) => re.test(name));
        if (!hit) return;
        map.push([o.morphTargetDictionary[name], hit[0]]);
        if (hit[0] === "smile" || hit[0] === "frown" || hit[0] === "open") mouthShapes++;
      });
      if (map.length) d.morphs.push({ mesh: o, map, names: Object.keys(o.morphTargetDictionary) });
    });
    /* the drawn face is made on the first frame, once every joint has its place (and the maker its parts) */
    d.pending = !mouthShapes; /* a character with its own face shapes does the acting with them */
  }

  const PRESETS = {
    Calm: {},
    Happy: { happy: "very" },
    Sad: { sad: "very" },
    Angry: { angry: "very" },
    Scared: { scared: "very" },
    Surprised: { surprised: "very" },
    Disgusted: { disgust: "very" },
    "Happy and scared": { happy: "clearly", scared: "clearly" },
  };
  function setSlider(ctx, id, word) {
    const s = SLIDERS.find((x) => x.id === id);
    const i = s.scale.indexOf(word);
    if (i < 0) return;
    const inp = ctx.el.querySelector(`[data-slider="${id}"]`);
    if (inp && !inp.disabled) {
      inp.value = String(i);
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (!inp) {
      ctx.prefs.values[id] = i / (s.scale.length - 1);
      ctx.save();
    }
  }

  R.extend({
    id: "faces",
    label: "Face and feelings",
    sliders: SLIDERS,
    built,
    afterRules: (ctx, dt) => frame(ctx, dt),
    panel: (ctx) => `<h4 title="In Maya: blend shapes (the Shape Editor) and a face rig">Face and feelings</h4>
      <p class="cap">Mix the feelings with the sliders above. The face and a little of the body follow them, and, on the Screen, the film's feelings at the playhead.</p>
      <div class="rig-row" style="flex-wrap:wrap;gap:.25rem">${Object.keys(PRESETS)
        .map((k) => `<button type="button" class="chip" data-faces-preset="${esc(k)}">${esc(k)}</button>`)
        .join("")}</div>
      <label><input type="checkbox" data-faces="faceDraw"${on(ctx, "faceDraw") ? " checked" : ""}> Show a face</label><br>
      <label><input type="checkbox" data-faces="faceFilm"${on(ctx, "faceFilm") ? " checked" : ""}> Follow the film's feelings</label><br>
      <label><input type="checkbox" data-faces="faceBody"${on(ctx, "faceBody") ? " checked" : ""}> The body joins in</label>
      <p class="cap" data-faces="now"></p>`,
    wire(ctx, box) {
      box.addEventListener("change", (e) => {
        const k = e.target.dataset && e.target.dataset.faces;
        if (!k) return;
        ctx.prefs[k] = e.target.checked;
        ctx.save();
      });
      box.addEventListener("click", (e) => {
        const k = e.target.dataset && e.target.dataset.facesPreset;
        if (!k) return;
        const set = PRESETS[k];
        FEELINGS.forEach((f) => setSlider(ctx, F + f, set[f] || "not at all"));
      });
    },
  });

  window.CurioRigFaces = {
    MORPHS,
    film: (ctx) => filmFeeling(ctx),
    /* blink once now, whatever the Blinks slider says */
    blink(ctx) {
      const d = D(ctx);
      d.blinkAt = ctx.clock;
      d.blinks = (d.blinks || 0) + 1;
    },
    state(ctx) {
      const d = D(ctx);
      const T = ctx.THREE;
      const out = { drawn: !!d.drawn, morphs: (d.morphs || []).length, p: Object.assign({}, d.p || {}), w: Object.assign({}, d.w || {}), size: d.size, lid: d.lid || 0, blinks: d.blinks || 0, film: d.film || null, hiddenMaker: (d.hidden || []).length, makerEyesShown: (d.hidden || []).some((m) => m.visible), bounce: d.bounce || 0, morphNow: d.morphNow || null };
      if (d.drawn && d.group && T) {
        out.visible = d.group.visible;
        out.cornerLift = d.mouth.cornerLift;
        out.eyeOpen = d.eyes[0].eye.scale.y;
        out.browY = d.eyes.map((E) => E.browHolder.position.y);
        out.browTilt = d.eyes.map((E) => E.brow.rotation.z);
        out.pupil = d.eyes.map((E) => [E.pupil.position.x, E.pupil.position.y]);
        /* the mouth's corners and middle on the screen (pixels from the top left of the canvas) */
        const pos = d.mouth.mesh.geometry.attributes.position;
        const W = ctx.renderer.domElement.width;
        const H = ctx.renderer.domElement.height;
        const px = (i) => {
          const v = new T.Vector3().fromBufferAttribute(pos, i);
          d.mouth.mesh.localToWorld(v);
          const p = v.project(ctx.camera);
          return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H];
        };
        const N = d.mouth.N;
        const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        out.mouthPx = { left: mid(px(0), px(1)), middle: mid(px(N), px(N + 1)), right: mid(px(2 * N), px(2 * N + 1)), top: px(N), bottom: px(N + 1) };
        const c = new T.Vector3();
        d.eyes[0].holder.getWorldPosition(c);
        const p0 = c.project(ctx.camera);
        out.eyePx = [((p0.x + 1) / 2) * W, ((1 - p0.y) / 2) * H];
      }
      return out;
    },
  };
})();
