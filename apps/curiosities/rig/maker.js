/* rig/maker.js: "Make a character from words", an add-on for the 3D characters view (CurioRig.extend).

   Type a description ("spiky blue hair swept back, overalls, a plaid shirt and boots", "an old man with bushy
   eyebrows, a mustache, round glasses and a yellow scarf") and the app builds a character from simple shapes on
   the Plain figure's skeleton. It reads:
   - hair: short, buzz cut, spiky, mohawk, long, curly, bun, ponytail, pigtails, braids, bald, and its color
   - face: eyes, eyebrows (bushy), a mouth (smiling, grumpy, surprised, serious), ears, nose, beard, goatee, long
     beard, mustache, freckles, earrings, glasses, sunglasses
   - on the head: cap, cowboy hat, straw hat, hat, top hat, beanie, crown, chef hat, wizard hat, headband, bandana
   - clothes: t-shirt, shirt (plaid, striped), tank top, jacket or suit, hoodie, sweater, vest, apron, cape, scarf,
     tie, bow tie, gloves, belt, backpack; trousers, jeans, shorts, overalls, skirt, dress, kilt; boots, shoes,
     sneakers, sandals or bare feet
   - a color on any of them ("a yellow scarf", "light blue sneakers", "hair dyed pink")
   - body: skin, heavy, thin, strong, tall, short, a kid (smaller, bigger head), old (gray hair unless a color is
     given, and a slight stoop)
   - a few whole looks (farmer, cowboy, chef, pirate, wizard, king or queen, punk, skater, hiker, scientist,
     detective, grandma or grandpa). Famous characters are never copied: "like Sonic" reads as a hedgehog-style
     spiky hair, not the character.
   Every part is hung on a joint, so all the movement rules, poses, feet and hands, wind and lights work on it. It
   is free and runs on this device. It looks like a clay puppet, not a sculpted model.

   Several made characters are kept in localStorage "curiosities-rig3d-made-v1":
   { text, list: [{ id, name, text }], cur }. "text" is always the current one's words, so the first version's
   { text } still loads (it becomes the first character in the list).
   Face parts carry userData.face ("head", "eye", "brow", "mouth") for rig/faces.js.
   CurioRig.maker = { read(text) -> plan, surprise() -> words, store() -> the saved list, KEY, START,
     dress(ctx, words) -> builds a made character on another skeleton (used by rig/staging.js),
     remember(name, words, makeCurrent) -> keeps a character by name, made or updated (used by rig/scene.js) }. */
