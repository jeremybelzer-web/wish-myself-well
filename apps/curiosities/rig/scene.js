/* rig/scene.js: "Make a whole scene from words", an add-on for the 3D characters view (CurioRig.extend).

   One box for a whole beat: "At a diner at night, Ida (spiky red hair, overalls) sits across from Nessa (curly
   black hair, yellow hoodie). Nessa says something; Ida does a double take, then laughs." The words are split
   into the parts the other add-ons already understand, and the beat plays as a short timed scene:
   - the set (rig/sets.js): the clauses that name a place, things or a time of day ("At a diner at night"), plus
     sitting ("sits", "at the table", "in a booth"). With no place in the words, the set stays as it is.
   - the characters (rig/maker.js): each name with a look in brackets after it, "Ida (spiky red hair, overalls)".
     A saved character with that name is used again (its look changes when new words are given); a new name is
     made and kept in the list. A name with no look reuses its saved one, or gets a plain look. Up to 4.
     Famous characters are never copied: a famous name in a look is left out (only the other look words are
     used) and the Read as says so; a famous name as someone's name is only a name tag.
   - the staging (rig/staging.js): the first name is actor 1 (the view's own character), the others actors 2 to
     4. "across from", "facing" or "talks to" stand or sit them face to face; "next to" or "beside" side by side;
     "behind" one behind the other; "around" a circle; "huddle", "far apart" or "standoff". Who sits: everyone
     named in a sitting clause (CurioRigSets.sitters). "says", "asks", "whispers"... makes them the one speaking:
     the others look at them. "looks at Nessa" turns everyone's eyes to Nessa. "walks over to Nessa" walks.
   - feelings (rig/faces.js): laughs, smiles (happy), cries (sad), glares (angry), gasps (surprised), screams
     (scared), "grossed out" (disgusted), "a little" and "very". A new feeling on someone replaces the last one.
     A double take also looks surprised.
   - acting moves (rig/gestures.js), in order: anything gestures.js reads ("does a double take", "shrugs").
   Each clause is one step; steps play one after another, each as long as its move (or about a second and a
   half), on the 3D view's own clock. A walk with an acting move in it or after it ("walks over to Nessa and
   shrugs", "walks over to Nessa, then shrugs") lasts until the walker gets there: the shrug plays on arriving. So does a sit or a feeling of the walker's
   ("walks over to Nessa and sits", "walks over to Nessa, then smiles"). The "Read as" list shows what each part understood, and anything ignored.
   "Play the beat" builds what changed and plays it from the start; "Send to the storyboard as a flip book"
   plays it and sends drawings of it (rig/snapshot.js, up to 24, as one new scene) to the storyboard.
   Free and on this device; nothing is sent anywhere.

   - the camera (rig/camera.js's lenses): "close-up on Ida", "wide shot", "over Nessa's shoulder" (a medium shot),
     "low angle", "high angle", "overhead", "dutch angle", "long lens", "the camera pushes in" (one size tighter)
     or "pulls back". Camera words go with the next thing anyone does (or get a moment of their own at the end).
   "Put this beat on the timeline" writes it into the Screen's lanes at the playhead as one undo step, one moment
   per step (see toTimeline below), so the film itself carries the beat; playing the Screen replays it from the
   lanes, without this file's own player. The Screen's 3D panel (rig/screen.js) has the same box.

   ctx.prefs.sceneText keeps the words. window.CurioRigScene = { EXAMPLE, read(text) -> plan, build(ctx, text)
   -> Promise<plan>, play(ctx) -> seconds, playWords(ctx, text), flipBook(ctx, text) -> Promise, hold(ctx, on),
   state(ctx), toTimeline(text, { row }) -> { ok, error?, from, to, tracks, lanes, said }, lanesOf(plan or text),
   BEAT_KEY } for tests. */
