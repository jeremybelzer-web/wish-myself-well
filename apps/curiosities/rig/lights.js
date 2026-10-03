/* rig/lights.js: the Light add-on for the 3D view (CurioRig.extend), from the "Bring Maya into the app" thread.

   The 3D view starts with two plain lights. With "Lights follow the curiosities" on, this add-on puts four lights
   around the character instead, the way a film set (and Maya's three-point lighting) does:
   - Main light (In Maya: key light): the strongest light; it decides where the shadows fall.
   - Fill light: a weaker light on the other side that lifts the dark side.
   - Edge light (In Maya: rim or back light): from behind, draws a bright edge around the shape.
   - Sky and bounce (In Maya: skydome light, global illumination): soft light from above and off the floor.
   A floor that catches shadows sits under the character.

   The sliders are the Light setup lens (lightRigLens in data/db-maya.js) plus two from the Lighting lens (where the
   main light comes from, the color of the light) and one from the Drawn or real look lens (smooth or banded
   shading), so they all follow the timeline like any other curiosity:
   - Main light: sun, open sky, window, spotlight, bare bulb, glowing object (each a different kind of three.js
     light, placed, sized and colored like the real thing)
   - Bright side to dark side: how strong the fill and sky are next to the main light ("one side black" = none)
   - Light bouncing around: the sky light and a warm light coming up off the floor
   - How far the light reaches: lamps fade with distance; the sun fades into a dark haze far away
   - Who the light touches: three.js r128 cannot really limit a light, so what the light skips is darkened
   - Hard or soft: sharp shadows from a small light, blurred shadows and a bigger lamp when soft
   - Rim light, Haze and beams (a haze in the air and, with beams, a visible shaft), Shaped light (an invisible
     cut-out in front of the main light throws the shadow of blinds, leaves or barn doors), Lamps in the shot
   - Color of the light: warm, mixed (warm main light, cool fill) or a cold day, by color temperature
   - Shading: smooth, three bands, two bands or flat color (cartoon shading, MeshToonMaterial)

   window.CurioRigLights = { state(ctx), kelvin(k) } for tests. */
