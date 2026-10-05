/* data/db-styles-comedy.js: comedy style playbooks. 12 comedy directing styles, so comedy sits at the center of the
   style shelf: each a way to learn a comedy director's moves and use them in your own film. Every style is one suite
   named for the style, which sets values on existing curiosities from many workspaces (comedy, comedy mix, lines,
   timing, music, camera, cut, feeling, story), plus one proximity suite of the style's signature causes and effects
   ("When ..., ..."). Styles name techniques in plain words, each "in the spirit of" a well-known director or
   tradition; they describe how it is done and quote no real line and copy no real scene. Same format as
   db-styles.js. Adds no curiosities. Loaded after db-styles.js. Written 2026-10-04 by the database thread. */
(function (DB) {
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const TAGS = { tags: ["style"] };
  const with_ = (also) => Object.assign({ also }, TAGS);

  /* ---------- 1. Genre spoof, gag after gag ---------- */

  S("style-genre-spoof", "Genre spoof, gag after gag", "comedy",
    "Borrow the look and rules of a famous kind of film with real love, then break every rule for a laugh: big broad acting, groaning puns, characters who know they are in a movie, and music that turns out to be playing right there in the scene. In the spirit of Mel Brooks.",
    [
      { curiosity: "parody", value: "clearly borrowed" },
      { curiosity: "parody", slider: "target", value: "a genre" },
      { curiosity: "parody", slider: "affection", value: "loving tribute", weight: 70 },
      { curiosity: "parody", slider: "bend", value: "fully absurd", weight: 70 },
      { curiosity: "metaJoke", value: 4, weight: 80 },
      { curiosity: "metaJoke", slider: "breaksWorld", value: "shatters it", weight: 60 },
      { curiosity: "comicRegister", value: "big", weight: 80 },
      { curiosity: "wordplay", value: "pun", weight: 60 },
      { curiosity: "subversion", value: 5, weight: 70 },
      { curiosity: "laughsPerMinute", value: 7, weight: 70 },
      { curiosity: "sourceToScore", value: "from the soundtrack into the room", weight: 60 },
    ], with_(["music", "lines"]));

  P("style-borrowed-rule-broken", "When the genre's rules are clearly borrowed, breaking them gets the laugh", "comedy",
    "Once the audience recognizes the old rules of the genre, every rule you break on purpose turns into a joke.",
    { curiosity: "parody", slider: "closeness", is: "clearly borrowed" }, { curiosity: "subversion", change: "rises" }, 1);
  P("style-score-in-room", "When the music turns out to be playing in the room, the film winks at itself", "music",
    "We think the music is only for us, then the camera finds the band or the radio right there, and the film admits it is a film.",
    { curiosity: "sourceToScore", is: "from the soundtrack into the room" }, { curiosity: "metaJoke", change: "rises" }, 0, with_(["comedy"]));
  P("style-self-aware-faster", "When the film jokes about being a film, the laughs come faster", "comedy",
    "Each wink at the camera, the budget or the genre adds another layer of jokes on top of the story.",
    { curiosity: "metaJoke", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 1);
  P("style-pun-topped", "When a groaning pun lands, another gag tops it right away", "lines",
    "The pun is never left alone: a sight gag or a second joke piles on before the groan has ended.",
    { curiosity: "wordplay", is: "pun" }, { curiosity: "topper", change: "rises" }, 1, with_(["comedy"]));

  PS("style-genre-spoof-moves", "Genre spoof, gag after gag: the moves", "comedy",
    "Borrow the genre's rules so breaking them is funny, let the music show up in the room, wink about being a film, and top every pun. In the spirit of Mel Brooks.",
    ["style-borrowed-rule-broken", "style-score-in-room", "style-self-aware-faster", "style-pun-topped"], with_(["music", "lines"]));

  /* ---------- 2. Absurd sketch logic ---------- */

  S("style-sketch-logic", "Absurd sketch logic", "comedy",
    "Take one silly idea and follow it with strict logic until it reaches madness, let nobody in the scene blink, answer silly questions with dead serious detail, poke fun at officials and rules, and when a sketch has gone far enough, just stop and jump somewhere else, joined by cut-out drawings. In the spirit of Monty Python.",
    [
      { curiosity: "absurdity", value: 5 },
      { curiosity: "absurdity", slider: "acceptance", value: "nobody blinks", weight: 80 },
      { curiosity: "straightAnswer", value: "dead serious", weight: 70 },
      { curiosity: "comicPremise", slider: "mined", value: 5, weight: 70 },
      { curiosity: "comicEscalation", value: 5, weight: 70 },
      { curiosity: "comicEscalation", slider: "ceiling", value: "apocalyptic", weight: 50 },
      { curiosity: "sceneEnding", value: "smash cut", weight: 60 },
      { curiosity: "metaJoke", value: 3, weight: 50 },
      { curiosity: "scribblesOnTop", value: 3, weight: 50 },
      { curiosity: "comedyTopic", value: "rules", weight: 60 },
      { curiosity: "comedyTopic", slider: "punch", value: "the powerful", weight: 50 },
      { curiosity: "understatement", value: "huge treated as tiny", weight: 60 },
    ], with_(["structure", "layers", "lines"]));

  P("style-nobody-blinks", "When nobody in the scene blinks at the absurd, it gets funnier", "comedy",
    "If everyone treats a ridiculous thing as perfectly normal, the audience laughs for all of them.",
    { curiosity: "absurdity", slider: "acceptance", is: "nobody blinks" }, { curiosity: "laughsPerMinute", change: "rises" }, 1);
  P("style-logic-climbs", "When one silly idea is followed with strict logic, it climbs higher and higher", "comedy",
    "Each step makes sense on its own, so the idea keeps growing until it reaches something nobody could have guessed.",
    { curiosity: "comicPremise", slider: "mined", change: "rises" }, { curiosity: "comicEscalation", change: "rises" }, 3);
  P("style-serious-answer-absurd", "When a silly question gets a dead serious answer, the absurdity grows", "lines",
    "A careful, expert reply to a foolish question makes the whole world of the scene feel even stranger.",
    { curiosity: "straightAnswer", is: "dead serious" }, { curiosity: "absurdity", change: "rises" }, 1, with_(["comedy"]));
  P("style-sketch-just-stops", "When the film notices it has gone too far, it just stops and moves on", "structure",
    "Instead of a punchline, someone points out the silliness and the film cuts to something new without warning.",
    { curiosity: "metaJoke", change: "rises" }, { curiosity: "sceneEnding", is: "smash cut" }, 1, with_(["comedy"]));
  P("style-officials-sillier", "When the joke aims at people in charge, the rules get sillier", "comedy",
    "Officials, clerks and generals defend rules that make less and less sense, and the more seriously they do it, the sillier it gets.",
    { curiosity: "comedyTopic", slider: "punch", is: "the powerful" }, { curiosity: "absurdity", change: "rises" }, 2);

  PS("style-sketch-logic-moves", "Absurd sketch logic: the moves", "comedy",
    "Let nobody blink, follow one silly idea with strict logic, answer foolish questions seriously, mock the people in charge, and stop the sketch the moment it goes too far. In the spirit of Monty Python.",
    ["style-nobody-blinks", "style-logic-climbs", "style-serious-answer-absurd", "style-sketch-just-stops", "style-officials-sillier"], with_(["lines", "structure"]));

  /* ---------- 3. Fast visual comedy cut to the beat ---------- */

  S("style-cut-to-the-beat", "Fast visual comedy cut to the beat", "comedy",
    "Jokes told by the edit: quick close shots of everyday actions, whip pans between places, a whoosh or a thud on every move, cuts that land on the music, shapes that match from one shot to the next, and small details planted early that pay off later. In the spirit of Edgar Wright.",
    [
      { curiosity: "comicEdit", value: 5 },
      { curiosity: "comicEdit", slider: "tempo", value: "frantic", weight: 80 },
      { curiosity: "beatSync", value: "on beats", weight: 80 },
      { curiosity: "sfxHits", value: "busy", weight: 70 },
      { curiosity: "sfxHits", slider: "kind", value: "whoosh", weight: 50 },
      { curiosity: "shotSize", value: "insert", weight: 60 },
      { curiosity: "transitionKind", value: "whip pan", weight: 70 },
      { curiosity: "music", slider: "cutSync", value: "every action on the beat", weight: 80 },
      { curiosity: "callback", slider: "form", value: "same words, new meaning", weight: 60 },
      { curiosity: "matchCut", value: "movement", weight: 50 },
    ], with_(["speed", "transitions", "music", "audio-mix"]));

  P("style-beat-chores-epic", "When the cuts land on the beat, an everyday chore feels like an action scene", "speed",
    "Brushing teeth or making tea, cut hard to the music, turns into something heroic and silly at once.",
    { curiosity: "beatSync", is: "on beats" }, { curiosity: "mockEpic", change: "rises" }, 1, with_(["comedy-mix"]));
  P("style-sound-snaps-cut", "When every tiny action gets a whoosh or a thud, the cuts snap harder", "audio-mix",
    "A sound on each move gives the edit a punch, so the jokes in the cutting hit sharper.",
    { curiosity: "sfxHits", change: "rises" }, { curiosity: "comicEdit", change: "rises" }, 0, with_(["comedy"]));
  P("style-planted-pays-later", "When a joke is quietly planted early, it pays off much later", "comedy",
    "A throwaway detail in the background of an early scene comes back near the end and gets a bigger laugh the second time.",
    { curiosity: "comicBeat", slider: "visibility", is: "background" }, { curiosity: "payoffDistance", change: "rises" }, 8, with_(["structure"]));
  P("style-action-on-beat-laughs", "When every action lands on the beat, the laughs come faster", "music",
    "Doors, punches and footsteps timed to the song make the whole scene feel like a joke being played on a drum.",
    { curiosity: "music", slider: "cutSync", is: "every action on the beat" }, { curiosity: "laughsPerMinute", change: "rises" }, 1, with_(["comedy"]));
  P("style-whip-scenes-fly", "When the camera whips from place to place, the scenes fly by faster", "transitions",
    "A fast swing of the camera carries us straight into the next place, so the story never stops to catch its breath.",
    { curiosity: "transitionKind", is: "whip pan" }, { curiosity: "sceneRate", change: "rises" }, 1, with_(["structure"]));

  PS("style-cut-to-the-beat-moves", "Fast visual comedy cut to the beat: the moves", "comedy",
    "Cut chores to the beat, put a sound on every move, plant jokes early to pay off late, land the action on the music, and whip from place to place. In the spirit of Edgar Wright.",
    ["style-beat-chores-epic", "style-sound-snaps-cut", "style-planted-pays-later", "style-action-on-beat-laughs", "style-whip-scenes-fly"], with_(["speed", "music"]));

  /* ---------- 4. Loose improvised hangout comedy ---------- */

  S("style-hangout-comedy", "Loose improvised hangout comedy", "comedy-mix",
    "Old friends riffing in long, loose scenes, with lots of tangents and many versions of each joke, teasing that is really love, people cracking each other up, cuts to whoever is laughing, and a real ache about growing up slipping out between the jokes. In the spirit of Judd Apatow.",
    [
      { curiosity: "improvFeel", value: 5 },
      { curiosity: "improvFeel", slider: "tangents", value: 5, weight: 70 },
      { curiosity: "improvFeel", slider: "takes", value: "a pile of alternates", weight: 60 },
      { curiosity: "sceneLength", value: "long", weight: 70 },
      { curiosity: "doubleAct", value: "friends", weight: 80 },
      { curiosity: "roast", value: 3, weight: 60 },
      { curiosity: "roast", slider: "affection", value: "loving", weight: 70 },
      { curiosity: "corpsing", value: "a smirk", weight: 50 },
      { curiosity: "comedyTopic", value: "age", weight: 50 },
      { curiosity: "laughsToTears", value: "back and forth", weight: 60 },
      { curiosity: "multicamSwitch", value: "switch on reactions", weight: 60 },
    ], with_(["comedy", "lines", "emotion"]));

  P("style-tangents-real", "When the talk wanders off topic, the friends feel more real", "comedy-mix",
    "Side stories and silly detours sound like real friends talking, and we care about them more for it.",
    { curiosity: "improvFeel", slider: "tangents", change: "rises" }, { curiosity: "empathy", change: "rises" }, 3, with_(["emotion"]));
  P("style-loving-roast-warmth", "When friends roast each other with love, the warmth between them grows", "comedy-mix",
    "Insults traded with a grin show how close they are, and every round makes the friendship feel warmer.",
    { curiosity: "roast", slider: "affection", is: "loving" }, { curiosity: "warmth", change: "rises" }, 2, with_(["emo-road"]));
  P("style-crack-up-spreads", "When one person cracks up, the laughing spreads around the room", "comedy",
    "A real laugh breaking through is catching, and keeping it in the cut makes the scene feel alive.",
    { curiosity: "corpsing", is: "laughing out loud" }, { curiosity: "corpsing", slider: "spreads", change: "rises" }, 0, with_(["comedy-mix"]));
  P("style-long-loose-ache", "When a loose scene runs long, a true feeling slips out between the jokes", "emotion",
    "After enough joking around, someone says something honest about their life, and the laugh turns into an ache.",
    { curiosity: "sceneLength", is: "long" }, { curiosity: "laughsToTears", slider: "depth", change: "rises" }, 4, with_(["comedy"]));
  P("style-reaction-cut-twice", "When the cut goes to whoever is listening, the joke lands twice", "structure",
    "We laugh at the line, then laugh again at the friend trying not to.",
    { curiosity: "multicamSwitch", is: "switch on reactions" }, { curiosity: "laughsPerMinute", change: "rises" }, 0, with_(["comedy"]));

  PS("style-hangout-comedy-moves", "Loose improvised hangout comedy: the moves", "comedy-mix",
    "Let the talk wander, roast with love, keep the real crack-ups, let a long scene find a true feeling, and cut to the listener. In the spirit of Judd Apatow.",
    ["style-tangents-real", "style-loving-roast-warmth", "style-crack-up-spreads", "style-long-loose-ache", "style-reaction-cut-twice"], with_(["comedy", "emotion"]));

  /* ---------- 5. Dark comedy of bad plans ---------- */

  S("style-bad-plans", "Dark comedy of bad plans", "comedy",
    "Ordinary, greedy people with a simple scheme that goes wrong in every possible way, each fix making it worse, terrible things said in a flat polite voice, sudden violence, wide-lens faces up close and plain folk music. In the spirit of the Coen brothers.",
    [
      { curiosity: "planShown", value: 4, weight: 70 },
      { curiosity: "planShown", slider: "works", value: "falls apart" },
      { curiosity: "comicFlaw", value: "greed" },
      { curiosity: "comicFlaw", slider: "blind", value: "completely blind", weight: 70 },
      { curiosity: "comedyDevice", slider: "darkness", value: "pitch black", weight: 70 },
      { curiosity: "escalatingLie", value: 4, weight: 70 },
      { curiosity: "complication", slider: "source", value: "their own mistake", weight: 70 },
      { curiosity: "complication", slider: "pileUp", value: 5, weight: 60 },
      { curiosity: "understatement", slider: "delivery", value: "matter of fact", weight: 60 },
      { curiosity: "emoActions", value: "drastic", weight: 50 },
      { curiosity: "lensLength", value: "wide", weight: 50 },
      { curiosity: "musicStyle", slider: "style", value: "folk", weight: 40 },
    ], with_(["plot", "camera-angle", "music"]));

  P("style-plan-falls-apart", "When the plan is laid out step by step, it starts to fall apart", "plot",
    "The more carefully the scheme is explained, the more we look forward to each step going wrong.",
    { curiosity: "planShown", change: "rises" }, { curiosity: "complication", change: "rises" }, 4, with_(["comedy"]));
  P("style-greed-fix-worse", "When greed blinds them, every fix makes it worse", "comedy",
    "Wanting the money too much, they cover one mistake with a bigger one, and the lie keeps growing.",
    { curiosity: "comicFlaw", is: "greed" }, { curiosity: "escalatingLie", change: "rises" }, 3, with_(["plot"]));
  P("style-lie-turns-violent", "When the lie is about to fall, someone gets hurt", "plot",
    "A scheme that was silly turns suddenly brutal once it cannot hold together any longer.",
    { curiosity: "escalatingLie", slider: "near", is: "about to fall" }, { curiosity: "emoActions", is: "drastic" }, 3, with_(["emotion"]));
  P("style-polite-horror-laugh", "When something awful is said in a flat, polite voice, the dark laugh comes", "lines",
    "Treating a terrible thing as ordinary small talk makes us laugh and then feel strange about it.",
    { curiosity: "understatement", slider: "delivery", is: "matter of fact" }, { curiosity: "laughsPerMinute", change: "rises" }, 1, with_(["comedy"]));
  P("style-violence-then-calm", "When violence breaks out, the next scene is calm and ordinary", "structure",
    "After the shock, the film cuts to someone eating breakfast or chatting about the weather, and the contrast is the joke.",
    { curiosity: "emoActions", is: "drastic" }, { curiosity: "emoContrastPrev", is: "the opposite" }, 1, with_(["emotion"]));

  PS("style-bad-plans-moves", "Dark comedy of bad plans: the moves", "comedy",
    "Lay out the plan so it can fall apart, let greed make every fix worse, let the lie turn violent, say awful things politely, and follow the shock with calm. In the spirit of the Coen brothers.",
    ["style-plan-falls-apart", "style-greed-fix-worse", "style-lie-turns-violent", "style-polite-horror-laugh", "style-violence-then-calm"], with_(["plot", "lines"]));

  /* ---------- 6. Sweet clown with a broken heart ---------- */

  S("style-sweet-clown", "Sweet clown with a broken heart", "comedy",
    "A poor little hero in worn-out formal clothes who keeps his dignity, takes fall after fall without a word, loses to the rich and powerful again and again, shows small tender kindness, and turns the laugh into tears with his own gentle tune. In the spirit of Charlie Chaplin.",
    [
      { curiosity: "laughsToTears", value: "laugh to tears" },
      { curiosity: "laughsToTears", slider: "depth", value: 5, weight: 80 },
      { curiosity: "punchingBag", value: 6, weight: 70 },
      { curiosity: "punchingBag", slider: "sympathy", value: 5, weight: 80 },
      { curiosity: "physicalComedy", value: "a fall", weight: 70 },
      { curiosity: "wordsAmount", value: 0, weight: 70 },
      { curiosity: "characterTheme", slider: "version", value: "tender", weight: 60 },
      { curiosity: "tenderness", value: 4, weight: 70 },
      { curiosity: "hope", slider: "fragile", value: "hanging by a thread", weight: 60 },
      { curiosity: "mainWear", value: "worn out", weight: 50 },
      { curiosity: "mainFormality", value: "formal", weight: 40 },
      { curiosity: "statusGap", value: "big gap", weight: 60 },
    ], with_(["emotion", "music", "wardrobe", "emo-road"]));

  P("style-losing-root-harder", "When the little hero keeps losing, we root for them harder", "comedy-mix",
    "Every knock he takes with good grace pulls the audience further onto his side.",
    { curiosity: "punchingBag", change: "rises" }, { curiosity: "sideTaking", is: "we root for them" }, 3, with_(["emo-road"]));
  P("style-music-bridge-tears", "When music carries the turn from funny to sad, the tears feel earned", "music",
    "A gentle tune slides in under the last laugh and lets the sadness arrive without a word.",
    { curiosity: "laughsToTears", slider: "bridge", is: "music" }, { curiosity: "earnedTears", change: "rises" }, 1, with_(["comedy", "emo-road"]));
  P("style-gap-punch-up", "When the rich look down on the little hero, the gags punch upward", "comedy",
    "The bigger the gap in rank, the more the jokes land on the proud and powerful instead of on him.",
    { curiosity: "statusGap", is: "big gap" }, { curiosity: "comedyTopic", slider: "punch", is: "the powerful" }, 1, with_(["comedy-mix"]));
  P("style-small-win-relief", "When a small win comes after many losses, the relief is huge", "emo-road",
    "One tiny victory after a long run of bad luck feels bigger than any triumph.",
    { curiosity: "smallWin", change: "rises" }, { curiosity: "relief", change: "rises" }, 1, with_(["emotion"]));
  P("style-no-words-feel-more", "When no one speaks, we read the face and feel more for them", "emotion",
    "Without words, every look and shrug carries the feeling, and we lean in closer to catch it.",
    { curiosity: "wordsAmount", is: 0 }, { curiosity: "empathy", change: "rises" }, 2, with_(["movement-lines"]));

  PS("style-sweet-clown-moves", "Sweet clown with a broken heart: the moves", "comedy",
    "Let him lose so we root for him, bridge the laugh to tears with music, aim the gags upward, give him one small win, and let the face speak instead of words. In the spirit of Charlie Chaplin.",
    ["style-losing-root-harder", "style-music-bridge-tears", "style-gap-punch-up", "style-small-win-relief", "style-no-words-feel-more"], with_(["emotion", "music"]));

  /* ---------- 7. Deadpan stillness and long pauses ---------- */

  S("style-deadpan-pauses", "Deadpan stillness and long pauses", "comedy",
    "People who barely move or speak, faces that never show a thing, long silences after every line, a camera that sits still for long takes, and old songs on a jukebox, so the dry joke and the loneliness arrive together. In the spirit of Jim Jarmusch and Aki Kaurismaki.",
    [
      { curiosity: "comicRegister", value: "deadpan" },
      { curiosity: "comicRegister", slider: "consistency", value: "never breaks", weight: 80 },
      { curiosity: "silence", value: "long", weight: 80 },
      { curiosity: "silence", slider: "seconds", value: 6, weight: 60 },
      { curiosity: "comicTiming", value: 4, weight: 80 },
      { curiosity: "comicTiming", slider: "holdAfter", value: 4, weight: 60 },
      { curiosity: "cameraCarry", value: "locked", weight: 80 },
      { curiosity: "shotDuration", value: "long", weight: 70 },
      { curiosity: "stillness", value: 5, weight: 70 },
      { curiosity: "faceIntensity", value: 0, weight: 70 },
      { curiosity: "wordsAmount", value: 1, weight: 60 },
      { curiosity: "music", slider: "source", value: "only the characters", weight: 50 },
    ], with_(["lines", "camera-motion", "movement-lines"]));

  P("style-pause-dry-laugh", "When the pause after a line runs long, the dry laugh comes in the silence", "lines",
    "Nobody answers, nobody moves, and the longer the quiet lasts, the funnier it gets.",
    { curiosity: "silence", slider: "seconds", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 1, with_(["comedy"]));
  P("style-still-tiny-says-all", "When everyone stays very still, the smallest reaction says everything", "movement-lines",
    "In a room where nobody moves, one raised eyebrow does the work of a shout.",
    { curiosity: "stillness", change: "rises" }, { curiosity: "understatement", slider: "gap", change: "rises" }, 1, with_(["comedy"]));
  P("style-blank-face-lonely", "When nobody shows a feeling, the loneliness shows through", "emo-road",
    "Blank faces keep everything inside, and slowly we sense how alone these people are.",
    { curiosity: "faceIntensity", change: "drops" }, { curiosity: "loneliness", change: "rises" }, 3, with_(["movement-lines"]));
  P("style-few-words-longer-hold", "When almost nothing is said, each line is held longer before the cut", "comedy",
    "With so few words, every one gets room to land, and the hold after it becomes part of the joke.",
    { curiosity: "wordsAmount", is: 1 }, { curiosity: "comicTiming", slider: "holdAfter", change: "rises" }, 1, with_(["lines"]));
  P("style-flat-sad-both", "When a sad thing is said flatly, we laugh and ache at once", "emotion",
    "A heartbreaking fact told without any feeling is both funny and painful, and neither cancels the other.",
    { curiosity: "comicRegister", is: "deadpan" }, { curiosity: "mixedFeelings", is: "even" }, 1, with_(["comedy"]));

  PS("style-deadpan-pauses-moves", "Deadpan stillness and long pauses: the moves", "comedy",
    "Stretch the pause until it gets the laugh, keep everyone still so tiny reactions speak, keep faces blank so loneliness shows, hold each rare line, and say sad things flatly. In the spirit of Jim Jarmusch and Aki Kaurismaki.",
    ["style-pause-dry-laugh", "style-still-tiny-says-all", "style-blank-face-lonely", "style-few-words-longer-hold", "style-flat-sad-both"], with_(["lines", "emotion"]));

  /* ---------- 8. Rapid wordplay and wit ---------- */

  S("style-rapid-wit", "Rapid wordplay and wit", "comedy",
    "Sharp, quick comebacks, lines with a second meaning underneath, a cynical eye on business and money, every good line topped by another person, a phrase that comes back later meaning something new, and a crowd of odd side characters. In the spirit of Billy Wilder and Preston Sturges.",
    [
      { curiosity: "wordplay", value: "comeback" },
      { curiosity: "wordplay", slider: "cleverness", value: "brilliant", weight: 80 },
      { curiosity: "wordplay", slider: "speed", value: "quick", weight: 70 },
      { curiosity: "subtext", value: "far apart", weight: 70 },
      { curiosity: "satire", value: 3, weight: 60 },
      { curiosity: "satire", slider: "hidden", value: "under the surface", weight: 50 },
      { curiosity: "topper", value: 3, weight: 70 },
      { curiosity: "topper", slider: "from", value: "another character", weight: 60 },
      { curiosity: "pace", value: "fast", weight: 70 },
      { curiosity: "callback", slider: "form", value: "same words, new meaning", weight: 70 },
      { curiosity: "typeClash", slider: "size", value: "an ensemble", weight: 50 },
    ], with_(["lines", "comedy-mix", "emotion"]));

  P("style-double-meaning-comeback", "When a line has a second meaning, the sharp listener fires one back", "lines",
    "The hidden meaning is caught at once, and the answer comes back just as sly.",
    { curiosity: "subtext", is: "far apart" }, { curiosity: "wordplay", is: "comeback" }, 1, with_(["comedy"]));
  P("style-brilliant-line-topped", "When a brilliant line lands, someone tops it", "comedy",
    "No clever line gets the last word for long: another character tops it before the laugh has faded.",
    { curiosity: "wordplay", slider: "cleverness", is: "brilliant" }, { curiosity: "topper", change: "rises" }, 1, with_(["lines"]));
  P("style-phrase-new-meaning", "When a phrase comes back with a new meaning, it hits harder than the first time", "comedy",
    "Words we laughed at early return at a turning point, and now they mean something that stays with us.",
    { curiosity: "callback", slider: "form", is: "same words, new meaning" }, { curiosity: "sceneAftertaste", change: "rises" }, 1, with_(["emotion"]));
  P("style-faster-barbs-sharper", "When the talk speeds up, the barbs get sharper", "lines",
    "Quicker answers leave no time to be polite, so the teasing turns into real stings.",
    { curiosity: "pace", slider: "wpm", change: "rises" }, { curiosity: "roast", change: "rises" }, 2, with_(["comedy"]));

  PS("style-rapid-wit-moves", "Rapid wordplay and wit: the moves", "comedy",
    "Hide a second meaning and fire one back, top every brilliant line, bring a phrase back with a new meaning, and speed up so the barbs get sharper. In the spirit of Billy Wilder and Preston Sturges.",
    ["style-double-meaning-comeback", "style-brilliant-line-topped", "style-phrase-new-meaning", "style-faster-barbs-sharper"], with_(["lines", "emotion"]));

  /* ---------- 9. Squirm comedy of the clueless boss ---------- */

  S("style-squirm-boss", "Squirm comedy of the clueless boss", "comedy",
    "A boss who badly wants to be liked tells jokes that die, explains them, pretends to be one of the team, and never notices the long, painful silence, while someone glances at the camera and we squirm along. In the spirit of Ricky Gervais.",
    [
      { curiosity: "cringe", value: 5 },
      { curiosity: "cringe", slider: "selfAware", value: "oblivious", weight: 80 },
      { curiosity: "cringe", slider: "hold", value: 5, weight: 70 },
      { curiosity: "comicFlaw", value: "neediness", weight: 70 },
      { curiosity: "jokeBombs", value: "nothing", weight: 80 },
      { curiosity: "jokeBombs", slider: "recovery", value: "explains it", weight: 70 },
      { curiosity: "comicReaction", slider: "toCamera", value: "a glance", weight: 60 },
      { curiosity: "statusGap", slider: "playing", value: "the high one plays low", weight: 60 },
      { curiosity: "silence", value: "long", weight: 60 },
      { curiosity: "humiliation", slider: "earned", value: "completely", weight: 50 },
    ], with_(["comedy-mix", "lines", "emotion"]));

  P("style-explain-joke-silence", "When a dead joke gets explained, the silence grows", "comedy",
    "Explaining why it was funny only makes the room quieter, and the quiet is where we squirm.",
    { curiosity: "jokeBombs", slider: "recovery", is: "explains it" }, { curiosity: "silence", slider: "seconds", change: "rises" }, 0, with_(["lines"]));
  P("style-needy-tries-too-hard", "When they need to be liked, they try too hard and it gets worse", "comedy",
    "Every attempt to win the room back digs the hole a little deeper.",
    { curiosity: "comicFlaw", is: "neediness" }, { curiosity: "cringe", change: "rises" }, 2);
  P("style-boss-plays-pal", "When the boss pretends to be one of the team, the room goes stiff", "comedy-mix",
    "Acting like a pal while still holding all the power leaves everyone unsure where to stand or what to say.",
    { curiosity: "statusGap", slider: "playing", is: "the high one plays low" }, { curiosity: "personalSpace", slider: "comfort", is: "uneasy" }, 1, with_(["emotion"]));
  P("style-sees-self-pity", "When the clueless one finally sees how they look, we feel for them", "emotion",
    "The moment the truth sinks in, the cringe turns into pity and the joke gets a sad edge.",
    { curiosity: "cringe", slider: "selfAware", is: "painfully aware" }, { curiosity: "empathy", change: "rises" }, 2, with_(["comedy"]));

  PS("style-squirm-boss-moves", "Squirm comedy of the clueless boss: the moves", "comedy",
    "Explain the dead joke so the silence grows, let neediness make it worse, have the boss play pal, and give them one moment of seeing themselves. In the spirit of Ricky Gervais.",
    ["style-explain-joke-silence", "style-needy-tries-too-hard", "style-boss-plays-pal", "style-sees-self-pity"], with_(["comedy-mix", "emotion"]));

  /* ---------- 10. Gag every second, played straight ---------- */

  S("style-gag-a-second", "Gag every second, played straight", "comedy",
    "A joke in every corner of every shot, actors who play it all completely seriously, phrases taken word for word, a whole cast of extras who carry on as if nothing is odd, running gags and pratfalls piled up with no time to breathe, all inside a spoof of a serious genre. In the spirit of the Zucker brothers and Jim Abrahams.",
    [
      { curiosity: "laughsPerMinute", value: 10 },
      { curiosity: "laughsPerMinute", slider: "breather", value: 0, weight: 70 },
      { curiosity: "visualGag", value: "background", weight: 80 },
      { curiosity: "visualGag", slider: "count", value: 6, weight: 70 },
      { curiosity: "comicRegister", value: "deadpan", weight: 80 },
      { curiosity: "wordplay", value: "misunderstanding", weight: 70 },
      { curiosity: "parody", slider: "target", value: "a genre", weight: 60 },
      { curiosity: "straightAnswer", value: "dead serious", weight: 60 },
      { curiosity: "runningGag", value: 6, weight: 60 },
      { curiosity: "crowdReacts", value: "carry on as normal", weight: 60 },
      { curiosity: "physicalComedy", value: "a fall", weight: 50 },
    ], with_(["background", "lines", "comedy-mix"]));

  P("style-straight-face-bigger", "When the actors play it dead straight, the laughs get bigger", "comedy",
    "Serious faces in the middle of total nonsense turn chuckles into big laughs.",
    { curiosity: "comicRegister", is: "deadpan" }, { curiosity: "laughsPerMinute", slider: "size", change: "rises" }, 1);
  P("style-literal-picture", "When a phrase is taken word for word, the picture shows it", "comedy",
    "Someone says a common phrase and the film shows exactly what the words say, right in the middle of the frame.",
    { curiosity: "wordplay", is: "misunderstanding" }, { curiosity: "visualGag", is: "center" }, 0, with_(["lines"]));
  P("style-more-gags-more-laughs", "When gags fill every corner of the frame, the laughs never stop", "comedy",
    "Jokes in the background, at the edges and in the middle mean there is always something to laugh at.",
    { curiosity: "visualGag", slider: "count", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 0, with_(["background"]));
  P("style-extras-carry-on", "When the people behind carry on as normal, the absurd looks even stranger", "background",
    "Extras going calmly about their business make the madness in front of them look twice as odd.",
    { curiosity: "crowdReacts", is: "carry on as normal" }, { curiosity: "absurdity", change: "rises" }, 1, with_(["comedy"]));
  P("style-jokes-story-thin", "When the jokes never stop, the story barely matters", "plot",
    "With a gag every few seconds, the plot becomes a clothesline to hang them on.",
    { curiosity: "laughsPerMinute", change: "rises" }, { curiosity: "plotWeight", change: "drops" }, 4, with_(["comedy"]));

  PS("style-gag-a-second-moves", "Gag every second, played straight: the moves", "comedy",
    "Keep the faces dead straight, show phrases word for word, fill every corner with gags, let the extras carry on, and let the story thin out under the jokes. In the spirit of the Zucker brothers and Jim Abrahams.",
    ["style-straight-face-bigger", "style-literal-picture", "style-more-gags-more-laughs", "style-extras-carry-on", "style-jokes-story-thin"], with_(["background", "lines"]));

  /* ---------- 11. One wild night teen comedy ---------- */

  S("style-one-wild-night", "One wild night teen comedy", "comedy-mix",
    "A careful kid and a wild friend chase one small goal across a single night with a deadline, an over-planned scheme, one problem after another, a public embarrassment, a chase, loud songs of the moment, and an honest goodbye at dawn. In the spirit of John Hughes and Greg Mottola.",
    [
      { curiosity: "timeOfDay", value: "night", weight: 70 },
      { curiosity: "tickingClock", value: "tight", weight: 60 },
      { curiosity: "comicWant", value: 4, weight: 70 },
      { curiosity: "comicWant", slider: "plan", value: "an elaborate plan", weight: 60 },
      { curiosity: "typeClash", value: "opposite types", weight: 60 },
      { curiosity: "complication", slider: "pileUp", value: 6, weight: 70 },
      { curiosity: "humiliation", value: 3, weight: 60 },
      { curiosity: "humiliation", slider: "witnesses", value: "everyone", weight: 50 },
      { curiosity: "music", value: "featured", weight: 50 },
      { curiosity: "laughsToTears", slider: "depth", value: 3, weight: 50 },
      { curiosity: "comicChase", value: 4, weight: 50 },
    ], with_(["plot", "music", "emo-road", "light"]));

  P("style-deadline-detours", "When the night has a deadline, every detour costs more", "plot",
    "Knowing the party, the curfew or the dawn is coming makes each wrong turn feel like a disaster.",
    { curiosity: "tickingClock", is: "tight" }, { curiosity: "complication", change: "rises" }, 2, with_(["comedy-mix"]));
  P("style-careful-friend-dragged", "When the careful friend is dragged along, the wild one pushes harder", "comedy-mix",
    "Each time the careful one says no, the wild one raises the stakes, and the night spins further out of control.",
    { curiosity: "typeClash", is: "opposite types" }, { curiosity: "comicEscalation", change: "rises" }, 3, with_(["comedy"]));
  P("style-embarrassment-legend", "When everyone sees the embarrassing moment, it becomes the story of the night", "herd",
    "A public disaster spreads from phone to phone and grows with every retelling.",
    { curiosity: "humiliation", slider: "witnesses", is: "everyone" }, { curiosity: "rumor", change: "rises" }, 2, with_(["comedy"]));
  P("style-dawn-honest", "When dawn comes, the friends finally say what they mean", "emo-road",
    "Worn out after the long night, the jokes stop and they admit how much the friendship matters.",
    { curiosity: "timeOfDay", is: "dawn" }, { curiosity: "subtext", is: "says what they mean" }, 2, with_(["light", "emotion"]));

  PS("style-one-wild-night-moves", "One wild night teen comedy: the moves", "comedy-mix",
    "Put a deadline on the night, drag the careful friend along, let the embarrassment become a legend, and let the truth come out at dawn. In the spirit of John Hughes and Greg Mottola.",
    ["style-deadline-detours", "style-careful-friend-dragged", "style-embarrassment-legend", "style-dawn-honest"], with_(["plot", "emo-road"]));

  /* ---------- 12. Romantic comedy of manners ---------- */

  S("style-comedy-of-manners", "Romantic comedy of manners", "comedy-mix",
    "Elegant people in fine clothes and grand rooms who say the opposite of what they want, with perfect manners and petty jealousy, while the camera stays outside a closed door or lingers on a small object and lets us imagine the rest. In the spirit of Ernst Lubitsch.",
    [
      { curiosity: "offscreen", value: 4, weight: 80 },
      { curiosity: "subtext", value: "the opposite", weight: 80 },
      { curiosity: "comedyTopic", value: "manners", weight: 80 },
      { curiosity: "mainFormality", value: "formal", weight: 60 },
      { curiosity: "setStyle", value: "1920s glamour", weight: 50 },
      { curiosity: "setStyle", slider: "wealth", value: "rich", weight: 50 },
      { curiosity: "chemistry", value: 4, weight: 70 },
      { curiosity: "chemistry", slider: "kind", value: "romantic", weight: 70 },
      { curiosity: "irony", value: "the audience knows more", weight: 70 },
      { curiosity: "egoClash", slider: "petty", value: "a bit silly", weight: 50 },
      { curiosity: "closeOnThing", value: 3, weight: 60 },
      { curiosity: "threshold", value: 4, weight: 60 },
    ], with_(["emotion", "set", "focus", "wardrobe"]));

  P("style-door-closes-imagine", "When the door closes on the couple, we imagine more than we would see", "focus",
    "Keeping the camera outside the room lets the audience fill in the rest, and what we picture is funnier and more romantic.",
    { curiosity: "threshold", change: "rises" }, { curiosity: "offscreen", change: "rises" }, 0, with_(["set"]));
  P("style-opposite-words-spark", "When polite words say the opposite of the wish, the spark grows", "comedy-mix",
    "Two people insisting they feel nothing, in the most charming way, only show how much they feel.",
    { curiosity: "subtext", is: "the opposite" }, { curiosity: "chemistry", change: "rises" }, 1, with_(["emotion"]));
  P("style-object-tells-all", "When a small object is shown up close, we know more than the people do", "camera-angle",
    "A left-behind glove or a wrong hat tells the audience the secret before anyone in the room works it out.",
    { curiosity: "closeOnThing", change: "rises" }, { curiosity: "knowledgeGap", is: "audience first" }, 1, with_(["plot"]));
  P("style-manners-jealousy", "When perfect manners are kept up, jealousy simmers underneath", "emotion",
    "Everyone stays gracious on the surface while rivalry and envy bubble just below it.",
    { curiosity: "comedyTopic", is: "manners" }, { curiosity: "jealousy", change: "rises" }, 3, with_(["comedy"]));

  PS("style-comedy-of-manners-moves", "Romantic comedy of manners: the moves", "comedy-mix",
    "Close the door and let us imagine, let polite words say the opposite, show the object that gives the secret away, and let jealousy simmer under perfect manners. In the spirit of Ernst Lubitsch.",
    ["style-door-closes-imagine", "style-opposite-words-spark", "style-object-tells-all", "style-manners-jealousy"], with_(["emotion", "focus"]));
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
