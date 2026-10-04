/* Wardrobe: the live picture at the top of each wardrobe curiosity's window (CuriosityWindows.look). The main
   character's curiosities dress one big figure; the background curiosities dress a crowd behind a smaller hero.
   Everything is drawn with one dressed figure, fig(), so each setting changes a piece of clothing you can see. */
(function (W) {
  const idx = (v, id) => {
    const s = v.slider(id);
    return s && Array.isArray(s.scale) ? Math.max(0, s.scale.indexOf(v(id))) : 0;
  };
  const logp = (x, a, b) => Math.max(0, Math.min(1, (Math.log(Math.max(a, x)) - Math.log(a)) / (Math.log(b) - Math.log(a))));
  const cap = (k, t) => k.caption(String(t).replace(/(\d+\.\d{2})\d+/g, "$1").replace(/ · ( ·)+/g, " ·").slice(0, 56));
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${x0.toFixed(1)}" y="${y - 10}" width="${w.toFixed(1)}" height="14" rx="7" fill="rgba(0,0,0,0.6)" stroke="${color || "#666666"}"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 8.5, color: color || "#dddddd" });
  };
  const tl = (k, x, y, w, p, color, label) => `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" fill="#2e2e36"/><rect x="${x}" y="${y}" width="${Math.max(1.5, k.clamp(p, 0, 1) * w).toFixed(1)}" height="6" rx="3" fill="${color || "#ffd166"}"/>` + (label ? k.label({ x: x - 4, y: y + 6, text: label, size: 7.5, color: "#cccccc", anchor: "end" }) : "");
  const arc = (k, x, y, dir, label) => `<rect x="${x}" y="${y}" width="74" height="34" rx="4" fill="rgba(0,0,0,0.5)"/>` + k.arrow({ x1: x + 10, y1: y + 14 + dir * 7, x2: x + 64, y2: y + 14 - dir * 7, color: dir > 0 ? "#7fd1ae" : dir < 0 ? "#ff8a80" : "#cccccc", w: 2 }) + k.label({ x: x + 37, y: y + 31, text: label, size: 7, color: "#dddddd" });

  /* Era looks: a hat, colours, a long coat or not, flared legs or not. */
  const ERAS = [
    { hat: "laurel", top: "#e8e0cc", bottom: "#e8e0cc", long: 1, cloth: "drape" },
    { hat: "hood", top: "#6a4a2a", bottom: "#4a3a2a", long: 0.6 },
    { hat: "tricorn", top: "#2a3a6a", bottom: "#e8e0cc", long: 0.5, cuffs: 1 },
    { hat: "tophat", top: "#222222", bottom: "#555555", long: 0.4 },
    { hat: "cowboy", top: "#a0522d", bottom: "#4a5a7a", vest: 1 },
    { hat: "flatcap", top: "#7a6a5a", bottom: "#5a5048", tie: 1 },
    { hat: "fedora", top: "#d06070", bottom: "#3a3a5a", skirt: 1 },
    { hat: "none", top: "#e09a30", bottom: "#7a4a2a", flare: 1, collar: 1 },
    { hat: "cap", top: "#3a8a6a", bottom: "#5a6a9a", baggy: 1 },
    { hat: "none", top: "#555566", bottom: "#333355", hood: 1 },
    { hat: "visor", top: "#c8d4e0", bottom: "#c8d4e0", sheen: 1 },
  ];
  function hat(k, kind, x, hy, r) {
    const I = k.INK;
    switch (kind) {
      case "laurel": return `<path d="M${x - r} ${hy - r * 0.3} Q${x} ${hy - r * 1.4} ${x + r} ${hy - r * 0.3}" fill="none" stroke="#5a9a3a" stroke-width="3"/>`;
      case "hood": return `<path d="M${x - r * 1.2} ${hy + r} Q${x - r * 1.3} ${hy - r * 1.5} ${x} ${hy - r * 1.3} Q${x + r * 1.3} ${hy - r * 1.5} ${x + r * 1.2} ${hy + r}" fill="none" stroke="#5a3a1a" stroke-width="4"/>`;
      case "tricorn": return `<path d="M${x - r * 1.4} ${hy - r * 0.6} L${x} ${hy - r * 1.6} L${x + r * 1.4} ${hy - r * 0.6} Z" fill="#222222" stroke="${I}"/>`;
      case "tophat": return `<rect x="${x - r * 0.8}" y="${hy - r * 2.3}" width="${r * 1.6}" height="${r * 1.5}" fill="#111111"/><rect x="${x - r * 1.3}" y="${hy - r * 0.9}" width="${r * 2.6}" height="${r * 0.25}" fill="#111111"/>`;
      case "cowboy": return `<path d="M${x - r * 1.8} ${hy - r * 0.7} Q${x} ${hy - r * 0.3} ${x + r * 1.8} ${hy - r * 0.7} L${x + r * 0.8} ${hy - r * 0.8} L${x + r * 0.6} ${hy - r * 1.8} L${x - r * 0.6} ${hy - r * 1.8} L${x - r * 0.8} ${hy - r * 0.8} Z" fill="#8a5a2a" stroke="${I}"/>`;
      case "flatcap": return `<path d="M${x - r} ${hy - r * 0.5} Q${x} ${hy - r * 1.5} ${x + r * 1.5} ${hy - r * 0.5} Z" fill="#6a6050" stroke="${I}"/>`;
      case "fedora": return `<path d="M${x - r * 1.4} ${hy - r * 0.7} H${x + r * 1.4} M${x - r * 0.8} ${hy - r * 0.7} L${x - r * 0.7} ${hy - r * 1.6} Q${x} ${hy - r * 1.3} ${x + r * 0.7} ${hy - r * 1.6} L${x + r * 0.8} ${hy - r * 0.7} Z" fill="#3a3a3a" stroke="#3a3a3a" stroke-width="2"/>`;
      case "cap": return `<path d="M${x - r} ${hy - r * 0.4} Q${x} ${hy - r * 1.6} ${x + r} ${hy - r * 0.4} Z" fill="#c03030"/><rect x="${x - r * 1.8}" y="${hy - r * 0.55}" width="${r}" height="${r * 0.25}" fill="#c03030"/>`;
      case "visor": return `<rect x="${x - r * 0.9}" y="${hy - r * 0.45}" width="${r * 1.8}" height="${r * 0.45}" rx="${r * 0.2}" fill="#5ff5ff" opacity="0.85"/>`;
      case "helmet": return `<path d="M${x - r * 1.15} ${hy + r * 0.1} Q${x - r * 1.2} ${hy - r * 1.4} ${x} ${hy - r * 1.35} Q${x + r * 1.2} ${hy - r * 1.4} ${x + r * 1.15} ${hy + r * 0.1} Z" fill="#e0e0e0" stroke="${I}" stroke-width="1.5"/>`;
      case "crown": return `<path d="M${x - r * 0.8} ${hy - r * 0.8} l${r * 0.4} ${-r * 0.7} l${r * 0.4} ${r * 0.4} l${r * 0.4} ${-r * 0.4} l${r * 0.4} ${r * 0.7} Z" fill="#e6c35a" stroke="${I}"/>`;
      default: return "";
    }
  }

  /* One dressed figure. Numbers marked p run 0..1. */
  function fig(k, o) {
    const I = k.INK;
    const x = o.x == null ? 160 : o.x;
    const y = o.y == null ? 170 : o.y;
    const s = o.s || 1;
    const fit = k.clamp(o.fit == null ? 0 : o.fit, -1, 1.5);
    const cover = k.clamp(o.cover == null ? 0.8 : o.cover, 0, 1);
    const skin = o.skin || "#f0c8a0";
    const top = o.top || "#4a6fa5";
    const bottom = o.bottom || "#3a3a4a";
    const legL = 50 * s;
    const hipY = y - legL;
    const torso = 46 * s;
    const shY = hipY - torso;
    const hr = 12 * s;
    const hy = shY - 4 * s - hr;
    const tw = (24 + fit * 9) * s;
    const ww = (20 + fit * 9 + (o.flare || 0) * 0) * s;
    const lean = o.lean || 0;
    const arms = k.clamp(o.arms || 0, -1, 1.2);
    let g = "";
    /* Legs: skin, then trousers or a skirt down to the cover length. */
    const legW = (6 + Math.max(0, fit) * 4) * s;
    const flare = (o.flare || 0) * 6 * s;
    const pantsLen = k.lerp(0.25, 1, cover) * legL;
    [-1, 1].forEach((sd) => {
      const lx = x + sd * 7 * s;
      g += `<line x1="${lx}" y1="${hipY}" x2="${lx + sd * 3 * s}" y2="${y}" stroke="${skin}" stroke-width="${(5 * s).toFixed(1)}" stroke-linecap="round"/>`;
      if (!o.skirt) g += `<path d="M${lx - legW / 2} ${hipY} L${lx + legW / 2} ${hipY} L${lx + sd * 3 * s * (pantsLen / legL) + legW / 2 + flare * (pantsLen / legL)} ${hipY + pantsLen} L${lx + sd * 3 * s * (pantsLen / legL) - legW / 2 - flare * (pantsLen / legL)} ${hipY + pantsLen} Z" fill="${bottom}" stroke="${I}" stroke-width="1"/>`;
    });
    if (o.skirt) g += `<path d="M${x - ww / 2} ${hipY - 4 * s} L${x + ww / 2} ${hipY - 4 * s} L${x + ww / 2 + 14 * s} ${hipY + pantsLen * 0.8} L${x - ww / 2 - 14 * s} ${hipY + pantsLen * 0.8} Z" fill="${bottom}" stroke="${I}"/>`;
    if (o.boots) [-1, 1].forEach((sd) => (g += `<rect x="${x + sd * 10 * s - 5 * s}" y="${y - 12 * s}" width="${10 * s}" height="${14 * s}" rx="${2 * s}" fill="#3a2a1a" stroke="${I}"/>`));
    else [-1, 1].forEach((sd) => (g += `<ellipse cx="${x + sd * 11 * s}" cy="${y}" rx="${5 * s}" ry="${2.5 * s}" fill="#222222"/>`));
    /* Arms: skin with sleeves down to the cover length. */
    const handY = shY + k.lerp(46, -10, (arms + 1) / 2.2) * s;
    [-1, 1].forEach((sd) => {
      const ax = x + sd * (tw / 2);
      const hx = x + sd * (tw / 2 + (10 + Math.abs(arms) * 6) * s);
      g += `<line x1="${ax}" y1="${shY + 3 * s}" x2="${hx.toFixed(1)}" y2="${handY.toFixed(1)}" stroke="${skin}" stroke-width="${(5 * s).toFixed(1)}" stroke-linecap="round"/>`;
      const sl = k.lerp(0.05, 1, cover) + (o.longSleeve || 0);
      if (cover > 0.15) g += `<line x1="${ax}" y1="${shY + 3 * s}" x2="${(ax + (hx - ax) * Math.min(1.15, sl)).toFixed(1)}" y2="${(shY + 3 * s + (handY - shY - 3 * s) * Math.min(1.15, sl)).toFixed(1)}" stroke="${o.sleeve || top}" stroke-width="${((7 + Math.max(0, fit) * 4) * s).toFixed(1)}" stroke-linecap="round"/>`;
      if (o.gloves) g += k.dot({ x: hx, y: handY, r: 4 * s, color: "#3a3a3a" });
      if (o.pads) g += `<circle cx="${((ax + hx) / 2).toFixed(1)}" cy="${((shY + handY) / 2).toFixed(1)}" r="${4.5 * s}" fill="#777777" stroke="${I}"/>`;
    });
    /* Torso: a shirt, its neckline lower when less is covered; a long coat if asked. */
    const neck = k.lerp(14, 0, cover) * s;
    const coatLen = (o.long || 0) * 40 * s;
    g += `<path d="M${x - tw / 2} ${shY} L${x + tw / 2} ${shY} L${x + ww / 2} ${hipY + coatLen} L${x - ww / 2} ${hipY + coatLen} Z" fill="${top}" stroke="${I}" stroke-width="1.5"/>`;
    if (neck > 0.5) g += `<path d="M${x - 6 * s} ${shY} L${x} ${shY + neck} L${x + 6 * s} ${shY} Z" fill="${skin}"/>`;
    if (cover < 0.2) g += `<rect x="${x - tw / 2 + 2}" y="${hipY - torso * 0.45}" width="${tw - 4}" height="${torso * 0.45}" fill="${skin}"/>`;
    /* Extra layers: a jacket outline per layer. */
    for (let i = 1; i < (o.layers || 1); i++) {
      const e = i * 2.5 * s;
      g += `<path d="M${x - tw / 2 - e} ${shY - e * 0.3} L${x - 4 * s} ${shY - e * 0.3} L${x - 4 * s} ${hipY + e} L${x - ww / 2 - e} ${hipY + e} Z M${x + tw / 2 + e} ${shY - e * 0.3} L${x + 4 * s} ${shY - e * 0.3} L${x + 4 * s} ${hipY + e} L${x + ww / 2 + e} ${hipY + e} Z" fill="none" stroke="${k.mix(o.layerColor || "#8a7a6a", "#ffffff", i * 0.08)}" stroke-width="${(2.2 * s).toFixed(1)}"/>`;
    }
    if (o.vest) g += `<path d="M${x - tw / 2} ${shY} L${x - 3 * s} ${hipY} M${x + tw / 2} ${shY} L${x + 3 * s} ${hipY}" stroke="#4a2a1a" stroke-width="${5 * s}"/>`;
    if (o.jacket) g += `<path d="M${x - tw / 2 - 2} ${shY} L${x - 3 * s} ${shY + 22 * s} L${x - 3 * s} ${hipY + 4 * s} L${x - ww / 2 - 2} ${hipY + 4 * s} Z M${x + tw / 2 + 2} ${shY} L${x + 3 * s} ${shY + 22 * s} L${x + 3 * s} ${hipY + 4 * s} L${x + ww / 2 + 2} ${hipY + 4 * s} Z" fill="${o.jacket}" stroke="${I}"/>`;
    if (o.tie) {
      const sk = (o.undone || 0) * 6 * s;
      g += `<path d="M${x} ${shY + 2} l${-2.5 * s + sk} ${20 * s} l${2.5 * s} ${4 * s} l${2.5 * s} ${-4 * s} Z" fill="${o.tie === true ? "#a02a2a" : o.tie}" transform="rotate(${((o.undone || 0) * 25).toFixed(0)} ${x} ${shY})"/>`;
    }
    if (o.collar) g += `<path d="M${x - 9 * s} ${shY} l-6 ${8 * s} l10 -2 Z M${x + 9 * s} ${shY} l6 ${8 * s} l-10 -2 Z" fill="#ffffff"/>`;
    if ((o.undone || 0) > 0.4) g += `<path d="M${x - ww / 2} ${hipY} q${ww / 4} ${8 * s * o.undone} ${ww / 2} 2" fill="${top}" stroke="${I}"/>`;
    if (o.belt) g += `<rect x="${x - ww / 2}" y="${hipY - 4 * s}" width="${ww}" height="${4 * s}" fill="#3a2a1a"/>` + Array.from({ length: o.belt }, (_, i) => `<rect x="${x - ww / 2 + 2 + i * 5 * s}" y="${hipY - 6 * s}" width="${4 * s}" height="${6 * s}" fill="#6a5a3a"/>`).join("");
    if (o.armor) g += `<path d="M${x - tw / 2} ${shY + 2} L${x + tw / 2} ${shY + 2} L${x + ww / 2} ${hipY - 6 * s} L${x - ww / 2} ${hipY - 6 * s} Z" fill="${o.armor}" stroke="${I}" opacity="0.92"/>`;
    /* Pockets, logos, stains, tears, patches, a frill. */
    for (let i = 0; i < (o.pockets || 0); i++) {
      const px = i % 2 ? x + 4 * s : x - 10 * s;
      const py = i < 2 ? shY + 8 * s : i < 4 ? hipY - 14 * s : hipY + 14 * s;
      g += `<rect x="${px}" y="${py}" width="${6 * s}" height="${7 * s}" fill="none" stroke="#111111" stroke-width="1.2"/>`;
    }
    for (let i = 0; i < (o.logos || 0); i++) g += `<circle cx="${x - tw / 2 + 6 * s + (i % 3) * 8 * s}" cy="${shY + 12 * s + Math.floor(i / 3) * 12 * s}" r="${(o.logoBig ? 3.6 : 2.2) * s}" fill="#ffd166" stroke="${I}" stroke-width="0.6"/>`;
    for (let i = 0; i < (o.stains || 0); i++) g += `<ellipse cx="${(x + (k.rnd(i + 3) - 0.5) * tw).toFixed(1)}" cy="${(shY + 6 * s + k.rnd(i + 5) * (torso + 30 * s)).toFixed(1)}" rx="${(3 + k.rnd(i) * 3) * s}" ry="${2.5 * s}" fill="#5a4020" opacity="0.7"/>`;
    for (let i = 0; i < (o.tears || 0); i++) g += `<path d="M${(x + (k.rnd(i + 13) - 0.5) * tw).toFixed(1)} ${(shY + 6 * s + k.rnd(i + 15) * (torso + 34 * s)).toFixed(1)} l${2 * s} ${3 * s} l${-2 * s} ${3 * s} l${2 * s} ${3 * s}" fill="none" stroke="${skin}" stroke-width="${2 * s}"/>`;
    for (let i = 0; i < (o.patches || 0); i++) g += `<rect x="${(x + (k.rnd(i + 23) - 0.5) * tw - 3 * s).toFixed(1)}" y="${(shY + 8 * s + k.rnd(i + 25) * (torso + 20 * s)).toFixed(1)}" width="${7 * s}" height="${7 * s}" fill="${k.hsl(i * 80 + 20, 40, 55)}" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="1.5 1"/>`;
    if (o.frill) g += `<path d="M${x - 8 * s} ${shY + 2} q${4 * s} ${6 * s} ${8 * s} 0 q${4 * s} ${6 * s} ${8 * s} 0" fill="none" stroke="#ff9ad5" stroke-width="${2.5 * s}"/>`;
    if (o.pack) g = `<rect x="${x - tw / 2 - o.pack * 0.6 * s}" y="${shY + 2 * s}" width="${o.pack * 0.8 * s + 6 * s}" height="${(10 + o.pack * 0.9) * s}" rx="${3 * s}" fill="#6a5a3a" stroke="${I}"/>` + g;
    if (o.shine) g += `<path d="M${x - tw / 2 + 3 * s} ${shY + 4 * s} L${x - tw / 2 + 8 * s} ${shY + 4 * s} L${x - ww / 2 + 6 * s} ${hipY - 2 * s} L${x - ww / 2 + 2 * s} ${hipY - 2 * s} Z" fill="#ffffff" opacity="${(o.shine * 0.6).toFixed(2)}"/>`;
    /* Head, hair and make-up, hat, accessories. */
    const hair = o.hair || 0;
    if (hair > 0) g += `<ellipse cx="${x}" cy="${hy - hr * 0.2}" rx="${hr * (1.05 + hair * 0.35)}" ry="${hr * (1 + hair * 0.3)}" fill="${o.hairColor || "#3a2a1a"}"/>`;
    g += k.face({ x, y: hy, r: hr, mood: o.mood || 0, look: o.look || 0, color: skin });
    if (hair < 0) g += `<path d="M${x - hr} ${hy - hr * 0.4} l${hr * 0.4} ${-hr * 0.7} l${hr * 0.3} ${hr * 0.4} l${hr * 0.4} ${-hr * 0.5} l${hr * 0.3} ${hr * 0.5} l${hr * 0.4} ${-hr * 0.5} l${hr * 0.2} ${hr * 0.8}" fill="none" stroke="#3a2a1a" stroke-width="${2 * s}"/>`;
    if ((o.makeup || 0) > 0) g += [-1, 1].map((sd) => `<circle cx="${x + sd * hr * 0.5}" cy="${hy + hr * 0.25}" r="${hr * 0.18}" fill="#ff6a8a" opacity="${(o.makeup * 0.8).toFixed(2)}"/>`).join("") + (o.makeup > 0.6 ? `<path d="M${x - hr * 0.6} ${hy - hr * 0.2} h${hr * 0.35} M${x + hr * 0.25} ${hy - hr * 0.2} h${hr * 0.35}" stroke="#4a2a8a" stroke-width="${2 * s}"/>` : "");
    if (o.helmet) g += hat(k, "helmet", x, hy, hr) + (o.helmetLoose ? `<line x1="${x + hr}" y1="${hy}" x2="${x + hr * 1.4}" y2="${hy + hr}" stroke="#555555" stroke-width="1.5"/>` : `<line x1="${x - hr}" y1="${hy}" x2="${x + hr}" y2="${hy}" stroke="#555555" stroke-width="1" transform="rotate(0)"/>`);
    else if (o.hat) g += hat(k, o.hat, x, hy, hr);
    if (o.goggles) g += `<rect x="${x - hr * 0.8}" y="${hy - hr * 0.4}" width="${hr * 1.6}" height="${hr * 0.45}" rx="${hr * 0.2}" fill="#3a6a8a" stroke="${I}"/>`;
    if (o.mask) g += `<rect x="${x - hr * 0.9}" y="${hy - hr * 0.45}" width="${hr * 1.8}" height="${hr * 0.4}" fill="#111111"/>`;
    if (o.badge) g += `<path d="M${x + 6 * s} ${shY + 8 * s} l${3 * s} ${-3 * s} l${3 * s} ${3 * s} l${-3 * s} ${4 * s} Z" fill="${o.badge === true ? "#e6c35a" : o.badge}" stroke="${I}" stroke-width="0.6"/>`;
    for (let i = 0; i < (o.stripes || 0); i++) g += `<line x1="${x - tw / 2 - 1}" y1="${shY + 5 * s + i * 3 * s}" x2="${x - tw / 2 + 6 * s}" y2="${shY + 3 * s + i * 3 * s}" stroke="#e6c35a" stroke-width="${1.5 * s}"/>`;
    const acc = o.acc || 0;
    if (acc >= 1) g += `<path d="M${x - 7 * s} ${shY + 1} Q${x} ${shY + 10 * s} ${x + 7 * s} ${shY + 1}" fill="none" stroke="#e6c35a" stroke-width="${1.6 * s}"/>`;
    if (acc >= 2) g += `<rect x="${x - tw / 2 - 14 * s}" y="${handY - 2 * s}" width="${5 * s}" height="${4 * s}" fill="#e6c35a"/>`;
    if (acc >= 3) g += `<rect x="${x + tw / 2 + 6 * s}" y="${hipY - 4 * s}" width="${12 * s}" height="${12 * s}" rx="${2 * s}" fill="#8a3a2a" stroke="${I}"/><path d="M${x + tw / 2 + 8 * s} ${hipY - 4 * s} Q${x + tw / 2 + 12 * s} ${shY + 6 * s} ${x + tw / 2 + 2 * s} ${shY + 2 * s}" fill="none" stroke="#8a3a2a" stroke-width="${1.5 * s}"/>`;
    if (acc >= 4) g += [-1, 1].map((sd) => k.dot({ x: x + sd * hr, y: hy + hr * 0.3, r: 1.8 * s, color: "#e6c35a" })).join("");
    if (acc >= 5) g += `<rect x="${x - hr * 0.85}" y="${hy - hr * 0.3}" width="${hr * 1.7}" height="${hr * 0.35}" rx="2" fill="#111111" opacity="0.85"/>`;
    if (o.glow) g = `<ellipse cx="${x}" cy="${(hy + y) / 2}" rx="${(tw + 30 * s).toFixed(1)}" ry="${((y - hy) / 2 + 16 * s).toFixed(1)}" fill="#fff6c0" opacity="${(o.glow * 0.35).toFixed(2)}"/>` + g;
    if (o.dull) g += `<rect x="${x - tw - 12 * s}" y="${hy - hr - 4}" width="${tw * 2 + 24 * s}" height="${y - hy + hr + 8}" fill="#8a8070" opacity="${(o.dull * 0.4).toFixed(2)}" style="mix-blend-mode:multiply"/>`;
    return `<g${o.alpha != null ? ` opacity="${o.alpha.toFixed ? o.alpha.toFixed(2) : o.alpha}"` : ""} transform="rotate(${lean.toFixed ? lean.toFixed(1) : lean} ${x} ${y})">${g}</g>`;
  }
  /* A crowd of small figures in two rows behind; each(i, n) returns that figure's options. */
  function crowd(k, n, each, o) {
    o = o || {};
    const y0 = o.y == null ? 118 : o.y;
    const s = o.s || 0.42;
    let g = "";
    for (let i = 0; i < n; i++) {
      const row = i % 2;
      const x = 18 + ((i + 0.5) / n) * 284 + (row ? 6 : -6);
      g += fig(k, Object.assign({ x, y: y0 + row * 22, s: s * (row ? 1.08 : 1) }, each(i, n)));
    }
    return g;
  }
  const room = (k, rich) => k.wall({ y: 140, color: k.mix("#b8ab98", "#e8d8b0", rich), floor: k.mix("#5a4a3a", "#8a3a3a", rich) }) + (rich > 0.6 ? `<path d="M0 30 H320 M0 34 H320" stroke="#e6c35a" stroke-width="2"/><circle cx="160" cy="20" r="${6 + rich * 8}" fill="#ffe08a"/>` : "") + (rich < 0.25 ? `<path d="M40 20 l6 14 l-4 8 M260 50 l-6 12" stroke="#5a4a3a" stroke-width="1.5" fill="none"/>` : "");
  /* Cost: rags are dull and patched, luxury is rich colour, shine and gold. */
  const costLook = (k, p) => ({ top: k.mix("#7a7060", p > 0.7 ? "#5a1a6a" : "#2a4a8a", p), bottom: k.mix("#6a6050", "#1a1a2a", p), patches: p < 0.2 ? 3 : 0, tears: p < 0.1 ? 3 : 0, shine: p > 0.6 ? p : 0, acc: Math.round(p * 4), jacket: p > 0.5 ? k.mix("#333333", "#111111", p) : null });

  /* ---------- main character: cost ---------- */
  W.look("mainCost", (v, k) => {
    const p = v.p("setting");
    const labels = idx(v, "labelsShow");
    const afford = idx(v, "affordIt");
    const notice = idx(v, "othersNotice");
    const arcDir = [-1, 0, 1][idx(v, "costArc")];
    const price = v.n("outfitPrice");
    const vsRoom = v.n("vsRoomCost");
    const roomRich = k.clamp(p - vsRoom / 500, 0, 1);
    let s = room(k, roomRich);
    /* Onlookers: they look and comment as others notice the price. */
    const onl = [0, 1, 2, 3][notice];
    for (let i = 0; i < onl; i++) s += fig(k, { x: 30 + i * 36, y: 150, s: 0.55, look: 1, top: "#777777", bottom: "#555555", mood: notice >= 2 ? 0.5 : 0 });
    if (notice >= 2) s += k.bubble({ x: 70, y: 52, text: notice === 3 ? "$$$!" : "nice coat", w: 64, h: 22, size: 9, tail: 10 });
    s += fig(k, Object.assign({ x: 190, y: 172, s: 1.05, logos: [0, 1, 3, 7][labels], logoBig: labels === 3, mood: afford === 3 ? -0.4 : afford === 2 ? -0.1 : 0.4 }, costLook(k, p)));
    if (afford >= 2) s += `<path d="M206 ${70} q3 5 0 8 q-3 -3 0 -8" fill="#6ec3ff"/>`;
    /* Their means against the price: a wallet bar. */
    const means = [1, 0.75, 0.55, 0.2][afford];
    s += `<rect x="236" y="56" width="80" height="44" rx="4" fill="rgba(0,0,0,0.55)"/>` + k.label({ x: 276, y: 68, text: `$${price.toLocaleString("en-US")}`, size: 10, color: "#ffd166", weight: 700 }) + tl(k, 270, 76, 40, logp(price + 1, 1, 50001), "#ffd166", "cost") + tl(k, 270, 88, 40, means, "#7fd1ae", "means");
    s += arc(k, 240, 104, arcDir, "over time");
    s += chip(k, 316, 14, `next to ${v("costFrom")}`, "#cccccc", "end");
    return s + cap(k, `${v("setting")} · ${v("labelsShow")} labels · ${v("affordIt")} · room ${vsRoom >= 0 ? "+" : ""}${vsRoom}%`);
  });

  /* ---------- main character: looks or function ---------- */
  W.look("mainUtility", (v, k) => {
    const fn = v.p("setting");
    const pockets = v.n("pockets");
    const ready = idx(v, "readyFor");
    const fuss = idx(v, "fussing");
    const saves = idx(v, "savesDay");
    const kg = v.n("carried");
    let s = k.bg("#24242c") + k.floor(150, "#3b332b");
    const looks = 1 - fn;
    s += fig(k, {
      x: 150,
      y: 172,
      s: 1.05,
      top: k.mix("#d06aa0", "#5a6a4a", fn),
      bottom: k.mix("#3a2a4a", "#5a5a3a", fn),
      frill: looks > 0.5,
      shine: looks * 0.7,
      acc: Math.round(looks * 4),
      belt: fn > 0.4 ? Math.round(fn * 4) : 0,
      pockets: pockets + (fn > 0.7 ? 1 : 0),
      boots: ready >= 2,
      gloves: ready === 3,
      pack: kg > 0 ? 6 + logp(kg + 1, 1, 41) * 22 : 0,
      lean: logp(kg + 1, 1, 41) * 10 - (ready === 3 ? 4 : 0),
      arms: fuss === 2 ? 1.1 : fuss === 1 ? 0.7 : ready >= 2 ? 0.2 : -0.2,
      mood: fuss === 2 ? -0.2 : 0.3,
    });
    if (fuss > 0) s += Array.from({ length: fuss * 2 }, (_, i) => `<path d="M${118 + i * 6} ${48 - i * 2} l4 -4" stroke="#ffd166" stroke-width="1.5"/>`).join("");
    /* Fusses per minute: a row of little ticks. */
    const fr = v.n("fussRate");
    s += Array.from({ length: fr }, (_, i) => `<rect x="${14 + i * 5}" y="12" width="3" height="8" fill="#ffd166"/>`).join("") + k.label({ x: 14, y: 30, text: `${fr} fusses a minute`, size: 8, color: "#cccccc", anchor: "start" });
    if (saves > 0) s += `<path d="M${200} ${110} l4 -10 l4 10 l10 2 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 Z" fill="#ffd166" transform="scale(${saves === 2 ? 1.3 : 0.8}) translate(${saves === 2 ? -46 : 50} ${saves === 2 ? -26 : 28})"/>`;
    s += `<rect x="232" y="56" width="84" height="40" rx="4" fill="rgba(0,0,0,0.55)"/>` + tl(k, 270, 64, 40, (ready + 0.2) / 3.2, "#7fd1ae", "ready") + k.label({ x: 274, y: 90, text: `${kg} kg carried`, size: 8.5, color: "#dddddd" });
    return s + cap(k, `${v("setting")} · ${pockets} pockets · ${v("readyFor")} · saves the day: ${v("savesDay")}`);
  });

  /* ---------- main character: the job the clothes do ---------- */
  const GEAR = ["helmet", "gloves", "boots", "pads", "belt", "goggles", "pack", "armor"];
  function jobLook(k, j) {
    return [
      { top: "#888888", bottom: "#666666" },
      { top: "#c8a0c8", bottom: "#8a7a9a" },
      { top: "#a03a2a", bottom: "#4a3a2a", layers: 3, hat: "flatcap" },
      { top: "#e6a030", bottom: "#3a4a6a", belt: 3 },
      { top: "#2a8ad0", bottom: "#222222", fit: -0.5 },
      { top: "#8a5a2a", bottom: "#6a4a2a", boots: true, hat: "cowboy" },
      { top: "#222222", bottom: "#222222", helmet: true, gloves: true, pads: true },
      { top: "#e8e8e8", bottom: "#e8e8e8", helmet: true, gloves: true, boots: true, fit: 0.6 },
      { top: "#999999", bottom: "#777777", armor: "#bbbbbb", helmet: true },
    ][j];
  }
  W.look("mainFunction", (v, k) => {
    const job = idx(v, "setting");
    const n = v.n("gearCount");
    const worn = idx(v, "wornRight");
    const suit = idx(v, "suitUp");
    const dmg = idx(v, "gearDamage");
    const prot = v.p("protectedShare");
    const kg = v.n("gearWeight");
    const o = Object.assign({ x: 140, y: 172, s: 1.05 }, jobLook(k, job));
    const have = GEAR.slice(0, n);
    have.forEach((g) => (o[g] = g === "pack" ? 14 : g === "belt" ? 3 : g === "armor" ? "#99aaaa" : true));
    o.helmetLoose = worn <= 1;
    o.lean = (worn === 0 ? 6 : 0) + logp(kg + 1, 1, 61) * 8;
    o.stains = dmg * 2;
    o.tears = dmg >= 2 ? dmg * 2 : 0;
    let s = k.bg("#22262c") + k.floor(150, "#3b3a36");
    s += fig(k, o);
    /* Body protected: a shield-coloured band rising from the feet over that share of the body. */
    const h = prot * 150;
    s += `<rect x="110" y="${(172 - h).toFixed(1)}" width="60" height="${h.toFixed(1)}" fill="#7fd1ae" opacity="0.18"/><line x1="106" y1="${(172 - h).toFixed(1)}" x2="174" y2="${(172 - h).toFixed(1)}" stroke="#7fd1ae" stroke-dasharray="3 2"/>`;
    if (worn === 3) s += `<path d="M118 66 L162 66" stroke="#ffd166" stroke-width="2"/>`;
    if (dmg === 3) s += `<path d="M150 50 l10 10 l-6 4 l12 12" stroke="#ff5252" stroke-width="2.5" fill="none"/>`;
    /* Suiting up: little frames of the figure getting dressed. */
    const frames = [1, 2, 3, 5][suit];
    s += `<rect x="208" y="20" width="108" height="56" rx="4" fill="rgba(0,0,0,0.5)"/>`;
    for (let i = 0; i < frames; i++) {
      const fx = 214 + (i * 96) / Math.max(1, frames - 1 || 1) * (frames > 1 ? 1 : 0) + (frames === 1 ? 44 : 0);
      s += fig(k, Object.assign({ x: Math.min(306, fx + 4), y: 70, s: 0.3 }, jobLook(k, job), { helmet: i === frames - 1 && job >= 6, cover: (i + 1) / frames }));
    }
    s += tl(k, 240, 86, 76, v.n("suitUpTime") / 600, "#9fd3ff", "suit up") + k.label({ x: 262, y: 108, text: `${kg} kg of gear`, size: 8.5, color: "#dddddd" });
    return s + cap(k, `${v("setting")} · ${n} pieces · ${v("wornRight")} · ${v("gearDamage")}`);
  });

  /* ---------- main character: casual to formal ---------- */
  function formalLook(k, f) {
    return [
      { top: "#9ab8e0", bottom: "#9ab8e0", patches: 0, hair: 0.6, cover: 0.85 },
      { top: "#e05a4a", bottom: "#4a6aa0", cover: 0.45 },
      { top: "#6aa07a", bottom: "#c8b490", cover: 0.6, collar: 1 },
      { top: "#e8e8f0", bottom: "#3a3a4a", jacket: "#3a3a4a", tie: true, cover: 1 },
      { top: "#ffffff", bottom: "#111111", jacket: "#111111", tie: "#111111", cover: 1, shine: 0.3 },
      { top: "#e8e0ff", bottom: "#4a2a6a", jacket: "#4a2a6a", tie: "#e6c35a", cover: 1, long: 1, acc: 2 },
    ][k.clamp(f, 0, 5)];
  }
  W.look("mainFormality", (v, k) => {
    const f = idx(v, "setting");
    const room_ = idx(v, "rightForRoom");
    const undone = v.p("undone");
    const stance = idx(v, "stance");
    const others = k.clamp(f + [2, 0, -2][room_], 0, 5);
    let s = k.wall({ y: 140, color: k.mix("#c8bca8", "#e8d8b8", others / 5), floor: "#5a4a3a" });
    s += fig(k, Object.assign({ x: 50, y: 150, s: 0.6, mood: 0.2 }, formalLook(k, others))) + fig(k, Object.assign({ x: 270, y: 150, s: 0.6, look: -1 }, formalLook(k, others)));
    s += fig(k, Object.assign({ x: 160, y: 172, s: 1.05, undone, lean: [10, 3, 0, 0][stance], arms: [-0.5, -0.1, -0.25, -0.4][stance], mood: stance === 3 ? -0.2 : 0.3 }, formalLook(k, f)));
    if (stance === 3) s += `<line x1="160" y1="40" x2="160" y2="175" stroke="#9fd3ff" stroke-dasharray="2 3" opacity="0.6"/>`;
    s += chip(k, 8, 16, `dressed for ${v("dressedFor")}`, "#ffd166");
    s += tl(k, 240, 10, 74, v.n("loosensAt") / 180, "#ff8a80", "undone at");
    return s + cap(k, `${v("setting")} · ${v("rightForRoom")} · ${v("undone")} · ${v("stance")}`);
  });

  /* ---------- main character: era of the clothes ---------- */
  function eraFig(k, e, o) {
    const E = ERAS[k.clamp(e, 0, ERAS.length - 1)];
    return Object.assign({ top: E.top, bottom: E.bottom, hat: E.hat, long: E.long || 0, vest: E.vest, tie: E.tie, skirt: E.skirt, flare: E.flare, collar: E.collar, fit: E.baggy ? 0.8 : 0, shine: E.sheen ? 0.5 : 0 }, o || {});
  }
  const loud = (k, c, p) => k.mix(k.mix(c, "#808080", 0.45), c, p);
  W.look("mainEra", (v, k) => {
    const e = idx(v, "setting");
    const loudP = v.p("loudness");
    const lay = v.n("layers");
    const acc = v.n("accessories");
    const hm = idx(v, "hairMakeup");
    const truth = idx(v, "truth");
    const ch = idx(v, "outfitChange");
    const mix = idx(v, "eraMix");
    const yb = v.n("yearsBehind");
    const E = ERAS[e];
    /* A mix of eras: borrow the hat (then the coat) of another time. */
    const other = ERAS[(e + 5) % ERAS.length];
    const o = eraFig(k, e, { x: 140, y: 172, s: 1.05, layers: lay, acc, hair: [-1, 0.3, 0.6, 0.9, 1.2][hm], makeup: [0, 0, 0.3, 0.7, 1][hm] });
    o.top = loud(k, E.top, loudP);
    o.bottom = loud(k, E.bottom, loudP);
    if (loudP > 0.6) o.patches = Math.round(loudP * 4);
    if (mix >= 1) o.hat = other.hat === "none" ? "cap" : other.hat;
    if (mix >= 2) o.bottom = other.bottom;
    if (mix >= 3) (o.top = other.top), (o.skirt = !o.skirt);
    if (truth === 2) (o.badge = true), (o.stripes = 2);
    if (truth === 3) o.mask = true;
    let s = k.bg("#24242c") + k.floor(150, "#3b332b") + fig(k, o);
    if (truth === 1) s += chip(k, 100, 40, "borrowed", "#cccccc");
    /* Before and after: the last scene's outfit, a thumbnail. */
    const before = eraFig(k, e, { x: 250, y: 110, s: 0.5, layers: ch === 0 ? lay : 1, acc: ch >= 1 ? 0 : acc });
    if (ch >= 2) (before.top = "#888888"), (before.bottom = "#555555");
    if (ch === 3) (before.hat = "none"), (before.cover = 0.3), (before.top = "#666666");
    s += `<rect x="216" y="30" width="68" height="88" rx="4" fill="rgba(255,255,255,0.06)" stroke="#555555"/>` + fig(k, before) + k.label({ x: 250, y: 26, text: "last scene", size: 8, color: "#aaaaaa" });
    /* Outfit changes in the film: swatches. */
    const oc = v.n("outfitChanges");
    s += Array.from({ length: Math.min(30, oc) }, (_, i) => `<rect x="${8 + (i % 15) * 8}" y="${10 + Math.floor(i / 15) * 8}" width="6" height="6" fill="${k.hsl(i * 47, 45, 55)}"/>`).join("");
    s += chip(k, 316, 140, `${yb > 0 ? yb + " yrs behind" : yb < 0 ? -yb + " yrs ahead" : "of its time"}`, yb > 0 ? "#c8a070" : "#9fd3ff", "end");
    return s + cap(k, `${v("setting")} · loud ${v("loudness")} · ${lay} layers · ${v("truth")} · ${v("eraMix")}`);
  });

  /* ---------- main character: coverage ---------- */
  W.look("mainCoverage", (v, k) => {
    const cover = k.clamp(v.p("setting") * 0.65 + (1 - v.p("skinShown")) * 0.35, 0, 1);
    const arcI = idx(v, "revealArc");
    const ease = idx(v, "atEase");
    const off = v.n("layersOff");
    const hides = idx(v, "hides");
    let s = k.bg("#24242c") + k.floor(150, "#3b332b");
    /* Clothes taken off, in a pile on the floor. */
    for (let i = 0; i < off; i++) s += `<path d="M${210 + i * 4} ${168 - i * 5} q20 -6 40 0 l-4 5 q-16 -4 -32 0 Z" fill="${k.hsl(i * 60 + 200, 35, 45)}" stroke="${k.INK}"/>`;
    s += fig(k, { x: 140, y: 172, s: 1.05, cover, layers: Math.max(1, Math.round(cover * 3)), top: "#5a7aa5", bottom: "#3a3a4a", arms: [-0.9, -0.6, -0.2, 0.25][ease], mood: [-0.6, -0.2, 0.3, 0.8][ease], lean: ease === 0 ? 6 : ease === 3 ? -3 : 0, hat: cover > 0.95 ? "hood" : null });
    if (ease === 0) s += `<path d="M118 82 L162 98 M162 82 L118 98" stroke="${k.INK}" stroke-width="5"/>`;
    /* What they hide under the clothes. */
    s += [
      "",
      `<path d="M150 82 l8 4 l-6 2 l8 4" stroke="#b03a3a" stroke-width="2" fill="none"/>`,
      `<rect x="148" y="110" width="20" height="6" rx="2" fill="#333333" opacity="0.6" stroke="#ffd166" stroke-dasharray="2 2"/>`,
      `<rect x="128" y="34" width="24" height="7" fill="#111111"/>`,
    ][hides];
    s += chip(k, 10, 16, hides === 0 ? "hides nothing" : `hides ${v("hides")}`, "#ffd166");
    s += arc(k, 240, 20, [-1, 0, 1][arcI], v("revealArc"));
    s += tl(k, 250, 66, 64, v.n("layerOffTime") / 120, "#9fd3ff", "off in");
    return s + cap(k, `${v("setting")} covered · ${v("skinShown")}% skin · ${off} layers off · ${v("atEase")}`);
  });

  /* ---------- main character: wear and tear ---------- */
  W.look("mainWear", (v, k) => {
    const w = v.p("setting");
    const stains = v.n("stains");
    const tells = idx(v, "damageTells");
    const arcI = idx(v, "wearArc");
    const mend = idx(v, "mending");
    const age = logp(v.n("clothesAge") + 1, 1, 51);
    const tears = v.n("tears");
    const top = k.mix(k.mix("#3a6ad0", "#7a8090", age), "#6a6050", w * 0.6);
    let s = k.bg("#24242c") + k.floor(150, "#3b332b");
    s += fig(k, { x: 140, y: 172, s: 1.05, top, bottom: k.mix("#2a3a6a", "#5a5040", w), stains: stains + Math.round(w * 3), tears: Math.min(20, tears + Math.round(w * 2)), patches: [0, 2, 5][mend], shine: w < 0.1 ? 0.5 : 0 });
    if (w < 0.1) s += `<path d="M168 60 l3 -7 l3 7 l-3 7 Z" fill="#ffffff"/><rect x="164" y="64" width="10" height="6" fill="#ffffff" stroke="#999999"/>`;
    /* The damage tells a story: scorch, claw, a long rip with a note. */
    if (tells >= 1) s += `<path d="M126 ${110} l6 -6 l4 8" stroke="#2a1a0a" stroke-width="${tells * 1.5}" fill="none"/>`;
    if (tells >= 2) s += `<path d="M132 70 l14 24 M138 68 l14 24 M144 66 l14 24" stroke="#f0c8a0" stroke-width="2.5"/>`;
    if (tells === 3) s += k.bubble({ x: 230, y: 50, text: "the fight", w: 74, h: 22, size: 9, tail: -40 });
    const tr = [[0.9, 0.6, 0.2], [0.5, 0.5, 0.5], [0.2, 0.45, 0.7], [0.1, 0.5, 1]][arcI];
    s += `<rect x="236" y="100" width="76" height="40" rx="4" fill="rgba(0,0,0,0.5)"/>` + k.graph({ x: 242, y: 104, w: 64, h: 20, points: tr, color: arcI === 0 ? "#7fd1ae" : "#ff8a80" }) + k.label({ x: 274, y: 136, text: "wear over the film", size: 7, color: "#dddddd" });
    s += chip(k, 8, 16, `${v("clothesAge")} years old`, "#c8a070");
    return s + cap(k, `${v("setting")} · ${stains} stains · ${tears} tears · ${v("mending")}`);
  });

  /* ---------- main character: fit ---------- */
  W.look("mainFit", (v, k) => {
    const fit = k.clamp(-1 + v.p("setting") * 2 + v.n("sizeOff") / 6, -1, 1.5);
    const made = idx(v, "madeFor");
    const moves = idx(v, "movesWith");
    const outline = idx(v, "outline");
    const comfort = idx(v, "comfort");
    const ease = v.p("ease");
    const settle = v.n("settleTime");
    let s = k.bg("#24242c") + k.floor(150, "#3b332b");
    const o = { x: 140, y: 172, s: 1.05, fit, top: "#7a5aa5", bottom: "#3a3a4a", cover: 0.9 + (made >= 2 ? 0.1 : 0), longSleeve: [0, 0, 0.12, 0.25][made], mood: [-0.6, 0, 0.6][comfort], arms: comfort === 0 ? 0.6 : -0.2 };
    if (outline === 2) o.fit = Math.max(fit, 0.6);
    if (outline === 3) (o.skirt = true), (o.long = 0.8);
    if (outline === 0) o.fit = Math.min(fit, -0.5);
    if (moves >= 2) o.flare = moves - 1;
    /* The body inside the cloth: a dashed line, further in as the room between them grows. */
    s += fig(k, o);
    const gap = 2 + ease * 14;
    s += `<rect x="${140 - 12 + gap * 0.3}" y="${80}" width="${24 - gap * 0.6}" height="${44}" rx="4" fill="none" stroke="#ffd166" stroke-dasharray="2 2"/>`;
    /* Cloth moving: flutter lines that keep going while it settles. */
    const flutter = [0, 1, 3, 5][moves];
    for (let i = 0; i < flutter; i++) s += `<path d="M${172 + i * 6} ${100 + i * 8} q6 -4 12 0" fill="none" stroke="#cccccc" stroke-width="1.5"/>`;
    s += Array.from({ length: Math.round(settle * 4) }, (_, i) => `<path d="M${100 - i * 5} ${110 + i * 3} q-4 3 0 6" fill="none" stroke="#9fd3ff" stroke-width="1.2" opacity="${(1 - i / 13).toFixed(2)}"/>`).join("");
    if (made === 3) s += chip(k, 8, 16, "someone else's", "#ff8a80");
    else s += chip(k, 8, 16, v("madeFor"), "#cccccc");
    if (comfort === 0) s += `<path d="M118 70 l-6 -6 M162 70 l6 -6" stroke="#ffd166" stroke-width="2"/>`;
    const so = v.n("sizeOff");
    s += chip(k, 316, 16, so === 0 ? "true size" : `${Math.abs(so)} size${Math.abs(so) > 1 ? "s" : ""} too ${so > 0 ? "big" : "small"}`, "#ffd166", "end");
    return s + cap(k, `${v("setting")} · ${v("movesWith")} · ${v("outline")} · ${v("ease")} cm ease`);
  });

  /* ---------- main character: clothes against the set ---------- */
  W.look("mainSetMatch", (v, k) => {
    const m = v.p("setting");
    const gap = v.p("colorGap");
    const catchL = idx(v, "catchLight");
    const pull = idx(v, "pullsEye");
    const arcI = idx(v, "matchArc");
    const stops = v.n("vsRoomLight");
    const share = v.p("clothesInFrame");
    const roomHue = 30;
    const hue = roomHue + (1 - m) * 120 + gap * 60;
    const light = k.clamp(48 + stops * 9, 8, 92);
    let s = `<rect x="0" y="0" width="320" height="180" fill="${k.hsl(roomHue, 35, 55)}"/>` + k.floor(150, k.hsl(roomHue, 30, 35));
    for (let i = 0; i < 6; i++) s += `<rect x="${i * 56 + 10}" y="20" width="30" height="${40 + (i % 2) * 20}" fill="${k.hsl(roomHue + (i % 3) * 8, 40, 45)}"/>`;
    const sc = 0.55 + share * 0.9;
    s += fig(k, { x: 160, y: 176, s: sc, top: k.hsl(hue, 45 + (1 - m) * 25, light), bottom: k.hsl(hue + 10, 35, light - 15), sleeve: k.hsl(hue, 45, light), shine: [0, 0, 0.4, 0.8][catchL], glow: catchL === 3 ? 1 : 0, dull: catchL === 0 ? 0.6 : 0 });
    if (pull === 0) s += k.tint({ color: "#000000", alpha: 0.12 });
    if (pull >= 2) s += k.vignette(pull === 3 ? 0.8 : 0.45) + (pull === 3 ? [-1, 1].map((sd) => k.arrow({ x1: 160 + sd * 120, y1: 40, x2: 160 + sd * 50, y2: 80 })).join("") : "");
    s += arc(k, 8, 8, [-1, 0, 1][arcI], arcI === 2 ? "fits in more" : arcI === 0 ? "stands out more" : "holds");
    s += chip(k, 316, 16, `${stops >= 0 ? "+" : ""}${stops} stops`, "#ffd166", "end");
    return s + cap(k, `${v("setting")} · ${v("colorGap")}% colour gap · ${v("catchLight")} · ${v("pullsEye")}`);
  });

  /* ---------- background: era ---------- */
  W.look("backEra", (v, k) => {
    const e = idx(v, "setting");
    const loudP = v.p("loudness");
    const lay = v.n("layers");
    const acc = v.n("accessories");
    const hm = idx(v, "hairMakeup");
    const f = idx(v, "formality");
    const code = idx(v, "colorCode");
    const pull = v.p("crowdPull");
    const spread = Math.round(logp(v.n("eraSpread") + 1, 1, 201) * 4);
    const heroOff = Math.round(v.n("vsHeroYears") / 25);
    let s = k.wall({ y: 120, color: "#9a907e", floor: "#5a4a3a" });
    s += crowd(k, 10, (i) => {
      const ee = k.clamp(e + (spread ? ((i * 7) % (spread * 2 + 1)) - spread : 0), 0, 10);
      const o = eraFig(k, ee, { layers: lay, acc, hair: [-1, 0.3, 0.6, 0.9, 1.2][hm], makeup: [0, 0, 0.3, 0.7, 1][hm], alpha: k.lerp(0.45, 1, pull), mood: 0.2 });
      const base = code === 0 ? o.top : code === 1 ? ["#b04a4a", "#4a6ab0", o.top][i % 3] : ["#b04a4a", "#4a6ab0"][i % 2];
      o.top = loud(k, base, loudP);
      if (f >= 3) (o.jacket = "#2a2a3a"), (o.tie = true);
      if (f <= 1) o.cover = 0.5;
      if (f === 5) o.long = 1;
      return o;
    }, { s: k.lerp(0.34, 0.5, pull) });
    if (pull === 1) s += `<rect x="0" y="0" width="320" height="162" fill="#ffffff" opacity="0.06"/>`;
    /* The hero in front, years apart from the crowd. */
    s += fig(k, eraFig(k, k.clamp(e - heroOff, 0, 10), { x: 160, y: 176, s: 0.8, alpha: k.lerp(1, 0.75, pull) })) + k.label({ x: 160, y: 66, text: "hero", size: 8, color: "#ffd166" });
    s += chip(k, 316, 14, `${v("eraSpread")} yrs spread · hero ${v("vsHeroYears")} yrs`, "#cccccc", "end");
    return s + cap(k, `${v("setting")} · ${v("formality")} · ${v("colorCode")} colour code · ${v("crowdPull")}`);
  });

  /* ---------- background: cost ---------- */
  W.look("backCost", (v, k) => {
    const p = v.p("setting");
    const mix = v.p("richPoorMix");
    const vsHero = v.p("vsHero");
    const flaunt = idx(v, "flaunting");
    const price = v.n("typicalPrice");
    const share = v.p("richShare");
    let s = room(k, p);
    s += crowd(k, 10, (i) => {
      const rich = k.rnd(i + 3) < share;
      const pp = k.clamp(p + (rich ? 0.35 : -0.25) * (0.3 + mix) + (k.rnd(i + 7) - 0.5) * mix * 0.6, 0, 1);
      const o = Object.assign({ mood: 0.1 }, costLook(k, pp));
      if (flaunt && i % [99, 4, 2][flaunt] === 0) (o.glow = 0.8), (o.acc = 5);
      return o;
    });
    const heroP = k.clamp(p - (vsHero - 0.5) * 1.2, 0, 1);
    s += fig(k, Object.assign({ x: 160, y: 176, s: 0.8 }, costLook(k, heroP))) + k.label({ x: 160, y: 66, text: "hero", size: 8, color: "#ffd166" });
    s += chip(k, 8, 16, `typical outfit $${price.toLocaleString("en-US")}`, "#ffd166") + chip(k, 316, 16, `${v("richShare")}% dressed rich`, "#e6c35a", "end");
    return s + cap(k, `${v("setting")} · ${v("richPoorMix")} · ${v("vsHero")} than the hero`);
  });

  /* ---------- background: coverage ---------- */
  W.look("backCoverage", (v, k) => {
    const cover = k.clamp(v.p("setting") * 0.6 + (1 - v.p("crowdSkin")) * 0.4, 0, 1);
    const wx = idx(v, "rightForWeather");
    const range = v.p("coverageRange");
    const norms = idx(v, "norms");
    const heroCover = k.clamp(cover - v.n("vsHeroSkin") / 100, 0, 1);
    /* The weather: matches the clothes when right for it, the opposite when wrong. */
    const cold = wx === 2 ? cover > 0.5 : wx === 0 ? cover <= 0.5 : null;
    let s = cold == null ? k.sky(0.45) : cold ? k.sky(0.75) : `<rect width="320" height="180" fill="#ffcf7a"/>`;
    s += k.floor(140, cold ? "#eef4fa" : "#c8a060");
    if (cold === true) for (let i = 0; i < 30; i++) s += k.dot({ x: k.rnd(i) * 320, y: k.rnd(i + 9) * 120, r: 1.6, color: "#ffffff" });
    if (cold === false) s += `<circle cx="290" cy="30" r="18" fill="#fff06a"/>`;
    s += crowd(k, 10, (i) => ({ cover: k.clamp(cover + (k.rnd(i + 2) - 0.5) * range * 1.2, 0, 1), top: k.hsl(200 + i * 13, 35, 50), bottom: "#4a4a5a", layers: Math.max(1, Math.round(cover * 3)) }));
    s += fig(k, { x: 160, y: 176, s: 0.8, cover: heroCover, top: "#e57373", bottom: "#3a3a4a" }) + k.label({ x: 160, y: 66, text: "hero", size: 8, color: "#ffd166" });
    /* Customs of the place: a sign with as many rules as the customs are strict. */
    s += `<rect x="8" y="8" width="70" height="40" fill="#f4f1ea" stroke="${k.INK}"/>` + Array.from({ length: 4 - norms }, (_, i) => `<rect x="14" y="${14 + i * 8}" width="58" height="4" fill="#555555"/>`).join("") + k.label({ x: 43, y: 58, text: v("norms"), size: 8, color: "#222222" });
    return s + cap(k, `${v("setting")} covered · ${v("crowdSkin")}% skin · ${v("rightForWeather")} · ${v("coverageRange")}`);
  });

  /* ---------- background: looks or function ---------- */
  const tool = (k, i, x, y, s) => [`<path d="M${x} ${y} l${8 * s} ${-10 * s}" stroke="#888888" stroke-width="${2.5 * s}"/><rect x="${x + 6 * s}" y="${y - 14 * s}" width="${6 * s}" height="${4 * s}" fill="#555555"/>`, `<rect x="${x - 3 * s}" y="${y - 10 * s}" width="${6 * s}" height="${10 * s}" fill="#e6c35a" stroke="${k.INK}"/>`, `<circle cx="${x}" cy="${y - 4 * s}" r="${4 * s}" fill="#9fd3ff" stroke="${k.INK}"/>`, `<path d="M${x} ${y} v${-12 * s} h${6 * s}" stroke="#a0522d" stroke-width="${2 * s}" fill="none"/>`, `<rect x="${x - 5 * s}" y="${y - 7 * s}" width="${10 * s}" height="${7 * s}" fill="#dddddd" stroke="${k.INK}"/>`][i % 5];
  W.look("backUtility", (v, k) => {
    const fn = v.p("setting");
    const work = v.p("atWork");
    const tools = v.n("toolsInHand");
    const read = idx(v, "jobsRead");
    const share = k.clamp(work * 0.5 + v.p("workingShare") * 0.5, 0, 1);
    const far = v.p("workersDistance");
    let s = k.wall({ y: k.lerp(130, 96, far), color: "#9aa0a8", floor: "#4a4a44" });
    const sc = k.lerp(0.48, 0.24, far);
    const y0 = k.lerp(124, 92, far);
    s += crowd(k, 10, (i) => {
      const working = i / 10 < share;
      return { top: k.mix("#c86aa0", "#6a7a4a", fn), bottom: k.mix("#4a3a5a", "#4a4a3a", fn), frill: fn < 0.4, belt: fn > 0.6 ? 3 : 0, pockets: Math.round(fn * 4), arms: working ? (i % 2 ? 1 : 0.6) : -0.4, mood: working ? 0 : 0.3 };
    }, { y: y0, s: sc });
    /* Tools in hand, and job signs over heads that get clearer when jobs read at a glance. */
    for (let i = 0; i < 10; i++) {
      const x = 18 + ((i + 0.5) / 10) * 284 + (i % 2 ? 6 : -6);
      const yy = y0 + (i % 2) * 22;
      if (i / 10 < share && tools > 0) for (let t = 0; t < Math.min(tools, 2); t++) s += tool(k, i + t, x + 10 * sc + t * 6, yy - 86 * sc, sc * 1.4);
      if (read > 0) s += `<rect x="${x - 6}" y="${yy - 150 * sc}" width="12" height="9" rx="2" fill="${k.hsl(i * 70, 50, 55)}" opacity="${read === 1 ? 0.4 : 1}"/>`;
    }
    s += chip(k, 8, 16, `${tools} tools each`, "#ffd166") + chip(k, 316, 16, `workers ${v("workersDistance")} m away`, "#cccccc", "end");
    return s + cap(k, `${v("setting")} · ${v("atWork")} · ${v("workingShare")}% at work · jobs ${v("jobsRead")}`);
  });

  /* ---------- background: the job the clothes do ---------- */
  W.look("backFunction", (v, k) => {
    const job = idx(v, "setting");
    const gear = v.n("gearAmount");
    const danger = idx(v, "danger");
    const shared = idx(v, "sharedJob");
    const geared = v.p("geared");
    const kinds = v.n("jobKinds");
    let s = `<rect width="320" height="180" fill="${["#7fb7e6", "#c8b080", "#c07040", "#6a2a2a"][danger]}"/>` + k.floor(130, "#4a4038");
    for (let i = 0; i < danger * 2; i++) s += `<path d="M${30 + i * 50} 40 l12 -20 l12 20 Z" fill="#ffd166" stroke="${k.INK}"/><text x="${42 + i * 50}" y="37" font-size="10" text-anchor="middle" fill="${k.INK}">!</text>`;
    s += crowd(k, 10, (i) => {
      const nk = shared === 2 ? 1 : shared === 1 ? Math.min(kinds, 3) : kinds;
      const j = (job + ((i % Math.max(1, nk)) * 3)) % 9;
      const o = jobLook(k, nk <= 1 ? job : j);
      const wears = i / 10 < geared;
      const g = Object.assign({}, o);
      if (wears) GEAR.slice(0, gear).forEach((n) => (g[n] = n === "pack" ? 10 : n === "belt" ? 2 : n === "armor" ? "#99aaaa" : true));
      else (g.helmet = false), (g.armor = null);
      g.mood = danger >= 2 ? -0.5 : 0.2;
      return g;
    });
    s += chip(k, 8, 170 - 6, `${kinds} kinds of job · ${v("geared")}% geared`, "#ffd166");
    return s + cap(k, `${v("setting")} · gear ${gear} · ${v("danger")} · ${v("sharedJob")}`);
  });

  /* ---------- background: wear ---------- */
  W.look("backWear", (v, k) => {
    const w = v.p("setting");
    const share = [0.2, 0.45, 0.75, 1][idx(v, "grimeShare")];
    const hard = idx(v, "hardTimes");
    const vsHero = v.p("vsHeroWear");
    const age = logp(v.n("crowdClothesAge") + 1, 1, 31);
    const tears = v.n("tearsEach");
    let s = k.wall({ y: 120, color: k.mix("#a8a090", "#6a6050", hard / 3), floor: "#4a4038" });
    s += crowd(k, 10, (i) => {
      const worn = k.rnd(i + 5) < share;
      const ww = worn ? w : w * 0.2;
      return { top: k.mix(k.mix(k.mix("#3a6ad0", "#c05a3a", k.rnd(i + 1)), "#8a8070", age), "#5a5040", ww * 0.6), bottom: k.mix("#3a3a4a", "#5a5040", ww), stains: worn ? Math.round(ww * 4) : 0, tears: worn ? tears : 0, mood: [0.5, 0, -0.4, -0.9][hard], lean: hard * 3 };
    });
    const hw = k.clamp(w - (vsHero - 0.5) * 1.4, 0, 1);
    s += fig(k, { x: 160, y: 176, s: 0.8, top: k.mix("#e57373", "#7a6050", hw * 0.7), bottom: "#3a3a4a", stains: Math.round(hw * 5), tears: Math.round(hw * 4) }) + k.label({ x: 160, y: 66, text: "hero", size: 8, color: "#ffd166" });
    s += chip(k, 8, 16, `clothes ${v("crowdClothesAge")} yrs old`, "#c8a070") + chip(k, 316, 16, `${tears} tears each`, "#cccccc", "end");
    return s + cap(k, `${v("setting")} · ${v("grimeShare")} worn · ${v("hardTimes")} · hero ${v("vsHeroWear")}`);
  });

  /* ---------- background: all different to all alike ---------- */
  W.look("backSameness", (v, k) => {
    const same = v.p("setting");
    const rank = idx(v, "rankMarks");
    const breakers = v.n("ruleBreakers");
    const groups = v.n("colorGroups");
    const alike = v.p("alikeShare");
    const ranks = v.n("ranks");
    const palette = ["#3a5a8a", "#8a3a3a", "#3a7a4a", "#8a7a2a", "#6a3a8a", "#2a7a7a"];
    let s = k.wall({ y: 120, color: "#a8a49a", floor: "#4a4a44" });
    s += crowd(k, 12, (i) => {
      const inUniform = (i + 0.5) / 12 < k.clamp(same * 0.6 + alike * 0.4, 0, 1);
      const breaker = i >= 12 - breakers;
      const group = palette[i % groups];
      let o = inUniform ? { top: group, bottom: "#2a2a3a", hat: same > 0.7 ? "flatcap" : null } : { top: k.hsl(i * 47, 55, 55), bottom: k.hsl(i * 31 + 90, 30, 40), hat: ["cap", null, "fedora", null][i % 4] };
      if (breaker) o = { top: "#ff4fa0", bottom: "#ffd166", hat: "cowboy" };
      if (rank >= 1 && inUniform && !breaker && (rank === 2 || i % 3 === 0)) (o.badge = true), (o.stripes = ranks ? (i % (ranks + 1)) : 0);
      return o;
    }, { s: 0.44 });
    s += chip(k, 8, 16, `${groups} colour groups · ${ranks} ranks`, "#ffd166") + chip(k, 316, 16, `${breakers} break the look`, "#ff4fa0", "end");
    return s + cap(k, `${v("setting")} · ${v("alikeShare")}% alike · ${v("rankMarks")}`);
  });

  /* ---------- background: true to the time ---------- */
  W.look("backPeriodTruth", (v, k) => {
    const truth = idx(v, "setting");
    const odd = idx(v, "oddOneOut");
    const detail = idx(v, "detail");
    const re = v.p("reimagined");
    const wrong = Math.round(logp(v.n("wrongPieces") + 1, 1, 51) * 10) + [4, 2, 1, 0][truth];
    const off = v.n("yearsOff");
    let s = k.wall({ y: 120, color: "#b8a888", floor: "#5a4a38" });
    const e = 3;
    const pos = [];
    s += crowd(k, 10, (i, n) => {
      const x = 18 + ((i + 0.5) / n) * 284 + (i % 2 ? 6 : -6);
      pos.push([x, 118 + (i % 2) * 22]);
      const ee = k.clamp(e + Math.round(((k.rnd(i + 3) - 0.5) * off) / 25), 0, 10);
      const o = eraFig(k, ee, { pockets: detail * 2, acc: detail });
      if (re > 0) (o.top = k.mix(o.top, "#ff4fa0", re * 0.7)), (o.bottom = k.mix(o.bottom, "#3af0ff", re * 0.5));
      if (odd >= 1 && i === 5) {
        if (odd === 1) o.acc = 5;
        else (o.top = "#3af0ff"), (o.hat = "cap"), (o.acc = 5);
      }
      return o;
    });
    /* Pieces from the wrong time: circled in red. */
    for (let i = 0; i < Math.min(10, wrong); i++) s += k.ring({ x: pos[(i * 3) % 10][0], y: pos[(i * 3) % 10][1] - 48, r: 7, color: "#ff5252", w: 1.5 });
    if (odd === 3) s += k.bubble({ x: 230, y: 30, text: "is that a phone?", w: 100, h: 20, size: 9, tail: -10 });
    s += chip(k, 8, 16, `up to ${off} yrs off · ${v("detail")}`, "#ffd166");
    return s + cap(k, `${v("setting")} · ${v("wrongPieces")} wrong pieces · ${v("reimagined")} · odd: ${v("oddOneOut")}`);
  });

  /* ---------- background against the main character ---------- */
  W.look("backVsMain", (v, k) => {
    const apart = v.p("setting");
    const own = idx(v, "ownColor");
    const frames = idx(v, "framesHero");
    const arcI = idx(v, "apartArc");
    const gap = logp(v.n("heroGap") + 0.5, 0.5, 20.5);
    const cgap = v.p("heroColorGap");
    const crowdHue = 210;
    const heroHue = crowdHue + (apart * 0.5 + cgap * 0.5) * 170;
    let s = k.wall({ y: 120, color: "#9a988e", floor: "#4a4840" });
    const half = 18 + gap * 110;
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const j = Math.floor(i / 2);
      let x = 160 + side * (half + j * 22);
      let y = 140 + (j % 2) * 14;
      if (frames >= 1) y -= (frames === 2 ? 1 : 0.4) * Math.max(0, 40 - j * 10);
      if (x < 10 || x > 310) continue;
      s += fig(k, { x, y, s: 0.5, top: own === 3 ? "#888888" : k.hsl(crowdHue + (k.rnd(i) - 0.5) * 30 * (1 - own / 3), own >= 2 ? 15 : 35, 45), bottom: "#3a3a44", look: frames === 2 ? -side : 0 });
    }
    s += fig(k, { x: 160, y: 174, s: 0.85, top: k.hsl(heroHue, 30 + own * 18, 50), bottom: k.hsl(heroHue, 25, 32), hat: apart === 1 ? "fedora" : null, long: apart > 0.6 ? 0.8 : 0 });
    s += k.arrow({ x1: 160, y1: 176, x2: 160 + half - 6, y2: 176, color: "#ffd166", w: 1.5 }) + k.label({ x: 160 + half / 2, y: 172, text: `${v("heroGap")} m`, size: 8, color: "#ffd166" });
    s += arc(k, 8, 8, [1, 0, -1][arcI], v("apartArc"));
    return s + cap(k, `${v("setting")} · ${v("ownColor")} · frames hero: ${v("framesHero")}`);
  });

  /* ---------- dot grids ---------- */
  const pad = (id, x, y, xLabel, yLabel) => W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  pad("mainCost", "outfitPrice", "vsRoomCost", "What the outfit cost", "Pricier than the room");
  pad("mainCoverage", "skinShown", "layersOff", "Skin showing", "Layers taken off");
  pad("mainWear", "clothesAge", "tears", "How old the clothes are", "Tears and holes");
  pad("mainSetMatch", "colorGap", "vsRoomLight", "Colour gap from the room", "Brighter than the room");
  pad("backCost", "typicalPrice", "richShare", "Typical outfit cost", "Share dressed rich");
  pad("backCoverage", "crowdSkin", "vsHeroSkin", "Skin showing", "More covered than the hero");
  pad("backUtility", "workersDistance", "workingShare", "How far the workers are", "Share at work");
  pad("backSameness", "alikeShare", "colorGroups", "Share dressed alike", "Groups by colour");
  pad("backWear", "crowdClothesAge", "tearsEach", "Age of their clothes", "Patches or tears each");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
