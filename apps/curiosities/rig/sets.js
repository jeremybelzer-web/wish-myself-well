/* rig/sets.js: "Make a set from words", an add-on for the 3D characters view (CurioRig.extend).

   Type where the scene happens ("a kitchen with a table, two chairs and a window", "a dusty country road with a
   fence and a big tree at sunset", "a diner booth", "a bedroom at night with a lamp", "a stage with a curtain",
   "a car interior") and the app builds a simple storyboard-style set around the character out of plain shapes.
   It reads:
   - the place: kitchen, bedroom, living room, office, classroom, diner or cafe, bar, stage, car interior,
     bathroom, store, garage, a room; outside: a road (country or dirt road), a street or city, park, forest,
     beach, desert, farm or field, backyard or garden, parking lot. Each place has its own floor, walls and the
     things it always has (a kitchen has a counter and a fridge); when only one or two things are named, it adds
     a few more that belong there.
   - the floor or ground (wood, tile, checkered, carpet, concrete, stone, marble, dirt, grass, sand, snow,
     asphalt) and its color; the walls (none, one, two or three, never the fourth, so the camera can see in) and
     their color. Walls on the camera's side are left out as the camera goes round (a dollhouse cut-away).
   - things (about 45 kinds): table, coffee table, chair, armchair, sofa, bed, nightstand, door, window, counter,
     fridge, stove, sink, lamp, tree (pine, palm), bush, fence, car, bench, sign, mailbox, shelf or bookshelf, TV,
     rug, stairs, curtain, microphone, barn, house front, streetlight, rock, desk, computer, plant, clock,
     picture, mirror, booth, bar stool, crate, barrel, trash can, fire hydrant, cactus, piano, fireplace, road.
     Each with a count ("two chairs", "a few trees"), a color or material ("a red sofa", "a wooden fence"), a
     size (big, small) and where ("on the left", "behind", "in front", "next to the bed", "on the desk").
     Left and right are the left and right of the picture.
   - the time of day: morning, noon, sunset or night colors the sky (and the glass of windows), lamps glow
     after dark, and the Light add-on gets a matching starting point (its sliders stay yours to change).
   - sitting: "sits on the chair", "sitting at the table", "in the driver's seat". A person sits (the legs bend,
     the seat is sized to them, the feet stay on the floor, the hands rest on the table, the knees or the
     steering wheel). A car interior and a booth are sat in unless the words say standing. Four-legged
     characters and objects stand next to the furniture instead.
   Everything stands on the floor, against a wall or on top of another thing, and keeps clear of the character.
   More than one actor (rig/staging.js): the set keeps clear of every actor where they stand (each one measured
   in their own frame when they come in), and when the staging changes (a preset, an actor added or taken out,
   someone walking to a mark) it is laid out again once everyone stands still. Sitting works for actors 2 to 4
   too: every staged person sits (or only those given to CurioRigSets.sitters), each on a seat of their own
   behind them, turned the way they face; two or more "at the table" share one table between them, as deep as
   the gap in front of them, and their hands rest on its near half. A car interior seats actor 1 only.
   Feet and hands (rig/ik.js): with "What the hands hold: a surface", a person standing next to a table or desk
   in the set rests the hands on it (the table moves to where the hands are and the add-on's own plain table
   hides); a seated person rests them on the set's table.

   Sets are kept in localStorage "curiosities-rig3d-sets-v1": { list: [{ id, name, text }], cur, on }.
   on: false means no set is shown (Clear the set). Every geometry, material and picture a set makes is given
   back when it is cleared or built again. Set pieces carry userData.setPiece (the kind); the set's root has
   userData.sketch, so rig/snapshot.js draws its outlines and flat tones too.
   CurioRig.sets = { read(text) -> plan, surprise() -> words, store(), KEY, START, KINDS }.
   window.CurioRigSets = { state(ctx), make(ctx, text), clear(ctx), sitters(ctx, list | null) } for tests and
   rig/scene.js. */
