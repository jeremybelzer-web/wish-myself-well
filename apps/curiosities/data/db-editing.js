/* data/db-editing.js: editing curiosities taken from the Final Cut Pro User Guide and CapCut (Jeremy,
   2026-10-02 18:00Z: "I'm leaning towards mainly using CapCut... I think their user interface is great").
   Everything an editor changes in those two apps (transitions, filters, adjustments, text, speed, the audio
   mix, overlays, masks, the canvas) is a curiosity here, in the curiosity database's own format.

   Written by the Main layout thread (draft PR #28) as screen/edit-curiosities.js and moved here; loaded after
   db-momentum.js (data/files.json), so the app, the engine and the Screen's new categories all know these rows.
   Sources: Final Cut Pro User Guide (transitions p.389, retiming p.558, beat detection p.210, stabilization
   p.216, masking p.642, color correction p.708) and CapCut Desktop (its Media, Audio, Text, Stickers,
   Effects, Transitions, Filters and Adjustment tabs, the timeline tools, the 2025 CapCut Desktop Guide).
   Film knowledge in plain words, not copied text. */
(function (DB) {
  /* A second load does nothing (the Screen's own copy, screen/edit-curiosities.js, may still be loaded until
     PR #28 drops it). */
  if (!DB || typeof DB.curiosity !== "function" || DB.data.curiosities.some((x) => x.id === "transitionKind")) return;
  const SRC = "Final Cut Pro and CapCut";
  const W = [
    ["transitions", "Transitions", "How one shot hands over to the next: cuts, dissolves, wipes, and clips that animate in and out."],
    ["grade", "Filters & adjustments", "The look laid over the picture: a filter, exposure, warmth, texture, matching shots."],
    ["titles", "Text & captions", "Words and stickers on the screen: titles, captions, sound words, emoji."],
    ["speed", "Speed & timing", "How fast clips play and how the cutting breathes: slow motion, freezes, jump cuts, cutting to the beat."],
    ["audio-mix", "Audio mix", "How the sound is balanced: music under the voices, fades, voice effects, edited-in sound hits."],
    ["layers", "Layers, masks & effects", "Pictures over pictures: cutaways, picture in picture, cutouts, masks, tracking, video effects."],
    ["canvas", "Frame & canvas", "What the editor does to the frame itself: punch-ins, mirroring, steadying, filling the edges."],
  ];
  W.forEach(([id, label, plain]) => DB.workspace({ id, label, plain, scope: "scene", proposed: true }));

  /* c(id, label, workspace, plain, sliders, momentum [push, plot, theme, pull, cue, tryThis]) */
  const SHARED = (push) => [
    { id: "push", label: "Pushes the story", range: { min: 0, max: 5 }, from: push, to: Math.min(5, push + 2), plain: "How much this curiosity moves the story forward here." },
    { id: "pointsAhead", label: "Points ahead", scale: ["closes a door", "holds", "hints at what's next", "demands what's next"], from: "holds", to: "demands what's next", plain: "Whether it settles something or leaves a question the next moment must answer." },
    { id: "themeLink", label: "Tied to a theme", scale: ["not at all", "loosely", "clearly", "it is the theme"], from: "loosely", to: "clearly", plain: "How closely it carries one of the film's themes here." },
  ];
  function c(id, label, workspace, plain, sliders, m) {
    const row = DB.curiosity({ id, label, plain, workspace, group: "Editing (" + SRC + ")", kind: "measure", main: "setting", sliders: sliders.concat(SHARED(m[0])), source: SRC, tags: ["editing", "capcut", "final-cut-pro"] });
    if (row && !row.momentum) row.momentum = { push: m[0], plot: m[1], theme: m[2], pull: m[3], cue: m[4], tryThis: m[5] };
  }
  const S = (label, values, plain, extra) => ["setting", label, values, plain, extra];

  /* ---------- Transitions ---------- */
  c("transitionKind", "Transition style", "transitions", "The effect between two clips (CapCut's Transitions tab, Final Cut's Transitions browser).", [
    S("Transition style", ["cut", "fade to black", "fade to white", "cross dissolve", "wipe", "push", "zoom", "spin", "whip pan", "flash", "glitch", "morph", "flash zoom", "slam merge", "slice reveal", "brush cuts", "phone swipe", "smear"], "Which transition crosses this cut.", { unordered: true }),
    ["duration", "Length", [0, 3, "seconds", 0.25], "How long the transition takes."],
    ["direction", "Direction", ["left", "right", "up", "down", "in", "out"], "Which way a wipe, push or zoom travels.", { unordered: true }],
    ["ease", "Ease", ["steady", "eases in", "eases out", "eases in and out"], "Whether it starts or ends gently."],
    ["soundOverlap", "Sound overlap", ["hard cut", "sound leads", "sound lags", "crossfade"], "Whether the next scene's sound starts early (sound leads), the last scene's sound carries on (sound lags), or both blend.", { unordered: true }],
  ], [2, "A transition tells the audience how much time or distance just passed.", "A soft dissolve joins two ideas; a hard cut sets them against each other.", "A showy transition makes the audience look at what comes next.", "visual", "Save the one flashy transition for the moment the story jumps."]);
  c("clipAnimation", "Clip animation", "transitions", "A clip that animates in or out on its own, used when there is no second clip to transition to (CapCut's Animation panel).", [
    S("Clip animation", ["none", "in", "out", "in and out", "loop"], "When the clip animates."),
    ["style", "Style", ["fade", "slide", "zoom", "bounce", "spin", "shake", "swing"], "How it moves.", { unordered: true }],
    ["duration", "Length", [0, 3, "seconds", 0.25], "How long the animation takes."],
    ["strength", "Strength", [0, 100, "%"], "How big the movement is."],
  ], [1, "A clip bouncing in announces something new has arrived.", "Bouncy animation says the film doesn't take itself seriously.", "Movement at the edge of a clip catches the eye before the content does.", "movement", "Bounce in the photo of the person everyone is talking about."]);
  c("fadeEdge", "Fade in and out", "transitions", "Whether a scene fades up from or down to a color.", [
    S("Fade", ["none", "fade in", "fade out", "both"], "Which ends of the scene fade."),
    ["color", "Fade color", ["black", "white", "a color"], "What it fades to.", { unordered: true }],
    ["length", "Length", [0, 5, "seconds", 0.5], "How long the fade lasts."],
  ], [2, "A fade to black closes a chapter; the audience knows the story is about to move on.", "Fading to white feels like memory, heaven or a blinding moment.", "The black after a fade holds the audience in suspense for what comes next.", "visual", "End the worst moment on a long fade to black and come back somewhere else entirely."]);

  /* ---------- Filters & adjustments ---------- */
  c("filterLook", "Filter", "grade", "A ready-made look laid over the clip, with a strength (CapCut's Filters tab, Final Cut's looks and LUTs).", [
    S("Filter", ["none", "natural", "warm film", "cool film", "black and white", "vintage", "faded", "high contrast", "teal and orange", "pastel", "night", "dreamy"], "Which look is on.", { unordered: true }),
    ["strength", "Strength", [0, 100, "%"], "How strongly the filter is laid over."],
    ["scope", "Applies to", ["this clip", "the scene", "the whole film"], "Whether it sits on one clip or on a layer above several (CapCut: effects above affect everything below)."],
  ], [2, "A change of filter marks a new time, a memory, or a new state of mind.", "The look is the film's mood made visible.", "When the look shifts, the audience knows something has changed before anyone says so.", "visual", "Drain the color out the moment the character gives up, and bring it back when they try again."]);
  c("exposure", "Exposure", "grade", "How bright the picture is overall, and its highlights and shadows (CapCut's Adjustment tab, Final Cut's color board).", [
    S("Exposure", ["very dark", "dark", "normal", "bright", "blown out"], "Overall brightness."),
    ["brightness", "Brightness", [-50, 50, ""], "Lift or lower everything."],
    ["highlights", "Highlights", [-50, 50, ""], "The brightest parts."],
    ["shadows", "Shadows", [-50, 50, ""], "The darkest parts."],
  ], [1, "Darkening scenes can track a story sliding toward its low point.", "Bright and dark carry hope and dread.", "The eye goes to the brightest thing in the frame.", "visual", "Make the room a little darker each time the lie grows."]);
  c("whiteBalance", "Warmth and tint", "grade", "How warm or cool the picture reads, and its green or magenta tint (Final Cut's white balance, CapCut's temperature and tint).", [
    S("Warmth", ["very cool", "cool", "neutral", "warm", "very warm"], "Blue against orange."),
    ["temperature", "Temperature", [2500, 10000, "K", 100], "The color temperature in kelvin."],
    ["tint", "Tint", ["green", "neutral", "magenta"], "The green to magenta push."],
  ], [1, "A shift from warm to cool can show a relationship cooling.", "Warm feels safe and close; cool feels lonely or clinical.", "A sudden change of warmth tells the audience the feeling of the place changed.", "visual", "Cool the picture slowly over a dinner that is going badly."]);
  c("texture", "Film texture", "grade", "How soft, crisp or gritty the picture is: sharpening, clarity, grain and vignette.", [
    S("Texture", ["soft", "natural", "crisp", "gritty"], "The overall feel of the surface."),
    ["sharpen", "Sharpen", [0, 100, "%"], "Edge sharpening."],
    ["grain", "Grain", [0, 100, "%"], "Film grain or noise."],
    ["vignette", "Vignette", [0, 100, "%"], "Darkened corners that pull the eye in."],
  ], [1, "Grit coming in can mark a turn toward danger or the past.", "Soft is memory and romance; gritty is truth and struggle.", "A vignette pushes attention to the middle of the frame.", "visual", "Add grain only to the flashbacks."]);
  c("colorMatch", "Shot matching", "grade", "Whether a shot's color matches the shots around it (Final Cut's Match Color and Balance Color).", [
    S("Matching", ["mismatched", "close", "matched", "deliberately different"], "How well it matches."),
    ["reference", "Matched to", ["the shot before", "the scene's key shot", "an inspiration film"], "Which shot it is matched to.", { unordered: true }],
    ["skin", "Skin tones", ["off", "natural", "flattering", "stylized"], "How faces read after the correction."],
  ], [1, "Matching keeps a scene feeling like one place and time, so the audience follows the story, not the seams.", "A deliberately mismatched shot says this moment belongs somewhere else.", "A shot that suddenly doesn't match pulls the eye and asks why.", "visual", "Match every shot in the argument, then leave the last close-up deliberately colder."]);

  /* ---------- Text & captions ---------- */
  c("onScreenText", "On-screen text", "titles", "Words laid over the picture (CapCut's Text tab, Final Cut's titles).", [
    S("On-screen text", ["none", "caption", "title card", "lower third", "sign or label", "sound word", "credits"], "What kind of text is on screen.", { unordered: true }),
    ["size", "Size", ["small", "medium", "large", "full screen"], "How big it is."],
    ["position", "Position", ["top", "middle", "bottom", "follows a person"], "Where it sits.", { unordered: true }],
    ["animation", "Animation", ["none", "typewriter", "fade", "pop", "slide", "bounce"], "How it arrives.", { unordered: true }],
    ["duration", "On screen for", [0, 10, "seconds", 0.5], "How long it stays."],
  ], [2, "A title card can jump time, name a place or set a deadline.", "Words on screen are the film talking straight to the audience.", "Text makes the audience read, so it holds their attention exactly where it sits.", "visual", "Put a deadline on screen and count it down in later scenes."]);
  c("captions", "Captions", "titles", "Subtitles of what is said, by hand or automatic (CapCut's Auto captions, Final Cut's captions).", [
    S("Captions", ["off", "key words", "every line", "word by word"], "How much of the speech is captioned."),
    ["speakerColor", "Speaker colors", ["one color", "a color per speaker"], "Whether each speaker gets a color."],
    ["wordsPerLine", "Words per line", [1, 10, "words"], "How many words show at once."],
  ], [1, "Captions keep the plot clear when the sound is off, as it often is on phones.", "Word-by-word captions make speech feel urgent and punchy.", "Moving words keep the eye locked on the screen.", "visual", "Caption only the key words, big, so the joke reads with the sound off."]);
  c("textStyle", "Text style", "titles", "How the letters look: the font's feel, outline, shadow and box (CapCut's text settings).", [
    S("Font feel", ["clean", "serif", "handwritten", "bold display", "retro", "comic"], "The kind of lettering.", { unordered: true }),
    ["stroke", "Outline", [0, 10, "px"], "The border around each letter."],
    ["shadow", "Shadow", [0, 100, "%"], "A drop shadow behind the letters."],
    ["box", "Background box", ["none", "soft", "solid"], "A box behind the text."],
  ], [0, "The lettering rarely moves the plot, but it sets the tone of every word.", "Handwriting feels personal; bold display feels loud and public.", "Heavy outlines make words pop off a busy picture.", "visual", "Give each character's text messages their own lettering."]);
  c("stickers", "Stickers and emoji", "titles", "Graphics dropped on the picture: emoji, arrows, sparkles, reactions (CapCut's Stickers tab).", [
    S("Stickers", ["none", "one", "a few", "many"], "How many are on screen."),
    ["kind", "Kind", ["emoji", "arrow", "sparkle", "speech bubble", "reaction", "shape"], "What they are.", { unordered: true }],
    ["motion", "Motion", ["still", "bounces", "follows a person"], "How they move."],
  ], [1, "An arrow pointing at something tells the audience it will matter.", "Stickers make the film wink at its audience.", "A bouncing sticker is the brightest thing on screen, so the eye goes there.", "visual", "Point an arrow at the thing nobody has noticed yet."]);

  /* ---------- Speed & timing ---------- */
  c("clipSpeed", "Clip speed", "speed", "How fast the clip plays: slow motion to fast motion (Final Cut's Retime menu, CapCut's Speed).", [
    S("Clip speed", ["frozen", "very slow", "slow", "normal", "fast", "very fast"], "Playback speed."),
    ["percent", "Speed", [10, 400, "%", 5], "Exact speed (100% is normal)."],
    ["pitch", "Voice pitch", ["kept", "follows the speed"], "Whether voices go low and high with the speed."],
  ], [2, "Slowing a moment down tells the audience this is the moment that matters.", "Slow motion is memory and importance; fast motion is chaos or comedy.", "A sudden slowdown makes everyone lean in.", "movement", "Slow down the instant before the mistake, not the mistake itself."]);
  c("playDirection", "Reverse and replay", "speed", "Whether a clip plays forward, backward, or rewinds and plays again (CapCut's Reverse, Final Cut's rewind and instant replay).", [
    S("Direction", ["forward", "reversed", "rewind and replay"], "How the clip runs.", { unordered: true }),
    ["replays", "Replays", [0, 4, "times"], "How many times it repeats."],
    ["replaySpeed", "Replay speed", ["slower", "same", "faster"], "The speed of the replay."],
  ], [2, "A rewind lets the film take back a moment and show it again with new meaning.", "Replaying a moment asks what really happened.", "A rewind is a surprise; the audience watches the replay closely for the detail they missed.", "visual", "Rewind the fall and replay it slower, so the audience sees who tripped them."]);
  c("freezeFrame", "Freeze frame", "speed", "Holding one frame still (Final Cut's Hold, CapCut's Freeze).", [
    S("Freeze", ["none", "short freeze", "long freeze", "freeze with a title"], "Whether the picture stops."),
    ["length", "Length", [0, 5, "seconds", 0.5], "How long it holds."],
    ["zoom", "Zoom while frozen", [0, 100, "%"], "A push in on the frozen frame."],
  ], [3, "A freeze stops the story to introduce a person or point at a turning point.", "A frozen moment says 'remember this'.", "Nothing moving makes the audience stare at the one thing the film wants them to see.", "visual", "Freeze on the character's face at the worst moment, and put their name on screen."]);
  c("jumpCut", "Jump cuts", "speed", "Cuts that skip ahead inside the same shot (Final Cut's jump cuts at markers).", [
    S("Jump cuts", ["none", "a few", "rhythmic", "constant"], "How often the shot jumps."),
    ["gap", "Time skipped", [2, 48, "frames"], "How much is cut out each time."],
    ["reframe", "Reframe on each jump", ["no", "slight punch-in", "alternating"], "Whether the frame changes size on each jump."],
  ], [1, "Jump cuts squeeze time so a long task feels quick.", "Jumpy cutting feels restless, modern and impatient.", "Each jump is a small jolt that keeps the eye awake.", "visual", "Jump cut through the character trying on every outfit, and hold on the last one."]);
  c("beatSync", "Cutting to the beat", "speed", "Whether cuts land on the music's beats, bars or song parts (Final Cut's Beat Detection, CapCut's beat marks).", [
    S("Cutting to the beat", ["ignores the beat", "near the beat", "on beats", "on bars", "on song parts"], "How tightly cuts follow the music."),
    ["every", "Cut every", [1, 8, "beats"], "How many beats between cuts."],
    ["offset", "Early or late", [-6, 6, "frames"], "Cutting just ahead of or behind the beat."],
  ], [2, "Cutting on the song's big change makes that moment land as a turn.", "Cutting to the beat makes the film feel like it is dancing; ignoring it feels like real life.", "The audience feels the cut coming with the beat, which keeps them moving with it.", "audio", "Cut on every beat during the montage, then let one shot run across the drop."]);
  c("pacingCurve", "Pace across the scene", "speed", "How the cutting speeds up or slows down over the scene.", [
    S("Pace", ["slows down", "steady", "speeds up", "speeds up then stops", "stop and go"], "The shape of the pace.", { unordered: true }),
    ["pauses", "Breathing room", [0, 5, "pauses"], "How many held moments it allows."],
    ["shortest", "Shortest shot", [2, 48, "frames"], "The quickest cut in the scene."],
  ], [3, "Speeding up the cutting drives the scene toward its turn; stopping dead marks it.", "Pace is the scene's heartbeat.", "Faster cutting raises the audience's pulse; a sudden stop makes them hold their breath.", "visual", "Speed up toward the reveal, then hold one long still shot on it."]);

  /* ---------- Audio mix ---------- */
  c("musicLevel", "Music under speech", "audio-mix", "How loud the music sits against the voices, and how much it ducks when someone talks.", [
    S("Music level", ["silent", "under", "even", "over", "music only"], "Where the music sits."),
    ["duck", "Ducks by", [0, 24, "dB"], "How much the music drops when someone speaks."],
    ["fade", "Duck speed", ["instant", "quick", "slow"], "How fast it ducks."],
  ], [2, "Music rising over the voices tells the audience the words no longer matter, the feeling does.", "Music over speech says the moment is bigger than what anyone says.", "When the music swells, the audience feels a peak coming.", "audio", "Let the music swallow the last line so the audience has to imagine it."]);
  c("audioFade", "Audio fades", "audio-mix", "How the sound starts and ends: hard, faded, or crossfaded into the next clip.", [
    S("Audio fade", ["hard", "fade in", "fade out", "both", "crossfade"], "How the sound starts and stops.", { unordered: true }),
    ["length", "Length", [0, 5, "seconds", 0.5], "How long the fade lasts."],
    ["curve", "Curve", ["straight", "smooth", "sudden at the end"], "The shape of the fade."],
  ], [1, "A hard sound cut can shock; a fade lets a scene drift into the next.", "Hard cuts feel blunt and honest; fades feel gentle.", "Sudden silence from a hard cut grabs attention instantly.", "audio", "Hard cut the party noise to silence when the phone rings."]);
  c("voiceEffect", "Voice effect", "audio-mix", "Changing how a voice sounds (CapCut's voice effects and changer).", [
    S("Voice effect", ["natural", "robot", "high", "deep", "echo", "radio", "megaphone", "underwater"], "Which effect is on.", { unordered: true }),
    ["amount", "Amount", [0, 100, "%"], "How strong it is."],
    ["who", "On whose voice", ["one character", "the narrator", "everyone"], "Who it is applied to.", { unordered: true }],
  ], [1, "A voice through a radio or phone tells the audience where the speaker is.", "A changed voice can make someone monstrous, silly or distant.", "An odd voice pulls the ear instantly.", "audio", "Put the villain's voice through a cheap walkie-talkie for the laugh."]);
  c("sfxHits", "Edited-in sound hits", "audio-mix", "Sound effects added in the edit: whooshes, hits, pops, risers (CapCut's Audio tab).", [
    S("Sound hits", ["none", "sparse", "some", "busy", "wall to wall"], "How many there are."),
    ["kind", "Kind", ["whoosh", "hit", "pop", "swish", "riser", "ding", "record scratch"], "What they sound like.", { unordered: true }],
    ["sync", "Lands on", ["loose", "the action", "the cuts"], "What they are timed to."],
  ], [1, "A riser tells the audience something is about to happen.", "Cartoon hits say the film is playing; none says it is real.", "A hit on a cut punches the moment into the audience.", "audio", "Put a record scratch on the moment everything stops."]);
  c("loudness", "Loudness", "audio-mix", "How loud the whole mix is, and how clean (CapCut's audio meters peak at 0 dB).", [
    S("Loudness", ["quiet", "normal", "loud", "peaking"], "The overall level."),
    ["peak", "Peak", [-24, 0, "dB"], "The loudest point of the mix."],
    ["noise", "Noise reduction", [0, 100, "%"], "How much background hiss is removed."],
  ], [1, "A scene getting louder drives toward a peak.", "Quiet is intimacy; loud is chaos.", "A sudden drop in loudness makes the audience lean in.", "audio", "Drop the whole mix to a whisper right before the shout."]);
  c("voiceover", "Voice-over", "audio-mix", "A voice speaking over the picture (CapCut's text to speech, Final Cut's voiceover recording).", [
    S("Voice-over", ["none", "now and then", "running"], "How much there is."),
    ["voice", "Whose voice", ["a character", "a narrator", "an AI voice"], "Who speaks it.", { unordered: true }],
    ["truth", "Can we trust it", ["true", "half true", "the picture says otherwise"], "Whether the picture agrees with the voice."],
  ], [3, "A narrator can skip time, explain, or set a question the film then answers.", "A voice that the picture contradicts is a theme of self-deception.", "When the voice and the picture disagree, the audience watches closely to learn the truth.", "thought", "Have the narrator say 'and it all went perfectly' over the disaster."]);

  /* ---------- Layers, masks & effects ---------- */
  c("overlay", "Overlay", "layers", "A clip laid over the main clip: a cutaway while the sound carries on, picture in picture, split screen (CapCut's Overlay, Final Cut's connected clips).", [
    S("Overlay", ["none", "cutaway over the sound", "picture in picture", "split screen", "full overlay"], "What sits on top.", { unordered: true }),
    ["size", "Size", [10, 100, "%"], "How much of the frame it covers."],
    ["position", "Position", ["left", "right", "corner", "center"], "Where it sits.", { unordered: true }],
    ["opacity", "Opacity", [0, 100, "%"], "How see-through it is."],
  ], [2, "A cutaway while someone talks shows what they mean, or what they are hiding.", "Split screen sets two people, or two truths, side by side.", "Two pictures at once make the audience compare them.", "visual", "Split the screen between two people describing the same date very differently."]);
  c("blendMode", "Blend mode", "layers", "How an overlay mixes with what's under it (Final Cut and CapCut's blend modes).", [
    S("Blend mode", ["normal", "screen", "multiply", "overlay", "lighten", "darken", "add"], "The mixing rule.", { unordered: true }),
    ["opacity", "Opacity", [0, 100, "%"], "How strong the top layer is."],
    ["layers", "Layers", [1, 6, "layers"], "How many layers are stacked."],
  ], [0, "Blend modes rarely move the plot; they make double exposures and dreams.", "Two images melted together say two things are one.", "A ghostly double image makes the audience search both.", "visual", "Melt the face of the person they miss into the window."]);
  c("cutout", "Cutout and green screen", "layers", "Taking the background away from a person: green screen, auto cutout, scene removal (CapCut's Auto cutout, Final Cut's keyer).", [
    S("Cutout", ["none", "green screen", "auto cutout", "shape mask", "drawn mask"], "How the background is removed.", { unordered: true }),
    ["edge", "Edge softness", [0, 100, "%"], "How soft the outline is."],
    ["newBack", "New background", ["none", "solid color", "a new place", "blurred", "an image"], "What replaces it.", { unordered: true }],
  ], [1, "Putting a person in a new place without them moving can show a daydream or a lie.", "A cut-out person looks pasted on, alone in their own world.", "A fake background is a visual joke the audience spots right away.", "visual", "Put the character in front of an obviously fake beach as they describe their vacation."]);
  c("maskShape", "Mask", "layers", "A shape that limits where an effect or a layer shows (Final Cut's shape, vignette, gradient and magnetic masks).", [
    S("Mask", ["none", "vignette", "circle", "rectangle", "gradient", "drawn", "follows a person"], "The shape.", { unordered: true }),
    ["feather", "Feather", [0, 100, "%"], "How soft its edge is."],
    ["invert", "Shows", ["inside", "outside"], "Whether the effect shows inside or outside it."],
  ], [1, "A circle mask closing in ends a scene the old-fashioned way.", "Masking off the world shows what a character can't see.", "A mask points the eye at what is left uncovered.", "visual", "Close an iris on the character's face as they realize the truth."]);
  c("tracking", "Tracking", "layers", "Text, a sticker, a mask or the frame following something that moves (CapCut's tracking, Final Cut's object tracker).", [
    S("Tracking", ["none", "text follows", "sticker follows", "mask follows", "frame follows"], "What follows the moving thing.", { unordered: true }),
    ["smooth", "Smoothness", [0, 100, "%"], "How smoothly it follows."],
    ["target", "Follows", ["a face", "a body", "an object"], "What it is locked to.", { unordered: true }],
  ], [1, "A label following someone keeps the audience sure who matters in a crowd.", "Tracking a person picks them out of the world.", "Something stuck to a person pulls the eye with them.", "visual", "Stick a floating label on the one guest who is lying."]);
  c("videoEffect", "Video effect", "layers", "An effect over the whole picture or a body (CapCut's Effects tab: video effects and body effects).", [
    S("Video effect", ["none", "glow", "blur", "glitch", "old TV", "shake", "flash", "zoom pulse", "light leak", "mirror", "outline"], "Which effect is on.", { unordered: true }),
    ["intensity", "Intensity", [0, 100, "%"], "How strong it is."],
    ["onBeat", "Pulses", ["steady", "on the beat"], "Whether it pulses with the music."],
    ["body", "On a body", ["no", "outline glow", "trail", "smooth skin"], "A body effect on a person.", { unordered: true }],
  ], [1, "A glitch can show a mind breaking, or a world that isn't what it seems.", "Effects say the film is a made thing, not a window.", "A flash or shake is a jolt the audience can't ignore.", "visual", "Glitch the picture each time the character lies."]);

  /* ---------- Frame & canvas ---------- */
  c("reframe", "Punch-in and reframe", "canvas", "Zooming into the picture in the edit: a punch-in, or a slow drift across a still (Final Cut's Ken Burns, CapCut's scale).", [
    S("Reframe", ["full frame", "slight punch-in", "strong punch-in", "slow drift"], "How the frame is pushed."),
    ["zoom", "Zoom", [100, 200, "%", 5], "How far in."],
    ["drift", "Drift toward", ["left", "right", "up", "down", "the face"], "Which way a drift travels.", { unordered: true }],
  ], [2, "A punch-in on a reaction tells the audience this is the moment to watch.", "Punching in is the editor raising an eyebrow.", "A sudden jump closer is a jolt that lands the joke.", "visual", "Punch in on the face the moment the character realizes, with no sound."]);
  c("imageTransform", "Mirror and rotate", "canvas", "Flipping, rotating or tilting the picture (CapCut's Mirror, Rotate and Crop).", [
    S("Transform", ["as shot", "mirrored", "flipped", "rotated", "tilted"], "What is done to the picture.", { unordered: true }),
    ["angle", "Rotation", [-180, 180, "°", 5], "How far it is turned."],
    ["crop", "Crop", [0, 50, "%"], "How much is cut off the sides."],
  ], [0, "Flipping a shot can fix which way a person faces so the scene reads clearly.", "An upside-down picture shows a world turned over.", "A tilted or flipped frame says something is off.", "visual", "Turn the picture upside down when the character's world falls apart."]);
  c("stabilization", "Steadying", "canvas", "How much camera shake is smoothed out in the edit (Final Cut's stabilization and rolling shutter fix).", [
    S("Steadying", ["shaky as shot", "a little steadier", "smooth", "locked"], "How steady the result is."),
    ["amount", "Amount", [0, 100, "%"], "How much smoothing."],
    ["rollingShutter", "Wobble fix", ["off", "on"], "Fixes the jelly wobble of fast moves."],
  ], [0, "Steadying keeps the audience on the story, not on the shake.", "Leaving the shake in keeps the moment raw and real.", "Smooth footage lets the eye rest on faces.", "movement", "Steady the calm scenes and leave the shake in when the panic starts."]);
  c("canvasFill", "Canvas edges", "canvas", "What fills the frame when the clip doesn't fit it: black bars, a blurred copy, a color (CapCut's canvas and Ratio).", [
    S("Edges", ["black bars", "blurred copy", "a color", "a pattern"], "What fills the empty edges.", { unordered: true }),
    ["blur", "Blur", [0, 100, "%"], "How blurred the copy is."],
    ["ratio", "Frame shape", ["wide 16:9", "vertical 9:16", "square 1:1", "cinema 2.39"], "The project's frame shape.", { unordered: true }],
  ], [0, "Edges rarely move the plot, but the frame shape decides where the film will be watched.", "A vertical frame feels personal, like a phone; a wide one feels like cinema.", "Busy edges steal the eye; black ones give it back to the middle.", "visual", "Switch the scene that is a phone video to vertical."]);

  /* ---------- Suites ---------- */
  const suite = (id, label, workspace, plain, members) => DB.suite({ id, label, plain, workspace, members, source: SRC });
  suite("viral-edit", "Viral edit", "speed", "The fast phone-video style CapCut is known for: punch-ins, jump cuts, big captions, sound hits, cuts on the beat.", [
    { curiosity: "reframe", value: "strong punch-in" },
    { curiosity: "jumpCut", value: "rhythmic" },
    { curiosity: "captions", value: "word by word" },
    { curiosity: "sfxHits", value: "busy" },
    { curiosity: "beatSync", value: "on beats" },
  ]);
  suite("classic-dissolve", "Classic and gentle", "transitions", "Slow dissolves, a warm film look, music level with the voices.", [
    { curiosity: "transitionKind", value: "cross dissolve" },
    { curiosity: "transitionKind", slider: "duration", value: 1.5 },
    { curiosity: "filterLook", value: "warm film" },
    { curiosity: "musicLevel", value: "even" },
  ]);
  suite("music-video-cut", "Music video", "speed", "Cuts on the bars, flashes and pulses with the beat, music over everything.", [
    { curiosity: "beatSync", value: "on bars" },
    { curiosity: "videoEffect", value: "flash" },
    { curiosity: "videoEffect", slider: "onBeat", value: "on the beat" },
    { curiosity: "transitionKind", value: "flash" },
    { curiosity: "musicLevel", value: "music only" },
  ]);
  suite("documentary-edit", "Documentary", "layers", "Cutaways over the interview, a running voice-over, captions, steady footage, lower thirds.", [
    { curiosity: "overlay", value: "cutaway over the sound" },
    { curiosity: "voiceover", value: "running" },
    { curiosity: "captions", value: "every line" },
    { curiosity: "stabilization", value: "smooth" },
    { curiosity: "onScreenText", value: "lower third" },
  ]);
  suite("comedy-punch-edit", "Comedy punch", "titles", "The editor's jokes: a punch-in, a sound hit, a short freeze, a sound word, a reaction sticker.", [
    { curiosity: "reframe", value: "strong punch-in" },
    { curiosity: "sfxHits", slider: "kind", value: "hit" },
    { curiosity: "freezeFrame", value: "short freeze" },
    { curiosity: "onScreenText", value: "sound word" },
    { curiosity: "stickers", value: "one" },
  ]);
  suite("dream-edit", "Dream sequence", "grade", "Dissolves, a dreamy filter, slow motion, soft texture, a vignette.", [
    { curiosity: "transitionKind", value: "cross dissolve" },
    { curiosity: "filterLook", value: "dreamy" },
    { curiosity: "clipSpeed", value: "slow" },
    { curiosity: "texture", value: "soft" },
    { curiosity: "maskShape", value: "vignette" },
  ]);
  suite("silent-film-edit", "Silent film", "grade", "Black and white, sped up, title cards, grain, fades at both ends.", [
    { curiosity: "filterLook", value: "black and white" },
    { curiosity: "clipSpeed", value: "fast" },
    { curiosity: "onScreenText", value: "title card" },
    { curiosity: "texture", value: "gritty" },
    { curiosity: "fadeEdge", value: "both" },
  ]);
  suite("trailer-edit", "Trailer", "speed", "Speeding up then stopping, fades to black between beats, risers, title cards.", [
    { curiosity: "pacingCurve", value: "speeds up then stops" },
    { curiosity: "transitionKind", value: "fade to black" },
    { curiosity: "sfxHits", slider: "kind", value: "riser" },
    { curiosity: "onScreenText", value: "title card" },
  ]);

  /* ---------- Proximities ---------- */
  const prox = (id, label, workspace, when, then, within, also) => DB.proximity({ id, label, plain: label + (within ? ` within ${within} beat${within === 1 ? "" : "s"}.` : " at once."), workspace, also: also || [], when, then, within, source: SRC });
  prox("payoff-punch-in", "When the joke pays off, the editor punches in", "canvas", { curiosity: "comicBeat", is: "payoff lands" }, { curiosity: "reframe", change: "rises" }, 0, ["comedy"]);
  prox("payoff-sound-hit", "When the joke pays off, a sound hit lands", "audio-mix", { curiosity: "comicBeat", is: "payoff lands" }, { curiosity: "sfxHits", change: "rises" }, 0, ["comedy"]);
  prox("slowmo-music", "When the clip slows down, the music rises", "audio-mix", { curiosity: "clipSpeed", is: "slow" }, { curiosity: "musicLevel", change: "rises" }, 0, ["speed"]);
  prox("fast-cuts-plain", "When cutting gets fast, transitions become plain cuts", "transitions", { curiosity: "cutRate", is: "fast" }, { curiosity: "transitionKind", is: "cut" }, 0, ["camera-motion"]);
  prox("dream-dissolve", "When the feeling turns dreamlike, shots dissolve", "transitions", { curiosity: "emotion", is: "dreamlike" }, { curiosity: "transitionKind", is: "cross dissolve" }, 1, ["lines"]);
  prox("featured-music-beat", "When the music is featured, the cuts find the beat", "speed", { curiosity: "music", is: "featured" }, { curiosity: "beatSync", change: "rises" }, 0, ["music"]);
  prox("freeze-title", "When the picture freezes, a title appears", "titles", { curiosity: "freezeFrame", is: "freeze with a title" }, { curiosity: "onScreenText", is: "title card" }, 0, ["speed"]);
  prox("rewind-sound", "When the clip rewinds, a sound hit plays", "audio-mix", { curiosity: "playDirection", is: "rewind and replay" }, { curiosity: "sfxHits", change: "rises" }, 0, ["speed"]);
  prox("impact-flash", "When impacts rise, the picture flashes", "layers", { curiosity: "impacts", change: "rises" }, { curiosity: "videoEffect", is: "flash" }, 0, ["effects"]);
  prox("stop-fade-out", "When the pace speeds up then stops, the scene fades out", "transitions", { curiosity: "pacingCurve", is: "speeds up then stops" }, { curiosity: "fadeEdge", is: "fade out" }, 1, ["speed"]);
  prox("jumpcut-laugh", "When jump cuts go rhythmic, a joke builds", "speed", { curiosity: "jumpCut", is: "rhythmic" }, { curiosity: "comicBeat", change: "rises" }, 2, ["comedy"]);
  prox("sign-tracks", "When text labels something, it follows it", "layers", { curiosity: "onScreenText", is: "sign or label" }, { curiosity: "tracking", is: "text follows" }, 0, ["titles"]);
  prox("cutaway-music-under", "When a cutaway covers the talking, the music sits under", "audio-mix", { curiosity: "overlay", is: "cutaway over the sound" }, { curiosity: "musicLevel", is: "under" }, 0, ["layers"]);
  prox("handheld-steady-off", "When the camera goes handheld, the shake is left in", "canvas", { curiosity: "cameraCarry", is: "handheld" }, { curiosity: "stabilization", is: "shaky as shot" }, 0, ["camera-motion"]);

  /* ---------- Proximity suites ---------- */
  const ps = (id, label, workspace, plain, members) => DB.proximitySuite({ id, label, plain, workspace, members, source: SRC });
  ps("editor-jokes", "The editor tells the joke", "canvas", "When the joke pays off the editor punches in and a sound hits; rhythmic jump cuts build the next joke; a rewind gets its own sound.", ["payoff-punch-in", "payoff-sound-hit", "jumpcut-laugh", "rewind-sound"]);
  ps("music-leads-the-edit", "Music leads the edit", "speed", "Featured music pulls the cuts onto the beat, slow motion lifts the music, and a scene that races then stops fades out.", ["featured-music-beat", "slowmo-music", "stop-fade-out"]);
  ps("words-on-screen", "Words that point", "titles", "A freeze brings a title, and a label follows what it names.", ["freeze-title", "sign-tracks"]);

  /* ---------- CapCut's effect and transition families (Jeremy's second set of screenshots, 2026-10-02) ----------
     CapCut sorts its Transitions and Effects tabs into families (Classic, Light, Movement, Blur, Mask, Slide...;
     Motion, 3D, Light, Retro, Glitch, Distortion, Texture, Comics...; and body effects such as Clone, Glowing
     lines, Superpowers, Mood). Each family a filmmaker reaches for is a curiosity with its own sliders; the
     effect's name in CapCut is just one setting of it. */
  c("transitionFamily", "Transition family", "transitions", "Which family of transition crosses the cut, sorted the way CapCut's Transitions tab sorts them.", [
    S("Family", ["basic", "slide", "movement", "blur", "light", "overlay", "mask", "3D", "glitch", "whimsical", "classic", "pixel bead"], "The family of transition.", { unordered: true }),
    ["energy", "Energy", ["calm", "lively", "punchy", "explosive"], "How much force it hits with."],
    ["flash", "Flash", ["none", "light leak", "white flash", "light bars"], "Light thrown across the cut."],
    ["motionBlur", "Motion blur", [0, 100, "%"], "How smeared the move is."],
  ], [2, "A punchy transition family says the story just jumped; a calm one says it flowed.", "Light and blur transitions feel like memory; slides and pushes feel like moving on.", "A hard-hitting transition jolts the audience into the next scene.", "visual", "Use the calmest family inside a scene and save the explosive one for the jump to a new place."]);
  c("introOutro", "Intro and outro effect", "transitions", "How the film or a scene opens and closes: an opening arc, a swirl in, a light fall, a slam, a fade (CapCut's Intro & Outro effects and Intro&End clips).", [
    S("Intro and outro", ["none", "opening arc", "swirl in", "light fall", "slam in", "smooth scroll", "end card"], "The effect at the start or end.", { unordered: true }),
    ["where", "Where", ["film start", "scene start", "scene end", "film end"], "Which edge it sits on.", { unordered: true }],
    ["length", "Length", [0, 5, "seconds", 0.5], "How long it lasts."],
  ], [2, "An opening effect promises what kind of ride this is; an outro tells the audience it is over, or not quite.", "A playful opening sets a playful film.", "The first second decides whether a viewer keeps watching.", "visual", "Open on a slam and end on a slow fade, so the film feels like it calmed down."]);
  c("videoEffectFamily", "Effect family", "layers", "Which family of video effect is laid over the picture, sorted the way CapCut's Effects tab sorts them.", [
    S("Family", ["none", "classic", "whimsical", "motion", "3D", "light", "edits", "retro", "glitch", "distortion", "decor", "screen", "sparkle", "texture", "comics", "party", "pet", "magic cutout", "wild pics"], "The family of effect.", { unordered: true }),
    ["intensity", "Intensity", [0, 100, "%"], "How strong it is."],
    ["spread", "Covers", ["a corner", "around the subject", "the whole frame"], "How much of the frame it covers."],
    ["onBeat", "Pulses", ["steady", "on the beat"], "Whether it pulses with the music."],
  ], [1, "A change of effect family can mark a new chapter: retro for the past, glitch for a breakdown, comics for a fantasy.", "The effect family is the film's attitude worn on its surface.", "A new effect makes the eye re-read the whole frame.", "visual", "Switch to the comics family for the daydream and snap back to clean picture when it ends."]);
  c("cameraEffect", "Fake camera move", "canvas", "A camera move added in the edit, not shot: slam zoom, zoom lens, sway, shake, radial blur, tracking (CapCut's Motion effects).", [
    S("Move", ["none", "slam zoom", "zoom lens", "gentle sway", "subtle shake", "wobble", "radial blur", "tracking shot", "camera roll"], "Which move is added.", { unordered: true }),
    ["strength", "Strength", [0, 100, "%"], "How big the move is."],
    ["speed", "Speed", ["slow", "medium", "fast"], "How fast it moves."],
  ], [2, "A slam zoom tells the audience this beat is the one that matters.", "A fake move gives a still shot a heartbeat; a shake says something hit.", "Sudden movement grabs the eye instantly.", "movement", "Slam zoom on the face the instant the bad news lands."]);
  c("multiplyEffect", "Copies of the picture", "layers", "The picture split into copies: a grid, a polaroid stack, spinning copies, a gallery wall, a cube (CapCut's Wild Pics and 3D effects).", [
    S("Copies", ["none", "split copies", "polaroid stack", "spinning copies", "grid", "gallery wall", "cube"], "How the picture is multiplied.", { unordered: true }),
    ["count", "How many", [1, 16, "copies"], "How many copies show."],
    ["motion", "Motion", ["still", "drifting", "spinning", "on the beat"], "How the copies move."],
  ], [1, "Copies of one moment can show it repeating in a character's head.", "A wall of copies says sameness, obsession or fame.", "Many copies at once make the eye search for the difference.", "visual", "Multiply the embarrassing moment into a grid as the character replays it in their mind."]);
  c("lightEffect", "Light effect", "layers", "Light added over the picture: god rays, a flare, a halo, a light leak, lightning, a burn (CapCut's Light effects).", [
    S("Light effect", ["none", "god rays", "sun flare", "halo", "light leak", "blaze burst", "lightning", "film burn"], "Which light is added.", { unordered: true }),
    ["strength", "Strength", [0, 100, "%"], "How bright it is."],
    ["warmth", "Warmth", ["cool", "neutral", "warm", "golden"], "Its color."],
  ], [1, "A halo or god rays can crown the moment someone is forgiven or chosen.", "Light from nowhere makes a moment sacred, magical or remembered.", "The brightest thing in the frame pulls the eye, so added light points.", "visual", "Give the villain a halo for the moment they pretend to be good."]);
  c("textureEffect", "Texture effect", "grade", "A surface laid over the picture: torn frames, wrinkled paper, grain, a silkscreen, dual tone, a polaroid border (CapCut's Texture and Retro effects).", [
    S("Texture", ["none", "torn paper", "wrinkled paper", "grain", "silkscreen dots", "dual tone", "polaroid", "old film"], "Which surface.", { unordered: true }),
    ["strength", "Strength", [0, 100, "%"], "How strong it is."],
    ["edges", "Edges", ["clean", "torn", "burned"], "What the frame's edges look like."],
  ], [1, "A paper texture can turn a scene into a scrapbook, a letter or a memory.", "Handmade textures make the film feel personal and crafted, like a zine.", "A rough edge frames the picture and draws the eye inward.", "visual", "Lay torn paper over every flashback, like pages from a diary."]);
  c("bodyEffect", "Body effect", "layers", "An effect that follows a person's body: a clone trail, glowing lines, an outline, superpowers, a hallucination (CapCut's Body effects).", [
    S("Body effect", ["none", "clone trail", "glowing lines", "outline", "superpower", "hallucination", "portrait glow"], "Which effect is on the person.", { unordered: true }),
    ["who", "On whom", ["the main character", "another character", "everyone"], "Who wears it.", { unordered: true }],
    ["intensity", "Intensity", [0, 100, "%"], "How strong it is."],
  ], [1, "Glowing lines around one person single them out as the one who matters now.", "A body effect shows the inside of a person on the outside: power, panic, fame.", "Something moving with a person keeps the eye on them.", "movement", "Give the character a clone trail as they rush around trying to do everything at once."]);
  c("moodEffect", "Mood sticker on a face", "titles", "A cartoon mood stuck to a face: red cheeks, tears, hearts, a light bulb, steam, a halo of confusion, a soul leaving, a mallet (CapCut's Mood body effects).", [
    S("Mood", ["none", "sunny", "loved", "struck", "bright idea", "red face", "sad tears", "shy", "confused", "departing soul", "cool", "angry steam", "laughing till crying", "mallet bonk", "crackling"], "Which mood is drawn on the face.", { unordered: true }),
    ["size", "Size", ["small", "medium", "big"], "How big it is drawn."],
    ["timing", "Timing", ["before the line", "on the line", "after the line"], "When it pops on."],
  ], [2, "A drawn mood tells the audience exactly how a character took what just happened.", "Cartoon moods make the film wink at itself.", "A face suddenly decorated is impossible not to look at.", "visual", "Pop a departing soul out of the character a beat after the insult."]);

  suite("reaction-comedy-edit", "Reaction comedy", "titles", "A cartoon mood on the face, a fake slam zoom, a sound hit and a short freeze, the way phone comedy lands a reaction.", [
    { curiosity: "moodEffect", value: "departing soul" },
    { curiosity: "cameraEffect", value: "slam zoom" },
    { curiosity: "sfxHits", slider: "kind", value: "hit" },
    { curiosity: "freezeFrame", value: "short freeze" },
  ]);
  suite("zine-scrapbook", "Zine scrapbook", "grade", "Torn paper, polaroid copies, stickers and a handwritten title: the film as a scrapbook.", [
    { curiosity: "textureEffect", value: "torn paper" },
    { curiosity: "multiplyEffect", value: "polaroid stack" },
    { curiosity: "stickers", value: "a few" },
    { curiosity: "textStyle", value: "handwritten" },
  ]);
  suite("heavenly-light", "Heavenly light", "layers", "God rays, a golden warmth, a slow light-leak transition and a soft texture.", [
    { curiosity: "lightEffect", value: "god rays" },
    { curiosity: "lightEffect", slider: "warmth", value: "golden" },
    { curiosity: "transitionFamily", value: "light" },
    { curiosity: "texture", value: "soft" },
  ]);
  suite("party-edit", "Party edit", "layers", "Party and sparkle effects pulsing on the beat, spinning copies, punchy transitions.", [
    { curiosity: "videoEffectFamily", value: "party" },
    { curiosity: "videoEffectFamily", slider: "onBeat", value: "on the beat" },
    { curiosity: "multiplyEffect", value: "spinning copies" },
    { curiosity: "transitionFamily", slider: "energy", value: "punchy" },
  ]);

  prox("payoff-mood-face", "When the joke pays off, a mood pops onto a face", "titles", { curiosity: "comicBeat", is: "payoff lands" }, { curiosity: "moodEffect", change: "changes" }, 0, ["comedy"]);
  prox("angry-steam", "When someone gets angry, steam pops onto their face", "titles", { curiosity: "emotion", is: "angry" }, { curiosity: "moodEffect", is: "angry steam" }, 0, ["lines"]);
  prox("dreamlike-halo", "When the feeling turns dreamlike, light blooms", "layers", { curiosity: "emotion", is: "dreamlike" }, { curiosity: "lightEffect", is: "halo" }, 1, ["lines"]);
  prox("impact-slam-zoom", "When impacts rise, the editor slam zooms", "canvas", { curiosity: "impacts", change: "rises" }, { curiosity: "cameraEffect", is: "slam zoom" }, 0, ["effects"]);
  prox("featured-music-pulse", "When the music is featured, the effects pulse on the beat", "layers", { curiosity: "music", is: "featured" }, { curiosity: "videoEffectFamily", slider: "onBeat", is: "on the beat" }, 0, ["music"]);
  prox("scene-end-outro", "When the pace races then stops, an outro effect closes it", "transitions", { curiosity: "pacingCurve", is: "speeds up then stops" }, { curiosity: "introOutro", change: "changes" }, 0, ["speed"]);
  ps("phone-comedy-reactions", "Phone comedy reactions", "titles", "The joke pays off and a mood pops onto a face, anger brings steam, and an impact brings a slam zoom.", ["payoff-mood-face", "angry-steam", "impact-slam-zoom"]);

  /* ---------- CapCut batch 3 (Jeremy, 2026-10-02 18:00Z): Body, Video, Filters, Adjustment, Templates, AI avatar,
     the Library and the Record panel. Names in the scales are plain descriptions of CapCut's effect names. ---------- */
  c("superpowerEffect", "Superpower effect", "layers", "A power drawn onto a person: light trails, flaming or electric eyes, laser eyes, lightning, speed streaks, horns (CapCut's Superpowers body effects).", [
    S("Superpower", ["none", "light trails", "flame eyes", "electric eyes", "laser eyes", "lightning", "speed streaks", "flaming horns", "roaring tiger", "outline scan", "face glitch", "violet galaxy"], "Which power shows.", { unordered: true }),
    ["who", "On whom", ["the main character", "another character", "everyone"], "Who has it.", { unordered: true }],
    ["shape", "How it comes", ["builds up", "bursts on", "stays on"], "How it arrives."],
    ["intensity", "Intensity", [0, 100, "%"], "How strong it is."],
  ], [2, "Eyes lighting up says a character has just decided to fight back.", "A drawn superpower shows how a person feels inside: unstoppable, furious, chosen.", "Light on a face pulls every eye to it.", "visual", "Give the meekest character laser eyes for one second when they finally say no."]);
  c("hallucinationEffect", "Hallucination effect", "layers", "The world bending around a person: vortex rings, a stellar burst, endless travel, a spinning axis, fire wisps, a melting figure (CapCut's Hallucination body effects).", [
    S("Hallucination", ["none", "vortex rings", "stellar burst", "one-way shift", "rotating swing", "infinite travel", "axis rotation", "fire wisps", "electric current", "absorption", "molten figure", "spin bounce"], "Which vision.", { unordered: true }),
    ["intensity", "Intensity", [0, 100, "%"], "How strong it is."],
    ["length", "Length", [0, 5, "seconds", 0.5], "How long it lasts."],
  ], [2, "A hallucination tells the audience we are inside a character's head now.", "When the world bends, the film admits the character's grip on reality is slipping.", "Moving patterns grab the eye and hold it in the center.", "movement", "Let the room spin into vortex rings the moment the character hears the bad news."]);
  c("cloneEffect", "Copies of a person", "layers", "A person repeated: a clone trail, ninja doubles, an X of copies, a burst of fragments, a phantom (CapCut's Clone body effects).", [
    S("Copies", ["none", "clone trail", "ninja doubles", "X clone", "clone burst", "fragment clone", "phantom"], "How the person is copied.", { unordered: true }),
    ["count", "How many", [1, 8, "copies"], "How many copies show."],
    ["delay", "Lag", ["together", "a little behind", "far behind"], "How far behind the copies follow."],
  ], [1, "A person split into copies can show them pulled in many directions at once.", "Copies of yourself are a picture of a busy or divided mind.", "Many copies of one person make the eye count them.", "movement", "Split the host into ninja doubles while they try to answer every phone at once."]);
  c("outlineEffect", "Outline and glow on a person", "layers", "A line or glow drawn around a person: glowing lines, a sparkle edge, a rainbow edge, a paper or hand-drawn stroke, a flame outline, an aura (CapCut's Glowing lines, Stroke and Pro body effects).", [
    S("Outline", ["none", "glowing lines", "sparkle edge", "rainbow edge", "paper stroke", "hand-drawn", "flame outline", "aura", "figure glare"], "Which line or glow.", { unordered: true }),
    ["thickness", "Thickness", ["thin", "medium", "thick"], "How thick the line is."],
    ["color", "Color", ["white", "gold", "neon", "rainbow", "the character's color"], "What color it is.", { unordered: true }],
  ], [1, "An outline singles out the one person this moment is about.", "A glow says special; a hand-drawn line says this is a story someone is telling.", "A bright edge separates a person from the background and pulls the eye.", "visual", "Draw a paper stroke around the kid in every scene where they feel like an outsider."]);
  c("retroEffect", "Retro look", "grade", "The film made to look like an old format: VHS tape, an old projector, flicker, noise, a burned edge, home video (CapCut's Retro video effects).", [
    S("Retro look", ["none", "VHS tape", "retro film", "projector", "retro flicker", "nostalgic light", "chalk graffiti", "white noise", "black noise", "pink burn", "old film", "home video"], "Which old format.", { unordered: true }),
    ["era", "Era", ["1920s", "1950s", "1970s", "1980s", "1990s", "2000s"], "When it seems to be from."],
    ["wear", "Wear", [0, 100, "%"], "How worn and damaged it looks."],
  ], [2, "A retro look tells the audience this is the past, a memory or found footage.", "Old formats bring nostalgia, or the creepiness of a tape no one should have found.", "Flicker and noise make the audience lean in to see what is there.", "visual", "Shoot the parents' love story as worn VHS tape and the present day clean."]);
  c("glitchEffect", "Glitch", "layers", "The picture breaking: split colors, shaking glitch, digital blocks, scanner burn, a cold shadow (CapCut's Glitch video effects).", [
    S("Glitch", ["none", "split colors", "shaky glitch", "black and white glitch burn", "70s glitch", "cult classic", "glitch cutter", "spooky camera", "cyber fright", "glitchy digits", "color quake", "grunge grime"], "Which glitch.", { unordered: true }),
    ["intensity", "Intensity", [0, 100, "%"], "How badly it breaks."],
    ["often", "How often", ["once", "now and then", "constantly"], "How often it hits."],
  ], [2, "A glitch says something is wrong: a lie, a breakdown, a broken world.", "The picture breaking is the film showing a mind or a system breaking.", "A sudden break jolts the audience to attention.", "visual", "Glitch the frame for a split second every time the character lies."]);
  c("distortionEffect", "Distortion", "layers", "The picture bent or smeared: ripples, a strong blur, turning to stardust, mist, a shaky outline, glassy swirls (CapCut's Distortion video effects).", [
    S("Distortion", ["none", "ripple", "power blur", "insistent blur", "into stardust", "mist dissipates", "shaky outline", "water shine", "ripple warp", "glassy stir", "projector clones"], "How it bends.", { unordered: true }),
    ["strength", "Strength", [0, 100, "%"], "How bent it is."],
    ["settles", "Then", ["stays bent", "settles back"], "Whether it returns to normal."],
  ], [1, "A ripple can carry the audience into a dream or a memory and back out.", "Bent pictures show a world that is unsteady or unreal.", "Movement across the whole frame makes the audience wait for it to clear.", "movement", "Ripple into the flashback and let it settle back when we return."]);
  c("partyEffect", "Party flash", "layers", "Flashing and pulsing for energy: flashes, a shockwave, a spotlight, strobe pulses, jitters, black flashes, party beats (CapCut's Party video effects).", [
    S("Party flash", ["none", "flash", "flashy dance", "pulse", "vibration flash", "shockwave", "spotlight expands", "cross flash", "strobe pulse", "vertical jitters", "black flash", "party beats"], "Which flash.", { unordered: true }),
    ["onBeat", "Timing", ["free", "on the beat"], "Whether it hits with the music."],
    ["strength", "Strength", [0, 100, "%"], "How bright and strong it is."],
  ], [1, "A shockwave on an entrance announces that someone important has arrived.", "Flashing says party, energy and youth, or panic when it goes too far.", "Flashes grab attention, so use them where the audience should look.", "visual", "Hit a shockwave the moment the guest of honor walks in."]);
  c("frameMove3D", "3D frame move", "canvas", "The whole frame moved in 3D: a cube spin, a shattering mirror, an earth zoom, a door opening, a gallery wheel, a phone showcase (CapCut's 3D and Motion video effects).", [
    S("3D move", ["none", "cube spin", "shatter mirror", "earth zoom", "unfurl", "phone showcase", "wheel gallery", "floating widgets", "door opens", "mosaic zoom"], "Which move.", { unordered: true }),
    ["speed", "Speed", ["slow", "medium", "fast"], "How fast it moves."],
  ], [2, "A 3D move is a showy jump to a new place, a new chapter or a big reveal.", "Moving the whole frame says the film is a made thing, playful and proud of it.", "A spinning frame makes the audience wait for what is on the other side.", "movement", "Use an earth zoom to jump from the bedroom to the other side of the world."]);
  c("stockClip", "Stock clip", "layers", "A ready-made clip from a library: green screen, a background, an intro or end card, scenery, atmosphere, everyday life (CapCut's Library). CapCut warns not to export library clips that were not edited in the app.", [
    S("Stock clip", ["none", "green screen", "background", "intro or end card", "scenery", "atmosphere", "everyday life", "transition clip"], "Which kind of library clip.", { unordered: true }),
    ["use", "Used as", ["the background", "a cutaway", "laid over the top"], "Where it sits in the picture.", { unordered: true }],
    ["length", "Length", [0, 30, "seconds", 1], "How long it runs."],
  ], [0, "A scenery clip can say where we are now without a word.", "Stock footage can be played straight or used as a joke about cheap filmmaking.", "A new place on screen makes the audience look around.", "visual", "Cut to cheesy stock footage of a sunrise whenever the narrator gets too sentimental."]);
  c("endCard", "End card", "titles", "A card that closes the film or an episode: thank you for watching, to be continued, the end, subscribe (CapCut's Intro&End library).", [
    S("End card", ["none", "thank you for watching", "to be continued", "the end", "subscribe", "thanks"], "Which card.", { unordered: true }),
    ["style", "Style", ["plain", "handwritten", "animated", "old film"], "How it looks.", { unordered: true }],
  ], [2, "To be continued keeps the audience hungry for the next episode.", "An end card tells the audience how to feel about leaving: finished, cliffhung, thanked.", "Words alone on screen are read every time.", "visual", "Freeze on the worst moment and slap on To Be Continued."]);
  c("filterFamily", "Filter family", "grade", "Which shelf the filter comes from, the way CapCut's Filters tab sorts them: featured, life, landscape, portrait, mono, movies, retro, night, cool, warm.", [
    S("Filter family", ["featured", "life", "landscape", "portrait", "mono", "movies", "retro", "night", "cool", "warm"], "Which family.", { unordered: true }),
    ["strength", "Strength", [0, 100, "%"], "How strongly it is laid over."],
  ], [1, "A switch from a warm family to a cool one marks a turn in the story.", "The family of look is the genre the film is borrowing: movie, memory, night out.", "A new look makes the audience re-read the whole picture.", "visual", "Keep the life family for home and jump to the movies family when the dream begins."]);
  c("lut", "LUT (a color recipe)", "grade", "A saved color recipe applied in one go, from CapCut's Adjustment tab (LUT) and Final Cut's Custom LUT effect: a film stock look, teal and orange, bleach bypass, day for night.", [
    S("LUT", ["none", "film stock", "teal and orange", "bleach bypass", "day for night", "warm print", "cool print", "log to normal"], "Which recipe.", { unordered: true }),
    ["strength", "Strength", [0, 100, "%"], "How much of it is applied."],
  ], [1, "One color recipe across a whole storyline ties its scenes together.", "A recipe like bleach bypass makes a world harsh; a warm print makes it kind.", "Color sets the mood before the audience reads anything else.", "visual", "Give each of the two families in the story its own LUT."]);
  c("editTemplate", "Edit template", "speed", "A ready-made edit you drop your clips into, sorted the way CapCut's Templates tab sorts them: cinematic, daily life, selfie, velocity, lyrics, meme, travel, family.", [
    S("Template", ["none", "cinematic", "daily life", "selfie", "velocity", "lyrics", "meme", "travel", "relationship", "friendship", "family", "school life", "business"], "Which kind of template.", { unordered: true }),
    ["clips", "Clips", [1, 12, "clips"], "How many clips it takes."],
  ], [1, "A template carries a whole rhythm, so the scene moves the way that genre of video moves.", "Using a meme template says the film is in on the joke of the internet.", "A familiar template makes the audience expect its punchline.", "movement", "Cut the family argument into a velocity template so it plays like a sports highlight."]);
  c("translatedVoice", "Translated voice", "audio-mix", "Speech translated into another language, with or without the lips matched (CapCut's AI avatar, Video translator).", [
    S("Translated voice", ["original", "translated", "translated with lip sync"], "Whether the voice is translated."),
    ["language", "Into", ["English", "Spanish", "French", "Arabic", "Hindi", "Japanese", "another language"], "Which language.", { unordered: true }],
  ], [0, "A character suddenly speaking another language can reveal where they come from.", "Translation can make a film travel, or be played for a joke when the lips don't match.", "An unexpected language makes the audience listen hard.", "audio", "Let the dubbed lips fall out of sync on purpose when the character is lying."]);
  c("generatedShot", "Generated shot", "layers", "A shot made from a description instead of filmed: an image, a video or a two-person dialogue scene (CapCut's Generate: AI image, AI video, AI dialogue scene). Use only material you have the rights to.", [
    S("Generated shot", ["none", "image", "video", "dialogue scene"], "What is generated."),
    ["length", "Length", [0, 30, "seconds", 1], "How long it is."],
    ["from", "Made from", ["a description", "a picture", "several frames"], "What it starts from.", { unordered: true }],
  ], [0, "A generated shot can fill a gap in the story you could not film.", "Made-up shots let a small film show impossible places.", "A new kind of image makes the audience look closely.", "visual", "Generate the one impossible shot (the house floating away) and film everything else."]);
  c("voiceCleanup", "Voice cleanup", "audio-mix", "Cleaning a recorded voice: taking out the room's echo and making the voice clearer (CapCut's Record panel: Echo reduction and Enhance voice).", [
    S("Cleanup", ["none", "echo reduced", "voice enhanced", "both"], "What was cleaned."),
    ["room", "Room left in", ["none", "a little", "all of it"], "How much of the room's sound stays."],
  ], [0, "A suddenly clean voice can feel like a thought or a confession.", "Leaving the echo in feels real and raw; cleaning it feels polished.", "A clear voice is easier to follow, so the audience stays with it.", "audio", "Leave the bathroom echo in for the pep talk in the mirror."]);
  const mood = DB.data.curiosities.find((x) => x.id === "moodEffect");
  if (mood) mood.also = (mood.also || []).concat("emotion"); /* Body Mood effects feed the Emotion curiosities (shows under Feeling too). */

  suite("superhero-moment", "Superhero moment", "layers", "Electric eyes, a slam zoom, lightning and a hit on the sound: the turn where someone becomes powerful.", [
    { curiosity: "superpowerEffect", value: "electric eyes" },
    { curiosity: "cameraEffect", value: "slam zoom" },
    { curiosity: "lightEffect", value: "lightning" },
    { curiosity: "sfxHits", slider: "kind", value: "hit" },
  ]);
  suite("home-video", "Old home video", "grade", "VHS tape, grain, a faded filter and the 1990s: the film as a family tape.", [
    { curiosity: "retroEffect", value: "VHS tape" },
    { curiosity: "retroEffect", slider: "era", value: "1990s" },
    { curiosity: "textureEffect", value: "grain" },
    { curiosity: "filterLook", value: "faded" },
  ]);
  suite("breakdown", "Breakdown", "layers", "A shaking glitch, a ripple warp and a glitch transition: the picture falling apart with the person.", [
    { curiosity: "glitchEffect", value: "shaky glitch" },
    { curiosity: "distortionEffect", value: "ripple warp" },
    { curiosity: "transitionFamily", value: "glitch" },
    { curiosity: "videoEffectFamily", value: "glitch" },
  ]);
  suite("trippy-vision", "Trippy vision", "layers", "Vortex rings, a glassy swirl, a halo and a dissolve: a dream or a high.", [
    { curiosity: "hallucinationEffect", value: "vortex rings" },
    { curiosity: "distortionEffect", value: "glassy stir" },
    { curiosity: "lightEffect", value: "halo" },
    { curiosity: "transitionKind", value: "cross dissolve" },
  ]);
  suite("cartoon-feelings", "Cartoon feelings", "emotion", "A feeling made loud: the emotion, a big mood drawn on the face, popping on right after the line.", [
    { curiosity: "emotion", value: "absurd" },
    { curiosity: "moodEffect", value: "confused" },
    { curiosity: "moodEffect", slider: "size", value: "big" },
    { curiosity: "moodEffect", slider: "timing", value: "after the line" },
  ]);

  /* Body Mood effects feed the Emotion curiosities, both ways: a feeling brings its mood sticker, and a mood
     sticker moves the feeling's sliders. */
  const FACE = [
    ["loving", "loved", "When someone feels loving, hearts pop onto their face"],
    ["joyful", "sunny", "When someone is joyful, a sun pops onto their face"],
    ["melancholy", "sad tears", "When someone turns sad, tears are drawn on"],
    ["anxious", "shy", "When someone is anxious, they blush"],
    ["fearful", "departing soul", "When someone is scared, their soul leaves their body"],
    ["curious", "bright idea", "When someone gets curious, a light bulb pops on"],
    ["triumphant", "cool", "When someone triumphs, shades pop on"],
    ["absurd", "confused", "When things turn absurd, question marks pop on"],
  ];
  FACE.forEach(([feel, face, label]) => prox("face-" + feel, label, "emotion", { curiosity: "emotion", is: feel }, { curiosity: "moodEffect", is: face }, 0, ["titles"]));
  prox("tears-lower", "When tears are drawn on, the feeling drops", "emotion", { curiosity: "moodEffect", is: "sad tears" }, { curiosity: "emotion", slider: "valence", change: "drops" }, 0, ["titles"]);
  prox("sun-lifts", "When a sun pops onto a face, the feeling lifts", "emotion", { curiosity: "moodEffect", is: "sunny" }, { curiosity: "emotion", slider: "valence", change: "rises" }, 0, ["titles"]);
  prox("steam-winds-up", "When steam pops on, the feeling winds up", "emotion", { curiosity: "moodEffect", is: "angry steam" }, { curiosity: "emotion", slider: "arousal", change: "rises" }, 0, ["titles"]);
  prox("crackle-winds-up", "When a face crackles, the feeling winds up", "emotion", { curiosity: "moodEffect", is: "crackling" }, { curiosity: "emotion", slider: "arousal", change: "rises" }, 0, ["titles"]);
  prox("laugh-tears-laughter", "When someone laughs till they cry, the audience laughs more", "emotion", { curiosity: "moodEffect", is: "laughing till crying" }, { curiosity: "emoRoadFilm", slider: "laughter", change: "rises" }, 1, ["titles", "comedy"]);
  prox("mallet-absurd", "When the mallet bonks, the feeling turns absurd", "emotion", { curiosity: "moodEffect", is: "mallet bonk" }, { curiosity: "emotion", is: "absurd" }, 0, ["titles", "comedy"]);
  prox("triumph-eyes", "When someone triumphs, their eyes light up", "layers", { curiosity: "emotion", is: "triumphant" }, { curiosity: "superpowerEffect", is: "electric eyes" }, 0, ["emotion"]);
  prox("anxious-glitch", "When someone panics, the picture glitches", "layers", { curiosity: "emotion", is: "anxious" }, { curiosity: "glitchEffect", is: "shaky glitch" }, 1, ["emotion"]);
  prox("dreamlike-vortex", "When the feeling turns dreamlike, the room spins", "layers", { curiosity: "emotion", is: "dreamlike" }, { curiosity: "hallucinationEffect", change: "changes" }, 1, ["emotion"]);
  prox("impact-shockwave", "When impacts rise, a shockwave flashes", "layers", { curiosity: "impacts", change: "rises" }, { curiosity: "partyEffect", is: "shockwave" }, 0, ["effects"]);
  prox("music-party-beat", "When the music is featured, the flashes hit the beat", "layers", { curiosity: "music", is: "featured" }, { curiosity: "partyEffect", slider: "onBeat", is: "on the beat" }, 0, ["music"]);
  prox("outro-end-card", "When an outro effect closes the film, an end card follows", "titles", { curiosity: "introOutro", is: "end card" }, { curiosity: "endCard", change: "changes" }, 1, ["transitions"]);
  ps("face-tells-the-feeling", "The face tells the feeling", "emotion", "Every feeling brings its cartoon mood onto the face: hearts, a sun, tears, a blush, a soul leaving, a light bulb, shades, question marks.", FACE.map((f) => "face-" + f[0]));
  ps("mood-moves-the-feeling", "The mood moves the feeling", "emotion", "Mood stickers push the feeling: tears drop it, a sun lifts it, steam and crackles wind it up, a mallet makes it absurd, laughing till crying makes the audience laugh.", ["tears-lower", "sun-lifts", "steam-winds-up", "crackle-winds-up", "laugh-tears-laughter", "mallet-absurd"]);
  ps("effects-show-the-inside", "Effects show the inside", "layers", "What a character feels shows on the picture: triumph lights the eyes, panic glitches the frame, a dream spins the room or blooms with light.", ["triumph-eyes", "anxious-glitch", "dreamlike-vortex", "dreamlike-halo"]);

  /* Loaded after the app's install(): refresh the links the engine reads, so these proximities can be added. */
  if (typeof window !== "undefined" && window.CURIOSITY_LINKS && typeof DB.links === "function") window.CURIOSITY_LINKS = DB.links();
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
