/* The drawing kit for every window's live picture (window.CurioLookKit). Each helper returns an SVG string to
   put inside a 320 by 180 picture (CuriosityWindows.look). Numbers that say "p" run from 0 to 1. Colors are
   plain CSS colors. Nothing here touches the page, so the pictures can be drawn and tested in Node too.

   Scene:    bg(color), floor(y, color), sky(p dark-to-bright), wall({...}), window_({x,y,w,h,light})
   People:   person({x, y feet, s size, color, mood -1..1, lean degrees, arms -1..1, look -1..1, walk 0..1,
             alpha, label}), face({x, y, r, mood -1..1, brows -1..1, eyes 0..1 open, look -1..1, mouth 0..1 open,
             color}), hand({x,y,s,open 0..1})
   Gear:     cam({x, y, dir degrees (0 = looking right), s, color}), lamp({x, y, dir, s, color, spread degrees,
             power 0..1}), beam({x, y, dir, len, spread, color, alpha}), mic({x,y,s}), speaker({x,y,s,level})
   Marks:    arrow({x1,y1,x2,y2,color,w}), ring({x,y,r,color,w,dash}), dot({x,y,r,color}), label({x,y,text,size,
             color,anchor,weight}), caption(text) bottom line, title(text) top line
   Gauges:   meter({x,y,w,label,p,color}), dial({x,y,r,p,label,color}), bars({x,y,w,h,values 0..1,color,labels}),
             graph({x,y,w,h,points 0..1,color}), wave({x,y,w,h,amp 0..1,cycles,noise 0..1,color}),
             strip({x,y,w,h,lengths,color,gap}) shots in a row, clock({x,y,r,p}), pie({x,y,r,p,color})
   Color:    hsl(h,s,l,a), mix(a,b,p) between two #rrggbb, tint({color, alpha}) over the whole picture,
             grade({warm -1..1, sat 0..1, bright 0..1, contrast 0..1}) a color wash, vignette(p)
   Text:     text({x,y,text,size,color,anchor,weight,font,italic,spacing,outline}), bubble({x,y,text,w,tail})
   Frames:   frame({x,y,w,h,color,w2}) a picture inside the picture, letterbox(p), panel({x,y,w,h})
   Utility:  W, H, esc, lerp(a,b,p), clamp(x,a,b), pick(list, p), rnd(seed) a fixed random 0..1 */
