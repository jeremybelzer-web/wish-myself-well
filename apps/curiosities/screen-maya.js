/* Maya's tools inside the Screen (the "Bring Maya into the app" thread, 2026-10-02).

   Jeremy, 18:02Z: bring Maya into the Screen, "all curiosity-centric and automation-centric", and accessible.
   The Maya topics are curiosities in the database (data/db-maya.js): each lens's sliders sit in the Screen's
   inspector and can be laid out as lanes on its timeline like any other curiosity. This file adds the last
   piece: under every curiosity that a Studio tool works on in depth (the lens itself, or a catalog row one of
   the lenses gathers, like Wind or Fur length), a "Maya tool" button that opens that tool over the Screen,
   with one line saying what Maya calls it.

   Nothing in screen/ changes: this watches the Screen's inspector and adds the button to its rows. Without the
   Screen, the database or the Studio, it does nothing. */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  let toolOf = null;

  /* curiosity id -> { tool, maya, lens }: each Maya lens, and every catalog row its sliders gather. */
  function map() {
    if (toolOf) return toolOf;
    const DB = window.CuriosityDB;
    if (!DB || !DB.data) return {};
    toolOf = {};
    DB.data.curiosities.forEach((c) => {
      if (!c.tool) return;
      toolOf[c.id] = { tool: c.tool, maya: c.maya || "", lens: c };
      c.sliders.forEach((s) => s.ref && !toolOf[s.ref] && (toolOf[s.ref] = { tool: c.tool, maya: c.maya || "", lens: c }));
    });
    return toolOf;
  }
  function toolLabel(id) {
    const S = window.CuriosityStudio;
    const t = S && S.tools ? S.tools().find((x) => x.id === id) : null;
    return t ? t.label : "";
  }

  /* Add the button to every inspector row that has a tool and does not have it yet. */
  function decorate(root) {
    if (!window.CuriosityStudio) return;
    const tm = map();
    root.querySelectorAll(".sc-cur").forEach((row) => {
      if (row.querySelector(".sc-maya")) return;
      const name = row.querySelector("[data-select-cur]");
      const t = name && tm[name.dataset.selectCur];
      if (!t || !toolLabel(t.tool)) return;
      const div = document.createElement("div");
      div.className = "sc-maya";
      const from = t.lens.id === name.dataset.selectCur ? "" : ` (part of ${t.lens.label})`;
      div.innerHTML = `<button type="button" data-maya-tool="${esc(t.tool)}" data-maya-cur="${esc(name.dataset.selectCur)}" title="Work on this in depth with the ${esc(toolLabel(t.tool))} tool">Maya tool: ${esc(toolLabel(t.tool))}</button><small title="${esc(t.maya)}">In Maya${esc(from)}: ${esc(t.maya.split(/[,(]/)[0].trim())}</small>`;
      row.appendChild(div);
    });
  }

  /* The tool opens in a window over the Screen; closing it stops the tool. */
  let dlg = null;
  let mounted = null;
  function openTool(toolId, curId) {
    const S = window.CuriosityStudio;
    if (!S) return;
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "sc-maya-dlg";
      dlg.innerHTML = `<header><strong></strong><button type="button" data-maya-close>Close</button></header><p class="sc-maya-how"></p><div class="sc-maya-body"></div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener("close", () => {
        if (mounted) mounted.stop();
        mounted = null;
      });
      dlg.addEventListener("click", (e) => {
        if (e.target.closest("[data-maya-close]") || e.target === dlg) dlg.close();
      });
    }
    const t = map()[curId];
    dlg.querySelector("strong").textContent = toolLabel(toolId) + (t ? " · " + t.lens.label : "");
    dlg.querySelector(".sc-maya-how").textContent = t
      ? `${t.lens.plain} Every one of its sliders is in the inspector under ${t.lens.label}, and becomes a lane on the timeline you can automate (pick it in Looking through, or lay it out in Arrange).`
      : "";
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    mounted = S.mount(dlg.querySelector(".sc-maya-body"), toolId);
  }
  /* Pick a curiosity in the Screen, as if its name were clicked in the inspector: the viewers light it up and
     the timeline shows its lane. Opens its category (and Show all) first when the row is not on show. */
  function selectInScreen(id) {
    const q = () => document.querySelector(`.sc-inspector [data-select-cur="${CSS.escape(id)}"]`);
    if (!q() && window.CurioLevels) {
      /* The category may be a heading in the inspector (first Screen) or a tab in the library bar (CapCut layout). */
      const cat = CurioLevels.categoryOf(id);
      const head = document.querySelector(`.sc-inspector [data-icat="${CSS.escape(cat)}"]`) || document.querySelector(`[data-icat="${CSS.escape(cat)}"]`);
      const sec = head && head.closest(".sc-cat");
      if (head && !(sec ? sec.classList.contains("open") : head.classList.contains("on"))) head.click();
      const more = document.querySelector(`.sc-inspector [data-more="${CSS.escape(cat)}"]`);
      if (!q() && more) more.click();
    }
    const b = q();
    if (b) {
      b.click();
      b.scrollIntoView({ block: "nearest" });
    }
    return !!b;
  }
  document.addEventListener(
    "click",
    (e) => {
      /* Inside the tool window, a curiosity chip picks that curiosity in the Screen (its lane is then on the
         timeline, ready to automate) instead of leaving for the old Automate page behind the Screen. */
      const chip = e.target.closest && e.target.closest(".sc-maya-dlg .chip[data-auto]");
      if (chip && window.CurioScreen && CurioScreen.isOpen()) {
        e.stopPropagation();
        dlg.close();
        selectInScreen(chip.dataset.auto);
        return;
      }
      const b = e.target.closest && e.target.closest("[data-maya-tool]");
      if (!b) return;
      e.stopPropagation();
      openTool(b.dataset.mayaTool, b.dataset.mayaCur);
    },
    true
  );

  /* The Screen redraws its inspector often; decorate after each redraw. */
  function watch() {
    const css = document.createElement("style");
    css.textContent = `.sc-maya{display:flex;flex-wrap:wrap;gap:.25rem .5rem;align-items:center;margin:.2rem 0 .1rem}
.sc-maya button{font:inherit;font-size:.78rem;padding:.1rem .45rem;border-radius:.35rem;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;opacity:.85}
.sc-maya button:hover,.sc-maya button:focus-visible{opacity:1}
.sc-maya small{font-size:.72rem;opacity:.7}
.sc-maya-dlg{width:min(980px,96vw);max-height:92vh;overflow:auto;padding:0;border:1px solid #888;border-radius:.6rem;background:var(--cc-panel,#fff);color:var(--cc-text,#111)}
.sc-maya-dlg::backdrop{background:rgba(0,0,0,.55)}
.sc-maya-dlg header{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.6rem .9rem;background:inherit;border-bottom:1px solid var(--cc-line,#8884)}
.sc-maya-how{margin:.6rem .9rem;font-size:.85rem;opacity:.8}
.sc-maya-body{padding:0 .9rem .9rem}`;
    document.head.appendChild(css);
    const obs = new MutationObserver((list) => {
      for (const m of list) {
        const el = m.target.closest ? m.target.closest(".sc-inspector") || (m.target.querySelector && m.target.querySelector(".sc-inspector")) : null;
        if (el) decorate(el);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll(".sc-inspector").forEach(decorate);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
  else watch();
  window.CurioScreenMaya = { map, decorate, open: openTool, select: selectInScreen };
})();
