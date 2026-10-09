/* lanes.js: tags every curiosity Visual, Writing or Audio (one or more), so the automation lanes can split into
   three tabs when the writing app joins Curiomatic (Jeremy's handoff, section 2 and 12 step 1).
   Visual = what is seen. Writing = the words on the page. Audio = anything heard or spoken.
   A curiosity's tags come from its workspace, plus Audio when its name is about sound, plus OVERRIDES by id.
   An item that already carries `lanes` (a writing-app row) keeps them. Works in the page and in node. */
(function (root) {
  const V = "Visual", W = "Writing", A = "Audio";
  const TABS = [V, W, A];

  /* Default tags per Curiomatic workspace (data/db-workspaces.js). Story and character workspaces are Writing
     first, because the words carry them; emotion and comedy also show on faces, so they are Visual too. */
  const WORKSPACE = {
    "camera-angle": [V], "camera-motion": [V], placement: [V], "character-motion": [V], background: [V],
    light: [V], effects: [V], wardrobe: [V], color: [V], set: [V], transitions: [V], grade: [V],
    layers: [V], canvas: [V], page: [V],
    lines: [W, A], "movement-lines": [V, W], titles: [W, V], structure: [W, V], speed: [V, A],
    arc: [W], plot: [W], mindset: [W], focus: [W], archetype: [W], herd: [W],
    emotion: [W, V], "emo-road": [W, V], comedy: [W, V], "comedy-mix": [W, V],
    music: [A], "audio-mix": [A],
    /* The writing app's own workspaces (../curiosities/data/writing/db-writing-language.js). */
    "w-verbs": [W], "w-sentence": [W], "w-words": [W], "w-figures": [W], "w-voice": [W],
    "w-sound": [W, A], "w-dialogue": [W, A], "w-movement": [W], "w-objects": [W], "w-rhythm": [W, A],
  };

  /* A name about sound adds Audio. NOT_SOUND lists names that match the words but are not about sound. */
  const SOUND = /sound|music|voice|loud|silen|audio|song|tempo|breath|laugh|humming|spoken|speak|whisper|aloud|foley|ambience|sting|score|vocal/i;
  const NOT_SOUND = ["laughOrBeat", "unspokenFeeling", "innerVoice", "visibleBreath"];

  /* Hand-set tags by id; these replace the rules above. */
  const OVERRIDES = {
    innerVoice: [W],
    voiceover: [A, W],
    themeAloud: [W, A],
    readAloud: [W, A],
    soundLettering: [V, W],
    silentPanel: [V],
  };

  function tag(row) {
    if (Array.isArray(row.lanes) && row.lanes.length) return row.lanes.slice();
    if (OVERRIDES[row.id]) return OVERRIDES[row.id].slice();
    const out = (WORKSPACE[row.workspace] || [W]).slice();
    if (!out.includes(A) && !NOT_SOUND.includes(row.id) && SOUND.test(row.id + " " + row.label)) out.push(A);
    return TABS.filter((t) => out.includes(t));
  }

  /* Adds `lanes` to every curiosity in the database and returns counts per tab. */
  function tagAll(DB) {
    const counts = { Visual: 0, Writing: 0, Audio: 0, total: 0 };
    DB.data.curiosities.forEach((row) => {
      row.lanes = tag(row);
      row.lanes.forEach((t) => counts[t]++);
      counts.total++;
    });
    return counts;
  }

  const api = { TABS, WORKSPACE, OVERRIDES, NOT_SOUND, tag, tagAll };
  root.WritingLanes = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
