/* rig/load.js: the 3D characters load only when someone opens them (2026-10-04).

   The 3D view and its add-ons are about 670 KB of script. Most visits never open 3D, so the page loads only this
   small file (and rig/screen.js, the Screen's slim "3D actors" bar). The rest arrives on first use:
   - Library, 3D characters (the menu button below), the Studio tool "rig3d" and CurioRig.open / mount / fromCutout
     load the files, then do what was asked. mount() hands back a stand-in controller at once (with .ready, .stop()
     and .error()); once the files are in, every other property is the real controller's.
   - The Screen's 3D bar (rig/screen.js) calls CurioRig.load() before it shows a 3D view or writes a whole beat.
   - Tests and other tools can call CurioRig.load() (or CurioRigLoad.load()) and await it.

   FILES is the one list of 3D files, in the order they run. To add an add-on, add its file name here (after
   rig.js, before the add-ons that use it); nothing else changes. An add-on calls CurioRig.extend while it loads,
   which is before any view is built, so its setup hook is never missed. If one is ever added after a view is
   open, its setup and built hooks are run on that view at once (its panel shows next time the view opens).

   Each file loads once. They download side by side and run in this order. If one does not arrive, the view says so
   in plain words with a Try again button, and only the missing files are fetched again.

   Offline (sw.js caches what the app fetches): when the app runs as an installed, offline-ready app, the 3D files,
   three.js and the Plain figure are fetched once in the background after the page has loaded, so 3D also works
   offline for someone who never opened it while online.

   core/site-check.js reads FILES (like every <folder>/load.js), so a new add-on is checked for being committed. */
