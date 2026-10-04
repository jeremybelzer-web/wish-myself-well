/* rig/screen.js: "3D on the Screen", a 3D add-on (the "Bring Maya into the app" thread, 2026-10-03).

   The 3D characters inside the Screen (the CapCut-style main layout), acting out the film as the playhead moves.
   A small "3D actors" panel docks under the Player (CurioScreen.addPanel). It stays a slim bar until you press
   "Show 3D", so three.js only starts when you want it, and the 3D view stops again when the panel or the Screen
   is hidden.

   - Who and Played by: each character on the timeline (a character track, screen/character.js) can be played
     by one of the 3D characters or objects (CurioRig.CHARACTERS). "Who" is the same pick as the Character tab's.
     The choices are kept in localStorage "curiosities-rig3d-cast-v1" (a curiosities-* key, so a saved project
     file carries them): { cast: { trackId: characterId } }. Whether the panel is open is a per-device
     convenience in "curiosities-rig3d-screen-view-v1".
   - As the Screen plays or the playhead moves, the 3D character follows the Movement rules lanes (rigRulesLens.*)
     and the pose lanes (poseRigLens.*) at that moment: rig.js reads them itself every frame (readTimeline). The
     panel passes opts.track (a function giving the track it shows) for rig.js to read that character's lanes.
   - Tell it what to do: plain words ("sleepy", "stiff base, floppy top") change the rules, the same reader as the
     3D window. "Key this on the timeline" puts what the 3D character does now as nodes at the playhead, on the
     shown character's track, as one undo step.

   - Everyone together: with more than one character track, the other tracks join the 3D view as more actors,
     staged together (rig/staging.js); kept per device in curiosities-rig3d-screen-view-v1 ({ together }).
   - Write a whole beat: a box for rig/scene.js's words ("At a diner at night, Ida (...) sits across from Nessa
     (...). Nessa says something; Ida does a double take, then laughs.") and "Put this beat on the timeline", which
     writes it into the lanes at the playhead as one undo step (CurioRigScene.toTimeline). Played by also offers
     each character made from words ("made:<id>"); the shown one plays as "Made from your words".

   window.CurioRigScreen = { cast(trackId?) -> characterId, setCast(trackId, characterId), shown() -> trackId,
     open(on), controller(), together(), setTogether(on), keyThis() } */
