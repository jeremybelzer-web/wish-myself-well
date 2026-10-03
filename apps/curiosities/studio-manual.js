/* Manual: every topic we pulled from the Maya and Arnold for Maya user guides (maya-manual.js),
   graded major or minor, with how far the app takes it (build, partial, curiosity only, skip),
   the curiosities, suites and proximities it becomes, and a keep or skip call to review.
   Your own keep or skip overrides ours and is saved in this browser; Export writes them as JSON. */

(function () {
  if (!window.CuriosityStudio) return;
  const FIT = { build: "To build", partial: "Partly built", curiosity: "Curiosity only", skip: "Skip" };
  const view = { built: "", q: "", manual: "", area: "", weight: "", fit: "", keep: "", open: "" };

  function draw(el, api) {
    const esc = api.esc;
    const calls = api.store("curiosities-studio-manual-calls-v1");
    const mine = calls.get({});
    const data = (window.MAYA_MANUAL && window.MAYA_MANUAL.topics) || [];
    if (!data.length) {
      el.innerHTML = `<p>The manual inventory has not loaded.</p>`;
      return;
    }
    const opts = (k) => [...new Set(data.map((t) => t[k]).filter(Boolean))].sort();
    const callOf = (t) => mine[t.id] || t.keep;
    const rows = data.filter((t) => {
      if (view.manual && t.manual !== view.manual) return false;
      if (view.area && t.area !== view.area) return false;
      if (view.weight && t.weight !== view.weight) return false;
      if (view.fit && t.fit !== view.fit) return false;
      if (view.keep && callOf(t) !== view.keep) return false;
      if (view.built && (t.built || "no") !== view.built) return false;
      if (view.q) {
        const hay = JSON.stringify(t).toLowerCase();
        if (!hay.includes(view.q.toLowerCase())) return false;
      }
      return true;
    });
    const count = (f) => data.filter(f).length;
    const sel = (k, label, list, names) =>
      `<label class="field">${esc(label)}<select data-f="${k}"><option value="">All</option>${list
        .map((v) => `<option value="${esc(v)}" ${view[k] === v ? "selected" : ""}>${esc(names ? names[v] || v : v)}</option>`)
        .join("")}</select></label>`;
    const live = new Set((window.CURIOSITIES || []).filter((c) => c.live).map((c) => c.id));

    el.innerHTML = `
      <p class="cap">${data.length} topics: ${count((t) => t.weight === "major")} major, ${count((t) => t.weight === "minor")} minor.
        ${count((t) => t.built === "yes")} are built in a Studio tool and ${count((t) => t.built === "partly")} partly; by fit, ${count((t) => t.fit === "build")} call for tools, ${count((t) => t.fit === "partial")} partly, ${count((t) => t.fit === "curiosity")} become curiosities only, ${count((t) => t.fit === "skip")} are skipped.
        Pages read: ${esc((window.MAYA_MANUAL.sources || []).length)}. Change any keep or skip call; it is saved here.</p>
      <div class="study-bar">
        <label class="field">Search<input type="search" data-f="q" value="${esc(view.q)}" placeholder="lens, tangent, toon…" /></label>
        ${sel("manual", "Manual", opts("manual"))}
        ${sel("area", "Area", opts("area"))}
        ${sel("weight", "Weight", ["major", "minor"])}
        ${sel("fit", "Fit", Object.keys(FIT), FIT)}
        <label class="field">Built<select data-f="built"><option value="">All</option><option value="yes" ${view.built === "yes" ? "selected" : ""}>Built</option><option value="partly" ${view.built === "partly" ? "selected" : ""}>Partly</option><option value="no" ${view.built === "no" ? "selected" : ""}>Not yet</option></select></label>
        ${sel("keep", "Call", ["keep", "skip"])}
        <div class="bar-actions"><button type="button" data-act="export">Export my calls</button><button type="button" data-act="reset">Clear my calls</button></div>
      </div>
      <p class="cap">${rows.length} shown.</p>
      <div class="scroll"><table class="trace manual"><thead><tr><th>Topic</th><th>Area</th><th>Weight</th><th>In the app</th><th>Call</th></tr></thead><tbody>
      ${rows
        .map((t) => {
          const c = callOf(t);
          const open = view.open === t.id;
          const detail = open
            ? `<tr class="picked"><td colspan="5">
                <p>${esc(t.appDoes || "")}</p>
                ${t.toolDoes ? `<p><strong>Built:</strong> ${esc(t.toolDoes)}</p>` : ""}
                ${t.granularity && t.granularity.length ? `<p class="cap">Parts: ${t.granularity.map(esc).join(" · ")}</p>` : ""}
                ${(t.curiosities || []).length ? `<p>${t.curiosities.map((id) => `<span class="chip">${esc(id)}</span>`).join(" ")}</p>` : ""}
                ${(t.newCuriosities || []).length ? `<p class="cap">New curiosities: ${t.newCuriosities.map((n) => `<strong>${esc(n.label)}</strong> (${esc(n.values)})`).join("; ")}</p>` : ""}
                ${(t.suites || [])
                  .map((s) => {
                    const onBoard = Object.keys(s.set || {}).filter((k) => live.has(k));
                    return `<p><span class="chip suite">${esc(s.label)}</span> <span class="mono">${esc(Object.entries(s.set || {}).map(([k, v]) => k + " " + v).join(", "))}</span>
                      ${onBoard.length ? ` <button type="button" data-suite="${esc(t.id)}::${esc(s.label)}">Try on board</button>` : ""}</p>`;
                  })
                  .join("")}
                ${(t.proximities || []).length ? `<ul>${t.proximities.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
                <p class="cap">For: ${esc((t.audience || []).join(", "))}. Why ${esc(t.keep)}: ${esc(t.reason || "")}. Source: ${esc(t.source || "")}</p>
              </td></tr>`
            : "";
          return `<tr><td><button type="button" class="linkish" data-open="${esc(t.id)}">${open ? "▾" : "▸"} ${esc(t.topic)}</button></td><td class="cap">${esc(t.manual === "Maya" ? t.area : "Arnold · " + t.area)}</td><td>${esc(t.weight)}</td><td>${t.tool && window.CuriosityStudio.label(t.tool) ? `<button type="button" data-tool="${esc(t.tool)}">${t.built === "partly" ? "Partly in" : "In"} ${esc(window.CuriosityStudio.label(t.tool))}</button>` : esc(FIT[t.fit] || t.fit)}</td>
            <td><select data-call="${esc(t.id)}"><option value="keep" ${c === "keep" ? "selected" : ""}>keep</option><option value="skip" ${c === "skip" ? "selected" : ""}>skip</option></select>${mine[t.id] ? " ✎" : ""}</td></tr>${detail}`;
        })
        .join("")}
      </tbody></table></div>`;

    el.querySelectorAll("[data-f]").forEach((x) =>
      x.addEventListener(x.tagName === "INPUT" ? "change" : "change", () => {
        view[x.dataset.f] = x.value;
        draw(el, api);
      })
    );
    el.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => window.CuriosityStudio.open(b.dataset.tool)));
    el.querySelectorAll("[data-open]").forEach((b) =>
      b.addEventListener("click", () => {
        view.open = view.open === b.dataset.open ? "" : b.dataset.open;
        draw(el, api);
      })
    );
    el.querySelectorAll("[data-call]").forEach((s) =>
      s.addEventListener("change", () => {
        const t = data.find((x) => x.id === s.dataset.call);
        if (s.value === t.keep) delete mine[t.id];
        else mine[t.id] = s.value;
        calls.set(mine);
        draw(el, api);
      })
    );
    el.querySelectorAll("[data-suite]").forEach((b) =>
      b.addEventListener("click", () => {
        const [tid, label] = b.dataset.suite.split("::");
        const s = data.find((x) => x.id === tid).suites.find((x) => x.label === label);
        const values = {};
        Object.entries(s.set).forEach(([k, v]) => {
          if (live.has(k)) values[k] = [v, v, v, v];
        });
        api.toBoard(s.label, values);
      })
    );
    el.querySelector('[data-act="export"]').addEventListener("click", () => {
      const blob = new Blob([JSON.stringify({ calls: mine, at: new Date().toISOString() }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "maya-manual-calls.json";
      a.click();
    });
    el.querySelector('[data-act="reset"]').addEventListener("click", () => {
      calls.set({});
      draw(el, api);
    });
  }

  window.CuriosityStudio.register({ id: "manual", label: "Manual", order: 90, maya: "Maya User Guide and Arnold for Maya User Guide, topic by topic", draw });
})();
