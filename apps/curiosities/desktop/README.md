# Curiosities on the desktop

Phase 4 of `docs/platform-and-saving-plan.md`. It is the same app in its own window (Electron), plus three
things a browser tab cannot do:

- **MIDI on every system.** MIDI pads, keyboards, wearable straps and VCV Rack work on a Mac too, not only in Chrome.
- **A local bridge.** VCV Rack, TouchOSC, Max, Ableton, or a Maya or Blender script can move curiosities
  over WebSocket or OSC (`bridge-server.js`, using the message format in `../bridge.js`).
- **A File menu.** New Project, Open, Save and Save As call the project file code (`../project.js`), with the
  usual shortcuts.

Your work is kept in the app's own storage and in `.curio` files, the same as in the browser.

## Run it

```
cd apps/curiosities/desktop
npm install
npm start
```

`npm run dist` builds an installer for the computer you run it on (a `.dmg` on a Mac, a setup `.exe` on
Windows, an AppImage on Linux). Unsigned builds show a warning on first open. Signing needs an Apple
developer account (about $99 a year) and a Windows certificate; see the plan.

## The bridge

| Way in | Address | Example |
| --- | --- | --- |
| WebSocket | `ws://127.0.0.1:7577` | send `{"type":"set","key":"c:angleHeight","m":0.42}`; every client gets `{"type":"value",...}` about 30 times a second |
| OSC in | UDP `127.0.0.1:7000` | `/curio/set/c/angleHeight 0.42`, `/curio/trigger/s/noir 1`, `/curio/stopAll` |
| OSC out | UDP `127.0.0.1:7001` | `/curio/value/c/angleHeight 0.42` for each running parameter |

Only this computer can connect. **Bridge > Connections** in the menu shows the addresses. Set
`CURIO_NO_BRIDGE=1` to start without it.

`npm run bridge` runs the same bridge on the core with no window (`../core/headless.js`), for trying an OSC
controller or a VCV Rack module without opening the app.

## Checks

```
npm run check
```

This runs the OSC codec, then the bridge end to end on the headless core: list, set and values over
WebSocket, and set, trigger and values over OSC.
