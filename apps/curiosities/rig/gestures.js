/* rig/gestures.js: "Acting moves", an add-on for the 3D characters view (CurioRig.extend).

   Comedy runs on acting beats: the double take, the shrug, the pratfall. This gives every 3D character (and every
   object) a library of short, timed moves that play on top of whatever else it is doing (standing, walking, a
   slumped spine): the move is added to the pose, blended in and blended out, so the walk and the rules carry on
   underneath.

   The moves:
   - Comedy: double take, shrug, facepalm, spit take, pratfall (slip and land), slow burn (turns to the camera),
     freeze in shock, wobbly knees, victory dance.
   - Everyday acting: wave, point, nod yes, shake no, hands on hips, cross arms, sigh, look around, jump for joy,
     bow.
   Objects (the desk lamp, the tree, a cut-out) do the same moves their own way along their chain of joints: the
   lamp's double take snaps its shade round, its pratfall tips it over backwards.

   The sliders are the Acting moves lens (actingLens in data/db-maya.js), so each one can be automated from the
   timeline like any other curiosity:
   - Acting move: which move. A node on its lane plays that move when the playhead reaches that moment.
   - How big, How fast.
   - The classic timing parts, in plain words: Wind-up first (anticipation), Hold the pose, Settle at the end
     (overshoot and settle), and Comedy timing (a pause just before the payoff).
   - Play it: each time it turns from wait to go, the move plays again.

   How a move is made: a few key poses (wind-up, the move, the payoff, the hold), each a set of turns on parts of
   the body (in the rig's own bend, side and twist directions) plus where the hands reach (two-bone IK: to the
   face, the hips, overhead), whether the head turns to the camera, and how far the body drops or rises. Between
   the poses it eases; at the end it settles back to nothing. Turns are added in afterBase (so follow-through
   still lags the loose parts behind them), reaches and the camera look in afterRules with rotateWorld, and the
   feet are kept on the floor while a move plays.

   Words: "Tell it what you want" also reads moves ("does a double take", "shrugs", "slips on a banana"); the
   move part plays and the rest goes to the usual rules. window.CurioRig.gestures = { MOVES, read(text), play(ctl,
   id), state(ctl), say(text, ctl) }. */
