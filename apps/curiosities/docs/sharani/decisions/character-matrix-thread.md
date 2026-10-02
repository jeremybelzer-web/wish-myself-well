# Character matrix thread: decisions

Thread: "Building the 3D Character matrix". Branch `curiosities-character-matrix`, off `curiosities-maya-studio` (PR #4). Code in `apps/curiosities/character-matrix/`. Started 2026-10-02.

1. **Own module, own folder.** `character-matrix/` with its own `index.html`, so it works today without touching files the "Bring Maya into the app" thread owns. It exposes `CharacterMatrix.mount(el)`; the README has the five lines that add it as a workspace tab.
2. **What "3D matrix" means here.** X = position between two poles (five cells, 0 to 100). Y = the axes. Z = ten faces: the front "character face" (the cast as it is in this scene) and nine Enneagram faces behind it, each lit where that type's fingerprint falls. A second "Space" view plots characters in any three axes with trails through scenes, because the cube shows identity well but movement less well.
3. **Axes: 18.** The 11 from the ChatGPT text's character-physics list, 5 more from its table (temperament orderly to chaotic, truth, competence, need, motivation), and 2 "Arc" axes from Jeremy's own list (narrow to wide focus, closed to widening mindset). Left pole = 0, right pole = 100.
4. **Dramatic roles: the 13 from the text plus Ally** (it appears in the text's example arc "Wildcard → Catalyst → Antagonist → Ally → Stabilizer"). A role is set per scene.
5. **Health levels 1 to 9** (1 healthy, 9 unhealthy), three bands, labels written for this app. Level 5 is a type's average fingerprint.
6. **How health bends a type.** Healthier: borrows up to 30% from the growth type, plus a shared push (more honest, more altruistic, more flexible, wider focus, more open mindset). Less healthy: slides up to 65% toward the stress type, gets more extreme, plus a shared push the other way. Arrows used: growth 1→7 2→4 3→6 4→1 5→8 6→9 7→5 8→2 9→3; stress 1→4 2→8 3→9 4→2 5→7 6→3 7→1 8→5 9→6.
7. **Jeremy's recollection checked.** He said types look like another type when unhealthy and like themselves when healthy. That matches the usual reading for stress. In growth the usual reading is that a type also borrows the *healthy* side of another type; I kept it mostly itself (30% borrow) so "healthy = like itself" still reads true. With these numbers, every type at level 9 reads most like its stress type, and every type at level 1 reads most like itself (checked in a script).
8. **"Reads most like"** compares against each type's plain fingerprint at the same health (own profile plus the shared push only), so the shared push does not blur which type it resembles.
9. **Type fingerprints (the numbers in `data.js`) are my estimates**, not from a source. They are easy to edit and the first thing Jeremy or Sharani should sanity-check.
10. **Descriptions written in my own words.** Type names (Reformer, Helper...) are the common short labels. No book text.
11. **One automation system.** Every axis, health and role registers with `CurioAuto.addCuriosity` (group "Character matrix"), so the existing patches, LFOs, MIDI learn and CC out drive them, and they appear in the Automate tab. No second automation system. Running patches move the selected character live; "Write into scene" keeps the values.
12. **Herd mentality** is computed per scene as the cast's average conformity (100 minus the Conformist to Individualist value). Not its own control yet.
13. **Default view shows only the selected character's own, stress and growth faces**, because all nine at once was unreadable. "All nine types" and "only N" are in the Show menu.
14. **Example cast** is three generic sketches (The Founder 3, The Skeptic 6, The Drifter 7), not show characters, so nothing about Wish Myself Well is guessed.
15. **three.js r128 from cdnjs** (global build). Without it the side panels still work and the view says why it is empty. Orbit and zoom are hand-written so no second script is needed.
16. **No games**, per Jeremy.
17. **Saving**: localStorage key `curiosities-character-matrix-v1` plus Export and Import JSON, like Study. Accounts and cloud saving wait for the wider saving decision.
