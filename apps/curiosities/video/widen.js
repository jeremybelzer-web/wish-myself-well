/* video/widen.js: a wider shot than the clip was filmed with (Jeremy, 2026-10-05: "yes fake the wider shot. We
   want every option we are able to stumble convincingly into.").

   When the inspiration's shot is wider than yours, "How close the shot is" shrinks your picture into the middle
   of the frame (adj.widen, below 1) and this file fills in the new edges. The free way runs in the browser on
   every frame: the picture's own edges reflected outward, softened more the further they reach, over a
   heavily blurred copy of the whole frame (the room's colors), with the seam feathered. It holds up for a
   modest widening (the default limit is 25% wider) and for walls, sky, floors and crowds; a person cut by the
   frame's edge shows as a soft mirror image. The paid way (CurioAI "picture" family, "fal-outpaint") paints new
   edges with AI on one still frame, under the usual price caps.

   window.CurioWiden
   - MIN                               the smallest widen allowed (0.8 = the picture fills 80%: 25% wider)
   - configure({ on }), on()           the fill is on unless turned off (then the shot never goes wider)
   - rect(W, H, s) -> { x, y, w, h }   where the shrunken picture sits (centred)
   - fill(ctx, src, W, H, s)           draws src (a canvas or image the size of the frame) shrunk to s in the
                                       middle of ctx, with the edges filled in the free way */
(function (root) {
  const MIN = 0.8;
  let ON = true;
  function configure(o) {
    if (o && "on" in o) ON = o.on !== false;
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function rect(W, H, s) {
    s = clamp(s, MIN, 1);
    const w = Math.round(W * s),
      h = Math.round(H * s);
    return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h };
  }
  const canvases = {};
  function cv(name, w, h) {
    let c = canvases[name];
    if (!c) c = canvases[name] = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : document.createElement("canvas");
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const g = c.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    return [c, g];
  }
  /* a blur that works everywhere: drawn small, then drawn back up smoothly */
  function soften(name, src, W, H, k) {
    const [s, gs] = cv(name + "-s", Math.max(2, Math.round(W / k)), Math.max(2, Math.round(H / k)));
    gs.clearRect(0, 0, s.width, s.height);
    gs.drawImage(src, 0, 0, s.width, s.height);
    return s;
  }
  /* keeps a box (x, y, w, h) at full strength and fades to `edge` over `reach` pixels outside it */
  function fadeOutside(g, W, H, b, reach, edge) {
    g.globalCompositeOperation = "destination-in";
    const side = (x0, y0, x1, y1) => {
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, `rgba(0,0,0,${edge})`);
      gr.addColorStop(1, "rgba(0,0,0,1)");
      return gr;
    };
    const run = (gr) => {
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    };
    run(side(b.x - reach, 0, b.x, 0));
    run(side(b.x + b.w + reach, 0, b.x + b.w, 0));
    run(side(0, b.y - reach, 0, b.y));
    run(side(0, b.y + b.h + reach, 0, b.y + b.h));
    g.globalCompositeOperation = "source-over";
  }
  function fill(ctx, src, W, H, s) {
    const r = rect(W, H, s);
    if (r.w >= W - 1 && r.h >= H - 1) {
      ctx.drawImage(src, 0, 0, W, H);
      return r;
    }
    /* 1. the room's colors: the whole frame, very soft, stretched over everything */
    const back = soften("back", src, W, H, 28);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(back, 0, 0, W, H);
    /* 2. the picture's edges reflected outward (a 3 by 3 mirror around it), a little soft, fading out */
    const [m, gm] = cv("mirror", W, H);
    gm.clearRect(0, 0, W, H);
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        gm.save();
        /* a mirrored copy: flipped about the edge it shares with the picture */
        const x = i === 0 ? r.x : i < 0 ? r.x : r.x + 2 * r.w,
          y = j === 0 ? r.y : j < 0 ? r.y : r.y + 2 * r.h;
        gm.translate(x, y);
        gm.scale(i ? -1 : 1, j ? -1 : 1);
        gm.drawImage(src, 0, 0, W, H, 0, 0, r.w, r.h);
        gm.restore();
      }
    const reach = Math.max(r.x, r.y, 1);
    const near = soften("near", m, W, H, 3);
    const [f, gf] = cv("fade", W, H);
    gf.clearRect(0, 0, W, H);
    gf.drawImage(near, 0, 0, W, H);
    fadeOutside(gf, W, H, r, reach * 1.6, 0);
    ctx.drawImage(f, 0, 0);
    /* 3. the picture itself, sharp, its outermost pixels feathered into the fill */
    const [p, gp] = cv("pic", W, H);
    gp.clearRect(0, 0, W, H);
    gp.drawImage(src, 0, 0, W, H, r.x, r.y, r.w, r.h);
    const feather = Math.max(2, Math.round(Math.min(r.w, r.h) * 0.012));
    fadeOutside(gp, W, H, { x: r.x + feather, y: r.y + feather, w: r.w - 2 * feather, h: r.h - 2 * feather }, feather, 0);
    ctx.drawImage(p, 0, 0);
    ctx.restore();
    return r;
  }
  root.CurioWiden = { MIN, configure, on: () => ON, rect, fill };
})(typeof window !== "undefined" ? window : globalThis);
