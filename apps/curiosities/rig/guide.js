/* rig/guide.js: "Start here", an add-on for the 3D characters view (CurioRig.extend).

   The 3D view has grown many parts (a character from words, faces, acting moves, several actors, sets, a whole
   scene from one sentence, sketch looks and the storyboard, feet and hands, lights, forces, the camera). Someone
   new to 3D and film words opens it and sees a wall of sliders. This is the first thing they see instead: a short
   panel at the top of the side column with one-click examples ("Try this" cards). Each card runs through the
   other add-ons' own APIs, so what it shows is exactly what those panels do, then says in plain words what just
   happened and what to try next, with "Show me where" to scroll to the panel that did it:
   - Make a character from words: Ida, red hair and a country look (maker.js, by its own panel, so the panel and
     its list show her).
   - A whole scene from one sentence: the diner beat (scene.js: CurioRigScene.playWords).
   - A double take (gestures.js: CurioRig.gestures.play).
   - A feeling on the face: Sad all the way up (faces.js's sliders, moved like a person would).
   - Face to face, with a close-up, and the 180-degree line shown (scene.js words, then CurioRigStaging.line).
   - A country road at sunset (sets.js, through its panel's "Keep as a new one", so the person's own set is kept).
   - A pencil flip book to the storyboard (snapshot.js: Sketch look pencil while a double take plays, then
     CurioRigSnapshot.flipBook; the look goes back to what it was).
   - Put the beat on the timeline (scene.js: CurioRigScene.toTimeline).
   A part that is not loaded (or a page without the storyboard or the timeline) gets a plain sentence, never an
   error.

   Words: a small popover of the film and 3D words these panels use, one plain line each. The words come from the
   app's glossary (glossary.js, window.CuriosityGlossary.terms), the same ones its dotted underlines explain; this
   file only picks which ones. The panel sits on the page like any other, so the glossary's underlines reach the
   cards' sentences too.

   Where it sits: wire moves the section to the top of the side column (.rig-panel), above "Tell it what you want".
   On a phone the side column is under the 3D picture, so the guide never pushes the picture off the screen. On
   the Screen's small 3D panel the side column is hidden, and so is this.

   Hide or show it: remembered on this device only, in localStorage "curio-rig3d-guide-v1" ({ open }), outside the
   "curiosities-" prefix so a project file does not carry it.

   window.CurioRigGuide = { CARDS, WORDS, KEY, run(id, ctx?) -> Promise<{ ok, said }>, open(on?, ctx?) -> boolean,
     words(on?, ctx?) } for tests. */
