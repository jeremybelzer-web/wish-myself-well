# Voice: say what you want, and Curiomatic does it

Every screen has a 🎤 in the bottom-left corner. Press it (or **Alt+V**, **⌥V** on a Mac), say what you want,
and the app does it. Tick **Hands-free** to keep it listening, one command per sentence, until you say
"stop listening". The same box takes typed commands, so it also works where the browser can't listen.

It is free: it uses the browser's own speech recognizer. Chrome and Edge send the sound to Google or Microsoft
to turn it into words; Safari does it on the device; Firefox and the desktop app (Electron) can't listen, so
there you type. Nothing is kept and nothing is paid for.

## What you can say

| You say | What happens |
| --- | --- |
| "go to moment 5", "next moment", "back 2 moments", "go to the end" | Moves the playhead |
| "play", "pause", "undo", "undo 3 times", "redo" | The Screen's own keys |
| "shot size closer", "make the emotion sadder", "set lens length to 85" | Opens that curiosity's window and gives the words to its "Say what you want" box, one undo step |
| "let it breathe", "punch in on the big line" | A plain-words phrase written for a curiosity (data/windows/say-*.js), said on its own |
| "open the export menu", "turn on captions", "mark the turns", "3 windows" | Any Screen action from Quick find (⌘K) |
| "look through color" | Picks that curiosity or suite in the library, as Quick find does |
| "open the storyboard", "open camera angle", "open the prism" | The app's bar and Library menu (leaves the Screen if needed) |
| the words on any button, tab, menu item, checkbox or dropdown choice you can see | Presses it |
| "type a lonely diner at night" | Types into the last box you clicked |
| "go to moment 3 then play" | Two commands in a row ("then", "and then", "after that") |
| "what can I say?", "stop listening", "never mind", "scroll down", "close that" | Help and housekeeping |

When two things fit about as well, the box shows the best three and you say "1", "2" or "3" (or click).

## For other parts of the app

Anything on the page with words is already reachable. To give a feature a better name, more words people use
for it, or an action with no button, register it once:

```js
CurioCommands.mappable("viewer.zoom-reset", "Reset the viewer zoom", () => resetZoom(), { words: "fit whole picture" });
CurioCommands.register({ id: "draw.pencil", label: "Pick the pencil", words: "draw sketch", run: () => pick("pencil") });
CurioCommands.provider(() => listOfThingsRightNow()); // asked fresh every time
```

`mappable(id, label, run, opts)` is the same call the music app's notes ask for, so a registered control can
later be a trigger target too (opts may carry `get()` and `set(v)` for that). `run` may return a sentence;
it is shown (and spoken, with "Say the answer out loud") instead of "Did: label".

`CurioVoice.hear(text)` runs a command as if it was said and returns what it did; `CurioVoice.find(text)`
returns the ranked matches without doing anything.

## Files

- `commands.js` (`window.CurioVoiceWords`): the reader, with no page. Numbers in words, filler words,
  "then", the fixed shapes, and the scorer (how much of a label was said, and how much of what was said is
  about it, each weighed by how rare the words are).
- `voice.js` (`window.CurioVoice`, `window.CurioCommands`): the 🎤 box, the microphone, and what it can reach.
- `load.js`: one script tag in index.html. `?voice=0` leaves voice off.
- Settings: localStorage `curiosities-voice-v1` (`{ talkBack }`; Hands-free always starts off).
- Hook used: `CurioScreen.commands()` (screen/ui.js) is Quick find's whole list.

## Tests

- `node apps/curiosities/voice/tests/run.js`: the reader, and 103 ways of saying real Screen and bar names
  (`tests/said.json` against `tests/labels.json`); 90% must land first and clearly.
- `NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/voice/tests/browser.js [--debug]`: the real
  app. Commands end to end, and every visible control on the Screen, My film, the Storyboard and three
  workspaces said by its own words (90% must be found first; `--debug` lists the misses).
