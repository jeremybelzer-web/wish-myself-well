/* screen/frame.js: draws one storyboard frame from curiosity values, as SVG. Part of the Screen core (no page).

   The beta is storyboards first (Jeremy, 2026-10-02), so a "film" in a viewer is a curated film's beats drawn
   as cheap flip-book frames: counts and settings only, no footage. Every drawn part belongs to one of the
   major categories (screen/levels.js), so a viewer can light up only what the selected curiosity is about
   ("Highlight"), or draw only that ("Lens only").

   window.CurioFrame
   - svg(values, opts) -> an <svg> string
       values  { curiosityId: value } for this beat
       opts    { highlight: [category ids] (others are dimmed), only: true (draw only the highlighted
                 categories), labels: [[label, value]] (an overlay box), cast: number of people, title } */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const W = 320;
  const H = 180;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const num = (v, d) => (v == null || v === "" || !isFinite(Number(v)) ? d : Number(v));
  const has = (v, re) => v != null && re.test(String(v));

  function wallColor(v) {
    const warm = String(v.warmCool || "neutral");
    let hue = warm.includes("very warm") ? 28 : warm.includes("warm") ? 36 : warm.includes("very cool") ? 205 : warm.includes("cool") ? 200 : 40;
    let sat = has(v.colorRange, /vivid/) ? 55 : has(v.colorRange, /muted/) ? 14 : has(v.colorRange, /black and white|mono/) ? 0 : 32;
    let light = 82;
    if (has(v.lightingMood, /dark|dim/) || has(v.timeOfDay, /night/) || has(v.valueKey, /low/)) light = 34;
    else if (has(v.timeOfDay, /dusk|dawn/)) light = 60;
    else if (has(v.lightingMood, /bright/)) light = 90;
    if (has(v["colorRange.paletteHue"], /./)) {
      const H2 = { red: 0, orange: 25, yellow: 50, green: 120, teal: 175, blue: 210, purple: 275, pink: 330 };
      const h = H2[String(v["colorRange.paletteHue"])];
      if (h != null) hue = h;
    }
    return { wall: `hsl(${hue} ${sat}% ${light}%)`, floor: `hsl(${hue} ${Math.max(0, sat - 8)}% ${Math.max(18, light - 22)}%)`, dark: light < 50 };
  }
  function shirt(v, back) {
    const cost = String(back ? v.backCost || "" : v.mainCost || "");
    const era = String(back ? v.backEra || "" : v.mainEra || "");
    let hue = /1970/.test(era) ? 30 : /1950|victorian|1800/.test(era) ? 280 : /1990/.test(era) ? 160 : 215;
    if (back && has(v.backSameness, /uniform/)) hue = 120;
    const light = /smart|formal|rich/.test(cost) ? 32 : /cheap/.test(cost) ? 62 : 48;
    const sat = has(v.mainWear, /torn|worn out/) && !back ? 12 : 45;
    return `hsl(${hue} ${sat}% ${light}%)`;
  }
  function mouth(emotion) {
    const e = String(emotion || "curious");
    if (/joy|triumph|loving|absurd/.test(e)) return 4;
    if (/angry|fear|anxious|melancholy/.test(e)) return -4;
    return 0;
  }

  /* One person at x, standing on the floor line, s = size. */
  function person(x, floorY, s, v, i, back) {
    const headR = 9 * s;
    const bodyH = 34 * s;
    const top = floorY - bodyH - headR * 2 - 22 * s;
    const sh = shirt(v, back);
    const m = mouth(v.emotion) * s * (i === 0 || !back ? 1 : 0.5);
    const big = num(v.gesture, num(v.emotionIntensity, 2)) >= 4;
    const arm = big ? -14 * s : 8 * s;
    const face = `<g data-cat="feeling"><circle cx="${x - 3 * s}" cy="${top + headR - 1 * s}" r="${1.2 * s}" fill="#1c1712"/><circle cx="${x + 3 * s}" cy="${top + headR - 1 * s}" r="${1.2 * s}" fill="#1c1712"/><path d="M${x - 4 * s} ${top + headR + 4 * s} Q${x} ${top + headR + 4 * s + m} ${x + 4 * s} ${top + headR + 4 * s}" stroke="#1c1712" stroke-width="${1.1 * s}" fill="none"/></g>`;
    return `<g class="cf-person">
      <g data-cat="performance"><line x1="${x - 6 * s}" y1="${floorY}" x2="${x - 3 * s}" y2="${top + headR * 2 + bodyH}" stroke="#1c1712" stroke-width="${2.4 * s}"/><line x1="${x + 6 * s}" y1="${floorY}" x2="${x + 3 * s}" y2="${top + headR * 2 + bodyH}" stroke="#1c1712" stroke-width="${2.4 * s}"/>
      <line x1="${x - 8 * s}" y1="${top + headR * 2 + 6 * s}" x2="${x - 14 * s}" y2="${top + headR * 2 + 22 * s + arm}" stroke="#1c1712" stroke-width="${2.2 * s}"/><line x1="${x + 8 * s}" y1="${top + headR * 2 + 6 * s}" x2="${x + 14 * s}" y2="${top + headR * 2 + 22 * s + arm}" stroke="#1c1712" stroke-width="${2.2 * s}"/></g>
      <rect data-cat="wardrobe" x="${x - 9 * s}" y="${top + headR * 2 + 2 * s}" width="${18 * s}" height="${bodyH}" rx="${4 * s}" fill="${sh}" stroke="#1c1712" stroke-width="${1 * s}"/>
      <circle data-cat="performance" cx="${x}" cy="${top + headR}" r="${headR}" fill="#f1d7b8" stroke="#1c1712" stroke-width="${1.2 * s}"/>
      ${face}
    </g>`;
  }

  function svg(values, opts) {
    const v = values || {};
    opts = opts || {};
    const hl = Array.isArray(opts.highlight) && opts.highlight.length ? opts.highlight : null;
    const col = wallColor(v);
    const shot = String(v.shotSize || "medium");
    const angle = String(v.angleHeight || "eye");
    const horizon = angle === "low" ? 140 : angle === "high" ? 70 : /overhead/.test(angle) ? 30 : /floor/.test(angle) ? 160 : 112;
    const scale = shot === "wide" ? 0.75 : shot === "close" ? 2.6 : shot === "insert" ? 1 : 1.35;
    const cast = Math.max(1, Math.min(6, num(opts.cast, num(v.peopleCount, 2))));
    const parts = [];
    /* Light & color and the set: the wall, the floor, a window, art, clutter. */
    parts.push(`<g data-cat="light"><rect x="0" y="0" width="${W}" height="${horizon}" fill="${col.wall}"/><rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="${col.floor}"/></g>`);
    const setStyle = String(v.setStyle || "");
    const winFill = col.dark ? "#26313f" : "#dfe9f2";
    parts.push(`<g data-cat="world">
      <rect x="${W - 84}" y="${Math.max(8, horizon - 70)}" width="56" height="44" fill="${winFill}" stroke="#1c1712" stroke-width="2"/>${/victorian|1950/.test(setStyle) ? `<line x1="${W - 56}" y1="${Math.max(8, horizon - 70)}" x2="${W - 56}" y2="${Math.max(8, horizon - 70) + 44}" stroke="#1c1712" stroke-width="2"/>` : ""}
      ${Array.from({ length: Math.min(4, num(v.wallArt, 1)) }, (_, i) => `<rect x="${18 + i * 30}" y="${Math.max(6, horizon - 64)}" width="20" height="16" fill="none" stroke="#1c1712" stroke-width="1.5"/>`).join("")}
      ${Array.from({ length: Math.min(6, num(v.clutter, 2)) }, (_, i) => `<rect x="${12 + i * 50}" y="${horizon + 4 + (i % 2) * 6}" width="${10 + (i % 3) * 4}" height="${8 + (i % 2) * 5}" fill="${has(v.setMaterial, /metal/) ? "#9aa3ab" : has(v.setMaterial, /glass/) ? "#bfe1e6" : "#a0784e"}" stroke="#1c1712" stroke-width="1"/>`).join("")}
      ${has(v.setUpkeep, /shabby|ruined/) ? `<path d="M30 ${horizon - 30} l12 8 l-6 10" stroke="#1c1712" fill="none" stroke-width="1.2"/>` : ""}
    </g>`);
    /* The people, sized by the shot. An insert shows the object that matters instead. */
    const floorY = shot === "close" ? H + 120 : Math.min(H - 6, horizon + 40 + (shot === "wide" ? 0 : 20));
    const people = [];
    if (shot === "insert") {
      people.push(`<g data-cat="world"><rect x="${W / 2 - 40}" y="${H / 2 - 30}" width="80" height="60" rx="8" fill="#e7c27a" stroke="#1c1712" stroke-width="3"/><text x="${W / 2}" y="${H / 2 + 5}" text-anchor="middle" font-size="11" font-family="sans-serif">${esc(v.objectKind || "prop")}</text></g>`);
    } else {
      const n = shot === "close" ? 1 : cast;
      const span = shot === "wide" ? 200 : 170;
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? (has(v.composition, /left/) ? W * 0.36 : W / 2) : W / 2 - span / 2 + (span * i) / (n - 1);
        people.push(person(x, floorY, scale * (i === 0 ? 1 : 0.92), v, i, i > 0));
      }
      const path = String(v.characterPath || "");
      if (/approach|retreat/.test(path)) {
        const dir = /approach/.test(path) ? 1 : -1;
        people.push(`<g data-cat="performance"><path d="M${W / 2 - 30 * dir} ${H - 10} L${W / 2 + 30 * dir} ${H - 10}" stroke="#c45c26" stroke-width="3" marker-end="url(#cf-arrow)"/></g>`);
      }
    }
    parts.push(people.join(""));
    /* What someone says: a balloon as big as the line is loud. */
    const vol = num(v.volume, 0);
    const words = num(v.wordsAmount, vol ? 2 : 0);
    if (words > 0 && shot !== "insert") {
      const bw = 40 + vol * 10;
      parts.push(`<g data-cat="performance"><ellipse cx="${W * 0.3}" cy="28" rx="${bw / 2}" ry="${12 + vol * 1.5}" fill="#fff" stroke="#1c1712" stroke-width="${vol >= 5 ? 3 : 1.5}"/>${Array.from({ length: Math.min(3, Math.ceil(words / 2)) }, (_, i) => `<line x1="${W * 0.3 - bw / 3}" x2="${W * 0.3 + bw / 3 - i * 6}" y1="${22 + i * 6}" y2="${22 + i * 6}" stroke="#1c1712" stroke-width="1.5"/>`).join("")}</g>`);
    }
    /* Music & sound: notes in the corner, one per level of how present the music is. */
    const music = String(v.music || "");
    const notes = /wall of sound|featured/.test(music) ? 3 : /equal/.test(music) ? 2 : /under|barely/.test(music) ? 1 : 0;
    parts.push(`<g data-cat="sound" font-size="16" font-family="serif">${notes ? Array.from({ length: notes }, (_, i) => `<text x="${12 + i * 14}" y="${H - 10 - (i % 2) * 6}" fill="#1c1712">♪</text>`).join("") : music === "none" || has(v.silence, /long/) ? `<text x="12" y="${H - 10}" fill="#1c1712">♪</text><line x1="10" y1="${H - 24}" x2="24" y2="${H - 8}" stroke="#c45c26" stroke-width="2"/>` : ""}</g>`);
    /* Comedy: a "ha" for every two laughs a minute, a burst for physical comedy, the device as a tag. */
    const laughs = num(v.laughsPerMinute, 0);
    parts.push(`<g data-cat="comedy" font-family="sans-serif" font-weight="700" fill="#b8892d">${Array.from({ length: Math.min(4, Math.ceil(laughs / 2)) }, (_, i) => `<text x="${W - 70 + i * 16}" y="${H - 14 - i * 6}" font-size="11">ha</text>`).join("")}${v.physicalComedy ? `<path d="M${W / 2 + 40} ${floorY - 50} l6 -14 l4 12 l12 -6 l-6 12 l12 4 l-14 4 l2 12 l-10 -8 l-8 10 l0 -14 l-12 -2 l12 -6 z" fill="#ffd34d" stroke="#1c1712" stroke-width="1"/>` : ""}${v.comedyDevice ? `<text x="${W - 8}" y="16" font-size="9" text-anchor="end" fill="#1c1712">${esc(v.comedyDevice)}</text>` : ""}</g>`);
    /* Effects: shards for breakage and impacts. */
    const hits = num(v.impacts, v.breakage ? 2 : 0);
    if (hits) parts.push(`<g data-cat="effects">${Array.from({ length: Math.min(5, hits) }, (_, i) => `<path d="M${60 + i * 44} ${horizon + 10 + (i % 2) * 12} l8 -6 l3 9 z" fill="#c9e4ef" stroke="#1c1712" stroke-width="1"/>`).join("")}</g>`);
    /* Editing: scissors marks for fast cutting at the top edge. */
    if (has(v.cutRate, /fast/) || has(v.shotDuration, /short/)) parts.push(`<g data-cat="editing"><text x="${W / 2}" y="12" font-size="10" text-anchor="middle" font-family="sans-serif" fill="#1c1712">✂ ✂ ✂</text></g>`);
    /* Story: the film's emotional road as an arrow in the top left. */
    const road = String(v.emoRoadFilm || v.emoRoadCharacter || "");
    if (road) parts.push(`<g data-cat="feeling"><path d="M10 ${/rising|highest/.test(road) ? 26 : /falling|lowest/.test(road) ? 10 : 18} L34 ${/rising|highest/.test(road) ? 10 : /falling|lowest/.test(road) ? 26 : 18}" stroke="#c45c26" stroke-width="3" marker-end="url(#cf-arrow)"/></g>`);
    /* The editing curiosities from Final Cut Pro and CapCut (data/db-editing.js). Filters: a tint laid
       over the whole picture, with grain dots for a gritty texture. */
    const look = String(v.filterLook || "none");
    const TINT = { "warm film": "rgba(255,150,60,.22)", "cool film": "rgba(60,140,255,.2)", "black and white": "rgba(128,128,128,.55)", vintage: "rgba(190,150,90,.3)", faded: "rgba(255,255,255,.3)", "high contrast": "rgba(0,0,0,.18)", "teal and orange": "rgba(0,150,160,.2)", pastel: "rgba(255,190,220,.25)", night: "rgba(10,20,70,.45)", dreamy: "rgba(255,230,255,.35)" };
    const dark = { "very dark": 0.5, dark: 0.3, bright: 0, "blown out": 0 }[String(v.exposure || "")];
    parts.push(`<g data-cat="grade" pointer-events="none">${TINT[look] ? `<rect x="0" y="0" width="${W}" height="${H}" fill="${TINT[look]}"/>` : ""}${dark ? `<rect x="0" y="0" width="${W}" height="${H}" fill="rgba(0,0,0,${dark})"/>` : ""}${has(v.exposure, /bright|blown/) ? `<rect x="0" y="0" width="${W}" height="${H}" fill="rgba(255,255,255,${/blown/.test(v.exposure) ? 0.45 : 0.2})"/>` : ""}${has(v.texture, /gritty/) ? Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 73) % W}" cy="${(i * 41) % H}" r="0.8" fill="#1c1712"/>`).join("") : ""}</g>`);
    /* Text: a caption bar or title card across the bottom, stickers in the corner. */
    const txt = String(v.onScreenText || (v.captions && v.captions !== "off" ? "caption" : ""));
    if (txt && txt !== "none") parts.push(`<g data-cat="text">${txt === "title card" ? `<rect x="40" y="${H / 2 - 18}" width="${W - 80}" height="36" fill="#1c1712"/><text x="${W / 2}" y="${H / 2 + 5}" font-size="14" text-anchor="middle" font-family="serif" fill="#fffaf2">TITLE</text>` : txt === "sound word" ? `<text x="${W / 2 + 50}" y="60" font-size="22" font-weight="900" font-family="sans-serif" fill="#ffd34d" stroke="#1c1712" stroke-width="1.5">BAM!</text>` : `<rect x="70" y="${H - 30}" width="${W - 140}" height="16" rx="3" fill="rgba(0,0,0,.7)"/><line x1="82" x2="${W - 82}" y1="${H - 22}" y2="${H - 22}" stroke="#fff" stroke-width="2"/>`}</g>`);
    if (v.stickers && v.stickers !== "none") parts.push(`<g data-cat="text"><circle cx="${W - 40}" cy="${horizon - 20}" r="10" fill="#ffd34d" stroke="#1c1712"/><circle cx="${W - 43}" cy="${horizon - 22}" r="1.2" fill="#1c1712"/><circle cx="${W - 37}" cy="${horizon - 22}" r="1.2" fill="#1c1712"/><path d="M${W - 45} ${horizon - 17} Q${W - 40} ${horizon - 12} ${W - 35} ${horizon - 17}" stroke="#1c1712" fill="none"/></g>`);
    /* CapCut's Mood body effects: a cartoon mark by the main character's head. Light effects: rays from a corner. */
    const MOOD = { "red face": "♥", "sad tears": "💧", confused: "?", "bright idea": "💡", "angry steam": "💢", loved: "♥", "departing soul": "👻", "mallet bonk": "✱", "laughing till crying": "😂", sunny: "☀", cool: "😎", shy: "♥", struck: "✱", crackling: "⚡" };
    if (MOOD[v.moodEffect] && shot !== "insert") parts.push(`<g data-cat="text"><text x="${W / 2 + 26}" y="${Math.max(18, floorY - 120 * scale)}" font-size="${16 * Math.min(1.6, scale)}" font-family="sans-serif" fill="#c0392b">${MOOD[v.moodEffect]}</text></g>`);
    if (v.lightEffect && v.lightEffect !== "none") parts.push(`<g data-cat="effects" pointer-events="none">${[0, 1, 2, 3].map((i) => `<path d="M${W} 0 L${W - 120 - i * 40} ${H} L${W - 100 - i * 40} ${H} Z" fill="rgba(255,230,150,.22)"/>`).join("")}</g>`);
    /* CapCut batch 3: retro scanlines and a sepia wash, glitch bars in split colors, a superpower glow on the
       main character's eyes, hallucination rings, an end card. */
    const on = (x) => x && x !== "none" && x !== "original";
    if (on(v.retroEffect)) parts.push(`<g data-cat="grade" pointer-events="none"><rect x="0" y="0" width="${W}" height="${H}" fill="rgba(170,120,60,.25)"/>${Array.from({ length: Math.floor(H / 6) }, (_, i) => `<line x1="0" x2="${W}" y1="${i * 6}" y2="${i * 6}" stroke="rgba(0,0,0,.12)"/>`).join("")}</g>`);
    if (on(v.glitchEffect)) parts.push(`<g data-cat="effects" pointer-events="none">${[0.22, 0.5, 0.71].map((f, i) => `<rect x="${i * 30}" y="${H * f}" width="${W - i * 60}" height="6" fill="${["rgba(255,0,80,.45)", "rgba(0,220,255,.45)", "rgba(255,255,255,.5)"][i]}"/>`).join("")}</g>`);
    if (on(v.superpowerEffect) && shot !== "insert") parts.push(`<g data-cat="effects" pointer-events="none"><circle cx="${W / 2 - 4}" cy="${Math.max(14, floorY - 104 * scale)}" r="${5 * Math.min(1.6, scale)}" fill="rgba(80,220,255,.85)"/><circle cx="${W / 2 + 6}" cy="${Math.max(14, floorY - 104 * scale)}" r="${5 * Math.min(1.6, scale)}" fill="rgba(80,220,255,.85)"/></g>`);
    if (on(v.hallucinationEffect)) parts.push(`<g data-cat="effects" pointer-events="none" fill="none" stroke="rgba(150,80,255,.45)" stroke-width="3">${[30, 60, 90].map((r) => `<circle cx="${W / 2}" cy="${H / 2}" r="${r}"/>`).join("")}</g>`);
    if (on(v.tickingClock)) parts.push(`<g data-cat="story"><circle cx="${W - 22}" cy="22" r="11" fill="#fffaf2" stroke="#c0392b" stroke-width="2"/><path d="M${W - 22} 22 V14 M${W - 22} 22 L${W - 16} 25" stroke="#1c1712" stroke-width="2"/>${v.tickingClock === "seconds left" ? `<text x="${W - 40}" y="26" font-size="10" text-anchor="end" font-family="sans-serif" font-weight="700" fill="#c0392b">0:05</text>` : ""}</g>`);
    if (on(v.chapterCard)) parts.push(`<g data-cat="text"><rect x="0" y="0" width="${W}" height="20" fill="rgba(28,23,18,.8)"/><text x="10" y="14" font-size="10" font-family="serif" fill="#fffaf2">${v.chapterCard === "date and place" ? "MONDAY · THE DINER" : "CHAPTER ONE"}</text></g>`);
    if (on(v.endCard)) parts.push(`<g data-cat="text"><rect x="0" y="0" width="${W}" height="${H}" fill="rgba(0,0,0,.65)"/><text x="${W / 2}" y="${H / 2 + 5}" font-size="15" text-anchor="middle" font-family="serif" fill="#fffaf2">${esc(String(v.endCard))}</text></g>`);
    /* Transitions: the next shot wiping or dissolving in from the right edge. */
    const tr = String(v.transitionKind || "");
    if (tr && tr !== "cut") parts.push(`<g data-cat="transitions">${/dissolve|fade|flash|morph/.test(tr) ? `<rect x="${W - 70}" y="0" width="70" height="${H}" fill="${/black/.test(tr) ? "rgba(0,0,0,.6)" : /white|flash/.test(tr) ? "rgba(255,255,255,.7)" : "rgba(160,120,200,.35)"}"/>` : `<path d="M${W - 50} 0 L${W} 0 L${W} ${H} L${W - 90} ${H} Z" fill="rgba(70,160,220,.45)" stroke="#1c1712" stroke-width="1.5"/>`}<text x="${W - 8}" y="${H / 2}" font-size="9" text-anchor="end" font-family="sans-serif" fill="#1c1712">${esc(tr)}</text></g>`);
    /* Speed: motion streaks for fast, a slow-motion tag, a freeze border. */
    const sp = String(v.clipSpeed || "");
    if (/fast|slow|frozen/.test(sp) || (v.freezeFrame && v.freezeFrame !== "none")) parts.push(`<g data-cat="speed">${/fast/.test(sp) ? [30, 46, 62].map((y) => `<line x1="8" x2="${36 + (y % 20)}" y1="${y}" y2="${y}" stroke="#1c1712" stroke-width="2"/>`).join("") : ""}${/slow/.test(sp) ? `<text x="10" y="${H / 2}" font-size="10" font-family="sans-serif" fill="#1c1712">slow-mo</text>` : ""}${/frozen/.test(sp) || (v.freezeFrame && v.freezeFrame !== "none") ? `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="#fffaf2" stroke-width="4"/>` : ""}</g>`);
    /* Camera: how it moves, drawn as corner brackets. */
    const move = String(v.cameraMove || "none");
    const camTag = move !== "none" ? move : String(v.cameraCarry || "") === "handheld" ? "handheld" : "";
    parts.push(`<g data-cat="camera" stroke="#1c1712" stroke-width="2" fill="none"><path d="M6 20 V6 H20 M${W - 20} 6 H${W - 6} V20 M6 ${H - 20} V${H - 6} H20 M${W - 20} ${H - 6} H${W - 6} V${H - 20}"/>${camTag ? `<text x="${W - 26}" y="${H - 26}" text-anchor="end" font-size="9" font-family="sans-serif" fill="#1c1712" stroke="none">${esc(camTag)}</text>` : ""}</g>`);
    /* The overlay box: the selected curiosities' values in words. */
    let overlay = "";
    if (Array.isArray(opts.labels) && opts.labels.length) {
      const rows = opts.labels.slice(0, 6);
      const bh = 8 + rows.length * 13;
      overlay = `<g class="cf-overlay"><rect x="8" y="${H - bh - 8}" width="190" height="${bh}" rx="4" fill="rgba(28,23,18,.82)"/>${rows.map(([l, val], i) => `<text x="14" y="${H - bh + 6 + i * 13}" font-size="10" font-family="sans-serif" fill="#fffaf2">${esc(String(l).slice(0, 22))}: <tspan font-weight="700" fill="#ffd9a8">${esc(val == null ? "not set" : String(val).slice(0, 18))}</tspan></text>`).join("")}</g>`;
    }
    let body = parts.join("");
    if (hl) {
      /* Dim every part outside the highlighted categories (or leave it out for Lens only). */
      body = body.replace(/<(g|rect|circle|line|path|ellipse|text)( [^>]*?)data-cat="([a-z]+)"/g, (m, tag, pre, cat) =>
        hl.includes(cat) ? m : `<${tag}${pre}data-cat="${cat}" ${opts.only ? 'display="none"' : 'opacity="0.18"'}`
      );
    }
    const shake = String(v.cameraCarry || "") === "handheld" ? " cf-shake" : "";
    const tilt = has(v.angleHeight, /dutch|tilt/) ? ` transform="rotate(-6 ${W / 2} ${H / 2})"` : "";
    return `<svg class="cf-frame${shake}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title || "Storyboard frame")}"><defs><marker id="cf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#c45c26"/></marker></defs><g${tilt}>${body}</g>${overlay}</svg>`;
  }

  root.CurioFrame = { svg, W, H };
  if (typeof module !== "undefined" && module.exports) module.exports = root.CurioFrame;
})();
