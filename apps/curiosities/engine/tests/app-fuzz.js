/* The Curiosity Lane letter's testing lessons, on the whole app (not just the engine):
     node apps/curiosities/engine/tests/app-fuzz.js [--events 12000] [--chains 6] [--seed N]
       [--three path/to/three.min.js] [--only monkey,chains,keys,bridge] [--out report.json]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   1. monkey: every page the app has (My film, the storyboard, every workspace, every Library page, the
      engine, momentum) gets its share of N random clicks, key presses, wheel turns, hovers and value
      changes. Any page error or console error is a failure, reported with the page and the last action.
   2. chains: random changes across random pages, then the app-wide undo back to the start: every saved
      part must come back exactly (by fingerprint), then redo, then a reload, which must change nothing,
      and a second reload, which must also change nothing.
   3. keys: every saved key (localStorage curiosities-*) gets malformed values one at a time (not JSON,
      the wrong type, nulls, huge text, a prototype trick), then the page reloads and every page opens.
      A key the app cannot read must be ignored or repaired, never break the page.
   4. bridge: every bridge message type with malformed fields; nothing may throw, and nothing odd may be
      saved.
   Seeds are printed, so any failure can be repeated. Exit code 1 when anything failed. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const EVENTS = Number(arg("--events", 12000));
const CHAINS = Number(arg("--chains", 6));
const SEED = Number(arg("--seed", Date.now() % 100000));
const DEBUG = process.argv.includes("--debug");
const ONLY = new Set(String(arg("--only", "monkey,chains,keys,bridge")).split(","));
const OUT = arg("--out", "");
const THREE = arg("--three", "");
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const report = { seed: SEED, events: 0, pages: [], failures: [], notes: [] };
const fail = (kind, where, text, extra) => {
  const key = kind + "|" + where + "|" + String(text).slice(0, 160);
  if (report.failures.some((f) => f.key === key)) return;
  report.failures.push(Object.assign({ key, kind, where, text: String(text).slice(0, 600) }, extra || {}));
  console.log("FAIL [" + kind + "] " + where + ": " + String(text).slice(0, 300));
};
const note = (t) => {
  report.notes.push(t);
  console.log("     " + t);
};

/* The pages: every bar and Library button that opens one, and the overlays (engine, momentum). Opened by
   clicking the button itself (in the DOM, even when its menu is closed), the way a person would. */
const PAGES_JS = () => {
  const out = [];
  const seen = new Set();
  document.querySelectorAll("#tabs button, #lib-menu button, .ws-menu button").forEach((b) => {
    const d = b.dataset;
    const id = d.ws ? "ws:" + d.ws : d.tool ? "tool:" + d.tool : d.tab ? "tab:" + d.tab : d.engine ? "engine" : d.momentum != null ? "momentum" : null;
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push({ id, label: (b.childNodes[0] && b.childNodes[0].textContent ? b.childNodes[0].textContent : b.textContent).trim().slice(0, 40) });
  });
  if (window.CurioScreen) out.unshift({ id: "screen", label: "Screen" });
  return out;
};
const OPEN_JS = (id) => {
  const sel = id.startsWith("ws:") ? `[data-ws="${id.slice(3)}"]` : id.startsWith("tool:") ? `[data-tool="${id.slice(5)}"]` : id.startsWith("tab:") ? `#tabs [data-tab="${id.slice(4)}"]:not([data-ws]):not([data-tool])` : id === "engine" ? "[data-engine]" : "[data-momentum]";
  if (id === "screen") return !!(window.CurioScreen && (CurioScreen.open(), CurioScreen.isOpen()));
  if (window.CurioScreen && CurioScreen.isOpen()) CurioScreen.close();
  /* Close overlays first, so each page starts from the app. */
  document.querySelectorAll(".en-overlay:not([hidden]) [data-act=close], .mo-overlay:not([hidden]) [data-act=close], [data-momentum-close]").forEach((x) => x.click());
  const b = document.querySelector(sel);
  if (!b) return false;
  b.click();
  return true;
};

/* One random event on the visible page. Buttons that leave the page, open files, print, or undo with a
   reload are left out of the random part (the chains test the reloads). */
