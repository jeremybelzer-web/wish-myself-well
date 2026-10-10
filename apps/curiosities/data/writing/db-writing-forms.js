/* data/writing/db-writing-forms.js: the rest of the writing-only list in Jeremy's handoff, section 8: forms (as
   suites), persuasion, genre machinery and nonfiction, plus the sentence-and-word and sound items still missing
   (rhyme scheme, prosody, concrete or abstract words, purple or plain prose, readability). Each form is a suite of
   curiosities that already exist, so a sonnet or an AIDA ad can be switched on, graded and automated like any other
   suite. Loaded after db-writing-blocks.js. */
(function (DB) {
  const { c, n, U, W, WA, M } = DB.writingHelpers;
  const WV = ["Writing", "Visual"];

  DB.workspace({ id: "w-forms", label: "Forms", scope: "scene", plain: "The shape a piece takes: poem forms, song sections, essays, blog posts, ads, video scripts, chapters." });
  DB.workspace({ id: "w-persuasion", label: "Persuasion", scope: "scene", plain: "How the words win the reader over: trust, feeling, reasons, proof, urgency, objections, brand voice." });
  DB.workspace({ id: "w-genre", label: "Genre machinery", scope: "scene", plain: "The working parts of a genre: worldbuilding, magic rules, LitRPG system messages and level-ups, idea density, names, cozy or grim." });
  DB.workspace({ id: "w-nonfiction", label: "Nonfiction", scope: "scene", plain: "How a true piece backs itself up: sources, quotes, stories against numbers, footnotes." });
  M["w-forms"] = [2, "A form promises the reader a shape, and the plot moves inside it.", "Choosing the form is choosing what the piece can say.", "A reader who knows the form waits for its turn, its chorus, its punchline.", "plot"];
  M["w-persuasion"] = [3, "Each step of a pitch is a beat: problem, push, promise, ask.", "What a piece asks the reader to do is its theme made practical.", "A reason to act now pulls hardest.", "thought"];
  M["w-genre"] = [2, "The genre's machinery (a spell, a level-up, a new rule) is often what turns the plot.", "A world's rules are its theme in disguise.", "A new rule or a new power makes the reader lean in.", "plot"];
  M["w-nonfiction"] = [1, "A true story moves on evidence: each source is a step.", "What a piece chooses to prove is what it believes.", "A sharp fact or a human story pulls a reader through the argument.", "thought"];

  /* ---------- Sentence, word and sound items still missing ---------- */
  c("rhymeScheme", "Rhyme scheme", "w-sound", "The pattern of which line ends rhyme: couplets (AABB), alternating (ABAB), enclosed (ABBA), or none.",
    [["setting", "Pattern", ["none", "AABB couplets", "ABAB alternating", "ABBA enclosed", "ABCB ballad", "AAAA one sound", "a set form's own"], "The pattern used most.", U],
     ["strict", "Loose to strict", [0, 100], "0 = the pattern comes and goes, 100 = every line keeps it."]],
    "Keep ABAB through the verses and break into a couplet for the last two lines.", "set", { lanes: WA });
  c("prosody", "Words fitting the melody", "w-sound", "How well the words sit on the music: stressed syllables on strong beats, long vowels on long notes, the feeling of the line matching the tune.",
    [["setting", "Fighting to fitting", [0, 100], "0 = stresses land against the beat, 100 = every stress on a strong beat."],
     ["vowels", "Long vowels on long notes", [0, 100], "How often a held note gets an open, long vowel."],
     ["mood", "Words and tune agree", [0, 100], "0 = happy words on a sad tune (on purpose or not), 100 = they match."]],
    "Put the most important word of the chorus on the longest, highest note.", "set", { lanes: WA });
  c("concreteness", "Concrete or abstract words", "w-words", "Words you could touch or picture (gin, ashtray, rain) against ideas (freedom, sorrow, justice).",
    [["setting", "Concrete to abstract", [0, 100], "0 = every noun is a thing, 100 = every noun is an idea."],
     ["switch", "Abstract words earned", [0, 100], "How often an abstract word comes only after concrete ones have shown it."]],
    "Never name the feeling; give three objects that hold it.", "set");
  c("purpleProse", "Purple or plain prose", "w-words", "How ornamented the writing is: plain and lean, or heavy with adjectives, long words and stacked images.",
    [["setting", "Plain to purple", [0, 100], "0 = bare and plain, 100 = ornate and overwritten."],
     ["onPurpose", "On purpose", [0, 100], "0 = the ornament gets in the way, 100 = it is the point (comedy, a narrator's vanity)."]],
    "Write it plain, then let one sentence go purple where the character is showing off.", "set");
  c("readability", "Reading level", "w-words", "How easy the words are to read: short common words in short sentences, or long words in long ones (measured by grade level).",
    [["setting", "Easy to hard", [0, 100], "0 = a young child could read it, 100 = specialist reading."],
     ["steady", "Steady or shifting", [0, 100], "0 = the same level all through, 100 = it jumps around."]],
    "Keep the ad at an easy reading level and save one hard word for the brand name.", "set");

  /* ---------- Forms ---------- */
  c("verseForm", "Poem form", "w-forms", "The set shape of a poem: sonnet, haiku, villanelle, ballad, limerick, ghazal, free verse, prose poem.",
    [["setting", "Form", ["free verse", "sonnet", "haiku", "villanelle", "ballad", "limerick", "ghazal", "prose poem", "blank verse"], "The form used.", U],
     ["strict", "Loose to strict", [0, 100], "How closely the piece keeps the form's rules."]],
    "Write a sonnet that breaks its own rhyme scheme on the line where the speaker breaks.", "set", { lanes: WA });
  c("songSection", "Song section", "w-forms", "Which part of the song a line belongs to: intro, verse, pre-chorus, chorus, bridge, outro. A lane of these is the song's map.",
    [["setting", "Section", ["intro", "verse", "pre-chorus", "chorus", "post-chorus", "bridge", "outro"], "The section now.", U],
     ["energy", "Low to high energy", [0, 100], "How hard the section hits."],
     ["newWords", "Repeated to new words", [0, 100], "0 = the same words as before (a chorus), 100 = all new (a verse)."]],
    "Make the pre-chorus climb in short lines, then let the chorus open up.", "set", { lanes: WA });
  c("hookPlacement", "Where the hook lands", "w-forms", "Where the song's or the piece's hook (its catchiest line) comes: first line, end of the chorus, title, everywhere.",
    [["setting", "Place", ["first line", "start of the chorus", "end of the chorus", "in the title", "every section"], "Where it sits.", U],
     ["early", "How early it comes", [0, 100], "0 = in the first seconds, 100 = held back to the end."],
     ["times", "How many times", [0, 100], "How often the hook is heard."]],
    "Open on the hook, then make the listener wait a whole verse to hear it again.", "set", { lanes: WA });
  c("essayShape", "Essay shape", "w-forms", "How an essay or article is built: five paragraphs, thesis and counterargument, personal essay, listicle, how-to, question and answer.",
    [["setting", "Shape", ["five-paragraph", "thesis and counterargument", "personal essay", "listicle", "how-to steps", "question and answer", "braided"], "The shape used.", U],
     ["thesisPlace", "Where the main point comes", [0, 100], "0 = first line, 100 = the last."]],
    "Braid three threads: a memory, a fact and an argument, a paragraph each in turn.", "set");
  c("skimmable", "Headlines and subheads", "w-forms", "How a blog post or article can be skimmed: a headline that promises, subheads every few paragraphs, bold key lines, bullet lists.",
    [["setting", "Wall of text to skimmable", [0, 100], "0 = no breaks, 100 = every idea gets its own subhead or bullet."],
     ["headline", "Headline kind", ["plain label", "promise", "question", "number list", "how-to", "shock"], "What the headline does.", U],
     ["subheads", "Subheads", [0, 100], "How often a subhead breaks the text."]],
    "Make the subheads tell the whole story on their own.", "set", { lanes: WV });
  c("adFormula", "Ad formula", "w-forms", "The order an ad moves the reader through: attention, interest, desire, action (AIDA); problem, agitate, solve (PAS); before, after, bridge (BAB).",
    [["setting", "Formula", ["none", "AIDA", "problem-agitate-solve", "before-after-bridge", "features-advantages-benefits", "story then offer"], "The formula used.", U],
     ["stage", "Stage now", [0, 100], "How far through the formula this line is: 0 = the opening grab, 100 = the ask."]],
    "Agitate twice as long as you solve.", "set");
  n("callToAction", "Call to action", "w-forms", "The line that tells the reader what to do: buy, sign up, call, share, vote.",
    [["often", "How often", [0, 100], "How many times the ask is made."],
     ["strength", "Soft to hard ask", [0, 100], "0 = 'learn more', 100 = 'buy now before it's gone'."],
     ["place", "Where it comes", ["only at the end", "start and end", "throughout"], "Where the asks sit.", U]],
    "Make the soft ask early and the hard ask once, at the end.");
  c("slogan", "Slogan and tagline", "w-forms", "A short line meant to be remembered and repeated: its length, its sound play, and whether it names the brand.",
    [["setting", "Words", [0, 100], "0 = one or two words, 100 = a full sentence."],
     ["sound", "Sound play", [0, 100], "How much rhyme, alliteration or rhythm carries it."],
     ["brand", "Names the brand", [0, 100], "0 = the brand is not in it, 100 = the brand is the line."]],
    "Three words, one rhyme, no brand name.", "set", { lanes: WA });
  c("videoHook", "Video hook in the first seconds", "w-forms", "What a video script does in its first three seconds to stop the scroll: a question, a promise, a surprise, a strong picture.",
    [["setting", "Kind", ["question", "promise", "surprise", "bold claim", "strong picture", "mid-action"], "The hook used.", U],
     ["speed", "How fast it lands", [0, 100], "0 = in the first second, 100 = it takes the whole three."],
     ["payoff", "When it pays off", [0, 100], "0 = right away, 100 = at the very end."]],
    "Open mid-action and answer the question only in the last line.", "set", { lanes: ["Writing", "Audio", "Visual"] });
  c("memoirFrame", "Memoir framing", "w-forms", "How a memoir holds its past: told from now looking back, lived again as if now, or moving between the two.",
    [["setting", "Frame", ["looking back from now", "living it again", "moving between", "letters to someone"], "The frame.", U],
     ["now", "How much of now shows", [0, 100], "How often the older self steps in to comment."]],
    "Tell the childhood in present tense, then step out once a chapter as the grown-up.", "set");
  c("chapterLength", "Chapter length", "w-forms", "How long chapters run and how much that changes across the book: short punchy chapters, long immersive ones, or a pattern. (How chapters end also has a length slider for one chapter.)",
    [["setting", "Short to long", [0, 100], "0 = a page or less, 100 = very long."],
     ["change", "Steady or changing", [0, 100], "0 = all about the same, 100 = wildly different."],
     ["toward", "Shorter toward the end", [0, 100], "How much chapters shorten as the climax nears."]],
    "Halve the chapter length for the last act.", "set");

  /* ---------- Persuasion ---------- */
  const per = (id, label, plain, tryThis, more) => n(id, label, "w-persuasion", plain, more || null, tryThis);
  per("ethos", "Trust (ethos)", "Why the reader should believe the writer: experience, credentials, honesty, being like the reader.", "Admit one weakness before you make your claim.",
    [["often", "How much", [0, 100], "How much of the piece builds trust."],
     ["kind", "Kind of trust", ["experience", "credentials", "honesty", "one of us", "a famous name"], "Where the trust comes from.", U]]);
  per("pathos", "Feeling (pathos)", "Winning the reader through what they feel: hope, fear, pride, guilt, love.", "Tell one person's story before the numbers.",
    [["often", "How much", [0, 100], "How much of the piece works on feeling."],
     ["feeling", "Main feeling", ["hope", "fear", "pride", "guilt", "love", "anger", "belonging"], "The feeling used.", U]]);
  per("logos", "Reasons (logos)", "Winning the reader with reasons: facts, numbers, steps of logic, examples.", "Give three reasons, the strongest last.");
  per("socialProof", "Others already do it", "Showing that many people (or the right people) already chose this: reviews, numbers, famous users.", "Put the number of happy users in the headline.");
  per("urgency", "Urgency", "A reason to act now: a deadline, a limited supply, a cost of waiting.", "End with what waiting costs.",
    [["often", "How strong", [0, 100], "0 = no hurry, 100 = now or never."],
     ["kind", "Kind", ["deadline", "few left", "price going up", "cost of waiting", "moment in time"], "Where the hurry comes from.", U]]);
  per("objections", "The reader's objections answered", "Naming what the reader is thinking against you and answering it before they can say it.", "Say the reader's best objection out loud, then answer it.");
  c("brandVoice", "Brand voice", "w-persuasion", "The steady personality of a brand's words: warm or cool, playful or serious, plain or fancy, bold or humble.",
    [["setting", "Serious to playful", [0, 100], "How playful the voice is."],
     ["warmth", "Cool to warm", [0, 100], "How close and friendly it sounds."],
     ["bold", "Humble to bold", [0, 100], "How big its claims are."],
     ["steady", "Steady across pieces", [0, 100], "How much every piece sounds like the same brand."]],
    "Write the error message in the same voice as the homepage.", "set");

  /* ---------- Genre machinery ---------- */
  c("worldbuilding", "Worldbuilding density", "w-genre", "How much of the page is spent building the world: history, places, customs, technology, how things work.",
    [["setting", "Light to dense", [0, 100], "0 = the world is just there, 100 = every page teaches more of it."],
     ["delivery", "How it is delivered", ["in action", "in dialogue", "in description", "in documents", "in lectures"], "How the world reaches the reader.", U],
     ["strange", "Familiar to strange", [0, 100], "How far the world is from ours."]],
    "Teach the world only through what the characters argue about.", "set", { lanes: WV });
  c("magicRules", "Hard or soft magic", "w-genre", "How clear the rules of magic (or powers, or future technology) are: hard rules the reader could use to solve problems, or soft wonder no one explains.",
    [["setting", "Soft to hard", [0, 100], "0 = mysterious, no rules, 100 = exact rules and costs."],
     ["cost", "What it costs", [0, 100], "How much using it costs the user."],
     ["solves", "Solves the plot", [0, 100], "How much magic solves problems (best when the rules are hard)."]],
    "Give the magic one clear cost, and make the hero pay it at the climax.", "set");
  n("systemMessages", "System messages and stat screens", "w-genre", "LitRPG and game-lit: the boxes of game text the hero (and the reader) sees: stats, skills, quests, notifications.",
    [["often", "How often", [0, 100], "How many system messages appear."],
     ["length", "Short to full screens", [0, 100], "0 = one-line pings, 100 = full stat sheets."],
     ["voice", "System's voice", ["neutral", "dry humor", "mocking", "friendly", "menacing"], "How the system talks.", U]],
    "Give the system a dry sense of humor that only shows when the hero fails.", { lanes: WV });
  n("levelUps", "Level-ups as beats", "w-genre", "Moments the hero gains a level, skill or power, used as story beats.",
    [["often", "How often", [0, 100], "How often a level-up lands."],
     ["earned", "Earned or given", [0, 100], "0 = handed over, 100 = paid for with struggle."],
     ["size", "Small to huge", [0, 100], "How big the gain is."]],
    "Make every level-up arrive right after a loss.");
  c("ideaDensity", "Idea density", "w-genre", "How many new ideas (inventions, what-ifs, strange facts) arrive per page, the engine of sci-fi.",
    [["setting", "Few to many", [0, 100], "0 = one idea explored deeply, 100 = a new idea every page."],
     ["depth", "Shallow to deep", [0, 100], "How far each idea is followed through."]],
    "One big what-if, followed through to its third consequence.", "set");
  c("namingStyle", "Names in an invented world", "w-genre", "How invented names sound: easy and familiar, built from one language, or strange and hard to say.",
    [["setting", "Familiar to strange", [0, 100], "0 = everyday names, 100 = hard to pronounce."],
     ["system", "Random to one system", [0, 100], "How much the names follow one invented language."],
     ["count", "How many names", [0, 100], "How many invented names the reader must hold."]],
    "Give each culture its own sounds: one hard, one soft, one with no vowels at the end.", "set", { lanes: WA });
  c("cozyGrim", "Cozy or grim", "w-genre", "The genre's tone: cozy (safety, warmth, small stakes) to grim (danger, cruelty, high cost).",
    [["setting", "Cozy to grim", [0, 100], "0 = tea and kindness, 100 = mud and blood."],
     ["swings", "Steady or swinging", [0, 100], "How often the tone swings."]],
    "Keep it cozy, and let one grim chapter make the warmth matter.", "set");

  /* ---------- Nonfiction ---------- */
  const nf = (id, label, plain, tryThis, more) => n(id, label, "w-nonfiction", plain, more || null, tryThis);
  nf("sourcesPerClaim", "Sources per claim", "How well each claim is backed: named sources, links, studies, documents.", "Back every number with a named source in the same sentence.",
    [["often", "How many", [0, 100], "0 = no sources, 100 = every claim sourced, often twice."],
     ["kind", "Kind of source", ["studies", "documents", "experts", "eyewitnesses", "the writer's own experience"], "The source used most.", U]]);
  nf("quoteDensity", "Quote density", "How much of the piece is other people's words, quoted.", "Let the people speak only in their best single sentence.");
  c("anecdoteData", "Stories or numbers", "w-nonfiction", "The balance between human stories (anecdotes) and data (numbers, charts, studies).",
    [["setting", "All stories to all data", [0, 100], "0 = only stories, 100 = only numbers."],
     ["pattern", "Pattern", ["story then data", "data then story", "woven", "one then the other at the end"], "How they alternate.", U]],
    "Open on one person, widen to the number, close on the same person.", "set");
  nf("footnotes", "Footnotes and asides", "Notes outside the main text: footnotes, endnotes, sidebars, used for sources or for jokes.", "Put the funniest line in a footnote.",
    [["often", "How many", [0, 100], "How often a note appears."],
     ["job", "Their job", ["sources", "extra facts", "jokes", "a second voice"], "What the notes do.", U]]);

  /* ---------- Forms as suites (Jeremy's handoff: "Forms (suites)") ---------- */
  const tag = { source: "writing", tags: ["writing-only"] };
  const m = (curiosity, value, slider) => (slider ? { curiosity, slider, value } : { curiosity, value });
  const S = (id, label, workspace, plain, members) => DB.suite(Object.assign({ id, label, plain, workspace, members }, tag));
  const P = (id, label, workspace, plain, when, then, within, often) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within, often }, tag));
  const E = (id, label, workspace, plain, members) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, tag));

  S("w-form-sonnet", "Sonnet", "w-forms", "Fourteen lines in a steady beat, a strict rhyme scheme, and a turn near the end.",
    [m("verseForm", "sonnet"), m("meter", 85), m("rhymeScheme", "ABAB alternating"), m("rhymeScheme", 85, "strict"), m("stanza", 75, "volta")]);
  S("w-form-haiku", "Haiku", "w-forms", "Three short lines counted in syllables, one image from nature, a cut between two parts.",
    [m("verseForm", "haiku"), m("syllablesPerLine", 10), m("syllablesPerLine", 0, "steady"), m("imagery", 90), m("caesura", 70), m("rhymeScheme", "none")]);
  S("w-form-villanelle", "Villanelle", "w-forms", "Nineteen lines on two rhyme sounds, with two lines that keep coming back.",
    [m("verseForm", "villanelle"), m("refrain", 90), m("rhymeScheme", "a set form's own"), m("rhymeScheme", 90, "strict"), m("meter", 70)]);
  S("w-form-free-verse", "Free verse", "w-forms", "No set beat or rhyme; the line breaks do the work.",
    [m("verseForm", "free verse"), m("meter", 10), m("rhymeScheme", "none"), m("lineBreaks", 70), m("imagery", 70)]);
  S("w-form-song", "Verse, chorus, bridge", "w-forms", "A song's map: verses that tell, a chorus that repeats the hook, a bridge that turns.",
    [m("songSection", "chorus"), m("hookPlacement", "start of the chorus"), m("refrain", 85), m("endRhyme", 75), m("prosody", 80)]);
  S("w-form-short-story", "Short story arc", "w-forms", "One main character, one change, few scenes, an ending that turns or lands.",
    [m("psychicDistance", 40), m("chapterEnding", "quiet image"), m("sentenceRhythm", 60, "punch"), m("symbolMention", 50)]);
  S("w-form-personal-essay", "Personal essay", "w-forms", "First person, a real memory, a turn toward what it means.",
    [m("essayShape", "personal essay"), m("grammaticalPerson", "first (I)"), m("narratingSelf", 60), m("concreteness", 30)]);
  S("w-form-five-paragraph", "Five-paragraph essay", "w-forms", "Main point first, three reasons a paragraph each, then the point again.",
    [m("essayShape", "five-paragraph"), m("essayShape", 0, "thesisPlace"), m("logos", 80), m("paragraphLength", 50), m("listsOfThree", 80)]);
  S("w-form-argument", "Thesis and counterargument", "w-forms", "The claim, the best case against it, and the answer.",
    [m("essayShape", "thesis and counterargument"), m("objections", 85), m("logos", 80), m("sourcesPerClaim", 60)]);
  S("w-form-listicle", "Listicle", "w-forms", "A numbered list with a number in the headline, one short section per item.",
    [m("essayShape", "listicle"), m("skimmable", 90), m("skimmable", "number list", "headline"), m("paragraphLength", 20)]);
  S("w-form-how-to", "How-to", "w-forms", "Steps in order, commands to the reader, one action per step.",
    [m("essayShape", "how-to steps"), m("grammarMood", "command"), m("grammaticalPerson", "second (you)"), m("skimmable", 80), m("readability", 20)]);
  S("w-form-blog-post", "Blog post", "w-forms", "A headline that promises, subheads to skim, a friendly voice, an ask at the end.",
    [m("skimmable", 80), m("skimmable", "promise", "headline"), m("formality", 30), m("callToAction", 40), m("readability", 30)]);
  S("w-form-aida", "AIDA ad", "w-forms", "Grab attention, build interest, make them want it, ask them to act.",
    [m("adFormula", "AIDA"), m("pathos", 60), m("callToAction", 80), m("callToAction", 80, "strength"), m("urgency", 50)]);
  S("w-form-pas", "Problem, agitate, solve", "w-forms", "Name the pain, make it worse, then offer the fix.",
    [m("adFormula", "problem-agitate-solve"), m("pathos", 80), m("pathos", "fear", "feeling"), m("callToAction", 70)]);
  S("w-form-bab", "Before, after, bridge", "w-forms", "Life now, life with the product, and the product as the bridge between them.",
    [m("adFormula", "before-after-bridge"), m("pathos", 60), m("pathos", "hope", "feeling"), m("tense", "shifting")]);
  S("w-form-tagline", "Slogan and tagline", "w-forms", "A few words, sound play, easy to repeat.",
    [m("slogan", 10), m("slogan", 80, "sound"), m("alliteration", 60), m("readability", 10)]);
  S("w-form-video-script", "Short video script", "w-forms", "A hook in the first three seconds, short spoken lines, a payoff, an ask.",
    [m("videoHook", "question"), m("videoHook", 10, "speed"), m("sentenceLength", 15), m("grammaticalPerson", "second (you)"), m("callToAction", 50)]);
  S("w-form-memoir", "Memoir", "w-forms", "A life told from now looking back, the older self stepping in.",
    [m("memoirFrame", "looking back from now"), m("narratingSelf", 70), m("grammaticalPerson", "first (I)"), m("tense", "past")]);
  S("w-form-page-turner-chapters", "Short chapters, hard endings", "w-forms", "Short chapters that end on a hook and get shorter toward the end.",
    [m("chapterLength", 20), m("chapterLength", 70, "toward"), m("chapterEnding", "cliffhanger")]);
  S("w-persuade-classic", "Trust, feeling, reasons", "w-persuasion", "The three classic appeals together.",
    [m("ethos", 60), m("pathos", 60), m("logos", 60)]);
  S("w-litrpg", "LitRPG", "w-genre", "System messages, level-ups as beats, hard rules, a world that works like a game.",
    [m("systemMessages", 70), m("levelUps", 70), m("magicRules", 90), m("worldbuilding", 60), m("numbers", 70)]);
  S("w-hard-sf", "Hard science fiction", "w-genre", "Many ideas, followed deeply, with exact rules.",
    [m("ideaDensity", 70), m("ideaDensity", 80, "depth"), m("magicRules", 90), m("worldbuilding", 70)]);
  S("w-cozy-fantasy", "Cozy fantasy", "w-genre", "Soft magic, small stakes, warmth, easy names.",
    [m("cozyGrim", 10), m("magicRules", 20), m("namingStyle", 30), m("worldbuilding", 40)]);
  S("w-grimdark", "Grimdark", "w-genre", "Grim tone, hard costs for magic, strange names, a dense world.",
    [m("cozyGrim", 90), m("magicRules", 70, "cost"), m("namingStyle", 70), m("worldbuilding", 70)]);
  S("w-long-read", "The long read", "w-nonfiction", "Stories woven with data, well sourced, people quoted.",
    [m("anecdoteData", 50), m("anecdoteData", "woven", "pattern"), m("sourcesPerClaim", 70), m("quoteDensity", 50)]);

  const rise = (curiosity, slider) => (slider ? { curiosity, slider, change: "rises" } : { curiosity, change: "rises" });
  const drop = (curiosity, slider) => (slider ? { curiosity, slider, change: "drops" } : { curiosity, change: "drops" });
  const is = (curiosity, value, slider) => (slider ? { curiosity, slider, is: value } : { curiosity, is: value });
  P("w-chorus-hook", "When the chorus comes, the hook arrives", "w-forms", "The chorus is where the hook lives.",
    is("songSection", "chorus"), rise("refrain"), 1, 85);
  P("w-bridge-new-words", "When the bridge comes, new words and a new rhyme sound arrive", "w-forms", "The bridge breaks the pattern so the last chorus feels fresh.",
    is("songSection", "bridge"), drop("refrain"), 1, 75);
  P("w-agitate-urgency", "When the problem is agitated, urgency follows", "w-persuasion", "Once the pain is vivid, a reason to act now lands harder.",
    rise("pathos"), rise("urgency"), 2, 70);
  P("w-proof-then-ask", "When others are shown doing it, the ask comes", "w-persuasion", "Social proof sets up the call to action.",
    rise("socialProof"), rise("callToAction"), 2, 70);
  P("w-objection-trust", "When an objection is answered, trust rises", "w-persuasion", "Naming the reader's doubt makes the writer believable.",
    rise("objections"), rise("ethos"), 1, 65);
  P("w-story-then-number", "When a human story is told, the number lands after it", "w-nonfiction", "One person first makes the statistic matter.",
    drop("anecdoteData"), rise("anecdoteData"), 3, 60);
  P("w-levelup-after-loss", "When the hero loses, a level-up follows", "w-genre", "Gains feel earned when they come right after a setback.",
    drop("cozyGrim"), rise("levelUps"), 2, 60);
  P("w-hard-magic-solves", "When the magic rules are clear, magic can solve the climax", "w-genre", "Hard rules let the reader see the solution coming and still enjoy it.",
    rise("magicRules"), rise("magicRules", "solves"), 4, 70);
  P("w-turn-then-couplet", "When the poem turns, the rhyme tightens into a couplet", "w-forms", "The sonnet's turn is sealed by a closing couplet.",
    rise("stanza", "volta"), is("rhymeScheme", "AABB couplets"), 2, 60);
  P("w-hook-fast-short", "When the video hook lands fast, the lines stay short", "w-forms", "A fast hook sets a pace the script has to keep.",
    drop("videoHook", "speed"), drop("sentenceLength"), 1, 70);

  E("w-the-close", "The close", "w-persuasion", "The pain is vivid, others have already chosen it, the doubt is answered: then the ask.",
    ["w-agitate-urgency", "w-proof-then-ask", "w-objection-trust"]);
  E("w-the-last-chorus", "The last chorus", "w-forms", "The bridge breaks the pattern, the chorus returns with the hook, and the rhymes tighten.",
    ["w-bridge-new-words", "w-chorus-hook", "w-refrain-rhymes"]);
  E("w-earned-victory", "The earned victory", "w-genre", "A loss, a level-up, and clear rules that let the new power solve the climax.",
    ["w-levelup-after-loss", "w-hard-magic-solves"]);

  const near = (a, b, how, why) => ({ a, b, how, why });
  [
    near("rhymeScheme", "endRhyme", 90, "A scheme is end rhymes in a pattern."),
    near("verseForm", "rhymeScheme", 80, "Most set forms set a rhyme scheme."),
    near("verseForm", "meter", 75, "Most set forms set a beat."),
    near("prosody", "meter", 80, "Prosody is meter meeting the melody."),
    near("songSection", "refrain", 85, "The chorus carries the refrain."),
    near("hookPlacement", "refrain", 85, "The hook is usually the refrain."),
    near("concreteness", "imagery", 80, "Concrete words make images."),
    near("purpleProse", "adjectives", 80, "Purple prose is heavy with adjectives."),
    near("readability", "wordLevel", 85, "Fancy words make reading harder."),
    near("readability", "sentenceLength", 80, "Long sentences make reading harder."),
    near("skimmable", "paragraphLength", 70, "Short paragraphs are easier to skim."),
    near("adFormula", "callToAction", 85, "Every formula ends on an ask."),
    near("slogan", "alliteration", 70, "Slogans lean on sound play."),
    near("videoHook", "sentenceOpener", 65, "The hook is the opening line."),
    near("memoirFrame", "narratingSelf", 90, "The frame is how the narrating I and the experiencing I share the page."),
    near("chapterLength", "chapterEnding", 70, "Short chapters and hard endings go together."),
    near("ethos", "pathos", 60, "Two of the three classic appeals."),
    near("pathos", "logos", 60, "Feeling against reason."),
    near("ethos", "socialProof", 75, "Trust borrowed from other people."),
    near("urgency", "callToAction", 80, "Urgency pushes the ask."),
    near("brandVoice", "formality", 75, "A brand voice sets its formality."),
    near("worldbuilding", "namingStyle", 70, "Invented names are worldbuilding."),
    near("magicRules", "worldbuilding", 70, "The rules are part of the world."),
    near("systemMessages", "levelUps", 85, "Level-ups arrive as system messages."),
    near("ideaDensity", "worldbuilding", 65, "Each new idea changes the world."),
    near("sourcesPerClaim", "footnotes", 70, "Footnotes often carry the sources."),
    near("quoteDensity", "dialogueShare", 60, "Quotes are nonfiction's dialogue."),
    near("anecdoteData", "numbers", 75, "Data shows up as numbers."),
  ].forEach((p) => {
    ["a", "b"].forEach((k) => { if (!DB.get("curiosity", p[k])) throw new Error("db-writing-forms: unknown curiosity " + p[k]); });
    DB.writingProximities.push(p);
  });
})(typeof window !== "undefined" ? window.CuriosityDB : require("../curiosity-db.js"));
