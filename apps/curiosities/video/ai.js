/* video/ai.js: one plug-in slot per curiosity family, so any company's AI can do that family's job.

   window.CurioAI
   - FAMILIES                         the curiosity families (cut-outs, picture, motion, face, voice, ...)
   - register(family, id, provider)   provider: { label, where: "browser" | "server", company?, cost?(job) -> text,
                                      ...the family's methods }. The first browser provider is the default.
   - providers(family) -> [{ id, ...provider }]
   - use(family) -> provider          the chosen one when it can run (a server one needs its company's key or a
                                      proxy), else the browser default
   - choose(family, id), chosen(family)
   - key(company), setKey(company, key)        the user's own key, kept only in this browser
   - proxy(company), setProxy(company, url)    a server of yours that holds the key (for a paid app: the key never
                                               reaches the browser)

   - price(providerOrCost, job) -> dollars        a rough price, shown before anything runs
   - caps(), setCaps({ job, day })               spending caps (defaults $1 a job, $5 a day)
   - spent() -> { date, dollars, log }           today's spending in this browser
   - check(dollars) -> null | reason             why a job of that price would be stopped
   - falRun(app, input, { estimate, label })     refuses to start past a cap, and records the price when done

   Keys are stored under "curiomatic-ai-keys", not a "curiosities-" key, so they never go into a saved .curio project
   file. They are only ever sent to their own company (or your proxy). */
