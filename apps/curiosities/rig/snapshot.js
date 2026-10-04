/* rig/snapshot.js: "Send to storyboard", an add-on for the 3D characters view (CurioRig.extend).

   The beta is storyboards only, so this turns the 3D view into storyboard drawings:
   - Sketch look: off, clean lines (an outline around the figure and flat shading in three tones), pencil (gray
     lines and rough hatching on white paper) or marker (bold lines, flat colors). Made with three.js r128 only:
     an inverted-hull outline (a copy of each part, drawn from the inside and pushed out a few pixels on the
     screen, so the line is the same width near and far), MeshToonMaterial with a small tone ramp, pencil
     hatching added to the toon shader by onBeforeCompile, a paper-colored background, and a paper grain laid
     over the view (live) and over each drawing on a 2D canvas after reading the WebGL canvas. The grid and
     the dark floor hide while a look is on. Turning the look off puts every material, the background and the
     hidden things back, and disposes everything this add-on made.
   - Send this frame to the storyboard: the frame as it is now (with the look) becomes a small JPEG (640 x 288,
     the storyboard stage's shape, about 30 KB) in a new panel after the selected one, or on it, as one undo step
     (CuriosityStoryboard.addPictures in storyboard.js).
   - Send a flip book: N drawings, one every 1/8 s (or another gap) of the 3D view's own clock, into a new scene
     right after the selected one; each panel's seconds is the gap, so the flip book plays them at the speed
     they happened. One undo step.

   Anything else in the scene whose root has userData.sketch is drawn in the look too: a set from rig/sets.js and
   actors 2 to 4 from rig/staging.js (so a storyboard frame of a group scene looks the same on everyone). Their
   parts belong to those add-ons, so loading another character leaves them alone; before an add-on disposes such
   a root it calls release(ctx, root), which puts each part's own material back and takes the outline off.

   Other add-ons may swap materials too (lights.js for shading bands): each frame this add-on wraps whatever
   material a part has now, and gives that one back when the look goes off.

   ctx.prefs.sketchLook keeps the look. window.CurioRigSnapshot = { LOOKS, state(ctx), setLook(ctx, look),
   frame(ctx) -> data URL, send(ctx, opts), flipBook(ctx, { count, gap }), release(ctx, root) } for tests and add-ons. */
