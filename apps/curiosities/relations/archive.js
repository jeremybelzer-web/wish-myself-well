/* relations/archive.js: the emotion-movement archive, plus the character traits and the people they react to.
   Sets window.CurioArchive = { emotions, movements, traits, figures }.

   - emotions:  every feeling the archive talks about. When the curiosity database already has the feeling as a
                curiosity (shame, pride, grief...), `db` names it and the map uses that curiosity itself. `scale` is
                the matching word on the database's "Emotion" curiosity, when there is one.
   - movements: what a body does, or stops doing, when it feels something. `still: true` marks a lack of
                movement (freezing, holding the breath). `emotions` are the feelings it shows, strongest first;
                `curiosities` are the film curiosities an actor or animator would set to get it.
   - traits:    who a character is ("suspicious of authority"), tied to feelings, the people it reacts to, the
                movements it shows in, and film curiosities.
   - figures:   the people (or kinds of people) a trait reacts to.
   Ids are fixed once written: emotions em-*, movements mv-*, traits tr-*, figures fig-*.
   Written 2026-10-05 for the relationship map (relations/). */
(function (root) {
  const E = (id, label, plain, extra) => Object.assign({ id, label, plain }, extra || {});
  const emotions = [
    E("em-suspicion", "Suspicion", "Not trusting someone or something, watching for the trick."),
    E("em-fear", "Fear", "Expecting to be hurt, right now.", { scale: "fearful" }),
    E("em-anxiety", "Anxiety", "A low hum of worry about what might happen.", { scale: "anxious" }),
    E("em-anger", "Anger", "Heat that wants to push back at a wrong.", { scale: "angry" }),
    E("em-joy", "Joy", "Lightness and delight; things are going right.", { scale: "joyful" }),
    E("em-sadness", "Sadness", "Heaviness after a loss or a disappointment.", { scale: "melancholy" }),
    E("em-love", "Love", "Wanting to be near someone and keep them well.", { scale: "loving" }),
    E("em-curiosity", "Curiosity", "Wanting to find out; leaning in.", { scale: "curious" }),
    E("em-surprise", "Surprise", "The jolt of something unexpected."),
    E("em-disgust", "Disgust", "Wanting to push something away or spit it out."),
    E("em-contempt", "Contempt", "Looking down on someone as beneath you."),
    E("em-embarrassment", "Embarrassment", "Feeling caught looking foolish in front of others."),
    E("em-boredom", "Boredom", "Nothing here holds the attention."),
    E("em-confidence", "Confidence", "Sure of yourself and your place."),
    E("em-defeat", "Defeat", "Giving up; the fight has gone out."),
    E("em-calm", "Calm", "At rest, nothing pressing."),
    E("em-excitement", "Excitement", "Buzzing anticipation of something good."),
    E("em-frustration", "Frustration", "Blocked again and again from what you want."),
    E("em-defiance", "Defiance", "Refusing to bow, standing your ground."),
    E("em-submission", "Submission", "Making yourself small to stay safe or keep the peace."),
    E("em-despair", "Despair", "No way out can be seen at all."),
    E("em-pride", "Pride", "Swelling with what you are or did.", { db: "pride", scale: "triumphant" }),
    E("em-shame", "Shame", "Wanting to disappear because of who you are.", { db: "shame" }),
    E("em-guilt", "Guilt", "Knowing you did wrong and carrying it.", { db: "guilt" }),
    E("em-jealousy", "Jealousy", "Afraid someone will take what is yours.", { db: "jealousy" }),
    E("em-relief", "Relief", "The weight lifting after the danger passes.", { db: "relief" }),
    E("em-awe", "Awe", "Feeling small before something vast.", { db: "awe" }),
    E("em-tenderness", "Tenderness", "Soft, careful care for someone fragile.", { db: "tenderness" }),
    E("em-grief", "Grief", "The ache of someone or something gone for good.", { db: "grief" }),
    E("em-loneliness", "Loneliness", "Wanting connection and not having it.", { db: "loneliness" }),
    E("em-resentment", "Resentment", "An old hurt kept warm.", { db: "resentment" }),
    E("em-hope", "Hope", "Believing it could still turn out well.", { db: "hope" }),
    E("em-dread", "Dread", "Knowing something bad is coming and waiting for it.", { db: "dread" }),
    E("em-longing", "Longing", "Reaching for something out of reach.", { db: "longing" }),
    E("em-empathy", "Empathy", "Feeling what someone else feels.", { db: "empathy" }),
    E("em-numbness", "Numbness", "Too much at once, so nothing gets through.", { db: "shockNumb" }),
  ];

  /* Movement groups, in the order the archive shows them. */
  const groups = ["Eyes", "Breath", "Face & mouth", "Head & neck", "Shoulders & chest", "Hands & arms", "Legs & feet", "Whole body", "Stillness", "Voice", "Space between people"];
  const M = (id, group, label, plain, emotions, curiosities, extra) => Object.assign({ id, group, label, plain, emotions, curiosities }, extra || {});
  const movements = [
    // Eyes
    M("mv-darting-eyes", "Eyes", "Quickly moving eyes", "The eyes flick from place to place, checking exits and faces.", ["em-suspicion", "em-anxiety", "em-fear"], ["emoEyes", "gazeShift"]),
    M("mv-narrowed-eyes", "Eyes", "Narrowed eyes", "The lids close partway, as if to see through someone.", ["em-suspicion", "em-anger", "em-contempt"], ["emoEyes", "faceIntensity"]),
    M("mv-wide-eyes", "Eyes", "Wide eyes", "The whites show all round; the eyes take in as much as they can.", ["em-fear", "em-surprise", "em-awe"], ["emoEyes", "faceIntensity"]),
    M("mv-averted-gaze", "Eyes", "Looking away", "The eyes drop or slide off the other person's face.", ["em-shame", "em-embarrassment", "em-guilt", "em-submission"], ["emoEyes", "gazeShift"]),
    M("mv-held-stare", "Eyes", "Holding a stare", "The eyes lock on and do not let go.", ["em-defiance", "em-anger", "em-confidence"], ["emoEyes", "faceOff"]),
    M("mv-side-glance", "Eyes", "Watching from the corner of the eye", "The head stays still while the eyes slide sideways to keep watch.", ["em-suspicion", "em-jealousy", "em-contempt"], ["emoEyes", "gazeShift"]),
    M("mv-watching-them", "Eyes", "Watching two other people together", "The eyes keep returning to someone talking with someone else.", ["em-jealousy", "em-longing", "em-loneliness"], ["emoEyes", "gazeShift", "listenerBody"]),
    M("mv-fast-blinking", "Eyes", "Fast blinking", "The eyes blink more than usual.", ["em-anxiety", "em-surprise", "em-embarrassment"], ["blink"]),
    M("mv-no-blinking", "Eyes", "Not blinking", "The eyes stay open and fixed, unblinking.", ["em-fear", "em-numbness", "em-anger"], ["blink", "stillness"], { still: true }),
    M("mv-glassy-eyes", "Eyes", "Wet, glassy eyes", "Tears gather but do not fall.", ["em-sadness", "em-grief", "em-tenderness", "em-relief"], ["emoEyes", "earnedTears"]),
    M("mv-thousand-yard", "Eyes", "Staring at nothing", "The eyes look through the room at nothing at all.", ["em-numbness", "em-despair", "em-grief"], ["emoEyes", "stillness"], { still: true }),
    M("mv-eye-roll", "Eyes", "Rolling the eyes", "The eyes swing up and round.", ["em-contempt", "em-frustration", "em-boredom"], ["emoEyes"]),
    M("mv-soft-gaze", "Eyes", "Soft, lingering gaze", "The eyes rest on someone a little too long, softly.", ["em-love", "em-longing", "em-tenderness"], ["emoEyes"]),
    M("mv-looking-at-phone", "Eyes", "Checking a phone that does not ring", "The eyes go back to a screen or a door, waiting for someone.", ["em-loneliness", "em-hope", "em-anxiety"], ["emoEyes", "propBusiness"]),
    M("mv-searching-eyes", "Eyes", "Searching eyes", "The eyes study a face or a thing closely.", ["em-curiosity", "em-suspicion", "em-hope"], ["emoEyes", "readingSigns"]),

    // Breath
    M("mv-shallow-breath", "Breath", "Shallow breathing", "Quick small breaths high in the chest.", ["em-fear", "em-anxiety", "em-suspicion"], ["breath", "bodyFeeling"]),
    M("mv-held-breath", "Breath", "Holding the breath", "The breath stops, waiting for something to pass.", ["em-fear", "em-dread", "em-hope"], ["breath", "silence"], { still: true }),
    M("mv-sigh", "Breath", "A long sigh", "A slow breath out, letting something go.", ["em-relief", "em-sadness", "em-frustration", "em-defeat"], ["breath"]),
    M("mv-deep-breath", "Breath", "Slow deep breaths", "Long even breaths into the belly.", ["em-calm", "em-confidence"], ["breath"]),
    M("mv-gasp", "Breath", "A sharp gasp", "A sudden breath in.", ["em-surprise", "em-fear", "em-awe"], ["breath"]),
    M("mv-panting", "Breath", "Panting", "Fast heavy breathing through the mouth.", ["em-excitement", "em-fear", "em-anger"], ["breath", "bodyFeeling"]),
    M("mv-steadying-breath", "Breath", "A breath to steady yourself", "One deliberate breath before speaking or acting.", ["em-anxiety", "em-defiance", "em-confidence"], ["breath", "bracing"]),

    // Face & mouth
    M("mv-tight-jaw", "Face & mouth", "Clenched jaw", "The jaw locks; the muscles at the side of the face bulge.", ["em-anger", "em-resentment", "em-frustration", "em-suspicion"], ["faceIntensity", "bodyFeeling"]),
    M("mv-pressed-lips", "Face & mouth", "Pressed lips", "The lips press into a thin line, holding words in.", ["em-anger", "em-suspicion", "em-guilt"], ["faceIntensity", "subtext"]),
    M("mv-lip-bite", "Face & mouth", "Biting the lip", "The teeth catch the lower lip.", ["em-anxiety", "em-longing", "em-embarrassment"], ["faceIntensity"]),
    M("mv-sneer", "Face & mouth", "A sneer", "One side of the upper lip lifts.", ["em-contempt", "em-disgust"], ["faceIntensity"]),
    M("mv-real-smile", "Face & mouth", "A real smile", "The mouth and the eyes smile together; the cheeks lift.", ["em-joy", "em-love", "em-relief"], ["faceIntensity"]),
    M("mv-polite-smile", "Face & mouth", "A smile that stops at the mouth", "The lips smile but the eyes do not join in.", ["em-suspicion", "em-embarrassment", "em-submission"], ["faceIntensity", "politeSurface", "bodySaysOpposite"]),
    M("mv-trembling-chin", "Face & mouth", "Trembling chin", "The chin quivers while fighting tears.", ["em-sadness", "em-grief", "em-shame"], ["faceIntensity"]),
    M("mv-flared-nostrils", "Face & mouth", "Flared nostrils", "The nostrils widen on a hard breath.", ["em-anger", "em-defiance", "em-disgust"], ["faceIntensity"]),
    M("mv-blank-face", "Face & mouth", "Blank face", "Every feeling is wiped off the face.", ["em-numbness", "em-suspicion", "em-contempt"], ["faceIntensity", "stillness", "subtext"], { still: true }),
    M("mv-blush", "Face & mouth", "Blushing", "The face and neck go red.", ["em-embarrassment", "em-shame", "em-love"], ["bodyFeeling"]),
    M("mv-brow-raise", "Face & mouth", "Raised brows", "The eyebrows lift high.", ["em-surprise", "em-curiosity", "em-contempt"], ["faceIntensity"]),
    M("mv-furrowed-brow", "Face & mouth", "Furrowed brow", "The brows pull down and together.", ["em-frustration", "em-anger", "em-curiosity", "em-anxiety"], ["faceIntensity"]),

    // Head & neck
    M("mv-head-down", "Head & neck", "Head bowed", "The chin drops toward the chest.", ["em-shame", "em-defeat", "em-sadness", "em-submission"], ["posture"]),
    M("mv-chin-up", "Head & neck", "Chin raised", "The chin lifts; the person looks down the nose.", ["em-pride", "em-defiance", "em-contempt"], ["posture"]),
    M("mv-head-tilt", "Head & neck", "Head tilted", "The head leans to one side.", ["em-curiosity", "em-empathy", "em-tenderness"], ["posture", "listenerBody"]),
    M("mv-quick-glance-back", "Head & neck", "Glancing over the shoulder", "The head snaps round to check behind.", ["em-suspicion", "em-fear", "em-dread"], ["gazeShift"]),
    M("mv-head-shake", "Head & neck", "Small head shake", "A slight no, maybe without meaning to.", ["em-frustration", "em-defiance", "em-grief"], ["gesture", "wordlessAnswer"]),
    M("mv-nod", "Head & neck", "Slow nodding", "The head nods, taking something in.", ["em-empathy", "em-calm", "em-submission"], ["listenerBody", "wordlessAnswer"]),
    M("mv-neck-tense", "Head & neck", "Stiff neck", "The neck locks; the head turns with the whole body.", ["em-suspicion", "em-anxiety", "em-fear"], ["posture", "bodyFeeling"]),

    // Shoulders & chest
    M("mv-raised-shoulders", "Shoulders & chest", "Raised, tight shoulders", "The shoulders creep up toward the ears.", ["em-fear", "em-anxiety", "em-suspicion"], ["posture", "bracing"]),
    M("mv-slumped", "Shoulders & chest", "Slumped shoulders", "The shoulders round and fall forward.", ["em-defeat", "em-sadness", "em-boredom", "em-despair"], ["posture"]),
    M("mv-chest-out", "Shoulders & chest", "Chest out", "The chest lifts and widens, taking up space.", ["em-pride", "em-confidence", "em-defiance"], ["posture"]),
    M("mv-shrug", "Shoulders & chest", "A shrug", "The shoulders lift and drop.", ["em-boredom", "em-contempt", "em-embarrassment"], ["gesture", "wordlessAnswer"]),
    M("mv-turned-shoulder", "Shoulders & chest", "Turning a shoulder", "One shoulder turns toward the other person like a shield.", ["em-suspicion", "em-resentment", "em-contempt"], ["posture", "backTurned"]),
    M("mv-sobbing", "Shoulders & chest", "Shaking shoulders", "The shoulders shake with crying or laughing.", ["em-grief", "em-joy", "em-relief"], ["bodyFeeling", "emoRelease"]),

    // Hands & arms
    M("mv-crossed-arms", "Hands & arms", "Crossed arms", "The arms fold across the chest like a wall.", ["em-suspicion", "em-defiance", "em-resentment"], ["emoHands", "posture"]),
    M("mv-fists", "Hands & arms", "Clenched fists", "The hands close tight.", ["em-anger", "em-defiance", "em-frustration"], ["emoHands"]),
    M("mv-fidgeting", "Hands & arms", "Fidgeting hands", "The fingers pick, twist and tap.", ["em-anxiety", "em-boredom", "em-guilt"], ["emoHands", "propBusiness", "keepingBusy"]),
    M("mv-hidden-hands", "Hands & arms", "Hiding the hands", "The hands go into pockets, behind the back or under the table.", ["em-suspicion", "em-guilt", "em-embarrassment"], ["emoHands"]),
    M("mv-self-touch", "Hands & arms", "Touching your own neck or face", "A hand goes to the throat, cheek or hair to calm itself.", ["em-anxiety", "em-embarrassment", "em-fear"], ["emoHands", "touch"]),
    M("mv-self-hug", "Hands & arms", "Hugging yourself", "The arms wrap round the body.", ["em-loneliness", "em-fear", "em-sadness"], ["emoHands", "comfortOffered"]),
    M("mv-possessive-touch", "Hands & arms", "A claiming hand", "A hand goes to a partner's back or waist when someone else comes near.", ["em-jealousy", "em-fear", "em-love"], ["emoHands", "touch"]),
    M("mv-gripping", "Hands & arms", "Gripping something", "The hands hold a cup, a rail or a sleeve too hard.", ["em-anxiety", "em-anger", "em-dread", "em-shame"], ["emoHands", "propBusiness"]),
    M("mv-open-palms", "Hands & arms", "Open palms", "The palms turn up or out: nothing hidden.", ["em-calm", "em-empathy", "em-submission"], ["emoHands", "gesture"]),
    M("mv-pointing", "Hands & arms", "Jabbing finger", "A finger stabs the air at someone.", ["em-anger", "em-confidence", "em-contempt"], ["emoHands", "gesture"]),
    M("mv-reaching", "Hands & arms", "Reaching out", "A hand goes toward someone, maybe stopping short.", ["em-longing", "em-love", "em-empathy", "em-hope"], ["emoHands", "touch"]),
    M("mv-big-gestures", "Hands & arms", "Big sweeping gestures", "The arms swing wide while talking.", ["em-excitement", "em-joy", "em-anger"], ["gesture"]),
    M("mv-trembling-hands", "Hands & arms", "Trembling hands", "The hands shake.", ["em-fear", "em-anxiety", "em-anger"], ["emoHands", "bodyFeeling"]),
    M("mv-hand-on-heart", "Hands & arms", "Hand on the heart", "A hand comes to rest on the chest.", ["em-tenderness", "em-grief", "em-relief", "em-love"], ["emoHands", "gesture"]),
    M("mv-gentle-touch", "Hands & arms", "Gentle touch", "A light touch on an arm, a shoulder, a cheek.", ["em-tenderness", "em-love", "em-empathy"], ["touch", "comfortOffered"]),

    // Legs & feet
    M("mv-tapping-foot", "Legs & feet", "Tapping foot", "A foot taps or a knee bounces.", ["em-anxiety", "em-boredom", "em-excitement"], ["keepingBusy"]),
    M("mv-feet-to-door", "Legs & feet", "Feet pointed at the door", "The feet turn toward the way out while the face stays.", ["em-suspicion", "em-fear", "em-boredom"], ["posture", "subtext"]),
    M("mv-planted-stance", "Legs & feet", "Feet planted wide", "The feet set wide and the weight drops.", ["em-defiance", "em-confidence", "em-anger"], ["posture", "faceOff"]),
    M("mv-stepping-back", "Legs & feet", "Stepping back", "A small step away from someone.", ["em-fear", "em-suspicion", "em-disgust"], ["personalSpace", "characterPath"]),
    M("mv-pacing", "Legs & feet", "Pacing", "Walking back and forth, going nowhere.", ["em-anxiety", "em-frustration", "em-anger"], ["pacing", "characterPath"]),
    M("mv-light-step", "Legs & feet", "Light, bouncy step", "The walk springs off the toes.", ["em-joy", "em-excitement", "em-hope"], ["characterSpeed", "moveTemper"]),
    M("mv-heavy-step", "Legs & feet", "Heavy, dragging step", "The feet barely lift.", ["em-defeat", "em-sadness", "em-despair"], ["characterSpeed", "moveTemper"]),
    M("mv-tiptoe", "Legs & feet", "Tiptoeing", "Walking quietly on the balls of the feet.", ["em-fear", "em-guilt", "em-curiosity"], ["characterSpeed"]),
    M("mv-crossed-legs-away", "Legs & feet", "Legs crossed away", "Sitting with the legs crossed away from someone.", ["em-resentment", "em-suspicion", "em-contempt"], ["posture", "standSit"]),

    // Whole body
    M("mv-constricted", "Whole body", "Constricted movement", "Every move is small and close to the body; nothing reaches out.", ["em-suspicion", "em-fear", "em-anxiety", "em-shame"], ["emoMove", "movementAmount", "gesture"]),
    M("mv-expansive", "Whole body", "Big, open movement", "The body takes up space and moves freely.", ["em-confidence", "em-joy", "em-pride"], ["emoMove", "movementAmount"]),
    M("mv-flinch", "Whole body", "Flinching", "A quick jerk away from a touch or a sound.", ["em-fear", "em-surprise", "em-suspicion"], ["emoMove", "anticipation"]),
    M("mv-leaning-in", "Whole body", "Leaning in", "The body tips toward someone or something.", ["em-curiosity", "em-love", "em-excitement", "em-empathy"], ["posture", "listenerBody"]),
    M("mv-leaning-away", "Whole body", "Leaning away", "The body tips back from someone.", ["em-suspicion", "em-disgust", "em-fear"], ["posture", "listenerBody"]),
    M("mv-shrinking", "Whole body", "Making yourself small", "The body curls in and takes up as little room as it can.", ["em-fear", "em-shame", "em-submission"], ["posture", "emoMove"]),
    M("mv-rigid", "Whole body", "Rigid body", "Everything locks; moves come out stiff and jerky.", ["em-fear", "em-anger", "em-suspicion"], ["emoMove", "bodyFeeling"]),
    M("mv-restless", "Whole body", "Restless shifting", "The weight shifts, the position changes, nothing settles.", ["em-anxiety", "em-boredom", "em-excitement"], ["postureChanges", "keepingBusy"]),
    M("mv-loose", "Whole body", "Loose and relaxed", "The joints hang easy, nothing held.", ["em-calm", "em-confidence", "em-relief"], ["emoMove", "moveTemper"]),
    M("mv-collapse", "Whole body", "Collapsing", "The legs give and the body drops into a chair or the floor.", ["em-despair", "em-grief", "em-relief"], ["emoRelease", "standSit"]),
    M("mv-turning-away", "Whole body", "Turning the back", "The whole body turns away.", ["em-shame", "em-resentment", "em-contempt", "em-grief"], ["backTurned"]),
    M("mv-mirroring", "Whole body", "Copying the other person", "The body falls into the same pose as the other person without noticing.", ["em-love", "em-empathy", "em-submission"], ["mirroring"]),
    M("mv-busy-hands-task", "Whole body", "Throwing yourself into a task", "Cleaning, sorting, cooking hard so as not to feel.", ["em-grief", "em-anxiety", "em-guilt"], ["keepingBusy", "propBusiness"]),
    M("mv-bouncing", "Whole body", "Bouncing on the spot", "The body can't keep still for happiness.", ["em-excitement", "em-joy"], ["emoMove", "movementAmount"]),

    // Stillness (a lack of movement)
    M("mv-freeze", "Stillness", "Freezing", "Everything stops mid-move, like prey that has been seen.", ["em-fear", "em-surprise", "em-dread"], ["stillness", "emoMove"], { still: true }),
    M("mv-too-still", "Stillness", "Unnaturally still", "No fidgets, no shifts; the stillness itself is a warning.", ["em-suspicion", "em-anger", "em-numbness"], ["stillness", "subtext"], { still: true }),
    M("mv-delayed-reaction", "Stillness", "Late reaction", "The news lands and nothing moves, then the feeling arrives.", ["em-numbness", "em-surprise", "em-grief"], ["stillness", "delayedReaction"], { still: true }),
    M("mv-no-gesture", "Stillness", "Hands gone quiet", "The hands that usually talk stop moving.", ["em-sadness", "em-fear", "em-guilt"], ["gesture", "stillness"], { still: true }),
    M("mv-statue-calm", "Stillness", "Calm stillness", "Easy, settled stillness with nothing to prove.", ["em-calm", "em-confidence", "em-awe"], ["stillness"], { still: true }),
    M("mv-waiting-stillness", "Stillness", "Waiting stillness", "Still and alert, ready to move the moment something happens.", ["em-dread", "em-hope", "em-suspicion"], ["stillness", "calmBeforeStorm"], { still: true }),

    // Voice
    M("mv-voice-tight", "Voice", "Tight, clipped voice", "Short words through a tight throat.", ["em-anger", "em-suspicion", "em-anxiety"], ["vocalTone", "emoVoice"]),
    M("mv-voice-cracks", "Voice", "Voice cracking", "The voice breaks on a word.", ["em-grief", "em-fear", "em-shame"], ["vocalTone", "emoVoice"]),
    M("mv-voice-quiet", "Voice", "Going quiet", "The voice drops almost to nothing.", ["em-shame", "em-sadness", "em-fear", "em-tenderness"], ["volume", "emoVoice"]),
    M("mv-voice-loud", "Voice", "Raised voice", "The voice climbs and fills the room.", ["em-anger", "em-excitement", "em-joy"], ["volume", "emoVoice"]),
    M("mv-fast-talk", "Voice", "Talking fast", "Words tumble out quickly.", ["em-anxiety", "em-excitement", "em-guilt"], ["pace", "emoVoice"]),
    M("mv-flat-voice", "Voice", "Flat voice", "No rise or fall at all.", ["em-numbness", "em-boredom", "em-despair", "em-contempt"], ["vocalTone", "emoVoice"]),
    M("mv-long-pause", "Voice", "Long pause before answering", "A silence before the answer comes.", ["em-suspicion", "em-guilt", "em-sadness"], ["silence", "dodgedQuestion"], { still: true }),
    M("mv-nervous-laugh", "Voice", "Nervous laugh", "A short laugh with nothing funny in it.", ["em-anxiety", "em-embarrassment", "em-fear"], ["emoVoice", "laughThroughGrief"]),
    M("mv-trailing-off", "Voice", "Trailing off", "The sentence fades out unfinished.", ["em-sadness", "em-guilt", "em-longing"], ["trailingOff"]),

    // Space between people
    M("mv-keeping-distance", "Space between people", "Keeping a distance", "Staying out of reach, with something between them.", ["em-suspicion", "em-fear", "em-resentment"], ["personalSpace"]),
    M("mv-closing-in", "Space between people", "Closing the gap", "Moving into the other person's space.", ["em-anger", "em-love", "em-confidence"], ["personalSpace", "characterPath"]),
    M("mv-barrier", "Space between people", "Putting something in between", "A table, a bag, a door kept between them.", ["em-suspicion", "em-fear", "em-anxiety"], ["personalSpace", "propBusiness"]),
    M("mv-back-to-wall", "Space between people", "Back to the wall", "Choosing the seat that sees the whole room and the door.", ["em-suspicion", "em-fear"], ["personalSpace"]),
    M("mv-side-by-side", "Space between people", "Side by side, not face to face", "Standing shoulder to shoulder and looking the same way.", ["em-tenderness", "em-empathy", "em-calm"], ["sideBySideTalk", "personalSpace"]),
    M("mv-edge-of-group", "Space between people", "Standing at the edge of the group", "Close enough to be with them, never quite inside the circle.", ["em-loneliness", "em-embarrassment", "em-longing"], ["personalSpace", "bystanders"]),
    M("mv-cutting-in", "Space between people", "Stepping in between", "Moving between their partner and someone else.", ["em-jealousy", "em-anger", "em-suspicion"], ["personalSpace", "characterPath"]),
  ];

  const F = (id, label, plain, curiosities) => ({ id, label, plain, curiosities: curiosities || [] });
  const figures = [
    F("fig-authority", "Authority figure", "Anyone with power over the character: boss, officer, judge, parent in charge.", ["herdLeader", "groupPressure"]),
    F("fig-police", "Police or guards", "People whose job is to watch and stop.", ["groupPressure"]),
    F("fig-parent", "Parent", "The one who raised them, or should have.", ["wound"]),
    F("fig-child", "Child", "Someone small who needs looking after.", ["caretaker"]),
    F("fig-lover", "Lover", "The one they want or have.", ["warmth"]),
    F("fig-rival", "Rival", "Someone after the same thing.", ["rivalToFriend", "foil"]),
    F("fig-mentor", "Mentor", "Someone who teaches them.", ["mentorLesson"]),
    F("fig-stranger", "Stranger", "Someone they do not know.", []),
    F("fig-crowd", "Crowd or group", "Many people at once, and what they expect.", ["herdMentality", "groupPressure", "bystanders"]),
    F("fig-outsider", "Outsider", "Someone who does not belong to the group.", ["scapegoat", "fishOutOfWater"]),
    F("fig-friend", "Friend", "Someone on their side.", ["rightHand", "comicSidekick"]),
    F("fig-villain", "Villain", "Someone set against them.", ["rightfulVillain", "opponentMove"]),
  ];

  const T = (id, label, plain, emotions, figures, movements, curiosities) => ({ id, label, plain, emotions, figures, movements, curiosities });
  const traits = [
    T("tr-suspicious-authority", "Suspicious of authority", "Assumes anyone in charge is lying or out to control them.", ["em-suspicion", "em-defiance", "em-anger", "em-fear"], ["fig-authority", "fig-police"], ["mv-constricted", "mv-darting-eyes", "mv-shallow-breath", "mv-narrowed-eyes", "mv-crossed-arms", "mv-back-to-wall", "mv-long-pause"], ["cm-control", "dissenter", "cm-openness", "expectWorst"]),
    T("tr-people-pleaser", "People-pleaser", "Needs everyone to be happy with them and hides their own wants.", ["em-anxiety", "em-submission", "em-embarrassment"], ["fig-authority", "fig-crowd", "fig-parent"], ["mv-polite-smile", "mv-nod", "mv-mirroring", "mv-shrinking", "mv-nervous-laugh"], ["cm-conflict", "copying", "politeSurface"]),
    T("tr-hothead", "Hothead", "Quick to anger; acts before thinking.", ["em-anger", "em-frustration", "em-defiance"], ["fig-rival", "fig-authority"], ["mv-fists", "mv-tight-jaw", "mv-voice-loud", "mv-closing-in", "mv-pointing", "mv-pacing"], ["cm-risk", "cm-temperament", "thinkOrLeap"]),
    T("tr-loner", "Loner", "Keeps to themselves and trusts few.", ["em-loneliness", "em-suspicion", "em-calm"], ["fig-crowd", "fig-stranger"], ["mv-keeping-distance", "mv-turning-away", "mv-averted-gaze", "mv-too-still"], ["cm-openness", "dissenter"]),
    T("tr-show-off", "Show-off", "Needs to be seen and admired.", ["em-pride", "em-excitement", "em-anxiety"], ["fig-crowd", "fig-rival", "fig-lover"], ["mv-expansive", "mv-chest-out", "mv-big-gestures", "mv-voice-loud"], ["bigEntrance", "tryingTooHard", "sceneStealer"]),
    T("tr-caretaker", "Caretaker", "Looks after others first, sometimes too much.", ["em-tenderness", "em-empathy", "em-anxiety"], ["fig-child", "fig-friend", "fig-parent"], ["mv-gentle-touch", "mv-head-tilt", "mv-leaning-in", "mv-side-by-side", "mv-busy-hands-task"], ["caretaker", "comfortOffered", "unseenCare"]),
    T("tr-perfectionist", "Perfectionist", "Nothing is ever good enough, least of all themselves.", ["em-frustration", "em-anxiety", "em-shame"], ["fig-parent", "fig-mentor", "fig-authority"], ["mv-furrowed-brow", "mv-rigid", "mv-tight-jaw", "mv-busy-hands-task"], ["allOrNothing", "cm-adaptability"]),
    T("tr-jealous-partner", "Jealous partner", "Afraid of losing the one they love to someone else.", ["em-jealousy", "em-suspicion", "em-fear", "em-anger"], ["fig-lover", "fig-rival"], ["mv-side-glance", "mv-gripping", "mv-closing-in", "mv-tight-jaw"], ["misreading", "jealousy"]),
    T("tr-grieving", "Still grieving", "Carries a loss they have not let go of.", ["em-grief", "em-sadness", "em-numbness", "em-longing"], ["fig-parent", "fig-lover", "fig-friend"], ["mv-thousand-yard", "mv-heavy-step", "mv-busy-hands-task", "mv-trailing-off", "mv-delayed-reaction"], ["grief", "emptyPlace", "keepsake", "replaying"]),
    T("tr-rebel", "Rebel", "Pushes against every rule on principle.", ["em-defiance", "em-anger", "em-excitement"], ["fig-authority", "fig-crowd", "fig-parent"], ["mv-chin-up", "mv-held-stare", "mv-planted-stance", "mv-eye-roll"], ["dissenter", "cm-control"]),
    T("tr-conformist", "Goes along with the group", "Does what everyone else does to fit in.", ["em-anxiety", "em-submission", "em-calm"], ["fig-crowd", "fig-authority"], ["mv-mirroring", "mv-nod", "mv-polite-smile"], ["herdMentality", "copying", "quietMajority"]),
    T("tr-con-artist", "Con artist", "Charming liar who is always working an angle.", ["em-confidence", "em-suspicion", "em-excitement"], ["fig-stranger", "fig-police", "fig-authority"], ["mv-polite-smile", "mv-open-palms", "mv-side-glance", "mv-mirroring"], ["cm-truth", "escalatingLie", "bodySaysOpposite"]),
    T("tr-anxious-overthinker", "Anxious overthinker", "Runs every worst case before doing anything.", ["em-anxiety", "em-dread", "em-fear"], ["fig-authority", "fig-crowd"], ["mv-fidgeting", "mv-tapping-foot", "mv-fast-talk", "mv-lip-bite", "mv-self-touch"], ["expectWorst", "replaying", "innerVoice"]),
    T("tr-stoic", "Stoic", "Shows almost nothing and endures.", ["em-calm", "em-numbness", "em-grief"], ["fig-crowd", "fig-mentor"], ["mv-statue-calm", "mv-blank-face", "mv-deep-breath", "mv-no-gesture"], ["stillness", "unspokenFeeling", "subtext"]),
    T("tr-romantic", "Hopeless romantic", "Believes love will fix everything.", ["em-longing", "em-hope", "em-love"], ["fig-lover"], ["mv-soft-gaze", "mv-reaching", "mv-hand-on-heart", "mv-light-step"], ["longing", "hope"]),
    T("tr-bully", "Bully", "Makes others small so they feel big.", ["em-contempt", "em-anger", "em-confidence"], ["fig-outsider", "fig-child", "fig-crowd"], ["mv-closing-in", "mv-pointing", "mv-sneer", "mv-chest-out"], ["humiliation", "scapegoat", "roast"]),
    T("tr-guilty-secret", "Hiding a guilty secret", "Did something they cannot let anyone find out.", ["em-guilt", "em-fear", "em-shame", "em-anxiety"], ["fig-police", "fig-friend", "fig-lover"], ["mv-averted-gaze", "mv-hidden-hands", "mv-long-pause", "mv-fast-talk", "mv-feet-to-door"], ["plotSecret", "guilt", "dodgedQuestion"]),
    T("tr-wide-eyed-newcomer", "Wide-eyed newcomer", "New in town, curious about everything.", ["em-curiosity", "em-awe", "em-excitement", "em-embarrassment"], ["fig-stranger", "fig-crowd", "fig-mentor"], ["mv-wide-eyes", "mv-searching-eyes", "mv-leaning-in", "mv-tiptoe"], ["fishOutOfWater", "awe"]),
    T("tr-bitter", "Bitter about the past", "Cannot forgive an old hurt.", ["em-resentment", "em-anger", "em-sadness"], ["fig-parent", "fig-rival", "fig-friend"], ["mv-crossed-legs-away", "mv-turned-shoulder", "mv-flat-voice", "mv-tight-jaw"], ["resentment", "wound", "lastWordFight"]),
    T("tr-protector", "Protector", "Puts themselves between the danger and the people they love.", ["em-love", "em-anger", "em-confidence", "em-fear"], ["fig-child", "fig-friend", "fig-villain"], ["mv-planted-stance", "mv-held-stare", "mv-closing-in", "mv-barrier"], ["sacrifice", "rightHand"]),
    T("tr-clown", "Class clown", "Makes a joke out of everything, especially pain.", ["em-joy", "em-embarrassment", "em-sadness"], ["fig-crowd", "fig-authority"], ["mv-big-gestures", "mv-nervous-laugh", "mv-bouncing"], ["selfMockery", "laughThroughGrief", "jokeCarrier"]),
    T("tr-control-freak", "Control freak", "Has to run everything and everyone.", ["em-anxiety", "em-anger", "em-confidence"], ["fig-friend", "fig-child", "fig-crowd"], ["mv-pointing", "mv-rigid", "mv-pacing", "mv-voice-tight"], ["cm-control", "planShown"]),
    T("tr-defeated", "Has given up", "Stopped expecting anything to get better.", ["em-defeat", "em-despair", "em-numbness"], ["fig-authority", "fig-parent"], ["mv-slumped", "mv-heavy-step", "mv-flat-voice", "mv-head-down"], ["allIsLost", "cm-agency"]),
    T("tr-optimist", "Stubborn optimist", "Sees the bright side even when there is none.", ["em-hope", "em-joy", "em-confidence"], ["fig-friend", "fig-crowd"], ["mv-real-smile", "mv-light-step", "mv-open-palms"], ["hope", "cm-worldview"]),
    T("tr-paranoid", "Paranoid", "Believes someone is always after them.", ["em-suspicion", "em-fear", "em-dread"], ["fig-stranger", "fig-police", "fig-authority"], ["mv-quick-glance-back", "mv-darting-eyes", "mv-back-to-wall", "mv-neck-tense", "mv-raised-shoulders"], ["expectWorst", "misreading", "readingSigns"]),
    T("tr-shy", "Shy", "Wants to connect but freezes around people.", ["em-embarrassment", "em-anxiety", "em-longing"], ["fig-crowd", "fig-lover", "fig-stranger"], ["mv-averted-gaze", "mv-blush", "mv-voice-quiet", "mv-shrinking", "mv-self-touch"], ["fumbledHello", "cm-openness"]),
  ];

  const api = { groups, emotions, movements, traits, figures };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CurioArchive = api;
})(typeof window !== "undefined" ? window : globalThis);
