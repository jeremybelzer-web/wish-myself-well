(function () {
  const app = document.getElementById("app");
  const nav = document.querySelectorAll(".nav a");

  const routes = ["watch", "people", "songs", "skits", "lens", "world", "engines", "seeds", "bible"];

  function route() {
    const hash = (location.hash || "#watch").slice(1).split("/")[0];
    return routes.includes(hash) ? hash : "watch";
  }

  function setActive(name) {
    nav.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + name));
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function render() {
    const name = route();
    setActive(name);
    const view = views[name] || views.watch;
    app.innerHTML = view();
    if (name === "watch") bindWatch();
    if (name === "lens") bindLens();
  }

  const views = {
    watch() {
      const eps = episodeList();
      const ep = eps[epIndex] || eps[0];
      return `
        <section class="hero">
          <figure class="hero-still">
            <img src="images/wmw-key-art.png" alt="Dusk city, tuk-tuk, a child at a puddle" />
          </figure>
          <div class="hero-copy">
            <p class="ch">${esc(SHOW.banner)}</p>
            <h2>A play of name and form</h2>
            <p class="lede">${esc(SHOW.logline)}</p>
            <dl class="defs">
              <div><dt>Enlightenment</dt><dd>${esc(SHOW.definition.enlightenment)}</dd></div>
              <div><dt>Rich</dt><dd>${esc(SHOW.definition.rich)}</dd></div>
              <div><dt>Wish</dt><dd>${esc(SHOW.definition.wish)}</dd></div>
              <div><dt>Meaning</dt><dd>${esc(SHOW.definition.meaning)}</dd></div>
              <div><dt>Samsara</dt><dd>${esc(SHOW.definition.samsara)}</dd></div>
            </dl>
          </div>
        </section>
        <div class="filmstrip" id="ep-pick">
          ${eps
            .map(
              (e, i) =>
                `<button type="button" data-ep="${i}" class="${i === epIndex ? "on" : ""}">${esc(e.code)} · ${esc(e.title)}</button>`
            )
            .join("")}
        </div>
        <div class="ep-head">
          <div>
            <p class="ep-code">${esc(ep.code)}</p>
            <h2 class="section-h">Episode — ${esc(ep.title)}</h2>
            <p class="mini">${esc(ep.logline)}</p>
          </div>
          <p class="mini">${esc(ep.note)}</p>
        </div>
        <section class="also-watch" id="also-watch" aria-label="Also watching this hour"></section>
        <div class="filmstrip" id="strip"></div>
        <article class="board" id="board"></article>
      `;
    },

    people() {
      return `
        <h2 class="section-h">People we follow</h2>
        <p class="lede">GoT banners, a Friends courtyard, Anne’s weather, Bluey’s kids, and The Six. Kira will not hide the guru; the situations are actually too much. Ramanandji is the one who actually made time. Lark’s hour is 2892.11 IN LEGAL — grey Lisbon listing, not a heist. Nix and Vell are prompt addicts of different hungers. Ayo and Gwen are high achievers, mostly alone, forced to group. Desire to be someone drives all of them. Shame turns the volume up. They are also watching.</p>
        <div class="grid-people">
          ${SHOW.characters.map(card).join("")}
        </div>
      `;
    },

    songs() {
      const six = SHOW.theSix || {};
      const members = (six.members || [])
        .map((id) => SHOW.characters.find((c) => c.id === id))
        .filter(Boolean);
      const statusLabel = { live: "singing it", workshop: "in the room", hook: "hook only", cut: "on the floor" };
      return `
        <section class="six-hero">
          <figure class="hero-still">
            <img src="${esc(six.still || "images/wmw-six-call.png")}" alt="The Six on a worldwide call" />
          </figure>
          <div class="hero-copy">
            <p class="ch">The Six · songwriter circle</p>
            <h2>${esc(six.title || "The Six")}</h2>
            <p class="lede">${esc(six.meet || "")}</p>
            <p class="mini">${esc(six.rule || "")}</p>
          </div>
        </section>
        <div class="six-roster">
          ${members
            .map(
              (c) => `
            <a class="six-chip" href="#people">
              <img src="${esc(c.image)}" alt="" />
              <span>
                <b>${esc(c.name)}</b>
                <i>${esc(c.role)}</i>
              </span>
            </a>`
            )
            .join("")}
        </div>
        <h2 class="section-h">Craft they steal — never the sentences</h2>
        <p class="lede">Study how the masters are both specific and general. Devices to describe the very hard-to-describe personal experience which is the most universal. Original lines only.</p>
        <div class="seeds craft-grid">
          ${(SHOW.craft || [])
            .map(
              (s) => `
            <article class="seed">
              <p class="seed-bag">${esc(s.bag)}</p>
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.text)}</p>
            </article>`
            )
            .join("")}
        </div>
        <h2 class="section-h">On the table this week</h2>
        <p class="lede">Filter by the room: live, workshop, hook, cut. Channel 2892 is a musical whether it admits it.</p>
        <div class="seeds song-grid">
          ${(SHOW.songs || [])
            .map(
              (s) => `
            <article class="seed song">
              <p class="seed-bag">${esc(s.who)}${s.status ? " · " + esc(statusLabel[s.status] || s.status) : ""}</p>
              <h3>${esc(s.title)}</h3>
              ${s.device ? `<p class="device">${esc(s.device)}</p>` : ""}
              <p class="quote">${esc(s.hook)}</p>
              ${
                Array.isArray(s.verses) && s.verses.length
                  ? `<ul class="verses">${s.verses.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>`
                  : ""
              }
              <p>${esc(s.note || "")}</p>
            </article>`
            )
            .join("")}
        </div>
      `;
    },

    skits() {
      return `
        <h2 class="section-h">Skits — as funny as we can make it</h2>
        <p class="lede">Alternate the surreal and the felt-experience with bunk-room bits. The laugh is not a commercial break from the witness. Mother told us to laugh. Episode 7 and 12 play some of these. More voice memos can land here.</p>
        <div class="skit-list">
          ${(SHOW.skits || [])
            .map(
              (s) => `
            <article class="seed skit">
              <p class="seed-bag">${esc(s.bag)}</p>
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.text)}</p>
              ${
                Array.isArray(s.lines) && s.lines.length
                  ? `<ul class="lines skit-lines">${s.lines
                      .map((l) => `<li><div class="who">${esc(l.who)}</div><p class="text">${esc(l.text)}</p></li>`)
                      .join("")}</ul>`
                  : ""
              }
            </article>`
            )
            .join("")}
        </div>
      `;
    },

    lens() {
      return `
        <h2 class="section-h">The Lens</h2>
        <p class="lede">Wear the contacts and a person becomes a living chart: body, mind, feeling, relation, work, influence, love, seva. Time is the fourth axis. Pain-body is weather. The witness is the still center that will not plot. Organizations use this to help, to sell, or to steer.</p>
        <div class="lens-wrap">
          <div>
            <label class="field" for="who">Subject</label>
            <select id="who">${SHOW.characters.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>
            <label class="field" for="grain">Me-and-mine granularity</label>
            <select id="grain">
              <option value="self">Self</option>
              <option value="pair">Pair</option>
              <option value="family">Family</option>
              <option value="team">Team ego</option>
              <option value="city">City (heart-open)</option>
            </select>
            <label class="field" for="time">4D — now toward later</label>
            <input id="time" type="range" min="0" max="100" value="0" />
            <p class="mini" id="lens-readout"></p>
            <p class="mini" id="lens-wish"></p>
          </div>
          <div class="lens-stage">
            <canvas id="lens" width="720" height="460"></canvas>
            <div class="lens-hud" id="lens-hud"></div>
          </div>
          <div>
            <p class="ch">How to read it</p>
            <p class="mini">Gold fill is the life-situation. Dark bloom is pain-body. White seed in the middle is witness — Riven has more of it than he believes; he named the rest “loser.”</p>
            <p class="mini">Team ego is one fat polygon that thinks it is a person. City view is not geography. It is how far the heart has bothered to exist.</p>
            <button class="ghost" id="to-city" type="button">Open the city</button>
          </div>
        </div>
        <figure class="city" id="city-fig" hidden>
          <img src="images/wmw-city-heart.png" alt="City existing only as threads of connection" />
          <figcaption class="mini">${esc(SHOW.definition.city)}</figcaption>
        </figure>
      `;
    },

    world() {
      const w = SHOW.world;
      return `
        <h2 class="section-h">The world that already happened</h2>
        <div class="world-grid">
          <div>
            <p>${esc(w.time)}</p>
            <p>${esc(w.money)}</p>
            <p>${esc(w.body)}</p>
          </div>
          <div>
            <p>${esc(w.lens)}</p>
            <p>${esc(w.entertainment)}</p>
            <p>${esc(w.cityHeart)}</p>
            <p>${esc(w.meaning || "")}</p>
            <p>${esc(w.objects || "")}</p>
            <p>${esc(w.ai || "")}</p>
            <figure class="city">
              <img src="images/wmw-city-heart.png" alt="Open-heart cartography of the city" />
            </figure>
          </div>
        </div>
      `;
    },

    engines() {
      return `
        <h2 class="section-h">Engines from the manifesto</h2>
        <p class="lede">Teaching that wants to be a scene. If you have only touched the particular, these read as concepts. If you have touched the real, they are nearest and dearest. Original lines only — no one else’s novel, no hymn dump.</p>
        <div class="seeds">
          ${(SHOW.engines || [])
            .map(
              (s) => `
            <article class="seed">
              <p class="seed-bag">${esc(s.bag)}</p>
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.text)}</p>
            </article>`
            )
            .join("")}
        </div>
      `;
    },

    seeds() {
      return `
        <h2 class="section-h">Seeds & episode cards</h2>
        <p class="lede">A scads pile, sorted enough to steal from. Some already have hours. Small dramas first. Freak occurrences allowed. The boring day is the engine.</p>
        <div class="seeds">
          ${SHOW.seeds
            .map(
              (s) => `
            <article class="seed">
              <p class="seed-bag">${esc(s.bag)}</p>
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.text)}</p>
            </article>`
            )
            .join("")}
        </div>
      `;
    },

    bible() {
      return `
        <h2 class="section-h">Show bible — short</h2>
        <div class="bible-grid">
          <div>
            <p class="ch">Camera</p>
            <ul>
              ${SHOW.rules.map((r) => `<li>${esc(r)}</li>`).join("")}
              <li>When a main character focuses hard, shoot it like the Matrix. A napkin. A dish passed. A cheek pinched. Not a shootout.</li>
            </ul>
          </div>
          <div>
            <p class="ch">Maya / me and mine</p>
            <p class="lede">${esc(SHOW.definition.maya)}</p>
            <p class="lede">${esc(SHOW.definition.wish)}</p>
            <p class="mini">Full living notes: <code>Wish Myself Well/bible/SHOW-BIBLE.md</code></p>
          </div>
        </div>
      `;
    },
  };

  function card(c) {
    const sched = c.schedule
      ? `<ol class="schedule">${c.schedule
          .map((s) => `<li><span>${esc(s.t)}</span><span><b>${esc(s.name)}</b> — ${esc(s.note)}</span></li>`)
          .join("")}</ol>`
      : "";
    return `
      <article class="person" id="${esc(c.id)}">
        <div class="portrait"><img src="${esc(c.image)}" alt="${esc(c.name)}" /></div>
        <div class="person-body">
          <p class="role">${esc(c.age)} · ${esc(c.role)}</p>
          <h2>${esc(c.name)}</h2>
          <p class="mini">${esc(c.vibe)}</p>
          <p class="quote">“${esc(c.quote)}”</p>
          <p class="mini"><b>Want:</b> ${esc(c.want)}</p>
          <p class="mini"><b>Wound:</b> ${esc(c.wound)}</p>
          <p class="mini"><b>Wish:</b> ${esc(c.wishStyle)}</p>
          <p class="bio">${esc(c.bio)}</p>
          ${sched}
        </div>
      </article>`;
  }

  let epIndex = 0;
  let panelIndex = 0;

  function episodeList() {
    return [SHOW.episode1, SHOW.episode2, SHOW.episode3, SHOW.episode4, SHOW.episode5, SHOW.episode6, SHOW.episode7, SHOW.episode8, SHOW.episode9, SHOW.episode10, SHOW.episode11, SHOW.episode12].filter(Boolean);
  }

  function alsoWatchingFor(i) {
    const meta = SHOW.meta || { rooms: [], promptFlavors: [] };
    const rooms = meta.rooms || [];
    const prompts = rooms.filter((r) => r.kind === "prompt");
    const achievers = rooms.filter((r) => r.kind === "achiever");
    const others = rooms.filter((r) => r.kind === "watch");
    const pick = (arr, n) => (arr.length ? arr[n % arr.length] : null);
    const flavors = meta.promptFlavors || [];
    const flavor = flavors.length ? flavors[i % flavors.length] : null;
    return {
      note: meta.note || "",
      flavor,
      rooms: [pick(prompts, i), pick(achievers, i), pick(others, i)].filter(Boolean),
    };
  }

  function bindWatch() {
    const ep = episodeList()[epIndex] || SHOW.episode1;
    const strip = document.getElementById("strip");
    const pick = document.getElementById("ep-pick");
    const also = document.getElementById("also-watch");
    if (also) {
      const cut = alsoWatchingFor(epIndex);
      const flavorLine = cut.flavor ? `<p class="mini also-flavor">This hour’s prompt flavor · ${esc(cut.flavor.line)}</p>` : "";
      also.innerHTML = `
        <p class="ch">${esc((SHOW.meta && SHOW.meta.title) || "Also watching")}</p>
        <p class="mini">${esc(cut.note)}</p>
        ${flavorLine}
        <div class="also-rooms">
          ${cut.rooms
            .map(
              (r) => `
            <article class="also-room">
              <img src="${esc(r.still)}" alt="${esc(r.who)}" />
              <div class="also-body">
                <p class="seed-bag">${esc(r.kind)} · ${esc(r.flavor)}</p>
                <h3>${esc(r.who)}</h3>
                <p class="mini">${esc(r.watching)}</p>
                <p class="quote">${esc(r.line)}</p>
              </div>
            </article>`
            )
            .join("")}
        </div>`;
    }
    if (pick) {
      pick.onclick = (e) => {
        const b = e.target.closest("button[data-ep]");
        if (!b) return;
        epIndex = Number(b.dataset.ep);
        panelIndex = 0;
        render();
      };
    }
    strip.innerHTML = ep.panels
      .map((p, i) => `<button type="button" data-i="${i}">${String(p.n).padStart(2, "0")}</button>`)
      .join("");
    const draw = () => {
      const p = ep.panels[panelIndex];
      strip.querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i === panelIndex));
      document.getElementById("board").innerHTML = `
        <div class="frame">
          <img src="${esc(p.image)}" alt="${esc(p.slug)}" />
          <div class="letterbox-cap"><span>SC ${esc(String(p.n))} / ${esc(ep.code)}</span><span>Channel 2892</span></div>
        </div>
        <div class="panel-copy">
          <p class="slug">${esc(p.slug)}</p>
          <p class="camera">CAMERA · ${esc(p.camera)}</p>
          <p class="felt">${esc(p.felt)}</p>
          <ul class="lines">
            ${p.lines
              .map((l) => `<li><div class="who">${esc(l.who)}</div><p class="text">${esc(l.text)}</p></li>`)
              .join("")}
          </ul>
          <div class="pager">
            <button type="button" id="prev">Prev</button>
            <button type="button" id="next">Next</button>
          </div>
        </div>`;
      document.getElementById("prev").onclick = () => step(-1);
      document.getElementById("next").onclick = () => step(1);
    };
    const step = (d) => {
      panelIndex = (panelIndex + d + ep.panels.length) % ep.panels.length;
      draw();
    };
    strip.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      panelIndex = Number(b.dataset.i);
      draw();
    };
    draw();
  }

  document.addEventListener("keydown", (e) => {
    if (route() !== "watch") return;
    const ep = episodeList()[epIndex] || SHOW.episode1;
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      panelIndex = (panelIndex + 1) % ep.panels.length;
      bindWatch();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      panelIndex = (panelIndex - 1 + ep.panels.length) % ep.panels.length;
      bindWatch();
    }
  });

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function metricsAt(c, t) {
    const out = {};
    SHOW.lensAxes.forEach((ax) => {
      out[ax.id] = lerp(c.lens[ax.id], c.lensLater[ax.id], t);
    });
    out.witness = lerp(c.lens.witness, c.lensLater.witness, t);
    out.pain = lerp(c.lens.pain, c.lensLater.pain, t);
    return out;
  }

  function bindLens() {
    const canvas = document.getElementById("lens");
    const ctx = canvas.getContext("2d");
    const who = document.getElementById("who");
    const grain = document.getElementById("grain");
    const time = document.getElementById("time");
    const readout = document.getElementById("lens-readout");
    const wish = document.getElementById("lens-wish");
    const hud = document.getElementById("lens-hud");
    const city = document.getElementById("city-fig");
    const toCity = document.getElementById("to-city");

    const find = (id) => SHOW.characters.find((c) => c.id === id) || SHOW.characters[0];

    const paint = () => {
      const c = find(who.value);
      const t = Number(time.value) / 100;
      const g = grain.value;
      city.hidden = g !== "city";
      const m = metricsAt(c, t);
      readout.textContent = `${c.name} · witness ${Math.round(m.witness)} · pain-body ${Math.round(m.pain)}`;
      wish.textContent = c.wishStyle;
      hud.textContent = `${g} · 4D ${Math.round(t * 100)}%`;
      drawChart(ctx, canvas, c, m, g, t);
    };

    who.onchange = grain.onchange = time.oninput = paint;
    toCity.onclick = () => {
      grain.value = "city";
      paint();
      city.scrollIntoView({ behavior: "smooth" });
    };
    paint();
  }

  function drawChart(ctx, canvas, c, m, g, t) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#14110e";
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.52;
    const radius = Math.min(w, h) * 0.36;
    const axes = SHOW.lensAxes;
    const n = axes.length;

    ctx.strokeStyle = "rgba(232,220,200,0.18)";
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
        const r = (radius * ring) / 4;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.fillStyle = "rgba(232,220,200,0.7)";
    ctx.textAlign = "center";
    axes.forEach((ax, i) => {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      const x = cx + Math.cos(a) * (radius + 22);
      const y = cy + Math.sin(a) * (radius + 22);
      ctx.fillText(ax.label, x, y);
    });

    const poly = (metrics, color, fill, scale = 1) => {
      ctx.beginPath();
      axes.forEach((ax, i) => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
        const r = radius * (metrics[ax.id] / 100) * scale;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    if (g === "team") {
      poly(m, "#c45c26", "rgba(196,92,38,0.35)", 1.15);
    } else if (g === "family" || g === "pair") {
      const others = SHOW.characters.filter((o) => o.id === "vale" || o.id === "kids" || o.id === "anu").slice(0, g === "pair" ? 1 : 3);
      others.forEach((o, i) => {
        const om = metricsAt(o, t);
        poly(om, "rgba(184,137,45,0.8)", `rgba(184,137,45,${0.08 + i * 0.05})`, 0.92);
      });
      poly(m, "#e8dcc8", "rgba(232,220,200,0.16)");
    } else if (g === "city") {
      ctx.fillStyle = "rgba(232,220,200,0.16)";
      for (let i = 0; i < 36; i++) {
        const px = 50 + ((i * 97) % (w - 100));
        const py = 48 + ((i * 53) % (h - 96));
        ctx.beginPath();
        ctx.arc(px, py, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
        if (i > 0) {
          ctx.strokeStyle = "rgba(159,179,174,0.2)";
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }
      poly(m, "#9fb3ae", "rgba(159,179,174,0.2)", 0.7);
    } else {
      poly(m, "#e8dcc8", "rgba(232,220,200,0.16)");
    }

    const painR = radius * (m.pain / 100) * 0.55;
    const grd = ctx.createRadialGradient(cx + 20, cy + 10, 4, cx + 20, cy + 10, painR);
    grd.addColorStop(0, "rgba(90,53,68,0.55)");
    grd.addColorStop(1, "rgba(90,53,68,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx + 20, cy + 10, painR, 0, Math.PI * 2);
    ctx.fill();

    const wr = 6 + (m.witness / 100) * 16;
    ctx.beginPath();
    ctx.arc(cx, cy, wr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,250,242,0.95)";
    ctx.fill();

    ctx.fillStyle = "rgba(232,220,200,0.5)";
    ctx.textAlign = "left";
    ctx.fillText(c.name.toUpperCase(), 24, 28);
  }

  window.addEventListener("hashchange", render);
  render();
})();
