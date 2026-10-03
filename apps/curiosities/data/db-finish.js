/* Loaded last. The lens rows from lenses.js (mainCost, setMaterial, emoVoice...) are each a slider of a lens; as
   curiosities in their own right, any that still have only their setting get "how noticeable" and "how it
   changes", so every row has at least three graded sliders of its own. Rows the other files enriched are skipped. */
(function (DB) {
  const NOTICE = ["noticeable", "How noticeable", ["invisible", "subtle", "clear", "showy"], "Whether the audience should notice this choice or feel it without seeing it."];
  const CHANGE = (what) => ["change", "How it changes", ["holds", "drifts", "steps", "snaps"], `How ${what} moves to a new setting: holds still, drifts, steps, or snaps.`];
  DB.data.curiosities
    .filter((c) => c.sliders.length < 4)
    .forEach((c) => DB.curiosity({ id: c.id, sliders: [NOTICE, CHANGE(c.label.toLowerCase())] }));
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