(function () {
  const R = window.CurioRig;
  if (!R || !R.extend) return;
  const L = "actingLens.";
  const MOVE = L + "move";
  const CUE = L + "cue";
  const DEG = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ---------- the moves ----------
     A pose: parts of a body as [bend, side, twist] in degrees (bend: the end of the bone toward the front; side:
     away from the middle; twist: around the bone), the same directions as the rest of the rules.
     People: hips, spine (shared along the back), neck, head, sh/el/wr (shoulder, elbow, wrist), hip/kn/an (hip
     joint, knee, ankle), with L or R, or 2 for both sides. Objects: base, mid (shared along the middle), tip.
     Also: y (rise, a share of the height), plant (keep the lowest point on the floor, 0 to 1), cam (turn the head
     to the camera, 0 to 1), reach ({ L, R }: where a hand goes), tilt (objects: tip the whole thing forward, +, or
     back, -, in degrees), stretch (objects: taller and thinner +, squashed -), and "~part.i" for a wobble of that
     size on that part (i: 0 bend, 1 side, 2 twist; "@.5" starts it half a wobble later).
     A beat: { at: "antic" (the wind-up), "act", "pay" (the payoff), "hold", "loop", p: pose, d: seconds at normal
     speed, e: ease, pause: the comedy pause goes just before this beat, fx: "spray" }. */
  const MOVES = [
    {
      id: "double take", kind: "comedy", say: "looks, looks away, then snaps back: wait, what?",
      words: /double[- ]?take|does a take|looks? (again|twice)|second look/,
      f: 1,
      body: [
        { at: "act", d: 0.45, p: { head: [0, 0, -50], neck: [0, 0, -18], plant: 1 } },
        { at: "act", d: 0.4, p: { head: [2, 0, 0], plant: 1 } },
        { at: "antic", d: 0.16, pause: true, p: { head: [10, 0, 8], spine: [7, 0, 0], plant: 1 } },
        { at: "pay", d: 0.11, e: "snap", p: { reach: { L: "whoa", R: "whoa" }, head: [-14, 0, -55], neck: [-6, 0, -20], spine: [-14, 0, -14], plant: 1 } },
        { at: "hold", d: 1 },
      ],
      obj: [
        { at: "act", d: 0.45, p: { tip: [0, 0, -55], mid: [0, 0, -8] } },
        { at: "act", d: 0.4, p: {} },
        { at: "antic", d: 0.16, pause: true, p: { mid: [10, 0, 0], tip: [14, 0, 10], stretch: -0.08 } },
        { at: "pay", d: 0.1, e: "snap", p: { tip: [-22, 0, -75], mid: [-20, 0, -12], stretch: 0.14 } },
        { at: "hold", d: 1 },
      ],
    },
    {
      id: "shrug", kind: "comedy", say: "shoulders up, palms out: who knows?",
      words: /shrug|who knows|no idea|beats me/,
      body: [
        { at: "antic", d: 0.2, p: { head: [8, 0, 0], spine: [5, 0, 0], plant: 1 } },
        { at: "act", d: 0.28, e: "snap", p: { reach: { L: "shrug", R: "shrug" }, head: [-6, 14, 0], neck: [0, 6, 0], spine: [-5, 0, 0], plant: 1 } },
        { at: "hold", d: 1 },
      ],
      obj: [
        { at: "antic", d: 0.2, p: { stretch: 0.06 } },
        { at: "act", d: 0.28, e: "snap", p: { stretch: -0.14, tip: [-6, 28, 0], mid: [0, -8, 0] } },
        { at: "hold", d: 1 },
      ],
    },
    {
      id: "facepalm", kind: "comedy", say: "looks up in despair, then the hand meets the face",
      words: /face ?palm|head in (his |her |their |its )?hands?|slaps? (his |her |their |its )?(fore)?head/,
      f: 1.4,
      body: [
        { at: "antic", d: 0.35, p: { head: [-14, 0, 0], neck: [-6, 0, 0], plant: 1 } },
        { at: "pay", d: 0.26, e: "snap", pause: true, p: { reach: { R: "face" }, head: [24, 0, 0], neck: [10, 0, 0], spine: [12, 0, 0], plant: 1 } },
        { at: "hold", d: 1.3, p: { reach: { R: "face" }, head: [26, 0, 0], neck: [10, 0, 0], spine: [14, 0, 0], plant: 1, "~head.2": 6 } },
      ],
      obj: [
        { at: "antic", d: 0.35, p: { tip: [-22, 0, 0], mid: [-6, 0, 0] } },
        { at: "pay", d: 0.26, e: "snap", pause: true, p: { mid: [22, 0, 0], tip: [55, 0, 0], stretch: -0.05 } },
        { at: "hold", d: 1.3, p: { mid: [24, 0, 0], tip: [58, 0, 0], stretch: -0.05, "~tip.2": 8 } },
      ],
    },
    {
      id: "spit take", kind: "comedy", say: "drinks, hears something, and sprays it out",
      words: /spit ?take|spits?( out)?( (the|his|her|their|its) )?(drink|coffee|tea|water)?|sprays? (the |his |her |their )?(drink|coffee)/,
      body: [
        { at: "act", d: 0.5, p: { reach: { R: "mouth" }, head: [-16, 0, 0], neck: [-4, 0, 0], plant: 1 } },
        { at: "hold", d: 0.6, p: { reach: { R: "mouth" }, head: [-18, 0, 0], neck: [-4, 0, 0], plant: 1 } },
        { at: "antic", d: 0.14, pause: true, p: { reach: { R: "mouth" }, head: [-24, 0, 0], spine: [-8, 0, 0], plant: 1 } },
        { at: "pay", d: 0.12, e: "snap", fx: "spray", p: { reach: { R: "mouth" }, head: [18, 0, 0], neck: [10, 0, 0], spine: [26, 0, 0], plant: 1 } },
        { at: "hold", d: 0.9 },
      ],
      obj: [
        { at: "act", d: 0.5, p: { mid: [-10, 0, 0], tip: [-30, 0, 0] } },
        { at: "hold", d: 0.6, p: { mid: [-10, 0, 0], tip: [-32, 0, 0] } },
        { at: "antic", d: 0.14, pause: true, p: { mid: [-16, 0, 0], tip: [-36, 0, 0], stretch: 0.05 } },
        { at: "pay", d: 0.12, e: "snap", fx: "spray", p: { mid: [26, 0, 0], tip: [30, 0, 0], stretch: 0.1 } },
        { at: "hold", d: 0.9 },
      ],
    },
    {
      id: "pratfall", kind: "comedy", say: "slips, flies up and lands on the seat of the pants",
      words: /pratfall|slips?|slipping|banana|falls? (on|over|down)|trips?\b|tripping|takes a tumble/,
      f: 1.6,
      settle: 2.4,
      body: [
        { at: "antic", d: 0.22, p: { hipR: [55, 0, 0], knR: [-10, 0, 0], sh2: [0, 70, 0], el2: [30, 0, 0], spine: [-10, 0, 0], head: [-10, 0, 0], plant: 1 } },
        { at: "act", d: 0.22, e: "out", p: { hips: [-58, 0, 0], hip2: [80, 0, 0], kn2: [-25, 0, 0], sh2: [20, 95, 0], el2: [35, 0, 0], head: [18, 0, 0], spine: [6, 0, 0], y: 0.1, plant: 0 } },
        { at: "pay", d: 0.16, e: "in", p: { hips: [-22, 0, 0], hip2: [80, 8, 0], kn2: [-12, 0, 0], sh2: [-30, 30, 0], el2: [15, 0, 0], spine: [12, 0, 0], head: [14, 0, 0], plant: 1 } },
        { at: "hold", d: 1.2, p: { hips: [-22, 0, 0], hip2: [80, 8, 0], kn2: [-12, 0, 0], sh2: [-30, 30, 0], el2: [15, 0, 0], spine: [14, 0, 0], head: [12, 0, 0], plant: 1, "~head.1": 9, "~head.2@.25": 9 } },
      ],
      obj: [
        { at: "antic", d: 0.22, p: { tilt: 8, base: [0, 0, 25], mid: [0, 14, 0], tip: [0, 10, 0] } },
        { at: "act", d: 0.22, e: "out", p: { tilt: -35, mid: [-14, 0, 0], tip: [-24, 0, 0], y: 0.08 } },
        { at: "pay", d: 0.18, e: "in", p: { tilt: -84, mid: [6, 0, 0], tip: [18, 0, 0], stretch: -0.08 } },
        { at: "hold", d: 1.2, p: { tilt: -84, mid: [6, 0, 0], tip: [18, 0, 0], "~tip.1": 12, "~tip.2@.25": 10 } },
      ],
    },
    {
      id: "slow burn", kind: "comedy", say: "slowly turns and stares at the camera, saying nothing",
      words: /slow burn|slowly turns?|turns? (slowly )?to (the )?(camera|audience)|stares? (at|into) (the )?(camera|lens|audience)/,
      settle: 1.8,
      body: [
        { at: "act", d: 0.35, p: { away: 1, head: [6, 0, 0], plant: 1 } },
        { at: "act", d: 1.8, e: "inOut", p: { cam: 1, plant: 1 } },
        { at: "pay", d: 0.35, pause: true, p: { cam: 1, head: [8, 0, 0], spine: [4, 0, 0], plant: 1 } },
        { at: "hold", d: 1.6 },
      ],
      obj: [
        { at: "act", d: 0.35, p: { away: 1 } },
        { at: "act", d: 1.8, e: "inOut", p: { cam: 1 } },
        { at: "pay", d: 0.35, pause: true, p: { cam: 1, tip: [10, 0, 0] } },
        { at: "hold", d: 1.6 },
      ],
    },
    {
      id: "freeze in shock", kind: "comedy", say: "jolts and freezes stiff, trembling",
      words: /freez|shock|gasps?|stunned|petrified|frozen/,
      f: 13,
      body: [
        { at: "antic", d: 0.14, p: { spine: [8, 0, 0], head: [8, 0, 0], plant: 1 } },
        { at: "act", d: 0.1, e: "snap", p: { spine: [-14, 0, 0], head: [-14, 0, 0], reach: { L: "whoa", R: "whoa" }, hip2: [0, 6, 0], plant: 1, "~spine.1": 1.2, "~head.2": 1.5 } },
        { at: "hold", d: 1.5 },
      ],
      obj: [
        { at: "antic", d: 0.14, p: { stretch: -0.08, mid: [6, 0, 0] } },
        { at: "act", d: 0.1, e: "snap", p: { stretch: 0.16, mid: [-12, 0, 0], tip: [-22, 0, 0], "~mid.1": 1.5, "~tip.2": 2 } },
        { at: "hold", d: 1.5 },
      ],
    },
    {
      id: "wobbly knees", kind: "comedy", say: "the knees go to jelly and knock together",
      words: /wobbly knees|knees? (knock|shake|wobble|buckle|give)|weak (at|in) the knees|jelly legs/,
      f: 3.5,
      body: [
        { at: "act", d: 0.4, p: { kn2: [-32, 0, 0], hip2: [20, 0, 0], an2: [10, 0, 0], spine: [10, 0, 0], sh2: [0, 18, 0], el2: [20, 0, 0], plant: 1, "~hip2.1": 9, "~kn2.0": 8, "~hips.1@.25": 4 } },
        { at: "loop", d: 1.6 },
      ],
      obj: [
        { at: "act", d: 0.4, p: { stretch: -0.06, mid: [8, 0, 0], "~mid.1": 12, "~base.1@.25": 4, "~tip.1@.5": 6 } },
        { at: "loop", d: 1.6 },
      ],
    },
    {
      id: "victory dance", kind: "comedy", say: "arms up, hips swinging: we did it!",
      words: /victory|celebrat|dances?|dancing|boogie/,
      f: 2,
      body: [
        { at: "antic", d: 0.25, p: { kn2: [-25, 0, 0], hip2: [18, 0, 0], spine: [8, 0, 0], plant: 1 } },
        { at: "act", d: 0.3, e: "snap", p: { reach: { L: "pump", R: "pump" }, kn2: [-12, 0, 0], hip2: [8, 0, 0], plant: 1, "~hips.1": 10, "~spine.1@.5": 10, "~knL.0": 12, "~knR.0@.5": 12, "~head.1@.5": 8 } },
        { at: "loop", d: 2.2 },
      ],
      obj: [
        { at: "antic", d: 0.25, p: { stretch: -0.1 } },
        { at: "act", d: 0.3, e: "snap", p: { stretch: 0.05, "~mid.1": 16, "~tip.1@.5": 22, "~base.2": 18 } },
        { at: "loop", d: 2.2 },
      ],
    },
    {
      id: "wave", kind: "everyday", say: "waves hello",
      words: /\bwaves?\b|waving|says? (hi|hello|goodbye|bye)|\bhello\b|\bgoodbye\b/,
      f: 2.2,
      body: [
        { at: "act", d: 0.4, p: { reach: { R: "wave" }, head: [0, 5, -8], spine: [0, -4, 0], plant: 1 } },
        { at: "loop", d: 1.5 },
      ],
      obj: [
        { at: "act", d: 0.4, p: { tip: [0, 30, 0], "~tip.1": 22, "~mid.1@.25": 6 } },
        { at: "loop", d: 1.5 },
      ],
    },
    {
      id: "point", kind: "everyday", say: "points: over there!",
      words: /\bpoints?\b|pointing/,
      body: [
        { at: "antic", d: 0.2, p: { spine: [0, 0, -10], shR: [-20, 0, 0], plant: 1 } },
        { at: "act", d: 0.18, e: "snap", p: { reach: { R: "point" }, spine: [-4, 0, 10], head: [-3, 0, 8], plant: 1 } },
        { at: "hold", d: 1.2 },
      ],
      obj: [
        { at: "antic", d: 0.2, p: { mid: [-10, 0, 0], tip: [-14, 0, 0] } },
        { at: "act", d: 0.18, e: "snap", p: { mid: [20, 0, 0], tip: [-4, 0, 0], stretch: 0.08 } },
        { at: "hold", d: 1.2 },
      ],
    },
    {
      id: "nod yes", kind: "everyday", say: "nods: yes",
      words: /\bnods?\b|nodding|says? yes|agrees/,
      f: 2,
      body: [
        { at: "act", d: 0.25, p: { "~head.0": 14, "~neck.0": 6 } },
        { at: "loop", d: 1.2 },
      ],
      obj: [
        { at: "act", d: 0.25, p: { "~tip.0": 18, "~mid.0": 5 } },
        { at: "loop", d: 1.2 },
      ],
    },
    {
      id: "shake no", kind: "everyday", say: "shakes the head: no",
      words: /shakes? (his |her |their |its )?head|says? no\b|shak(es?|ing) no|disagrees/,
      f: 2.2,
      body: [
        { at: "act", d: 0.25, p: { "~head.2": 22, "~neck.2": 8 } },
        { at: "loop", d: 1.2 },
      ],
      obj: [
        { at: "act", d: 0.25, p: { "~tip.2": 30, "~mid.2": 8 } },
        { at: "loop", d: 1.2 },
      ],
    },
    {
      id: "hands on hips", kind: "everyday", say: "hands on hips: well?",
      words: /hands? on (his |her |their |its )?hips|akimbo/,
      body: [
        { at: "act", d: 0.4, p: { reach: { L: "hip", R: "hip" }, spine: [-6, 0, 0], head: [-6, 0, 0], hip2: [0, 5, 0], plant: 1 } },
        { at: "hold", d: 2 },
      ],
      obj: [
        { at: "act", d: 0.4, p: { mid: [-8, 0, 0], tip: [-8, 0, 0], stretch: 0.06 } },
        { at: "hold", d: 2 },
      ],
    },
    {
      id: "cross arms", kind: "everyday", say: "crosses the arms",
      words: /cross(es|ed)? (his |her |their |its |the )?arms|arms crossed|folds? (his |her |their |its |the )?arms/,
      body: [
        { at: "act", d: 0.5, p: { reach: { L: "cross", R: "cross" }, spine: [-4, 0, 0], head: [-4, 6, 0], plant: 1 } },
        { at: "hold", d: 2 },
      ],
      obj: [
        { at: "act", d: 0.5, p: { mid: [-4, 0, -8], tip: [-6, 0, 28], stretch: 0.04 } },
        { at: "hold", d: 2 },
      ],
    },
    {
      id: "sigh", kind: "everyday", say: "breathes in, and lets it all out",
      words: /\bsigh(s|ing)?\b/,
      settle: 1.6,
      body: [
        { at: "antic", d: 0.7, e: "inOut", p: { spine: [-8, 0, 0], head: [-8, 0, 0], sh2: [0, 6, 0], plant: 1 } },
        { at: "act", d: 1, e: "inOut", p: { spine: [22, 0, 0], neck: [10, 0, 0], head: [16, 0, 0], sh2: [8, -4, 0], el2: [10, 0, 0], plant: 1 } },
        { at: "hold", d: 1 },
      ],
      obj: [
        { at: "antic", d: 0.7, e: "inOut", p: { stretch: 0.07, mid: [-6, 0, 0] } },
        { at: "act", d: 1, e: "inOut", p: { stretch: -0.1, mid: [20, 0, 0], tip: [32, 0, 0] } },
        { at: "hold", d: 1 },
      ],
    },
    {
      id: "look around", kind: "everyday", say: "looks around",
      words: /looks? around|looking around|glances? around|looks? left and right/,
      f: 0.45,
      body: [
        { at: "act", d: 0.5, p: { "~head.2": 42, "~neck.2": 14, "~spine.2": 10, head: [-3, 0, 0] } },
        { at: "loop", d: 2.2 },
      ],
      obj: [
        { at: "act", d: 0.5, p: { "~tip.2": 50, "~mid.2": 14 } },
        { at: "loop", d: 2.2 },
      ],
    },
    {
      id: "jump for joy", kind: "everyday", say: "crouches and jumps for joy",
      words: /jump(s|ing)? for joy|\bjumps?\b|jumping|leaps?|hooray|yay/,
      body: [
        { at: "antic", d: 0.3, p: { kn2: [-60, 0, 0], hip2: [48, 0, 0], an2: [22, 0, 0], spine: [16, 0, 0], sh2: [-25, 0, 0], plant: 1 } },
        { at: "act", d: 0.24, e: "out", p: { y: 0.2, plant: 0, reach: { L: "up", R: "up" }, kn2: [-35, 0, 0], hip2: [25, 0, 0], spine: [-8, 0, 0], head: [-12, 0, 0] } },
        { at: "act", d: 0.22, e: "in", p: { y: 0, plant: 1, reach: { L: "up", R: "up" }, kn2: [-40, 0, 0], hip2: [30, 0, 0], an2: [15, 0, 0], spine: [6, 0, 0] } },
        { at: "hold", d: 0.6 },
      ],
      obj: [
        { at: "antic", d: 0.3, p: { stretch: -0.16, mid: [6, 0, 0] } },
        { at: "act", d: 0.24, e: "out", p: { y: 0.24, stretch: 0.16 } },
        { at: "act", d: 0.22, e: "in", p: { y: 0, stretch: -0.12 } },
        { at: "hold", d: 0.6 },
      ],
    },
    {
      id: "bow", kind: "everyday", say: "takes a bow",
      words: /\bbows?\b|bowing|takes a bow/,
      body: [
        { at: "act", d: 0.6, e: "inOut", p: { reach: { R: "belly" }, spine: [44, 0, 0], neck: [8, 0, 0], head: [14, 0, 0], hip2: [12, 0, 0], kn2: [-10, 0, 0], an2: [-4, 0, 0], shL: [14, 0, 0], plant: 1 } },
        { at: "hold", d: 1 },
      ],
      obj: [
        { at: "act", d: 0.6, e: "inOut", p: { mid: [32, 0, 0], tip: [40, 0, 0] } },
        { at: "hold", d: 1 },
      ],
    },
  ];
  const IDS = MOVES.map((m) => m.id);

  const SLIDERS = [
    { id: MOVE, lens: "actingLens", label: "Acting move", scale: ["none"].concat(IDS), start: 0 },
    { id: L + "size", lens: "actingLens", label: "How big", scale: ["tiny", "small", "normal", "big", "huge"], start: 2 },
    { id: L + "speed", lens: "actingLens", label: "How fast", scale: ["very slow", "slow", "normal", "quick", "snappy"], start: 2 },
    { id: L + "windup", lens: "actingLens", label: "Wind-up first", scale: ["none", "a little", "clear", "big"], start: 2 },
    { id: L + "hold", lens: "actingLens", label: "Hold the pose", scale: ["no hold", "short", "clear", "long"], start: 1 },
    { id: L + "settle", lens: "actingLens", label: "Settle at the end", scale: ["stops dead", "eases back", "overshoots and wobbles"], start: 1 },
    { id: L + "pause", lens: "actingLens", label: "Comedy timing", scale: ["no pause", "a beat", "a long beat", "painfully long"], start: 1 },
    { id: CUE, lens: "actingLens", label: "Play it", scale: ["wait", "go"], start: 0 },
  ];
  const SIZE = { tiny: 0.35, small: 0.65, normal: 1, big: 1.35, huge: 1.7 };
  const SPEED = { "very slow": 0.5, slow: 0.75, normal: 1, quick: 1.35, snappy: 1.8 };
  const WINDUP = { none: [0, 0], "a little": [0.5, 0.6], clear: [1, 1], big: [1.6, 1.4] }; /* how far, how long */
  const HOLD = { "no hold": 0.08, short: 0.45, clear: 1, long: 1.9 };
  const SETTLE = { "stops dead": 0.14, "eases back": 0.5, "overshoots and wobbles": 0.8 };
  const PAUSE = { "no pause": 0, "a beat": 0.4, "a long beat": 0.9, "painfully long": 1.8 };
  const PHASE = { antic: "the wind-up", act: "the move", pause: "the pause", pay: "the payoff", hold: "holding it", loop: "keeping it going", settle: "settling back" };

  /* ---------- easing ---------- */
  const EASE = {
    inOut: (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)),
    snap: (u) => 1 - Math.pow(1 - u, 3),
    out: (u) => 1 - (1 - u) * (1 - u),
    in: (u) => u * u,
    back: (u) => {
      const c = 1.9;
      return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
    },
    /* overshoot and settle: past the end, back, a smaller wobble, still */
    wobble: (u) => 1 - Math.exp(-3 * u) * Math.cos(2.5 * Math.PI * u) * (1 - u),
  };

  /* ---------- a pose as flat numbers ---------- */
  const SIDES = { "2": ["L", "R"] };
  function flat(p, size) {
    const out = {};
    if (!p) return out;
    const add = (k, v) => (out[k] = (out[k] || 0) + v);
    Object.keys(p).forEach((k) => {
      const v = p[k];
      if (k === "reach") return Object.keys(v).forEach((s) => add(s + ">" + v[s], Math.min(1, size))); /* a tiny move only goes part of the way */
      if (k === "plant" || k === "cam" || k === "away") return add(k, v);
      if (k === "y" || k === "tilt" || k === "stretch") return add(k, v * size);
      if (k[0] === "~") {
        const m = k.match(/^~([a-zA-Z]+?)(2?)\.(\d)(@[\d.]+)?$/);
        if (!m) return;
        (m[2] ? ["L", "R"] : [""]).forEach((s) => add("~" + m[1] + s + "." + m[3] + (m[4] || ""), v * size * (s === "R" && m[3] === "2" ? -1 : 1)));
        return;
      }
      const m = k.match(/^([a-zA-Z]+?)(2?)$/);
      (m[2] ? SIDES[m[2]] : [""]).forEach((s) => v.forEach((x, i) => x && add(m[1] + s + "." + i, x * size * (s === "R" && i === 2 ? -1 : 1))));
    });
    return out;
  }

  /* Turn a move and the sliders into a list of timed pieces: { from, to, d, e, phase, fx }. */
  function plan(move, isObject, v) {
    const beats = (isObject ? move.obj : move.body) || [];
    const size = SIZE[v.size] || 1;
    const speed = SPEED[v.speed] || 1;
    const [wAmt, wLen] = WINDUP[v.windup] || WINDUP.clear;
    const segs = [];
    let cur = {};
    let pauseDue = false;
    const push = (to, d, e, phase, fx) => {
      segs.push({ from: cur, to, d: Math.max(0.02, d), e, phase, fx });
      cur = to;
    };
    beats.forEach((b) => {
      if (b.pause) pauseDue = true;
      if (b.at === "antic" && !wAmt) return;
      if (pauseDue) {
        pauseDue = false;
        const pz = PAUSE[v.pause] || 0;
        if (pz) push(cur, pz, "inOut", "pause");
      }
      if (b.at === "hold" || b.at === "loop") {
        const to = b.p ? flat(b.p, size) : cur;
        const d = b.at === "hold" ? b.d * (HOLD[v.hold] != null ? HOLD[v.hold] : 0.45) : b.d / speed;
        return push(to, d, "inOut", b.at);
      }
      let to = flat(b.p, size);
      let d = b.d / speed;
      if (b.at === "antic") {
        const k = wAmt;
        const scaled = {};
        Object.keys(to).forEach((key) => (scaled[key] = /^(plant|cam|away)$|>/.test(key) ? to[key] : to[key] * k));
        to = scaled;
        d *= wLen;
      }
      const e = b.at === "pay" && v.settle === "overshoots and wobbles" ? "back" : b.e || "inOut";
      push(to, d, e, b.at, b.fx);
    });
    const sd = (SETTLE[v.settle] || 0.5) * (move.settle || 1) / speed;
    push({}, sd, v.settle === "overshoots and wobbles" ? "wobble" : v.settle === "stops dead" ? "snap" : "inOut", "settle");
    let t = 0;
    segs.forEach((s) => {
      s.t0 = t;
      t += s.d;
    });
    return { segs, total: t, f: move.f || 1 };
  }

  /* The pose at time t of a plan, with the wobbles worked in. */
  function poseAt(P, t, w) {
    const out = {};
    if (!P || t < 0 || t >= P.total) return { pose: out, phase: "" };
    const s = P.segs.find((x) => t < x.t0 + x.d) || P.segs[P.segs.length - 1];
    const u = clamp((t - s.t0) / s.d, 0, 1);
    const k = (EASE[s.e] || EASE.inOut)(u);
    const keys = new Set(Object.keys(s.from).concat(Object.keys(s.to)));
    keys.forEach((key) => {
      const a = s.from[key] || 0;
      const b = s.to[key] || 0;
      /* weights (plant, look at the camera, hands) never overshoot past 0..1 */
      const kk = key === "plant" || key === "cam" || key === "away" || key.includes(">") ? clamp(k, 0, 1) : k;
      out[key] = (a + (b - a) * kk) * w;
    });
    const res = {};
    Object.keys(out).forEach((key) => {
      if (key[0] !== "~") return (res[key] = (res[key] || 0) + out[key]);
      const m = key.match(/^~(.+?)(@([\d.]+))?$/);
      const ph = m[3] ? Number(m[3]) : 0;
      res[m[1]] = (res[m[1]] || 0) + out[key] * Math.sin(2 * Math.PI * (P.f * t + ph));
    });
    return { pose: res, phase: s.phase };
  }

  /* ---------- reading words ---------- */
  function read(text) {
    const t = " " + String(text || "").toLowerCase() + " ";
    let best = null;
    MOVES.forEach((m) => {
      const name = new RegExp(m.id.replace(/ /g, "[ -]?"));
      [name, m.words].forEach((re) => {
        const hit = re.exec(t);
        if (hit && (!best || hit.index < best.index || (hit.index === best.index && hit[0].length > best.len))) best = { id: m.id, index: hit.index, len: hit[0].length };
      });
    });
    if (!best) return null;
    /* what is left of the sentence goes to the other rules ("sleepy, and does a double take") */
    /* the clause with the move in it is the move; the other clauses go to the rules ("sleepy, and shrugs") */
    const parts = t.split(/(,|;|\.|!|\band\b|\bthen\b|\bwhile\b)/);
    let at = 0;
    const keep = [];
    parts.forEach((p) => {
      const inside = best.index < at + p.length && best.index + best.len > at;
      at += p.length;
      if (!inside && !/^(,|;|\.|!|and|then|while)$/.test(p.trim())) keep.push(p.trim());
    });
    const rest = keep.filter(Boolean).join(", ");
    return { id: best.id, rest };
  }

  /* ---------- per view ---------- */
  const D = (ctx) => ctx.data("gestures");
  function values(ctx) {
    const v = {};
    ["size", "speed", "windup", "hold", "settle", "pause"].forEach((k) => (v[k] = ctx.pick(L + k)));
    return v;
  }
  function start(ctx, id, why) {
    const move = MOVES.find((m) => m.id === id);
    const d = D(ctx);
    if (!move || !ctx.rig) return false;
    if (d.run && d.run.t0 === ctx.clock && d.run.id === id) return true; /* asked twice in one frame */
    const v = values(ctx);
    if (d.run && ctx.clock - d.run.t0 < d.run.plan.total) d.prev = { run: d.run, at: ctx.clock };
    d.run = { id, t0: ctx.clock, plan: plan(move, !!ctx.rig.object, v), why: why || "", fired: {} };
    d.played = (d.played || 0) + 1;
    return true;
  }
  /* The pose this frame, the old move fading out under a new one. */
  function current(ctx) {
    const d = D(ctx);
    const pose = {};
    let phase = "";
    const addIn = (run, w) => {
      const r = poseAt(run.plan, ctx.clock - run.t0, w);
      Object.keys(r.pose).forEach((k) => (pose[k] = (pose[k] || 0) + r.pose[k]));
      return r.phase;
    };
    if (d.prev) {
      const f = 1 - (ctx.clock - d.prev.at) / 0.25;
      if (f <= 0) d.prev = null;
      else addIn(d.prev.run, f * f);
    }
    if (d.run) {
      phase = addIn(d.run, 1);
      if (!phase) d.run = null;
    }
    return { pose, phase };
  }

  /* Which bones a part name stands for, and how much of the turn each takes. */
  function bonesOf(rig, part) {
    const side = /[LR]$/.test(part) && part.length > 2 ? part.slice(-1) : "";
    const name = side ? part.slice(0, -1) : part;
    if (rig.object) {
      if (name === "base") return [[rig.hips, 1]];
      if (name === "mid") return rig.spine.map((b) => [b, 1 / (rig.spine.length || 1)]);
      if (name === "tip") return [[rig.head, 1]];
      return [];
    }
    const one = (b) => (b ? [[b, 1]] : []);
    const spread = (list) => list.map((b) => [b, 1 / list.length]);
    if (name === "hips") return one(rig.hips);
    if (name === "spine") return spread(rig.spine);
    if (name === "neck") return rig.neck.length ? spread(rig.neck) : one(rig.head).map(([b]) => [b, 0.6]);
    if (name === "head") return one(rig.head);
    if (rig.quadruped || !side) return [];
    const arm = rig.arms[side] || [];
    const leg = rig.legs[side] || [];
    return one({ sh: arm[0], el: arm[1], wr: arm[2], hip: leg[0], kn: leg[1], an: leg[2] }[name]);
  }

  function turn(ctx, b, o) {
    const r = ctx.info.get(b);
    if (!r) return;
    const T = ctx.THREE;
    if (!ctx.rig.object) {
      /* inside what that joint can do, with a little room for cartoon moves */
      const lim = ctx.limitOf(b);
      const k = (a) => [Math.min(a[0] * 1.25, a[0] - 8), Math.max(a[1] * 1.25, a[1] + 8)];
      o = { bend: clamp(o.bend, ...k(lim.bend)), side: clamp(o.side, ...k(lim.side)), twist: clamp(o.twist, ...k(lim.twist)) };
    }
    const q = new T.Quaternion();
    if (o.bend) q.multiply(new T.Quaternion().setFromAxisAngle(r.axes.bend, o.bend * DEG));
    if (o.side) q.multiply(new T.Quaternion().setFromAxisAngle(r.axes.side, o.side * DEG));
    if (o.twist) q.multiply(new T.Quaternion().setFromAxisAngle(r.axes.twist, o.twist * DEG));
    b.quaternion.multiply(q);
  }

  /* ---------- hands: two-bone reach (as rig/ik.js does it) ---------- */
  const wp = (T, b) => b.getWorldPosition(new T.Vector3());
  function solve(ctx, a, b, c, target, pole) {
    const T = ctx.THREE;
    const A = wp(T, a);
    const B = wp(T, b);
    const C = wp(T, c);
    const lab = B.distanceTo(A);
    const lbc = C.distanceTo(B);
    if (lab < 1e-5 || lbc < 1e-5) return;
    const dv = target.clone().sub(A);
    const dist = clamp(dv.length(), Math.abs(lab - lbc) + 0.25 * Math.min(lab, lbc), lab + lbc - 1e-4);
    const dir = dv.lengthSq() > 1e-12 ? dv.normalize() : C.clone().sub(A).normalize();
    const x = (lab * lab - lbc * lbc + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, lab * lab - x * x));
    const pv = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
    if (pv.lengthSq() < 1e-10) pv.set(0, -1, 0);
    pv.normalize();
    const K = A.clone().add(dir.clone().multiplyScalar(x)).add(pv.multiplyScalar(h));
    ctx.rotateWorld(a, new T.Quaternion().setFromUnitVectors(B.clone().sub(A).normalize(), K.sub(A).normalize()));
    const B2 = wp(T, b);
    const C2 = wp(T, c);
    const reach = A.clone().add(dir.clone().multiplyScalar(dist));
    ctx.rotateWorld(b, new T.Quaternion().setFromUnitVectors(C2.sub(B2).normalize(), reach.sub(B2).normalize()));
  }
  /* The body's own directions now: its left (+x at rest), up and front, turned the way the chest is turned. */
  function frameOf(ctx, bone) {
    const T = ctx.THREE;
    const r = ctx.info.get(bone);
    const q = bone.getWorldQuaternion(new T.Quaternion());
    if (r) q.multiply(r.invRestWorld);
    return { X: new T.Vector3(1, 0, 0).applyQuaternion(q), Y: new T.Vector3(0, 1, 0).applyQuaternion(q), Z: new T.Vector3(0, 0, 1).applyQuaternion(q) };
  }
  function target(ctx, d, name, side, t) {
    const T = ctx.THREE;
    const rig = ctx.rig;
    const { X, Y, Z } = frameOf(ctx, rig.chest || rig.hips);
    const s = side === "L" ? 1 : -1;
    const h = d.h;
    const A = d.armLen;
    const sh = wp(T, rig.arms[side][0]);
    const head = wp(T, rig.head);
    const chest = wp(T, rig.chest || rig.hips);
    const v = (p, x, y, z) => p.clone().add(X.clone().multiplyScalar(x)).add(Y.clone().multiplyScalar(y)).add(Z.clone().multiplyScalar(z));
    const pole = (x, y, z) => X.clone().multiplyScalar(x).add(Y.clone().multiplyScalar(y)).add(Z.clone().multiplyScalar(z));
    switch (name) {
      case "face":
        return { at: v(head, s * 0.02 * h, 0.035 * h, 0.1 * h), pole: pole(s * 0.7, -1, 0.2) };
      case "mouth":
        return { at: v(head, s * 0.03 * h, 0.0 * h, 0.12 * h), pole: pole(s * 0.8, -1, 0) };
      case "hip": {
        const hip = wp(T, rig.legs[side][0] || rig.hips);
        return { at: v(hip, s * 0.07 * h, 0.05 * h, -0.005 * h), pole: pole(s, 0, -0.5) };
      }
      case "cross":
        return { at: v(chest, -s * 0.06 * h, (side === "L" ? -0.075 : -0.095) * h, 0.12 * h), pole: pole(s, -0.8, 0) };
      case "whoa":
        return { at: v(chest, s * 0.11 * h, 0.06 * h, 0.16 * h), pole: pole(s, -1, -0.3) };
      case "belly":
        return { at: v(chest, -s * 0.02 * h, -0.13 * h, 0.1 * h), pole: pole(s, -1, 0) };
      case "up":
        return { at: v(sh, s * 0.3 * A, 0.95 * A, 0.1 * A), pole: pole(s, 0, -0.3) };
      case "shrug":
        return { at: v(sh, s * 0.5 * A, -0.55 * A, 0.35 * A), pole: pole(s * 0.3, -1, -0.6) };
      case "point":
        return { at: v(sh, s * 0.12 * A, 0.08 * A, 0.98 * A), pole: pole(s * 0.3, -1, 0) };
      case "pump": /* fists pumping overhead, one up while the other comes down */
        return { at: v(sh, s * 0.45 * A, (0.8 + 0.18 * Math.sin(t * 2 * Math.PI * 2 + (side === "L" ? 0 : Math.PI))) * A, 0.1 * A), pole: pole(s, -0.4, -0.3) };
      case "wave":
        return { at: v(sh, s * (0.42 + 0.14 * Math.sin(t * 2 * Math.PI * 2.2)) * A, 0.55 * A, 0.18 * A), pole: pole(s, -1, 0) };
      default:
        return null;
    }
  }
  function reachHands(ctx, d, pose, t) {
    const rig = ctx.rig;
    if (rig.object || rig.quadruped) return;
    ["L", "R"].forEach((side) => {
      const arm = rig.arms[side];
      if (!arm || arm.length < 3) return;
      let w = 0;
      const at = new ctx.THREE.Vector3();
      const pole = new ctx.THREE.Vector3();
      Object.keys(pose).forEach((k) => {
        if (k[0] !== side || k[1] !== ">" || pose[k] <= 1e-4) return;
        const g = target(ctx, d, k.slice(2), side, t);
        if (!g) return;
        at.addScaledVector(g.at, pose[k]);
        pole.addScaledVector(g.pole, pose[k]);
        w += pose[k];
      });
      if (w < 1e-3) return;
      at.multiplyScalar(1 / w);
      const k = Math.min(1, w);
      const now = wp(ctx.THREE, arm[2]);
      solve(ctx, arm[0], arm[1], arm[2], now.lerp(at, k), pole);
    });
  }

  /* Turn the head (and a little of the neck and chest) toward the camera, w from 0 to 1. */
  function lookAtCamera(ctx, w, away) {
    const T = ctx.THREE;
    const rig = ctx.rig;
    if (!rig.head || w < 1e-3) return;
    const hp = wp(T, rig.head);
    const face = new T.Vector3(0, 0, 1).applyQuaternion(rig.head.getWorldQuaternion(new T.Quaternion()).multiply(ctx.info.get(rig.head).invRestWorld));
    const want = ctx.camera.position.clone().sub(hp);
    want.y *= 0.5;
    if (away) {
      /* the other way: off to the side the camera is not on, at whatever caused it */
      const { X } = frameOf(ctx, rig.hips);
      const side = Math.sign(want.dot(X)) || 1;
      want.copy(X).multiplyScalar(-side * 1.4).add(frameOf(ctx, rig.hips).Z.multiplyScalar(0.5));
      want.y = -0.15;
    }
    const full = new T.Quaternion().setFromUnitVectors(face.normalize(), want.normalize());
    const chain = rig.object ? [rig.spine[0], rig.chest, rig.head].filter(Boolean) : [rig.chest, rig.neck[0], rig.head].filter(Boolean);
    const share = chain.length === 3 ? [0.25, 0.6, 1] : chain.length === 2 ? [0.5, 1] : [1];
    let done = new T.Quaternion();
    chain.forEach((b, i) => {
      const part = new T.Quaternion().slerp(full, share[i] * w);
      ctx.rotateWorld(b, done.clone().invert().premultiply(part));
      done = part;
    });
  }

  /* ---------- the spit take's spray ---------- */
  function spray(ctx, d) {
    const T = ctx.THREE;
    if (!d.drops) {
      const n = 70;
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(new Float32Array(n * 3), 3));
      const pts = new T.Points(geo, new T.PointsMaterial({ color: 0x9fd8ff, size: 0.035, transparent: true, opacity: 0.85, depthWrite: false }));
      pts.frustumCulled = false;
      pts.name = "spit take spray";
      ctx.scene.add(pts);
      d.drops = { pts, n, v: [], life: 0 };
    }
    const S = d.drops;
    const rig = ctx.rig;
    const tipB = rig.head;
    const { Y, Z } = frameOf(ctx, tipB);
    const from = wp(T, tipB).add(Z.clone().multiplyScalar(0.08 * d.h)).add(Y.clone().multiplyScalar(rig.object ? 0.02 * d.h : 0.03 * d.h));
    const pos = S.pts.geometry.attributes.position;
    S.v = [];
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
    for (let i = 0; i < S.n; i++) {
      pos.setXYZ(i, from.x, from.y, from.z);
      S.v.push(Z.clone().multiplyScalar(2.2 + rnd() * 1.4).add(new T.Vector3(rnd() * 1.1, 0.5 + rnd() * 0.9, rnd() * 1.1)));
    }
    pos.needsUpdate = true;
    S.life = 1.3;
    S.pts.visible = true;
    d.sprays = (d.sprays || 0) + 1;
  }
  function stepSpray(d, dt) {
    const S = d.drops;
    if (!S || !S.pts.visible) return;
    S.life -= dt;
    if (S.life <= 0) return void (S.pts.visible = false);
    const pos = S.pts.geometry.attributes.position;
    for (let i = 0; i < S.n; i++) {
      const v = S.v[i];
      v.y -= 6 * dt;
      let y = pos.getY(i) + v.y * dt;
      if (y < 0.005) {
        y = 0.005;
        v.set(v.x * 0.3, 0, v.z * 0.3);
      }
      pos.setXYZ(i, pos.getX(i) + v.x * dt, y, pos.getZ(i) + v.z * dt);
    }
    pos.needsUpdate = true;
    S.pts.material.opacity = 0.85 * Math.min(1, S.life / 0.4);
  }

  /* ---------- what fires a move ---------- */
  function laneNode(ctx) {
    const E = window.CurioEngine;
    const S = window.CurioScreen;
    if (!E || !S || !S.isOpen || !S.isOpen() || !S.row) return null;
    let st;
    try {
      st = E.state();
    } catch (e) {
      return null;
    }
    const row = st && st.rows && st.rows[S.row()];
    if (!row) return null;
    const RS = window.CurioRigScreen;
    const mine = RS && RS.controller && RS.controller() && RS.controller().ctx === ctx;
    const want = mine && RS.shown ? RS.shown() : null;
    const has = (t) => (t.curiosities || []).includes(MOVE);
    const tr = (want && st.tracks.find((t) => t.id === want && has(t))) || st.tracks.find(has);
    if (!tr) return { row: row.id };
    const lane = st.lanes && st.lanes[tr.id + "|" + MOVE];
    const v = lane && lane.on !== false && lane.points ? lane.points[row.id] : undefined;
    return { row: row.id, value: v };
  }
  function triggers(ctx) {
    const d = D(ctx);
    const word = ctx.pick(MOVE);
    const cue = ctx.pick(CUE);
    if (d.lastWord !== undefined && word !== d.lastWord && word !== "none") start(ctx, word, "the Acting move slider");
    if (d.lastCue === "wait" && cue === "go" && word !== "none") start(ctx, word, "Play it");
    d.lastWord = word;
    d.lastCue = cue;
    const node = laneNode(ctx);
    if (node && node.row !== d.lastRow) {
      if (d.lastRow !== undefined && node.value != null) {
        const s = SLIDERS[0];
        const w = typeof node.value === "number" ? s.scale[Math.round(clamp(node.value, 0, s.scale.length - 1))] : node.value;
        if (w && w !== "none") start(ctx, w, "the timeline");
      }
      d.lastRow = node.row;
    }
  }

  /* ---------- the add-on ---------- */
  function measure(ctx) {
    const T = ctx.THREE;
    const d = D(ctx);
    d.run = null;
    d.prev = null;
    d.lastWord = undefined;
    d.lastCue = undefined;
    if (d.drops) d.drops.pts.visible = false;
    if (!ctx.model) return;
    ctx.model.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(ctx.model);
    d.h = Math.max(0.3, box.max.y - box.min.y);
    d.restMin = Math.min(...ctx.bones.map((b) => wp(T, b).y));
    /* a few hundred points of the surface, to keep every part above the floor while a move plays */
    const meshes = [];
    ctx.model.traverse((o) => o.isMesh && o.geometry && o.geometry.attributes.position && o.visible && meshes.push(o));
    d.skin = [];
    const each = Math.max(20, Math.floor(900 / Math.max(1, meshes.length)));
    meshes.forEach((m) => {
      const n = m.geometry.attributes.position.count;
      const step = Math.max(1, Math.ceil(n / each));
      for (let i = 0; i < n; i += step) d.skin.push([m, i]);
    });
    /* a part that already starts below the floor is not something to stand on: leave it out */
    const v0 = new T.Vector3();
    d.skin = d.skin.filter(([m, i]) => {
      if (m.isSkinnedMesh && typeof m.boneTransform === "function") m.boneTransform(i, v0);
      else v0.fromBufferAttribute(m.geometry.attributes.position, i);
      return v0.applyMatrix4(m.matrixWorld).y > -0.01 * d.h;
    });
    const arm = ctx.rig && !ctx.rig.object && ctx.rig.arms.R.length >= 3 ? ctx.rig.arms.R : null;
    d.armLen = arm ? wp(T, arm[0]).distanceTo(wp(T, arm[1])) + wp(T, arm[1]).distanceTo(wp(T, arm[2])) : 0.4 * d.h;
  }
  /* The lowest point of the surface now (skinned points follow their joints). */
  function lowestSkin(ctx, d) {
    const T = ctx.THREE;
    const v = new T.Vector3();
    let m = Infinity;
    (d.skin || []).forEach(([mesh, i]) => {
      if (mesh.isSkinnedMesh && typeof mesh.boneTransform === "function") mesh.boneTransform(i, v);
      else v.fromBufferAttribute(mesh.geometry.attributes.position, i);
      v.applyMatrix4(mesh.matrixWorld);
      if (v.y < m) m = v.y;
    });
    return m;
  }
  function lowest(ctx) {
    const T = ctx.THREE;
    let m = Infinity;
    ctx.bones.forEach((b) => (m = Math.min(m, wp(T, b).y)));
    return m;
  }

  R.extend({
    id: "gestures",
    label: "Acting moves",
    sliders: SLIDERS,
    setup(ctx) {
      D(ctx);
    },
    built: measure,
    afterBase(ctx) {
      if (!ctx.model || !ctx.rig) return;
      const d = D(ctx);
      if (d.h == null) measure(ctx);
      triggers(ctx);
      if (d.seek != null && d.run) d.run.t0 = ctx.clock - d.seek; /* held at one moment (contact sheets, tests) */
      const H = ctx.holder;
      const { pose, phase } = current(ctx);
      d.pose = pose;
      d.phase = phase;
      if (d.run) {
        const t = ctx.clock - d.run.t0;
        d.run.plan.segs.forEach((s, i) => s.fx === "spray" && t >= s.t0 && !d.run.fired[i] && ((d.run.fired[i] = true), (d.sprayDue = true)));
      }
      if (H) H.rotation.x = (pose.tilt || 0) * DEG;
      if (!Object.keys(pose).length) return;
      const per = new Map();
      Object.keys(pose).forEach((k) => {
        const m = k.match(/^([a-zA-Z]+)\.(\d)$/);
        if (!m || !pose[k]) return;
        bonesOf(ctx.rig, m[1]).forEach(([b, share]) => {
          if (!b) return;
          const o = per.get(b) || { bend: 0, side: 0, twist: 0 };
          o[["bend", "side", "twist"][Number(m[2])]] += pose[k] * share;
          per.set(b, o);
        });
      });
      per.forEach((o, b) => turn(ctx, b, o));
      if (H && pose.y) H.position.y += pose.y * d.h;
      ctx.model.updateMatrixWorld(true);
    },
    afterRules(ctx, dt) {
      if (!ctx.model || !ctx.rig) return;
      const d = D(ctx);
      const pose = d.pose || {};
      const H = ctx.holder;
      if (H) H.scale.set(1, 1, 1);
      if (Object.keys(pose).length) {
        const t = d.run ? ctx.clock - d.run.t0 : 0;
        reachHands(ctx, d, pose, t);
        lookAtCamera(ctx, clamp(pose.away || 0, 0, 1), true);
        lookAtCamera(ctx, clamp(pose.cam || 0, 0, 1));
        ctx.model.updateMatrixWorld(true);
        if (H) {
          /* feet on the floor: the lowest joint goes back to where it stood, and never below the floor */
          const plant = clamp(pose.plant || 0, 0, 1);
          let low = lowest(ctx);
          if (plant > 1e-3) H.position.y += plant * (d.restMin - low);
          H.updateMatrixWorld(true);
          low = lowest(ctx);
          const floor = Math.min(d.restMin, 0.03 * d.h);
          if (low < floor) H.position.y += floor - low;
          H.updateMatrixWorld(true);
          const skin = lowestSkin(ctx, d);
          d.under = Math.min(0, skin);
          if (skin < 0) {
            H.position.y -= skin;
            H.updateMatrixWorld(true);
          }
        }
      }
      if (d.sprayDue) {
        d.sprayDue = false;
        spray(ctx, d);
      }
      stepSpray(d, dt);
      say(ctx, d);
    },
    beforeRender(ctx) {
      const d = D(ctx);
      const s = d.pose && d.pose.stretch;
      if (s && ctx.holder) ctx.holder.scale.multiply(new ctx.THREE.Vector3(1 - s * 0.5, 1 + s, 1 - s * 0.5));
    },
    panel() {
      const btn = (m) => `<button type="button" data-gest="${esc(m.id)}" title="${esc(m.say)}">${esc(m.id)}</button>`;
      return `<h4 title="In Maya: pose-to-pose keys on an animation layer, so a move plays on top of a walk">Acting moves</h4>
        <p class="cap">Short moves played on top of whatever the body is doing. Press one, or type it in Tell it what you want ("does a double take", "shrugs"). Objects do them their own way.</p>
        <div class="rig-gest" style="display:flex;flex-wrap:wrap;gap:.25rem;margin:.2rem 0"><b style="width:100%;font-size:.8rem">Comedy</b>${MOVES.filter((m) => m.kind === "comedy").map(btn).join("")}</div>
        <div class="rig-gest" style="display:flex;flex-wrap:wrap;gap:.25rem;margin:.2rem 0"><b style="width:100%;font-size:.8rem">Everyday</b>${MOVES.filter((m) => m.kind === "everyday").map(btn).join("")}</div>
        <p class="cap" data-gest-now role="status"></p>
        <details><summary>What the timing sliders mean</summary><ul style="margin:.3rem 0;padding-left:1.1rem">
          <li><b>Wind-up first</b>: a small move the other way before the big one (a crouch before a jump), so the eye knows something is coming. Animators call it anticipation.</li>
          <li><b>Hold the pose</b>: how long the strongest pose stays still so the audience can read it.</li>
          <li><b>Settle at the end</b>: how the body comes back: all at once, gently, or a little too far and wobbling back (overshoot and settle).</li>
          <li><b>Comedy timing</b>: a pause just before the payoff. Wait, wait... then the take.</li>
          <li><b>On the timeline</b>: put a move on the Acting move lane and it plays when the playhead gets there. Play it, turning to go, plays it again.</li>
        </ul></details>`;
    },
    wire(ctx, box) {
      NOW.set(ctx, { el: box.querySelector("[data-gest-now]"), said: "" });
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-gest]");
        if (b) choose(ctx, b.dataset.gest, "the button");
      });
      /* Tell it what you want: the move part plays here, the rest goes on to the usual rules */
      const form = ctx.el.querySelector('[data-rig="ask-form"]');
      const input = ctx.el.querySelector('[data-rig="ask"]');
      if (!form || !input) return;
      form.addEventListener("submit", () => {
        const got = read(input.value);
        if (!got) return;
        const typed = input.value;
        choose(ctx, got.id, "your words");
        input.value = got.rest;
        setTimeout(() => {
          input.value = typed;
          const said = ctx.el.querySelector('[data-rig="said"]');
          if (!said) return;
          if (!got.rest) said.innerHTML = "";
          else if (/No words it knows yet/.test(said.textContent)) said.innerHTML = "";
          said.insertAdjacentHTML("afterbegin", `<p>Acting move: <b>${esc(got.id)}</b> (${esc(MOVES.find((m) => m.id === got.id).say)}).</p>`);
        }, 0);
      });
    },
  });

  /* Pick a move: set the Acting move slider (unless the timeline sets it) and play it now. */
  function choose(ctx, id, why) {
    const d = D(ctx);
    const s = SLIDERS[0];
    const i = s.scale.indexOf(id);
    if (i < 0) return false;
    ctx.prefs.values[MOVE] = i / (s.scale.length - 1);
    ctx.save();
    const inp = ctx.el.querySelector(`[data-slider="${MOVE}"]`);
    if (inp && !inp.disabled) {
      inp.value = i;
      const w = inp.closest(".rig-row") && inp.closest(".rig-row").querySelector("[data-word]");
      if (w) w.textContent = id;
    }
    d.lastWord = ctx.pick(MOVE);
    return start(ctx, id, why);
  }

  /* the status line lives as long as the panel, across loads (ctx.data is emptied on each load) */
  const NOW = new WeakMap();
  function say(ctx, d) {
    const n = NOW.get(ctx);
    if (!n || !n.el) return;
    const text = d.run ? `Playing: ${d.run.id}, ${PHASE[d.phase] || "the move"}.` : d.played ? "Done. Press a move to play it again." : "";
    if (text !== n.said) n.el.textContent = n.said = text;
  }

  R.gestures = {
    MOVES,
    SLIDERS,
    read,
    plan,
    /* play a move on a view (the newest 3D view when none is given) */
    play(ctl, id) {
      const c = ctl || R.current();
      return c && c.ctx ? choose(c.ctx, id, "a tool") : false;
    },
    /* words to a move on a view: { id, rest } or null */
    say(text, ctl) {
      const got = read(text);
      const c = ctl || R.current();
      if (got && c && c.ctx) choose(c.ctx, got.id, "your words");
      return got;
    },
    /* hold the playing move at t seconds in (null lets it run on) */
    seek(ctl, t) {
      const c = ctl || R.current();
      if (c && c.ctx) D(c.ctx).seek = t == null ? null : t;
    },
    state(ctl) {
      const c = ctl || R.current();
      if (!c || !c.ctx) return null;
      const d = D(c.ctx);
      return { playing: d.run ? d.run.id : "", phase: d.phase || "", played: d.played || 0, sprays: d.sprays || 0, total: d.run ? d.run.plan.total : 0, pose: Object.assign({}, d.pose || {}), h: d.h, restMin: d.restMin, low: c.ctx.model ? lowestSkin(c.ctx, d) : 0, holder: c.ctx.holder ? c.ctx.holder.position.y : 0 };
    },
  };
})();
