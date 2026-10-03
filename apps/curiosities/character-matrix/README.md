# Character matrix

A 3D workspace for who a character is and how that changes scene by scene. Open `index.html` in a browser (no build step).

## The matrix

- **Front face, the character face.** One row per axis, each running between two poles from 0 to 100, cut into five cells. The axes come from the character-physics list Jeremy brought in: Stabilizer to Catalyst, Reactive to Proactive, Conformist to Individualist, Altruistic to Self-serving, Cautious to Reckless, Surrender to Controlling, then Idealist to Cynic, Open to Secretive, Emotional to Rational, Flexible to Rigid, Conflict-avoidant to Confrontational. "More axes" adds Orderly to Chaotic (temperament, kept apart from what the character does to the story), Honest to Deceptive, Ineffective to Highly capable, Security to Freedom and External to Internal motivation. "Arc" adds Narrow to Wide focus and Closed to Widening mindset.
- **Depth, the nine Enneagram types.** Each face behind is one type's fingerprint across the same axes.
- **Health.** Each character has a health level per scene, 1 (most healthy) to 9 (least). A type's fingerprint bends with it. Healthier, it stays itself and borrows from its growth type. Less healthy, it slides toward its stress type (1 to 4, 2 to 8, 3 to 9, 4 to 2, 5 to 7, 6 to 3, 7 to 1, 8 to 5, 9 to 6). "Reads most like" names the type the character is closest to right now, so you can see an unhealthy 7 start to read like a 1.
- **Dramatic role.** What the character does to the story in each scene (Stabilizer, Catalyst, Challenger, Mediator, Mentor, Temptation, Mirror, Foil, Wildcard, Anchor, Trickster, Moral center, Antagonistic force, Ally). Roles can change across scenes; the readout shows the chain.
- **The group.** Herd mentality per scene (how conformist the cast is on average), the most opposed pair and the axis they split on, and the most alike pair, flagged when they may be too similar.

The **Space** view plots the cast in any three axes, with a trail through every scene and the nine type fingerprints as landmarks.

## How it maps to curiosities

| Level | In the matrix |
| --- | --- |
| Curiosity | each axis, the health level, the dramatic role |
| Curiosity suite | a type's fingerprint (its axes moving together) |
| Proximity | a stress or growth arrow: when health falls, the stress type's traits follow |
| Proximity suite | the nine arrows together |

Every axis, `cm-health` and `cm-role` is registered with `CurioAuto.addCuriosity` under the group "Character matrix", so the one automation system drives them (A to B, LFO, knob, MIDI note or CC, CC out to VCV Rack). They also show in the Automate tab. A running patch moves the selected character live; **Write into scene** keeps what it shows.

## On the Screen

The Screen's **Character** tab (`screen/character.js`) puts these curiosities on each character's own track, and **Open the 3D matrix** opens the matrix over the Screen linked to the film (`CharacterMatrix.link(adapter)`): the cast is the character tracks, the scenes are the moments, and every edit is a node on the timeline. An axis without a lane follows the type at that health; nudging it in the matrix gives the character a lane for it. Health and role always get lanes. A type change keeps what the lanes say and moves only the axes without lanes. `CharacterMatrix.unlink()` goes back to the matrix's own cast.

## Adding it as a workspace in the main app

```html
<link rel="stylesheet" href="character-matrix/matrix.css" />
<section id="character-matrix" class="hidden" style="grid-column: 1 / -1"></section>
<!-- after automation.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="character-matrix/data.js"></script>
<script src="character-matrix/matrix.js"></script>
```

Then call `CharacterMatrix.mount(document.getElementById("character-matrix"))` once, when the tab is first shown (it can also mount while hidden; the 3D view resizes when it appears).

## Files

- `data.js`: axes, roles, the nine types (descriptions written for this app, not quoted from any book), health levels, the example cast.
- `matrix.js`: the model, the 3D views, the panels and the automation hookup. `window.CharacterMatrix`.
- `matrix.css`: styles, scoped under `.cm`.
- `index.html`: the standalone page.

State is `localStorage` key `curiosities-character-matrix-v1`; Export and Import save the cast as JSON.
