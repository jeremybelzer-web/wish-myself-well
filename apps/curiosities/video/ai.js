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

   Keys are stored under "curiomatic-ai-keys", not a "curiosities-" key, so they never go into a saved .curio project
   file. They are only ever sent to their own company (or your proxy). */
(function () {
  const KEY = "curiomatic-ai-keys",
    PICKS = "curiosities-ai-picks-v1";
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

  /* fal.ai's queue: send a job, wait for it, return its result. With a proxy, the proxy adds the key. */
  async function falRun(app, input, opts) {
    opts = opts || {};
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
    return (await fetch(resultUrl, { headers })).json();
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
    label: "SAM 2 on fal.ai (stronger, paid, your own key)",
    where: "server",
    company: "fal",
    cost: (job) => `about a few cents to under a dollar for a ${Math.round((job && job.seconds) || 30)}-second clip (fal.ai's price applies)`,
    async trackVideo(file, points, opts) {
      const video_url = typeof file === "string" ? file : await asDataUrl(file);
      const res = await falRun(
        "fal-ai/sam2/video",
        { video_url, prompts: (points || []).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y), label: 1, frame_index: p.frame || 0 })), apply_mask: false },
        opts
      );
      return { maskVideoUrl: res.video && res.video.url, raw: res };
    },
  });

  window.CurioAI = { FAMILIES, register, providers, use, choose, chosen, key, setKey, proxy, setProxy, falRun };
})();
