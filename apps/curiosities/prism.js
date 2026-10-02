/* Prism: a curated film goes in like white light and comes out split into four bands, the
   curiosities it uses (and how low to how high each one went), the suites it shows (by degree: the share of each suite's lenses at each beat),
   the proximities that held (and after how many beats), and the proximity suites whose members held.
   Any row can be dropped onto a moment of your own film (a span of board panels): it becomes an
   automation in CurioAuto built from the film's own ranges, and starts playing on the board.
   A Develop card then offers three next moves. The engine is window.CurioAuto (automation.js).
   Each row offers two drops: "Copy it" (the film's own values) and "Make it an analogy" (A is to B as C is to D:
   the film's move, started from where my film is; a word moves by its place on the curiosity's scale, a
   proximity keeps its delay, a suite keeps how many of its lenses come or go). A slice of the film (a span of
   its beats) narrows what is read. "Borrow this film's emotional road" writes the film's feeling, stretched or
   squeezed onto the story's scenes, into a character's story values (story.js planRoad / applyRoad / undoRoad). */

(function () {
  const VIEW = "curiosities-prism-view-v1";
  const BANDS = [
    { id: "curiosity", label: "Curiosities", hue: 12, note: "One measurable thing each, and how far it moved." },
    { id: "suite", label: "Suites", hue: 40, note: "Groups of lenses you look through together. Each beat shows a share of a suite, from none to all of it." },
    { id: "proximity", label: "Proximities", hue: 150, note: "When X happened, Y followed within a few beats." },
    { id: "proximity suite", label: "Proximity suites", hue: 232, note: "Groups of proximities that held together." },
  ];

  /* The film and the moment are shared by every Prism on the page (the Prism tab and the
     filtered ones a workspace mounts), so "my moment" means the same panels everywhere. */
  let view = { film: "", band: "all", from: 1, to: 3 };
  try {
    view = Object.assign(view, JSON.parse(localStorage.getItem(VIEW) || "{}"));
  } catch (e) {}
  /* Every Prism on the page, by its host element. */
  const instances = new Map();
  /* The "Borrow this film's emotional road" card, shared by every Prism (it survives a workspace redraw). */
  const roadUI = { open: false, source: "", target: "", msg: "" };

  const A = () => window.CurioAuto;
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function saveView() {
    try {
      localStorage.setItem(VIEW, JSON.stringify(view));
    } catch (e) {}
  }
  function label(id) {
    const p = A() && A().param("c:" + id);
    if (p) return p.label;
    const c = (window.CURIOSITIES || (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : [])).find((x) => x.id === id);
    return c ? c.label || c.name || id : id;
  }
  function panelCount() {
    const n = Number(window.CuriosityBoard && window.CuriosityBoard.values().angleCount);
    return Math.max(1, Math.min(12, n || 4));
  }
  function moment() {
    const n = panelCount();
    const from = Math.max(0, Math.min(n - 1, (Number(view.from) || 0)));
    const to = Math.max(from, Math.min(n - 1, view.to == null ? n - 1 : Number(view.to)));
    return { from, to, n };
  }
  function span(m) {
    return m.from === m.to ? `panel ${m.from + 1}` : `panels ${m.from + 1} to ${m.to + 1}`;
  }

  /* ---------- films ---------- */
  /* Whole films first, then each film's favorite moments (starred in Curated films), then my board.
     A moment is a film of its own: just the beats it spans. */
  function films() {
    const S = window.CuriosityStudy;
    const studies = (S && S.studies()) || [];
    const out = studies.map((s) => ({ id: s.id, title: s.title, kind: s.kind, beats: s.beats || [] }));
    studies.forEach((s) =>
      ((S.moments && S.moments(s.id)) || []).forEach((m) =>
        out.push({ id: "m:" + s.id + ":" + m.id, title: "★ " + m.name + " · " + s.title, name: m.name, kind: "favorite moment", moment: true, beats: m.beats })
      )
    );
    out.push({ id: "__board", title: "My board", kind: "board", beats: null });
    return out;
  }
  function filmOptions(f) {
    const all = films();
    const o = (x) => `<option value="${esc(x.id)}" ${x.id === f.id ? "selected" : ""}>${esc(x.title)}</option>`;
    const moments = all.filter((x) => x.moment);
    return `<optgroup label="Whole films">${all.filter((x) => !x.moment && x.id !== "__board").map(o).join("")}</optgroup>
      ${moments.length ? `<optgroup label="Favorite moments">${moments.map(o).join("")}</optgroup>` : ""}
      <optgroup label="Mine">${all.filter((x) => x.id === "__board").map(o).join("")}</optgroup>`;
  }
  function film(inst) {
    const all = films();
    let f = all.find((x) => x.id === view.film) || all.find((x) => /crystal is quiet/i.test(x.title)) || all[0];
    view.film = f.id;
    if (f.id === "__board") {
      if (!inst.boardFilm) {
        const n = panelCount();
        const panels = A() ? A().resolve(n).panels : Array.from({ length: n }, () => window.CuriosityBoard.values());
        inst.boardFilm = panels.map((v, i) => ({ at: "panel " + (i + 1), values: v }));
      }
      f = Object.assign({}, f, { beats: inst.boardFilm });
    }
    /* A slice of the film: a span of its beats (view.slice, for this film only). */
    const bs = f.beats || [];
    const sl = view.slice && view.slice.film === f.id ? view.slice : null;
    const a = sl ? Math.max(0, Math.min(bs.length - 1, Number(sl.from) || 0)) : 0;
    const z = sl ? Math.max(a, Math.min(bs.length - 1, sl.to == null ? bs.length - 1 : Number(sl.to))) : bs.length - 1;
    const cut = bs.length > 0 && (a > 0 || z < bs.length - 1);
    return Object.assign({}, f, { allBeats: bs, beats: cut ? bs.slice(a, z + 1) : bs, slice: cut ? { from: a, to: z } : null });
  }

  /* ---------- reading a film ---------- */
  function same(a, b) {
    return a != null && b != null && String(a) === String(b);
  }
  function rank(id, v) {
    const d = A().domain(id);
    if (d.kind === "range") return Number(v);
    const i = d.options.indexOf(String(v));
    if (i >= 0) return i;
    return isFinite(Number(v)) ? Number(v) : -1;
  }
  function suiteSet(id) {
    return (SUITES.find((s) => s.id === id) || { set: {} }).set;
  }
  const CS = () => window.CuriositySuites;
  function suiteMembers(id) {
    return CS() ? CS().members(id) : Object.keys(suiteSet(id));
  }
  /* A suite as a proximity's cause or effect counts as present when at least half its members match. */
  function suiteHolds(id, beat) {
    return !!CS() && CS().present(id, beat.values);
  }
  /* Does a condition hold at beat i? A change compares with the beat before, the same way automation.js does. */
  function holds(c, beats, i) {
    const beat = beats[i];
    if (!beat) return false;
    if (c.suite) return suiteHolds(c.suite, beat);
    const v = beat.values[c.curiosity];
    if ("is" in c) return same(v, c.is);
    if (i === 0) return false;
    const prev = beats[i - 1].values[c.curiosity];
    if (v == null || prev == null) return false;
    if (c.change === "changes") return !same(v, prev);
    if (c.change === "rises") return rank(c.curiosity, v) > rank(c.curiosity, prev);
    if (c.change === "drops") return rank(c.curiosity, v) < rank(c.curiosity, prev);
    return false;
  }
  function measure(p, beats) {
    let n = 0;
    const at = [];
    const delays = [];
    beats.forEach((_, i) => {
      if (!holds(p.x, beats, i)) return;
      n++;
      for (let j = i; j <= i + (p.within || 0) && j < beats.length; j++) {
        if (holds(p.y, beats, j)) {
          at.push(i);
          delays.push(j - i);
          break;
        }
      }
    });
    return { n, h: at.length, at, delays };
  }
  function mostCommon(list) {
    const c = {};
    list.forEach((x) => (c[x] = (c[x] || 0) + 1));
    return Number(Object.entries(c).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]);
  }

  /* The spectrum of one film, every band computed once. */
  function spectrum(f) {
    const beats = f.beats;
    const ids = [];
    beats.forEach((b) => Object.keys(b.values || {}).forEach((k) => b.values[k] != null && b.values[k] !== "" && !ids.includes(k) && A().param("c:" + k) && ids.push(k)));
    const curiosities = ids.map((id) => {
      const vals = beats.map((b) => (b.values[id] == null || b.values[id] === "" ? null : b.values[id]));
      let lo = null;
      let hi = null;
      vals.forEach((v, i) => {
        if (v == null) return;
        if (lo == null || rank(id, v) < rank(id, vals[lo])) lo = i;
        if (hi == null || rank(id, v) > rank(id, vals[hi])) hi = i;
      });
      const changes = new Set();
      vals.forEach((v, i) => i > 0 && v != null && vals[i - 1] != null && !same(v, vals[i - 1]) && changes.add(i));
      const distinct = new Set(vals.filter((v) => v != null).map(String)).size;
      /* Words with no scale (names) have no low or high: use the first value and the first one after it that differs. */
      if (distinct > 1 && same(vals[lo], vals[hi])) {
        lo = vals.findIndex((v) => v != null);
        hi = vals.findIndex((v) => v != null && !same(v, vals[lo]));
      }
      return { id, label: label(id), vals, lo: vals[lo], hi: vals[hi], loAt: lo, hiAt: hi, moved: distinct > 1, changes };
    });
    curiosities.sort((a, b) => b.changes.size - a.changes.size || a.label.localeCompare(b.label));
    curiosities.forEach((c) => {
      c.partners = curiosities
        .filter((o) => o.id !== c.id && o.moved)
        .map((o) => ({ o, n: [...c.changes].filter((i) => o.changes.has(i)).length }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 2)
        .map((x) => x.o);
    });
    /* Suites by degree: the share at each beat. at is where at least half of it shows. Lens suites
       (no values to match) show up when the film measures any of their lenses. */
    if (CS()) CS().sync();
    const fixedSuites = CS()
      ? SUITES.filter((s) => CS().fixed(s))
          .map((s) => {
            const m = CS().across(s, beats.map((b) => b.values));
            return { s, m, at: m.shares.map((x, i) => (x >= CS().CAUSE_SHARE ? i : -1)).filter((i) => i >= 0) };
          })
          .filter((x) => x.m.peak > 0)
          .sort((a, b) => b.m.peak - a.m.peak || b.m.mean - a.m.mean)
      : [];
    const lensSuites = CS() ? SUITES.filter((s) => (s.kind || "") === "lens" && !CS().fixed(s) && CS().members(s).some((k) => ids.includes(k))).map((s) => ({ s, lens: true, at: [] })) : [];
    const suites = fixedSuites.concat(lensSuites);
    const proximities = PROXIMITIES.map((p) => Object.assign({ p }, measure(p, beats))).filter((x) => x.h > 0);
    const proxAll = Object.fromEntries(PROXIMITIES.map((p) => [p.id, measure(p, beats)]));
    const proxSuites = (A().PROXIMITY_SUITES || [])
      .map((ps) => ({ ps, members: ps.members.map((id) => ({ id, p: PROXIMITIES.find((x) => x.id === id), m: proxAll[id] })).filter((x) => x.p) }))
      .map((x) => Object.assign(x, { held: x.members.filter((m) => m.m.h > 0) }))
      .filter((x) => x.held.length);
    return { beats, curiosities, suites, proximities, proxAll, proxSuites };
  }

  /* A workspace's view of the spectrum: its own curiosities (in its order, the ones this film never
     sets kept as "not measured" rows) and the suites, proximities and proximity suites that touch them. */
  function filtered(sp, ids) {
    const has = new Set(ids);
    const involves = (c) => !!c && (has.has(c.curiosity) || (c.suite && suiteMembers(c.suite).some((k) => has.has(k))));
    const proxIn = (p) => involves(p.x) || involves(p.y);
    return Object.assign({}, sp, {
      curiosities: ids.map((id) => sp.curiosities.find((c) => c.id === id) || { id, label: label(id), absent: true }),
      suites: sp.suites.filter((x) => suiteMembers(x.s.id).some((k) => has.has(k))),
      proximities: sp.proximities.filter((x) => proxIn(x.p)),
      proxSuites: sp.proxSuites.filter((x) => x.members.some((m) => proxIn(m.p))),
    });
  }

  /* ---------- drawing ---------- */
  function cellColor(hue, t) {
    if (t == null || !isFinite(t)) return { bg: "#ece6dc", fg: "#3a3229" };
    const l = 90 - t * 52;
    return { bg: `hsl(${hue} 62% ${l}%)`, fg: l < 58 ? "white" : "#1c1712" };
  }
  function position(id, v) {
    if (v == null) return null;
    const d = A().domain(id);
    if (d.kind === "range") return d.max > d.min ? (Number(v) - d.min) / (d.max - d.min) : 0.5;
    const i = d.options.indexOf(String(v));
    return i < 0 ? null : d.options.length > 1 ? i / (d.options.length - 1) : 0.5;
  }
  function short(v) {
    const s = String(v);
    return s.length > 7 ? s.slice(0, 6) + "…" : s;
  }
  function strip(beats, cell) {
    return `<div class="pr-strip">${beats.map((b, i) => cell(b, i)).join("")}</div>`;
  }
  function litStrip(beats, lit, hue) {
    return strip(beats, (b, i) => {
      const on = lit.includes(i);
      const c = cellColor(hue, on ? 0.75 : null);
      return `<span class="pr-cell${on ? " on" : ""}" style="background:${c.bg};color:${c.fg}" title="${esc(b.at || "beat " + (i + 1))}">${on ? "●" : ""}</span>`;
    });
  }
  function dropBtn(kind, id) {
    /* Two ways onto my moment: copy the film's values, or carry over only how they move (an analogy). */
    return `<span class="pr-acts"><button type="button" class="pr-drop" data-kind="${esc(kind)}" data-id="${esc(id)}" title="Drop onto my moment: play the film's own values there">Copy it</button><button type="button" class="pr-drop pr-analog" data-kind="${esc(kind)}" data-id="${esc(id)}" data-analogy="1" title="Drop onto my moment as an analogy: the film's moves, starting from where my film is">Make it an analogy</button></span>`;
  }
  function delaysText(d) {
    const lo = Math.min(...d);
    const hi = Math.max(...d);
    const w = (n) => (n === 0 ? "the same beat" : n === 1 ? "1 beat" : n + " beats");
    return lo === hi ? `after ${w(lo)}` : `after ${lo} to ${hi} beats`;
  }

  /* The curiosities band, grouped by lens (lenses.js, CURIOSITY_LENSES): "this moment's comedy",
     "this moment's color". A curiosity sits in the first lens that names it; the rest fall into
     Camera, People, Story, and Everything else. Every lens shows, with a count of what is recorded.
     With the curiosity database loaded (data/curiosity-db.js), a lens also holds the database's sliders for it
     (rows with sliderOf), and the rest are grouped by the database's workspace for them (Music & sound,
     Editing & structure...) instead of the four plain groups. */
  const CAMERA_G = ["Camera", "Camera move"];
  const PEOPLE_G = ["People", "Body", "Motion"];
  const allCur = () => window.CURIOSITIES || (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []);
  function groupOf(id) {
    const c = allCur().find((x) => x.id === id);
    const g = (c && c.group) || "";
    if (CAMERA_G.includes(g)) return "camera";
    if (PEOPLE_G.includes(g)) return "people";
    if (g.startsWith("Story")) return "story";
    return "other";
  }
  const DB = () => (window.CuriosityDB && typeof window.CuriosityDB.get === "function" ? window.CuriosityDB : null);
  /* The curiosity a row belongs to: its lens for a slider row ("music.tempo" -> "music"), else itself. */
  function parentOf(id) {
    const c = allCur().find((x) => x.id === id);
    return (c && c.sliderOf) || id;
  }
  /* The database's workspace for a curiosity: {id, label}, or null. */
  function dbWorkspace(id) {
    const db = DB();
    if (!db) return null;
    try {
      const d = db.get("curiosity", parentOf(id)) || db.get("curiosity", id);
      if (!d || !d.workspace) return null;
      const w = ((db.data && db.data.workspaces) || []).find((x) => x.id === d.workspace);
      return { id: "ws:" + d.workspace, label: (w && w.label) || d.workspace };
    } catch (e) {
      return null;
    }
  }
  function lensGroups(list, filteredView) {
    const subs = {};
    allCur().forEach((c) => c.sliderOf && (subs[c.sliderOf] = subs[c.sliderOf] || []).push(c.id));
    const lenses = (window.CURIOSITY_LENSES || []).map((l) => {
      const ids = [l.main].concat(l.subs || []);
      /* The database's sliders for any curiosity in the lens belong to the lens too. */
      ids.slice().forEach((id) => (subs[id] || []).forEach((k) => ids.includes(k) || ids.push(k)));
      return { id: "lens:" + l.id, label: l.label, ids, rows: [] };
    });
    const rest = [
      { id: "camera", label: "Camera", rows: [] },
      { id: "people", label: "People", rows: [] },
      { id: "story", label: "Story", rows: [] },
      { id: "other", label: "Everything else", rows: [] },
    ];
    const order = ((DB() && DB().data && DB().data.workspaces) || []).map((w) => "ws:" + w.id);
    const byWs = [];
    list.forEach((c) => {
      const l = lenses.find((x) => x.ids.includes(c.id) || x.ids.includes(parentOf(c.id)));
      if (l) return l.rows.push(c);
      const w = dbWorkspace(c.id);
      if (w) {
        let g = byWs.find((x) => x.id === w.id);
        if (!g) byWs.push((g = { id: w.id, label: w.label, rows: [] }));
        return g.rows.push(c);
      }
      rest.find((x) => x.id === groupOf(c.id)).rows.push(c);
    });
    byWs.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return lenses.filter((l) => !filteredView || l.rows.length).concat(byWs, rest.filter((g) => g.rows.length));
  }

  /* The suites band shows the top SUITE_TOP by best share; "Show all N" opens the rest. */
  const SUITE_TOP = 6;
  function bandHtml(band, sp, o) {
    o = o || {};
    const b = BANDS.find((x) => x.id === band);
    const beats = sp.beats;
    let rows = [];
    let grouped = "";
    if (band === "curiosity") {
      const one = (c) => {
        if (c.absent) return row(c.label, strip(beats, () => `<span class="pr-cell"></span>`), `<span class="cap">not measured in this film yet</span>`, "");
        const cells = strip(beats, (bt, i) => {
          const v = c.vals[i];
          const col = cellColor(b.hue, position(c.id, v));
          return `<span class="pr-cell" style="background:${col.bg};color:${col.fg}" title="${esc((bt.at || "beat " + (i + 1)) + ": " + (v == null ? "not set" : v))}">${v == null ? "" : esc(short(v))}</span>`;
        });
        const range = c.moved ? `${esc(c.lo)} to ${esc(c.hi)}` : `stays ${esc(c.lo)}`;
        const with_ = c.partners.length ? `<span class="cap">moves with ${c.partners.map((o) => esc(o.label.toLowerCase())).join(", ")}</span>` : "";
        return row(c.label, cells, `<b>${range}</b>${with_}`, dropBtn("curiosity", c.id));
      };
      rows = sp.curiosities.map(one);
      const who = o.moment ? "This moment’s" : "This film’s";
      const open = o.lensOpen || {};
      grouped = lensGroups(sp.curiosities, !!o.filtered)
        .map((g) => {
          const n = g.rows.filter((c) => !c.absent).length;
          const isOpen = g.id in open ? open[g.id] : n > 0;
          const count = g.ids ? `${n} of ${g.ids.length} recorded` : `${n} recorded`;
          return `<details class="pr-lens${n ? "" : " empty"}" data-lgroup="${esc(g.id)}" ${isOpen ? "open" : ""}>
            <summary><span class="pr-lname">${esc(who)} ${esc(g.label.toLowerCase())}</span> <span class="mono">${esc(count)}</span></summary>
            ${g.rows.length ? g.rows.map(one).join("") : `<p class="cap">Nothing recorded through this lens yet. In Curated films, open a beat and look at it through ${esc(g.label.toLowerCase())}.</p>`}
          </details>`;
        })
        .join("");
    } else if (band === "suite") {
      rows = sp.suites.map((x) => {
        const s = x.s;
        if (x.lens) {
          /* A lens suite: its lenses side by side, how low to how high each went in this film. */
          const parts = CS()
            .members(s)
            .map((k) => {
              const c = sp.curiosities.find((y) => y.id === k);
              return `<span class="chip">${esc(label(k))}: ${c && !c.absent ? (c.moved ? `${esc(c.lo)} to ${esc(c.hi)}` : esc(c.lo)) : "—"}</span>`;
            })
            .join(" ");
          return row(s.label, `<span class="cap">a group of lenses, no values to match</span>`, `<b>${esc(s.note || "Lenses you look through together.")}</b><span class="suite-side">${parts}</span>`, dropBtn("suite", s.id));
        }
        const m = x.m;
        const cells = strip(beats, (bt, i) => {
          const sh = m.shares[i];
          const col = cellColor(b.hue, sh > 0 ? 0.15 + sh * 0.85 : null);
          return `<span class="pr-cell" style="background:${col.bg};color:${col.fg}" title="${esc((bt.at || "beat " + (i + 1)) + ": " + CS().text(m.each[i]))}">${sh > 0 ? Math.round(sh * 100) : ""}</span>`;
        });
        const bestAt = beats[m.best] ? beats[m.best].at || "beat " + (m.best + 1) : "";
        return row(
          s.label,
          cells,
          `<b>${esc(CS().text(m.each[m.best]))} at best${bestAt ? " (" + esc(bestAt) + ")" : ""}</b>${CS().bar(m.peak)}<span class="cap">${esc(CS().pct(m.mean))} on average across ${beats.length} beats</span>`,
          dropBtn("suite", s.id)
        );
      });
    } else if (band === "proximity") {
      rows = sp.proximities.map((x) => row(`When ${x.p.when}, ${x.p.then}`, litStrip(beats, x.at, b.hue), `<b>held ${x.h} of ${x.n} times</b><span class="cap">${delaysText(x.delays)}</span>`, dropBtn("proximity", x.p.id)));
    } else {
      rows = sp.proxSuites.map((x) => {
        const lit = [...new Set([].concat(...x.held.map((m) => m.m.at)))];
        const names = x.members.map((m) => `<span class="chip${m.m.h ? " lit" : ""}" style="${m.m.h ? `background:hsl(${b.hue} 55% 42%);border-color:transparent` : ""}">${esc(m.p.then)}</span>`).join(" ");
        return row(x.ps.label, litStrip(beats, lit, b.hue), `<b>${x.held.length} of ${x.members.length} held, ${x.held.reduce((n, m) => n + m.m.h, 0)} times</b><span>${names}</span>`, dropBtn("proximity suite", x.ps.id));
      });
    }
    const total = rows.length;
    let more = "";
    if (band === "suite" && total > SUITE_TOP) {
      if (!o.allSuites) rows = rows.slice(0, SUITE_TOP);
      more = `<p class="pr-more"><button type="button" data-pr="suites-all" aria-expanded="${o.allSuites ? "true" : "false"}">${o.allSuites ? `Show the top ${SUITE_TOP} only` : `Show all ${total}`}</button> <span class="cap">${o.allSuites ? `All ${total} suites, the ones this film shows most first.` : `The ${SUITE_TOP} this film shows most, by its best beat.`}</span></p>`;
    }
    return `<section class="pr-band" style="--hue:${b.hue}">
      <h3><span class="pr-swatch"></span>${esc(b.label)} <span class="mono">${total}</span></h3>
      <p class="cap">${esc(b.note)}</p>
      ${grouped || (rows.length ? rows.join("") : `<p class="cap">This film has none in this band.</p>`)}
      ${more}
    </section>`;
  }
  function row(name, cells, info, btn) {
    return `<div class="pr-row"><div class="pr-name">${esc(name)}</div><div class="pr-scroll">${cells}</div><div class="pr-info">${info}</div><div class="pr-act">${btn}</div></div>`;
  }

  function beam() {
    const ys = [18, 40, 62, 84];
    const rays = BANDS.map((b, i) => `<path d="M118 51 L300 ${ys[i] - 6} L300 ${ys[i] + 6} Z" fill="hsl(${b.hue} 65% 52%)" opacity="0.85"/><text x="306" y="${ys[i] + 4}" font-size="11" font-family="IBM Plex Mono, monospace" fill="#1c1712">${esc(b.label)}</text>`).join("");
    return `<svg class="pr-beam" viewBox="0 0 420 100" role="img" aria-label="A film splits into curiosities, suites, proximities and proximity suites">
      <text x="0" y="40" font-size="11" font-family="IBM Plex Mono, monospace" fill="#1c1712">a film</text>
      <path d="M0 51 L104 51" stroke="#1c1712" stroke-width="5"/>
      <path d="M96 22 L136 80 L76 80 Z" fill="#fffaf2" stroke="#1c1712" stroke-width="2"/>
      ${rays}
    </svg>`;
  }

  /* One Prism, drawn into root. opts.curiosities (a list of ids) filters it to those curiosities
     and the suites, proximities and proximity suites that involve them; opts.title heads it. */
  function Prism(root, opts) {
  opts = opts || {};
  const only = Array.isArray(opts.curiosities) && opts.curiosities.length ? opts.curiosities.slice() : null;
  const mounted = !!opts.mounted;
  const inst = { root, boardFilm: null, draw, paint: (panels) => paintPanels(panels), visible };
  /* What this Prism started: keys it plays, the row it came from, and the moment. */
  let playing = null;
  let lastSig = "";
  let band = mounted ? "all" : view.band;
  let allSuites = false;
  /* Lens groups the student opened or closed by hand, by group id. */
  const lensOpen = {};
  const titleText = () => opts.title || "Cross-pollinate from a film";

  function playingHtml() {
    if (!playing) return "";
    const run = A().running();
    playing.keys = playing.keys.filter((k) => run.includes(k));
    if (!playing.keys.length) {
      playing = null;
      return "";
    }
    const m = playing.m;
    const moves = developMoves();
    return `<div class="pr-play" data-pr="play">
      <p class="pr-line"><span class="pr-dot"></span> Playing on your board in ${span(m)}: <b>${esc(playing.title)}</b></p>
      ${playing.analogy ? analogyHtml() : `<p class="cap">${esc(playing.how)}</p>`}
      <div class="bar-actions">
        ${window.CuriosityAutomate && window.CuriosityAutomate.open ? `<button type="button" data-pr="open">Open in Automate</button>` : ""}
        <button type="button" data-pr="stop">Stop</button>
      </div>
      <div class="pr-panels scroll"><div class="strip" data-pr="panels"></div></div>
      <div class="pr-develop">
        <h3>Develop</h3>
        <p class="cap">Three next moves for this idea. Each one changes what is playing now.</p>
        ${moves.map((mv, i) => `<button type="button" class="pr-move" data-move="${i}" ${mv.off ? "disabled" : ""}><b>${esc(mv.head)}</b> ${esc(mv.text)}</button>`).join("")}
        <p class="cap pr-msg">${esc(playing.msg || "")}</p>
      </div>
    </div>`;
  }

  function draw() {
    if (!A() || !window.CuriosityBoard) {
      root.innerHTML = `<p class="cap">The Prism needs the automation engine.</p>`;
      return;
    }
    css();
    const f = film(inst);
    const whole = spectrum(f);
    const sp = only ? filtered(whole, only) : whole;
    const m = moment();
    const opts = (n) => Array.from({ length: m.n }, (_, i) => `<option value="${i}" ${i === n ? "selected" : ""}>${i + 1}</option>`).join("");
    const bands = band === "all" ? BANDS.map((b) => b.id) : [band];
    const head = mounted
      ? `<h3 class="pr-title">${esc(titleText())}</h3>
         <p class="cap">Pick a curated film and a moment of your own film, then drop any row onto that moment. It plays there, built from the film's own ranges.</p>`
      : `<h2>Prism</h2>
      <div class="pr-head">
        ${beam()}
        <p class="cap">A film is white light. The Prism splits it into its colors: the curiosities it uses and how low to how high each went, the suites it shows and how much of each, the proximities that held and after how many beats, and the proximity suites whose members held. Pick a moment of your own film, then drop any color onto it. It plays there, built from the film's own ranges, and you can develop it from there.</p>
      </div>`;
    root.innerHTML = `
      ${head}
      <div class="bar-actions pr-bar">
        <label class="field">Film <select data-pr="film">${filmOptions(f)}</select></label>
        ${f.id === "__board" ? `<button type="button" data-pr="reread">Read my board again</button>` : ""}
        <span class="cap">${esc(f.kind || "")} · ${f.allBeats.length} beats</span>
      </div>
      ${f.allBeats.length > 1 ? `<div class="bar-actions pr-bar">
        <span class="mono">Slice of the film: beats</span> <select data-pr="sfrom" class="pr-n" aria-label="First beat of the slice">${beatOpts(f, f.slice ? f.slice.from : 0)}</select>
        <span class="mono">to</span> <select data-pr="sto" class="pr-n" aria-label="Last beat of the slice">${beatOpts(f, f.slice ? f.slice.to : f.allBeats.length - 1)}</select>
        <span class="cap">${f.slice ? `${sp.beats.length} of ${f.allBeats.length} beats` : "the whole film"}</span>
      </div>` : ""}
      <div class="bar-actions pr-bar">
        <span class="mono">My moment: from panel</span> <select data-pr="from" class="pr-n">${opts(m.from)}</select>
        <span class="mono">to</span> <select data-pr="to" class="pr-n">${opts(m.to)}</select>
        <span class="cap">of ${m.n} panels on the board</span>
      </div>
      ${roadOn() ? roadHtml(f, sp) : ""}
      ${playingHtml()}
      <nav class="subtabs pr-filter">
        <button type="button" data-band="all" class="${band === "all" ? "on" : ""}">All four</button>
        ${BANDS.map((b) => `<button type="button" data-band="${esc(b.id)}" class="${band === b.id ? "on" : ""}" style="--hue:${b.hue}"><span class="pr-swatch"></span>${esc(b.label)}</button>`).join("")}
      </nav>
      ${sp.beats.length ? bands.map((b) => bandHtml(b, sp, { allSuites, lensOpen, moment: !!f.moment, filtered: !!only })).join("") : `<p class="cap">This film has no beats yet. Trace some in Study.</p>`}
    `;
    root.querySelector('[data-pr="film"]').addEventListener("change", (e) => {
      view.film = e.target.value;
      view.slice = null;
      inst.boardFilm = null;
      saveView();
      draw();
    });
    const rr = root.querySelector('[data-pr="reread"]');
    if (rr) rr.addEventListener("click", () => ((inst.boardFilm = null), draw()));
    root.querySelector('[data-pr="from"]').addEventListener("change", (e) => {
      view.from = Number(e.target.value);
      if (view.to < view.from) view.to = view.from;
      saveView();
      replay();
    });
    root.querySelector('[data-pr="to"]').addEventListener("change", (e) => {
      view.to = Number(e.target.value);
      if (view.from > view.to) view.from = view.to;
      saveView();
      replay();
    });
    root.querySelectorAll("[data-band]").forEach((b) => b.addEventListener("click", () => {
      band = b.dataset.band;
      if (!mounted) (view.band = band), saveView();
      draw();
    }));
    root.querySelectorAll(".pr-drop").forEach((b) => b.addEventListener("click", () => drop(b.dataset.kind, b.dataset.id, sp, b.dataset.analogy ? {} : null)));
    const sliceSel = (which) => (e) => {
      const cur = f.slice || { from: 0, to: f.allBeats.length - 1 };
      const next = Object.assign({}, cur, { [which]: Number(e.target.value) });
      if (which === "from" && next.to < next.from) next.to = next.from;
      if (which === "to" && next.from > next.to) next.from = next.to;
      view.slice = { film: f.id, from: next.from, to: next.to };
      saveView();
      draw();
    };
    const sf = root.querySelector('[data-pr="sfrom"]');
    if (sf) sf.addEventListener("change", sliceSel("from"));
    const sto = root.querySelector('[data-pr="sto"]');
    if (sto) sto.addEventListener("change", sliceSel("to"));
    const ms = root.querySelector('[data-pr="mystart"]');
    if (ms) ms.addEventListener("change", (e) => drop(playing.kind, playing.id, playing.sp, { start: e.target.value }));
    wireRoad(f, sp);
    root.querySelectorAll("[data-lgroup]").forEach((d) => d.addEventListener("toggle", () => (lensOpen[d.dataset.lgroup] = d.open)));
    const sa = root.querySelector('[data-pr="suites-all"]');
    if (sa) sa.addEventListener("click", () => ((allSuites = !allSuites), draw()));
    const st = root.querySelector('[data-pr="stop"]');
    if (st) st.addEventListener("click", stopAll);
    const op = root.querySelector('[data-pr="open"]');
    if (op) op.addEventListener("click", () => window.CuriosityAutomate.open(playing.keys[0]));
    root.querySelectorAll(".pr-move").forEach((b) => b.addEventListener("click", () => {
      const mv = developMoves()[Number(b.dataset.move)];
      if (!mv || mv.off) return;
      mv.run();
      playing.msg = "Done: " + mv.head.replace(/:$/, "") + ".";
      draw();
    }));
    lastSig = "";
    paintPanels();
  }

  /* When the moment changes, the playing patches move with it. */
  function replay() {
    /* An analogy starts from where my film is, so a new moment means a new start: work it out again. */
    if (playing && playing.analogy && playing.keys.length === 1) return drop(playing.kind, playing.id, playing.sp, { start: playing.analogy.start });
    if (playing) {
      const m = moment();
      playing.m = m;
      playing.keys.forEach((k) => A().set(k, { where: { from: m.from, to: m.to } }));
    }
    draw();
  }
  function stopAll() {
    if (playing) playing.keys.forEach((k) => A().stop(k));
    playing = null;
    draw();
  }

  /* ---------- dropping a color onto my moment ---------- */
  function onLane(key, target, changes) {
    if (!A().lanes(key).some((l) => l.target === target)) A().addLane(key, target);
    const l = A().lanes(key).find((x) => x.target === target);
    if (l) A().setLane(key, l.id, Object.assign({ on: true }, changes));
  }
  function laneOff(key, keep) {
    A().lanes(key).forEach((l) => l.on && !keep.includes(l.target) && A().setLane(key, l.id, { on: false }));
  }
  function delayLanes(key, m, beats, name) {
    const lanes = [];
    if (m.n > 0) {
      const share = Math.round((m.h / m.n) * 100) / 100;
      onLane(key, "chance" + name, { from: share, to: share, mod: "follow" });
      lanes.push("chance" + name);
    }
    if (m.h > 0) {
      onLane(key, "delay" + name, { from: Math.min(...m.delays), to: Math.max(...m.delays), mod: "lfo", shape: "triangle", rate: 0.5 });
      lanes.push("delay" + name);
    }
    return lanes;
  }

  function apply(kind, id, sp, m) {
    const beats = sp.beats;
    const where = { from: m.from, to: m.to };
    if (kind === "curiosity") {
      const c = sp.curiosities.find((x) => x.id === id);
      const key = "c:" + id;
      A().set(key, { a: c.lo, b: c.hi, mod: "lfo", shape: "triangle", rate: 0.5, depth: 1, curve: "linear", across: c.moved ? 1 : 0, where });
      const targets = c.partners.map((o) => "c:" + o.id);
      laneOff(key, targets);
      c.partners.forEach((o) => {
        let from = o.vals[c.loAt];
        let to = o.vals[c.hiAt];
        if (from == null || to == null || same(from, to)) (from = o.lo), (to = o.hi);
        onLane(key, "c:" + o.id, { from, to, mod: "follow", curve: "linear" });
      });
      const how = c.moved ? `${c.label} goes from ${c.lo} to ${c.hi} and back, sweeping across the moment` : `${c.label} holds at ${c.lo}`;
      return { key, title: c.label, how: how + (c.partners.length ? `, with ${c.partners.map((o) => o.label.toLowerCase()).join(" and ")} moving along as they did in the film.` : ".") };
    }
    if (kind === "suite") {
      const x = sp.suites.find((s) => s.s.id === id);
      const key = "s:" + id;
      const set = suiteSet(id);
      if (x.lens) {
        /* A lens suite: each lens grades from how low to how high it went in this film. */
        const ms = suiteMembers(id).map((k) => sp.curiosities.find((c) => c.id === k)).filter((c) => c && !c.absent && A().param("c:" + c.id));
        A().set(key, { a: "", b: id, mod: "lfo", shape: "triangle", rate: 0.5, depth: 1, across: 1, where });
        laneOff(key, ms.map((c) => "c:" + c.id));
        ms.forEach((c) => onLane(key, "c:" + c.id, { from: c.lo, to: c.hi, mod: "follow" }));
        return { key, title: x.s.label, how: `${ms.length} lenses move together from how low to how high each went in the film.` };
      }
      A().set(key, { a: "", b: id, mod: "lfo", shape: "triangle", rate: 0.5, depth: 1, across: x.at.length < beats.length ? 1 : 0, where });
      const targets = Object.keys(set).filter((k) => A().param("c:" + k)).map((k) => "c:" + k);
      laneOff(key, targets);
      const first = x.at.length ? x.at[0] : Math.max(0, x.m.best);
      Object.keys(set).forEach((k) => {
        if (!A().param("c:" + k)) return;
        const before = beats.slice(0, first).reverse().map((b) => b.values[k]).find((v) => v != null && !same(v, set[k]));
        const other = before != null ? before : beats.map((b) => b.values[k]).find((v) => v != null && !same(v, set[k]));
        onLane(key, "c:" + k, Object.assign({ to: set[k], mod: "follow" }, other != null ? { from: other } : {}));
      });
      return { key, title: x.s.label, how: `The suite comes and goes, and its ${Object.keys(set).length} lenses grade toward it the way the film led into it (the film showed ${CS().pct(x.m.peak)} of it at best).` };
    }
    if (kind === "proximity") {
      const x = sp.proxAll[id];
      const p = PROXIMITIES.find((q) => q.id === id);
      const key = "p:" + id;
      const within = x.delays.length ? mostCommon(x.delays) : p.within || 0;
      A().set(key, { a: { on: false, within }, b: { on: true, within }, mod: "manual", manual: 1, depth: 1, across: 0, where });
      const lanes = delayLanes(key, x, beats, "");
      const cause = Math.round((x.n / beats.length) * 100) / 100;
      onLane(key, "cause", { from: cause, to: cause, mod: "follow" });
      laneOff(key, lanes.concat("cause"));
      return { key, title: `When ${p.when}, ${p.then}`, how: `The cause is set in about ${Math.round(cause * 100)}% of panels, the effect follows ${Math.round((x.h / Math.max(1, x.n)) * 100)}% of the time, ${delaysText(x.delays.length ? x.delays : [within])}, as in the film.` };
    }
    const x = sp.proxSuites.find((q) => q.ps.id === id);
    const key = "ps:" + id;
    A().set(key, { a: { on: false, within: 0 }, b: { on: true, within: 0 }, mod: "manual", manual: 1, depth: 1, across: 0, where });
    let lanes = [];
    x.members.forEach((mm) => (lanes = lanes.concat(delayLanes(key, mm.m, beats, ":" + mm.id))));
    laneOff(key, lanes);
    return { key, title: x.ps.label, how: `${x.held.length} of its ${x.members.length} proximities play with the delays and how often they held in the film.` };
  }


  /* ---------- an analogy: A is to B as C is to D ----------
     Instead of copying the film's values, carry over how they move: if the film goes two steps up from where
     it starts, my moment goes two steps up from where my film is. Scale words map by their place on the
     curiosity's scale (CurioAuto.domain); numbers by how far they move. A proximity keeps its delay
     (the effect follows its own cause after as many beats); a suite keeps how many of its lenses come or go. */
  function analogyHtml() {
    const an = playing.analogy;
    let pick = "";
    if (an.choices && an.choices.length) {
      pick = `<div class="bar-actions pr-bar"><label class="mono pr-start">Your moment starts at <select data-pr="mystart">${an.choices
        .map((v) => `<option value="${esc(v)}" ${same(v, an.used) ? "selected" : ""}>${esc(v)}</option>`)
        .join("")}</select></label><span class="cap">Change it to try the same move from somewhere else.</span></div>`;
    }
    return `<p class="pr-analogy"><span class="mono">Analogy</span> ${esc(playing.how)}</p>${playing.also ? `<p class="cap">${esc(playing.also)}</p>` : ""}${pick}`;
  }
  /* Every panel of my film as it plays now (controls, the applied strand, running automation). */
  function myPanels(n) {
    const B = window.CuriosityBoard;
    const base = B.values();
    const ap = B.applied ? B.applied() : null;
    const now = performance.now();
    return Array.from({ length: n }, (_, i) => {
      const b = Object.assign({}, base);
      if (ap)
        Object.entries(ap.values || {}).forEach(([k, vals]) => {
          const v = Array.isArray(vals) && vals.length ? vals[i % vals.length] : null;
          if (v != null && v !== "") b[k] = v;
        });
      return A().resolve(n, now, b).panels[i];
    });
  }
  const has = (v) => v != null && v !== "";
  /* How a curiosity moves through some film values: where it starts, the farthest it gets from there, and how many steps. */
  function relation(id, vals, at0, at1) {
    const d = A().domain(id);
    const lo = at0 == null ? 0 : at0;
    const hi = at1 == null ? vals.length - 1 : at1;
    const set = [];
    vals.forEach((v, i) => i >= lo && i <= hi && has(v) && set.push({ v, i }));
    if (!set.length) return null;
    const s = set[0];
    const r0 = rank(id, s.v);
    if (d.kind !== "range" && d.options.indexOf(String(s.v)) < 0) return { start: s.v, end: s.v, steps: 0, noScale: true, startAt: s.i, endAt: s.i };
    let far = s;
    let fd = 0;
    set.forEach((x) => {
      if (d.kind !== "range" && d.options.indexOf(String(x.v)) < 0) return;
      const dd = Math.abs(rank(id, x.v) - r0);
      if (dd > 0 && dd >= fd) (far = x), (fd = dd);
    });
    const steps = d.kind === "range" ? Math.round((Number(far.v) - Number(s.v)) * 100) / 100 : rank(id, far.v) - r0;
    return { start: s.v, end: far.v, steps, startAt: s.i, endAt: far.i };
  }
  /* The same move from another start: {to, moved, clamped}, or null when the start is not on the scale. */
  function shift(id, from, steps) {
    const d = A().domain(id);
    if (d.kind === "range") {
      const v = Number(from);
      if (!isFinite(v)) return null;
      const to = Math.max(d.min, Math.min(d.max, Math.round((v + steps) * 100) / 100));
      return { to, moved: Math.round((to - v) * 100) / 100, clamped: to !== Math.round((v + steps) * 100) / 100 };
    }
    const i = d.options.indexOf(String(from));
    if (i < 0) return null;
    const j = Math.max(0, Math.min(d.options.length - 1, i + steps));
    return { to: d.options[j], moved: j - i, clamped: j - i !== steps };
  }
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const num = (n) => (NUM[Math.abs(n)] != null && Number.isInteger(n) ? NUM[Math.abs(n)] : String(Math.abs(n)));
  function moveWords(id, n) {
    if (A().domain(id).kind === "range") return n === 0 ? "no change" : `${n > 0 ? "up" : "down"} by ${Math.abs(n)}`;
    return n === 0 ? "no steps" : `${num(n)} step${Math.abs(n) === 1 ? "" : "s"} ${n > 0 ? "up" : "down"}`;
  }
  const beatsWord = (n, w) => (n === 0 ? `in the same ${w}` : `after ${num(n)} ${w}${n === 1 ? "" : "s"}`);
  function choicesOf(id) {
    const d = A().domain(id);
    if (d.kind !== "range") return d.options.slice();
    const out = [];
    const st = d.step || 1;
    for (let v = d.min; v <= d.max + 1e-9 && out.length < 60; v += st) out.push(Math.round(v * 100) / 100);
    return out.map(String);
  }
  /* A partner's or member's move, written as a lane from where my moment is. */
  function laneMove(key, id, rel, mine) {
    if (!rel || rel.noScale || !rel.steps || !A().param("c:" + id)) return null;
    const from = has(mine) && shift(id, mine, 0) ? mine : rel.start;
    const sh = shift(id, from, rel.steps);
    if (!sh || !sh.moved) return null;
    onLane(key, "c:" + id, { from, to: sh.to, mod: "follow", curve: "linear" });
    return `${label(id).toLowerCase()} goes from ${from} to ${sh.to}, ${moveWords(id, sh.moved)}`;
  }
  function analogy(kind, id, sp, m, pickedStart) {
    const beats = sp.beats;
    const where = { from: m.from, to: m.to };
    const sweep = m.from === m.to ? 0 : 1;
    const keyOf = { curiosity: "c:", suite: "s:", proximity: "p:", "proximity suite": "ps:" }[kind] + id;
    /* Read my film without this parameter's own automation, so the start is where my film is. */
    if (A().running().includes(keyOf)) A().stop(keyOf);
    const mine = myPanels(m.n);
    const myAt = (k) => (mine[m.from] || {})[k];
    if (kind === "curiosity") {
      const c = sp.curiosities.find((x) => x.id === id);
      const key = keyOf;
      const rel = relation(id, c.vals);
      if (!rel || rel.noScale) {
        const r = apply(kind, id, sp, m);
        return Object.assign(r, { how: `${c.label} has no scale to move along, so it is copied as it is. ${r.how}` });
      }
      const ownStart = has(pickedStart) ? pickedStart : myAt(id);
      const known = has(ownStart) && !!shift(id, ownStart, 0);
      const start = known ? (A().domain(id).kind === "range" ? Number(ownStart) : ownStart) : rel.start;
      const sh = shift(id, start, rel.steps);
      const film = rel.steps ? `The film goes from ${rel.start} to ${rel.end}, ${moveWords(id, rel.steps)}.` : `The film holds at ${rel.start}.`;
      const begin = known ? `Your moment starts at ${start}, so it` : `Your moment has no setting for this yet, so it starts where the film does, at ${start}, and`;
      const yours = !rel.steps
        ? `${begin} holds there too.`
        : !sh.moved
          ? `${begin} stays there: it is already at the ${rel.steps > 0 ? "top" : "bottom"} of the scale.`
          : `${begin} goes to ${sh.to}, ${moveWords(id, sh.moved)}${sh.clamped ? ", as far as the scale goes" : ""}.`;
      A().set(key, { a: start, b: sh.to, mod: "manual", manual: 1, depth: 1, curve: "linear", across: sweep, where });
      /* The curiosities that moved with it in the film move the same way here, over the same beats. */
      const said = [];
      const targets = [];
      c.partners.forEach((o) => {
        const t = laneMove(key, o.id, relation(o.id, o.vals, Math.min(rel.startAt, rel.endAt), Math.max(rel.startAt, rel.endAt)), myAt(o.id));
        if (t) said.push(t), targets.push("c:" + o.id);
      });
      laneOff(key, targets);
      return { key, title: c.label, how: `${film} ${yours}`, also: said.length ? `Along with it, as in the film: ${said.join("; ")}.` : "", start, choices: choicesOf(id) };
    }
    if (kind === "suite") {
      const x = sp.suites.find((q) => q.s.id === id);
      const key = keyOf;
      if (x.lens) {
        /* A lens suite: each lens makes the move it made in the film, from where my moment is. */
        const ms = suiteMembers(id).map((k) => sp.curiosities.find((q) => q.id === k)).filter((q) => q && !q.absent && A().param("c:" + q.id));
        A().set(key, { a: "", b: "", mod: "manual", manual: 1, depth: 1, across: sweep, where });
        const said = [];
        const targets = [];
        ms.forEach((q) => {
          const t = laneMove(key, q.id, relation(q.id, q.vals), myAt(q.id));
          if (t) said.push(t), targets.push("c:" + q.id);
        });
        laneOff(key, targets);
        const moved = ms.filter((q) => q.moved).length;
        return { key, title: x.s.label, how: `In the film, ${num(moved)} of its ${num(ms.length)} lenses move. Your moment moves each one as many steps as the film did, starting from where your film is.`, also: said.length ? said.join("; ") + "." : "Nothing in it moved in the film, so nothing moves here." };
      }
      const set = suiteSet(id);
      const ids = Object.keys(set).filter((k) => A().param("c:" + k));
      const total = Object.keys(set).length;
      const sh = x.m.shares;
      const s0 = sh[0] || 0;
      let far = 0;
      sh.forEach((v, i) => Math.abs(v - s0) > 0 && Math.abs(v - s0) >= Math.abs(sh[far] - s0) && (far = i));
      const a0 = Math.round(s0 * total);
      const a1 = Math.round((sh[far] || 0) * total);
      const delta = a1 - a0;
      const myOn = ids.filter((k) => same(myAt(k), set[k]));
      const b0 = Object.keys(set).filter((k) => same(myAt(k), set[k])).length;
      const b1 = Math.max(0, Math.min(total, b0 + delta));
      A().set(key, { a: "", b: "", mod: "manual", manual: 1, depth: 1, across: sweep, where });
      const targets = [];
      if (delta > 0) {
        /* Bring in as many lenses as the film did, the ones the film brought in first. */
        const broughtIn = ids.filter((k) => !same(beats[0].values[k], set[k]) && beats[far] && same(beats[far].values[k], set[k]));
        const order = broughtIn.concat(ids.filter((k) => !broughtIn.includes(k)));
        order.filter((k) => !myOn.includes(k)).slice(0, b1 - b0).forEach((k) => {
          const from = has(myAt(k)) ? myAt(k) : step(k, set[k], -1);
          onLane(key, "c:" + k, { from, to: set[k], mod: "follow" });
          targets.push("c:" + k);
        });
      } else if (delta < 0) {
        /* Let go of as many as the film did, toward where the film went. */
        myOn.slice(0, b0 - b1).forEach((k) => {
          const went = beats[far] && has(beats[far].values[k]) && !same(beats[far].values[k], set[k]) ? beats[far].values[k] : step(k, set[k], 1);
          const to = same(went, set[k]) ? step(k, set[k], -1) : went;
          onLane(key, "c:" + k, { from: set[k], to, mod: "follow" });
          targets.push("c:" + k);
        });
      }
      laneOff(key, targets);
      const of = (n) => (n === total ? `all ${num(total)} of its lenses` : `${num(n)} of its ${num(total)} lenses`);
      const chg = (n) => (n > 0 ? `${num(n)} more` : `${num(-n)} fewer`);
      const film = delta ? `The film goes from ${of(a0)} to ${of(a1)}, ${chg(delta)}.` : `The film holds at ${of(a0)}.`;
      const yours = delta ? `Your moment starts with ${b0 ? num(b0) : "none"} of them, so it goes to ${num(b1)}, ${b1 - b0 ? chg(b1 - b0) : "as far as it can"}.` : `Your moment starts with ${b0 ? num(b0) : "none"} of them, so it holds there too.`;
      return { key, title: x.s.label, how: `${film} ${yours}`, also: targets.length ? `Moving: ${targets.map((t) => label(t.slice(2)).toLowerCase()).join(", ")}.` : "" };
    }
    if (kind === "proximity") {
      const x = sp.proxAll[id];
      const p = PROXIMITIES.find((q) => q.id === id);
      const key = keyOf;
      const d = x.delays.length ? mostCommon(x.delays) : p.within || 0;
      /* How big the effect was in the film, when it is a move along a scale. */
      let size = null;
      if (p.y.curiosity && !("is" in p.y)) {
        const sizes = x.at.map((i, k) => {
          const j = i + x.delays[k];
          const a = beats[j - 1] && beats[j - 1].values[p.y.curiosity];
          const b = beats[j] && beats[j].values[p.y.curiosity];
          return has(a) && has(b) ? Math.abs(rank(p.y.curiosity, b) - rank(p.y.curiosity, a)) : null;
        }).filter((v) => v != null && v > 0);
        if (sizes.length) size = mostCommon(sizes);
      }
      A().set(key, { a: { on: false, within: d }, b: { on: true, within: d }, mod: "manual", manual: 1, depth: 1, across: 0, where });
      const lanes = [];
      onLane(key, "delay", { from: d, to: d, mod: "follow" });
      lanes.push("delay");
      const rate = x.n ? Math.round((x.h / x.n) * 100) / 100 : 1;
      onLane(key, "chance", { from: rate, to: rate, mod: "follow" });
      lanes.push("chance");
      if (size) onLane(key, "effect", { from: size, to: size, mod: "follow" }), lanes.push("effect");
      const myBeats = mine.map((v) => ({ values: v }));
      let causeAt = -1;
      for (let i = m.from; i <= m.to; i++) if (holds(p.x, myBeats, i)) {
        causeAt = i;
        break;
      }
      let yours;
      if (causeAt >= 0) {
        const j = Math.min(m.n - 1, causeAt + d);
        yours = `Your moment's cause is at panel ${causeAt + 1}, so the effect lands at panel ${j + 1}${j - causeAt === d ? `, ${d ? `${num(d)} panel${d === 1 ? "" : "s"} later` : "the same panel"}` : ", the last panel there is"}.`;
      } else {
        const cause = Math.round((x.n / Math.max(1, beats.length)) * 100) / 100;
        onLane(key, "cause", { from: cause, to: cause, mod: "follow" });
        lanes.push("cause");
        yours = `Your moment does not have the cause yet, so it is added about as often as in the film (${Math.round(cause * 100)}% of panels), and each time the effect follows ${beatsWord(d, "panel")}.`;
      }
      laneOff(key, lanes);
      const film = `In the film, ${p.then} ${beatsWord(d, "beat")} once ${p.when}${size ? `, ${num(size)} step${size === 1 ? "" : "s"} at a time` : ""}.`;
      return { key, title: `When ${p.when}, ${p.then}`, how: `${film} ${yours}`, also: rate < 1 ? `It followed ${Math.round(rate * 100)}% of the time in the film, so it does here too.` : "" };
    }
    const x = sp.proxSuites.find((q) => q.ps.id === id);
    const key = keyOf;
    A().set(key, { a: { on: false, within: 0 }, b: { on: true, within: 0 }, mod: "manual", manual: 1, depth: 1, across: 0, where });
    const lanes = [];
    const said = [];
    x.members.forEach((mm) => {
      if (!mm.m.h) return;
      const d = mostCommon(mm.m.delays);
      const rate = mm.m.n ? Math.round((mm.m.h / mm.m.n) * 100) / 100 : 1;
      onLane(key, "delay:" + mm.id, { from: d, to: d, mod: "follow" });
      onLane(key, "chance:" + mm.id, { from: rate, to: rate, mod: "follow" });
      lanes.push("delay:" + mm.id, "chance:" + mm.id);
      said.push(`${mm.p.then} ${beatsWord(d, "beat")}`);
    });
    laneOff(key, lanes);
    return { key, title: x.ps.label, how: `In the film, ${num(x.held.length)} of its ${num(x.members.length)} proximities held: ${said.join("; ")}. In your moment each effect follows its own cause after the same number of panels.` };
  }

  /* an: null copies the film's values; {start} makes an analogy (start: the value the student picked for
     where their moment begins, else it is read from the board). */
  function drop(kind, id, sp, an) {
    if (playing) playing.keys.forEach((k) => A().stop(k));
    const m = moment();
    const r = an ? analogy(kind, id, sp, m, an.start) : apply(kind, id, sp, m);
    A().start(r.key);
    playing = { kind, id, keys: [r.key], title: r.title, how: r.how, also: r.also || "", m, sp, msg: "", analogy: an ? { start: an.start, used: r.start, choices: r.choices || null } : null };
    draw();
    const el = root.querySelector('[data-pr="play"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------- develop: three next moves ---------- */
  function step(id, v, dir) {
    const d = A().domain(id);
    if (d.kind === "range") return Math.max(d.min, Math.min(d.max, Number(v) + dir * (d.step || 1)));
    const i = d.options.indexOf(String(v));
    return d.options[Math.max(0, Math.min(d.options.length - 1, (i < 0 ? 0 : i) + dir))];
  }
  function answer(sp) {
    const used = playing.keys;
    const held = sp.proximities.filter((x) => !used.includes("p:" + x.p.id));
    const set = playing.kind === "suite" ? Object.keys(suiteSet(playing.id)) : [];
    const prox = playing.kind === "proximity" ? PROXIMITIES.find((q) => q.id === playing.id) : null;
    const linked = held.find((x) => {
      const cx = x.p.x;
      if (playing.kind === "curiosity") return cx.curiosity === playing.id;
      if (playing.kind === "suite") return cx.suite === playing.id || set.includes(cx.curiosity);
      if (prox) return (prox.y.curiosity && cx.curiosity === prox.y.curiosity) || (prox.y.suite && cx.suite === prox.y.suite);
      return !((A().PROXIMITY_SUITES.find((q) => q.id === playing.id) || { members: [] }).members.includes(x.p.id));
    });
    return linked || held[0] || null;
  }
  function developMoves() {
    if (!playing) return [];
    const sp = playing.sp;
    const key = playing.keys[0];
    const p = A().patch(key);
    const moves = [];
    const ans = answer(sp);
    const ansMove = ans
      ? {
          head: "Answer it:",
          text: `add "when ${ans.p.when}, ${ans.p.then}", a proximity this film uses (${delaysText(ans.delays)}).`,
          run() {
            const r = apply("proximity", ans.p.id, sp, playing.m);
            A().start(r.key);
            playing.keys.push(r.key);
          },
        }
      : null;
    if (playing.kind === "curiosity") {
      const id = playing.id;
      const a2 = step(id, p.a, rank(id, p.a) <= rank(id, p.b) ? -1 : 1);
      const b2 = step(id, p.b, rank(id, p.b) >= rank(id, p.a) ? 1 : -1);
      const wider = !same(a2, p.a) || !same(b2, p.b);
      moves.push({ head: "Push it further:", text: wider ? `widen the range to ${a2} to ${b2}.` : "it already spans the whole scale.", off: !wider, run: () => A().set(key, { a: a2, b: b2 }) });
      const facet = (A().FACETS[id] || []).find((f) => A().param("c:" + f) && !A().lanes(key).some((l) => l.target === "c:" + f && l.on));
      if (ansMove) moves.push(ansMove);
      else if (facet) {
        const fc = sp.curiosities.find((c) => c.id === facet);
        const d = A().domain(facet);
        const from = fc && fc.moved ? fc.lo : d.kind === "range" ? d.min : d.options[0];
        const to = fc && fc.moved ? fc.hi : d.kind === "range" ? d.max : d.options[d.options.length - 1];
        moves.push({ head: "Give it another side:", text: `grade ${label(facet).toLowerCase()} from ${from} to ${to} along with it.`, run: () => onLane(key, "c:" + facet, { from, to, mod: "follow" }) });
      }
      moves.push({
        head: "Turn it around:",
        text: `swap from and to, so it starts at ${p.b} and moves to ${p.a}.`,
        run() {
          A().set(key, { a: p.b, b: p.a });
          A().lanes(key).filter((l) => l.on && l.target.startsWith("c:")).forEach((l) => A().setLane(key, l.id, { from: l.to, to: l.from }));
        },
      });
      return moves;
    }
    if (playing.kind === "suite") {
      const on = p.mod === "manual";
      moves.push({ head: "Push it further:", text: on ? "it already holds in every panel of the moment." : "hold it in every panel of the moment instead of coming and going.", off: on, run: () => A().set(key, { mod: "manual", manual: 1 }) });
    } else {
      const lanes = A().lanes(key).filter((l) => l.on && /^delay|^chance/.test(l.target));
      const full = lanes.every((l) => (l.target.startsWith("chance") ? Number(l.from) >= 1 && Number(l.to) >= 1 : false));
      moves.push({
        head: "Push it further:",
        text: "make the effect follow every time, and let the delay stretch one beat longer.",
        off: full && !lanes.some((l) => l.target.startsWith("delay")),
        run: () => lanes.forEach((l) => A().setLane(key, l.id, l.target.startsWith("chance") ? { from: 1, to: 1 } : { to: Number(l.to) + 1 })),
      });
    }
    if (ansMove) moves.push(ansMove);
    else {
      const other = sp.suites.find((x) => !playing.keys.includes("s:" + x.s.id));
      if (other)
        moves.push({
          head: "Answer it:",
          text: `add the suite ${other.s.label}, which this film shows too.`,
          run() {
            const r = apply("suite", other.s.id, sp, playing.m);
            A().start(r.key);
            playing.keys.push(r.key);
          },
        });
    }
    if (playing.kind === "suite")
      moves.push({
        head: "Turn it around:",
        text: "swap from and to, so the suite plays where it was absent and its curiosities grade away from it.",
        run() {
          A().set(key, { a: p.b, b: p.a });
          A().lanes(key).filter((l) => l.on && l.target.startsWith("c:")).forEach((l) => A().setLane(key, l.id, { from: l.to, to: l.from }));
        },
      });
    else
      moves.push({
        head: "Turn it around:",
        text: "swap the delay's from and to, so the effect starts late and comes sooner as it goes.",
        run: () => A().lanes(key).filter((l) => l.on && l.target.startsWith("delay")).forEach((l) => A().setLane(key, l.id, { from: l.to, to: l.from })),
      });
    return moves.slice(0, 3);
  }


  /* ---------- borrow an emotional road (story.js) ----------
     Take the film's feeling over its beats (the film overall, or one character's beats where the film records
     who holds the screen), stretch or squeeze it onto my story's scenes, preview it against what is there now,
     then write it into a character's story values or the film's own row. One undo. */
  const ROAD_IDS = ["emotion", "emotionIntensity", "emoRoadCharacter", "emoRoadFilm"];
  const ST = () => (window.CuriosityStory && typeof window.CuriosityStory.planRoad === "function" ? window.CuriosityStory : null);
  function roadOn() {
    return !!ST() && (!only || only.some((k) => ROAD_IDS.includes(k)));
  }
  function beatOpts(f, sel) {
    return f.allBeats.map((b, i) => `<option value="${i}" ${i === sel ? "selected" : ""}>${i + 1}${b.at ? " · " + esc(String(b.at).slice(0, 10)) : ""}</option>`).join("");
  }
  function roadState(f, sp) {
    const st = ST();
    const sources = st.roadSources(sp.beats);
    if (!sources.includes(roadUI.source)) roadUI.source = st.FILM;
    const targets = st.withFilm();
    if (!targets.includes(roadUI.target)) roadUI.target = roadUI.source === st.FILM ? st.FILM : targets[0];
    const n = st.scenes().length;
    const plan = st.planRoad(sp.beats, roadUI.source, n, roadUI.target);
    const now = st.get(roadUI.target).map((v) => ({ values: v, feel: st.feelOf(v) }));
    const used = sp.beats.filter((b) => b && b.values && (roadUI.source === st.FILM || String(b.values.timePerCharacter) === roadUI.source) && st.feelOf(b.values) != null).length;
    return { st, sources, targets, n, plan, now, used };
  }
  function roadChart(r) {
    const W = Math.max(280, Math.min(640, (root.clientWidth || 640) - 30));
    const H = 170;
    const L = 58;
    const R = 12;
    const T = 12;
    const B = 26;
    const x = (i) => L + (r.n > 1 ? (i * (W - L - R)) / (r.n - 1) : (W - L - R) / 2);
    const y = (v) => T + ((5 - v) / 10) * (H - T - B);
    let g = "";
    [5, 0, -5].forEach((v) => (g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="pr-road-grid"/>`));
    g += `<text x="${L - 6}" y="${y(5)}" dy="0.35em" text-anchor="end" class="pr-road-t">happier</text><text x="${L - 6}" y="${y(0)}" dy="0.35em" text-anchor="end" class="pr-road-t">even</text><text x="${L - 6}" y="${y(-5)}" dy="0.35em" text-anchor="end" class="pr-road-t">sadder</text>`;
    const every = Math.max(1, Math.ceil(r.n / 12));
    for (let i = 0; i < r.n; i++) if (i % every === 0 || i === r.n - 1) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="pr-road-t">${i + 1}</text>`;
    const line = (pts, cls) => {
      let d = "";
      let pen = false;
      pts.forEach((p, i) => {
        if (p.feel == null) return (pen = false);
        d += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(p.feel).toFixed(1)} `;
        pen = true;
      });
      const dots = pts.map((p, i) => (p.feel == null ? "" : `<circle cx="${x(i).toFixed(1)}" cy="${y(p.feel).toFixed(1)}" r="${cls === "new" ? 4 : 3}" class="pr-road-${cls}"><title>Scene ${i + 1}: ${esc(p.values.emotion || "")} ${p.feel}</title></circle>`)).join("");
      return `<path d="${d}" class="pr-road-${cls}" fill="none"/>${dots}`;
    };
    g += line(r.now, "old") + line(r.plan, "new");
    return `<svg class="pr-road-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="The borrowed feeling by scene, against what ${esc(r.st.isFilm(roadUI.target) ? "the film's row" : roadUI.target)} has now">${g}</svg>`;
  }
  function roadHtml(f, sp) {
    const r = roadState(f, sp);
    const name = (s) => (r.st.isFilm(s) ? "The film overall" : s);
    const last = r.st.lastRoad();
    const fit = r.used === r.n ? "one beat per scene" : r.used > r.n ? `squeezed: ${r.used} beats into ${r.n} scenes` : `stretched: ${r.used} beat${r.used === 1 ? "" : "s"} over ${r.n} scenes`;
    const rows = r.plan
      .map((p, i) => {
        const was = r.now[i].values.emotion;
        const v = p.values;
        if (!v.emotion && !has(v.emotionIntensity)) return `<li><b>Scene ${i + 1}</b> <span class="cap">nothing to borrow</span></li>`;
        return `<li><b>Scene ${i + 1}</b> ${esc(v.emotion || "")}${has(v.emotionIntensity) ? `, strength ${esc(v.emotionIntensity)}` : ""}${v.emoRoadCharacter || v.emoRoadFilm ? ` · ${esc(v.emoRoadCharacter || v.emoRoadFilm)}` : ""}${was && !same(was, v.emotion) ? ` <span class="cap">(now ${esc(was)})</span>` : ""}</li>`;
      })
      .join("");
    return `<details class="pr-road" data-pr="road" ${roadUI.open ? "open" : ""}>
      <summary><span class="pr-lname">Borrow this film's emotional road</span> <span class="cap">its feeling over its beats, onto your story's ${r.n} scenes</span></summary>
      ${r.used ? `<div class="bar-actions pr-bar">
        <label class="field">Take the feeling of <select data-pr="road-src">${r.sources.map((s) => `<option value="${esc(s)}" ${s === roadUI.source ? "selected" : ""}>${esc(name(s))}</option>`).join("")}</select></label>
        <label class="field">Write it into <select data-pr="road-to">${r.targets.map((s) => `<option value="${esc(s)}" ${s === roadUI.target ? "selected" : ""}>${esc(r.st.isFilm(s) ? "The film (its own row)" : s)}</option>`).join("")}</select></label>
      </div>
      <p class="cap">${esc(name(roadUI.source))}: ${r.used} beat${r.used === 1 ? "" : "s"} with a feeling${f.slice ? ` in beats ${f.slice.from + 1} to ${f.slice.to + 1}` : ""}, ${esc(fit)}. ${r.sources.length > 1 ? "A character's road is the beats where they hold the screen." : "This film does not record whose beat is whose, so only the film overall can be borrowed."}</p>
      <div class="pr-road-plot">${roadChart(r)}</div>
      <p class="pr-road-key"><span class="pr-road-sw new"></span> borrowed <span class="pr-road-sw old"></span> ${esc(r.st.isFilm(roadUI.target) ? "the film's row" : roadUI.target)} now</p>
      <ol class="pr-road-list">${rows}</ol>
      <div class="bar-actions">
        <button type="button" data-pr="road-write">Write it in</button>
        <button type="button" data-pr="road-undo" ${last ? "" : "disabled"}>${last ? `Undo (${esc(last.label || "last road")})` : "Undo"}</button>
      </div>` : `<p class="cap">This ${f.slice ? "slice of the film" : "film"} records no feeling on any beat yet. In Curated films, set the emotion of a few beats, then come back.</p>`}
      <p class="cap pr-msg" role="status">${esc(roadUI.msg || "")}</p>
    </details>`;
  }
  function wireRoad(f, sp) {
    const box = root.querySelector('[data-pr="road"]');
    if (!box) return;
    box.addEventListener("toggle", () => (roadUI.open = box.open));
    const src = box.querySelector('[data-pr="road-src"]');
    if (src)
      src.addEventListener("change", (e) => {
        roadUI.source = e.target.value;
        const st = ST();
        if (st.isFilm(roadUI.source)) roadUI.target = st.FILM;
        else if (st.withFilm().includes(roadUI.source)) roadUI.target = roadUI.source;
        else if (st.isFilm(roadUI.target)) roadUI.target = st.characters()[0];
        roadUI.msg = "";
        draw();
      });
    const to = box.querySelector('[data-pr="road-to"]');
    if (to) to.addEventListener("change", (e) => ((roadUI.target = e.target.value), (roadUI.msg = ""), draw()));
    const after = () => {
      /* A story workspace draws its roadmap from the story store: open it again so it shows the new road. */
      const W = window.CuriosityWorkspaces;
      const cur = W && W.current ? W.current() : null;
      const story = cur && W.list ? (W.list().find((w) => w.id === cur) || {}).scope === "story" : false;
      if (story && mounted) {
        W.open(cur);
        const el = document.querySelector('.prism-view [data-pr="road"]');
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
      } else draw();
    };
    const wr = box.querySelector('[data-pr="road-write"]');
    if (wr)
      wr.addEventListener("click", () => {
        const r = roadState(f, sp);
        const who = r.st.isFilm(roadUI.source) ? "the film overall" : roadUI.source;
        const into = r.st.isFilm(roadUI.target) ? "the film's own row" : roadUI.target;
        const n = r.st.applyRoad(roadUI.target, r.plan, `${who} into ${into}`);
        roadUI.msg = n ? `Written: the road of ${who} in ${f.title} is now ${into}'s road across ${r.n} scenes. Undo puts back what was there.` : "Nothing to write.";
        after();
      });
    const un = box.querySelector('[data-pr="road-undo"]');
    if (un)
      un.addEventListener("click", () => {
        roadUI.msg = ST().undoRoad() ? "Undone: the story values are back as they were." : "";
        after();
      });
  }

  /* ---------- the board, live ---------- */
  function visible() {
    if (!root.isConnected || root.classList.contains("hidden")) return false;
    return root.checkVisibility ? root.checkVisibility() : root.getClientRects().length > 0;
  }
  function paintPanels(panels) {
    const el = root.querySelector('[data-pr="panels"]');
    const B = window.CuriosityBoard;
    if (!el || !playing || !B || !B.panel) return;
    const n = playing.m.n;
    if (!panels || panels.length !== n) panels = A().resolve(n).panels;
    const sig = JSON.stringify(panels);
    if (sig === lastSig) return;
    lastSig = sig;
    const sc = B.scene();
    try {
      el.innerHTML = panels.map((v, i) => `<div class="pr-pan${i >= playing.m.from && i <= playing.m.to ? " in" : ""}">${B.panel(sc.lines[i % sc.lines.length], i, panels.length, v)}</div>`).join("");
    } catch (e) {
      el.innerHTML = `<p class="cap">The board could not draw.</p>`;
    }
  }
  return inst;
  }

  /* While a Prism plays, its preview panels follow the automation, a few times a second. */
  let lastPaint = 0;
  function hook() {
    if (!A()) return;
    A().on((type, data) => {
      if (type !== "tick") return;
      const now = performance.now();
      if (now - lastPaint < 200) return;
      lastPaint = now;
      instances.forEach((inst) => inst.visible() && inst.paint(data.panels));
    });
  }

  function css() {
    if (document.getElementById("prism-style")) return;
    const st = document.createElement("style");
    st.id = "prism-style";
    st.textContent = `
      .prism-view, .prism-view * { box-sizing: border-box; }
      .prism-view { max-width: 100%; overflow-wrap: anywhere; }
      .prism-view .pr-head { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: 14px; align-items: center; }
      .prism-view .pr-beam { width: 100%; height: auto; display: block; }
      .prism-view .pr-bar { margin: 10px 0; }
      .prism-view .pr-bar select { max-width: 100%; font-family: var(--mono); }
      .prism-view .pr-bar select.pr-n { width: auto; min-width: 56px; flex: 0 0 auto; }
      .prism-view .pr-bar label.field { min-width: 0; flex: 1 1 260px; max-width: 520px; }
      .prism-view .pr-swatch { display: inline-block; width: 12px; height: 12px; margin-right: 6px; vertical-align: -1px; background: hsl(var(--hue) 65% 50%); border: 1px solid var(--ink); }
      .prism-view .pr-filter button { white-space: nowrap; }
      .prism-view .pr-band { border-left: 8px solid hsl(var(--hue) 65% 50%); padding: 6px 0 6px 12px; margin: 14px 0; background: linear-gradient(90deg, hsl(var(--hue) 70% 50% / 0.08), transparent 40%); }
      .prism-view .pr-band h3 { font-family: var(--serif); font-weight: 500; font-size: 18px; margin: 0 0 2px; }
      .prism-view .pr-lens { border-top: 1px solid var(--line); }
      .prism-view .pr-lens > summary { cursor: pointer; padding: 6px 0; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
      .prism-view .pr-lens > summary::before { content: "▸"; font-family: var(--mono); }
      .prism-view .pr-lens[open] > summary::before { content: "▾"; }
      .prism-view .pr-lens > summary::-webkit-details-marker { display: none; }
      .prism-view .pr-lens .pr-lname { font-family: var(--serif); font-size: 16px; }
      .prism-view .pr-lens.empty .pr-lname { color: #8a8075; }
      .prism-view .pr-lens > .pr-row:last-child { border-bottom: 0; }
      .prism-view .pr-row { display: grid; grid-template-columns: minmax(120px, 190px) minmax(0, 1fr) minmax(140px, 220px) auto; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
      .prism-view .pr-name { font-weight: 500; }
      .prism-view .pr-scroll { overflow-x: auto; min-width: 0; }
      .prism-view .pr-strip { display: flex; gap: 2px; width: max-content; }
      .prism-view .pr-cell { flex: 0 0 48px; width: 48px; height: 26px; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 10px; border: 1px solid rgba(28,23,18,0.18); overflow: hidden; white-space: nowrap; }
      .prism-view .pr-info { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
      .prism-view .pr-info b { font-family: var(--mono); font-size: 12px; font-weight: 500; }
      .prism-view .pr-drop { white-space: nowrap; }
      .prism-view .pr-drop:hover, .prism-view .pr-move:hover:not([disabled]) { background: var(--ink); color: var(--paper); }
      .prism-view .pr-play { border: 3px solid var(--ink); background: white; padding: 10px 12px; margin: 12px 0; }
      .prism-view .pr-line { margin: 0 0 4px; font-size: 15px; }
      .prism-view .pr-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--saffron); animation: pr-pulse 1s infinite alternate; }
      @keyframes pr-pulse { from { opacity: 1; } to { opacity: 0.3; } }
      .prism-view .pr-panels { max-width: 100%; margin: 10px 0; }
      .prism-view .pr-panels .strip { display: flex; gap: 6px; width: max-content; overflow: visible; }
      .prism-view .pr-pan { opacity: 0.45; }
      .prism-view .pr-pan.in { opacity: 1; }
      .prism-view .pr-pan .panel { width: 180px; flex: 0 0 180px; }
      .prism-view .pr-pan.in .panel { outline: 3px solid var(--saffron); outline-offset: 2px; }
      .prism-view .pr-develop h3 { font-family: var(--serif); font-weight: 500; font-size: 17px; margin: 6px 0 2px; }
      .prism-view .pr-move { display: block; width: 100%; text-align: left; margin: 6px 0; padding: 8px 10px; font-family: var(--sans); font-size: 14px; white-space: normal; }
      .prism-view .pr-move b { font-family: var(--mono); font-weight: 500; }
      .prism-view .pr-move[disabled] { opacity: 0.5; }
      .prism-view .pr-msg { color: var(--saffron); min-height: 1em; }
      .prism-view .pr-acts { display: flex; flex-direction: column; gap: 4px; align-items: stretch; }
      .prism-view .pr-acts .pr-drop { text-align: center; }
      .prism-view .pr-analog { border-style: dashed; }
      .prism-view .pr-analogy { margin: 4px 0; font-size: 15px; line-height: 1.4; }
      .prism-view .pr-analogy .mono { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid var(--ink); padding: 1px 5px; margin-right: 4px; vertical-align: 2px; }
      .prism-view .pr-start select { font-family: var(--mono); width: auto; min-width: 120px; max-width: 100%; margin-left: 4px; }
      .prism-view .pr-road { border: 2px solid var(--ink); background: white; padding: 6px 12px; margin: 12px 0; }
      .prism-view .pr-road > summary { cursor: pointer; padding: 4px 0; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
      .prism-view .pr-road > summary::before { content: "▸"; font-family: var(--mono); }
      .prism-view .pr-road[open] > summary::before { content: "▾"; }
      .prism-view .pr-road > summary::-webkit-details-marker { display: none; }
      .prism-view .pr-road .pr-lname { font-family: var(--serif); font-size: 16px; }
      .prism-view .pr-road label.field { flex: 1 1 200px; min-width: 0; max-width: 320px; }
      .prism-view .pr-road select { max-width: 100%; font-family: var(--mono); }
      .prism-view .pr-road-plot { max-width: 100%; overflow: hidden; }
      .prism-view .pr-road-svg { display: block; max-width: 100%; height: auto; }
      .prism-view .pr-road-grid { stroke: #d9d0c2; stroke-width: 1; }
      .prism-view .pr-road-t { font-family: var(--mono); font-size: 10px; fill: #5a5047; }
      .prism-view path.pr-road-old { stroke: #8a8075; stroke-width: 2; stroke-dasharray: 4 4; }
      .prism-view circle.pr-road-old { fill: white; stroke: #8a8075; stroke-width: 1.5; }
      .prism-view path.pr-road-new { stroke: hsl(330 60% 42%); stroke-width: 2.5; }
      .prism-view circle.pr-road-new { fill: hsl(330 60% 42%); }
      .prism-view .pr-road-key { font-family: var(--mono); font-size: 11px; margin: 4px 0; display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; }
      .prism-view .pr-road-sw { display: inline-block; width: 18px; height: 0; border-top: 3px solid hsl(330 60% 42%); }
      .prism-view .pr-road-sw.old { border-top: 2px dashed #8a8075; }
      .prism-view .pr-road-list { margin: 6px 0; padding-left: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 2px 14px; font-size: 13px; }
      .prism-view .pr-road-list b { font-family: var(--mono); font-weight: 500; font-size: 11px; }
      .prism-view.pr-mounted { display: block; min-width: 0; }
      .prism-view.pr-mounted .pr-title { font-family: var(--serif); font-weight: 500; font-size: 18px; margin: 0 0 4px; }
      :where(.prism-view.pr-mounted) button { font-family: var(--mono); font-size: 11px; border: 1px solid var(--ink); background: var(--panel); padding: 4px 8px; cursor: pointer; }
      .prism-view.pr-mounted .pr-drop:hover, .prism-view.pr-mounted .subtabs button.on { background: var(--ink); color: var(--paper); }
      @media (max-width: 760px) {
        .prism-view .pr-head { grid-template-columns: 1fr; }
        .prism-view .pr-lens { border-top: 1px solid var(--line); }
      .prism-view .pr-lens > summary { cursor: pointer; padding: 6px 0; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
      .prism-view .pr-lens > summary::before { content: "▸"; font-family: var(--mono); }
      .prism-view .pr-lens[open] > summary::before { content: "▾"; }
      .prism-view .pr-lens > summary::-webkit-details-marker { display: none; }
      .prism-view .pr-lens .pr-lname { font-family: var(--serif); font-size: 16px; }
      .prism-view .pr-lens.empty .pr-lname { color: #8a8075; }
      .prism-view .pr-lens > .pr-row:last-child { border-bottom: 0; }
      .prism-view .pr-row { grid-template-columns: minmax(0, 1fr) auto; }
        .prism-view .pr-scroll, .prism-view .pr-info { grid-column: 1 / -1; }
        .prism-view .pr-act { grid-column: 2; grid-row: 1; }
        .prism-view .pr-drop { white-space: normal; }
      }
    `;
    document.head.appendChild(st);
  }

  hook();
  const main = document.getElementById("prism");
  if (main) main.classList.add("prism-view");
  window.CuriosityPrism = {
    /* The Prism tab. */
    draw() {
      const el = document.getElementById("prism");
      if (!el) return;
      if (!instances.has(el)) instances.set(el, Prism(el, {}));
      instances.get(el).draw();
    },
    /* Choose the film (a study id, or "m:<study>:<moment>" for a favorite moment) every Prism shows. */
    pick(id) {
      view.film = String(id || "");
      saveView();
      instances.forEach((inst) => ((inst.boardFilm = null), inst.visible() && inst.draw()));
    },
    /* A Prism inside any element, filtered to some curiosities: mount(el, {curiosities: [ids], title}). */
    mount(el, o) {
      if (!el) return null;
      o = o || {};
      el.classList.add("prism-view", "pr-mounted");
      const inst = Prism(el, { curiosities: o.curiosities, title: o.title, mounted: true });
      instances.set(el, inst);
      inst.draw();
      return { el, redraw: () => inst.draw() };
    },
  };
})();
