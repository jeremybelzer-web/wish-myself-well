# The shared core

Phase 1 of `docs/platform-and-saving-plan.md`. The core is the part of Curiosities that every version
shares: the web app, the desktop app, a panel in Maya, and bridges to Blender, Unreal or VCV Rack. It
never touches the page, so it runs in a browser tab, in Electron's main process, or headless in Node.

The core is these files, in load order (`core/files.json`):

| File | What it holds |
| --- | --- |
| `catalog.js`, `library.js`, `story-curiosities.js`, `lenses.js` | The curiosities (`CURIOSITIES`) |
| `model.js` | Suites, proximities, the emotion map |
| `reference.js` | Reference scenes |
| `suites.js` | `window.CuriositySuites`: matching suites by degree (moved unchanged from the top of `app.js`) |
| `maya-manual.js` | The Maya manual inventory; its new curiosities become parameters |
| `automation.js` | `window.CurioAuto`: every curiosity, suite, proximity and proximity suite as an automatable parameter |
| `bridge.js` | `window.CurioBridge`: the one message format for anything outside the app |

Everything else (`app.js`, `workspaces.js`, `study.js`, `prism.js`, the Studio tools, `project.js`)
is a screen: it draws the page and calls the core. Rule for new code: a file that only holds or computes
curiosities goes in the core list and must not use `document`; a file that draws goes after it.

## Loading it with no page

```js
const core = require("./core/headless.js").load();
core.CURIOSITIES.length;                                  // 240
core.CurioBridge.handle({ type: "set", key: "c:angleHeight", m: 0.5 });
core.tick();                                              // one automation frame
```

When the curiosity database is present (`data/`, #7), `load()` installs it right after `model.js`, as
`index.html` does, so every database curiosity, suite, proximity and proximity suite (and every slider row,
such as `c:music.tempo`) is a bridge key. `load({ database: false })` leaves it out.

`load({ storage })` takes any object with `getItem` and `setItem`, so a desktop app can keep the same
keys in a file; the default keeps them in memory. Check that the core still loads without a page:

```
node apps/curiosities/core/check.js
```

## The bridge message format

Every carrier (WebSocket, OSC, a Qt web channel inside Maya) sends the same small messages. MIDI keeps
its own bindings in `automation.js`.

| Message | Meaning |
| --- | --- |
| `{ type: "set", key: "c:angleHeight", m: 0.42 }` | Steer a parameter's main lane, 0 (setting A) to 1 (setting B), and start it |
| `{ type: "trigger", key: "s:noir", on: true }` | Switch a parameter on or off |
| `{ type: "stopAll" }` | Stop every running parameter |
| `{ type: "list" }` | Reply `{ type: "params", params: [{ key, level, label }] }` |
| `{ type: "value", key, m }` | Sent out: where a running parameter sits now (`CurioBridge.values()`) |

Keys are automation keys: `c:` curiosity, `s:` suite, `p:` proximity, `ps:` proximity suite, plus
`@<character>` for one character's own patch. Over OSC the same messages are `/curio/set/c/angleHeight 0.42`,
`/curio/trigger/s/noir 1`, `/curio/stopAll` and `/curio/value/c/angleHeight 0.42` (`fromOsc`, `toOsc`).

## Installable and offline (Phase 2)

`manifest.webmanifest`, `icon.svg`, `sw.js` and `offline.js` make the app installable and let it work
with no connection once it has been opened online. They only switch on when the app is served from a web
address (GitHub Pages, Cloudflare Pages, or `python3 -m http.server`); opening `index.html` as a file works
as before. The cache holds the app's files only; your work stays in the browser's storage and `.curio` files.