(function () {
  if (typeof window === "undefined") return;
  const CAST_KEY = "curiosities-rig3d-cast-v1";
  const VIEW_KEY = "curiosities-rig3d-screen-view-v1";
  const NOBODY = "_film";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const E = () => window.CurioEngine;
  const R = () => window.CurioRig;
  const CS = () => window.CharacterScreen;

  function read(key, d) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return v && typeof v === "object" ? v : d;
    } catch (e) {
      return d;
    }
  }
  function write(key, v) {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch (e) {}
  }
  const castData = () => {
    const c = read(CAST_KEY, {});
    c.cast = c.cast && typeof c.cast === "object" ? c.cast : {};
    return c;
  };

  /* ---------- who is on screen ---------- */
  function characterTracks() {
    try {
      return E() ? E().state().tracks.filter((t) => t.kind === "character") : [];
    } catch (e) {
      return [];
    }
  }
  function shown() {
    const list = characterTracks();
    if (!list.length) return null;
    const p = CS() && CS().track ? CS().track() : null;
    return list.some((t) => t.id === p) ? p : list[0].id;
  }
  /* a character made from words, by its saved id (rig/maker.js) */
  function madeOf(c) {
    const m = /^made:(.+)$/.exec(c || "");
    try {
      return m && R() && R().maker ? R().maker.store().list.find((x) => x.id === m[1]) || null : null;
    } catch (e) {
      return null;
    }
  }
  function cast(trackId) {
    const id = trackId === undefined ? shown() : trackId;
    const c = castData().cast[id || NOBODY];
    const list = (R() && R().CHARACTERS) || [];
    if (madeOf(c)) return c;
    /* before the 3D files have arrived (rig/load.js) the list is empty: keep the saved choice */
    if (!list.length) return c || "rigged-figure";
    return list.some((x) => x.id === c) ? c : list[0].id;
  }
  function setCast(trackId, charId) {
    const c = castData();
    c.cast[trackId || NOBODY] = charId;
    write(CAST_KEY, c);
  }

  /* ---------- the panel ---------- */
  let host = null;
  let ctl = null;
  let ctlFor = "";
  let visible = false;
  let lastAsk = [];
  let selSig = "";
  let waiting = false;
  const isOpen = () => !!read(VIEW_KEY, {}).open;
  /* the other character tracks join the 3D view as more actors (rig/staging.js), unless turned off */
  const together = () => read(VIEW_KEY, {}).together !== false;
  const $ = (s) => host && host.querySelector(`[data-r3s="${s}"]`);

  function css() {
    if (document.getElementById("rig3d-screen-css")) return;
    const st = document.createElement("style");
    st.id = "rig3d-screen-css";
    /* Closed: a slim bar under the Player. Open (on wide screens): the 3D view floats as a small window over the
       Screen that can be dragged anywhere, so the viewers, the Momentum column and the Details keep their room.
       On narrow screens it opens in place under the Player. */
    st.textContent = `.r3s{font-size:.8rem;border-top:1px solid #8884;padding:.3rem .5rem}
.r3s-bar{display:flex;flex-wrap:wrap;gap:.3rem .7rem;align-items:center}
.r3s-bar b{font-weight:600}
.r3s-bar small{opacity:.7}
.r3s-on .r3s-bar small{display:none}
.r3s button{font:inherit;cursor:pointer}
.r3s-body{display:grid;gap:.4rem;margin-top:.3rem}
.r3s-body[hidden]{display:none}
.r3s-side{display:grid;grid-template-columns:1fr 1fr;gap:.3rem .4rem;align-content:start}
.r3s-side label{display:grid;gap:.1rem}
.r3s-side select,.r3s-side input{font:inherit;min-width:0}
.r3s-ask,.r3s-said,.r3s-side [data-r3s="key"],.r3s-side small,.r3s-side .r3s-together,.r3s-beat{grid-column:1/-1}
.r3s-beat textarea{width:100%;box-sizing:border-box;font:inherit;margin:.2rem 0}
.r3s-beat summary{cursor:pointer}
.r3s-ask{display:flex;gap:.3rem}.r3s-ask input{flex:1}
.r3s-said{margin:0;opacity:.85}
.r3s-said:empty{display:none}
.r3s-side small{opacity:.7}
.r3s-host .rig-top,.r3s-host .rig-credit,.r3s-host .rig-panel{display:none}
.r3s-host .rig-main{display:block}
.r3s-host .rig-view canvas{height:min(22vh,190px);min-height:130px}
.r3s-host .rig-viewbar{font-size:.72rem;margin-top:.2rem;gap:.2rem .6rem}
@media (min-width:861px){
.r3s-on .r3s-body{position:fixed;top:6.5rem;right:1rem;width:min(340px,92vw);max-height:min(62vh,540px);overflow:auto;z-index:30;background:var(--cc-panel,var(--panel,#1d1d22));color:var(--cc-text,inherit);border:1px solid #8886;border-radius:.6rem;box-shadow:0 10px 32px #0009;padding:.5rem;box-sizing:border-box}
.r3s-on .r3s-host .rig-view canvas{height:min(30vh,240px)}
.r3s-on .r3s-body{overflow-x:hidden}
.r3s-on .r3s-body *{min-width:0;overflow-wrap:anywhere}
.r3s-on .r3s-side{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
}
/* short screens (laptops at 720 to 800 high): a smaller window, clear of the timeline's tools */
@media (min-width:861px) and (max-height:820px){
.r3s-on .r3s-body{max-height:48vh}
.r3s-on .r3s-host .rig-view canvas{height:20vh;min-height:110px}
}
.r3s-grip{display:flex;align-items:center;gap:.5rem;cursor:move;user-select:none;touch-action:none;font-size:.75rem;opacity:.85}
.r3s-grip span{flex:1}
@media (max-width:860px){.r3s-grip{display:none}}
}`;
    document.head.appendChild(st);
  }

  function mountPanel(el) {
    host = el;
    css();
    el.innerHTML = `<div class="r3s">
      <div class="r3s-bar"><b>3D actors</b><small>Your characters as 3D bodies, acting out the film as it plays.</small>
        <button type="button" data-r3s="toggle" aria-expanded="false">Show 3D</button></div>
      <div class="r3s-body" data-r3s="body" hidden>
        <div class="r3s-grip" data-r3s="grip" title="Drag to move the 3D window"><span>⠿ 3D actors</span><button type="button" data-r3s="hide">Hide 3D</button></div>
        <div class="r3s-host" data-r3s="view"></div>
        <div class="r3s-side">
          <label>Who <select data-r3s="who" title="Which character on the timeline to show"></select></label>
          <label>Played by <select data-r3s="actor" title="Which 3D body or object plays them"></select></label>
          <form class="r3s-ask" data-r3s="ask-form"><input type="text" data-r3s="ask" placeholder="Tell it what to do, e.g. sleepy" aria-label="Tell the 3D character what to do"><button type="submit">Do it</button></form>
          <p class="r3s-said" data-r3s="said" role="status"></p>
          <label class="r3s-together" title="With more than one character on the timeline, the others join the 3D view as more actors (rig/staging.js)"><span><input type="checkbox" data-r3s="together"> Everyone together</span></label>
          <button type="button" data-r3s="key" title="Put what the 3D character is doing now on the timeline, at the playhead, as one step you can undo">Key this on the timeline</button>
          <details class="r3s-beat" data-r3s="beat-box"><summary>Write a whole beat</summary>
            <textarea data-r3s="beat" rows="3" aria-label="The beat in words" placeholder="At a diner at night, Ida (spiky red hair, overalls) sits across from Nessa (curly black hair, yellow hoodie). Nessa says something; Ida does a double take, then laughs."></textarea>
            <button type="button" data-r3s="beat-key" title="Each step of the beat becomes a moment on the timeline, starting at the playhead: feelings, acting moves, who speaks, the set and the camera. One undo takes it back.">Put this beat on the timeline</button>
          </details>
          <small data-r3s="moment"></small>
        </div>
      </div>
    </div>`;
    const toggle = () => {
      const v = read(VIEW_KEY, {});
      v.open = !v.open;
      write(VIEW_KEY, v);
      refresh();
    };
    $("toggle").addEventListener("click", toggle);
    $("hide").addEventListener("click", toggle);
    /* drag the floating 3D window by its top strip; it stays inside the browser window */
    $("grip").addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      const box = $("body");
      const r = box.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      const move = (ev) => {
        box.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx)) + "px";
        box.style.top = Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy)) + "px";
        box.style.right = "auto";
      };
      const up = () => {
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", up);
      };
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
    });
    addEventListener("resize", keepInView);
    $("who").addEventListener("change", (e) => {
      if (CS() && CS().pick && e.target.value !== NOBODY) CS().pick(e.target.value);
      refresh();
    });
    $("actor").addEventListener("change", (e) => {
      setCast(shown(), e.target.value);
      refresh();
    });
    $("ask-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("ask").value.trim();
      if (!ctl || !text) return;
      /* an acting move ("does a double take") plays now and can be keyed; the rest of the words go to the rules */
      const G = R().gestures;
      const move = G ? G.say(text, ctl) : null;
      if (move && !lastAsk.includes("actingLens.move")) lastAsk.push("actingLens.move");
      const rest = move ? move.rest : text;
      const res = rest ? ctl.ask(rest) : { changes: [] };
      Object.keys(R().readRequest(rest).values || {}).forEach((id) => !lastAsk.includes(id) && lastAsk.push(id));
      const said = move ? `Acting move: ${move.id}. ` : "";
      $("said").textContent = res.changes.length
        ? said + "Changed: " + res.changes.join("; ") + ". Where the timeline already says something here, it still wins: press Key this on the timeline to change it there."
        : move
        ? said + "Press Key this on the timeline to play it at this moment of the film."
        : "I did not find anything to change in that. Try a feeling (sleepy, scared), a move (walk, look up) or an acting move (shrug, double take).";
    });
    $("key").addEventListener("click", keyThis);
    $("beat-key").addEventListener("click", () => {
      /* rig/scene.js arrives with the other 3D files on first use (rig/load.js) */
      if (R() && R().loaded && !R().loaded()) {
        $("said").textContent = "Getting the 3D files ready…";
        return void R()
          .load()
          .then(
            () => $("beat-key").click(),
            (e) => ($("said").textContent = e.message)
          );
      }
      const B = window.CurioRigScene;
      const text = $("beat").value.trim() || (B ? B.EXAMPLE : "");
      if (!B || !B.toTimeline) return void ($("said").textContent = "Whole beats need the scene add-on (rig/scene.js).");
      $("beat").value = text;
      const r = B.toTimeline(text);
      $("said").textContent = r.ok ? r.said : r.error;
      selSig = "";
      refresh();
    });
    $("together").checked = together();
    $("together").addEventListener("change", (e) => {
      const v = read(VIEW_KEY, {});
      v.together = e.target.checked;
      write(VIEW_KEY, v);
    });
    if (typeof IntersectionObserver === "function") {
      new IntersectionObserver((list) => {
        visible = list.some((x) => x.isIntersecting);
        refresh();
      }).observe(el);
    } else visible = true;
    refresh();
  }

  function fillSelects() {
    const list = characterTracks();
    const who = shown();
    const c = cast(who);
    const sig = JSON.stringify([list.map((t) => [t.id, t.label]), who, c]);
    if (sig === selSig) return;
    selSig = sig;
    $("who").innerHTML = list.length
      ? list.map((t) => `<option value="${esc(t.id)}"${t.id === who ? " selected" : ""}>${esc(t.label)}</option>`).join("")
      : `<option value="${NOBODY}">The film (no characters on the timeline yet)</option>`;
    let made = [];
    try {
      made = R() && R().maker ? R().maker.store().list : [];
    } catch (e) {}
    $("actor").innerHTML =
      (R() ? R().CHARACTERS : []).map((x) => `<option value="${esc(x.id)}"${x.id === c ? " selected" : ""}>${esc(x.label)}${x.object ? " (an object)" : ""}</option>`).join("") +
      (made.length ? `<optgroup label="Made from your words">${made.map((m) => `<option value="made:${esc(m.id)}"${"made:" + m.id === c ? " selected" : ""}>${esc(m.name)}</option>`).join("")}</optgroup>` : "");
  }

  function stop3D() {
    if (ctl) ctl.stop();
    ctl = null;
    ctlFor = "";
    const v = $("view");
    if (v) v.innerHTML = "";
  }

  /* A dragged 3D window stays reachable when the browser window gets smaller. */
  function keepInView() {
    const box = host && $("body");
    if (!box || !box.style.left) return;
    const r = box.getBoundingClientRect();
    box.style.left = Math.max(0, Math.min(innerWidth - Math.min(r.width, innerWidth), parseFloat(box.style.left) || 0)) + "px";
    box.style.top = Math.max(0, Math.min(innerHeight - 40, parseFloat(box.style.top) || 0)) + "px";
  }

  /* Start, swap or stop the 3D view so it matches what should be shown. */
  function refresh() {
    if (!host) return;
    keepInView();
    const open = isOpen();
    $("toggle").textContent = open ? "Hide 3D" : "Show 3D";
    $("toggle").setAttribute("aria-expanded", String(open));
    $("body").hidden = !open;
    host.firstElementChild.classList.toggle("r3s-on", open);
    const scr = window.CurioScreen;
    const live = open && visible && (!scr || !scr.isOpen || scr.isOpen()) && !!R();
    if (!live) return stop3D();
    /* the 3D files arrive on first use (rig/load.js); show the view once they are in */
    if (R().loaded && !R().loaded()) {
      if (waiting) return;
      waiting = true;
      $("moment").textContent = "Getting the 3D view ready…";
      R()
        .load()
        .then(
          () => {
            waiting = false;
            selSig = "";
            refresh();
          },
          (e) => {
            waiting = false;
            $("moment").textContent = e.message;
          }
        );
      return;
    }
    fillSelects();
    const who = shown();
    const r = scr && scr.row ? scr.row() : 0;
    const name = who ? (characterTracks().find((t) => t.id === who) || {}).label : "";
    $("moment").textContent = `Showing moment ${r + 1}${name ? " for " + name : ""}.`;
    const c = cast(who);
    const m = madeOf(c);
    const want = (who || NOBODY) + "|" + c + (m ? "|" + m.text : "");
    if (ctl && ctlFor === want) return;
    stop3D();
    ctlFor = want;
    /* a character made from words plays as "Made from your words", with that one picked */
    if (m && R().maker.remember) R().maker.remember(m.name, null, true);
    ctl = R().mount($("view"), { character: m ? "made" : c, track: () => shown(), screen: true });
  }

  /* ---------- Key this on the timeline: what the 3D character does now, as nodes at the playhead ---------- */
  function keyThis() {
    const scr = window.CurioScreen;
    const Eng = E();
    const S = window.CurioScale;
    if (!ctl || !Eng || !scr) return null;
    const st = Eng.state();
    const r = st.rows[scr.row()];
    if (!r) return ($("said").textContent = "There is no moment at the playhead."), null;
    const own = ctl.ctx.prefs.values;
    const tl = ctl.timeline();
    const who = shown();
    const tr = who ? st.tracks.find((t) => t.id === who) : null;
    const cmds = [];
    const words = [];
    let added = 0;
    let full = false;
    R().SLIDERS.forEach((s) => {
      const n = s.scale.length - 1;
      const word = s.scale[Math.round((own[s.id] || 0) * n)];
      const here = tl[s.id] != null ? s.scale[Math.round(tl[s.id] * n)] : s.scale[s.start];
      /* only what this actor was told here: the 3D window's other settings are shared and may be left over */
      if (!lastAsk.includes(s.id) || word === here) return;
      const id = s.lane || s.id; /* the lane it is keyed on (Eyelines: eyeline.setting) */
      const val = S ? S.fix(id, word) : word;
      if (val == null) return;
      let track = null;
      if (tr) {
        if (tr.curiosities.includes(id)) track = tr.id;
        else if (tr.curiosities.length + added < Eng.LIMIT.perTrack) {
          cmds.push({ type: "addCuriosity", track: tr.id, curiosity: id });
          added++;
          track = tr.id;
        }
      } else {
        const any = st.tracks.find((t) => t.curiosities.includes(id));
        if (any) track = any.id;
        else if (window.CurioLanes && (track = window.CurioLanes.trackFor(id, st))) cmds.push({ type: "addCuriosity", track, curiosity: id });
      }
      if (!track) return (full = true);
      cmds.push({ type: "setPoint", row: r.id, track, curiosity: id, value: val });
      words.push(`${s.label}: ${word}`);
    });
    if (!cmds.length) {
      $("said").textContent = full ? "That character's track is full; remove a lane in Arrange first." : !lastAsk.length
        ? "Tell it what to do first (for example sleepy), then press Key this on the timeline."
        : "Nothing new to put on the timeline: the 3D character already does what the timeline says here.";
      return null;
    }
    const res = Eng.send({ type: "batch", label: `3D: ${words.length} node${words.length === 1 ? "" : "s"} at moment ${scr.row() + 1}`, commands: cmds });
    lastAsk = [];
    $("said").textContent = res.ok ? `On the timeline at moment ${scr.row() + 1}: ${words.join("; ")}.` : "Could not put it on the timeline: " + res.error;
    return res;
  }

  /* ---------- dock into the Screen once it exists (screen/load.js loads after this file) ---------- */
  let tries = 0;
  function dock() {
    const scr = window.CurioScreen;
    if (!scr || !scr.addPanel) return void (++tries < 400 && setTimeout(dock, 50));
    scr.addPanel({ id: "rig3d", label: "3D actors", place: "under", mount: mountPanel });
    scr.on(() => refresh());
    if (E() && E().on) E().on(() => host && isOpen() && refresh());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", dock);
  else setTimeout(dock, 0);

  window.CurioRigScreen = {
    CAST_KEY,
    cast,
    setCast(trackId, charId) {
      setCast(trackId, charId);
      refresh();
    },
    shown,
    open(on) {
      const v = read(VIEW_KEY, {});
      v.open = on !== false;
      write(VIEW_KEY, v);
      refresh();
    },
    controller: () => ctl,
    together,
    setTogether(on) {
      const v = read(VIEW_KEY, {});
      v.together = on !== false;
      write(VIEW_KEY, v);
      if ($("together")) $("together").checked = v.together;
    },
    keyThis,
  };
})();