(function () {
  const R = window.CurioRig;
  if (!R || !R.extend) return;
  const KEY = "curiosities-rig3d-sets-v1";
  const MAX = 24;
  const START = "a kitchen with a table, two chairs and a window";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- the saved sets ---------- */
  const newId = () => "s" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  function store() {
    let s = {};
    try {
      s = JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      s = {};
    }
    if (typeof s !== "object" || Array.isArray(s)) s = {};
    let list = Array.isArray(s.list) ? s.list.filter((x) => x && typeof x.text === "string").map((x) => ({ id: String(x.id || newId()), name: String(x.name || "My set").slice(0, 40), text: x.text })) : [];
    const fresh = !list.length;
    if (fresh) list = [{ id: newId(), name: "Kitchen", text: START }];
    const cur = list.find((x) => x.id === s.cur) || list[0];
    const out = { list, cur: cur.id, on: s.on === true };
    if (fresh || s.cur !== cur.id) keep(out);
    return out;
  }
  function keep(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ list: s.list, cur: s.cur, on: !!s.on }));
    } catch (e) {
      /* private window: the set lasts until the page closes */
    }
  }
  const current = (s) => s.list.find((x) => x.id === s.cur) || s.list[0];

  /* ---------- colors and materials ---------- */
  const COLORS = {
    blue: 0x2f6fe0, navy: 0x1f2f66, "navy blue": 0x1f2f66, "sky blue": 0x6fb6f0, "baby blue": 0x9ccbf2, "royal blue": 0x2a4fc0, red: 0xc8302c, crimson: 0xa01c2c, scarlet: 0xd02a1e, burgundy: 0x6a1a2a,
    maroon: 0x6e1f2a, green: 0x3c9a46, "forest green": 0x24603a, lime: 0x8ccf3a, mint: 0x9fe0c0, olive: 0x7a7a32, emerald: 0x1f9a5e, yellow: 0xf2cf3a, mustard: 0xd0a82a, gold: 0xd9a838,
    golden: 0xd9a838, orange: 0xec7a23, peach: 0xf4b48c, coral: 0xf07a64, rust: 0xa84a24, rusty: 0xa84a24, purple: 0x7d4bbf, violet: 0x8a4fd0, lavender: 0xb9a2e6, lilac: 0xc4a8e0, plum: 0x6a2c5e,
    magenta: 0xc4307e, pink: 0xf08cb4, "hot pink": 0xe8448c, black: 0x1e1e22, white: 0xf2f2ee, cream: 0xefe6cc, beige: 0xd8c6a0, gray: 0x8a8d93, grey: 0x8a8d93, charcoal: 0x3a3c42,
    silver: 0xc4c7cc, brown: 0x6b4426, chocolate: 0x4a2c1a, tan: 0xc9a273, khaki: 0xb8a77a, teal: 0x2a9d9a, turquoise: 0x30c0c0, aqua: 0x40d0d0, copper: 0xb0603a, bronze: 0x9a6a30,
    ivory: 0xf4efdc, avocado: 0x8a9a3a, salmon: 0xf08a72, sage: 0x9cae8c, denim: 0x3d5a8a,
  };
  const STUFF = {
    wooden: 0x9a6b43, wood: 0x9a6b43, oak: 0xa87a4a, pine: 0xc8a070, walnut: 0x5a3a22, mahogany: 0x6a2e1e, cherry: 0x8a3a22, metal: 0xa8adb4, metallic: 0xa8adb4, steel: 0xa8adb4,
    chrome: 0xd0d4da, iron: 0x3a3c40, brick: 0xa0503a, stone: 0x8a8a84, marble: 0xe8e6e0, glass: 0xbfe0e8, leather: 0x5a3a22, velvet: 0x7a1a3a, plastic: 0xe8e8e8, wicker: 0xc8a060,
    picket: 0xf2f2ee, concrete: 0x9a9a94, cardboard: 0xb88a58, straw: 0xd9b86a,
  };
  const mixC = (a, b, t) => {
    const ch = (x, s) => (x >> s) & 255;
    const m = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
    return (m(16) << 16) | (m(8) << 8) | m(0);
  };
  function colorAt(words, i) {
    const w = words[i] && words[i].replace(/(-colou?red|ish)$/, "");
    if (!w) return null;
    const two = i > 0 ? words[i - 1] + " " + w : "";
    if (COLORS[two] != null) return { color: COLORS[two], word: two };
    if (COLORS[w] == null) return null;
    const pre = words[i - 1];
    if (pre === "light" || pre === "pale" || pre === "pastel") return { color: mixC(COLORS[w], 0xffffff, 0.45), word: pre + " " + w };
    if (pre === "dark" || pre === "deep") return { color: mixC(COLORS[w], 0, 0.45), word: "dark " + w };
    return { color: COLORS[w], word: w };
  }

  /* ---------- places ---------- */
  const SKY = {
    morning: { top: 0x8fb8e0, mid: 0xd8e4ee, low: 0xf2d6b8, say: "a morning sky" },
    noon: { top: 0x4f8fd8, mid: 0x9cc8ee, low: 0xd6e8f4, say: "a clear midday sky" },
    sunset: { top: 0x4a4a8a, mid: 0xe88a5a, low: 0xf6c070, say: "a sunset sky" },
    night: { top: 0x070b1a, mid: 0x111a33, low: 0x1c2848, say: "a night sky" },
  };
  /* indoor: walls (3 unless said), wall color, floor; sig: always there; more: added when few things are named */
  const PLACES = [
    { id: "car", re: /\bcar interior\b|\binside (?:a |the |my |his |her |their |an old )?(?:car|truck|van|taxi)\b|\bin (?:a |the |my |his |her |their )?(?:car|truck|van|taxi)\b|\b(?:front|back|driver'?s|passenger) seat\b|\bdriving\b/, say: "inside a car", car: true, sit: true },
    { id: "kitchen", re: /\bkitchens?\b/, say: "a kitchen", floor: "checker", wall: 0xf1e6c8, sig: ["counter", "fridge"], more: ["stove", "sink", "window", "clock"] },
    { id: "bedroom", re: /\bbed ?rooms?\b|\bdorm(?: room)?\b/, say: "a bedroom", floor: "wood", wall: 0xc9d6e8, sig: ["bed"], more: ["nightstand", "window", "rug", "shelf", "picture"] },
    { id: "living", re: /\bliving ?rooms?\b|\blounge\b|\bfamily room\b|\bsitting room\b|\bden\b/, say: "a living room", floor: "wood", wall: 0xe6d8bd, sig: ["sofa"], more: ["tv", "rug", "coffee table", "lamp", "plant", "picture"] },
    { id: "office", re: /\boffices?\b|\bstudy\b|\bcubicles?\b|\bwork ?space\b/, say: "an office", floor: "carpet", floorColor: 0x7d848c, wall: 0xdfe3e6, sig: ["desk"], more: ["chair", "computer", "shelf", "plant", "window", "clock"] },
    { id: "classroom", re: /\bclass ?rooms?\b|\bschool ?rooms?\b|\bschool\b/, say: "a classroom", floor: "tile", wall: 0xd8e6c8, sig: ["desk", "desk"], more: ["chair", "clock", "shelf", "window", "picture"] },
    { id: "diner", re: /\bdiners?\b|\bcaf[eé]s?\b|\bcoffee ?shops?\b|\brestaurants?\b|\bluncheonette\b/, say: "a diner", floor: "checker", wall: 0xf2e4c4, sig: ["booth"], more: ["window", "counter", "bar stool", "bar stool", "clock"] },
    { id: "bar", re: /\bbars?\b(?! ?stools?)|\bpubs?\b|\bsaloons?\b|\btaverns?\b|\bnight ?clubs?\b/, say: "a bar", floor: "wood", floorColor: 0x5a3a24, wall: 0x6a2a2a, sig: ["counter", "bar stool", "bar stool"], more: ["shelf", "picture", "clock"], counterOut: true },
    { id: "stage", re: /\bstages?\b|\btheat(?:er|re)s?\b|\bauditorium\b|\bcomedy club\b|\bconcert\b/, say: "a stage", floor: "stage", walls: 0, sig: ["curtain"], more: [], stage: true },
    { id: "bathroom", re: /\bbath ?rooms?\b|\brest ?rooms?\b/, say: "a bathroom", floor: "tile", wall: 0xcfe6e6, sig: ["sink", "mirror"], more: ["window", "plant"] },
    { id: "store", re: /\b(?:grocery )?stores?\b(?! ?fronts?)|\bshops?\b(?! ?fronts?)|\bsupermarkets?\b|\bmarket\b/, say: "a store", floor: "tile", wall: 0xe8e8e0, sig: ["shelf", "shelf", "counter"], more: ["sign", "plant"] },
    { id: "garage", re: /\bgarages?\b|\bworkshops?\b|\bwarehouses?\b/, say: "a garage", floor: "concrete", wall: 0xb8b8b0, sig: ["shelf"], more: ["car", "crate", "barrel"] },
    { id: "room", re: /\brooms?\b|\bhall ?ways?\b|\bcorridors?\b|\bapartments?\b|\bindoors\b|\binside\b/, say: "a room", floor: "wood", wall: 0xe4dccb, sig: [], more: [] },
    /* outside */
    { id: "road", re: /\broads?\b|\bhighways?\b|\bcountry lanes?\b|\bdirt tracks?\b/, say: "a road", out: true, ground: "grass", road: "asphalt", sig: [], more: ["tree", "tree", "bush", "mailbox", "fence"] },
    { id: "street", re: /\bstreets?\b|\bcity\b|\btown\b|\bsidewalks?\b|\balleys?\b|\bdowntown\b|\bneighbou?rhood\b/, say: "a street", out: true, ground: "asphalt", road: "street", sig: ["house", "house", "streetlight"], more: ["trash can", "hydrant", "mailbox"] },
    { id: "park", re: /\bparks?\b(?!ing)|\bplaygrounds?\b/, say: "a park", out: true, ground: "grass", road: "path", sig: ["bench", "tree", "tree"], more: ["bush", "streetlight", "trash can"] },
    { id: "forest", re: /\bforests?\b|\bwoods\b|\bwoodlands?\b|\bjungles?\b/, say: "a forest", out: true, ground: "grass", groundColor: 0x4a6a34, sig: ["pine", "pine", "pine", "tree", "tree", "pine"], more: ["rock", "bush"] },
    { id: "beach", re: /\bbeach(?:es)?\b|\bshore\b|\bseaside\b|\bocean\b|\bsea\b/, say: "a beach", out: true, ground: "sand", sea: true, sig: [], more: ["palm", "rock"] },
    { id: "desert", re: /\bdeserts?\b|\bcanyons?\b|\bwild west\b/, say: "a desert", out: true, ground: "sand", groundColor: 0xd8a868, hills: 0xc08850, sig: ["cactus", "rock"], more: ["cactus", "rock"] },
    { id: "farm", re: /\bfarms?\b|\bfields?\b|\bmeadows?\b|\bcountryside\b|\branch\b|\bpastures?\b/, say: "a farm", out: true, ground: "grass", hills: 0x5f8a44, sig: ["barn", "fence"], more: ["tree", "barrel"] },
    { id: "yard", re: /\bback ?yards?\b|\bfront ?yards?\b|\byards?\b|\bgardens?\b|\blawns?\b|\bpatios?\b|\bporch\b/, say: "a backyard", out: true, ground: "grass", sig: ["house", "fence"], more: ["tree", "bush", "plant"] },
    { id: "lot", re: /\bparking (?:lot|garage)s?\b|\bcar parks?\b/, say: "a parking lot", out: true, ground: "asphalt", sig: ["car", "car"], more: ["streetlight"] },
    { id: "outside", re: /\boutside\b|\boutdoors\b|\bout of doors\b/, say: "outside", out: true, ground: "grass", sig: [], more: [] },
  ];

  /* ---------- the things, in the order they are looked for (longer names first) ---------- */
  const KINDS = [
    { id: "bar stool", re: /\bbar ?stools?\b|\bstools?\b/, say: "bar stool", seat: true },
    { id: "coffee table", re: /\bcoffee tables?\b|\bside tables?\b|\bend tables?\b/, say: "coffee table" },
    { id: "nightstand", re: /\bnight ?stands?\b|\bbedside tables?\b|\bnight tables?\b|\bdressers?\b/, say: "nightstand" },
    { id: "table lamp", re: /\b(?:desk|table|bedside|reading) lamps?\b/, say: "table lamp", as: "lamp", small: true },
    { id: "streetlight", re: /\bstreet ?lights?\b|\bstreet ?lamps?\b|\blamp ?posts?\b|\blight ?posts?\b/, say: "streetlight" },
    { id: "computer", re: /\bcomputers?\b|\blaptops?\b|\bmonitors?\b|\bpcs?\b/, say: "computer" },
    { id: "microphone", re: /\bmicrophone(?: stand)?s?\b|\bmic stands?\b|\bmics?\b/, say: "microphone stand" },
    { id: "house", re: /\bhouse fronts?\b|\bhouses?\b|\bhomes?\b|\bbuildings?\b|\bstore ?fronts?\b|\bshop ?fronts?\b|\bcottages?\b|\bcabins?\b/, say: "house front" },
    { id: "hydrant", re: /\b(?:fire )?hydrants?\b/, say: "fire hydrant" },
    { id: "trash can", re: /\btrash ?cans?\b|\bgarbage ?cans?\b|\bbins?\b|\bdumpsters?\b|\bwaste ?baskets?\b/, say: "trash can" },
    { id: "car seat", re: /^$/, say: "car seat", seat: true },
    { id: "armchair", re: /\barm ?chairs?\b|\brecliners?\b|\beasy chairs?\b/, say: "armchair", seat: true },
    { id: "palm", re: /\bpalm(?: trees?)?s?\b/, say: "palm tree" },
    { id: "pine", re: /\bpine(?: trees?)?s?\b|\bfir trees?\b|\bfirs\b|\bspruces?\b|\bchristmas trees?\b/, say: "pine tree" },
    { id: "table", re: /\b(?:kitchen |dining |picnic )?tables?\b/, say: "table" },
    { id: "chair", re: /\bchairs?\b|\bseats?\b/, say: "chair", seat: true },
    { id: "sofa", re: /\bsofas?\b|\bcouch(?:es)?\b|\bloveseats?\b|\bsettees?\b/, say: "sofa", seat: true },
    { id: "bed", re: /\b(?:bunk )?beds?\b/, say: "bed", seat: true },
    { id: "door", re: /\bdoors?\b|\bdoorways?\b/, say: "door" },
    { id: "window", re: /\bwindows?\b/, say: "window" },
    { id: "counter", re: /\b(?:kitchen )?counters?\b|\bcountertops?\b|\bcabinets?\b|\bcupboards?\b/, say: "counter" },
    { id: "fridge", re: /\bfridges?\b|\brefrigerators?\b|\bfreezers?\b/, say: "fridge" },
    { id: "stove", re: /\bstoves?\b|\bovens?\b|\bcookers?\b/, say: "stove" },
    { id: "sink", re: /\bsinks?\b/, say: "sink" },
    { id: "lamp", re: /\b(?:floor )?lamps?\b/, say: "lamp" },
    { id: "tree", re: /\btrees?\b|\boaks?\b|\bwillows?\b|\bmaples?\b/, say: "tree" },
    { id: "bush", re: /\bbush(?:es)?\b|\bshrubs?\b|\bhedges?\b/, say: "bush" },
    { id: "fence", re: /\bfences?\b|\bfencing\b|\brailings?\b/, say: "fence" },
    { id: "car", re: /\bcars?\b|\btrucks?\b|\bpickups?\b|\bvans?\b|\bjeeps?\b|\btaxis?\b|\bsedans?\b/, say: "car" },
    { id: "bench", re: /\b(?:park )?bench(?:es)?\b|\bpews?\b/, say: "bench", seat: true },
    { id: "sign", re: /\b(?:stop |road |street )?signs?\b|\bsignposts?\b|\bbillboards?\b/, say: "sign" },
    { id: "mailbox", re: /\bmail ?box(?:es)?\b|\bpost ?box(?:es)?\b|\bletter ?box(?:es)?\b/, say: "mailbox" },
    { id: "shelf", re: /\bbook ?shel(?:f|ves)\b|\bbook ?cases?\b|\bshel(?:f|ves)\b|\bshelving\b/, say: "shelf" },
    { id: "tv", re: /\btvs?\b|\btelevisions?\b|\btelly\b/, say: "TV" },
    { id: "rug", re: /\brugs?\b|\bmats?\b|\ba carpet\b/, say: "rug" },
    { id: "stairs", re: /\bstairs?\b|\bstair ?cases?\b|\bstairways?\b|\bsteps\b/, say: "stairs" },
    { id: "curtain", re: /\bcurtains?\b|\bdrapes?\b|\bdrapery\b/, say: "curtain" },
    { id: "barn", re: /\bbarns?\b|\bstables\b|\bsheds?\b/, say: "barn" },
    { id: "rock", re: /\brocks?\b|\bboulders?\b|\bstones\b/, say: "rock" },
    { id: "desk", re: /\bdesks?\b/, say: "desk" },
    { id: "plant", re: /\b(?:potted |house ?)?plants?\b|\bflowers?\b|\bferns?\b|\bvases?\b/, say: "plant" },
    { id: "clock", re: /\bclocks?\b/, say: "clock" },
    { id: "mirror", re: /\bmirrors?\b/, say: "mirror" },
    { id: "booth", re: /\bbooths?\b/, say: "booth", seat: true },
    { id: "crate", re: /\bcrates?\b|\bboxes\b|\ba box\b|\bsuitcases?\b/, say: "crate" },
    { id: "barrel", re: /\bbarrels?\b|\bkegs?\b/, say: "barrel" },
    { id: "cactus", re: /\bcact(?:us|i|uses)\b/, say: "cactus" },
    { id: "piano", re: /\bpianos?\b/, say: "piano" },
    { id: "fireplace", re: /\bfire ?places?\b|\bhearths?\b/, say: "fireplace" },
    { id: "picture", re: /\bpictures?\b|\bpaintings?\b|\bphotos?\b|\bposters?\b|\bportraits?\b|\bframes?\b/, say: "picture" },
  ];
  const KIND = {};
  KINDS.forEach((k) => (KIND[k.id] = k));
  const OUTDOORSY = new Set(["tree", "pine", "palm", "bush", "fence", "car", "barn", "house", "streetlight", "mailbox", "rock", "cactus", "hydrant", "sign"]);
  const INDOORSY = new Set(["sofa", "bed", "fridge", "counter", "stove", "sink", "tv", "shelf", "desk", "computer", "fireplace", "piano", "rug", "armchair", "nightstand", "coffee table", "booth", "bar stool"]);
  const NUM = { a: 1, an: 1, one: 1, single: 1, two: 2, pair: 2, couple: 2, both: 2, three: 3, few: 3, several: 4, four: 4, five: 5, some: 2, many: 5, lots: 5, six: 6, seven: 7, eight: 8, row: 4 };

  function readSet(text) {
    const raw = String(text || "").toLowerCase().replace(/[’`]/g, "'");
    let t = " " + raw.replace(/[^a-z0-9' ,.;!?-]/g, " ").replace(/\s+/g, " ") + " ";
    const said = [];
    const p = { place: "", indoor: true, walls: 3, wallColor: 0xe4dccb, wallWord: "", floor: "wood", floorColor: null, floorWord: "", time: "", props: [], sit: false, sitOn: "", sitAt: "", standing: false, dusty: false, size: 1, road: "", sea: false, hills: 0, ground: "", groundColor: null, car: false, stage: false, handsOn: false, found: false, notes: [] };
    const negated = (idx) => /\b(no|without|not|never|nothing|n't)\s+(?:a |an |any |the )?(?:[a-z]+ ){0,2}$/.test(t.slice(Math.max(0, idx - 30), idx));
    /* blank a matched span so the next readers do not see it again */
    const blank = (i, n) => (t = t.slice(0, i) + " ".repeat(n) + t.slice(i + n));

    /* ----- time of day ----- */
    const TIMES = [
      ["night", /\b(?:at |late at )?night(?:time)?\b|\bmidnight\b|\bmoon ?lit\b|\bafter dark\b|\bin the dark\b|\bnighttime\b/],
      ["sunset", /\bsunset\b|\bsundown\b|\bdusk\b|\bevening\b|\bgolden hour\b|\btwilight\b/],
      ["morning", /\bmorning\b|\bdawn\b|\bsunrise\b|\bdaybreak\b|\bbreakfast\b/],
      ["noon", /\bnoon\b|\bmidday\b|\bmid-day\b|\bdaytime\b|\bafternoon\b|\bsunny\b|\blunch(?:time)?\b|\bbroad daylight\b/],
    ];
    for (const [id, re] of TIMES) {
      const m = t.match(re);
      if (m) {
        p.time = id;
        blank(m.index, m[0].length);
        break;
      }
    }
    p.dusty = /\bdust(?:y)?\b|\bsandy\b|\bdry\b/.test(t);
    p.standing = /\b(?:stand|stands|standing)\b/.test(t);
    p.handsOn = /\bhands? (?:on|resting on|flat on) (?:the |a |his |her )?(?:table|desk|counter|bar)\b/.test(t);

    /* ----- the place ----- */
    let place = null;
    for (const pl of PLACES) {
      const m = t.match(pl.re);
      if (!m || negated(m.index)) continue;
      place = pl;
      /* "a road", "a street", "a stage" and "a bar" are the place, not things in it */
      blank(m.index, m[0].length);
      break;
    }
    /* ----- the floor and walls ----- */
    const FLOORS = [
      ["checker", /\b(?:checker(?:ed|board)?|chequered|black and white) (?:tile |tiled |lino )?floors?\b|\bcheckerboard\b|\bcheckered tiles?\b/],
      ["carpet", /\bcarpet(?:ed)? floors?\b|\bcarpeted\b|\bwall to wall carpet\b|\bcarpeting\b/],
      ["tile", /\btiled? floors?\b|\btiles\b|\blino(?:leum)?\b/],
      ["wood", /\b(?:wood(?:en)?|hardwood|plank|parquet|oak|pine) floors?\b|\bfloor ?boards\b/],
      ["concrete", /\bconcrete(?: floors?)?\b|\bcement floors?\b/],
      ["stone", /\bstone floors?\b|\bcobble(?:stones?|d)?\b|\bflagstones?\b/],
      ["marble", /\bmarble floors?\b/],
      ["dirt", /\bdirt(?: floor| ground)?\b|\bmud(?:dy)?\b|\bgravel\b/],
      ["grass", /\bgrass(?:y)?\b|\blawn\b/],
      ["sand", /\bsand(?:y)?\b/],
      ["snow", /\bsnow(?:y)?\b|\bwinter\b|\bicy\b/],
      ["asphalt", /\basphalt\b|\bpavement\b|\btarmac\b/],
    ];
    let floorSaid = "";
    for (const [id, re] of FLOORS) {
      const m = t.match(re);
      if (!m) continue;
      p.floor = id;
      floorSaid = id;
      blank(m.index, m[0].length);
      break;
    }
    /* clauses: a color or a size belongs to the thing named in the same clause */
    const clauses = () => {
      const out = [];
      const re = /[^,.;!?]+/g;
      let m;
      while ((m = re.exec(t))) {
        let start = m.index;
        m[0].split(/(\band\b|\bwith\b|\bplus\b|\bbut\b|\bthen\b|\bwhere\b|\bwhile\b)/).forEach((part, i) => {
          if (i % 2 === 0) out.push({ text: part, at: start });
          start += part.length;
        });
      }
      return out;
    };
    const colorIn = (cl, idx, len) => {
      const words = cl.text.slice(0, idx).trim().split(/[\s-]+/).filter(Boolean).slice(-5);
      let stuff = null;
      for (let i = words.length - 1; i >= 0; i--) {
        const c = colorAt(words, i);
        if (c) return c;
        if (!stuff && STUFF[words[i]] != null) stuff = { color: STUFF[words[i]], word: words[i] };
      }
      const after = cl.text.slice(idx + len).match(/^\s*(?:is |are |that's |that is )?(?:painted |in |colou?red |made of |of )?((?:light |dark |pale |bright |navy |sky |hot |forest )?[a-z]+)/);
      if (after) {
        const ws = after[1].split(" ");
        const c = colorAt(ws, ws.length - 1);
        if (c) return c;
        if (!stuff && STUFF[ws[ws.length - 1]] != null) stuff = { color: STUFF[ws[ws.length - 1]], word: ws[ws.length - 1] };
      }
      return stuff;
    };
    const findIn = (re) => {
      for (const cl of clauses()) {
        const m = cl.text.match(re);
        if (m) return { cl, m };
      }
      return null;
    };
    const wallHit = findIn(/\bwall(?:s|paper)?\b/);
    if (wallHit) {
      const c = colorIn(wallHit.cl, wallHit.m.index, wallHit.m[0].length);
      if (c) (p.wallColor = c.color), (p.wallWord = c.word);
    }
    let wallsSaid = null;
    const wn = t.match(/\b(no|one|1|a single|two|2|three|3|four|4|open) walls?\b|\bno walls\b|\bwithout walls\b|\bopen plan\b/);
    if (wn) wallsSaid = /no|without|open/.test(wn[0]) ? 0 : /one|1|single/.test(wn[0]) ? 1 : /two|2/.test(wn[0]) ? 2 : 3;
    const floorHit = findIn(/\bfloors?\b|\bground\b/) || (floorSaid ? { cl: { text: raw }, m: raw.match(/\b(?:carpet|tiles?|grass|sand|snow|dirt|concrete|marble|stone)\b/) } : null);
    if (floorHit && floorHit.m) {
      const c = colorIn(floorHit.cl, floorHit.m.index, floorHit.m[0].length);
      if (c && !STUFF[c.word]) (p.floorColor = c.color), (p.floorWord = c.word);
    }
    t = t.replace(/\bwall(?:s|paper)?\b|\bfloors?\b|\bground\b/g, (s) => " ".repeat(s.length));

    /* ----- sitting ----- */
    const sm = t.match(/\b(?:sit|sits|sitting|seated|sat)\b(?:\s+(?:down\s+)?(on|in|at|by)\s+(?:the |a |an |his |her |their |my )?((?:[a-z']+ ){0,2}[a-z']+))?/);
    if (sm && !negated(sm.index)) {
      p.sit = true;
      const what = sm[2] || "";
      const k = KINDS.find((x) => x.re.test(" " + what + " "));
      if (k && sm[1] === "at" && /^(table|desk|counter|booth|coffee table)$/.test(k.id)) p.sitAt = k.id;
      else if (k && k.seat) p.sitOn = k.id;
      else if (k && /^(table|desk|counter)$/.test(k.id)) p.sitAt = k.id;
      blank(sm.index, sm[0].length - (what ? what.length : 0)); /* the thing sat on still counts as a thing in the set */
    }

    /* ----- the things ----- */
    const cls = clauses();
    const posOf = (s) => {
      let m;
      if ((m = s.match(/\b(?:next to|beside|by|near|alongside) (?:the |a |an )?([a-z]+(?: [a-z]+)?)/))) {
        const k = KINDS.find((x) => x.re.test(" " + m[1] + " "));
        if (k) return { near: k.as || k.id };
      }
      if ((m = s.match(/\b(?:on|on top of|onto|sitting on|standing on) (?:the |a |an )?([a-z]+(?: [a-z]+)?)/))) {
        const k = KINDS.find((x) => x.re.test(" " + m[1] + " "));
        if (k) return { on: k.as || k.id };
      }
      if (/\bleft\b/.test(s)) return { where: "left" };
      if (/\bright\b/.test(s)) return { where: "right" };
      if (/\bbehind\b|\bin the back(?:ground)?\b|\bat the back\b|\bbackground\b|\bfar\b/.test(s)) return { where: "behind" };
      if (/\bin front\b|\bforeground\b/.test(s)) return { where: "front" };
      if (/\bin the (?:middle|cent(?:er|re))\b|\bcent(?:er|re)d?\b/.test(s)) return { where: "middle" };
      if (/\bcorner\b/.test(s)) return { where: "corner" };
      return {};
    };
    for (const cl of cls) {
      let s = cl.text;
      for (const k of KINDS) {
        if (k.id === "car seat") continue;
        const g = new RegExp(k.re.source, "g");
        let m;
        while ((m = g.exec(s))) {
          const idx = m.index;
          const len = m[0].length;
          const before = s.slice(0, idx).trim().split(/\s+/).slice(-4);
          const neg = negated(cl.at + idx) || /\b(?:no|without)\b/.test(before.join(" "));
          s = s.slice(0, idx) + " ".repeat(len) + s.slice(idx + len);
          g.lastIndex = idx + len;
          if (neg) {
            p.notes.push("no " + k.say);
            p.props.push({ kind: k.as || k.id, no: true });
            continue;
          }
          let count = 1;
          const plural = /s\b|ves\b|es\b|\bcacti\b/.test(m[0]) && !/\b(?:glass|bus|steps|stairs|boxes|series)\b/.test(m[0]) && !/ss$/.test(m[0].trim());
          for (const w of before.slice().reverse()) {
            if (/^\d+$/.test(w)) {
              count = Number(w);
              break;
            }
            if (NUM[w] != null) {
              count = NUM[w];
              if (count === 1 && plural) count = 2;
              break;
            }
          }
          if (count === 1 && plural && !/^(stairs|curtain|road)$/.test(k.id) && !/^(?:a|an|one)$/.test(before[before.length - 1] || "")) count = /\b(?:some|few)\b/.test(before.join(" ")) ? 3 : 2;
          if (/^(stairs|curtain|fence|rug)$/.test(k.id)) count = Math.min(count, 2);
          count = clamp(count, 1, 8);
          const c = colorIn({ text: s.slice(0, idx) + m[0] + s.slice(idx + len) }, idx, len);
          const bw = before.join(" ");
          const scale = /\b(?:huge|giant|enormous|massive)\b/.test(bw) ? 1.55 : /\b(?:big|large|tall|long|grand|wide)\b/.test(bw) ? 1.3 : /\b(?:tiny|mini)\b/.test(bw) ? 0.6 : /\b(?:small|little|short|low)\b/.test(bw) ? 0.75 : 1;
          const old = /\b(?:old|dusty|rusty|broken|worn|shabby|beat up|weathered|abandoned)\b/.test(bw);
          const pos = posOf(cl.text.slice(idx + len)) || {};
          const pre = posOf(bw);
          const where = Object.assign({}, pre.where ? pre : {}, pos);
          const item = Object.assign({ kind: k.as || k.id, say: k.say, count, color: c ? c.color : null, colorWord: c ? c.word : "", scale, old, small: !!k.small, word: m[0].trim() }, where);
          if (k.id === "sign" && /stop/.test(m[0])) item.stop = true;
          if (k.id === "house" && /store|shop/.test(m[0])) item.shop = true;
          if (k.id === "curtain" && /\bred\b|\bstage\b|\bvelvet\b/.test(cl.text) && !c) item.color = 0xa01c2c;
          if (k.id === "computer" && /laptop/.test(m[0])) item.laptop = true;
          if (k.id === "plant" && /flower|vase/.test(m[0])) item.flowers = true;
          if (k.id === "table" && /picnic/.test(m[0])) item.picnic = true;
          if (k.id === "fence" && /picket|white/.test(cl.text) && !c) item.color = 0xf2f2ee;
          const same = p.props.find((x) => !x.no && x.kind === item.kind && x.color === item.color && x.scale === item.scale && !item.near && !item.on && !item.where && !x.near && !x.on && !x.where);
          if (same) same.count = clamp(same.count + count, 1, 8);
          else p.props.push(item);
        }
      }
    }
    const negKinds = new Set(p.props.filter((x) => x.no).map((x) => x.kind));
    p.props = p.props.filter((x) => !x.no);

    /* ----- inside or outside ----- */
    const kinds = new Set(p.props.map((x) => x.kind));
    if (!place) {
      const outish = [...kinds].filter((k) => OUTDOORSY.has(k)).length;
      const inish = [...kinds].filter((k) => INDOORSY.has(k)).length;
      if (outish && !inish) place = PLACES.find((x) => x.id === "outside");
    }
    if (place) p.place = place.id;
    const P = place || PLACES.find((x) => x.id === "room");
    p.indoor = !P.out && !P.car;
    p.car = !!P.car;
    p.stage = !!P.stage;
    if (P.car) p.sit = !p.standing;
    if (p.indoor) {
      if (!floorSaid && P.floor) p.floor = P.floor;
      if (!p.wallWord && P.wall != null) p.wallColor = P.wall;
      p.walls = wallsSaid != null ? wallsSaid : P.walls != null ? P.walls : 3;
      if (p.floorColor == null && P.floorColor != null) p.floorColor = P.floorColor;
    } else if (!P.car) {
      p.walls = 0;
      p.ground = floorSaid || P.ground || "grass";
      if (p.dusty && p.ground === "grass") p.groundColor = 0x7f8f4c;
      if (P.groundColor != null && p.floorColor == null) p.groundColor = P.groundColor;
      if (p.floorColor != null) p.groundColor = p.floorColor;
      p.sea = !!P.sea;
      p.hills = P.hills || (p.ground === "grass" && /\bcountry|hills?|valley\b/.test(raw) ? 0x5f8a44 : 0);
      if (P.road) p.road = P.road === "asphalt" && /\b(?:country|dirt|gravel|dusty|back|farm)\b/.test(raw) ? "dirt" : P.road;
      if (P.road && (floorSaid === "dirt" || floorSaid === "sand") && !/\bground\b/.test(raw)) (p.road = "dirt"), (p.ground = P.ground || "grass");
    }
    const sizeM = raw.match(/\b(small|tiny|cramped|little|cozy|cosy|big|large|huge|spacious|grand|wide)\s+(?:[a-z]+\s+)?(?:room|kitchen|bedroom|office|diner|bar|stage|classroom|store|garage|living room|bathroom|space|hall)\b/);
    if (sizeM) p.size = /small|tiny|cramped|little|cozy|cosy/.test(sizeM[1]) ? 0.82 : 1.3;
    /* the place's own things, unless the words said "no ..." */
    const named = p.props.filter((x) => !(P.sig || []).includes(x.kind)).length;
    const bare = /\b(?:empty|bare|only|just|nothing else)\b/.test(raw);
    const sig = (P.sig || []).slice();
    const add = (list, why) =>
      list.forEach((k) => {
        if (negKinds.has(k)) return;
        const have = p.props.filter((x) => x.kind === k).reduce((n, x) => n + x.count, 0);
        const want = list.filter((x) => x === k).length;
        if (have >= want) return;
        const ex = p.props.find((x) => x.kind === k && !x.near && !x.on);
        if (ex) ex.count++;
        else p.props.push({ kind: k, say: KIND[k].say, count: 1, color: null, colorWord: "", scale: 1, auto: why });
      });
    add(sig, "place");
    if (!bare && named <= (P.out ? 2 : 1) && P.more) add(P.more, "more");
    /* a lamp with a nightstand, desk or table near the bed is a table lamp on it */
    const lamp = p.props.find((x) => x.kind === "lamp" && !x.on);
    if (lamp && !lamp.small && p.props.some((x) => x.kind === "nightstand") && !lamp.near && !lamp.where && !p.props.some((x) => x.kind === "sofa")) (lamp.on = "nightstand"), (lamp.small = true);
    const comp = p.props.find((x) => x.kind === "computer");
    if (comp && !comp.on) comp.on = p.props.some((x) => x.kind === "desk") ? "desk" : p.props.some((x) => x.kind === "table") ? "table" : p.props.some((x) => x.kind === "counter") ? "counter" : "";
    if (comp && !comp.on && p.indoor) add(["desk"], "for the computer"), (comp.on = "desk");
    /* outside, a door or a window needs a house */
    if (!p.indoor && !p.car && p.props.some((x) => x.kind === "door" || x.kind === "window") && !p.props.some((x) => x.kind === "house" || x.kind === "barn")) {
      p.props = p.props.filter((x) => x.kind !== "door" && x.kind !== "window");
      add(["house"], "for the door");
      p.notes.push("a door or window outside goes on a house front");
    }
    /* sitting: on what */
    if (p.sit && !p.car) {
      if (!p.sitOn) {
        if (p.sitAt === "booth" || (!p.sitAt && p.props.some((x) => x.kind === "booth"))) p.sitOn = "booth";
        else if (p.sitAt === "counter") p.sitOn = "bar stool";
        else {
          const seats = ["chair", "booth", "sofa", "armchair", "bench", "bar stool", "bed"];
          p.sitOn = seats.find((k) => p.props.some((x) => x.kind === k)) || "chair";
        }
      }
      if (p.sitOn === "booth" && !p.props.some((x) => x.kind === "booth")) add(["booth"], "to sit in");
      if (!p.props.some((x) => x.kind === p.sitOn)) add([p.sitOn], "to sit on");
      if (!p.sitAt && /^(chair|bar stool)$/.test(p.sitOn)) p.sitAt = ["table", "desk", "counter"].find((k) => p.props.some((x) => x.kind === k)) || "";
      if (!p.sitAt && /^(sofa|armchair)$/.test(p.sitOn) && p.props.some((x) => x.kind === "coffee table")) p.sitAt = "coffee table";
      if (p.sitOn === "booth") p.sitAt = "booth";
    } else if (!p.standing && !p.sit && p.props.some((x) => x.kind === "booth") && p.props.length <= 6) {
      /* a booth is sat in */
      p.sit = true;
      p.sitOn = "booth";
      p.sitAt = "booth";
    }
    if (p.standing) (p.sit = false), (p.sitOn = ""), (p.sitAt = "");

    /* ----- what it read, in words ----- */
    const where = p.indoor ? `${P.say}${p.size < 1 ? " (small)" : p.size > 1 ? " (big)" : ""}` : P.say;
    said.push(where);
    if (p.indoor) {
      const fw = { checker: "checkered floor", carpet: "carpet", tile: "tile floor", wood: "wood floor", concrete: "concrete floor", stone: "stone floor", marble: "marble floor", stage: "stage floor", dirt: "dirt floor", grass: "grass floor", sand: "sand floor", snow: "snow floor", asphalt: "concrete floor" }[p.floor];
      said.push((p.floorWord ? p.floorWord + " " : "") + fw);
      if (!p.stage) said.push(p.walls === 0 ? "no walls" : `${p.walls} wall${p.walls === 1 ? "" : "s"}${p.wallWord ? " (" + p.wallWord + ")" : ""}${wallsSaid === 3 && /four|4/.test(wn ? wn[0] : "") ? " (the fourth is left open for the camera)" : ""}`);
    } else if (!p.car) {
      said.push((p.floorWord ? p.floorWord + " " : p.dusty ? "dusty " : "") + p.ground + (p.road === "dirt" ? ", a dirt road" : p.road === "asphalt" ? ", a road" : p.road === "street" ? ", a street with a sidewalk" : p.road === "path" ? ", a path" : ""));
    }
    p.props.forEach((x) => {
      if (x.auto === "place" && x.kind !== "booth") return;
      const n = x.count > 1 ? x.count + " " : /^[aeiou]/.test(x.say) ? "an " : "a ";
      const name = x.count > 1 ? (x.say === "bench" ? "benches" : x.say === "shelf" ? "shelves" : x.say === "stairs" ? "stairs" : x.say === "cactus" ? "cacti" : x.say + "s") : x.say;
      const sz = x.scale > 1.4 ? "huge " : x.scale > 1 ? "big " : x.scale < 0.7 ? "tiny " : x.scale < 1 ? "small " : "";
      const col = x.colorWord ? x.colorWord + " " : "";
      const at = x.on ? " on the " + KIND[x.on].say : x.near ? " next to the " + KIND[x.near].say : x.where === "left" ? " on the left" : x.where === "right" ? " on the right" : x.where === "behind" ? " behind" : x.where === "front" ? " in front" : x.where === "middle" ? " in the middle" : x.where === "corner" ? " in a corner" : "";
      const art = x.count > 1 ? n : /^[aeiou]/.test(sz + col + x.say) ? "an " : "a ";
      said.push(art + sz + col + (x.old ? "old " : "") + name + at + (x.auto === "more" ? " (goes with " + P.say.replace(/^(a|an) /, "the ") + ")" : ""));
    });
    const own = p.props.filter((x) => x.auto === "place" && x.kind !== "booth").map((x) => "with its " + (x.count > 1 ? x.count + " " + KIND[x.kind].say + "s" : KIND[x.kind].say));
    if (own.length) said.splice(p.indoor ? (p.stage ? 2 : 3) : 2, 0, ...own);
    if (p.time) said.push(SKY[p.time].say);
    if (p.car) said.push("sitting in the driver's seat");
    else if (p.sit) said.push(`sitting on the ${KIND[p.sitOn].say}${p.sitAt && p.sitAt !== "booth" ? " at the " + KIND[p.sitAt].say : ""}`);
    else if (p.standing) said.push("standing");
    p.notes.forEach((n) => said.push(n));
    p.said = said;
    p.found = !!(place || p.props.length || p.time);
    return p;
  }

  /* ---------- "Surprise me" ---------- */
  const pickOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function surprise() {
    const c = () => pickOf(["red", "blue", "green", "yellow", "white", "black", "brown", "orange", "teal", "pink", "gray", "navy", "mustard", "cream"]);
    const ideas = [
      () => `a ${pickOf(["small", "cozy", "big", "messy"])} kitchen with ${c()} walls, a ${pickOf(["wooden", c()])} table and ${pickOf(["two", "three", "four"])} chairs`,
      () => `a bedroom with a ${c()} bed, a lamp next to the bed and a ${c()} rug`,
      () => `a living room with a ${c()} sofa, a TV, a big plant ${pickOf(["on the left", "in the corner", "on the right"])} and a ${c()} rug`,
      () => `an office with a desk, a computer on the desk, a bookshelf and a clock`,
      () => `a diner booth with ${c()} seats and a window`,
      () => `a bar with ${pickOf(["three", "four"])} bar stools and a shelf behind the counter`,
      () => `a stage with a ${pickOf(["red", "blue", "purple", "gold"])} curtain and a microphone stand`,
      () => `a car interior`,
      () => `a ${pickOf(["dusty", "quiet", "long"])} country road with a ${pickOf(["wooden", "white picket", "broken"])} fence, a ${pickOf(["big", "tall", "small"])} tree and a mailbox`,
      () => `a city street with a streetlight, a trash can and a ${c()} car`,
      () => `a park with a bench, ${pickOf(["two", "three", "a few"])} trees and some bushes`,
      () => `a forest with a big rock and ${pickOf(["three", "four", "lots of"])} pine trees`,
      () => `a beach with two palm trees and a ${c()} umbrella`.replace(/ and a [a-z]+ umbrella/, " and a rock"),
      () => `a farm with a ${pickOf(["red", "gray", "brown"])} barn, a fence and a barrel`,
      () => `a desert with ${pickOf(["two", "three"])} cacti and some rocks`,
      () => `a backyard with a ${c()} house, a fence and a tree`,
      () => `a garage with a ${c()} car, crates and a shelf`,
      () => `a classroom with ${pickOf(["two", "three", "four"])} desks, a clock and a window`,
    ];
    const when = Math.random() < 0.7 ? " " + pickOf(["in the morning", "at noon", "at sunset", "at night"]) : "";
    const sit = Math.random() < 0.25 ? pickOf([", sitting down", ""]) : "";
    return (pickOf(ideas)() + when + sit + ".").replace(/^./, (x) => x.toUpperCase()).replace(/\ba ([aeiou])/g, "an $1");
  }

  /* ---------- building blocks: shared shapes and materials, all given back on clear ---------- */
  function kit(T) {
    const geos = new Map();
    const mats = new Map();
    const texs = [];
    const geo = (key, make) => {
      if (!geos.has(key)) geos.set(key, make());
      return geos.get(key);
    };
    const UNIT = {
      box: () => geo("box", () => new T.BoxGeometry(1, 1, 1)),
      cyl: (seg) => geo("cyl" + (seg || 20), () => new T.CylinderGeometry(0.5, 0.5, 1, seg || 20)),
      sph: (w, h) => geo("sph" + (w || 18) + "-" + (h || 12), () => new T.SphereGeometry(0.5, w || 18, h || 12)),
      cone: (seg) => geo("cone" + (seg || 18), () => new T.ConeGeometry(0.5, 1, seg || 18)),
    };
    const mat = (color, o) => {
      o = o || {};
      const key = [color, o.basic ? 1 : 0, o.glow || 0, o.rough == null ? "" : o.rough, o.metal || 0, o.map ? o.map.uuid : "", o.side || 0].join("|");
      if (mats.has(key)) return mats.get(key);
      let m;
      if (o.basic) m = new T.MeshBasicMaterial({ color, fog: o.fog !== false, side: o.side || T.FrontSide });
      else {
        m = new T.MeshStandardMaterial({ color, roughness: o.rough == null ? 0.8 : o.rough, metalness: o.metal || 0, map: o.map || null, side: o.side || T.FrontSide });
        if (o.glow) (m.emissive = new T.Color(color)), (m.emissiveIntensity = o.glow);
      }
      mats.set(key, m);
      return m;
    };
    const mesh = (g, geometry, m) => {
      const x = new T.Mesh(geometry, m);
      x.castShadow = true;
      x.receiveShadow = true;
      g.add(x);
      return x;
    };
    const K = {
      T,
      mat,
      /* a box w x h x d, its bottom at y */
      box(g, w, h, d, x, y, z, color, o) {
        const m = mesh(g, UNIT.box(), color && color.isMaterial ? color : mat(color, o));
        m.scale.set(Math.max(w, 1e-3), Math.max(h, 1e-3), Math.max(d, 1e-3));
        m.position.set(x, y + h / 2, z);
        return m;
      },
      cyl(g, r, h, x, y, z, color, o, seg) {
        const m = mesh(g, UNIT.cyl(seg), color && color.isMaterial ? color : mat(color, o));
        m.scale.set(r * 2, h, r * 2);
        m.position.set(x, y + h / 2, z);
        return m;
      },
      taper(g, rt, rb, h, x, y, z, color, o, seg) {
        const k = (rt / rb).toFixed(2);
        const m = mesh(g, geo("taper" + k + "-" + (seg || 20), () => new T.CylinderGeometry(Number(k) * 0.5, 0.5, 1, seg || 20)), color && color.isMaterial ? color : mat(color, o));
        m.scale.set(rb * 2, h, rb * 2);
        m.position.set(x, y + h / 2, z);
        return m;
      },
      sph(g, r, x, y, z, color, o, sy, seg) {
        const m = mesh(g, seg ? UNIT.sph(seg[0], seg[1]) : UNIT.sph(), color && color.isMaterial ? color : mat(color, o));
        m.scale.set(r * 2, r * 2 * (sy || 1), r * 2);
        m.position.set(x, y, z);
        return m;
      },
      cone(g, r, h, x, y, z, color, o, seg) {
        const m = mesh(g, UNIT.cone(seg), color && color.isMaterial ? color : mat(color, o));
        m.scale.set(r * 2, h, r * 2);
        m.position.set(x, y + h / 2, z);
        return m;
      },
      torus(g, R0, r, x, y, z, color, o) {
        const k = (r / R0).toFixed(3);
        const m = mesh(g, geo("torus" + k, () => new T.TorusGeometry(1, Number(k), 10, 32)), color && color.isMaterial ? color : mat(color, o));
        m.scale.setScalar(R0);
        m.position.set(x, y, z);
        return m;
      },
      /* a triangular prism along x (a roof): width w (x), base d (z), height h */
      prism(g, w, h, d, x, y, z, color, o) {
        const m = mesh(g, geo("prism", () => {
          const s = new T.Shape();
          s.moveTo(-0.5, 0);
          s.lineTo(0.5, 0);
          s.lineTo(0, 1);
          s.lineTo(-0.5, 0);
          const e = new T.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
          e.translate(0, 0, -0.5);
          e.rotateY(Math.PI / 2);
          return e;
        }), color && color.isMaterial ? color : mat(color, o));
        m.scale.set(w, h, d);
        m.position.set(x, y, z);
        return m;
      },
      tex(draw, size, rx, ry) {
        const cv = document.createElement("canvas");
        cv.width = cv.height = size || 128;
        draw(cv.getContext("2d"), cv.width);
        const t = new T.CanvasTexture(cv);
        t.wrapS = t.wrapT = T.RepeatWrapping;
        t.repeat.set(rx || 1, ry || 1);
        t.encoding = T.sRGBEncoding;
        t.anisotropy = 4;
        texs.push(t);
        return t;
      },
      dispose() {
        geos.forEach((g) => g.dispose());
        mats.forEach((m) => m.dispose());
        texs.forEach((t) => t.dispose());
        geos.clear();
        mats.clear();
        texs.length = 0;
      },
      counts: () => ({ geometries: geos.size, materials: mats.size, textures: texs.length }),
    };
    return K;
  }

  /* a seeded random, so the same words make the same set */
  function seeded(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    let s = (h >>> 0) % 2147483646 || 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }
  const hex = (c) => "#" + ("000000" + c.toString(16)).slice(-6);
  const dim = (c, k) => mixC(c, 0, k);
  const lift = (c, k) => mixC(c, 0xffffff, k);

  /* ---------- the things: each one built at its own origin, standing on y = 0, its front toward +z ----------
     Each returns { w, d, h } (its footprint and height) and may set seat (the seat's top), top (a surface things
     can stand on) and front (how far the seat's front edge is from the middle). */
  const WOOD = 0x9a6b43;
  const BUILD = {
    table(K, g, o) {
      const c = o.color != null ? o.color : WOOD;
      const w = 1.25 * o.scale;
      const d = o.tableD || 0.8 * Math.sqrt(o.scale);
      const h = o.tableH;
      K.box(g, w, 0.05, d, 0, h - 0.05, 0, c);
      K.box(g, w - 0.12, 0.06, d - 0.12, 0, h - 0.11, 0, dim(c, 0.15));
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => K.box(g, 0.06, h - 0.05, 0.06, sx * (w / 2 - 0.07), 0, sz * (d / 2 - 0.07), dim(c, 0.1))));
      if (o.picnic) [-1, 1].forEach((sz) => K.box(g, w, 0.04, 0.26, 0, o.seatH - 0.04, sz * (d / 2 + 0.22), c));
      return { w, d: o.picnic ? d + 0.7 : d, h, top: h };
    },
    "coffee table"(K, g, o) {
      const c = o.color != null ? o.color : 0x6a4a30;
      const w = 1.0 * o.scale;
      const d = 0.55;
      const h = 0.42;
      K.box(g, w, 0.05, d, 0, h - 0.05, 0, c);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => K.box(g, 0.05, h - 0.05, 0.05, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06), dim(c, 0.15))));
      K.box(g, w - 0.1, 0.03, d - 0.1, 0, 0.1, 0, dim(c, 0.1));
      return { w, d, h, top: h };
    },
    chair(K, g, o) {
      const c = o.color != null ? o.color : WOOD;
      const s = o.seatH;
      const w = 0.46;
      const d = clamp(o.depth || 0.42, 0.3, 0.5) + 0.04;
      K.box(g, w, 0.05, d, 0, s - 0.05, 0, c);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => K.box(g, 0.045, s - 0.05, 0.045, sx * (w / 2 - 0.04), 0, sz * (d / 2 - 0.04), dim(c, 0.12))));
      [-1, 1].forEach((sx) => K.box(g, 0.045, 0.48, 0.045, sx * (w / 2 - 0.04), s, -d / 2 + 0.04, dim(c, 0.12)));
      K.box(g, w, 0.2, 0.04, 0, s + 0.26, -d / 2 + 0.04, c);
      return { w, d, h: s + 0.48, seat: s, front: d / 2 };
    },
    armchair(K, g, o) {
      const c = o.color != null ? o.color : 0x8a5a4a;
      const s = o.seatH;
      const w = 0.9;
      const d = clamp(o.depth || 0.5, 0.3, 0.6) + 0.2;
      K.box(g, w, Math.max(0.1, s - 0.18), d, 0, 0.06, 0, c);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => K.cyl(g, 0.03, 0.06, sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08), 0x2a2420)));
      K.box(g, w - 0.34, 0.12, d - 0.2, 0, s - 0.12, 0.1, lift(c, 0.1));
      [-1, 1].forEach((sx) => K.box(g, 0.17, s + 0.2 - 0.06, d, sx * (w / 2 - 0.085), 0.06, 0, c));
      K.box(g, w, s + 0.42, 0.2, 0, 0.06, -d / 2 + 0.1, c);
      return { w, d, h: s + 0.48, seat: s, front: d / 2 };
    },
    sofa(K, g, o) {
      const c = o.color != null ? o.color : 0x5a7aa0;
      const s = o.seatH;
      const w = 2.0 * Math.min(o.scale, 1.2);
      const d = clamp(o.depth || 0.55, 0.3, 0.65) + 0.22;
      K.box(g, w, Math.max(0.1, s - 0.18), d, 0, 0.06, 0, c);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => K.cyl(g, 0.03, 0.06, sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08), 0x2a2420)));
      const n = w > 1.6 ? 3 : 2;
      const cw = (w - 0.36) / n;
      for (let i = 0; i < n; i++) K.box(g, cw - 0.02, 0.12, d - 0.22, -w / 2 + 0.18 + cw * (i + 0.5), s - 0.12, 0.11, lift(c, 0.1));
      [-1, 1].forEach((sx) => K.box(g, 0.18, s + 0.16 - 0.06, d, sx * (w / 2 - 0.09), 0.06, 0, c));
      K.box(g, w, s + 0.44, 0.22, 0, 0.06, -d / 2 + 0.11, c);
      return { w, d, h: s + 0.5, seat: s, front: d / 2 };
    },
    bed(K, g, o) {
      const c = o.color != null ? o.color : 0x6a8fc8;
      const s = clamp(o.seatH, 0.3, 0.6);
      const w = 1.45 * Math.min(o.scale, 1.3);
      const d = 2.05;
      K.box(g, w, 0.28, d, 0, 0.06, 0, WOOD);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => K.box(g, 0.08, 0.06, 0.08, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06), dim(WOOD, 0.2))));
      K.box(g, w - 0.04, s - 0.34 - 0.04, d - 0.08, 0, 0.34, 0.02, 0xf2f0ea);
      K.box(g, w + 0.04, 0.06, d * 0.66, 0, s - 0.06, d * 0.17, c);
      K.box(g, w + 0.04, 0.2, 0.02, 0, s - 0.2, d / 2 + 0.01, c);
      [-1, 1].forEach((sx) => K.box(g, w * 0.36, 0.1, 0.32, sx * w * 0.22, s - 0.04, -d / 2 + 0.28, 0xffffff));
      K.box(g, w + 0.06, 1.0, 0.08, 0, 0, -d / 2 + 0.02, dim(WOOD, 0.1));
      return { w: w + 0.06, d: d + 0.04, h: 1.0, seat: s, front: d / 2 };
    },
    nightstand(K, g, o) {
      const c = o.color != null ? o.color : 0xb08058;
      const w = 0.45;
      const d = 0.4;
      const h = 0.55;
      K.box(g, w, h, d, 0, 0, 0, c);
      K.box(g, w - 0.06, 0.012, 0.01, 0, h * 0.55, d / 2, dim(c, 0.4));
      K.sph(g, 0.018, 0, h * 0.72, d / 2 + 0.01, 0xd9a838);
      return { w, d, h, top: h };
    },
    door(K, g, o) {
      const c = o.color != null ? o.color : 0x8a5a36;
      const w = 0.9;
      const h = 2.05;
      K.box(g, w + 0.16, h + 0.08, 0.04, 0, 0, 0.02, 0xf2efe6);
      K.box(g, w, h, 0.05, 0, 0, 0.04, c);
      [0.35, 1.15].forEach((y) => K.box(g, w - 0.24, 0.6, 0.01, 0, y, 0.07, dim(c, 0.12)));
      K.sph(g, 0.035, w / 2 - 0.1, 1.0, 0.1, 0xd9a838, { metal: 0.6, rough: 0.3 });
      return { w: w + 0.16, d: 0.1, h: h + 0.08, y0: 0 };
    },
    window(K, g, o) {
      const c = o.color != null ? o.color : 0xf4f2ea;
      const w = 1.1 * o.scale;
      const h = 1.1;
      const y0 = 0.98;
      const glass = K.mat(o.sky, { basic: true });
      K.box(g, w, h, 0.02, 0, y0, 0.01, glass);
      const t = 0.06;
      K.box(g, w + t, t, 0.07, 0, y0 - t / 2, 0.035, c);
      K.box(g, w + t, t, 0.07, 0, y0 + h - t / 2, 0.035, c);
      [-1, 1].forEach((sx) => K.box(g, t, h, 0.07, sx * (w / 2), y0, 0.035, c));
      K.box(g, 0.035, h, 0.04, 0, y0, 0.03, c);
      K.box(g, w, 0.035, 0.04, 0, y0 + h / 2, 0.03, c);
      K.box(g, w + 0.2, 0.04, 0.16, 0, y0 - 0.06, 0.08, c);
      if (o.curtain != null)
        [-1, 1].forEach((sx) => {
          for (let i = 0; i < 3; i++) K.cyl(g, 0.055, h + 0.25, sx * (w / 2 + 0.06 + i * 0.075), y0 - 0.1, 0.13, o.curtain);
        });
      if (o.curtain != null) K.cyl(g, 0.015, w + 0.7, 0, y0 + h + 0.15, 0.13, 0x4a3a2a).rotation.z = Math.PI / 2;
      return { w: o.curtain != null ? w + 0.55 : w + 0.2, d: 0.2, h: y0 + h + 0.2, y0: y0 - 0.05 };
    },
    counter(K, g, o) {
      const c = o.color != null ? o.color : 0xd8d2c4;
      const w = 2.0 * o.scale;
      const d = 0.62;
      const h = o.counterH || 0.92;
      K.box(g, w, h - 0.04 - 0.08, d - 0.04, 0, 0.08, -0.02, c);
      K.box(g, w - 0.04, 0.08, d - 0.1, 0, 0, -0.05, 0x2a2622);
      K.box(g, w + 0.02, 0.04, d, 0, h - 0.04, 0, o.top != null ? o.top : 0x5a5650);
      const n = Math.max(1, Math.round(w / 0.5));
      for (let i = 1; i < n; i++) K.box(g, 0.012, h - 0.24, 0.01, -w / 2 + (w / n) * i, 0.12, d / 2 - 0.035, dim(c, 0.35));
      for (let i = 0; i < n; i++) K.box(g, 0.1, 0.02, 0.02, -w / 2 + (w / n) * (i + 0.5), h - 0.2, d / 2 - 0.025, 0x9a9a9a, { metal: 0.6, rough: 0.3 });
      return { w: w + 0.02, d, h, top: h };
    },
    fridge(K, g, o) {
      const c = o.color != null ? o.color : 0xeeeeea;
      const w = 0.75;
      const d = 0.7;
      const h = 1.8;
      K.box(g, w, h - 0.05, d, 0, 0.05, 0, c, { rough: 0.35 });
      K.box(g, w - 0.04, 0.05, d - 0.06, 0, 0, -0.02, 0x2a2622);
      K.box(g, w, 0.012, 0.012, 0, 1.18, d / 2, dim(c, 0.35));
      [0.65, 1.45].forEach((y) => K.box(g, 0.03, 0.3, 0.04, -w / 2 + 0.08, y, d / 2 + 0.02, 0xa8adb4, { metal: 0.6, rough: 0.3 }));
      return { w, d: d + 0.04, h };
    },
    stove(K, g, o) {
      const c = o.color != null ? o.color : 0xf0efea;
      const w = 0.75;
      const d = 0.64;
      const h = 0.92;
      K.box(g, w, h - 0.03, d, 0, 0, 0, c, { rough: 0.4 });
      K.box(g, w, 0.03, d, 0, h - 0.03, 0, 0x1e1e22);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => K.cyl(g, 0.09, 0.012, sx * 0.17, h, sz * 0.14, 0x3a3a3e)));
      K.box(g, w - 0.14, 0.34, 0.01, 0, 0.18, d / 2, 0x2a2a30);
      K.box(g, w - 0.2, 0.025, 0.04, 0, 0.6, d / 2 + 0.02, 0xa8adb4, { metal: 0.6, rough: 0.3 });
      K.box(g, w, 0.16, 0.06, 0, h, -d / 2 + 0.03, c);
      return { w, d, h: h + 0.16 };
    },
    sink(K, g, o) {
      const c = o.color != null ? o.color : 0xd8d2c4;
      const w = 0.85;
      const d = 0.6;
      const h = o.counterH || 0.9;
      K.box(g, w, h - 0.04, d - 0.04, 0, 0, -0.02, c);
      K.box(g, w, 0.04, d, 0, h - 0.04, 0, 0xeeeeee);
      K.box(g, w * 0.6, 0.012, d * 0.5, 0, h, 0.02, 0x9aa0a8, { metal: 0.6, rough: 0.3 });
      K.cyl(g, 0.018, 0.26, 0, h, -d / 2 + 0.09, 0xc4c7cc, { metal: 0.7, rough: 0.25 });
      K.box(g, 0.03, 0.03, 0.16, 0, h + 0.23, -d / 2 + 0.16, 0xc4c7cc, { metal: 0.7, rough: 0.25 });
      K.box(g, 0.012, h - 0.2, 0.01, 0, 0.1, d / 2 - 0.015, dim(c, 0.35));
      return { w, d, h: h + 0.26, top: h, wallH: h };
    },
    lamp(K, g, o) {
      const c = o.color != null ? o.color : 0xf2e6c8;
      const glow = o.lit ? 0.9 : 0.15;
      if (o.small) {
        K.taper(g, 0.05, 0.08, 0.03, 0, 0, 0, 0x5a4a3a);
        K.cyl(g, 0.015, 0.26, 0, 0.03, 0, 0x5a4a3a);
        K.taper(g, 0.08, 0.13, 0.16, 0, 0.24, 0, c, { glow, rough: 0.9 });
        return { w: 0.26, d: 0.26, h: 0.42, lightAt: 0.3 };
      }
      K.cyl(g, 0.16, 0.03, 0, 0, 0, 0x3a3630);
      K.cyl(g, 0.017, 1.3, 0, 0.03, 0, 0x3a3630, { metal: 0.5, rough: 0.4 });
      K.taper(g, 0.13, 0.22, 0.3, 0, 1.25, 0, c, { glow, rough: 0.9 });
      return { w: 0.44, d: 0.44, h: 1.55, lightAt: 1.32 };
    },
    tree(K, g, o) {
      const s = o.scale * (o.indoor ? 0.55 : 1);
      const leaf = o.color != null ? o.color : o.time === "sunset" ? 0x4a7a3a : 0x3f8a46;
      if (o.indoor) K.taper(g, 0.24, 0.18, 0.4, 0, 0, 0, 0xb0603a);
      const y0 = o.indoor ? 0.38 : 0;
      K.taper(g, 0.09 * s, 0.17 * s, 1.9 * s, 0, y0, 0, 0x6b4a2f, { rough: 0.95 }, 10);
      const r = o.rnd;
      [
        [0, 2.5, 0, 1.0],
        [0.55, 2.15, 0.2, 0.75],
        [-0.5, 2.2, -0.15, 0.78],
        [0.1, 2.0, -0.5, 0.7],
        [-0.15, 2.95, 0.15, 0.7],
      ].forEach(([x, y, z, rr]) => K.sph(g, rr * s * (0.9 + r() * 0.2), x * s, y0 + y * s, z * s, mixC(leaf, 0, r() * 0.15), { rough: 0.9 }, 0.85, [12, 9]));
      return { w: 2.1 * s, d: 2.0 * s, h: y0 + 3.6 * s, trunk: 0.3 * s };
    },
    pine(K, g, o) {
      const s = o.scale * (o.indoor ? 0.55 : 1);
      const leaf = o.color != null ? o.color : 0x2f6a3a;
      K.cyl(g, 0.12 * s, 0.8 * s, 0, 0, 0, 0x5a3e28, null, 10);
      [
        [1.1, 1.5, 0.5],
        [0.85, 1.3, 1.25],
        [0.6, 1.1, 1.95],
      ].forEach(([rr, h, y]) => K.cone(g, rr * s, h * s, 0, y * s, 0, leaf, { rough: 0.9 }, 12));
      return { w: 2.2 * s, d: 2.2 * s, h: 3.1 * s, trunk: 0.25 * s };
    },
    palm(K, g, o) {
      const s = o.scale;
      const leaf = o.color != null ? o.color : 0x4a9a3a;
      let x = 0;
      for (let i = 0; i < 7; i++) {
        const seg = K.taper(g, 0.11 * s, 0.14 * s, 0.55 * s, x, i * 0.5 * s, 0, 0x8a6a48, { rough: 0.95 }, 10);
        seg.rotation.z = -0.05;
        x += 0.03 * s;
      }
      const top = 3.5 * s;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const f = K.box(g, 1.3 * s, 0.03, 0.28 * s, x + Math.cos(a) * 0.6 * s, top - 0.2 * s, Math.sin(a) * 0.6 * s, leaf);
        f.rotation.y = -a;
        f.rotation.z = -0.35;
      }
      K.sph(g, 0.16 * s, x, top, 0, 0x6a4a2a);
      return { w: 2.8 * s, d: 2.8 * s, h: top + 0.3 * s, trunk: 0.3 * s };
    },
    bush(K, g, o) {
      const s = o.scale;
      const c = o.color != null ? o.color : 0x3f7a3a;
      K.sph(g, 0.45 * s, 0, 0.38 * s, 0, c, { rough: 0.9 }, 0.85, [12, 9]);
      K.sph(g, 0.35 * s, 0.38 * s, 0.3 * s, 0.1 * s, dim(c, 0.08), { rough: 0.9 }, 0.85, [12, 9]);
      K.sph(g, 0.33 * s, -0.36 * s, 0.28 * s, -0.05 * s, lift(c, 0.06), { rough: 0.9 }, 0.85, [12, 9]);
      return { w: 1.5 * s, d: 0.95 * s, h: 0.78 * s };
    },
    fence(K, g, o) {
      const c = o.color != null ? o.color : 0x8a6a48;
      const L = o.length || 6;
      const n = Math.max(2, Math.round(L / 1.6) + 1);
      const h = 1.05 * Math.min(o.scale, 1.3);
      const picket = c === 0xf2f2ee;
      for (let i = 0; i < n; i++) K.box(g, 0.1, h + 0.05, 0.1, -L / 2 + (L / (n - 1)) * i, 0, 0, dim(c, 0.08));
      if (picket) {
        const m = Math.round(L / 0.16);
        for (let i = 0; i < m; i++) K.box(g, 0.08, h - 0.05, 0.025, -L / 2 + 0.08 + (L - 0.16) * (i / (m - 1)), 0, 0.065, c);
      }
      [0.35, 0.8].forEach((y) => K.box(g, L, 0.09, 0.04, 0, y * h, 0.06, c));
      return { w: L, d: 0.16, h: h + 0.05 };
    },
    car(K, g, o) {
      const c = o.color != null ? o.color : 0x3a6ab0;
      const s = Math.min(o.scale, 1.3);
      const L = 4.0 * s;
      const W = 1.75;
      K.box(g, W, 0.55, L, 0, 0.3, 0, c, { rough: 0.35, metal: 0.3 });
      K.box(g, W - 0.12, 0.5, L * 0.52, 0, 0.85, -L * 0.06, c, { rough: 0.35, metal: 0.3 });
      const glass = 0x2a3440;
      K.box(g, W - 0.1, 0.36, L * 0.5 - 0.06, 0, 0.9, -L * 0.06, glass, { rough: 0.2 }).scale.x = W - 0.08;
      K.box(g, W - 0.08, 0.04, L * 0.52, 0, 1.33, -L * 0.06, c, { rough: 0.35, metal: 0.3 });
      [-1, 1].forEach((sx) =>
        [-1, 1].forEach((sz) => {
          const wh = K.cyl(g, 0.33, 0.24, sx * (W / 2 - 0.08), 0, sz * (L / 2 - 0.75), 0x1e1e22, { rough: 0.9 }, 18);
          wh.rotation.z = Math.PI / 2;
          wh.position.y = 0.33;
          const hub = K.cyl(g, 0.15, 0.25, sx * (W / 2 - 0.08), 0, sz * (L / 2 - 0.75), 0xc4c7cc, { metal: 0.6, rough: 0.3 }, 12);
          hub.rotation.z = Math.PI / 2;
          hub.position.y = 0.33;
        })
      );
      [-1, 1].forEach((sx) => K.box(g, 0.3, 0.12, 0.03, sx * 0.55, 0.6, L / 2, 0xfff2c0, { basic: true }));
      [-1, 1].forEach((sx) => K.box(g, 0.25, 0.1, 0.03, sx * 0.6, 0.62, -L / 2, 0xc8302c, { basic: true }));
      return { w: W, d: L, h: 1.37 };
    },
    bench(K, g, o) {
      const c = o.color != null ? o.color : 0x8a5a36;
      const s = o.seatH;
      const w = 1.5 * Math.min(o.scale, 1.4);
      const D = clamp(o.depth || 0.42, 0.3, 0.5);
      [-1, 0, 1].forEach((i) => K.box(g, w, 0.035, D / 3 - 0.02, 0, s - 0.035, (i * D) / 3, c));
      [0.18, 0.34].forEach((y) => K.box(g, w, 0.1, 0.03, 0, s + y, -D / 2 - 0.03, c));
      [-1, 1].forEach((sx) => {
        K.box(g, 0.05, s - 0.035, D, sx * (w / 2 - 0.12), 0, 0, 0x2a2a2e, { metal: 0.5, rough: 0.5 });
        K.box(g, 0.05, 0.5, 0.05, sx * (w / 2 - 0.12), s - 0.035, -D / 2 - 0.02, 0x2a2a2e, { metal: 0.5, rough: 0.5 });
      });
      return { w, d: D + 0.1, h: s + 0.48, seat: s, front: D / 2 };
    },
    sign(K, g, o) {
      const s = o.scale;
      K.cyl(g, 0.04, 2.1 * s, 0, 0, 0, 0x9a9aa0, { metal: 0.6, rough: 0.4 }, 10);
      if (o.stop) {
        const p = K.cyl(g, 0.34, 0.03, 0, 0, 0.04, 0xc8302c, null, 8);
        p.rotation.x = Math.PI / 2;
        p.rotation.y = Math.PI / 8;
        p.position.y = 2.1 * s;
        const r = K.cyl(g, 0.27, 0.035, 0, 0, 0.04, 0xf2f2ee, null, 8);
        r.rotation.x = Math.PI / 2;
        r.position.y = 2.1 * s;
        r.scale.y = 0.005;
        return { w: 0.7, d: 0.2, h: 2.45 * s };
      }
      const c = o.color != null ? o.color : 0x2a7a4a;
      K.box(g, 0.9 * s, 0.5 * s, 0.04, 0, 1.75 * s, 0.05, c);
      K.box(g, 0.78 * s, 0.38 * s, 0.01, 0, 1.81 * s, 0.075, lift(c, 0.75));
      return { w: 0.9 * s, d: 0.2, h: 2.25 * s };
    },
    mailbox(K, g, o) {
      const c = o.color != null ? o.color : 0x3a3c42;
      K.box(g, 0.09, 1.0, 0.09, 0, 0, 0, 0x8a6a48);
      K.box(g, 0.24, 0.16, 0.46, 0, 1.0, 0, c, { metal: 0.4, rough: 0.5 });
      const top = K.cyl(g, 0.12, 0.46, 0, 0, 0, c, { metal: 0.4, rough: 0.5 }, 16);
      top.rotation.x = Math.PI / 2;
      top.position.set(0, 1.16, 0);
      K.box(g, 0.02, 0.22, 0.05, 0.13, 1.08, -0.1, 0xc8302c);
      return { w: 0.3, d: 0.5, h: 1.3 };
    },
    shelf(K, g, o) {
      const c = o.color != null ? o.color : 0x8a5a36;
      const w = 0.95 * o.scale;
      const d = 0.35;
      const h = 1.8 * Math.min(o.scale, 1.2);
      const t = 0.035;
      [-1, 1].forEach((sx) => K.box(g, t, h, d, sx * (w / 2 - t / 2), 0, 0, c));
      K.box(g, w, h, 0.02, 0, 0, -d / 2 + 0.01, dim(c, 0.2));
      const n = 5;
      const r = o.rnd;
      const book = [0xc8302c, 0x2f6fe0, 0x3c9a46, 0xd9a838, 0x7d4bbf, 0xefe6cc, 0x1e1e22, 0xec7a23];
      for (let i = 0; i < n; i++) {
        const y = (h / n) * i;
        K.box(g, w - 2 * t, t, d, 0, y, 0, c);
        if (i === n - 1 && h > 1.5) continue;
        let x = -w / 2 + t + 0.02;
        while (x < w / 2 - t - 0.06) {
          const bw = 0.03 + r() * 0.04;
          const bh = (h / n - t) * (0.6 + r() * 0.3);
          if (r() < 0.12) {
            x += bw + 0.03;
            continue;
          }
          K.box(g, bw, bh, d * 0.75, x + bw / 2, y + t, 0.01, book[Math.floor(r() * book.length)]);
          x += bw + 0.004;
        }
      }
      K.box(g, w, t, d, 0, h - t, 0, c);
      return { w, d, h, top: h };
    },
    tv(K, g, o) {
      const c = o.color != null ? o.color : 0x3a2e26;
      const w = 1.3;
      const d = 0.45;
      K.box(g, w, 0.48, d, 0, 0, 0, c);
      K.box(g, w - 0.08, 0.01, 0.01, 0, 0.24, d / 2, dim(c, 0.4));
      K.box(g, 0.3, 0.04, 0.2, 0, 0.48, 0, 0x1e1e22);
      K.box(g, 0.05, 0.1, 0.05, 0, 0.52, 0, 0x1e1e22);
      K.box(g, 1.1 * Math.min(o.scale, 1.3), 0.64 * Math.min(o.scale, 1.3), 0.05, 0, 0.6, 0, 0x16161a, { rough: 0.3 });
      K.box(g, 1.04 * Math.min(o.scale, 1.3), 0.58 * Math.min(o.scale, 1.3), 0.005, 0, 0.63, 0.027, o.lit ? 0x6a8ab0 : 0x2a3440, { basic: true });
      return { w, d, h: 0.6 + 0.64 * Math.min(o.scale, 1.3) };
    },
    rug(K, g, o) {
      const c = o.color != null ? o.color : 0xa0503a;
      const w = 2.2 * o.scale;
      const d = 1.5 * o.scale;
      K.box(g, w, 0.012, d, 0, 0.001, 0, c, { rough: 1 });
      K.box(g, w - 0.24, 0.002, d - 0.24, 0, 0.013, 0, lift(c, 0.3), { rough: 1 });
      K.box(g, w - 0.36, 0.002, d - 0.36, 0, 0.015, 0, c, { rough: 1 });
      return { w, d, h: 0.017, flat: true };
    },
    stairs(K, g, o) {
      const c = o.color != null ? o.color : 0xa87a4a;
      const n = 9;
      const rise = 0.19;
      const run = 0.28;
      const W = 1.0;
      const L = n * run;
      for (let i = 0; i < n; i++) K.box(g, run, rise * (i + 1), W, -L / 2 + run * (i + 0.5), 0, 0, i % 2 ? c : dim(c, 0.06));
      for (let i = 0; i <= n; i += 3) K.box(g, 0.05, 0.9, 0.05, -L / 2 + run * Math.max(0.5, i - 0.5), rise * Math.max(1, i), W / 2 - 0.04, 0x5a3a22);
      const rail = K.box(g, Math.hypot(L, rise * n), 0.05, 0.06, 0, 0, W / 2 - 0.04, 0x5a3a22);
      rail.position.set(-L / 2 + L / 2, rise * n / 2 + 0.9 + rise / 2, W / 2 - 0.04);
      rail.rotation.z = Math.atan2(rise * n, L);
      return { w: L, d: W, h: rise * n + 0.95 };
    },
    curtain(K, g, o) {
      /* a stage curtain: folds along the back */
      const c = o.color != null ? o.color : 0xa01c2c;
      const w = o.length || 6;
      const h = 3.6;
      const n = Math.round(w / 0.24);
      for (let i = 0; i < n; i++) K.cyl(g, 0.15, h, -w / 2 + 0.12 + (w - 0.24) * (i / (n - 1)), 0, (i % 2) * 0.06, i % 2 ? c : dim(c, 0.12), { rough: 0.85 }, 10);
      K.box(g, w + 0.2, 0.45, 0.25, 0, h - 0.45, 0.14, dim(c, 0.05));
      return { w, d: 0.42, h };
    },
    microphone(K, g, o) {
      const h = o.mouth || 1.4;
      K.cyl(g, 0.15, 0.025, 0, 0, 0, 0x1e1e22, { metal: 0.5, rough: 0.4 }, 16);
      K.cyl(g, 0.012, h - 0.12, 0, 0.025, 0, 0x2a2a2e, { metal: 0.6, rough: 0.3 }, 8);
      const m = K.cyl(g, 0.022, 0.15, 0, 0, 0, 0x1e1e22, { metal: 0.4, rough: 0.4 }, 12);
      m.rotation.x = -0.9;
      m.position.set(0, h - 0.06, -0.06);
      K.sph(g, 0.032, 0, h - 0.02, -0.12, 0x8a8d93, { metal: 0.5, rough: 0.5 }, 1, [10, 8]);
      return { w: 0.3, d: 0.3, h };
    },
    barn(K, g, o) {
      const c = o.color != null ? o.color : 0xa8322a;
      const s = Math.min(o.scale, 1.3);
      const w = 6 * s;
      const d = 5 * s;
      const h = 3.2 * s;
      K.box(g, w, h, d, 0, 0, 0, c, { rough: 0.9 });
      K.prism(g, w + 0.3, 2.2 * s, d + 0.3, 0, h, 0, 0x4a4a50, { rough: 0.9 }).scale.set(d + 0.3, 2.2 * s, w + 0.3);
      g.children[g.children.length - 1].rotation.y = Math.PI / 2;
      const tr = 0xf2f2ee;
      K.box(g, 2.2 * s, 2.4 * s, 0.05, 0, 0, d / 2 + 0.02, dim(c, 0.12));
      K.box(g, 2.3 * s, 0.1, 0.06, 0, 2.4 * s, d / 2 + 0.03, tr);
      [-1, 1].forEach((sx) => K.box(g, 0.1, 2.4 * s, 0.06, sx * 1.15 * s, 0, d / 2 + 0.03, tr));
      [-1, 1].forEach((sx) => {
        const b = K.box(g, 0.08, 3.2 * s, 0.05, 0, 0, d / 2 + 0.05, tr);
        b.rotation.z = sx * Math.atan2(2.2, 2.4);
        b.position.y = 1.2 * s;
        b.scale.y = Math.hypot(2.2, 2.4) * s;
      });
      K.box(g, 1.0 * s, 0.8 * s, 0.05, 0, h + 0.3 * s, d / 2 + 0.17, 0x2a2420);
      return { w: w + 0.3, d: d + 0.3, h: h + 2.2 * s };
    },
    house(K, g, o) {
      const c = o.color != null ? o.color : o.shop ? 0xc89a6a : [0xe8d8b0, 0xb8c8d8, 0xd8b0a0, 0xc8d8b8][Math.floor(o.rnd() * 4)];
      const w = 6.5 * Math.min(o.scale, 1.3);
      const h = 3.4;
      const d = 0.5;
      K.box(g, w, h, d, 0, 0, 0, c, { rough: 0.9 });
      K.box(g, w + 0.2, 0.2, 0.2, 0, 0, d / 2 + 0.1, dim(c, 0.3));
      const roof = K.prism(g, 1, 1.6, 1, 0, h, -0.6, 0x7a3a2a, { rough: 0.9 });
      roof.scale.set(w + 0.4, 1.6, 2.2);
      roof.position.set(0, h, -0.6);
      const door = 0x6a3a22;
      K.box(g, 1.0, 2.1, 0.06, -w * 0.18, 0.2, d / 2 + 0.03, 0xf2efe6);
      K.box(g, 0.86, 2.0, 0.08, -w * 0.18, 0.2, d / 2 + 0.04, o.door != null ? o.door : door);
      K.sph(g, 0.04, -w * 0.18 + 0.3, 1.2, d / 2 + 0.1, 0xd9a838);
      K.box(g, 1.4, 0.2, 0.5, -w * 0.18, 0, d / 2 + 0.25, 0x9a9a94);
      const glass = K.mat(o.lit ? 0xf2c870 : o.sky, { basic: true });
      [w * 0.12, w * 0.34].forEach((x) => {
        K.box(g, 1.0, 1.0, 0.03, x, 1.2, d / 2 + 0.015, glass);
        K.box(g, 1.1, 0.07, 0.06, x, 1.15, d / 2 + 0.03, 0xf4f2ea);
        K.box(g, 1.1, 0.07, 0.06, x, 2.18, d / 2 + 0.03, 0xf4f2ea);
        [-1, 1].forEach((sx) => K.box(g, 0.07, 1.0, 0.06, x + sx * 0.52, 1.2, d / 2 + 0.03, 0xf4f2ea));
        K.box(g, 0.04, 1.0, 0.05, x, 1.2, d / 2 + 0.03, 0xf4f2ea);
      });
      if (o.shop) K.box(g, w * 0.5, 0.5, 0.08, w * 0.1, 2.6, d / 2 + 0.05, 0x2a7a4a);
      /* the roof reaches 1.7 m back and the step 0.75 m out: the footprint covers both */
      return { w: w + 0.4, d: 3.5, h: h + 1.6 };
    },
    streetlight(K, g, o) {
      const c = o.color != null ? o.color : 0x2a2e34;
      K.cyl(g, 0.1, 0.3, 0, 0, 0, c, { metal: 0.5, rough: 0.5 }, 12);
      K.cyl(g, 0.05, 3.6, 0, 0.3, 0, c, { metal: 0.5, rough: 0.5 }, 10);
      K.box(g, 0.06, 0.06, 0.7, 0, 3.8, 0.32, c, { metal: 0.5, rough: 0.5 });
      K.box(g, 0.28, 0.1, 0.42, 0, 3.72, 0.62, c, { metal: 0.5, rough: 0.5 });
      K.box(g, 0.24, 0.02, 0.36, 0, 3.7, 0.62, 0xfff2c0, o.lit ? { basic: true } : { glow: 0.1 });
      return { w: 0.4, d: 0.4, h: 3.95, lightAt: [0, 3.6, 0.62] };
    },
    rock(K, g, o) {
      const s = o.scale;
      const c = o.color != null ? o.color : 0x8a8680;
      const r = o.rnd;
      K.sph(g, 0.5 * s, 0, 0.26 * s, 0, c, { rough: 1 }, 0.62, [7, 5]).rotation.y = r() * 3;
      K.sph(g, 0.32 * s, 0.4 * s, 0.16 * s, 0.15 * s, dim(c, 0.08), { rough: 1 }, 0.6, [6, 5]).rotation.y = r() * 3;
      return { w: 1.4 * s, d: 1.05 * s, h: 0.6 * s };
    },
    desk(K, g, o) {
      const c = o.color != null ? o.color : 0xb08a5a;
      const w = 1.3 * o.scale;
      const d = 0.65;
      const h = o.tableH;
      K.box(g, w, 0.04, d, 0, h - 0.04, 0, c);
      K.box(g, 0.42, h - 0.04, d - 0.04, w / 2 - 0.23, 0, 0, dim(c, 0.08));
      [0.25, 0.55].forEach((f) => K.box(g, 0.34, 0.01, 0.01, w / 2 - 0.23, h * f, d / 2 - 0.015, dim(c, 0.45)));
      [-1, 1].forEach((sz) => K.box(g, 0.05, h - 0.04, 0.05, -w / 2 + 0.05, 0, sz * (d / 2 - 0.05), dim(c, 0.15)));
      K.box(g, w - 0.5, 0.25, 0.02, -0.2, h - 0.3, -d / 2 + 0.02, dim(c, 0.12));
      return { w, d, h, top: h };
    },
    computer(K, g, o) {
      const c = o.color != null ? o.color : 0x2a2a30;
      if (o.laptop) {
        K.box(g, 0.34, 0.02, 0.24, 0, 0, 0.02, c, { metal: 0.4, rough: 0.4 });
        const lid = K.box(g, 0.34, 0.24, 0.015, 0, 0, -0.1, c, { metal: 0.4, rough: 0.4 });
        lid.rotation.x = -0.25;
        lid.position.y = 0.13;
        K.box(g, 0.3, 0.2, 0.002, 0, 0.03, -0.09, o.lit ? 0x9ac0e8 : 0x4a6a8a, { basic: true }).rotation.x = -0.25;
        g.children[g.children.length - 1].position.y = 0.135;
        return { w: 0.36, d: 0.3, h: 0.26 };
      }
      K.box(g, 0.22, 0.015, 0.16, 0, 0, -0.08, c);
      K.box(g, 0.04, 0.16, 0.03, 0, 0.015, -0.1, c);
      K.box(g, 0.56, 0.36, 0.035, 0, 0.13, -0.08, c);
      K.box(g, 0.52, 0.32, 0.003, 0, 0.15, -0.061, o.lit ? 0x9ac0e8 : 0x4a6a8a, { basic: true });
      K.box(g, 0.44, 0.02, 0.14, 0, 0, 0.14, 0xd8d8d4);
      return { w: 0.56, d: 0.42, h: 0.49 };
    },
    plant(K, g, o) {
      const s = o.scale;
      const pot = 0xb0603a;
      const c = o.color != null && !o.flowers ? o.color : 0x3f8a46;
      K.taper(g, 0.17 * s, 0.12 * s, 0.32 * s, 0, 0, 0, pot);
      const r = o.rnd;
      if (o.flowers) {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const x = Math.cos(a) * 0.08 * s;
          const z = Math.sin(a) * 0.08 * s;
          K.cyl(g, 0.008, 0.3 * s, x, 0.3 * s, z, 0x3c7a3a, null, 6);
          K.sph(g, 0.05 * s, x, 0.62 * s, z, o.color != null ? o.color : [0xe8448c, 0xf2cf3a, 0xf2f2ee][i % 3], null, 1, [8, 6]);
        }
        return { w: 0.4 * s, d: 0.4 * s, h: 0.68 * s };
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + r();
        K.sph(g, 0.17 * s, Math.cos(a) * 0.12 * s, (0.48 + r() * 0.25) * s, Math.sin(a) * 0.12 * s, mixC(c, 0, r() * 0.2), { rough: 0.9 }, 1.4, [8, 6]);
      }
      return { w: 0.5 * s, d: 0.5 * s, h: 0.9 * s };
    },
    clock(K, g, o) {
      const c = o.color != null ? o.color : 0x3a2e26;
      const r = 0.18 * o.scale;
      const y = 2.0;
      const f = K.cyl(g, r, 0.04, 0, 0, 0.02, c, null, 24);
      f.rotation.x = Math.PI / 2;
      f.position.y = y;
      const face = K.cyl(g, r * 0.86, 0.045, 0, 0, 0.025, 0xf6f2e6, null, 24);
      face.rotation.x = Math.PI / 2;
      face.position.y = y;
      K.box(g, 0.012, r * 0.55, 0.01, 0, y, 0.05, 0x1e1e22);
      const h = K.box(g, 0.014, r * 0.4, 0.01, 0, y, 0.052, 0x1e1e22);
      h.rotation.z = -1.2;
      h.position.set(r * 0.18, y + r * 0.07, 0.052);
      return { w: 2 * r, d: 0.06, h: y + r, y0: y - r };
    },
    picture(K, g, o) {
      const r = o.rnd;
      const w = 0.7 * o.scale;
      const h = 0.52 * o.scale;
      const y = 1.25;
      const fc = o.color != null ? o.color : 0x3a2a1e;
      K.box(g, w, h, 0.03, 0, y, 0.015, fc);
      const art = [0x7aa0c8, 0xe8b070, 0x8ab070, 0xc87a7a, 0xb8a0d8][Math.floor(r() * 5)];
      K.box(g, w - 0.08, h - 0.08, 0.005, 0, y + 0.04, 0.032, art, { rough: 1 });
      K.box(g, w - 0.08, (h - 0.08) * 0.4, 0.006, 0, y + 0.04, 0.034, dim(art, 0.25), { rough: 1 });
      K.sph(g, 0.05 * o.scale, w * 0.18, y + h * 0.66, 0.036, 0xf6e6a0, null, 1, [8, 6]);
      return { w, d: 0.05, h: y + h, y0: y };
    },
    mirror(K, g, o) {
      const c = o.color != null ? o.color : 0xd9a838;
      const w = 0.6 * o.scale;
      const h = 0.85 * o.scale;
      const y = 1.05;
      K.box(g, w, h, 0.03, 0, y, 0.015, c, { metal: 0.4, rough: 0.4 });
      K.box(g, w - 0.08, h - 0.08, 0.005, 0, y + 0.04, 0.032, 0xc8dce6, { rough: 0.05, metal: 0.8 });
      return { w, d: 0.05, h: y + h, y0: y };
    },
    booth(K, g, o) {
      /* one booth seat with a high back, as wide as a table */
      const c = o.color != null ? o.color : 0xb8302c;
      const s = o.seatH;
      const w = 1.4 * Math.min(o.scale, 1.3);
      const d = clamp(o.depth || 0.45, 0.3, 0.55) + 0.2;
      K.box(g, w, s - 0.1, d - 0.24, 0, 0, 0.08, 0xd8d2c4);
      K.box(g, w, 0.1, d - 0.2, 0, s - 0.1, 0.1, c, { rough: 0.5 });
      K.box(g, w, s + 0.75, 0.2, 0, 0, -d / 2 + 0.1, c, { rough: 0.5 });
      K.box(g, w, 0.05, 0.24, 0, s + 0.75, -d / 2 + 0.1, 0xc4c7cc, { metal: 0.6, rough: 0.3 });
      return { w, d, h: s + 0.8, seat: s, front: d / 2 };
    },
    "bar stool"(K, g, o) {
      const c = o.color != null ? o.color : 0xb8302c;
      const s = o.seatH;
      K.cyl(g, 0.2, 0.03, 0, 0, 0, 0x9a9aa0, { metal: 0.6, rough: 0.3 }, 18);
      K.cyl(g, 0.03, s - 0.1, 0, 0.03, 0, 0xc4c7cc, { metal: 0.6, rough: 0.3 }, 10);
      if (s > 0.55) K.torus(g, 0.15, 0.012, 0, s * 0.42, 0, 0xc4c7cc, { metal: 0.6, rough: 0.3 }).rotation.x = Math.PI / 2;
      K.cyl(g, 0.2, 0.08, 0, s - 0.08, 0, c, { rough: 0.5 }, 20);
      return { w: 0.42, d: 0.42, h: s, seat: s, front: 0.2 };
    },
    crate(K, g, o) {
      const c = o.color != null ? o.color : 0xb88a58;
      const s = 0.6 * o.scale;
      K.box(g, s, s, s, 0, 0, 0, c, { rough: 0.95 });
      [-1, 1].forEach((sz) => [0.08, s - 0.08].forEach((y) => K.box(g, s + 0.01, 0.06, 0.01, 0, y - 0.03, sz * (s / 2 + 0.003), dim(c, 0.2))));
      [-1, 1].forEach((sx) => K.box(g, 0.01, s, s + 0.01, sx * (s / 2 + 0.003), 0, 0, dim(c, 0.1)));
      return { w: s + 0.02, d: s + 0.02, h: s, top: s };
    },
    barrel(K, g, o) {
      const c = o.color != null ? o.color : 0x8a5a36;
      const s = o.scale;
      K.taper(g, 0.27 * s, 0.31 * s, 0.45 * s, 0, 0.45 * s, 0, c, { rough: 0.9 });
      K.taper(g, 0.31 * s, 0.27 * s, 0.45 * s, 0, 0, 0, c, { rough: 0.9 });
      [0.1, 0.45, 0.8].forEach((y) => K.torus(g, 0.3 * s, 0.035, 0, y * s, 0, 0x3a3a3e, { metal: 0.5, rough: 0.5 }).rotation.x = Math.PI / 2);
      return { w: 0.68 * s, d: 0.68 * s, h: 0.9 * s, top: 0.9 * s };
    },
    "trash can"(K, g, o) {
      const c = o.color != null ? o.color : 0x6a7078;
      K.taper(g, 0.28, 0.24, 0.85, 0, 0, 0, c, { metal: 0.4, rough: 0.5 });
      K.taper(g, 0.06, 0.3, 0.1, 0, 0.85, 0, dim(c, 0.1), { metal: 0.4, rough: 0.5 });
      return { w: 0.62, d: 0.62, h: 0.97 };
    },
    hydrant(K, g, o) {
      const c = o.color != null ? o.color : 0xc8302c;
      K.cyl(g, 0.16, 0.06, 0, 0, 0, c);
      K.cyl(g, 0.12, 0.55, 0, 0.06, 0, c);
      K.sph(g, 0.12, 0, 0.62, 0, c, null, 0.8);
      [-1, 1].forEach((sx) => {
        const n = K.cyl(g, 0.05, 0.12, 0, 0, 0, c);
        n.rotation.z = Math.PI / 2;
        n.position.set(sx * 0.16, 0.42, 0);
      });
      return { w: 0.4, d: 0.32, h: 0.72 };
    },
    cactus(K, g, o) {
      const s = o.scale;
      const c = o.color != null ? o.color : 0x4a8a4a;
      K.cyl(g, 0.17 * s, 1.6 * s, 0, 0, 0, c, null, 12);
      K.sph(g, 0.17 * s, 0, 1.6 * s, 0, c, null, 1, [12, 8]);
      [-1, 1].forEach((sx, i) => {
        const y = (0.7 + i * 0.25) * s;
        const a = K.cyl(g, 0.1 * s, 0.3 * s, 0, 0, 0, c, null, 10);
        a.rotation.z = Math.PI / 2;
        a.position.set(sx * 0.3 * s, y, 0);
        K.cyl(g, 0.1 * s, 0.45 * s, sx * 0.42 * s, y, 0, c, null, 10);
        K.sph(g, 0.1 * s, sx * 0.42 * s, y + 0.45 * s, 0, c, null, 1, [10, 6]);
      });
      return { w: 1.05 * s, d: 0.4 * s, h: 1.8 * s };
    },
    piano(K, g, o) {
      const c = o.color != null ? o.color : 0x16161a;
      const w = 1.5;
      const d = 0.6;
      K.box(g, w, 1.25, 0.32, 0, 0, -d / 2 + 0.16, c, { rough: 0.25 });
      K.box(g, w, 0.08, 0.3, 0, 0.7, 0.13, c, { rough: 0.25 });
      K.box(g, w - 0.1, 0.03, 0.18, 0, 0.78, 0.15, 0xf6f4ee);
      for (let i = 0; i < 18; i++) K.box(g, 0.025, 0.02, 0.1, -w / 2 + 0.12 + i * 0.075, 0.81, 0.1, 0x111111);
      [-1, 1].forEach((sx) => K.box(g, 0.06, 0.7, 0.06, sx * (w / 2 - 0.05), 0, 0.24, c, { rough: 0.25 }));
      return { w, d, h: 1.25 };
    },
    fireplace(K, g, o) {
      const c = o.color != null ? o.color : 0xa0503a;
      const w = 1.5;
      const d = 0.5;
      const h = 1.25;
      K.box(g, w, h, d, 0, 0, 0, c, { rough: 0.95 });
      K.box(g, 0.8, 0.7, 0.02, 0, 0.1, d / 2, 0x16120e);
      K.cone(g, 0.18, 0.4, -0.1, 0.12, d / 2 - 0.05, 0xf08a2a, { basic: true }, 10);
      K.cone(g, 0.12, 0.3, 0.14, 0.12, d / 2 - 0.05, 0xf6c040, { basic: true }, 10);
      K.box(g, w + 0.2, 0.08, d + 0.12, 0, h, 0.06, 0xefe6cc);
      return { w: w + 0.2, d: d + 0.12, h: h + 0.08, top: h + 0.08 };
    },
    "car seat"(K, g, o) {
      const c = o.color != null ? o.color : 0x3a3c42;
      const s = o.seatH;
      const w = 0.55;
      const d = clamp(o.depth || 0.45, 0.3, 0.55) + 0.1;
      K.box(g, w - 0.1, s - 0.12, d - 0.1, 0, 0, 0, 0x1e1e22);
      K.box(g, w, 0.13, d, 0, s - 0.13, 0.02, c, { rough: 0.7 });
      const back = K.box(g, w, 0.62, 0.14, 0, s - 0.05, -d / 2 + 0.02, c, { rough: 0.7 });
      back.rotation.x = -0.18;
      K.box(g, 0.28, 0.2, 0.12, 0, s + 0.62, -d / 2 - 0.07, c, { rough: 0.7 }).rotation.x = -0.18;
      return { w, d, h: s + 0.82, seat: s, front: d / 2 + 0.02 };
    },
  };
  BUILD.lamp.small = true;

  /* where each kind goes: "wall" against a wall, "mount" on a wall, "center" in the room, "side" near the
     character, "far" outside in the distance, "flat" on the floor, "top" on top of another thing */
  const ROLE = {
    table: "center", "coffee table": "center", chair: "side", armchair: "side", sofa: "wall", bed: "wall", nightstand: "wall", door: "mount", window: "mount", counter: "wall", fridge: "wall",
    stove: "wall", sink: "wall", lamp: "side", tree: "far", pine: "far", palm: "far", bush: "side", fence: "line", car: "far", bench: "side", sign: "side", mailbox: "side", shelf: "wall",
    tv: "wall", rug: "flat", stairs: "wall", curtain: "mount", microphone: "front", barn: "far", house: "far", streetlight: "side", rock: "side", desk: "wall", computer: "top", plant: "side",
    clock: "mount", picture: "mount", mirror: "mount", booth: "wall", "bar stool": "side", crate: "side", barrel: "side", "trash can": "side", hydrant: "side", cactus: "far", piano: "wall",
    fireplace: "wall", "car seat": "side",
  };
  /* bigger things are placed first */
  const ORDER = ["booth", "bed", "nightstand", "fence", "sofa", "counter", "fridge", "stove", "sink", "fireplace", "piano", "shelf", "stairs", "desk", "tv", "door", "window", "barn", "house", "car", "table", "coffee table", "armchair", "bench", "tree", "pine", "palm", "cactus", "chair", "bar stool", "streetlight", "bush", "rock", "crate", "barrel", "trash can", "hydrant", "mailbox", "sign", "lamp", "plant", "microphone", "picture", "clock", "mirror", "curtain", "rug", "computer"];

  /* ---------- the floor, walls and sky ---------- */
  const FLOOR_COLOR = { wood: 0xa8784a, checker: 0xf2efe6, carpet: 0x8a6a5a, tile: 0xd8dcd8, concrete: 0x9a9a94, stone: 0x8a8680, marble: 0xe8e6e0, stage: 0x8a5a36, dirt: 0x8a6a48, grass: 0x6a9a4a, sand: 0xe0c890, snow: 0xf2f4f8, asphalt: 0x4a4c50 };
  function floorTexture(K, kind, color, w, d) {
    const c = hex(color);
    const c2 = hex(dim(color, 0.18));
    if (kind === "checker")
      return K.tex(
        (g, n) => {
          g.fillStyle = c;
          g.fillRect(0, 0, n, n);
          g.fillStyle = color === 0xf2efe6 ? "#26262a" : c2;
          g.fillRect(0, 0, n / 2, n / 2);
          g.fillRect(n / 2, n / 2, n / 2, n / 2);
        },
        64,
        w / 0.6,
        d / 0.6
      );
    if (kind === "tile" || kind === "marble" || kind === "stone")
      return K.tex(
        (g, n) => {
          g.fillStyle = c;
          g.fillRect(0, 0, n, n);
          g.strokeStyle = hex(dim(color, 0.25));
          g.lineWidth = 3;
          g.strokeRect(0, 0, n, n);
        },
        64,
        w / (kind === "stone" ? 0.8 : 0.4),
        d / (kind === "stone" ? 0.8 : 0.4)
      );
    if (kind === "wood" || kind === "stage")
      return K.tex(
        (g, n) => {
          g.fillStyle = c;
          g.fillRect(0, 0, n, n);
          for (let i = 0; i < 8; i++) {
            g.fillStyle = hex(i % 2 ? dim(color, 0.06) : lift(color, 0.04));
            g.fillRect(0, (i * n) / 8, n, n / 8);
            g.fillStyle = hex(dim(color, 0.3));
            g.fillRect(0, (i * n) / 8, n, 1.5);
            g.fillRect(((i * 37) % 8) * (n / 8), (i * n) / 8, 1.5, n / 8);
          }
        },
        128,
        w / 1.6,
        d / 1.6
      );
    return null;
  }
  function skyDome(K, root, time) {
    const T = K.T;
    const sky = SKY[time] || SKY.noon;
    const geo = new T.SphereGeometry(48, 24, 12);
    const top = new T.Color(sky.top);
    const mid = new T.Color(sky.mid);
    const low = new T.Color(sky.low);
    const col = [];
    const pos = geo.attributes.position;
    const c = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 48;
      if (y > 0.25) c.copy(mid).lerp(top, Math.min(1, (y - 0.25) / 0.6));
      else c.copy(low).lerp(mid, clamp((y + 0.05) / 0.3, 0, 1));
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new T.Float32BufferAttribute(col, 3));
    const m = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false });
    const dome = new T.Mesh(geo, m);
    dome.name = "set sky";
    dome.renderOrder = -10;
    dome.userData.sky = true;
    root.add(dome);
    return { dome, own: [geo, m] };
  }

  /* ---------- laying out the set ---------- */
  /* cast: everyone on the floor, actor 1 first: [{ x, z, yaw, fig, sit, i, actor }] (one at the middle, facing
     front, when nobody else is staged). Each one's fig is measured in its own frame. */
  function build(ctx, plan, fig, text, cast) {
    const T = ctx.THREE;
    cast = cast && cast.length ? cast : [{ primary: true, i: 0, x: 0, z: 0, yaw: 0, fig, sit: true }];
    const staged = cast.length > 1;
    /* a point in someone's own frame (x to their left, z ahead) to the floor of the scene */
    const toW = (c, lx, lz) => [c.x + lx * Math.cos(c.yaw) + lz * Math.sin(c.yaw), c.z - lx * Math.sin(c.yaw) + lz * Math.cos(c.yaw)];
    const rectW = (c, r) => {
      const pts = [toW(c, r.x0, r.z0), toW(c, r.x1, r.z0), toW(c, r.x0, r.z1), toW(c, r.x1, r.z1)];
      return { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), z0: Math.min(...pts.map((p) => p[1])), z1: Math.max(...pts.map((p) => p[1])) };
    };
    /* how far the group reaches to the sides of the picture */
    const spanX = Math.max(...cast.map((c) => Math.abs(c.x) + c.fig.halfW));
    const K = kit(T);
    const rnd = seeded(text || "");
    const root = new T.Group();
    root.name = "set";
    root.userData.sketch = true; /* rig/snapshot.js draws these too */
    const extra = new T.Group(); /* the sky: not drawn in the sketch look */
    extra.name = "set sky";
    const own = [];
    const out = { root, extra, K, own, pieces: [], walls: [], lights: [], plan, fig, seat: null, table: null, notes: [], room: null };
    const time = plan.time || (plan.indoor ? "noon" : "noon");
    const skyC = SKY[time];
    const night = time === "night";
    const lit = night || time === "sunset";
    out.sky = plan.indoor && !plan.time ? null : skyC.mid;
    const S = plan.size;
    const room = plan.car
      ? { x0: -1.3, x1: 0.6, z0: -1.2, z1: 1.3, H: 1.4 }
      : plan.indoor
      ? { x0: -2.7 * S, x1: 2.7 * S, z0: plan.sitOn === "booth" && plan.sit && fig.person && !staged ? fig.seatFront - (fig.seatDepth + 0.2) - 0.02 : -2.3 * S, z1: 1.9 * S, H: 2.6 }
      : { x0: -20, x1: 20, z0: -20, z1: 3.2, H: 0 };
    out.room = room;
    const placed = []; /* { x0, x1, z0, z1, kind, flat } */
    const onWall = { back: [], left: [], right: [] }; /* along the wall: { a0, a1, y0, y1 } */
    const keep = [];
    cast.forEach((c) => c.fig.keep.forEach((r) => keep.push(rectW(c, r))));
    const opts = (x, extraO) => Object.assign({ color: x.color, scale: x.scale || 1, rnd, sky: night ? 0x1c2848 : skyC.low, time, seatH: fig.seatH, tableH: fig.tableH, lit, indoor: plan.indoor, small: x.small, stop: x.stop, shop: x.shop, laptop: x.laptop, flowers: x.flowers, picnic: x.picnic, mouth: fig.mouth }, extraO || {});
    const make = (kind, o) => {
      const g = new T.Group();
      g.name = "set " + kind;
      const info = BUILD[kind](K, g, o);
      if (o.old) g.traverse((m) => m.isMesh && !m.material.isMeshBasicMaterial && (m.material = K.mat(mixC(m.material.color.getHex(), 0x8a7a64, 0.3), { rough: 0.95 })));
      g.userData = Object.assign({ setPiece: kind }, info);
      g.traverse((m) => m.isMesh && (m.userData.setPiece = kind));
      return g;
    };
    const rectOf = (x, z, rot, w, d) => {
      const c = Math.abs(Math.cos(rot));
      const sn = Math.abs(Math.sin(rot));
      const W = c < 1e-9 ? d : sn < 1e-9 ? w : c * w + sn * d;
      const D = c < 1e-9 ? w : sn < 1e-9 ? d : sn * w + c * d;
      return { x0: x - W / 2, x1: x + W / 2, z0: z - D / 2, z1: z + D / 2 };
    };
    const hit = (a, b, gap) => a.x0 < b.x1 + gap && a.x1 > b.x0 - gap && a.z0 < b.z1 + gap && a.z1 > b.z0 - gap;
    const inside = (r) => r.x0 >= room.x0 - 1e-6 && r.x1 <= room.x1 + 1e-6 && r.z0 >= room.z0 - 1e-6 && r.z1 <= room.z1 - 0.02;
    const free = (r, piece) =>
      inside(r) &&
      !placed.some((p) => (p.road ? !piece.onRoad && !piece.flat && hit(r, p, 0.15) : !(p.flat || piece.flat) && hit(r, p, 0.04))) &&
      (piece.flat || piece.anyKeep || !keep.some((k) => hit(r, k, 0.02)));
    const commit = (g, x, z, rot, r, piece) => {
      g.position.set(x, piece.y || 0, z);
      g.rotation.y = rot;
      root.add(g);
      const p = Object.assign({ kind: g.userData.setPiece, obj: g, flat: !!piece.flat }, r);
      placed.push(p);
      out.pieces.push(p);
      return p;
    };
    /* walls: back (z0, faces +z), left (x0, faces +x), right (x1, faces -x) */
    const WALLS = {
      back: { has: plan.walls >= 1, rot: 0, at: (a, depth) => [a, room.z0 + depth / 2], a0: room.x0, a1: room.x1 },
      left: { has: plan.walls >= 2, rot: Math.PI / 2, at: (a, depth) => [room.x0 + depth / 2, a], a0: room.z0, a1: room.z1 - 0.35 },
      right: { has: plan.walls >= 3, rot: -Math.PI / 2, at: (a, depth) => [room.x1 - depth / 2, a], a0: room.z0, a1: room.z1 - 0.35 },
    };
    const wallOrder = (where) => (where === "left" ? ["left", "back", "right"] : where === "right" ? ["right", "back", "left"] : where === "behind" ? ["back", "left", "right"] : ["back", "left", "right"]).filter((k) => WALLS[k].has);
    /* along a wall, from a preferred spot outward */
    const along = (wk, w, where, anchor) => {
      const W = WALLS[wk];
      const lo = W.a0 + 0.1 + w / 2;
      const hi = W.a1 - 0.1 - w / 2;
      if (hi < lo) return [];
      let pref = anchor != null ? anchor : wk === "back" ? (where === "left" ? lo : where === "right" ? hi : (lo + hi) / 2 + (rnd() - 0.5) * 0.8) : (lo + hi) / 2 - 0.4;
      if (where === "corner") pref = rnd() < 0.5 ? lo : hi;
      const out2 = [];
      for (let a = lo; a <= hi + 1e-6; a += 0.05) out2.push(a);
      return out2.sort((p, q) => Math.abs(p - pref) - Math.abs(q - pref));
    };
    const wallFree = (wk, a0, a1, y0, y1) => !onWall[wk].some((o) => a0 < o.a1 + 0.05 && a1 > o.a0 - 0.05 && y0 < o.y1 && y1 > o.y0);
    function placeOnWall(g, piece, where, anchor, mount) {
      const info = g.userData;
      for (const wk of wallOrder(where)) {
        const W = WALLS[wk];
        for (const a of along(wk, info.w, where, anchor)) {
          const depth = mount ? info.d : info.d;
          const [x, z] = W.at(a, mount ? 0 : depth);
          const r = mount ? null : rectOf(x, z, W.rot, info.w, info.d);
          const y0 = info.y0 != null ? info.y0 : 0;
          const y1 = info.wallH || info.h;
          if (!wallFree(wk, a - info.w / 2, a + info.w / 2, y0, y1)) continue;
          if (mount) {
            if (piece.door) {
              const clear = rectOf(...W.at(a, 1.4), W.rot, info.w, 1.3);
              if (!free(clear, {})) continue;
              placed.push(Object.assign({ kind: "door space" }, clear));
            }
            g.position.set(x, 0, z);
            g.rotation.y = W.rot;
            wallGroups[wk].add(g);
            onWall[wk].push({ a0: a - info.w / 2, a1: a + info.w / 2, y0, y1 });
            const p = Object.assign({ kind: info.setPiece, obj: g, mount: wk, flat: true }, rectOf(x, z, W.rot, info.w, 0.05));
            out.pieces.push(p);
            return p;
          }
          if (!free(r, piece)) continue;
          onWall[wk].push({ a0: a - info.w / 2, a1: a + info.w / 2, y0, y1 });
          const p = commit(g, x, z, W.rot, r, piece);
          p.wall = wk;
          return p;
        }
      }
      return null;
    }
    /* anywhere on the floor, nearest to a spot first */
    function placeNear(g, piece, ax, az, rots, opts2) {
      opts2 = opts2 || {};
      const info = g.userData;
      const step = opts2.step || 0.1;
      const cands = [];
      const span = opts2.span || 6;
      for (let x = ax - span; x <= ax + span + 1e-6; x += step)
        for (let z = az - span; z <= az + span + 1e-6; z += step) {
          let cost = Math.hypot(x - ax, z - az);
          if (!opts2.front && z > 0.35 && Math.abs(x) < Math.max(1.3, spanX + 0.65) + info.w / 2 && info.h > 0.6) cost += 50; /* keep the camera's view of the character clear */
          cands.push([cost, x, z]);
        }
      cands.sort((p, q) => p[0] - q[0]);
      for (const [cost, x, z] of cands) {
        if (cost >= 50 && !opts2.front) break;
        for (const rot of rots) {
          const r = rectOf(x, z, rot, info.w, info.d);
          if (free(r, piece)) return commit(g, x, z, rot, r, piece);
        }
      }
      return null;
    }
    const facing = (x, z, tx, tz) => {
      const a = Math.atan2(tx - x, tz - z);
      return Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
    };
    const wallGroups = {};

    /* ----- the floor ----- */
    if (plan.car) buildCar(K, root, plan, fig, out, opts);
    else if (plan.indoor) {
      const fk = plan.floor === "asphalt" ? "concrete" : plan.floor;
      const fc = plan.floorColor != null ? plan.floorColor : FLOOR_COLOR[fk] || 0xa8784a;
      const fw = room.x1 - room.x0;
      const fd = room.z1 - room.z0;
      const tex = floorTexture(K, fk, fc, fw, fd);
      if (plan.stage) {
        const stageFront = room.z1;
        const fl = K.box(root, fw + 2, 0.9, fd + 1.2, 0, -0.9, room.z0 + (fd + 1.2) / 2 - 1.2 + 0.0, tex ? K.mat(0xffffff, { map: tex, rough: 0.85 }) : fc);
        fl.position.z = (room.z0 - 1.2 + stageFront) / 2;
        fl.scale.z = stageFront - room.z0 + 1.2;
        fl.name = "set floor";
        K.box(root, fw + 2, 0.9, 0.04, 0, -0.9, stageFront + 0.02, 0x2a1a14);
        K.box(root, 40, 0.02, 20, 0, -0.92, stageFront + 10, 0x1a1a1e);
        for (let x = room.x0; x <= room.x1 + 1e-6; x += 0.6) K.box(root, 0.16, 0.06, 0.08, x, 0, stageFront - 0.06, 0x2a2a2e).userData.foot = true;
        for (let x = room.x0; x <= room.x1 + 1e-6; x += 0.6) K.box(root, 0.12, 0.02, 0.02, x, 0.03, stageFront - 0.1, 0xfff2c0, { basic: true });
      } else {
        const fl = K.box(root, fw, 0.06, fd, (room.x0 + room.x1) / 2, -0.06, (room.z0 + room.z1) / 2, tex ? K.mat(0xffffff, { map: tex, rough: plan.floor === "marble" ? 0.3 : 0.85 }) : fc);
        fl.name = "set floor";
      }
      /* walls, each in its own group so it (and what hangs on it) can be cut away when the camera is outside */
      const wc = plan.wallColor;
      const H = room.H;
      const mk = (name, w, x, z, rot, n) => {
        const g = new T.Group();
        g.name = "set wall " + name;
        g.position.set(x, 0, z);
        g.rotation.y = rot;
        root.add(g);
        K.box(g, w, H, 0.1, 0, 0, -0.05, wc, { rough: 0.95 });
        K.box(g, w, 0.1, 0.02, 0, 0, 0.01, dim(wc, 0.35));
        wallGroups[name] = g;
        out.walls.push({ name, obj: g, n, p: new T.Vector3(x, 0, z) });
      };
      if (WALLS.back.has) mk("back", room.x1 - room.x0 + 0.2, (room.x0 + room.x1) / 2, room.z0, 0, new T.Vector3(0, 0, 1));
      if (WALLS.left.has) mk("left", room.z1 - room.z0, room.x0, (room.z0 + room.z1) / 2, Math.PI / 2, new T.Vector3(1, 0, 0));
      if (WALLS.right.has) mk("right", room.z1 - room.z0, room.x1, (room.z0 + room.z1) / 2, -Math.PI / 2, new T.Vector3(-1, 0, 0));
      /* group positions are the wall's middle; things on walls are placed in room coordinates, so they go
         in a plain group per wall that only follows the cut-away */
      Object.keys(wallGroups).forEach((k) => {
        const holder = new T.Group();
        holder.name = "set on wall " + k;
        root.add(holder);
        out.walls.find((w) => w.name === k).also = holder;
        wallGroups[k] = holder;
      });
    } else {
      /* outside: the ground, a road, the sky, hills or the sea */
      const gk = plan.ground || "grass";
      const gc = plan.groundColor != null ? plan.groundColor : FLOOR_COLOR[gk] || 0x6a9a4a;
      const geo = new T.CircleGeometry(46, 48);
      own.push(geo);
      const ground = new T.Mesh(geo, K.mat(night ? dim(gc, 0.25) : time === "sunset" ? dim(gc, 0.2) : gc, { rough: 1 }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.002;
      ground.receiveShadow = true;
      ground.name = "set ground";
      root.add(ground);
      if (plan.road) {
        const rc = plan.road === "dirt" ? (plan.dusty ? 0xc8aa78 : 0xa8885e) : plan.road === "path" ? 0xc8b48a : 0x4a4c50;
        const rw = plan.road === "street" ? 7 : plan.road === "path" ? 1.6 : 3.4;
        const rz = plan.road === "street" ? 1.1 + rw / 2 : 0.1;
        const road = K.box(root, 90, 0.004, rw, 0, -0.002, rz, rc, { rough: 1 });
        road.receiveShadow = true;
        road.castShadow = false;
        road.name = "set road";
        placed.push({ kind: "road", x0: -45, x1: 45, z0: rz - rw / 2, z1: rz + rw / 2, road: true });
        if (plan.road === "asphalt" || plan.road === "street") for (let x = -30; x <= 30; x += 3) K.box(root, 1.5, 0.002, 0.12, x, 0.002, rz + (plan.road === "street" ? 1.6 : 0), 0xf2e6a0, { rough: 1 }).castShadow = false;
        if (plan.road === "street") {
          /* the character stands on the sidewalk; the street runs in front, the houses behind */
          const z0 = -2.6;
          const z1 = rz - rw / 2;
          const walk = K.box(root, 90, 0.003, z1 - z0, 0, -0.001, (z0 + z1) / 2, 0xb8b6ae, { rough: 1 });
          walk.castShadow = false;
          walk.name = "set sidewalk";
          K.box(root, 90, 0.004, 0.2, 0, -0.001, z1 - 0.1, 0x8a8a84, { rough: 1 }).castShadow = false;
          for (let x = -30; x <= 30; x += 1.5) K.box(root, 0.02, 0.004, z1 - z0, x, -0.001, (z0 + z1) / 2, 0x9a9a94).castShadow = false;
          out.sidewalk = { z0, z1 };
        }
        out.road = { z0: rz - rw / 2, z1: rz + rw / 2, kind: plan.road };
      }
      if (plan.sea) {
        const sea = K.box(root, 120, 0.02, 60, 0, -0.03, -36, night ? 0x14284a : time === "sunset" ? 0x4a6a9a : 0x2a7ab0, { rough: 0.2 });
        sea.castShadow = false;
        placed.push({ kind: "sea", x0: -60, x1: 60, z0: -66, z1: -6, flat: false });
      }
      if (plan.hills)
        for (let i = 0; i < 7; i++) {
          const x = -36 + i * 12 + rnd() * 5;
          K.sph(root, 7 + rnd() * 5, x, -2, -36 - rnd() * 6, night ? dim(plan.hills, 0.6) : plan.hills, { rough: 1 }, 0.45, [16, 8]).castShadow = false;
        }
      /* the sun or the moon, low in the sky */
      if (time === "sunset") K.sph(extra, 2.4, -14, 4.5, -40, 0xffd27a, { basic: true, fog: false }).castShadow = false;
      if (night) K.sph(extra, 1.6, 16, 18, -36, 0xf2f0e0, { basic: true, fog: false }).castShadow = false;
      const d = skyDome(K, extra, time);
      own.push(...d.own);
    }

    /* ----- the seat and the table for a sitting person ----- */
    const items = [];
    plan.props.forEach((x) => {
      for (let i = 0; i < x.count; i++) items.push(Object.assign({}, x, { n: i }));
    });
    const take = (kind) => {
      const i = items.findIndex((x) => x.kind === kind);
      return i < 0 ? null : items.splice(i, 1)[0];
    };
    /* everyone staged who is a person sits (or those picked with CurioRigSets.sitters), each on a seat of their
       own sized to their body, behind them in their own frame; two or more at one table share it, between them */
    const sitters = plan.sit && !plan.car ? cast.filter((c) => c.fig.person && c.sit !== false) : [];
    out.seats = [];
    if (sitters.length) {
      const seat0 = take(plan.sitOn) || { kind: plan.sitOn, color: null, scale: 1 };
      const at = plan.sitAt && plan.sitAt !== "booth" ? take(plan.sitAt) || { kind: plan.sitAt, color: null, scale: 1 } : plan.sitAt === "booth" ? take("table") || { kind: "table", color: null, scale: 1 } : null;
      const tk = at ? (at.kind === "coffee table" ? "coffee table" : at.kind === "counter" ? "counter" : at.kind === "desk" ? "desk" : "table") : "";
      const share = at && sitters.length > 1 && tk === "table" && plan.sitOn !== "bed";
      sitters.forEach((c, n) => {
        const f = c.fig;
        const seatItem = n === 0 ? seat0 : take(plan.sitOn) || seat0;
        let g;
        let lz;
        let lrot = 0;
        let dLocal;
        if (plan.sitOn === "bed") {
          /* sat on its long side */
          g = make("bed", opts(seatItem, { seatH: f.seatH }));
          lz = f.seatFront - g.userData.w / 2;
          lrot = Math.PI / 2;
          dLocal = g.userData.w;
        } else {
          g = make(plan.sitOn, opts(seatItem, { color: seatItem.color, depth: f.seatDepth, seatH: f.seatH }));
          /* the seat's front edge just behind the knees */
          lz = f.seatFront - g.userData.front;
          dLocal = g.userData.d;
        }
        const [x, z] = toW(c, 0, lz);
        const rot = lrot + c.yaw;
        const seat = commit(g, x, z, rot, rectOf(x, z, rot, g.userData.w, g.userData.d), { anyKeep: true });
        seat.seatTop = g.userData.seat;
        const rec = { cast: c, fig: f, frame: { x: c.x, z: c.z, yaw: c.yaw }, seat, table: null, local: { z0: lz - dLocal / 2, z1: f.seatFront + 0.5 } };
        if (at && !share) {
          const tg = make(tk, opts(at, { tableH: f.tableSit, counterH: f.tableSit }));
          const d2 = tg.userData.d;
          const tz = tk === "coffee table" ? f.seatFront + 0.45 + d2 / 2 : f.tableFront + d2 / 2;
          const trot = (tk === "counter" || tk === "desk" ? Math.PI : 0) + c.yaw;
          const [tx, tzw] = toW(c, 0, tz);
          rec.table = commit(tg, tx, tzw, trot, rectOf(tx, tzw, trot, tg.userData.w, d2), { anyKeep: true });
          rec.table.top = tg.userData.top;
          rec.table.d = d2;
          rec.table.seated = true;
          rec.local.z1 = tz + d2 / 2;
        }
        out.seats.push(rec);
      });
      if (share) {
        /* one table between them: as deep as the gap in front of the first two, as high as suits them all */
        const [a, b] = sitters;
        const gap = Math.hypot(b.x - a.x, b.z - a.z);
        const front = (a.fig.tableFront + b.fig.tableFront) / 2;
        const h = sitters.reduce((t, c) => t + c.fig.tableSit, 0) / sitters.length;
        const tg = make("table", opts(at, { tableH: h, tableD: clamp(gap - 2 * front, 0.45, 1.4) }));
        const mx = sitters.reduce((t, c) => t + c.x, 0) / sitters.length;
        const mz = sitters.reduce((t, c) => t + c.z, 0) / sitters.length;
        const trot = Math.atan2(b.x - a.x, b.z - a.z);
        const table = commit(tg, mx, mz, trot, rectOf(mx, mz, trot, tg.userData.w, tg.userData.d), { anyKeep: true });
        table.top = tg.userData.top;
        table.d = tg.userData.d;
        table.seated = true;
        table.shared = true;
        out.seats.forEach((r) => (r.table = table));
      }
      /* each sitting person keeps the space from their seat to their table; the others keep their own spot */
      keep.length = 0;
      cast.forEach((c) => {
        const r = out.seats.find((x) => x.cast === c);
        if (r) keep.push(rectW(c, { x0: -0.45, x1: 0.45, z0: r.local.z0, z1: r.local.z1 }));
        else c.fig.keep.forEach((k) => keep.push(rectW(c, k)));
      });
    }
    const mine = out.seats.find((r) => r.cast.primary || r.cast.i === 0);
    out.seat = mine ? mine.seat : out.seat || null; /* a car's seat is made with the car */
    out.table = mine ? mine.table : out.seats[0] ? out.seats[0].table : null;
    out.sits = !!mine || !!(plan.car && fig.person);
    out.anySits = out.sits || out.seats.length > 0;

    /* ----- everything else ----- */
    const sortKey = (k) => {
      const i = ORDER.indexOf(k);
      return i < 0 ? 99 : i;
    };
    items.sort((a, b) => sortKey(a.kind) - sortKey(b.kind));
    const byKind = (k) => out.pieces.filter((p) => p.kind === k);
    const centerOf = (p) => [(p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2];
    const tops = [];
    let sideFlip = rnd() < 0.5 ? 1 : -1;
    const lastSide = {};
    const skipped = [];
    let fenceDone = false;
    for (const it of items) {
      const kind = it.kind;
      if (!BUILD[kind]) continue;
      let role = ROLE[kind];
      const o = opts(it, { color: it.color, old: it.old });
      if (kind === "tree" || kind === "pine" || kind === "palm" || kind === "cactus" || kind === "car") role = plan.indoor ? "side" : "far";
      if (kind === "window" || kind === "curtain") o.curtain = null;
      if (kind === "window" && items.some((x) => x.kind === "curtain")) o.curtain = (items.find((x) => x.kind === "curtain").color != null ? items.find((x) => x.kind === "curtain").color : 0xc8a0a0);
      if (kind === "curtain" && !plan.stage && (byKind("window").length || !plan.indoor)) continue; /* hung on the window instead */
      if (kind === "counter" && it.on) continue;
      if (role === "top" || it.on) {
        tops.push(it);
        continue;
      }
      if (kind === "microphone") {
        const g = make(kind, o);
        const p = placeNear(g, { anyKeep: true }, 0, fig.front + 0.22, [0], { front: true, span: 0.6 });
        if (!p) skipped.push(kind);
        continue;
      }
      if (kind === "fence") {
        if (fenceDone) continue;
        fenceDone = true;
        const len = plan.indoor ? room.x1 - room.x0 - 0.4 : 14;
        const g = make("fence", Object.assign(o, { length: len }));
        const z = out.road ? out.road.z0 - 0.5 : -1.6;
        if (it.where === "left" || it.where === "right") {
          const g2 = make("fence", Object.assign(o, { length: 6 }));
          const x = it.where === "left" ? -2.6 : 2.6;
          const r = rectOf(x, -1.5, Math.PI / 2, 6, 0.16);
          if (free(r, {})) commit(g2, x, -1.5, Math.PI / 2, r, {});
          else skipped.push(kind);
          disposeTree(g);
          continue;
        }
        const r = rectOf(0, plan.indoor ? room.z0 + 0.4 : z, 0, len, 0.16);
        if (free(r, {})) commit(g, 0, plan.indoor ? room.z0 + 0.4 : z, 0, r, {});
        else skipped.push(kind);
        continue;
      }
      if (kind === "curtain" && plan.stage) {
        const w = room.x1 - room.x0;
        const g = make("curtain", Object.assign(o, { length: w }));
        const r = rectOf(0, room.z0 + 0.21, 0, w, 0.42);
        commit(g, 0, room.z0 + 0.21, 0, r, {});
        [-1, 1].forEach((s) => {
          const leg = make("curtain", Object.assign(o, { length: 1.1 }));
          const x = s * (w / 2 - 0.55);
          const rr = rectOf(x, room.z1 - 1.0, 0, 1.1, 0.42);
          if (free(rr, {})) commit(leg, x, room.z1 - 1.0, 0, rr, {});
          else disposeTree(leg);
        });
        continue;
      }
      if (kind === "rug") {
        const g = make("rug", o);
        const anchor = out.table || byKind("table")[0] || byKind("coffee table")[0] || byKind("bed")[0] || null;
        const [ax, az] = anchor ? centerOf(anchor) : [0, 0];
        g.position.set(ax, 0, anchor && anchor.kind === "bed" ? az + 0.6 : az);
        const r = rectOf(g.position.x, g.position.z, 0, g.userData.w, g.userData.d);
        if (inside(r) && !placed.some((p) => p.kind === "rug" && hit(r, p, 0))) commit(g, g.position.x, g.position.z, 0, r, { flat: true });
        else if (!placeNear(g, { flat: true }, 0, -0.6, [0, Math.PI / 2])) skipped.push(kind);
        continue;
      }
      const g = make(kind, o);
      let p = null;
      if (role === "mount") {
        if (!plan.indoor || !Object.keys(wallGroups).length) {
          /* outside or with no walls: a window, a picture or a clock has nowhere to hang */
          disposeTree(g);
          skipped.push(kind);
          continue;
        }
        p = placeOnWall(g, { door: kind === "door" }, it.where, null, true);
      } else if (role === "wall" && plan.indoor && Object.keys(wallGroups).length) {
        let anchor = null;
        let where = it.where;
        if (kind === "nightstand" || (it.near && byKind(it.near).length)) {
          const nb = byKind(it.near || "bed")[0] || byKind("bed")[0];
          if (nb && nb.wall) {
            where = nb.wall === "back" ? null : nb.wall;
            const c = nb.wall === "back" ? (nb.x0 + nb.x1) / 2 : (nb.z0 + nb.z1) / 2;
            const half = nb.wall === "back" ? (nb.x1 - nb.x0) / 2 : (nb.z1 - nb.z0) / 2;
            const side = (lastSide[nb.kind] = -(lastSide[nb.kind] || -1));
            anchor = c + side * (half + g.userData.w / 2 + 0.06);
            const wk = nb.wall;
            const tryA = [anchor, c - side * (half + g.userData.w / 2 + 0.06)];
            for (const a of tryA) {
              const W = WALLS[wk];
              const [x, z] = W.at(a, g.userData.d);
              const r = rectOf(x, z, W.rot, g.userData.w, g.userData.d);
              if (free(r, {}) && wallFree(wk, a - g.userData.w / 2, a + g.userData.w / 2, 0, g.userData.h)) {
                onWall[wk].push({ a0: a - g.userData.w / 2, a1: a + g.userData.w / 2, y0: 0, y1: g.userData.h });
                p = commit(g, x, z, W.rot, r, {});
                p.wall = wk;
                break;
              }
            }
          }
        }
        if (!p && kind === "counter" || (!p && (kind === "fridge" || kind === "stove" || kind === "sink") && byKind("counter").length)) {
          /* kitchen things line up next to the counter */
          const nb = byKind("counter")[0];
          if (nb && nb.wall && kind !== "counter") {
            const c = nb.wall === "back" ? (nb.x0 + nb.x1) / 2 : (nb.z0 + nb.z1) / 2;
            const half = nb.wall === "back" ? (nb.x1 - nb.x0) / 2 : (nb.z1 - nb.z0) / 2;
            const sides = kind === "fridge" ? [1, -1] : [-1, 1];
            for (const sd of sides) {
              if (p) break;
              const a = c + sd * (half + g.userData.w / 2 + 0.03 + (byKind(kind === "fridge" ? "stove" : "fridge").length && false ? 0.8 : 0));
              const wk = nb.wall;
              const W = WALLS[wk];
              const [x, z] = W.at(a, g.userData.d);
              const r = rectOf(x, z, W.rot, g.userData.w, g.userData.d);
              if (free(r, {}) && wallFree(wk, a - g.userData.w / 2, a + g.userData.w / 2, 0, g.userData.h)) {
                onWall[wk].push({ a0: a - g.userData.w / 2, a1: a + g.userData.w / 2, y0: 0, y1: g.userData.h });
                p = commit(g, x, z, W.rot, r, {});
                p.wall = wk;
              }
            }
          }
        }
        if (!p && (kind === "booth")) p = placeOnWall(g, {}, it.where || "left", null, false);
        if (!p) p = placeOnWall(g, {}, where, anchor, false);
      }
      if (!p && role === "far" && !plan.indoor) {
        const big = kind === "barn" || kind === "house" || kind === "car";
        let ax;
        let az;
        if (kind === "car") {
          ax = it.where === "left" ? -4.4 : 4.4;
          az = out.road ? (out.road.z0 + out.road.z1) / 2 + 0.6 : -1.4;
        } else if (kind === "house") {
          const n = byKind("house").length;
          ax = (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 7.2;
          az = out.sidewalk ? out.sidewalk.z0 - 0.75 : -5.2;
          if (it.where === "left") ax -= 3;
          if (it.where === "right") ax += 3;
        } else if (kind === "barn") {
          ax = it.where === "right" ? 5 : it.where === "left" ? -5 : -3.5;
          az = -7.5;
        } else {
          sideFlip = -sideFlip;
          const side = it.where === "left" ? -1 : it.where === "right" ? 1 : sideFlip;
          const n = items.filter((x) => x.kind === kind).length;
          ax = side * (2.3 + rnd() * 2.2 + (it.n || 0) * 0.6);
          az = it.where === "front" ? 1.6 : (out.road ? out.road.z0 : 0) - 1.6 - rnd() * 2.5 - (n > 3 ? rnd() * 3 : 0);
        }
        const rots = kind === "car" ? (out.road ? [Math.PI / 2, -Math.PI / 2] : [0, Math.PI / 2]) : [0];
        p = placeNear(g, { onRoad: kind === "car" }, ax, az, rots, { step: big ? 0.25 : 0.15, span: big ? 8 : 6 });
      }
      if (!p && (role === "side" || role === "center" || role === "far" || role === "wall")) {
        /* near the character or its partner (chairs at the table, stools at the counter, a lamp by the sofa) */
        let ax;
        let az;
        let rots = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
        const partner = { chair: ["table", "desk"], "bar stool": ["counter"], lamp: ["sofa", "armchair", "bed", "desk"], plant: ["sofa", "shelf", "tv"], "coffee table": ["sofa"], armchair: ["coffee table", "sofa"], bench: [], "trash can": ["bench", "streetlight"], mailbox: ["house"], hydrant: ["streetlight"], streetlight: [] }[kind];
        const near = it.near ? byKind(it.near)[0] : partner ? partner.map((k) => byKind(k).find((q) => !q.seated || kind !== "chair"))[0] || partner.map((k) => byKind(k)[0]).find(Boolean) : null;
        if (near) {
          [ax, az] = centerOf(near);
          if (kind === "chair" || kind === "bar stool") {
            /* around the partner, facing it */
            const spots = [];
            const hw = (near.x1 - near.x0) / 2;
            const hd = (near.z1 - near.z0) / 2;
            const gap = kind === "chair" ? 0.12 : 0.2;
            const cw = g.userData.d / 2 + gap;
            if (near.kind === "counter" && near.wall) {
              const W = near.wall;
              const n2 = 4;
              for (let i = 0; i < n2; i++) {
                const t2 = -1 + (2 * (i + 0.5)) / n2;
                if (W === "back") spots.push([ax + t2 * hw * 0.8, near.z1 + cw + 0.1]);
                if (W === "left") spots.push([near.x1 + cw + 0.1, az + t2 * hd * 0.8]);
                if (W === "right") spots.push([near.x0 - cw - 0.1, az + t2 * hd * 0.8]);
              }
            } else {
              spots.push([ax - hw - cw, az], [ax + hw + cw, az], [ax, az - hd - cw], [ax, az + hd + cw]);
              if (hw > 0.5) spots.push([ax - hw / 2, az - hd - cw], [ax + hw / 2, az - hd - cw], [ax - hw / 2, az + hd + cw], [ax + hw / 2, az + hd + cw]);
            }
            for (const [sx, sz] of spots) {
              const rot = facing(sx, sz, ax, az);
              const r = rectOf(sx, sz, rot, g.userData.w, g.userData.d);
              if (free(r, {})) {
                p = commit(g, sx, sz, rot, r, {});
                break;
              }
            }
            if (p) continue;
          } else if (kind === "coffee table" && near.kind === "sofa") {
            const fr = near.wall === "left" ? [1, 0] : near.wall === "right" ? [-1, 0] : near.rot === Math.PI ? [0, -1] : [0, 1];
            const dd = (near.wall ? Math.abs(near.x1 - near.x0) : Math.abs(near.z1 - near.z0)) / 2 + 0.55;
            const cx = ax + fr[0] * dd;
            const cz = az + fr[1] * dd;
            const rot = near.wall === "left" || near.wall === "right" ? Math.PI / 2 : 0;
            const r = rectOf(cx, cz, rot, g.userData.w, g.userData.d);
            if (free(r, {})) p = commit(g, cx, cz, rot, r, {});
            if (p) continue;
          }
        } else {
          /* by the character: left or right of the picture, or behind */
          const w2 = g.userData.w;
          lastSide.any = it.where === "left" ? -1 : it.where === "right" ? 1 : -(lastSide.any || 1);
          const side = lastSide.any;
          ax = side * (spanX + 0.35 + w2 / 2);
          az = plan.indoor ? -0.5 : -0.4;
          if (it.where === "behind") (ax = (rnd() - 0.5) * 1.5), (az = plan.indoor ? room.z0 + 0.8 : -2.2);
          if (it.where === "front") (ax = side * 1.6), (az = 1.0);
          if (it.where === "middle") (ax = 0), (az = plan.indoor ? (room.z0 + 0) / 2 : -1.5);
          if (it.where === "corner" && plan.indoor) (ax = side * (room.x1 - 0.5)), (az = room.z0 + 0.5);
          if (kind === "streetlight" && out.sidewalk) (az = out.sidewalk.z1 - 0.35), (ax = side * (2.6 + (it.n || 0) * 6));
          if ((kind === "trash can" || kind === "hydrant" || kind === "mailbox") && out.sidewalk) az = out.sidewalk.z1 - 0.5;
          if (kind === "bench" || kind === "sofa" || kind === "armchair" || kind === "streetlight") rots = [0];
          if (kind === "table" || kind === "desk") rots = [0, Math.PI / 2];
        }
        if (kind === "streetlight" && near) rots = [0];
        p = placeNear(g, {}, ax, az, rots, { span: plan.indoor ? 4 : 7, front: it.where === "front" });
      }
      if (!p) {
        disposeTree(g);
        skipped.push(kind);
      }
    }
    /* ----- things on top of other things ----- */
    for (const it of tops) {
      const base = (it.on && byKind(it.on).find((q) => !q.used)) || byKind(it.on || "desk")[0] || byKind("table")[0] || byKind("nightstand")[0] || byKind("counter")[0] || byKind("desk")[0];
      const o = opts(it, { color: it.color, small: true });
      if (!base || base.obj.userData.top == null) {
        if (it.kind === "lamp") {
          const g = make("lamp", Object.assign(o, { small: false }));
          if (!placeNear(g, {}, -(spanX + 0.6), -0.5, [0])) disposeTree(g), skipped.push(it.kind);
        } else skipped.push(it.kind);
        continue;
      }
      const g = make(it.kind, o);
      const bu = base.obj.userData;
      const sw = base.obj.scale ? base.obj.scale.y : 1;
      void sw;
      /* local to the base: toward the back, to one side */
      base.used = (base.used || 0) + 1;
      const lx = base.kind === "nightstand" ? 0 : (bu.w / 2 - g.userData.w / 2 - 0.08) * (base.used % 2 ? 1 : -1) * (base.seated ? 0.8 : 0.5);
      const lz = base.kind === "nightstand" ? 0 : -bu.d / 2 + g.userData.d / 2 + 0.06;
      g.position.set(lx, bu.top, lz);
      if (base.seated && base.kind !== "counter" && base.kind !== "desk") g.rotation.y = 0;
      base.obj.add(g);
      out.pieces.push({ kind: it.kind, obj: g, on: base.kind, flat: true, x0: 0, x1: 0, z0: 0, z1: 0 });
    }
    /* lamps glow after dark: a little warm light each (at most three) */
    if (lit)
      out.pieces
        .filter((p) => (p.kind === "lamp" || p.kind === "streetlight") && p.obj.userData.lightAt != null)
        .slice(0, 3)
        .forEach((p) => {
          const L = new T.PointLight(0xffc477, night ? 0.9 : 0.5, p.kind === "streetlight" ? 9 : 4.5, 2);
          const at = p.obj.userData.lightAt;
          if (Array.isArray(at)) L.position.set(at[0], at[1], at[2]);
          else L.position.set(0, at, 0);
          L.name = "set lamp light";
          p.obj.add(L);
          out.lights.push(L);
        });
    if (skipped.length) out.notes.push("no room for: " + [...new Set(skipped)].map((k) => KIND[k].say).join(", "));
    return out;
  }

  /* inside a car: the person sits in the driver's seat at the middle of the view */
  function buildCar(K, root, plan, fig, out, opts) {
    const T = K.T;
    const body = plan.props.find((x) => x.kind === "car");
    const c = body && body.color != null ? body.color : 0x3a5a8a;
    const trim = 0x2a2a2e;
    const s = fig.seatH;
    const roofY = Math.max(fig.headTopSit + 0.14, 1.15);
    /* floor pan */
    K.box(root, 2.0, 0.06, 2.6, -0.35, -0.06, 0.1, 0x1e1e22).name = "set floor";
    /* the road outside, lower down, and a strip of scenery going by */
    const road = K.box(root, 80, 0.02, 9, 0, -0.38, 0, 0x4a4c50, { rough: 1 });
    road.castShadow = false;
    for (let z = -30; z <= 30; z += 4) K.box(root, 0.12, 0.004, 1.6, 2.8, -0.36, z, 0xf2e6a0).castShadow = false;
    const gr = K.box(root, 120, 0.02, 120, 0, -0.42, 0, plan.time === "night" ? 0x1a2414 : 0x5a8a44, { rough: 1 });
    gr.castShadow = false;
    const rnd = seeded("car" + (plan.time || ""));
    for (let i = 0; i < 6; i++) {
      const g = new T.Group();
      BUILD.tree(K, g, { scale: 1.2, rnd, time: plan.time });
      g.position.set((i % 2 ? 1 : -1) * (7 + rnd() * 6), -0.4, -14 + i * 6);
      root.add(g);
    }
    /* seats */
    const seat = new T.Group();
    seat.name = "set car seat";
    const si = BUILD["car seat"](K, seat, opts({ color: c === 0x3a5a8a ? null : dim(c, 0.3), scale: 1 }, { depth: fig.seatDepth }));
    seat.userData = Object.assign({ setPiece: "car seat" }, si);
    seat.position.set(0, 0, fig.seatFront - si.front);
    root.add(seat);
    out.seat = { kind: "car seat", obj: seat, seatTop: s, x0: -si.w / 2, x1: si.w / 2, z0: seat.position.z - si.d / 2, z1: seat.position.z + si.d / 2 };
    out.pieces.push(out.seat);
    const pass = new T.Group();
    BUILD["car seat"](K, pass, opts({ color: c === 0x3a5a8a ? null : dim(c, 0.3), scale: 1 }, { depth: fig.seatDepth }));
    pass.userData = { setPiece: "car seat" };
    pass.position.set(-0.75, 0, seat.position.z);
    root.add(pass);
    out.pieces.push({ kind: "car seat", obj: pass, x0: -1.03, x1: -0.47, z0: seat.position.z - 0.28, z1: seat.position.z + 0.28 });
    /* the dashboard and the steering wheel, at the hands */
    const wheelY = fig.wheelY;
    const wheelZ = fig.wheelZ;
    const dashZ = wheelZ + 0.32;
    const dashTop = Math.min(wheelY + 0.02, roofY - 0.45);
    const dash = new T.Group();
    dash.name = "set dashboard";
    dash.userData.setPiece = "dashboard";
    root.add(dash);
    K.box(dash, 1.95, dashTop - 0.25, 0.5, -0.35, 0.25, dashZ + 0.2, dim(c, 0.55));
    K.box(dash, 1.95, 0.06, 0.62, -0.35, dashTop - 0.03, dashZ + 0.16, dim(c, 0.65));
    K.box(dash, 0.5, 0.14, 0.02, 0, dashTop - 0.2, dashZ - 0.06, 0x101418);
    K.box(dash, 0.46, 0.1, 0.005, 0, dashTop - 0.18, dashZ - 0.072, plan.time === "night" ? 0x6ad0ff : 0x2a3440, { basic: true });
    K.box(dash, 1.95, 0.3, 0.6, -0.35, -0.0, dashZ + 0.25, dim(c, 0.55));
    const col = K.cyl(dash, 0.03, 0.4, 0, 0, 0, trim);
    col.rotation.x = -1.1;
    col.position.set(0, wheelY - 0.08, wheelZ + 0.17);
    const wheel = K.torus(dash, 0.18, 0.024, 0, wheelY, wheelZ, trim);
    wheel.rotation.x = -0.45;
    const hub = K.cyl(dash, 0.05, 0.04, 0, 0, 0, 0x3a3a3e);
    hub.rotation.x = Math.PI / 2 - 0.45;
    hub.position.set(0, wheelY, wheelZ + 0.01);
    out.pieces.push({ kind: "dashboard", obj: dash, x0: -1.32, x1: 0.62, z0: dashZ - 0.1, z1: dashZ + 0.55 });
    out.wheel = { y: wheelY, z: wheelZ, r: 0.18, tilt: 0.45 };
    /* windshield frame, roof and doors: the doors and the roof are cut away when the camera is outside them */
    const frame = dim(c, 0.2);
    const winZ = dashZ + 0.45;
    [-1.3, 0.6].forEach((x) => {
      const p = K.box(root, 0.07, Math.hypot(roofY - dashTop, 0.5), 0.07, x, 0, winZ - 0.25, frame);
      p.rotation.x = -Math.atan2(0.5, roofY - dashTop);
      p.position.y = (dashTop + roofY) / 2 - p.scale.y / 2 + p.scale.y / 2;
      p.position.y = dashTop + (roofY - dashTop) / 2 - p.scale.y / 2;
    });
    const roof = new T.Group();
    roof.name = "set car roof";
    root.add(roof);
    K.box(roof, 2.0, 0.06, 1.75, -0.35, roofY, -0.35 + 0.55 - 0.45, dim(c, 0.6));
    K.box(roof, 1.9, 0.01, 1.6, -0.35, roofY - 0.012, -0.35 + 0.55 - 0.45, 0xd8d2c4);
    K.box(roof, 0.22, 0.06, 0.04, 0, roofY - 0.08, winZ - 0.6, 0x1e1e22);
    out.walls.push({ name: "roof", obj: roof, n: new T.Vector3(0, -1, 0), p: new T.Vector3(0, roofY, 0) });
    const door = (x, n, name) => {
      const g = new T.Group();
      g.name = "set car door " + name;
      root.add(g);
      const zc = 0.0;
      K.box(g, 0.08, Math.min(0.72, dashTop - 0.05), 2.1, x, 0, zc, c, { rough: 0.4, metal: 0.25 });
      K.box(g, 0.1, 0.05, 2.1, x, Math.min(0.72, dashTop - 0.05), zc, dim(c, 0.3));
      K.box(g, 0.06, roofY - Math.min(0.72, dashTop - 0.05), 0.07, x, Math.min(0.72, dashTop - 0.05), zc - 1.0, frame);
      K.box(g, 0.06, 0.04, 2.0, x, roofY - 0.04, zc, frame);
      out.walls.push({ name: "door " + name, obj: g, n, p: new T.Vector3(x, 0, 0) });
    };
    door(0.6, new T.Vector3(-1, 0, 0), "driver");
    door(-1.3, new T.Vector3(1, 0, 0), "passenger");
    /* the back seat */
    K.box(root, 1.9, s - 0.05, 0.5, -0.35, 0, -1.05, 0x2a2a2e);
    K.box(root, 1.9, 0.62, 0.14, -0.35, s - 0.05, -1.25, dim(c, 0.3));
    out.pieces.push({ kind: "back seat", obj: root, x0: -1.3, x1: 0.6, z0: -1.32, z1: -0.8 });
    out.sky = (SKY[plan.time] || SKY.noon).mid;
    if (plan.time || true) {
      const d = skyDome(K, out.extra, plan.time || "noon");
      out.own.push(...d.own);
    }
  }

  /* give back a removed tree of meshes (a piece that found no room); shared shapes stay in the kit */
  function disposeTree(g) {
    if (g.parent) g.parent.remove(g);
  }

  /* ---------- measuring the character once per load ---------- */
  /* In its own frame: the group that holds it in the scene (rig/staging.js's stage group, which may stand on a
     mark and turn) is put at the middle, facing front, while it is measured. */
  function measure(ctx) {
    let top = ctx.holder;
    while (top && top.parent && top.parent !== ctx.scene) top = top.parent;
    const was = top && top.parent === ctx.scene ? { p: top.position.clone(), r: top.rotation.clone() } : null;
    if (was) {
      top.position.set(0, 0, 0);
      top.rotation.set(0, 0, 0);
      top.updateMatrixWorld(true);
    }
    try {
      return measureHere(ctx);
    } finally {
      if (was) {
        top.position.copy(was.p);
        top.rotation.copy(was.r);
        top.updateMatrixWorld(true);
      }
    }
  }
  function measureHere(ctx) {
    const T = ctx.THREE;
    const rig = ctx.rig;
    const model = ctx.model;
    model.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(model);
    const H = Math.max(0.3, box.max.y - box.min.y);
    const person = !!(rig && !rig.object && !rig.quadruped && rig.legs && rig.legs.L.length >= 3 && rig.legs.R.length >= 3 && rig.arms && rig.arms.L.length >= 3 && rig.hips);
    const fig = {
      person, H, keep: [{ x0: box.min.x - 0.12, x1: box.max.x + 0.12, z0: box.min.z - 0.15, z1: box.max.z + 0.15 }], halfW: Math.max(Math.abs(box.min.x), Math.abs(box.max.x)), front: box.max.z,
      seatH: 0.45, tableH: 0.75, tableSit: 0.75, mouth: H * 0.88, seatFront: 0.25, seatDepth: 0.45, tableFront: 0.3, headTopSit: H, wheelY: 0.85, wheelZ: Math.max(0.45, box.max.z + 0.2), upper: 0.3, fore: 0.25,
    };
    if (!person) return fig;
    const wp = (b) => b.getWorldPosition(new T.Vector3());
    const [hip, knee, ankle] = rig.legs.L.map(wp);
    const shin = knee.distanceTo(ankle);
    const thigh = hip.distanceTo(knee);
    const k = shin / 0.32;
    const hipSit = ankle.y + shin * 0.985;
    const drop = hip.y - hipSit;
    const sh = wp(rig.arms.L[0]);
    const el = wp(rig.arms.L[1]);
    const wr = wp(rig.arms.L[2]);
    const upper = sh.distanceTo(el);
    const fore = el.distanceTo(wr);
    fig.k = k;
    fig.ankleY = ankle.y;
    fig.shin = shin;
    fig.thigh = thigh;
    fig.hipY = hip.y;
    fig.hipSit = hipSit;
    fig.seatH = clamp(hipSit - 0.075 * k, 0.2, 0.62);
    fig.seatFront = hip.z + thigh * 0.98 - 0.05 * k; /* the front edge of the seat, just behind the knees */
    fig.seatDepth = fig.seatFront - (hip.z - 0.11 * k); /* from the back of the seat (the sitter's back) */
    fig.shoulderSit = sh.y - drop;
    fig.upper = upper;
    fig.fore = fore;
    fig.tableSit = clamp(fig.shoulderSit - upper * 0.95, fig.seatH + 0.2, 1.0);
    fig.tableFront = hip.z + 0.17 * k + 0.08;
    fig.tableH = clamp(fig.tableSit, 0.5, 0.78);
    fig.headTopSit = box.max.y - drop;
    fig.wheelY = fig.shoulderSit - upper * 0.55;
    fig.wheelZ = sh.z + (upper + fore) * 0.62;
    fig.mouth = wp(rig.head).y + 0.02 * k;
    fig.front = Math.max(box.max.z, wp(rig.head).z + 0.12);
    fig.halfW = Math.max(0.35, Math.min(fig.halfW, 0.65));
    return fig;
  }

  /* ---------- sitting, and the hands (after the rules and after rig/ik.js) ---------- */
  const tmp = {};
  function solve(ctx, a, b, c, target, pole) {
    const T = ctx.THREE;
    const wp = (x) => x.getWorldPosition(new T.Vector3());
    const A = wp(a);
    const B = wp(b);
    const C = wp(c);
    const lab = B.distanceTo(A);
    const lbc = C.distanceTo(B);
    if (lab < 1e-5 || lbc < 1e-5) return;
    const d = target.clone().sub(A);
    const dist = clamp(d.length(), Math.abs(lab - lbc) + 0.02, lab + lbc - 1e-3);
    const dir = d.normalize();
    const x = (lab * lab - lbc * lbc + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, lab * lab - x * x));
    const pv = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const Kp = A.clone().add(dir.clone().multiplyScalar(x)).add(pv.multiplyScalar(h));
    ctx.rotateWorld(a, new T.Quaternion().setFromUnitVectors(B.clone().sub(A).normalize(), Kp.sub(A).normalize()));
    const B2 = wp(b);
    const C2 = wp(c);
    ctx.rotateWorld(b, new T.Quaternion().setFromUnitVectors(C2.sub(B2).normalize(), A.clone().add(dir.multiplyScalar(dist)).sub(B2).normalize()));
  }
  /* rec: { fig, frame: { x, z, yaw } (where they stand and face), table, wheel }; S keeps actor 1's numbers */
  function sit(ctx, S, rec) {
    const T = ctx.THREE;
    const r = ctx.rig;
    const fig = rec.fig;
    const yaw = (rec.frame && rec.frame.yaw) || 0;
    const wp = (x) => x.getWorldPosition(new T.Vector3());
    const wq = (x) => x.getWorldQuaternion(new T.Quaternion());
    const fwd = new T.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const left = new T.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const down = new T.Vector3(0, -1, 0);
    let lowest = Infinity;
    ["L", "R"].forEach((s) => {
      const [a, b, c] = r.legs[s];
      const foot = wq(c);
      const out2 = left.clone().multiplyScalar(s === "L" ? 1 : -1);
      const want1 = fwd.clone().multiplyScalar(0.98).add(down.clone().multiplyScalar(0.06)).add(out2.clone().multiplyScalar(0.07)).normalize();
      ctx.rotateWorld(a, new T.Quaternion().setFromUnitVectors(wp(b).sub(wp(a)).normalize(), want1));
      const want2 = down.clone().add(fwd.clone().multiplyScalar(0.1)).normalize();
      ctx.rotateWorld(b, new T.Quaternion().setFromUnitVectors(wp(c).sub(wp(b)).normalize(), want2));
      ctx.rotateWorld(c, foot.multiply(wq(c).invert()));
      lowest = Math.min(lowest, wp(c).y);
    });
    const drop = lowest - fig.ankleY;
    ctx.holder.position.y -= drop;
    ctx.holder.updateMatrixWorld(true);
    rec.drop = drop;
    if (!ctx.actor) S.drop = drop;
    /* the hands */
    const hands = ctx.actor ? "empty" : ctx.pick("poseRigLens.hands");
    if (hands !== "empty" && hands !== "a surface") {
      const cup = ikCup(ctx);
      if (cup && cup.visible) cup.position.y -= drop;
      return;
    }
    const sh = (s) => wp(r.arms[s][0]);
    const targets = {};
    if (rec.wheel) {
      const w = rec.wheel;
      ["L", "R"].forEach((s) => (targets[s] = new T.Vector3((s === "L" ? 1 : -1) * w.r * 0.92, w.y + 0.03, w.z - 0.03)));
    } else if (rec.table && rec.table.seated) {
      const tb = rec.table;
      const top = tb.top;
      const mid = new T.Vector3((tb.x0 + tb.x1) / 2, 0, (tb.z0 + tb.z1) / 2);
      ["L", "R"].forEach((s) => {
        const p0 = sh(s);
        const L = (fig.upper + fig.fore) * 0.93;
        const dy = top + 0.04 - p0.y;
        const dx = (s === "L" ? 1 : -1) * 0.07;
        /* no further than the far edge of their own table, or the middle of a shared one */
        const lim = mid.clone().sub(p0).setY(0).dot(fwd) + (tb.shared ? -0.06 : (tb.d || tb.z1 - tb.z0) / 2 - 0.1);
        const dz = Math.min(Math.sqrt(Math.max(0.01, L * L - dy * dy - dx * dx)), Math.max(0.05, lim));
        targets[s] = p0.clone().addScaledVector(left, dx).addScaledVector(fwd, dz).setY(top + 0.04);
      });
    } else {
      ["L", "R"].forEach((s) => {
        const k = wp(r.legs[s][1]);
        const h = wp(r.legs[s][0]);
        targets[s] = h.clone().lerp(k, 0.62).add(new T.Vector3((s === "L" ? 1 : -1) * 0.04, 0.07 * (fig.k || 1), 0));
      });
    }
    ["L", "R"].forEach((s) => {
      const [a, b, c] = r.arms[s];
      solve(ctx, a, b, c, targets[s], left.clone().multiplyScalar(s === "L" ? 0.7 : -0.7).add(new T.Vector3(0, -0.3, 0)).addScaledVector(fwd, -1));
    });
    rec.handAims = targets;
    if (!ctx.actor) S.handAims = targets;
  }
  function ikGroup(ctx) {
    return ctx.scene && ctx.scene.getObjectByName("feet and hands");
  }
  function ikTable(ctx) {
    const g = ikGroup(ctx);
    return g ? g.children.find((x) => x.userData && x.userData.top && x.userData.legs) : null;
  }
  function ikCup(ctx) {
    const g = ikGroup(ctx);
    return g ? g.children.find((x) => x.isGroup && !(x.userData && x.userData.top) && x.children.length >= 3) : null;
  }
  /* standing with "a surface": the set's table or desk goes where rig/ik.js puts the hands */
  function surface(ctx, S) {
    const want = ctx.pick("poseRigLens.hands") === "a surface" && !S.sitting;
    const it = ikTable(ctx);
    let piece = S.surfacePiece;
    if (want && !piece) piece = S.out.pieces.find((p) => (p.kind === "table" || p.kind === "desk") && !p.seated && p.obj.parent === S.out.root);
    if (want && piece && it && it.userData.top) {
      const top = it.userData.top;
      if (!S.moved) {
        S.moved = { piece, pos: piece.obj.position.clone(), rot: piece.obj.rotation.y, sy: piece.obj.scale.y };
        S.surfacePiece = piece;
      }
      const ty = top.position.y + top.scale.y / 2;
      const front = top.position.z - top.scale.z / 2;
      piece.obj.rotation.y = piece.kind === "desk" ? Math.PI : 0;
      piece.obj.scale.y = ty / piece.obj.userData.top;
      piece.obj.position.set(top.position.x, 0, front + piece.obj.userData.d / 2);
      it.visible = false;
    } else if (S.moved) {
      S.moved.piece.obj.position.copy(S.moved.pos);
      S.moved.piece.obj.rotation.y = S.moved.rot;
      S.moved.piece.obj.scale.y = S.moved.sy;
      S.moved = null;
      S.surfacePiece = null;
    }
  }

  /* ---------- the add-on ---------- */
  const STATE = new WeakMap();
  const st = (ctx) => {
    let S = STATE.get(ctx);
    if (!S) STATE.set(ctx, (S = { out: null, plan: null, fig: null, text: "", said: "", bgHex: null, grid: null }));
    return S;
  };
  function clear(ctx) {
    const S = st(ctx);
    if (!S.out) return;
    const o = S.out;
    if (S.moved) {
      S.moved = null;
      S.surfacePiece = null;
    }
    if (ctx.scene) {
      ctx.scene.remove(o.root);
      ctx.scene.remove(o.extra);
    }
    o.lights.forEach((l) => l.dispose && l.dispose());
    o.K.dispose();
    o.own.forEach((x) => x.dispose());
    S.out = null;
    S.plan = null;
    if (S.bg && S.bgHex != null) S.bg.setHex(S.bgHex);
    if (S.grid) S.grid.visible = true;
  }
  /* Everyone the set keeps clear of and seats: actor 1 at the middle, or everyone rig/staging.js has on the floor
     (each measured when they came in). */
  function castOf(ctx, S) {
    const St = window.CurioRigStaging;
    let list = null;
    try {
      list = St && St.actors ? St.actors({ ctx }) : null;
    } catch (e) {
      list = null;
    }
    const sit = (i) => !S.sitWho || S.sitWho.includes(i);
    if (!list) return [{ primary: true, i: 0, x: 0, z: 0, yaw: 0, fig: S.fig, sit: sit(0), settled: true }];
    const out = [];
    list.forEach((a) => {
      if (!a.loaded) return;
      const fig = a.i === 0 ? S.fig : a.ctx && a.ctx.data && a.ctx.data("sets").fig;
      if (fig) out.push({ primary: a.i === 0, i: a.i, name: a.name, actor: a.i === 0 ? null : a.ctx.actor, x: a.x, z: a.z, yaw: a.yaw, fig, sit: sit(a.i), settled: a.settled });
    });
    if (!out.length || !out[0].primary) out.unshift({ primary: true, i: 0, x: 0, z: 0, yaw: 0, fig: S.fig, sit: sit(0), settled: true });
    return out;
  }
  const castSig = (cast) => cast.map((c) => [c.i, Math.round(c.x * 20), Math.round(c.z * 20), Math.round(c.yaw * 20), c.fig.person ? 1 : 0, c.sit ? 1 : 0].join(",")).join(";");
  function show(ctx, text) {
    const S = st(ctx);
    clear(ctx);
    if (!ctx.scene || !ctx.model) return null;
    const plan = readSet(text);
    if (!S.fig || S.figModel !== ctx.model) {
      S.fig = measure(ctx);
      S.figModel = ctx.model;
    }
    const cast = castOf(ctx, S);
    S.castSig = castSig(cast);
    const out = build(ctx, plan, S.fig, text, cast);
    ctx.scene.add(out.root);
    ctx.scene.add(out.extra);
    S.out = out;
    S.plan = plan;
    S.text = text;
    /* the sky: the view's own background color, changed in place (rig/snapshot.js swaps the object itself) */
    if (!S.bg && ctx.scene.background && ctx.scene.background.isColor) {
      S.bg = ctx.scene.background;
      S.bgHex = S.bg.getHex();
    }
    if (S.bg) S.bg.setHex(out.sky != null ? out.sky : S.bgHex);
    if (!S.grid) S.grid = ctx.scene.children.find((x) => x.isGridHelper || x.type === "GridHelper") || null;
    return out;
  }

  /* The Light add-on gets a starting point for the time of day; only when the words are built on purpose. */
  const LIGHT_START = {
    morning: { "lightRigLens.lightType": "sun", "lightingLens.key": "side", "lightingLens.colorTemp": "mixed", "lightRigLens.ratio": "gentle" },
    noon: { "lightRigLens.lightType": "sun", "lightingLens.key": "front", "lightingLens.colorTemp": "cold day", "lightRigLens.ratio": "gentle" },
    sunset: { "lightRigLens.lightType": "sun", "lightingLens.key": "side", "lightingLens.colorTemp": "warm practical", "lightRigLens.ratio": "dramatic", "lightRigLens.rim": "strong" },
    night: { "lightRigLens.lightType": "open sky", "lightingLens.key": "side", "lightingLens.colorTemp": "cold day", "lightRigLens.ratio": "dramatic", "lightRigLens.bounce": "a little" },
  };
  function lightStart(ctx, plan) {
    if (!plan.time && !plan.stage) return "";
    let want = Object.assign({}, LIGHT_START[plan.time || "noon"]);
    if (plan.time === "night" && plan.props.some((x) => x.kind === "lamp" || x.kind === "streetlight")) Object.assign(want, { "lightRigLens.lightType": "spotlight", "lightingLens.colorTemp": "warm practical" });
    if (plan.stage) Object.assign(want, { "lightRigLens.lightType": "spotlight", "lightingLens.key": "front", "lightRigLens.ratio": "dramatic", "lightingLens.colorTemp": "warm practical" });
    if ((plan.time === "morning" || plan.time === "noon") && plan.indoor && plan.props.some((x) => x.kind === "window")) want["lightRigLens.lightType"] = "window";
    const c = R.current && R.current();
    const tl = c && c.ctx === ctx && c.timeline ? c.timeline() : {};
    let n = 0;
    Object.keys(want).forEach((id) => {
      const s = R.SLIDERS.find((x) => x.id === id);
      if (!s || tl[id] != null) return;
      const i = s.scale.indexOf(want[id]);
      if (i < 0) return;
      ctx.prefs.values[id] = i / (s.scale.length - 1);
      const inp = ctx.el.querySelector(`[data-slider="${CSS.escape(id)}"]`);
      if (inp) {
        inp.value = i;
        const w = inp.closest(".rig-row") && inp.closest(".rig-row").querySelector("[data-word]");
        if (w) w.textContent = want[id];
      }
      n++;
    });
    if (plan.handsOn) {
      const s = R.SLIDERS.find((x) => x.id === "poseRigLens.hands");
      if (s && tl[s.id] == null) {
        ctx.prefs.values[s.id] = s.scale.indexOf("a surface") / (s.scale.length - 1);
        const inp = ctx.el.querySelector(`[data-slider="poseRigLens.hands"]`);
        if (inp) (inp.value = s.scale.indexOf("a surface")), (inp.closest(".rig-row").querySelector("[data-word]").textContent = "a surface");
      }
    }
    ctx.save();
    return n ? `Light: ${plan.stage && !plan.time ? "a stage spotlight" : "a " + (plan.time === "noon" ? "midday" : plan.time)} starting point (change it under Light${ctx.prefs.lightsFollow === false ? "; turn on Lights follow the curiosities to see it" : ""}).` : "";
  }

  function sayPlan(p, out) {
    if (!p.found) return "No place or things found, so it made an empty room. Try a place (a kitchen, a country road), things (a table, two chairs, a big tree), colors and a time of day, or Surprise me.";
    let s = "Read as: " + p.said.join(", ") + ".";
    if (out && out.notes.length) s += " " + out.notes.join("; ").replace(/^./, (c) => c.toUpperCase()) + ".";
    if (out && p.sit && !out.anySits && !p.car) s += " This character cannot sit (only people can), so it stands by the furniture.";
    if (out && out.seats && out.seats.length > 1) s += ` ${out.seats.length} people sit${out.seats[0].table && out.seats[0].table.shared ? " at one table" : ""}.`;
    if (out && p.car && !out.sits) s += " Only people can sit, so it stands in the car.";
    return s;
  }

  if (!document.getElementById("sets-css")) {
    const css = document.createElement("style");
    css.id = "sets-css";
    css.textContent = `.sets-list{display:flex;flex-wrap:wrap;gap:.3rem;margin:.3rem 0}
.sets-chip{display:inline-flex;align-items:stretch;border:1px solid #8886;border-radius:999px;overflow:hidden}
.sets-chip button{border:0;background:transparent;color:inherit;font:inherit;font-size:.8rem;padding:.15rem .55rem;cursor:pointer}
.sets-chip button+button{padding:.15rem .45rem;border-left:1px solid #8884;opacity:.7}
.sets-chip button+button:hover{opacity:1}
.sets-chip[aria-current="true"]{background:#3aa0e833;border-color:#3aa0e8}
.sets-chip[aria-current="true"] button:first-child{font-weight:600}
.sets-name{display:flex;gap:.4rem;align-items:center;margin:.3rem 0}.sets-name input{flex:1;min-width:0}
.sets-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.3rem 0}`;
    document.head.appendChild(css);
  }

  function autoName(text, s) {
    const p = readSet(text);
    const P = PLACES.find((x) => x.id === p.place);
    let name = P ? P.say.replace(/^(a|an) /, "") : p.props.length ? KIND[p.props[0].kind].say : "set";
    name = name.replace(/^./, (c) => c.toUpperCase()) + (p.time ? { morning: " in the morning", noon: " at noon", sunset: " at sunset", night: " at night" }[p.time] : "");
    let n = 2;
    const base = name.slice(0, 36);
    name = base;
    while (s.list.some((x) => x.name === name)) name = base + " " + n++;
    return name;
  }

  R.extend({
    id: "sets",
    label: "Make a set from words",
    panel(ctx) {
      const s = store();
      const cur = current(s);
      const S = st(ctx);
      return `<h4 title="In Maya: set dressing, modeling a set from primitives, layout">Make a set from words</h4>
        <p class="cap">Say where the scene happens: the place, the things in it, colors, and the time of day ("a kitchen with a table, two chairs and a window", "a dusty country road with a fence and a big tree at sunset"). Left and right are the picture's. Say "sits on the chair" to sit down.</p>
        <div class="sets-list" data-sets="list" aria-label="Your sets"></div>
        <label class="sets-name">Name <input type="text" data-sets="name" maxlength="40" value="${esc(cur.name)}" aria-label="Name of this set"></label>
        <textarea data-sets="text" rows="3" style="width:100%;box-sizing:border-box" aria-label="Describe the set">${esc(cur.text)}</textarea>
        <div class="sets-btns"><button type="button" data-sets="make">${s.on ? "Build it again" : "Build this set"}</button><button type="button" data-sets="surprise" title="Writes a new made-up place and builds it">Surprise me</button><button type="button" data-sets="new" title="Keeps these words as another set in the list">Keep as a new one</button><button type="button" data-sets="clear" title="Takes the set away; the words stay here">Clear the set</button></div>
        <p class="cap" data-sets="said" role="status">${S.said ? esc(S.said) : s.on ? esc(sayPlan(readSet(cur.text))) : ""}</p>`;
    },
    wire(ctx, box) {
      const q = (n) => box.querySelector(`[data-sets="${n}"]`);
      const listEl = q("list");
      const drawList = () => {
        const s = store();
        listEl.innerHTML = s.list
          .map((x) => `<span class="sets-chip" aria-current="${x.id === s.cur}"><button type="button" data-sets-pick="${esc(x.id)}" title="Switch to ${esc(x.name)}">${esc(x.name)}</button><button type="button" data-sets-del="${esc(x.id)}" aria-label="Delete ${esc(x.name)}" title="Delete ${esc(x.name)}">×</button></span>`)
          .join("");
      };
      const fill = () => {
        const cur = current(store());
        q("name").value = cur.name;
        q("text").value = cur.text;
      };
      const go = (fromWords) => {
        const s = store();
        s.on = true;
        keep(s);
        const text = current(s).text;
        const out = show(ctx, text);
        const S = st(ctx);
        const ls = fromWords && S.plan ? lightStart(ctx, S.plan) : "";
        S.said = sayPlan(readSet(text), out) + (ls ? " " + ls : "");
        q("said").textContent = S.said;
        q("make").textContent = "Build it again";
      };
      const save = (patch) => {
        const s = store();
        Object.assign(current(s), patch);
        keep(s);
        return s;
      };
      const add = (text) => {
        const s = store();
        if (s.list.length >= MAX) {
          q("said").textContent = `You have ${MAX} sets already: delete one (×) to keep another.`;
          return false;
        }
        const x = { id: newId(), name: autoName(text, s), text };
        s.list.push(x);
        s.cur = x.id;
        keep(s);
        return true;
      };
      q("make").addEventListener("click", () => {
        const text = q("text").value.trim() || START;
        q("text").value = text;
        save({ text, name: q("name").value.trim().slice(0, 40) || current(store()).name });
        drawList();
        go(true);
      });
      q("name").addEventListener("change", () => {
        const name = q("name").value.trim().slice(0, 40) || "My set";
        const s = save({ name });
        const b = listEl.querySelector(`[data-sets-pick="${CSS.escape(s.cur)}"]`);
        if (!b) return drawList();
        b.textContent = name;
        b.title = "Switch to " + name;
        b.nextElementSibling.setAttribute("aria-label", "Delete " + name);
        b.nextElementSibling.title = "Delete " + name;
      });
      q("surprise").addEventListener("click", () => {
        if (!add(surprise())) return;
        fill();
        drawList();
        go(true);
      });
      q("new").addEventListener("click", () => {
        if (!add(q("text").value.trim() || START)) return;
        fill();
        drawList();
        go(true);
      });
      q("clear").addEventListener("click", () => {
        const s = store();
        s.on = false;
        keep(s);
        clear(ctx);
        st(ctx).said = "";
        q("said").textContent = "The set is cleared. Your words are kept: Build this set brings it back.";
        q("make").textContent = "Build this set";
      });
      listEl.addEventListener("click", (e) => {
        const pk = e.target.closest("[data-sets-pick]");
        const del = e.target.closest("[data-sets-del]");
        const s = store();
        if (pk) {
          s.cur = pk.dataset.setsPick;
          keep(s);
          fill();
          drawList();
          go(true);
        } else if (del) {
          const id = del.dataset.setsDel;
          const was = s.cur === id;
          s.list = s.list.filter((x) => x.id !== id);
          if (!s.list.length) s.list.push({ id: newId(), name: "Kitchen", text: START });
          if (was) s.cur = s.list[0].id;
          keep(s);
          fill();
          drawList();
          if (was && s.on) go(false);
        }
      });
      drawList();
    },
    built(ctx) {
      /* an extra actor (rig/staging.js) is measured in its rest pose; the set is laid out again around it */
      if (ctx.actor) {
        ctx.data("sets").fig = measure(ctx);
        return;
      }
      /* a new character: the set is built again around it (seats and tables fit the new body) */
      const s = store();
      const S = st(ctx);
      /* measured now, in the rest pose, before any rule moves it */
      if (ctx.model) {
        S.fig = measure(ctx);
        S.figModel = ctx.model;
      }
      if (!s.on) return clear(ctx);
      const text = current(s).text;
      const out = show(ctx, text);
      S.said = sayPlan(readSet(text), out);
      const el = ctx.el.querySelector('[data-ext="sets"] [data-sets="said"]');
      if (el) el.textContent = S.said;
    },
    afterRules(ctx) {
      if (ctx.actor) {
        /* actors 2 to 4 sit on their own seat (rig/staging.js runs this on each one's ctx) */
        const M = ctx.main && STATE.get(ctx.main);
        const rec = M && M.out && ctx.rig && ctx.model ? M.out.seats.find((r) => r.cast.actor === ctx.actor) : null;
        if (!rec) return;
        rec.sitting = !ctx.actor.p.walk && !/walking|running/.test(ctx.pick("rigRulesLens.motion"));
        if (rec.sitting) {
          ctx.model.updateMatrixWorld(true);
          sit(ctx, M, rec);
        }
        return;
      }
      const S = st(ctx);
      S.sitting = false;
      if (!S.out || !ctx.rig || !ctx.model) return;
      const moving = /walking|running/.test(ctx.pick("rigRulesLens.motion"));
      const rec = S.out.seats.find((r) => r.cast.primary) || (S.plan && S.plan.car ? { fig: S.fig, frame: { x: 0, z: 0, yaw: 0 }, wheel: S.out.wheel } : null);
      if (S.out.sits && rec && S.fig && S.fig.person && !moving) {
        ctx.model.updateMatrixWorld(true);
        sit(ctx, S, rec);
        S.sitting = true;
        rec.sitting = true;
      } else if (rec) rec.sitting = false;
      surface(ctx, S);
      const it = ikTable(ctx);
      if (it && (S.sitting || S.moved)) it.visible = false;
    },
    beforeRender(ctx) {
      if (ctx.actor) return;
      const S = st(ctx);
      if (!S.out) return;
      /* people staged somewhere else (a new preset, an actor came or went, someone walked to a mark): once
         everyone stands still, the set is laid out again around where they are now */
      if (S.fig && S.figModel === ctx.model) {
        const cast = castOf(ctx, S);
        if (cast.every((c) => c.settled) && castSig(cast) !== S.castSig) {
          show(ctx, S.text);
          S.relaid = (S.relaid || 0) + 1;
          if (!S.out) return;
        }
      }
      /* the set's own floor stands in for the grid and the Light add-on's dark floor */
      ctx.scene.children.forEach((o) => {
        if ((o.isGridHelper || o.type === "GridHelper" || o.name === "floor") && o.visible) o.visible = false;
      });
      const sketch = ctx.prefs.sketchLook && ctx.prefs.sketchLook !== "off";
      S.out.extra.visible = !sketch;
      /* a dollhouse: a wall between the camera and the set is cut away */
      const cam = ctx.camera.position;
      S.out.walls.forEach((w) => {
        const vis = cam.clone().sub(w.p).dot(w.n) > -0.05;
        w.obj.visible = vis;
        if (w.also) w.also.visible = vis;
      });
    },
  });

  R.sets = { read: readSet, surprise, store, KEY, START, KINDS: Object.keys(BUILD) };
  window.CurioRigSets = {
    state(ctx) {
      const S = st(ctx);
      if (!S.out) return { on: false, pieces: [], walls: [] };
      const T = ctx.THREE;
      ctx.scene.updateMatrixWorld(true);
      const box = (o) => {
        const b = new T.Box3();
        o.traverse((m) => m.isMesh && !m.userData.sketchHull && b.expandByObject(m));
        return b.isEmpty() ? null : [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].map((v) => +v.toFixed(3));
      };
      return {
        on: true,
        place: S.plan.place,
        time: S.plan.time,
        sits: !!S.out.sits,
        sitting: !!S.sitting,
        relaid: S.relaid || 0,
        keep: S.castSig || "",
        seats: S.out.seats.map((r) => ({ i: r.cast.i || 0, name: r.cast.name || "", sitting: !!r.sitting, seatTop: r.seat.seatTop, shared: !!(r.table && r.table.shared), drop: r.drop || 0 })),
        seatTop: S.out.seat ? S.out.seat.seatTop : null,
        table: S.out.table ? { top: S.out.table.top, z0: S.out.table.z0, z1: S.out.table.z1 } : null,
        room: S.out.room,
        drop: S.drop || 0,
        sky: S.bg ? S.bg.getHex() : null,
        moved: !!S.moved,
        lights: S.out.lights.length,
        notes: S.out.notes.slice(),
        walls: S.out.walls.map((w) => ({ name: w.name, visible: w.obj.visible })),
        pieces: S.out.pieces.map((p) => ({ kind: p.kind, mount: p.mount || "", wall: p.wall || "", on: p.on || "", flat: !!p.flat, box: p.obj && p.obj !== S.out.root ? box(p.obj) : null })),
        counts: S.out.K.counts(),
        said: S.said,
      };
    },
    make(ctx, text) {
      const s = store();
      Object.assign(current(s), { text });
      s.on = true;
      keep(s);
      const out = show(ctx, text);
      const S = st(ctx);
      const ls = S.plan ? lightStart(ctx, S.plan) : "";
      S.said = sayPlan(readSet(text), out) + (ls ? " " + ls : "");
      const el = ctx.el.querySelector('[data-ext="sets"] [data-sets="said"]');
      if (el) el.textContent = S.said;
      return !!out;
    },
    clear(ctx) {
      const s = store();
      s.on = false;
      keep(s);
      clear(ctx);
    },
    /* who sits when the words say sitting: a list of actor numbers (0 is actor 1), or null for every person */
    sitters(ctx, list) {
      const S = st(ctx);
      S.sitWho = Array.isArray(list) ? list.slice() : null;
    },
  };
})();
