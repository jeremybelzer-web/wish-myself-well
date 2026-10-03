/* rig/rig.js: 3D characters that move by rules (the "Bring Maya into the app" thread, 2026-10-03).

   Jeremy, 14:30Z: "we also need to do whatever Maya does. Create 3D models that move and behave in a specific
   way. Which are incredibly intricate. And have lots and lots of rules about the movement." He asked for ready
   made characters to be found, downloaded and imported (14:30Z).

   What a rigged character is, in plain words: a 3D body (the mesh) with a skeleton of joints inside it. Move a
   joint and the skin follows. The "rig" is the set of rules on top of the skeleton: how far each joint may bend,
   which joints move together, what the head keeps looking at, what lags behind. Maya builds these with joint
   limits, constraints, Set Driven Key and dynamic chains; here each rule is a curiosity slider you can automate.

   Three free characters ship in rig/models (credits in rig/models/CREDITS.md). Your own .glb file (bought or
   free) loads the same way and stays on this device.

   Every frame:
   1. base pose: the rest pose, or the clip that is playing (walk, run, look around) at the chosen pace;
   2. driven poses: the Movement rules and Poses sliders bend whole groups of joints (spine, neck, arms...);
   3. your own joint changes, mirrored to the other side when Mirror is on;
   4. joint limits: every joint is held inside what that kind of joint can do (a knee only bends one way);
   5. aim: the head turns toward what it looks at, inside what a neck can do;
   6. follow-through: loose parts (arms, head, tail) lag behind and catch up.

   Values come from the sliders here, or, when the Screen is open, from the timeline lanes of rigRulesLens and
   poseRigLens at the playhead, so the rules are automated like any other curiosity.

   window.CurioRig = { CHARACTERS, LIMITS, SLIDERS, mount(el, opts) -> controller, open(), current() }
   Needs three.js r128 (loaded on demand from cdnjs, like the rest of the app) and rig/GLTFLoader.js. */
