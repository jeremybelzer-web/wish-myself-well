/* rig/dynamics.js: "Forces", a 3D add-on (CurioRig.extend) for the 3D characters view.

   Jeremy, 14:30Z: "we also need to do whatever Maya does ... lots and lots of rules about the movement." In Maya
   the invisible pushes (wind, gravity, chaos) are "fields", small flying things are "nParticles", and solid things
   that fall and bounce are "rigid bodies". Here they are three curiosities you already have on the Screen:

   - Forces in the air (forcesLens): wind and gusts push every loose part (a tree, the lamp, a tail, the head and
     arms) toward where the wind blows. Each part swings on a spring, so it overshoots and settles; the thickness of
     the air and the weight of the world change how far and how fast. Nothing goes past its joint limits.
   - Bits in the air (bitsLens): dust, sparks, snow, rain, leaves, ash, confetti or bubbles fill the air around the
     character, fall (or rise) with the weight of the world and are blown by the same wind. At most 3000 points.
   - Things that crash (crashLens): "Drop it" lifts the character or object and lets it fall. It lands, bounces as
     much as Bounce says, slides as far as Slippery says, and the body squashes on each landing and wobbles for the
     Settle time.

   Wind directions are seen from the camera: "from the left" always comes from the left of the picture.
   Tests and other tools: CurioRig.forces.state(controller), CurioRig.forces.drop(controller). */
