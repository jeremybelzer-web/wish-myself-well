/* momentum/timing.js: the tab "Panel timing". How long each panel of a storyboard scene could stay on screen,
   so the flip book moves the way attention does.

   Today every panel of a scene lasts the same time (the Momentum window's "Seconds per panel", 3 by default;
   the Storyboard's flip book also shows every panel for one time, its Speed slider, and keeps no time for each
   panel). Momentum's idea: attention gets tired when one kind of curiosity holds it too long, and fresh when it
   moves. So the advice gives each panel its own hold time, by a few plain rules (RULES):

   1. The usual time is the seconds per panel ("base").
   2. The first panel that holds attention gets 1.25 times the usual time, so the audience settles in.
   3. A panel where attention moves to a new family gets 1.5 times, so the new thing lands.
   4. While one family keeps attention, its time held so far (the suggested holds of its panels before this one)
      against the limit decides: ● Fresh keeps the usual time, ▲ Getting long gets 0.75 times, ■ Too long gets
      0.5 times, so the flip book hurries on to the next thing.
   5. A comedy payoff (a payoff, a callback or a topper, from CurioComedyTiming when it is loaded) gets half a
      second more, so the laugh lands.
   6. Every hold stays between 0.5 and 8 seconds, rounded to a tenth of a second.

   Nothing in storyboard.js is changed. "Use this timing in the storyboard" writes each panel's time into the
   storyboard (panels[i].seconds) through its own CuriosityStoryboard.setTiming(list, label), one save and one
   undo step, and the flip book then holds each panel that long; "Clear the timing" gives the scene's panels back
   to the flip book's Speed slider. The storyboard's current times (CuriosityStoryboard.timing()) show beside the
   suggestion. With an older storyboard that has no setTiming, the timing can still be downloaded (JSON or CSV).

   window.CurioPanelTiming (the core works in Node with no page)
   - panelTiming(reading, { base, limit, panels, payoffs: [panel index], min, max }) -> { panels: [{ panel,
       family, label, curiosity, kind: "start" | "move" | "shift" | "hold" | "empty", base, hold, factor, payoff,
       held, status, clamped, why }], before, after, base, limit, min, max }
       reading: a CurioAttention reading of the scene (segments with beat = the panel they start on).
   - forScene(scene, { base, limit }) -> the same, read with CurioAttention.fromScene, payoffs from
       CurioComedyTiming when it is loaded
   - payoffsOf(beats, base) -> the panel indexes of comedy payoffs
   - toJson(result, { scene }) and toCsv(result): the downloads
   - timingList(result, si) -> [{ si, pi, seconds }] for CuriosityStoryboard.setTiming; clearList(n, si) clears
   - RULES */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const CT = () => root.CurioComedyTiming;

  const RULES = { start: 1.25, move: 1.5, fresh: 1, long: 0.75, over: 0.5, payoff: 0.5, min: 0.5, max: 8 };
  const r1 = (x) => Math.round(x * 10) / 10;
  const famLabel = (f) => {
    const x = M() && M().family(f);
    return x ? x.label : f || "";
  };
  const secs = (x) => `${r1(x)} second${r1(x) === 1 ? "" : "s"}`;
  const statusOf = (held, limit) => M().status(held, limit);

  function panelTiming(reading, opts) {
    const o = opts || {};
    const rd = reading || { segments: [], beats: 0 };
    const segs = Array.isArray(rd.segments) ? rd.segments : [];
    const n = Math.max(0, Math.round(Number(o.panels) >= 0 && o.panels != null ? Number(o.panels) : Number(rd.beats) || 0));
    const base = Number(o.base) > 0 ? Number(o.base) : rd.beats && rd.seconds ? rd.seconds / rd.beats : 3;
    const limit = Number(o.limit) > 0 ? Number(o.limit) : Number(rd.limit) > 0 ? Number(rd.limit) : 20;
    const min = Number(o.min) > 0 ? Number(o.min) : RULES.min;
    const max = Number(o.max) > min ? Number(o.max) : RULES.max;
    const payoffs = new Set((Array.isArray(o.payoffs) ? o.payoffs : []).map(Number));
    const out = [];
    let runFamily = null;
    let held = 0;
    let started = false;
    for (let i = 0; i < n; i++) {
      let seg = null;
      let k = -1;
      for (let j = 0; j < segs.length && segs[j].beat <= i; j++) {
        seg = segs[j];
        k = j;
      }
      const prev = k > 0 ? segs[k - 1] : null;
      const payoff = payoffs.has(i);
      let kind;
      let factor;
      let why;
      let st = statusOf(null, limit);
      let heldBefore = null;
      if (!seg) {
        kind = "empty";
        factor = RULES.fresh;
        why = "Nothing holds attention yet, so it keeps the usual time.";
      } else {
        const fam = famLabel(seg.family);
        if (!started) {
          kind = "start";
          factor = RULES.start;
          why = `The first panel that holds attention (${fam}: ${seg.label}) stays a little longer, so the audience settles in.`;
          runFamily = seg.family;
          held = 0;
        } else if (seg.family !== runFamily) {
          kind = "move";
          factor = RULES.move;
          why = `Attention moves to ${fam} here (${seg.label}), so it stays longer and the new thing lands.`;
          runFamily = seg.family;
          held = 0;
        } else {
          heldBefore = r1(held);
          st = statusOf(held, limit);
          kind = seg.beat === i && prev && prev.curiosity !== seg.curiosity ? "shift" : "hold";
          factor = st.key === "over" ? RULES.over : st.key === "long" ? RULES.long : RULES.fresh;
          const now = kind === "shift" ? `Still ${fam}, now ${seg.label}. ` : "";
          if (st.key === "over") why = `${now}${fam} has held attention for ${secs(held)}, past the ${limit} second limit (${st.icon} ${st.words}), so the flip book hurries on.`;
          else if (st.key === "long") why = `${now}${fam} has held attention for ${secs(held)} (${st.icon} ${st.words}), so this panel is a little shorter.`;
          else why = `${now}${fam} has held attention for ${secs(held)} and is still fresh (${st.icon} ${st.words}), so it keeps the usual time.`;
        }
        started = true;
      }
      let hold = base * factor + (payoff ? RULES.payoff : 0);
      const clamped = hold < min || hold > max;
      hold = r1(Math.min(max, Math.max(min, hold)));
      if (payoff) why += " A comedy payoff lands here, so it gets half a second more for the laugh.";
      if (clamped) why += ` It stays between ${min} and ${max} seconds.`;
      if (seg) held += hold;
      out.push({
        panel: i,
        family: seg ? seg.family : null,
        label: seg ? seg.label : "",
        curiosity: seg ? seg.curiosity : null,
        kind,
        base: r1(base),
        hold,
        factor,
        payoff,
        held: heldBefore,
        status: st,
        clamped,
        why,
      });
    }
    return { panels: out, before: r1(base * n), after: r1(out.reduce((a, p) => a + p.hold, 0)), base: r1(base), limit, min, max };
  }

  /* The panels where a comedy payoff lands (CurioComedyTiming's jokes that pay something off). */
  function payoffsOf(beats, base) {
    const T = CT();
    if (!T || typeof T.timing !== "function" || !beats || !beats.length) return [];
    try {
      const r = T.timing(beats, { secondsPerBeat: base || 3 });
      return r.jokes.filter((j) => j.kind === "payoff" || j.kind === "callback" || j.kind === "topper" || j.setupAt != null).map((j) => j.beat);
    } catch (e) {
      return [];
    }
  }

  function forScene(scene, opts) {
    const o = opts || {};
    const base = Number(o.base) > 0 ? Number(o.base) : 3;
    const limit = Number(o.limit) > 0 ? Number(o.limit) : 20;
    const beats = ((scene && scene.panels) || []).map((p) => ({ values: (p && p.v) || {} }));
    const reading = A().read(beats, { secondsPerBeat: base, limit });
    return panelTiming(reading, { base, limit, panels: beats.length, payoffs: o.payoffs || payoffsOf(beats, base) });
  }

  function toJson(res, meta) {
    const s = (meta && meta.scene) || {};
    return JSON.stringify(
      {
        format: "curiomatic-panel-timing",
        version: 1,
        scene: { id: s.id || null, name: s.name || "" },
        basePanelSeconds: res.base,
        limitSeconds: res.limit,
        totalBefore: res.before,
        totalAfter: res.after,
        panels: res.panels.map((p) => ({ panel: p.panel + 1, seconds: p.hold, family: p.family, curiosity: p.curiosity, label: p.label, kind: p.kind, payoff: p.payoff, why: p.why })),
      },
      null,
      2
    );
  }
  function toCsv(res) {
    const q = (v) => {
      const t = String(v == null ? "" : v);
      return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const head = ["panel", "seconds", "family", "curiosity", "kind", "payoff", "why"];
    return [head.join(",")].concat(res.panels.map((p) => [p.panel + 1, p.hold, famLabel(p.family), p.label, p.kind, p.payoff ? "yes" : "", p.why].map(q).join(","))).join("\n") + "\n";
  }

  /* The lists CuriosityStoryboard.setTiming takes: every panel of scene si at its suggested time, or cleared. */
  const timingList = (res, si) => res.panels.map((p) => ({ si, pi: p.panel, seconds: p.hold }));
  const clearList = (n, si) => Array.from({ length: n }, (_, pi) => ({ si, pi, seconds: null }));

  const api = { panelTiming, forScene, payoffsOf, toJson, toCsv, timingList, clearList, RULES };
  root.CurioPanelTiming = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  /* ---------- the tab (only on a page, inside the Momentum window) ---------- */
  const KEY = "curiosities-momentum-timing-v1";
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY));
      return p && typeof p === "object" ? p : {};
    } catch (e) {
      return {};
    }
  }
  const prefs = loadPrefs();
  function savePrefs() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {}
  }
  function scenes() {
    const SB = root.CuriosityStoryboard;
    try {
      const d = SB && typeof SB.data === "function" ? SB.data() : JSON.parse(localStorage.getItem("curiosities-storyboard-v1"));
      return (d && Array.isArray(d.scenes) ? d.scenes : []).filter((s) => s && Array.isArray(s.panels) && s.panels.length);
    } catch (e) {
      return [];
    }
  }
  function pickScene(list, ctx) {
    const src = ctx.source();
    const want = prefs.scene || (src && src.startsWith("sb:") && src !== "sb:all" ? src.slice(3) : "");
    return list.find((s) => s.id === want) || list[0] || null;
  }
  function chip(f) {
    if (!f) return `<span class="mpt-chip mpt-none">none</span>`;
    const m = M().mark(f);
    return `<span class="mpt-chip" style="background:${m.color};color:${m.ink}" title="${esc(m.label)}">${esc(m.letter)}</span>`;
  }
  /* The panel's picture, drawn by My film's board like the storyboard draws it; just the stage. */
  function picture(scene, i) {
    const B = root.CuriosityBoard;
    const p = scene.panels[i] || {};
    if (B && typeof B.panel === "function") {
      try {
        const html = B.panel(p.line || { who: "", text: "" }, i, scene.panels.length, p.v || {});
        const m = /<svg class="stage[\s\S]*?<\/svg>/.exec(html);
        if (m) return m[0];
      } catch (e) {}
    }
    return `<div class="mpt-pic-n">${i + 1}</div>`;
  }

  /* The storyboard's own timing hooks (storyboard.js): setTiming(list, label) and timing(). */
  const SBT = () => {
    const SB = root.CuriosityStoryboard;
    return SB && typeof SB.setTiming === "function" && typeof SB.timing === "function" ? SB : null;
  };
  /* The scene's place in the storyboard (setTiming and timing() count every scene, empty ones too). */
  function sceneIndex(scene) {
    const SB = root.CuriosityStoryboard;
    try {
      const all = (SB && typeof SB.data === "function" && SB.data().scenes) || [];
      const i = all.findIndex((s) => s && (s === scene || (scene.id && s.id === scene.id)));
      return i;
    } catch (e) {
      return -1;
    }
  }
  function nowTiming(si, n) {
    const T = SBT();
    if (!T || si < 0) return null;
    try {
      const row = T.timing()[si] || [];
      return Array.from({ length: n }, (_, i) => (Number(row[i]) > 0 ? Number(row[i]) : null));
    } catch (e) {
      return null;
    }
  }
  let flash = ""; /* a line to show after the tab redraws (after Use or Clear) */

  /* One player at a time; it stops itself when the tab is no longer on screen. */
  let player = null;
  function stop() {
    if (!player) return;
    clearTimeout(player.timer);
    if (player.raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(player.raf);
    const p = player;
    player = null;
    p.onStop();
  }
  function onScreen(el) {
    if (!el.isConnected) return false;
    const dlg = el.closest("dialog");
    return !dlg || dlg.open;
  }
  function play(el, scene, res) {
    stop();
    const box = el.querySelector(".mpt-preview");
    const pic = el.querySelector(".mpt-pic");
    const said = el.querySelector(".mpt-now");
    const fill = el.querySelector(".mpt-progress i");
    const btn = el.querySelector("[data-mpt-play]");
    if (!box || !res.panels.length) return;
    box.hidden = false;
    btn.textContent = "Stop";
    btn.setAttribute("aria-pressed", "true");
    const total = res.after * 1000;
    const p = { i: -1, t0: 0, start: performance.now(), timer: 0, raf: 0 };
    p.onStop = () => {
      el.dataset.playing = "";
      if (btn.isConnected) {
        btn.textContent = "Play with this timing";
        btn.setAttribute("aria-pressed", "false");
      }
      el.querySelectorAll(".mpt-col.on").forEach((c) => c.classList.remove("on"));
    };
    player = p;
    el.dataset.playing = "1";
    const show = (i) => {
      if (player !== p) return;
      if (!onScreen(el)) return stop();
      if (i >= res.panels.length) {
        stop();
        said.textContent = `The end. The scene ran ${res.after} seconds with this timing (${res.before} seconds with every panel the same).`;
        return;
      }
      const c = res.panels[i];
      p.i = i;
      el.dataset.at = String(i);
      pic.innerHTML = picture(scene, i);
      said.textContent = `Panel ${i + 1} of ${res.panels.length}: ${secs(c.hold)}. ${c.why}`;
      el.querySelectorAll(".mpt-col").forEach((col) => col.classList.toggle("on", Number(col.dataset.i) === i));
      p.timer = setTimeout(() => show(i + 1), c.hold * 1000);
    };
    const tick = () => {
      if (player !== p) return;
      if (!onScreen(el)) return stop();
      if (fill) fill.style.width = Math.min(100, ((performance.now() - p.start) / total) * 100) + "%";
      p.raf = requestAnimationFrame(tick);
    };
    show(0);
    if (typeof requestAnimationFrame === "function") p.raf = requestAnimationFrame(tick);
  }
  function download(el, text, name, type) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch (e) {
      const s = el.querySelector(".mpt-said");
      if (s) s.textContent = "The download did not start: " + e.message;
      return false;
    }
  }
  const slug = (s) => String(s || "scene").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scene";

  function mountTab(el, ctx) {
    stop();
    const list = scenes();
    const scene = pickScene(list, ctx);
    if (!scene) {
      el.innerHTML = `<div class="mpt-root"><p>Panel timing suggests how long each panel of a storyboard scene could stay on screen. There is no storyboard scene yet. Open the Storyboard and save My film as a scene, or press Make many, then come back here.</p>${root.CuriosityWorkspaces ? `<div class="mo-controls"><button type="button" data-mpt-open="storyboard">Open the Storyboard</button></div>` : ""}</div>`;
      const open = el.querySelector("[data-mpt-open]");
      if (open)
        open.addEventListener("click", () => {
          if (root.CurioMomentumUI) root.CurioMomentumUI.close();
          root.CuriosityWorkspaces.open("storyboard");
        });
      return;
    }
    const base = Number(ctx.secondsPerBeat()) > 0 ? Number(ctx.secondsPerBeat()) : 3;
    const res = forScene(scene, { base, limit: ctx.limit() });
    const diff = r1(res.after - res.before);
    const si = sceneIndex(scene);
    const can = !!SBT() && si >= 0;
    const now = nowTiming(si, res.panels.length);
    const own = now ? now.filter((x) => x != null).length : 0;
    const same = now && own === res.panels.length && res.panels.every((p, i) => Math.abs(now[i] - p.hold) < 0.01);
    const nowWords = !now
      ? ""
      : same
        ? "uses this timing"
        : own === 0
          ? "every panel follows the Speed slider"
          : `${own} of ${res.panels.length} panels have their own time`;
    const top = Math.max(base, ...res.panels.map((p) => p.hold)) * 1.25;
    const cols = res.panels
      .map(
        (p) => `<li class="mpt-col" data-i="${p.panel}" title="Panel ${p.panel + 1}: ${esc(secs(p.hold))}. ${esc(p.why)}">
          <span class="mpt-num">${p.panel + 1}</span>
          <span class="mpt-bar"><i style="height:${Math.round((p.hold / top) * 100)}%"></i><b style="bottom:${Math.round((base / top) * 100)}%"></b></span>
          <span class="mpt-sec">${p.hold}</span>${now ? `<span class="mpt-cur" title="In the storyboard now: ${now[p.panel] != null ? esc(secs(now[p.panel])) : "the Speed slider"}">${now[p.panel] != null ? now[p.panel] : "Speed"}</span>` : ""}${chip(p.family)}${p.payoff ? `<span class="mpt-pay" title="A comedy payoff">P</span>` : ""}
        </li>`
      )
      .join("");
    const rows = res.panels
      .map((p) => {
        const mark = p.held != null ? `<span class="mo-status mo-${p.status.cls}">${p.status.icon} ${esc(p.status.words)}</span>` : "";
        const cur = now ? `<span class="mpt-why mpt-row-now">In the storyboard now: ${now[p.panel] != null ? esc(secs(now[p.panel])) : "the flip book's Speed slider"}.</span>` : "";
        return `<li><span class="mpt-row-h"><b>Panel ${p.panel + 1}</b>${chip(p.family)}<span>${esc(p.label || "nothing yet")}</span><span class="mpt-row-s">${esc(secs(p.hold))}</span>${mark}</span><span class="mpt-why">${esc(p.why)}</span>${cur}</li>`;
      })
      .join("");
    const tile = (v, l, s) => `<div class="mo-tile"><div class="mo-tile-v">${v}</div><div class="mo-tile-l">${l}</div>${s ? `<div class="mo-tile-s">${s}</div>` : ""}</div>`;
    el.innerHTML = `<div class="mpt-root">
      <p>How long each panel of a storyboard scene could stay on screen. Attention gets tired when one kind of thing holds it too long, and fresh when it moves, so panels get shorter while one family keeps attention and longer right after attention moves, so the new thing lands.</p>
      <div class="mo-controls"><label>Scene<select data-mpt-scene aria-label="Storyboard scene">${list.map((s, i) => `<option value="${esc(s.id)}"${s.id === scene.id ? " selected" : ""}>${esc(s.name || "Scene " + (i + 1))} (${s.panels.length} panels)</option>`).join("")}</select></label></div>
      <div class="mo-tiles">
        ${tile(`${res.before} s`, "The scene today", `every panel ${base} seconds (Seconds per panel in Attention)`)}
        ${tile(`${res.after} s`, "With this timing", diff === 0 ? "the same length" : `${Math.abs(diff)} seconds ${diff < 0 ? "shorter" : "longer"}`)}
        ${tile(`${Math.min(...res.panels.map((p) => p.hold))} to ${Math.max(...res.panels.map((p) => p.hold))} s`, "Shortest to longest panel", "never under 0.5 or over 8 seconds")}
        ${now ? `<div class="mo-tile mpt-tile-now" data-mpt-now><div class="mo-tile-v">${same ? "This timing" : own ? `${own} of ${res.panels.length}` : "Speed slider"}</div><div class="mo-tile-l">In the storyboard now</div><div class="mo-tile-s">${esc(nowWords)}</div></div>` : ""}
      </div>
      <section><h3>Each panel's time</h3>
        <ol class="mpt-cols" aria-label="Suggested seconds for each panel">${cols}</ol>
        <p class="mo-small">Each bar is a panel's suggested time; the line across it is the usual ${base} seconds. The letter is the family holding attention, and P marks a comedy payoff.${now ? " The gray number under it is the panel's time in the storyboard now (Speed means it follows the flip book's Speed slider)." : ""}</p>
      </section>
      <div class="mo-controls mpt-actions">
        ${can ? `<button type="button" data-mpt-use${same ? " disabled" : ""}>Use this timing in the storyboard</button><button type="button" data-mpt-clear${own ? "" : " disabled"}>Clear the timing</button>` : ""}
        <button type="button" data-mpt-play aria-pressed="false">Play with this timing</button>
        <button type="button" data-mpt-json>Download the timing (JSON)</button>
        <button type="button" data-mpt-csv>Download the timing (CSV)</button>
      </div>
      <p class="mpt-said mo-small" role="status">${esc(flash)}</p>
      <div class="mpt-preview" hidden>
        <div class="mpt-pic"></div>
        <div class="mpt-progress" aria-hidden="true"><i></i></div>
        <p class="mpt-now" aria-live="polite"></p>
      </div>
      <section><h3>Why each panel gets its time</h3><ol class="mpt-rows">${rows}</ol></section>
      <p class="mo-small">${
        can
          ? "Use this timing in the storyboard gives each panel of this scene its suggested time, and the Storyboard's flip book then holds each panel that long. One Undo takes it back. Clear the timing gives the panels back to the flip book's Speed slider. The downloads help plan the cut, or go to an animator."
          : "This Storyboard keeps no time for each panel, so its flip book shows every panel for the same time (its Speed slider). Download the timing instead to plan the cut, or to hand to an animator."
      }</p>
    </div>`;
    flash = "";
    el.onchange = (e) => {
      if (e.target.matches("[data-mpt-scene]")) {
        prefs.scene = e.target.value;
        savePrefs();
        stop();
        ctx.refresh();
      }
    };
    el.onclick = (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const said = el.querySelector(".mpt-said");
      if (t.matches("[data-mpt-use]") || t.matches("[data-mpt-clear]")) {
        const T = SBT();
        if (!T || si < 0) return;
        const use = t.matches("[data-mpt-use]");
        stop();
        const name = scene.name || "Scene " + (si + 1);
        const n = T.setTiming(use ? timingList(res, si) : clearList(res.panels.length, si), "Momentum: panel timing");
        flash = !n
          ? "The storyboard did not change. Its scene may have moved; pick the scene again."
          : use
            ? `The storyboard now holds each panel of ${name} for its suggested time (${res.after} seconds in all). One Undo takes it back.`
            : `The panels of ${name} follow the flip book's Speed slider again. One Undo takes it back.`;
        ctx.refresh();
        return;
      }
      if (t.matches("[data-mpt-play]")) {
        if (player) stop();
        else play(el, scene, res);
      } else if (t.matches("[data-mpt-json]")) {
        const name = `panel-timing-${slug(scene.name)}.json`;
        if (download(el, toJson(res, { scene }), name, "application/json")) said.textContent = `Saved ${name}: each panel's seconds, family and reason.`;
      } else if (t.matches("[data-mpt-csv]")) {
        const name = `panel-timing-${slug(scene.name)}.csv`;
        if (download(el, "﻿" + toCsv(res), name, "text/csv")) said.textContent = `Saved ${name}. It opens in any spreadsheet, such as Excel, Numbers or Google Sheets.`;
      }
    };
  }

  function attach() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    U.addTab({ id: "timing", label: "Panel timing", group: "fix", after: "end", mount: mountTab });
    return true;
  }
  api.mountTab = mountTab;
  api.stop = stop;
  api.playing = () => !!player;
  if (!attach()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
    else setTimeout(attach, 0);
  }
})();
