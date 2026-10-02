/* screen/levels.js: the four levels the Screen looks through, and the major categories its inspector is built
   from. Part of the Screen core (no page; works in Node for the tests).

   Jeremy (2026-10-02 17:18Z): the film plays in the main window and we "filter what we are looking at based on
   the curiosity that's selected, or the curiosity suite, or the curiosity proximity, or the curiosity suite
   proximity". And 17:19Z: controls "for every kind of curiosity, at least the major categories of them, so
   it's not too overwhelming", because the fine distinctions "might be limitless".

   window.CurioLevels
   - CATEGORIES       the major filmmaking categories, each a group of the database's workspaces, with the
                      window layout it opens with (1, 2 or 3 windows; decision log, layout-thread.md)
   - categoryOf(id)   the category a curiosity (or "curiosity.slider") belongs to
   - curiosities(cat) the curiosities of a category, main ones first (biggest momentum push, then catalog order)
   - items(level, cat?) every curiosity / suite / proximity / proximitySuite (optionally of one category)
   - get(level, id)   one item
   - resolve(level, id) -> { level, id, label, plain, curiosities: [ids], pairs: [{ from, to, within, fromIs,
                      toIs, change }], categories: [cat ids] }: what that item makes you look at
   - beatValue(beats, i, id)  a curated film's value for a curiosity at beat i (values carry forward)
   - fires(level, id, beats) -> [{ beat, strength 0..1 }]: where in a curated film the item shows up
     (a curiosity where it changes, a suite by the share of members that match, a proximity where the cause
     happens and the effect follows within its beats, a proximity suite where any member fires)
   - control(slider)  which control fits a slider: "toggle", "choice" (a list with no order), "steps" (words
                      in order), "knob" (a short number range) or "slider" */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const DB = () => root.CuriosityDB || null;

  /* Sixteen categories: the families that matter to filmmaking, not every fine distinction. They are the
     Screen's top icon row, the way CapCut's tabs are (Jeremy, 2026-10-02 18:00Z: CapCut is now the main
     model). Each groups workspaces from data/db-workspaces.js (and screen/edit-curiosities.js, the editing
     curiosities from Final Cut Pro and CapCut). windows: the layout the category opens with. icon: its
     picture in the top row (ui.js ICONS). */
  const CATEGORIES = [
    { id: "camera", label: "Camera", icon: "camera", workspaces: ["camera-angle", "camera-motion", "placement"], windows: 2, plain: "Where the lens is, what it sees and how it moves." },
    { id: "performance", label: "Performance", icon: "person", workspaces: ["lines", "movement-lines", "character-motion"], windows: 2, plain: "What the actors say and do: delivery, gesture, paths." },
    { id: "light", label: "Light & color", icon: "sun", workspaces: ["light", "color"], windows: 3, plain: "Where light comes from, how hard and warm it is, and the color of the picture." },
    { id: "grade", label: "Filters", icon: "filter", workspaces: ["grade"], windows: 3, plain: "Filters and adjustments laid over the picture: the look, exposure, warmth, texture, matching shots." },
    { id: "world", label: "Set", icon: "house", workspaces: ["set", "background"], windows: 3, plain: "The place itself and what happens behind the people." },
    { id: "wardrobe", label: "Wardrobe", icon: "shirt", workspaces: ["wardrobe"], windows: 3, plain: "What the main character and everyone else wear." },
    { id: "sound", label: "Audio", icon: "note", workspaces: ["music", "audio-mix"], windows: 2, plain: "The music, the sound around the scene, and the mix: levels, fades, voice effects, sound hits." },
    { id: "text", label: "Text", icon: "text", workspaces: ["titles"], windows: 2, plain: "Words and stickers on the screen: titles, captions, sound words, emoji." },
    { id: "effects", label: "Effects", icon: "star", workspaces: ["effects", "layers"], windows: 2, plain: "Wind, smoke, fire and breakage, plus the editor's layers: overlays, cutouts, masks, video effects." },
    { id: "transitions", label: "Transitions", icon: "bowtie", workspaces: ["transitions"], windows: 2, plain: "How one shot hands over to the next: cuts, dissolves, wipes, fades, clip animations." },
    { id: "speed", label: "Speed", icon: "gauge", workspaces: ["speed"], windows: 2, plain: "How fast clips play and how the cutting breathes: slow motion, freezes, jump cuts, the beat." },
    { id: "editing", label: "Editing", icon: "scissors", workspaces: ["structure", "canvas"], windows: 2, plain: "How scenes are cut and ordered, and what the editor does to the frame: punch-ins, steadying, edges." },
    { id: "feeling", label: "Feeling", icon: "heart", workspaces: ["emotion", "emo-road"], windows: 2, plain: "The feeling of the scene and each character's emotional road." },
    { id: "comedy", label: "Comedy", icon: "smile", workspaces: ["comedy", "comedy-mix"], windows: 3, plain: "How it is funny, and what the mix of people does for the laughs." },
    { id: "story", label: "Story", icon: "book", workspaces: ["arc", "plot", "mindset", "focus", "archetype", "herd"], windows: 1, plain: "Arcs, personal plots, mindset, focus, personality, the group." },
    { id: "page", label: "Page", icon: "page", workspaces: ["page"], windows: 1, plain: "How a storyboard, comic or zine page is laid out." },
  ];
  const CAT_OF_WS = {};
  CATEGORIES.forEach((c) => c.workspaces.forEach((w) => (CAT_OF_WS[w] = c.id)));
  const LEVELS = [
    { id: "curiosity", label: "Curiosity", many: "curiosities" },
    { id: "suite", label: "Suite", many: "suites" },
    { id: "proximity", label: "Proximity", many: "proximities" },
    { id: "proximitySuite", label: "Proximity suite", many: "proximitySuites" },
  ];

  function data() {
    const d = DB();
    return d && d.data ? d.data : { curiosities: [], suites: [], proximities: [], proximitySuites: [], scenes: [] };
  }
  const base = (id) => String(id || "").split(".")[0];
  function get(level, id) {
    const d = DB();
    if (!d || !id) return null;
    try {
      return d.get(level, id);
    } catch (e) {
      return null;
    }
  }
  function categoryOfItem(item) {
    if (!item) return "";
    return CAT_OF_WS[item.workspace] || "";
  }
  function categoryOf(id) {
    const c = get("curiosity", base(id));
    if (c) return categoryOfItem(c) || "story";
    /* Older catalog rows the database did not take: guess from the catalog's group. */
    const list = root.CURIOSITIES || [];
    const row = list.find((x) => x.id === base(id));
    const g = String((row && row.group) || "").toLowerCase();
    if (/camera|lens|shot/.test(g)) return "camera";
    if (/light|color/.test(g)) return "light";
    if (/sound|music/.test(g)) return "sound";
    if (/comedy/.test(g)) return "comedy";
    if (/emotion|feeling/.test(g)) return "feeling";
    if (/people|motion|line/.test(g)) return "performance";
    return "story";
  }
  const push = (c) => (c && c.momentum && Number(c.momentum.push)) || 0;
  function curiosities(cat) {
    /* A curiosity shows in its own category and in any its also-workspaces belong to (Mood stickers under Feeling). */
    const list = data().curiosities.filter((c) => !cat || categoryOfItem(c) === cat || (c.also || []).some((w) => CAT_OF_WS[w] === cat && w !== c.workspace));
    return list
      .map((c, i) => ({ c, i }))
      .sort((a, b) => push(b.c) - push(a.c) || a.i - b.i)
      .map((x) => x.c);
  }
  function items(level, cat) {
    const key = (LEVELS.find((l) => l.id === level) || LEVELS[0]).many;
    if (level === "curiosity") return curiosities(cat);
    const list = data()[key] || [];
    return cat ? list.filter((x) => categoryOfItem(x) === cat || (x.also || []).some((w) => CAT_OF_WS[w] === cat)) : list.slice();
  }

  /* An end of a proximity ({ curiosity, slider?, is?, change? } or { suite }) as engine curiosity ids. */
  function endIds(e) {
    if (!e) return [];
    if (e.suite) {
      const s = get("suite", e.suite);
      return s ? (s.members || []).map((m) => m.curiosity).filter(Boolean) : [];
    }
    if (!e.curiosity) return [];
    return [e.curiosity + (e.slider ? "." + e.slider : "")];
  }
  function pairOf(p) {
    if (!p) return null;
    const from = endIds(p.when);
    const to = endIds(p.then);
    if (!from.length || !to.length) return null;
    return {
      id: p.id,
      label: p.label,
      from: from[0],
      to: to[0],
      fromAll: from,
      toAll: to,
      fromSuite: p.when.suite || null,
      toSuite: p.then.suite || null,
      fromIs: p.when.is != null ? p.when.is : null,
      fromChange: p.when.change || (p.when.is != null ? null : "changes"),
      toIs: p.then.is != null ? p.then.is : null,
      change: p.then.change || null,
      within: Number(p.within) || 1,
    };
  }
  const uniq = (a) => a.filter((x, i) => x && a.indexOf(x) === i);
  function resolve(level, id) {
    const it = get(level, id);
    const out = { level, id, label: it ? it.label : String(id || ""), plain: it ? it.plain || "" : "", curiosities: [], pairs: [], categories: [] };
    if (!it) {
      if (level === "curiosity" && id) {
        out.curiosities = [id];
        out.label = root.CurioScale ? root.CurioScale.label(id) : id;
      }
      out.categories = uniq(out.curiosities.map(categoryOf));
      return out;
    }
    if (level === "curiosity") out.curiosities = [it.id];
    else if (level === "suite") out.curiosities = uniq((it.members || []).map((m) => m.curiosity));
    else if (level === "proximity") {
      const p = pairOf(it);
      if (p) {
        out.pairs = [p];
        out.curiosities = uniq(p.fromAll.concat(p.toAll));
      }
    } else if (level === "proximitySuite") {
      (it.members || []).forEach((m) => {
        const p = pairOf(get("proximity", m));
        if (p) out.pairs.push(p);
      });
      out.curiosities = uniq([].concat(...out.pairs.map((p) => p.fromAll.concat(p.toAll))));
    }
    out.categories = uniq(out.curiosities.map(categoryOf));
    return out;
  }

  /* ---------- reading a curated film ---------- */
  function beatValue(beats, i, id) {
    for (let j = Math.min(i, beats.length - 1); j >= 0; j--) {
      const v = beats[j] && beats[j].values ? beats[j].values[id] : undefined;
      if (v != null) return v;
    }
    return undefined;
  }
  function pos(id, v) {
    const S = root.CurioScale;
    if (v == null) return null;
    if (S) {
      const p = S.pos(id, v);
      if (p != null) return p;
    }
    return typeof v === "number" ? Math.max(0, Math.min(1, v / 10)) : null;
  }
  const same = (a, b) => a != null && b != null && String(a).toLowerCase() === String(b).toLowerCase();
  function moved(beats, i, id) {
    if (i <= 0) return 0;
    const a = beatValue(beats, i - 1, id);
    const b = beatValue(beats, i, id);
    if (b == null || same(a, b)) return 0;
    const pa = pos(id, a);
    const pb = pos(id, b);
    if (pa == null || pb == null) return 1;
    return pb > pa ? 1 : pb < pa ? -1 : 1;
  }
  function suiteShare(s, beats, i) {
    const ms = (s && s.members) || [];
    if (!ms.length) return 0;
    let have = 0;
    let all = 0;
    ms.forEach((m) => {
      const w = m.weight != null ? Number(m.weight) || 0 : 100;
      all += w;
      const v = beatValue(beats, i, m.curiosity);
      if (m.value == null ? v != null : same(v, m.value)) have += w;
    });
    return all ? have / all : 0;
  }
  function causeAt(p, beats, i) {
    if (p.fromSuite) return suiteShare(get("suite", p.fromSuite), beats, i) >= 0.5 && (i === 0 || suiteShare(get("suite", p.fromSuite), beats, i - 1) < 0.5);
    if (p.fromIs != null) return same(beatValue(beats, i, p.from), p.fromIs) && (i === 0 || !same(beatValue(beats, i - 1, p.from), p.fromIs));
    const d = moved(beats, i, p.from);
    if (p.fromChange === "rises") return d > 0;
    if (p.fromChange === "drops") return d < 0;
    return d !== 0;
  }
  function effectAt(p, beats, j) {
    if (p.toSuite) return suiteShare(get("suite", p.toSuite), beats, j) >= 0.5;
    if (p.toIs != null) return same(beatValue(beats, j, p.to), p.toIs);
    const d = moved(beats, j, p.to);
    if (p.change === "rises") return d > 0;
    if (p.change === "drops") return d < 0;
    return d !== 0;
  }
  function pairFires(p, beats) {
    const out = [];
    for (let i = 0; i < beats.length; i++) {
      if (!causeAt(p, beats, i)) continue;
      for (let j = i; j <= Math.min(beats.length - 1, i + p.within); j++) {
        if (effectAt(p, beats, j)) {
          out.push({ beat: i, to: j, strength: 1, pair: p.id });
          break;
        }
      }
    }
    return out;
  }
  function fires(level, id, beats) {
    beats = Array.isArray(beats) ? beats : [];
    if (!beats.length) return [];
    if (level === "curiosity") {
      const out = [];
      beats.forEach((b, i) => {
        if (i === 0 ? beatValue(beats, 0, id) != null : moved(beats, i, id)) out.push({ beat: i, strength: 1 });
      });
      return out;
    }
    if (level === "suite") {
      const s = get("suite", id);
      return beats.map((b, i) => ({ beat: i, strength: suiteShare(s, beats, i) })).filter((x) => x.strength > 0);
    }
    const r = resolve(level, id);
    const all = [].concat(...r.pairs.map((p) => pairFires(p, beats)));
    return all.sort((a, b) => a.beat - b.beat);
  }

  /* ---------- controls ---------- */
  function control(s) {
    if (!s) return "slider";
    if (Array.isArray(s.scale)) {
      if (s.scale.length === 2) return "toggle";
      if (s.unordered) return "choice";
      return "steps";
    }
    if (s.range) return s.range.max - s.range.min <= 10 && Number.isInteger(s.range.min) && Number.isInteger(s.range.max) ? "knob" : "slider";
    return "slider";
  }

  root.CurioLevels = { CATEGORIES, LEVELS, categoryOf, curiosities, items, get, resolve, beatValue, fires, control, suiteShare, pairOf, base };
  if (typeof module !== "undefined" && module.exports) module.exports = root.CurioLevels;
})();