(function () {
  const R = window.CurioRig;
  if (!R || !R.extend) return;
  const KEY = "curiosities-rig3d-made-v1";
  const ID = "made";
  const MAX = 24;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const START = "spiky blue hair swept back, a red plaid shirt, denim overalls, a straw hat and brown boots";

  /* ---------- the saved characters ---------- */
  const newId = () => "m" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  function store() {
    let s = {};
    try {
      s = JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      s = {};
    }
    if (typeof s !== "object" || Array.isArray(s)) s = {};
    let list = Array.isArray(s.list) ? s.list.filter((x) => x && typeof x.text === "string").map((x) => ({ id: String(x.id || newId()), name: String(x.name || "My character").slice(0, 40), text: x.text })) : [];
    if (!list.length) list = [{ id: newId(), name: String(s.name || "My character").slice(0, 40), text: typeof s.text === "string" && s.text.trim() ? s.text : START }];
    let cur = list.find((x) => x.id === s.cur) || list[0];
    /* words written the first version's way ({ text } only) win for the current one */
    const migrate = !Array.isArray(s.list) || s.cur !== cur.id || (typeof s.text === "string" && s.text.trim() && s.text !== cur.text);
    if (typeof s.text === "string" && s.text.trim() && s.text !== cur.text) cur.text = s.text;
    const out = { list, cur: cur.id };
    /* written back at once, so each character keeps the same id */
    if (migrate) keep(out);
    return out;
  }
  function keep(s) {
    const cur = s.list.find((x) => x.id === s.cur) || s.list[0];
    try {
      localStorage.setItem(KEY, JSON.stringify({ text: cur ? cur.text : START, list: s.list, cur: cur ? cur.id : "" }));
    } catch (e) {
      /* private window: the words last until the page closes */
    }
  }
  const current = (s) => s.list.find((x) => x.id === s.cur) || s.list[0];

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
    blue: 0x2f6fe0, navy: 0x1f2f66, "navy blue": 0x1f2f66, "sky blue": 0x6fb6f0, "baby blue": 0x9ccbf2, "royal blue": 0x2a4fc0, red: 0xc8302c, crimson: 0xa01c2c, scarlet: 0xd02a1e, burgundy: 0x6a1a2a,
    maroon: 0x6e1f2a, green: 0x3c9a46, "forest green": 0x24603a, lime: 0x8ccf3a, mint: 0x9fe0c0, olive: 0x7a7a32, emerald: 0x1f9a5e, yellow: 0xf2cf3a, mustard: 0xd0a82a, gold: 0xd9a838,
    golden: 0xd9a838, orange: 0xec7a23, peach: 0xf4b48c, coral: 0xf07a64, rust: 0xa84a24, purple: 0x7d4bbf, violet: 0x8a4fd0, lavender: 0xb9a2e6, lilac: 0xc4a8e0, plum: 0x6a2c5e,
    magenta: 0xc4307e, pink: 0xf08cb4, "hot pink": 0xe8448c, black: 0x1e1e22, white: 0xf2f2ee, cream: 0xefe6cc, beige: 0xd8c6a0, gray: 0x8a8d93, grey: 0x8a8d93, charcoal: 0x3a3c42,
    silver: 0xc4c7cc, brown: 0x6b4426, chocolate: 0x4a2c1a, tan: 0xc9a273, khaki: 0xb8a77a, teal: 0x2a9d9a, turquoise: 0x30c0c0, aqua: 0x40d0d0, copper: 0xb0603a, bronze: 0x9a6a30,
    blond: 0xe8c66a, blonde: 0xe8c66a, platinum: 0xece4cc, ginger: 0xc8642c, auburn: 0x8a3a22, strawberry: 0xd06a4a, rainbow: 0xd060c0,
  };
  /* materials only count when no real color is given ("black leather jacket" is black) */
  const STUFF = { denim: 0x3d5a8a, leather: 0x4a3020, straw: 0xd9b86a, wool: 0x9a8a78, tweed: 0x7a6a50, corduroy: 0x8a5a30, canvas: 0xb8a77a, velvet: 0x6a1a3a, silk: 0xe8e0f0, gold: 0xd9a838, silver: 0xc4c7cc };
  const SKINS = { pale: 0xf3d6c2, fair: 0xf0cdb4, light: 0xeac0a0, peach: 0xf0c4a4, olive: 0xc79a6b, tan: 0xc58c5c, tanned: 0xc58c5c, golden: 0xd6a06a, brown: 0x8d5a3a, dark: 0x5c3a24, deep: 0x4a2c1c, green: 0x7fbf6a, blue: 0x6a9ae0 };
  const mix = (a, b, t) => {
    const ch = (x, s) => (x >> s) & 255;
    const m = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
    return (m(16) << 16) | (m(8) << 8) | m(0);
  };
  /* one color word (or two: "light blue", "navy blue") at the end of a list of words */
  function colorAt(words, i) {
    const w = words[i] && words[i].replace(/(-colou?red|ish)$/, "");
    if (!w) return null;
    const two = i > 0 ? words[i - 1] + " " + w : "";
    if (COLORS[two] != null) return { color: COLORS[two], word: two };
    if (COLORS[w] == null) return null;
    const pre = words[i - 1];
    if (pre === "light" || pre === "pale" || pre === "pastel") return { color: mix(COLORS[w], 0xffffff, 0.45), word: pre + " " + w };
    if (pre === "dark" || pre === "deep") return { color: mix(COLORS[w], 0, 0.45), word: "dark " + w };
    if (pre === "bright") return { color: COLORS[w], word: "bright " + w };
    return { color: COLORS[w], word: w };
  }
  function readWords(text) {
    const raw = String(text || "").toLowerCase().replace(/[’`]/g, "'");
    const t = " " + raw.replace(/[^a-z0-9' ,.;!?-]/g, " ").replace(/\s+/g, " ") + " ";
    /* Clauses: a color belongs to the thing named in the same clause. */
    const clauses = t.split(/[,.;!?]|\band\b|\bwith\b|\bplus\b|\bbut\b|\bwearing\b|\bover\b|\bunder\b/);
    const negated = (idx) => /\b(no|without|not|never|nothing|n't)\s+(?:a |an |any |the |his |her |their )?(?:[a-z]+ ){0,2}$/.test(t.slice(Math.max(0, idx - 40), idx));
    const has = (re) => {
      const g = new RegExp(re.source, "g");
      let m;
      while ((m = g.exec(t))) if (!negated(m.index)) return true;
      return false;
    };
    const no = (re) => {
      const g = new RegExp(re.source, "g");
      let m;
      while ((m = g.exec(t))) if (negated(m.index)) return true;
      return false;
    };
    const colorOf = (nounRe) => {
      let stuff = null;
      for (const cl of clauses) {
        const m = cl.match(nounRe);
        if (!m) continue;
        const words = cl.slice(0, m.index).trim().split(/[\s-]+/).filter(Boolean).slice(-5);
        for (let i = words.length - 1; i >= 0; i--) {
          const c = colorAt(words, i);
          if (c) return c;
          if (!stuff && STUFF[words[i]] != null) stuff = { color: STUFF[words[i]], word: words[i] };
        }
        const after = cl.slice(m.index + m[0].length).match(/^\s*(?:is|are|that's|dyed|in|colou?red|of|painted)\s+((?:light |dark |pale |bright |navy |sky |hot |forest )?[a-z]+)/);
        if (after) {
          const ws = after[1].split(" ");
          const c = colorAt(ws, ws.length - 1);
          if (c) return c;
        }
      }
      return stuff;
    };
    const said = [];
    const p = {
      hair: "short", hairColor: 0x4a3020, hairWord: "", brows: "normal", mouth: "smile", beard: false, beardColor: null, mustache: false, freckles: false,
      hat: "", hatColor: null, hatWord: "", top: "tshirt", topColor: 0x7d8a96, topWord: "", plaid: false, stripes: false,
      bottom: "trousers", bottomColor: 0x3d4a5e, bottomWord: "", feet: "shoes", shoesColor: 0x2a2420, shoesWord: "",
      wear: {}, skin: SKINS.light, build: 1, height: 1, kid: false, old: false, look: [], hedgehog: false,
    };
    const wear = (kind, color, word) => (p.wear[kind] = { color, word: word || "" });

    /* ----- whole looks, named in a word; the words after them can change any piece ----- */
    const look = (re, name, fn) => has(re) && (fn(), p.look.push(name));
    look(/\b(farmer|farm|country|hick|redneck|rancher|tennessee|kentucky|hillbilly|appalachian)\b/, "a country look", () =>
      Object.assign(p, { top: "shirt", topColor: 0xb3302a, plaid: true, bottom: "overalls", bottomColor: STUFF.denim, bottomWord: "denim", feet: "boots", shoesColor: 0x6b4426, hat: "straw" })
    );
    look(/\b(cowboy|cowgirl|wrangler)\b(?! hat| boots)/, "a cowboy look", () => {
      Object.assign(p, { hat: "cowboy", top: "shirt", topColor: 0xc9a273, bottom: "trousers", bottomColor: STUFF.denim, feet: "boots", shoesColor: 0x6b4426 });
      wear("kerchief", 0xc8302c);
      wear("belt", 0x4a3020);
    });
    look(/\b(chef|cook|baker)\b(?! hat)/, "a chef", () => {
      Object.assign(p, { hat: "chef", top: "jacket", topColor: 0xf2f2ee, bottom: "trousers", bottomColor: 0x2a2d36 });
      wear("apron", 0xf2f2ee);
    });
    look(/\b(pirate|buccaneer)\b/, "a pirate", () => {
      Object.assign(p, { hat: "bandana", hatColor: 0xc8302c, top: "shirt", topColor: 0xefe6cc, bottom: "trousers", bottomColor: 0x2a2420, feet: "boots", shoesColor: 0x1e1e22 });
      wear("vest", 0x1e1e22);
      wear("earrings", 0xd9a838);
      wear("belt", 0x4a3020);
    });
    look(/\b(wizard|witch|sorcerer|sorceress|mage|warlock)\b(?! hat)/, "a wizard look", () => {
      Object.assign(p, { hat: "wizard", top: "jacket", topColor: 0x4a2c7e, bottom: "dress", bottomColor: 0x4a2c7e });
      wear("cape", 0x2a1c4e);
      if (has(/\b(wizard|sorcerer|warlock)\b/)) (p.beard = "long"), (p.old = true);
    });
    look(/\b(king|queen|prince|princess|royal|monarch|emperor|empress)\b/, "royal", () => {
      Object.assign(p, { hat: "crown", top: "jacket", topColor: 0x6a1a2a });
      wear("cape", 0xa01c2c);
      if (has(/\b(queen|princess|empress)\b/)) Object.assign(p, { top: "dress", bottom: "dress", bottomColor: 0x6a1a2a });
    });
    look(/\b(punk|rocker|rock star|goth)\b/, "a punk look", () => {
      Object.assign(p, { hair: "mohawk", hairColor: 0xe8448c, top: "jacket", topColor: 0x1e1e22, bottom: "trousers", bottomColor: 0x1e1e22, feet: "boots", shoesColor: 0x1e1e22 });
      wear("earrings", 0xc4c7cc);
    });
    look(/\b(skater|skateboarder|surfer)\b/, "a skater look", () => Object.assign(p, { hat: "cap", top: "hoodie", topColor: 0x6d737d, bottom: "shorts", bottomColor: 0xb8a77a, feet: "sneakers", shoesColor: 0xf2f2ee }));
    look(/\b(hiker|camper|explorer|backpacker|scout|mountaineer)\b/, "a hiker", () => {
      Object.assign(p, { top: "shirt", topColor: 0x3c6e47, bottom: "shorts", bottomColor: 0xb8a77a, feet: "boots", shoesColor: 0x6b4426, hat: "hat", hatColor: 0xb8a77a });
      wear("backpack", 0xc8642c);
    });
    look(/\b(scientist|doctor|professor|inventor|chemist)\b/, "a scientist", () => {
      Object.assign(p, { top: "jacket", topColor: 0xf2f2ee });
      wear("glasses", 0x1e1e22);
    });
    look(/\b(nerd|geek|librarian|bookworm|teacher)\b/, "bookish", () => {
      Object.assign(p, { top: "sweater", topColor: 0x8a6a3a });
      wear("glasses", 0x1e1e22);
    });
    look(/\b(detective|private eye|spy|gumshoe)\b/, "a detective", () => Object.assign(p, { top: "jacket", topColor: 0xb8a070, hat: "hat", hatColor: 0x5a4a3a, bottom: "trousers", bottomColor: 0x3a3c42 }));
    look(/\b(business ?(?:man|woman|person)|banker|lawyer|boss|office worker|ceo)\b/, "office clothes", () => {
      Object.assign(p, { top: "jacket", topColor: 0x2a2d36, bottom: "trousers", bottomColor: 0x2a2d36, shoesColor: 0x111111 });
      wear("tie", 0xa01c2c);
    });
    look(/\b(scottish|scots(?:man|woman)?|highlander|bagpiper)\b/, "a Scottish look", () => Object.assign(p, { bottom: "kilt", bottomColor: 0x24603a }));
    look(/\b(grandma|grandmother|granny|nana|grandpa|grandfather|grampa)\b/, "a grandparent", () => {
      p.old = true;
      Object.assign(p, { top: "sweater", topColor: has(/\b(grandma|grandmother|granny|nana|woman|lady)\b/) ? 0xb06a8a : 0x8a6a3a });
      wear("glasses", 0x8a6a3a);
    });
    if (has(/\b(sonic|hedgehog|porcupine|quills)\b/)) Object.assign(p, { hair: "spiky", hairColor: COLORS.blue, hedgehog: true });
    if (has(/\bsuit\b/) && !has(/\b(swim ?suit|space ?suit|wet ?suit|bodysuit|jumpsuit|tracksuit)\b/))
      Object.assign(p, { top: "jacket", topColor: 0x2a2d36, bottom: "trousers", bottomColor: 0x2a2d36, shoesColor: 0x111111 }), p.look.push("a suit");

    /* ----- age and size ----- */
    if (has(/\b(old|elderly|aged|ancient|wrinkly|wrinkled)\b(?! (?:hat|shirt|jacket|coat|boots|shoes|sweater|jeans|scarf|clothes|overalls))/)) p.old = true;
    if (has(/\b(kid|child|toddler|little (?:boy|girl|kid)|young (?:boy|girl)|boy|girl|schoolkid|schoolboy|schoolgirl|kiddo)\b/)) p.kid = true;
    if (has(/\b(young|teen|teenager|teenage)\b/) && !p.kid) p.old = false;

    /* ----- hair ----- */
    const HAIRN = /\b(hair|haired|hairdo|pigtails|braids|plaits|ponytail|bun|mohawk|curls|locks|afro|mullet|buzz ?cut|crew ?cut|quiffs?|quills|spikes)\b/;
    if (has(/\b(spiky|spikes|spiked|quills|hedgehog|porcupine)\b/)) p.hair = "spiky";
    else if (has(/\bmohawk\b/)) p.hair = "mohawk";
    else if (has(/\b(bald|no hair|shaved head|shaven head|hairless)\b/)) p.hair = "none";
    else if (has(/\b(pigtails|bunches)\b/)) p.hair = "pigtails";
    else if (has(/\b(braids|braided|plaits|plaited)\b/)) p.hair = "braids";
    else if (has(/\bponytail\b/)) p.hair = "ponytail";
    else if (has(/\b(bun|top ?knot)\b/)) p.hair = "bun";
    else if (has(/\b(buzz ?cut|crew ?cut|shaved|buzzed)\b/)) p.hair = "buzz";
    else if (has(/\blong\b[a-z ]{0,20}\bhair\b|\blong[- ]haired\b|\bmullet\b/)) p.hair = "long";
    else if (has(/\b(curly|afro|wavy|curls|frizzy|fluffy hair|big hair)\b/)) p.hair = "curly";
    let hc = colorOf(HAIRN);
    const haired = t.match(/\b([a-z]+)[- ]haired\b/);
    if (!hc && haired) hc = colorAt([haired[1]], 0);
    if (!hc && /\bredhead\b|\bred ?head\b/.test(t)) hc = { color: COLORS.red, word: "red" };
    if (!hc && /\bblond(e)?\b/.test(t)) hc = { color: COLORS.blond, word: "blond" };
    if (!hc && /\bbrunette\b/.test(t)) hc = { color: 0x4a2c1a, word: "brown" };
    if (hc) {
      /* plain red washes out to pink under the lights, so red hair gets a deeper red */
      p.hairColor = hc.word === "red" ? 0x8e140e : hc.color;
      p.hairWord = hc.word;
    } else if (p.old) (p.hairColor = 0x9a9ca2), (p.hairWord = "gray");
    else if (p.hedgehog) p.hairWord = "blue";

    /* ----- face ----- */
    if (has(/\b(bushy|thick|big|heavy|furry|caterpillar) (?:eye)?brows\b|\bunibrow\b|\bbushy-browed\b/) || (has(/\bbushy\b/) && !/\bbushy (beard|tail|hair|mustache|moustache)\b/.test(t))) p.brows = "bushy";
    if (has(/\b(grumpy|angry|mad|cross|sad|frowning|frown|scowl|scowling|mean|upset|sulky|stern)\b/)) p.mouth = "frown";
    else if (has(/\b(surprised|shocked|amazed|scared|startled|astonished)\b/)) p.mouth = "open";
    else if (has(/\b(serious|bored|calm|deadpan|blank|tired|sleepy)\b/)) p.mouth = "flat";
    if (has(/\b(long|big|huge|bushy|flowing|santa) beard\b/)) p.beard = "long";
    else if (has(/\bgoatee\b/)) p.beard = "goatee";
    else if (has(/\b(beard|bearded|stubble)\b/)) p.beard = p.beard || "beard";
    if (no(/\bbeard\b/)) p.beard = false;
    if (has(/\b(mustache|moustache|mustached|moustached|'stache|stache|handlebar)\b/)) p.mustache = true;
    const bc = colorOf(/\b(beard|goatee|mustache|moustache|stubble)\b/);
    p.beardColor = bc ? (bc.word === "red" ? 0x8e140e : bc.color) : p.hairColor === 0x8e140e ? 0x8e140e : p.hair === "none" && !p.old ? 0x4a3020 : p.hairColor;
    if (has(/\b(freckles|freckled|freckly)\b/)) p.freckles = true;
    if (has(/\b(sunglasses|shades|sunnies)\b/)) delete p.wear.glasses, wear("sunglasses", (colorOf(/\b(sunglasses|shades)\b/) || {}).color || 0x18181c, (colorOf(/\b(sunglasses|shades)\b/) || {}).word);
    else if (has(/\b(glasses|spectacles|specs|eyeglasses|bifocals|monocle)\b/)) {
      const c = colorOf(/\b(glasses|spectacles|specs|eyeglasses|frames)\b/);
      wear("glasses", c ? c.color : (p.wear.glasses || {}).color || 0x1e1e22, c && c.word);
    }
    if (no(/\b(glasses|spectacles)\b/)) delete p.wear.glasses;
    if (has(/\b(earrings?|hoops|studs|ear ?rings?)\b/)) {
      const c = colorOf(/\b(earrings?|hoops|studs)\b/);
      wear("earrings", c ? c.color : (p.wear.earrings || {}).color || COLORS.gold, c ? c.word : "");
    }

    /* ----- on the head ----- */
    const HATS = [
      ["top", /\b(top hat|tophat|stovepipe)\b/],
      ["cowboy", /\b(cowboy hat|stetson|ten[- ]gallon)\b/],
      ["straw", /\b(straw hat|sun ?hat)\b/],
      ["chef", /\b(chef'?s? hat|toque|baker'?s? hat)\b/],
      ["wizard", /\b(wizard'?s? hat|witch'?s? hat|pointy hat|pointed hat|party hat|cone hat)\b/],
      ["crown", /\b(crown|tiara)\b/],
      ["beanie", /\b(beanie|knit (?:cap|hat)|woolly hat|wool hat|bobble hat|ski hat|toboggan)\b/],
      ["cap", /\b(baseball cap|trucker (?:hat|cap)|ball ?cap|cap)\b/],
      ["hat", /\b(fedora|bowler|trilby|hat)\b/],
      ["bandana", /\b(bandana|bandanna|do-?rag|head ?scarf|kerchief)\b(?! (?:around|on) (?:the |his |her |their )?neck)/],
      ["headband", /\b(headband|head band|sweatband|hair ?band)\b/],
    ];
    for (const [kind, re] of HATS)
      if (has(re)) {
        p.hat = kind;
        const c = colorOf(re);
        if (c) (p.hatColor = c.color), (p.hatWord = c.word);
        else if (kind !== "hat" || !p.hatColor) (p.hatColor = null), (p.hatWord = "");
        break;
      }
    if (has(/\b(no hat|hatless|bare[- ]headed)\b/) || no(/\bhat\b/)) p.hat = "";
    if (p.hatColor == null) p.hatColor = { straw: 0xd9b86a, cowboy: 0x7a5230, top: 0x1e1e22, chef: 0xf2f2ee, wizard: 0x3a2c7e, crown: 0xd9a838, beanie: 0x1f2f66, cap: 0xc8302c, hat: 0x5a4a3a, bandana: 0xc8302c, headband: 0xc8302c }[p.hat] || 0x5a4a3a;

    /* ----- clothes ----- */
    const top = (kind, re) => {
      if (!has(re)) return false;
      p.top = kind;
      return true;
    };
    if (has(/\b(plaid|flannel|checked|checkered|tartan|lumberjack)\b/) && !has(/\b(tartan|plaid) kilt\b/)) (p.plaid = true), p.top === "tshirt" && (p.top = "shirt");
    if (has(/\b(striped|stripy|stripes|stripey|breton)\b/) && !has(/\bstriped (?:trousers|pants|scarf|socks|tie)\b/)) p.stripes = true;
    top("shirt", /\b(shirt|button[- ]up|button[- ]down|blouse|polo)\b/);
    top("tshirt", /\b(t-shirt|tee|t shirt|tshirt)\b/);
    top("tank", /\b(tank top|tank|sleeveless|singlet|muscle shirt)\b/);
    top("sweater", /\b(sweater|jumper|cardigan|turtleneck|pullover|knitted top)\b(?! vest)/);
    top("jacket", /\b(jacket|coat|blazer|parka|tuxedo|trench ?coat|lab coat|robe|tunic)\b/);
    top("hoodie", /\b(hoodie|hoody|hooded (?:top|sweatshirt|jacket)|sweatshirt)\b/);
    const tc = colorOf(/\b(shirt|t-shirt|tee|tshirt|top(?! hat)|jacket|coat|blazer|parka|hoodie|hoody|sweatshirt|sweater|jumper|cardigan|turtleneck|pullover|flannel|blouse|polo|tank|robe|tunic|tuxedo|suit)\b/);
    if (tc) (p.topColor = tc.color), (p.topWord = tc.word);
    const extra = (kind, re, colorRe, dflt) => {
      if (!has(re)) return;
      const c = colorOf(colorRe || re);
      wear(kind, c ? c.color : (p.wear[kind] || {}).color || dflt, c ? c.word : "");
    };
    extra("vest", /\b(vest|waistcoat|sweater vest|gilet)\b/, null, 0x5a4030);
    extra("apron", /\b(apron|pinafore|smock)\b/, null, 0xf2f2ee);
    extra("cape", /\b(cape|cloak|mantle)\b/, null, 0xa01c2c);
    extra("scarf", /\b(scarf|muffler)\b/, null, 0xc8302c);
    extra("kerchief", /\b(neckerchief|(?:bandana|bandanna|kerchief) (?:around|on) (?:the |his |her |their )?neck|neck (?:bandana|scarf))\b/, /\b(neckerchief|bandana|bandanna|kerchief)\b/, 0xc8302c);
    if (has(/\b(bow ?tie|bowtie|dicky bow)\b/)) extra("bowtie", /\b(bow ?tie|bowtie|dicky bow)\b/, null, 0x8e140e);
    else extra("tie", /\b(tie|necktie)\b/, /\b(tie|necktie)\b/, 0xa01c2c);
    extra("gloves", /\b(gloves|gloved|mittens|gauntlets)\b/, null, 0x6b4426);
    extra("belt", /\b(belt|belted)\b/, null, 0x4a3020);
    extra("backpack", /\b(backpack|back pack|rucksack|knapsack|book ?bag|school ?bag)\b/, null, 0x3c6e47);
    ["vest", "apron", "cape", "scarf", "kerchief", "tie", "bowtie", "gloves", "belt", "backpack", "earrings"].forEach((k) => {
      if (no(new RegExp("\\b" + k + "s?\\b"))) delete p.wear[k];
    });

    if (has(/\b(jeans|denim (?:trousers|pants))\b/)) (p.bottom = "trousers"), (p.bottomColor = STUFF.denim), (p.bottomWord = "denim");
    if (has(/\b(trousers|pants|slacks|chinos|leggings|joggers|sweatpants|cargo pants)\b/)) p.bottom = "trousers";
    if (has(/\bshorts\b/)) p.bottom = "shorts";
    if (has(/\b(skirt|miniskirt|tutu)\b/)) p.bottom = "skirt";
    if (has(/\b(kilt)\b/)) p.bottom = "kilt";
    if (has(/\b(dress|gown|robe|frock|sundress)\b/) && !has(/\bdress (?:shirt|shoes|pants|trousers)\b/)) p.bottom = "dress";
    if (has(/\b(overalls?|dungarees|bib overalls|coveralls)\b/)) (p.bottom = "overalls"), p.bottomColor === 0x3d4a5e && ((p.bottomColor = STUFF.denim), (p.bottomWord = "denim"));
    const bt = colorOf(/\b(overalls?|dungarees|coveralls|trousers|pants|slacks|chinos|jeans|shorts|dress|gown|frock|sundress|skirt|kilt|leggings|joggers|sweatpants)\b/);
    if (bt) (p.bottomColor = bt.color), (p.bottomWord = bt.word);
    if (p.bottom === "kilt" && !bt) (p.bottomColor = 0x24603a), (p.bottomWord = "");
    /* a dress is top and bottom in one color */
    if (p.bottom === "dress" && !tc && (bt || !p.look.length)) p.topColor = p.bottomColor;
    if (p.bottom === "dress" && p.top === "tshirt" && !has(/\b(t-shirt|tee|t shirt|tshirt)\b/)) p.top = "dress";

    if (has(/\b(barefoot|bare feet|bare-footed|no shoes|shoeless)\b/)) p.feet = "bare";
    else if (has(/\b(sandals|flip[- ]?flops|thongs|slides)\b/)) p.feet = "sandals";
    else if (has(/\b(sneakers|trainers|running shoes|tennis shoes|high[- ]?tops|kicks|gym shoes)\b/)) p.feet = "sneakers";
    else if (has(/\b(boots|boot|wellies|wellingtons|galoshes)\b/)) p.feet = "boots";
    else if (has(/\b(shoes|loafers|heels|slippers|oxfords|clogs|brogues)\b/)) p.feet = "shoes";
    const sc = colorOf(/\b(boots|shoes|sneakers|trainers|sandals|loafers|heels|slippers|wellies|high[- ]?tops|flip[- ]?flops|kicks|clogs)\b/);
    if (sc) (p.shoesColor = sc.color), (p.shoesWord = sc.word);
    else if (p.feet === "sneakers" && !p.look.includes("a skater look")) p.shoesColor = 0xf2f2ee;
    else if (p.feet === "sandals") p.shoesColor = 0x8a5a30;

    /* ----- skin and body ----- */
    const sk = (t.match(/\b(pale|fair|light|peach|olive|tan|tanned|golden|brown|dark|deep|green|blue)[ -](?:skin|skinned|complexion)\b/) || [])[1];
    if (sk) (p.skin = SKINS[sk]), (p.skinWord = sk);
    if (has(/\b(chubby|fat|heavy|heavyset|stocky|big[- ]bellied|round(?! (?:glasses|spectacles|specs|face|earrings|buttons|collar|hat))|plump|portly|pudgy|tubby|beefy)\b/)) p.build = 1.5;
    else if (has(/\b(skinny|thin|lanky|slim|wiry|slender|scrawny|bony|gangly)\b/)) p.build = 0.72;
    else if (has(/\b(muscular|burly|buff|strong|brawny|athletic|ripped|beefy)\b/)) p.build = 1.3;
    /* "short hair" and "short sleeves" are not a short person */
    const noShortThings = t.replace(/\bshort(?:[ ,-]+[a-z]+)?[ ,-]+(?:hair|haired|sleeves?|sleeved|skirt|beard|shorts|pants|trousers|cape|dress|ponytail|braids|pigtails|bob|cut)\b/g, " ");
    if (has(/\b(tall|lanky|towering|giant|gangly)\b/)) p.height = 1.12;
    if (/\b(short|little|tiny|small|petite|wee)\b/.test(noShortThings) && !has(/\b(tall|giant)\b/)) p.height = 0.88;
    if (p.kid) p.old = false;

    /* ----- what it read, in plain words ----- */
    const a = (w) => (/^[aeiou]/.test(w) ? "an " : "a ") + w;
    const col = (w) => (w ? w + " " : "");
    if (p.look.length) said.push(p.look.join(", "));
    const HAIRSAY = { short: "short hair", buzz: "a buzz cut", spiky: "spiky hair swept back", mohawk: "a mohawk", long: "long hair", curly: "curly hair", bun: "hair in a bun", ponytail: "a ponytail", pigtails: "pigtails", braids: "braids", none: "bald" };
    if (p.hair === "none") said.push("bald");
    else said.push(p.hairWord ? sayHair(p, HAIRSAY) : HAIRSAY[p.hair]);
    if (p.hedgehog) said[said.length - 1] += " (a hedgehog look, not the game character)";
    if (p.brows === "bushy") said.push("bushy eyebrows");
    if (p.mouth !== "smile") said.push({ frown: "a frown", open: "a surprised mouth", flat: "a straight mouth" }[p.mouth]);
    if (p.beard) said.push({ beard: "a beard", goatee: "a goatee", long: "a long beard" }[p.beard]);
    if (p.mustache) said.push("a mustache");
    if (p.freckles) said.push("freckles");
    const W = p.wear;
    if (W.glasses) said.push(col(W.glasses.word) + "glasses");
    if (W.sunglasses) said.push(col(W.sunglasses.word) + "sunglasses");
    if (W.earrings) said.push(col(W.earrings.word) + "earrings");
    const HATSAY = { cap: "cap", cowboy: "cowboy hat", straw: "straw hat", top: "top hat", chef: "chef hat", wizard: "pointy hat", crown: "crown", beanie: "beanie", hat: "hat", bandana: "bandana on the head", headband: "headband" };
    if (p.hat) said.push(a(col(p.hatWord) + HATSAY[p.hat]));
    const TOPSAY = { tshirt: "t-shirt", shirt: "shirt", tank: "tank top", jacket: "jacket", hoodie: "hoodie", sweater: "sweater", dress: "" };
    /* a jacket over a dress is a long robe only when the words say robe (or a wizard look); "a jacket and a dress" stays both */
    const robe = p.bottom === "dress" && p.top === "jacket" && (has(/\b(robe|tunic)\b/) || p.hat === "wizard");
    if (TOPSAY[p.top] && !robe) said.push(a(col(p.topWord) + (p.plaid ? "plaid " : p.stripes ? "striped " : "") + TOPSAY[p.top]));
    const WEARSAY = { vest: "vest", apron: "apron", cape: "cape", scarf: "scarf", kerchief: "neckerchief", tie: "tie", bowtie: "bow tie", gloves: "gloves", belt: "belt", backpack: "backpack" };
    Object.keys(WEARSAY).forEach((k) => W[k] && said.push(k === "gloves" ? col(W[k].word) + "gloves" : a(col(W[k].word) + WEARSAY[k])));
    const BOTSAY = { trousers: "trousers", shorts: "shorts", overalls: "overalls", skirt: "a skirt", dress: "a dress", kilt: "a tartan kilt" };
    if (robe) said.push(a(col(p.bottomWord || p.topWord) + "long robe"));
    else said.push(/^a /.test(BOTSAY[p.bottom]) ? (p.bottomWord ? a(p.bottomWord + " " + BOTSAY[p.bottom].slice(2)) : BOTSAY[p.bottom]) : col(p.bottomWord) + BOTSAY[p.bottom]);
    said.push({ bare: "bare feet", sandals: col(p.shoesWord) + "sandals", sneakers: col(p.shoesWord) + "sneakers", boots: col(p.shoesWord) + "boots", shoes: col(p.shoesWord) + "shoes" }[p.feet]);
    if (p.skinWord) said.push(p.skinWord + " skin");
    if (p.build > 1.4) said.push("heavy build");
    else if (p.build < 0.8) said.push("thin build");
    else if (p.build > 1.2) said.push("strong build");
    if (p.kid) said.push("a kid (smaller, bigger head)");
    else if (p.height > 1.05) said.push("tall");
    else if (p.height < 0.95) said.push("short");
    if (p.old) said.push("old (a slight stoop)");
    p.said = said;
    /* the first version's names, kept for anything that reads them */
    p.shoes = p.shoesColor;
    p.found = !!(p.look.length || hc || p.hair !== "short" || p.hat || Object.keys(W).length || p.beard || p.mustache || p.top !== "tshirt" || p.bottom !== "trousers" || p.feet !== "shoes" || p.kid || p.old || p.build !== 1 || p.height !== 1 || sk || p.freckles || p.brows !== "normal" || tc || bt || sc);
    return p;
  }
  function sayHair(p, HAIRSAY) {
    const w = p.hairWord;
    switch (p.hair) {
      case "short":
        return w + " hair";
      case "buzz":
        return "a " + w + " buzz cut";
      case "spiky":
        return "spiky " + w + " hair swept back";
      case "mohawk":
        return "a " + w + " mohawk";
      case "long":
        return "long " + w + " hair";
      case "curly":
        return "curly " + w + " hair";
      case "bun":
        return w + " hair in a bun";
      case "ponytail":
        return "a " + w + " ponytail";
      default:
        return w + " " + HAIRSAY[p.hair];
    }
  }

  /* ---------- "Surprise me": a random description in the words above ---------- */
  const pickOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const SHADES = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "teal", "navy", "mustard", "maroon", "light blue", "black", "white", "gray", "brown", "lavender", "coral", "forest green"];
  const HAIRC = ["black", "brown", "blond", "ginger", "red", "gray", "auburn", "platinum", "blue", "pink", "purple", "green"];
  function surprise() {
    const c = () => pickOf(SHADES);
    const h = pickOf(HAIRC);
    const parts = [];
    const body = Math.random() < 0.5 ? pickOf(["A tall, skinny grown-up", "A short, round grown-up", "A kid", "An old person", "A strong, tall grown-up", "A small, thin grown-up", "A heavyset grown-up", "A grown-up"]) : "Someone";
    const old = /old/i.test(body);
    parts.push(pickOf([`spiky ${h} hair`, `curly ${h} hair`, `long ${h} hair`, `${h} hair in a bun`, `${h} pigtails`, `${h} braids`, `a ${h} mohawk`, `a ${h} ponytail`, `messy ${h} hair`, "a bald head", `a ${h} buzz cut`]).replace(old ? /\b(black|brown|blond|ginger|red|auburn)\b/ : /^$/, "silver"));
    const face = ["round glasses", "sunglasses", "a bushy mustache", "a beard", "freckles", "bushy eyebrows", "gold earrings", "a goatee", `${c()} glasses`];
    for (let i = Math.floor(Math.random() * 3); i > 0; i--) {
      const f = pickOf(face);
      if (!parts.some((x) => x.split(" ").pop() === f.split(" ").pop())) parts.push(f);
    }
    if (Math.random() < 0.6) parts.push(pickOf([`a ${c()} beanie`, `a ${c()} baseball cap`, "a cowboy hat", "a black top hat", "a gold crown", `a ${c()} headband`, `a ${c()} bandana`, "a straw hat", "a chef hat", `a ${c()} pointy hat`, `a ${c()} hat`]));
    parts.push(pickOf([`a ${c()} hoodie`, `a ${c()} sweater`, `a ${c()} plaid shirt`, `a ${c()} t-shirt`, `a ${c()} jacket`, `a ${c()} striped shirt`, `a ${c()} tank top`, `a ${c()} shirt`]));
    const extras = [`a ${c()} scarf`, `a ${c()} vest`, `a ${c()} apron`, `a ${c()} cape`, `${c()} gloves`, `a ${c()} belt`, `a ${c()} backpack`, `a ${c()} tie`, `a ${c()} bow tie`];
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const e = pickOf(extras);
      if (!parts.some((x) => x.split(" ").pop() === e.split(" ").pop())) parts.push(e);
    }
    parts.push(pickOf([`${c()} trousers`, "blue jeans", `${c()} shorts`, `a ${c()} skirt`, "a tartan kilt", `${c()} overalls`, `a ${c()} dress`]));
    parts.push(pickOf([`${c()} sneakers`, "brown boots", "sandals", "bare feet", "black shoes", `${c()} boots`]));
    const mood = Math.random() < 0.35 ? pickOf([", looking grumpy", ", looking surprised", ", smiling", ", looking serious"]) : "";
    const last = parts.pop();
    return `${body} with ${parts.join(", ")} and ${last}${mood}.`.replace(/\ba ([aeiou])/g, "an $1");
  }

  /* ---------- building it ---------- */
  function drawn(THREE, base, kind) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    const g = cv.getContext("2d");
    g.fillStyle = "#" + new THREE.Color(base).getHexString();
    g.fillRect(0, 0, 64, 64);
    if (kind === "stripes") {
      g.fillStyle = "rgba(255,255,255,.75)";
      [0, 32].forEach((y) => g.fillRect(0, y, 64, 10));
    } else {
      g.fillStyle = "rgba(20,20,30,.45)";
      [0, 32].forEach((x) => g.fillRect(x, 0, 12, 64));
      g.fillStyle = "rgba(20,20,30,.3)";
      [0, 32].forEach((y) => g.fillRect(0, y, 64, 12));
      g.fillStyle = kind === "tartan" ? "rgba(240,40,40,.55)" : "rgba(255,255,255,.25)";
      [20, 52].forEach((x) => g.fillRect(x, 0, 3, 64));
      [20, 52].forEach((y) => g.fillRect(0, y, 64, 3));
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, kind === "stripes" ? 4 : 3);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  function build(ctx, plan) {
    const THREE = ctx.THREE;
    const model = ctx.model;
    const rig = ctx.rig;
    if (!model || !rig || !rig.head || !rig.hips) return;
    model.traverse((o) => o.isSkinnedMesh && (o.visible = false));
    /* height: a kid, short or tall person is the same skeleton, scaled, still standing on the floor */
    const tall = plan.kid ? 0.72 * (plan.height < 1 ? 0.92 : plan.height > 1 ? 1.08 : 1) : plan.height;
    if (Math.abs(tall - 1) > 1e-3) {
      model.scale.multiplyScalar(tall);
      model.updateMatrixWorld(true);
      const b0 = new THREE.Box3().setFromObject(model);
      model.position.y -= b0.min.y;
      model.updateMatrixWorld(true);
      /* the add-ons that measured the figure before it was scaled measure it again */
      R.extensions().forEach((x) => {
        if ((x.id === "ik" || x.id === "camera") && typeof x.built === "function")
          try {
            x.built(ctx);
          } catch (e) {
            /* their own warnings show elsewhere */
          }
      });
    }
    model.updateMatrixWorld(true);
    const P = (b) => b.getWorldPosition(new THREE.Vector3());
    const box = new THREE.Box3().setFromObject(model);
    const H = Math.max(0.5, box.max.y - box.min.y) / (plan.kid ? 0.8 : 1);
    const k = plan.build;
    const mat = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, extra || {}));
    /* Every piece is placed in world space first (and may be nudged after), then all are hung on their joints at
       the end, so a scaled figure (a kid, a tall person) gets the same fit. */
    const parts = [];
    const hung = [];
    const hang = (bone, mesh, face) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.made = true;
      if (face) mesh.userData.face = face;
      hung.push([bone, mesh]);
      parts.push(mesh);
      return mesh;
    };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const up = V(0, 1, 0);
    /* a piece from a to b, hung on bone */
    const limb = (bone, a, b, r, material, r2, seg) => {
      const d = b.clone().sub(a);
      const len = d.length();
      if (len < 1e-4) return null;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r2 == null ? r : r2, r, len, seg || 12), material);
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(up, d.normalize());
      return hang(bone, m);
    };
    const ball = (bone, at, r, material, sy, face) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), material);
      m.position.copy(at);
      if (sy) m.scale.set(1, sy, 1);
      return hang(bone, m, face);
    };
    const boxAt = (bone, at, w, h, d, material) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      m.position.copy(at);
      return hang(bone, m);
    };
    const W = plan.wear;
    let topMat = mat(plan.topColor);
    if (plan.plaid) topMat = mat(0xffffff, { map: drawn(THREE, plan.topColor, "plaid") });
    else if (plan.stripes) topMat = mat(0xffffff, { map: drawn(THREE, plan.topColor, "stripes") });
    const skin = mat(plan.skin, { roughness: 0.65 });
    const bottom = plan.bottom === "kilt" ? mat(0xffffff, { map: drawn(THREE, plan.bottomColor, "tartan"), roughness: 0.9 }) : mat(plan.bottomColor, { roughness: 0.9 });
    const shoes = mat(plan.shoesColor, { roughness: 0.6 });
    const gold = mat(0xd9a838, { metalness: 0.7, roughness: 0.35 });
    const limbR = H * 0.032 * Math.sqrt(k);

    /* ----- torso: hips up to the neck ----- */
    const topBone = rig.neck[0] || rig.head;
    const hip = P(rig.hips);
    const neck = P(topBone);
    const torsoR = H * 0.085 * k;
    const chest = rig.chest || rig.spine[rig.spine.length - 1] || rig.hips;
    const tLen = neck.distanceTo(hip);
    const rTop = torsoR * 0.95;
    const rBot = torsoR * (k > 1.2 ? 1.12 : 0.88);
    const ZS = 0.72;
    const tor = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, tLen * 1.02, 20), plan.top === "dress" ? mat(plan.bottomColor) : topMat);
    tor.position.copy(hip).lerp(neck, 0.5);
    tor.scale.z = ZS;
    hang(chest, tor);
    /* where the front (s = 1) or back (s = -1) of the torso is, t of the way from the hips (0) to the neck (1) */
    const rAt = (t) => rBot + (rTop - rBot) * Math.min(1, Math.max(0, (t * tLen * 1.02 + (tLen * 1.02 - tLen) / 2) / (tLen * 1.02)));
    const onTorso = (t, s, x) => {
      const p = hip.clone().lerp(neck, t);
      const r = rAt(t);
      const xx = x || 0;
      p.x += xx * r;
      p.z = tor.position.z + s * Math.sqrt(Math.max(0, 1 - xx * xx)) * r * ZS;
      return p;
    };
    /* a shell just outside the torso (a vest, a sweater's hem, a belt): t0 to t1, open at the front by gap */
    const shell = (bone, t0, t1, grow, material, gap) => {
      if (!gap && grow < 1.06) grow = 1.06;
      const a = hip.clone().lerp(neck, t0);
      const b = hip.clone().lerp(neck, t1);
      const g = gap || 0;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rAt(t1) * grow, rAt(t0) * grow, b.y - a.y, 22, 1, g > 0, g / 2, Math.PI * 2 - g), material);
      if (g > 0) m.material.side = THREE.DoubleSide;
      m.position.set(tor.position.x, (a.y + b.y) / 2, tor.position.z);
      m.scale.z = ZS;
      return hang(bone, m);
    };
    const darker = (c, f) => mix(c, 0, f || 0.25);

    /* the top's own details */
    if (plan.top === "shirt" || plan.top === "jacket") {
      /* a collar: two small flaps either side of the neck */
      [-1, 1].forEach((s) => {
        const c = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 0.32, tLen * 0.1, torsoR * 0.05), plan.top === "jacket" ? mat(darker(plan.topColor, 0.15)) : topMat);
        c.position.copy(onTorso(0.9, 1, s * 0.28));
        c.position.z += torsoR * 0.03;
        c.rotation.z = s * 0.5;
        hang(chest, c);
      });
    }
    if (plan.top === "jacket" && !W.apron) {
      /* an undershirt showing in a V at the front */
      const v = new THREE.Mesh(new THREE.CylinderGeometry(torsoR * 0.32, 0.001, tLen * 0.32, 3), mat(plan.topColor > 0xd0d0d0 ? 0x2a2d36 : 0xf2f2ee));
      v.position.copy(onTorso(0.82, 1));
      v.position.z -= torsoR * 0.02;
      v.rotation.y = Math.PI;
      v.scale.z = 0.25;
      hang(chest, v);
      /* buttons */
      [0.35, 0.5].forEach((t) => ball(chest, onTorso(t, 1), torsoR * 0.05, mat(darker(plan.topColor, 0.5))));
    }
    if (plan.top === "hoodie") {
      /* the hood lies on the shoulders behind the neck; a pocket in front; two strings */
      const hood = new THREE.Mesh(new THREE.TorusGeometry(torsoR * 0.55, torsoR * 0.22, 10, 20), topMat);
      hood.position.copy(neck);
      hood.position.z = tor.position.z - torsoR * 0.12;
      hood.position.y -= tLen * 0.02;
      hood.rotation.x = Math.PI / 2 - 0.35;
      hood.scale.set(1, 0.85, 1);
      hang(chest, hood);
      const pk = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 1.0, tLen * 0.2, torsoR * 0.06), mat(darker(plan.topColor, 0.12)));
      pk.position.copy(onTorso(0.22, 1));
      hang(chest, pk);
      [-1, 1].forEach((s) => limb(chest, onTorso(0.92, 1, s * 0.15), onTorso(0.68, 1, s * 0.17).add(V(0, 0, torsoR * 0.02)), torsoR * 0.025, mat(0xf2f2ee)));
    }
    if (plan.top === "sweater") {
      /* a ribbed hem and collar */
      shell(chest, 0, 0.1, 1.05, mat(darker(plan.topColor, 0.15)));
      limb(topBone, neck.clone().add(V(0, -tLen * 0.06, 0)), neck.clone().add(V(0, tLen * 0.08, 0)), limbR * 1.65, mat(darker(plan.topColor, 0.15)));
    }
    if (plan.top === "tank" || plan.top === "tshirt") {
      /* a neckline */
      const nl = new THREE.Mesh(new THREE.TorusGeometry(limbR * 1.5, limbR * 0.22, 8, 18), mat(darker(plan.topColor, 0.2)));
      nl.position.copy(neck);
      nl.position.y -= tLen * 0.02;
      nl.rotation.x = Math.PI / 2;
      hang(chest, nl);
    }

    /* ----- below the waist ----- */
    if (plan.bottom === "overalls") {
      /* the bib on the front, two straps over the shoulders, a pocket, the buttons */
      const bib = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 1.15, tLen * 0.55, torsoR * 0.12), bottom);
      bib.position.copy(hip).lerp(neck, 0.36);
      bib.position.z = onTorso(0.36, 1).z + torsoR * 0.02;
      hang(chest, bib);
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 0.45, tLen * 0.14, torsoR * 0.05), mat(darker(plan.bottomColor, 0.2)));
      pocket.position.copy(bib.position);
      pocket.position.y += tLen * 0.06;
      pocket.position.z += torsoR * 0.08;
      hang(chest, pocket);
      [-1, 1].forEach((s) => {
        const st = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 0.16, tLen * 0.6, rTop * ZS * 2.15), bottom);
        st.position.copy(hip).lerp(neck, 0.78);
        st.position.x += s * torsoR * 0.42;
        st.position.z = tor.position.z;
        hang(chest, st);
        const bt = ball(chest, onTorso(0.62, 1, s * 0.42), torsoR * 0.07, gold);
        bt.position.z += torsoR * 0.05;
      });
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(torsoR * 0.92, torsoR * 0.92, tLen * 0.22, 18), bottom);
      belt.position.copy(hip).lerp(neck, 0.08);
      belt.position.z = tor.position.z;
      belt.scale.z = 0.76;
      hang(rig.hips, belt);
    } else if ((plan.bottom === "trousers" || plan.bottom === "shorts") && !/^(sweater|hoodie|jacket)$/.test(plan.top)) {
      /* the waistband, where the top does not already cover it */
      shell(rig.hips, 0, 0.1, 1.03, bottom);
    }
    const skirtLike = plan.bottom === "skirt" || plan.bottom === "dress" || plan.bottom === "kilt";
    const legTops = ["L", "R"].map((x) => rig.legs[x][0]).filter(Boolean).map(P);
    const knees = ["L", "R"].map((x) => rig.legs[x][1]).filter(Boolean).map(P);
    if (skirtLike && legTops.length) {
      /* from the waist down, flaring out over the legs: a skirt to mid-thigh, a kilt to the knee, a dress below it */
      const waist = hip.clone().lerp(neck, 0.12);
      const kneeY = knees.length ? Math.min(...knees.map((v) => v.y)) : hip.y - H * 0.25;
      const hemY = plan.bottom === "skirt" ? (hip.y + kneeY) / 2 : plan.bottom === "kilt" ? kneeY + H * 0.03 : kneeY - H * 0.06;
      const spread = legTops.length === 2 ? legTops[0].distanceTo(legTops[1]) / 2 : torsoR;
      const flare = plan.bottom === "dress" ? 2.1 : plan.bottom === "kilt" ? 1.75 : 1.9;
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(rAt(0.12) * 1.04, Math.max(torsoR * flare, spread + limbR * 3), waist.y - hemY, 22, 1, true), plan.bottom === "kilt" ? bottom : mat(plan.bottomColor, { side: THREE.DoubleSide, roughness: 0.85 }));
      sk.material.side = THREE.DoubleSide;
      sk.position.set(tor.position.x, (waist.y + hemY) / 2, tor.position.z);
      sk.scale.z = 0.82;
      hang(rig.hips, sk);
      if (plan.bottom === "kilt") {
        /* the pouch at the front */
        const pouch = boxAt(rig.hips, onTorso(0, 1), torsoR * 0.42, tLen * 0.2, torsoR * 0.12, mat(0x4a3020));
        pouch.position.y -= tLen * 0.14;
        pouch.position.z += torsoR * 0.3;
      }
    }

    /* the seat: from the hips down past the tops of the legs, so body and legs join */
    if (legTops.length) {
      const low = Math.min(...legTops.map((v) => v.y)) - limbR * 1.6;
      const spread = legTops.length === 2 ? legTops[0].distanceTo(legTops[1]) / 2 + limbR * 1.5 : torsoR;
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(torsoR * 0.9, spread), Math.max(torsoR * 0.8, spread * 0.95), Math.max(limbR * 2, hip.y - low + limbR), 16), skirtLike ? (plan.bottom === "kilt" ? bottom : mat(plan.bottomColor)) : bottom);
      seat.position.set(hip.x, (hip.y + limbR + low) / 2, hip.z);
      seat.scale.z = 0.76;
      hang(rig.hips, seat);
    }

    /* ----- over the clothes ----- */
    if (W.vest) {
      const ve = shell(chest, 0.04, 0.93, 1.07, mat(W.vest.color, { roughness: 0.75 }), 0.75);
      ve.userData.vest = true;
      [0.3, 0.45, 0.6].forEach((t) => ball(chest, onTorso(t, 1, 0.24).add(V(0, 0, torsoR * 0.06)), torsoR * 0.045, mat(darker(W.vest.color, 0.5))));
    }
    if (W.apron) {
      const am = mat(W.apron.color, { roughness: 0.9 });
      const bib = boxAt(chest, onTorso(0.55, 1), torsoR * 1.0, tLen * 0.5, torsoR * 0.05, am);
      bib.position.z += torsoR * 0.06;
      const kneeY = knees.length ? Math.min(...knees.map((v) => v.y)) : hip.y - H * 0.2;
      const lowY = (hip.y + kneeY) / 2 - H * 0.02;
      const front = onTorso(0.3, 1);
      const seatR = legTops.length === 2 ? Math.max(torsoR * 0.9, legTops[0].distanceTo(legTops[1]) / 2 + limbR * 1.5) : torsoR;
      const sk = boxAt(rig.hips, V(front.x, (front.y + lowY) / 2, Math.max(front.z, hip.z + seatR * 0.76) + torsoR * 0.05), torsoR * 1.35, front.y - lowY, torsoR * 0.05, am);
      sk.rotation.x = -0.04;
      shell(rig.hips, 0.26, 0.32, 1.06, am);
      [-1, 1].forEach((s) => limb(chest, onTorso(0.8, 1, s * 0.4).add(V(0, 0, torsoR * 0.06)), neck.clone().add(V(s * limbR * 1.4, tLen * 0.02, 0)), torsoR * 0.04, am));
    }
    if (W.belt && plan.bottom !== "overalls" && plan.bottom !== "dress") {
      shell(rig.hips, 0.06, 0.14, 1.07, mat(W.belt.color, { roughness: 0.5 }));
      const bk = boxAt(rig.hips, onTorso(0.1, 1), torsoR * 0.32, tLen * 0.1, torsoR * 0.06, gold);
      bk.position.z += torsoR * 0.08;
    }
    if (W.backpack) {
      const bm = mat(W.backpack.color, { roughness: 0.8 });
      const back = onTorso(0.55, -1);
      const bag = boxAt(chest, back.clone().add(V(0, 0, -torsoR * 0.36)), torsoR * 1.15, tLen * 0.55, torsoR * 0.62, bm);
      const flap = boxAt(chest, back.clone().add(V(0, tLen * 0.2, -torsoR * 0.38)), torsoR * 1.2, tLen * 0.16, torsoR * 0.68, mat(darker(W.backpack.color, 0.2)));
      flap.userData.flap = true;
      const pk = boxAt(chest, back.clone().add(V(0, -tLen * 0.1, -torsoR * 0.72)), torsoR * 0.7, tLen * 0.2, torsoR * 0.16, mat(darker(W.backpack.color, 0.12)));
      pk.userData.pocket = bag;
      [-1, 1].forEach((s) => {
        const st = new THREE.Mesh(new THREE.BoxGeometry(torsoR * 0.14, tLen * 0.5, rTop * ZS * 2.2), mat(darker(W.backpack.color, 0.35)));
        st.position.copy(hip).lerp(neck, 0.74);
        st.position.x += s * torsoR * 0.5;
        st.position.z = tor.position.z;
        hang(chest, st);
      });
    }
    if (W.cape) {
      const cm = mat(W.cape.color, { side: THREE.DoubleSide, roughness: 0.85 });
      const kneeY = knees.length ? Math.min(...knees.map((v) => v.y)) : hip.y - H * 0.2;
      const topY = neck.y - tLen * 0.02;
      const hemY = kneeY - H * 0.04;
      const wide = rTop * 1.12;
      const cp = new THREE.Mesh(new THREE.CylinderGeometry(wide, torsoR * 1.9, topY - hemY, 20, 1, true, Math.PI / 2 + 0.25, Math.PI - 0.5), cm);
      cp.position.set(tor.position.x, (topY + hemY) / 2, tor.position.z - torsoR * 0.08);
      cp.scale.z = 0.85;
      hang(chest, cp);
      /* a clasp at the collar */
      const cl = new THREE.Mesh(new THREE.TorusGeometry(limbR * 1.55, limbR * 0.25, 8, 18), cm);
      cl.position.copy(neck);
      cl.position.y -= tLen * 0.03;
      cl.rotation.x = Math.PI / 2;
      hang(chest, cl);
      ball(chest, onTorso(0.95, 1, 0).add(V(0, 0, limbR * 0.4)), limbR * 0.35, gold);
    }

    /* ----- the neck and what goes round it ----- */
    const hp = P(rig.head);
    if (rig.neck[0]) limb(rig.neck[0], neck, hp, limbR * 1.25, skin);
    if (W.scarf) {
      const sm = mat(W.scarf.color, { roughness: 0.95 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(limbR * 1.55, limbR * 0.7, 10, 20), sm);
      ring.position.copy(neck).lerp(hp, 0.2);
      ring.rotation.x = Math.PI / 2;
      hang(topBone, ring);
      /* the loose end hangs down the front */
      const end = boxAt(chest, onTorso(0.72, 1, -0.3).add(V(0, 0, torsoR * 0.08)), limbR * 1.6, tLen * 0.38, limbR * 0.45, sm);
      end.rotation.z = 0.08;
      for (let i = 0; i < 3; i++) boxAt(chest, onTorso(0.53, 1, -0.3).add(V((i - 1) * limbR * 0.5, -tLen * 0.02, torsoR * 0.08)), limbR * 0.22, tLen * 0.06, limbR * 0.4, sm);
    }
    if (W.kerchief) {
      const km = mat(W.kerchief.color, { roughness: 0.9 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(limbR * 1.4, limbR * 0.38, 8, 18), km);
      ring.position.copy(neck).lerp(hp, 0.12);
      ring.rotation.x = Math.PI / 2;
      hang(topBone, ring);
      const tri = new THREE.Mesh(new THREE.CylinderGeometry(torsoR * 0.38, 0.001, tLen * 0.24, 3), km);
      tri.position.copy(onTorso(0.86, 1)).add(V(0, 0, torsoR * 0.03));
      tri.rotation.y = Math.PI;
      tri.scale.z = 0.2;
      hang(chest, tri);
    }
    if (W.tie) {
      const tm = mat(W.tie.color, { roughness: 0.5 });
      const knot = boxAt(chest, onTorso(0.92, 1).add(V(0, 0, torsoR * 0.04)), torsoR * 0.16, tLen * 0.07, torsoR * 0.08, tm);
      knot.userData.knot = true;
      const a = onTorso(0.9, 1).add(V(0, 0, torsoR * 0.04));
      const b = onTorso(0.42, 1).add(V(0, 0, torsoR * 0.04));
      const blade = new THREE.Mesh(new THREE.CylinderGeometry(torsoR * 0.08, torsoR * 0.15, a.y - b.y, 4), tm);
      blade.position.copy(a).lerp(b, 0.5);
      blade.position.z = Math.max(a.z, b.z) + torsoR * 0.03;
      blade.rotation.y = Math.PI / 4;
      blade.scale.z = 0.25;
      hang(chest, blade);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(torsoR * 0.15, tLen * 0.07, 4), tm);
      tip.position.copy(b).add(V(0, -tLen * 0.035, 0));
      tip.position.z = blade.position.z;
      tip.rotation.set(Math.PI, Math.PI / 4, 0);
      tip.scale.z = 0.25;
      hang(chest, tip);
    }
    if (W.bowtie) {
      const bm = mat(W.bowtie.color, { roughness: 0.5 });
      const at = onTorso(0.94, 1).add(V(0, 0, torsoR * 0.06));
      [-1, 1].forEach((s) => {
        const w = new THREE.Mesh(new THREE.ConeGeometry(torsoR * 0.13, torsoR * 0.3, 8), bm);
        w.position.copy(at).add(V(s * torsoR * 0.14, 0, 0));
        w.rotation.z = s * Math.PI / 2;
        w.scale.z = 0.5;
        hang(chest, w);
      });
      ball(chest, at, torsoR * 0.06, bm);
    }

    /* ----- the head and face ----- */
    const headR = H * 0.072 * (plan.kid ? 1.22 : 1);
    const hc = hp.clone();
    hc.y += headR * 0.75;
    const SY = 1.12;
    const head = ball(rig.head, hc, headR, skin, SY, "head");
    /* a point on the face: x, y across and up in head sizes, d out from the skin */
    const face = (x, y, d) => {
      const z = Math.sqrt(Math.max(0, 1 - x * x - (y / SY) * (y / SY)));
      return hc.clone().add(V(x * headR, y * headR, (z + (d || 0)) * headR));
    };
    const browColor = plan.hair === "none" && !plan.old ? 0x3a2a1c : plan.hairColor;
    const eyeR = plan.kid ? 0.22 : 0.19;
    [-1, 1].forEach((s) => {
      ball(rig.head, face(s * 0.34, 0.1, -0.06), headR * eyeR, mat(0xffffff, { roughness: 0.35 }), 1.1, "eye");
      ball(rig.head, face(s * 0.32, 0.08, eyeR - 0.1), headR * 0.105, mat(0x18181c, { roughness: 0.3 }), 1.1, "eye");
      /* eyebrows: bushy ones are thicker; grumpy ones slope down to the middle */
      const bushy = plan.brows === "bushy";
      const br = new THREE.Mesh(new THREE.BoxGeometry(headR * (bushy ? 0.44 : 0.34), headR * (bushy ? 0.14 : 0.07), headR * (bushy ? 0.16 : 0.1)), mat(browColor, { roughness: 0.9 }));
      br.position.copy(face(s * 0.34, 0.38, bushy ? 0.04 : 0.02));
      br.rotation.y = s * 0.35;
      br.rotation.z = s * (plan.mouth === "frown" ? 0.28 : plan.mouth === "open" ? -0.22 : -0.1);
      hang(rig.head, br, "brow");
      /* ears */
      const ear = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.24, 14, 10), skin);
      ear.position.copy(hc).add(V(s * headR * 0.97, 0, -headR * 0.02));
      ear.scale.set(0.5, 1.05, 0.8);
      hang(rig.head, ear);
      if (W.earrings) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.1, headR * 0.025, 6, 14), mat(W.earrings.color, { metalness: 0.7, roughness: 0.3 }));
        ring.position.copy(hc).add(V(s * headR * 1.0, -headR * 0.32, 0));
        ring.rotation.y = Math.PI / 2;
        hang(rig.head, ring);
      }
    });
    ball(rig.head, face(0, -0.08, 0.04), headR * 0.16, skin);
    /* the mouth: a smile, a frown, an open "o" or a straight line */
    const mouthMat = mat(0x5a2420, { roughness: 0.6 });
    if (plan.mouth === "open") {
      const m = ball(rig.head, face(0, -0.45, 0.0), headR * 0.12, mouthMat, 1.3, "mouth");
      m.scale.z = 0.5;
    } else if (plan.mouth === "flat") {
      const m = boxAt(rig.head, face(0, -0.42, 0.0), headR * 0.34, headR * 0.05, headR * 0.06, mouthMat);
      m.userData.face = "mouth";
    } else {
      const frown = plan.mouth === "frown";
      const m = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.2, headR * 0.035, 6, 16, Math.PI), mouthMat);
      m.position.copy(face(0, frown ? -0.56 : -0.3, -0.06));
      m.rotation.z = frown ? 0 : Math.PI;
      m.rotation.x = frown ? 0.25 : -0.25;
      hang(rig.head, m, "mouth");
    }
    if (plan.freckles) {
      const fm = mat(0xa0522d, { roughness: 0.8 });
      [-1, 1].forEach((s) =>
        [
          [0.5, -0.12],
          [0.62, -0.2],
          [0.44, -0.24],
          [0.58, -0.04],
        ].forEach(([x, y]) => ball(rig.head, face(s * x, y, -0.02), headR * 0.045, fm))
      );
    }
    if (W.glasses || W.sunglasses) {
      const g = W.glasses || W.sunglasses;
      const fm = mat(g.color, { metalness: 0.3, roughness: 0.4 });
      const lens = W.sunglasses ? mat(0x111114, { metalness: 0.4, roughness: 0.15 }) : null;
      const z = hc.z + headR * 1.08;
      [-1, 1].forEach((s) => {
        const ctr = V(hc.x + s * headR * 0.34, hc.y + headR * 0.1, z);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.21, headR * 0.035, 8, 20), fm);
        ring.position.copy(ctr);
        hang(rig.head, ring);
        if (lens) {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.2, headR * 0.2, headR * 0.03, 20), lens);
          l.position.copy(ctr);
          l.rotation.x = Math.PI / 2;
          hang(rig.head, l);
        }
        /* the arm back to the ear */
        limb(rig.head, ctr.clone().add(V(s * headR * 0.2, 0, 0)), hc.clone().add(V(s * headR * 0.95, headR * 0.1, 0)), headR * 0.025, fm);
      });
      limb(rig.head, V(hc.x - headR * 0.13, hc.y + headR * 0.12, z), V(hc.x + headR * 0.13, hc.y + headR * 0.12, z), headR * 0.03, fm);
    }

    /* ----- hair ----- */
    const hairM = mat(plan.hairColor, { roughness: 0.55 });
    const cap = (r, sy, dy, dz) => {
      const c = ball(rig.head, hc.clone().add(V(0, headR * (dy == null ? 0.22 : dy), -headR * (dz == null ? 0.12 : dz))), headR * r, hairM, sy);
      c.userData.hairCap = true;
      return c;
    };
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
          const base = hc.clone().add(V(x * headR, y * headR, z * headR * 0.6));
          const dir = V(x * 0.35, 0.35 - ri * 0.18, -1).normalize();
          const sp = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.32, headR * (1.3 + len), 8), hairM);
          sp.position.copy(base).addScaledVector(dir, headR * (0.65 + len * 0.5));
          sp.quaternion.setFromUnitVectors(up, dir);
          hang(rig.head, sp);
        }
      });
      cap(1.04, 1.05, 0.18, 0.12).scale.z = 1.02;
    } else if (plan.hair === "mohawk") {
      for (let i = 0; i < 7; i++) {
        const a = -0.5 + i * 0.32;
        const base = hc.clone().add(V(0, Math.cos(a) * headR * SY, -Math.sin(a) * headR));
        const sp = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.24, headR * (i === 0 || i === 6 ? 0.9 : 1.35), 6), hairM);
        sp.position.copy(base).addScaledVector(base.clone().sub(hc).normalize(), headR * 0.45);
        sp.quaternion.setFromUnitVectors(up, base.clone().sub(hc).normalize());
        hang(rig.head, sp);
      }
    } else if (plan.hair === "buzz") {
      cap(1.02, 1.0, 0.2, 0.1);
    } else if (plan.hair !== "none") {
      const curly = plan.hair === "curly";
      const c = cap(curly ? 1.16 : 1.06, curly ? 1.02 : 0.95);
      if (curly) {
        /* little curls all over the cap */
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const y = i % 2 ? 0.55 : 0.95;
          const r = Math.sqrt(Math.max(0, 1 - y * y * 0.7));
          const at = c.position.clone().add(V(Math.sin(a) * r * headR * 1.1, y * headR, Math.cos(a) * r * headR * 1.1 - headR * 0.08));
          if (at.z - hc.z > headR * 0.55 && at.y - hc.y < headR * 0.9) continue; /* keep the face clear */
          ball(rig.head, at, headR * 0.3, hairM);
        }
      }
      if (plan.hair === "long") {
        /* a curtain of hair round the back and sides, down to the shoulders */
        const curtain = new THREE.Mesh(new THREE.CylinderGeometry(headR * 1.02, headR * 1.3, headR * 1.7, 22, 1, true, Math.PI - 1.4, 2.8), mat(plan.hairColor, { roughness: 0.55, side: THREE.DoubleSide }));
        curtain.position.copy(hc).add(V(0, -headR * 0.8, -headR * 0.12));
        curtain.scale.z = 0.95;
        hang(rig.head, curtain);
      }
      if (plan.hair === "bun") ball(rig.head, hc.clone().add(V(0, headR * 1.1, -headR * 0.45)), headR * 0.45, hairM);
      if (plan.hair === "ponytail") {
        ball(rig.head, hc.clone().add(V(0, headR * 0.3, -headR * 1.05)), headR * 0.26, hairM);
        limb(rig.head, hc.clone().add(V(0, headR * 0.25, -headR * 1.1)), hc.clone().add(V(0, -headR * 1.4, -headR * 1.45)), headR * 0.14, hairM, headR * 0.28);
      }
      if (plan.hair === "pigtails")
        [-1, 1].forEach((s) => {
          ball(rig.head, hc.clone().add(V(s * headR * 0.95, headR * 0.35, -headR * 0.35)), headR * 0.22, hairM);
          limb(rig.head, hc.clone().add(V(s * headR * 1.05, headR * 0.3, -headR * 0.35)), hc.clone().add(V(s * headR * 1.5, -headR * 0.7, -headR * 0.45)), headR * 0.12, hairM, headR * 0.3);
        });
      if (plan.hair === "braids")
        [-1, 1].forEach((s) => {
          for (let i = 0; i < 6; i++) {
            const f = i / 5;
            ball(rig.head, hc.clone().add(V(s * headR * (0.78 + f * 0.12), headR * (-0.25 - f * 1.65), -headR * (0.55 + f * 0.1))), headR * (0.2 - f * 0.04), hairM, 1.25);
          }
          ball(rig.head, hc.clone().add(V(s * headR * 0.9, -headR * 2.05, -headR * 0.65)), headR * 0.1, mat(darker(plan.hairColor, 0.4)));
        });
    }
    if (plan.beard) {
      const bm = mat(plan.beardColor, { roughness: 0.9 });
      if (plan.beard === "goatee") {
        const g = ball(rig.head, face(0, -0.72, -0.12), headR * 0.22, bm, 1.3);
        g.scale.z = 0.7;
      } else {
        const long = plan.beard === "long";
        const bd = ball(rig.head, hc.clone().add(V(0, -headR * (long ? 0.75 : 0.55), headR * 0.45)), headR * (long ? 0.72 : 0.62), bm, long ? 1.55 : 1.1);
        bd.scale.z = 0.8;
      }
    }
    if (plan.mustache) {
      const mm = mat(plan.beardColor, { roughness: 0.9 });
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.16, 14, 10), mm);
        m.position.copy(face(s * 0.15, -0.24, 0.06));
        m.scale.set(1.35, 0.55, 0.7);
        m.rotation.z = s * 0.3;
        hang(rig.head, m);
      });
    }

    /* ----- on the head ----- */
    if (plan.hat) {
      const hm = mat(plan.hatColor, { roughness: 0.85 });
      const big = plan.hair === "curly" ? 1.12 : 1;
      const topY = hc.y + headR * (plan.hair === "spiky" ? 0.95 : 0.85) * (plan.hair === "curly" ? 1.1 : 1);
      const at = (dy, dz) => V(hc.x, topY + headR * dy, hc.z + headR * (dz || 0));
      const cyl = (rt, rb, h, pos, m, seg) => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(rt * headR, rb * headR, h * headR, seg || 24), m || hm);
        c.position.copy(pos);
        return hang(rig.head, c);
      };
      if (plan.hat === "cap") {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.08 * big, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), hm);
        crown.position.copy(at(-0.35, -0.05));
        hang(rig.head, crown);
        const bill = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.75, headR * 0.75, headR * 0.07, 20, 1, false, -Math.PI / 2, Math.PI), hm);
        bill.position.copy(at(-0.33, 0.75));
        bill.scale.set(1, 1, 0.9);
        hang(rig.head, bill);
        ball(rig.head, at(0.72, -0.05), headR * 0.1, hm);
      } else if (plan.hat === "beanie") {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.12 * big, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), hm);
        crown.position.copy(at(-0.45, -0.08));
        crown.scale.y = 1.15;
        hang(rig.head, crown);
        cyl(1.14 * big, 1.14 * big, 0.32, at(-0.4, -0.08), mat(darker(plan.hatColor, 0.15)));
        ball(rig.head, at(0.85, -0.08), headR * 0.3, mat(mix(plan.hatColor, 0xffffff, 0.5)));
      } else if (plan.hat === "top") {
        cyl(1.55, 1.55, 0.08, at(-0.12));
        cyl(0.95, 0.9, 1.7, at(0.75));
        cyl(0.93, 0.93, 0.25, at(0.07), mat(plan.hatColor === 0x1e1e22 ? 0x8e140e : darker(plan.hatColor, 0.5)));
      } else if (plan.hat === "chef") {
        cyl(0.92, 0.95, 0.75, at(0.2), hm);
        const puff = ball(rig.head, at(0.85), headR * 1.15, hm, 0.7);
        puff.scale.x = 1.05;
      } else if (plan.hat === "wizard") {
        cyl(1.8, 1.8, 0.07, at(-0.1));
        const cone = new THREE.Mesh(new THREE.ConeGeometry(headR * 1.0, headR * 2.4, 22), hm);
        cone.position.copy(at(1.12, -0.1));
        cone.rotation.x = -0.18;
        hang(rig.head, cone);
        cyl(1.0, 1.02, 0.22, at(0.02), mat(0xd9a838));
      } else if (plan.hat === "crown") {
        const gm = mat(plan.hatColor, { metalness: 0.75, roughness: 0.3 });
        const band = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.9, headR * 0.86, headR * 0.4, 24, 1, true), gm);
        band.material.side = THREE.DoubleSide;
        band.position.copy(at(0.0, -0.05));
        hang(rig.head, band);
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const pt = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.16, headR * 0.42, 6), gm);
          pt.position.copy(at(0.38, -0.05)).add(V(Math.sin(a) * headR * 0.88, 0, Math.cos(a) * headR * 0.88));
          hang(rig.head, pt);
          ball(rig.head, at(0.02, -0.05).add(V(Math.sin(a) * headR * 0.9, 0, Math.cos(a) * headR * 0.9)), headR * 0.07, mat(i % 2 ? 0x2f6fe0 : 0xc8302c, { roughness: 0.2 }));
        }
      } else if (plan.hat === "headband") {
        const hb = new THREE.Mesh(new THREE.TorusGeometry(headR * 1.08 * big, headR * 0.09, 8, 28), hm);
        hb.position.copy(hc).add(V(0, headR * 0.42, -headR * 0.08));
        hb.rotation.x = Math.PI / 2 + 0.25;
        hang(rig.head, hb);
      } else if (plan.hat === "bandana") {
        const top = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.1 * big, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2 + 0.15), hm);
        top.position.copy(hc).add(V(0, headR * 0.3, -headR * 0.1));
        top.rotation.x = -0.3;
        hang(rig.head, top);
        const knot = ball(rig.head, hc.clone().add(V(0, headR * 0.15, -headR * 1.12)), headR * 0.2, hm);
        knot.scale.z = 0.7;
        [-1, 1].forEach((s) => limb(rig.head, hc.clone().add(V(s * headR * 0.08, headR * 0.1, -headR * 1.15)), hc.clone().add(V(s * headR * 0.35, -headR * 0.6, -headR * 1.3)), headR * 0.06, hm, headR * 0.13));
      } else {
        /* straw, cowboy and a plain hat: a brim and a crown */
        const brimR = plan.hat === "cowboy" ? 2.0 : plan.hat === "straw" ? 2.3 : 1.6;
        const brim = cyl(brimR * big, brimR * big, 0.08, at(-0.1), hm, 28);
        if (plan.hat === "cowboy") brim.scale.z = 0.8;
        cyl(0.9 * big, 1.05 * big, plan.hat === "hat" ? 1.0 : 0.9, at(plan.hat === "hat" ? 0.38 : 0.32));
        if (plan.hat === "cowboy") {
          /* the dent in the top */
          const dent = cyl(0.55, 0.7, 0.12, at(0.8), mat(darker(plan.hatColor, 0.2)));
          dent.scale.z = 0.6;
        }
        cyl(1.06 * big, 1.07 * big, 0.18, at(0.0), mat(plan.hat === "straw" ? 0x7a2a22 : darker(plan.hatColor, 0.45)));
      }
    }

    /* ----- arms and legs ----- */
    const longSleeves = plan.top === "jacket" || plan.top === "hoodie" || plan.top === "sweater" || plan.top === "shirt";
    const handMat = W.gloves ? mat(W.gloves.color, { roughness: 0.7 }) : skin;
    ["L", "R"].forEach((s) => {
      const arm = rig.arms[s];
      if (arm.length >= 3) {
        const [sh, el, wr] = arm;
        const a = P(sh);
        const b = P(el);
        const c = P(wr);
        limb(sh, a, b, limbR * 1.15, plan.top === "tank" ? skin : topMat, limbR * 1.05);
        limb(el, b, c, limbR * 0.95, longSleeves ? topMat : skin, limbR * 1.0);
        if (plan.top === "sweater" || plan.top === "hoodie") limb(el, c.clone().lerp(b, 0.12), c, limbR * 1.08, mat(darker(plan.topColor, 0.15)));
        const dir = c.clone().sub(b).normalize();
        const hand = c.clone().addScaledVector(dir, limbR * 1.2);
        ball(wr, hand, limbR * (W.gloves ? 1.15 : 1.0), handMat, 1.15);
        if (W.gloves) limb(wr, c.clone().addScaledVector(dir, -limbR * 0.5), c.clone().addScaledVector(dir, limbR * 0.4), limbR * 1.15, handMat);
      }
      const leg = rig.legs[s];
      if (leg.length >= 3) {
        const [hi, kn, an] = leg;
        const a = P(hi);
        const b = P(kn);
        const c = P(an);
        const bareShin = plan.bottom === "shorts" || skirtLike;
        const thighMat = plan.bottom === "skirt" || plan.bottom === "kilt" ? skin : plan.bottom === "dress" ? skin : bottom;
        limb(hi, a, b, limbR * 1.45 * Math.sqrt(k), thighMat, limbR * 1.35 * Math.sqrt(k));
        /* a kilt goes with long socks */
        limb(kn, b, c, limbR * 1.15, plan.bottom === "kilt" ? mat(0xe8e4da, { roughness: 0.95 }) : bareShin ? skin : bottom, limbR * 1.25);
        if (plan.bottom === "shorts") limb(hi, a.clone().lerp(b, 0.8), b.clone().lerp(c, 0.04), limbR * 1.5 * Math.sqrt(k), bottom);
        /* feet */
        const toe = leg[3] ? P(leg[3]) : c.clone().add(V(0, 0, H * 0.08));
        const fl = Math.max(limbR * 3, c.distanceTo(toe) * 1.6);
        const floorY = box.min.y;
        const foot = (h, w, len, m, dy, dz) => {
          const f = new THREE.Mesh(new THREE.BoxGeometry(limbR * w, limbR * h, len), m);
          f.position.set(c.x, Math.max(floorY + limbR * h * 0.5 + (dy || 0), c.y - limbR * 0.6), (c.z + toe.z) / 2 + limbR * 0.6 + (dz || 0));
          return hang(an, f);
        };
        if (plan.feet === "boots") {
          foot(2.2, 2.4, fl, shoes);
          if (!bareShin || plan.bottom === "skirt" || plan.bottom === "dress") limb(an, c.clone().add(V(0, -limbR * 0.4, 0)), c.clone().add(V(0, limbR * 2.6, 0)), limbR * 1.32, shoes);
        } else if (plan.feet === "sneakers") {
          foot(1.7, 2.3, fl * 0.98, shoes, limbR * 0.35);
          foot(0.7, 2.5, fl * 1.04, mat(0xf2f2ee, { roughness: 0.7 }), -limbR * 0.6, limbR * 0.02);
          const lace = foot(0.3, 1.2, fl * 0.35, mat(plan.shoesColor > 0xe0e0e0 ? 0x2f6fe0 : 0xf2f2ee), limbR * 1.1, limbR * 0.4);
          lace.userData.lace = true;
        } else if (plan.feet === "sandals") {
          foot(1.4, 2.0, fl * 0.95, skin, limbR * 0.3);
          foot(0.45, 2.4, fl * 1.02, shoes, -limbR * 0.5);
          foot(0.4, 2.15, limbR * 0.6, shoes, limbR * 0.55, limbR * 0.8);
        } else if (plan.feet === "bare") {
          const f = foot(1.4, 2.0, fl * 0.95, skin, 0);
          f.userData.bare = true;
        } else {
          foot(1.6, 2.3, fl, shoes);
        }
        /* a short sleeve's cuff and the trouser cuff tidy the joins */
        if (!bareShin && plan.feet !== "boots") limb(an, c.clone().add(V(0, -limbR * 0.2, 0)), c.clone().add(V(0, limbR * 1.2, 0)), limbR * 1.32, bottom);
      }
    });
    if (plan.top === "tshirt" || plan.top === "dress")
      ["L", "R"].forEach((s) => {
        const arm = rig.arms[s];
        if (arm.length < 3) return;
        const a = P(arm[0]);
        const b = P(arm[1]);
        /* a sleeve that ends above the elbow */
        limb(arm[0], a.clone().lerp(b, 0.62), a.clone().lerp(b, 0.66), limbR * 1.22, mat(darker(plan.topColor, 0.08)));
      });

    model.updateMatrixWorld(true);
    hung.forEach(([bone, mesh]) => {
      mesh.updateMatrix();
      mesh.matrixWorld.copy(mesh.matrix);
      bone.attach(mesh);
    });
    const d = ctx.data(ID);
    d.parts = parts.length;
    d.plan = plan;
    d.scale = tall;
    d.head = head;
  }

  /* An old character stoops a little: the back bends forward and the head lifts back up to look ahead. Runs after
     the clip and before the movement rules, so everything else still adds on top. */
  const stoopAxis = { v: null, q: null, qd: null };
  function stoop(ctx) {
    const d = ctx.data(ID);
    if (!d.plan || !d.plan.old || ctx.prefs.character !== ID || !ctx.rig) return;
    const THREE = ctx.THREE;
    if (!stoopAxis.v) (stoopAxis.v = new THREE.Vector3()), (stoopAxis.q = new THREE.Quaternion()), (stoopAxis.qd = new THREE.Quaternion());
    ctx.model.updateMatrixWorld(true);
    const axis = stoopAxis.v.set(1, 0, 0).applyQuaternion(ctx.model.getWorldQuaternion(stoopAxis.qd)).normalize();
    const r = ctx.rig;
    const back = r.spine.length ? r.spine.slice(Math.max(0, r.spine.length - 2)) : [r.chest].filter(Boolean);
    back.forEach((b) => ctx.rotateWorld(b, stoopAxis.q.setFromAxisAngle(axis, 0.34 / back.length)));
    const n = r.neck[0] || r.head;
    if (n && n !== r.chest) ctx.rotateWorld(n, stoopAxis.q.setFromAxisAngle(axis, 0.12));
    if (r.head) ctx.rotateWorld(r.head, stoopAxis.q.setFromAxisAngle(axis, -0.3));
  }

  /* dress(ctx, words): hang a made character's parts on any Plain figure skeleton (another actor in the same view,
     rig/staging.js). ctx needs THREE, model, rig and data(id); it changes nothing else here. */
  /* keep a character by name (rig/scene.js): the one with that name gets these words (made when there is none);
     returns { id, made, changed }, or null when the list is full */
  function remember(name, text, makeCurrent) {
    const s = store();
    const key = String(name || "").trim().toLowerCase();
    let x = s.list.find((m) => m.name.trim().toLowerCase() === key);
    const made = !x;
    if (!x) {
      if (s.list.length >= MAX) return null;
      x = { id: newId(), name: String(name).trim().slice(0, 40) || "My character", text: text || START };
      s.list.push(x);
    }
    const changed = !made && text != null && text !== x.text;
    if (text != null) x.text = text;
    if (makeCurrent) s.cur = x.id;
    keep(s);
    return { id: x.id, made, changed, text: x.text };
  }
  R.maker = { read: readWords, surprise, store, remember, KEY, START, dress: (ctx, words) => build(ctx, readWords(words == null ? current(store()).text : words)) };

  function sayPlan(p) {
    return p.found ? "Read as: " + p.said.join(", ") + "." : "No look words found, so it made a plain outfit. Try hair, a hat, a beard, glasses, clothes and colors, or Surprise me.";
  }
  if (!document.getElementById("maker-css")) {
    const css = document.createElement("style");
    css.id = "maker-css";
    css.textContent = `.maker-list{display:flex;flex-wrap:wrap;gap:.3rem;margin:.3rem 0}
.maker-chip{display:inline-flex;align-items:stretch;border:1px solid #8886;border-radius:999px;overflow:hidden}
.maker-chip button{border:0;background:transparent;color:inherit;font:inherit;font-size:.8rem;padding:.15rem .55rem;cursor:pointer}
.maker-chip button+button{padding:.15rem .45rem;border-left:1px solid #8884;opacity:.7}
.maker-chip button+button:hover{opacity:1}
.maker-chip[aria-current="true"]{background:#e8a03833;border-color:#e8a038}
.maker-chip[aria-current="true"] button:first-child{font-weight:600}
.maker-name{display:flex;gap:.4rem;align-items:center;margin:.3rem 0}.maker-name input{flex:1;min-width:0}
.maker-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.3rem 0}`;
    document.head.appendChild(css);
  }

  R.extend({
    id: "maker",
    label: "Make a character from words",
    panel(ctx) {
      const s = store();
      const cur = current(s);
      const on = ctx.prefs.character === ID;
      return `<h4 title="In Maya: modeling a character from primitives and parenting the pieces to the skeleton's joints">Make a character from words</h4>
        <p class="cap">Describe a look: hair, face, hat, glasses, clothes and colors ("a yellow scarf"), heavy or thin, tall, a kid or old. It is built from simple shapes on a skeleton, so every rule here moves it.</p>
        <div class="maker-list" data-maker="list" aria-label="Your characters"></div>
        <label class="maker-name">Name <input type="text" data-maker="name" maxlength="40" value="${esc(cur.name)}" aria-label="Name of this character"></label>
        <textarea data-maker="text" rows="3" style="width:100%;box-sizing:border-box" aria-label="Describe the character">${esc(cur.text)}</textarea>
        <div class="maker-btns"><button type="button" data-maker="make">${on ? "Make it again" : "Make this character"}</button><button type="button" data-maker="surprise" title="Writes a new made-up description and makes it">Surprise me</button><button type="button" data-maker="new" title="Keeps these words as another character in the list">Keep as a new one</button></div>
        <p class="cap" data-maker="said">${on ? esc(sayPlan(readWords(cur.text))) : ""}</p>`;
    },
    wire(ctx, box) {
      const q = (n) => box.querySelector(`[data-maker="${n}"]`);
      const listEl = q("list");
      const drawList = () => {
        const s = store();
        listEl.innerHTML = s.list
          .map((x) => `<span class="maker-chip" aria-current="${x.id === s.cur}"><button type="button" data-maker-pick="${esc(x.id)}" title="Switch to ${esc(x.name)}">${esc(x.name)}</button><button type="button" data-maker-del="${esc(x.id)}" aria-label="Delete ${esc(x.name)}" title="Delete ${esc(x.name)}">×</button></span>`)
          .join("");
      };
      const show = () => {
        const sel = ctx.el.querySelector('[data-rig="character"]');
        if (!sel || ![...sel.options].some((o) => o.value === ID)) return;
        sel.value = ID;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        q("make").textContent = "Make it again";
      };
      const fill = () => {
        const cur = current(store());
        q("name").value = cur.name;
        q("text").value = cur.text;
        q("said").textContent = sayPlan(readWords(cur.text));
      };
      const autoName = (text, s) => {
        const p = readWords(text);
        const bits = [];
        if (p.kid) bits.push("Kid");
        else if (p.old) bits.push("Old");
        const hw = p.hair === "none" ? "Bald" : p.hairWord ? p.hairWord.replace(/^./, (c) => c.toUpperCase()) + "-haired" : "";
        if (hw) bits.push(bits.length ? hw.toLowerCase() : hw);
        const thing = p.look.length ? p.look[0].replace(/^(a|an) /, "").replace(/ look$/, "") : p.wear.cape ? "caped one" : p.hat === "crown" ? "royal" : p.bottom === "overalls" ? "farmhand" : "character";
        bits.push(bits.length ? thing : thing.replace(/^./, (c) => c.toUpperCase()));
        let name = bits.join(" ").slice(0, 36);
        let n = 2;
        const base = name;
        while (s.list.some((x) => x.name === name)) name = base + " " + n++;
        return name;
      };
      const save = (patch) => {
        const s = store();
        const cur = current(s);
        Object.assign(cur, patch);
        keep(s);
        return s;
      };
      const make = () => {
        const text = q("text").value.trim() || START;
        q("text").value = text;
        save({ text, name: q("name").value.trim().slice(0, 40) || current(store()).name });
        q("said").textContent = sayPlan(readWords(text));
        drawList();
        show();
      };
      const add = (text) => {
        const s = store();
        if (s.list.length >= MAX) {
          q("said").textContent = `You have ${MAX} characters already: delete one (×) to keep another.`;
          return false;
        }
        const x = { id: newId(), name: autoName(text, s), text };
        s.list.push(x);
        s.cur = x.id;
        keep(s);
        return true;
      };
      q("make").addEventListener("click", make);
      q("name").addEventListener("change", () => {
        const name = q("name").value.trim().slice(0, 40) || "My character";
        const s = save({ name });
        /* change fires as the box loses focus, often on the way to clicking another name: relabel in place, so
           that click still lands */
        const b = listEl.querySelector(`[data-maker-pick="${CSS.escape(s.cur)}"]`);
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
        show();
      });
      q("new").addEventListener("click", () => {
        if (!add(q("text").value.trim() || START)) return;
        fill();
        drawList();
        show();
      });
      listEl.addEventListener("click", (e) => {
        const pk = e.target.closest("[data-maker-pick]");
        const del = e.target.closest("[data-maker-del]");
        const s = store();
        if (pk) {
          s.cur = pk.dataset.makerPick;
          keep(s);
          fill();
          drawList();
          show();
        } else if (del) {
          const id = del.dataset.makerDel;
          const was = s.cur === id;
          s.list = s.list.filter((x) => x.id !== id);
          if (!s.list.length) s.list.push({ id: newId(), name: "My character", text: START });
          if (was) s.cur = s.list[0].id;
          keep(s);
          fill();
          drawList();
          if (was && ctx.prefs.character === ID) show();
        }
      });
      drawList();
    },
    built(ctx) {
      if (ctx.prefs.character !== ID) return;
      build(ctx, readWords(current(store()).text));
    },
    afterBase(ctx) {
      stoop(ctx);
    },
  });
})();
