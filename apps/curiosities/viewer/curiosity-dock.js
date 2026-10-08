/* viewer/curiosity-dock.js: the Curiosities tab (Jeremy 2026-10-08).
   "hidden behind a TAB at the top right that says something like 'Curiosities' and it launches a pop-up window and
   you select the window you want to be to the left of the Viewer": Objects, Characters, Enneagram personalities,
   Background scenes, Character arcs (people, groups and companies), Lighting (what the Dusk light menu was), and
   every other curiosity window from the database (CuriosityDB.data.workspaces).
   The window you pick docks left of the picture. Each curiosity in it opens its own window (the same one the
   Automation lanes open, viewer/focus-lane.js). The pick is kept in localStorage (curio-dock-v1).
   Only in the big Viewer's workspace (viewer/workspace.js, data-ws on .cv-root). */
(function () {
  "use strict";
  if (window.CurioDock) return;
  const KEY = "curio-dock-v1";
  const ENNEAGRAM = ["enneagramType", "cm-health", "typeClash", "typeTalk"];
  /* the windows Jeremy named first, then every workspace in the database */
  const FEATURED = [
    { id: "objects", label: "Objects", ico: "📦", plain: "The things in the scene, the set and what people wear", ws: ["set", "placement", "wardrobe"], open: [["things", "In the scene"], ["build", "Draw & build"]] },
    { id: "characters", label: "Characters", ico: "🙂", plain: "Who they are, how they move and carry themselves", ws: ["archetype", "character-motion", "movement-lines"], open: [["people", "People"]] },
    { id: "enneagram", label: "Enneagram personalities", ico: "⑨", plain: "The nine types: who each one is, healthy to unhealthy, and how they clash and talk", ids: ENNEAGRAM },
    { id: "background", label: "Background scenes", ico: "🏙", plain: "What happens behind the people, and the place itself", ws: ["background", "set"] },
    { id: "arcs", label: "Character arcs", ico: "📈", plain: "How people, groups and companies change: arcs, personal plots, mindsets, the herd, and every personality", ws: ["arc", "plot", "mindset", "herd", "archetype"], ids: ENNEAGRAM },
    { id: "lighting", label: "Lighting", ico: "💡", plain: "The light of the whole film and of each scene", ws: ["light"], look: true },
  ];
  const rootEl = () => document.querySelector(".cv-root.cv-viewer");
  const DB = () => window.CuriosityDB && window.CuriosityDB.data;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function choices() {
    const db = DB();
    const others = db ? db.workspaces.map((w) => ({ id: "ws:" + w.id, label: w.label, ico: "▦", plain: w.plain, ws: [w.id] })) : [];
    return { featured: FEATURED, others };
  }
  const find = (id) => {
    const c = choices();
    return c.featured.concat(c.others).find((x) => x.id === id) || null;
  };
  function members(ch) {
    const db = DB();
    if (!db) return [];
    const ws = ch.ws || [];
    const ids = ch.ids || [];
    const seen = new Set();
    const out = [];
    ids.forEach((id) => {
      const c = db.curiosities.find((x) => x.id === id);
      if (c && !seen.has(id)) seen.add(id), out.push(c);
    });
    db.curiosities.forEach((c) => {
      if (seen.has(c.id)) return;
      if (ws.includes(c.workspace) || (c.also || []).some((a) => ws.includes(a))) seen.add(c.id), out.push(c);
    });
    return out;
  }
  let cur = "";
  try {
    cur = localStorage.getItem(KEY) || "";
  } catch (e) {}

  const CSS = `
.cd-btn { display: none; }
.cv-root[data-ws] .cd-btn { display: inline-block; flex: none; background: #22d3ee; color: #062a31; border-color: #22d3ee; font-weight: 600; }
.cv-root[data-ws] .cv-bar [data-k="look"] { display: none; }
.cd-pop { position: fixed; inset: 0; z-index: 2147482500; background: rgba(0,0,0,0.55); display: grid; place-items: center; }
.cd-pop > div { width: min(760px, calc(100vw - 32px)); max-height: 80vh; overflow: auto; background: #18181b; color: #eee; border: 1px solid #3a3a42; border-radius: 12px; padding: 14px 16px 16px; font: 13px/1.4 system-ui, sans-serif; position: relative; }
.cd-pop h2 { margin: 0 0 4px; font-size: 16px; }
.cd-pop p { margin: 0 0 10px; color: #9b9ba3; }
.cd-pop h3 { margin: 14px 0 6px; font-size: 12px; color: #9b9ba3; text-transform: uppercase; letter-spacing: 0.05em; }
.cd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
.cd-pop .cd-grid button { all: unset; box-sizing: border-box; display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 2px 8px; padding: 8px 10px; border: 1px solid #34343b; border-radius: 8px; background: #222226; cursor: pointer; }
.cd-pop .cd-grid button:hover, .cd-pop .cd-grid button:focus-visible { border-color: #22d3ee; }
.cd-pop .cd-grid button[aria-pressed="true"] { border-color: #22d3ee; box-shadow: inset 0 0 0 1px #22d3ee; }
.cd-grid i { font-style: normal; font-size: 18px; grid-row: 1 / 3; align-self: center; text-align: center; }
.cd-grid b { font-size: 13px; }
.cd-grid small { color: #9b9ba3; font-size: 11px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cd-x { all: unset; position: absolute; top: 8px; right: 12px; cursor: pointer; color: #9b9ba3; font-size: 18px; }
.cv-root[data-ws][data-cd-dock] .cv-player { position: relative; padding-left: 262px; }
.cd-dock { display: none; }
.cv-root[data-ws][data-cd-dock] .cd-dock { display: grid; grid-template-rows: auto minmax(0, 1fr); position: absolute; left: 6px; top: 6px; bottom: 6px; width: 248px; background: #18181b; border: 1px solid #2e2e33; border-radius: 8px; overflow: hidden; z-index: 4; }
.cd-dock header { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-bottom: 1px solid #2e2e33; }
.cd-dock header b { flex: 1; min-width: 0; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-root .cd-dock header button { padding: 2px 7px; font-size: 11px; }
.cv-root .cd-dock header .cd-close { all: unset; cursor: pointer; color: #9b9ba3; font-size: 12px; width: 16px; text-align: center; }
.cd-body { overflow-y: auto; padding: 6px; display: grid; gap: 4px; align-content: start; }
.cd-look { display: flex; gap: 4px; padding: 2px 0 6px; border-bottom: 1px solid #2e2e33; margin-bottom: 2px; }
.cv-root .cd-look button { flex: 1; padding: 4px 6px; font-size: 11.5px; }
.cv-root .cd-look button[aria-pressed="true"] { background: #fde68a; color: #2b2418; border-color: #fde68a; font-weight: 600; }
.cd-opens { display: flex; flex-wrap: wrap; gap: 4px; padding-bottom: 6px; border-bottom: 1px solid #2e2e33; margin-bottom: 2px; }
.cv-root .cd-opens button { font-size: 11.5px; padding: 3px 8px; }
.cv-root .cd-body .cd-c { all: unset; box-sizing: border-box; display: grid; gap: 1px; padding: 5px 7px; border-radius: 6px; background: #1f1f23; cursor: pointer; }
.cv-root .cd-body .cd-c:hover, .cv-root .cd-body .cd-c:focus-visible { background: #2a2a30; outline: 1px solid #22d3ee; }
.cd-c b { font-size: 12px; }
.cd-c small { font-size: 10.5px; color: #9b9ba3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`;

  function wire() {
    const root = rootEl();
    const bar = root && root.querySelector(":scope > .cv-bar");
    if (!bar) return setTimeout(wire, 300);
    if (!document.getElementById("cd-css")) {
      const st = document.createElement("style");
      st.id = "cd-css";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    if (!bar.querySelector(".cd-btn")) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cd-btn";
      b.dataset.cd = "open";
      b.title = "Pick a curiosity window to sit left of the picture: Objects, Characters, Lighting and more";
      b.textContent = "Curiosities";
      /* at the top right, after everything else on the line */
      bar.appendChild(b);
    }
    dock();
  }
  /* the window left of the picture */
  function dock() {
    const root = rootEl();
    if (!root) return;
    const player = root.querySelector(".cv-player");
    let el = player.querySelector(":scope > .cd-dock");
    const ch = cur && find(cur);
    if (!ch) {
      delete root.dataset.cdDock;
      if (el) el.remove();
      return after();
    }
    if (!el) {
      el = document.createElement("aside");
      el.className = "cd-dock";
      player.prepend(el);
    }
    root.dataset.cdDock = ch.id;
    const look = root.querySelector('.cv-bar [data-k="look"]');
    const list = members(ch);
    el.setAttribute("aria-label", ch.label);
    el.innerHTML = `<header><b title="${esc(ch.plain)}">${esc(ch.label)}</b><button type="button" data-cd="open" title="Pick another curiosity window">Change</button><button type="button" class="cd-close" data-cd="close" title="Close this window" aria-label="Close this window">✕</button></header>
      <div class="cd-body">${
        ch.look && look
          ? `<div class="cd-look" role="group" aria-label="The light of the whole film">${[...look.options].map((o) => `<button type="button" data-cd-look="${esc(o.value)}" aria-pressed="${o.value === look.value}">${esc(o.textContent)}</button>`).join("")}</div>`
          : ""
      }${ch.open ? `<div class="cd-opens">${ch.open.map(([id, label]) => `<button type="button" data-cd-rail="${esc(id)}" title="Open ${esc(label)} in a big window">${esc(label)}</button>`).join("")}</div>` : ""}${
        list.map((c) => `<button type="button" class="cd-c" data-cd-c="${esc(c.id)}" title="${esc(c.plain)} Click to open its window."><b>${esc(c.label)}</b><small>${esc(c.plain)}</small></button>`).join("") || "<small>Nothing here yet.</small>"
      }</div>`;
    after();
  }
  function after() {
    window.dispatchEvent(new Event("resize"));
  }
  function set(id) {
    cur = id || "";
    try {
      if (cur) localStorage.setItem(KEY, cur);
      else localStorage.removeItem(KEY);
    } catch (e) {}
    dock();
  }
  let pop = null;
  function shut() {
    if (pop) pop.remove();
    pop = null;
  }
  function openPop() {
    shut();
    const c = choices();
    const card = (x) => `<button type="button" data-cd-pick="${esc(x.id)}" aria-pressed="${x.id === cur}" title="${esc(x.plain)}"><i aria-hidden="true">${x.ico}</i><b>${esc(x.label)}</b><small>${esc(x.plain)}</small></button>`;
    pop = document.createElement("div");
    pop.className = "cd-pop";
    pop.innerHTML = `<div role="dialog" aria-label="Curiosities"><button type="button" class="cd-x" data-cd="shut" aria-label="Close">×</button><h2>Curiosities</h2><p>Pick the window that sits left of the picture.</p><div class="cd-grid">${c.featured.map(card).join("")}</div>${
      c.others.length ? `<h3>Every curiosity window</h3><div class="cd-grid">${c.others.map(card).join("")}</div>` : ""
    }${cur ? `<h3></h3><div class="cd-grid"><button type="button" data-cd-pick=""><i aria-hidden="true">✕</i><b>No window</b><small>Give the picture its room back</small></button></div>` : ""}</div>`;
    document.body.appendChild(pop);
    const first = pop.querySelector('[aria-pressed="true"]') || pop.querySelector("[data-cd-pick]");
    if (first) first.focus();
  }
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.closest) return;
    if (pop && (t === pop || t.closest('[data-cd="shut"]'))) return shut();
    const pick = t.closest("[data-cd-pick]");
    if (pick) return shut(), set(pick.dataset.cdPick);
    const b = t.closest(".cv-root [data-cd]");
    if (b && b.dataset.cd === "open") return openPop();
    if (b && b.dataset.cd === "close") return set("");
    const lk = t.closest(".cd-dock [data-cd-look]");
    if (lk) {
      const look = rootEl().querySelector('.cv-bar [data-k="look"]');
      look.value = lk.dataset.cdLook;
      look.dispatchEvent(new Event("change", { bubbles: true }));
      return dock();
    }
    const rail = t.closest(".cd-dock [data-cd-rail]");
    if (rail) {
      const r = rootEl().querySelector(`.cvb-rail [data-cvb="${window.CSS.escape(rail.dataset.cdRail)}"]`);
      return r && r.click();
    }
    const c = t.closest(".cd-dock [data-cd-c]");
    if (c && window.CurioFocusLane && window.CurioFocusLane.openWindow) window.CurioFocusLane.openWindow(c.dataset.cdC);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pop) (e.stopPropagation(), shut());
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);
  /* the Viewer draws its bar again when it reopens: put the tab and the window back */
  setInterval(() => {
    const root = rootEl();
    if (!root) return;
    if (!root.querySelector(".cd-btn")) wire();
    else if (!!cur !== !!root.querySelector(".cv-player > .cd-dock")) dock();
  }, 1000);

  window.CurioDock = { open: openPop, set, get: () => cur, choices, members };
})();
