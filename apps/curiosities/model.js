/* Suites group curiosities. Proximities say: when X, Y follows within N beats.
   A model of a scene is only these, plus the curiosities they name.
   x and y are what a study counts: a curiosity that is a value, a curiosity that
   rises or drops against the beat where x held, or a whole suite.
   test is what the board checks to print a seed under the strip. */

const SUITES = [
  {
    id: "coverage",
    label: "Coverage",
    note: "Cuts around the line.",
    set: { angleFamily: "coverage", angleChange: "on the line", angleCount: 4 },
  },
  {
    id: "oner",
    label: "Oner",
    note: "One smooth tracking shot.",
    set: { angleFamily: "oner", cameraCarry: "smooth", cameraMove: "track", angleChange: "locked" },
  },
  {
    id: "handheld-hunt",
    label: "Handheld hunt",
    note: "Unsteady camera, faster cuts.",
    set: { cameraCarry: "handheld", angleFamily: "handheld", angleCount: 6, moveSpeed: 4 },
  },
  {
    id: "smooth-push",
    label: "Smooth push",
    note: "One slow line in.",
    set: { cameraCarry: "smooth", cameraMove: "push in", moveSpeed: 1 },
  },
  {
    id: "quiet-confession",
    label: "Quiet confession",
    note: "Close, quiet, a breath, a smooth push.",
    set: { volume: 1, breath: "breath then speak", cameraCarry: "smooth", cameraMove: "push in", angleFamily: "coverage" },
  },
  {
    id: "object-insert",
    label: "Object insert",
    note: "The thing moves and the frame follows it.",
    set: { objectPath: "lift", objectEnter: "enters", moveFollows: "object", cameraMove: "push in", cameraCarry: "smooth" },
  },
  {
    id: "crossing",
    label: "Crossing",
    note: "A person walks across a wide frame.",
    set: { characterPath: "cross", characterToLens: "across", angleFamily: "coverage", cameraCarry: "locked", cameraMove: "none" },
  },
  {
    id: "two-person",
    label: "Two-person hour",
    note: "Two mains, one company.",
    set: { mains: 2, groups: "1", peopleCount: 2 },
  },
];

const PROXIMITIES = [
  {
    id: "handheld-gesture",
    when: "the camera goes handheld",
    then: "gesture grows",
    within: 2,
    x: { curiosity: "cameraCarry", is: "handheld" },
    y: { curiosity: "gesture", change: "rises" },
    test: (state) => state.cameraCarry === "handheld",
  },
  {
    id: "close-quiet",
    when: "shot size becomes close",
    then: "volume drops",
    within: 1,
    x: { curiosity: "shotSize", is: "close" },
    y: { curiosity: "volume", change: "drops" },
    test: (state, shot) => shot === "close",
  },
  {
    id: "approach-push",
    when: "a person approaches",
    then: "the camera pushes in",
    within: 2,
    x: { curiosity: "characterPath", is: "approach" },
    y: { curiosity: "cameraMove", is: "push in" },
    test: (state) => state.characterPath === "approach",
  },
  {
    id: "object-insert-prox",
    when: "an object enters",
    then: "the frame becomes an insert",
    within: 1,
    x: { curiosity: "objectEnter", is: "enters" },
    y: { curiosity: "shotSize", is: "insert" },
    test: (state) => state.objectEnter === "enters",
  },
];

/* From the filmmaking catalog (docs/filmmaking-curiosities-catalog.md). Where the doc names
   a direction ("cutRate rising") the set uses the nearest value a single beat can show. */
