/* data/db-styles.js: style playbooks. 16 directing styles, each a way to learn a director's moves and use them in
   your own film. Every style is one suite named for the style, which sets values on existing curiosities from many
   workspaces (camera, cut, music, lines, light, color, comedy, feeling, story), plus one proximity suite of the
   style's signature causes and effects ("When ..., ..."). Styles name techniques in plain words, each "in the
   spirit of" a well-known director or tradition; they describe how it is done and copy no real film or line.
   Adds no curiosities. Loaded after db-depth-world.js. Written 2026-10-03 by the database thread. */
(function (DB) {
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const TAGS = { tags: ["style"] };
  const with_ = (also) => Object.assign({ also }, TAGS);

  /* ---------- 1. Long talk that snaps into violence ---------- */

  S("style-long-talk-snap", "Long talk that snaps into violence", "structure",
    "Long, casual scenes of people chatting about odd little things, a well-known old pop song, the story told in chapters and out of order, and a calm that breaks all at once. In the spirit of Quentin Tarantino.",
    [
      { curiosity: "sceneLength", value: "long" },
      { curiosity: "throwaway", value: 4, weight: 80 },
      { curiosity: "specificity", value: "oddly specific", weight: 80 },
      { curiosity: "comedyDevice", value: "banter", weight: 70 },
      { curiosity: "comedyDevice", slider: "darkness", value: "dark", weight: 70 },
      { curiosity: "tensionCurve", slider: "shape", value: "peaks and valleys" },
      { curiosity: "music", slider: "era", value: "1950s to 1970s", weight: 70 },
      { curiosity: "music", slider: "familiarity", value: "recognizable", weight: 70 },
      { curiosity: "chapterCard", value: "number and title", weight: 60 },
      { curiosity: "povSwitch", value: "switches sometimes", weight: 60 },
      { curiosity: "angleHeight", value: "low", weight: 50 },
      { curiosity: "sceneEnding", value: "smash cut", weight: 60 },
    ], with_(["lines", "music", "comedy"]));

  P("style-long-talk-violence", "When the talk runs long and casual, violence arrives without warning", "structure",
    "Let people chat about nothing for a long time, and within a few beats a sudden act of violence lands all the harder for the calm before it.",
    { curiosity: "sceneLength", is: "long" }, { curiosity: "emoActions", is: "drastic" }, 3, with_(["emotion"]));
  P("style-odd-topic-tension", "When small talk turns to an oddly specific topic, the tension quietly climbs", "lines",
    "A strangely detailed chat about something trivial makes us wonder why we are hearing it, and the unease grows under the words.",
    { curiosity: "specificity", is: "oddly specific" }, { curiosity: "tensionCurve", change: "rises" }, 2, with_(["structure"]));
  P("style-pop-song-cold", "When a cheerful old song plays over cruelty, the audience feels something stranger than the scene", "music",
    "A bright, familiar song laid against a cruel moment makes us feel a mix of shock and dark laughter instead of plain fear.",
    { curiosity: "music", slider: "counterpoint", is: "opposite" }, { curiosity: "audienceFeeling", is: "different" }, 1, with_(["emotion"]));
  P("style-chapter-new-view", "When a chapter card appears, the story jumps to someone else's side", "structure",
    "A title card splits the film into parts, and the next part often picks up from another person, out of order.",
    { curiosity: "chapterCard", is: "number and title" }, { curiosity: "povSwitch", is: "switches sometimes" }, 1, with_(["titles"]));
  P("style-silence-standoff", "When the room goes quiet, the standoff holds longer", "character-motion",
    "Once the talk stops, people squaring off hold their ground longer and the wait itself becomes the scene.",
    { curiosity: "silence", is: "long" }, { curiosity: "faceOff", slider: "hold", change: "rises" }, 1, with_(["lines"]));

  PS("style-long-talk-snap-moves", "Long talk that snaps into violence: the moves", "structure",
    "Talk long about odd little things, let the unease climb, lay a cheerful old song over cruelty, split the story into chapters, and hold the standoff in silence. In the spirit of Quentin Tarantino.",
    ["style-long-talk-violence", "style-odd-topic-tension", "style-pop-song-cold", "style-chapter-new-view", "style-silence-standoff"], with_(["lines", "music"]));

  /* ---------- 2. Symmetry and deadpan pastel ---------- */

  S("style-symmetry-deadpan", "Symmetry and deadpan pastel", "set",
    "Everything centered and perfectly even, sweet pastel colors, a camera that sits still or slides sideways, people who say sad or silly things with a blank face, and oddly specific details everywhere. In the spirit of Wes Anderson.",
    [
      { curiosity: "composition", value: "center" },
      { curiosity: "setStyle", slider: "symmetry", value: 5 },
      { curiosity: "setStyle", slider: "colorFamily", value: "pastel" },
      { curiosity: "artArrangement", value: "perfectly even", weight: 70 },
      { curiosity: "filterLook", value: "pastel", weight: 70 },
      { curiosity: "cameraCarry", value: "locked", weight: 80 },
      { curiosity: "cameraMove", value: "track", weight: 60 },
      { curiosity: "comicRegister", value: "deadpan" },
      { curiosity: "faceIntensity", value: 1, weight: 70 },
      { curiosity: "specificity", value: "absurdly specific", weight: 70 },
      { curiosity: "chapterCard", value: "title", weight: 50 },
    ], with_(["camera-angle", "color", "comedy"]));

  P("style-center-deadpan-lands", "When the frame is dead center and still, the deadpan joke lands harder", "camera-angle",
    "A perfectly centered, unmoving picture makes a flat delivery feel even drier, and the laughs come more often.",
    { curiosity: "composition", is: "center" }, { curiosity: "laughsPerMinute", change: "rises" }, 1, with_(["comedy"]));
  P("style-feeling-flat-face", "When the feeling runs high, the face stays flat", "emotion",
    "The bigger the feeling inside, the less the face shows it, so the calm surface becomes both funny and sad.",
    { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "faceIntensity", change: "drops" }, 1, with_(["movement-lines"]));
  P("style-whip-to-tableau", "When the camera whips to the side, a new neat picture is waiting", "camera-motion",
    "A fast swing of the camera lands on another perfectly arranged, centered picture, like turning the page of a picture book.",
    { curiosity: "panReveal", slider: "turnSpeed", is: "a whip" }, { curiosity: "composition", is: "center" }, 1, with_(["camera-angle"]));
  P("style-specific-sadness", "When the details are absurdly specific, the sadness underneath shows through", "comedy",
    "Fussy, exact details make the world funny at first, then let a quiet sadness show through the cracks.",
    { curiosity: "specificity", is: "absurdly specific" }, { curiosity: "laughsToTears", slider: "depth", change: "rises" }, 3, with_(["emotion"]));

  PS("style-symmetry-deadpan-moves", "Symmetry and deadpan pastel: the moves", "set",
    "Center the frame so the dry joke lands, keep the face flat as the feeling grows, whip the camera to the next neat picture, and let fussy details open onto sadness. In the spirit of Wes Anderson.",
    ["style-center-deadpan-lands", "style-feeling-flat-face", "style-whip-to-tableau", "style-specific-sadness"], with_(["camera-angle", "comedy"]));

  /* ---------- 3. Slow-burn dread ---------- */

  S("style-slow-burn-dread", "Slow-burn dread", "emo-road",
    "Show the audience the danger before the characters know, then make them wait: long held shots, a camera that stays too long, quiet sound, a low repeating pulse and a clock running out. In the spirit of Alfred Hitchcock.",
    [
      { curiosity: "dread", value: 4 },
      { curiosity: "knowledgeGap", value: "audience first" },
      { curiosity: "shotDuration", value: "long", weight: 80 },
      { curiosity: "cutRate", value: "slow", weight: 70 },
      { curiosity: "lingeringShot", value: 6, weight: 70 },
      { curiosity: "tensionLoop", value: 4, weight: 70 },
      { curiosity: "behindTheirBack", value: "clear", weight: 60 },
      { curiosity: "tickingClock", value: "tight", weight: 60 },
      { curiosity: "valueKey", value: "low key", weight: 50 },
      { curiosity: "soundDesign", value: "sparse", weight: 60 },
    ], with_(["plot", "camera-motion", "music", "light"]));

  P("style-know-first-dread", "When the audience knows the danger first, every calm line adds dread", "emo-road",
    "Show us the danger the characters cannot see, and each ordinary moment they spend chatting makes the dread grow.",
    { curiosity: "knowledgeGap", is: "audience first" }, { curiosity: "dread", change: "rises" }, 2, with_(["plot"]));
  P("style-linger-dread", "When the camera stays too long, the dread rises", "focus",
    "Holding on a door or an empty room past the point of comfort makes us expect something to fill it.",
    { curiosity: "lingeringShot", change: "rises" }, { curiosity: "dread", change: "rises" }, 1, with_(["emo-road"]));
  P("style-clock-fast-cuts", "When the clock is down to seconds, the cuts speed up", "plot",
    "As time runs out, the slow, patient shots give way to quick cutting between the clock and the people.",
    { curiosity: "tickingClock", is: "seconds left" }, { curiosity: "cutRate", is: "fast" }, 1, with_(["camera-motion"]));
  P("style-danger-music-dead", "When the danger rushes in, the music stops dead", "music",
    "The long wait breaks the moment the danger closes in, and the music cuts off mid-phrase so the shock rings in silence.",
    { curiosity: "behindTheirBack", slider: "closing", is: "rushes in" }, { curiosity: "music", slider: "exit", is: "cut dead mid-phrase" }, 1, with_(["background"]));

  PS("style-slow-burn-dread-moves", "Slow-burn dread: the moves", "emo-road",
    "Let us know first, hold the camera too long, tighten the clock until the cuts speed up, and stop the music dead when the danger arrives. In the spirit of Alfred Hitchcock.",
    ["style-know-first-dread", "style-linger-dread", "style-clock-fast-cuts", "style-danger-music-dead"], with_(["plot", "music"]));

  /* ---------- 4. Rapid-fire screwball ---------- */

  S("style-rapid-screwball", "Rapid-fire screwball", "comedy-mix",
    "Two sharp, mismatched people talking fast and over each other, cutting each other off, trading the upper hand, while the room around them tips into chaos. In the spirit of Howard Hawks.",
    [
      { curiosity: "pace", value: "fast" },
      { curiosity: "pace", slider: "overlap", value: "talking over each other" },
      { curiosity: "doubleAct", slider: "volley", value: 5 },
      { curiosity: "doubleAct", slider: "overlap", value: "constantly", weight: 80 },
      { curiosity: "comicTiming", slider: "pace", value: "rapid fire", weight: 80 },
      { curiosity: "chemistry", value: 5, weight: 80 },
      { curiosity: "chemistry", slider: "kind", value: "romantic", weight: 60 },
      { curiosity: "statusGap", slider: "flip", value: "a full reversal", weight: 60 },
      { curiosity: "comicEscalation", value: 4, weight: 70 },
      { curiosity: "chaosInRoom", value: "one chaos character", weight: 60 },
      { curiosity: "walkAndTalk", value: 40, weight: 50 },
    ], with_(["lines", "comedy"]));

  P("style-overlap-sparks", "When they talk over each other, the sparks between them grow", "comedy-mix",
    "Two people trampling each other's lines show they are a match, and the spark between them gets stronger.",
    { curiosity: "pace", slider: "overlap", is: "talking over each other" }, { curiosity: "chemistry", change: "rises" }, 1, with_(["lines"]));
  P("style-faster-talk-chaos", "When the talk speeds up, the chaos around them grows", "comedy",
    "The faster the words fly, the faster the situation gets out of hand.",
    { curiosity: "pace", slider: "wpm", change: "rises" }, { curiosity: "comicEscalation", change: "rises" }, 2, with_(["lines"]));
  P("style-calm-one-snaps", "When the calm one finally loses it, the biggest laugh lands", "comedy-mix",
    "The person holding it together all scene finally cracks, and that crack is the biggest laugh.",
    { curiosity: "straightMan", is: "loses it" }, { curiosity: "laughsPerMinute", change: "rises" }, 1, with_(["comedy"]));
  P("style-cutoff-quicker", "When lines keep getting cut off, the pace gets even quicker", "lines",
    "Each interruption makes the other person answer sooner, so the scene keeps picking up speed.",
    { curiosity: "cutOff", slider: "count", change: "rises" }, { curiosity: "pace", slider: "wpm", change: "rises" }, 1, with_(["comedy-mix"]));

  PS("style-rapid-screwball-moves", "Rapid-fire screwball: the moves", "comedy-mix",
    "Overlap the lines so the spark grows, speed up so the chaos grows, keep cutting each other off, and save the biggest laugh for the calm one cracking. In the spirit of Howard Hawks.",
    ["style-overlap-sparks", "style-faster-talk-chaos", "style-calm-one-snaps", "style-cutoff-quicker"], with_(["lines", "comedy"]));

  /* ---------- 5. Handheld realism ---------- */

  S("style-handheld-realism", "Handheld realism", "camera-motion",
    "A held camera that walks right behind one person, long takes, no music, real room sound and plain light from the place itself, so it feels like we are there. In the spirit of the Dardenne brothers.",
    [
      { curiosity: "cameraCarry", value: "handheld" },
      { curiosity: "cameraShake", value: 2, weight: 70 },
      { curiosity: "moveFollows", value: "character" },
      { curiosity: "moveFollows", slider: "tightness", value: 5, weight: 80 },
      { curiosity: "shotDuration", value: "long", weight: 70 },
      { curiosity: "music", value: "none", weight: 80 },
      { curiosity: "ambienceBed", value: 4, weight: 70 },
      { curiosity: "lighting", value: "practical", weight: 60 },
      { curiosity: "improvFeel", value: 3, weight: 50 },
      { curiosity: "stabilization", value: "shaky as shot", weight: 60 },
      { curiosity: "filterLook", value: "natural", weight: 50 },
    ], with_(["music", "audio-mix", "light"]));

  P("style-follow-close-empathy", "When the camera follows close behind them, we feel what they feel", "camera-motion",
    "Walking right at someone's shoulder, the camera shares their worry, and our feeling for them grows.",
    { curiosity: "moveFollows", slider: "tightness", change: "rises" }, { curiosity: "empathy", change: "rises" }, 2, with_(["emotion"]));
  P("style-no-score-room-louder", "When there is no music, the sound of the place fills in", "audio-mix",
    "Take the score away and the hum, traffic and footsteps of the real place come forward to carry the mood.",
    { curiosity: "music", is: "none" }, { curiosity: "ambienceBed", change: "rises" }, 1, with_(["music"]));
  P("style-panic-shakes", "When the person panics, the camera shakes more", "camera-motion",
    "The camera operator reacts like a person in the room, so a rising feeling shows up as a shakier picture.",
    { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "cameraShake", change: "rises" }, 1, with_(["emotion"]));
  P("style-long-take-loose", "When the take runs long, the acting loosens up", "movement-lines",
    "With no cuts to hide behind, actors settle in and their moments feel less planned and more alive.",
    { curiosity: "shotDuration", is: "long" }, { curiosity: "improvFeel", change: "rises" }, 3, with_(["camera-motion"]));

  PS("style-handheld-realism-moves", "Handheld realism: the moves", "camera-motion",
    "Follow close so we feel with them, drop the music so the place speaks, let panic shake the camera, and hold long takes so the acting breathes. In the spirit of the Dardenne brothers.",
    ["style-follow-close-empathy", "style-no-score-room-louder", "style-panic-shakes", "style-long-take-loose"], with_(["emotion", "audio-mix"]));

  /* ---------- 6. Silent-film physical comedy ---------- */

  S("style-silent-physical", "Silent-film physical comedy", "comedy",
    "No spoken words, a hero with a stone face, big real stunts shown wide in one still shot, music that hits every step, and title cards for what must be said. In the spirit of Buster Keaton.",
    [
      { curiosity: "physicalComedy", value: "a stunt" },
      { curiosity: "comicRegister", value: "deadpan", weight: 80 },
      { curiosity: "wordsAmount", value: 0 },
      { curiosity: "shotSize", value: "wide", weight: 80 },
      { curiosity: "cameraCarry", value: "locked", weight: 70 },
      { curiosity: "comicScore", value: 4, weight: 70 },
      { curiosity: "comicScore", slider: "followsMoves", value: "every step", weight: 70 },
      { curiosity: "onScreenText", value: "title card", weight: 60 },
      { curiosity: "comicSuspense", value: 6, weight: 60 },
      { curiosity: "colorRange", value: "black and white", weight: 50 },
    ], with_(["camera-angle", "music", "titles"]));

  P("style-wide-stunt-awe", "When the stunt is shown wide in one shot, our jaw drops", "comedy",
    "Keeping the whole body and the whole danger in one unbroken wide shot proves it really happened, and the laugh comes with a gasp.",
    { curiosity: "shotSize", is: "wide" }, { curiosity: "awe", change: "rises" }, 1, with_(["camera-angle", "emotion"]));
  P("style-see-trap-laugh", "When we see the trap before the hero does, the laugh grows", "comedy",
    "Show the danger early and let the hero walk toward it, so we laugh in advance and harder when it springs.",
    { curiosity: "comicSuspense", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 2);
  P("style-stone-face-chaos", "When the face stays blank, the chaos around gets funnier", "comedy",
    "A hero who never reacts makes every crash around them bigger and funnier.",
    { curiosity: "comicRegister", is: "deadpan" }, { curiosity: "comicEscalation", change: "rises" }, 2);
  P("style-no-words-music-steps", "When no one speaks, the music follows every step", "music",
    "With no voices, the music has to do the talking, and it lands on each trip, fall and bump.",
    { curiosity: "wordsAmount", is: 0 }, { curiosity: "comicScore", slider: "followsMoves", is: "every step" }, 1, with_(["comedy"]));

  PS("style-silent-physical-moves", "Silent-film physical comedy: the moves", "comedy",
    "Shoot the stunt wide so it is real, show the trap early, keep the face blank as the chaos grows, and let the music speak when no one does. In the spirit of Buster Keaton.",
    ["style-wide-stunt-awe", "style-see-trap-laugh", "style-stone-face-chaos", "style-no-words-music-steps"], with_(["music", "camera-angle"]));

  /* ---------- 7. Big blockbuster awe ---------- */

  S("style-blockbuster-awe", "Big blockbuster awe", "emotion",
    "Faces looking up in wonder before we see what they see, a slow push in, a sweeping crane, light pouring through haze, the big thing kept hidden as long as possible and a full orchestra with a tune you can hum. In the spirit of Steven Spielberg.",
    [
      { curiosity: "awe", value: 5 },
      { curiosity: "pushInFace", value: 4, weight: 80 },
      { curiosity: "cameraMove", value: "crane", weight: 70 },
      { curiosity: "lensLength", value: "wide", weight: 60 },
      { curiosity: "music", value: "featured", weight: 80 },
      { curiosity: "music", slider: "instrumentation", value: "orchestra", weight: 70 },
      { curiosity: "characterTheme", value: 5, weight: 70 },
      { curiosity: "offscreen", value: 4, weight: 70 },
      { curiosity: "panReveal", value: 4, weight: 60 },
      { curiosity: "atmosphere", value: "beams", weight: 60 },
      { curiosity: "lightEffect", value: "god rays", weight: 50 },
      { curiosity: "scale", value: "city", weight: 50 },
    ], with_(["camera-motion", "music", "light"]));

  P("style-face-before-wonder", "When a face stares up in wonder, the reveal feels bigger", "emotion",
    "Push in slowly on someone looking up before we see what they see, and the wonder doubles when we finally turn.",
    { curiosity: "pushInFace", change: "rises" }, { curiosity: "awe", change: "rises" }, 2, with_(["camera-motion"]));
  P("style-unseen-dread", "When the big thing stays off screen, the dread builds", "focus",
    "Hiding the creature or the danger, and showing only what it does, makes us fear it more than seeing it would.",
    { curiosity: "offscreen", change: "rises" }, { curiosity: "dread", change: "rises" }, 2, with_(["emo-road"]));
  P("style-reveal-orchestra", "When the big reveal lands, the orchestra swells", "music",
    "The turn of the camera onto the huge sight is met by the music rising to full strength.",
    { curiosity: "panReveal", change: "rises" }, { curiosity: "music", slider: "energy", change: "rises" }, 1, with_(["camera-motion"]));
  P("style-theme-returns-release", "When the hero's tune comes back, the audience lets go", "music",
    "Bringing back the hummable theme at the big moment releases everything we have been holding.",
    { curiosity: "characterTheme", change: "rises" }, { curiosity: "catharsis", change: "rises" }, 1, with_(["emo-road"]));

  PS("style-blockbuster-awe-moves", "Big blockbuster awe: the moves", "emotion",
    "Show the face before the wonder, keep the big thing hidden, swell the orchestra on the reveal, and bring the hero's tune back for the release. In the spirit of Steven Spielberg.",
    ["style-face-before-wonder", "style-unseen-dread", "style-reveal-orchestra", "style-theme-returns-release"], with_(["music", "camera-motion"]));

  /* ---------- 8. Quiet family drama ---------- */

  S("style-quiet-family", "Quiet family drama", "camera-angle",
    "A low camera that never moves, people sitting at home saying less than they feel, scenes that end on an empty room, and almost no music. In the spirit of Yasujiro Ozu.",
    [
      { curiosity: "angleHeight", value: "low" },
      { curiosity: "cameraMove", value: "none" },
      { curiosity: "cameraCarry", value: "locked", weight: 80 },
      { curiosity: "blocking", value: "one seated", weight: 60 },
      { curiosity: "setting", value: "kitchen", weight: 50 },
      { curiosity: "holdBeforeCut", value: 5, weight: 70 },
      { curiosity: "holdBeforeCut", slider: "onWhat", value: "an empty room", weight: 70 },
      { curiosity: "emoShown", value: "mostly hidden", weight: 80 },
      { curiosity: "subtext", value: "far apart", weight: 70 },
      { curiosity: "storyTemperature", value: "cool", weight: 60 },
      { curiosity: "music", value: "barely there", weight: 60 },
    ], with_(["camera-motion", "emotion", "transitions"]));

  P("style-end-empty-room", "When a scene ends quietly, the camera rests on an empty room", "transitions",
    "Instead of cutting on the last line, the film stays on the space the people just left, letting the feeling settle.",
    { curiosity: "sceneEnding", is: "quiet fade" }, { curiosity: "holdBeforeCut", change: "rises" }, 1, with_(["structure"]));
  P("style-held-in-weight", "When the feeling is kept inside, the weight we carry grows", "emotion",
    "When no one says what they feel, the unspoken feeling builds scene after scene until a tiny moment lets it out.",
    { curiosity: "emoShown", is: "mostly hidden" }, { curiosity: "emotionalDebt", change: "rises" }, 3, with_(["emo-road"]));
  P("style-still-camera-closer", "When the camera stays still and low, we feel closer to the family", "camera-angle",
    "A calm, seated-height view lets us sit with these people like a guest, and our feeling for them deepens.",
    { curiosity: "cameraMove", is: "none" }, { curiosity: "empathy", change: "rises" }, 3, with_(["emotion"]));
  P("style-leaves-house-quiet", "When someone leaves home for good, the house goes lonely", "emo-road",
    "A child marries or moves out, and the parent left behind sits in a quieter, emptier home.",
    { curiosity: "walkOut", is: "leaves for good" }, { curiosity: "loneliness", change: "rises" }, 2, with_(["character-motion"]));

  PS("style-quiet-family-moves", "Quiet family drama: the moves", "camera-angle",
    "End on the empty room, keep feelings inside until they weigh on us, hold the camera still and low, and let a departure leave the house lonely. In the spirit of Yasujiro Ozu.",
    ["style-end-empty-room", "style-held-in-weight", "style-still-camera-closer", "style-leaves-house-quiet"], with_(["emotion", "transitions"]));

  /* ---------- 9. Neon noir ---------- */

  S("style-neon-noir", "Neon noir", "light",
    "Night streets slick with rain, deep shadows and hard light, glowing colored signs, light cut into bars by blinds, a tired voice telling the story and a pulsing electronic score. In the spirit of classic film noir and its neon-lit heirs.",
    [
      { curiosity: "timeOfDay", value: "night" },
      { curiosity: "valueKey", value: "low key" },
      { curiosity: "contrast", value: 5, weight: 80 },
      { curiosity: "wetness", value: "soaked", weight: 70 },
      { curiosity: "practicalInFrame", value: "yes", weight: 70 },
      { curiosity: "glow", value: "room", weight: 60 },
      { curiosity: "glow", slider: "color", value: "colored", weight: 70 },
      { curiosity: "colorAccent", value: "one thing in a strong color", weight: 60 },
      { curiosity: "lightShape", value: "blinds", weight: 60 },
      { curiosity: "voiceover", value: "running", weight: 60 },
      { curiosity: "music", slider: "instrumentation", value: "electronic wall", weight: 60 },
      { curiosity: "cm-worldview", value: 85, weight: 50 },
    ], with_(["color", "audio-mix", "music"]));

  P("style-wet-neon-glow", "When the streets are wet at night, the neon glows twice as bright", "light",
    "Rain on the ground mirrors every sign and lamp, so the colored light doubles across the frame.",
    { curiosity: "wetness", is: "soaked" }, { curiosity: "glow", slider: "brightness", change: "rises" }, 1, with_(["effects"]));
  P("style-narrator-murky", "When the hero tells the story in voice-over, the truth gets murkier", "audio-mix",
    "A tired narrator shapes what we see to suit himself, and we start to wonder what he is leaving out.",
    { curiosity: "voiceover", is: "running" }, { curiosity: "unreliableView", change: "rises" }, 3, with_(["focus"]));
  P("style-shadow-entrance-trust", "When a stranger first appears as a shadow, trust drops", "character-motion",
    "Someone introduced as a dark shape in a doorway starts the scene already suspected.",
    { curiosity: "bigEntrance", slider: "firstSeen", is: "a shadow" }, { curiosity: "warmth", change: "drops" }, 1, with_(["emo-road"]));
  P("style-blinds-trapped", "When the blinds cut the light into bars, the hero looks trapped", "light",
    "Stripes of light and shadow across a face make the room feel like a cell.",
    { curiosity: "lightShape", is: "blinds" }, { curiosity: "waysOut", change: "rises" }, 1, with_(["set"]));

  PS("style-neon-noir-moves", "Neon noir: the moves", "light",
    "Wet the streets so the neon doubles, let a narrator bend the truth, bring strangers in as shadows, and bar the light like a cell. In the spirit of classic film noir and its neon-lit heirs.",
    ["style-wet-neon-glow", "style-narrator-murky", "style-shadow-entrance-trust", "style-blinds-trapped"], with_(["audio-mix", "emo-road"]));

  /* ---------- 10. Mockumentary ---------- */

  S("style-mockumentary", "Mockumentary", "comedy",
    "Made up but shot like a real documentary: a shaky held camera, people talking straight to us in interviews, sudden zooms onto awkward faces, long looks at the lens and dry, painful silences. In the spirit of Christopher Guest.",
    [
      { curiosity: "fourthWall", value: "talks to us" },
      { curiosity: "cameraCarry", value: "handheld", weight: 80 },
      { curiosity: "reframe", value: "strong punch-in", weight: 70 },
      { curiosity: "comicRegister", value: "dry", weight: 80 },
      { curiosity: "cringe", value: 4, weight: 70 },
      { curiosity: "comicReaction", slider: "toCamera", value: "a long look", weight: 70 },
      { curiosity: "improvFeel", value: 4, weight: 60 },
      { curiosity: "nameCard", value: "name and a joke", weight: 50 },
      { curiosity: "jumpCut", value: "a few", weight: 50 },
      { curiosity: "music", value: "none", weight: 50 },
    ], with_(["camera-motion", "canvas", "titles"]));

  P("style-awkward-snap-zoom", "When someone says something awkward, the camera snaps in on a face", "canvas",
    "Like a real camera crew catching a moment, the picture jumps closer to the face that just went wrong.",
    { curiosity: "cringe", change: "rises" }, { curiosity: "reframe", is: "strong punch-in" }, 1, with_(["comedy"]));
  P("style-look-at-lens-laugh", "When someone looks straight at the camera, the laugh doubles", "comedy",
    "A silent glance at the lens lets us share the joke with the one sane person in the room.",
    { curiosity: "comicReaction", slider: "toCamera", is: "a long look" }, { curiosity: "laughsPerMinute", change: "rises" }, 1);
  P("style-interview-contradicted", "When the next shot shows the opposite of the interview, the irony is plain", "comedy",
    "Someone boasts in an interview, then we cut to them failing at exactly that.",
    { curiosity: "cutawayGag", slider: "kind", is: "a contradiction" }, { curiosity: "irony", slider: "obviousness", change: "rises" }, 1, with_(["transitions"]));
  P("style-loose-truth-slips", "When the talk loosens up, a secret slips out", "plot",
    "Once people relax and forget the camera, they start saying things they meant to keep quiet.",
    { curiosity: "improvFeel", change: "rises" }, { curiosity: "plotSecret", is: "slipping" }, 3, with_(["comedy"]));

  PS("style-mockumentary-moves", "Mockumentary: the moves", "comedy",
    "Snap in on awkward faces, share a look at the lens, cut from the boast to the failure, and let people relax until secrets slip. In the spirit of Christopher Guest.",
    ["style-awkward-snap-zoom", "style-look-at-lens-laugh", "style-interview-contradicted", "style-loose-truth-slips"], with_(["canvas", "plot"]));

  /* ---------- 11. Horror jump scare build ---------- */

  S("style-jump-scare-build", "Horror jump scare build", "music",
    "Drain the music away, leave dark empty space in the frame, hold on a door too long, give a false scare first, then hit hard and loud. In the spirit of James Wan.",
    [
      { curiosity: "noMusic", value: 8 },
      { curiosity: "noMusic", slider: "purpose", value: "suspense", weight: 80 },
      { curiosity: "lingeringShot", value: 6, weight: 70 },
      { curiosity: "lingeringShot", slider: "on", value: "a door", weight: 60 },
      { curiosity: "emptySpace", value: "most", weight: 70 },
      { curiosity: "valueKey", value: "low key", weight: 70 },
      { curiosity: "psychOut", value: "psych-out", weight: 60 },
      { curiosity: "bigHit", value: 5, weight: 80 },
      { curiosity: "musicSting", value: "hit", weight: 70 },
      { curiosity: "loudness", value: "peaking", weight: 60 },
      { curiosity: "behindTheirBack", value: "a blur", weight: 50 },
    ], with_(["focus", "placement", "audio-mix", "light"]));

  P("style-silence-brace", "When the music drains away, we brace for a shock", "music",
    "A long stretch with no music tells the audience something is coming, and the dread climbs with every silent second.",
    { curiosity: "noMusic", change: "rises" }, { curiosity: "dread", change: "rises" }, 1, with_(["emo-road"]));
  P("style-false-then-real", "When a false scare passes, the real one comes right after", "structure",
    "The cat jumps out, everyone laughs with relief, and in the next beat the true scare hits while our guard is down.",
    { curiosity: "psychOut", is: "psych-out" }, { curiosity: "bigHit", change: "rises" }, 2, with_(["music"]));
  P("style-empty-space-search", "When the frame leaves dark empty space, we search it for what is hidden", "placement",
    "Putting the person off to one side with darkness beside them makes us stare at the dark, expecting a face.",
    { curiosity: "emptySpace", is: "most" }, { curiosity: "offscreen", change: "rises" }, 1, with_(["focus"]));
  P("style-scare-slams-loud", "When the scare hits, the sound slams to its loudest", "audio-mix",
    "The quiet before makes the sudden blast of sound feel even louder.",
    { curiosity: "bigHit", change: "rises" }, { curiosity: "loudness", is: "peaking" }, 0, with_(["music"]));

  PS("style-jump-scare-build-moves", "Horror jump scare build: the moves", "music",
    "Drain the music, leave empty dark space to search, give a false scare first, then slam the real one loud. In the spirit of James Wan.",
    ["style-silence-brace", "style-empty-space-search", "style-false-then-real", "style-scare-slams-loud"], with_(["audio-mix", "emo-road"]));

  /* ---------- 12. Romantic comedy meet-cute ---------- */

  S("style-meet-cute", "Romantic comedy meet-cute", "comedy-mix",
    "Two opposite people collide by accident, bicker in quick banter, get each other wrong, and walk and talk through a city in autumn while warm music waits for them to stand close. In the spirit of Nora Ephron.",
    [
      { curiosity: "chemistry", value: 5 },
      { curiosity: "chemistry", slider: "kind", value: "romantic" },
      { curiosity: "typeClash", value: "opposite types", weight: 80 },
      { curiosity: "comedyDevice", value: "banter", weight: 70 },
      { curiosity: "physicalComedy", value: "a small fumble", weight: 60 },
      { curiosity: "misunderstanding", value: 2, weight: 60 },
      { curiosity: "warmth", value: 1, weight: 60 },
      { curiosity: "walkAndTalk", value: 50, weight: 60 },
      { curiosity: "music", slider: "mood", value: "warm", weight: 60 },
      { curiosity: "seasons", slider: "season", value: "autumn", weight: 40 },
    ], with_(["comedy", "emo-road", "music"]));

  P("style-bump-spark", "When two strangers bump into each other, the spark starts", "comedy-mix",
    "A dropped bag or a spilled coffee makes the first meeting clumsy, and the clumsiness is where the attraction begins.",
    { curiosity: "physicalComedy", is: "a small fumble" }, { curiosity: "chemistry", change: "rises" }, 1, with_(["comedy"]));
  P("style-bicker-warms", "When they argue, they warm to each other", "emo-road",
    "Each squabble is really a dance, and every round of it brings them a little closer.",
    { curiosity: "egoClash", change: "rises" }, { curiosity: "warmth", change: "rises" }, 3, with_(["comedy-mix"]));
  P("style-mixup-longing", "When a mix-up pulls them apart, the longing grows", "emo-road",
    "A misunderstanding splits the pair just as they got close, and missing each other makes them want each other more.",
    { curiosity: "misunderstanding", change: "rises" }, { curiosity: "longing", change: "rises" }, 3, with_(["comedy"]));
  P("style-close-music-swells", "When they finally stand close, the music swells", "music",
    "The moment the space between them closes, the music rises to meet it.",
    { curiosity: "personalSpace", is: "close" }, { curiosity: "music", slider: "energy", change: "rises" }, 1, with_(["emotion"]));

  PS("style-meet-cute-moves", "Romantic comedy meet-cute: the moves", "comedy-mix",
    "Bump them together, let the bickering warm them, pull them apart with a mix-up, and swell the music when they stand close. In the spirit of Nora Ephron.",
    ["style-bump-spark", "style-bicker-warms", "style-mixup-longing", "style-close-music-swells"], with_(["emo-road", "music"]));

  /* ---------- 13. Heist caper ---------- */

  S("style-heist-caper", "Heist caper", "plot",
    "A crew of experts, the plan laid out step by step, cutting between them as it runs, a cool jazzy score, a tight clock, things going wrong, and a hidden part of the plan we only learn at the end. In the spirit of Steven Soderbergh.",
    [
      { curiosity: "planShown", value: 5 },
      { curiosity: "planShown", slider: "hidden", value: "the real plan is hidden", weight: 80 },
      { curiosity: "typeClash", slider: "size", value: "an ensemble", weight: 60 },
      { curiosity: "cm-competence", value: 90, weight: 60 },
      { curiosity: "intercut", value: 6, weight: 70 },
      { curiosity: "tickingClock", value: "tight", weight: 70 },
      { curiosity: "musicStyle", slider: "style", value: "jazz", weight: 60 },
      { curiosity: "overlay", value: "split screen", weight: 50 },
      { curiosity: "misdirection", value: 4, weight: 70 },
      { curiosity: "reveal", value: "after", weight: 60 },
      { curiosity: "plantForgotten", value: 3, weight: 60 },
      { curiosity: "warmCool", value: "warm", weight: 40 },
    ], with_(["structure", "music", "comedy"]));

  P("style-plan-told-goes-wrong", "When the plan is laid out in full, something is bound to go wrong", "plot",
    "Showing every step of the plan tells the audience exactly what to watch for, so the first slip hits hard.",
    { curiosity: "planShown", change: "rises" }, { curiosity: "complication", change: "rises" }, 4);
  P("style-falls-apart-payoff", "When it all seems to fall apart, the hidden part of the plan pays off", "plot",
    "Just as the crew looks beaten, a detail planted earlier turns out to have been the real plan all along.",
    { curiosity: "complication", change: "rises" }, { curiosity: "plantForgotten", slider: "payoffSize", change: "rises" }, 4, with_(["structure"]));
  P("style-crosscut-tension", "When the cutting jumps between the crew, the tension climbs", "structure",
    "Cutting between people working at the same moment in different places makes every piece feel like it could fail.",
    { curiosity: "intercut", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 1);
  P("style-clock-music-faster", "When the clock is down to seconds, the music speeds up", "music",
    "The score picks up speed with the countdown, so we feel the deadline in our pulse.",
    { curiosity: "tickingClock", is: "seconds left" }, { curiosity: "tempoShift", is: "speeds a lot" }, 1, with_(["plot"]));

  PS("style-heist-caper-moves", "Heist caper: the moves", "plot",
    "Lay out the plan, let it go wrong, cut between the crew as the clock and music speed up, and pay off the hidden part at the end. In the spirit of Steven Soderbergh.",
    ["style-plan-told-goes-wrong", "style-crosscut-tension", "style-clock-music-faster", "style-falls-apart-payoff"], with_(["structure", "music"]));

  /* ---------- 14. Coming of age ---------- */

  S("style-coming-of-age", "Coming of age", "arc",
    "Long summer days and nights walking and talking, songs from that year, a warm faded look, small awkward moments, an old hurt, and a quiet moment of seeing things clearly that leaves them a little older. In the spirit of Richard Linklater.",
    [
      { curiosity: "arcDirection", value: "grows" },
      { curiosity: "nostalgia", value: 4, weight: 80 },
      { curiosity: "nostalgia", slider: "look", value: "faded and warm", weight: 60 },
      { curiosity: "walkAndTalk", value: 60, weight: 70 },
      { curiosity: "music", slider: "familiarity", value: "famous", weight: 60 },
      { curiosity: "seasons", slider: "season", value: "summer", weight: 50 },
      { curiosity: "lighting", value: "dusk", weight: 50 },
      { curiosity: "homeBase", value: 4, weight: 60 },
      { curiosity: "cringe", value: 2, weight: 40 },
      { curiosity: "wound", value: 2, weight: 50 },
      { curiosity: "realization", value: 4, weight: 70 },
    ], with_(["emo-road", "music", "set"]));

  P("style-song-floods-back", "When a famous song from their youth plays, the past floods back", "music",
    "A song everyone knows from that time pulls the audience straight into their own memories.",
    { curiosity: "music", slider: "familiarity", is: "famous" }, { curiosity: "nostalgia", change: "rises" }, 1, with_(["emo-road"]));
  P("style-night-walk-opens", "When they walk and talk through the night, they open up", "movement-lines",
    "Moving side by side, not looking at each other, makes it easier to say the true things.",
    { curiosity: "walkAndTalk", change: "rises" }, { curiosity: "emoShown", change: "rises" }, 3, with_(["emo-road"]));
  P("style-leave-home-grow", "When they leave the place they always came back to, they grow up a little", "arc",
    "Walking away from the old hangout for the last time marks the step into being older.",
    { curiosity: "homeBase", slider: "lastVisit", is: "it is left behind" }, { curiosity: "arcDirection", is: "grows" }, 2, with_(["set"]));
  P("style-summer-ends-longing", "When summer turns to autumn, the longing sets in", "emo-road",
    "The change of season says the best days are over, and the characters start missing what they had.",
    { curiosity: "seasons", slider: "season", is: "autumn" }, { curiosity: "longing", change: "rises" }, 2, with_(["background"]));

  PS("style-coming-of-age-moves", "Coming of age: the moves", "arc",
    "Play the song that brings the past back, walk them through the night until they open up, end the summer, and leave the old place behind. In the spirit of Richard Linklater.",
    ["style-song-floods-back", "style-night-walk-opens", "style-summer-ends-longing", "style-leave-home-grow"], with_(["emo-road", "music"]));

  /* ---------- 15. Musical number ---------- */

  S("style-musical-number", "Musical number", "music",
    "Everyday sounds fall into a beat, a song starts in the room and grows into the full soundtrack, every move lands on the music, the camera rises and circles, and the crowd joins in under bright warm light. In the spirit of classic Hollywood musicals.",
    [
      { curiosity: "onScreenPerformance", value: "takes over the scene" },
      { curiosity: "onScreenPerformance", slider: "kind", value: "bursting into song" },
      { curiosity: "sourceToScore", value: "from the room into the soundtrack", weight: 70 },
      { curiosity: "soundsBecomeMusic", value: 4, weight: 60 },
      { curiosity: "music", value: "featured", weight: 80 },
      { curiosity: "music", slider: "cutSync", value: "every action on the beat", weight: 70 },
      { curiosity: "beatSync", value: "on beats", weight: 60 },
      { curiosity: "cameraMove", value: "crane", weight: 60 },
      { curiosity: "circlingCamera", value: 360, weight: 50 },
      { curiosity: "lightingMood", value: "bright and warm", weight: 60 },
      { curiosity: "colorRange", value: "vivid color", weight: 50 },
    ], with_(["camera-motion", "speed", "emotion"]));

  P("style-sounds-start-song", "When everyday sounds fall into a beat, the song begins", "music",
    "Footsteps, a broom or a tapping pencil find a rhythm, and the music grows out of it.",
    { curiosity: "soundsBecomeMusic", change: "rises" }, { curiosity: "music", is: "featured" }, 2);
  P("style-feeling-bursts-song", "When the feeling gets too big for talking, they burst into song", "emotion",
    "The moment words are not enough, the character starts to sing and the scene becomes the number.",
    { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "onScreenPerformance", is: "takes over the scene" }, 2, with_(["music"]));
  P("style-crowd-joins", "When someone bursts into song, the people around join in", "herd",
    "One voice becomes many as passers-by pick up the steps and the tune.",
    { curiosity: "onScreenPerformance", slider: "kind", is: "bursting into song" }, { curiosity: "copying", change: "rises" }, 3, with_(["music"]));
  P("style-peak-camera-rises", "When the number peaks, the camera rises above them", "camera-motion",
    "At the height of the song the camera lifts up high to show the whole dance at once.",
    { curiosity: "music", slider: "energy", change: "rises" }, { curiosity: "cameraMove", is: "crane" }, 2, with_(["music"]));

  PS("style-musical-number-moves", "Musical number: the moves", "music",
    "Find the beat in everyday sounds, burst into song when talk is not enough, let the crowd join, and lift the camera at the peak. In the spirit of classic Hollywood musicals.",
    ["style-sounds-start-song", "style-feeling-bursts-song", "style-crowd-joins", "style-peak-camera-rises"], with_(["camera-motion", "herd"]));

  /* ---------- 16. Kitchen-sink realism ---------- */

  S("style-kitchen-sink", "Kitchen-sink realism", "background",
    "Ordinary working people in small, worn homes, money and jobs on the line, plain flat light, muted color, rain, no music, and acting so natural it feels unplanned. In the spirit of Ken Loach.",
    [
      { curiosity: "setting", value: "kitchen" },
      { curiosity: "setUpkeep", value: "shabby", weight: 80 },
      { curiosity: "mainCost", value: "cheap", weight: 70 },
      { curiosity: "mainWear", value: "worn in", weight: 60 },
      { curiosity: "stakes", value: 4, weight: 80 },
      { curiosity: "stakes", slider: "kind", value: "a job", weight: 70 },
      { curiosity: "lighting", value: "flat", weight: 60 },
      { curiosity: "colorRange", value: "muted color", weight: 60 },
      { curiosity: "texture", value: "gritty", weight: 50 },
      { curiosity: "weather", value: "rain", weight: 40 },
      { curiosity: "music", value: "none", weight: 70 },
      { curiosity: "improvFeel", value: 3, weight: 60 },
    ], with_(["set", "wardrobe", "emo-road"]));

  P("style-money-louder", "When the money runs out, the kitchen arguments get louder", "lines",
    "As the stakes rise at home, voices rise across the kitchen table.",
    { curiosity: "stakes", change: "rises" }, { curiosity: "volume", change: "rises" }, 2, with_(["emo-road"]));
  P("style-trouble-home-shabbier", "When things go wrong outside, the home gets shabbier", "set",
    "Each blow from the world shows up at home: dishes piling, a broken thing left unfixed.",
    { curiosity: "complication", change: "rises" }, { curiosity: "setUpkeep", change: "drops" }, 4, with_(["plot"]));
  P("style-no-music-kindness", "When no music tells us what to feel, a small kindness hits harder", "emotion",
    "Without a score pushing us, a cup of tea or a hand on a shoulder lands with real force.",
    { curiosity: "music", is: "none" }, { curiosity: "tenderness", change: "rises" }, 2, with_(["music"]));
  P("style-shame-lashes-out", "When their shame is seen by others, the resentment boils", "emo-road",
    "Being shamed in front of people, at the job office or the shop counter, turns into anger at the world.",
    { curiosity: "shame", change: "rises" }, { curiosity: "resentment", change: "rises" }, 3, with_(["emotion"]));

  PS("style-kitchen-sink-moves", "Kitchen-sink realism: the moves", "background",
    "Let money troubles raise the voices, let trouble outside wear down the home, cut the music so small kindness lands, and let shame turn into resentment. In the spirit of Ken Loach.",
    ["style-money-louder", "style-trouble-home-shabbier", "style-no-music-kindness", "style-shame-lashes-out"], with_(["emo-road", "set"]));
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
