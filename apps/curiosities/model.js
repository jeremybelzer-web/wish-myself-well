/* Suites group curiosities. Proximities say: when X, Y follows within N beats.
   A model of a scene is only these, plus the curiosities they name. */

const SUITES = [
  {
    id: "coverage",
    label: "Coverage",
    note: "Cuts around the line.",
    set: { angleFamily: "coverage", angleChange: "on the line", angleCount: 4 },
  },
  {
    id: "oner",
    label: "Oner",
    note: "One smooth tracking shot.",
    set: { angleFamily: "oner", cameraCarry: "smooth", cameraMove: "track", angleChange: "locked" },
  },
  {
    id: "handheld-hunt",
    label: "Handheld hunt",
    note: "Unsteady camera, faster cuts.",
    set: { cameraCarry: "handheld", angleFamily: "handheld", angleCount: 6, moveSpeed: 4 },
  },
  {
    id: "smooth-push",
    label: "Smooth push",
    note: "One slow line in.",
    set: { cameraCarry: "smooth", cameraMove: "push in", moveSpeed: 1 },
  },
  {
    id: "quiet-confession",
    label: "Quiet confession",
    note: "Close, quiet, a breath, a smooth push.",
    set: { volume: 1, breath: "breath then speak", cameraCarry: "smooth", cameraMove: "push in", angleFamily: "coverage" },
  },
  {
    id: "object-insert",
    label: "Object insert",
    note: "The thing moves and the frame follows it.",
    set: { objectPath: "lift", objectEnter: "enters", moveFollows: "object", cameraMove: "push in", cameraCarry: "smooth" },
  },
  {
    id: "crossing",
    label: "Crossing",
    note: "A person walks across a wide frame.",
    set: { characterPath: "cross", characterToLens: "across", angleFamily: "coverage", cameraCarry: "locked", cameraMove: "none" },
  },
  {
    id: "two-person",
    label: "Two-person hour",
    note: "Two mains, one company.",
    set: { mains: 2, groups: "1", peopleCount: 2 },
  },
];

const PROXIMITIES = [
  {
    id: "handheld-gesture",
    when: "cameraCarry is handheld",
    then: "gesture grows",
    within: 2,
    test: (state) => state.cameraCarry === "handheld",
  },
  {
    id: "close-quiet",
    when: "shot size becomes close",
    then: "volume drops",
    within: 1,
    test: (state, shot) => shot === "close",
  },
  {
    id: "approach-push",
    when: "a person approaches",
    then: "the camera pushes in",
    within: 2,
    test: (state) => state.characterPath === "approach",
  },
  {
    id: "object-insert-prox",
    when: "an object enters",
    then: "the frame becomes an insert",
    within: 1,
    test: (state) => state.objectEnter === "enters",
  },
];
