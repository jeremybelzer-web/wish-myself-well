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
   half), on the 3D view's own clock. The "Read as" list shows what each part understood, and anything ignored.
   "Play the beat" builds what changed and plays it from the start; "Send to the storyboard as a flip book"
   plays it and sends drawings of it (rig/snapshot.js, up to 24, as one new scene) to the storyboard.
   Free and on this device; nothing is sent anywhere.

   ctx.prefs.sceneText keeps the words. window.CurioRigScene = { EXAMPLE, read(text) -> plan, build(ctx, text)
   -> Promise<plan>, play(ctx) -> seconds, playWords(ctx, text), flipBook(ctx, text) -> Promise, hold(ctx, on),
   state(ctx) } for tests. */
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
    "a an the at in on inside outside by near then and but so later meanwhile suddenly finally afterwards after before when while now next she he they it we i you everyone everybody nobody someone somebody both all this that there here his her their its one night morning noon sunset evening today tonight yes no oh ok okay hey wow".split(" ")
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

  /* ---------- reading the words ---------- */
  function read(text) {
    const raw = String(text || "").replace(/\s+/g, " ").trim();
    const plan = { text: raw, cast: [], setWords: [], sit: false, sitPhrase: "", sitters: [], standers: [], preset: "", steps: [], ignored: [], famous: [] };
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
    (body.match(/\b[A-Z][\p{L}'-]*\b/gu) || []).forEach((w) => {
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
      const plain = c.trim();
      let who = subjectsOf(plain);
      const mentioned = findNames(plain);
      const sets = R.sets ? R.sets.read(plain.replace(/\b(sits?|sitting|seated|sat|stands?|standing)\b/g, "")) : null;
      const placeFound = !!(sets && (sets.place || sets.time));
      const step = { text: plain, who: null, say: false, move: "", feel: [], walk: null, look: null };
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
      if (SIT.test(plain)) {
        plan.sit = true;
        const seat = plain.match(SEAT_AT);
        if (seat && !plan.sitPhrase) plan.sitPhrase = seat[0];
        who.concat(mentioned.map((x) => x.i)).forEach((i) => !plan.sitters.includes(i) && plan.sitters.push(i));
        did.push("sits");
      } else if (STAND.test(plain)) {
        who.forEach((i) => !plan.standers.includes(i) && plan.standers.push(i));
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
        return;
      }
      if (step.say || step.move || step.feel.length || step.walk || step.look != null) plan.steps.push(step);
    });
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
    if (Sets && plan.sit) Sets.sitters(ctx, plan.sitters.length ? plan.sitters : null);
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
      if (s.say) bits.push("speaks");
      if (s.look != null) bits.push("looks at " + names[s.look]);
      if (s.move) bits.push(s.move);
      if (s.feel.length && !s.move && !s.say) bits.push(s.feel.map(([f, v]) => howMuch(v) + FEEL_SAY[f]).join(" and "));
      return `${k + 1}. ${list(s.who.map((i) => names[i]))} ${bits.join(", ")}`;
    });
    if (order.length) report.push(["Moves in order", order.join("  ")]);
    if (plan.ignored.length) report.push(["Ignored", plan.ignored.map((x) => `"${x}"`).join(", ")]);
    S.report = report;
    S.built = text;
    drawReport(ctx);
    return plan;
  }
  const list = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
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
    const q = [];
    let t = 0.4;
    plan.steps.forEach((s) => {
      let d = 0.9;
      const who = s.who;
      q.push({
        at: t,
        fn: () => {
          if (s.say && St && n > 1) St.speaker(who[0], { ctx });
          if (s.look != null && St && n > 1) St.speaker(s.look, { ctx });
          who.forEach((i) => {
            if (s.feel.length) feel(ctx, i, s.feel);
            const c = actorCtx(ctx, i);
            if (s.walk && St && n > 1) {
              const all = St.actors({ ctx });
              const me = all && all[i];
              const to = s.walk.to === "back" && me ? { x: me.x, z: me.z - 1.8 } : s.walk.to;
              St.walkTo(i, to, { ctx }, s.move || "");
            } else if (s.move && c && R.gestures) R.gestures.play({ ctx: c }, s.move);
          });
        },
      });
      if (s.say) d = Math.max(d, 1.5);
      if (s.move) d = Math.max(d, moveLength(ctx, s.move) + 0.15);
      if (s.feel.length && !s.move) d = Math.max(d, 1.3);
      if (s.walk) d = Math.max(d, 2.2 + (s.move ? moveLength(ctx, s.move) : 0));
      t += d;
    });
    const total = t + 0.6;
    S.run = { t0: ctx.clock, q, total };
    S.plays++;
    say(ctx, plan.steps.length ? `Playing the beat (${total.toFixed(1)} seconds).` : "Nothing to play yet: say who does what (Nessa says something; Ida laughs).");
    return total;
  }
  function tick(ctx, dt) {
    const S = st(ctx);
    const r = S.run;
    if (!r) return;
    if (S.hold) r.t0 += dt || 0; /* held: the beat waits where it is */
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

  R.extend({
    id: ID,
    label: "Make a whole scene from words",
    beforeRender: (ctx, dt) => tick(ctx, dt),
    panel(ctx) {
      const S = st(ctx);
      const text = ctx.prefs.sceneText || EXAMPLE;
      return `<h4 title="In Maya: a whole shot blocked from a script: set, characters, staging and animation">Make a whole scene from words</h4>
        <p class="cap">Write one beat: where it happens, who is in it (their look in brackets after the name), who sits or stands where, who speaks, how they feel and what they do, in order.</p>
        <textarea data-scene="text" rows="4" style="width:100%;box-sizing:border-box" aria-label="The beat in words">${esc(text)}</textarea>
        <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin:.3rem 0"><button type="button" data-scene="play">Play the beat</button><button type="button" data-scene="flip">Send to the storyboard as a flip book</button><button type="button" data-scene="example" title="Puts the diner example in the box">Show me an example</button></div>
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
    state(ctx) {
      const S = st(ctx);
      return { built: S.built, playing: !!S.run, left: S.run ? S.run.q.length : 0, total: S.run ? S.run.total : 0, at: S.run ? ctx.clock - S.run.t0 : 0, plays: S.plays, report: S.report.map((x) => x.slice()), said: S.said, plan: S.plan };
    },
  };
})();