const MONKEY_JS = async ({ n, seed }) => {
  let s = seed >>> 0;
  const R = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const SKIP_ACT = /^(app-undo|app-redo|sb-print|sb-unprint|close)$/;
  const SKIP_TEXT = /download|export|open or new|open a project|new project|save project|choose file|print this|import|upload|load a/i;
  window.print = () => {};
  const visible = (e) => {
    if (e.disabled || e.closest("[hidden]")) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const stats = { click: 0, key: 0, wheel: 0, hover: 0, change: 0, last: "" };
  for (let i = 0; i < n; i++) {
    const overlay = document.querySelector(".en-overlay:not([hidden]), .mo-overlay:not([hidden]), [role=dialog]:not([hidden]), .sc-page:not([hidden])");
    const scope = overlay || document.querySelector("main") || document.body;
    const els = [...scope.querySelectorAll("button, input, select, textarea, summary, canvas, [role=button], [data-act], [tabindex]")].filter(
      (e) => visible(e) && !(e.dataset && SKIP_ACT.test(e.dataset.act || "")) && !(e.type === "file") && !SKIP_TEXT.test(e.textContent || e.value || "") && !(e.tagName === "A" && e.href)
    );
    const r = R();
    try {
      if (r < 0.5 && els.length) {
        const e = pick(els);
        stats.last = "click " + e.tagName + (e.dataset && e.dataset.act ? "[" + e.dataset.act + "]" : "") + " " + (e.textContent || e.name || "").trim().slice(0, 30);
        e.click();
        stats.click++;
      } else if (r < 0.65 && els.length) {
        const e = pick(els.filter((x) => /INPUT|SELECT|TEXTAREA/.test(x.tagName)).concat(els.slice(0, 1)));
        stats.last = "change " + e.tagName + " " + (e.name || e.id || "");
        if (e.tagName === "SELECT" && e.options.length) e.selectedIndex = Math.floor(R() * e.options.length);
        else if (e.type === "checkbox" || e.type === "radio") e.checked = !e.checked;
        else if (e.type === "range" || e.type === "number") e.value = String(Math.floor(R() * 200) - 50);
        else if ("value" in e) e.value = pick(["", "x", "  ", "<b>hi</b>", "999999", "-1", "Ünïcødé ✨", "a".repeat(300), "__proto__", "null"]);
        e.dispatchEvent(new Event("input", { bubbles: true }));
        e.dispatchEvent(new Event("change", { bubbles: true }));
        stats.change++;
      } else if (r < 0.82) {
        const key = pick(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape", "Enter", " ", "Tab", "z", "y", "1", "Delete", "Home", "End", "PageDown"]);
        const t = document.activeElement || document.body;
        stats.last = "key " + key + (R() < 0.2 ? " + ctrl" : "");
        const o = { key, bubbles: true, ctrlKey: stats.last.endsWith("ctrl"), shiftKey: R() < 0.1 };
        t.dispatchEvent(new KeyboardEvent("keydown", o));
        t.dispatchEvent(new KeyboardEvent("keyup", o));
        stats.key++;
      } else if (r < 0.92) {
        const e = els.length ? pick(els) : document.body;
        stats.last = "wheel " + e.tagName;
        e.dispatchEvent(new WheelEvent("wheel", { deltaY: (R() - 0.5) * 600, bubbles: true }));
        stats.wheel++;
      } else if (els.length) {
        const e = pick(els);
        const b = e.getBoundingClientRect();
        stats.last = "hover " + e.tagName;
        ["pointerover", "mouseover", "pointermove", "mousemove", "pointerout", "mouseout"].forEach((t) => e.dispatchEvent(new MouseEvent(t, { bubbles: true, clientX: b.left + 2, clientY: b.top + 2 })));
        stats.hover++;
      }
    } catch (err) {
      stats.thrown = (stats.thrown || []).concat([stats.last + ": " + String(err && err.message)]).slice(0, 5);
    }
    if (i % 25 === 24) await new Promise((res) => setTimeout(res, 0));
  }
  return stats;
};

/* Every saved part of the app, for fingerprints. View keys (which tab is open, scroll) are left out. */
const SNAP_JS = () => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("curiosities-") && !/-(view|tab|prefs|ui)-v\d+$|^curiosities-(workspace-v1|glossary-v1|studio-tab-v1|engine-view-v1)$|autosave|history|snapshot/.test(k)) out[k] = localStorage.getItem(k);
  }
  return out;
};
const diffSnap = (a, b) => {
  const keys = new Set(Object.keys(a).concat(Object.keys(b)));
  return [...keys].filter((k) => a[k] !== b[k]);
};

