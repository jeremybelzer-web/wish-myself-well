# Questions for Sharani

Jeremy and Claude are building **Curiosities**, an app for making storyboards (and later animation, comics, zines and live action). It breaks a film into **curiosities**, each one a single thing you can look at in a scene: shot size, the clothes, the set, the feeling, the joke, the music. Every curiosity can be set by hand, swept automatically over time, or played live from a MIDI keyboard, pads or something a performer wears. Its heart is **momentum**, the feeling that a film is going somewhere important. The app measures how long the audience's attention rests on one kind of curiosity before something moves it on.

You know how 3D animators, film students and studio teams actually work, and we don't. Short answers are fine, and so are "skip", "wrong question" and "ask me in person". Questions marked ★ matter most.

---

## 1. How animators and filmmakers really work

1. ★ When you start a shot or a sequence, what do you do first, second and third? Is it story notes, a storyboard, an animatic, layout, blocking, or something else?
2. ★ Where does a storyboard sit in a 3D pipeline you have run? Who makes it, who reads it, and what do they need from it?
3. What is the most boring or repetitive part of animating that you would gladly hand to a tool?
4. Which Maya windows did you and your team keep open all day? (For example: Graph Editor, Outliner, Time Slider, Camera Sequencer.)
5. What did junior animators on your team struggle with most: timing, spacing, posing, acting choices, or something else?
6. When you gave notes on someone's shot, what words did you use most? We'd like the app to speak that language.
7. Besides Maya, which apps do animators and filmmakers you know use every week? (Blender, Unreal, Houdini, Toon Boom, Storyboard Pro, Premiere, DaVinci Resolve, Procreate, After Effects…)
8. Is a storyboard file that opens in Maya (cameras placed, shots on a timeline) useful, or would people rather get a picture sequence or an animatic video?

## 2. Students

9. ★ When you taught 3D animation, which ideas took students longest to "get"?
10. What do students wish they could practice more often, if it were cheap and quick?
11. Would students learn from a tool that breaks a film they love into parts (camera, timing, feeling, comedy) and lets them copy one part into their own scene? Or would it feel like cheating?
12. What would make a teacher trust a tool like this enough to use it in class?
13. How long is a typical student assignment shot or film? (This sets how big the app's "film" needs to be.)

## 3. Momentum and attention (Jeremy's thesis)

Jeremy's idea: an audience can pay attention to only one thing at a time. When what holds their attention keeps changing between different kinds of things (a face, then a sound, then a costume, then a plot turn), the film feels rich and keeps moving. The app now shows a **meter** (how long attention has stayed on one kind of thing), a **ring chart** (what share of the time each kind held it), and a **timeline**. It also records the **cue** that moved attention on: visual, audio, thought, movement or plot.

14. ★ Does this match what you learned about staging and directing the eye? What is missing or wrong?
15. ★ In animation, how do you lead the viewer's eye from one thing to the next? (Staging, contrast, movement, a look, a sound?) Which of these should the app count as a "cue"?
16. Is there a rule of thumb you use for how long a shot or an idea can hold before the audience gets bored? Does it change between comedy, action and drama?
17. We split attention into 13 families: Camera, Movement, Lines & voice, Feeling, Comedy, Wardrobe, Set & landscape, Light & color, Music & sound, Plot & character, Thought & focus, Effects, Cut & structure. Would you group them differently?
18. Which film would you use to teach pacing? We'd like to trace it and measure it. Our starter list (numbers are Claude's guesses, not measured) is Pulp Fiction, Jaws, Mad Max: Fury Road, Paddington 2, Spirited Away, Parasite, The Grand Budapest Hotel, Get Out, Toy Story, Whiplash, Before Sunrise and Hot Fuzz. What would you swap in?
19. Every curiosity now has a note on how it moves the plot and themes forward, even clothes and landscape. Could you read a few (in the app: Library, Momentum, Momentum notes) and tell us if they sound right to an animator?

## 4. Performing live

Everything in the app can be played live: a MIDI keyboard, pads, or straps worn by a dancer can switch curiosities on and sweep them (closer shot, warmer light, faster cutting) while the storyboard plays.

20. ★ Have you seen animation or 3D performed live (VJs, motion capture shows, puppeteering a rig)? What worked?
21. Would animators want to "perform" a first pass of a shot (camera moves, timing) and then clean it up in Maya? Or does that feel wrong to the craft?
22. If you were on stage with this, what would you want under your fingers: camera, character pose, light, or something else?
23. Is there a Maya tool for recording live input (for example, keying from a controller) that your team used? Did it help?

## 5. Decisions we made without you (please check)

Claude made these choices on its own. Mark any you would change.

24. ★ Your six Maya areas (animation, lighting, shading, dynamics, fur, Bifrost) became the first tools, with a "Chain" that links them. One example: rain makes surfaces wet and fur matted. Are these the right links?
25. Maya terms are written in plain words in the app (for example, Set Driven Key is called a "proximity": when X happens, Y follows). Does that help, or should we keep Maya's own names next to them?
26. Most of the Maya help we used came from older Autodesk pages (2016 to 2023) and Claude's own knowledge, because the current help site blocked reading. Anything outdated you notice is worth flagging.
27. Reference clips are limited to 30 seconds or less and stored as counts only (no frames or dialogue), following your copyright note. Is that enough?
28. The beta only makes storyboards (many panels to flip through), with no rendering or simulation yet. Is that the right first thing for animators and students?
29. The Maya panel puts a camera called `curioCam` in your scene and keys it from the storyboard. Would you rather it built a Camera Sequencer setup with one camera per shot?
30. The character matrix places each character on 18 personality axes plus their Enneagram type. Is that useful for animating acting choices, or too abstract?

## 6. Working on the app together

31. Once you're back, you'll get your own copy of the app (a GitHub branch) where you can change any window or any decision. Would you rather change things yourself, or mark them up and have Claude make the changes?
32. What would you need to see in the first 10 minutes for the app to feel worth your time?
33. Do you know animators, teachers or students who would try the beta and tell us honestly what they think?