(function (root) {
  const W = 320;
  const H = 180;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const r1 = (n) => Math.round(n * 10) / 10;
  const lerp = (a, b, p) => a + (b - a) * p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const pick = (list, p) => list[clamp(Math.round(p * (list.length - 1)), 0, list.length - 1)];
  const rnd = (seed) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const rad = (d) => (d * Math.PI) / 180;
  const INK = "#1c1712";

  const hsl = (h, s, l, a) => (a == null ? `hsl(${r1(h)} ${r1(s)}% ${r1(l)}%)` : `hsl(${r1(h)} ${r1(s)}% ${r1(l)}% / ${r1(a * 100) / 100})`);
  function mix(a, b, p) {
    const x = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const A = x(a);
    const B = x(b);
    return "#" + A.map((v, i) => Math.round(lerp(v, B[i], clamp(p, 0, 1))).toString(16).padStart(2, "0")).join("");
  }

  /* ---------- scene ---------- */
  const bg = (color) => `<rect x="0" y="0" width="${W}" height="${H}" fill="${color || "#2a2a30"}"/>`;
  const floor = (y, color) => `<rect x="0" y="${r1(y)}" width="${W}" height="${r1(H - y)}" fill="${color || "#3b332b"}"/>`;
  const sky = (p) => `<rect x="0" y="0" width="${W}" height="${H}" fill="${mix("#141826", "#bcd8ef", clamp(p, 0, 1))}"/>`;
  function wall(o) {
    o = o || {};
    const y = o.y == null ? 120 : o.y;
    return `<rect x="0" y="0" width="${W}" height="${r1(y)}" fill="${o.color || "#d9cbb5"}"/>` + floor(y, o.floor || "#8a7158");
  }
  function window_(o) {
    o = o || {};
    const x = o.x == null ? 230 : o.x;
    const y = o.y == null ? 30 : o.y;
    const w = o.w || 56;
    const h = o.h || 44;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mix("#26313f", "#e6f0f7", o.light == null ? 0.8 : o.light)}" stroke="${INK}" stroke-width="2"/><line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${INK}" stroke-width="1.5"/>`;
  }

  /* ---------- people ---------- */
  function face(o) {
    o = o || {};
    const x = o.x == null ? W / 2 : o.x;
    const y = o.y == null ? H / 2 : o.y;
    const r = o.r || 40;
    const mood = clamp(o.mood || 0, -1, 1);
    const brows = clamp(o.brows == null ? mood * 0.5 : o.brows, -1, 1);
    const open = clamp(o.eyes == null ? 0.8 : o.eyes, 0, 1);
    const look = clamp(o.look || 0, -1, 1);
    const mo = clamp(o.mouth || 0, 0, 1);
    const ex = r * 0.38;
    const ey = y - r * 0.15;
    const eh = Math.max(0.6, r * 0.13 * open);
    const eyes = [-1, 1]
      .map((sd) => `<ellipse cx="${r1(x + sd * ex)}" cy="${r1(ey)}" rx="${r1(r * 0.13)}" ry="${r1(eh)}" fill="#fff" stroke="${INK}" stroke-width="1.2"/>${open > 0.15 ? `<circle cx="${r1(x + sd * ex + look * r * 0.06)}" cy="${r1(ey)}" r="${r1(Math.min(eh, r * 0.07))}" fill="${INK}"/>` : ""}`)
      .join("");
    const bw = [-1, 1].map((sd) => `<line x1="${r1(x + sd * (ex - r * 0.16))}" y1="${r1(ey - r * 0.26 - (sd < 0 ? 1 : 1) * brows * r * 0.08 + sd * brows * -r * 0.06)}" x2="${r1(x + sd * (ex + r * 0.16))}" y2="${r1(ey - r * 0.26 - brows * r * 0.08 - sd * brows * -r * 0.06)}" stroke="${INK}" stroke-width="${r1(r * 0.07)}" stroke-linecap="round"/>`).join("");
    const my = y + r * 0.45;
    const mw = r * 0.4;
    const curve = mood * r * 0.25;
    const mouth = mo > 0.05 ? `<ellipse cx="${x}" cy="${r1(my)}" rx="${r1(mw * 0.6)}" ry="${r1(r * 0.05 + mo * r * 0.2)}" fill="#5a1f1f" stroke="${INK}" stroke-width="1.5"/>` : `<path d="M${r1(x - mw)} ${r1(my)} Q${x} ${r1(my + curve)} ${r1(x + mw)} ${r1(my)}" fill="none" stroke="${INK}" stroke-width="${r1(r * 0.06)}" stroke-linecap="round"/>`;
    return `<g${o.alpha != null ? ` opacity="${r1(o.alpha)}"` : ""}><circle cx="${x}" cy="${y}" r="${r}" fill="${o.color || "#f0c8a0"}" stroke="${INK}" stroke-width="2"/>${eyes}${bw}${mouth}</g>`;
  }
  function person(o) {
    o = o || {};
    const x = o.x == null ? W / 2 : o.x;
    const y = o.y == null ? 160 : o.y;
    const s = o.s || 1;
    const hr = 9 * s;
    const body = 34 * s;
    const leg = 24 * s;
    const lean = o.lean || 0;
    const arms = clamp(o.arms || 0, -1, 1);
    const walk = clamp(o.walk || 0, 0, 1);
    const hipY = y - leg;
    const neckY = hipY - body;
    const headY = neckY - hr;
    const col = o.color || "#4a6fa5";
    const aY = neckY + 6 * s;
    const armEnd = (sd) => [x + sd * 16 * s, aY + 20 * s - arms * 34 * s];
    const legs = [-1, 1].map((sd) => `<line x1="${x}" y1="${r1(hipY)}" x2="${r1(x + sd * (5 + walk * 12) * s)}" y2="${r1(y)}" stroke="${INK}" stroke-width="${r1(4 * s)}" stroke-linecap="round"/>`).join("");
    const armsS = [-1, 1].map((sd) => { const [ax, ay] = armEnd(sd); return `<line x1="${x}" y1="${r1(aY)}" x2="${r1(ax)}" y2="${r1(ay)}" stroke="${INK}" stroke-width="${r1(3.5 * s)}" stroke-linecap="round"/>`; }).join("");
    return `<g${o.alpha != null ? ` opacity="${r1(o.alpha)}"` : ""} transform="rotate(${r1(lean)} ${x} ${r1(y)})">${legs}<rect x="${r1(x - 9 * s)}" y="${r1(neckY)}" width="${r1(18 * s)}" height="${r1(body)}" rx="${r1(5 * s)}" fill="${col}" stroke="${INK}" stroke-width="1.5"/>${armsS}${face({ x, y: headY, r: hr, mood: o.mood || 0, look: o.look || 0, eyes: o.eyes, color: o.skin })}${o.label ? label({ x, y: y + 12, text: o.label, size: 9, color: "#ddd" }) : ""}</g>`;
  }
  function hand(o) {
    o = o || {};
    const x = o.x == null ? W / 2 : o.x;
    const y = o.y == null ? H / 2 : o.y;
    const s = o.s || 1;
    const op = clamp(o.open == null ? 1 : o.open, 0, 1);
    const fingers = [-2, -1, 0, 1].map((i) => `<rect x="${r1(x + i * 7 * s)}" y="${r1(y - (10 + op * 14) * s)}" width="${r1(6 * s)}" height="${r1((6 + op * 16) * s)}" rx="${r1(3 * s)}" fill="#f0c8a0" stroke="${INK}"/>`).join("");
    return `<g>${fingers}<rect x="${r1(x - 15 * s)}" y="${r1(y - 4 * s)}" width="${r1(30 * s)}" height="${r1(24 * s)}" rx="${r1(6 * s)}" fill="#f0c8a0" stroke="${INK}"/></g>`;
  }

  /* ---------- gear ---------- */
  function cam(o) {
    o = o || {};
    const x = o.x == null ? 40 : o.x;
    const y = o.y == null ? 90 : o.y;
    const s = o.s || 1;
    return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(o.dir || 0)}) scale(${r1(s)})"><rect x="-14" y="-8" width="20" height="16" rx="2" fill="${o.color || "#e2e2e2"}" stroke="${INK}" stroke-width="1.5"/><path d="M6 -5 L16 -9 L16 9 L6 5 Z" fill="${o.color || "#e2e2e2"}" stroke="${INK}" stroke-width="1.5"/><circle cx="-8" cy="-12" r="4" fill="none" stroke="${INK}"/><circle cx="1" cy="-12" r="4" fill="none" stroke="${INK}"/></g>`;
  }
  function beam(o) {
    o = o || {};
    const x = o.x || 0;
    const y = o.y || 0;
    const len = o.len || 200;
    const sp = rad((o.spread == null ? 30 : o.spread) / 2);
    const d = rad(o.dir || 0);
    const a = [x + Math.cos(d - sp) * len, y + Math.sin(d - sp) * len];
    const b = [x + Math.cos(d + sp) * len, y + Math.sin(d + sp) * len];
    return `<path d="M${r1(x)} ${r1(y)} L${r1(a[0])} ${r1(a[1])} L${r1(b[0])} ${r1(b[1])} Z" fill="${o.color || "#fff3c4"}" opacity="${r1(o.alpha == null ? 0.35 : o.alpha)}"/>`;
  }
  function lamp(o) {
    o = o || {};
    const x = o.x == null ? 40 : o.x;
    const y = o.y == null ? 40 : o.y;
    const s = o.s || 1;
    const p = clamp(o.power == null ? 0.7 : o.power, 0, 1);
    return beam({ x, y, dir: o.dir || 30, len: 120 + p * 200, spread: o.spread == null ? 40 : o.spread, color: o.color || "#fff3c4", alpha: 0.12 + p * 0.4 }) + `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(o.dir || 30)}) scale(${r1(s)})"><path d="M-10 -9 L8 -6 L8 6 L-10 9 Z" fill="#555" stroke="${INK}" stroke-width="1.5"/><circle cx="9" cy="0" r="5" fill="${o.color || "#fff3c4"}"/></g>`;
  }
  const mic = (o) => { o = o || {}; const x = o.x == null ? 160 : o.x; const y = o.y == null ? 40 : o.y; const s = o.s || 1; return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s)})"><rect x="-6" y="-14" width="12" height="20" rx="6" fill="#bbb" stroke="${INK}" stroke-width="1.5"/><line x1="0" y1="6" x2="0" y2="22" stroke="${INK}" stroke-width="2"/></g>`; };
  function speaker(o) {
    o = o || {};
    const x = o.x == null ? 40 : o.x;
    const y = o.y == null ? 90 : o.y;
    const s = o.s || 1;
    const lv = clamp(o.level == null ? 0.5 : o.level, 0, 1);
    const arcs = [1, 2, 3].filter((i) => lv >= (i - 1) / 3 + 0.01).map((i) => `<path d="M${10 + i * 7} ${-6 - i * 4} Q${16 + i * 9} 0 ${10 + i * 7} ${6 + i * 4}" fill="none" stroke="${o.color || "#9fd3ff"}" stroke-width="2"/>`).join("");
    return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s)})"><path d="M-10 -6 L-2 -6 L8 -14 L8 14 L-2 6 L-10 6 Z" fill="#ccc" stroke="${INK}" stroke-width="1.5"/>${arcs}</g>`;
  }

  /* ---------- marks ---------- */
  const arrow = (o) => {
    o = o || {};
    const c = o.color || "#ffd166";
    const w = o.w || 2.5;
    const a = Math.atan2(o.y2 - o.y1, o.x2 - o.x1);
    const h = 6 + w * 1.5;
    return `<g><line x1="${r1(o.x1)}" y1="${r1(o.y1)}" x2="${r1(o.x2)}" y2="${r1(o.y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="M${r1(o.x2)} ${r1(o.y2)} L${r1(o.x2 - h * Math.cos(a - 0.45))} ${r1(o.y2 - h * Math.sin(a - 0.45))} L${r1(o.x2 - h * Math.cos(a + 0.45))} ${r1(o.y2 - h * Math.sin(a + 0.45))} Z" fill="${c}"/></g>`;
  };
  const ring = (o) => `<circle cx="${r1(o.x)}" cy="${r1(o.y)}" r="${r1(Math.max(0.5, o.r))}" fill="none" stroke="${o.color || "#ffd166"}" stroke-width="${o.w || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
  const dot = (o) => `<circle cx="${r1(o.x)}" cy="${r1(o.y)}" r="${r1(Math.max(0.5, o.r || 4))}" fill="${o.color || "#ffd166"}"/>`;
  function label(o) {
    o = o || {};
    return `<text x="${r1(o.x)}" y="${r1(o.y)}" font-size="${o.size || 10}" fill="${o.color || "#eee"}" text-anchor="${o.anchor || "middle"}" font-family="system-ui, sans-serif"${o.weight ? ` font-weight="${o.weight}"` : ""}>${esc(o.text)}</text>`;
  }
  const caption = (text) => `<rect x="0" y="${H - 18}" width="${W}" height="18" fill="rgba(0,0,0,0.55)"/>` + label({ x: W / 2, y: H - 5, text, size: 10, color: "#f4f4f4" });
  const title = (text) => label({ x: 8, y: 14, text, size: 10, color: "#ddd", anchor: "start", weight: 700 });

  /* ---------- gauges ---------- */
  function meter(o) {
    o = o || {};
    const x = o.x == null ? 20 : o.x;
    const y = o.y == null ? 20 : o.y;
    const w = o.w || 120;
    const p = clamp(o.p || 0, 0, 1);
    return `<g>${o.label ? label({ x, y: y - 3, text: o.label, size: 9, anchor: "start", color: "#ccc" }) : ""}<rect x="${x}" y="${y}" width="${w}" height="8" rx="4" fill="#3a3a40"/><rect x="${x}" y="${y}" width="${r1(Math.max(2, w * p))}" height="8" rx="4" fill="${o.color || "#ffd166"}"/></g>`;
  }
  function dial(o) {
    o = o || {};
    const x = o.x == null ? 60 : o.x;
    const y = o.y == null ? 90 : o.y;
    const r = o.r || 26;
    const p = clamp(o.p || 0, 0, 1);
    const a = rad(135 + p * 270);
    return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#2c2c32" stroke="#555" stroke-width="2"/><line x1="${x}" y1="${y}" x2="${r1(x + Math.cos(a) * r * 0.85)}" y2="${r1(y + Math.sin(a) * r * 0.85)}" stroke="${o.color || "#ffd166"}" stroke-width="3" stroke-linecap="round"/>${o.label ? label({ x, y: y + r + 12, text: o.label, size: 9, color: "#ccc" }) : ""}</g>`;
  }
  function bars(o) {
    o = o || {};
    const vals = o.values || [];
    const x = o.x == null ? 20 : o.x;
    const y = o.y == null ? 20 : o.y;
    const w = o.w || 280;
    const h = o.h || 120;
    const bw = w / Math.max(1, vals.length);
    return vals.map((v, i) => `<rect x="${r1(x + i * bw + 2)}" y="${r1(y + h - clamp(v, 0, 1) * h)}" width="${r1(bw - 4)}" height="${r1(Math.max(1, clamp(v, 0, 1) * h))}" fill="${Array.isArray(o.color) ? o.color[i % o.color.length] : o.color || "#7fb7ff"}"/>${o.labels && o.labels[i] ? label({ x: x + i * bw + bw / 2, y: y + h + 11, text: o.labels[i], size: 8, color: "#bbb" }) : ""}`).join("");
  }
  function graph(o) {
    o = o || {};
    const pts = o.points || [];
    const x = o.x == null ? 20 : o.x;
    const y = o.y == null ? 20 : o.y;
    const w = o.w || 280;
    const h = o.h || 120;
    const P = pts.map((p, i) => `${r1(x + (i / Math.max(1, pts.length - 1)) * w)},${r1(y + h - clamp(p, 0, 1) * h)}`).join(" ");
    return `<polyline points="${P}" fill="none" stroke="${o.color || "#ffd166"}" stroke-width="${o.w2 || 2.5}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  function wave(o) {
    o = o || {};
    const x = o.x == null ? 20 : o.x;
    const y = o.y == null ? 90 : o.y;
    const w = o.w || 280;
    const h = o.h || 60;
    const amp = clamp(o.amp == null ? 0.5 : o.amp, 0, 1);
    const cyc = o.cycles || 6;
    const nz = clamp(o.noise || 0, 0, 1);
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const v = Math.sin(t * cyc * Math.PI * 2) * (1 - nz) + (rnd(i + 3) * 2 - 1) * nz;
      pts.push(`${r1(x + t * w)},${r1(y - v * amp * h * 0.5)}`);
    }
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="${o.color || "#9fd3ff"}" stroke-width="2"/>`;
  }
  function strip(o) {
    o = o || {};
    const L = o.lengths || [1, 1, 1];
    const x = o.x == null ? 10 : o.x;
    const y = o.y == null ? 70 : o.y;
    const w = o.w || 300;
    const h = o.h || 40;
    const tot = L.reduce((a, b) => a + b, 0) || 1;
    const gap = o.gap == null ? 2 : o.gap;
    let at = x;
    return L.map((l, i) => {
      const ww = (l / tot) * w;
      const r = `<rect x="${r1(at)}" y="${y}" width="${r1(Math.max(1, ww - gap))}" height="${h}" fill="${Array.isArray(o.color) ? o.color[i % o.color.length] : o.color || (i % 2 ? "#6c8fb8" : "#8fb2d8")}" stroke="${INK}" stroke-width="1"/>`;
      at += ww;
      return r;
    }).join("");
  }
  function clock(o) {
    o = o || {};
    const x = o.x == null ? 60 : o.x;
    const y = o.y == null ? 90 : o.y;
    const r = o.r || 28;
    const a = rad(-90 + clamp(o.p || 0, 0, 1) * 360);
    return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#f4f1ea" stroke="${INK}" stroke-width="2"/><line x1="${x}" y1="${y}" x2="${r1(x + Math.cos(a) * r * 0.8)}" y2="${r1(y + Math.sin(a) * r * 0.8)}" stroke="${o.color || "#c0392b"}" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  function pie(o) {
    o = o || {};
    const x = o.x == null ? 60 : o.x;
    const y = o.y == null ? 90 : o.y;
    const r = o.r || 28;
    const p = clamp(o.p || 0, 0, 0.9999);
    const a = rad(-90 + p * 360);
    const large = p > 0.5 ? 1 : 0;
    return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#3a3a40"/>${p > 0.001 ? `<path d="M${x} ${y} L${x} ${y - r} A${r} ${r} 0 ${large} 1 ${r1(x + Math.cos(a) * r)} ${r1(y + Math.sin(a) * r)} Z" fill="${o.color || "#ffd166"}"/>` : ""}</g>`;
  }

  /* ---------- color ---------- */
  const tint = (o) => `<rect x="0" y="0" width="${W}" height="${H}" fill="${o.color || "#000"}" opacity="${r1(clamp(o.alpha == null ? 0.3 : o.alpha, 0, 1) * 100) / 100}"/>`;
  function grade(o) {
    o = o || {};
    const warm = clamp(o.warm || 0, -1, 1);
    const sat = clamp(o.sat == null ? 0.5 : o.sat, 0, 1);
    const bright = clamp(o.bright == null ? 0.5 : o.bright, 0, 1);
    const con = clamp(o.contrast == null ? 0.5 : o.contrast, 0, 1);
    return [
      warm ? tint({ color: warm > 0 ? "#ff9a3c" : "#3c8cff", alpha: Math.abs(warm) * 0.3 }) : "",
      sat < 0.5 ? tint({ color: "#808080", alpha: (0.5 - sat) * 1.4 }) : "",
      bright < 0.5 ? tint({ color: "#000", alpha: (0.5 - bright) * 1.5 }) : bright > 0.5 ? tint({ color: "#fff", alpha: (bright - 0.5) * 0.6 }) : "",
      con > 0.5 ? vignette((con - 0.5) * 1.6) : con < 0.5 ? tint({ color: "#9a9a9a", alpha: (0.5 - con) * 0.6 }) : "",
    ].join("");
  }
  const vignette = (p) => `<defs><radialGradient id="cwvig"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="${r1(clamp(p, 0, 1) * 100) / 100}"/></radialGradient></defs><rect x="0" y="0" width="${W}" height="${H}" fill="url(#cwvig)"/>`;

  /* ---------- text ---------- */
  function text(o) {
    o = o || {};
    return `<text x="${r1(o.x == null ? W / 2 : o.x)}" y="${r1(o.y == null ? H / 2 : o.y)}" font-size="${r1(o.size || 18)}" fill="${o.color || "#fff"}" text-anchor="${o.anchor || "middle"}" font-family="${o.font || "system-ui, sans-serif"}"${o.weight ? ` font-weight="${o.weight}"` : ""}${o.italic ? ' font-style="italic"' : ""}${o.spacing ? ` letter-spacing="${o.spacing}"` : ""}${o.outline ? ` stroke="${o.outline}" stroke-width="${o.outlineW || 2}" paint-order="stroke"` : ""}${o.alpha != null ? ` opacity="${r1(o.alpha)}"` : ""}>${esc(o.text)}</text>`;
  }
  function bubble(o) {
    o = o || {};
    const x = o.x == null ? 160 : o.x;
    const y = o.y == null ? 40 : o.y;
    const w = o.w || 120;
    const h = o.h || 34;
    const t = o.tail == null ? -20 : o.tail;
    return `<g><rect x="${r1(x - w / 2)}" y="${r1(y - h / 2)}" width="${w}" height="${h}" rx="12" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M${r1(x + t - 6)} ${r1(y + h / 2 - 1)} L${r1(x + t * 1.4)} ${r1(y + h / 2 + 14)} L${r1(x + t + 6)} ${r1(y + h / 2 - 1)} Z" fill="#fff" stroke="${INK}" stroke-width="2"/>${text({ x, y: y + 4, text: o.text, size: o.size || 11, color: INK })}</g>`;
  }

  /* ---------- frames ---------- */
  const frame = (o) => `<rect x="${r1(o.x)}" y="${r1(o.y)}" width="${r1(o.w)}" height="${r1(o.h)}" fill="none" stroke="${o.color || "#ffd166"}" stroke-width="${o.w2 || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
  const letterbox = (p) => {
    const b = clamp(p, 0, 1) * 40;
    return b > 0.5 ? `<rect x="0" y="0" width="${W}" height="${r1(b)}" fill="#000"/><rect x="0" y="${r1(H - b)}" width="${W}" height="${r1(b)}" fill="#000"/>` : "";
  };
  const panel = (o) => `<rect x="${r1(o.x)}" y="${r1(o.y)}" width="${r1(o.w)}" height="${r1(o.h)}" fill="${o.fill || "#f4f1ea"}" stroke="${INK}" stroke-width="${o.w2 || 2.5}"/>`;

  const K = { W, H, INK, esc, lerp, clamp, pick, rnd, rad, hsl, mix, bg, floor, sky, wall, window_, face, person, hand, cam, lamp, beam, mic, speaker, arrow, ring, dot, label, caption, title, meter, dial, bars, graph, wave, strip, clock, pie, tint, grade, vignette, text, bubble, frame, letterbox, panel };
  root.CurioLookKit = K;
  if (typeof module !== "undefined" && module.exports) module.exports = K;
})(typeof window !== "undefined" ? window : globalThis);
