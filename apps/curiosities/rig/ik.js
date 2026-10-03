/* rig/ik.js: "Feet and hands", an add-on for the 3D characters view (CurioRig.extend).

   In plain words: instead of turning each joint of a leg or an arm, you say where the foot or the hand should be,
   and the leg or arm works out how to bend to get there. Planted feet stay where they stand on the floor while
   the body slumps, leans or twists; a hand can hold a cup, rest on a table or reach out to shake hands.
   In Maya: IK handles (two-bone IK on legs and arms) and point, orient and parent constraints.

   It follows two sliders from Poses and body control, so they can be automated from the timeline:
   - Feet on the ground: sliding (no help: today's behaviour), planted (feet stay where they stand), lifted (one
     foot raised), in the air (both feet off the floor, a little jump). While the body is walking or running the
     feet are left to the walk (a walk in place has no floor to plant on), so this slider waits until it stops.
   - What the hands hold: empty, a prop (a cup in the right hand, kept there), a surface (both hands on a table
     in front), another person (the right hand reaches forward as if to shake hands).
   Four-legged characters plant all four feet (lifted raises the front right paw); hands are for people only.
   Objects (a lamp, a tree, a cut-out) have no feet or hands, so nothing happens to them. */
(function () {
  if (!window.CurioRig || !window.CurioRig.extend) return;
  const FEET = "poseRigLens.feet";
  const HANDS = "poseRigLens.hands";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DEG = Math.PI / 180;
  const props = new WeakMap(); /* ctx -> the things this add-on put in the scene */

  const SAY_FEET = {
    sliding: "Feet: no help. They go wherever the body takes them.",
    planted: "Feet: planted. They stay where they stand while the body bends; the hips sink a little if the legs need room.",
    lifted: "Feet: one foot raised, the other stays planted.",
    "in the air": "Feet: both off the floor, a little jump.",
  };
  const SAY_HANDS = {
    empty: "Hands: free.",
    "a prop": "Hands: the right hand holds a cup, and the cup goes wherever the hand goes.",
    "a surface": "Hands: both hands rest on a table in front.",
    "another person": "Hands: the right hand reaches forward, as if to shake hands.",
  };

  /* ---------- small helpers ---------- */
  const wp = (T, b) => b.getWorldPosition(new T.Vector3());
  const wq = (T, b) => b.getWorldQuaternion(new T.Quaternion());
  /* Two-bone IK: turn a (hip or shoulder) and b (knee or elbow) so that c (ankle or wrist) lands on target.
     pole: the way the middle joint should point (knees forward, elbows back). minInside: the smallest angle the
     middle joint may close to, in radians, so a knee never folds further than a knee can. */
  function solve(ctx, a, b, c, target, pole, minInside) {
    const T = ctx.THREE;
    const A = wp(T, a);
    const B = wp(T, b);
    const C = wp(T, c);
    const lab = B.distanceTo(A);
    const lbc = C.distanceTo(B);
    if (lab < 1e-5 || lbc < 1e-5) return;
    const d = target.clone().sub(A);
    const shortest = Math.max(Math.abs(lab - lbc) + 1e-4, Math.sqrt(Math.max(0, lab * lab + lbc * lbc - 2 * lab * lbc * Math.cos(minInside))));
    const dist = clamp(d.length(), shortest, lab + lbc - 1e-4);
    const dir = d.lengthSq() > 1e-12 ? d.normalize() : C.clone().sub(A).normalize();
    const x = (lab * lab - lbc * lbc + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, lab * lab - x * x));
    const pv = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
    if (pv.lengthSq() < 1e-10) pv.set(0, 0, 1).sub(dir.clone().multiplyScalar(dir.z));
    pv.normalize();
    const K = A.clone().add(dir.clone().multiplyScalar(x)).add(pv.multiplyScalar(h));
    ctx.rotateWorld(a, new T.Quaternion().setFromUnitVectors(B.clone().sub(A).normalize(), K.sub(A).normalize()));
    const B2 = wp(T, b);
    const C2 = wp(T, c);
    const reach = A.clone().add(dir.clone().multiplyScalar(dist));
    ctx.rotateWorld(b, new T.Quaternion().setFromUnitVectors(C2.sub(B2).normalize(), reach.sub(B2).normalize()));
  }
  /* Turn a joint so it faces the same way in the scene as q (an orient constraint). */
  function orientTo(ctx, b, q) {
    ctx.rotateWorld(b, q.clone().multiply(wq(ctx.THREE, b).invert()));
  }
  /* The smallest angle a middle joint (knee, elbow) may close to, from its joint limits. */
  function minInside(ctx, b) {
    const L = ctx.limitOf(b);
    const most = Math.max(Math.abs(L.bend[0]), Math.abs(L.bend[1]), 10);
    return clamp(180 - most, 12, 170) * DEG;
  }
  /* Which way the character faces now: its rest front (+z) turned the way the hips are turned, kept level. */
  function facing(ctx) {
    const T = ctx.THREE;
    const r = ctx.info.get(ctx.rig.hips);
    const f = new T.Vector3(0, 0, 1);
    if (r) f.applyQuaternion(wq(T, ctx.rig.hips).multiply(r.invRestWorld));
    f.y = 0;
    return f.lengthSq() > 1e-6 ? f.normalize() : new T.Vector3(0, 0, 1);
  }
  /* Which way a middle joint points now (in the pose before IK), or a sensible default when the limb is straight. */
  function bendOf(ctx, a, b, c, fallback) {
    const T = ctx.THREE;
    const A = wp(T, a);
    const ac = wp(T, c).sub(A);
    const len = ac.length();
    if (len < 1e-6) return fallback;
    ac.normalize();
    const ab = wp(T, b).sub(A);
    const off = ab.sub(ac.multiplyScalar(ab.dot(ac)));
    return off.length() > 0.02 * len ? off.normalize() : fallback;
  }

  /* ---------- the things it puts in the scene: a cup, a table, markers ---------- */
  function makeProps(ctx) {
    const T = ctx.THREE;
    const g = new T.Group();
    g.name = "feet and hands";
    const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.5, metalness: 0.05 }, o || {}));
    /* a cup: a body, a bottom, a handle, and something to drink */
    const cup = new T.Group();
    const china = mat(0xd0543c, { side: T.DoubleSide }); /* a terracotta mug, so it shows against a pale body */
    cup.add(new T.Mesh(new T.CylinderGeometry(0.045, 0.038, 0.11, 24, 1, true), china));
    const bottom = new T.Mesh(new T.CircleGeometry(0.038, 24), china);
    bottom.rotation.x = Math.PI / 2;
    bottom.position.y = -0.055;
    cup.add(bottom);
    const drink = new T.Mesh(new T.CircleGeometry(0.042, 24), mat(0x5a3418, { roughness: 0.2 }));
    drink.rotation.x = -Math.PI / 2;
    drink.position.y = 0.035;
    cup.add(drink);
    const handle = new T.Mesh(new T.TorusGeometry(0.028, 0.008, 8, 20, Math.PI), china);
    handle.rotation.z = -Math.PI / 2;
    handle.position.x = 0.043;
    cup.add(handle);
    cup.visible = false;
    g.add(cup);
    /* a table: a top and four legs, sized to each character */
    const table = new T.Group();
    const wood = mat(0x9a6b43, { roughness: 0.75 });
    const top = new T.Mesh(new T.BoxGeometry(1, 1, 1), wood);
    table.add(top);
    const legs = [0, 1, 2, 3].map(() => {
      const l = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 1, 10), wood);
      table.add(l);
      return l;
    });
    table.userData = { top, legs };
    table.visible = false;
    g.add(table);
    /* markers: where each foot and hand is told to go */
    const dot = (c) => {
      const m = new T.Mesh(new T.SphereGeometry(0.03, 12, 8), new T.MeshBasicMaterial({ color: c, depthTest: false, transparent: true, opacity: 0.9 }));
      m.renderOrder = 11;
      m.visible = false;
      g.add(m);
      return m;
    };
    const markers = { feet: [0, 1, 2, 3].map(() => dot(0xff9a2e)), hands: [0, 1].map(() => dot(0x4fb4ff)) };
    ctx.scene.add(g);
    return { group: g, cup, table, markers };
  }

  /* ---------- measured once per character, in its rest pose ---------- */
  function measure(ctx) {
    const T = ctx.THREE;
    const rig = ctx.rig;
    const out = { feet: [], arms: null };
    if (!rig || rig.object || !rig.hips) return out;
    const chainLen = (ch) => wp(T, ch[0]).distanceTo(wp(T, ch[1])) + wp(T, ch[1]).distanceTo(wp(T, ch[2]));
    const add = (ch, side, front) => ch.length >= 3 && out.feet.push({ chain: ch.slice(0, 3), side, front, len: chainLen(ch) });
    add(rig.legs.L, "L", false);
    add(rig.legs.R, "R", false);
    if (rig.quadruped) {
      add(rig.arms.L, "L", true);
      add(rig.arms.R, "R", true);
    } else if (rig.arms.L.length >= 3 && rig.arms.R.length >= 3) {
      const sL = wp(T, rig.arms.L[0]);
      const sR = wp(T, rig.arms.R[0]);
      out.arms = { L: rig.arms.L.slice(0, 3), R: rig.arms.R.slice(0, 3), len: chainLen(rig.arms.R), shoulderL: sL, shoulderR: sR, mid: sL.clone().add(sR).multiplyScalar(0.5) };
    }
    return out;
  }

  /* Where the hands go, in the scene. The table and the other person stay put; the cup is held near the body. */
  function handTargets(ctx, a, word) {
    const T = ctx.THREE;
    if (!a || word === "empty") return [];
    const L = a.len;
    const out = { L: new T.Vector3(1, 0, 0), R: new T.Vector3(-1, 0, 0) }; /* the character's left is +x */
    if (word === "a surface") return ["L", "R"].map((s) => ({ side: s, at: (s === "L" ? a.shoulderL : a.shoulderR).clone().add(out[s].clone().multiplyScalar(0.12 * L)).add(new T.Vector3(0, -0.7 * L, 0.5 * L)) }));
    if (word === "another person") return [{ side: "R", at: a.shoulderR.clone().add(out.R.clone().multiplyScalar(0.05 * L)).add(new T.Vector3(0, -0.28 * L, 0.88 * L)) }];
    /* a prop: in front of the waist, elbow bent, following the shoulder as the body moves */
    return [{ side: "R", at: wp(T, a.R[0]).add(out.R.clone().multiplyScalar(0.05 * L)).add(new T.Vector3(0, -0.6 * L, 0.42 * L)) }];
  }

  function sizeTable(p, a) {
    if (!a) return;
    const L = a.len;
    const y = a.shoulderL.y - 0.7 * L - 0.035; /* the wrist rests just above the top */
    const front = a.mid.z + 0.5 * L - 0.12;
    const w = Math.abs(a.shoulderL.x - a.shoulderR.x) + 0.24 * L + 0.4;
    const depth = 0.55;
    p.table.userData.top.scale.set(w, 0.04, depth);
    p.table.userData.top.position.set(a.mid.x, y - 0.02, front + depth / 2);
    p.table.userData.legs.forEach((l, i) => {
      l.scale.set(1, y - 0.04, 1);
      l.position.set(a.mid.x + (i % 2 ? 1 : -1) * (w / 2 - 0.06), (y - 0.04) / 2, front + (i < 2 ? 0.06 : depth - 0.06));
    });
  }

  window.CurioRig.extend({
    id: "ik",
    label: "Feet and hands",
    sliders: [
      { id: FEET, lens: "poseRigLens", label: "Feet on the ground", scale: ["sliding", "planted", "lifted", "in the air"], start: 0 },
      { id: HANDS, lens: "poseRigLens", label: "What the hands hold", scale: ["empty", "a prop", "a surface", "another person"], start: 0 },
    ],
    panel(ctx) {
      return `<h4 title="In Maya: IK handles (two-bone IK), and point, orient and parent constraints">Feet and hands</h4>
        <p class="cap">Say where a foot or hand should be and the leg or arm bends to get there. Use the two sliders above: planted feet stay put while the body bends; hands can hold a cup, rest on a table or reach out to shake hands.</p>
        <label class="rig-rule"><input type="checkbox" data-ik="show"${ctx.prefs.ikShow ? " checked" : ""}> <b>Show where hands and feet aim</b> <small>Small dots: orange where the feet go, blue where the hands go.</small></label>
        <p class="cap" data-ik="now"></p>`;
    },
    wire(ctx, box) {
      box.addEventListener("change", (e) => {
        if (!e.target.matches('[data-ik="show"]')) return;
        ctx.prefs.ikShow = e.target.checked;
        ctx.save();
      });
    },
    setup(ctx) {
      props.set(ctx, makeProps(ctx));
    },
    built(ctx) {
      const d = ctx.data("ik");
      d.m = measure(ctx);
      d.cupOff = null;
      d.say = "";
      const p = props.get(ctx);
      if (p) sizeTable(p, d.m.arms);
    },
    afterBase(ctx) {
      /* Where each foot stands before the rules bend the body: that is where planted feet stay. */
      const d = ctx.data("ik");
      if (!d.m || !d.m.feet.length || !ctx.holder) return;
      ctx.holder.updateMatrixWorld(true);
      d.stand = d.m.feet.map((f) => ({ at: wp(ctx.THREE, f.chain[2]), turn: wq(ctx.THREE, f.chain[2]) }));
      d.lift = 0;
      if (ctx.pick(FEET) === "in the air" && !/walking|running/.test(ctx.pick("rigRulesLens.motion"))) {
        d.lift = 0.3 * Math.max(...d.m.feet.map((f) => f.len));
        ctx.holder.position.y += d.lift;
        ctx.holder.updateMatrixWorld(true);
      }
    },
    afterRules(ctx) {
      const T = ctx.THREE;
      const d = ctx.data("ik");
      const p = props.get(ctx);
      if (!p || !d.m) return;
      const feetWord = ctx.pick(FEET);
      const handWord = ctx.pick(HANDS);
      const moving = /walking|running/.test(ctx.pick("rigRulesLens.motion"));
      const show = !!ctx.prefs.ikShow;
      const aims = { feet: [], hands: [] };

      /* --- feet --- */
      if (d.m.feet.length && d.stand && feetWord !== "sliding" && !moving) {
        const fwd = facing(ctx);
        const goals = d.m.feet.map((f, i) => {
          const st = d.stand[i];
          const L = f.len;
          const at = st.at.clone();
          let up = false;
          if (feetWord === "lifted" && (ctx.rig.quadruped ? f.front && f.side === "R" : f.side === "L")) {
            at.add(new T.Vector3(0, 0.3 * L, 0)).add(fwd.clone().multiplyScalar((ctx.rig.quadruped ? 0.1 : 0.25) * L));
            up = true;
          } else if (feetWord === "in the air") {
            const tuck = ctx.rig.quadruped ? (f.front ? 0.15 : 0.1) : 0.18;
            const swing = ctx.rig.quadruped ? 0 : f.side === "L" ? 0.08 : -0.12;
            at.add(new T.Vector3(0, d.lift + tuck * L, 0)).add(fwd.clone().multiplyScalar(swing * L));
            up = true;
          }
          return { f, st, at, up };
        });
        /* A four-legged body whose chest has risen or swung away from its front paws tips forward or rolls (at
           most 40 degrees) until the front legs can reach the floor again, turning around the hips. */
        const front = goals.filter((g) => g.f.front && !g.up);
        const reachOff = (list) => list.reduce((s, g) => s + Math.max(0, wp(T, g.f.chain[0]).distanceTo(g.at) - 0.985 * g.f.len), 0);
        if (ctx.rig.quadruped && front.length && reachOff(front) > 1e-3) {
          const H = wp(T, ctx.rig.hips);
          const tops = front.map((g) => wp(T, g.f.chain[0]).sub(H));
          const pitchAxis = new T.Vector3().crossVectors(fwd, new T.Vector3(0, 1, 0)).normalize();
          let best = null;
          for (let p = -40; p <= 40; p += 2)
            for (let r = -30; r <= 30; r += 2) {
              const q = new T.Quaternion().setFromAxisAngle(pitchAxis, p * DEG).multiply(new T.Quaternion().setFromAxisAngle(fwd, r * DEG));
              const off = front.reduce((s, g, i) => s + Math.max(0, tops[i].clone().applyQuaternion(q).add(H).distanceTo(g.at) - 0.985 * g.f.len), 0);
              const cost = off * 100 + Math.abs(p) * 0.001 + Math.abs(r) * 0.001;
              if (!best || cost < best.cost) best = { cost, q };
            }
          if (best) ctx.rotateWorld(ctx.rig.hips, best.q);
        }
        /* If a standing leg cannot reach its spot, sink the body a little so it can (at most 15% of a leg). */
        let drop = 0;
        goals.forEach((g) => {
          if (g.up) return;
          const v = wp(T, g.f.chain[0]).sub(g.at);
          const most = 0.985 * g.f.len;
          const flat = v.x * v.x + v.z * v.z;
          if (flat < most * most) drop = Math.max(drop, v.y - Math.sqrt(most * most - flat));
        });
        drop = clamp(drop, 0, 0.15 * Math.max(...d.m.feet.map((f) => f.len)));
        if (drop > 1e-4) {
          ctx.holder.position.y -= drop;
          ctx.holder.updateMatrixWorld(true);
        }
        goals.forEach((g) => {
          const [a, b, c] = g.f.chain;
          const pole = bendOf(ctx, a, b, c, g.f.front ? fwd.clone().negate() : fwd.clone());
          solve(ctx, a, b, c, g.at, pole, minInside(ctx, b));
          orientTo(ctx, c, g.st.turn); /* the foot keeps the angle it stood at: flat on the floor */
          aims.feet.push(g.at);
        });
      }

      /* --- hands --- */
      const a = d.m.arms;
      const targets = !ctx.rig.object && !ctx.rig.quadruped && a ? handTargets(ctx, a, handWord) : [];
      targets.forEach((t) => {
        const [s, e, w] = a[t.side];
        const pole = new T.Vector3(0, -0.35, -1).add(new T.Vector3(t.side === "L" ? 0.6 : -0.6, 0, 0)); /* elbows point back, down and out */
        solve(ctx, s, e, w, t.at, pole, minInside(ctx, e));
        aims.hands.push(t.at);
      });

      /* --- the cup: held in the right hand (a parent constraint that keeps its offset) --- */
      const holding = handWord === "a prop" && targets.length > 0;
      if (holding) {
        const hand = a.R[2];
        hand.updateMatrixWorld(true);
        if (!d.cupOff) {
          const wrist = wp(T, hand);
          const along = wrist.clone().sub(wp(T, a.R[1])).normalize();
          const at = wrist.add(along.multiplyScalar(0.065)).add(new T.Vector3(0, 0.02, 0));
          const cupWorld = new T.Matrix4().compose(at, new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 2), new T.Vector3(1, 1, 1));
          d.cupOff = new T.Matrix4().copy(hand.matrixWorld).invert().multiply(cupWorld);
        }
        new T.Matrix4().multiplyMatrices(hand.matrixWorld, d.cupOff).decompose(p.cup.position, p.cup.quaternion, p.cup.scale);
      } else d.cupOff = null;
      p.cup.visible = holding;
      p.table.visible = handWord === "a surface" && targets.length > 0;

      /* --- markers --- */
      const place = (list, at) =>
        list.forEach((m, i) => {
          m.visible = show && !!at[i];
          if (m.visible) m.position.copy(at[i]);
        });
      place(p.markers.feet, aims.feet);
      place(p.markers.hands, aims.hands);
      d.aims = aims;

      /* --- what it is doing, in words --- */
      let say;
      if (ctx.rig.object) say = "Objects have no feet or hands, so this does nothing to them.";
      else {
        say = moving && feetWord !== "sliding" ? "Feet: left to the walk while it is walking or running." : SAY_FEET[feetWord] || "";
        say += " " + (ctx.rig.quadruped ? "Hands: four-legged characters have no hands to hold with." : SAY_HANDS[handWord] || "");
      }
      if (say !== d.say) {
        d.say = say;
        const now = ctx.el.querySelector('[data-ext="ik"] [data-ik="now"]');
        if (now) now.textContent = say;
      }
    },
  });

  /* For tests and other tools: where the feet and hands were told to go in the last frame, and the cup. */
  window.CurioRigIK = {
    aims(ctx) {
      const d = ctx && ctx.data("ik");
      return d && d.aims ? { feet: d.aims.feet.map((v) => v.toArray()), hands: d.aims.hands.map((v) => v.toArray()) } : { feet: [], hands: [] };
    },
    cup(ctx) {
      const p = props.get(ctx);
      return p && p.cup.visible ? p.cup.getWorldPosition(new ctx.THREE.Vector3()).toArray() : null;
    },
    table(ctx) {
      const p = props.get(ctx);
      return !!(p && p.table.visible);
    },
  };
})();