SUITES.push(
  { id: "loving-camera", label: "Loving camera", note: "Slow, smooth, soft, shallow.", set: { moveTemper: 1, cameraCarry: "smooth", moveSpeed: 1, softness: "soft", depthOfField: "shallow" } },
  { id: "aggressive-camera", label: "Aggressive camera", note: "Handheld, fast cuts, wide lens, hard light.", set: { moveTemper: 5, cameraCarry: "handheld", cutRate: "fast", lensLength: "wide", softness: "hard" } },
  { id: "follows-voice", label: "Follows the voice", note: "The camera moves on the loud lines.", set: { moveToVolume: "moves on loud", moveOn: "line", dynamicRange: "wide" } },
  { id: "snappy-cartoon", label: "Snappy cartoon", note: "On twos, big wind-up, bounce.", set: { stepping: "twos", anticipation: "big", overshoot: "bounce", squash: 4 } },
  { id: "grounded-realism", label: "Grounded realism", note: "On ones, small wind-up, settles.", set: { stepping: "ones", anticipation: "small", overshoot: "settle", overlap: "hair" } },
  { id: "noir", label: "Noir", note: "Hard light through blinds, haze, low key.", set: { softness: "hard", contrast: 4, lightShape: "blinds", atmosphere: "haze", valueKey: "low key" } },
  { id: "golden-hour", label: "Golden hour", note: "Warm back light and a strong rim.", set: { colorTemp: "warm practical", key: "back", rim: "strong", softness: "soft" } },
  { id: "comic-ink", label: "Comic ink", note: "Toon render, heavy line, low saturation.", set: { renderStyle: "toon", lineWeight: "heavy", saturation: 2 } },
  { id: "wet-night", label: "Wet night", note: "Rain, mirror streets, lamps in frame.", set: { wetness: "soaked", gloss: "mirror", practicalInFrame: "yes", weather: "rain" } },
  { id: "storm", label: "Storm", note: "Wind, chaos, cloth and fur flying.", set: { windForce: 5, turbulence: 4, clothResponse: "flutter", furResponse: "wind" } },
  { id: "hearth", label: "Hearth", note: "A steady fire lights the room.", set: { element: "fire", growth: "steady", fireLight: "flicker", colorTemp: "warm practical" } },
  { id: "brawl", label: "Brawl", note: "Impacts, breakage, handheld, fast cuts.", set: { impacts: 6, breakage: "shatters", cameraCarry: "handheld", cutRate: "fast" } },
  { id: "build", label: "Build", note: "Energy, cuts and density climbing, music up.", set: { energyArc: 4, cutRate: "fast", visualDensity: 7, musicCue: "featured" } },
  { id: "drop", label: "Drop", note: "Energy falls away, silence, one thing in frame.", set: { energyArc: 1, silence: "long", visualDensity: 1, cameraCarry: "locked" } },
  { id: "breathing-room", label: "Breathing room", note: "Long silence, empty frame, long hold.", set: { silence: "long", emptySpace: "most", shotDuration: "long" } },
  { id: "signature-return", label: "Signature return", note: "The signature image comes back again.", set: { hook: "yes", repetition: 3 } }
);

/* Suites from Sharani's Maya areas (docs/maya-curiosities-map.md), used by the Studio tools. */
SUITES.push(
  { id: "clean-product", label: "Clean product", note: "Satin surfaces, new, soft light.", set: { gloss: "satin", wear: "new", softness: "soft" } },
  { id: "slow-motion", label: "Slow motion", note: "Floaty weight, long settle.", set: { gravityFeel: "floaty", settleTime: 4 } },
  { id: "drenched", label: "Drenched", note: "Matted, glossy hair that moves with the body.", set: { clump: "matted", hairShine: "glossy", furResponse: "the body", wetness: "soaked" } },
  { id: "backlit-fluff", label: "Backlit fluff", note: "Frizzy hair with a strong rim.", set: { frizz: 4, rim: "strong", hairShine: "sheen" } },
  { id: "windblown", label: "Windblown", note: "Hair taken by the wind and lagging.", set: { furResponse: "wind", frizz: 3, furLag: 1 } },
  { id: "avalanche", label: "Avalanche", note: "A wall of snow building, many impacts.", set: { element: "snow", density: "wall", growth: "building", impacts: 8 } },
  { id: "drift", label: "Drift", note: "Wisps of smoke curling through beams.", set: { element: "smoke", density: "wisp", curl: 3, atmosphere: "beams" } }
);

/* Genres are suites too: the curiosities that tend to be on together. Starting guesses from
   docs/scene-memory-app-framework.md until curated scenes are traced. */
SUITES.push(
  { id: "genre-crime", kind: "genre", label: "Crime, Tarantino style", note: "Long dialogue holds, low angles, music featured, the reveal lands late. Then a sudden spike in action cuts.", set: { shotDuration: "long", angleHeight: "low", musicCue: "featured", reveal: "after" } },
  { id: "genre-horror", kind: "genre", label: "Horror", note: "Fear, empty frame, long silence, then a burst.", set: { emotion: "fearful", emptySpace: "most", silence: "long" } },
  { id: "genre-action", kind: "genre", label: "Action", note: "Fast action cuts, shake, impacts, high energy.", set: { actionCutRate: 6, cameraShake: 3, impacts: 4, energyArc: 5 } },
  { id: "genre-western", kind: "genre", label: "Western", note: "A wide horizon and a long silence before a fast cut.", set: { shotSize: "wide", intExt: "exterior", silence: "long" } },
  { id: "genre-musical", kind: "genre", label: "Musical", note: "Music featured, the camera cranes, saturated color.", set: { musicCue: "featured", cameraMove: "crane", saturation: 5 } },
  { id: "genre-documentary", kind: "genre", label: "Documentary", note: "Handheld, practical light, a human operator's drift.", set: { cameraCarry: "handheld", lighting: "practical", operatorFeel: 4 } },
  { id: "genre-surrealist", kind: "genre", label: "Surrealist", note: "Shifts that don't snap back, match cuts, slow motion, tilted frames.", set: { psychOut: "real", transition: "match cut", emotion: "dreamlike", speedRamp: "slow", dutch: "tilted" } },
  { id: "genre-romcom", kind: "genre", label: "Romantic comedy", note: "Joy, hard cuts, eye level, high key, playful rising lines.", set: { emotion: "joyful", transition: "cut", angleHeight: "eye", valueKey: "high key", vocalTone: "rising" } }
);