(function () {
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const LOADER_URL = "rig/GLTFLoader.js";
  const KEY = "curiosities-rig3d-v1";
  const DB_NAME = "curiomatic-rigs";

  const CHARACTERS = [
    { id: "rigged-figure", label: "Plain figure", file: "rig/models/rigged-figure.glb", plain: "A simple person with 19 joints. It has no walk of its own, so its walk and run are made by the rules here.", credit: "Rigged Figure, © 2017 Cesium, CC BY 4.0 (Khronos glTF sample models)" },
    { id: "cesium-man", label: "Cesium Man", file: "rig/models/cesium-man.glb", plain: "The same skeleton with a textured body and a walk.", credit: "Cesium Man, © 2017 Cesium, CC BY 4.0 (Khronos glTF sample models). The logo on his shirt is Cesium's." },
    { id: "desk-lamp", label: "Desk lamp", make: "lamp", object: true, plain: "An object, not a character: a lamp made of simple shapes, given a chain of joints from its base to its shade.", credit: "Made in the app." },
    { id: "tree", label: "Young tree", make: "tree", object: true, plain: "An object: a tree given a chain of joints up its trunk, so it bends, sways and follows through like a body.", credit: "Made in the app." },
    { id: "fox", label: "Fox", file: "rig/models/fox.glb", plain: "A four-legged animal with a tail and three moves: look around, walk, run.", credit: "Fox model by PixelMannen (CC0); rigging and animation by tomkranis (CC BY 4.0); glTF by AsoboStudio and scurest" },
  ];

  /* The sliders this tool follows: the Movement rules lens and four from Poses and body control. The scales
     match data/db-maya.js; a value is a position on the scale from 0 to 1. */
  const SLIDERS = [
    { id: "rigRulesLens.motion", lens: "rigRulesLens", label: "What the body is doing", scale: ["standing still", "looking around", "walking", "running"], start: 0 },
    { id: "rigRulesLens.pace", lens: "rigRulesLens", label: "Pace", scale: ["dragging", "slow", "normal", "brisk", "frantic"], start: 2 },
    { id: "rigRulesLens.slump", lens: "rigRulesLens", label: "Spine", scale: ["proud and upright", "relaxed", "slumped", "collapsed"], start: 1 },
    { id: "rigRulesLens.lookAt", lens: "rigRulesLens", label: "Where the eyes go", scale: ["straight ahead", "at the camera", "at the ground", "up", "all around"], start: 0 },
    { id: "rigRulesLens.floppy", lens: "rigRulesLens", label: "Loose parts", scale: ["stiff", "a little give", "loose", "floppy"], start: 1 },
    { id: "rigRulesLens.breath", lens: "rigRulesLens", label: "Breathing", scale: ["held", "calm", "heavy", "heaving"], start: 1 },
    { id: "rigRulesLens.limits", lens: "rigRulesLens", label: "How far joints bend", scale: ["like rubber", "natural", "stiff"], start: 1 },
    { id: "poseRigLens.lineOfAction", lens: "poseRigLens", label: "Line through the body", scale: ["straight and stiff", "slight curve", "strong curve", "S curve"], start: 0 },
    { id: "poseRigLens.twist", lens: "poseRigLens", label: "Twist in the body", scale: ["square to the camera", "slight twist", "strong twist"], start: 0 },
    { id: "poseRigLens.balance", lens: "poseRigLens", label: "Balance", scale: ["falling", "off balance", "shifting", "settled", "planted"], start: 4 },
    { id: "poseRigLens.symmetry", lens: "poseRigLens", label: "Even or uneven", scale: ["mirror twins", "slightly uneven", "clearly uneven"], start: 0 },
  ];

  /* How far each kind of joint may turn, in degrees. bend: the end of the bone moves toward the front (+) or the
     back (-); side: away from the middle of the body (+) or toward it; twist: turning around the bone. */
  const LIMITS = {
    hips: { bend: [-30, 30], side: [-20, 20], twist: [-45, 45], say: "Hips" },
    spine: { bend: [-25, 40], side: [-20, 20], twist: [-25, 25], say: "Spine" },
    neck: { bend: [-40, 50], side: [-35, 35], twist: [-60, 60], say: "Neck" },
    head: { bend: [-30, 40], side: [-25, 25], twist: [-40, 40], say: "Head" },
    shoulder: { bend: [-50, 170], side: [-30, 170], twist: [-80, 80], say: "Shoulder" },
    elbow: { bend: [0, 150], side: [0, 0], twist: [-80, 80], say: "Elbow (bends one way)" },
    wrist: { bend: [-70, 70], side: [-30, 30], twist: [-60, 60], say: "Wrist" },
    hip: { bend: [-30, 120], side: [-20, 60], twist: [-40, 40], say: "Hip joint" },
    knee: { bend: [-150, 0], side: [0, 0], twist: [-10, 10], say: "Knee (bends one way)" },
    ankle: { bend: [-40, 40], side: [-20, 20], twist: [-15, 15], say: "Ankle" },
    frontHip: { bend: [-90, 90], side: [-20, 40], twist: [-30, 30], say: "Front leg, top" },
    frontKnee: { bend: [-90, 90], side: [0, 0], twist: [-10, 10], say: "Front leg, middle" },
    tail: { bend: [-60, 60], side: [-60, 60], twist: [-30, 30], say: "Tail" },
    other: { bend: [-45, 45], side: [-45, 45], twist: [-45, 45], say: "Joint" },
    base: { bend: [-10, 10], side: [-10, 10], twist: [-180, 180], say: "Base (turns in place)" },
    joint: { bend: [-70, 70], side: [-45, 45], twist: [-30, 30], say: "Bend" },
    tip: { bend: [-70, 70], side: [-60, 60], twist: [-90, 90], say: "Tip" },
  };
  /* The rules you can switch off, each with Maya's name for it. */
  const RULES = [
    { id: "limits", label: "Joint limits", maya: "Limit Information on each joint", plain: "Every joint stays inside what that kind of joint can do. Knees and elbows only bend one way." },
    { id: "mirror", label: "Mirror left and right", maya: "Mirror Joint, symmetry", plain: "A change to one arm or leg is copied to the other side." },
    { id: "driven", label: "Driven poses", maya: "Set Driven Key", plain: "One slider moves many joints: Spine bends the back, neck and head together." },
    { id: "aim", label: "Head aims", maya: "Aim constraint", plain: "The head turns by itself toward where the eyes go." },
    { id: "follow", label: "Follow-through", maya: "Dynamic joint chains, overlapping action", plain: "Arms, head and tail lag behind the body and catch up." },
    { id: "breath", label: "Breathing", maya: "An expression driving the chest", plain: "The chest rises and falls on its own." },
  ];

  /* ---------- "Tell it what you want": plain words to rules ----------
     Jeremy, 14:39Z: "the AI can make decisions about which parts bend and how far based on what the user wants."
     This first version is free and runs on the device: it reads feelings ("sleepy", "scared"), moves ("hop",
     "run"), where to look, speed, and which parts are stiff or loose ("stiff base, floppy top"), and shows every
     change it made so you can see it and undo it. A paid AI that reads any sentence can plug in later. */
  const S_ = { motion: "rigRulesLens.motion", pace: "rigRulesLens.pace", slump: "rigRulesLens.slump", lookAt: "rigRulesLens.lookAt", floppy: "rigRulesLens.floppy", breath: "rigRulesLens.breath", limits: "rigRulesLens.limits", line: "poseRigLens.lineOfAction", twist: "poseRigLens.twist", balance: "poseRigLens.balance", symmetry: "poseRigLens.symmetry" };
  const MOODS = [
    [/sleep|tired|drows|yawn|exhaust|nod off|nodding/, "sleepy", { slump: "slumped", pace: "slow", lookAt: "at the ground", breath: "heavy", floppy: "loose" }],
    [/sad|depress|gloom|lonely|heartbroken|defeat/, "sad", { slump: "slumped", pace: "dragging", lookAt: "at the ground", breath: "calm", line: "slight curve" }],
    [/happy|joy|excit|bouncy|cheer|playful|giddy/, "happy", { slump: "proud and upright", pace: "brisk", lookAt: "at the camera", floppy: "loose", line: "strong curve", balance: "shifting" }],
    [/scared|afraid|nervous|anxious|terrif|jumpy|paranoid/, "scared", { pace: "frantic", lookAt: "all around", breath: "heaving", limits: "stiff", slump: "relaxed", balance: "off balance" }],
    [/angry|mad\b|furious|rage|tense/, "angry", { slump: "proud and upright", limits: "stiff", breath: "heavy", lookAt: "at the camera", twist: "strong twist", floppy: "stiff" }],
    [/curious|nosy|interest|wonder|search/, "curious", { lookAt: "all around", line: "slight curve", slump: "relaxed", floppy: "a little give" }],
    [/proud|confident|bold|brave|heroic|strong/, "proud", { slump: "proud and upright", balance: "planted", lookAt: "at the camera", line: "slight curve" }],
    [/drunk|dizzy|wobbl|woozy|tipsy|unsteady/, "dizzy", { balance: "falling", floppy: "floppy", line: "S curve", limits: "like rubber", symmetry: "clearly uneven" }],
    [/robot|mechanical|rigid|stiff as|wooden/, "robotic", { floppy: "stiff", limits: "stiff", line: "straight and stiff", symmetry: "mirror twins" }],
    [/cartoon|rubber|jelly|wiggly|noodl|squishy/, "rubbery", { limits: "like rubber", floppy: "floppy", line: "S curve" }],
    [/calm|relax|peaceful|chill|serene/, "calm", { slump: "relaxed", pace: "slow", breath: "calm", floppy: "a little give" }],
    [/shy|embarrass|awkward|timid/, "shy", { slump: "slumped", lookAt: "at the ground", twist: "slight twist", symmetry: "slightly uneven" }],
  ];
  const WORDS = [
    [/\b(run|running|race|racing|sprint|flee|chase)/, "motion", "running"],
    [/\b(walk|walking|stroll|hop|hopping|bounce|bouncing|jump)/, "motion", "walking"],
    [/\b(look(s|ing)? around|scan|survey)/, "motion", "looking around"],
    [/\b(stand(s|ing)? still|freeze|stays? still|stop moving)/, "motion", "standing still"],
    [/\b(very slow|really slow|crawl)/, "pace", "dragging"],
    [/\b(slow|slowly|lazy|lazily)\b/, "pace", "slow"],
    [/\b(very fast|really fast|frantic|panic)/, "pace", "frantic"],
    [/\b(fast|quick|quickly|hurry)/, "pace", "brisk"],
    [/\b(look(s|ing)? at (me|us|the camera|the audience)|stare(s)? at (me|us|the camera))/, "lookAt", "at the camera"],
    [/\b(look(s|ing)? (down|at the (ground|floor))|nod|bow)/, "lookAt", "at the ground"],
    [/\b(look(s|ing)? up|at the sky|gaze up)/, "lookAt", "up"],
    [/\b(look(s|ing)? around|look(s|ing)? everywhere)/, "lookAt", "all around"],
    [/\b(breath(e|es|ing)? hard|pant|out of breath|huff)/, "breath", "heaving"],
    [/\b(hold(s|ing)? (its|his|her|their) breath|holds? breath)/, "breath", "held"],
    [/\b(slump|droop|hunch|sag|wilt)/, "slump", "slumped"],
    [/\b(collapse|flop over|fall over|melt)/, "slump", "collapsed"],
    [/\b(stand(s|ing)? tall|upright|straight up|chest out)/, "slump", "proud and upright"],
    [/\b(sway|swaying|swing|swinging|wind)/, "line", "strong curve"],
    [/\b(twist|turn(s|ing)? away)/, "twist", "strong twist"],
    [/\b(falling|tipping|topple)/, "balance", "falling"],
  ];
  const PARTS = [
    ["top", /\b(top|tip|head|shade|crown|end)\b/],
    ["base", /\b(base|bottom|foot|feet|root|trunk)\b/],
    ["middle", /\b(middle|body|spine|stem|neck|arm of the lamp|pole)\b/],
    ["arms", /\b(arms?|hands?|branches)\b/],
    ["legs", /\b(legs?|knees?)\b/],
    ["tail", /\b(tail)\b/],
  ];
  const HOW = [
    [/\b(don'?t bend|never bends?|locked|fixed|frozen|solid|no bend)/, 0],
    [/\b(stiff|rigid|barely|a little|slightly|tight)/, 0.35],
    [/\b(very loose|super floppy|really floppy|wild)/, 2.2],
    [/\b(loose|floppy|bendy|bends? a lot|flexible|wobbly|limp)/, 1.7],
  ];
  function readRequest(text) {
    const t = " " + String(text || "").toLowerCase() + " ";
    const values = {};
    const said = [];
    MOODS.forEach(([re, name, set]) => {
      if (!re.test(t)) return;
      said.push(name);
      Object.keys(set).forEach((k) => (values[S_[k]] = set[k]));
    });
    WORDS.forEach(([re, k, word]) => re.test(t) && (values[S_[k]] = word));
    /* which parts bend and how far: one clause at a time ("stiff base, floppy top") */
    const parts = {};
    t.split(/,|;|\.|\bbut\b|\band\b|\bwhile\b/).forEach((clause) => {
      const how = HOW.find(([re]) => re.test(clause));
      if (!how) return;
      PARTS.forEach(([part, re]) => re.test(clause) && (parts[part] = how[1]));
    });
    return { values, parts, said };
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DEG = Math.PI / 180;

  /* ---------- saved choices (per viewer, this device) ---------- */
  function loadPrefs() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    p.character = p.character || "rigged-figure";
    p.values = p.values && typeof p.values === "object" ? p.values : {};
    SLIDERS.forEach((s) => typeof p.values[s.id] !== "number" && (p.values[s.id] = s.start / (s.scale.length - 1)));
    p.rules = Object.assign({ limits: true, mirror: true, driven: true, aim: true, follow: true, breath: true }, p.rules || {});
    p.joints = p.joints && typeof p.joints === "object" ? p.joints : {};
    p.showBones = !!p.showBones;
    p.parts = p.parts && typeof p.parts === "object" ? p.parts : {};
    return p;
  }
  function savePrefs(p) {
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch (e) {}
  }

  /* ---------- your own characters: kept in this browser (IndexedDB), never uploaded ---------- */
  const memory = new Map();
  function idb() {
    return new Promise((resolve) => {
      try {
        const r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore("files");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }
  async function keepFile(name, buf) {
    memory.set(name, buf);
    const db = await idb();
    if (!db) return;
    await new Promise((res) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(buf, name);
      tx.oncomplete = tx.onerror = () => res();
    });
  }
  async function ownFiles() {
    const db = await idb();
    if (!db) return [...memory.keys()];
    return new Promise((res) => {
      const r = db.transaction("files").objectStore("files").getAllKeys();
      r.onsuccess = () => res([...new Set([...r.result.map(String), ...memory.keys()])]);
      r.onerror = () => res([...memory.keys()]);
    });
  }
  async function readFile(name) {
    if (memory.has(name)) return memory.get(name);
    const db = await idb();
    if (!db) return null;
    return new Promise((res) => {
      const r = db.transaction("files").objectStore("files").get(name);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
  }
  async function forgetFile(name) {
    memory.delete(name);
    const db = await idb();
    if (!db) return;
    await new Promise((res) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").delete(name);
      tx.oncomplete = tx.onerror = () => res();
    });
  }

  /* ---------- three.js and the loader, once ---------- */
  let loading = null;
  function script(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("could not load " + src));
      document.head.appendChild(s);
    });
  }
  function need3D() {
    if (window.THREE && window.THREE.GLTFLoader) return Promise.resolve(window.THREE);
    if (!loading)
      loading = (window.THREE ? Promise.resolve() : script(THREE_URL))
        .then(() => (window.THREE.GLTFLoader ? null : script(LOADER_URL)))
        .then(() => window.THREE)
        .catch((e) => {
          loading = null;
          throw e;
        });
    return loading;
  }

  /* ---------- reading a skeleton: which joint is which ---------- */
  function sideOf(bone, hipsX) {
    const n = bone.name || "";
    if (/left/i.test(n) || /(^|[^a-zA-Z])L([^a-zA-Z]|$)/.test(n)) return "L";
    if (/right/i.test(n) || /(^|[^a-zA-Z])R([^a-zA-Z]|$)/.test(n)) return "R";
    const p = new window.THREE.Vector3();
    bone.getWorldPosition(p);
    if (Math.abs(p.x - hipsX) > 0.02) return p.x > hipsX ? "L" : "R";
    return "";
  }
  /* Walks the skeleton from the hips and names every joint's role. Works on any humanoid or four-legged rig
     whose chains branch at the hips and the chest, whatever the joints are called. */
  function classify(bones) {
    const THREE = window.THREE;
    const set = new Set(bones);
    const kids = (b) => b.children.filter((c) => set.has(c));
    const size = new Map();
    const count = (b) => {
      if (size.has(b)) return size.get(b);
      let n = 1;
      kids(b).forEach((k) => (n += count(k)));
      size.set(b, n);
      return n;
    };
    bones.forEach(count);
    const roots = bones.filter((b) => !set.has(b.parent)).sort((a, b) => count(b) - count(a));
    const out = { roles: new Map(), hips: null, spine: [], chest: null, neck: [], head: null, arms: { L: [], R: [] }, legs: { L: [], R: [] }, tail: [], quadruped: false };
    if (!roots.length) return out;
    let hips = roots[0];
    while (kids(hips).length === 1) hips = kids(hips)[0];
    out.hips = hips;
    const hp = new THREE.Vector3();
    hips.getWorldPosition(hp);
    const chain = (b) => {
      const list = [b];
      while (kids(list[list.length - 1]).length === 1) list.push(kids(list[list.length - 1])[0]);
      return list;
    };
    const hk = kids(hips);
    const central = hk.filter((k) => !sideOf(k, hp.x)).sort((a, b) => count(b) - count(a));
    const spineStart = central[0];
    if (spineStart) {
      let b = spineStart;
      out.spine.push(b);
      while (kids(b).length === 1) {
        b = kids(b)[0];
        out.spine.push(b);
      }
      out.chest = b;
      kids(b).forEach((k) => {
        const s = sideOf(k, hp.x);
        if (s) out.arms[s] = out.arms[s].length ? out.arms[s] : chain(k);
        else if (!out.neck.length) out.neck = chain(k);
      });
      if (out.neck.length > 1) out.head = out.neck.pop();
      else if (out.neck.length === 1) {
        out.head = out.neck[0];
        out.neck = [];
      }
    }
    hk.forEach((k) => {
      if (k === spineStart) return;
      const s = sideOf(k, hp.x);
      if (s) out.legs[s] = out.legs[s].length ? out.legs[s] : chain(k);
      else out.tail = chain(k);
    });
    /* Four legs: the "arms" reach the ground. */
    const endY = (list) => {
      const p = new THREE.Vector3();
      list[list.length - 1].getWorldPosition(p);
      return p.y;
    };
    if (out.arms.L.length && out.legs.L.length) out.quadruped = endY(out.arms.L) < hp.y * 0.6;
    const set1 = (b, role, side, index) => b && out.roles.set(b, { role, side: side || "", index: index || 0 });
    set1(hips, "hips");
    out.spine.forEach((b, i) => set1(b, "spine", "", i));
    out.neck.forEach((b, i) => set1(b, "neck", "", i));
    set1(out.head, "head");
    ["L", "R"].forEach((s) => {
      out.arms[s].forEach((b, i) => set1(b, out.quadruped ? ["frontHip", "frontKnee", "ankle"][Math.min(i, 2)] : ["shoulder", "elbow", "wrist"][Math.min(i, 2)], s, i));
      out.legs[s].forEach((b, i) => set1(b, ["hip", "knee", "ankle"][Math.min(i, 2)], s, i));
    });
    out.tail.forEach((b, i) => set1(b, "tail", "", i));
    bones.forEach((b) => !out.roles.has(b) && set1(b, "other"));
    return out;
  }

  /* ---------- any object: a chain of joints along its length ----------
     Jeremy, 14:39Z: "Can we map those onto all sorts of objects, those same principles?" Anything without a
     skeleton (a lamp, a tree, your own .glb, a cut-out picture) gets one: a chain of joints from its base to its
     tip along its longest side, and each point of its surface follows the two joints nearest it. Then every rule
     works on it: the tip aims, the chain droops, sways, hops and follows through. */
  function autoRig(model, count) {
    const THREE = window.THREE;
    count = count || 5;
    model.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
    const meshes = [];
    model.traverse((o) => o.isMesh && !o.isSkinnedMesh && meshes.push(o));
    if (!meshes.length) return null;
    const parts = meshes.map((m) => {
      const g = m.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      g.computeBoundingBox();
      return { m, g };
    });
    const box = new THREE.Box3();
    parts.forEach((p) => box.union(p.g.boundingBox));
    const size = box.getSize(new THREE.Vector3());
    const ax = size.y >= 0.5 * Math.max(size.x, size.z) ? "y" : size.x >= size.z ? "x" : "z";
    const lo = box.min[ax];
    const len = Math.max(1e-6, size[ax]);
    const bones = [];
    for (let i = 0; i < count; i++) {
      const b = new THREE.Bone();
      b.name = "joint " + (i + 1);
      if (i === 0) {
        box.getCenter(b.position);
        b.position[ax] = lo;
        model.add(b);
      } else {
        b.position[ax] = len / (count - 1);
        bones[i - 1].add(b);
      }
      bones.push(b);
    }
    model.updateMatrixWorld(true);
    const skel = new THREE.Skeleton(bones);
    const made = parts.map(({ m, g }) => {
      const pos = g.attributes.position;
      const n = pos.count;
      const si = new Uint16Array(n * 4);
      const sw = new Float32Array(n * 4);
      for (let k = 0; k < n; k++) {
        const v = ax === "x" ? pos.getX(k) : ax === "y" ? pos.getY(k) : pos.getZ(k);
        const t = clamp((v - lo) / len, 0, 1) * (count - 1);
        const i = Math.min(count - 2, Math.floor(t));
        si[k * 4] = i;
        si[k * 4 + 1] = i + 1;
        sw[k * 4] = 1 - (t - i);
        sw[k * 4 + 1] = t - i;
      }
      g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
      g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
      const mats = (Array.isArray(m.material) ? m.material : [m.material]).map((x) => {
        const c = x.clone();
        c.skinning = true;
        return c;
      });
      const sm = new THREE.SkinnedMesh(g, Array.isArray(m.material) ? mats : mats[0]);
      sm.frustumCulled = false;
      m.parent.remove(m);
      model.add(sm);
      return sm;
    });
    model.updateMatrixWorld(true);
    made.forEach((sm) => sm.bind(skel));
    return bones;
  }
  /* The roles of a chain: a base that stays put, bends along the way, and a tip that aims. */
  function chainRig(bones) {
    const n = bones.length;
    const roles = new Map();
    bones.forEach((b, i) => roles.set(b, { role: i === 0 ? "base" : i === n - 1 ? "tip" : "joint", side: "", index: i }));
    return { roles, object: true, hips: bones[0], spine: bones.slice(1, n - 1), chest: bones[n - 2], neck: [], head: bones[n - 1], arms: { L: [], R: [] }, legs: { L: [], R: [] }, tail: [], quadruped: false };
  }
  /* Objects made in the app from simple shapes, standing straight up, front toward +z. */
  function makeObject(kind) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.1 }, o || {}));
    const add = (geo, m, x, y, z) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      g.add(mesh);
      return mesh;
    };
    if (kind === "lamp") {
      const metal = mat(0xd9dde3, { metalness: 0.5, roughness: 0.35 });
      add(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 32, 1), mat(0x30343b), 0, 0.04, 0);
      add(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 12, 12), metal, 0, 0.45, 0);
      add(new THREE.SphereGeometry(0.06, 16, 12), mat(0x30343b), 0, 0.83, 0);
      add(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 12, 12), metal, 0, 1.14, 0);
      const shade = add(new THREE.CylinderGeometry(0.1, 0.26, 0.32, 32, 4, true), mat(0xe8eaee, { side: THREE.DoubleSide }), 0, 1.5, 0.08);
      shade.rotation.x = Math.PI / 2;
      add(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), 0, 1.5, 0.16);
    } else {
      const bark = mat(0x6b4a2f, { roughness: 0.9 });
      add(new THREE.CylinderGeometry(0.07, 0.13, 1.1, 12, 16), bark, 0, 0.55, 0);
      const leaf = mat(0x3f8f4a, { roughness: 0.8 });
      [
        [0.62, 0.7, 1.15],
        [0.5, 0.6, 1.55],
        [0.36, 0.5, 1.9],
      ].forEach(([r, h, y]) => add(new THREE.ConeGeometry(r, h, 18, 6), leaf, 0, y, 0));
    }
    return g;
  }
  /* A cut-out picture as a flat puppet: a card the shape of the picture, see-through where the picture is. */
  function pictureCard(img) {
    const THREE = window.THREE;
    const w = img.width || 1;
    const h = img.height || 1;
    const tex = new THREE.Texture(img);
    tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    const geo = new THREE.PlaneGeometry(w / h, 1, 6, 32);
    geo.translate(0, 0.5, 0);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9 })));
    return g;
  }
  const isPicture = (name) => /\.(png|webp|jpe?g|gif)$/i.test(name || "");

  /* ---------- the viewer and the rules ---------- */
  function mount(el, opts) {
    opts = opts || {};
    const prefs = loadPrefs();
    if (opts.character) prefs.character = opts.character;
    let THREE = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let holder = null;
    let model = null;
    let mixer = null;
    let action = null;
    let actionKey = "";
    let clips = [];
    let bones = [];
    let rig = null;
    let info = new Map(); /* bone -> { rest, axes, limit, role, side, prev } */
    let helper = null;
    let marker = null;
    let picked = null;
    let raf = 0;
    let stopped = false;
    let last = 0;
    let clock = 0;
    let fromTimeline = {};
    let objH = 1.7;
    let orbit = { yaw: 0.5, pitch: 0.18, dist: 4.2, y: 0.9 };
    let ready = null;
    let readyResolve = null;
    let loadError = "";
    ready = new Promise((r) => (readyResolve = r));

    el.classList.add("rig3d");
    el.innerHTML = `<div class="rig-top">
        <label>Character <select data-rig="character"></select></label>
        <label class="rig-file">Bring in your own (a .glb character or object, or a cut-out picture) <input type="file" accept=".glb,.gltf,model/gltf-binary,image/png,image/webp,image/jpeg" data-rig="file"></label>
        <button type="button" data-rig="forget" hidden>Forget this one</button>
      </div>
      <p class="rig-credit" data-rig="credit"></p>
      <div class="rig-main">
        <div class="rig-view"><canvas data-rig="canvas" aria-label="3D character. Drag to turn around it, scroll to zoom, click a joint to pose it."></canvas>
          <div class="rig-viewbar"><button type="button" data-rig="front">Front</button><button type="button" data-rig="side">Side</button><label><input type="checkbox" data-rig="bones"> Show the skeleton</label><span class="rig-status" data-rig="status">Loading…</span></div>
        </div>
        <div class="rig-panel">
          <h4>Tell it what you want</h4>
          <form class="rig-ask" data-rig="ask-form"><input type="text" data-rig="ask" placeholder="e.g. sleepy, nodding, stiff base and a floppy top" aria-label="Tell it what you want"><button type="submit">Do it</button></form>
          <div class="rig-said" data-rig="said"></div>
          <h4>Movement rules</h4>
          <p class="cap">Each one is a curiosity: automate it from the timeline like any other.</p>
          <div data-rig="sliders"></div>
          <h4>Rules on or off</h4>
          <div data-rig="rules"></div>
          <h4>Pose one joint</h4>
          <p class="cap">Click a joint on the character, or pick it here.</p>
          <div data-rig="joint"></div>
        </div>
      </div>`;
    const $ = (s) => el.querySelector(`[data-rig="${s}"]`);
    const canvas = $("canvas");
    const status = (t) => ($("status").textContent = t);

    /* --- panel: sliders --- */
    function sliderHtml() {
      return SLIDERS.map((s) => {
        const n = s.scale.length - 1;
        const v = prefs.values[s.id];
        const word = s.scale[Math.round(v * n)];
        return `<div class="rig-row" data-row="${esc(s.id)}"><label><span>${esc(s.label)}</span> <b data-word>${esc(word)}</b><small data-auto-note hidden>from the timeline</small>
          <input type="range" min="0" max="${n}" step="0.01" value="${(v * n).toFixed(2)}" data-slider="${esc(s.id)}"></label>
          <button type="button" class="chip" data-auto="${esc(s.lens)}" title="Automate ${esc(s.label)}">automate</button></div>`;
      }).join("");
    }
    $("sliders").innerHTML = sliderHtml();
    $("rules").innerHTML = RULES.map((r) => `<label class="rig-rule" title="In Maya: ${esc(r.maya)}"><input type="checkbox" data-rule="${r.id}"${prefs.rules[r.id] ? " checked" : ""}> <b>${esc(r.label)}</b> <small>${esc(r.plain)}</small></label>`).join("");
    $("bones").checked = prefs.showBones;

    el.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.slider) {
        const s = SLIDERS.find((x) => x.id === t.dataset.slider);
        const v = Number(t.value) / (s.scale.length - 1);
        prefs.values[s.id] = v;
        t.closest(".rig-row").querySelector("[data-word]").textContent = s.scale[Math.round(Number(t.value))];
        savePrefs(prefs);
      } else if (t.dataset.joint) {
        if (!picked) return;
        const key = jointKey(picked);
        const j = (prefs.joints[key] = Object.assign({ bend: 0, side: 0, twist: 0 }, prefs.joints[key]));
        j[t.dataset.joint] = Number(t.value);
        if (prefs.rules.mirror) {
          const twin = twinOf(picked);
          if (twin) prefs.joints[jointKey(twin)] = { bend: j.bend, side: j.side, twist: -j.twist };
        }
        t.parentElement.querySelector("output").textContent = Math.round(Number(t.value)) + "°";
        savePrefs(prefs);
      }
    });
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.rule) {
        prefs.rules[t.dataset.rule] = t.checked;
        savePrefs(prefs);
        drawJoint();
      } else if (t.dataset.rig === "bones") {
        prefs.showBones = t.checked;
        if (helper) helper.visible = t.checked;
        savePrefs(prefs);
      } else if (t.dataset.rig === "character") {
        prefs.character = t.value;
        savePrefs(prefs);
        load();
      } else if (t.dataset.rig === "joint-pick") {
        picked = bones.find((b) => jointKey(b) === t.value) || null;
        drawJoint();
      } else if (t.dataset.rig === "file" && t.files && t.files[0]) {
        bringIn(t.files[0]);
        t.value = "";
      }
    });
    let before = null;
    function ask(text) {
      const req = readRequest(text);
      const changes = [];
      before = { values: Object.assign({}, prefs.values), parts: Object.assign({}, prefs.parts) };
      Object.keys(req.values).forEach((id) => {
        const s = SLIDERS.find((x) => x.id === id);
        if (s && ctl.set(id, req.values[id])) changes.push(`${s.label}: ${req.values[id]}`);
      });
      const PART_SAY = { top: "the top", base: "the base", middle: "the middle", arms: "the arms", legs: "the legs", tail: "the tail" };
      Object.keys(req.parts).forEach((part) => {
        prefs.parts[part] = req.parts[part];
        const m = req.parts[part];
        changes.push(`${PART_SAY[part]} ${m === 0 ? "does not bend" : m < 1 ? "bends a little (stiff)" : "bends further (loose)"}`);
      });
      savePrefs(prefs);
      drawJoint();
      const box = $("said");
      box.innerHTML = changes.length
        ? `<p>${req.said.length ? "Read as <b>" + esc(req.said.join(", ")) + "</b>. " : ""}Changed:</p><ul>${changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul><button type="button" data-rig="undo-ask">Undo these</button>`
        : `<p>No words it knows yet. Try a feeling (sleepy, scared, proud), a move (walk, run, hop, look around), a speed, where to look, or which part is stiff or loose.</p>`;
      return { changes, said: req.said, parts: req.parts };
    }
    el.addEventListener("submit", (e) => {
      if (!e.target.matches('[data-rig="ask-form"]')) return;
      e.preventDefault();
      ask($("ask").value);
    });
    el.addEventListener("click", (e) => {
      if (e.target.closest('[data-rig="undo-ask"]') && before) {
        prefs.parts = before.parts;
        SLIDERS.forEach((s) => ctl.set(s.id, s.scale[Math.round(before.values[s.id] * (s.scale.length - 1))]));
        prefs.values = before.values;
        savePrefs(prefs);
        before = null;
        $("said").innerHTML = "<p>Undone.</p>";
        drawJoint();
        return;
      }
      const b = e.target.closest("[data-rig]");
      if (!b) return;
      const what = b.dataset.rig;
      if (what === "front") orbit.yaw = 0;
      else if (what === "side") orbit.yaw = Math.PI / 2;
      else if (what === "reset-joint" && picked) {
        delete prefs.joints[jointKey(picked)];
        const twin = twinOf(picked);
        if (twin && prefs.rules.mirror) delete prefs.joints[jointKey(twin)];
        savePrefs(prefs);
        drawJoint();
      } else if (what === "reset-all") {
        prefs.joints = {};
        savePrefs(prefs);
        drawJoint();
      } else if (what === "forget") forget();
    });

    async function fillCharacters() {
      const own = await ownFiles();
      const sel = $("character");
      sel.innerHTML =
        `<optgroup label="Free characters">${CHARACTERS.filter((c) => !c.object).map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join("")}</optgroup>` +
        `<optgroup label="Objects">${CHARACTERS.filter((c) => c.object).map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join("")}</optgroup>` +
        (own.length ? `<optgroup label="Your own (on this device)">${own.map((n) => `<option value="own:${esc(n)}">${esc(n)}</option>`).join("")}</optgroup>` : "");
      sel.value = prefs.character;
      if (sel.value !== prefs.character) {
        prefs.character = CHARACTERS[0].id;
        sel.value = prefs.character;
      }
      $("forget").hidden = !/^own:/.test(prefs.character);
    }
    async function bringIn(file) {
      if (!/\.(glb|gltf)$/i.test(file.name) && !isPicture(file.name)) {
        status("Please use a .glb file or a picture. Characters sold as .fbx can be turned into .glb with Blender (free): File, Import FBX, then File, Export glTF 2.0.");
        return;
      }
      const buf = await file.arrayBuffer();
      await keepFile(file.name, buf);
      prefs.character = "own:" + file.name;
      savePrefs(prefs);
      await fillCharacters();
      load();
    }
    async function forget() {
      if (!/^own:/.test(prefs.character)) return;
      await forgetFile(prefs.character.slice(4));
      prefs.character = CHARACTERS[0].id;
      savePrefs(prefs);
      await fillCharacters();
      load();
    }

    /* --- joints --- */
    const jointKey = (b) => prefs.character + "|" + b.name;
    function twinOf(b) {
      const r = info.get(b);
      if (!r || !r.side || !rig) return null;
      const other = r.side === "L" ? "R" : "L";
      const list = rig.arms[r.side].includes(b) ? rig.arms[other] : rig.legs[r.side].includes(b) ? rig.legs[other] : [];
      return list[r.index] || null;
    }
    function limitOf(b) {
      const r = info.get(b);
      const L = LIMITS[(r && r.role) || "other"] || LIMITS.other;
      if (!prefs.rules.limits) return { bend: [-180, 180], side: [-180, 180], twist: [-180, 180], say: L.say };
      const lim = limitBase(b, L);
      const m = partScale(b);
      if (m === 1) return lim;
      const sc = (r) => r.map((x) => clamp(x * m, -180, 180));
      return { bend: sc(lim.bend), side: sc(lim.side), twist: sc(lim.twist), say: L.say };
    }
    /* Which part of the body or object a joint belongs to, for "stiff base, floppy top". */
    function partOf(b) {
      const r = info.get(b);
      if (!r) return "";
      if (r.role === "base" || r.role === "hips") return "base";
      if (r.role === "tip" || r.role === "head" || r.role === "neck") return "top";
      if (r.role === "tail") return "tail";
      if (/shoulder|elbow|wrist/.test(r.role)) return "arms";
      if (/hip|knee|ankle|front/i.test(r.role)) return "legs";
      return "middle";
    }
    function partScale(b) {
      const v = prefs.parts[partOf(b)];
      return typeof v === "number" ? v : 1;
    }
    function limitBase(b, L) {
      const k = val("rigRulesLens.limits"); /* 0 rubber, 0.5 natural, 1 stiff */
      if (k < 0.5) {
        const grow = 1 + (0.5 - k) * 3; /* rubber: wider, and a hinge may bend the wrong way a little */
        const g = (r) => {
          const wrong = 50 * (0.5 - k); /* up to 25 degrees the wrong way */
          return [r[0] === 0 ? -wrong : r[0] * grow, r[1] === 0 ? wrong : r[1] * grow].map((x) => clamp(x, -180, 180));
        };
        return { bend: g(L.bend), side: g(L.side), twist: g(L.twist), say: L.say };
      }
      const shrink = 1 - (k - 0.5) * 1.3; /* stiff: 35% of the natural range */
      return { bend: L.bend.map((x) => x * shrink), side: L.side.map((x) => x * shrink), twist: L.twist.map((x) => x * shrink), say: L.say };
    }
    function roleName(b) {
      const r = info.get(b);
      if (!r) return b.name;
      const side = r.side === "L" ? "left " : r.side === "R" ? "right " : "";
      const L = LIMITS[r.role] || LIMITS.other;
      const nth = r.role === "spine" || r.role === "neck" || r.role === "tail" || r.role === "joint" ? " " + (r.index + (r.role === "joint" ? 0 : 1)) : "";
      return side + L.say.replace(/ \(.*\)/, "").toLowerCase() + nth;
    }
    function drawJoint() {
      const box = $("joint");
      if (!bones.length) {
        box.innerHTML = "";
        return;
      }
      const opts2 = bones.filter((b) => info.get(b) && info.get(b).role !== "other").map((b) => `<option value="${esc(jointKey(b))}"${b === picked ? " selected" : ""}>${esc(roleName(b))}</option>`);
      let html = `<label>Joint <select data-rig="joint-pick"><option value="">pick a joint</option>${opts2.join("")}</select></label>`;
      if (picked) {
        const lim = limitOf(picked);
        const j = Object.assign({ bend: 0, side: 0, twist: 0 }, prefs.joints[jointKey(picked)]);
        html += `<p class="cap">${esc(lim.say)}${prefs.rules.limits ? "" : " (limits are off)"}</p>`;
        html += [
          ["bend", "Forward and back"],
          ["side", "Out to the side"],
          ["twist", "Twist"],
        ]
          .map(([k, label]) => {
            const [a, b] = lim[k];
            const lo = Math.min(a, b, -180);
            const hi = Math.max(a, b, 180);
            return `<label class="rig-joint">${label} <small>allowed ${Math.round(a)}° to ${Math.round(b)}°</small><input type="range" min="${lo}" max="${hi}" step="1" value="${j[k]}" data-joint="${k}"><output>${Math.round(j[k])}°</output></label>`;
          })
          .join("");
        html += `<button type="button" data-rig="reset-joint">Reset this joint</button> `;
      }
      html += `<button type="button" data-rig="reset-all">Reset every joint</button>`;
      box.innerHTML = html;
    }

    /* --- loading a character --- */
    function setupScene() {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.outputEncoding = THREE.sRGBEncoding;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x24262b);
      camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 0.9));
      const sun = new THREE.DirectionalLight(0xffffff, 0.8);
      sun.position.set(2, 4, 3);
      scene.add(sun);
      const grid = new THREE.GridHelper(6, 12, 0x666a74, 0x3a3d44);
      scene.add(grid);
      marker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb020, depthTest: false }));
      marker.renderOrder = 10;
      marker.visible = false;
      scene.add(marker);
      /* drag to orbit, wheel to zoom, click to pick a joint */
      let drag = null;
      canvas.addEventListener("pointerdown", (e) => {
        drag = { x: e.clientX, y: e.clientY, moved: false };
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        orbit.yaw -= dx * 0.01;
        orbit.pitch = clamp(orbit.pitch + dy * 0.01, -0.2, 1.3);
        drag.x = e.clientX;
        drag.y = e.clientY;
      });
      canvas.addEventListener("pointerup", (e) => {
        if (drag && !drag.moved) pickAt(e.clientX, e.clientY);
        drag = null;
      });
      canvas.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          orbit.dist = clamp(orbit.dist * (e.deltaY > 0 ? 1.1 : 0.9), 1.2, 12);
        },
        { passive: false }
      );
    }
    function pickAt(cx, cy) {
      const r = canvas.getBoundingClientRect();
      let best = null;
      let bestD = 28;
      const p = new THREE.Vector3();
      bones.forEach((b) => {
        if (!info.get(b) || info.get(b).role === "other") return;
        b.getWorldPosition(p);
        p.project(camera);
        const x = ((p.x + 1) / 2) * r.width + r.left;
        const y = ((1 - p.y) / 2) * r.height + r.top;
        const d = Math.hypot(x - cx, y - cy);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      });
      if (best) {
        picked = best;
        drawJoint();
      }
    }
    async function source() {
      if (/^own:/.test(prefs.character)) {
        const name = prefs.character.slice(4);
        const buf = await readFile(name);
        if (!buf) throw new Error("that file is no longer on this device");
        if (isPicture(name)) return { picture: await createImageBitmap(new Blob([buf])), credit: "Your own picture, made into a flat puppet with a chain of joints. It stays on this device and is never uploaded." };
        return { buf, credit: "Your own file. It stays on this device and is never uploaded." };
      }
      const c = CHARACTERS.find((x) => x.id === prefs.character) || CHARACTERS[0];
      if (c.make) return { scene: makeObject(c.make), credit: c.plain + " " + c.credit };
      const res = await fetch(c.file);
      if (!res.ok) throw new Error("could not load " + c.file);
      return { buf: await res.arrayBuffer(), credit: c.plain + " " + c.credit };
    }
    let pending = true;
    async function load() {
      if (!pending) ready = new Promise((r) => (readyResolve = r));
      pending = true;
      loadError = "";
      status("Loading…");
      $("forget").hidden = !/^own:/.test(prefs.character);
      try {
        const src = await source();
        $("credit").textContent = src.credit;
        const gltf = src.buf ? await new Promise((resolve, reject) => new THREE.GLTFLoader().parse(src.buf, "", resolve, reject)) : { scene: src.scene || pictureCard(src.picture), animations: [] };
        if (stopped) return;
        build(gltf);
        status(rig.object ? `No skeleton of its own, so it got a chain of ${bones.length} joints` : `${bones.length} joints, ${clips.length} move${clips.length === 1 ? "" : "s"}`);
      } catch (e) {
        loadError = String((e && e.message) || e);
        status("Could not load this character: " + loadError);
      }
      pending = false;
      readyResolve();
    }
    function build(gltf) {
      if (holder) scene.remove(holder);
      if (helper) scene.remove(helper);
      holder = new THREE.Group();
      model = gltf.scene;
      holder.add(model);
      scene.add(holder);
      /* stand it on the floor, about 1.7 high (or 1.7 long, for an animal) */
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const s = 1.7 / Math.max(size.y, size.x * 0.8, size.z * 0.8, 1e-6);
      model.scale.multiplyScalar(s);
      model.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(model);
      const c = box2.getCenter(new THREE.Vector3());
      model.position.x -= c.x;
      model.position.z -= c.z;
      model.position.y -= box2.min.y;
      model.updateMatrixWorld(true);
      orbit.y = (box2.max.y - box2.min.y) * 0.55;
      bones = [];
      model.traverse((o) => {
        if (o.isSkinnedMesh) {
          o.frustumCulled = false;
          o.skeleton.bones.forEach((b) => !bones.includes(b) && bones.push(b));
        }
      });
      if (!bones.length) model.traverse((o) => o.isBone && bones.push(o));
      let chained = false;
      if (!bones.length) {
        bones = autoRig(model, 5) || [];
        chained = bones.length > 0;
      }
      objH = box2.max.y - box2.min.y;
      clips = gltf.animations || [];
      mixer = clips.length ? new THREE.AnimationMixer(model) : null;
      action = null;
      actionKey = "";
      rig = chained ? chainRig(bones) : classify(bones);
      info = new Map();
      computeAxes();
      helper = new THREE.SkeletonHelper(model);
      helper.visible = prefs.showBones;
      helper.material.depthTest = false;
      helper.renderOrder = 9;
      scene.add(helper);
      picked = null;
      drawJoint();
    }
    /* Each joint's own directions, measured once in the rest pose: along the bone (twist), toward the front
       (bend) and out to the side. Stored in the joint's own frame, so they ride along with any clip. */
    function computeAxes() {
      model.updateMatrixWorld(true);
      const fwd = new THREE.Vector3(0, 0, 1);
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3(1, 0, 0);
      const hp = new THREE.Vector3();
      if (rig.hips) rig.hips.getWorldPosition(hp);
      const dirs = new Map();
      const pos = (b) => b.getWorldPosition(new THREE.Vector3());
      bones.forEach((b) => {
        const p = pos(b);
        const ks = b.children.filter((k) => k.isBone);
        let d = null;
        if (ks.length) {
          const tip = new THREE.Vector3();
          ks.forEach((k) => tip.add(pos(k)));
          tip.multiplyScalar(1 / ks.length);
          d = tip.sub(p);
        }
        if ((!d || d.length() < 1e-5) && b.parent && b.parent.isBone) d = p.clone().sub(pos(b.parent));
        if (!d || d.length() < 1e-5) d = up.clone();
        dirs.set(b, d.normalize());
      });
      bones.forEach((b) => {
        const r = rig.roles.get(b) || { role: "other", side: "", index: 0 };
        const d = dirs.get(b);
        let bend = new THREE.Vector3().crossVectors(d, fwd);
        if (bend.length() < 0.25) bend = new THREE.Vector3().crossVectors(d, up);
        bend.normalize();
        const p = pos(b);
        const out = r.side ? right.clone().multiplyScalar(p.x >= hp.x ? 1 : -1) : right.clone();
        let side = new THREE.Vector3().crossVectors(d, out);
        if (side.length() < 0.25) side = new THREE.Vector3().crossVectors(d, fwd).cross(d);
        side.normalize();
        const wq = b.getWorldQuaternion(new THREE.Quaternion()).invert();
        info.set(b, {
          role: r.role,
          side: r.side,
          index: r.index,
          rest: b.quaternion.clone(),
          axes: { bend: bend.applyQuaternion(wq), side: side.applyQuaternion(wq), twist: d.clone().applyQuaternion(wq) },
          invRestWorld: wq.clone(),
          prev: null,
        });
      });
    }

    /* --- values: the timeline when the Screen is open, else the sliders --- */
    function valueWord(s, v) {
      const n = s.scale.length - 1;
      if (typeof v === "string") {
        const i = s.scale.indexOf(v);
        return i < 0 ? null : i / n;
      }
      if (typeof v === "number" && isFinite(v)) return v <= 1 ? clamp(v, 0, 1) : clamp(v, 0, n) / n;
      return null;
    }
    function readTimeline() {
      fromTimeline = {};
      const E = window.CurioEngine;
      const S = window.CurioScreen;
      if (!E || !S || !S.isOpen || !S.isOpen() || !S.row) return;
      let st = null;
      try {
        st = E.state();
      } catch (e) {
        return;
      }
      const r = st && st.rows && st.rows[S.row()];
      if (!r) return;
      SLIDERS.forEach((s) => {
        const t = (st.tracks || []).find((x) => (x.curiosities || []).includes(s.id));
        if (!t) return;
        const lane = st.lanes && st.lanes[t.id + "|" + s.id];
        if (!lane || lane.on === false) return;
        const v = valueWord(s, E.value(r.id, t.id, s.id));
        if (v != null) fromTimeline[s.id] = v;
      });
    }
    let shownAuto = "";
    function showAuto() {
      const sig = Object.keys(fromTimeline)
        .map((k) => k + fromTimeline[k].toFixed(2))
        .join();
      if (sig === shownAuto) return;
      shownAuto = sig;
      SLIDERS.forEach((s) => {
        const row = el.querySelector(`[data-row="${s.id}"]`);
        if (!row) return;
        const on = fromTimeline[s.id] != null;
        row.querySelector("[data-auto-note]").hidden = !on;
        const inp = row.querySelector("input");
        inp.disabled = on;
        if (on) {
          const n = s.scale.length - 1;
          inp.value = (fromTimeline[s.id] * n).toFixed(2);
          row.querySelector("[data-word]").textContent = s.scale[Math.round(fromTimeline[s.id] * n)];
        }
      });
    }
    const val = (id) => (fromTimeline[id] != null ? fromTimeline[id] : prefs.values[id]);
    const pick = (id) => {
      const s = SLIDERS.find((x) => x.id === id);
      return s.scale[Math.round(val(id) * (s.scale.length - 1))];
    };

    /* --- the clip for "What the body is doing" --- */
    /* A clip with only a couple of keys is a test pose, not a move: the walk is then made by rules. */
    const useful = (c) => c && c.tracks.some((t) => t.times.length >= 6);
    function clipFor(motion) {
      const list = clips.filter(useful);
      const find = (re) => list.find((c) => re.test(c.name || ""));
      if (motion === "walking") return find(/walk/i) || list[0] || null;
      if (motion === "running") return find(/run/i) || find(/walk/i) || list[0] || null;
      if (motion === "looking around") return find(/survey|idle|look/i) || null;
      return null;
    }
    let made = "";
    /* A walk or run made by rules, for a character with no clip for it: the legs swing in turn, knees bend on
       the way through, arms swing against the legs, the spine counter-turns. */
    function madeMove(t, pace, add) {
      const motion = pick("rigRulesLens.motion");
      made = "";
      if (rig.object && !action && (motion === "walking" || motion === "running")) {
        /* An object has no legs: it hops, crouching into each jump and stretching up out of it. */
        const run = motion === "running";
        made = run ? "big hops (made by rules)" : "hops (made by rules)";
        const ph = t * (run ? 2.0 : 1.3) * pace * Math.PI * 2;
        const up = Math.max(0, Math.sin(ph));
        holder.position.y = up * (run ? 0.3 : 0.14) * objH;
        rig.spine.forEach((b) => {
          const o = add.get(b) || { bend: 0, side: 0, twist: 0 };
          o.bend += Math.cos(ph) * (run ? 16 : 9);
          add.set(b, o);
        });
        return;
      }
      if (action || (motion !== "walking" && motion !== "running") || rig.quadruped || !rig.legs.L.length) return;
      const run = motion === "running";
      made = run ? "run (made by rules)" : "walk (made by rules)";
      const ph = t * (run ? 1.5 : 0.95) * pace * Math.PI * 2;
      const A = run ? 42 : 24;
      const put = (b, k, v) => {
        if (!b) return;
        const o = add.get(b) || { bend: 0, side: 0, twist: 0 };
        o[k] += v;
        add.set(b, o);
      };
      [["L", 0], ["R", Math.PI]].forEach(([s, off]) => {
        const p = ph + off;
        put(rig.legs[s][0], "bend", A * Math.sin(p));
        put(rig.legs[s][1], "bend", -Math.max(0, Math.sin(p + 1.2)) * (run ? 85 : 45) - 4);
        put(rig.legs[s][2], "bend", 10 * Math.sin(p - 0.6));
        put(rig.arms[s][0], "bend", -A * 0.75 * Math.sin(p));
        put(rig.arms[s][1], "bend", run ? 75 : 14 + 8 * Math.max(0, -Math.sin(p)));
        if (!run) put(rig.arms[s][0], "side", -12);
      });
      rig.spine.forEach((b) => put(b, "twist", (6 * Math.sin(ph)) / (rig.spine.length || 1)));
      put(rig.hips, "twist", -5 * Math.sin(ph));
      put(rig.hips, "bend", run ? 12 : 3);
    }
    const PACE = { dragging: 0.4, slow: 0.7, normal: 1, brisk: 1.4, frantic: 2 };
    function playClip(dt) {
      const motion = pick("rigRulesLens.motion");
      const clip = clipFor(motion);
      const borrowed = clip && motion === "running" && !/run/i.test(clip.name || "");
      const key = clip ? clip.uuid : "";
      if (key !== actionKey) {
        const next = clip && mixer ? mixer.clipAction(clip) : null;
        if (next) {
          next.reset().play();
          if (action) action.crossFadeTo(next, 0.3, false);
        } else if (action) action.fadeOut(0.3);
        action = next;
        actionKey = key;
      }
      const pace = PACE[pick("rigRulesLens.pace")] || 1;
      if (action) action.setEffectiveTimeScale(pace * (borrowed ? 1.8 : 1));
      if (mixer) mixer.update(dt);
      return pace;
    }

    /* --- one frame of rules --- */
    function offsetQuat(b, o) {
      const r = info.get(b);
      const q = new THREE.Quaternion();
      if (o.bend) q.multiply(new THREE.Quaternion().setFromAxisAngle(r.axes.bend, o.bend * DEG));
      if (o.side) q.multiply(new THREE.Quaternion().setFromAxisAngle(r.axes.side, o.side * DEG));
      if (o.twist) q.multiply(new THREE.Quaternion().setFromAxisAngle(r.axes.twist, o.twist * DEG));
      return q;
    }
    function drivenOffsets(t, pace) {
      const add = new Map();
      const amp = rig.object ? 1.8 : 1; /* an object's chain has fewer joints, so each one bends further */
      const put = (b, k, v) => {
        if (!b) return;
        const o = add.get(b) || { bend: 0, side: 0, twist: 0 };
        o[k] += v * amp;
        add.set(b, o);
      };
      if (prefs.rules.driven) {
        const slump = val("rigRulesLens.slump");
        rig.spine.forEach((b) => put(b, "bend", -8 + slump * 34));
        rig.neck.forEach((b) => put(b, "bend", -4 + slump * 22));
        put(rig.head, "bend", -4 + slump * 18);
        ["L", "R"].forEach((s) => !rig.quadruped && put(rig.arms[s][0], "bend", slump * 10));
        /* line through the body: a C curve, then an S */
        const line = val("poseRigLens.lineOfAction");
        const n = rig.spine.length || 1;
        rig.spine.forEach((b, i) => {
          const upper = i >= n / 2;
          const c = line <= 2 / 3 ? (line / (2 / 3)) * 12 : 12;
          const sgn = line > 2 / 3 && upper ? -1 : 1;
          put(b, "side", c * sgn);
        });
        put(rig.head, "side", -line * 8);
        const twist = val("poseRigLens.twist");
        rig.spine.forEach((b) => put(b, "twist", (twist * 32) / n));
        put(rig.hips, "twist", -twist * 8);
        const bal = val("poseRigLens.balance");
        put(rig.hips, "bend", (1 - bal) * 22);
        put(rig.hips, "side", (1 - bal) * (1 - bal) * 10);
        const uneven = val("poseRigLens.symmetry");
        if (!rig.quadruped) {
          put(rig.arms.L[0], "side", uneven * 28);
          put(rig.arms.L[0], "bend", uneven * 25);
          put(rig.arms.L[1], "bend", uneven * 40);
        }
        put(rig.legs.R[0], "side", uneven * 6);
        put(rig.head, "side", uneven * 8);
      }
      if (prefs.rules.breath) {
        const b = val("rigRulesLens.breath");
        const amp = [0, 1.5, 4, 8][Math.round(b * 3)];
        const rate = [0, 0.25, 0.5, 0.9][Math.round(b * 3)] * Math.max(0.7, pace);
        const w = Math.sin(t * rate * Math.PI * 2);
        put(rig.chest, "bend", -amp * w);
        put(rig.neck[0], "bend", amp * 0.4 * w);
        ["L", "R"].forEach((s) => !rig.quadruped && put(rig.arms[s][0], "side", amp * 0.4 * w));
      }
      return add;
    }
    function applyLimits(b, o) {
      const L = limitOf(b);
      return { bend: clamp(o.bend, L.bend[0], L.bend[1]), side: clamp(o.side, L.side[0], L.side[1]), twist: clamp(o.twist, L.twist[0], L.twist[1]) };
    }
    /* Aim: turn the neck and head (in world space) so the face points at the target, at most 70 degrees. */
    function aim(t) {
      if (!prefs.rules.aim || !rig.head) return;
      let where = pick("rigRulesLens.lookAt");
      if (where === "straight ahead" && !action && pick("rigRulesLens.motion") === "looking around") where = "all around";
      if (where === "straight ahead") return;
      model.updateMatrixWorld(true);
      const hp = rig.head.getWorldPosition(new THREE.Vector3());
      const fwd = new THREE.Vector3(0, 0, 1);
      const cur = rig.head.getWorldQuaternion(new THREE.Quaternion());
      const face = fwd.clone().applyQuaternion(cur.clone().multiply(info.get(rig.head).invRestWorld));
      let target;
      if (where === "at the camera") target = camera.position.clone();
      else if (where === "at the ground") target = hp.clone().add(new THREE.Vector3(0, -1.6, 1.2));
      else if (where === "up") target = hp.clone().add(new THREE.Vector3(0, 1.4, 1));
      else target = hp.clone().add(new THREE.Vector3(Math.sin(t * 0.7) * 1.6, Math.sin(t * 0.31) * 0.3, 1));
      const want = target.sub(hp).normalize();
      const full = new THREE.Quaternion().setFromUnitVectors(face.normalize(), want);
      const angle = 2 * Math.acos(clamp(full.w, -1, 1));
      const cap = limitOf(rig.head).twist[1] + (rig.neck.length ? limitOf(rig.neck[0]).twist[1] : 0);
      const k = angle > 1e-4 ? Math.min(1, (Math.max(10, cap) * DEG) / angle) : 1;
      const delta = new THREE.Quaternion().slerp(full, k);
      const chain = rig.neck.length ? [rig.neck[0], rig.head] : rig.object && rig.chest && rig.chest !== rig.head ? [rig.chest, rig.head] : [rig.head];
      const share = chain.length === 2 ? [0.4, 1] : [1];
      let done = new THREE.Quaternion();
      chain.forEach((b, i) => {
        const part = new THREE.Quaternion().slerp(delta, share[i]);
        const step = done.clone().invert().premultiply(part); /* what this joint still has to add */
        rotateWorld(b, step);
        done = part;
      });
    }
    function rotateWorld(b, q) {
      b.updateMatrixWorld(true);
      const pw = b.parent.getWorldQuaternion(new THREE.Quaternion());
      const bw = b.getWorldQuaternion(new THREE.Quaternion());
      const nw = q.clone().multiply(bw);
      b.quaternion.copy(pw.invert().multiply(nw));
      b.updateMatrixWorld(true);
    }
    function follow(dt) {
      const f = prefs.rules.follow ? val("rigRulesLens.floppy") : 0;
      const lag = [0, 0.3, 0.6, 0.82][Math.round(f * 3)];
      bones.forEach((b) => {
        const r = info.get(b);
        const loose = r.role === "joint" || r.role === "tip" || r.role === "tail" || r.role === "head" || r.role === "neck" || ((r.role === "elbow" || r.role === "wrist") && !rig.quadruped);
        if (!loose || !lag || !r.prev) {
          r.prev = b.quaternion.clone();
          return;
        }
        const depth = r.role === "tail" || r.role === "joint" || r.role === "tip" ? 0.7 + r.index * 0.08 : 0.8;
        const keep = Math.pow(lag * Math.min(1, depth), dt * 60);
        b.quaternion.copy(r.prev.clone().slerp(b.quaternion, 1 - keep));
        r.prev = b.quaternion.clone();
      });
    }
    function frame(now) {
      raf = 0;
      if (stopped) return;
      if (!el.isConnected) {
        stop();
        return;
      }
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      clock += dt;
      size();
      readTimeline();
      showAuto();
      if (model) {
        bones.forEach((b) => b.quaternion.copy(info.get(b).rest));
        holder.position.y = 0;
        const pace = playClip(dt);
        const add = drivenOffsets(clock, pace);
        madeMove(clock, pace, add);
        bones.forEach((b) => {
          const own = prefs.joints[jointKey(b)];
          const d = add.get(b);
          if (!own && !d) return;
          const o = { bend: (d ? d.bend : 0) + (own ? own.bend : 0), side: (d ? d.side : 0) + (own ? own.side : 0), twist: (d ? d.twist : 0) + (own ? own.twist : 0) };
          b.quaternion.multiply(offsetQuat(b, applyLimits(b, o)));
        });
        aim(clock);
        follow(dt);
        model.updateMatrixWorld(true);
        if (picked) {
          marker.visible = true;
          picked.getWorldPosition(marker.position);
        } else marker.visible = false;
      }
      const cy = Math.cos(orbit.pitch);
      camera.position.set(Math.sin(orbit.yaw) * cy * orbit.dist, orbit.y + Math.sin(orbit.pitch) * orbit.dist, Math.cos(orbit.yaw) * cy * orbit.dist);
      camera.lookAt(0, orbit.y, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    let lastW = 0;
    let lastH = 0;
    function size() {
      const w = canvas.clientWidth || 600;
      const h = canvas.clientHeight || 420;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    function stop() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (renderer) renderer.dispose();
      if (current === ctl) current = null;
    }

    const ctl = {
      el,
      get ready() {
        return ready;
      },
      stop,
      error: () => loadError,
      rig: () => rig,
      bones: () => bones.slice(),
      clips: () => clips.map((c) => c.name),
      playing: () => (action ? action.getClip().name : made),
      roleOf: (b) => (info.get(b) || {}).role,
      set(id, word) {
        const s = SLIDERS.find((x) => x.id === id);
        const i = s.scale.indexOf(word);
        if (i < 0) return false;
        prefs.values[id] = i / (s.scale.length - 1);
        const inp = el.querySelector(`[data-slider="${id}"]`);
        if (inp) {
          inp.value = i;
          inp.closest(".rig-row").querySelector("[data-word]").textContent = word;
        }
        savePrefs(prefs);
        return true;
      },
      rule(id, on) {
        prefs.rules[id] = !!on;
        const c = el.querySelector(`[data-rule="${id}"]`);
        if (c) c.checked = !!on;
        savePrefs(prefs);
      },
      setJoint(b, o) {
        prefs.joints[jointKey(b)] = Object.assign({ bend: 0, side: 0, twist: 0 }, o);
        savePrefs(prefs);
      },
      resetJoints() {
        prefs.joints = {};
        savePrefs(prefs);
      },
      /* where a joint is, in the scene (for tests and other tools) */
      where(b) {
        return b.getWorldPosition(new THREE.Vector3()).toArray();
      },
      /* the joint's turn away from its rest pose, in degrees */
      turned(b) {
        return (2 * Math.acos(clamp(Math.abs(b.quaternion.dot(info.get(b).rest)), -1, 1))) / DEG;
      },
      timeline: () => Object.assign({}, fromTimeline),
      load: (id) => {
        prefs.character = id;
        savePrefs(prefs);
        $("character").value = id;
        return load().then(() => ready);
      },
      bringIn,
      ask,
      parts: () => Object.assign({}, prefs.parts),
    };
    current = ctl;

    need3D()
      .then((T) => {
        if (stopped) return;
        THREE = T;
        setupScene();
        return fillCharacters().then(load);
      })
      .then(() => {
        if (!stopped && !raf) raf = requestAnimationFrame(frame);
      })
      .catch((e) => {
        loadError = "3D needs three.js, which loads from cdnjs: " + ((e && e.message) || e);
        status(loadError);
        readyResolve();
      });
    return ctl;
  }

  let current = null;

  /* ---------- a window over the app (Library, 3D characters) ---------- */
  let dlg = null;
  let open3 = null;
  function open(opts) {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "rig-dlg";
      dlg.innerHTML = `<header><strong>3D characters</strong><button type="button" data-rig-close>Close</button></header><div class="rig-dlg-body"></div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener("close", () => {
        if (open3) open3.stop();
        open3 = null;
      });
      dlg.addEventListener("click", (e) => {
        if (e.target.closest("[data-rig-close]")) dlg.close();
      });
    }
    if (typeof dlg.showModal === "function") {
      if (!dlg.open) dlg.showModal();
    } else dlg.setAttribute("open", "");
    if (open3) open3.stop();
    open3 = mount(dlg.querySelector(".rig-dlg-body"), opts);
    return open3;
  }

  function wire() {
    const css = document.createElement("style");
    css.textContent = `.rig3d{display:block}
.rig-top{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center}
.rig-top select{max-width:16rem}
.rig-credit{font-size:.75rem;opacity:.75;margin:.3rem 0 .5rem}
.rig-main{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(16rem,1fr);gap:.8rem}
@media (max-width:760px){.rig-main{grid-template-columns:1fr}}
.rig-view canvas{display:block;width:100%;height:min(62vh,520px);border-radius:.4rem;touch-action:none;cursor:grab;background:#24262b}
.rig-viewbar{display:flex;flex-wrap:wrap;gap:.4rem .8rem;align-items:center;margin-top:.35rem;font-size:.85rem}
.rig-status{opacity:.75}
.rig-panel{max-height:min(70vh,640px);overflow:auto;font-size:.88rem}
.rig-panel h4{margin:.7rem 0 .2rem}
.rig-row{display:flex;gap:.4rem;align-items:flex-end;margin:.25rem 0}
.rig-row label{flex:1;display:grid}
.rig-row b{font-weight:600}
.rig-row small{font-size:.72rem;opacity:.75}
.rig-row input{width:100%}
.rig-rule{display:block;margin:.3rem 0}
.rig-ask{display:flex;gap:.4rem}.rig-ask input{flex:1;min-width:0}
.rig-said{font-size:.82rem}.rig-said ul{margin:.2rem 0 .4rem;padding-left:1.1rem}
.rig-rule small{display:block;opacity:.75;margin-left:1.4rem}
.rig-joint{display:grid;grid-template-columns:1fr auto;gap:0 .5rem;margin:.3rem 0}
.rig-joint input{grid-column:1}
.rig-joint small{opacity:.7}
.rig-dlg{width:min(1180px,96vw);max-height:94vh;overflow:auto;padding:0;border:1px solid #888;border-radius:.6rem;background:var(--cc-panel,var(--panel,#fff));color:var(--cc-text,var(--ink,#111))}
.rig-dlg::backdrop{background:rgba(0,0,0,.55)}
.rig-dlg header{position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;align-items:center;padding:.6rem .9rem;background:inherit;border-bottom:1px solid #8884}
.rig-dlg-body{padding:.6rem .9rem .9rem}`;
    document.head.appendChild(css);
    const menu = document.getElementById("lib-menu");
    if (menu && !menu.querySelector("[data-rig3d]")) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.rig3d = "open";
      b.innerHTML = "3D characters<small>bodies and objects that move by rules</small>";
      menu.insertBefore(b, menu.children[1] || null);
      b.addEventListener("click", () => {
        menu.hidden = true;
        open();
      });
    }
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
    else setTimeout(wire, 0);
  }

  /* A Studio tool too, so the Screen's "Maya tool" button on Movement rules opens it. */
  if (window.CuriosityStudio)
    window.CuriosityStudio.register({
      id: "rig3d",
      label: "3D characters",
      order: 61,
      maya: "Skeletons and joint limits, aim constraints, Set Driven Key, dynamic joint chains, Time Editor clips",
      draw(el) {
        mount(el);
      },
    });

  /* Another tool (the video window's cut-outs) hands over a cut-out: a canvas or an image Blob with a see-through
     background. It is kept on this device and opened as a flat puppet with the same rules. */
  async function fromCutout(pic, name) {
    let blob = pic;
    if (pic && typeof pic.toBlob === "function") blob = await new Promise((r) => pic.toBlob(r, "image/png"));
    if (!blob) return null;
    const file = String(name || "cut-out").replace(/\.[a-z]+$/i, "") + ".png";
    await keepFile(file, await blob.arrayBuffer());
    return open({ character: "own:" + file });
  }

  window.CurioRig = { CHARACTERS, LIMITS, SLIDERS, RULES, readRequest, classify, autoRig, chainRig, makeObject, mount, open, fromCutout, current: () => current };
})();
