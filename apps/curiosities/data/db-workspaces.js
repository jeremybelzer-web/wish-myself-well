/* Workspaces: the families of curiosities a filmmaker keeps coming back to. Each one is a tab in the app.
   The first twenty-two match workspaces.js (fifteen general ones and seven lens workspaces built from lenses.js).
   Rows marked proposed are new homes this database needed (music, editing and structure, page and panel);
   the app thread decides whether they become tabs or fold into an existing one. */
(function (DB) {
  const W = (id, label, scope, plain, proposed) => DB.workspace({ id, label, scope, plain, proposed });
  W("camera-angle", "Camera angle", "scene", "Where the lens sits and what it sees: how close, how high, how long a lens, level or tilted, whose eyes.");
  W("camera-motion", "Camera motion", "scene", "How the camera travels through the scene: carried how, which move, how fast, following whom, and how often it cuts.");
  W("character-motion", "Character motion", "scene", "How people move through the scene: their path, their speed, toward or away from the lens, who moves, who enters.");
  W("placement", "Placement", "scene", "Where people and things stand in the frame, how many, and how much the lens stretches what is near.");
  W("lines", "Lines & delivery", "scene", "The lines and how they land: tone, loudness, breath, pace, silence, and the feeling under them.");
  W("movement-lines", "Movement with lines", "scene", "What the body does while a line is spoken: gesture, stillness, posture, where the eyes go, what leads.");
  W("background", "Background action", "scene", "What happens behind the people: the room moving, weather, the place, extras and repeated things.");
  W("light", "Light & look", "scene", "Light, color and surface: where the light comes from, how hard, how warm, how dark, and how the picture is drawn.");
  W("effects", "Effects", "scene", "Simulated things: wind, cloth, breakage, fur and hair, smoke, fire, water, snow.");
  W("arc", "Character arc", "story", "Where each character is on their arc in each scene, and the role they play for the others.");
  W("plot", "Personal plot", "story", "How much each scene serves a character's own plot, and how that plot meets the main one.");
  W("mindset", "Perspective & mindset", "story", "How wide a circle the character weighs, and how ready they are to change their mind.");
  W("focus", "Focus", "story", "What the character pays attention to, and whether it is narrowing or widening.");
  W("archetype", "Archetype", "story", "The character's personality: the character matrix axes, Enneagram type, and how healthy it plays in each scene.");
  W("herd", "Herd mentality", "story", "How much the group thinks as one through the scenes, and who it follows.");
  W("wardrobe", "Wardrobe", "scene", "What the main character and the people in the background are wearing: era, cost, skin covered, and what the clothes are for.");
  W("color", "Color", "scene", "The color of the picture: black and white or full color, tinted, warm or cool.");
  W("set", "Set design", "scene", "The place itself: its style, materials, the art on the walls, how cramped or open it is.");
  W("emotion", "Emotion", "scene", "The feeling of the scene and every way it shows: movement, voice, face, posture, words, place and light.");
  W("emo-road", "Emotional road", "story", "Each character's emotional road through the story, and the film's own road.");
  W("comedy", "Comedy", "scene", "How the scene is funny: the kind of joke, what it is about, how big, how timed, who carries it.");
  W("comedy-mix", "Comedy from the mix", "scene", "Who is in the room and what putting them together does for the laughs, the plot and the characters.");
  W("music", "Music & sound", "scene", "The music chosen for the scene, or the choice to have none, and the sound around it.", true);
  W("structure", "Editing & structure", "story", "How scenes are cut and ordered: rhythm, transitions, repetition, reveals, whose story each scene tells, genre shape.", true);
  W("page", "Page & panel", "scene", "How a storyboard, comic or zine page is laid out: panel count and size, gutters, balloons, lettering, page turns.", true);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
