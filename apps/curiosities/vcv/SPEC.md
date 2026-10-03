# Plan: the Curiosities module for VCV Rack (roadmap Phase 6)

## What it is for

A performer or filmmaker patches the film the way a musician patches sound. Every curiosity, suite, proximity
and proximity suite is a jack, which is a socket for a cable. A slow wave (an LFO) in the Music jack makes the
music swell and fade. A sequencer in the Comedy jacks steps through setup, beat and payoff. An envelope from a
drum hit punches in a camera shake. Everything VCV Rack can make (waves, random values, sequences, logic)
becomes a way to direct a scene.

## Stage 1: the bridge (built in this PR)

It works with VCV Rack's own free modules and needs no plugin:

- **One jack per item:** 1839 jacks (591 curiosities, 367 suites, 733 proximities, 148 proximity suites). Each
  one is a MIDI channel and a CC number, taken from the database by `vcv/tools/make-vcv.js`.
- **Ready-made Rack files:** `vcv/rack/<workspace>.vcvs`. Each has CV-CC modules already set, a Notes module that
  names every jack, and an LFO already patched in.
- **The app listens:** `vcv/bridge.js` reads MIDI in the browser and moves the matching automation parameter,
  as if a knob were bound to it. 0 V is From and 10 V is To.
- **Focus:** 16 jacks on channel 16 move the sliders (lanes) of whichever item is in focus, picked in the
  app's VCV badge.

Limits of stage 1:

- Each CV-CC module has 16 plain jacks, so you read the jack names on the Notes module next to it.
- MIDI CC has 128 steps per jack. That is fine for most settings but coarse for a slow fade.
- Rack only sends in this direction. The app can already send CC out, so Rack's own MIDI-CC module (which turns
  CC into voltage) covers the other direction for now.
- It needs a virtual MIDI cable (IAC on Mac, loopMIDI on Windows), and the browser must be Chrome or Edge.

## Stage 2: a real plugin, generated from the database (started: vcv/plugin, not built yet)

A VCV Rack plugin is written in C++ against the Rack SDK. Ours would be generated, not hand-written:

- **One module per workspace**, so 25 modules, each panel printed with its items' names beside their jacks.
  The generator (an extension of `make-vcv.js`) writes the panel SVGs and the C++ list of jacks.
  - The largest workspaces have 40 to 56 items (Comedy has 56). Those panels get two or three pages, switched by a button, or
    the item list splits by level: curiosities, suites, proximities.
- **A Focus module** with a knob or a jack that picks the item (by workspace, then item) and 16 named jacks for
  its sliders, which update their labels when the item changes.
- **Better precision:** 14-bit values (two CCs per jack, or NRPN), so 16,384 steps instead of 128.
- **Both directions (Return module, started):** output jacks that carry each item's current value back from the app. The app plays a
  curated film's curiosities, and Rack turns them into sound or light.
- **Triggers (started):** a gate jack per item that turns it on and off, the same as a MIDI note or key in the app today.
- **Transport:** MIDI for the web app (Web MIDI), and OSC for the desktop app. The platform thread's bridge listens
  on UDP 7000 for `/curio/set/<level>/<id> f` and `/curio/trigger/<level>/<id> i`, and sends
  `/curio/value/<level>/<id> f` back on UDP 7001 (desktop/README.md, PR #11). The generated modules already
  send `/curio/set` when "Send by OSC" is ticked. Each item also has a gate jack beside it
  that sends `/curio/trigger` (on above 1 V, off below). Values come back through a small **Return** module placed
  to the right of any bank: it listens on UDP 7001 for `/curio/value` and puts out each of that bank's 16 items as
  0 to 10 V, so the bank panels stay readable.
- **Built with the Rack SDK** for Mac, Windows and Linux, and submitted to the VCV Library (free) once it is
  stable.

## Stage 3: the same jacks everywhere

The jack list (`curiosity-jacks.json`) is the contract. The desktop app and the Maya panel (Phases 4 and 5) read
the same list, so a Rack patch drives the web app, the desktop app or Maya's camera without rewiring.

## What is decided, and why

- **Stage 1 uses VCV's own CV-CC module**, not a new plugin. It works today for anyone with Rack 2, and nothing
  has to be compiled or approved by the VCV Library.
- **Each workspace starts on a fresh CV-CC module**, so a workspace's jacks sit together and its file stands
  alone.
- **CC numbers 1 to 112**, seven modules per channel. This keeps clear of CC 0 (bank select) and CC 120 to 127,
  which instruments treat as commands.
- **Channel 16 is kept for Focus.** One MIDI cable (port) holds 15 channels × 112 CCs = 1,680 jacks (105 modules).
  Today 128 modules are in use: 105 on port 1 and 23 on port 2 (channels 1 to 4).
- **More than 1,680 jacks: a second cable.** Module 106 onward goes on port 2, starting again at channel 1, CC 1.
  Port 1's jacks never move, so saved patches keep working. In the bank a port 2 jack has an 8th entry (2); the
  Notes module says "PORT 2"; the plugin panel says "Port 2". The bridge tells cables apart by name: a MIDI input
  whose name ends in a number from 2 to 9 ("Curiosities 2", IAC "Bus 2") is that port, if the bank uses it; any
  other input is port 1. Up to 4 ports (6,720 jacks). Tested by vcv/tests/run.js, part of tests/run-all.js.
- **The bridge listens with addEventListener**, so the app's own MIDI learn and bindings keep working next to it.
- **Values move immediately, and the app saves at most every 200 ms.** CV can send hundreds of values a
  second, and saving each one would slow the page.

## Open questions (none block stage 1)

- Does Jeremy want a wearable (MIDI straps or gloves, already supported in the app) to go through Rack first,
  so an LFO or sample-and-hold can shape the movement? It would work today with this bridge.
- Which tool after Maya (from the platform plan) decides whether stage 3's jack list also needs OSC.