(function () {
  const KEY = "curiomatic-ai-keys",
    PICKS = "curiosities-ai-picks-v1",
    CAPS = "curiosities-ai-caps-v1",
    SPENT = "curiomatic-ai-spent";
  const FAMILIES = [
    { id: "cutout", label: "Cut-outs (people, clothes, hair, objects)" },
    { id: "picture", label: "Picture: color, light, look" },
    { id: "depth", label: "Depth and camera" },
    { id: "motion", label: "Motion and pose" },
    { id: "face", label: "Face: expression (face replacement needs consent)" },
    { id: "voice", label: "Voice" },
    { id: "dialogue", label: "Dialogue writing" },
    { id: "music", label: "Music and sound" },
    { id: "generate", label: "Turn it into something else" },
  ];
  const reg = {};
  const read = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "{}") || {};
    } catch (e) {
      return {};
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  };
  function register(family, id, provider) {
    (reg[family] = reg[family] || []).push(Object.assign({ id }, provider));
  }
  function providers(family) {
    return (reg[family] || []).slice();
  }
  function key(company) {
    return read(KEY)[company] || "";
  }
  function setKey(company, k) {
    const all = read(KEY);
    if (k) all[company] = String(k).trim();
    else delete all[company];
    write(KEY, all);
  }
  function proxy(company) {
    return read(KEY)["proxy:" + company] || "";
  }
  function setProxy(company, url) {
    const all = read(KEY);
    if (url && /^https:\/\//.test(url)) all["proxy:" + company] = url.replace(/\/+$/, "");
    else delete all["proxy:" + company];
    write(KEY, all);
  }
  const canRun = (p) => p.where === "browser" || !p.company || !!key(p.company) || !!proxy(p.company);
  function chosen(family) {
    return read(PICKS)[family] || "";
  }
  function choose(family, id) {
    const all = read(PICKS);
    all[family] = id;
    write(PICKS, all);
  }
  function use(family) {
    const list = reg[family] || [];
    const pick = list.find((p) => p.id === chosen(family));
    if (pick && canRun(pick)) return pick;
    return list.find((p) => p.where === "browser") || list.find(canRun) || null;
  }

  /* Money: every paid job has a price shown before it runs, and caps that stop it. Prices are rough (the
     company's own price list is what you pay). */
  const today = () => new Date().toISOString().slice(0, 10);
  function caps() {
    const c = read(CAPS);
    return { job: c.job > 0 ? c.job : 1, day: c.day > 0 ? c.day : 5 };
  }
  function setCaps(c) {
    const now = caps();
    const n = (v, d) => (Number(v) > 0 ? Math.min(100, Number(v)) : d);
    write(CAPS, { job: n(c && c.job, now.job), day: n(c && c.day, now.day) });
  }
  function spent() {
    const x = read(SPENT);
    return x.date === today() ? { date: x.date, dollars: x.dollars || 0, log: x.log || [] } : { date: today(), dollars: 0, log: [] };
  }
  function record(dollars, label) {
    const x = spent();
    x.dollars = Math.round((x.dollars + dollars) * 1000) / 1000;
    x.log = x.log.concat([{ at: new Date().toISOString(), dollars, label: String(label || "").slice(0, 80) }]).slice(-50);
    write(SPENT, x);
  }
  function price(p, job) {
    const f = typeof p === "function" ? p : p && p.price;
    return f ? Math.max(0, Number(f(job || {})) || 0) : 0;
  }
  const money = (d) => "$" + (d < 1 ? d.toFixed(2) : d.toFixed(2));
  function check(dollars) {
    const c = caps(),
      s = spent();
    if (!(dollars >= 0)) return "No price for this job, so it was not started.";
    if (dollars > c.job) return `About ${money(dollars)}: more than your ${money(c.job)} a job cap. Make it shorter or smaller, or raise the cap.`;
    if (s.dollars + dollars > c.day) return `About ${money(dollars)}, and ${money(s.dollars)} already spent today: past your ${money(c.day)} a day cap.`;
    return null;
  }

  /* fal.ai's queue: send a job, wait for it, return its result. With a proxy, the proxy adds the key. It never
     starts without a price that fits the caps. */
  async function falRun(app, input, opts) {
    opts = opts || {};
    const stop = check(opts.estimate);
    if (stop) throw new Error(stop);
    const base = proxy("fal") || "https://queue.fal.run";
    const headers = { "Content-Type": "application/json" };
    if (!proxy("fal")) {
      if (!key("fal")) throw new Error("Add your fal.ai key first (AI service, in the video window).");
      headers.Authorization = "Key " + key("fal");
    }
    const r = await fetch(base + "/" + app, { method: "POST", headers, body: JSON.stringify(input) });
    if (!r.ok) throw new Error("fal.ai said " + r.status + ": " + (await r.text()).slice(0, 200));
    const job = await r.json();
    const statusUrl = job.status_url || `${base}/${app}/requests/${job.request_id}/status`;
    const resultUrl = job.response_url || `${base}/${app}/requests/${job.request_id}`;
    for (let i = 0; i < 600; i++) {
      if (opts.signal && opts.signal.cancelled) throw new Error("Stopped.");
      await new Promise((ok) => setTimeout(ok, 2000));
      const st = await (await fetch(statusUrl, { headers })).json();
      if (opts.onProgress) opts.onProgress(st.status);
      if (st.status === "COMPLETED") break;
      if (st.status === "FAILED" || st.status === "ERROR") throw new Error("fal.ai job failed.");
    }
    const out = await (await fetch(resultUrl, { headers })).json();
    record(opts.estimate, opts.label || app);
    return out;
  }
  async function asDataUrl(file) {
    return new Promise((ok, bad) => {
      const fr = new FileReader();
      fr.onload = () => ok(fr.result);
      fr.onerror = bad;
      fr.readAsDataURL(file);
    });
  }

  /* The server cut-out: Meta's SAM 2 for video on fal.ai. Click points on the first frame; it follows those
     things through the whole clip and returns a mask video (white where they are). Not yet run end to end: it
     needs a key. */
  register("cutout", "fal-sam2", {
    label: "Paid, opt in: SAM 2 on fal.ai (your own key)",
    where: "server",
    company: "fal",
    /* rough: about 2 cents to start plus 1 cent a second of video; fal.ai's price list is what you pay */
    price: (job) => 0.02 + 0.01 * Math.max(1, (job && job.seconds) || 5),
    cost(job) {
      return `about ${money(this.price(job))} for ${Math.round((job && job.seconds) || 5)} seconds (rough; fal.ai's price applies)`;
    },
    async trackVideo(file, points, opts) {
      const video_url = typeof file === "string" ? file : await asDataUrl(file);
      const res = await falRun(
        "fal-ai/sam2/video",
        { video_url, prompts: (points || []).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y), label: 1, frame_index: p.frame || 0 })), apply_mask: false },
        Object.assign({ estimate: this.price({ seconds: opts && opts.seconds }), label: "SAM 2 cut-out" }, opts)
      );
      return { maskVideoUrl: res.video && res.video.url, raw: res };
    },
  });

  /* The paid "turn it into something else" step, on still frames only (keyframes: the cheap way). One image
     edit model on fal.ai: you describe the change ("make the shirt a red costume"). */
  register("generate", "fal-edit-frame", {
    label: "Paid, opt in: change a still frame by description, on fal.ai (your own key)",
    where: "server",
    company: "fal",
    app: "fal-ai/flux-pro/kontext",
    /* rough: about 4 cents an image */
    price: (job) => 0.04 * Math.max(1, (job && job.frames) || 1),
    cost(job) {
      return `about ${money(this.price(job))} for ${(job && job.frames) || 1} frame(s) (rough; fal.ai's price applies)`;
    },
    async editFrame(imageUrl, prompt, opts) {
      const res = await falRun(this.app, { image_url: imageUrl, prompt: String(prompt || "").slice(0, 500) }, Object.assign({ estimate: this.price({ frames: 1 }), label: "Frame edit" }, opts));
      return { imageUrl: res.images && res.images[0] && res.images[0].url, raw: res };
    },
  });

  window.CurioAI = { FAMILIES, register, providers, use, choose, chosen, key, setKey, proxy, setProxy, price, caps, setCaps, spent, check, falRun };
})();