(function () {
  if (typeof window === "undefined" || window.CurioRigLoad) return;
  const FILES = ["rig.js", "ik.js", "lights.js", "dynamics.js", "camera.js", "maker.js", "scene.js", "staging.js", "sets.js", "faces.js", "gestures.js", "snapshot.js"];
  /* What else a 3D view fetches, warmed together with FILES (the same addresses rig.js uses). */
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const ALSO = ["GLTFLoader.js", "models/rigged-figure.glb"];
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.replace(/load\.js(\?.*)?$/, "") : "rig/";

  const state = {}; /* file -> "loading" | "done" | "failed" */
  let loading = null;
  let done = false;
  const queued = []; /* CurioRig.extend calls made before rig.js arrived */
  const pending = []; /* stand-in controllers from mount() before the files arrived */
  const stub = {};

  function plainError(failed) {
    const what = failed.length === 1 ? "one of its files (" + failed[0] + ")" : failed.length + " of its files (" + failed.join(", ") + ")";
    return new Error("The 3D view could not load " + what + ". Check the connection and press Try again.");
  }

  /* When rig.js has run: its CurioRig joins this one, so anything that kept a reference to window.CurioRig
     (an add-on loaded early, rig/screen.js) sees the real thing. Until every file is in, open, mount, fromCutout
     and current stay the waiting ones, so nothing builds a view without all its add-ons. */
  let real = null;
  const ENTRY = ["mount", "open", "fromCutout", "current"];
  function adopt() {
    if (!real) {
      const r = window.CurioRig;
      if (!r || r === stub || !r.mount) return;
      real = r;
    }
    const copy = Object.assign({}, real);
    if (!done) ENTRY.forEach((k) => delete copy[k]);
    Object.assign(stub, copy, {
      load,
      loaded: () => done,
      extend(x) {
        const ok = real.extend(x);
        /* added after a view was built: run what it would have run on that view */
        const c = done && ok && real.current();
        const ctx = c && c.ctx;
        if (ctx && ctx.scene) {
          try {
            if (typeof x.setup === "function") x.setup(ctx, 0);
            if (ctx.model && typeof x.built === "function") x.built(ctx);
          } catch (e) {
            console.warn("3D add-on " + x.id + " (late setup): " + e.message);
          }
        }
        return ok;
      },
    });
    window.CurioRig = stub;
    queued.splice(0).forEach((x) => stub.extend(x));
  }

  function load() {
    if (done) return Promise.resolve(stub);
    if (loading) return loading;
    if (!window.THREE) preload(THREE_URL);
    if (!(window.THREE && window.THREE.GLTFLoader)) preload(base + "GLTFLoader.js");
    const want = FILES.filter((f) => state[f] !== "done");
    const failed = [];
    loading = new Promise((resolve, reject) => {
      let left = want.length;
      const settle = () => {
        if (--left > 0) return;
        loading = null;
        if (failed.length) return reject(plainError(failed));
        done = true;
        adopt();
        resolve(stub);
      };
      want.forEach((f) => {
        state[f] = "loading";
        const s = document.createElement("script");
        s.src = base + f;
        s.async = false; /* download side by side, run in FILES order */
        s.dataset.rigLazy = f;
        s.onload = () => {
          state[f] = "done";
          if (f === "rig.js") adopt();
          settle();
        };
        s.onerror = () => {
          state[f] = "failed";
          failed.push(f);
          s.remove();
          settle();
        };
        document.head.appendChild(s);
      });
    });
    return loading;
  }

  /* three.js and its loader start downloading next to the add-ons; rig.js then finds them in the browser's cache. */
  const preloaded = new Set();
  function preload(href) {
    if (preloaded.has(href)) return;
    preloaded.add(href);
    const l = document.createElement("link");
    l.rel = "preload";
    l.as = "script";
    l.href = href;
    document.head.appendChild(l);
  }

  /* ---------- while the files are on their way ---------- */
  function say(host, err, retry) {
    if (!host) return;
    host.innerHTML = err
      ? `<p class="rig-wait" role="alert"></p><button type="button" class="rig-retry">Try again</button>`
      : `<p class="rig-wait" role="status">Getting the 3D view ready…</p>`;
    if (err) {
      host.querySelector(".rig-wait").textContent = err.message;
      host.querySelector(".rig-retry").addEventListener("click", retry);
    }
  }

  /* A stand-in controller: ready, stop and error now; everything else is the real one's once it exists. */
  function mountLater(host, opts) {
    let real = null;
    let stopped = false;
    let err = "";
    const go = () => {
      say(host);
      return load().then(
        () => {
          if (stopped) return;
          real = stub.mount(host, opts);
          return real.ready;
        },
        (e) => {
          err = e.message;
          if (!stopped) say(host, e, () => (ready = go()));
        }
      );
    };
    let ready = go();
    const own = {
      pending: true,
      get ready() {
        return real ? real.ready : ready.then(() => (real ? real.ready : undefined));
      },
      stop() {
        stopped = true;
        if (real) real.stop();
        const i = pending.indexOf(px);
        if (i >= 0) pending.splice(i, 1);
      },
      error: () => (real ? real.error() : err),
    };
    const px = new Proxy(own, { get: (t, k) => (real && k !== "pending" && k !== "stop" ? real[k] : t[k]) });
    pending.push(px);
    return px;
  }

  /* A small note at the bottom of the window while the 3D window's files arrive (open() makes its own window). */
  let note = null;
  function notice(text, retry) {
    if (!note) {
      note = document.createElement("div");
      note.className = "rig-lazy-note";
      note.setAttribute("role", "status");
      note.style.cssText = "position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);z-index:90;max-width:calc(100vw - 32px);padding:.5rem .8rem;border-radius:.5rem;background:#222;color:#fff;font-size:.9rem;box-shadow:0 4px 18px #0006;display:flex;gap:.6rem;align-items:center";
      document.body.appendChild(note);
    }
    note.innerHTML = "<span></span>";
    note.firstChild.textContent = text;
    if (retry) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = "Try again";
      b.addEventListener("click", retry);
      const x = document.createElement("button");
      x.type = "button";
      x.textContent = "Close";
      x.addEventListener("click", hideNote);
      b.style.cssText = x.style.cssText = "flex:none;white-space:nowrap";
      note.append(b, x);
    }
  }
  function hideNote() {
    if (note) note.remove();
    note = null;
  }
  function later(name) {
    return function (...args) {
      notice("Getting the 3D view ready…");
      return load().then(
        () => {
          hideNote();
          return stub[name](...args);
        },
        (e) => {
          notice(e.message, () => stub[name](...args));
          throw e;
        }
      );
    };
  }

  Object.assign(stub, {
    lazy: true,
    load,
    loaded: () => done,
    files: () => FILES.map((f) => base + f),
    extend(x) {
      if (!x || !x.id || queued.some((q) => q.id === x.id)) return false;
      queued.push(x);
      return true;
    },
    mount: mountLater,
    open: later("open"),
    fromCutout: later("fromCutout"),
    current: () => pending[pending.length - 1] || null,
  });
  window.CurioRig = stub;
  window.CurioRigLoad = { FILES: FILES.slice(), load, loaded: () => done, warm };

  /* ---------- the bits of 3D the rest of the app sees at startup ---------- */
  /* Library, 3D characters (rig.js keeps this same button when it arrives). */
  function wire() {
    const menu = document.getElementById("lib-menu");
    if (!menu || menu.querySelector("[data-rig3d]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.rig3d = "open";
    b.innerHTML = "3D characters<small>bodies and objects that move by rules</small>";
    menu.insertBefore(b, menu.children[1] || null);
    b.addEventListener("click", () => {
      menu.hidden = true;
      Promise.resolve(window.CurioRig.open()).catch(() => {});
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  /* A Studio tool too, so the Screen's "Maya tool" button on Movement rules opens it. rig.js registers the same
     tool again when it arrives, which takes this one's place. */
  if (window.CuriosityStudio)
    window.CuriosityStudio.register({
      id: "rig3d",
      label: "3D characters",
      order: 61,
      maya: "Skeletons and joint limits, aim constraints, Set Driven Key, dynamic joint chains, Time Editor clips",
      draw(el) {
        window.CurioRig.mount(el);
      },
    });

  /* ---------- offline: keep the 3D files in sw.js's cache even if 3D was never opened ---------- */
  function warm() {
    if (!window.caches || !navigator.serviceWorker || !navigator.serviceWorker.controller || navigator.onLine === false) return Promise.resolve(0);
    const urls = FILES.concat(ALSO).map((f) => new URL(base + f, location.href).href).concat(THREE_URL);
    let n = 0;
    return urls.reduce(
      (p, u) =>
        p.then(() =>
          caches.match(u).then((hit) => {
            if (hit) return;
            n++;
            /* sw.js keeps what passes through it */
            return fetch(u, u.startsWith(location.origin) ? {} : { mode: "no-cors" }).catch(() => {});
          })
        ),
      Promise.resolve()
    ).then(() => n);
  }
  window.addEventListener("load", () => {
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 3000));
    setTimeout(() => idle(() => warm().catch(() => {})), 5000);
  });
})();
