/* Workspaces: the families of curiosities a filmmaker keeps coming back to. Each one is a tab in the app.
   The first fifteen match workspaces.js. Rows marked proposed are new homes this database needed
   (music, emotion, comedy, wardrobe and sets, editing and structure, page and panel); the app thread
   decides whether they become tabs or fold into an existing one. */
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
  W("music", "Music & sound", "scene", "The music chosen for the scene, or the choice to have none, and the sound around it.", true);
  W("emotion", "Emotion", "scene", "What each character feels, how it shows in body, voice and face, and the emotional roadmap of the film.", true);
  W("comedy", "Comedy", "scene", "What makes it funny: timing, escalation, surprise, status, callbacks, and how the camera and edit sell the joke.", true);
  W("design", "Wardrobe & sets", "scene", "What people wear and the world they stand in: clothes for main and background characters, set style, materials, art and clutter.", true);
  W("structure", "Editing & structure", "story", "How scenes are cut and ordered: rhythm, transitions, repetition, reveals, whose story each scene tells, genre shape.", true);
  W("page", "Page & panel", "scene", "How a storyboard, comic or zine page is laid out: panel count and size, gutters, balloons, lettering, page turns.", true);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
