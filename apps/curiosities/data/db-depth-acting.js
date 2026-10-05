/* data/db-depth-acting.js: acting and the camera, deeper. 6 lines curiosities (cut off mid-sentence, a line thrown
   away, a speech that builds, trailing off, talking to themselves, one side of a phone call), 4 movement-with-lines
   curiosities (saying it with their back turned, a habit of their own, copying each other's body, answering
   without words), 5 character-motion curiosities (pacing, making an entrance, walking out, squaring off, standing
   up and sitting down) and 5 camera-motion curiosities (a slow push in on a face, the camera circling them, turning
   to reveal, the camera wandering off, the stretching background shot), each with its own graded sliders and a
   momentum note, tied into suites, proximities and proximity suites. Loaded after db-depth-sound.js. Written
   2026-10-03 by the depth thread (acting). */
(function (DB) {
  const SHARED = (push) => [
    { id: "push", label: "Pushes the story", range: { min: 0, max: 5 }, from: push, to: Math.min(5, push + 2), plain: "How much this curiosity moves the story forward here." },
    { id: "pointsAhead", label: "Points ahead", scale: ["closes a door", "holds", "hints at what's next", "demands what's next"], from: "holds", to: "demands what's next", plain: "Whether it settles something or leaves a question the next moment must answer." },
    { id: "themeLink", label: "Tied to a theme", scale: ["not at all", "loosely", "clearly", "it is the theme"], from: "loosely", to: "clearly", plain: "How closely it carries one of the film's themes here." },
  ];
  /* c(id, label, workspace, plain, sliders, momentum [push 0-5, plot, theme, pull, cue, tryThis], extra)
     sliders: [id, label, scale-or-range, plain, extra?]; the first slider is the main one.
     scale = ["low", ..., "high"] in order; range = [min, max] or [min, max, "unit"] or [min, max, "unit", step]. */
  function c(id, label, workspace, plain, sliders, m, extra) {
    const row = DB.curiosity(Object.assign({ id, label, plain, workspace, main: sliders[0][0], sliders: sliders.concat(SHARED(m[0])) }, extra || {}));
    if (row && !row.momentum) row.momentum = { push: m[0], plot: m[1], theme: m[2], pull: m[3], cue: m[4], tryThis: m[5] };
  }
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const U = { unordered: true };

  /* ---------- lines and delivery ---------- */

  c("cutOff", "Cut off mid-sentence", "lines",
    "Someone starts a line and never gets to finish it: another person talks over them, a noise drowns it out, or something happens. What they were about to say hangs in the air.",
    [
      ["howLate", "Where the line gets cut", ["on the first word", "partway", "near the end", "just before the key word"], "How far into the line they get before it is cut. Just before the key word leaves the biggest question."],
      ["cutBy", "What cuts them off", ["another person", "a loud noise", "something happening", "a phone or a knock"], "What stops the line.", U],
      ["overlapSec", "Voices on top of each other", [0, 3, "seconds", 0.5], "How many seconds both voices talk at once before one gives way."],
      ["count", "Times it happens in the scene", [1, 10], "How many lines get cut off. Many cuts make a scene feel crowded or tense."],
      ["rude", "How rude it feels", ["urgent, not rude", "impatient", "rude", "crushing"], "Whether the cut feels needed or like a put-down."],
      ["finished", "Does the line ever get finished", ["never", "the other person guesses it", "later in the scene", "much later in the film"], "Whether we ever hear the end of what they meant to say.", U],
    ],
    [3, "A line cut off before the key word leaves a question the plot has to answer later.", "Shows who gets to speak in this world and who never gets heard.", "We lean in to learn what they were going to say.", "audio", "Cut her off one word before the name, and do not let anyone say the name until the last scene."]);

  c("throwaway", "A line thrown away", "lines",
    "An important line said lightly, almost in passing, as if it does not matter. Actors call it throwing the line away. It often hits harder than shouting it would.",
    [
      ["lightness", "How lightly it is said", [0, 5], "0 is said with full weight, 5 is tossed off as if it were nothing."],
      ["weight", "How much the line really matters", ["small", "matters", "big", "changes everything"], "How big the news inside the line is."],
      ["busy", "What they are doing while saying it", ["nothing", "eating", "leaving", "working on something", "looking at a phone"], "The task that lets them avoid making it a big moment.", U],
      ["eyes", "Where they look", ["at the other person", "away", "at what they are doing", "at nothing"], "Where their eyes are when the line goes out.", U],
      ["heard", "Does the other person catch it", ["missed", "half caught", "caught a beat late", "caught at once"], "Whether the listener hears what was really said."],
      ["beatAfter", "Silence after it", [0, 6, "seconds"], "Seconds of quiet before anyone reacts."],
    ],
    [3, "Drops a big fact into the plot quietly, so it explodes later.", "Shows a character who cannot face what they are saying head on.", "We replay the line in our heads, wondering if we heard it right.", "audio", "Have him mention he is moving away while drying the dishes, without looking up."]);

  c("buildingSpeech", "A speech that builds", "lines",
    "One character talks for a long stretch and the speech grows: calm at the start, bigger and faster toward one peak line. Think of a closing argument in court, or a coach before the big game.",
    [
      ["build", "How much it builds", [0, 5], "0 stays level the whole way, 5 starts quiet and ends at full force."],
      ["length", "How long it runs", [20, 300, "seconds", 10], "Seconds from the first word to the last."],
      ["peak", "Where the peak line lands", ["early", "middle", "near the end", "the very last word"], "When the biggest line of the speech comes."],
      ["shape", "How it grows", ["a steady climb", "in waves", "slow, then a rush", "quiet, then one burst"], "The path from calm to the peak.", U],
      ["listeners", "Who is listening", ["one person", "a small group", "a room", "a crowd"], "How many people the speech is aimed at."],
      ["reaction", "How it lands", ["falls flat", "silence", "one person reacts", "the room erupts"], "What the listeners do when it ends."],
    ],
    [4, "A speech that builds usually turns the scene: someone is won over, or a plan is set going.", "Puts the film's argument into one character's mouth.", "We ride the rise and wait to see if it wins them over.", "audio", "Start the speech almost whispered, add one beat of speed every paragraph, and end on a single word."]);

  c("trailingOff", "Trailing off", "lines",
    "A character starts a sentence and lets it fade away unfinished, because they cannot say it, do not need to, or lose their nerve. The silence finishes the sentence for them.",
    [
      ["unsaid", "How much is left unsaid", ["just the last word", "the end of the line", "most of the line", "almost all of it"], "How early the sentence gives out."],
      ["why", "Why they stop", ["can't bear to say it", "no need, we know", "lost their nerve", "distracted", "lost in a memory"], "What makes the words fade.", U],
      ["fadeVoice", "How the voice fades", ["drops off a cliff", "fades quickly", "fades slowly"], "Whether the voice stops at once or dwindles away."],
      ["filler", "What fills the gap", ["nothing", "a look", "a gesture", "a sigh", "the other person finishes it"], "What takes the place of the missing words.", U],
      ["times", "Times in the scene", [1, 8], "How many sentences trail off. One is a moment; many is a person who cannot finish a thought."],
    ],
    [2, "Hints at something a character cannot say yet, which the plot will have to bring out.", "Shows what is too painful, or too obvious, to put into words.", "We finish the sentence in our own heads and want to know if we are right.", "audio", "Let her say 'If he had just...' and stop, then cut to the empty chair."]);

  c("talkingToSelf", "Talking to themselves", "lines",
    "A character mutters, argues or gives themselves a pep talk when they think nobody is listening. It lets us hear their thoughts without a voice-over (a narrator's voice laid over the picture).",
    [
      ["loudness", "How loud", ["lips moving", "muttering", "talking out loud", "shouting at themselves"], "How much of the inside talk comes out."],
      ["kind", "What kind of talk", ["a pep talk", "scolding themselves", "rehearsing a line", "working out a problem", "talking to someone gone"], "What they are saying to themselves.", U],
      ["alone", "Do they think they are alone", ["they know others hear", "they forget others are there", "they think they are alone", "they are truly alone"], "How private they believe the moment is."],
      ["caught", "Do they get caught", ["no", "almost", "caught, embarrassed", "caught, and it starts a talk"], "Whether someone walks in on it.", U],
      ["toWhat", "What they talk to", ["no one", "a mirror", "an object", "an animal", "a photo"], "Where the words are aimed.", U],
      ["seconds", "Seconds of talk", [2, 60, "seconds"], "How long the private talk goes on."],
    ],
    [2, "Lets us hear a plan or a fear the character would never say to anyone else.", "Shows the gap between who they are in private and in public.", "We know their secret now and wait to see if it gets out.", "thought", "Have him rehearse the proposal to the bathroom mirror, then cut to him saying it all wrong."]);

  c("oneSidedCall", "One side of a phone call", "lines",
    "We hear only one person on the phone. Their pauses and replies let us guess what the other side is saying, and we fill in the rest ourselves.",
    [
      ["hidden", "How much of the other side we hear", ["both sides clearly", "a faint voice", "nothing at all"], "Whether we hear the caller or only the person in the room."],
      ["news", "What kind of news", ["small talk", "good news", "bad news", "a threat", "a secret"], "What the call is really about.", U],
      ["pauses", "Length of the listening pauses", [0, 10, "seconds"], "Seconds they listen in silence between their own lines."],
      ["faceShows", "How much the face gives away", [0, 5], "0 is a blank face, 5 is every word of the news written on it."],
      ["others", "Others in the room watching", [0, 6], "How many people are trying to work out the call from this side, like us."],
      ["ending", "How it ends", ["a normal goodbye", "they hang up", "the other side hangs up", "the line goes dead", "still talking as we cut"], "How the call stops.", U],
    ],
    [3, "News arrives from outside the scene and changes the plot while we watch one face.", "Shows how a person takes news when they think only the caller is listening.", "We guess what the other side said and wait to find out.", "audio", "Play the whole call on her face. Never let us hear the other voice, and let the line go dead."]);

  /* ---------- movement with lines ---------- */

  c("backTurned", "Saying it with their back turned", "movement-lines",
    "A character turns away from the person they are talking to, so the line goes to a wall or a window. It hides the face and shows they cannot, or will not, look at them.",
    [
      ["turnedAway", "How far they turn away", [0, 180, "degrees", 15], "0 is face to face, 90 is side on, 180 is their back fully to the other person."],
      ["when", "When they turn", ["before the line", "on the line", "after the line"], "Whether they turn first and then speak, or speak and then turn."],
      ["why", "Why they turn", ["shame", "anger", "hiding tears", "dismissing them", "thinking"], "What the turn is hiding or saying.", U],
      ["faceSeen", "Who sees the face", ["no one", "the other person", "only us"], "Whether the camera shows us the face the other character cannot see.", U],
      ["turnBack", "Do they turn back", ["never", "for the last word", "after a long beat", "right away"], "Whether they face the other person again.", U],
      ["hold", "Seconds held turned away", [0, 20, "seconds"], "How long the back stays turned."],
    ],
    [2, "The turn often marks the moment a talk becomes a break between two people.", "Shows what a character cannot face, in someone else or in themselves.", "We want to see the face they are hiding.", "movement", "Let him say 'I'm fine' to the window, and show us his face that she cannot see."]);

  c("ownHabit", "A habit of their own", "movement-lines",
    "A small habit that belongs to one character: pushing up glasses, cracking knuckles, twisting a ring. It comes back whenever they feel a certain way, so it tells us what they feel without words.",
    [
      ["showing", "How strongly the habit shows", [0, 5], "0 is gone, 5 is impossible to miss."],
      ["habit", "Which habit", ["fiddling with something", "touching hair or face", "tapping", "clearing the throat", "a twitch", "biting nails or lip"], "What the habit is.", U],
      ["triggeredBy", "What sets it off", ["nerves", "lying", "boredom", "thinking hard", "guilt"], "The feeling that brings the habit out.", U],
      ["times", "Times it shows in the scene", [0, 12], "How often we see it."],
      ["noticed", "Who notices", ["no one", "the audience", "another character", "another character copies it"], "How far the habit is seen."],
      ["stops", "When it stops", ["never", "when they relax", "when someone points it out", "at the end of their journey"], "What makes the habit go away.", U],
    ],
    [2, "Once we know the habit, it becomes a clue: it can give away a lie or a secret.", "A habit that finally stops can show that a character has changed.", "We start watching their hands, waiting for it to come back.", "movement", "Have her twist her ring every time she lies, and in the last scene, have her not twist it."]);

  c("mirroring", "Copying each other's body", "movement-lines",
    "Two people start to match each other without thinking: the same lean, the same folded arms, the same sip of a drink. It shows they are getting closer, or that one is copying the other to win them over.",
    [
      ["match", "How closely they match", [0, 5], "0 is nothing alike, 5 is moving like a reflection."],
      ["leader", "Who copies whom", ["one copies the other", "they take turns", "both at once"], "Who leads and who follows.", U],
      ["lag", "How long before the copy", [0, 5, "seconds", 0.5], "Seconds between one person's move and the other's copy."],
      ["what", "What gets copied", ["the lean", "folded arms", "a drink or a bite", "a gesture", "the voice"], "Which part of the body or voice is matched.", U],
      ["aware", "Do they know they are doing it", ["no idea", "one of them", "both", "one does it on purpose"], "Whether the copying is natural or a trick.", U],
      ["breaks", "How the match ends", ["never breaks", "drifts apart", "one breaks it on purpose", "they notice and laugh"], "What happens to the match by the end of the scene.", U],
    ],
    [2, "Lets two characters grow close, or one manipulate the other, without a line about it.", "Shows connection, or how easily we can be led.", "We watch for the moment they notice they are in step.", "movement", "Have them both reach for their glasses at the same time, and both stop."]);

  c("wordlessAnswer", "Answering without words", "movement-lines",
    "Someone is asked something and answers with a nod, a shrug, a look or by walking away, not a word. The body gives the answer, sometimes more honestly than words would.",
    [
      ["bodySize", "How big the answer is", ["a tiny flicker", "a small nod or shrug", "a clear gesture", "the whole body walks away"], "How much of the body answers."],
      ["answer", "What the answer means", ["yes", "no", "maybe", "I don't know", "I can't say"], "What the body is saying.", U],
      ["delay", "Pause before answering", [0, 8, "seconds", 0.5], "Seconds between the question and the answer."],
      ["clear", "How clear the answer is", ["hard to read", "we can guess", "plain"], "How easily we understand it."],
      ["asker", "How the asker takes it", ["misses it", "misreads it", "understands", "pushes for words"], "What the person who asked does with the answer.", U],
      ["part", "Part of the body that answers", ["the eyes", "the head", "the shoulders", "the hands", "the feet"], "Where the answer comes from.", U],
    ],
    [2, "A silent answer can settle a question or start a fight over what it meant.", "Shows what someone cannot bring themselves to say out loud.", "We read the body and wait to see if the asker read it the same way.", "movement", "Ask 'Did you love him?' and let her answer only by looking at the floor."]);

  /* ---------- character motion ---------- */

  c("pacing", "Pacing back and forth", "character-motion",
    "A character walks back and forth in a small space, turning at the same spots, because they are worried, angry or thinking hard. The path shows a mind going round in circles.",
    [
      ["paceSpeed", "How fast they pace", ["slow", "steady", "quick", "frantic"], "The speed of the walk."],
      ["lapLength", "Length of each lap", [1, 10, "meters", 0.5], "How far they walk before turning round."],
      ["laps", "Laps", [1, 12], "How many times they go back and forth."],
      ["why", "Why they pace", ["worry", "anger", "waiting", "thinking it through", "rehearsing"], "What drives the pacing.", U],
      ["stopsOn", "What stops them", ["nothing", "a thought", "a sound", "someone enters", "they drop into a chair"], "What ends the pacing.", U],
      ["others", "What the others do", ["no one is there", "they watch", "they try to stop them", "they pace too"], "How the people around react.", U],
    ],
    [2, "Shows a character stuck on a problem, so the moment they stop usually brings a decision.", "Shows a mind trapped in a loop.", "We wait for the thought that finally stops them.", "movement", "Have him pace the same four steps, faster each lap, then stop dead mid-step when he has the answer."]);

  c("bigEntrance", "Making an entrance", "character-motion",
    "How a character first comes into a room, or into the story. A big entrance turns every head; a quiet one slips in unnoticed. It tells us who they are before they say a word.",
    [
      ["entranceSize", "How big the entrance is", [0, 5], "0 slips in unseen, 5 stops the room."],
      ["heads", "How many heads turn", ["none", "one", "a few", "everyone"], "How many people look up when they arrive."],
      ["firstSeen", "What we see first", ["the whole person", "their feet", "their back", "a shadow", "their hands"], "The first part of them the camera shows.", U],
      ["wait", "How long we wait to see them", [0, 30, "seconds"], "Seconds others talk about them, or we hear them, before we see them."],
      ["doorPause", "Pause in the doorway", [0, 5, "seconds", 0.5], "Seconds they stand framed in the door before stepping in."],
      ["roomChange", "What the room does", ["keeps going", "goes quiet", "stops dead", "the music changes"], "How the place reacts to them.", U],
    ],
    [3, "A new arrival changes what can happen in the scene and often starts the next turn of the plot.", "Shows how the world sees this person: feared, loved, ignored.", "We want to know what they will do now they are here.", "movement", "Hold on the room going quiet for three seconds before we see who walked in."]);

  c("walkOut", "Walking out", "character-motion",
    "A character leaves the room, often in the middle of a fight. Whether they get the last word, stop at the door, or slam it says a lot about who won.",
    [
      ["finality", "How final the exit is", ["they'll be right back", "storms off", "leaves for good"], "Whether the leaving is a pause or an ending."],
      ["lastWord", "Who gets the last word", ["no one", "the one leaving", "the one left behind", "both at once"], "Who speaks last before the door.", U],
      ["atDoor", "At the door", ["keeps walking", "stops for a beat", "turns back to say one thing", "comes back in"], "What happens at the doorway.", U],
      ["door", "The door", ["no door", "left open", "closed gently", "slammed"], "How the door is left, from softest to loudest."],
      ["stayWith", "The camera stays with", ["the one leaving", "the one left behind", "the empty doorway"], "Whose side of the door we stay on.", U],
      ["holdAfter", "Seconds held after they go", [0, 15, "seconds"], "How long the shot stays once they are gone."],
    ],
    [4, "An exit ends a scene's fight and leaves a gap the next scene has to deal with.", "Shows who walks away from things and who is left with them.", "We wonder if they will come back.", "movement", "Let her stop at the door, turn, say nothing, and leave. Stay on him for ten seconds."]);

  c("faceOff", "Squaring off", "character-motion",
    "Two people turn to face each other square on, often stepping closer with each line, until one backs down or something breaks. A standoff can happen in any kitchen, not only in westerns.",
    [
      ["closeness", "How close they end up", ["across the room", "a few steps", "arm's length", "nose to nose"], "The gap between them at the peak."],
      ["steps", "Steps toward each other", [0, 10], "How many steps get taken across the scene."],
      ["whoSteps", "Who steps in", ["one of them", "they take turns", "both together"], "Who closes the gap.", U],
      ["hold", "How still they hold", [0, 5], "0 is restless, 5 is frozen like statues."],
      ["backsDown", "Who backs down", ["nobody", "the one who stepped in", "the other one", "someone steps between them"], "How the standoff ends.", U],
      ["height", "Height difference", ["eye to eye", "one a little taller", "one towers over the other"], "Whether one looks down on the other."],
    ],
    [4, "A standoff forces a winner, and whoever backs down changes the power for the rest of the story.", "Shows pride, and what each person will not give up.", "We hold our breath to see who breaks first.", "movement", "Have them step closer on every line until they are nose to nose, then have one of them laugh."]);

  c("standSit", "Standing up and sitting down", "character-motion",
    "When a character stands up or sits down on a line. Standing up can take control of a room; sitting down can mean giving in, or settling in for a long talk.",
    [
      ["direction", "Which way", ["sinks down hard", "sits down", "stays as they are", "stands up", "shoots to their feet"], "From dropping into a seat to jumping up."],
      ["timing", "When", ["before the line", "on the line", "after the line"], "Whether the move comes first or follows the words."],
      ["speed", "How fast", ["slowly", "normal", "sudden"], "How quick the move is."],
      ["meaning", "What it means", ["taking control", "giving in", "settling in", "leaving", "respect"], "What the move says.", U],
      ["follow", "Do others copy", ["no one", "one person", "everyone"], "Whether the room follows the move."],
      ["heightGap", "Height gap afterwards", [0, 5], "How much higher one person ends up than the other. 0 is level."],
    ],
    [2, "Standing or sitting on a line shows a shift in who is in charge, right as it happens.", "Shows how power is held with the body.", "We feel the room tip and wait for the reply.", "movement", "Have the quiet one stand up on 'No.' while everyone else stays seated."]);

  /* ---------- camera motion ---------- */

  c("pushInFace", "Slow push in on a face", "camera-motion",
    "The camera creeps slowly toward one face while they listen, think or realise something. We barely notice it moving, but we feel the moment grow heavier.",
    [
      ["pushAmount", "How far it pushes in", [0, 5], "0 does not move, 5 goes from far away all the way into the eyes."],
      ["speed", "How fast it creeps", ["barely moving", "slow", "steady", "quick"], "The speed of the move."],
      ["startSize", "Starts on", ["the whole body", "waist up", "shoulders up", "the face"], "How much of them we see when the move begins."],
      ["endSize", "Ends on", ["shoulders up", "the face", "the eyes only"], "How close we are when it stops."],
      ["seconds", "Seconds it lasts", [2, 40, "seconds"], "How long the push takes."],
      ["during", "While they", ["listen", "speak", "realise something", "say nothing at all"], "What the person is doing as we move in.", U],
    ],
    [3, "Marks the exact moment something lands on a character, which often turns the plot.", "Takes us inside one person's head.", "We get closer and closer, and need to know what they are thinking.", "visual", "Push in for twenty seconds while she listens to the verdict and do not cut until the last word."]);

  c("circlingCamera", "The camera circles them", "camera-motion",
    "The camera travels in a circle around one or two people as they talk, kiss or fight. The world spins behind them and the moment feels bigger, dizzier or more romantic.",
    [
      ["sweep", "How far around", [45, 360, "degrees", 15], "How much of a circle the camera travels. 360 is all the way round."],
      ["speed", "How fast it circles", ["drifting", "slow", "steady", "whirling"], "The speed of the circle."],
      ["inMiddle", "Who is in the middle", ["one person", "a couple", "a group"], "Who the camera circles.", U],
      ["moment", "What is happening", ["a kiss", "a fight", "a reunion", "a dance", "a confession"], "The moment the circle is for.", U],
      ["distance", "How close the camera is", ["far", "middle", "close"], "How far the camera is from the people."],
      ["way", "Which way round", ["clockwise", "counterclockwise", "back and forth"], "The direction of travel.", U],
    ],
    [2, "Lifts a turning point out of normal time so we know it matters.", "Shows two people at the center of their own world.", "We get caught up in the spin and want to see where it stops.", "visual", "Circle the couple once, slowly, as they meet again at the station, then let the crowd swallow them."]);

  c("panReveal", "Turning to reveal", "camera-motion",
    "The camera turns sideways from where it was looking (a pan) to show something we did not know was there: a person in the corner, a wrecked room, an army over the hill.",
    [
      ["surprise", "How big the surprise", [0, 5], "0 shows something we expected, 5 changes everything."],
      ["turnSpeed", "How fast the turn", ["slow", "steady", "quick", "a whip"], "A whip is a turn so fast the picture blurs."],
      ["revealed", "What it reveals", ["a person", "a mess or damage", "something huge", "something missing", "a threat"], "What we find.", U],
      ["angle", "How far it turns", [20, 180, "degrees", 10], "How far the camera swings."],
      ["knows", "Does the character know already", ["they find out with us", "they knew all along", "they find out after us"], "Who learns first.", U],
      ["holdOn", "Seconds held on the reveal", [0, 10, "seconds"], "How long we stay on what was found."],
    ],
    [4, "A reveal drops new information into the scene and turns the plot on the spot.", "Shows that what we see is never the whole picture.", "We want to know what else lies just out of frame.", "visual", "Pan slowly along the happy family photo on the wall and keep going to the open window."]);

  c("wanderingCamera", "The camera wanders off", "camera-motion",
    "The camera drifts away from the people talking, on its own, to a window, an object or another room, as if it had a mind of its own. It tells us to look at something the characters are missing.",
    [
      ["independence", "How much it goes its own way", [0, 5], "0 stays on the people, 5 leaves them completely."],
      ["driftTo", "Where it drifts", ["an object", "a window", "another room", "another person", "empty space"], "What the camera goes to look at.", U],
      ["speed", "How fast it drifts", ["barely", "slow", "steady"], "The speed of the drift."],
      ["stillHear", "Do we still hear the talk", ["the talk fades away", "quieter", "fully"], "How much of the conversation follows us."],
      ["returns", "Does it come back", ["never", "late", "in time for a key line"], "Whether the camera finds the people again.", U],
      ["meaning", "What the drift tells us", ["nothing yet", "a feeling", "a clue", "a warning"], "How much the drift means, from nothing to a warning."],
    ],
    [3, "Plants something the characters miss, which the plot will come back for.", "Shows a world bigger than the people in it.", "We start watching what the camera watches, and wonder why.", "visual", "During the dinner talk, let the camera drift to the knife on the counter, then back."]);

  c("dollyZoom", "The stretching background shot", "camera-motion",
    "The camera rolls toward a person while the lens zooms out (or the other way round), so they stay the same size but the background stretches away or rushes in. It is called a dolly zoom, or the vertigo shot. It feels like the floor drops away.",
    [
      ["warp", "How much the background bends", [0, 5], "0 is no change, 5 is a wild stretch."],
      ["way", "Which way the background goes", ["rushes in", "stretches away"], "Whether the room seems to close in or fall away behind them.", U],
      ["seconds", "Seconds it lasts", [1, 8, "seconds", 0.5], "How long the stretch takes."],
      ["on", "On what moment", ["a shock", "a realisation", "fear", "falling in love", "a fall or a height"], "What the shot is for.", U],
      ["size", "How big the person stays", ["the whole body", "waist up", "the face"], "How much of them fills the frame while the room moves."],
      ["sound", "What the sound does", ["nothing", "drops out", "a rising hum", "a heartbeat"], "The sound under the stretch.", U],
    ],
    [3, "Marks the instant a character's world shifts, usually a discovery that turns the plot.", "Shows the ground going out from under someone.", "We feel the lurch with them and need to know what comes next.", "visual", "Use it once in the film, on the moment she sees the face in the crowd."]);

  /* ---------- suites ---------- */

  S("closing-argument", "Closing argument", "lines",
    "A long speech that starts calm and builds to one last word, the voice rising, the speaker on their feet, and then silence in the room.",
    [
      { curiosity: "buildingSpeech", value: 5 },
      { curiosity: "buildingSpeech", slider: "peak", value: "the very last word" },
      { curiosity: "buildingSpeech", slider: "reaction", value: "silence", weight: 70 },
      { curiosity: "volume", value: 4, weight: 70 },
      { curiosity: "standSit", value: "stands up", weight: 60 },
      { curiosity: "pushInFace", value: 3, weight: 60 },
    ]);

  S("the-unsaid", "The unsaid", "lines",
    "Nothing important gets said straight: one line is thrown away, another trails off, another gets cut off just before the key word.",
    [
      { curiosity: "throwaway", value: 4 },
      { curiosity: "trailingOff", value: "most of the line" },
      { curiosity: "cutOff", value: "just before the key word" },
      { curiosity: "silence", value: "long", weight: 70 },
      { curiosity: "subtext", value: "far apart", weight: 70 },
    ]);

  S("the-bad-news-call", "The bad news call", "lines",
    "We hear only one side, the pauses grow longer, the face gives it away, and they turn their back on the room.",
    [
      { curiosity: "oneSidedCall", value: "nothing at all" },
      { curiosity: "oneSidedCall", slider: "news", value: "bad news" },
      { curiosity: "oneSidedCall", slider: "pauses", value: 6 },
      { curiosity: "backTurned", value: 135, weight: 70 },
      { curiosity: "pushInFace", value: 3, weight: 60 },
      { curiosity: "trailingOff", value: "the end of the line", weight: 50 },
    ]);

  S("psyching-up", "Psyching up", "lines",
    "Alone before the big moment, they pace and rehearse out loud, their habit showing through.",
    [
      { curiosity: "talkingToSelf", value: "talking out loud" },
      { curiosity: "talkingToSelf", slider: "kind", value: "rehearsing a line" },
      { curiosity: "pacing", value: "steady", weight: 70 },
      { curiosity: "ownHabit", value: 3, weight: 60 },
    ]);

  S("falling-in-step", "Falling in step", "movement-lines",
    "Two people start to move alike, answer each other with a nod instead of words, stand close and hold the look while the camera circles.",
    [
      { curiosity: "mirroring", value: 4 },
      { curiosity: "wordlessAnswer", value: "a small nod or shrug" },
      { curiosity: "personalSpace", value: "close", weight: 70 },
      { curiosity: "eyeline", value: "both hold", weight: 70 },
      { curiosity: "circlingCamera", value: 180, weight: 50 },
    ]);

  S("bundle-of-nerves", "Bundle of nerves", "movement-lines",
    "Their habit shows all the time, they pace fast, mutter to themselves and never finish a sentence.",
    [
      { curiosity: "ownHabit", value: 5 },
      { curiosity: "ownHabit", slider: "triggeredBy", value: "nerves" },
      { curiosity: "pacing", value: "quick", weight: 70 },
      { curiosity: "talkingToSelf", value: "muttering", weight: 60 },
      { curiosity: "trailingOff", value: "the end of the line", weight: 60 },
      { curiosity: "emoHands", value: "fidget", weight: 60 },
    ]);

  S("the-standoff", "The standoff", "character-motion",
    "Two people step in until they are nose to nose and hold dead still, while the camera circles them and creeps in.",
    [
      { curiosity: "faceOff", value: "nose to nose" },
      { curiosity: "faceOff", slider: "steps", value: 6 },
      { curiosity: "faceOff", slider: "hold", value: 5 },
      { curiosity: "stillness", value: 4, weight: 70 },
      { curiosity: "circlingCamera", value: 90, weight: 50 },
      { curiosity: "pushInFace", value: 2, weight: 50 },
    ]);

  S("storming-out", "Storming out", "character-motion",
    "Someone shoots to their feet, cuts the other off, turns their back and leaves for good with a slam, and we stay with the one left behind.",
    [
      { curiosity: "walkOut", value: "leaves for good" },
      { curiosity: "walkOut", slider: "door", value: "slammed" },
      { curiosity: "walkOut", slider: "stayWith", value: "the one left behind", weight: 70 },
      { curiosity: "standSit", value: "shoots to their feet", weight: 70 },
      { curiosity: "cutOff", value: "partway", weight: 60 },
      { curiosity: "backTurned", value: 180, weight: 50 },
    ]);

  S("grand-arrival", "Grand arrival", "character-motion",
    "The room goes quiet, every head turns, they pause in the doorway, and the camera turns to show who it is.",
    [
      { curiosity: "bigEntrance", value: 5 },
      { curiosity: "bigEntrance", slider: "heads", value: "everyone" },
      { curiosity: "bigEntrance", slider: "doorPause", value: 2 },
      { curiosity: "panReveal", value: 3, weight: 70 },
      { curiosity: "panReveal", slider: "revealed", value: "a person", weight: 70 },
    ]);

  S("the-floor-drops", "The floor drops", "camera-motion",
    "The camera creeps in on a face as they realise something, the room stretches behind them, the sound drops out and nobody speaks.",
    [
      { curiosity: "pushInFace", value: 4 },
      { curiosity: "pushInFace", slider: "during", value: "realise something" },
      { curiosity: "dollyZoom", value: 3 },
      { curiosity: "dollyZoom", slider: "sound", value: "drops out", weight: 70 },
      { curiosity: "silence", value: "long", weight: 60 },
    ]);

  S("something-in-the-room", "Something in the room", "camera-motion",
    "The camera wanders off the talk to a clue, stays too long, then turns to reveal what was waiting there.",
    [
      { curiosity: "wanderingCamera", value: 4 },
      { curiosity: "wanderingCamera", slider: "meaning", value: "a clue" },
      { curiosity: "lingeringShot", value: 5, weight: 70 },
      { curiosity: "panReveal", value: 4, weight: 70 },
      { curiosity: "panReveal", slider: "revealed", value: "a threat", weight: 60 },
    ]);

  /* ---------- proximities ---------- */

  P("cutoff-opens-question", "When a line is cut just before the key word, the audience holds a question", "lines",
    "When someone is cut off right before the word that matters, the audience starts carrying a question within 4 beats.",
    { curiosity: "cutOff", is: "just before the key word" }, { curiosity: "openQuestions", change: "rises" }, 4, { also: ["plot"] });
  P("many-cutoffs-overlap", "When lines keep getting cut off, people talk over each other", "lines",
    "When more lines get cut off, the scene turns into people talking over each other within 2 beats.",
    { curiosity: "cutOff", slider: "count", change: "rises" }, { curiosity: "pace", slider: "overlap", is: "talking over each other" }, 2);
  P("thrown-line-silence", "When a big line is thrown away, a silence follows", "lines",
    "When an important line is said lightly, a silence opens up after it within 2 beats.",
    { curiosity: "throwaway", change: "rises" }, { curiosity: "silence", change: "rises" }, 2);
  P("thrown-while-working", "When a line is thrown away mid-task, the task takes over", "lines",
    "When the line is said while working on something, the business with the prop grows within a beat.",
    { curiosity: "throwaway", slider: "busy", is: "working on something" }, { curiosity: "propBusiness", change: "rises" }, 1, { also: ["movement-lines"] });
  P("speech-gets-louder", "When the speech builds, the voice gets louder", "lines",
    "When a speech builds, the volume climbs with it within 4 beats.",
    { curiosity: "buildingSpeech", change: "rises" }, { curiosity: "volume", change: "rises" }, 4);
  P("speech-turns-the-crowd", "When the speech makes the room erupt, the crowd turns", "lines",
    "When a speech lands so well the room erupts, the crowd changes its mind within 2 beats.",
    { curiosity: "buildingSpeech", slider: "reaction", is: "the room erupts" }, { curiosity: "crowdTurns", change: "rises" }, 2, { also: ["herd"] });
  P("speech-brings-them-up", "When the speech builds, the speaker gets to their feet", "lines",
    "When a speech grows, the speaker stands up to carry it within 4 beats.",
    { curiosity: "buildingSpeech", change: "rises" }, { curiosity: "standSit", change: "rises" }, 4, { also: ["character-motion"] });
  P("trailing-off-body-answers", "When a sentence trails off, the body answers instead", "lines",
    "When words give out, the other person answers with a nod or a look within 2 beats.",
    { curiosity: "trailingOff", change: "rises" }, { curiosity: "wordlessAnswer", change: "rises" }, 2, { also: ["movement-lines"] });
  P("trailing-into-memory", "When they trail off lost in a memory, nostalgia rises", "lines",
    "When a sentence fades because they drift into a memory, the scene turns wistful within 2 beats.",
    { curiosity: "trailingOff", slider: "why", is: "lost in a memory" }, { curiosity: "nostalgia", change: "rises" }, 2, { also: ["emo-road"] });
  P("subtext-trails-off", "When what they mean drifts far from what they say, sentences trail off", "emotion",
    "When the gap between words and meaning grows, sentences start to fade unfinished within 2 beats.",
    { curiosity: "subtext", change: "rises" }, { curiosity: "trailingOff", change: "rises" }, 2, { also: ["lines"] });
  P("caught-talking-shame", "When they are caught talking to themselves, shame rises", "lines",
    "When someone walks in on the private talk, embarrassment floods in within a beat.",
    { curiosity: "talkingToSelf", slider: "caught", is: "caught, embarrassed" }, { curiosity: "shame", change: "rises" }, 1, { also: ["emotion"] });
  P("pacing-muttering", "When they pace, they start talking to themselves", "character-motion",
    "When a character paces, the thoughts start coming out loud within 2 beats.",
    { curiosity: "pacing", change: "rises" }, { curiosity: "talkingToSelf", change: "rises" }, 2, { also: ["lines"] });
  P("call-threat-dread", "When the call is a threat, dread builds", "lines",
    "When the voice on the other end is threatening, dread builds within 2 beats.",
    { curiosity: "oneSidedCall", slider: "news", is: "a threat" }, { curiosity: "dread", change: "rises" }, 2, { also: ["emo-road"] });
  P("call-bad-news-turn-away", "When the call brings bad news, they turn their back", "lines",
    "When the news is bad, the listener turns away from the room within 2 beats.",
    { curiosity: "oneSidedCall", slider: "news", is: "bad news" }, { curiosity: "backTurned", change: "rises" }, 2, { also: ["movement-lines"] });
  P("call-hidden-push-in", "When we cannot hear the other side, the camera creeps in on the face", "lines",
    "When the caller's voice is hidden from us, the camera pushes in on the listener's face within 3 beats.",
    { curiosity: "oneSidedCall", change: "rises" }, { curiosity: "pushInFace", change: "rises" }, 3, { also: ["camera-motion"] });
  P("back-turned-hides-feeling", "When they turn their back to hide tears, the feeling stays hidden", "movement-lines",
    "When a character turns away to hide crying, the feeling is kept out of sight within a beat.",
    { curiosity: "backTurned", slider: "why", is: "hiding tears" }, { curiosity: "emoShown", change: "drops" }, 1, { also: ["emo-road"] });
  P("back-turned-no-look", "When they turn their back, the eyes stop meeting", "movement-lines",
    "When someone turns away on a line, the look between the two breaks within a beat.",
    { curiosity: "backTurned", change: "rises" }, { curiosity: "eyeline", change: "drops" }, 1, { also: ["placement"] });
  P("habit-gives-away-lie", "When the habit comes from lying, the gap between words and meaning grows", "movement-lines",
    "When a character's habit shows up because they are lying, the hidden meaning under their words grows within a beat.",
    { curiosity: "ownHabit", slider: "triggeredBy", is: "lying" }, { curiosity: "subtext", change: "rises" }, 1, { also: ["emotion"] });
  P("habit-copied-mirroring", "When someone copies the habit, the two start mirroring", "movement-lines",
    "When another character picks up the habit, the two start moving alike within 2 beats.",
    { curiosity: "ownHabit", slider: "noticed", is: "another character copies it" }, { curiosity: "mirroring", change: "rises" }, 2);
  P("mirroring-warmth", "When two people mirror each other, warmth grows between them", "movement-lines",
    "When their bodies fall into step, the warmth between them grows within 4 beats.",
    { curiosity: "mirroring", change: "rises" }, { curiosity: "warmth", change: "rises" }, 4, { also: ["emo-road"] });
  P("mirroring-closer", "When two people mirror each other, they stand closer", "movement-lines",
    "When they move alike, the space between them shrinks within 4 beats.",
    { curiosity: "mirroring", change: "rises" }, { curiosity: "personalSpace", change: "drops" }, 4, { also: ["emotion"] });
  P("pushed-for-words-faceoff", "When the asker pushes for words, they square off", "movement-lines",
    "When a silent answer is not enough and the asker pushes, the two turn to face each other within 3 beats.",
    { curiosity: "wordlessAnswer", slider: "asker", is: "pushes for words" }, { curiosity: "faceOff", change: "rises" }, 3, { also: ["character-motion"] });
  P("pacing-quickens-cuts", "When the pacing speeds up, the cuts come faster", "character-motion",
    "When a character paces faster, the edit cuts faster with them within 2 beats.",
    { curiosity: "pacing", change: "rises" }, { curiosity: "cutRate", change: "rises" }, 2, { also: ["camera-motion"] });
  P("entrance-hushes-room", "When the entrance is big, the talking stops", "character-motion",
    "When someone makes a big entrance, the people in the room stop talking within a beat.",
    { curiosity: "bigEntrance", change: "rises" }, { curiosity: "wordsAmount", change: "drops" }, 1, { also: ["emotion"] });
  P("reveal-a-person-entrance", "When the camera turns to reveal a person, it becomes an entrance", "camera-motion",
    "When a turn of the camera finds someone standing there, they arrive with the weight of an entrance within a beat.",
    { curiosity: "panReveal", slider: "revealed", is: "a person" }, { curiosity: "bigEntrance", change: "rises" }, 1, { also: ["character-motion"] });
  P("slam-then-silence", "When the door is slammed, silence follows", "character-motion",
    "When the one leaving slams the door, a silence falls within a beat.",
    { curiosity: "walkOut", slider: "door", is: "slammed" }, { curiosity: "silence", change: "rises" }, 1, { also: ["lines"] });
  P("left-behind-loneliness", "When we stay with the one left behind, loneliness grows", "character-motion",
    "When the camera stays with the person left in the room, loneliness grows within 2 beats.",
    { curiosity: "walkOut", slider: "stayWith", is: "the one left behind" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("exit-shot-lingers", "When the shot holds after they go, it stays too long on purpose", "character-motion",
    "When the camera keeps rolling after the exit, the shot becomes one that lingers within a beat.",
    { curiosity: "walkOut", slider: "holdAfter", change: "rises" }, { curiosity: "lingeringShot", change: "rises" }, 1, { also: ["focus"] });
  P("faceoff-tension", "When they square off, tension climbs", "character-motion",
    "When two people face off and step in, the tension of the scene climbs within 2 beats.",
    { curiosity: "faceOff", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 2, { also: ["structure"] });
  P("faceoff-circled", "When they square off, the camera circles them", "character-motion",
    "When a standoff closes in, the camera starts to circle the pair within 3 beats.",
    { curiosity: "faceOff", change: "rises" }, { curiosity: "circlingCamera", change: "rises" }, 3, { also: ["camera-motion"] });
  P("standing-takes-the-room", "When they shoot to their feet, the speaker holds the power", "character-motion",
    "When someone jumps up on a line, the power in the room moves to the speaker within a beat.",
    { curiosity: "standSit", is: "shoots to their feet" }, { curiosity: "blocking", slider: "power", is: "the speaker" }, 1, { also: ["placement"] });
  P("push-in-empathy", "When the camera pushes in on a face, we feel with them", "camera-motion",
    "When the camera creeps closer to a face, the audience feels what that person feels within 3 beats.",
    { curiosity: "pushInFace", change: "rises" }, { curiosity: "empathy", change: "rises" }, 3, { also: ["emotion"] });
  P("push-in-realisation", "When the camera pushes in as they realise, the realisation lands", "camera-motion",
    "When the push in plays over someone realising something, the moment they see it lands clearly within a beat.",
    { curiosity: "pushInFace", slider: "during", is: "realise something" }, { curiosity: "realization", change: "rises" }, 1, { also: ["arc"] });
  P("realisation-stretches-room", "When a character sees the truth, the background stretches", "arc",
    "When the moment of realising arrives, the room behind them stretches or rushes in within 2 beats.",
    { curiosity: "realization", change: "rises" }, { curiosity: "dollyZoom", change: "rises" }, 2, { also: ["camera-motion"] });
  P("stretch-in-the-body", "When the background stretches, we feel it in the body", "camera-motion",
    "When the stretching background shot plays, the feeling hits the body (a lurch, a drop) within a beat.",
    { curiosity: "dollyZoom", change: "rises" }, { curiosity: "bodyFeeling", change: "rises" }, 1, { also: ["emotion"] });
  P("stretch-sound-drops", "When the sound drops out under the stretch, we hear through their ears", "camera-motion",
    "When the stretching shot comes with the sound dropping away, we start hearing through the character within a beat.",
    { curiosity: "dollyZoom", slider: "sound", is: "drops out" }, { curiosity: "subjectiveSound", change: "rises" }, 1, { also: ["audio-mix"] });
  P("circle-kiss-tenderness", "When the camera circles a kiss, tenderness grows", "camera-motion",
    "When the camera travels round a couple kissing, the scene turns tender within 2 beats.",
    { curiosity: "circlingCamera", slider: "moment", is: "a kiss" }, { curiosity: "tenderness", change: "rises" }, 2, { also: ["emotion"] });
  P("whirling-circle-intensity", "When the camera whirls around them, the feeling peaks", "camera-motion",
    "When the circle speeds up to a whirl, the strength of the feeling peaks within 2 beats.",
    { curiosity: "circlingCamera", slider: "speed", is: "whirling" }, { curiosity: "emotionIntensity", change: "rises" }, 2, { also: ["emotion"] });
  P("reveal-threat-dread", "When the turn reveals a threat, dread rises", "camera-motion",
    "When the camera turns to find danger, dread jumps within a beat.",
    { curiosity: "panReveal", slider: "revealed", is: "a threat" }, { curiosity: "dread", change: "rises" }, 1, { also: ["emo-road"] });
  P("whip-turn-blur", "When the turn is a whip, the picture blurs", "camera-motion",
    "When the camera whips round, motion blur smears the picture within a beat.",
    { curiosity: "panReveal", slider: "turnSpeed", is: "a whip" }, { curiosity: "motionBlur", change: "rises" }, 1, { also: ["camera-angle"] });
  P("wander-plants-question", "When the camera wanders off to a clue, the audience holds a question", "camera-motion",
    "When the drifting camera settles on a clue, the audience starts wondering within 3 beats.",
    { curiosity: "wanderingCamera", slider: "meaning", is: "a clue" }, { curiosity: "openQuestions", change: "rises" }, 3, { also: ["plot"] });
  P("wander-lingers", "When the camera wanders off, it lingers where it lands", "camera-motion",
    "When the camera leaves the people, it stays a little too long on what it found within 2 beats.",
    { curiosity: "wanderingCamera", change: "rises" }, { curiosity: "lingeringShot", change: "rises" }, 2, { also: ["focus"] });

  /* ---------- proximity suites ---------- */

  PS("the-fight-ends-at-the-door", "The fight ends at the door", "character-motion",
    "They square off and tension climbs, one shoots to their feet and takes the room, slams the door, and the one left behind is alone.",
    ["faceoff-tension", "standing-takes-the-room", "slam-then-silence", "left-behind-loneliness"]);
  PS("the-call", "The call", "lines",
    "We cannot hear the other side, so the camera creeps in, the bad news turns their back, the tears stay hidden, and we feel it with them.",
    ["call-hidden-push-in", "call-bad-news-turn-away", "back-turned-hides-feeling", "push-in-empathy"], { also: ["camera-motion"] });
  PS("the-truth-comes-out-sideways", "The truth comes out sideways", "lines",
    "The big line is thrown away into silence, the next one trails off, the body answers instead, and a line cut off before the key word leaves us with a question.",
    ["thrown-line-silence", "trailing-off-body-answers", "subtext-trails-off", "cutoff-opens-question"]);
  PS("the-ground-gives-way", "The ground gives way", "camera-motion",
    "The camera pushes in as they realise, the room stretches behind them, the sound drops away, and we feel it in our own body.",
    ["push-in-realisation", "realisation-stretches-room", "stretch-sound-drops", "stretch-in-the-body"]);
  PS("growing-close", "Growing close", "movement-lines",
    "One copies the other's habit, they fall into step, stand closer, warm to each other, and the camera circles their kiss.",
    ["habit-copied-mirroring", "mirroring-closer", "mirroring-warmth", "circle-kiss-tenderness"]);
  PS("someone-is-there", "Someone is there", "camera-motion",
    "The camera wanders off to a clue and lingers, then turns to find a person who arrives like an entrance, and the room goes quiet.",
    ["wander-plants-question", "wander-lingers", "reveal-a-person-entrance", "entrance-hushes-room"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
