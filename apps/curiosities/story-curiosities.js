/* Story curiosities: values a character carries through the scenes of the whole story, not through
   the panels of one scene. Each one lives in a story workspace (Character arc, Personal plot,
   Perspective & mindset, Focus, Archetype, Herd mentality) and is kept per character per scene by
   story.js. Options are in scale order (narrow to wide, unhealthy to healthy), so an automation lane
   that runs "from" one setting "to" another passes through the ones between.
   Loaded after library.js and before model.js and automation.js, so every one is automatable.
   Also here: foreshortening, a scene curiosity the Placement workspace needed. */

(function () {
  const have = new Set(CURIOSITIES.map((c) => c.id));
  const add = (c) => {
    if (have.has(c.id)) return;
    have.add(c.id);
    CURIOSITIES.push(Object.assign({ live: false, source: "story workspaces" }, c, { view: c.view || c.note }));
  };
  const pick = (id, group, label, options, note) => add({ id, group, label, kind: "select", options, value: options[0], note });
  const range = (id, group, label, min, max, note) => add({ id, group, label, kind: "range", min, max, value: min, note });

  pick("arcStage", "Story: Character arc", "Arc stage", ["want", "doubt", "crisis", "choice", "change"], "Where this character is on their arc in this scene: what they want, then doubt, crisis, choice, change.");
  pick(
    "dramaticRole",
    "Story: Character arc",
    "Role in the scene",
    ["stabilizer", "catalyst", "challenger", "mediator", "mentor", "temptation", "mirror", "foil", "wildcard", "anchor", "trickster", "moral center", "antagonist"],
    "The job this character does for the others in this scene."
  );

  range("plotWeight", "Story: Personal plot", "Own plot weight", 0, 5, "How much this scene serves the character's own plot: 0 not at all, 5 it is their scene.");
  pick("plotTouch", "Story: Personal plot", "Own plot meets the main plot", ["apart", "crossing", "joined"], "Their own plot runs apart from the main plot, crosses it, or has joined it.");

  pick("perspectiveWidth", "Story: Perspective & mindset", "Whose good they see", ["self", "family", "group", "world"], "How wide the circle is that the character weighs: only themselves, out to the world.");
  pick("mindset", "Story: Perspective & mindset", "Mindset", ["fixed", "questioning", "open"], "Fixed, questioning, open: how ready they are to change their mind.");

  pick("focusWidth", "Story: Focus", "Focus width", ["one thing", "one person", "the room", "everyone", "the world"], "What the character is paying attention to, narrow to wide.");
  pick("focusShift", "Story: Focus", "Focus shift", ["narrowing", "steady", "widening"], "Whether their focus is closing in or opening out in this scene.");

  pick(
    "enneagramType",
    "Story: Archetype",
    "Enneagram type",
    ["1 Reformer", "2 Helper", "3 Achiever", "4 Individualist", "5 Investigator", "6 Loyalist", "7 Enthusiast", "8 Challenger", "9 Peacemaker"],
    "The character's Enneagram type: the core fear and desire they act from."
  );
  /* "Health of the type" (enneagramHealth) was merged into the character matrix's Enneagram health (cm-health,
     1 at their best to 9 at their worst); CuriosityDB.install moves saved story values across. */

  range("herdMentality", "Story: Herd mentality", "Herd mentality", 0, 5, "How much the group this character is in thinks as one: 0 everyone their own mind, 5 one mind.");
  pick("herdLeader", "Story: Herd mentality", "Who leads the herd", ["no one", "one voice", "a few", "the crowd"], "Who the group follows in this scene.");

  pick("foreshortening", "Camera", "Foreshortening", ["none", "slight", "strong"], "How much a near thing (a hand, a foot, an object) is stretched big by the lens against the far ones.");
})();
