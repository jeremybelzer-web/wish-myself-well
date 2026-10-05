/* voice/voice.js: talk to Curiomatic. Say what you want and the app does it.

   The 🎤 in the bottom-left corner (or Alt+V, ⌥V on a Mac) listens for one command; "Hands-free" keeps
   listening, one command per sentence, until you say "stop listening". The same box takes typed commands,
   so it also works where the browser has no speech (Firefox, the desktop app). Speech uses the browser's own
   free recognizer (Chrome and Edge send the sound to their maker's servers to turn it into words; Safari works
   on the device); nothing here is paid and nothing is kept.

   What it can reach, in the order it tries:
     1. The fixed shapes: "go to moment 12", "undo 3 times", "next moment", "type a title", "pick 2", "help".
     2. Things other parts of the app registered: CurioCommands.register / CurioCommands.mappable (below).
     3. A curiosity and what you want from it: "shot size closer", "make the emotion sadder", "set lens
        length to 85". It opens that curiosity's window and puts the words in its "Say what you want" box,
        the same plain-words reader (screen/windows.js), so it is one undo step like a typed request.
     4. Plain-words phrases written for every curiosity (data/windows/say-*.js), said on their own:
        "let it breathe", "punch in on the big line".
     5. Every action of the Screen's Quick find (⌘K): menus, toolbar buttons, shortcuts, moments, markers,
        curiosities ("look through color") and suites.
     6. Anything you can see and press: every visible button, tab, menu item, checkbox and dropdown choice,
        by its words or its tooltip. So a feature added tomorrow is reachable by voice with no extra code.
   When two things fit about as well, it shows the best three and you say "1", "2" or "3" (or click one).

   window.CurioCommands (for every part of the app, now and later):
     register({ id, label, words?, group?, run(text) })   one thing voice (and later triggers) can do
     register([...])                                      many at once
     mappable(id, label, run, opts?)                      the music app's name for the same call; opts can
                                                          carry { words, group, get(), set(v) } so a trigger,
                                                          a MIDI pad or a voice "set X to 40" can drive it
     provider(fn)                                         fn() returns a list of things, asked fresh each time
     unregister(id), list()
   window.CurioVoice: hear(text) (run a command as if spoken; returns what was done), find(text) (the ranked
   matches, nothing run), listen(), stop(), handsFree(on), open(), close(), supported(), history(). */