(async () => {
  const server = await serve();
  const url = "http://127.0.0.1:" + server.address().port + "/index.html";
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: false });
  const page = await context.newPage();
  let where = "start";
  let last = "";
  page.on("pageerror", (e) => fail("page error", where, (e && e.message) + (last ? "  (after: " + last + ")" : ""), { stack: String(e && e.stack).split("\n").slice(0, 4).join(" | ") }));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g|net::ERR/.test(m.text()) && fail("console error", where, m.text() + (last ? "  (after: " + last + ")" : "")));
  page.on("dialog", (d) => d.dismiss().catch(() => {}));
  page.on("filechooser", () => {});
  if (THREE) await page.route(/three\.min\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(THREE, "utf8") }));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => (/three|fonts/.test(r.request().url()) ? r.continue() : r.abort()));
  const ready = async () => {
    await page.waitForFunction(() => window.CuriosityBoard && document.readyState === "complete", null, { timeout: 30000 });
    await page.waitForTimeout(300);
  };
  await page.goto(url);
  await ready();
  /* The Screen opens on start; it is one of the pages below, and the rest start from the app. */
  await page.evaluate(() => window.CurioScreen && CurioScreen.isOpen() && CurioScreen.close());
  const pages = await page.evaluate(PAGES_JS);
  report.pages = pages.map((p) => p.id);
  console.log("seed " + SEED + "; " + pages.length + " pages: " + pages.map((p) => p.label).join(", "));
  const open = async (id) => {
    where = id;
    const okOpen = await page.evaluate(OPEN_JS, id).catch(() => false);
    if (!okOpen) fail("open", id, "could not open the page");
    await page.waitForTimeout(120);
  };
  /* A random event may still reload the page (an undo, a project): wait it out and carry on. */
  const safely = async (fn) => {
    try {
      return await fn();
    } catch (e) {
      if (/context was destroyed|navigation|Target closed/i.test(String(e && e.message))) {
        note("a page reload happened during " + where + " (after: " + last + ")");
        await ready().catch(() => {});
        return null;
      }
      throw e;
    }
  };

  /* ---------- 1. monkey ---------- */
  if (ONLY.has("monkey")) {
    const R = rng(SEED);
    const per = Math.ceil(EVENTS / pages.length);
    const t0 = Date.now();
    for (const p of pages) {
      await safely(() => open(p.id));
      let done = 0;
      while (done < per) {
        const n = Math.min(100, per - done);
        const stats = await safely(() => page.evaluate(MONKEY_JS, { n, seed: Math.floor(R() * 1e9) }));
        if (stats) {
          last = stats.last;
          (stats.thrown || []).forEach((t) => fail("handler threw", p.id, t));
        }
        done += n;
        report.events += n;
        /* Stay on this page if a click wandered off (a link into another workspace is fine, but come back). */
        if (done % 300 === 0) await safely(() => open(p.id));
      }
    }
    console.log("ok   monkey: " + report.events + " random events over " + pages.length + " pages in " + Math.round((Date.now() - t0) / 1000) + " s");
  }

  /* ---------- 2. undo, redo and reload chains ---------- */
  if (ONLY.has("chains")) {
    const R = rng(SEED + 1);
    for (let c = 0; c < CHAINS; c++) {
      where = "chain " + (c + 1);
      /* A reload empties the store's in-page undo, so it holds only this chain's steps (it keeps at most 300). */
      await page.reload();
      await ready();
      await page.evaluate(() => window.CurioAppUndo && CurioAppUndo.clear());
      const base = await page.evaluate(SNAP_JS);
      /* The store keeps undo from before this chain (the monkey part): undo only what this chain added. */
      const storeBase = await page.evaluate(() => (window.CurioStore ? CurioStore.history().undo.length : 0));
      const used = [];
      for (let k = 0; k < 4; k++) {
        const p = pages[Math.floor(R() * pages.length)];
        used.push(p.id);
        await safely(() => open(p.id));
        const st = await safely(() => page.evaluate(MONKEY_JS, { n: 200, seed: Math.floor(R() * 1e9) }));
        if (st) last = st.last;
        await page.waitForTimeout(1600); /* past the 1.5 s merge window, so steps stay apart */
      }
      const changed = await page.evaluate(SNAP_JS);
      const steps = await page.evaluate(() => (window.CurioAppUndo ? CurioAppUndo.steps().length : 0));
      const storeSteps = (await page.evaluate(() => (window.CurioStore ? CurioStore.history().undo.length : 0))) - storeBase;
      const dbg = await page.evaluate(() => ({ big: (JSON.parse(sessionStorage.getItem("curio-app-undo-v2") || "{}").steps || []).map((x) => x.key.slice(12) + ":" + ((x.a || "").length + (x.b || "").length)).filter((x) => +x.split(":")[1] > 5000), session: (sessionStorage.getItem("curio-app-undo-v2") || "").length, sizes: Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith("curiosities-")).map((k) => [k, localStorage.getItem(k).length]).filter((x) => x[1] > 20000)) }));
      if (DEBUG) console.log("     debug " + where + ": app steps " + steps + ", store steps " + storeSteps + ", " + JSON.stringify(dbg));
      if (!steps && storeSteps <= 0) {
        note(where + ": no saved change on " + used.join(", "));
        continue;
      }
      /* Undo everything: the store's steps in place, then the app history back to the start (one reload). */
      await page.evaluate((n) => {
        for (let i = 0; i < n && window.CurioStore && CurioStore.canUndo(); i++) CurioStore.undo();
      }, storeSteps);
      if (steps) {
        await Promise.all([page.waitForNavigation({ timeout: 20000 }).catch(() => null), page.evaluate(() => CurioAppUndo.undoTo(CurioAppUndo.steps().length - 1))]);
        await ready();
      }
      const back = await page.evaluate(SNAP_JS);
      /* A store part first saved during the chain stays saved at its starting values after the store's undo. */
      const owned = await page.evaluate((ks) => ks.filter((k) => window.CurioStore && CurioStore.owns(k)), Object.keys(back).filter((k) => !(k in base)));
      const d1 = diffSnap(base, back).filter((k) => !owned.includes(k));
      if (d1.length) fail("undo", where, "after undoing " + steps + " app steps (pages " + used.join(", ") + "), these parts did not come back: " + d1.join(", "), { base: Object.fromEntries(d1.map((k) => [k, String(base[k]).slice(0, 300)])), back: Object.fromEntries(d1.map((k) => [k, String(back[k]).slice(0, 300)])) });
      else console.log("ok   " + where + ": " + steps + " app steps over " + used.join(", ") + " undone back to the start exactly");
      /* Redo it all. */
      const canRedo = await page.evaluate(() => window.CurioAppUndo && CurioAppUndo.canRedo());
      if (canRedo) {
        await Promise.all([page.waitForNavigation({ timeout: 20000 }).catch(() => null), page.evaluate(() => CurioAppUndo.redo())]);
        await ready();
      }
      /* The undo reloaded the page, so the store's own redo is gone; put its parts back by hand from the
         snapshot taken before the undo (the store's parts are checked by the undo above). */
      if (canRedo || storeSteps > 0) {
        if (storeSteps > 0) await page.evaluate((snap) => {
          Object.keys(snap).forEach((k) => window.CurioStore && CurioStore.owns(k) && localStorage.setItem(k, snap[k]));
        }, changed);
        if (storeSteps > 0) { await page.reload(); await ready(); }
        const again = await page.evaluate(SNAP_JS);
        const d2 = diffSnap(changed, again);
        if (d2.length) fail("redo", where, "after redo these parts differ from before the undo: " + d2.join(", "));
      }
      /* Reload twice: nothing may change. */
      const before = await page.evaluate(SNAP_JS);
      await page.reload();
      await ready();
      const r1 = await page.evaluate(SNAP_JS);
      const d3 = diffSnap(before, r1);
      if (d3.length) fail("reload", where, "a reload changed saved parts: " + d3.join(", "), { before: Object.fromEntries(d3.map((k) => [k, String(before[k]).slice(0, 400)])), after: Object.fromEntries(d3.map((k) => [k, String(r1[k]).slice(0, 400)])) });
      await page.reload();
      await ready();
      const r2 = await page.evaluate(SNAP_JS);
      const d4 = diffSnap(r1, r2);
      if (d4.length) fail("reload", where, "a second reload changed saved parts: " + d4.join(", "));
      const eng = await page.evaluate(() => (window.CurioEngine ? CurioEngine.lastCheck() : { ok: true }));
      if (!eng.ok) fail("fingerprint", where, "the engine's film came back different: " + eng.note);
    }
  }

  /* ---------- 3. malformed saved values ---------- */
  if (ONLY.has("keys")) {
    const all = await page.evaluate(() => {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i));
      return out.filter((k) => k && k.startsWith("curiosities-"));
    });
    const good = await page.evaluate(() => {
      const o = {};
      for (let i = 0; i < localStorage.length; i++) o[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
      return o;
    });
    const BAD = ["{not json", "null", "42", '"a string"', "[]", "{}", "[1,2,3]", '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}}}', JSON.stringify({ x: "y".repeat(200000) }), "true"];
    console.log("     keys: " + all.length + " saved parts x " + BAD.length + " malformed values");
    for (const k of all.sort()) {
      const broke = [];
      for (const bad of BAD) {
        where = "key " + k + " = " + bad.slice(0, 30);
        last = "";
        const before = report.failures.length;
        await page.evaluate(([key, v]) => {
          try {
            localStorage.setItem(key, v);
          } catch (e) {}
        }, [k, bad]);
        await page.reload();
        await ready().catch(() => fail("load", where, "the page did not come up"));
        for (const p of pages) await safely(() => open(p.id));
        const polluted = await page.evaluate(() => ({}.polluted !== undefined));
        if (polluted) fail("pollution", where, "an object prototype was polluted");
        if (report.failures.length > before) broke.push(bad.slice(0, 20));
        /* Put the good value back before the next one. */
        await page.evaluate(([key, v]) => (v == null ? localStorage.removeItem(key) : localStorage.setItem(key, v)), [k, good[k]]);
      }
      console.log((broke.length ? "FAIL " : "ok   ") + "key " + k + (broke.length ? ": breaks on " + broke.join(" | ") : ": every malformed value ignored or repaired"));
    }
    await page.reload();
    await ready();
  }

  /* ---------- 4. malformed bridge messages ---------- */
  if (ONLY.has("bridge")) {
    where = "bridge";
    const r = await page.evaluate((seed) => {
      let s = seed >>> 0;
      const R = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
      const pick = (a) => a[Math.floor(R() * a.length)];
      const B = window.CurioBridge;
      if (!B) return { skipped: true };
      const keysBefore = JSON.stringify(Object.keys(localStorage).sort());
      const types = ["set", "trigger", "stopAll", "list", "panels", "apply", "timeline", "nope", "", null, 5];
      const bads = [undefined, null, NaN, Infinity, -1, 1e308, "", "x", "__proto__", "constructor", [], {}, [1, [2]], { __proto__: { polluted: 1 } }, "c:angleHeight", "s:noir", "p:", "ps:", true, () => 1, "a".repeat(5000)];
      const thrown = [];
      let sent = 0;
      for (let i = 0; i < 6000; i++) {
        const m = { type: pick(types) };
        ["key", "m", "on", "ids", "label", "values"].forEach((f) => R() < 0.6 && (m[f] = pick(bads)));
        if (m.type === "apply" && R() < 0.5) m.values = { [pick(["shotSize", "volume", "__proto__", "x"])]: pick([[pick(bads)], pick(bads)]) };
        const msg = R() < 0.1 ? pick(["{", "null", "[]", '{"type":"set","key":"c:angleHeight","m":"x"}', JSON.stringify(m)]) : m;
        try {
          B.handle(msg);
          if (B.fromOsc) B.fromOsc(pick(["/curio/set/c/angleHeight", "/curio", "", null, "/curio/trigger"]), [pick(bads)]);
          if (B.toOsc) B.toOsc(m);
          sent++;
        } catch (e) {
          if (thrown.length < 8) thrown.push(JSON.stringify(m, (k, v) => (typeof v === "function" ? "fn" : v)).slice(0, 160) + ": " + e.message);
        }
      }
      try {
        if (window.CurioAuto) CurioAuto.stopAll();
      } catch (e) {}
      const vals = window.CuriosityBoard ? CuriosityBoard.values() : {};
      const odd = Object.keys(vals).filter((k) => vals[k] === undefined || (typeof vals[k] === "number" && !isFinite(vals[k])));
      return { sent, thrown, polluted: {}.polluted !== undefined, odd, newKeys: JSON.stringify(Object.keys(localStorage).sort()) !== keysBefore };
    }, SEED + 3);
    if (r.skipped) note("bridge: not on this page");
    else {
      r.thrown.forEach((t) => fail("bridge threw", "bridge", t));
      if (r.polluted) fail("pollution", "bridge", "a bridge message polluted an object prototype");
      if (r.odd.length) fail("bridge saved odd values", "bridge", "My film holds non-values after bad messages: " + r.odd.join(", "));
      if (!r.thrown.length && !r.polluted && !r.odd.length) console.log("ok   bridge: " + r.sent + " malformed messages, nothing threw, nothing odd kept");
    }
  }

  await browser.close();
  server.close();
  report.failed = report.failures.length;
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("\nseed " + SEED + ": " + report.events + " random events, " + report.pages.length + " pages, " + report.failures.length + " failures");
  process.exit(report.failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
