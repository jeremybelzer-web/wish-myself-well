/* momentum/myvideo.js: the "Your videos' rates" tab (Learn it). Jeremy wants the rates at which curiosity
   changes studied from real films, not only from Claude's estimates. Library, Bring in a video (media/media.js)
   measures a video on this device and keeps it as a curated film whose source is "my video", with values per
   moment for cuts, how long shots hold, brightness, warmth and color. This tab reads every such film the same
   way the Attention tab reads any film (CurioAttention, and CurioRates.measure for its profile) and puts its
   rates beside the curated films' estimates in plain sentences: how often attention moves, how long it usually
   holds, the longest one kind of curiosity holds it, and which cue moves it most.

   "Use this film's rates as my limit" sets the Momentum limit (the one the meter, the lanes and the other tabs
   use) to the limit this film suggests (CurioRates.limitFor: 2.5 times its usual stretch on one kind). It goes
   through the Momentum window's own Limit setting, so it is saved in the same place (curiosities-momentum-v1).

   window.CurioMyVideo (pure, works in Node)
   - isMine(study)                  true when the study came from a video you brought in (source "my video")
   - mine(studies)                  only those
   - rates(study, opts)             -> { id, title, mine, seconds, moments, moves, perMinute, every, usualHold,
                                        longestHold, usualRun, longestRun, longestFamily, topCue, quietShare,
                                        families, measuredFamilies, limit, profile, reading }
                                     opts: { secondsPerBeat, limit }
   - every(perMinute)               seconds between moves (60 / moves a minute), or null
   - versus(rates, films)           -> plain sentences comparing it with each film (estimates or measured)
   - closest(rates, films)          the film whose pace (moves a minute) is nearest
   - rows(rates, films)             one row per film for the side-by-side table, the video first
   - addTab() */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const R = () => root.CurioRates;
  const CUES = ["visual", "audio", "thought", "movement", "plot"];
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);

  const isMine = (s) => !!s && String(s.source || "").toLowerCase() === "my video";
  const mine = (studies) => (studies || []).filter(isMine);
  const every = (perMinute) => (perMinute > 0 ? round(60 / perMinute, 1) : null);
  const famLabel = (f) => (M().family(f) || { label: f }).label;
  const cueWord = (c) => ({ visual: "something to see", audio: "a sound", thought: "a thought", movement: "a movement", plot: "a plot turn" })[c] || c;
  const topOf = (shares) => {
    const e = Object.entries(shares || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0];
    return e ? { cue: e[0], share: round(e[1], 2) } : null;
  };

  function rates(study, options) {
    const opts = Object.assign({ secondsPerBeat: 3 }, options || {});
    const reading = A().fromStudy(study, opts);
    const s = reading.stats;
    const profile = R().measure(study, opts);
    const runs = s.familyRuns || [];
    const longest = runs.reduce((a, r) => (!a || r.dur > a.dur ? r : a), null);
    const families = Object.entries(s.familyShare || {}).map(([family, share]) => ({ family, share: Math.min(1, share) }));
    return {
      id: study && study.id,
      title: (study && (study.title || study.name)) || "Untitled film",
      mine: isMine(study),
      seconds: round(reading.seconds || 0, 1),
      moments: reading.beats || 0,
      moves: s.switches || 0,
      perMinute: s.switchesPerMinute || 0,
      every: every(s.switchesPerMinute),
      usualHold: s.medianDwell || 0,
      longestHold: s.longestDwell || 0,
      usualRun: s.medianFamilyRun || 0,
      longestRun: longest ? round(longest.dur, 1) : 0,
      longestFamily: longest ? longest.family : null,
      topCue: topOf(s.cueShare),
      quietShare: s.quietShare || 0,
      families,
      measuredFamilies: families.map((f) => f.family),
      limit: R().limitFor(profile),
      profile,
      reading,
    };
  }

  function closest(r, films) {
    const list = (films || []).filter((p) => p && p.switchesPerMinute > 0);
    if (!r || !r.perMinute || !list.length) return null;
    return list.slice().sort((a, b) => Math.abs(Math.log(a.switchesPerMinute / r.perMinute)) - Math.abs(Math.log(b.switchesPerMinute / r.perMinute)))[0];
  }

  /* "Your clip moves attention about every 4 seconds; Pulp Fiction about every 7." */
  function versus(r, films) {
    if (!r) return [];
    const who = r.mine ? "Your video" : r.title;
    const name = (p) => p.title + (p.estimate ? " (estimated)" : "");
    const out = [];
    (films || []).forEach((p) => {
      if (!p) return;
      const theirs = every(p.switchesPerMinute);
      if (!r.every || !theirs) return;
      const ratio = r.perMinute / p.switchesPerMinute;
      const how = ratio > 1.33 ? "faster" : ratio < 0.75 ? "slower" : "about the same pace";
      const pace = how === "about the same pace" ? `That is about the same pace.` : `That is ${how} than ${p.title}.`;
      out.push(`${who} moves attention about every ${fmtSec(r.every)}; ${name(p)} about every ${fmtSec(theirs)}. ${pace}`);
      if (p.medianFamilyRun) out.push(`One kind of curiosity usually holds attention for ${fmtSec(r.usualRun)} in ${r.mine ? "your video" : r.title}, against about ${fmtSec(p.medianFamilyRun)} in ${p.title}.`);
      const t = topOf(p.cueShare);
      if (r.topCue && t) out.push(t.cue === r.topCue.cue ? `Both are moved most often by ${cueWord(t.cue)} (${r.topCue.cue} cue).` : `${who} is moved most often by ${cueWord(r.topCue.cue)} (${r.topCue.cue} cue); ${p.title} by ${cueWord(t.cue)} (${t.cue} cue).`);
    });
    return out;
  }
  function fmtSec(n) {
    const v = n >= 10 ? Math.round(n) : round(n, 1);
    return `${v} second${v === 1 ? "" : "s"}`;
  }

  function rows(r, films) {
    const out = [];
    if (r) out.push({ id: r.id, title: r.title, mine: true, estimate: false, every: r.every, perMinute: r.perMinute, usualHold: r.usualHold, usualRun: r.usualRun, topCue: r.topCue, limit: r.limit });
    (films || []).forEach((p) => {
      if (!p) return;
      out.push({ id: p.id, title: p.title, mine: false, estimate: !!p.estimate, every: every(p.switchesPerMinute), perMinute: p.switchesPerMinute, usualHold: p.medianDwell, usualRun: p.medianFamilyRun, topCue: topOf(p.cueShare), limit: R().limitFor(p) });
    });
    return out;
  }

  /* ---------- the tab ---------- */
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const pct = (x) => Math.round((x || 0) * 100) + "%";
  const cap = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
  const shortName = (label) => String(label || "").replace(/^Model scene:\s*/, "").replace(/\s*\(made-up practice scene\)$/, "");
  const fam = (f) => {
    const m = M().mark(f);
    return `<span class="mo-fam myv-fam"><b class="myv-letter" style="background:${m.color};color:${m.ink}">${esc(m.letter)}</b>${esc(m.label)}</span>`;
  };
  let picked = "";
  let flash = "";

  function studiesOf(ctx) {
    const S = root.CuriosityStudy;
    let list = [];
    try {
      list = (S && typeof S.studies === "function" && S.studies()) || [];
    } catch (e) {}
    if (!list.length) {
      /* No study window on this page: the films the Momentum window lists, read through its own beats. */
      list = ctx
        .sources()
        .filter((s) => s.id.startsWith("study:"))
        .map((s) => ({ id: s.id.slice(6), title: shortName(s.label), beats: ctx.beatsOf(s.id) }));
    }
    return list.filter((s) => s && Array.isArray(s.beats));
  }
  function choose(ctx, list) {
    if (picked && list.some((s) => s.id === picked)) return picked;
    const src = ctx.source();
    const cur = src && src.startsWith("study:") ? src.slice(6) : "";
    const own = mine(list);
    if (cur && own.some((s) => s.id === cur)) return cur;
    if (own.length) return own[0].id;
    if (cur && list.some((s) => s.id === cur)) return cur;
    return list[0] ? list[0].id : "";
  }

  function pickerHtml(list, id) {
    const own = mine(list);
    const rest = list.filter((s) => !isMine(s));
    const opt = (s) => `<option value="${esc(s.id)}"${s.id === id ? " selected" : ""}>${esc(shortName(s.title || s.id))}${s.curated ? " (made-up practice scene)" : ""}</option>`;
    return `<select data-myv-pick aria-label="Film to study">${own.length ? `<optgroup label="Your videos">${own.map(opt).join("")}</optgroup>` : ""}${rest.length ? `<optgroup label="Other curated films">${rest.map(opt).join("")}</optgroup>` : ""}</select>`;
  }
  function emptyHtml() {
    const can = !!(root.CurioMedia && typeof root.CurioMedia.open === "function");
    return `<div class="myv-empty"><p><b>You have not brought in a video yet.</b> Open the Library and choose <b>Bring in a video</b>, then pick a video file from your computer. The app measures it right here on this device (cuts, how long shots hold, brightness, warmth, color, movement); the video is never uploaded. It then shows up here with its own rates.</p>${can ? `<button type="button" data-myv-bring>Bring in a video</button>` : `<p class="mo-small">Bring in a video is in the app's Library menu.</p>`}<p class="mo-small">Until then, you can study any curated film with the picker below.</p></div>`;
  }
  function listHtml(list, rs, id) {
    return `<ul class="myv-list">${list
      .map((s) => {
        const r = rs[s.id];
        const line = r && r.every ? `Attention moves about every ${fmtSec(r.every)}, over ${fmtSec(r.seconds)}.` : "Attention does not move yet in this one.";
        return `<li${s.id === id ? ' class="on"' : ""}><button type="button" data-myv-open="${esc(s.id)}" aria-pressed="${s.id === id}"><b>${esc(s.title || s.id)}</b><span>${esc(line)}</span></button></li>`;
      })
      .join("")}</ul>`;
  }
  function tilesHtml(r, limit) {
    const st = M().status(r.longestRun, limit);
    const t = (l, v, sub) => `<div class="mo-tile"><div class="mo-tile-l">${l}</div><div class="mo-tile-v">${v}</div>${sub ? `<div class="mo-tile-s">${sub}</div>` : ""}</div>`;
    return `<div class="mo-tiles myv-tiles">
      ${t("Attention moves", r.every ? `every ${round(r.every, 1)} <small>s</small>` : "not yet", `${r.perMinute} times a minute, ${r.moves} moves in all`)}
      ${t("Usual hold", `${r.usualHold} <small>s</small>`, "on one curiosity")}
      ${t("Longest hold", `${r.longestHold} <small>s</small>`, "on one curiosity")}
      ${t("Longest on one kind", `${r.longestRun} <small>s</small>`, `${r.longestFamily ? esc(famLabel(r.longestFamily)) + ". " : ""}<span class="myv-status myv-${st.cls}">${st.icon} ${esc(st.words)}</span> against your limit of ${limit} s`)}
      ${t("Moved most by", r.topCue ? esc(cap(r.topCue.cue)) : "nothing yet", r.topCue ? `${esc(cueWord(r.topCue.cue))}, ${pct(r.topCue.share)} of the changes; ${pct(r.quietShare)} were a stop` : "")}
    </div>`;
  }
  function familiesHtml(r) {
    if (!r.families.length) return "";
    return `<ul class="myv-shares">${r.families
      .slice(0, 6)
      .map((f) => `<li>${fam(f.family)}<span class="myv-bar"><i style="width:${Math.round(f.share * 100)}%;background:${M().mark(f.family).color}"></i></span><span class="myv-pct">${pct(f.share)}</span></li>`)
      .join("")}</ul>`;
  }
  function tableHtml(rowsList) {
    const body = rowsList
      .map(
        (x) =>
          `<tr class="${x.mine ? "myv-me" : ""}"><th scope="row">${x.mine ? '<span class="mo-badge mo-badge-m">This film</span> ' : ""}${esc(x.title)}${x.estimate ? ' <span class="mo-badge">estimate</span>' : ""}</th><td>${x.every ? "every " + round(x.every, 1) + " s" : "not yet"}</td><td>${x.usualHold != null ? x.usualHold + " s" : ""}</td><td>${x.usualRun != null ? x.usualRun + " s" : ""}</td><td>${x.topCue ? esc(cap(x.topCue.cue)) : ""}</td><td>${x.limit} s</td></tr>`
      )
      .join("");
    return `<div class="mo-scroll"><table class="mo-rates myv-table"><thead><tr><th>Film</th><th>Attention moves</th><th>Usual hold</th><th>Usual stretch on one kind</th><th>Moved most by</th><th>Limit it suggests</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /* Sets the Momentum window's Limit through its own setting, so every tab and the saved choices see it. */
  function setLimit(el, seconds) {
    const input = document.createElement("input");
    input.type = "number";
    input.hidden = true;
    input.dataset.m = "limit";
    input.value = String(seconds);
    el.appendChild(input);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.remove();
  }

  function mountTab(el, ctx) {
    const list = studiesOf(ctx);
    const own = mine(list);
    const id = choose(ctx, list);
    const study = list.find((s) => s.id === id);
    const opts = { secondsPerBeat: ctx.secondsPerBeat(), limit: ctx.limit() };
    const rs = {};
    own.forEach((s) => (rs[s.id] = rates(s, opts)));
    const r = study ? rs[study.id] || rates(study, opts) : null;
    const limit = ctx.limit();
    const curated = R().DEFAULT_FILMS;
    const near = r ? closest(r, curated) : null;
    const picks = ctx.profiles().filter((p) => p && (!r || p.id !== r.profile.id));
    const vsFilms = (picks.length ? picks : near ? [near] : []).slice(0, 3);
    const sentences = r ? versus(r, vsFilms) : [];
    const lightOnly = r && r.mine && r.measuredFamilies.length && r.measuredFamilies.every((f) => ["camera", "light", "cut"].includes(f));
    const own0 = own.length ? `<section><h3>Your videos</h3><p class="mo-small">Every video you brought in, measured on this device. Pick one to study it.</p>${listHtml(own, rs, id)}</section>` : emptyHtml();
    const detail = r
      ? `<section><h3>${r.mine ? "Your video" : esc(r.title)}: how fast attention moves</h3>
          <p class="mo-small">${esc(r.title)}: ${r.moments} moments over ${fmtSec(r.seconds)}. ${r.mine ? "Measured from the picture of your video." : r.profile && study && study.curated ? "A made-up practice scene." : "Read from its moments."}</p>
          ${tilesHtml(r, limit)}
          ${familiesHtml(r)}
          ${lightOnly ? `<p class="mo-small">A video is measured from its picture only, so here attention moves between camera and light. Voices, feelings and the plot are not measured; add them to this film in Library, Curated films, and the rates here follow.</p>` : ""}
        </section>
        <section><h3>Side by side</h3>
          ${sentences.length ? `<ul class="myv-vs">${sentences.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p class="mo-empty">Attention does not move in this film yet, so there is nothing to compare.</p>`}
          <p class="mo-small">${picks.length ? `Compared with the film${picks.length === 1 ? "" : "s"} you picked in Attention.` : near ? `Compared with the curated film closest in pace, ${esc(near.title)}. Pick films to compare with in Attention.` : ""} Estimate means Claude's guess, not a measurement.</p>
          ${tableHtml(rows(r, curated))}
        </section>
        <section><h3>Use it as your limit</h3>
          <p>${r.mine ? "Your video" : esc(r.title)} suggests a limit of <b>${r.limit} seconds</b>: two and a half times its usual stretch on one kind of curiosity (${fmtSec(r.usualRun)}). Your limit now is <b>${limit} seconds</b>. The limit is how long one kind of curiosity can hold attention before the meter says ▲ Getting long and then ■ Too long, on every tab.</p>
          <button type="button" data-myv-limit="${r.limit}"${r.limit === limit ? " disabled" : ""}>Use this film's rates as my limit</button>
          ${ctx.prefs().compare.includes(r.profile.id) ? `<p class="mo-small">It is one of the films you compare with.</p>` : `<button type="button" data-measure="${esc(study.id)}">Add it to the films you compare with</button>`}
        </section>`
      : `<p class="mo-empty">There is no curated film to study yet.</p>`;
    el.innerHTML = `<div class="myv">${flash ? `<div class="mo-flash" role="status">${esc(flash)}</div>` : ""}
      <p class="mo-lede">The rates of a real film: how often attention moves, how long it holds, and what moves it, read from a video you brought in and set beside the curated films.</p>
      ${own0}
      ${list.length ? `<div class="mo-controls"><label>Film to study ${pickerHtml(list, id)}</label></div>` : ""}
      ${detail}
    </div>`;
    flash = "";
    const sel = el.querySelector("[data-myv-pick]");
    if (sel)
      sel.addEventListener("change", () => {
        picked = sel.value;
        ctx.setSource("study:" + sel.value);
        ctx.refresh();
      });
    el.querySelectorAll("[data-myv-open]").forEach((b) =>
      b.addEventListener("click", () => {
        picked = b.dataset.myvOpen;
        ctx.setSource("study:" + picked);
        ctx.refresh();
      })
    );
    const lim = el.querySelector("[data-myv-limit]");
    if (lim)
      lim.addEventListener("click", () => {
        const v = Number(lim.dataset.myvLimit);
        setLimit(el, v);
        flash = `Your limit is now ${v} seconds, from ${r.mine ? "your video" : r.title}. Change it any time in Attention.`;
        ctx.refresh();
      });
    const bring = el.querySelector("[data-myv-bring]");
    if (bring)
      bring.addEventListener("click", () => {
        const U = root.CurioMomentumUI;
        if (U && typeof U.close === "function") U.close();
        root.CurioMedia.open();
      });
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "myvideo", label: "Your videos' rates", group: "learn", mount: mountTab });
  }

  const api = { isMine, mine, rates, every, versus, closest, rows, CUES, addTab, mountTab };
  root.CurioMyVideo = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