(function () {
  if (window.CurioVoice) return;
  const W = window.CurioVoiceWords;
  const PREF = "curiosities-voice-v1"; /* { handsFree: false, talkBack: false } (a view setting; travels in the .curio file) */

  /* ---------- the registry ---------- */
  const reg = new Map();
  const providers = [];
  const CurioCommands = window.CurioCommands || {
    register(x) {
      (Array.isArray(x) ? x : [x]).forEach((it) => it && it.id && it.label && typeof it.run === "function" && reg.set(String(it.id), Object.assign({ group: "app" }, it)));
      return CurioCommands;
    },
    mappable(id, label, run, opts) {
      const o = opts || {};
      return CurioCommands.register(Object.assign({}, o, { id, label, run: run || (o.set ? () => o.set(1) : () => {}) }));
    },
    provider(fn) {
      if (typeof fn === "function") providers.push(fn);
      return CurioCommands;
    },
    unregister(id) {
      reg.delete(String(id));
    },
    list() {
      return [...reg.values()];
    },
  };
  window.CurioCommands = CurioCommands;

  /* ---------- what is on the page right now ---------- */
  const ours = (el) => !!(el.closest && el.closest(".vo-root"));
  const visible = (el) => !!(el.getClientRects && el.getClientRects().length) && getComputedStyle(el).visibility !== "hidden";
  function nameOf(el) {
    const own = el.getAttribute("aria-label") || "";
    let txt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    if (txt.length > 70) txt = txt.slice(0, 70);
    let lab = "";
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l) lab = l.textContent.replace(/\s+/g, " ").trim();
    }
    if (!lab && el.closest("label")) lab = el.closest("label").textContent.replace(/\s+/g, " ").trim();
    const name = own || lab || txt || el.getAttribute("title") || el.getAttribute("placeholder") || "";
    return { name, also: [el.getAttribute("title"), own ? txt : "", el.dataset && el.dataset.act ? el.dataset.act.replace(/[-_]/g, " ") : ""].filter(Boolean).join(" ") };
  }
  const CONTROL = "button,a[href],select,input[type=checkbox],input[type=radio],input[type=range],input[type=number],summary,[role=button],[role=tab],[role=menuitem],[role=option],[role=switch]";
  /* A full-window layer (the Screen, a tool window) hides the page under it: only what is on top counts. A
     control on view must be the thing a click there would hit; one scrolled out of view must sit in the same
     top layer as the middle of the window. */
  function fixedOf(el) {
    for (let e = el; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).position === "fixed" && !ours(e)) return e;
    return null;
  }
  function onTop(el, layer) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x >= 0 && y >= 0 && x < innerWidth && y < innerHeight) {
      const hit = document.elementFromPoint(x, y);
      if (!hit) return false;
      if (el === hit || el.contains(hit) || hit.contains(el) || ours(hit)) return true;
      /* A label over its checkbox, or a select's own box. */
      return !!(hit.closest("label") && hit.closest("label").contains(el));
    }
    return !layer || layer.contains(el);
  }
  function pageItems() {
    const out = [];
    let n = 0;
    const mid = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    const layer = mid && !ours(mid) ? fixedOf(mid) : null;
    document.querySelectorAll(CONTROL).forEach((el) => {
      if (n > 3000 || ours(el) || el.disabled || !visible(el) || !onTop(el, layer)) return;
      const { name, also } = nameOf(el);
      const tag = el.tagName.toLowerCase();
      if (tag === "select") {
        const what = name.replace(/\s+/g, " ").slice(0, 40);
        [...el.options].forEach((o, i) => {
          if (o.disabled || !o.textContent.trim()) return;
          n++;
          out.push({ id: "dom:" + n, group: "page", label: o.textContent.trim(), words: what + " " + also, el, kind: "option", i, dedupe: what, run: () => pickOption(el, i) });
        });
        return;
      }
      if (!name || name.length < 2) return;
      n++;
      const kind = tag === "input" ? el.type : "press";
      out.push({ id: "dom:" + n, group: "page", label: name, words: also, el, kind, boost: 0.5, dedupe: kind === "press" ? "" : kind, run: () => press(el) });
    });
    return out;
  }
  function press(el) {
    if (el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    flash(el);
    el.click();
  }
  function pickOption(sel, i) {
    sel.selectedIndex = i;
    flash(sel);
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function setInput(el, v) {
    const min = el.min !== "" ? Number(el.min) : -Infinity;
    const max = el.max !== "" ? Number(el.max) : Infinity;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(el, String(Math.max(min, Math.min(max, v))));
    flash(el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function flash(el) {
    try {
      el.classList.add("vo-flash");
      setTimeout(() => el.classList.remove("vo-flash"), 900);
    } catch (e) {}
  }

  /* ---------- the Screen, curiosities and their phrases ---------- */
  const SC = () => window.CurioScreen;
  const screenOpen = () => !!(SC() && SC().isOpen && SC().isOpen());
  const Lv = () => window.CurioLevels;
  function screenItems() {
    if (!screenOpen() || typeof SC().commands !== "function") return [];
    try {
      return SC()
        .commands()
        .map((it) => Object.assign({}, it, { words: [it.sub, it.words, it.keys ? "" : ""].filter(Boolean).join(" "), group: "screen:" + it.group, boost: it.group === "act" ? 1 : it.group === "moment" ? -1 : 0 }));
    } catch (e) {
      return [];
    }
  }
  let curIndex = null;
  let curIndexAt = 0;
  /* Every curiosity's name (and short name), longest first, so "camera move speed" beats "camera move". */
  function curiosities() {
    const L = Lv();
    if (!L || !L.items) return [];
    if (curIndex && Date.now() - curIndexAt < 30000) return curIndex;
    const list = [];
    L.items("curiosity").forEach((c) => {
      [c.label, c.short].filter(Boolean).forEach((nm) => {
        const n = W.norm(nm.replace(/\([^)]*\)/g, " "));
        if (n.length >= 3) list.push({ n, c });
      });
    });
    list.sort((a, b) => b.n.length - a.n.length);
    curIndex = list;
    curIndexAt = Date.now();
    return list;
  }
  /* "make the shot size closer" -> { c: shotSize, rest: "make the closer" }. Whole words only. */
  function findCuriosity(t) {
    const pad = " " + t + " ";
    for (const x of curiosities()) {
      const at = pad.indexOf(" " + x.n + " ");
      if (at >= 0) return { c: x.c, rest: (pad.slice(0, at) + " " + pad.slice(at + x.n.length + 1)).replace(/\s+/g, " ").trim() };
    }
    return null;
  }
  function phraseItems() {
    const P = window.CuriosityWindows && window.CuriosityWindows.phrases;
    const L = Lv();
    if (!P || !L) return [];
    const out = [];
    /* The curiosity you are looking through (Details) or whose window is on top wins a tie. */
    let focus = "";
    try {
      const st = screenOpen() && SC().state();
      const wins = screenOpen() && SC().wins ? SC().wins() : [];
      focus = wins.length ? wins[wins.length - 1] : st && st.sel && st.sel.level === "curiosity" ? st.sel.id : "";
    } catch (e) {}
    Object.keys(P).forEach((cid) => {
      const c = L.get("curiosity", cid);
      if (!c) return;
      const boost = cid === focus ? 3 : 0;
      Object.keys(P[cid]).forEach((ph) => out.push({ id: "say:" + cid + ":" + ph, group: "phrase", label: ph, words: c.label, dedupe: cid, cid, boost, run: (text) => sayTo(c, text && (" " + W.norm(text) + " ").includes(" " + W.norm(ph) + " ") ? text : ph) }));
    });
    return out;
  }
  /* Opens the curiosity's window and hands the words to its own "Say what you want" box. */
  function sayTo(c, text0) {
    /* Close to one of this curiosity's own phrases ("make the sadder" ~ "make it sadder"): use the phrase. */
    let text = text0;
    const P = (window.CuriosityWindows && window.CuriosityWindows.phrases && window.CuriosityWindows.phrases[c.id]) || {};
    const best = W.rank(text0, Object.keys(P).map((ph) => ({ label: ph })), 1)[0];
    if (best && best.s >= 14 && !(" " + W.norm(text0) + " ").includes(" " + W.norm(best.it.label) + " ")) text = best.it.label;
    if (!screenOpen()) {
      if (SC() && SC().open) SC().open();
      else return note(`The Screen is not loaded, so ${c.label} can't be set from here.`);
    }
    SC().openWin(c.id);
    return new Promise((done) => {
      let tries = 0;
      const go = () => {
        const box = document.querySelector(`[data-cw-say-text="${CSS.escape(c.id)}"]`);
        const btn = document.querySelector(`[data-cw-say="${CSS.escape(c.id)}"]`);
        if (box && btn && !btn.disabled) {
          box.value = text;
          btn.click();
          const heard = document.querySelector(`[data-cw-heard="${CSS.escape(c.id)}"]`);
          return done(`${c.label}: ${text}` + (heard && /couldn.t match/.test(heard.textContent) ? " (it didn't match a setting)" : ""));
        }
        if (++tries > 20) return done(`${c.label}'s window has no "Say what you want" box to take that.`);
        setTimeout(go, 50);
      };
      go();
    });
  }

  /* The app's bar (My film, Storyboard, every workspace) and its Library menu: always reachable, even while the
     Screen covers them. Picking one leaves the Screen first, then presses the bar's own button. */
  function barItems() {
    const out = [];
    document.querySelectorAll("#tabs button").forEach((b, i) => {
      if (b.id === "lib-btn" || b.disabled) return;
      const sm = b.querySelector("small");
      const label = (sm ? [...b.childNodes].filter((n) => n !== sm).map((n) => n.textContent).join(" ") : b.textContent).replace(/\s+/g, " ").trim();
      if (!label) return;
      const inLib = !!b.closest("#lib-menu");
      out.push({ id: "bar:" + i, group: inLib ? "library" : "bar", boost: -1.5, label, words: [sm ? sm.textContent : "", inLib ? "library" : "", b.title].join(" "), run: () => {
        if (screenOpen() && !(b.dataset && /screen/i.test(b.dataset.tab || b.textContent))) SC().close();
        flash(b);
        b.click();
        return `Opened ${label}.`;
      } });
    });
    return out;
  }

  /* ---------- understanding and doing ---------- */
  let pending = null; /* { list: [items], text } after "did you mean" */
  const log = [];
  /* Gathered once per command (and kept for a moment, so a test asking many questions in a row stays quick). */
  let cache = null;
  let cacheAt = 0;
  function everything() {
    if (cache && performance.now() - cacheAt < 1500) return cache;
    cache = gather();
    cacheAt = performance.now();
    return cache;
  }
  function gather() {
    let given = [];
    providers.forEach((fn) => {
      try {
        given = given.concat(fn() || []);
      } catch (e) {}
    });
    return [...reg.values()].concat(given, screenItems(), pageItems(), barItems(), phraseItems());
  }
  /* The ranked matches for one cleaned command (nothing run). */
  function find(text) {
    const t = W.clean(text);
    return W.rank(t, everything(), 6).map((x) => ({ label: x.it.label, group: x.it.group, score: Math.round(x.s * 10) / 10, it: x.it }));
  }
  function key(k, opts) {
    const o = Object.assign({ key: k, bubbles: true, cancelable: true }, opts || {});
    (document.activeElement || document.body).dispatchEvent(new KeyboardEvent("keydown", o));
  }
  function doUndo(kind, n) {
    for (let i = 0; i < n; i++) {
      const it = screenItems().find((x) => x.id === (kind === "undo" ? "act:key:Undo" : "act:key:Reset (redo)"));
      if (it) it.run();
      else key("z", { metaKey: /Mac/.test(navigator.platform), ctrlKey: !/Mac/.test(navigator.platform), shiftKey: kind === "redo" });
    }
    return `${kind === "undo" ? "Undid" : "Redid"} ${n === 1 ? "the last change" : n + " changes"}.`;
  }
  async function runItem(it, text) {
    const r = await it.run(text);
    return typeof r === "string" ? r : `Did: ${it.label}`;
  }
  /* One command. Returns a sentence saying what happened (also shown in the box). */
  async function one(raw) {
    cache = null;
    const t = W.clean(raw);
    if (!t) return "";
    const p = W.pattern(t);
    /* A new command (anything but a pick) clears the last "which one?". */
    if (pending && !(p && p.kind === "pick")) {
      pending = null;
      drawChoices();
    }
    if (p) {
      if (p.kind === "pick") {
        if (!pending) return `There is nothing to pick from. Say what you want first.`;
        const i = p.n === -1 ? pending.list.length - 1 : p.n - 1;
        const it = pending.list[i];
        if (!it) return `Pick a number from 1 to ${pending.list.length}.`;
        const said = pending.text;
        pending = null;
        drawChoices();
        return runItem(it, said);
      }
      if (p.kind === "help") return toggleHelp(true), "Here is what you can say.";
      if (p.kind === "sleep") return handsFree(false), stop(), "Stopped listening.";
      if (p.kind === "handsfree") return handsFree(true), "Hands-free is on: I'll keep listening. Say \"stop listening\" to stop.";
      if (p.kind === "cancel") return "Okay, nothing done.";
      if (p.kind === "stop") {
        const it = screenItems().find((x) => x.id === "act:key:Shuttle stop");
        if (it) return it.run(), "Stopped playing.";
        const b = pageItems().find((x) => /^(stop|pause)$/i.test(x.label));
        if (b) return b.run(), `Did: ${b.label}`;
        return "Nothing is playing.";
      }
      if (p.kind === "undo" || p.kind === "redo") return doUndo(p.kind, Math.min(50, p.n));
      if (p.kind === "moment" || p.kind === "step") {
        if (!screenOpen() || !SC().setRow) return "Moments are on the Screen; say \"open the screen\" first.";
        const n = (window.CurioEngine && window.CurioEngine.state && window.CurioEngine.state().rows.length) || 0;
        const to = p.kind === "step" ? SC().row() + p.by : p.n === -1 ? n - 1 : p.n - 1;
        SC().setRow(Math.max(0, n ? Math.min(n - 1, to) : to));
        return `Playhead on moment ${SC().row() + 1}.` + (n && to > n - 1 ? ` My film has ${n} moments, so that is the last one.` : "");
      }
      if (p.kind === "type") {
        const el = lastField && lastField.isConnected ? lastField : null;
        if (!el) return "Click into a box first, then say \"type\" and the words.";
        el.focus();
        if (el.isContentEditable) document.execCommand("insertText", false, p.text);
        else {
          const s = el.selectionStart != null ? el.selectionStart : el.value.length;
          const e = el.selectionEnd != null ? el.selectionEnd : el.value.length;
          const v = el.value.slice(0, s) + p.text + el.value.slice(e);
          const setter = Object.getOwnPropertyDescriptor(el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value").set;
          setter.call(el, v);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return `Typed "${p.text}".`;
      }
      if (p.kind === "scroll") {
        const box = scrollBox();
        const dy = p.dir === "up" ? -1 : p.dir === "down" ? 1 : 0;
        const dx = p.dir === "left" ? -1 : p.dir === "right" ? 1 : 0;
        const amt = (p.big ? 0.9 : 0.5) * (dy ? box.clientHeight || innerHeight : box.clientWidth || innerWidth);
        box.scrollBy({ top: dy * amt, left: dx * amt, behavior: "smooth" });
        return `Scrolled ${p.dir}.`;
      }
      if (p.kind === "escape") {
        key("Escape");
        return "Closed it.";
      }
      if (p.kind === "set") {
        const cur = findCuriosity(p.what);
        if (cur) return sayTo(cur.c, `${cur.rest} ${p.value}${p.unit === "%" ? "%" : ""}`.trim());
        const r = W.rank(p.what, pageItems().filter((x) => x.kind === "range" || x.kind === "number"), 3)[0];
        if (r) return setInput(r.it.el, p.value), `Set ${r.it.label} to ${p.value}.`;
        /* "set the layout to 2" and the like: fall through to the general search. */
      }
      if (p.kind === "on" || p.kind === "off") {
        const boxes = pageItems().filter((x) => x.kind === "checkbox" || x.kind === "radio");
        const r = W.rank(p.what, boxes, 2)[0];
        if (r && r.s >= 12) {
          if (r.it.el.checked !== (p.kind === "on")) press(r.it.el);
          return `${r.it.label}: ${p.kind}.`;
        }
        /* otherwise the label itself often says "turn on" (Captions: turn on): fall through. */
      }
    }
    /* "look through color", "show me the comedy suite": the library card, as Quick find picks it. */
    const look = t.match(/^(?:look through|look at|show me|pick|select|find|search for|search) (?:the )?(.+?)(?: curiosity| suite| lens)?$/);
    if (look) {
      const r = W.rank(look[1], screenItems().filter((x) => /^screen:(cur|suite)$/.test(x.group)), 3);
      if (r.length && r[0].s >= 9 && (!r[1] || r[0].s - r[1].s >= 2.5)) return runItem(r[0].it, raw);
      if (r.length && r[0].s >= 9) {
        pending = { list: r.map((x) => x.it), text: raw };
        drawChoices();
        return "Which one? Say 1, 2 or 3.";
      }
    }
    /* "open camera angle", "go to the storyboard": the app's bar and Library first, even when a heading on the
       Screen has the same words. */
    const nav = t.match(/^(?:open|go to|switch to|take me to|show me) (?:the )?(.+)$/);
    if (nav) {
      const r = W.rank(nav[1], barItems(), 1)[0];
      if (r && W.norm(r.it.label) === W.norm(nav[1])) return runItem(r.it, raw);
    }
    const ranked = W.rank(t, everything(), 6);
    /* A curiosity named with what to do to it: "shot size closer", "emotion sadder". Unless a button or action
       says the rest too ("turn on captions" is the Captions: turn on action, not the Captions curiosity). */
    const cur = findCuriosity(t);
    if (cur && W.wordsOf(cur.rest).length) {
      const said = new Set(W.wordsOf(t).map(W.stem));
      const top = ranked.find((x) => x.it.group !== "phrase" && W.norm(x.it.label) !== W.norm(cur.c.label));
      const extra = top ? W.wordsOf(top.it.label).map(W.stem).filter((w) => !W.wordsOf(cur.c.label).map(W.stem).includes(w)) : [];
      const action = top && top.it.group !== "phrase" && extra.length && extra.every((w) => said.has(w)) && top.s >= 15;
      if (!action) return sayTo(cur.c, cur.rest);
      return runItem(top.it, raw);
    }
    if (!ranked.length) return `I didn't find anything for "${t}". Say "help" for ideas, or try the words on the button.`;
    const [a, b] = ranked;
    /* Clear winner: a full match well ahead of the next. */
    const sure = !b || a.s - b.s >= 2.5 || W.norm(a.it.label) === t;
    if (sure && a.s >= 9) return runItem(a.it, raw);
    pending = { list: ranked.slice(0, 3).map((x) => x.it), text: raw };
    drawChoices();
    return `Which one? Say 1, 2 or 3.`;
  }
  let lastField = null;
  document.addEventListener(
    "focusin",
    (e) => {
      const el = e.target;
      if (!ours(el) && (el.isContentEditable || (el.tagName === "TEXTAREA") || (el.tagName === "INPUT" && /^(text|search|email|url|number|)$/.test(el.type)))) lastField = el;
    },
    true
  );
  function scrollBox() {
    const at = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    for (let el = at; el && el !== document.body; el = el.parentElement) {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) return el;
    }
    return document.scrollingElement || document.documentElement;
  }
  /* A whole utterance: one or more commands ("go to moment 3 then play"). */
  async function hear(text) {
    const parts = W.chain(text);
    const done = [];
    for (const part of parts.length ? parts : [text]) {
      let r;
      try {
        r = await one(part);
      } catch (err) {
        r = "That did not work: " + (err && err.message ? err.message : err);
      }
      if (r) done.push(r);
      if (pending) break;
    }
    cache = null; /* the page has changed */
    const msg = done.join(" ");
    log.unshift({ heard: String(text), did: msg, at: Date.now() });
    log.length = Math.min(log.length, 30);
    show(String(text), msg);
    if (prefs.talkBack && msg && window.speechSynthesis) {
      try {
        speechSynthesis.cancel();
        speechSynthesis.speak(new SpeechSynthesisUtterance(msg.replace(/[▾◐⌘⇧⌥]/g, "")));
      } catch (e) {}
    }
    return msg;
  }

  /* ---------- the microphone ---------- */
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = () => !!Rec;
  let prefs = { handsFree: false, talkBack: false };
  try {
    prefs = Object.assign(prefs, JSON.parse(localStorage.getItem(PREF)) || {});
  } catch (e) {}
  prefs.handsFree = false; /* never start listening on its own when the page opens */
  const savePrefs = () => {
    try {
      localStorage.setItem(PREF, JSON.stringify(prefs));
    } catch (e) {}
  };
  let rec = null;
  let listening = false;
  function listen() {
    open();
    if (!Rec) return note("This browser can't listen. Type the command in the box instead (Chrome, Edge and Safari can listen).");
    if (listening) return;
    rec = new Rec();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = !!prefs.handsFree;
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (!res.isFinal) {
          live(res[0].transcript);
          continue;
        }
        /* Of the recognizer's guesses, the first one that matches something (else its best guess). */
        const alts = [...res].map((a) => a.transcript);
        const pick = alts.find((a) => W.pattern(W.clean(a)) || find(a).length) || alts[0];
        hear(pick);
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        handsFree(false);
        note("The microphone is blocked for this page. Allow it in the browser's address bar, or type the command.");
      } else if (e.error === "no-speech") note(prefs.handsFree ? "" : "I didn't hear anything. Press 🎤 and try again.");
      else if (e.error !== "aborted") note("The microphone didn't catch that. Try again, or type it.");
    };
    rec.onend = () => {
      listening = false;
      drawState();
      if (prefs.handsFree && !stopping) setTimeout(() => prefs.handsFree && listen(), 250);
      stopping = false;
    };
    try {
      rec.start();
      listening = true;
      live("");
    } catch (e) {
      listening = false;
    }
    drawState();
  }
  let stopping = false;
  function stop() {
    stopping = true;
    if (rec) try {
      rec.stop();
    } catch (e) {}
    listening = false;
    drawState();
  }
  function handsFree(on) {
    prefs.handsFree = !!on;
    savePrefs();
    drawState();
    if (on && !listening) listen();
    if (!on && listening) stop();
  }

  /* ---------- the box ---------- */
  let root = null;
  let helpOpen = false;
  function build() {
    if (root) return;
    const css = document.createElement("style");
    css.textContent = CSS_TEXT;
    document.head.appendChild(css);
    root = document.createElement("div");
    root.className = "vo-root";
    root.innerHTML = `<button type="button" class="vo-mic" aria-label="Talk to Curiomatic (Alt+V)" title="Talk to Curiomatic: press and say what you want (Alt+V, ⌥V on a Mac)">🎤</button>
      <div class="vo-box" role="dialog" aria-label="Voice commands" hidden>
        <header><strong>Voice</strong><label class="vo-hf" title="Keep listening, one command per sentence, until you say &quot;stop listening&quot;"><input type="checkbox" data-vo="hf"> Hands-free</label><button type="button" data-vo="help" aria-expanded="false">What can I say?</button><button type="button" data-vo="close" aria-label="Close">×</button></header>
        <p class="vo-live" aria-live="polite"></p>
        <p class="vo-did" role="status" aria-live="polite"></p>
        <ol class="vo-choices" hidden></ol>
        <form class="vo-form"><input type="text" class="vo-q" placeholder="Or type it: &quot;go to moment 3 then play&quot;" aria-label="Type a command" autocomplete="off" spellcheck="false"><button type="submit">Do it</button></form>
        <div class="vo-help" hidden></div>
        <p class="vo-foot"><label><input type="checkbox" data-vo="talk"> Say the answer out loud</label> · Everything is one undo step: say "undo".</p>
      </div>`;
    document.body.appendChild(root);
    const box = root.querySelector(".vo-box");
    root.querySelector(".vo-mic").addEventListener("click", () => (listening ? stop() : listen()));
    root.querySelector(".vo-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = root.querySelector(".vo-q");
      const v = q.value;
      q.value = "";
      if (v.trim()) hear(v);
    });
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-vo]");
      if (b && b.dataset.vo === "close") return close();
      if (b && b.dataset.vo === "help") return toggleHelp(!helpOpen);
      const li = e.target.closest("[data-vo-pick]");
      if (li) hear(String(Number(li.dataset.voPick) + 1));
      const ex = e.target.closest("[data-vo-try]");
      if (ex) hear(ex.dataset.voTry);
    });
    root.addEventListener("change", (e) => {
      if (e.target.dataset.vo === "hf") handsFree(e.target.checked);
      if (e.target.dataset.vo === "talk") (prefs.talkBack = e.target.checked), savePrefs();
    });
    /* Keys typed in the box stay in the box (the Screen's shortcuts do not see them). */
    ["keydown", "keyup", "keypress"].forEach((t) =>
      box.addEventListener(t, (e) => {
        if (e.key === "Escape" && t === "keydown") return close();
        e.stopPropagation();
      })
    );
    drawState();
  }
  function open() {
    build();
    root.querySelector(".vo-box").hidden = false;
    drawState();
  }
  function close() {
    if (!root) return;
    stop();
    handsFree(false);
    root.querySelector(".vo-box").hidden = true;
  }
  function drawState() {
    if (!root) return;
    const mic = root.querySelector(".vo-mic");
    mic.classList.toggle("on", listening);
    mic.setAttribute("aria-pressed", String(listening));
    root.querySelector("[data-vo=hf]").checked = !!prefs.handsFree;
    root.querySelector("[data-vo=hf]").disabled = !Rec;
    root.querySelector("[data-vo=talk]").checked = !!prefs.talkBack;
  }
  function live(t) {
    if (!root) return;
    root.querySelector(".vo-live").textContent = listening ? (t ? `“${t}”` : "Listening…") : "";
  }
  function note(m) {
    build();
    open();
    root.querySelector(".vo-did").textContent = m;
  }
  function show(heard, did) {
    build();
    open();
    root.querySelector(".vo-live").textContent = `Heard: “${heard}”`;
    root.querySelector(".vo-did").textContent = did;
  }
  function drawChoices() {
    if (!root) return;
    const ol = root.querySelector(".vo-choices");
    ol.hidden = !pending;
    ol.innerHTML = pending ? pending.list.map((it, i) => `<li data-vo-pick="${i}" role="button" tabindex="0"><b>${i + 1}</b> ${esc(it.label)}<small>${esc(where(it))}</small></li>`).join("") : "";
  }
  const where = (it) => (/^screen:act/.test(it.group) ? "Screen action" : /^screen:cur/.test(it.group) ? "Curiosity" : /^screen:suite/.test(it.group) ? "Suite" : /^screen:moment/.test(it.group) ? "Moment" : it.group === "phrase" ? "Plain words for " + (it.words || "") : it.group === "page" ? "On the page" : "App");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const EXAMPLES = [
    ["Move around", ["go to moment 5", "next moment", "back 2 moments", "play", "stop", "go to the end"]],
    ["Change a curiosity", ["shot size closer", "make the emotion sadder", "set lens length to 85", "angle height a bit lower", "let it breathe"]],
    ["Use any button or menu", ["open the export menu", "export a storyboard sheet", "turn on captions", "mark the turns", "3 windows"]],
    ["Look through", ["look through shot size", "look through comedy timing", "open the storyboard"]],
    ["Fix and talk", ["undo", "undo 3 times", "redo", "type a lonely diner at night", "scroll down", "close that", "stop listening"]],
  ];
  function toggleHelp(on) {
    build();
    open();
    helpOpen = !!on;
    const h = root.querySelector(".vo-help");
    h.hidden = !helpOpen;
    root.querySelector("[data-vo=help]").setAttribute("aria-expanded", String(helpOpen));
    if (!helpOpen) return;
    const n = everything().length;
    h.innerHTML =
      `<p>Right now I can reach <b>${n.toLocaleString()}</b> things: every button, menu and tab you can see, every Screen action and moment, every curiosity and its plain-words phrases. Say two in a row with "then". Click an example to try it.</p>` +
      EXAMPLES.map(([t, list]) => `<h5>${esc(t)}</h5><p>${list.map((x) => `<button type="button" data-vo-try="${esc(x)}">${esc(x)}</button>`).join("")}</p>`).join("") +
      (Rec ? "" : `<p class="vo-warn">This browser can't listen, so type commands in the box (Chrome, Edge and Safari can listen).</p>`);
  }

  /* Alt+V (⌥V on a Mac; e.code, because Option changes e.key): listen, or stop listening. */
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === "KeyV") {
        e.preventDefault();
        e.stopPropagation();
        listening ? stop() : listen();
      }
    },
    true
  );

  const CSS_TEXT = `
.vo-root { position: fixed; left: 12px; bottom: 12px; z-index: 2147483000; font: 13px/1.4 -apple-system, "Segoe UI", system-ui, sans-serif; color: #e8e8ea; color-scheme: dark; }
.vo-mic { width: 44px; height: 44px; border-radius: 50%; border: 1px solid #3a3a40; background: #1f1f24; font-size: 20px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.4); }
.vo-mic:hover { background: #2a2a31; }
.vo-mic.on { background: #c7354a; border-color: #ff6b7f; animation: vo-pulse 1.2s ease-in-out infinite; }
@keyframes vo-pulse { 50% { box-shadow: 0 0 0 8px rgba(255,107,127,.25); } }
@media (prefers-reduced-motion: reduce) { .vo-mic.on { animation: none; } }
.vo-box { position: absolute; left: 0; bottom: 54px; width: min(380px, calc(100vw - 24px)); max-height: min(70vh, 560px); overflow: auto; background: #18181c; border: 1px solid #34343b; border-radius: 10px; padding: 10px 12px; box-shadow: 0 8px 28px rgba(0,0,0,.5); }
.vo-box[hidden], .vo-root [hidden] { display: none !important; }
.vo-box header { display: flex; gap: 8px; align-items: center; }
.vo-box header strong { flex: 1; }
.vo-box button { font: inherit; font-size: 12px; color: inherit; background: #2a2a31; border: 0; border-radius: 6px; padding: 4px 9px; cursor: pointer; }
.vo-box button:hover { background: #34343c; }
.vo-hf, .vo-foot label { font-size: 12px; color: #b8b8c0; display: inline-flex; gap: 4px; align-items: center; }
.vo-live { margin: 8px 0 2px; color: #9fd3ff; min-height: 1.2em; }
.vo-did { margin: 2px 0 8px; min-height: 1.2em; }
.vo-choices { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 4px; }
.vo-choices li { background: #232329; border-radius: 6px; padding: 5px 8px; cursor: pointer; }
.vo-choices li:hover, .vo-choices li:focus { background: #2e2e36; outline: none; }
.vo-choices b { display: inline-block; width: 1.4em; color: #ffcf5c; }
.vo-choices small { display: block; color: #8d8d96; margin-left: 1.6em; }
.vo-form { display: flex; gap: 6px; }
.vo-q { flex: 1; min-width: 0; font: inherit; color: inherit; background: #101013; border: 1px solid #3a3a40; border-radius: 6px; padding: 5px 8px; }
.vo-help h5 { margin: 10px 0 4px; font-size: 12px; color: #b8b8c0; }
.vo-help p { margin: 4px 0; }
.vo-help p button { margin: 0 4px 4px 0; }
.vo-warn { color: #ffcf5c; }
.vo-foot { margin: 8px 0 0; font-size: 11px; color: #8d8d96; }
.vo-flash { outline: 2px solid #ff6b7f !important; outline-offset: 2px; }
`;

  const start = () => build();
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);

  window.CurioVoice = { hear, find, listen, stop, handsFree, open, close, supported, history: () => log.slice(), help: toggleHelp, examples: () => EXAMPLES.map(([t, l]) => [t, l.slice()]), _one: one, _pageItems: pageItems };
})();