(function () {
  const R = window.CurioRig;
  if (!R || !R.extend) return;
  const ID = "guide";
  const KEY = "curio-rig3d-guide-v1";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function readOpen() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}");
      return !(v && v.open === false);
    } catch (e) {
      return true;
    }
  }
  function writeOpen(on) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ open: !!on }));
    } catch (e) {
      /* private window: it stays as it is for this visit */
    }
  }

  /* The red-haired country character, the same Ida in every card. */
  const IDA = "spiky red hair, a country look, a plaid shirt, overalls, a straw hat and brown boots";
  const IDA_SHORT = "spiky red hair, a country look, overalls";
  const NESSA = "curly black hair, yellow hoodie";
  const DINER = `At a diner at night, Ida (${IDA_SHORT}) sits across from Nessa (${NESSA}). Nessa says something; Ida does a double take, then laughs.`;
  const FACING = `Ida (${IDA_SHORT}) stands facing Nessa (${NESSA}). Close-up on Ida. Nessa says something; Ida smiles.`;
  const ROAD = "a dusty country road with a wooden fence and a big tree at sunset";

  const need = (name) => {
    if (!window[name] && !(name === "gestures" && R.gestures) && !(name === "maker" && R.maker)) throw new Error("soft:That part of the 3D view is still loading. Try again in a moment.");
  };
  const ext = (ctx, id) => ctx.el.querySelector(`[data-ext="${id}"]`);
  const ready = async () => {
    const c = R.current();
    if (c && c.ready) await c.ready;
  };

  /* Each card: what it shows, what to try next, which panel did it, and how to run it (-> a sentence of what
     happened, or throws "soft:..." with a plain reason). */
  const CARDS = [
    {
      id: "character",
      title: "A character from words",
      shows: "Builds Ida, red hair and a country look, from one line of words, on a skeleton so every rule moves her.",
      next: "Change a word in Make a character from words (“curly”, “a cowboy hat”) and press Make it again.",
      where: "maker",
      async run(ctx) {
        need("maker");
        const box = ext(ctx, "maker");
        const kept = R.maker.remember("Ida", IDA, true);
        if (!kept) throw new Error("soft:Your list of characters is full: delete one in Make a character from words, then try again.");
        const name = box && box.querySelector('[data-maker="name"]');
        const text = box && box.querySelector('[data-maker="text"]');
        const make = box && box.querySelector('[data-maker="make"]');
        if (!make) throw new Error("soft:Make a character from words is not in this 3D view.");
        name.value = "Ida";
        text.value = IDA;
        make.click();
        await ready();
        return "Ida is built from your words: red spiky hair, plaid shirt, overalls, straw hat and boots.";
      },
    },
    {
      id: "diner",
      title: "A whole scene from one sentence",
      shows: "One sentence becomes a diner at night: two people, who speaks, a double take and a laugh, in order.",
      next: "Change what happens (“Nessa shrugs”) in Make a whole scene from words and press Play the beat.",
      where: "scene",
      async run(ctx) {
        need("CurioRigScene");
        const t = ext(ctx, "scene") && ext(ctx, "scene").querySelector('[data-scene="text"]');
        if (t) t.value = DINER;
        ctx.prefs.sceneText = DINER;
        ctx.save();
        const secs = await CurioRigScene.playWords(ctx, DINER);
        return `The diner scene is built and playing (about ${Math.max(1, Math.round(secs || 0))} seconds).`;
      },
    },
    {
      id: "take",
      title: "A double take",
      shows: "The classic comedy look: a glance, a pause, then a snap back with wide eyes.",
      next: "In Acting moves, set Comedy timing to “a long beat”, then press double take.",
      where: "gestures",
      async run(ctx) {
        need("gestures");
        await ready();
        if (!R.gestures.play({ ctx }, "double take")) throw new Error("soft:Acting moves could not play it on this character.");
        return "Playing a double take.";
      },
    },
    {
      id: "feeling",
      title: "A feeling on the face",
      shows: "The character looks sad: the brows tilt up, the mouth turns down and the head sinks.",
      next: "In Face and feelings, slide Sad down and Happy up, or try Surprised.",
      where: "row:feelingFaceLens.sad",
      async run(ctx) {
        await ready();
        const F = "feelingFaceLens.";
        const sad = ctx.el.querySelector(`[data-slider="${F}sad"]`);
        if (!sad) throw new Error("soft:Face and feelings is not in this 3D view.");
        ["happy", "angry", "scared", "surprised", "disgust", "sad"].forEach((k) => {
          const inp = ctx.el.querySelector(`[data-slider="${F}${k}"]`);
          if (!inp) return;
          inp.value = k === "sad" ? inp.max : "0";
          inp.dispatchEvent(new Event("input", { bubbles: true }));
        });
        return "The face shows Sad, all the way up.";
      },
    },
    {
      id: "facing",
      title: "Face to face, with a close-up",
      shows: "Two people facing each other, a close-up on Ida, and the 180-degree line drawn on the floor.",
      next: "Drag the picture around them: the line turns red when the camera crosses it.",
      where: "staging",
      async run(ctx) {
        need("CurioRigScene");
        if (window.CurioRigSets) CurioRigSets.clear(ctx);
        const sets = ext(ctx, "sets");
        const mk = sets && sets.querySelector('[data-sets="make"]');
        if (mk) mk.textContent = "Build this set";
        const t = ext(ctx, "scene") && ext(ctx, "scene").querySelector('[data-scene="text"]');
        if (t) t.value = FACING;
        ctx.prefs.sceneText = FACING;
        ctx.save();
        await CurioRigScene.playWords(ctx, FACING);
        if (window.CurioRigStaging && CurioRigStaging.line) CurioRigStaging.line(true, 0, 1, { ctx });
        return "Ida and Nessa face each other in a close-up, with the 180-degree line on the floor.";
      },
    },
    {
      id: "road",
      title: "A country road at sunset",
      shows: "A set from words: a dusty road, a wooden fence and a big tree in warm sunset light.",
      next: "In Make a set from words, change “sunset” to “night” and build it again.",
      where: "sets",
      async run(ctx) {
        need("CurioRigSets");
        const box = ext(ctx, "sets");
        const q = (n) => box && box.querySelector(`[data-sets="${n}"]`);
        if (!q("text")) throw new Error("soft:Make a set from words is not in this 3D view.");
        /* a set with these words already in the list is picked again; otherwise it is kept as a new one, so the
           person's own set is never written over */
        const s = R.sets.store();
        const have = s.list.find((x) => x.text === ROAD);
        if (have) box.querySelector(`[data-sets-pick="${CSS.escape(have.id)}"]`).click();
        else {
          q("text").value = ROAD;
          q("new").click();
        }
        if (!CurioRigSets.state(ctx).on) throw new Error("soft:" + (q("said").textContent || "The set could not be built."));
        return "The country road is built around the character, lit for sunset.";
      },
    },
    {
      id: "flip",
      title: "A pencil flip book",
      shows: "Draws a double take in pencil and sends 12 drawings to the storyboard as a new scene.",
      next: "Open the Storyboard and flip through it, or try the “marker” look.",
      where: "snapshot",
      async run(ctx) {
        need("CurioRigSnapshot");
        if (!window.CuriosityStoryboard) throw new Error("soft:The storyboard is not on this page, so there is nowhere to send the drawings.");
        await ready();
        const was = ctx.prefs.sketchLook || "off";
        CurioRigSnapshot.setLook(ctx, "pencil");
        try {
          await wait(120);
          if (R.gestures) R.gestures.play({ ctx }, "double take");
          /* 12 drawings spread over the whole move (at least 1/8 s apart) */
          const g = R.gestures && R.gestures.state({ ctx });
          const gap = Math.max(1 / 8, Math.min(0.5, ((g && g.total) || 1.5) / 12));
          const r = await CurioRigSnapshot.flipBook(ctx, { count: 12, gap });
          if (!r || r.error) throw new Error("soft:" + ((r && r.error) || "The flip book could not be sent."));
          return `A pencil flip book of ${r.count} drawings is now scene ${r.si + 1} of the storyboard.`;
        } finally {
          CurioRigSnapshot.setLook(ctx, was);
        }
      },
    },
    {
      id: "timeline",
      title: "Put the beat on the timeline",
      shows: "Writes the diner beat into the film's timeline at the playhead: feelings, moves, who speaks, place and camera.",
      next: "Close this window and press play on the Screen: the 3D actors act it from the timeline.",
      where: "scene",
      async run(ctx) {
        need("CurioRigScene");
        const r = CurioRigScene.toTimeline(DINER);
        if (!r || !r.ok) {
          const why = (r && r.error) || "";
          throw new Error("soft:" + (/not on this page/.test(why) ? "The timeline (the Screen) is not open on this page. Open the Screen, then try this again." : why || "It could not be put on the timeline."));
        }
        return r.said || "The beat is on the timeline.";
      },
    },
  ];

  /* The words these panels use, as glossary terms (glossary.js holds the explanations). */
  const WORDS = ["skeleton", "joint", "rig", "IK", "pose", "eyeline", "blocking", "180-degree line", "close-up", "medium shot", "wide shot", "over-the-shoulder", "dutch angle", "beat", "double take", "storyboard", "flip book", "lane", "keyframe", "playhead"];
  function wordList() {
    const G = window.CuriosityGlossary;
    const terms = (G && G.terms) || [];
    return WORDS.map((w) => {
      const lw = w.toLowerCase();
      const t = terms.find((x) => x.term.toLowerCase() === lw) || terms.find((x) => (x.aka || []).some((a) => a.toLowerCase() === lw));
      return t ? { term: w, text: t.text } : null;
    }).filter(Boolean);
  }

  if (!document.getElementById("rig-guide-css")) {
    const css = document.createElement("style");
    css.id = "rig-guide-css";
    css.textContent = `.rig-ext.rig-guide{position:relative;border-top:0;margin-top:0;padding:.45rem .55rem .5rem;border:1px solid #e8a03899;border-radius:.5rem;background:#e8a03814}
.rig-guide-h{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}
.rig-guide .rig-guide-h h4{margin:0;flex:1 1 auto}
.rig-guide-h button{font:inherit;font-size:.78rem;padding:.12rem .55rem;border:1px solid #8888;border-radius:999px;background:transparent;color:inherit;cursor:pointer}
.rig-guide-h button[aria-expanded="true"]{background:#e8a03833;border-color:#e8a038}
.rig-guide .cap{margin:.25rem 0}
.rig-guide-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));gap:.35rem;margin:.35rem 0 .2rem}
.rig-guide-card{display:flex;flex-direction:column;gap:.15rem;padding:.35rem .45rem;border:1px solid #8885;border-radius:.4rem;background:var(--cc-panel,var(--panel,#fff))}
.rig-guide-card b{font-size:.84rem}
.rig-guide-card p{margin:0;font-size:.76rem;line-height:1.3}
.rig-guide-card p.nx{opacity:.8}
.rig-guide-card p.nx::before{content:"Then try: ";font-weight:600}
.rig-guide-card button{align-self:flex-start;margin-top:auto;font:inherit;font-size:.8rem;font-weight:600;padding:.12rem .65rem;border:1px solid #e8a038;border-radius:999px;background:#e8a03833;color:inherit;cursor:pointer}
.rig-guide-card button:disabled{opacity:.55;cursor:progress}
.rig-guide-card[data-done] button::after{content:" ✓"}
.rig-guide-out{margin:.3rem 0 0;font-size:.8rem;min-height:1.2em}
.rig-guide-out button{font:inherit;font-size:.78rem;margin-left:.35rem;padding:.05rem .5rem;border:1px solid #8888;border-radius:999px;background:transparent;color:inherit;cursor:pointer}
.rig-guide-words{position:absolute;z-index:3;left:.4rem;right:.4rem;top:2.3rem;max-height:min(22rem,60vh);overflow:auto;padding:.5rem .65rem;border:1px solid #888;border-radius:.45rem;background:var(--cc-panel,var(--panel,#fff));box-shadow:0 6px 18px #0004;font-size:.8rem}
.rig-guide-words[hidden]{display:none}
.rig-guide-words dl{margin:.2rem 0 0;display:grid;grid-template-columns:minmax(0,7.5rem) minmax(0,1fr);gap:.25rem .6rem}
.rig-guide-words dt{font-weight:600}
.rig-guide-words dd{margin:0;line-height:1.35}
.rig-guide-words .wh{display:flex;justify-content:space-between;align-items:center;gap:.4rem}
.rig-guide-words .wh button{font:inherit;font-size:.78rem;padding:.05rem .5rem;border:1px solid #8888;border-radius:999px;background:transparent;color:inherit;cursor:pointer}
.rig-guide.is-closed .rig-guide-body{display:none}
.rig-flash{outline:2px solid #e8a038;outline-offset:3px;border-radius:.3rem;transition:outline-color 1.2s}
@media (max-width:420px){.rig-guide-words dl{grid-template-columns:1fr}.rig-guide-words dd{margin-bottom:.3rem}}`;
    document.head.appendChild(css);
  }

  /* per view (ctx.data is reset on each load, and this must outlive a character change) */
  const STATE = new WeakMap();
  function G(ctx) {
    if (!STATE.has(ctx)) STATE.set(ctx, {});
    return STATE.get(ctx);
  }

  function wordsHtml() {
    const list = wordList();
    return `<div class="wh"><b>Words used here</b><button type="button" data-guide="words-close">Close</button></div>
      <p class="cap">Film and 3D words, in one plain line each. Words with a dotted line under them anywhere in the app explain themselves too.</p>
      ${list.length ? `<dl>${list.map((w) => `<dt>${esc(w.term)}</dt><dd>${esc(w.text)}</dd>`).join("")}</dl>` : `<p>The word list is still loading.</p>`}`;
  }

  R.extend({
    id: ID,
    label: "Start here",
    panel() {
      const open = readOpen();
      return `<div class="rig-guide-h">
          <h4>Start here</h4>
          <button type="button" data-guide="words" aria-expanded="false" aria-controls="rig-guide-words" title="What the film and 3D words mean">Words</button>
          <button type="button" data-guide="toggle" aria-expanded="${open}">${open ? "Hide" : "Show"}</button>
        </div>
        <div class="rig-guide-words" data-guide="words-box" data-gl-skip hidden role="dialog" aria-label="Words used here"></div>
        <div class="rig-guide-body">
          <p class="cap">New to 3D? Press any “Try this”: each runs a short example with the tools below.</p>
          <div class="rig-guide-cards">${CARDS.map(
            (c) => `<div class="rig-guide-card" data-card="${c.id}"><b>${esc(c.title)}</b><p>${esc(c.shows)}</p><p class="nx">${esc(c.next)}</p><button type="button" data-guide-run="${c.id}">Try this</button></div>`
          ).join("")}</div>
          <p class="rig-guide-out" data-guide="out" role="status"></p>
        </div>`;
    },
    wire(ctx, sec) {
      sec.classList.add("rig-guide");
      /* first in the side column, above Tell it what you want (and only once, should the panels be drawn again) */
      const side = ctx.el.querySelector(".rig-panel");
      if (side) {
        side.querySelectorAll(`.rig-guide[data-ext="${ID}"]`).forEach((x) => x !== sec && x.remove());
        side.insertBefore(sec, side.firstChild);
      }
      const q = (n) => sec.querySelector(`[data-guide="${n}"]`);
      const d = G(ctx);
      d.sec = sec;
      const setOpen = (on) => {
        sec.classList.toggle("is-closed", !on);
        q("toggle").setAttribute("aria-expanded", String(on));
        q("toggle").textContent = on ? "Hide" : "Show";
        q("toggle").title = on ? "Fold Start here away (it stays folded next time)" : "Show the Try this examples";
        if (!on) setWords(false);
      };
      const setWords = (on) => {
        const box = q("words-box");
        if (on) box.innerHTML = wordsHtml();
        box.hidden = !on;
        q("words").setAttribute("aria-expanded", String(!!on));
      };
      d.setOpen = (on) => {
        writeOpen(on);
        setOpen(on);
      };
      d.setWords = setWords;
      setOpen(readOpen());
      q("toggle").addEventListener("click", () => d.setOpen(sec.classList.contains("is-closed")));
      q("words").addEventListener("click", () => setWords(q("words-box").hidden));
      sec.addEventListener("click", (e) => {
        if (e.target.closest('[data-guide="words-close"]')) {
          setWords(false);
          q("words").focus();
        }
        const runB = e.target.closest("[data-guide-run]");
        if (runB) run(runB.dataset.guideRun, ctx);
        const where = e.target.closest("[data-guide-where]");
        if (where) showWhere(ctx, where.dataset.guideWhere);
      });
      sec.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !q("words-box").hidden) {
          e.preventDefault();
          e.stopPropagation(); /* close the popover, not the 3D window */
          setWords(false);
          q("words").focus();
        }
      });
    },
  });

  function showWhere(ctx, id) {
    const box = /^row:/.test(id) ? ctx.el.querySelector(`[data-row="${CSS.escape(id.slice(4))}"]`) : ctx.el.querySelector(`[data-ext="${id}"]`);
    if (!box) return;
    box.scrollIntoView({ block: "start", behavior: "smooth" });
    box.classList.add("rig-flash");
    setTimeout(() => box.classList.remove("rig-flash"), 1600);
  }

  async function run(id, ctx) {
    ctx = ctx || (R.current() && R.current().ctx);
    const card = CARDS.find((c) => c.id === id);
    if (!ctx || !card) return { ok: false, said: "No such example." };
    const d = G(ctx);
    const sec = d.sec;
    const out = sec && sec.querySelector('[data-guide="out"]');
    const btns = sec ? [...sec.querySelectorAll("[data-guide-run]")] : [];
    if (d.busy) return { ok: false, said: "One example is still running." };
    d.busy = true;
    btns.forEach((b) => (b.disabled = true));
    if (out) out.textContent = `Working on “${card.title}”…`;
    let res;
    try {
      const said = await card.run(ctx);
      res = { ok: true, said };
      const el = sec && sec.querySelector(`[data-card="${id}"]`);
      if (el) el.dataset.done = "";
    } catch (e) {
      const m = String((e && e.message) || e);
      res = { ok: false, said: /^soft:/.test(m) ? m.slice(5) : "That example stopped: " + m };
      if (!/^soft:/.test(m)) console.warn("3D add-on guide (" + id + "): " + m);
    } finally {
      d.busy = false;
      btns.forEach((b) => (b.disabled = false));
    }
    if (out) {
      out.innerHTML = res.ok ? `<b>Done.</b> ${esc(res.said)} <b>Then try:</b> ${esc(card.next)}<button type="button" data-guide-where="${card.where}">Show me where</button>` : esc(res.said);
    }
    return res;
  }

  window.CurioRigGuide = {
    CARDS,
    WORDS,
    KEY,
    TEXT: { IDA, DINER, FACING, ROAD },
    wordList,
    run: (id, ctx) => run(id, ctx),
    open(on, ctx) {
      ctx = ctx || (R.current() && R.current().ctx);
      const d = ctx && G(ctx);
      if (d && d.setOpen && on != null) d.setOpen(!!on);
      return d && d.sec ? !d.sec.classList.contains("is-closed") : readOpen();
    },
    words(on, ctx) {
      ctx = ctx || (R.current() && R.current().ctx);
      const d = ctx && G(ctx);
      if (d && d.setWords) d.setWords(!!on);
    },
  };
})();
