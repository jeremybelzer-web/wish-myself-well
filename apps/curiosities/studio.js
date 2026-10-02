/* Studio: working tools taken from the Maya and Arnold for Maya manuals, one sub-tab each.
   Every tool reads and writes curiosities, so whatever you set here can be kept on the Shelf,
   counted in a study or played on the board. A tool registers itself with
   CuriosityStudio.register({ id, label, maya, draw(el, api) }) from its own file.
   api.board is window.CuriosityBoard; api.store(key) gives a small localStorage helper. */

(function () {
  const root = document.getElementById("studio");
  const modules = [];
  const VIEW_KEY = "curiosities-studio-tab-v1";
  let current = null;
  try {
    current = localStorage.getItem(VIEW_KEY);
  } catch (e) {}

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function store(key) {
    return {
      get(fallback) {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
          return fallback;
        }
      },
      set(value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
      },
    };
  }

  const api = {
    esc,
    store,
    get board() {
      return window.CuriosityBoard;
    },
    /* Send values to the board as an applied strand, then show the board. */
    toBoard(label, values) {
      if (!window.CuriosityBoard) return;
      window.CuriosityBoard.apply(label, values);
      const b = document.querySelector('.tabs button[data-tab="board"]');
      if (b) b.click();
    },
    /* Keep values on the Study tab's Shelf as a strand: {curiosityId: [one value per beat]}. */
    toShelf(label, values) {
      const k = window.CuriosityStudy && window.CuriosityStudy.keep ? window.CuriosityStudy.keep(label, values) : null;
      toast(k ? `Kept “${label}” on the Shelf: ${Object.keys(k.values).join(", ")} across ${k.beats} beat${k.beats === 1 ? "" : "s"}.` : "Nothing kept: the Shelf is not loaded or there were no values.");
      return k;
    },
  };

  function toast(msg) {
    let t = document.getElementById("studio-toast");
    if (!t) {
      t = document.createElement("p");
      t.id = "studio-toast";
      t.setAttribute("role", "status");
      t.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;max-width:520px;margin:0 auto;z-index:50;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:12px;padding:8px 12px;";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.hidden = true), 3200);
  }

  function draw() {
    if (!root) return;
    if (!modules.length) {
      root.innerHTML = "<p>No studio tools loaded.</p>";
      return;
    }
    if (!modules.find((m) => m.id === current)) current = modules[0].id;
    const m = modules.find((x) => x.id === current);
    root.innerHTML = `<h2>Studio</h2>
      <p class="cap">Tools taken from the Maya and Arnold for Maya manuals. Each one sets curiosities, so a look you build here can go to the board, the Shelf or a study.</p>
      <nav class="subtabs">${modules
        .map((x) => `<button type="button" data-studio="${esc(x.id)}" class="${x.id === current ? "on" : ""}" title="${esc(x.maya || "")}">${esc(x.label)}</button>`)
        .join("")}</nav>
      ${m.maya ? `<p class="cap">In Maya: ${esc(m.maya)}</p>` : ""}
      <div class="studio-body" id="studio-body"></div>`;
    root.querySelectorAll("button[data-studio]").forEach((b) =>
      b.addEventListener("click", () => {
        current = b.dataset.studio;
        try {
          localStorage.setItem(VIEW_KEY, current);
        } catch (e) {}
        draw();
      })
    );
    try {
      m.draw(document.getElementById("studio-body"), api);
      linkChips(root);
    } catch (e) {
      document.getElementById("studio-body").innerHTML = `<p>This tool failed to draw: ${esc(e.message)}</p>`;
    }
  }

  /* Leaving the Studio tab detaches the tool body (its nodes stay intact, just off the page),
     so every animation loop that checks isConnected stops. app.js redraws the Studio when its
     tab is shown again. */
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button[data-tab]");
    if (!b || b.dataset.tab === "studio") return;
    setTimeout(() => {
      const body = document.getElementById("studio-body");
      if (body && root && root.classList.contains("hidden")) body.remove();
    }, 0);
  });

  /* Every curiosity a tool shows as a chip can be automated: click it to open its workspace
     (or, without workspaces, its module in Automate). */
  const known = new Set(CURIOSITIES.map((c) => c.id));
  function linkChips(scope) {
    (scope || root).querySelectorAll(".chip").forEach((chip) => {
      const id = (chip.textContent.trim().match(/^([A-Za-z]+)/) || [])[1];
      if (!id || !(known.has(id) || (window.CurioAuto && window.CurioAuto.param("c:" + id))) || chip.dataset.auto) return;
      chip.dataset.auto = id;
      chip.title = "Automate " + id;
      chip.style.cursor = "pointer";
    });
  }
  function chipClick(e) {
    const chip = e.target.closest && e.target.closest(".chip[data-auto]");
    if (!chip) return;
    const key = "c:" + chip.dataset.auto;
    const W = window.CuriosityWorkspaces;
    if (W && W.openFor) W.openFor(key);
    else if (window.CuriosityAutomate && window.CuriosityAutomate.open) window.CuriosityAutomate.open(key);
  }
  if (root) {
    root.addEventListener("click", chipClick);
    new MutationObserver(() => linkChips(root)).observe(root, { childList: true, subtree: true });
  }

  /* ---------- one tool mounted into any element ----------
     A mounted tool draws into its own body inside the host. Whenever the host is hidden (by any
     ancestor) or taken off the page, the body is detached, so every animation loop that checks
     isConnected stops; when the host shows again the tool is drawn fresh from its saved settings.
     Tools keep one set of loops each, so a newly shown mount takes over a tool from any other. */
  const mounts = new Set();
  function shown(el) {
    if (!el.isConnected) return false;
    return el.checkVisibility ? el.checkVisibility() : el.getClientRects().length > 0;
  }
  function check() {
    const now = Date.now();
    /* The Studio tab's own body follows the same rule, however the section was hidden. */
    const tabBody = document.getElementById("studio-body");
    if (tabBody && root && root.contains(tabBody) && !shown(root)) tabBody.remove();
    mounts.forEach((h) => {
      const vis = shown(h.el);
      if (vis && !h.live) h.attach();
      else if (!vis && h.live) h.detach();
      if (h.el.isConnected) h.seen = now;
      else if (now - h.seen > 300000) mounts.delete(h);
    });
  }
  setInterval(check, 300);
  function mount(el, toolId) {
    if (!el) return null;
    mounts.forEach((h) => h.el === el && h.stop());
    const m = modules.find((x) => x.id === toolId);
    if (!m) {
      el.innerHTML = `<p class="cap">This tool is not loaded.</p>`;
      return null;
    }
    el.classList.add("studio-mount");
    const h = {
      el,
      id: toolId,
      live: false,
      body: null,
      seen: Date.now(),
      attach() {
        h.live = true;
        if (h.body) h.body.remove();
        const body = document.createElement("div");
        body.className = "studio-body";
        body.dataset.tool = toolId;
        el.innerHTML = m.maya ? `<p class="cap">In Maya: ${esc(m.maya)}</p>` : "";
        el.appendChild(body);
        h.body = body;
        try {
          m.draw(body, api);
          linkChips(el);
        } catch (e) {
          body.innerHTML = `<p>This tool failed to draw: ${esc(e.message)}</p>`;
        }
      },
      detach() {
        h.live = false;
        if (h.body) h.body.remove();
      },
      stop() {
        h.detach();
        h.obs.disconnect();
        el.removeEventListener("click", chipClick);
        mounts.delete(h);
      },
    };
    h.obs = new MutationObserver(() => linkChips(el));
    h.obs.observe(el, { childList: true, subtree: true });
    el.addEventListener("click", chipClick);
    mounts.add(h);
    if (shown(el)) h.attach();
    else el.innerHTML = "";
    return { el, redraw: () => (shown(el) ? h.attach() : null), stop: () => h.stop() };
  }

  window.CuriosityStudio = {
    register(m) {
      modules.push(m);
      modules.sort((a, b) => (a.order || 50) - (b.order || 50));
    },
    draw,
    api,
    /* Draw one tool, without the sub-tab bar, into any element: mount(el, "camera"). */
    mount,
    /* Every registered tool: [{id, label, maya}]. */
    tools() {
      return modules.map((x) => ({ id: x.id, label: x.label, maya: x.maya || "" }));
    },
    /* Open one tool by id, e.g. from the Manual's "Open" buttons. */
    open(id) {
      current = id;
      try {
        localStorage.setItem(VIEW_KEY, current);
      } catch (e) {}
      draw();
      if (root) root.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    label(id) {
      const m = modules.find((x) => x.id === id);
      return m ? m.label : "";
    },
  };
})();