(function () {
  if (!window.CurioRig || !window.CurioRig.extend) return;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const DEG = Math.PI / 180;
  const MAX_BITS = 3000;

  /* The sliders, with the labels and scales of data/db-maya.js. Wind and Chaos are 0 to 5 in the catalog
     (windForce, turbulence), so each step gets a plain word; Settle time is 0 to 4 beats (settleTime). */
  const SLIDERS = [
    { id: "forcesLens.wind", lens: "forcesLens", group: "Wind and air", label: "Wind", scale: ["still (0)", "a breath (1)", "a breeze (2)", "windy (3)", "strong wind (4)", "a gale (5)"], start: 0 },
    { id: "forcesLens.gusts", lens: "forcesLens", group: "Wind and air", label: "Gusts", scale: ["steady", "gusty", "sudden blasts"], start: 1 },
    { id: "forcesLens.direction", lens: "forcesLens", group: "Wind and air", label: "Wind direction", scale: ["from the left", "from the right", "toward the camera", "from behind", "swirling"], start: 0 },
    { id: "forcesLens.chaos", lens: "forcesLens", group: "Wind and air", label: "Chaos", scale: ["calm (0)", "a little (1)", "some (2)", "restless (3)", "wild (4)", "wild swirls (5)"], start: 0 },
    { id: "forcesLens.weight", lens: "forcesLens", group: "Wind and air", label: "Weight", scale: ["floaty", "real", "heavy"], start: 1 },
    { id: "forcesLens.drag", lens: "forcesLens", group: "Wind and air", label: "Thickness of the air", scale: ["thin air", "normal", "like water"], start: 1 },
    { id: "forcesLens.whirl", lens: "forcesLens", group: "Wind and air", label: "Whirlwind", scale: ["none", "eddies", "a whirlwind"], start: 0 },
    { id: "bitsLens.kind", lens: "bitsLens", group: "Bits in the air", label: "What is in the air", scale: ["dust", "sparks", "snow", "rain", "leaves", "ash", "confetti", "bubbles"], start: 2 },
    { id: "bitsLens.amount", lens: "bitsLens", group: "Bits in the air", label: "How much", scale: ["none", "a few", "plenty", "a storm"], start: 0 },
    { id: "bitsLens.size", lens: "bitsLens", group: "Bits in the air", label: "Size", scale: ["specks", "flakes", "chunks"], start: 1 },
    { id: "bitsLens.life", lens: "bitsLens", group: "Bits in the air", label: "How long they last", scale: ["a blink", "drift a while", "linger"], start: 1 },
    { id: "bitsLens.shine", lens: "bitsLens", group: "Bits in the air", label: "Catch the light", scale: ["none", "catch the light", "glow"], start: 0 },
    { id: "crashLens.bounce", lens: "crashLens", group: "Dropping and landing", label: "Bounce", scale: ["dead thud", "small bounce", "bouncy", "super ball"], start: 1 },
    { id: "crashLens.slide", lens: "crashLens", group: "Dropping and landing", label: "Slippery", scale: ["grippy", "smooth", "ice"], start: 0 },
    { id: "crashLens.settle", lens: "crashLens", group: "Dropping and landing", label: "Settle time", scale: ["at once (0)", "a moment (1)", "a beat or two (2)", "a while (3)", "a long wobble (4)"], start: 2 },
  ];

  /* How much each kind of joint catches the wind (1 = all of it). Legs stand on the floor and do not. */
  const CATCH = { tail: 1, joint: 1, tip: 1, base: 0.25, head: 0.3, neck: 0.3, shoulder: 0.35, elbow: 0.5, wrist: 0.5, frontHip: 0.08, frontKnee: 0.05, spine: 0.12, hips: 0, hip: 0, knee: 0, ankle: 0, other: 0.15 };

  /* Each kind of bit: color(s), how hard gravity pulls it (minus floats up), how tightly the air holds it, how
     much it flutters, its size and how long it lives compared with the others. */
  const BITS = {
    dust: { colors: [0xd9cbaa], fall: 0.01, air: 3, flutter: 0.25, size: 0.025, life: 1.4, opacity: 0.55 },
    sparks: { colors: [0xffb347, 0xff7a1a, 0xffe08a], fall: -0.12, air: 1.6, flutter: 0.5, size: 0.025, life: 0.35, opacity: 1, glow: true, low: true },
    snow: { colors: [0xffffff, 0xeef4ff], fall: 0.09, air: 2.2, flutter: 0.35, size: 0.045, life: 1.4, opacity: 0.95 },
    rain: { colors: [0xa8d0ff, 0xd0e4ff], fall: 1, air: 1.4, flutter: 0, size: 0.04, life: 1, opacity: 0.85 },
    leaves: { colors: [0x6aa84f, 0xd98c2b, 0xb5452f, 0xe1b941], fall: 0.15, air: 2, flutter: 1.2, size: 0.075, life: 1.4, opacity: 1 },
    ash: { colors: [0x8d8781, 0x5e5955, 0xb0aaa4], fall: 0.05, air: 2.4, flutter: 0.45, size: 0.035, life: 1.4, opacity: 0.85 },
    confetti: { colors: [0xff4d6d, 0xffd23f, 0x3bceac, 0x5e60ce, 0xff8c42], fall: 0.12, air: 2, flutter: 1, size: 0.055, life: 1.4, opacity: 1 },
    bubbles: { colors: [0xbfe8ff, 0xe6f7ff], fall: -0.07, air: 2.4, flutter: 0.5, size: 0.06, life: 1, opacity: 0.6, low: true },
  };
  const AMOUNT = { none: 0, "a few": 150, plenty: 900, "a storm": MAX_BITS };
  const SIZE = { specks: 0.6, flakes: 1, chunks: 2 };
  const LIFE = { "a blink": 1.2, "drift a while": 5, linger: 14 };
  const GRAVITY = { floaty: 3.5, real: 9.8, heavy: 17 };
  const AIR = { "thin air": 0.55, normal: 1, "like water": 3.2 };
  const BOUNCE = { "dead thud": 0.04, "small bounce": 0.32, bouncy: 0.58, "super ball": 0.84 };
  const FRICTION = { grippy: 9, smooth: 1.6, ice: 0.25 };
  const BOX = 3; /* bits live in a box 6 wide and deep, 4.2 high, around the character */
  const TOP = 4.2;

  /* A smooth wobble from -1 to 1 (value noise), for gusts and chaos. */
  const hash = (i) => {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  function noise(t) {
    const i = Math.floor(t);
    const f = t - i;
    const u = f * f * (3 - 2 * f);
    return hash(i) * (1 - u) + hash(i + 1) * u;
  }
  const noise2 = (t, seed) => 0.65 * noise(t + seed * 17.3) + 0.35 * noise(t * 2.3 + seed * 5.1 + 40);

  /* Scene-wide things (bits, the wind arrow) live as long as the view; per-load things live in ctx.data. */
  const views = new WeakMap();
  function view(ctx) {
    let v = views.get(ctx);
    if (!v) views.set(ctx, (v = { bits: null, arrow: null, wind: null, dir: null, gust: 1, said: null }));
    return v;
  }
  function drop(ctx) {
    const d = ctx.data("forces");
    if (!d.drop) d.drop = { phase: "rest", y: 0, vy: 0, x: 0, z: 0, vx: 0, vz: 0, squash: 0, squashV: 0, bounces: 0, landed: 0 };
    return d.drop;
  }

  /* ---------- the wind ---------- */
  function windNow(ctx, v, t) {
    const THREE = ctx.THREE;
    const strength = ctx.val("forcesLens.wind");
    const gusts = ctx.pick("forcesLens.gusts");
    const where = ctx.pick("forcesLens.direction");
    let g;
    if (gusts === "gusty") g = 0.65 + 0.55 * (0.5 + 0.5 * noise2(t * 0.45, 1));
    else if (gusts === "sudden blasts") g = 0.35 + 3 * Math.pow(Math.max(0, noise2(t * 0.6, 7)), 2);
    else g = 1 + 0.06 * noise2(t * 0.45, 1);
    v.gust = g;
    /* seen from the camera: the way it looks and its right, flat on the floor */
    const look = new THREE.Vector3();
    ctx.camera.getWorldDirection(look);
    look.y = 0;
    if (look.lengthSq() < 1e-6) look.set(0, 0, -1);
    look.normalize();
    const right = new THREE.Vector3(-look.z, 0, look.x);
    let dir;
    if (where === "from the right") dir = right.clone().negate();
    else if (where === "toward the camera") dir = look.clone().negate();
    else if (where === "from behind") dir = look.clone(); /* from behind you, blowing into the picture */
    else if (where === "swirling") {
      const a = t * 0.5 + noise(t * 0.2) * 2;
      dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    } else dir = right.clone(); /* from the left: blows toward the right of the picture */
    const whirl = ctx.val("forcesLens.whirl");
    if (whirl > 0) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(t * (0.6 + whirl)) * whirl * 0.9);
    v.dir = dir.clone();
    v.wind = dir.multiplyScalar(strength * g); /* a gale at its normal strength is 1 */
    return v.wind;
  }

  /* Each loose joint swings on a spring toward where the wind pushes it, and never past its limits. */
  function blowChains(ctx, v, dt) {
    const THREE = ctx.THREE;
    const d = ctx.data("forces");
    const swing = (d.swing = d.swing || new Map());
    const W = v.wind;
    const weight = ctx.pick("forcesLens.weight");
    const air = AIR[ctx.pick("forcesLens.drag")] || 1;
    const chaos = ctx.val("forcesLens.chaos");
    const floppy = ctx.val("rigRulesLens.floppy");
    const heavy = { floaty: 1.35, real: 1, heavy: 0.6 }[weight] || 1;
    const freq = { floaty: 0.8, real: 1.25, heavy: 1.7 }[weight] || 1.25; /* swings per second */
    const k = Math.pow((2 * Math.PI * freq) / Math.sqrt(air), 2);
    const damp = 2 * Math.sqrt(k) * clamp(0.18 * air, 0.12, 1.2);
    const push = 26 * heavy * Math.min(1.6, Math.sqrt(air)) * (0.6 + floppy * 0.8); /* degrees for a gale */
    const steps = Math.max(1, Math.ceil(dt / (1 / 90)));
    const h = dt / steps;
    const wq = new THREE.Quaternion();
    const t = ctx.clock;
    ctx.bones.forEach((b, i) => {
      const r = ctx.info.get(b);
      const c = r ? CATCH[r.role] : 0;
      if (!c || !b.parent) return;
      let s = swing.get(b);
      if (!s) swing.set(b, (s = { a: new THREE.Vector3(), w: new THREE.Vector3() }));
      /* the bone's direction now, after its parents have swung */
      b.getWorldQuaternion(wq);
      const along = r.axes.twist.clone().applyQuaternion(wq).normalize();
      const w = W.clone();
      if (chaos > 0) w.add(new THREE.Vector3(noise2(t * 1.3, i + 3), noise2(t * 1.1, i + 9) * 0.5, noise2(t * 1.2, i + 13)).multiplyScalar(chaos * 0.7 * Math.max(0.15, W.length())));
      const across = w.clone().sub(along.clone().multiplyScalar(along.dot(w)));
      const axis = new THREE.Vector3().crossVectors(along, across);
      const lim = ctx.limitOf(b);
      const room = Math.min(Math.max(Math.abs(lim.bend[0]), Math.abs(lim.bend[1])), Math.max(Math.abs(lim.side[0]), Math.abs(lim.side[1])), 75);
      const cap = room * 0.75 * DEG;
      const want = axis.lengthSq() > 1e-10 ? axis.normalize().multiplyScalar(Math.min(cap, across.length() * push * c * DEG)) : new THREE.Vector3();
      for (let n = 0; n < steps; n++) {
        const acc = want.clone().sub(s.a).multiplyScalar(k).sub(s.w.clone().multiplyScalar(damp));
        s.w.addScaledVector(acc, h);
        s.a.addScaledVector(s.w, h);
      }
      const ang = s.a.length();
      if (ang > cap) {
        s.a.multiplyScalar(cap / ang);
        s.w.multiplyScalar(0.5);
      }
      if (s.a.lengthSq() < 1e-10) return;
      ctx.rotateWorld(b, new THREE.Quaternion().setFromAxisAngle(s.a.clone().normalize(), s.a.length()));
    });
  }

  /* ---------- bits in the air ---------- */
  function dotTexture(THREE) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    const x = cv.getContext("2d");
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }
  function makeBits(ctx) {
    const THREE = ctx.THREE;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(MAX_BITS * 3);
    const col = new Float32Array(MAX_BITS * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setDrawRange(0, 0);
    const mat = new THREE.PointsMaterial({ size: 0.04, map: dotTexture(THREE), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 5;
    pts.name = "bits in the air";
    ctx.scene.add(pts);
    return { pts, pos, col, vel: new Float32Array(MAX_BITS * 3), age: new Float32Array(MAX_BITS), span: new Float32Array(MAX_BITS), base: new Float32Array(MAX_BITS * 3), seed: new Float32Array(MAX_BITS), count: 0, kind: "" };
  }
  function spawn(B, i, kind, life, anywhere) {
    const k = BITS[kind];
    const p = i * 3;
    B.pos[p] = (Math.random() * 2 - 1) * BOX;
    B.pos[p + 2] = (Math.random() * 2 - 1) * BOX;
    B.pos[p + 1] = anywhere ? Math.random() * TOP : k.fall < 0 ? (k.low ? Math.random() * 0.4 : 0) : k.fall < 0.03 ? Math.random() * TOP : TOP - Math.random() * 0.3;
    B.vel[p] = B.vel[p + 1] = B.vel[p + 2] = 0;
    B.age[i] = anywhere ? Math.random() * life * k.life : 0;
    B.span[i] = life * k.life * (0.6 + Math.random() * 0.8);
    B.seed[i] = Math.random() * 100;
    const c = k.colors[Math.floor(Math.random() * k.colors.length)];
    B.base[p] = ((c >> 16) & 255) / 255;
    B.base[p + 1] = ((c >> 8) & 255) / 255;
    B.base[p + 2] = (c & 255) / 255;
  }
  function stepBits(ctx, v, dt) {
    if (!v.bits) v.bits = makeBits(ctx);
    const B = v.bits;
    const THREE = ctx.THREE;
    const kind = ctx.pick("bitsLens.kind");
    const k = BITS[kind] || BITS.dust;
    const want = AMOUNT[ctx.pick("bitsLens.amount")] || 0;
    const life = LIFE[ctx.pick("bitsLens.life")] || 5;
    const shine = ctx.pick("bitsLens.shine");
    if (B.kind !== kind) {
      for (let i = 0; i < MAX_BITS; i++) spawn(B, i, kind, life, true);
      B.kind = kind;
    } else if (want > B.count) for (let i = B.count; i < want; i++) spawn(B, i, kind, life, true);
    B.count = want;
    B.pts.geometry.setDrawRange(0, want);
    B.pts.visible = want > 0;
    const mat = B.pts.material;
    mat.size = k.size * (SIZE[ctx.pick("bitsLens.size")] || 1);
    mat.opacity = k.opacity;
    const additive = !!(k.glow || shine === "glow");
    if ((mat.blending === THREE.AdditiveBlending) !== additive) {
      mat.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
      mat.needsUpdate = true;
    }
    if (!want) return;
    const g = (GRAVITY[ctx.pick("forcesLens.weight")] || 9.8) * k.fall;
    const air = k.air * (AIR[ctx.pick("forcesLens.drag")] || 1);
    const chaos = ctx.val("forcesLens.chaos");
    const whirl = ctx.val("forcesLens.whirl");
    const W = v.wind;
    const wl = W.length();
    const t = ctx.clock;
    const h = Math.min(dt, 1 / 30);
    const relax = 1 - Math.exp(-air * h);
    const bright = shine === "glow" ? 1.4 : 1;
    for (let i = 0; i < want; i++) {
      const p = i * 3;
      B.age[i] += h;
      let x = B.pos[p];
      let y = B.pos[p + 1];
      let z = B.pos[p + 2];
      if (B.age[i] > B.span[i] || y < -0.02 || y > TOP + 0.6) {
        spawn(B, i, kind, life, false);
        continue;
      }
      const s = B.seed[i];
      /* the air this bit sits in: the wind, chaos swirls, a whirl around the middle, and its own flutter */
      let ax = W.x * 7;
      let ay = W.y * 7;
      let az = W.z * 7;
      if (chaos > 0) {
        const c = chaos * 1.6 * (0.4 + wl);
        ax += Math.sin(y * 1.7 + t * 0.9 + z * 0.8) * c;
        ay += Math.sin(x * 1.3 + t * 0.7) * c * 0.6;
        az += Math.cos(x * 1.1 + t * 0.8 + y * 0.9) * c;
      }
      if (whirl > 0) {
        const r = Math.hypot(x, z) + 0.3;
        const spin = (whirl * 3.2) / Math.sqrt(r);
        ax += (-z / r) * spin - (x / r) * whirl * 0.6;
        az += (x / r) * spin - (z / r) * whirl * 0.6;
        ay += whirl * 0.5;
      }
      if (k.flutter) {
        ax += Math.sin(t * 2.3 + s) * k.flutter;
        az += Math.cos(t * 1.9 + s * 1.3) * k.flutter;
        ay += Math.sin(t * 3.1 + s * 0.7) * k.flutter * 0.4;
      }
      /* fall (or rise) with the weight of the world, and be carried by the air */
      B.vel[p] += (ax - B.vel[p]) * relax;
      B.vel[p + 1] += (ay - B.vel[p + 1]) * relax - g * h;
      B.vel[p + 2] += (az - B.vel[p + 2]) * relax;
      x += B.vel[p] * h;
      y += B.vel[p + 1] * h;
      z += B.vel[p + 2] * h;
      /* blown out of one side, come back in the other */
      if (x > BOX) x -= 2 * BOX;
      else if (x < -BOX) x += 2 * BOX;
      if (z > BOX) z -= 2 * BOX;
      else if (z < -BOX) z += 2 * BOX;
      B.pos[p] = x;
      B.pos[p + 1] = y;
      B.pos[p + 2] = z;
      let f = bright;
      if (shine === "catch the light") f = 0.65 + 0.6 * Math.max(0, Math.sin(t * 5 + s * 3));
      const fade = clamp(Math.min((B.span[i] - B.age[i]) * 3, B.age[i] * 4 + 0.2), 0, 1);
      B.col[p] = Math.min(1, B.base[p] * f) * fade;
      B.col[p + 1] = Math.min(1, B.base[p + 1] * f) * fade;
      B.col[p + 2] = Math.min(1, B.base[p + 2] * f) * fade;
    }
    B.pts.geometry.attributes.position.needsUpdate = true;
    B.pts.geometry.attributes.color.needsUpdate = true;
  }

  /* ---------- drop it: fall, land, bounce, squash ---------- */
  function startDrop(ctx) {
    if (!ctx.holder) return false;
    const D = drop(ctx);
    const v = view(ctx);
    Object.assign(D, { phase: "falling", y: 1.1, vy: 0, x: 0, z: 0, bounces: 0, landed: 0, squash: 0, squashV: 0, deepest: 0 });
    /* a little sideways start (with the wind), so Slippery shows even in still air */
    const dir = v.dir || { x: 1, z: 0 };
    D.vx = dir.x * 0.35;
    D.vz = dir.z * 0.35;
    return true;
  }
  function stepDrop(ctx, v, dt) {
    const D = drop(ctx);
    const g = GRAVITY[ctx.pick("forcesLens.weight")] || 9.8;
    const air = AIR[ctx.pick("forcesLens.drag")] || 1;
    const bw = ctx.pick("crashLens.bounce");
    const bounce = BOUNCE[bw] != null ? BOUNCE[bw] : 0.3;
    const friction = FRICTION[ctx.pick("crashLens.slide")] || 9;
    const settle = ctx.val("crashLens.settle"); /* 0 at once .. 1 a long wobble */
    const kq = Math.pow(2 * Math.PI * 2.6, 2);
    const zeta = 0.9 - settle * 0.82;
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      if (D.phase === "falling") {
        /* gravity, the air slowing it (thick air a lot), and the wind carrying it a little */
        D.vy -= g * h;
        D.vy -= D.vy * 0.08 * air * air * h;
        if (v.wind) {
          D.vx += (v.wind.x * 0.8 - D.vx) * 0.05 * air * h;
          D.vz += (v.wind.z * 0.8 - D.vz) * 0.05 * air * h;
        }
        D.y += D.vy * h;
        if (D.y <= 0) {
          const hit = -D.vy;
          D.y = 0;
          D.landed++;
          /* the body squashes in proportion to how hard it hit */
          D.squashV -= Math.min(8, hit * 1.8);
          if (hit * bounce > 0.45) {
            D.vy = hit * bounce;
            D.bounces++;
          } else {
            D.vy = 0;
            D.phase = "sliding";
          }
        }
      } else {
        /* on the floor: slide until friction stops it */
        const sp = Math.hypot(D.vx, D.vz);
        if (sp > 1e-6) {
          const slow = Math.max(0, sp - friction * 0.5 * h) / sp;
          D.vx *= slow;
          D.vz *= slow;
        }
      }
      D.x += D.vx * h;
      D.z += D.vz * h;
      /* the squash wobbles like a spring and dies down over the Settle time */
      D.squashV += (-kq * D.squash - 2 * zeta * Math.sqrt(kq) * D.squashV) * h;
      D.squash = clamp(D.squash + D.squashV * h, -0.45, 0.35);
      D.deepest = Math.min(D.deepest || 0, D.squash);
    }
    if (D.phase === "sliding" && Math.hypot(D.vx, D.vz) < 0.01 && Math.abs(D.squash) < 0.004 && Math.abs(D.squashV) < 0.03) {
      D.phase = "rest";
      D.vx = D.vz = 0;
    }
    if (D.phase === "rest" && Math.abs(D.squash) < 0.004) D.squash = D.squashV = 0;
  }
  /* The chain gives on landing: an object's joints fold in a zigzag, a body bends at the spine and knees. */
  function squashChain(ctx, D) {
    const THREE = ctx.THREE;
    const s = -D.squash; /* + when squashed down */
    if (Math.abs(s) < 0.002) return;
    const rig = ctx.rig;
    const turn = (b, deg) => {
      const r = b && ctx.info.get(b);
      if (r) b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(r.axes.bend, deg * DEG));
    };
    if (rig.object) {
      rig.spine.concat([rig.head]).forEach((b, i) => turn(b, (i % 2 ? -1 : 1) * s * (i === 0 ? 55 : 95)));
    } else {
      rig.spine.forEach((b) => turn(b, (s * 40) / Math.max(1, rig.spine.length)));
      turn(rig.head, -s * 20);
      if (!rig.quadruped)
        ["L", "R"].forEach((side) => {
          const leg = rig.legs[side];
          turn(leg[0], s * 50);
          turn(leg[1], -s * 95);
          turn(leg[2], s * 45);
        });
      (rig.tail || []).forEach((b) => turn(b, -s * 25));
    }
    ctx.model.updateMatrixWorld(true);
  }

  /* ---------- the wind arrow ---------- */
  function stepArrow(ctx, v) {
    const THREE = ctx.THREE;
    const on = !!(ctx.prefs.forces && ctx.prefs.forces.arrow);
    const W = v.wind;
    if (!v.arrow) {
      v.arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0x6ec6ff, 0.22, 0.14);
      v.arrow.name = "the wind";
      v.arrow.line.material.depthTest = false;
      v.arrow.cone.material.depthTest = false;
      v.arrow.line.renderOrder = v.arrow.cone.renderOrder = 11;
      ctx.scene.add(v.arrow);
    }
    const len = W ? W.length() : 0;
    v.arrow.visible = on && len > 0.01 && !!ctx.model;
    if (!v.arrow.visible) return;
    const dir = W.clone().normalize();
    const L = 0.35 + len * 1.2;
    const box = new THREE.Box3().setFromObject(ctx.model);
    const top = isFinite(box.max.y) ? Math.min(box.max.y, 2.4) : 1.7;
    v.arrow.position.copy(dir.clone().multiplyScalar(-L / 2)).add(new THREE.Vector3(0, top + 0.3, 0));
    v.arrow.setDirection(dir);
    v.arrow.setLength(L, 0.22, 0.14);
  }

  window.CurioRig.extend({
    id: "forces",
    label: "Forces",
    sliders: SLIDERS,
    panel(ctx) {
      const on = !!(ctx.prefs.forces && ctx.prefs.forces.arrow);
      return `<h4 title="In Maya: fields (air, gravity, turbulence, drag, vortex), nParticles and rigid bodies">Wind, bits in the air, dropping</h4>
        <p class="cap">The Wind and Bits sliders above push every loose part and fill the air. Drop it lifts the character or object and lets it fall.</p>
        <div class="rig-forces" style="display:flex;flex-wrap:wrap;gap:.4rem .8rem;align-items:center">
          <button type="button" data-forces="drop" title="In Maya: a rigid body falling under gravity, with bounciness and friction">Drop it</button>
          <label title="In Maya: the air field's direction"><input type="checkbox" data-forces="arrow"${on ? " checked" : ""}> Show the wind</label>
          <small data-forces="said" style="opacity:.75"></small>
        </div>`;
    },
    wire(ctx, box) {
      box.querySelector('[data-forces="drop"]').addEventListener("click", () => startDrop(ctx));
      box.querySelector('[data-forces="arrow"]').addEventListener("change", (e) => {
        ctx.prefs.forces = Object.assign({}, ctx.prefs.forces, { arrow: e.target.checked });
        ctx.save();
      });
      view(ctx).said = box.querySelector('[data-forces="said"]');
    },
    afterRules(ctx, dt) {
      if (!ctx.model || !ctx.holder) return;
      const v = view(ctx);
      const D = drop(ctx);
      windNow(ctx, v, ctx.clock);
      if (D.phase !== "rest" || D.squash) stepDrop(ctx, v, dt);
      const H = ctx.holder;
      H.position.y += D.y;
      H.position.x = D.x;
      H.position.z = D.z;
      H.scale.set(1, 1, 1);
      H.updateMatrixWorld(true);
      squashChain(ctx, D);
      const swing = ctx.data("forces").swing;
      if (v.wind.lengthSq() > 1e-8 || (swing && swing.size)) blowChains(ctx, v, dt);
      if (v.said) {
        const word = D.phase === "rest" ? (D.landed ? (D.bounces ? `Landed after ${D.bounces} bounce${D.bounces === 1 ? "" : "s"}.` : "Landed with a thud.") : "") : D.phase === "falling" ? "Falling…" : "Settling…";
        if (v.said.textContent !== word) v.said.textContent = word;
      }
    },
    beforeRender(ctx, dt) {
      const v = view(ctx);
      if (!v.wind) windNow(ctx, v, ctx.clock);
      stepBits(ctx, v, dt);
      stepArrow(ctx, v);
      /* squash and stretch: wide and low when squashed, tall and thin when it springs back */
      if (ctx.holder) {
        const s = clamp(drop(ctx).squash, -0.45, 0.35);
        ctx.holder.scale.set(1 - s * 0.5, 1 + s, 1 - s * 0.5);
      }
    },
  });

  window.CurioRig.forces = {
    /* what is happening now, for tests and other tools */
    state(ctl) {
      const ctx = (ctl || window.CurioRig.current()).ctx;
      const v = view(ctx);
      const D = drop(ctx);
      return {
        wind: v.wind ? v.wind.toArray() : [0, 0, 0],
        gust: v.gust,
        bits: v.bits ? v.bits.count : 0,
        drawn: v.bits && v.bits.pts.visible ? v.bits.pts.geometry.drawRange.count : 0,
        kind: v.bits ? v.bits.kind : "",
        arrow: !!(v.arrow && v.arrow.visible),
        drop: { phase: D.phase, y: D.y, vy: D.vy, x: D.x, z: D.z, bounces: D.bounces, landed: D.landed, squash: D.squash, deepest: D.deepest || 0 },
        holder: ctx.holder ? ctx.holder.position.toArray() : [0, 0, 0],
      };
    },
    drop: (ctl) => startDrop((ctl || window.CurioRig.current()).ctx),
  };
})();
