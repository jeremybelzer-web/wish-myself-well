/* app.js: the first screen. Tabs for All, Visual, Writing and Audio, a find box, and one row per curiosity with
   its plain words and its lane tags. Read-only for now; the Outline view comes next. */
(function () {
  const DB = window.CuriosityDB;
  const Lanes = window.WritingLanes;
  const counts = Lanes.tagAll(DB);
  const rows = DB.data.curiosities.slice().sort((a, b) => a.label.localeCompare(b.label));
  const only = (r) => (r.tags || []).includes("writing-only");
  const state = { tab: "Writing", find: "" };

  const tabs = document.getElementById("tabs");
  const list = document.getElementById("list");
  const find = document.getElementById("find");

  function drawTabs() {
    tabs.innerHTML = "";
    [["All", counts.total]].concat(Lanes.TABS.map((t) => [t, counts[t]]), [["Writing only", rows.filter(only).length]]).forEach(([t, n]) => {
      const b = document.createElement("button");
      b.textContent = `${t} (${n})`;
      b.className = t === state.tab ? "on" : "";
      b.onclick = () => { state.tab = t; draw(); };
      tabs.appendChild(b);
    });
  }

  function draw() {
    drawTabs();
    const q = state.find.toLowerCase();
    const shown = rows.filter((r) => (state.tab === "All" || (state.tab === "Writing only" ? only(r) : r.lanes.includes(state.tab))) &&
      (!q || (r.label + " " + r.plain + " " + r.id).toLowerCase().includes(q)));
    list.innerHTML = "";
    shown.forEach((r) => {
      const el = document.createElement("article");
      const tags = r.lanes.map((t) => `<span class="tag ${t.toLowerCase()}">${t}</span>`).join("");
      el.innerHTML = `<h2></h2><p></p><div class="tags">${tags}</div>`;
      el.querySelector("h2").textContent = r.label;
      el.querySelector("p").textContent = r.plain || "";
      el.title = r.id;
      list.appendChild(el);
    });
  }

  find.oninput = () => { state.find = find.value; draw(); };
  draw();
})();
