/* data/db-depth-alone.js: alone with themselves, and the healers (Jeremy, 2026-10-05: "each character's relationship
   with themselves when they're alone ... the way that they self-soothe themselves and laugh at things or beat
   themselves up or the internal dialogue that they each go through, depending on how chaotic or peaceful of a
   character they are"; and "healer type characters, psychologists or just hippies or just businessmen who are
   enlightened ... help others to face the emotions that they normally run from"). The relationship with themselves
   is a relationship curiosity like the ones in db-depth-relations.js: their inner weather, how they talk to
   themselves, how they soothe themselves, whether they laugh or beat themselves up, and how much of the hurdle is
   inside them. Then the healer, and the healing they bring: staying with a feeling instead of running, picturing
   the best and the worst, learning to welcome hard feelings, deepening awareness and giving to others, and the
   healing arc that ties it together. All kept per character per scene. Loaded after db-depth-relations.js. */
(function (DB) {
  const SHARED = (push) => [
    { id: "push", label: "Pushes the story", range: { min: 0, max: 5 }, from: push, to: Math.min(5, push + 2), plain: "How much this curiosity moves the story forward here." },
    { id: "pointsAhead", label: "Points ahead", scale: ["closes a door", "holds", "hints at what's next", "demands what's next"], from: "holds", to: "demands what's next", plain: "Whether it settles something or leaves a question the next moment must answer." },
    { id: "themeLink", label: "Tied to a theme", scale: ["not at all", "loosely", "clearly", "it is the theme"], from: "loosely", to: "clearly", plain: "How closely it carries one of the film's themes here." },
  ];
  /* c(id, label, workspace, plain, sliders, momentum [push 0-5, plot, theme, pull, cue, tryThis], extra)
     sliders: [id, label, scale-or-range, plain, extra?]; the first slider is the main one. */
  function c(id, label, workspace, plain, sliders, m, extra) {
    const row = DB.curiosity(Object.assign({ id, label, plain, workspace, main: sliders[0][0], sliders: sliders.concat(SHARED(m[0])) }, extra || {}));
    if (row && !row.momentum) row.momentum = { push: m[0], plot: m[1], theme: m[2], pull: m[3], cue: m[4], tryThis: m[5] };
  }
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const U = { unordered: true };
  const PER = { per: "character per scene", also: ["archetype"] };

  /* ---------- alone with themselves ---------- */

  c("innerWeather", "Peace or chaos inside", "mindset",
    "What it is like inside this character when nobody is watching: calm and settled, or a storm of racing thoughts. It colors everything else they do alone.",
    [
      ["chaos", "Peace or chaos", [0, 100, "%"], "0 deep peace inside; 100 a storm of racing thoughts and feelings."],
      ["usual", "Their usual weather", ["peaceful", "mostly calm", "changeable", "restless", "chaotic"], "Where they usually sit when nothing special is happening."],
      ["mood", "The main feeling inside", ["calm", "worry", "sadness", "anger", "shame", "excitement", "numbness"], "The feeling that fills them right now.", U],
      ["thoughts", "How fast the thoughts run", ["still", "slow", "busy", "racing"], "How fast their mind is going."],
      ["body", "Where it sits in the body", ["nowhere", "chest", "stomach", "throat", "jaw and shoulders", "everywhere"], "Where they feel it physically.", U],
      ["shows", "Does it show outside", ["hidden completely", "a little", "plainly"], "Whether anyone looking could tell."],
    ],
    [2, "A character at peace inside meets the same problem very differently from one in chaos.", "Shows that the hardest weather is the kind inside.", "We wonder whether the storm will pass before the big moment.", "thought", "Let her sit perfectly still on the edge of the bed while the sound of the room gets louder and louder in her head."], PER);

  c("selfTalk", "How they talk to themselves", "mindset",
    "The voice inside when they're alone: kind and encouraging, plain and practical, or harsh and cruel. Some coach themselves through; some beat themselves up.",
    [
      ["tone", "Kind or cruel", ["kind", "encouraging", "plain", "critical", "harsh", "cruel"], "How the inner voice speaks to them."],
      ["amount", "How much they talk to themselves", [0, 5], "0 a quiet mind; 5 the voice never stops."],
      ["sounds", "Whose voice it sounds like", ["their own", "a parent", "a teacher", "a coach", "an ex", "a friend", "a higher power"], "Who the inner voice reminds them of.", U],
      ["says", "What it mostly says", ["you can do this", "it's fine", "you'll mess this up", "you always fail", "who do you think you are", "breathe"], "The line it repeats most.", U],
      ["believe", "Do they believe it", ["not at all", "half", "completely"], "How much the voice decides what they do."],
      ["argue", "Do they argue back", ["never", "sometimes", "always"], "Whether another part of them answers the voice."],
    ],
    [2, "What the inner voice says before the big moment decides how they walk into it.", "Shows the war, or the friendship, inside a person.", "We want them to stop listening to the cruel voice.", "thought", "Before the interview, let him whisper \"you'll blow this\" into the bathroom mirror, then straighten his tie anyway."], PER);

  c("selfSoothe", "How they soothe themselves", "mindset",
    "What the character does to calm themselves down when they're alone and upset: breathing, music, a walk, a bath, prayer, a joke, or something that only numbs it.",
    [
      ["how", "How they calm down", ["breathing", "music", "a walk", "a bath or shower", "prayer or meditation", "writing it down", "talking to a pet", "a joke", "food", "a screen", "a drink"], "Their way of soothing themselves.", U],
      ["works", "How well it works", [0, 100, "%"], "0 nothing helps; 100 they settle completely."],
      ["healthy", "Heals or just numbs", ["numbs it", "a bit of both", "truly soothes"], "Whether it helps them through the feeling or only hides it."],
      ["fast", "How fast they settle", ["never", "slowly", "after a while", "quickly"], "How long it takes them to come back to calm."],
      ["ritual", "A ritual of their own", ["none", "a habit", "a fixed ritual"], "Whether they do it the same way every time."],
      ["learned", "Where they learned it", ["nobody taught them", "a parent", "a friend", "a healer", "on their own"], "Who showed them how.", U],
    ],
    [1, "How a character calms down alone tells us how they'll hold up when it really counts.", "Shows that people have to learn to be their own comfort.", "We watch to see if they can find their way back to calm.", "movement", "When the call ends badly, let him put the kettle on, fold the tea towel twice, and breathe out slowly at the window."], PER);

  c("laughOrBeat", "Laugh it off or beat themselves up", "mindset",
    "When they make a mistake alone, do they laugh at themselves and move on, or turn on themselves? The same slip can be a comedy beat or a wound.",
    [
      ["answer", "Laugh or beat themselves up", ["laugh it off", "shrug", "sigh", "scold themselves", "beat themselves up"], "What they do right after their own mistake."],
      ["harsh", "How hard on themselves", [0, 5], "0 gentle; 5 merciless."],
      ["long", "How long it lasts", ["a second", "a while", "all day", "for years"], "How long they carry the mistake."],
      ["out", "Does it come out loud", ["silent", "a mutter", "out loud"], "Whether we hear it."],
      ["kind", "Which mistakes hurt most", ["small slips", "social mistakes", "work mistakes", "letting someone down", "their body or looks"], "The kind of mistake that gets to them.", U],
      ["growing", "Is it changing", ["getting harsher", "the same", "getting gentler", "laughing more"], "Whether they are learning to go easier on themselves."],
    ],
    [1, "A character who can laugh at their own slip can try again; one who beats themselves up may quit.", "Shows how gentleness with yourself makes room for courage.", "We hope they'll laugh this time.", "visual", "Let her drop the eggs, stare at them, then crack up laughing alone in the kitchen."], PER);

  c("aloneComfort", "Comfortable being alone", "mindset",
    "How the character feels when the room is empty: at ease in their own company, restless, lonely, or scared of what they'll feel. Some fill every silence; some love it.",
    [
      ["comfort", "At ease alone", [0, 100, "%"], "0 can't bear being alone; 100 loves their own company."],
      ["does", "What they do alone", ["nothing, just sits", "keeps busy", "fills the silence with noise", "makes something", "calls someone", "reaches for relief"], "How they spend time by themselves.", U],
      ["silence", "With silence", ["fills it at once", "puts up with it", "enjoys it"], "What they do with quiet."],
      ["mirror", "Facing themselves", ["avoids the mirror", "glances", "looks themselves in the eye"], "Whether they can look at who they are."],
      ["how-often", "How often they're alone", ["almost never", "sometimes", "often", "almost always"], "How much of their life they spend alone."],
      ["chose", "Chosen or not", ["forced on them", "half chosen", "chosen"], "Whether being alone is something they picked."],
    ],
    [1, "Who a character is alone is the truth the other scenes hide.", "Shows the relationship everyone has but nobody sees: the one with themselves.", "We see who they are when the door closes.", "visual", "Hold on him alone in the apartment for a full minute after the guests leave, before he turns the TV on."], PER);

  c("innerHurdle", "The hurdle inside them", "mindset",
    "Every goal has two hurdles: the situation, and what's inside the character. This is the inside one: how much their own chaos, fear or habits get in the way of what they're trying to do.",
    [
      ["size", "How big the inner hurdle is", [0, 5], "0 nothing inside stops them; 5 they are their own biggest obstacle."],
      ["outer", "How big the outer hurdle is", [0, 5], "How hard the situation itself is."],
      ["what", "What gets in the way", ["fear", "doubt", "shame", "anger", "old habits", "racing thoughts", "giving up too soon"], "The thing inside that trips them.", U],
      ["aware", "Do they see it", ["blind to it", "half see it", "know it well"], "Whether they know they're in their own way."],
      ["over", "Getting over it", ["not trying", "trying", "halfway", "over it"], "How far they are toward clearing it."],
      ["decides", "Which hurdle decides it", ["the situation", "both", "them"], "Whether success depends more on the world or on what's inside them."],
    ],
    [3, "The goal is won or lost on the inner hurdle as much as the outer one.", "Shows that people have to get out of their own way.", "We wonder whether they'll beat the one hurdle nobody else can see.", "plot", "Give her everything she needs to win the race, and let her stop ten meters from the line because of the voice in her head."], PER);

  /* ---------- the healer, and the healing ---------- */

  c("healerType", "The healer", "arc",
    "A character who helps others face the feelings they run from: a psychologist, a hippie, an enlightened businessman, a guru, a grandmother. How they help, how skilled they are, and how healed they are themselves.",
    [
      ["kind", "What kind of healer", ["a psychologist", "a therapist", "a hippie", "an enlightened businessman", "a guru or teacher", "a coach", "a grandparent", "a friend", "a stranger"], "Who the healer is in the world.", U],
      ["skill", "How skilled they are", [0, 100, "%"], "0 means well but fumbles; 100 a master at it."],
      ["way", "How they help", ["listening", "asking questions", "making them laugh", "picturing outcomes", "sitting with the feeling", "tough love", "teaching"], "Their way of helping.", U],
      ["healed", "How healed they are themselves", ["still wounded", "partly healed", "mostly healed", "at peace"], "Whether the healer has their own work to do."],
      ["looks", "Do they look the part", ["not at all", "a little", "completely"], "Whether people would guess they're a healer (the businessman in a suit often isn't)."],
      ["paid", "Paid or free", ["free", "a favor", "paid"], "Whether helping is their job or their nature."],
    ],
    [2, "When the healer walks in, the story turns from running to facing.", "Shows that healing often comes through another person.", "We want the lost one to let the healer in.", "thought", "Let the man in the expensive suit sit down next to the crying stranger on the bench and simply ask, \"What does it feel like right now?\""], PER);

  c("facingFeelings", "Facing feelings instead of running", "arc",
    "When a hard feeling comes, does the character run from it (and make a terrible choice while running) or stay with it and feel it through?",
    [
      ["stay", "Run or stay", ["runs at once", "runs", "wavers", "stays", "stays and feels it all"], "What they do when the feeling arrives."],
      ["feeling", "Which feeling", ["fear", "grief", "shame", "anger", "loneliness", "jealousy", "heartbreak"], "The feeling they usually run from.", U],
      ["running", "What running looks like", ["a drink", "pills", "a fight", "leaving", "working", "a screen", "a bad decision"], "What they do instead of feeling it.", U],
      ["cost", "What running costs", [0, 5], "How much damage the running does."],
      ["helped", "Help to stay", ["alone", "a healer is near", "a friend is near"], "Whether someone is helping them stay."],
      ["through", "Through the feeling", [0, 100, "%"], "How far they've felt it through: 0 not started; 100 out the other side."],
    ],
    [3, "Running from a feeling is how characters make the choices that wreck them.", "Shows that the way out is through.", "We beg them not to run this time.", "thought", "His hand is on the car keys; the healer says \"stay for one more minute,\" and he puts them back on the table."], PER);

  c("picturingOutcomes", "Picturing the best and the worst", "arc",
    "The character pictures what could happen, the bright version and the terrible one, and feels both. A healer may walk them through it so the fear loses its grip.",
    [
      ["way", "Which way they picture", ["only the worst", "mostly the worst", "both", "mostly the best", "only the best"], "Which outcomes fill their mind."],
      ["vivid", "How vivid", [0, 5], "0 a vague thought; 5 they see it like a film."],
      ["guided", "Guided or alone", ["alone", "a healer guides it", "a friend talks it through"], "Whether someone walks them through it."],
      ["feel", "Do they let themselves feel it", ["push it away", "a little", "feel it fully"], "Whether they feel the pictures or just think them."],
      ["after", "What it leaves", ["more afraid", "the same", "calmer", "ready"], "How they come out of it."],
      ["shown", "How we show it", ["only in their face", "we hear it", "we see it as a vision"], "How the film lets us into the pictures.", U],
    ],
    [2, "Seeing the worst and surviving it in the mind frees a character to act.", "Shows imagination as a way to heal, not just to worry.", "We see both futures and wonder which will come.", "visual", "Cut from her eyes closing to the worst version of the wedding, then the best, then back to her face, softer."], PER);

  c("welcomingFeelings", "Welcoming hard feelings", "arc",
    "How the character greets a painful feeling when it comes: dread, then putting up with it, then curiosity, and at the deepest, excitement and even love, because they know what freedom is on the other side.",
    [
      ["welcome", "How they greet hard feelings", ["dread", "put up with them", "curious", "glad", "excited, even loving it"], "Their first reaction when a hard feeling arrives."],
      ["trust", "Trust there's freedom on the other side", [0, 100, "%"], "0 sure it will swallow them; 100 sure there's freedom past it."],
      ["practice", "How practiced", ["first time", "a few times", "often", "a way of life"], "How many times they've done this."],
      ["breath", "What their body does", ["tightens", "holds the breath", "breathes", "opens"], "How the body meets the feeling."],
      ["words", "What they say to it", ["go away", "not now", "okay, come in", "welcome, I've been waiting"], "What they say to the feeling, aloud or inside.", U],
      ["after", "What waits on the other side", ["relief", "lightness", "freedom", "love for others"], "What they find once they're through.", U],
    ],
    [2, "A character who learns to welcome the pain stops being ruled by it.", "Shows that the feelings we run from are the doors to freedom.", "We watch the dread on their face turn into something like a smile.", "thought", "When the panic rises on the subway, let him close his eyes, smile, and whisper \"there you are.\""], PER);

  c("awakening", "Depth of awareness", "arc",
    "How awake the character is to themselves and to life: lost in their stories, beginning to notice, aware, awake, or at the deepest levels of liberation, where what's left is the capacity to give.",
    [
      ["depth", "How deep their awareness is", ["lost in it", "noticing", "aware", "awake", "liberated"], "How deeply they see themselves and life."],
      ["give", "Capacity to give to others", [0, 100, "%"], "0 nothing left to give; 100 they give freely and without needing anything back."],
      ["meaning", "Sense of what life means", ["none", "searching", "glimpses", "clear"], "Whether they've found what life is for, for them."],
      ["steady", "How steady it is", ["comes and goes", "mostly there", "steady"], "Whether the awareness stays or slips away under pressure."],
      ["moment", "A moment of seeing", ["none", "a flicker", "a breakthrough"], "Whether something opens up in this scene."],
      ["shows", "How it shows", ["stillness", "laughter", "tears", "kindness", "a new choice"], "How we can tell they've grown.", U],
    ],
    [2, "Each step deeper changes what the character wants, and what they can give.", "Shows the true meaning of life as something you wake into.", "We hope they'll see what we can see.", "visual", "After the breakthrough, let her give her coat to the woman at the bus stop without a word, and keep walking lighter."], PER);

  c("healingArc", "The healing arc", "arc",
    "Where the character is on the road from running to freedom: running, meeting a healer, resisting, facing it, feeling it through, coming out free, and finally helping others the same way.",
    [
      ["stage", "Where they are", ["running", "meets a healer", "resisting", "facing it", "feeling it through", "free on the other side", "helping others"], "The stage of the healing arc in this scene."],
      ["pace", "How fast it moves", ["stuck", "slowly", "steadily", "fast"], "How quickly they move through the stages."],
      ["setback", "A step back", ["none", "a slip", "a fall"], "Whether they slide back toward running here."],
      ["who", "Who helps most", ["a healer", "a friend", "a stranger", "a loss", "themselves"], "What or who moves them along.", U],
      ["inner", "How their inside changes", [0, 100, "%"], "0 still in chaos; 100 at peace."],
      ["shared", "Do they pass it on", ["not yet", "a little", "they help others now"], "Whether their healing reaches anyone else."],
    ],
    [3, "The healing arc gives a story its shape: running, facing, freedom, giving.", "Shows that healing turns the healed into healers.", "We wait for the moment they stop running.", "plot", "End the film with the one who stole the pills sitting quietly beside a scared kid, saying the same words the healer once said to her."], PER);

  /* ---------- suites: whole characters ---------- */

  S("the-inner-storm", "The inner storm", "mindset",
    "Chaos inside, a cruel voice, beating themselves up over every slip, can't bear being alone, and their own biggest obstacle.",
    [
      { curiosity: "innerWeather", value: 85 },
      { curiosity: "selfTalk", value: "harsh" },
      { curiosity: "laughOrBeat", value: "beat themselves up" },
      { curiosity: "aloneComfort", value: 15 },
      { curiosity: "innerHurdle", value: 5 },
    ]);
  S("at-home-in-themselves", "At home in themselves", "mindset",
    "Peaceful inside, a kind voice, laughs off their mistakes, loves their own company, and soothes themselves in a way that truly helps.",
    [
      { curiosity: "innerWeather", value: 10 },
      { curiosity: "selfTalk", value: "kind" },
      { curiosity: "laughOrBeat", value: "laugh it off" },
      { curiosity: "aloneComfort", value: 90 },
      { curiosity: "selfSoothe", slider: "healthy", value: "truly soothes" },
    ]);
  S("the-numbing-loner", "The numbing loner", "mindset",
    "Alone and uneasy, filling silence with noise, soothing with a drink or a screen that only numbs, and running from feelings.",
    [
      { curiosity: "aloneComfort", slider: "silence", value: "fills it at once" },
      { curiosity: "selfSoothe", value: "a drink" },
      { curiosity: "selfSoothe", slider: "healthy", value: "numbs it" },
      { curiosity: "facingFeelings", value: "runs" },
    ]);
  S("the-psychologist", "The psychologist", "arc",
    "A trained healer who listens and asks questions, partly healed themselves, and paid for it.",
    [
      { curiosity: "healerType", value: "a psychologist" },
      { curiosity: "healerType", slider: "way", value: "asking questions" },
      { curiosity: "healerType", slider: "healed", value: "partly healed" },
      { curiosity: "healerType", slider: "paid", value: "paid" },
    ]);
  S("the-hippie-healer", "The hippie healer", "arc",
    "A free spirit who sits with the feeling, makes them laugh, looks the part, and never asks for anything.",
    [
      { curiosity: "healerType", value: "a hippie" },
      { curiosity: "healerType", slider: "way", value: "sitting with the feeling" },
      { curiosity: "healerType", slider: "looks", value: "completely" },
      { curiosity: "healerType", slider: "paid", value: "free" },
    ]);
  S("the-enlightened-businessman", "The enlightened businessman", "arc",
    "A man in a suit nobody would take for a healer, at peace inside, who walks people through the best and the worst outcomes.",
    [
      { curiosity: "healerType", value: "an enlightened businessman" },
      { curiosity: "healerType", slider: "way", value: "picturing outcomes" },
      { curiosity: "healerType", slider: "healed", value: "at peace" },
      { curiosity: "healerType", slider: "looks", value: "not at all" },
      { curiosity: "awakening", value: "awake" },
    ]);
  S("loving-the-storm", "Loving the storm", "arc",
    "Staying with the feeling, welcoming it with excitement, trusting the freedom on the other side, and giving freely to others.",
    [
      { curiosity: "facingFeelings", value: "stays and feels it all" },
      { curiosity: "welcomingFeelings", value: "excited, even loving it" },
      { curiosity: "welcomingFeelings", slider: "trust", value: 90 },
      { curiosity: "awakening", slider: "give", value: 90 },
    ]);

  /* ---------- relationship-with-self proximities ---------- */

  P("chaos-cruel-voice", "When the chaos inside rises, the inner voice turns cruel", "mindset",
    "When the chaos inside rises, the way they talk to themselves turns harsher within a beat.",
    { curiosity: "innerWeather", change: "rises" }, { curiosity: "selfTalk", change: "rises" }, 1);
  P("cruel-voice-beat-up", "When the inner voice is cruel, they beat themselves up", "mindset",
    "When the inner voice turns harsh, how hard they are on themselves after a slip rises within 2 beats.",
    { curiosity: "selfTalk", is: "harsh" }, { curiosity: "laughOrBeat", slider: "harsh", change: "rises" }, 2);
  P("laugh-settles", "When they laugh at themselves, the storm settles", "mindset",
    "When they laugh off their own mistake, the chaos inside drops within 2 beats.",
    { curiosity: "laughOrBeat", is: "laugh it off" }, { curiosity: "innerWeather", change: "drops" }, 2, { also: ["comedy"] });
  P("soothe-calms", "When the soothing works, they come back to calm", "mindset",
    "When the way they soothe themselves works better, the chaos inside drops within 2 beats.",
    { curiosity: "selfSoothe", slider: "works", change: "rises" }, { curiosity: "innerWeather", change: "drops" }, 2);
  P("alone-numb", "When they can't bear being alone, they reach for relief", "mindset",
    "When comfort being alone drops, the urge for relief rises within 2 beats.",
    { curiosity: "aloneComfort", change: "drops" }, { curiosity: "reliefSeeking", change: "rises" }, 2);
  P("chaos-hurdle", "When the chaos inside rises, the inner hurdle grows", "mindset",
    "When the chaos inside rises, the hurdle inside them grows within 2 beats.",
    { curiosity: "innerWeather", change: "rises" }, { curiosity: "innerHurdle", change: "rises" }, 2, { also: ["plot"] });
  P("hurdle-cleared-thrive", "When the inner hurdle is cleared, life starts climbing", "mindset",
    "When the inner hurdle shrinks, how well they're doing rises within 3 beats.",
    { curiosity: "innerHurdle", change: "drops" }, { curiosity: "thriving", change: "rises" }, 3);

  /* ---------- healing proximities ----------
     Jeremy, 2026-10-05: "that can be hardwired into the app. That those are facts." The healing truths are facts
     (F): they always hold, at 100%, and CuriosityDB.facts() lists them. Freedom waits on the other side of a hard
     feeling; running from it costs; welcoming it deepens awareness; awareness grows the capacity to give. */
  const F = (extra) => Object.assign({ fact: true, tags: ["fact"] }, extra || {});

  P("healer-near-stay", "When a healer is near, they stay with the feeling", "arc",
    "When a healer comes into the scene, staying with the feeling instead of running rises within 2 beats.",
    { curiosity: "healerType", slider: "skill", change: "rises" }, { curiosity: "facingFeelings", change: "rises" }, 2);
  P("run-bad-choice", "When they run from a feeling, the cost climbs", "arc",
    "When they run from a feeling, what the running costs rises within 2 beats.",
    { curiosity: "facingFeelings", is: "runs at once" }, { curiosity: "facingFeelings", slider: "cost", change: "rises" }, 2, F({ also: ["plot"] }));
  P("picture-both-calmer", "When they picture both outcomes, the fear loosens", "arc",
    "When they picture both the best and the worst, the chaos inside drops within 2 beats.",
    { curiosity: "picturingOutcomes", is: "both" }, { curiosity: "innerWeather", change: "drops" }, 2);
  P("facing-welcome", "When they stay with the feeling, they start to welcome it", "arc",
    "When they stay with a feeling longer, how they greet hard feelings warms within 3 beats.",
    { curiosity: "facingFeelings", change: "rises" }, { curiosity: "welcomingFeelings", change: "rises" }, 3, F());
  P("welcome-awake", "When they welcome hard feelings, awareness deepens", "arc",
    "When they welcome hard feelings more, their awareness deepens within 3 beats.",
    { curiosity: "welcomingFeelings", change: "rises" }, { curiosity: "awakening", change: "rises" }, 3, F());
  P("awake-give", "When awareness deepens, they give more", "arc",
    "When their awareness deepens, their capacity to give to others rises within 2 beats.",
    { curiosity: "awakening", change: "rises" }, { curiosity: "awakening", slider: "give", change: "rises" }, 2, F());
  P("healing-kind-voice", "When the healing moves forward, the inner voice softens", "arc",
    "When the healing arc moves forward, the way they talk to themselves turns kinder within 3 beats.",
    { curiosity: "healingArc", change: "rises" }, { curiosity: "selfTalk", change: "drops" }, 3, { also: ["mindset"] });
  P("healed-becomes-healer", "When they're free, they become the healer", "arc",
    "When they reach the end of the healing arc, they start helping others within 4 beats.",
    { curiosity: "healingArc", is: "free on the other side" }, { curiosity: "healingArc", slider: "shared", change: "rises" }, 4, F());
  P("facing-shame-cope", "When they face the feeling, the way they cope with shame changes", "arc",
    "When they stay with a feeling, coping with shame moves toward facing it within 3 beats.",
    { curiosity: "facingFeelings", is: "stays and feels it all" }, { curiosity: "copingStyle", is: "face it" }, 3, F());

  P("through-to-freedom", "When they feel a hard feeling all the way through, freedom is on the other side", "arc",
    "A fact of the app: when they stay with a hard feeling until they're through it, the healing arc reaches free on the other side within 3 beats.",
    { curiosity: "facingFeelings", slider: "through", change: "rises" }, { curiosity: "healingArc", is: "free on the other side" }, 3, F());
  P("through-to-peace", "When they feel a hard feeling all the way through, the storm inside settles", "arc",
    "A fact of the app: when they feel a hard feeling through, the chaos inside drops within 2 beats.",
    { curiosity: "facingFeelings", slider: "through", change: "rises" }, { curiosity: "innerWeather", change: "drops" }, 2, F({ also: ["mindset"] }));
  P("through-to-awareness", "When they feel a hard feeling all the way through, awareness deepens", "arc",
    "A fact of the app: each hard feeling felt all the way through deepens their awareness within 3 beats.",
    { curiosity: "facingFeelings", slider: "through", change: "rises" }, { curiosity: "awakening", change: "rises" }, 3, F());

  /* ---------- proximity suites ---------- */

  PS("the-spiral-alone", "The spiral alone", "mindset",
    "Alone and uneasy, the chaos rises, the voice turns cruel, they beat themselves up, reach for relief, and the inner hurdle grows.",
    ["alone-numb", "chaos-cruel-voice", "cruel-voice-beat-up", "chaos-hurdle"]);
  PS("finding-calm", "Finding calm", "mindset",
    "They laugh at the slip, the soothing works, the storm settles, the inner hurdle shrinks, and life climbs.",
    ["laugh-settles", "soothe-calms", "hurdle-cleared-thrive"]);
  PS("the-other-side", "The other side", "arc",
    "The facts of healing, always on: feel a hard feeling through and the storm settles, awareness deepens, freedom is on the other side, and the freed give to others. Run from it and the cost climbs.",
    ["through-to-peace", "through-to-awareness", "through-to-freedom", "facing-welcome", "welcome-awake", "awake-give", "healed-becomes-healer", "run-bad-choice"]);
  PS("the-healing-road", "The healing road", "arc",
    "A healer comes near, they stay with the feeling instead of running, picture the best and the worst, learn to welcome the hard feelings, wake up, give more, and become a healer themselves.",
    ["healer-near-stay", "picture-both-calmer", "through-to-peace", "through-to-freedom", "through-to-awareness", "facing-welcome", "welcome-awake", "awake-give", "healing-kind-voice", "healed-becomes-healer"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
