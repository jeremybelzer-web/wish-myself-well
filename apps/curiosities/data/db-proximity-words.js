/* Plain words for proximities whose names don't read as "When ..., ..." ("Pride before a fall"). The app shows a
   proximity as "When <whenText>, <thenText>"; these fill both halves. */
(function (DB) {
  const W = {
    "low-then-laugh": ["the film hits a low scene", "a laugh follows"],
    "hidden-then-burst": ["a feeling is kept fully hidden", "it bursts out later"],
    "tension-release": ["the tension peaks", "a release follows"],
    "joke-reaction": ["a joke pays off", "the film cuts to a reaction"],
    "two-then-break": ["two things set a pattern", "the third breaks it"],
    "pride-fall": ["a character pretends to more status", "they fall"],
    "insist-then-do": ["a character insists they never will", "a hard cut shows them doing it"],
    "cringe-silence": ["something awkward is said", "a pointed silence hangs"],
    "escalate-wide": ["the trouble escalates", "the frame widens"],
    "gag-returns": ["a running gag comes back", "it is a little different"],
    "callback-tender": ["a joke line comes back later", "it lands in a tender moment"],
    "absurd-no-reaction": ["something absurd happens", "nobody reacts"],
    "misdirect-pullback": ["the audience is misled", "the camera pulls back to show the truth"],
    "tension-laugh": ["the tension rises", "a laugh breaks it"],
    "change-outfit-change-self": ["a character's look transforms", "their arc moves on"],
    "disguise-reveal": ["a character is in disguise", "they are unmasked"],
    "clutter-close": ["the room is cluttered", "the shots get closer"],
    "big-space-wide": ["the space is huge", "the frame goes wide"],
    "clash-noticed": ["the clothes clash with the place", "someone reacts"],
    "prop-key-insert": ["a prop becomes the key to the scene", "it gets a close-up"],
    "decay-mood": ["the room runs down", "the mood of the place darkens"],
    "drain-on-loss": ["a character's feeling drops sharply", "the color drains"],
    "flashback-fade": ["the film jumps into the past", "the picture takes the faded look"],
    "warm-reunion": ["two characters come back together", "the color warms"],
  };
  DB.data.proximities.forEach((p) => {
    const w = W[p.id];
    if (!w) return;
    p.whenText = w[0];
    p.thenText = w[1];
  });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