(function () {
  const R = window.CurioRig;
  if (!R || !R.extend) return;
  const ID = "scene";
  const MAX = 4;
  const F = "feelingFaceLens.";
  const FEELINGS = ["happy", "sad", "angry", "scared", "surprised", "disgust"];
  const EXAMPLE = "At a diner at night, Ida (spiky red hair, overalls) sits across from Nessa (curly black hair, yellow hoodie). Nessa says something; Ida does a double take, then laughs.";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /* plain looks for a name given without one */
  const PLAIN = [
    "short brown hair, a blue t-shirt, jeans and sneakers",
    "long black hair, a green sweater, a gray skirt and boots",
    "curly blond hair, a striped shirt, brown trousers and shoes",
    "a red beanie, an orange jacket, jeans and boots",
  ];
  /* never copied: these names are left out of a look */
  const FAMOUS = ["mario", "luigi", "sonic", "pikachu", "mickey mouse", "mickey", "minnie", "donald duck", "batman", "superman", "spider-man", "spiderman", "elsa", "anna", "harry potter", "hermione", "shrek", "homer simpson", "homer", "bart", "goku", "naruto", "zelda", "barbie", "darth vader", "yoda", "wolverine", "hulk", "iron man", "captain america", "wonder woman", "scooby-doo", "scooby", "garfield", "snoopy", "popeye", "buzz lightyear", "woody", "nemo", "dora", "peppa pig", "peppa", "sherlock holmes", "indiana jones", "james bond", "willy wonka", "kermit", "elmo", "big bird", "spongebob", "patrick star", "totoro", "ariel", "cinderella", "snow white", "aladdin", "simba", "olaf", "mulan", "moana", "pinocchio", "tinker bell", "peter pan", "ronald mcdonald"];
  const famousRe = new RegExp("\\b(?:(?:looks?|dressed|dresses) (?:just )?(?:like|as) |like |as )?(" + FAMOUS.map(reEsc).join("|") + ")(?:'s)?\\b", "gi");

  /* words that start with a capital letter but are not names */
  const NOT_NAMES = new Set(
    "a an the at in on inside outside by near then and but so later meanwhile suddenly finally afterwards after before when while now next she he they it we i you everyone everybody nobody someone somebody both all this that there here his her their its one night morning noon sunset evening today tonight yes no oh ok okay hey wow close-up close-ups closeup close wide low high medium dutch overhead over extreme camera zoom cut push pull tight angle shot insert long eye bird's worm's from looking we".split(" ")
  );
  const SUBJECT_LEAD = /^(?:and |then |so |but |now |suddenly |finally |later |meanwhile |slowly |quickly |after that |at last )+/;
  const SPEAK = /\b(says?|said|saying|speaks?|talks?|talking|tells?|asks?|shouts?|whispers?|yells?|answers?|replies|reply|explains?|mutters?|calls? out|announces?|sings?|jokes?)\b/;
  const WALK = /\b(walks?|walking|goes|crosses|runs?|running|steps?|moves?|heads?|wanders?|strolls?|rushes|hurries|comes? over|backs? away|approaches)\b/;
  const SIT = /\b(sits?|sitting|seated|sat|sit down)\b/;
  const STAND = /\b(stands?|standing|stood)\b/;
  const SEAT_AT = /\b(?:at|in|on)\s+(?:a|an|the|her|his|their)\s+((?:coffee |dining |kitchen |picnic )?table|booth|bench|sofa|couch|armchair|chair|counter|bar|desk|bed|stool|bar stool)\b/;
  const RELATIONS = [
    [/\b(huddle|huddled|heads together)\b/, "huddle"],
    [/\b(standoff|stand-off|far apart|across the (room|street)|face off)\b/, "standoff"],
    [/\bover (her|his|their|the) shoulder\b/, "over the shoulder"],
    [/\b(around|in a circle|circle)\b/, "circle"],
    [/\b(behind|in a line|in line|one after the other)\b/, "one behind the other"],
    [/\b(next to|beside|side by side|shoulder to shoulder|alongside)\b/, "side by side"],
    [/\b(across from|across the table from|opposite|facing|faces|face to face|talks? to|turns? to)\b/, "face to face"],
  ];
  /* feelings: [feeling, words, how much (1/3, 2/3, 1)] */
  const FEEL = [
    ["happy", /\b(laugh\w*|giggl\w*|chuckl\w*|cackl\w*|crack(s|ing)? up)\b/, 1],
    ["happy", /\b(smil\w*|grin\w*|happy|happily|delighted|joyful\w*|cheer\w*|beam\w*|pleased|glad)\b/, 2 / 3],
    ["sad", /\b(cr(y|ies|ying)|sob\w*|weep\w*|in tears|bursts? into tears)\b/, 1],
    ["sad", /\b(sad\w*|sulk\w*|mop\w*|frown\w*|gloom\w*|heartbroken|upset|disappointed)\b/, 2 / 3],
    ["angry", /\b(furious\w*|rag(es|ing)|seeth\w*|fum(es|ing)|explodes)\b/, 1],
    ["angry", /\b(angr\w*|mad|glar\w*|scowl\w*|snarl\w*|annoyed|cross)\b/, 2 / 3],
    ["scared", /\b(terrif\w*|scream\w*|panic\w*|petrified)\b/, 1],
    ["scared", /\b(scar(ed|es)|afraid|fright\w*|nervous\w*|trembl\w*|worried|anxious\w*)\b/, 2 / 3],
    ["surprised", /\b(shock\w*|astonish\w*|stunned|jaw drops|gasp\w*)\b/, 1],
    ["surprised", /\b(surpris\w*|amaz\w*|startled|blinks?)\b/, 2 / 3],
    ["disgust", /\b(disgust\w*|grossed out|revolted|yuck|ew+|gags?)\b/, 1],
    ["disgust", /\b(gross\w*|grimac\w*|wrinkles? (her|his|their) nose)\b/, 2 / 3],
  ];
  const MOVE_FEEL = { "double take": ["surprised", 2 / 3], "freeze in shock": ["surprised", 1], "slow burn": ["angry", 2 / 3], "jump for joy": ["happy", 1], "victory dance": ["happy", 1], facepalm: ["sad", 1 / 3], sigh: ["sad", 1 / 3], "wobbly knees": ["scared", 2 / 3] };
  const FEEL_SAY = { happy: "happy", sad: "sad", angry: "angry", scared: "scared", surprised: "surprised", disgust: "disgusted" };
  const howMuch = (v) => (v < 0.5 ? "a little " : v > 0.9 ? "very " : "");

  /* ---------- the camera in words (rig/camera.js's lenses) ----------
     Each rule: [words, lens, value]. Read in this order, and each match is blanked so "wide lens" is not also a
     wide shot. push: +1 one size tighter (the camera pushes in), -1 one size wider (it pulls back). */
  const SHOTS = ["insert", "close", "medium", "wide"];
  const CAM_START = { shotSize: "medium", angleHeight: "eye", lensLength: "normal", dutch: "level" };
  const CAM_RULES = [
    [/\bwide[- ]?(?:angle )?lens\b|\bfish ?eye\b/, "lensLength", "wide"],
    [/\blong lens\b|\btelephoto(?: lens)?\b|\bzoom lens\b/, "lensLength", "long"],
    [/\bnormal lens\b/, "lensLength", "normal"],
    [/\b(?:extreme |very |big )?close[- ]?ups?\b|\bclose shot\b|\bclose (?:in )?on\b|\btight (?:shot )?on\b/, "shotSize", "close"],
    [/\binsert(?: shot)?\b|\bdetail shot\b/, "shotSize", "insert"],
    [/\bmedium(?: close)?(?:[- ]shot)?\b|\bmid[- ]shot\b|\bwaist[- ]up\b|\btwo[- ]shot\b/, "shotSize", "medium"],
    [/\bover (?:the |her |his |their |[\p{L}'-]+'s? )?shoulders?\b|\bover[- ]the[- ]shoulder\b/u, "shotSize", "medium"],
    [/\bwide(?= on\b)|\bwide[- ]shot\b|\b(?:goes|go|cuts? to(?: a)?) wide\b|\blong shot\b|\bfull shot\b|\bestablishing shot\b/, "shotSize", "wide"],
    [/\blow[- ]angle\b|\bfrom below\b|\blooking up at\b/, "angleHeight", "low"],
    [/\bhigh[- ]angle\b|\bfrom above\b|\blooking down (?:at|on)\b/, "angleHeight", "high"],
    [/\boverhead\b|\bbird'?s[- ]eye\b|\btop[- ]down\b/, "angleHeight", "overhead"],
    [/\bworm'?s[- ]eye\b|\bfrom the floor\b|\bground[- ]level\b/, "angleHeight", "floor"],
    [/\beye[- ]level\b|\beye height\b/, "angleHeight", "eye"],
    [/\bdutch(?: angle| tilt)?\b|\btilted (?:frame|camera|horizon|angle|shot)\b|\bcanted\b|\bthe (?:frame|camera|horizon) tilts\b/, "dutch", "tilted"],
    [/\blevel horizon\b|\bthe horizon levels\b/, "dutch", "level"],
  ];
  const CAM_PUSH = /\b(?:push(?:es)?|pushing|creeps?|creeping|dolly|dollies|dollying|moves?|moving|zooms?|zooming|closes) in\b/;
  const CAM_PULL = /\b(?:pull(?:s)?|pulling|dolly|dollies|zooms?|zooming|moves?|backs?) (?:back|out|away)\b/;
  const CAM_WHO = /\b(?:the )?camera\b|\bwe see\b|\bwe cut\b|\bcut to\b|\bshot\b|\blens\b|\bangle\b/;
  const CAM_SAY = { shotSize: (v) => (v === "close" ? "close-up" : v + " shot"), angleHeight: (v) => (v === "eye" ? "camera at eye level" : v === "overhead" ? "camera overhead" : v === "floor" ? "camera on the floor" : v + " angle"), lensLength: (v) => v + " lens", dutch: (v) => (v === "tilted" ? "tilted horizon" : "level horizon") };
  /* the camera words in one clause: { set: { lens: value }, push, on, over, said, rest } or null */
  function readCamera(text, names) {
    let t = " " + text + " ";
    const out = { set: {}, push: 0, on: -1, over: -1, said: [] };
    const blank = (m) => (t = t.slice(0, m.index) + " ".repeat(m[0].length) + t.slice(m.index + m[0].length));
    const nameAt = (s) => {
      for (let i = 0; i < names.length; i++) if (new RegExp("\\b" + reEsc(names[i].toLowerCase()) + "(?:'s)?\\b").test(s)) return i;
      return -1;
    };
    CAM_RULES.forEach(([re, id, v]) => {
      const m = t.match(re);
      if (!m) return;
      const ots = /shoulder/.test(m[0]);
      if (ots) out.over = nameAt(m[0]);
      else if (id === "shotSize") {
        const after = t.slice(m.index + m[0].length).match(/^\s*(?:on|of|at)?\s*([\p{L}'-]+)/u);
        if (after && nameAt(after[1]) >= 0) out.on = nameAt(after[1]);
      }
      if (out.set[id] == null) {
        out.set[id] = v;
        out.said.push(ots ? (out.over >= 0 ? `over ${names[out.over]}'s shoulder` : "over the shoulder") : CAM_SAY[id](v) + (id === "shotSize" && out.on >= 0 ? " on " + names[out.on] : ""));
      }
      blank(m);
    });
    let m;
    const camLike = CAM_WHO.test(t) || Object.keys(out.set).length > 0;
    if (camLike && (m = t.match(CAM_PUSH))) (out.push = 1), out.said.push("the camera pushes in"), blank(m);
    else if (camLike && (m = t.match(CAM_PULL))) (out.push = -1), out.said.push("the camera pulls back"), blank(m);
    if (!Object.keys(out.set).length && !out.push) return null;
    out.rest = t.replace(/\b(?:the camera|camera|we see|we cut to|cut to|then|and|on|of|at|a|an|the|to)\b/g, " ").replace(/\s+/g, " ").trim();
    return out;
  }
  const mergeCam = (a, b) => (a ? { set: Object.assign({}, a.set, b.set), push: b.push || a.push, on: b.on >= 0 ? b.on : a.on, over: b.over >= 0 ? b.over : a.over, said: a.said.concat(b.said) } : b);
  /* what the camera lenses are at each step of the beat: [{ shotSize, angleHeight, lensLength, dutch, cameraMove } or null] */
  /* where the camera starts: a wide shot of everyone when there is more than one person, else a medium shot */
  const FRAMES = "shotSize.who"; /* who a close-up or medium shot is on (a cast number in a plan) */
  const camStart = (plan) => Object.assign({}, CAM_START, plan && plan.cast.length > 1 ? { shotSize: "wide" } : {});
  function cameraAt(plan) {
    const now = camStart(plan);
    let moved = false;
    return plan.steps.map((s) => {
      const out = {};
      if (moved) (out.cameraMove = "none"), (moved = false);
      if (!s.cam) return Object.keys(out).length ? out : null;
      if (s.cam.push) {
        out.shotSize = SHOTS[clamp(SHOTS.indexOf(now.shotSize) - s.cam.push, 1, 3)];
        out.cameraMove = s.cam.push > 0 ? "push in" : "pull out";
        moved = true;
      }
      Object.assign(out, s.cam.set);
      /* who it frames: "close-up on Ida" is on Ida; "over Nessa's shoulder" is on the other one */
      const on = s.cam.on >= 0 ? s.cam.on : s.cam.over >= 0 ? plan.cast.findIndex((c, i) => i !== s.cam.over) : -1;
      if (on >= 0) out[FRAMES] = on;
      Object.keys(CAM_START).forEach((k) => out[k] != null && (now[k] = out[k]));
      return out;
    });
  }

  /* ---------- reading the words ---------- */
  function read(text) {
    const raw = String(text || "").replace(/\s+/g, " ").trim();
    const plan = { text: raw, cast: [], setWords: [], sit: false, sitPhrase: "", sitters: [], sitFirst: [], standers: [], preset: "", steps: [], camera: [], ignored: [], famous: [] };
    const nameIndex = (n) => plan.cast.findIndex((c) => c.name.toLowerCase() === n.toLowerCase());
    const addName = (name, look) => {
      const i = nameIndex(name);
      if (i >= 0) {
        if (look != null && !plan.cast[i].look) plan.cast[i].look = look;
        return i;
      }
      if (plan.cast.length >= MAX) {
        if (!plan.ignored.includes(name)) plan.ignored.push(`${name} (4 people is the most in one view)`);
        return -1;
      }
      plan.cast.push({ name, look: look == null ? "" : look });
      return plan.cast.length - 1;
    };
    /* 1. names with a look in brackets */
    let body = raw.replace(/([A-Z][\p{L}'-]*)\s*\(([^)]*)\)/gu, (m, name, look) => {
      if (NOT_NAMES.has(name.toLowerCase())) return m;
      let words = look.trim();
      const left = [];
      words = words.replace(famousRe, (x, who) => (left.push(who), "")).replace(/\s*,\s*(,\s*)+/g, ", ").replace(/^[\s,]+|[\s,]+$/g, "");
      const asName = FAMOUS.includes(name.toLowerCase());
      if (left.length || asName) plan.famous.push({ name, left, asName });
      addName(name, words);
      return name;
    });
    body = body.replace(/\(([^)]*)\)/g, (m, x) => (plan.ignored.push(`(${x.trim()})`), ""));
    /* 2. other names: capitalized words that are not the start of an ordinary sentence */
    const known = (() => {
      try {
        return R.maker && R.maker.store ? R.maker.store().list.map((m) => m.name.toLowerCase()) : [];
      } catch (e) {
        return [];
      }
    })();
    const isPlace = (w) => {
      try {
        const p = R.sets && R.sets.read(w.toLowerCase());
        return !!(p && (p.place || p.time));
      } catch (e) {
        return false;
      }
    };
    (body.match(/\b[A-Z][\p{L}'-]*\b/gu) || []).forEach((w0) => {
      const w = w0.replace(/'s?$/, "");
      const lw = w.toLowerCase();
      if (NOT_NAMES.has(lw) || nameIndex(w) >= 0) return;
      if (FAMOUS.includes(lw) && !known.includes(lw)) plan.famous.push({ name: w, left: [], asName: true });
      if (known.includes(lw) || (!isPlace(w) && !(R.gestures && R.gestures.read(lw)))) addName(w, null);
    });
    const names = plan.cast.map((c) => c.name);
    const findNames = (s) => {
      const out = [];
      names.forEach((n, i) => {
        const m = new RegExp("\\b" + reEsc(n.toLowerCase()) + "\\b").exec(s);
        if (m) out.push({ i, at: m.index, end: m.index + m[0].length });
      });
      return out.sort((a, b) => a.at - b.at);
    };
    const startsWithName = (s) => {
      const f = findNames(s);
      return f.length && f[0].at === 0 ? f[0] : null;
    };
    /* 3. clauses, in order */
    const clauses = [];
    body
      .toLowerCase()
      .split(/[.;!?]+/)
      .forEach((sent) =>
        sent.split(/,|\bthen\b|\bafter that\b/).forEach((part) => {
          let p = part.trim().replace(/^(and|but|so)\s+/, "");
          if (!p) return;
          /* "A and B": two things done ("shrugs and laughs"), unless it is two people ("Ida and Nessa sit") */
          const bits = p.split(/\s+and\s+/);
          let cur = bits[0];
          for (let k = 1; k < bits.length; k++) {
            const b = bits[k];
            /* only names so far ("ida and nessa"), or a walk and what they do when they get there */
            const curIsName = !!cur.trim() && findNames(cur).reduce((r, x) => r.replace(new RegExp("\\b" + reEsc(names[x.i].toLowerCase()) + "\\b", "g"), ""), cur).replace(/\band\b|&|,/g, "").trim() === "";
            const walkThen = WALK.test(cur) && !startsWithName(b) && R.gestures && R.gestures.read(b);
            const join = curIsName || walkThen || /^(a|an|the|two|three|four|some|\d)\b/.test(b) || (!startsWithName(b) && !WALK.test(b) && !SPEAK.test(b) && !FEEL.some((x) => x[1].test(b)) && !(R.gestures && R.gestures.read(b)) && !/^(he|she|they|it)\b/.test(b));
            if (join) cur += " and " + b;
            else {
              clauses.push(cur);
              cur = b;
            }
          }
          clauses.push(cur);
        })
      );
    /* 4. each clause */
    let last = null;
    let cam = null; /* camera words waiting for the next step */
    const subjectsOf = (c) => {
      const lead = c.replace(SUBJECT_LEAD, "");
      const off = c.length - lead.length;
      if (/^(everyone|everybody|they all|all of them|both)\b/.test(lead)) return names.map((n, i) => i);
      const f = findNames(c).filter((x) => x.at <= off + 1);
      if (f.length) {
        /* "Ida and Nessa sit": every name joined by "and" at the front */
        const out = [f[0].i];
        let end = f[0].end;
        findNames(c).forEach((x) => {
          if (x.at > end && /^\s*(and|&)\s*$/.test(c.slice(end, x.at))) (out.push(x.i), (end = x.end));
        });
        return out;
      }
      if (/^(he|she|they|it|him|her)\b/.test(lead) && last) return last;
      return null;
    };
    clauses.forEach((c) => {
      let plain = c.trim();
      /* the camera: "close-up on Ida", "low angle", "the camera pushes in"; it goes with the next step */
      const cw = readCamera(plain, names);
      if (cw) {
        cam = mergeCam(cam, cw);
        const rest = cw.rest;
        const acts = SPEAK.test(rest) || WALK.test(rest) || SIT.test(rest) || FEEL.some((x) => x[1].test(rest)) || !!(R.gestures && R.gestures.read(rest));
        if (!acts) return;
        plain = rest;
      }
      let who = subjectsOf(plain);
      const mentioned = findNames(plain);
      const sets = R.sets ? R.sets.read(plain.replace(/\b(sits?|sitting|seated|sat|stands?|standing)\b/g, "")) : null;
      const placeFound = !!(sets && (sets.place || sets.time));
      const step = { text: plain, who: null, say: false, move: "", feel: [], walk: null, look: null, sit: false, stand: false };
      const did = [];
      if (!who && !mentioned.length) {
        if (sets && sets.found && !SPEAK.test(plain) && !WALK.test(plain) && !(R.gestures && R.gestures.read(plain)) && !FEEL.some((x) => x[1].test(plain))) {
          plan.setWords.push(plain);
          return;
        }
        if (last) who = last;
      }
      if (!who && mentioned.length) who = [mentioned[0].i];
      if (!who) {
        plan.ignored.push(plain);
        return;
      }
      last = who;
      step.who = who;
      /* a place inside an action ("sits in the kitchen") goes to the set too */
      if (placeFound) {
        const m = plain.match(/\b(?:in|at|on|inside|outside|by|near)\s+(?:a|an|the|her|his|their)?\s*[\w' -]+$/);
        if (m && R.sets.read(m[0]).place) plan.setWords.push(m[0]);
        else if (sets.place && !mentioned.length) plan.setWords.push(plain);
      }
      /* sitting or standing: at the start ("Ida sits across from Nessa") everyone named sits from the first moment;
         after something has happened ("Ida walks over to Nessa, sits") it is a moment of its own, for who does it,
         and so is sitting at the end of a walk ("Ida walks over to Nessa and sits": she sits once she is there) */
      const later = plan.steps.length > 0 || WALK.test(plain);
      if (SIT.test(plain)) {
        plan.sit = true;
        const seat = plain.match(SEAT_AT);
        if (seat && !plan.sitPhrase) plan.sitPhrase = seat[0];
        (later ? who : who.concat(mentioned.map((x) => x.i))).forEach((i) => {
          if (!plan.sitters.includes(i)) plan.sitters.push(i);
          if (!later && !plan.sitFirst.includes(i)) plan.sitFirst.push(i);
        });
        if (later) step.sit = true;
        did.push("sits");
      } else if (STAND.test(plain)) {
        who.forEach((i) => !plan.standers.includes(i) && plan.standers.push(i));
        if (later && plan.sitters.some((i) => who.includes(i))) step.stand = true;
        did.push("stands");
      }
      const rel = RELATIONS.find(([re]) => re.test(plain) && (mentioned.length > 1 || re.source.includes("huddle") || re.source.includes("circle")));
      if (rel) {
        if (!plan.preset) plan.preset = rel[1];
        did.push(rel[1]);
      }
      /* walking to someone or somewhere */
      const w = plain.match(WALK);
      if (w) {
        const rest = plain.slice(w.index + w[0].length);
        const t = findNames(rest).find((x) => !who.includes(x.i));
        if (t) step.walk = { to: t.i, where: names[t.i] };
        else if (/\b(middle|center|centre)\b/.test(rest)) step.walk = { to: { x: 0, z: 0 }, where: "the middle" };
        else if (/\b(camera|front|us|audience)\b/.test(rest)) step.walk = { to: { x: 0, z: 1.6 }, where: "the front" };
        else if (/\b(back|away)\b/.test(rest)) step.walk = { to: "back", where: "the back" };
        if (step.walk) did.push("walks to " + step.walk.where);
      }
      /* looking at someone */
      const lk = plain.match(/\b(looks?|stares?|glances?|turns?) (?:over |up |back )?(?:at|to|toward|towards) (\w+)/);
      if (lk) {
        const t = findNames(plain.slice(lk.index)).find((x) => !who.includes(x.i));
        if (t) (step.look = t.i), did.push("looks at " + names[t.i]);
      }
      if (SPEAK.test(plain)) {
        step.say = true;
        did.push("speaks");
      }
      const g = R.gestures && R.gestures.read(plain.replace(WALK, " ").replace(SIT, " ").replace(STAND, " "));
      if (g && g.id) {
        step.move = g.id;
        did.push(g.id);
      }
      /* feelings: the strongest word for each feeling in the clause, "a little" and "very" change it */
      const got = {};
      FEEL.forEach(([f, re, v]) => {
        if (!re.test(plain)) return;
        let k = v;
        if (/\b(a little|a bit|slightly|kind of|sort of|almost)\b/.test(plain)) k = 1 / 3;
        else if (/\b(very|really|so|totally|completely|hysterically|bursts?)\b/.test(plain)) k = 1;
        got[f] = Math.max(got[f] || 0, k);
      });
      if (step.move && MOVE_FEEL[step.move] && !Object.keys(got).length) got[MOVE_FEEL[step.move][0]] = MOVE_FEEL[step.move][1];
      step.feel = Object.keys(got).map((f) => [f, got[f]]);
      step.feel.forEach(([f, v]) => did.push(howMuch(v) + FEEL_SAY[f]));
      if (!did.length) {
        plan.ignored.push(plain);
        return;
      }
      const prev = plan.steps[plan.steps.length - 1];
      /* "gasps and freezes in shock": the same move twice in a row is one step */
      if (prev && step.move && prev.move === step.move && prev.who.join() === who.join() && !step.walk && !step.say) {
        step.feel.forEach(([f, v]) => !prev.feel.some((x) => x[0] === f) && prev.feel.push([f, v]));
        if (cam) (prev.cam = mergeCam(prev.cam, cam)), (cam = null);
        return;
      }
      if (step.say || step.move || step.feel.length || step.walk || step.look != null || step.sit || step.stand) {
        if (cam) (step.cam = cam), (cam = null);
        plan.steps.push(step);
      }
    });
    /* camera words after the last thing anyone does: a moment of their own */
    if (cam) plan.steps.push({ text: cam.said.join(", "), who: [], say: false, move: "", feel: [], walk: null, look: null, sit: false, stand: false, cam });
    plan.camera = cameraAt(plan);
    if (!plan.preset && plan.cast.length > 1) plan.preset = plan.cast.length > 2 ? "circle" : "face to face";
    plan.setText = plan.setWords.length || plan.sit ? (plan.setWords.join(", ") + (plan.sit ? (plan.setWords.length ? ", " : "") + "sitting" + (plan.sitPhrase ? " " + plan.sitPhrase : "") : "")).trim() : "";
    if (plan.sit && !plan.setWords.length && !plan.sitPhrase) plan.setText = "a room, sitting on a chair";
    return plan;
  }

  /* how long a step takes on the view's clock */
  function moveLength(ctx, id) {
    const g = R.gestures;
    const m = g && g.MOVES.find((x) => x.id === id);
    if (!m || !g.plan) return 1.6;
    const v = {};
    ["size", "speed", "windup", "hold", "settle", "pause"].forEach((k) => (v[k] = ctx.pick("actingLens." + k)));
    try {
      return g.plan(m, false, v).total;
    } catch (e) {
      return 1.6;
    }
  }

  /* How long each step's walk takes, worked out the way rig/staging.js walks (1.15 m a second at a normal pace,
     stopping at talking distance from a person) from where everyone stands for the beat's staging, plus a little
     to start and turn. A walk "waits" when an acting move comes in the same step ("walks over to Nessa and
     shrugs") or later ("walks over to Nessa, then shrugs"), or a sit or a feeling of someone walking does
     ("walks over to Nessa and sits", "..., then smiles"): the walk's step then lasts until they get there, and
     the move, the sit or the feeling comes after, never at the start of the walk. -> [{ secs, wait }] per step */
  const WALK_SPEED = 1.15;
  /* one moment of the Screen's timeline at its normal speed (screen/ui.js plays a moment every 1.1 seconds) */
  const MOMENT = 1.1;
  function walkTimes(plan) {
    const out = plan.steps.map(() => ({ secs: 0, wait: false }));
    const n = plan.cast.length;
    if (n < 2) return out;
    const St = Stg();
    let pos = null;
    let near = 1.15;
    let gap = 1.15;
    if (St && St.layout && St.meters && St.PRESETS && St.SLIDERS) {
      const scale = St.SLIDERS[0].scale;
      const pr = St.PRESETS.find((x) => x.id === plan.preset);
      const at = (w) => St.meters(Math.max(0, scale.indexOf(w)) / (scale.length - 1));
      near = at("personal");
      gap = at(pr ? pr.dist : "personal");
      try {
        pos = St.layout(pr ? pr.id : "face to face", n, gap, false).map((p) => ({ x: p.x, z: p.z }));
      } catch (e) {
        pos = null;
      }
    }
    plan.steps.forEach((s, k) => {
      if (!s.walk) return;
      /* any acting move waits; so does a sit or a feeling by someone in this walk ("walks over to Nessa and sits",
         "..., then smiles") */
      const mine = (x) => (x.sit || x.feel.length) && (x.who || []).some((i) => s.who.includes(i));
      out[k].wait = plan.steps.slice(k).some((x) => x.move || mine(x));
      if (!pos) return void (out[k].secs = 2.6);
      let far = 0;
      s.who.forEach((i) => {
        const me = pos[i];
        if (!me) return;
        const w = s.walk.to;
        let to = null;
        if (typeof w === "number" && pos[w] && w !== i) {
          const b = pos[w];
          const dx = me.x - b.x;
          const dz = me.z - b.z;
          const L = Math.hypot(dx, dz) || 1;
          const stop = Math.max(0.5, Math.min(gap, near, L));
          to = { x: b.x + (dx / L) * stop, z: b.z + (dz / L) * stop };
        } else if (w === "back") to = { x: me.x, z: me.z - 1.8 };
        else if (w && typeof w.x === "number") to = { x: w.x, z: w.z };
        if (!to) return;
        far = Math.max(far, Math.hypot(to.x - me.x, to.z - me.z));
        pos[i] = to;
      });
      out[k].secs = far / WALK_SPEED + 0.4;
    });
    return out;
  }

  /* ---------- per view ---------- */
  const STATE = new WeakMap();
  const st = (ctx) => {
    let S = STATE.get(ctx);
    if (!S) STATE.set(ctx, (S = { plan: null, built: "", run: null, token: 0, report: [], said: "", plays: 0 }));
    return S;
  };
  const ctlOf = (ctx) => {
    const c = R.current && R.current();
    return c && c.ctx === ctx ? c : null;
  };
  const Stg = () => window.CurioRigStaging;
  /* each actor's ctx now (actor 1 is the view's own) */
  function actorCtx(ctx, i) {
    if (i === 0) return ctx;
    const list = Stg() && Stg().actors ? Stg().actors({ ctx }) : null;
    const a = list && list[i];
    return a && a.loaded ? a.ctx : null;
  }
  function setVal(ctx, c, id, v) {
    c.prefs.values[id] = v;
    if (c !== ctx) return;
    const s = R.SLIDERS.find((x) => x.id === id);
    const inp = ctx.el && ctx.el.querySelector(`[data-slider="${id}"]`);
    if (s && inp && !inp.disabled) {
      const n = s.scale.length - 1;
      inp.value = (v * n).toFixed(2);
      const w = inp.closest(".rig-row") && inp.closest(".rig-row").querySelector("[data-word]");
      if (w) w.textContent = s.scale[Math.round(v * n)];
    }
  }
  function feel(ctx, i, list) {
    const c = actorCtx(ctx, i);
    if (!c) return;
    const m = {};
    (list || []).forEach(([f, v]) => (m[f] = v));
    FEELINGS.forEach((f) => setVal(ctx, c, F + f, m[f] || 0));
  }
  /* the camera lenses on this view's own sliders (rig/camera.js reads them) */
  function camTo(ctx, vals) {
    Object.keys(CAM_START).forEach((id) => {
      const s = R.SLIDERS.find((x) => x.id === id);
      if (!s || vals[id] == null || s.scale.indexOf(vals[id]) < 0) return;
      setVal(ctx, ctx, id, s.scale.indexOf(vals[id]) / (s.scale.length - 1));
    });
  }
  function say(ctx, text) {
    const S = st(ctx);
    S.said = text;
    const el = ctx.el && ctx.el.querySelector(`[data-ext="${ID}"] [data-scene="said"]`);
    if (el) el.textContent = text;
  }
  function drawReport(ctx) {
    const S = st(ctx);
    const el = ctx.el && ctx.el.querySelector(`[data-ext="${ID}"] [data-scene="read"]`);
    if (el) el.innerHTML = S.report.length ? `<b>Read as:</b><ul style="margin:.2rem 0 .4rem 1.1rem;padding:0">${S.report.map((x) => `<li><b>${esc(x[0])}:</b> ${esc(x[1])}</li>`).join("")}</ul>` : "";
  }

  /* ---------- building it: characters, staging, set ---------- */
  async function build(ctx, text) {
    const S = st(ctx);
    const my = ++S.token;
    const plan = read(text);
    S.plan = plan;
    S.run = null;
    const report = [];
    const ctl = ctlOf(ctx);
    const St = Stg();
    /* the characters */
    const ids = [];
    const looks = [];
    plan.cast.forEach((c, i) => {
      let words = c.look;
      let how = "";
      const had = R.maker && R.maker.store().list.find((m) => m.name.trim().toLowerCase() === c.name.toLowerCase());
      if (!words) {
        words = had ? null : PLAIN[i % PLAIN.length];
        how = had ? "the saved look" : "a plain look (add one in brackets after the name)";
      }
      const r = R.maker && R.maker.remember ? R.maker.remember(c.name, words, i === 0) : null;
      if (!r) {
        ids.push(null);
        looks.push(`${c.name}: no room to keep another character (24 is the most), so the Plain figure plays them`);
        return;
      }
      ids.push(r);
      if (!how) how = r.made ? "made new" : r.changed ? "the saved one, with the new look" : "the saved one";
      const said = R.maker.read(r.text).said;
      looks.push(`${c.name} (${how}): ${said.length ? said.join(", ") : "a plain outfit"}`);
    });
    if (plan.cast.length) report.push(["Characters", looks.join("; ")]);
    else report.push(["Characters", "no names found, so the character in the view plays it (write a name with a look in brackets, like Ida (red hair, overalls))"]);
    plan.famous.forEach((f) => {
      const bits = [];
      if (f.asName) bits.push(`${f.name} is a famous character's name: here it is only a name tag, the look is our own`);
      if (f.left.length) bits.push(`"${f.left.join(", ")}" left out of ${f.name}'s look: only your look words are used, never a famous character`);
      report.push(["Original looks only", bits.join("; ")]);
    });
    /* actor 1: the view's own character */
    if (ctl && ids[0]) {
      const want = ids[0].text;
      if (ctx.prefs.character !== "made" || S.a1Text !== want || S.a1Id !== ids[0].id) {
        S.a1Text = want;
        S.a1Id = ids[0].id;
        await ctl.load("made");
        if (my !== S.token) return plan;
      }
    }
    /* actors 2 to 4 */
    if (St && St.cast) {
      const rest = plan.cast.slice(1).map((c, k) => ({ who: ids[k + 1] ? "made:" + ids[k + 1].id : "rigged-figure", name: c.name, text: ids[k + 1] ? ids[k + 1].text : "" }));
      const sig = JSON.stringify(rest);
      if (sig !== S.castSig) {
        /* a changed look is built again: take them out first */
        if (S.castSig) St.cast([], { ctx });
        St.cast(rest.map((x) => ({ who: x.who, name: x.name })), { ctx });
        S.castSig = sig;
      }
      if (plan.cast[0]) St.name(0, plan.cast[0].name, { ctx });
      await St.ready({ ctx });
      if (my !== S.token) return plan;
      if (plan.cast.length > 1) St.preset(plan.preset, { ctx });
    }
    /* who sits, and the set */
    const Sets = window.CurioRigSets;
    if (Sets && plan.sit) Sets.sitters(ctx, firstSitters(plan));
    if (Sets && plan.setText) {
      keepSet(plan.setText);
      Sets.make(ctx, plan.setText);
      const ss = Sets.state(ctx);
      report.push(["Set", (ss.said || "").replace(/^Read as: /, "")]);
    } else report.push(["Set", "no place in the words, so the set stays as it is (start with a place, like At a diner at night)"]);
    /* staging */
    const names = plan.cast.map((c) => c.name);
    const staging = [];
    if (plan.cast.length > 1) staging.push(plan.preset);
    if (plan.sit) staging.push(`${list(plan.sitters.map((i) => names[i]))} ${plan.sitters.length > 1 ? "sit" : "sits"}${plan.sitPhrase ? " " + plan.sitPhrase : ""}`);
    const others = names.filter((n, i) => !plan.sitters.includes(i));
    if (plan.sit && others.length) staging.push(`${list(others)} ${others.length > 1 ? "stand" : "stands"}`);
    const speakers = [...new Set(plan.steps.filter((s) => s.say).map((s) => names[s.who[0]]))];
    if (speakers.length) staging.push(`${list(speakers)} ${speakers.length > 1 ? "speak" : "speaks"}: the others look at them`);
    if (staging.length) report.push(["Staging", staging.join("; ")]);
    /* feelings and moves in order */
    const feels = plan.steps.filter((s) => s.feel.length).map((s) => `${list(s.who.map((i) => names[i]))}: ${s.feel.map(([f, v]) => howMuch(v) + FEEL_SAY[f]).join(" and ")}`);
    if (feels.length) report.push(["Feelings", feels.join(", then ")]);
    const order = plan.steps.map((s, k) => {
      const bits = [];
      if (s.walk) bits.push("walks to " + s.walk.where);
      if (s.sit) bits.push("sits down");
      if (s.stand) bits.push("stands up");
      if (s.say) bits.push("speaks");
      if (s.look != null) bits.push("looks at " + names[s.look]);
      if (s.move) bits.push(s.move);
      if (s.feel.length && !s.move && !s.say) bits.push(s.feel.map(([f, v]) => howMuch(v) + FEEL_SAY[f]).join(" and "));
      if (s.cam && !s.who.length) bits.push(s.cam.said.join(", "));
      return `${k + 1}. ${s.who.length ? list(s.who.map((i) => names[i])) + " " : ""}${bits.join(", ")}`;
    });
    if (order.length) report.push(["Moves in order", order.join("  ")]);
    const cams = plan.steps.map((s, k) => (s.cam ? `${k + 1}. ${s.cam.said.join(", ")}` : "")).filter(Boolean);
    if (cams.length) report.push(["Camera", cams.join("  ")]);
    if (plan.ignored.length) report.push(["Ignored", plan.ignored.map((x) => `"${x}"`).join(", ")]);
    S.report = report;
    S.built = text;
    drawReport(ctx);
    return plan;
  }
  const list = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
  /* who sits from the start (null: every person, when the words name nobody) */
  const firstSitters = (plan) => (plan.sitFirst.length ? plan.sitFirst.slice() : plan.sitters.length ? [] : null);
  /* the set's words are kept as a set of their own in the set list (never over one of yours) */
  function keepSet(text) {
    const Rs = R.sets;
    if (!Rs || !Rs.store) return;
    try {
      const s = Rs.store();
      let x = s.list.find((y) => y.text === text) || s.list.find((y) => y.name === "From a scene");
      if (!x) {
        if (s.list.length >= 24) return;
        x = { id: "s" + Date.now().toString(36), name: "From a scene", text };
        s.list.push(x);
      }
      x.text = text;
      s.cur = x.id;
      s.on = true;
      localStorage.setItem(Rs.KEY, JSON.stringify({ list: s.list.map((y) => ({ id: y.id, name: y.name, text: y.text })), cur: s.cur, on: true }));
    } catch (e) {
      /* private window: the set is built but not kept */
    }
  }

  /* ---------- playing it ---------- */
  function play(ctx) {
    const S = st(ctx);
    const plan = S.plan;
    if (!plan) return 0;
    const St = Stg();
    const n = plan.cast.length;
    /* back to the start: on their marks, calm, nobody speaking */
    if (St && n > 1) St.preset(plan.preset, { ctx });
    if (St && St.speaker && n > 1) St.speaker(-1, { ctx });
    for (let i = 0; i < Math.max(1, n); i++) feel(ctx, i, []);
    /* who sits from the start; the camera frames actor 1 until the words say who */
    const Sets = window.CurioRigSets;
    const sitNow = firstSitters(plan);
    if (Sets && plan.sit) Sets.sitters(ctx, sitNow);
    if (St && St.subject) St.subject(0, { ctx });
    /* the camera starts from a plain shot when the words move it */
    const camAt = plan.camera || [];
    if (camAt.some(Boolean)) {
      ctx.prefs.camera = Object.assign({}, ctx.prefs.camera, { follow: true });
      camTo(ctx, camStart(plan));
    }
    const q = [];
    let t = 0.4;
    /* a walk with a move in it or after it holds the beat's clock until the walkers get there (see walkTimes) */
    const walks = walkTimes(plan);
    let walking = 0;
    plan.steps.forEach((s, k) => {
      let d = 0.9;
      const who = s.who;
      const wait = s.walk && St && n > 1 && walks[k].wait;
      /* sitting down and feeling something: on arriving when the step is a walk that waits, else now (standing up
         always comes first) */
      const settle = (up, down) => {
        if (((up && s.stand) || (down && s.sit)) && Sets && sitNow) {
          who.forEach((i) => {
            const at = sitNow.indexOf(i);
            if (down && s.sit && at < 0) sitNow.push(i);
            if (up && s.stand && at >= 0) sitNow.splice(at, 1);
          });
          Sets.sitters(ctx, sitNow.slice());
        }
        if (down && s.feel.length) who.forEach((i) => feel(ctx, i, s.feel));
      };
      q.push({
        at: t,
        fn: () => {
          if (camAt[k]) camTo(ctx, camAt[k]);
          if (camAt[k] && camAt[k][FRAMES] != null && St && St.subject) St.subject(camAt[k][FRAMES], { ctx });
          settle(true, !wait);
          if (s.say && St && n > 1) St.speaker(who[0], { ctx });
          if (s.look != null && St && n > 1) St.speaker(s.look, { ctx });
          who.forEach((i) => {
            const c = actorCtx(ctx, i);
            if (s.walk && St && n > 1) {
              const all = St.actors({ ctx });
              const me = all && all[i];
              const to = s.walk.to === "back" && me ? { x: me.x, z: me.z - 1.8 } : s.walk.to;
              St.walkTo(i, to, { ctx }, s.move || "");
            } else if (s.move && c && R.gestures) R.gestures.play({ ctx: c }, s.move);
          });
          if (wait && S.run) S.run.wait = { who: who.slice(), until: ctx.clock + walks[k].secs + 8 };
        },
      });
      /* the beat's clock stands still while they walk, so this comes once they get there */
      if (wait && (s.sit || s.feel.length)) q.push({ at: t + 0.05, fn: () => settle(false, true) });
      if (s.say) d = Math.max(d, 1.5);
      if (s.move) d = Math.max(d, moveLength(ctx, s.move) + 0.15);
      if (s.feel.length && !s.move) d = Math.max(d, 1.3);
      if (s.sit || s.stand) d = Math.max(d, 1.2);
      if (wait) {
        /* the clock waits while they walk; the step goes on for the move they make on arriving */
        d = s.move ? moveLength(ctx, s.move) + 0.15 : 0.3;
        if (s.sit) d = Math.max(d, 1.2);
        if (s.feel.length && !s.move) d = Math.max(d, 1.3);
        d += 0.05;
        walking += walks[k].secs;
      } else if (s.walk) d = Math.max(d, 2.2 + (s.move ? moveLength(ctx, s.move) : 0));
      t += d;
    });
    const total = t + 0.6;
    S.run = { t0: ctx.clock, q, total, wait: null };
    S.plays++;
    const secs = total + walking;
    say(ctx, plan.steps.length ? `Playing the beat (${secs.toFixed(1)} seconds).` : "Nothing to play yet: say who does what (Nessa says something; Ida laughs).");
    return secs;
  }
  function tick(ctx, dt) {
    const S = st(ctx);
    const r = S.run;
    if (!r) return;
    if (S.hold) r.t0 += dt || 0; /* held: the beat waits where it is */
    else if (r.wait) {
      /* a walk the next move waits for: the beat's clock stands still until everyone walking gets there */
      const St = Stg();
      const all = St && St.actors ? St.actors({ ctx }) : null;
      if (all && ctx.clock < r.wait.until && r.wait.who.some((i) => all[i] && all[i].walking)) r.t0 += dt || 0;
      else r.wait = null;
    }
    const t = ctx.clock - r.t0;
    while (r.q.length && t >= r.q[0].at) {
      try {
        r.q.shift().fn();
      } catch (e) {
        console.warn("3D add-on scene: " + e.message);
      }
    }
    if (t >= r.total) {
      S.run = null;
      if (/^Playing/.test(S.said)) say(ctx, "The beat is done. Play it again, or send it to the storyboard.");
    }
  }
  async function playWords(ctx, text) {
    const S = st(ctx);
    if (S.built !== text || !S.plan) {
      say(ctx, "Building the scene…");
      await build(ctx, text);
    }
    return play(ctx);
  }
  async function flipBook(ctx, text) {
    const snap = window.CurioRigSnapshot;
    if (!snap || !snap.flipBook) return say(ctx, "Send to storyboard is not part of this 3D view."), null;
    const total = await playWords(ctx, text == null ? ctx.prefs.sceneText || EXAMPLE : text);
    if (!total) return null;
    const count = clamp(Math.ceil(total / 0.25), 4, 24);
    const gap = clamp(total / count, 1 / 8, 2);
    say(ctx, `Playing the beat and drawing ${count} frames…`);
    const r = await snap.flipBook(ctx, { count, gap });
    if (r && !r.error) say(ctx, `A flip book of ${r.count} drawings of the beat is now scene ${r.si + 1} of the storyboard.`);
    else say(ctx, (r && r.error) || "The flip book could not be sent. Is the storyboard open on this page?");
    return r;
  }

  /* ---------- putting the beat on the timeline ----------
     The beat becomes nodes on the Screen's curiosity lanes, one moment (row) per step, starting at the playhead
     (a walk an acting move, a sit or a feeling waits for takes as many moments as the walk does, and a move, sit or
     feeling in its clause comes on the moment after they arrive; lanesOf's steps say where each step and move landed),
     as one undo step. Every character in it gets a character track (found by name, else added) with its own
     lanes, a value on every moment of the beat so nothing ramps in between: the feelings (feelingFaceLens), the
     acting move (actingLens.move, with Play it, actingLens.cue, on go where a move starts), who is speaking
     (eyeline.speaking), sitting or standing (blocking.seated: "sits" after something has happened is a moment
     of its own) and where they walk to (characterPath.to: "the second character", the middle, the front, the
     back). The film's own lanes get how they stand together (blocking.together: face to face, standoff...) and
     how far apart (blocking.distance), where it happens (setting.place) and the time of day; the camera track
     gets the camera words and who the camera frames (shotSize.who: "close-up on Ida" is "the first character"
     when Ida's is the top character track). Lanes this makes hold their value from node to node. Then the
     Screen plays the beat from the lanes alone: rig.js, staging.js (the marks, walking, who sits, who the camera
     frames), faces.js and gestures.js follow them, and follow() below builds the set (with seats once anyone
     sits) and turns everyone to whoever is speaking. */
  const BEAT_KEY = "curiosities-rig3d-beat-v1";
  const AMOUNT = ["not at all", "a little", "clearly", "very"];
  const MOVE = "actingLens.move";
  const CUE = "actingLens.cue";
  const SPEAKING = "eyeline.speaking";
  const PLACE = "setting.place";
  /* the staging on lanes (rig/staging.js follows them on the Screen): how they stand together (the film's), and per
     character, sitting or standing and where they walk to; a person on a lane is "the first character" (the top
     character track), "the second character"... In lanesOf a person is "@" and their number in the cast. */
  const TOGETHER = "blocking.together";
  const SEATED = "blocking.seated";
  const WALK_TO = "characterPath.to";
  const WHO = ["the first character", "the second character", "the third character", "the fourth character"];
  const PLACE_WORDS = { car: "inside a car", kitchen: "a kitchen", bedroom: "a bedroom", living: "a living room", office: "an office", classroom: "a classroom", diner: "a diner", bar: "a bar", stage: "a stage", bathroom: "a bathroom", store: "a store", garage: "a garage", room: "a room", road: "a road", street: "a street", park: "a park", forest: "a forest", beach: "a beach", desert: "a desert", farm: "a farm", yard: "a backyard", lot: "a parking lot", outside: "outside" };
  /* the catalog's Time of day (dawn, day, dusk, night) and the set's words for it */
  const DAY = { morning: "dawn", noon: "day", sunset: "dusk", night: "night" };
  const DAY_WORDS = { dawn: "in the morning", day: "at noon", dusk: "at sunset", night: "at night" };
  const Sc = () => window.CurioScale;
  const TOD = () => (Sc() && Sc().fix("timeOfDay", "night") ? "timeOfDay" : "timeOfDay.setting");
  function readBeatKeep() {
    try {
      const v = JSON.parse(localStorage.getItem(BEAT_KEY) || "null");
      return v && typeof v === "object" && v.sets && typeof v.sets === "object" ? v : { sets: {}, sit: {} };
    } catch (e) {
      return { sets: {}, sit: {} };
    }
  }
  function writeBeatKeep(v) {
    try {
      localStorage.setItem(BEAT_KEY, JSON.stringify(v));
    } catch (e) {}
  }

  /* What the beat puts on each lane: { n, chars: [{ i, lanes: { id: [value per moment] } }], film: { id: { k: v } },
     camera: { id: { k: v } }, steps: [{ at, move, arrive, walk }], moment } (k: the moment of the beat, 0 is the playhead;
     at and move: the moments a step starts and its move plays; arrive: for a walk that waits, the moment they get
     there, when its move, sit or feeling comes; walk: its walk in seconds). Pure: tests read it too. */
  function lanesOf(plan) {
    const cast = Math.max(1, plan.cast.length);
    const used = [...new Set(plan.steps.flatMap((s) => s.feel.map((x) => x[0])))];
    const moves = plan.steps.some((s) => s.move);
    const speaks = cast > 1 && plan.steps.some((s) => s.say || s.look != null);
    const walks = cast > 1 && plan.steps.some((s) => s.walk);
    const sits = plan.sit && plan.cast.length > 0;
    /* the moments of each step: one, except a walk a move waits for (walkTimes), which lasts as many moments as
       the walk takes; a move in the walk's own clause gets the moment after they arrive */
    const times = walks ? walkTimes(plan) : plan.steps.map(() => ({ secs: 0, wait: false }));
    const at = [];
    const moveAt = [];
    let m = 0;
    plan.steps.forEach((s, k) => {
      at[k] = m;
      if (walks && s.walk && times[k].wait) {
        const span = Math.max(1, Math.ceil(times[k].secs / MOMENT));
        moveAt[k] = m + span;
        m += span + (s.move || s.sit || s.feel.length ? 1 : 0);
      } else (moveAt[k] = m), m++;
    });
    const n = Math.max(1, m);
    const chars = [];
    for (let i = 0; i < cast; i++) chars.push({ i, lanes: {} });
    chars.forEach((c) => {
      used.forEach((f) => (c.lanes["feelingFaceLens." + f] = []));
      if (moves) (c.lanes[MOVE] = []), (c.lanes[CUE] = []);
      if (speaks) c.lanes[SPEAKING] = [];
      if (sits) c.lanes[SEATED] = [];
      if (walks) c.lanes[WALK_TO] = [];
    });
    const now = chars.map(() => ({}));
    const sitting = new Set(sits ? firstSitters(plan) || chars.map((c) => c.i) : []);
    let spk = -1;
    plan.steps.forEach((s, k) => {
      if (s.say) spk = s.who[0];
      if (s.look != null) spk = s.look;
      /* a walk that waits: its sit and feeling come on the moment they arrive (moveAt), with its move */
      const late = walks && s.walk && times[k].wait;
      let done = false;
      const settle = () => {
        done = true;
        s.who.forEach((i) => {
          if (s.feel.length && now[i]) now[i] = Object.fromEntries(s.feel);
          if (s.sit) sitting.add(i);
        });
      };
      s.who.forEach((i) => s.stand && sitting.delete(i));
      if (!late) settle();
      const end = k + 1 < plan.steps.length ? at[k + 1] : n;
      for (let j = at[k]; j < end; j++) {
        if (!done && j >= moveAt[k]) settle();
        chars.forEach((c) => {
          used.forEach((f) => (c.lanes["feelingFaceLens." + f][j] = AMOUNT[Math.round(clamp(now[c.i][f] || 0, 0, 1) * 3)]));
          const mine = s.move && s.who.includes(c.i) && j === moveAt[k];
          if (moves) (c.lanes[MOVE][j] = mine ? s.move : "none"), (c.lanes[CUE][j] = mine ? "go" : "wait");
          if (speaks) c.lanes[SPEAKING][j] = spk === c.i ? "speaking" : "listening";
          if (sits) c.lanes[SEATED][j] = sitting.has(c.i) ? "sitting" : "standing";
          if (walks) {
            const w = s.walk && s.who.includes(c.i) && j === at[k] ? s.walk : null;
            c.lanes[WALK_TO][j] = !w ? "stays put" : typeof w.to === "number" ? "@" + w.to : w.to === "back" ? "the back" : w.to.z > 1 ? "the front" : "the middle";
          }
        });
      }
      if (!done) settle();
    });
    if (!plan.steps.length) chars.forEach((c) => Object.keys(c.lanes).forEach((id) => (c.lanes[id] = [])));
    const film = {};
    const St = Stg();
    if (plan.cast.length > 1 && St && St.PRESETS) {
      const pr = St.PRESETS.find((x) => x.id === plan.preset);
      const scale = St.SLIDERS[0].scale;
      if (pr && scale.indexOf(pr.dist) >= 0) film["blocking.distance"] = { 0: scale.indexOf(pr.dist) };
      if (pr) film[TOGETHER] = { 0: pr.id };
    }
    if (plan.setText && R.sets) {
      const p = R.sets.read(plan.setText);
      if (p.place && PLACE_WORDS[p.place]) {
        film[PLACE] = { 0: PLACE_WORDS[p.place] };
        if (p.time && DAY[p.time]) film[TOD()] = { 0: DAY[p.time] };
      }
    }
    const camera = {};
    (plan.camera || []).forEach((v, k) => v && Object.keys(v).forEach((id) => ((camera[id] = camera[id] || {})[at[k] != null ? at[k] : k] = v[id])));
    /* the beat starts from a plain shot (wide on everyone, or medium on one) on every camera lane it moves */
    const start = camStart(plan);
    if (camera[FRAMES]) Object.keys(camera[FRAMES]).forEach((k) => (camera[FRAMES][k] = "@" + camera[FRAMES][k]));
    Object.keys(camera).forEach((id) => camera[id][0] == null && (camera[id][0] = id === "cameraMove" ? "none" : id === FRAMES ? "whoever is shown" : start[id]));
    /* steps: where each step starts and where its move plays, in moments, and how long its walk takes (seconds) */
    return { n, chars, film, camera, steps: plan.steps.map((s, k) => ({ at: at[k], move: s.move ? moveAt[k] : null, arrive: s.walk && times[k].wait ? moveAt[k] : null, walk: s.walk ? times[k].secs : 0 })), moment: MOMENT };
  }

  /* Write the beat at the playhead (or opts.row, a moment's index) as one undo step.
     -> { ok, error?, from, to, tracks: { name: trackId }, lanes, said } */
  function toTimeline(text, opts) {
    opts = opts || {};
    const E = window.CurioEngine;
    if (!E || !E.send || !Sc()) return { ok: false, error: "The timeline is not on this page." };
    const plan = read(text);
    const L = lanesOf(plan);
    if (!plan.steps.length && !Object.keys(L.film).length) return { ok: false, error: "Nothing to put on the timeline yet: say who does what (Nessa says something; Ida laughs)." };
    const st = E.state();
    const LIM = E.LIMIT || { rows: 64, tracks: 16, perTrack: 24 };
    const scr = window.CurioScreen;
    const p = clamp(opts.row != null ? opts.row | 0 : scr && scr.row ? scr.row() : 0, 0, Math.max(0, st.rows.length));
    const cmds = [];
    const notes = [];
    /* rows: one per step, added at the end when the film is too short (their ids worked out the engine's way) */
    const rowIds = st.rows.map((r) => r.id);
    const taken = new Set(st.rows.map((r) => r.id).concat(st.tracks.map((t) => t.id), (st.links || []).map((l) => l.id), (st.refs || []).map((r) => r.id)));
    let next = st.next || 1;
    const freshRow = () => {
      let id;
      do id = "r" + next++;
      while (taken.has(id));
      taken.add(id);
      return id;
    };
    const added = [];
    while (rowIds.length < p + L.n) {
      if (rowIds.length >= LIM.rows) return { ok: false, error: `The beat needs ${L.n} moments from the playhead, and a film holds ${LIM.rows} here. Move the playhead back first.` };
      const id = freshRow();
      cmds.push({ type: "addRow", copy: false });
      rowIds.push(id);
      added.push(id);
    }
    /* tracks */
    const curs = {};
    const kinds = {};
    st.tracks.forEach((t) => ((curs[t.id] = t.curiosities.slice()), (kinds[t.id] = t.kind)));
    let nTracks = st.tracks.length;
    /* the character tracks top to bottom once the beat is written (new tracks go at the end) */
    const charOrder = st.tracks.filter((t) => t.kind === "character").map((t) => t.id);
    const newTrack = (kind, label) => {
      if (nTracks >= LIM.tracks) return null;
      const slug = String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "track";
      let id = kind + "-" + slug;
      for (let k = 2; taken.has(id); k++) id = kind + "-" + slug + "-" + k;
      taken.add(id);
      cmds.push({ type: "addTrack", id, kind, label, curiosities: [] });
      if (kind === "character") charOrder.push(id);
      curs[id] = [];
      kinds[id] = kind;
      nTracks++;
      return id;
    };
    const tracks = {};
    const charTrack = plan.cast.map((c) => {
      const t = st.tracks.find((x) => x.kind === "character" && String(x.label || "").trim().toLowerCase() === c.name.toLowerCase());
      const id = t ? t.id : newTrack("character", c.name);
      if (!id) notes.push(`no room for a track for ${c.name} (a film holds ${LIM.tracks} tracks)`);
      tracks[c.name] = id;
      return id;
    });
    /* with no names, the shown character (or the first character track) plays it */
    if (!plan.cast.length) {
      const RS = window.CurioRigScreen;
      const any = (RS && RS.shown && RS.shown()) || (st.tracks.find((t) => t.kind === "character") || {}).id || newTrack("character", "Character");
      charTrack.push(any);
    }
    const filmAt = {};
    const filmTrack = (id, kind) => (filmAt[id] !== undefined ? filmAt[id] : (filmAt[id] = filmTrack1(id, kind)));
    const filmTrack1 = (id, kind) => {
      const have = st.tracks.filter((t) => t.curiosities.includes(id));
      const t = have.find((x) => x.kind !== "character") || have[0];
      if (t) return t.id;
      const room = Object.keys(curs).find((k) => kinds[k] === kind && curs[k].length < LIM.perTrack);
      return room || newTrack(kind, kind === "camera" ? "Camera" : "Master");
    };
    let lanes = 0;
    const point = (track, id, k, value) => {
      if (!track) return;
      /* a person ("@1") is their character track's place from the top */
      if (typeof value === "string" && value[0] === "@") {
        const ord = charOrder.indexOf(charTrack[+value.slice(1)]);
        if (ord < 0 || ord >= WHO.length) return void (notes.includes("only the top 4 character tracks can be walked to or framed") || notes.push("only the top 4 character tracks can be walked to or framed"));
        value = WHO[ord];
      }
      const v = Sc().fix(id, value);
      if (v == null) return void notes.push(`${id} has no "${value}"`);
      if (!curs[track].includes(id)) {
        if (curs[track].length >= LIM.perTrack) return void (notes.includes(track + " is full") || notes.push(track + " is full"));
        cmds.push({ type: "addCuriosity", track, curiosity: id });
        curs[track].push(id);
      }
      cmds.push({ type: "setPoint", row: rowIds[p + k], track, curiosity: id, value: v });
      const lk = track + "|" + id;
      if (!point.seen.has(lk)) {
        point.seen.add(lk);
        lanes++;
        const lane = st.lanes[lk];
        if (!lane || !Object.keys(lane.points || {}).length) point.hold.push({ type: "laneMode", track, curiosity: id, mode: "hold" });
      }
    };
    point.seen = new Set();
    point.hold = [];
    L.chars.forEach((c) => Object.keys(c.lanes).forEach((id) => c.lanes[id].forEach((v, k) => point(charTrack[c.i], id, k, v))));
    Object.keys(L.film).forEach((id) => Object.keys(L.film[id]).forEach((k) => point(filmTrack(id, "master"), id, +k, L.film[id][k])));
    Object.keys(L.camera).forEach((id) => Object.keys(L.camera[id]).forEach((k) => point(filmTrack(id, "camera"), id, +k, L.camera[id][k])));
    cmds.push(...point.hold);
    if (!lanes) return { ok: false, error: "Nothing could go on the timeline" + (notes.length ? ": " + notes.join("; ") : ".") };
    const who = plan.cast.map((c) => c.name);
    const label = `Beat: ${who.length ? list(who) : "the film"}, moments ${p + 1} to ${p + L.n}`;
    const res = E.send({ type: "batch", label, commands: cmds });
    if (!res.ok) return { ok: false, error: res.error };
    /* the moments added must be the ones the nodes went on; if not, take it back */
    const now = E.state().rows.map((r) => r.id);
    if (added.some((id) => !now.includes(id))) {
      E.undo();
      return { ok: false, error: "The film changed while the beat was written; try again." };
    }
    /* the looks: each name is kept as a made character, and plays its track on the Screen */
    const RS = window.CurioRigScreen;
    plan.cast.forEach((c, i) => {
      let words = c.look || null;
      const had = R.maker && R.maker.store().list.find((m) => m.name.trim().toLowerCase() === c.name.toLowerCase());
      if (!words && !had) words = PLAIN[i % PLAIN.length];
      const r = R.maker && R.maker.remember ? R.maker.remember(c.name, words, false) : null;
      if (r && RS && RS.setCast && charTrack[i]) RS.setCast(charTrack[i], "made:" + r.id);
    });
    /* the set's whole words (things, colors, who sits) are kept for its place and time of day */
    if (plan.setText && L.film[PLACE]) {
      keepSet(plan.setText);
      const k = L.film[PLACE][0] + "|" + (L.film[TOD()] ? L.film[TOD()][0] : "");
      const keep = readBeatKeep();
      keep.sets[k] = plan.setText;
      keep.sit = keep.sit || {};
      keep.sit[k] = plan.sit && plan.sitters.length && plan.sitters.length < plan.cast.length ? plan.sitters.map((i) => charTrack[i]).filter(Boolean) : null;
      writeBeatKeep(keep);
    }
    const said = `On the timeline at moments ${p + 1} to ${p + L.n}: ${lanes} lane${lanes === 1 ? "" : "s"} for ${who.length ? list(who) : "the film"}${Object.keys(L.camera).length ? " and the camera" : ""}. One undo takes it all back. Press Play on the Screen to see it.` + (notes.length ? " Left out: " + notes.join("; ") + "." : "");
    return { ok: true, from: p, to: p + L.n - 1, tracks, lanes, said, label, rows: rowIds.slice(p, p + L.n) };
  }

  /* ---------- on the Screen: the lanes that need the whole view (the set, who is speaking) ---------- */
  function follow(ctx) {
    if (ctx.actor) return;
    const RS = window.CurioRigScreen;
    const ctl = RS && RS.controller && RS.controller();
    const E = window.CurioEngine;
    const Scr = window.CurioScreen;
    if (!ctl || ctl.ctx !== ctx || !E || !Scr || !Scr.isOpen || !Scr.isOpen() || !Scr.row) return;
    const S = st(ctx);
    if (S.fAt != null && Math.abs(ctx.clock - S.fAt) < 0.12) return;
    S.fAt = ctx.clock;
    let es;
    try {
      es = E.state();
    } catch (e) {
      return;
    }
    const r = es.rows[Scr.row()];
    if (!r) return;
    const lane = (t, id) => t.curiosities.includes(id) && es.lanes[t.id + "|" + id] && es.lanes[t.id + "|" + id].on !== false;
    const val = (t, id) => {
      try {
        return E.value(r.id, t.id, id);
      } catch (e) {
        return null;
      }
    };
    /* where it happens */
    const pt = es.tracks.find((t) => lane(t, PLACE));
    const Sets = window.CurioRigSets;
    if (pt && Sets) {
      const place = val(pt, PLACE);
      const tt = es.tracks.find((t) => lane(t, TOD()));
      const time = tt ? val(tt, TOD()) : "";
      const key = place + "|" + (time || "");
      /* who sits comes from the Sitting or standing lanes when there are any (rig/staging.js seats them); the set
         then needs its seats as soon as anyone sits */
      const seated = es.tracks.filter((t) => t.kind === "character" && lane(t, SEATED));
      const anySits = seated.some((t) => val(t, SEATED) === "sitting");
      const sig = key + (seated.length ? "|" + anySits : "");
      if (place && sig !== S.fSet) {
        S.fSet = sig;
        if (place === "anywhere") Sets.clear(ctx);
        else {
          const keep = readBeatKeep();
          let words = keep.sets[key] || `${place}${DAY_WORDS[time] ? " " + DAY_WORDS[time] : ""}`;
          if (anySits && !SIT.test(words)) words += ", sitting";
          if (!seated.length) {
            const sitT = keep.sit && keep.sit[key];
            const order = actorTracks(ctx);
            Sets.sitters(ctx, Array.isArray(sitT) ? order.map((t, i) => (sitT.includes(t) ? i : -1)).filter((i) => i >= 0) : null);
          }
          Sets.make(ctx, words);
        }
      }
    }
    /* who is speaking: everyone else looks at them */
    const St = Stg();
    const sp = es.tracks.filter((t) => t.kind === "character" && lane(t, SPEAKING));
    if (sp.length && St && St.speaker) {
      const talking = sp.filter((t) => val(t, SPEAKING) === "speaking").map((t) => t.id);
      const order = actorTracks(ctx);
      const i = order.findIndex((t) => talking.includes(t));
      const sig = i + "|" + order.join();
      if (sig !== S.fSpk) {
        S.fSpk = sig;
        St.speaker(i, { ctx });
      }
    }
  }
  /* the character track of each actor in the view: actor 1 is the one the Screen shows */
  function actorTracks(ctx) {
    const RS = window.CurioRigScreen;
    const St = Stg();
    const s = St && St.state ? St.state({ ctx }) : null;
    const first = RS && RS.shown ? RS.shown() : "";
    return s && s.actors.length ? s.actors.map((a, i) => (i === 0 ? first : a.track)) : [first];
  }

  R.extend({
    id: ID,
    label: "Make a whole scene from words",
    beforeRender(ctx, dt) {
      tick(ctx, dt);
      follow(ctx);
    },
    panel(ctx) {
      const S = st(ctx);
      const text = ctx.prefs.sceneText || EXAMPLE;
      return `<h4 title="In Maya: a whole shot blocked from a script: set, characters, staging and animation">Make a whole scene from words</h4>
        <p class="cap">Write one beat: where it happens, who is in it (their look in brackets after the name), who sits or stands where, who speaks, how they feel and what they do, in order.</p>
        <textarea data-scene="text" rows="4" style="width:100%;box-sizing:border-box" aria-label="The beat in words">${esc(text)}</textarea>
        <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin:.3rem 0"><button type="button" data-scene="play">Play the beat</button><button type="button" data-scene="lanes" title="Write the beat into the timeline's lanes at the playhead, one moment per step, as one step you can undo">Put this beat on the timeline</button><button type="button" data-scene="flip">Send to the storyboard as a flip book</button><button type="button" data-scene="example" title="Puts the diner example in the box">Show me an example</button></div>
        <p class="cap" data-scene="said" role="status">${esc(S.said)}</p>
        <div class="cap" data-scene="read"></div>
        <p class="cap">Free and on this device. Looks are our own: a famous character's name is never copied, only your look words are used.</p>`;
    },
    wire(ctx, box) {
      const q = (k) => box.querySelector(`[data-scene="${k}"]`);
      drawReport(ctx);
      const words = () => {
        const t = q("text").value.trim() || EXAMPLE;
        q("text").value = t;
        ctx.prefs.sceneText = t;
        ctx.save();
        return t;
      };
      const busy = (b, fn) => async () => {
        if (b.disabled) return;
        b.disabled = true;
        try {
          await fn();
        } finally {
          b.disabled = false;
        }
      };
      q("play").addEventListener("click", busy(q("play"), () => playWords(ctx, words())));
      q("flip").addEventListener("click", busy(q("flip"), () => flipBook(ctx, words())));
      q("lanes").addEventListener("click", () => {
        const r = toTimeline(words());
        say(ctx, r.ok ? r.said : r.error);
      });
      q("example").addEventListener("click", () => {
        q("text").value = EXAMPLE;
        q("text").focus();
      });
    },
  });

  window.CurioRigScene = {
    EXAMPLE,
    read,
    build: (ctx, text) => {
      ctx.prefs.sceneText = text;
      return build(ctx, text);
    },
    play: (ctx) => play(ctx),
    /* hold the beat where it is (true) or let it go on (false): for pictures of one moment */
    hold(ctx, on) {
      st(ctx).hold = !!on;
    },
    playWords: (ctx, text) => playWords(ctx, text),
    flipBook: (ctx, text) => flipBook(ctx, text),
    toTimeline: (text, opts) => toTimeline(text, opts),
    lanesOf: (planOrText) => lanesOf(typeof planOrText === "string" ? read(planOrText) : planOrText),
    BEAT_KEY,
    state(ctx) {
      const S = st(ctx);
      return { built: S.built, playing: !!S.run, left: S.run ? S.run.q.length : 0, total: S.run ? S.run.total : 0, at: S.run ? ctx.clock - S.run.t0 : 0, plays: S.plays, report: S.report.map((x) => x.slice()), said: S.said, plan: S.plan };
    },
  };
})();
