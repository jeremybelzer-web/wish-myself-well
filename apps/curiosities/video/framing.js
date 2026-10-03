/* video/framing.js: shot framing. Where the main person sits in the inspiration's frame (their eyes on a third or
   in the centre, the room above their head, how much of the frame they fill, the room left in front of them in
   the way they face or move), and the inspiration's dutch tilt (its horizon rolled), measured over time; then the
   same framing on your clip by a virtual camera: a crop that zooms in (never out, so no black edges) and pans to
   follow your own person, moved the way a camera operator would (it waits through small wobbles, then eases into
   each new framing).

   Part of the video core (no page): the AI cut-out (mask.js) gives the labels, clip.js draws the crop.

   window.CurioFraming
   MEASURING
   - blobs(labels, w, h) -> [{ area, cx, cy, top, bottom, left, right, face, hair }]   the people in one cut-out,
     each one joined body (biggest first, 4 at most), with their face and hair
   - series(looks) -> { times, dt, has, x, y, size, facing, area }   the main person over a clip, from
     [{ t, blobs }]: their eyes (x, y, 0..1 of the frame), their head's height (size, a share of the frame's
     height), which way they face or move (facing, -1 left .. +1 right). The same person is followed from look
     to look (a bigger person has to be clearly bigger to take over).
   - shot(elements, t, aspect) -> { x, y, size, facing } | null   at one moment (from elements.main, else a rougher
     guess from the elements of all the people together)
   - roll(gray, w, h) -> { deg, conf }   how far the picture's straight lines are rolled from level (degrees,
     + clockwise), and how sure (0..1): the share of strong edges that agree
   - rollAt(dissection, t) -> degrees | null   the clip's roll at one moment (null: no straight lines to trust)
   APPLYING
   - solve(want, have, { amount, zmax, aspect, roll }) -> { z, x, y }   the crop (zoom z >= 1, centre x, y as
     0..1 of the source) that puts have's eyes where want's are, as big, as near as the zoom limit lets it
   - follow(values, dt, { tol, sigma, breaks }) -> values   the operator: holds still until the wanted value moves
     more than tol, then eases there (no jitter, no lag)
   - path(plan, opts) -> { dt, z, x, y, roll }   the whole move for a plan, made once
   - at(plan, t) -> { z, x, y, roll } | null      the crop at one output moment
   - rect(frame, vw, vh) -> { x, y, w, h, roll }  the crop in source pixels (roll in radians)
   - score(plan, before, after)                   where the eyes sit and how big the head is, before and after,
     against the inspiration */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  function median(a) {
    if (!a.length) return 0;
    const b = a.slice().sort((x, y) => x - y);
    return b.length % 2 ? b[b.length >> 1] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2;
  }
  function corr(a, b) {
    const n = Math.min(a.length, b.length);
    if (n < 3) return 0;
    const ma = mean(a.slice(0, n)),
      mb = mean(b.slice(0, n));
    let sab = 0,
      saa = 0,
      sbb = 0;
    for (let i = 0; i < n; i++) {
      sab += (a[i] - ma) * (b[i] - mb);
      saa += (a[i] - ma) * (a[i] - ma);
      sbb += (b[i] - mb) * (b[i] - mb);
    }
    return saa > 1e-12 && sbb > 1e-12 ? sab / Math.sqrt(saa * sbb) : 0;
  }

  /* ---------- the people in one cut-out ---------- */
  /* Labels: 0 set, 1 hair, 2 body skin, 3 face skin, 4 clothes, 5 other. A person is one joined patch of 1..5. */
  function blobs(labels, w, h) {
    const n = w * h,
      id = new Int32Array(n).fill(-1),
      stack = new Int32Array(n);
    const out = [];
    for (let i0 = 0; i0 < n; i0++) {
      if (id[i0] >= 0 || !(labels[i0] & 7) || (labels[i0] & 7) > 5) continue;
      const b = { n: 0, sx: 0, sy: 0, top: h, bottom: -1, left: w, right: -1, fn: 0, fx: 0, fy: 0, ft: h, fb: -1, hn: 0, hx: 0, hy: 0 };
      let sp = 0;
      stack[sp++] = i0;
      id[i0] = out.length;
      while (sp) {
        const i = stack[--sp],
          x = i % w,
          y = (i / w) | 0,
          l = labels[i] & 7;
        b.n++;
        b.sx += x;
        b.sy += y;
        if (y < b.top) b.top = y;
        if (y > b.bottom) b.bottom = y;
        if (x < b.left) b.left = x;
        if (x > b.right) b.right = x;
        if (l === 3) {
          b.fn++;
          b.fx += x;
          b.fy += y;
          if (y < b.ft) b.ft = y;
          if (y > b.fb) b.fb = y;
        } else if (l === 1) {
          b.hn++;
          b.hx += x;
          b.hy += y;
        }
        const push = (j) => {
          if (id[j] < 0 && labels[j] & 7 && (labels[j] & 7) <= 5) {
            id[j] = out.length;
            stack[sp++] = j;
          }
        };
        if (x > 0) push(i - 1);
        if (x < w - 1) push(i + 1);
        if (y > 0) push(i - w);
        if (y < h - 1) push(i + w);
      }
      out.push(b);
    }
    return out
      .filter((b) => b.n >= n * 0.002)
      .sort((a, b) => b.n - a.n)
      .slice(0, 4)
      .map((b) => ({
        area: r3(b.n / n),
        cx: r3(b.sx / b.n / w),
        cy: r3(b.sy / b.n / h),
        top: r3(b.top / h),
        bottom: r3((b.bottom + 1) / h),
        left: r3(b.left / w),
        right: r3((b.right + 1) / w),
        face: b.fn ? { area: r3(b.fn / n), cx: r3(b.fx / b.fn / w), cy: r3(b.fy / b.fn / h), top: r3(b.ft / h), bottom: r3((b.fb + 1) / h) } : null,
        hair: b.hn ? { area: r3(b.hn / n), cx: r3(b.hx / b.hn / w), cy: r3(b.hy / b.hn / h) } : null,
      }));
  }

  /* One person's eyes, head size and the way their face turns, from their patch. aspect = height / width. */
  function headOf(b, aspect) {
    const f = b.face && b.face.area > 0.0004 ? b.face : null;
    let x, y, size;
    if (f) {
      const fh = Math.max(f.bottom - f.top, Math.sqrt(f.area / aspect));
      x = f.cx;
      /* the eyes: about two fifths of the way down the face skin (the forehead is often under hair) */
      y = f.top + 0.4 * (f.bottom - f.top);
      size = fh * 1.35;
    } else {
      /* no face showing (turned away, too small): the top of the patch is the head */
      const tall = b.bottom - b.top;
      size = clamp(tall * 0.2, 0.02, 0.6);
      x = b.hair ? b.hair.cx : b.cx;
      y = b.top + size * 0.45;
    }
    /* which way the face turns: the face's middle off the hair's middle, as a share of the head's width */
    let turn = 0;
    if (f && b.hair && b.hair.area > 0.0004) turn = clamp((f.cx - b.hair.cx) / Math.max(0.01, size * aspect * 0.5), -1, 1);
    return { x, y, size, turn };
  }

  /* ---------- the main person over a clip ---------- */
  function series(looks, aspect) {
    const times = looks.map((l) => l.t);
    const N = times.length;
    const dt = N > 1 ? (times[N - 1] - times[0]) / (N - 1) : 1;
    const A = aspect || looks.aspect || 0.5625;
    const out = { times, dt: r3(dt), has: [], x: [], y: [], size: [], turn: [], area: [] };
    let last = null;
    looks.forEach((l) => {
      const bs = (l.blobs || []).filter((b) => b.area > 0.004);
      let pick = null;
      if (bs.length) {
        /* a person with a face counts more; the one followed last time keeps it unless another is clearly bigger */
        const score = (b) => b.area * (b.face && b.face.area > 0.0004 ? 1.5 : 1);
        const best = bs.reduce((a, b) => (score(b) > score(a) ? b : a));
        pick = best;
        if (last) {
          const near = bs.reduce((a, b) => (Math.hypot(b.cx - last.cx, b.cy - last.cy) < Math.hypot(a.cx - last.cx, a.cy - last.cy) ? b : a));
          if (Math.hypot(near.cx - last.cx, near.cy - last.cy) < 0.15 && score(near) >= 0.6 * score(best)) pick = near;
        }
      }
      if (pick) {
        const hd = headOf(pick, A);
        out.has.push(1);
        out.x.push(r3(hd.x));
        out.y.push(r3(hd.y));
        out.size.push(r3(hd.size));
        out.turn.push(r3(hd.turn));
        out.area.push(pick.area);
        last = pick;
      } else {
        out.has.push(0);
        out.x.push(null);
        out.y.push(null);
        out.size.push(null);
        out.turn.push(null);
        out.area.push(0);
      }
    });
    fill(out);
    return out;
  }
  /* Gaps (no one there) take the nearest look that had someone, so a blink of the AI does not move the camera. */
  function fill(s) {
    ["x", "y", "size", "turn"].forEach((k) => {
      const a = s[k];
      let prev = null;
      for (let i = 0; i < a.length; i++) if (a[i] == null) a[i] = prev;
      else prev = a[i];
      let next = null;
      for (let i = a.length - 1; i >= 0; i--) if (a[i] == null) a[i] = next;
      else next = a[i];
      for (let i = 0; i < a.length; i++) if (a[i] == null) a[i] = k === "turn" ? 0 : k === "size" ? 0 : 0.5;
    });
  }
  /* Without elements.main: the people's elements all together (rougher with several people). */
  function fromParts(el, aspect) {
    const P = el.parts;
    const out = { times: el.times, dt: el.dt, has: [], x: [], y: [], size: [], turn: [], area: [] };
    el.times.forEach((t, i) => {
      const pa = P.person.area[i] || 0;
      if (pa < 0.004) {
        out.has.push(0);
        ["x", "y", "size", "turn"].forEach((k) => out[k].push(null));
        out.area.push(0);
        return;
      }
      const b = {
        area: pa,
        cx: P.person.cx[i],
        top: P.person.top[i],
        bottom: P.person.bottom[i],
        face: P.face.area[i] > 0.0004 ? { area: P.face.area[i], cx: P.face.cx[i], cy: P.face.cy[i], top: Math.max(P.face.top[i], P.face.cy[i] - 1.2 * Math.sqrt(P.face.area[i] / aspect) / 2), bottom: Math.min(P.face.bottom[i], P.face.cy[i] + 1.2 * Math.sqrt(P.face.area[i] / aspect) / 2) } : null,
        hair: P.hair.area[i] > 0.0004 ? { area: P.hair.area[i], cx: P.hair.cx[i] } : null,
      };
      const hd = headOf(b, aspect);
      out.has.push(1);
      out.x.push(r3(hd.x));
      out.y.push(r3(hd.y));
      out.size.push(r3(hd.size));
      out.turn.push(r3(hd.turn));
      out.area.push(pa);
    });
    fill(out);
    return out;
  }
  function mainOf(d) {
    const el = d && d.elements;
    if (!el) return null;
    const key = "__framing";
    if (el[key]) return el[key];
    const aspect = d.aspect || 0.5625;
    const s = el.main && el.main.times && el.main.times.length ? el.main : el.parts ? fromParts(el, aspect) : null;
    if (!s) return null;
    /* Which way they face: the face's turn, and which way they move (a tenth of the frame a second counts fully). */
    const N = s.times.length,
      dt = s.dt || 0.25,
      w = Math.max(1, Math.round(1 / dt));
    const facing = [];
    for (let i = 0; i < N; i++) {
      const a = Math.max(0, i - w),
        b = Math.min(N - 1, i + w);
      const vel = b > a && s.has[a] && s.has[b] ? (s.x[b] - s.x[a]) / ((b - a) * dt) : 0;
      const turn = mean(s.turn.slice(a, b + 1).filter((x) => x != null));
      facing.push(r3(clamp(turn * 0.8 + clamp(vel / 0.15, -1, 1) * 0.5, -1, 1)));
    }
    /* A patch far smaller than the clip's usual person (a hand in a whip pan, a speck the AI saw) is nobody. */
    const usual = median(s.area.filter((a) => a > 0));
    const has = s.has.map((h, i) => (h && s.area[i] >= usual * 0.25 ? 1 : 0));
    const m = Object.assign({}, s, { facing, has });
    try {
      Object.defineProperty(el, key, { value: m, enumerable: false, configurable: true });
    } catch (e) {}
    return m;
  }
  function interp(s, arr, t) {
    if (!arr || !arr.length) return 0;
    const x = clamp((t - s.times[0]) / (s.dt || 1), 0, arr.length - 1);
    const i = Math.floor(x),
      f = x - i,
      j = Math.min(arr.length - 1, i + 1);
    return arr[i] + (arr[j] - arr[i]) * f;
  }
  function shot(d, t) {
    const s = mainOf(d);
    if (!s || !s.times.length) return null;
    if (interp(s, s.has, t) < 0.5) return null;
    return { x: r3(interp(s, s.x, t)), y: r3(interp(s, s.y, t)), size: r3(interp(s, s.size, t)), facing: r3(interp(s, s.facing, t)) };
  }

  /* ---------- the horizon's roll ---------- */
  /* Strong edges, each turned to the nearest level or upright line: a rolled camera rolls them all the same way.
     The edges are read in small squares (8 x 8 pixels) as one direction each, so the stair steps of a slanted
     line in a small picture do not count as level. Kept only when many strong edges agree. */
  function roll(gray, w, h) {
    const BINS = 41; /* -20..20 degrees */
    const hist = new Float32Array(BINS);
    const B = 8,
      bw = Math.ceil(w / B),
      bh = Math.ceil(h / B);
    const xx = new Float32Array(bw * bh),
      yy = new Float32Array(bw * bh),
      xy = new Float32Array(bw * bh);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1] - gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1];
        const gy = gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1] - gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1];
        const k = ((y / B) | 0) * bw + ((x / B) | 0);
        xx[k] += gx * gx;
        yy[k] += gy * gy;
        xy[k] += gx * gy;
      }
    let total = 0;
    for (let k = 0; k < bw * bh; k++) {
      const e = xx[k] + yy[k];
      if (e < B * B * 0.05) continue; /* a flat square: no edge */
      const coh = Math.sqrt((xx[k] - yy[k]) * (xx[k] - yy[k]) + 4 * xy[k] * xy[k]) / e; /* 1: one straight edge */
      const wgt = Math.sqrt(e) * coh * coh;
      const L = (0.5 * Math.atan2(2 * xy[k], xx[k] - yy[k]) * 180) / Math.PI + 90; /* the line runs across its gradient */
      const d = ((((L + 45) % 90) + 90) % 90) - 45; /* off the nearest level or upright, -45..45 */
      total += Math.sqrt(e);
      if (Math.abs(d) <= 20) hist[Math.round(d) + 20] += wgt;
    }
    if (total < 1e-6) return { deg: 0, conf: 0 };
    let best = 0;
    const sm = (k) => (hist[k - 1] || 0) + 2 * hist[k] + (hist[k + 1] || 0);
    for (let k = 1; k < BINS; k++) if (sm(k) > sm(best)) best = k;
    let s = 0,
      sw = 0;
    for (let k = Math.max(0, best - 2); k <= Math.min(BINS - 1, best + 2); k++) {
      s += (k - 20) * hist[k];
      sw += hist[k];
    }
    return { deg: r3(sw ? s / sw : 0), conf: r3(sw / total) };
  }
  /* The clip's roll at time t: the middle of the trusted measures within a second each way. */
  function rollAt(d, t) {
    const r = d && d.raw && d.raw.roll;
    if (!r || !d.times) return null;
    const keep = [];
    d.times.forEach((x, i) => {
      if (Math.abs(x - t) <= 1 && r[i] && r[i].conf >= 0.35) keep.push(r[i].deg);
    });
    let n = 0;
    d.times.forEach((x) => Math.abs(x - t) <= 1 && n++);
    if (!n || keep.length < Math.max(2, n * 0.5)) return null;
    return clamp(median(keep), -15, 15);
  }

  /* ---------- the virtual camera ---------- */
  /* How far each side of the crop reaches from its centre, as a share of the source (with a roll the crop's
     corners swing out, so it must sit further in). */
  function reach(z, rad, aspect) {
    const c = Math.cos(Math.abs(rad)),
      s = Math.sin(Math.abs(rad));
    return { x: (c + aspect * s) / (2 * z), y: (c + s / aspect) / (2 * z) };
  }
  function solve(want, have, o) {
    o = o || {};
    const m = o.amount == null ? 1 : clamp(o.amount, 0, 1);
    const aspect = o.aspect || 0.5625,
      rad = ((o.roll || 0) * Math.PI) / 180,
      zmax = Math.max(1, o.zmax || 2.5);
    const tx = have.x + (want.x - have.x) * m,
      ty = have.y + (want.y - have.y) * m;
    let zs = have.size > 0.005 && want.size > 0.005 ? Math.max(1, want.size / have.size) : 1;
    zs = 1 + (zs - 1) * m;
    const r1 = reach(1, rad, aspect);
    const zmin = Math.max(1, 2 * r1.x, 2 * r1.y);
    /* where the crop's centre must be for the eyes to land on (tx, ty) at zoom z */
    const centre = (z) => ({ x: have.x + (0.5 - tx) / z, y: have.y + (0.5 - ty) / z });
    const fits = (z) => {
      const c = centre(z),
        r = reach(z, rad, aspect);
      return c.x >= r.x - 1e-9 && c.x <= 1 - r.x + 1e-9 && c.y >= r.y - 1e-9 && c.y <= 1 - r.y + 1e-9;
    };
    let z = Math.min(zmax, Math.max(zmin, zs));
    while (z < zmax && !fits(z)) z = Math.min(zmax, z + 0.01);
    z = Math.max(z, zmin);
    const c = centre(z);
    return place({ z, x: c.x, y: c.y }, rad, aspect);
  }
  /* Keep a crop inside the picture (with its roll). */
  function place(f, rad, aspect) {
    const z = Math.ceil(Math.max(1, f.z) * 1000 - 1e-6) / 1000;
    /* a hair further in than needed, so rounding never shows an edge */
    const r = reach(z, rad || 0, aspect || 0.5625),
      e = rad ? 0.002 : 0;
    const fx = r.x + e >= 0.5 ? 0.5 : clamp(f.x, r.x + e, 1 - r.x - e),
      fy = r.y + e >= 0.5 ? 0.5 : clamp(f.y, r.y + e, 1 - r.y - e);
    return { z, x: r3(fx), y: r3(fy) };
  }

  /* The operator: a median over half a second takes out the AI's blinks; the camera then holds until the
     framing it wants is more than tol away, and moves there; a bell-shaped average (sigma seconds) turns each
     move into an ease in and an ease out, looking both ways in time so it never lags. breaks: indexes where a
     new shot starts (the camera jumps there, as at a cut). */
  function follow(vals, dt, o) {
    o = o || {};
    const n = vals.length;
    if (!n) return [];
    const tol = o.tol == null ? 0.03 : o.tol,
      sigma = o.sigma == null ? 0.5 : o.sigma;
    const cuts = [0].concat((o.breaks || []).filter((b) => b > 0 && b < n)).concat([n]);
    const out = new Array(n);
    for (let s = 0; s + 1 < cuts.length; s++) {
      const a = cuts[s],
        b = cuts[s + 1];
      const seg = vals.slice(a, b);
      const mw = Math.max(0, Math.round(0.4 / dt));
      const med = seg.map((_, i) => median(seg.slice(Math.max(0, i - mw), Math.min(seg.length, i + mw + 1))));
      const held = [];
      let hold = med[0];
      med.forEach((v) => {
        if (Math.abs(v - hold) > tol) hold = v;
        held.push(hold);
      });
      const R = Math.max(1, Math.round((3 * sigma) / dt)),
        k = [];
      for (let j = -R; j <= R; j++) k.push(Math.exp(-0.5 * Math.pow((j * dt) / sigma, 2)));
      for (let i = 0; i < held.length; i++) {
        let s2 = 0,
          w2 = 0;
        for (let j = -R; j <= R; j++) {
          const q = clamp(i + j, 0, held.length - 1);
          s2 += held[q] * k[j + R];
          w2 += k[j + R];
        }
        out[a + i] = s2 / w2;
      }
    }
    return out;
  }

  /* The whole move for a plan, worked out once (every tenth of a second of the output). */
  function path(p, o) {
    o = o || {};
    const A = p.insp,
      B = p.target,
      amt = p.on && p.on.framing != null ? p.on.framing : 1;
    if (!amt || !mainOf(A) || !mainOf(B)) return null;
    const aspect = B.aspect || 0.5625,
      zmax = 1 + 1.5 * amt;
    const dt = 0.1,
      n = Math.max(1, Math.ceil((p.duration || B.duration) / dt) + 1);
    const tilt = o.tilt !== false && !!o.tilt;
    const srcAt = (t) => (p.src && p.src.length ? p.src[clamp(Math.floor(t * (p.fps || 30)), 0, p.src.length - 1)] : t);
    const rows = [],
      breaks = [];
    let lastWant = null,
      lastS = null;
    const cutsB = B.cuts || [];
    for (let i = 0; i < n; i++) {
      const t = i * dt,
        ta = p.tA ? p.tA(t, p.duration) : t,
        s = srcAt(t);
      if (lastS != null && (s < lastS - 1e-6 || s - lastS > 0.35 || cutsB.some((c) => c > lastS && c <= s))) breaks.push(i);
      lastS = s;
      const a = shot(A, ta),
        b = shot(B, s);
      if (a) lastWant = a;
      /* nobody in your clip (a whip pan, an empty room): the camera eases back to the whole frame */
      const want = a || lastWant,
        have = b;
      let deg = 0;
      if (tilt) {
        const ra = rollAt(A, ta),
          rb = rollAt(B, s);
        deg = clamp(((ra || 0) - (rb || 0)) * amt, -12, 12);
      }
      if (!want || !have) {
        rows.push({ z: 1, x: 0.5, y: 0.5, deg });
        continue;
      }
      /* Lead room: when the two people face opposite ways, the inspiration's side of the frame is mirrored, so
         yours keeps its room in front too. */
      let wx = want.x;
      const opp = want.facing * have.facing < 0 ? Math.min(Math.abs(want.facing), Math.abs(have.facing)) : 0;
      wx = wx + (1 - 2 * wx) * opp;
      rows.push(Object.assign(solve({ x: wx, y: want.y, size: want.size }, have, { amount: amt, zmax, aspect, roll: deg }), { deg }));
    }
    const z = follow(
      rows.map((r) => Math.log(r.z)),
      dt,
      { tol: 0.06, sigma: 0.55, breaks }
    ).map(Math.exp);
    const x = follow(
      rows.map((r) => r.x),
      dt,
      { tol: 0.03, sigma: 0.55, breaks }
    );
    const y = follow(
      rows.map((r) => r.y),
      dt,
      { tol: 0.03, sigma: 0.55, breaks }
    );
    const deg = follow(
      rows.map((r) => r.deg),
      dt,
      { tol: 1, sigma: 0.8, breaks }
    );
    const out = { dt, z: [], x: [], y: [], roll: [] };
    for (let i = 0; i < n; i++) {
      const rad = (deg[i] * Math.PI) / 180;
      const f = place({ z: Math.max(z[i], 2 * reach(1, rad, aspect).x, 2 * reach(1, rad, aspect).y), x: x[i], y: y[i] }, rad, aspect);
      out.z.push(f.z);
      out.x.push(f.x);
      out.y.push(f.y);
      out.roll.push(r3(deg[i]));
    }
    return out;
  }
  function at(p, t) {
    const f = p && p.framing;
    if (!f || !f.z.length) return null;
    const x = clamp(t / f.dt, 0, f.z.length - 1),
      i = Math.floor(x),
      j = Math.min(f.z.length - 1, i + 1),
      u = x - i;
    const L = (a) => a[i] + (a[j] - a[i]) * u;
    return { z: r3(L(f.z)), x: r3(L(f.x)), y: r3(L(f.y)), roll: r3(L(f.roll)) };
  }
  function rect(fr, vw, vh) {
    const z = Math.max(1, fr.z || 1),
      w = vw / z,
      h = vh / z;
    return { x: clamp(fr.x * vw - w / 2, 0, vw - w), y: clamp(fr.y * vh - h / 2, 0, vh - h), w, h, roll: ((fr.roll || 0) * Math.PI) / 180 };
  }

  /* ---------- checks ---------- */
  /* Where the eyes sit across the frame and how big the head is, over time, before and after, against the
     inspiration (with the lead-room mirror the plan used left out: this is the plain position). */
  function score(p, before, after) {
    const A = p.insp,
      E = after && after.elements;
    if (!E || !mainOf(after) || !mainOf(A) || !mainOf(before)) return { feature: "el:framing", note: "needs AI cut-outs of both clips" };
    const ts = E.times;
    const src = (t) => (p.src && p.src.length ? p.src[clamp(Math.round(t * (p.fps || 30)), 0, p.src.length - 1)] : t);
    const val = (sh) => (sh ? sh.x + sh.y + Math.log(Math.max(0.01, sh.size)) * 0.3 : 0);
    const want = ts.map((t) => val(shot(A, p.tA ? p.tA(t, p.duration) : t)));
    const bt = ts.map((t) => val(shot(before, src(t))));
    const af = ts.map((t) => val(shot(after, t)));
    const gap = (x) => r3(mean(x.map((v, i) => Math.abs(v - want[i]))));
    return { feature: "el:framing", corrBefore: r3(corr(bt, want)), corrAfter: r3(corr(af, want)), gapBefore: gap(bt), gapAfter: gap(af) };
  }

  root.CurioFraming = { blobs, series, shot, roll, rollAt, solve, follow, path, at, rect, place, score };
})();