/* Angle by emotion: the default camera for each emotion, as common film grammar. A traced
   film confirms or breaks each row; the Study's Cross view counts it. */
const EMOTION_MAP = {
  loving: { angleHeight: "eye", shotSize: "close", cameraMove: "push in", cameraCarry: "smooth", cutRate: "slow", lensLength: "long", softness: "soft" },
  joyful: { angleHeight: "eye", shotSize: "medium", cameraMove: "track", cameraCarry: "smooth", cutRate: "medium", valueKey: "high key" },
  curious: { angleHeight: "high", shotSize: "medium", cameraMove: "track", moveFollows: "character", cutRate: "medium" },
  melancholy: { angleHeight: "high", shotSize: "wide", cameraMove: "pull out", cameraCarry: "smooth", cutRate: "slow", colorTemp: "cold day" },
  anxious: { dutch: "tilted", shotSize: "close", emptySpace: "some", cameraCarry: "handheld", cutRate: "fast", lensLength: "wide", softness: "hard" },
  fearful: { angleHeight: "low", emptySpace: "most", cameraMove: "push in", cutRate: "slow", valueKey: "low key" },
  angry: { angleHeight: "low", shotSize: "close", cameraCarry: "handheld", cutRate: "fast", lensLength: "wide", softness: "hard" },
  triumphant: { angleHeight: "low", shotSize: "wide", cameraMove: "crane", cutRate: "fast", key: "back", rim: "strong" },
  absurd: { angleHeight: "eye", composition: "center", cameraCarry: "locked", cutRate: "medium", saturation: 4 },
  dreamlike: { angleHeight: "overhead", dutch: "tilted", cameraCarry: "smooth", cutRate: "slow", transition: "dissolve", atmosphere: "haze" },
};
Object.entries(EMOTION_MAP).forEach(([emotion, set]) =>
  SUITES.push({ id: "emotion-" + emotion, kind: "emotion", label: "Feels " + emotion, note: "The default camera for a " + emotion + " beat.", set: Object.assign({ emotion }, set) })
);

/* Catalog proximities a study can count. The rest stay as text in the Catalog until a
   condition type exists for them. A change is measured against the beat before. */
PROXIMITIES.push(
  { id: "emotion-angle", when: "the emotion changes", then: "the angle height changes", within: 1, x: { curiosity: "emotion", change: "changes" }, y: { curiosity: "angleHeight", change: "changes" } },
  { id: "emotion-temper", when: "the emotion changes", then: "the move temper changes", within: 1, x: { curiosity: "emotion", change: "changes" }, y: { curiosity: "moveTemper", change: "changes" } },
  { id: "volume-speed", when: "volume rises", then: "move speed rises", within: 0, x: { curiosity: "volume", change: "rises" }, y: { curiosity: "moveSpeed", change: "rises" } },
  { id: "rain-wet", when: "it rains", then: "surfaces are soaked", within: 2, x: { curiosity: "weather", is: "rain" }, y: { curiosity: "wetness", is: "soaked" } },
  { id: "impact-shake", when: "impacts rise", then: "the shake rises", within: 0, x: { curiosity: "impacts", change: "rises" }, y: { curiosity: "cameraShake", change: "rises" } },
  { id: "toon-line", when: "the render goes toon", then: "the ink line is heavy", within: 0, x: { curiosity: "renderStyle", is: "toon" }, y: { curiosity: "lineWeight", is: "heavy" } },
  { id: "tension-silence", when: "tension peaks", then: "a long silence", within: 1, x: { curiosity: "tensionCurve", is: 5 }, y: { curiosity: "silence", is: "long" } },
  { id: "energy-hold", when: "energy drops", then: "the hold is long", within: 2, x: { curiosity: "energyArc", change: "drops" }, y: { curiosity: "shotDuration", is: "long" } },
  { id: "build-drop", when: "suite Build", then: "suite Drop", within: 4, x: { suite: "build" }, y: { suite: "drop" } },
  { id: "aggressive-quiet", when: "suite Aggressive camera", then: "suite Quiet confession", within: 6, x: { suite: "aggressive-camera" }, y: { suite: "quiet-confession" } },
  { id: "storm-room", when: "suite Storm", then: "suite Breathing room", within: 8, x: { suite: "storm" }, y: { suite: "breathing-room" } }
);
