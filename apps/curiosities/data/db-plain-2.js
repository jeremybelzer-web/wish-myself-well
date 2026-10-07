/* data/db-plain-2.js: plain words, second pass. Follows db-plain.js and closes what part 2 of the database audit
   of 2026-10-03 (/mnt/project-files/database/audit-2026-10-03.md, "Film jargon with no plain explanation") still
   left bare after it: a few sliders of the 46 curiosities, and the same film words (low key, high key, gentle S,
   whip pan, match cut, smash cut, dissolve, insert, button, gutter, multicam, light leak, god rays, vignette) where
   suites, proximities and proximity suites use them without saying what they mean.
   Same rules as db-plain.js: only plain texts change. No label, id, slider id or scale option value changes,
   since suites, proximities, model scenes, windows, the engine, the tests and saved projects use them. Every
   helper looks the row up with DB.find and throws if the id or slider is gone, so a rename elsewhere fails
   check-db. Loaded right after db-plain.js and before the model scenes. Written 2026-10-04. */
(function (DB) {
  const row = (id) => {
    const x = DB.find(id);
    if (!x) throw new Error(`db-plain-2.js: no curiosity, suite, spark or elixir "${id}" (renamed or removed?)`);
    return x;
  };
  const slider = (id, sliderId) => {
    const s = (row(id).sliders || []).find((x) => x.id === sliderId);
    if (!s) throw new Error(`db-plain-2.js: "${id}" has no slider "${sliderId}" (renamed or removed?)`);
    return s;
  };
  const plain = (id, text) => {
    const x = row(id);
    x.plain = text;
    x.replained = true;
  };
  const addPlain = (id, text) => {
    const x = row(id);
    x.plain = (x.plain || "").replace(/\s+$/, "").replace(/([^.!?])$/, "$1.") + " " + text;
    x.replained = true;
  };
  const addSliderPlain = (id, sliderId, text) => {
    const s = slider(id, sliderId);
    s.plain = (s.plain || "").replace(/\s+$/, "").replace(/([^.!?])$/, "$1.") + " " + text;
  };

  /* ================= The 46 curiosities: sliders and words still bare ================= */

  addSliderPlain("musicLevel", "duck", "Measured in decibels (dB), the usual scale for loudness: about 6 dB is a clear dip, 20 dB or more almost hides the music.");
  addPlain("operatorFeel", "A pan is the camera turning sideways on the spot.");
  addPlain("lightEffect", "A sun flare is the streaks and rings a bright light makes when it shines straight into the lens.");

  /* ================= Film words in slider options, where the slider still left them bare ================= */

  addSliderPlain("lut", "setting", "Teal and orange: blue-green shadows with orange skin, the common blockbuster look. Warm or cool print: the whole picture tinted warm or cool, like a print of old film.");
  addSliderPlain("shotOrderLens", "joins", "Hard cuts: the picture simply changes. Cut on action: the cut falls in the middle of a movement, so the move carries you across. Match cuts: the next shot echoes a shape or a move from the last. Overlapping: sound or action from one shot runs on into the next.");

  /* ================= The same words in suites, proximities and proximity suites ================= */

  /* Low key and high key. */
  plain("noir", "The dark look of old crime films (film noir): hard light through window blinds, haze, and low key lighting (mostly dark, with deep shadows).");
  plain("genre-romcom", "Joy, hard cuts (plain cuts with no effect), the camera at eye level, high key light (bright and even, with few shadows), and playful lines that rise in pitch.");
  addPlain("dark-set-low-key", "Low key means mostly dark, with deep shadows.");

  /* Color grading words. */
  plain("final-cut-finish", "A pro finishing pass: the bright parts pushed warm with the color wheels, a gentle S curve (darks a little darker and brights a little brighter, for more contrast), the voices louder than the music and effects, and smooth slow motion.");

  /* Whip pan, match cut, smash cut, dissolve. */
  addPlain("style-cut-to-the-beat", "A whip pan is a camera turn so fast that the picture blurs into the next shot.");
  addPlain("genre-surrealist", "A match cut joins two shots by a shape or a move they share.");
  addPlain("opening-titles", "A title card is a full screen of words; a match cut joins two shots by a shape or a move they share.");
  addPlain("smash-cut-contradiction", "A smash cut is a sudden hard cut to something opposite.");
  addPlain("insist-then-do", "A smash cut is a sudden hard cut to something opposite.");
  addPlain("classic-dissolve", "A dissolve is one picture melting slowly into the next.");
  addPlain("dream-dissolve", "A dissolve is one picture melting slowly into the next.");
  addPlain("trippy-vision", "A dissolve is one picture melting into the next.");
  addPlain("dream-edit", "A dissolve is one picture melting into the next; a vignette darkens the corners of the frame.");

  /* Light added in the edit. */
  addPlain("heavenly-light", "God rays are beams of light, like sun through clouds. A light leak is a soft colored glow bleeding in from the edge, like old film.");
  addPlain("light-leak-overlay", "A light leak is a soft colored glow bleeding in from the edge of the frame, like old film.");
  addPlain("screen-blend-glow", "A light leak is a soft colored glow bleeding in from the edge, like old film.");

  /* Insert shots. */
  addPlain("object-insert", "An insert is a very close shot of a small thing, like a hand or a key.");
  addPlain("object-insert-prox", "An insert is a very close shot of a small thing, like a hand or a key.");
  addPlain("prop-key-insert", "An insert shot is a very close shot of a small thing, like a hand or a key.");
  addPlain("camera-answers-body", "An insert is a very close shot of a small thing, like a hand or a key.");

  /* Comic panels. */
  addPlain("six-panel-grid", "Gutters are the white gaps between the panels.");
  addPlain("quiet-wide-gutter", "The gutter is the white gap between comic panels.");

  /* Multicam. */
  addPlain("speaker-angle-dialogue", "Multicam means several cameras film the same moment at once, and the edit switches between them.");

  /* The button and the tag. */
  addPlain("sitcom-habits", "A button is one small last laugh that closes a scene; a tag is a short extra bit after the story ends.");
  addPlain("sitcom-scene-shape", "A button is one small last laugh that closes a scene; the tag is a short extra bit after the story ends.");
  addPlain("button-sting", "A button joke is one small last laugh that closes the scene; a sting is a short burst of music.");
  addPlain("button-then-cut", "A button joke is one small last laugh that closes the scene.");
  addPlain("epic-then-popped", "A smash cut is a sudden hard cut to something opposite; a button is one small last laugh that closes the scene.");
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
