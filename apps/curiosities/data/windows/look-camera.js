/* Camera: the live picture at the top of each camera curiosity's window (CuriosityWindows.look). */
(function (W) {
  /* Camera angle in 3D: what the camera sees (left), and a map from above with the camera around them (right). */
  W.look("cameraPlace", (v, k) => {
    const around = v.n("around");
    const height = v.n("height");
    const dist = Math.max(0.3, v.n("distance"));
    const off = v.n("offAxis");
    const roll = v.n("roll");
    /* The view: closer is bigger; above puts the horizon high and looks down on them; off axis slides them aside. */
    const s = k.clamp(2.4 / Math.sqrt(dist), 0.25, 4);
    const horizon = k.clamp(95 + height * 0.9, 8, 172);
    const x = 110 - off * 1.4 - Math.sin(k.rad(around)) * 18;
    const back = Math.abs(around) > 110;
    const view = `<g transform="rotate(${roll} 110 90)">${k.wall({ y: horizon, color: "#cdbfa8", floor: "#7d6650" })}${k.person({ x, y: Math.min(220, horizon + 30 * s), s, mood: back ? 0 : 0.3, look: k.clamp(-around / 90, -1, 1), lean: -height * 0.15, alpha: 1, color: "#4a6fa5", eyes: back ? 0 : 0.8 })}</g>`;
    /* The map: them in the middle, the camera around them at its distance, pointing in (plus off axis). */
    const mx = 265;
    const my = 70;
    const R = 10 + k.clamp(Math.sqrt(dist) / Math.sqrt(60), 0, 1) * 34;
    const a = k.rad(around - 90);
    const cx = mx + Math.cos(a) * R;
    const cy = my - Math.sin(a) * R;
    const map = `<rect x="215" y="10" width="100" height="120" rx="6" fill="#1d1d22" stroke="#444"/>${k.ring({ x: mx, y: my, r: R, color: "#555", dash: "3 3", w: 1 })}${k.dot({ x: mx, y: my, r: 6, color: "#4a6fa5" })}${k.label({ x: mx, y: my - 9, text: "them", size: 8, color: "#aaa" })}${k.cam({ x: cx, y: cy, dir: (Math.atan2(my - cy, mx - cx) * 180) / Math.PI + off, s: 0.6 })}${k.label({ x: mx, y: 124, text: `${Math.round(around)}° · ${dist} m · ${height > 0 ? "above" : height < 0 ? "below" : "eye level"}`, size: 8, color: "#ccc" })}`;
    return `<clipPath id="cw-cp-view"><rect x="0" y="0" width="210" height="180"/></clipPath>${k.bg("#141418")}<g clip-path="url(#cw-cp-view)">${view}</g>${map}${k.caption(`Measured from ${v("subject")}`)}`;
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