(function () {
  const R = window.CurioRig;
  if (!R || typeof R.extend !== "function") return;

  const W = 640;
  const H = 288; /* the storyboard stage is 200 x 90 */
  const QUALITY = 0.8;
  /* paper: the background (sRGB); ink: the outline; width: the outline in CSS pixels; tones: the toon ramp the
     scene's lights go through (0..255); shade: the flat tones (light, middle, dark) and cut: where the drawing
     light changes tone; grain: how much paper grain shows */
  const LOOKS = {
    off: { label: "Off" },
    clean: { label: "Clean lines", paper: 0xf7f3ea, ink: 0x1c1712, width: 2.2, tones: [120, 195, 255], shade: [1.05, 0.74, 0.52], cut: [0.3, -0.25], grain: 0.25 },
    pencil: { label: "Pencil", paper: 0xfbfaf6, ink: 0x55555b, width: 1.4, tones: [70, 150, 255], shade: [1, 0.7, 0.45], cut: [0.35, -0.2], grain: 0.55, hatch: true },
    marker: { label: "Marker", paper: 0xffffff, ink: 0x101010, width: 3.6, tones: [150, 255], shade: [1.05, 0.62, 0.62], cut: [0.1, 0.1], grain: 0.12, punch: 1.35 },
  };
  const COUNTS = [4, 6, 8, 12, 16, 24];
  const GAPS = [
    [1 / 12, "1/12 s"],
    [1 / 8, "1/8 s"],
    [1 / 6, "1/6 s"],
    [1 / 4, "1/4 s"],
    [1 / 2, "1/2 s"],
  ];

  const STATE = new WeakMap(); /* ctx -> what this add-on made in that view */
  function st(ctx) {
    let S = STATE.get(ctx);
    if (!S) STATE.set(ctx, (S = { look: "off", per: new Map(), outline: {}, ramp: null, hidden: [], bg: null, bgUnder: null, queue: [], overlay: null, said: "" }));
    return S;
  }
  const lookOf = (ctx) => (LOOKS[ctx.prefs.sketchLook] ? ctx.prefs.sketchLook : "off");

  /* ---------- paper grain (one small tile, made once per page) ---------- */
  let grainTile = null;
  let grainUrl = "";
  function grain() {
    if (grainTile) return grainTile;
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, 160, 160);
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const img = g.getImageData(0, 0, 160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 255 - Math.pow(rnd(), 3) * 40;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    }
    g.putImageData(img, 0, 0);
    /* a few fibers */
    g.strokeStyle = "rgba(120,110,95,0.10)";
    g.lineWidth = 0.7;
    for (let k = 0; k < 26; k++) {
      const x = rnd() * 160;
      const y = rnd() * 160;
      const a = rnd() * Math.PI;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * 6 + rnd() * 3, y + Math.sin(a) * 6, x + Math.cos(a) * 12, y + Math.sin(a) * 12);
      g.stroke();
    }
    grainTile = c;
    try {
      grainUrl = c.toDataURL("image/png");
    } catch (e) {}
    return c;
  }

  /* ---------- the outline: an inverted hull pushed out in screen pixels ---------- */
  const HULL_VERT = `
    #include <common>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    uniform float width;
    uniform vec2 res;
    void main() {
      #include <beginnormal_vertex>
      #include <morphnormal_vertex>
      #include <skinbase_vertex>
      #include <skinnormal_vertex>
      #include <defaultnormal_vertex>
      #include <begin_vertex>
      #include <morphtarget_vertex>
      #include <skinning_vertex>
      #include <project_vertex>
      vec3 n = transformedNormal;
      #ifdef FLIP_SIDED
        n = -n;
      #endif
      vec2 d = (projectionMatrix * vec4(n, 0.0)).xy;
      float l = length(d);
      if (l > 1e-6) gl_Position.xy += d / l * (2.0 * width / res) * gl_Position.w;
    }`;
  const HULL_FRAG = `
    uniform vec3 ink;
    void main() { gl_FragColor = vec4(ink, 1.0); }`;
  function outlineMat(ctx, S, skinned) {
    const k = skinned ? "skin" : "plain";
    if (S.outline[k]) return S.outline[k];
    const T = ctx.THREE;
    const m = new T.ShaderMaterial({
      uniforms: { width: { value: 2 }, res: { value: new T.Vector2(800, 500) }, ink: { value: new T.Color(0) } },
      vertexShader: HULL_VERT,
      fragmentShader: HULL_FRAG,
      side: T.BackSide,
    });
    m.skinning = skinned;
    m.name = "sketch outline";
    return (S.outline[k] = m);
  }
  /* Smooth normals, corners shared by position: for a model that came without any (the fox), and for the outline
     of parts with hard edges (the maker's boxes), so the outline has no gaps at the corners. */
  function smoothNormals(T, g) {
    const pos = g.attributes.position;
    const idx = g.index;
    const n = pos.count;
    const out = new Float32Array(n * 3);
    const key = new Array(n);
    const sum = new Map();
    for (let i = 0; i < n; i++) key[i] = Math.round(pos.getX(i) * 1e4) + "," + Math.round(pos.getY(i) * 1e4) + "," + Math.round(pos.getZ(i) * 1e4);
    const a = new T.Vector3();
    const b = new T.Vector3();
    const c = new T.Vector3();
    const tri = idx ? idx.count / 3 : n / 3;
    for (let t = 0; t < tri; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3;
      const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      a.fromBufferAttribute(pos, i0);
      b.fromBufferAttribute(pos, i1);
      c.fromBufferAttribute(pos, i2);
      c.sub(b);
      a.sub(b);
      c.cross(a); /* (c - b) x (a - b): the face's outward normal, weighted by its size */
      [i0, i1, i2].forEach((i) => {
        const s = sum.get(key[i]) || [0, 0, 0];
        s[0] += c.x;
        s[1] += c.y;
        s[2] += c.z;
        sum.set(key[i], s);
      });
    }
    for (let i = 0; i < n; i++) {
      const s = sum.get(key[i]) || [0, 1, 0];
      const l = Math.hypot(s[0], s[1], s[2]) || 1;
      out.set([s[0] / l, s[1] / l, s[2] / l], i * 3);
    }
    return new T.BufferAttribute(out, 3);
  }
  function wantsHull(mesh, under) {
    if (!mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.normal) return false;
    return ![].concat(under).some((m) => !m || m.transparent || m.alphaTest > 0 || m.isMeshBasicMaterial || m.isShaderMaterial || m.isPointsMaterial || m.isLineBasicMaterial);
  }
  /* The hull shares the part's own buffers and adds only its smoothed normals. */
  function makeHull(ctx, S, mesh) {
    const T = ctx.THREE;
    const g = mesh.geometry;
    const hg = new T.BufferGeometry();
    ["position", "skinIndex", "skinWeight"].forEach((k) => g.attributes[k] && hg.setAttribute(k, g.attributes[k]));
    if (g.index) hg.setIndex(g.index);
    hg.setAttribute("normal", smoothNormals(T, g));
    let hull;
    if (mesh.isSkinnedMesh && mesh.skeleton) {
      hull = new T.SkinnedMesh(hg, outlineMat(ctx, S, true));
      hull.bind(mesh.skeleton, mesh.bindMatrix);
      hull.bindMode = mesh.bindMode;
    } else hull = new T.Mesh(hg, outlineMat(ctx, S, false));
    hull.userData.sketchHull = true;
    hull.name = "sketch outline";
    hull.frustumCulled = false;
    hull.castShadow = false;
    hull.receiveShadow = false;
    hull.raycast = () => {}; /* clicking a joint still finds the part itself */
    mesh.add(hull);
    return hull;
  }

  /* ---------- the drawing materials ---------- */
  function ramp(ctx, S, tones) {
    const key = tones.join(",");
    if (S.ramp && S.ramp.key === key) return S.ramp.tex;
    if (S.ramp) S.ramp.tex.dispose();
    const T = ctx.THREE;
    const d = new Uint8Array(tones.length * 4);
    tones.forEach((v, i) => d.set([v, v, v, 255], i * 4));
    const tex = new T.DataTexture(d, tones.length, 1, T.RGBAFormat);
    tex.minFilter = tex.magFilter = T.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    S.ramp = { key, tex };
    return tex;
  }
  /* The drawing's shading, added to the end of the toon shader: a fixed "drawing light" from the upper left
     of the camera gives two or three flat tones (so every drawing reads the same way, whatever the lights), and
     where the scene's own lights leave a part dark (lights.js: one side black) that tone wins. Pencil turns the
     tone into hatching on paper instead of color. Constants are baked in, one program per look. */
  const f = (x) => (Number.isInteger(x) ? x + ".0" : String(x));
  function shadeGlsl(L) {
    const [hi, mid, lo] = L.shade;
    const tone = `
      float sketchBl = max(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)), 0.03);
      float sketchSl = dot(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse, vec3(0.299, 0.587, 0.114)) / sketchBl;
      float sketchNdl = dot(normalize(normal), normalize(vec3(-0.45, 0.62, 0.65)));
      float sketchT = sketchNdl > ${f(L.cut[0])} ? 1.0 : sketchNdl > ${f(L.cut[1])} ? ${f(mid)} : ${f(lo)};
      float sketchS = sketchSl > 0.6 ? 1.0 : sketchSl > 0.3 ? ${f(mid)} : ${f(lo)};
      float tone = min(sketchT, sketchS) * ${f(hi)};`;
    if (!L.hatch)
      return `#include <dithering_fragment>
    {${tone}
      gl_FragColor.rgb = linearToOutputTexel(vec4(diffuseColor.rgb * tone + totalEmissiveRadiance, 1.0)).rgb;
    }`;
    return `#include <dithering_fragment>
    {${tone}
      vec2 q = gl_FragCoord.xy / sketchPr;
      float jit = fract(sin(dot(floor(q / 5.0), vec2(12.9898, 78.233))) * 43758.5453);
      float ink = 0.0;
      if (tone < 0.99 && mod(q.x + q.y + jit * 1.6, 6.0) < 1.2) ink = 0.45 + 0.2 * jit;
      if (tone < ${f(mid - 0.01)} && mod(q.x - q.y + jit * 1.6, 6.0) < 1.2) ink = 0.7;
      vec3 paper = vec3(0.985, 0.98, 0.965);
      gl_FragColor.rgb = mix(paper, vec3(0.36, 0.36, 0.39), ink);
    }`;
  }
  function drawMat(ctx, S, look, m, mesh) {
    const T = ctx.THREE;
    if (!m || m.isShaderMaterial || m.isPointsMaterial || m.isLineBasicMaterial || m.isSpriteMaterial) return m;
    const L = LOOKS[look];
    const opts = { gradientMap: ramp(ctx, S, L.tones), transparent: !!m.transparent, opacity: m.opacity == null ? 1 : m.opacity, alphaTest: m.alphaTest || 0, side: m.side };
    if (L.hatch) {
      opts.color = 0xffffff;
      if (m.alphaTest > 0 || m.transparent) opts.map = m.map || null; /* keeps a cut-out's see-through edge */
    } else {
      opts.color = m.color ? m.color.clone() : new T.Color(0xffffff);
      opts.map = m.map || null;
      if (L.punch && m.color) {
        const hsl = {};
        opts.color.getHSL(hsl);
        opts.color.setHSL(hsl.h, Math.min(1, hsl.s * L.punch), hsl.l);
      }
    }
    const n = new T.MeshToonMaterial(opts);
    if (m.isMeshBasicMaterial) n.emissive.copy(m.color || new T.Color(0)); /* a lamp bulb stays lit */
    else if (m.emissive && !L.hatch) n.emissive.copy(m.emissive);
    n.skinning = !!(m.skinning || mesh.isSkinnedMesh);
    n.morphTargets = !!m.morphTargets;
    n.name = "sketch " + look;
    if (!S.pr) S.pr = { value: 1 };
    const glsl = shadeGlsl(L);
    n.onBeforeCompile = (sh) => {
      sh.uniforms.sketchPr = S.pr;
      sh.fragmentShader = "uniform float sketchPr;\n" + sh.fragmentShader.replace("#include <dithering_fragment>", glsl);
    };
    n.customProgramCacheKey = () => "sketch-" + look;
    return n;
  }
  /* Take a hull off and give back only what it owns (its normals), not the part's shared buffers. */
  function dropHull(hull) {
    if (!hull) return;
    if (hull.parent) hull.parent.remove(hull);
    const hg = hull.geometry;
    Object.keys(hg.attributes).forEach((k) => k !== "normal" && hg.deleteAttribute(k));
    hg.setIndex(null);
    hg.dispose();
  }
  const disposeMat = (m) => [].concat(m || []).forEach((x) => x && x.dispose && x.dispose());

  /* Wrap every part of the model in the look, and of anything else in the scene marked userData.sketch (a set
     from rig/sets.js); parts that went away (a new hat from the maker, a cleared set) are let go. */
  const sketchRoots = (ctx) => [ctx.model].concat(ctx.scene ? ctx.scene.children.filter((o) => o.userData && o.userData.sketch && o.visible) : []).filter(Boolean);
  const inSketchRoot = (o) => {
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.sketch) return true;
    return false;
  };
  function sync(ctx, S, look) {
    const seen = new Set();
    sketchRoots(ctx).forEach((root) =>
      root.traverse((o) => {
        if (!o.isMesh || o.userData.sketchHull) return;
        seen.add(o);
        let e = S.per.get(o);
        if (e && e.look !== look && o.material === e.mine) o.material = e.under; /* a new look: wrap it again */
        if (!e || e.look !== look || o.material !== e.mine) {
          if (e) disposeMat(e.mine);
          const under = o.material;
          const mine = Array.isArray(under) ? under.map((m) => drawMat(ctx, S, look, m, o)) : drawMat(ctx, S, look, under, o);
          e = { under, mine, look, hull: e ? e.hull : null };
          S.per.set(o, e);
          o.material = mine;
        }
        const g = o.geometry;
        if (g && g.attributes && g.attributes.position && !g.attributes.normal) g.setAttribute("normal", smoothNormals(ctx.THREE, g)); /* the fox has none; the outline needs them */
        if (!e.hull && wantsHull(o, e.under)) e.hull = makeHull(ctx, S, o);
      })
    );
    S.per.forEach((e, o) => {
      if (seen.has(o)) return;
      if (o.material === e.mine) o.material = e.under;
      disposeMat(e.mine);
      dropHull(e.hull);
      S.per.delete(o);
    });
    /* the outline width in drawing-buffer pixels */
    const L = LOOKS[look];
    const pr = ctx.renderer.getPixelRatio();
    const size = ctx.renderer.getDrawingBufferSize(new ctx.THREE.Vector2());
    Object.values(S.outline).forEach((m) => {
      m.uniforms.width.value = L.width * pr;
      m.uniforms.res.value.copy(size);
      m.uniforms.ink.value.setHex(L.ink);
    });
    if (S.pr) S.pr.value = pr;
  }

  /* Paper behind, no grid, no dark floor, no haze. */
  function stage(ctx, S, look) {
    const T = ctx.THREE;
    const scene = ctx.scene;
    if (!S.bg) S.bg = new T.Color();
    S.bg.setHex(LOOKS[look].paper);
    if (scene.background !== S.bg) {
      S.bgUnder = scene.background;
      scene.background = S.bg;
    }
    scene.fog = null; /* lights.js sets its haze again each frame */
    scene.children.forEach((o) => {
      if ((o.isGridHelper || o.type === "GridHelper" || o.name === "floor") && o.visible) {
        o.visible = false;
        if (!S.hidden.includes(o)) S.hidden.push(o);
      }
    });
  }

  /* Give everything back and dispose what was made. */
  function restore(ctx, S) {
    S.per.forEach((e, o) => {
      if (o.material === e.mine) o.material = e.under;
      disposeMat(e.mine);
      dropHull(e.hull);
    });
    S.per.clear();
    Object.values(S.outline).forEach((m) => m.dispose());
    S.outline = {};
    if (S.ramp) S.ramp.tex.dispose();
    S.ramp = null;
    if (ctx.scene && ctx.scene.background === S.bg) ctx.scene.background = S.bgUnder;
    S.bgUnder = null;
    S.hidden.forEach((o) => (o.visible = true));
    S.hidden = [];
    S.look = "off";
  }

  /* The paper grain over the live view (pointer events pass through). */
  function overlay(ctx, S, look) {
    const canvas = ctx.renderer && ctx.renderer.domElement;
    const L = LOOKS[look];
    if (!canvas || !canvas.parentNode) return;
    if (!L.grain) {
      if (S.overlay) S.overlay.hidden = true;
      return;
    }
    if (!S.overlay || !S.overlay.isConnected) {
      grain();
      const d = document.createElement("div");
      d.className = "rig-snap-paper";
      d.setAttribute("aria-hidden", "true");
      d.style.cssText = `position:absolute;pointer-events:none;mix-blend-mode:multiply;border-radius:.4rem;background-image:url(${grainUrl});background-size:160px 160px`;
      if (getComputedStyle(canvas.parentNode).position === "static") canvas.parentNode.style.position = "relative";
      canvas.parentNode.appendChild(d);
      S.overlay = d;
    }
    const d = S.overlay;
    d.hidden = false;
    const want = [canvas.offsetLeft, canvas.offsetTop, canvas.offsetWidth, canvas.offsetHeight, L.grain].join(",");
    if (d.dataset.at !== want) {
      d.dataset.at = want;
      Object.assign(d.style, { left: canvas.offsetLeft + "px", top: canvas.offsetTop + "px", width: canvas.offsetWidth + "px", height: canvas.offsetHeight + "px", opacity: String(L.grain) });
    }
  }

  function apply(ctx) {
    const S = st(ctx);
    const look = lookOf(ctx);
    if (look === "off") {
      if (S.look !== "off" || S.per.size) restore(ctx, S);
      if (S.overlay) S.overlay.hidden = true;
    } else if (ctx.scene && ctx.renderer) {
      sync(ctx, S, look);
      stage(ctx, S, look);
      overlay(ctx, S, look);
      S.look = look;
    }
    /* captures waiting for this frame (or for a moment of the view's clock) */
    S.drawnAt = performance.now();
    if (S.queue.length) {
      let url = "";
      while (S.queue.length && (S.queue[0].at == null || ctx.clock >= S.queue[0].at - 0.004)) {
        url = url || picture(ctx, S);
        S.queue.shift().done(url);
        if (S.queue.length && S.queue[0].at != null) break; /* one moment per frame, so a flip book never repeats a frame */
      }
    }
  }

  /* ---------- the picture: render now, read the WebGL canvas, finish it on a 2D canvas ---------- */
  function picture(ctx, S) {
    const r = ctx.renderer;
    r.render(ctx.scene, ctx.camera);
    const src = r.domElement;
    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const g = out.getContext("2d");
    const sw = src.width || 1;
    const sh = src.height || 1;
    const s = Math.min(W / sw, H / sh);
    const dw = Math.round(sw * s);
    const dh = Math.round(sh * s);
    const x0 = Math.round((W - dw) / 2);
    const y0 = Math.round((H - dh) / 2);
    g.imageSmoothingQuality = "high";
    g.drawImage(src, x0, y0, dw, dh);
    /* fill the sides with the background's own color */
    const px = g.getImageData(x0 + 1, y0 + 1, 1, 1).data;
    g.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`;
    if (x0 > 0) {
      g.fillRect(0, 0, x0, H);
      g.fillRect(x0 + dw, 0, W - x0 - dw, H);
    }
    if (y0 > 0) {
      g.fillRect(0, 0, W, y0);
      g.fillRect(0, y0 + dh, W, H - y0 - dh);
    }
    const L = LOOKS[lookOf(ctx)];
    if (L.grain) {
      g.globalCompositeOperation = "multiply";
      g.globalAlpha = L.grain;
      g.fillStyle = g.createPattern(grain(), "repeat");
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
    let url = "";
    try {
      url = out.toDataURL("image/jpeg", QUALITY);
    } catch (e) {}
    out.width = out.height = 0;
    return url;
  }

  /* The next frame's picture (with the look). Falls back to drawing at once when the view is not running. */
  function frame(ctx) {
    const S = st(ctx);
    return new Promise((resolve) => {
      const job = { at: null, done: resolve };
      S.queue.push(job);
      setTimeout(() => {
        const i = S.queue.indexOf(job);
        if (i < 0) return;
        S.queue.splice(i, 1);
        apply(ctx);
        resolve(picture(ctx, S));
      }, 1500);
    });
  }
  /* count pictures, one every gap seconds of the view's own clock. */
  function frames(ctx, count, gap) {
    const S = st(ctx);
    const t0 = ctx.clock + 0.02;
    const jobs = [];
    const all = Array.from({ length: count }, (_, k) => new Promise((resolve) => jobs.push({ at: t0 + k * gap, done: resolve })));
    S.queue.push(...jobs);
    /* Only when the view stops drawing (a hidden tab) for 3 s: finish with what it shows now. A slow but
       running view keeps going, since its clock (not the wall clock) decides each drawing's moment. */
    const limit = setInterval(() => {
      if (performance.now() - (S.drawnAt || 0) < 3000) return;
      clearInterval(limit);
      const left = jobs.filter((j) => S.queue.includes(j));
      if (!left.length) return;
      S.queue = S.queue.filter((j) => !left.includes(j));
      apply(ctx);
      const url = picture(ctx, S);
      left.forEach((j) => j.done(url));
    }, 500);
    return Promise.all(all).finally(() => clearInterval(limit));
  }

  /* ---------- into the storyboard ---------- */
  const SB = () => window.CuriosityStoryboard;
  function say(ctx, text) {
    const S = st(ctx);
    S.said = text;
    const el = ctx.el && ctx.el.querySelector('[data-ext="snapshot"] [data-snap="said"]');
    if (el) el.textContent = text;
  }
  function where(r) {
    return r ? `scene ${r.si + 1}, panel ${r.pi + 1}` : "";
  }
  async function send(ctx, opts) {
    opts = opts || {};
    const sb = SB();
    if (!sb || typeof sb.addPictures !== "function") {
      say(ctx, "The storyboard is not on this page, so there is nowhere to send it.");
      return null;
    }
    const pic = await frame(ctx);
    if (!pic) return say(ctx, "The 3D view could not be read just now. Try again."), null;
    const r = sb.addPictures([{ pic }], { onto: !!opts.onto, label: "a frame from the 3D view" });
    if (!r) say(ctx, "That drawing could not be added.");
    else if (r.error) say(ctx, r.error);
    else say(ctx, `${opts.onto ? "Drawn onto" : "Added as"} ${where(r)} of the storyboard. Open the Storyboard to flip through it.`);
    return r;
  }
  async function flipBook(ctx, opts) {
    opts = opts || {};
    const sb = SB();
    if (!sb || typeof sb.addPictures !== "function") {
      say(ctx, "The storyboard is not on this page, so there is nowhere to send it.");
      return null;
    }
    const count = Math.max(2, Math.min(24, Math.round(Number(opts.count) || 8)));
    const gap = Math.max(0.04, Math.min(2, Number(opts.gap) || 1 / 8));
    say(ctx, `Drawing ${count} frames, one every ${gapWord(gap)}…`);
    const pics = (await frames(ctx, count, gap)).filter(Boolean);
    if (!pics.length) return say(ctx, "The 3D view could not be read just now. Try again."), null;
    const r = sb.addPictures(
      pics.map((pic) => ({ pic, seconds: gap })),
      { scene: true, name: "Flip book from the 3D view", label: `a flip book of ${pics.length} frames from the 3D view` }
    );
    if (!r) say(ctx, "The flip book could not be added.");
    else if (r.error) say(ctx, r.error);
    else say(ctx, `A flip book of ${r.count} drawings is now scene ${r.si + 1} of the storyboard; each stays up ${gapWord(gap)}, so it plays at the speed it moved here.`);
    return r;
  }
  const gapWord = (g) => (GAPS.find((x) => Math.abs(x[0] - g) < 1e-6) || [0, Math.round(g * 100) / 100 + " s"])[1];

  R.extend({
    id: "snapshot",
    label: "Send to storyboard",
    setup(ctx) {
      st(ctx);
    },
    built(ctx) {
      /* the old model is gone (the view disposed it); let go of what was wrapped around it */
      const S = st(ctx);
      S.per.forEach((e, o) => {
        if (inSketchRoot(o)) return; /* a set's parts are its own to give back; they are let go when they leave */
        S.per.delete(o);
        disposeMat(e.mine);
        [].concat(e.under || []).forEach((m) => {
          if (!m) return;
          Object.keys(m).forEach((k) => m[k] && m[k].isTexture && m[k].dispose());
          m.dispose();
        });
      });
    },
    beforeRender: (ctx) => apply(ctx),
    panel(ctx) {
      const look = lookOf(ctx);
      const flip = ctx.prefs.sketchFlip || {};
      const count = COUNTS.includes(flip.count) ? flip.count : 8;
      const gap = GAPS.some((g) => Math.abs(g[0] - flip.gap) < 1e-6) ? flip.gap : 1 / 8;
      return `<h4 title="In Maya: Toon outlines and shaders, Playblast">Send to storyboard</h4>
        <label>Sketch look <select data-snap="look">${Object.keys(LOOKS)
          .map((k) => `<option value="${k}"${k === look ? " selected" : ""}>${LOOKS[k].label}</option>`)
          .join("")}</select></label>
        <p class="cap">Makes the 3D view look like a storyboard drawing: clean lines, pencil or marker.</p>
        <p><button type="button" data-snap="frame">Send this frame to the storyboard</button></p>
        <label class="rig-rule"><input type="checkbox" data-snap="onto"${ctx.prefs.sketchOnto ? " checked" : ""}> Draw it on the panel I picked in the storyboard <small>Off: it goes in a new panel right after that one.</small></label>
        <p style="display:flex;flex-wrap:wrap;gap:.3rem .5rem;align-items:center;margin:.5rem 0 .2rem">
          <span>Flip book:</span>
          <select data-snap="count" aria-label="How many drawings">${COUNTS.map((n) => `<option${n === count ? " selected" : ""}>${n}</option>`).join("")}</select>
          <span>drawings, one every</span>
          <select data-snap="gap" aria-label="Time between drawings">${GAPS.map((g, i) => `<option value="${i}"${Math.abs(g[0] - gap) < 1e-6 ? " selected" : ""}>${g[1]}</option>`).join("")}</select>
          <button type="button" data-snap="flip">Send a flip book</button>
        </p>
        <p class="cap">A flip book follows the movement as it plays here (a walk, a nod) and becomes its own scene in the storyboard, timed to play back at the same speed. Each drawing is small (about 30 KB), so lots of them fit.</p>
        <p class="cap" data-snap="said" role="status"></p>`;
    },
    wire(ctx, box) {
      const S = st(ctx);
      const q = (k) => box.querySelector(`[data-snap="${k}"]`);
      if (S.said) q("said").textContent = S.said;
      const flipPrefs = () => (ctx.prefs.sketchFlip = Object.assign({ count: 8, gap: 1 / 8 }, ctx.prefs.sketchFlip));
      q("look").addEventListener("change", (e) => {
        ctx.prefs.sketchLook = e.target.value;
        ctx.save();
      });
      q("onto").addEventListener("change", (e) => {
        ctx.prefs.sketchOnto = e.target.checked;
        ctx.save();
      });
      q("count").addEventListener("change", (e) => {
        flipPrefs().count = Number(e.target.value);
        ctx.save();
      });
      q("gap").addEventListener("change", (e) => {
        flipPrefs().gap = GAPS[Number(e.target.value)][0];
        ctx.save();
      });
      const busy = (b, fn) => async () => {
        if (b.disabled) return;
        b.disabled = true;
        try {
          await fn();
        } finally {
          b.disabled = false;
        }
      };
      q("frame").addEventListener("click", busy(q("frame"), () => send(ctx, { onto: q("onto").checked })));
      q("flip").addEventListener("click", busy(q("flip"), () => flipBook(ctx, { count: Number(q("count").value), gap: GAPS[Number(q("gap").value)][0] })));
    },
  });

  window.CurioRigSnapshot = {
    LOOKS,
    setLook(ctx, look) {
      ctx.prefs.sketchLook = LOOKS[look] ? look : "off";
      ctx.save();
      const sel = ctx.el && ctx.el.querySelector('[data-snap="look"]');
      if (sel) sel.value = ctx.prefs.sketchLook;
    },
    state(ctx) {
      const S = st(ctx);
      let hulls = 0;
      let wrapped = 0;
      S.per.forEach((e, o) => {
        if (e.hull && e.hull.parent) hulls++;
        if (o.material === e.mine) wrapped++;
      });
      return { look: S.look, wrapped, hulls, outlines: Object.keys(S.outline).length, ramp: !!S.ramp, hidden: S.hidden.length, paper: !!(ctx.scene && ctx.scene.background === S.bg), overlay: !!(S.overlay && !S.overlay.hidden), waiting: S.queue.length, said: S.said };
    },
    frame,
    send,
    flipBook,
    /* give back everything wrapped under root (an actor about to be disposed): its own materials go back on */
    release(ctx, root) {
      const S = STATE.get(ctx);
      if (!S || !root) return;
      S.per.forEach((e, o) => {
        let under = false;
        for (let p = o; p && !under; p = p.parent) under = p === root;
        if (!under) return;
        if (o.material === e.mine) o.material = e.under;
        disposeMat(e.mine);
        dropHull(e.hull);
        S.per.delete(o);
      });
    },
  };
})();
