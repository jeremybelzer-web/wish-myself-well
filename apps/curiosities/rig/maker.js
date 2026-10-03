/* rig/maker.js: "Make a character from words", an add-on for the 3D characters view (CurioRig.extend).

   Type a description ("spiky blue hair swept back, overalls, a plaid shirt and boots") and the app builds a
   character from simple shapes on the Plain figure's skeleton: head, hair, hat, beard, shirt, trousers or
   overalls, boots, skin, and how heavy or thin. Every part is hung on a joint, so all the movement rules,
   poses, feet and hands, wind and lights work on it at once. It is free and runs on this device. It looks like
   a clay puppet, not a sculpted model: a detailed body from words needs a paid picture-to-3D service.

   The words are kept in localStorage "curiosities-rig3d-made-v1" ({ text }). CurioRig.maker.read(text) gives
   the plan it reads ({ hair, hairColor, hat, beard, top, topColor, bottom, bottomColor, shoes, skin, build,
   said }). */
(function () {
  const R = window.CurioRig;
  if (!R || !R.extend) return;
  const KEY = "curiosities-rig3d-made-v1";
  const ID = "made";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  };
  const write = (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch (e) {
      /* private window: the words last until the page closes */
    }
  };
  const START = "spiky blue hair swept back, a red plaid shirt, denim overalls, a straw hat and brown boots";

  if (!R.CHARACTERS.some((c) => c.id === ID))
    R.CHARACTERS.splice(1, 0, {
      id: ID,
      label: "Made from your words",
      file: "rig/models/rigged-figure.glb",
      plain: "A character built from your description out of simple shapes, on the Plain figure's 19-joint skeleton. Change the words under Make a character from words.",
      credit: "Made in the app from your words; skeleton from Rigged Figure, © 2017 Cesium, CC BY 4.0.",
    });

  /* ---------- reading the words ---------- */
  const COLORS = {
    blue: 0x2f6fe0, navy: 0x1f2f66, "light blue": 0x8cc4ff, red: 0xc8302c, green: 0x3c9a46, yellow: 0xf2cf3a, orange: 0xec7a23, purple: 0x7d4bbf, pink: 0xf08cb4,
    black: 0x1e1e22, white: 0xf2f2ee, gray: 0x8a8d93, grey: 0x8a8d93, silver: 0xc4c7cc, brown: 0x6b4426, tan: 0xc9a273, khaki: 0xb8a77a, denim: 0x3d5a8a,
    blond: 0xe8c66a, blonde: 0xe8c66a, ginger: 0xc8642c, auburn: 0x8a3a22, golden: 0xd9a838, teal: 0x2a9d9a, maroon: 0x6e1f2a,
  };
  const SKINS = { pale: 0xf3d6c2, fair: 0xf0cdb4, light: 0xeac0a0, olive: 0xc79a6b, tan: 0xc58c5c, brown: 0x8d5a3a, dark: 0x5c3a24, deep: 0x4a2c1c };
  function colorNear(t, noun) {
    const m = t.match(new RegExp("((?:light |dark )?[a-z]+)(?:[ ,-]+(?:spiky|short|long|curly|messy|slicked|swept|wavy|straight|plaid|flannel|checked|striped|button[- ]up|work|leather|cowboy|baseball|straw|bushy|scruffy|big))*[ ,-]+" + noun));
    if (!m) return null;
    const w = m[1].replace(/^(light|dark) /, (x) => x);
    if (COLORS[w] != null) return COLORS[w];
    const base = w.replace(/^(light|dark) /, "");
    if (COLORS[base] == null) return null;
    const c = new (window.THREE ? window.THREE.Color : Object)(COLORS[base]);
    if (!c.getHex) return COLORS[base];
    if (/^light /.test(w)) c.lerp(new window.THREE.Color(0xffffff), 0.45);
    if (/^dark /.test(w)) c.multiplyScalar(0.55);
    return c.getHex();
  }
  function readWords(text) {
    const t = " " + String(text || "").toLowerCase().replace(/[^a-z0-9' ,.-]/g, " ") + " ";
    const said = [];
    const has = (re) => re.test(t);
    const p = { hair: "short", hairColor: 0x4a3020, hat: "", beard: false, top: "tshirt", topColor: 0x7d8a96, plaid: false, bottom: "trousers", bottomColor: 0x3d4a5e, shoes: 0x2a2420, skin: SKINS.light, build: 1, height: 1 };
    /* a whole look named in a few words */
    if (has(/\b(farmer|farm|country|hick|redneck|rancher|tennessee|kentucky|hillbilly|appalachian)\b/)) {
      Object.assign(p, { top: "shirt", topColor: 0xb3302a, plaid: true, bottom: "overalls", bottomColor: COLORS.denim, shoes: 0x6b4426, hat: "straw" });
      said.push("a country look: plaid shirt, denim overalls, work boots, a straw hat");
    }
    if (has(/\bsonic\b|\bhedgehog\b/)) {
      Object.assign(p, { hair: "spiky", hairColor: COLORS.blue });
      said.push("spiky hair swept back (a hedgehog look, not the game character)");
    }
    if (has(/\bsuit\b/)) Object.assign(p, { top: "jacket", topColor: 0x2a2d36, bottom: "trousers", bottomColor: 0x2a2d36, shoes: 0x111111 }), said.push("a suit");
    if (has(/\bdress\b/)) Object.assign(p, { top: "tshirt", bottom: "dress" }), said.push("a dress");
    if (has(/\bskirt\b/)) (p.bottom = "dress"), said.push("a skirt");
    /* hair */
    if (has(/\b(spiky|spikes|spiked|quills)\b/)) (p.hair = "spiky"), said.includes("spiky hair swept back (a hedgehog look, not the game character)") || said.push("spiky hair");
    else if (has(/\bmohawk\b/)) (p.hair = "mohawk"), said.push("a mohawk");
    else if (has(/\b(bald|no hair|shaved head)\b/)) (p.hair = "none"), said.push("bald");
    else if (has(/\blong\b[a-z ]{0,20}\bhair\b|\bponytail\b/)) (p.hair = "long"), said.push("long hair");
    else if (has(/\b(curly|afro|wavy)\b/)) (p.hair = "curly"), said.push("curly hair");
    const hc = colorNear(t, "hair");
    if (hc != null) (p.hairColor = hc), said.push("the hair color you gave");
    /* hat */
    if (has(/\bcowboy hat\b|\bstetson\b/)) p.hat = "cowboy";
    else if (has(/\bstraw hat\b/)) p.hat = "straw";
    else if (has(/\b(baseball cap|trucker hat|trucker cap|cap)\b/)) p.hat = "cap";
    else if (has(/\b(no hat|without a hat)\b/)) p.hat = "";
    if (p.hat && !said.join(" ").includes("hat")) said.push(p.hat === "cap" ? "a cap" : `a ${p.hat} hat`);
    const hatC = colorNear(t, "(?:hat|cap)");
    p.hatColor = hatC != null ? hatC : p.hat === "straw" ? 0xd9b86a : p.hat === "cowboy" ? 0x7a5230 : 0xc8302c;
    /* face */
    if (has(/\b(beard|bearded|goatee|stubble)\b/)) (p.beard = true), said.push("a beard");
    const bc = colorNear(t, "beard");
    p.beardColor = bc != null ? bc : p.hairColor;
    /* clothes */
    if (has(/\boveralls?\b|\bdungarees\b|\bbib\b/)) (p.bottom = "overalls"), p.bottomColor === 0x3d4a5e && (p.bottomColor = COLORS.denim), said.includes("a country look: plaid shirt, denim overalls, work boots, a straw hat") || said.push("overalls");
    if (has(/\b(plaid|flannel|checked|tartan)\b/)) (p.plaid = true), (p.top = p.top === "jacket" ? "jacket" : "shirt");
    if (has(/\b(t-shirt|tee|t shirt)\b/)) p.top = "tshirt";
    if (has(/\b(tank top|vest|sleeveless)\b/)) p.top = "tank";
    if (has(/\b(jacket|coat|hoodie)\b/)) p.top = "jacket";
    const tc = colorNear(t, "(?:shirt|t-shirt|tee|top|jacket|coat|hoodie|vest|flannel)");
    if (tc != null) p.topColor = tc;
    if (has(/\b(jeans|denim)\b/) && p.bottom === "trousers") (p.bottom = "trousers"), (p.bottomColor = COLORS.denim);
    if (has(/\bshorts\b/)) (p.bottom = "shorts"), said.push("shorts");
    const bc2 = colorNear(t, "(?:overalls|trousers|pants|jeans|shorts|dress|skirt)");
    if (bc2 != null) p.bottomColor = bc2;
    const sc = colorNear(t, "(?:boots|shoes|sneakers)");
    if (sc != null) p.shoes = sc;
    if (has(/\bboots\b/) && !said.join(" ").includes("boots")) said.push("boots");
    /* skin and body */
    const sk = (t.match(/\b(pale|fair|light|olive|tan|tanned|brown|dark|deep)[ -]skin/) || [])[1];
    if (sk) (p.skin = SKINS[sk.replace("tanned", "tan")]), said.push(sk + " skin");
    if (has(/\b(chubby|fat|heavy|heavyset|stocky|big[- ]bellied|round)\b/)) (p.build = 1.5), said.push("heavy build");
    else if (has(/\b(skinny|thin|lanky|slim|wiry)\b/)) (p.build = 0.72), said.push("thin build");
    else if (has(/\b(muscular|burly|buff|strong)\b/)) (p.build = 1.3), said.push("strong build");
    if (has(/\b(tall|lanky)\b/)) p.height = 1.12;
    if (has(/\b(short|little|tiny|small)\b(?! hair| sleeve)/)) p.height = 0.86;
    p.said = said;
    return p;
  }

  /* ---------- building it ---------- */
  function build(ctx, plan) {
    const THREE = ctx.THREE;
    const model = ctx.model;
    const rig = ctx.rig;
    if (!model || !rig || !rig.head || !rig.hips) return;
    model.traverse((o) => o.isSkinnedMesh && (o.visible = false));
    model.updateMatrixWorld(true);
    const P = (b) => b.getWorldPosition(new THREE.Vector3());
    const box = new THREE.Box3().setFromObject(model);
    const H = Math.max(0.5, box.max.y - box.min.y);
    const k = plan.build;
    const mat = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, extra || {}));
    const parts = [];
    const hang = (bone, mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.made = true;
      model.add(mesh);
      mesh.updateMatrixWorld(true);
      bone.attach(mesh);
      parts.push(mesh);
      return mesh;
    };
    /* a limb piece from a to b, hung on bone */
    const limb = (bone, a, b, r, material, r2) => {
      const d = b.clone().sub(a);
      const len = d.length();
      if (len < 1e-4) return null;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r2 == null ? r : r2, r, len, 12), material);
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return hang(bone, m);
    };
    const ball = (bone, at, r, material, sy) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), material);
      m.position.copy(at);
      if (sy) m.scale.set(1, sy, 1);
      return hang(bone, m);
    };
    /* plaid: a small drawn checker */
    let topMat = mat(plan.topColor);
    if (plan.plaid) {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 64;
      const g = cv.getContext("2d");
      const base = new THREE.Color(plan.topColor);
      g.fillStyle = "#" + base.getHexString();
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = "rgba(20,20,30,.45)";
      [0, 32].forEach((x) => g.fillRect(x, 0, 12, 64));
      g.fillStyle = "rgba(20,20,30,.3)";
      [0, 32].forEach((y) => g.fillRect(0, y, 64, 12));
      g.fillStyle = "rgba(255,255,255,.25)";
      [20, 52].forEach((x) => g.fillRect(x, 0, 3, 64));
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      tex.encoding = THREE.sRGBEncoding;
      topMat = mat(0xffffff, { map: tex });
    }
    const skin = mat(plan.skin, { roughness: 0.65 });
    const bottom = mat(plan.bottomColor, { roughness: 0.9 });
    const shoes = mat(plan.shoes, { roughness: 0.6 });
    const limbR = H * 0.032 * Math.sqrt(k);

    /* torso: hips up to the neck */
    const top = rig.neck[0] || rig.head;
    const hip = P(rig.hips);
    const neck = P(top);
    const torsoR = H * 0.085 * k;
    const chest = rig.chest || rig.spine[rig.spine.length - 1] || rig.hips;
    const tor = new THREE.Mesh(new THREE.CylinderGeometry(torsoR * 0.95, torsoR * (k > 1.2 ? 1.12 : 0.88), neck.distanceTo(hip) * 1.02, 16), topMat);
    tor.position.copy(hip).lerp(neck, 0.5);
    tor.scale.z = 0.72;
    hang(chest, tor);
    if (plan.bottom === "overalls") {
      /* the bib on the front, two straps over the shoulders, a pocket */
      const bib = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 1.15, neck.distanceTo(hip) * 0.55, torsoR * 0.12), bottom);
      bib.position.copy(hip).lerp(neck, 0.36);
      bib.position.z += torsoR * 0.72 * 0.98;
      hang(chest, bib);
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 0.45, neck.distanceTo(hip) * 0.14, torsoR * 0.05), mat(new THREE.Color(plan.bottomColor).multiplyScalar(0.8).getHex()));
      pocket.position.copy(bib.position);
      pocket.position.y += neck.distanceTo(hip) * 0.06;
      pocket.position.z += torsoR * 0.08;
      hang(chest, pocket);
      [-1, 1].forEach((s) => {
        const st = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 0.16, neck.distanceTo(hip) * 0.6, torsoR * 1.6), bottom);
        st.position.copy(hip).lerp(neck, 0.78);
        st.position.x += s * torsoR * 0.42;
        hang(chest, st);
      });
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(torsoR * 0.92, torsoR * 0.92, neck.distanceTo(hip) * 0.22, 16), bottom);
      belt.position.copy(hip).lerp(neck, 0.08);
      belt.scale.z = 0.76;
      hang(rig.hips, belt);
    } else if (plan.bottom === "dress") {
      const sk = new THREE.Mesh(new THREE.ConeGeometry(torsoR * 1.6, H * 0.3, 18, 1, true), mat(plan.bottomColor, { side: THREE.DoubleSide }));
      sk.position.copy(hip);
      sk.position.y -= H * 0.08;
      hang(rig.hips, sk);
    }

    /* the seat: from the hips down past the tops of the legs, so body and legs join */
    const legTops = ["L", "R"].map((x) => rig.legs[x][0]).filter(Boolean).map(P);
    if (legTops.length) {
      const low = Math.min(...legTops.map((v) => v.y)) - limbR * 1.6;
      const spread = legTops.length === 2 ? legTops[0].distanceTo(legTops[1]) / 2 + limbR * 1.5 : torsoR;
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(torsoR * 0.9, spread), Math.max(torsoR * 0.8, spread * 0.95), Math.max(limbR * 2, hip.y - low + limbR), 16), plan.bottom === "dress" ? mat(plan.bottomColor) : bottom);
      seat.position.set(hip.x, (hip.y + limbR + low) / 2, hip.z);
      seat.scale.z = 0.76;
      hang(rig.hips, seat);
    }
    /* head, face, hair, hat, beard */
    const hp = P(rig.head);
    const headR = H * 0.072;
    const hc = hp.clone();
    hc.y += headR * 0.75;
    ball(rig.head, hc, headR, skin, 1.12);
    const eye = mat(0x18181c, { roughness: 0.3 });
    [-1, 1].forEach((s) => {
      const e = hc.clone();
      e.x += s * headR * 0.36;
      e.y += headR * 0.12;
      e.z += headR * 0.9;
      ball(rig.head, e, headR * 0.13, eye);
    });
    const nose = hc.clone();
    nose.z += headR * 1.02;
    nose.y -= headR * 0.08;
    ball(rig.head, nose, headR * 0.16, skin);
    const hairM = mat(plan.hairColor, { roughness: 0.55 });
    if (plan.hair !== "none") {
      if (plan.hair === "spiky") {
        /* spikes swept back from the top and back of the head */
        const rows = [
          [0.95, 0, 0.75],
          [0.75, -0.55, 0.85],
          [0.45, -0.95, 0.9],
          [0.05, -1.05, 0.8],
        ];
        rows.forEach(([y, z, len], ri) => {
          const n = ri === 0 ? 3 : ri === 3 ? 3 : 4;
          for (let i = 0; i < n; i++) {
            const x = (i - (n - 1) / 2) * 0.55;
            const base = hc.clone().add(new THREE.Vector3(x * headR, y * headR, z * headR * 0.6));
            const dir = new THREE.Vector3(x * 0.35, 0.35 - ri * 0.18, -1).normalize();
            const sp = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.32, headR * (1.3 + len), 8), hairM);
            sp.position.copy(base).addScaledVector(dir, headR * (0.65 + len * 0.5));
            sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            hang(rig.head, sp);
          }
        });
        const cap = ball(rig.head, hc.clone().add(new THREE.Vector3(0, headR * 0.18, -headR * 0.12)), headR * 1.04, hairM, 1.05);
        cap.scale.z = 1.02;
      } else if (plan.hair === "mohawk") {
        for (let i = 0; i < 6; i++) {
          const a = -0.4 + i * 0.32;
          const base = hc.clone().add(new THREE.Vector3(0, Math.cos(a) * headR, -Math.sin(a) * headR));
          const sp = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.18, headR * 0.9, 6), hairM);
          sp.position.copy(base);
          sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), base.clone().sub(hc).normalize());
          hang(rig.head, sp);
        }
      } else {
        const capR = plan.hair === "curly" ? headR * 1.22 : headR * 1.06;
        const c = ball(rig.head, hc.clone().add(new THREE.Vector3(0, headR * 0.22, -headR * 0.12)), capR, hairM, plan.hair === "curly" ? 1.05 : 0.95);
        c.userData.hairCap = true;
        if (plan.hair === "long") limb(rig.head, hc.clone().add(new THREE.Vector3(0, 0, -headR * 0.7)), hc.clone().add(new THREE.Vector3(0, -headR * 2.2, -headR * 0.9)), headR * 0.75, hairM, headR * 0.9);
      }
    }
    if (plan.beard) {
      const bd = ball(rig.head, hc.clone().add(new THREE.Vector3(0, -headR * 0.55, headR * 0.45)), headR * 0.62, mat(plan.beardColor, { roughness: 0.9 }), 1.1);
      bd.scale.z = 0.8;
    }
    if (plan.hat) {
      const hm = mat(plan.hatColor, { roughness: 0.85 });
      const topY = hc.y + headR * (plan.hair === "spiky" ? 0.95 : 0.85);
      if (plan.hat === "cap") {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.08, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), hm);
        crown.position.set(hc.x, topY - headR * 0.35, hc.z);
        hang(rig.head, crown);
        const bill = new THREE.Mesh(new THREE.BoxGeometry(headR * 1.3, headR * 0.08, headR * 0.9), hm);
        bill.position.set(hc.x, topY - headR * 0.33, hc.z + headR * 1.25);
        hang(rig.head, bill);
      } else {
        const brimR = headR * (plan.hat === "cowboy" ? 2.0 : 2.3);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(brimR, brimR, headR * 0.08, 28), hm);
        brim.position.set(hc.x, topY - headR * 0.1, hc.z);
        if (plan.hat === "cowboy") brim.scale.z = 0.8;
        hang(rig.head, brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.9, headR * 1.05, headR * 0.9, 20), hm);
        crown.position.set(hc.x, topY + headR * 0.32, hc.z);
        hang(rig.head, crown);
        if (plan.hat === "straw") {
          const band = new THREE.Mesh(new THREE.CylinderGeometry(headR * 1.06, headR * 1.06, headR * 0.18, 20), mat(0x7a2a22));
          band.position.set(hc.x, topY + headR * 0.0, hc.z);
          hang(rig.head, band);
        }
      }
    }
    if (rig.neck[0]) limb(rig.neck[0], neck, hp, limbR * 1.25, skin);

    /* arms: sleeves to the elbow (long sleeves past it), then skin, then a hand */
    ["L", "R"].forEach((s) => {
      const arm = rig.arms[s];
      if (arm.length >= 3) {
        const [sh, el, wr] = arm;
        const a = P(sh);
        const b = P(el);
        const c = P(wr);
        const sleeveMat = plan.top === "tank" ? skin : topMat;
        limb(sh, a, b, limbR * 1.15, sleeveMat, limbR * 1.05);
        limb(el, b, c, limbR * 0.95, plan.top === "tshirt" || plan.top === "tank" ? skin : topMat, limbR * 1.0);
        const hand = c.clone().addScaledVector(c.clone().sub(b).normalize(), limbR * 1.2);
        ball(wr, hand, limbR * 1.0, skin, 1.15);
      }
      const leg = rig.legs[s];
      if (leg.length >= 3) {
        const [hi, kn, an] = leg;
        const a = P(hi);
        const b = P(kn);
        const c = P(an);
        const shorts = plan.bottom === "shorts" || plan.bottom === "dress";
        limb(hi, a, b, limbR * 1.45 * Math.sqrt(k), bottom, limbR * 1.35 * Math.sqrt(k));
        limb(kn, b, c, limbR * 1.15, shorts ? skin : bottom, limbR * 1.25);
        /* a boot pointing forward */
        const toe = leg[3] ? P(leg[3]) : c.clone().add(new THREE.Vector3(0, 0, H * 0.08));
        const boot = new THREE.Mesh(new THREE.BoxGeometry(limbR * 2.4, limbR * 2.2, Math.max(limbR * 3, c.distanceTo(toe) * 1.6)), shoes);
        boot.position.set(c.x, Math.max(box.min.y + limbR * 1.1, c.y - limbR * 0.6), (c.z + toe.z) / 2 + limbR * 0.6);
        hang(an, boot);
        if (!shorts) limb(an, c, c.clone().add(new THREE.Vector3(0, limbR * 2.2, 0)), limbR * 1.3, shoes);
      }
    });
    ctx.data(ID).parts = parts.length;
  }

  R.maker = { read: readWords, KEY, START };

  R.extend({
    id: "maker",
    label: "Make a character from words",
    panel(ctx) {
      const saved = read().text || START;
      const on = ctx.prefs.character === ID;
      return `<h4 title="In Maya: modeling a character from primitives and parenting the pieces to the skeleton's joints">Make a character from words</h4>
        <p class="cap">Describe a look: hair, hat, beard, clothes, colors, skin, heavy or thin. It is built from simple shapes on a skeleton, so every rule here moves it.</p>
        <textarea data-maker="text" rows="3" style="width:100%;box-sizing:border-box" aria-label="Describe the character">${esc(saved)}</textarea>
        <div class="rig-row"><button type="button" data-maker="make">${on ? "Make it again" : "Make this character"}</button></div>
        <p class="cap" data-maker="said">${on ? esc(sayPlan(readWords(saved))) : ""}</p>`;
    },
    wire(ctx, box) {
      box.querySelector('[data-maker="make"]').addEventListener("click", () => {
        const text = box.querySelector('[data-maker="text"]').value.trim() || START;
        write({ text });
        box.querySelector('[data-maker="said"]').textContent = sayPlan(readWords(text));
        const sel = ctx.el.querySelector('[data-rig="character"]');
        if (!sel) return;
        if (![...sel.options].some((o) => o.value === ID)) return;
        sel.value = ID;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      });
    },
    built(ctx) {
      if (ctx.prefs.character !== ID) return;
      build(ctx, readWords(read().text || START));
    },
  });

  function sayPlan(p) {
    return p.said.length ? "Read as: " + p.said.join(", ") + "." : "No look words found, so it made a plain outfit. Try hair, a hat, a beard, clothes and colors.";
  }
})();