(function () {
  if (!window.CurioRig || !CurioRig.extend) return;

  const L = "lightRigLens.";
  const SLIDERS = [
    { id: L + "lightType", lens: "lightRigLens", label: "Main light", scale: ["sun", "open sky", "window", "spotlight", "bare bulb", "glowing object"], start: 0 },
    { id: "lightingLens.key", lens: "lightingLens", label: "Where the main light comes from", scale: ["side", "front", "back", "under", "none"], start: 0 },
    { id: L + "ratio", lens: "lightRigLens", label: "Bright side to dark side", scale: ["flat and even", "gentle", "dramatic", "one side black"], start: 1 },
    { id: L + "bounce", lens: "lightRigLens", label: "Light bouncing around", scale: ["none", "a little", "rich bounce"], start: 1 },
    { id: L + "falloff", lens: "lightRigLens", label: "How far the light reaches", scale: ["reaches far", "fades across the room", "drops off fast"], start: 0 },
    { id: L + "linking", lens: "lightRigLens", label: "Who the light touches", scale: ["everyone", "only the hero", "only the background"], start: 0 },
    { id: L + "softness", lens: "lightRigLens", label: "Hard or soft", scale: ["hard", "soft"], start: 1 },
    { id: L + "rim", lens: "lightRigLens", label: "Rim light", scale: ["off", "thin", "strong"], start: 1 },
    { id: L + "haze", lens: "lightRigLens", label: "Haze and beams", scale: ["clear", "haze", "beams"], start: 0 },
    { id: L + "shape", lens: "lightRigLens", label: "Shaped light", scale: ["open", "blinds", "leaves", "barndoor"], start: 0 },
    { id: L + "practical", lens: "lightRigLens", label: "Lamps in the shot", scale: ["yes", "no"], start: 1 },
    { id: "lightingLens.colorTemp", lens: "lightingLens", label: "Color of the light", scale: ["warm practical", "mixed", "cold day"], start: 1 },
    { id: "renderLookLens.bands", lens: "renderLookLens", label: "Shading", scale: ["smooth", "three bands", "two bands", "flat color"], start: 0 },
  ];

  /* Each kind of main light: which three.js light, how high (degrees) and how far from the character it sits, how
     bright, its own color temperature and how much of it shows through the Color of the light slider. */
  const TYPES = {
    sun: { kind: "dir", el: 50, dist: 6, power: 1.25, k: 5600, w: 0.3, sky: 0.15, say: "sun" },
    "open sky": { kind: "dir", el: 72, dist: 6, power: 0.5, k: 8000, w: 0.45, sky: 0.65, soft: 0.85, say: "open sky" },
    window: { kind: "spot", el: 18, dist: 2.6, power: 1.7, angle: 0.8, k: 6500, w: 0.3, sky: 0.1, soft: 0.5, say: "window light" },
    spotlight: { kind: "spot", el: 55, dist: 3.6, power: 2.3, angle: 0.3, k: 5000, w: 0.2, sky: 0, say: "spotlight" },
    "bare bulb": { kind: "point", el: 40, dist: 1.5, power: 1.6, k: 2700, w: 0.55, sky: 0, bulb: true, say: "bare bulb" },
    "glowing object": { kind: "point", el: -5, dist: 0.75, power: 1.8, k: 1900, w: 0.7, sky: 0, orb: true, say: "glowing object" },
  };
  const FROM = { side: { az: 70, el: null }, front: { az: 20, el: null }, back: { az: 155, el: null }, under: { az: 25, el: -28 }, none: { az: 70, el: null, off: true } };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  /* a value along a few points, t from 0 to 1 */
  const along = (pts, t) => {
    const x = clamp(t, 0, 1) * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(x));
    return lerp(pts[i], pts[i + 1], x - i);
  };
  /* color temperature in kelvin to an sRGB color (0..1), after Tanner Helland's fit */
  function kelvin(k) {
    const t = clamp(k, 1000, 40000) / 100;
    const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return [r, g, b].map((c) => clamp(c, 0, 255) / 255);
  }

  const STATE = new WeakMap(); /* ctx -> what this add-on built in that view */

  function setup(ctx) {
    const T = ctx.THREE;
    const scene = ctx.scene;
    const S = { defaults: scene.children.filter((o) => o.isLight), mats: new Map(), made: [], matKey: "", h: 1.7, said: "" };
    STATE.set(ctx, S);
    ctx.renderer.shadowMap.enabled = true;
    ctx.renderer.shadowMap.type = T.PCFShadowMap; /* PCF honours shadow.radius, which is how soft light is made here */
    const g = (S.group = new T.Group());
    g.name = "lights add-on";
    scene.add(g);
    S.target = new T.Object3D();
    g.add(S.target);
    const shadowed = (l) => {
      l.shadow.bias = -0.0006;
      l.shadow.normalBias = 0.02;
      l.shadow.mapSize.set(2048, 2048);
      return l;
    };
    S.keys = {
      dir: shadowed(new T.DirectionalLight(0xffffff, 1)),
      spot: shadowed(new T.SpotLight(0xffffff, 1)),
      point: shadowed(new T.PointLight(0xffffff, 1)),
    };
    S.keys.point.shadow.mapSize.set(1024, 1024);
    S.keys.point.shadow.camera.near = 0.05;
    S.keys.point.shadow.camera.far = 20;
    S.keys.spot.shadow.camera.near = 0.1;
    Object.values(S.keys).forEach((l) => {
      if (l.target) l.target = S.target;
      g.add(l);
    });
    S.fill = new T.DirectionalLight(0xffffff, 0.5);
    S.rim = new T.DirectionalLight(0xffffff, 0.8);
    S.up = new T.DirectionalLight(0xffffff, 0); /* bounce off the floor */
    [S.fill, S.rim, S.up].forEach((l) => {
      l.target = S.target;
      g.add(l);
    });
    S.sky = new T.HemisphereLight(0xffffff, 0x6b5e50, 0.3);
    g.add(S.sky);

    /* a floor that catches shadows, just under the grid */
    S.floor = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshStandardMaterial({ color: 0x34363c, roughness: 1, metalness: 0 }));
    S.floor.rotation.x = -Math.PI / 2;
    S.floor.position.y = -0.003;
    S.floor.receiveShadow = true;
    S.floor.name = "floor";
    scene.add(S.floor);

    /* lamps in the shot, the glowing object, a shaft of light in haze */
    S.bulb = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshBasicMaterial({ color: 0xffffff }));
    S.orb = new T.Mesh(new T.SphereGeometry(0.07, 20, 14), new T.MeshBasicMaterial({ color: 0xffaa55 }));
    const cone = new T.ConeGeometry(1, 1, 32, 1, true);
    cone.translate(0, -0.5, 0); /* the tip at the light, opening downward */
    S.beam = new T.Mesh(cone, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    [S.bulb, S.orb, S.beam].forEach((m) => g.add(m));

    /* Shaped light: cut-outs that cast shadows but are never drawn (no color, no depth). */
    const cut = new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: T.DoubleSide });
    const plate = (shapes) => {
      const p = new T.Group();
      shapes.forEach(([x, y, w, h, round]) => {
        const m = new T.Mesh(round ? new T.CircleGeometry(w, 10) : new T.PlaneGeometry(w, h), cut);
        m.position.set(x, y, 0);
        m.castShadow = true;
        p.add(m);
      });
      p.visible = false;
      g.add(p);
      return p;
    };
    const blinds = [];
    for (let i = 0; i < 9; i++) blinds.push([0, -0.5 + i * 0.125, 1, 0.055]);
    const leaves = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) leaves.push([rnd() - 0.5, rnd() - 0.5, 0.035 + rnd() * 0.07, 0, true]);
    const barn = [[0, 0.42, 1, 0.3], [0, -0.42, 1, 0.3], [-0.42, 0, 0.3, 1], [0.42, 0, 0.3, 1]];
    S.shapes = { blinds: plate(blinds), leaves: plate(leaves), barndoor: plate(barn) };

    /* cartoon shading: how many tones, from dark to light */
    const ramp = (tones) => {
      const d = new Uint8Array(tones.length * 4);
      tones.forEach((v, i) => d.set([v, v, v, 255], i * 4));
      const t = new T.DataTexture(d, tones.length, 1, T.RGBAFormat);
      t.minFilter = t.magFilter = T.NearestFilter;
      t.generateMipmaps = false;
      t.needsUpdate = true;
      return t;
    };
    S.ramps = { "three bands": ramp([70, 160, 255]), "two bands": ramp([95, 255]), "flat color": ramp([215]) };
  }

  function built(ctx) {
    const S = STATE.get(ctx);
    if (!S || !ctx.model) return;
    restore(S);
    S.mats = new Map();
    S.matKey = "";
    ctx.model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      S.mats.set(o, o.material);
    });
    const box = new ctx.THREE.Box3().setFromObject(ctx.model);
    S.h = Math.max(0.3, box.max.y - box.min.y);
  }

  function restore(S) {
    S.mats.forEach((m, mesh) => (mesh.material = m));
    S.made.forEach((m) => m.dispose());
    S.made = [];
  }

  /* Shading bands and "Who the light touches" both work by swapping the character's materials. */
  function materials(ctx, S, bands, dimHero) {
    const key = bands + "|" + dimHero;
    if (key === S.matKey) return;
    S.matKey = key;
    restore(S);
    if (bands === "smooth" && !dimHero) return;
    const T = ctx.THREE;
    const swap = (m, mesh) => {
      if (!m || m.isMeshBasicMaterial || m.isShaderMaterial || m.isLineBasicMaterial) return m;
      let n;
      if (bands !== "smooth") {
        n = new T.MeshToonMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null, gradientMap: S.ramps[bands], transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest, side: m.side });
        if (m.emissive) n.emissive.copy(m.emissive);
        n.emissiveMap = m.emissiveMap || null;
        n.skinning = !!(m.skinning || mesh.isSkinnedMesh);
        n.morphTargets = !!m.morphTargets;
      } else n = m.clone();
      if (dimHero && n.color) n.color.multiplyScalar(0.18);
      S.made.push(n);
      return n;
    };
    S.mats.forEach((m, mesh) => (mesh.material = Array.isArray(m) ? m.map((x) => swap(x, mesh)) : swap(m, mesh)));
  }

  function setShadow(l, soft, extent, far) {
    const size = l.isPointLight ? 1024 : soft > 0.5 ? 512 : 2048;
    if (l.shadow.mapSize.x !== size) {
      l.shadow.mapSize.set(size, size);
      if (l.shadow.map) {
        l.shadow.map.dispose();
        l.shadow.map = null;
      }
    }
    l.shadow.radius = 1 + soft * 10;
    if (l.isDirectionalLight) {
      const c = l.shadow.camera;
      c.left = c.bottom = -extent;
      c.right = c.top = extent;
      c.near = 0.1;
      c.far = far;
      c.updateProjectionMatrix();
    }
  }

  function apply(ctx) {
    const S = STATE.get(ctx);
    if (!S) return;
    const T = ctx.THREE;
    const on = ctx.prefs.lightsFollow !== false;
    const bands = ctx.pick("renderLookLens.bands");
    S.defaults.forEach((l) => (l.visible = !on));
    S.group.visible = on;
    S.floor.visible = on;
    if (!on) {
      ctx.scene.fog = null;
      materials(ctx, S, bands, false);
      say(ctx, S, "Plain lights (the curiosities are not changing them).");
      return;
    }
    const v = (id) => ctx.val(id);
    const p = (id) => ctx.pick(id);
    const type = TYPES[p(L + "lightType")] || TYPES.sun;
    const from = FROM[p("lightingLens.key")] || FROM.side;
    const h = S.h;
    const aim = new T.Vector3(0, h * 0.55, 0);
    S.target.position.copy(aim);
    S.target.updateMatrixWorld();
    const dirTo = (az, el, d) => {
      const a = (az * Math.PI) / 180;
      const e = (el * Math.PI) / 180;
      return new T.Vector3(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d).add(aim);
    };

    /* colors: Color of the light, then a little of the light's own color */
    const t = v("lightingLens.colorTemp");
    const keyK = lerp(t < 0.5 ? lerp(2700, 4800, t / 0.5) : lerp(4800, 9500, (t - 0.5) / 0.5), type.k, type.w);
    const fillK = lerp(t < 0.5 ? lerp(3100, 8500, t / 0.5) : lerp(8500, 10000, (t - 0.5) / 0.5), type.k, type.w * 0.5);
    const col = (k) => new T.Color().setRGB(...kelvin(k)).convertSRGBToLinear();
    const keyC = col(keyK);
    const fillC = col(fillK);

    const ratio = v(L + "ratio");
    const fillFrac = along([1, 0.5, 0.18, 0], ratio);
    const ambFrac = along([1, 0.7, 0.35, 0.02], ratio);
    const bounce = v(L + "bounce");
    const soft = Math.max(v(L + "softness"), type.soft || 0);
    const falloff = v(L + "falloff");
    const linking = p(L + "linking");
    const el = from.el != null ? from.el : type.el;
    const keyPos = dirTo(from.az, el, type.dist);
    const keyOn = !from.off;

    /* main light */
    Object.keys(S.keys).forEach((k) => {
      const l = S.keys[k];
      const use = k === type.kind && keyOn;
      l.visible = use;
      l.castShadow = use;
      if (!use) return;
      l.position.copy(keyPos);
      l.color.copy(keyC);
      let power = type.power;
      if (!l.isDirectionalLight) {
        /* fading with distance, keeping the character as bright as before */
        const cut = [0, type.dist * 4, type.dist * 2.1];
        const step = Math.round(falloff * 2);
        l.distance = cut[step];
        l.decay = [0, 1, 2][step];
        if (l.distance) power /= Math.pow(1 - type.dist / l.distance, l.decay);
      }
      if (l.isSpotLight) {
        l.angle = type.angle;
        l.penumbra = 0.15 + 0.8 * soft;
      }
      l.intensity = power;
      setShadow(l, soft, h * 1.1, type.dist + h * 3);
    });

    /* fill: the other side, toward the front */
    const fillAz = from.az >= 0 ? -50 : 50;
    S.fill.position.copy(dirTo(fillAz, 15, 5));
    S.fill.color.copy(fillC);
    S.fill.intensity = (keyOn ? type.power * 0.8 : 0.6) * fillFrac * (type.kind === "dir" ? 1 : 0.7);

    /* rim: behind, opposite the main light */
    const rim = v(L + "rim");
    S.rim.position.copy(dirTo(from.az >= 0 ? -150 : 150, 35, 5));
    S.rim.color.copy(keyC);
    S.rim.intensity = rim * 1.8;

    /* sky and bounce */
    S.sky.color.copy(fillC);
    S.sky.groundColor.copy(keyC).multiplyScalar(0.55);
    S.sky.intensity = (0.08 + 0.55 * bounce + type.sky) * ambFrac;
    S.up.position.copy(dirTo(from.az * 0.5, -60, 5));
    S.up.color.copy(keyC).lerp(new T.Color(0x8a6d50), 0.5);
    S.up.intensity = 0.5 * bounce * ambFrac;

    /* lamps in the shot (bigger when the light is soft), the glowing object */
    const showLamp = keyOn && type.kind !== "dir" && (type.bulb || p(L + "practical") === "yes") && !type.orb;
    S.bulb.visible = showLamp;
    S.bulb.position.copy(keyPos);
    S.bulb.scale.setScalar(0.04 + soft * 0.12);
    S.bulb.material.color.copy(keyC);
    S.orb.visible = keyOn && !!type.orb;
    S.orb.position.copy(keyPos);
    S.orb.material.color.copy(keyC);

    /* shaped light: a cut-out between the main light and the character */
    const shape = p(L + "shape");
    Object.keys(S.shapes).forEach((k) => {
      const plate = S.shapes[k];
      plate.visible = keyOn && k === shape;
      if (!plate.visible) return;
      const gap = Math.min(1, type.dist * 0.4);
      plate.position.copy(aim).lerp(keyPos, gap / type.dist);
      plate.lookAt(keyPos);
      const spread = type.kind === "dir" ? 1 : (type.dist - gap) / type.dist;
      plate.scale.setScalar(h * 1.5 * spread);
      plate.updateMatrixWorld(true);
    });

    /* haze, beams and the dark far away */
    const haze = v(L + "haze");
    const beams = keyOn && p(L + "haze") === "beams";
    S.beam.visible = beams;
    if (beams) {
      const d = aim.clone().sub(keyPos);
      const len = d.length() * 1.1;
      S.beam.position.copy(keyPos);
      S.beam.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), d.normalize());
      const r = type.kind === "spot" ? Math.tan(type.angle) * len : type.kind === "dir" ? h * 0.35 : len * 0.5;
      S.beam.scale.set(r, len, r);
      S.beam.material.color.copy(keyC);
    }
    const bg = ctx.scene.background && ctx.scene.background.isColor ? ctx.scene.background : new T.Color(0x24262b);
    const darkFar = type.kind === "dir" ? falloff : falloff * 0.5;
    if (haze > 0.01 || darkFar > 0.01) {
      const fog = ctx.scene.fog && ctx.scene.fog.isFog ? ctx.scene.fog : (ctx.scene.fog = new T.Fog(0, 1, 50));
      fog.color.copy(bg);
      if (haze > 0.01) fog.color.lerp(keyC.clone().multiplyScalar(0.55), 0.6 * Math.min(1, haze * 1.5));
      fog.near = haze > 0.01 ? 0 : 4.5;
      fog.far = Math.min(haze > 0.01 ? lerp(70, 14, haze) : 99, darkFar > 0.01 ? lerp(60, 7.5, darkFar) : 99);
    } else ctx.scene.fog = null;

    /* who the light touches */
    S.floor.material.color.setHex(linking === "only the hero" ? 0x15161a : 0x34363c);
    materials(ctx, S, bands, linking === "only the background");

    const ratioWord = ["the dark side is lit almost as much", "the dark side is a little darker", "the dark side is much darker", "the dark side is black"][Math.round(ratio * 3)];
    const tempWord = t < 0.25 ? "warm" : t > 0.75 ? "cold" : "warm main light, cool fill";
    say(ctx, S, keyOn ? `Now: ${type.say} from the ${p("lightingLens.key")}, ${ratioWord}, ${soft > 0.5 ? "soft" : "hard"} shadows, ${tempWord}.` : `Now: no main light, only the fill and the sky; ${tempWord}.`);
  }

  function say(ctx, S, text) {
    if (text === S.said) return;
    S.said = text;
    const el = ctx.el.querySelector('[data-ext="lights"] [data-lights="now"]');
    if (el) el.textContent = text;
  }

  CurioRig.extend({
    id: "lights",
    label: "Light",
    sliders: SLIDERS,
    setup,
    built,
    beforeRender: (ctx) => apply(ctx),
    panel: (ctx) => `<h4 title="In Maya: three-point lighting, Arnold lights and shadows">Light</h4>
      <label><input type="checkbox" data-lights="follow"${ctx.prefs.lightsFollow !== false ? " checked" : ""}> Lights follow the curiosities</label>
      <p class="cap">Off: the plain lights the view starts with.</p>
      <ul class="rig-lights" style="margin:.3rem 0;padding-left:1.1rem">
        <li title="In Maya: key light"><b>Main light</b>: the strongest light; it decides where the shadows fall.</li>
        <li title="In Maya: fill light"><b>Fill light</b>: a weaker light on the other side that lifts the dark side.</li>
        <li title="In Maya: rim light or back light"><b>Edge light</b>: from behind, it draws a bright edge around the shape.</li>
        <li title="In Maya: skydome light and bounce (global illumination)"><b>Sky and bounce</b>: soft light from the sky above and off the floor below.</li>
      </ul>
      <p class="cap" data-lights="now"></p>`,
    wire(ctx, box) {
      const S = STATE.get(ctx);
      if (S) S.said = "";
      box.querySelector('[data-lights="follow"]').addEventListener("change", (e) => {
        ctx.prefs.lightsFollow = e.target.checked;
        ctx.save();
      });
    },
  });

  window.CurioRigLights = {
    kelvin,
    state(ctx) {
      const S = STATE.get(ctx);
      if (!S) return null;
      const key = Object.keys(S.keys).find((k) => S.keys[k].visible) || "";
      return {
        on: S.group.visible,
        key,
        keyIntensity: key ? S.keys[key].intensity : 0,
        keyShadows: key ? S.keys[key].castShadow : false,
        softRadius: key ? S.keys[key].shadow.radius : 0,
        fill: S.fill.intensity,
        rim: S.rim.intensity,
        sky: S.sky.intensity,
        defaultsVisible: S.defaults.some((l) => l.visible),
        floor: S.floor.visible,
        fog: !!ctx.scene.fog,
        beam: S.beam.visible,
        lamp: S.bulb.visible,
        orb: S.orb.visible,
        shape: Object.keys(S.shapes).find((k) => S.shapes[k].visible) || "",
        toon: [...S.mats.keys()].some((m) => [].concat(m.material).some((x) => x && x.isMeshToonMaterial)),
        said: S.said,
      };
    },
  };
})();
