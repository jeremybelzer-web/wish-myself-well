# Does Momentum slow the app?

Short answer: no. Momentum is 22 files and 18 tabs now, and it adds about 25 to 55 milliseconds to the app's start. A few things did extra work, and those are fixed. The numbers below come from Chromium (Playwright) on the build machine, using the median of 3 to 5 runs. Your own computer will give different numbers, but the before-and-after comparison holds.

`tests/speed.js --browser` checks that this stays true (see the end of this page).

## The numbers

| What | Before | After |
| --- | --- | --- |
| App start, until the page has loaded (with Momentum / without it) | 359 / 301 ms | 334 / 308 ms |
| Time Momentum's own files spend running at start (all 22 together) | 5.4 ms | 5.1 ms |
| Long pauses at start (over 50 ms) caused by Momentum | none | none |
| Opening the Momentum window | 34 ms | 32 ms |
| Opening every tab once, all 18 added up | 66 ms | 40 ms |
| Slowest tab: Cue lab | 32 ms | 8 ms |
| Momentum notes tab | 7 to 12 ms | 4 to 5 ms |
| One engine change with the Screen, its momentum panel, the storyboard strip and the Pads tab all open | 41 ms | 42 ms (Momentum's part: about 2.5 ms before, 1.4 ms after) |
| Films read on each engine change, Screen open | 6 (4 of them by Momentum) | 4 (2 of them by Momentum) |
| Films read on each engine change after the Screen is closed | 4 | 0 |
| Engine listeners after visiting every tab | 4 | 2 |
| Listeners and page watchers after visiting every tab 5 times | no growth | no growth |

## What the numbers mean

- **Start.** Momentum's own code runs for about 5 ms in total. The rest of the 25 to 55 ms is the browser fetching and reading 22 small files and one style sheet. The one long pause at start comes from the glossary (`glossary.js`), which marks words on the whole page whether or not Momentum is there. It is not Momentum's.
- **An engine change.** Almost all of the roughly 40 ms goes to the Screen redrawing its own timeline (`screen/ui.js`), which is outside Momentum. Momentum's part is now about 1.4 ms.
- **Memory.** Visiting every tab 5 times leaves the same number of window listeners, page watchers (MutationObservers) and engine listeners as visiting them once. Nothing piles up.

## What was fixed

1. **The list of every curiosity's note is now built once** (`notes.js`, `CurioMomentum.all()`). Cue lab asked for the whole list once for each idea it showed, and Compass, Pads, Story drive and Momentum notes asked for it too. Each time, the list was built again from more than 2,000 curiosities. It is now kept until a curiosity is added or the catalog changes, and every caller still gets its own copy. Cue lab went from 32 ms to 8 ms.
2. **The Screen's momentum panel keeps the inspiration films' readings** (`screen-panel.js`). Those films do not change when My film does. Before, every engine change read each of them twice. Now the panel reads them once for each playhead position and settings, so an engine change only reads My film.
3. **The Screen's panel rests while the Screen is closed** (`screen-panel.js`). Before, it kept reading every film on each engine change even when nothing was on show. Now it skips that work while it is hidden. The Screen tells it to redraw when it opens again, so it is never out of date.
4. **Tabs can stop listening when you leave them** (`ui.js`, `addTab({ ..., unmount })`). Who we watch and Feeling road listen to the engine. Before, they kept listening after you moved to another tab, until the next change. Now they stop when you leave the tab or close the window, and start again when you come back.
5. **The storyboard strip ignores the Momentum window** (`storyboard-strip.js`). The strip watches the page to see when the storyboard redraws. Before, every redraw of a Momentum tab or of the Screen's panel woke it up too. Now changes inside those are skipped.

## Left as they are

- **Loading the files only when Momentum opens.** That would save part of the 25 to 55 ms at start. But the Screen panel, the storyboard strip and the Library item have to be there from the start, and the gain is small.
- **One shared reading for every tab.** Only one tab draws at a time. The places that read the same film more than once were the Screen panel and the note list, and both are fixed above.
- **The Screen's own redraw** is the main cost of an engine change. It lives in `screen/`, outside Momentum.

## How it is checked

`node momentum/tests/speed.js --browser --three <three.min.js>` (with `NODE_PATH` set) fails if any of these happens:

- Opening the window and every tab once takes longer than 2.5 seconds. That budget is generous, so only a real slowdown fails it.
- Any listener or watcher grows between the first and the fifth visit to every tab.
- Who we watch keeps listening to the engine after you leave it.
- The Screen's panel reads anything but My film on an engine change, or reads anything while the Screen is closed.

The measuring script used for the table is not kept in the app. It timed page loads with `momentum/load.js` blocked and unblocked, wrapped each Momentum file in a timer, timed each tab's click, counted readings with a wrapper on `CurioAttention.read`, and counted listeners with wrappers on `addEventListener`, `MutationObserver` and `CurioEngine.on`.
