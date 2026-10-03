/* The Character matrix as data.

   The front face is the "character physics": axes that each run between two poles, 0 to 100.
   Depth is the nine Enneagram types. Each type is a fingerprint across the same axes (a curiosity suite:
   a group of curiosities that move together), and a health level from 1 (most healthy) to 9 (least)
   bends that fingerprint. Under stress a type drifts toward its stress type; in growth it borrows from
   its growth type. Those two arrows are proximities: when health falls, the stress type's traits follow.

   All descriptions are written for this app in plain words. They summarise the usual reading of the
   Enneagram's nine types and its levels of development; none of it is quoted from a book. */

(function () {
  /* Every axis is a curiosity: id, the two poles, and what it asks. Group decides where it sits on the face. */
  const AXES = [
    { id: "stability", group: "Core six", left: "Stabilizer", right: "Catalyst", asks: "Does this person hold things steady or make them change?" },
    { id: "agency", group: "Core six", left: "Reactive", right: "Proactive", asks: "Do they answer events or start them?" },
    { id: "freedom", group: "Core six", left: "Conformist", right: "Individualist", asks: "Do they go with the group or their own way?" },
    { id: "morality", group: "Core six", left: "Altruistic", right: "Self-serving", asks: "Whose good do they serve first?" },
    { id: "risk", group: "Core six", left: "Cautious", right: "Reckless", asks: "How much uncertainty will they walk into?" },
    { id: "control", group: "Core six", left: "Surrender", right: "Controlling", asks: "How much do they need to steer people and events?" },
    { id: "worldview", group: "The person", left: "Idealist", right: "Cynic", asks: "Do they believe things can get better?" },
    { id: "openness", group: "The person", left: "Open", right: "Secretive", asks: "How much of themselves do they show?" },
    { id: "emotion", group: "The person", left: "Emotional", right: "Rational", asks: "Does feeling or reasoning drive what we see?" },
    { id: "adaptability", group: "The person", left: "Flexible", right: "Rigid", asks: "Do they bend with circumstances or hold their line?" },
    { id: "conflict", group: "The person", left: "Conflict-avoidant", right: "Confrontational", asks: "How readily do they walk into a fight?" },
    { id: "temperament", group: "More axes", left: "Orderly", right: "Chaotic", asks: "How ordered is their own life and manner, apart from what they do to the story?" },
    { id: "truth", group: "More axes", left: "Honest", right: "Deceptive", asks: "How willing are they to bend the truth?" },
    { id: "competence", group: "More axes", left: "Ineffective", right: "Highly capable", asks: "Can they actually do what they set out to do?" },
    { id: "need", group: "More axes", left: "Security", right: "Freedom", asks: "What condition are they trying to reach?" },
    { id: "motivation", group: "More axes", left: "External", right: "Internal", asks: "Status and approval, or an inner need?" },
    { id: "focus", group: "Arc", left: "Narrow focus", right: "Wide focus", asks: "How much of the world are they paying attention to in this scene?" },
    { id: "perspective", group: "Arc", left: "Closed mindset", right: "Widening mindset", asks: "Is their way of seeing fixed, or opening up?" },
  ];

  /* Layer 2: what the character does to the story. A character can change role scene by scene. */
  const ROLES = [
    { id: "stabilizer", label: "Stabilizer", does: "keeps the group together" },
    { id: "catalyst", label: "Catalyst", does: "causes change" },
    { id: "challenger", label: "Challenger", does: "tests other characters" },
    { id: "mediator", label: "Mediator", does: "resolves conflicts" },
    { id: "mentor", label: "Mentor", does: "gives knowledge or perspective" },
    { id: "temptation", label: "Temptation", does: "pulls others toward something" },
    { id: "mirror", label: "Mirror", does: "reflects another character back at them" },
    { id: "foil", label: "Foil", does: "embodies an opposing worldview" },
    { id: "wildcard", label: "Wildcard", does: "is the unpredictable variable" },
    { id: "anchor", label: "Anchor", does: "stands for continuity" },
    { id: "trickster", label: "Trickster", does: "breaks assumptions" },
    { id: "moral-center", label: "Moral center", does: "sets the ethical reference point" },
    { id: "antagonist", label: "Antagonistic force", does: "actively blocks the protagonist" },
    { id: "ally", label: "Ally", does: "fights alongside the protagonist" },
  ];

  /* The nine types. profile = the average fingerprint, in AXES order, 0 (left pole) to 100 (right pole).
     growth = the type it borrows from when healthy; stress = the type it slides toward when unhealthy. */
  const TYPES = [
    {
      n: 1, name: "Reformer", color: "#8a4b2a",
      desire: "to be good and in the right", fear: "being corrupt, wrong or flawed",
      healthy: "Fair, patient and wise. Holds high standards without needing everyone else to meet them, and can let a thing be good enough.",
      average: "Orderly and dutiful, with an inner critic that never rests. Corrects people, keeps lists, and feels quiet resentment when others cut corners.",
      unhealthy: "Rigid and punishing. Sure they alone are right, harsh with others for faults they hide in themselves, and capable of cruelty in the name of principle.",
      growthLooks: "loosens up, finds play and spontaneity",
      stressLooks: "turns moody, self-pitying and withdrawn",
      roles: { healthy: "moral-center", average: "anchor", unhealthy: "antagonist" },
      engine: "The gap between how things are and how they should be.",
      profile: [30, 70, 35, 25, 25, 80, 25, 45, 65, 80, 55, 15, 15, 70, 30, 80, 35, 35],
    },
    {
      n: 2, name: "Helper", color: "#b5536b",
      desire: "to be loved and needed", fear: "being unwanted",
      healthy: "Warm and generous without keeping score. Gives because they want to, and can also say what they need.",
      average: "Attentive to everyone else's needs, a little intrusive, and quietly counting what they are owed.",
      unhealthy: "Possessive and manipulative. Uses guilt and favours to keep people close, and turns hostile when the help is refused.",
      growthLooks: "turns inward, admits their own feelings and needs",
      stressLooks: "becomes domineering and aggressive",
      roles: { healthy: "ally", average: "stabilizer", unhealthy: "temptation" },
      engine: "Love given with strings, and the moment someone notices the strings.",
      profile: [25, 60, 30, 15, 40, 55, 30, 30, 20, 45, 30, 40, 40, 65, 35, 20, 45, 50],
    },
    {
      n: 3, name: "Achiever", color: "#c9852d",
      desire: "to be valuable and admired", fear: "being worthless without success",
      healthy: "Driven and genuine. Inspires people by example and is the same person off stage as on it.",
      average: "Image-conscious and competitive. Shapes themselves to what the room rewards and measures life in wins.",
      unhealthy: "Hollow and deceptive. Will lie, cheat or sabotage a rival rather than be seen to fail.",
      growthLooks: "commits to people and causes beyond themselves",
      stressLooks: "goes numb, disengages and stops trying",
      roles: { healthy: "catalyst", average: "challenger", unhealthy: "antagonist" },
      engine: "The mask that works, until it doesn't.",
      profile: [55, 90, 45, 60, 55, 70, 50, 60, 75, 45, 55, 30, 55, 85, 50, 15, 40, 45],
    },
    {
      n: 4, name: "Individualist", color: "#6b4f9e",
      desire: "to find their own identity and meaning", fear: "having no self or significance",
      healthy: "Honest about feeling, creative, and able to turn pain into something beautiful and shared.",
      average: "Self-absorbed and moody. Feels different from everyone, longs for what is missing, and dramatizes.",
      unhealthy: "Despairing and self-destructive. Pushes people away, then hates them for leaving.",
      growthLooks: "gets disciplined and acts on principle",
      stressLooks: "clings and over-pleases to keep people close",
      roles: { healthy: "mirror", average: "foil", unhealthy: "wildcard" },
      engine: "Longing for what is missing, and the fear that the missing piece is them.",
      profile: [65, 40, 90, 50, 55, 35, 45, 55, 10, 55, 45, 70, 30, 50, 75, 90, 30, 55],
    },
    {
      n: 5, name: "Investigator", color: "#2f6f8f",
      desire: "to be capable and to understand", fear: "being helpless or overwhelmed",
      healthy: "Visionary and clear. Sees what others miss and shares it, engaged with the world rather than hiding from it.",
      average: "Detached and private. Hoards time, energy and knowledge, and watches from a distance.",
      unhealthy: "Isolated and paranoid. Cuts off from people and gets lost in dark, airless ideas.",
      growthLooks: "takes decisive, confident action",
      stressLooks: "scatters, grows restless and impulsive",
      roles: { healthy: "mentor", average: "mirror", unhealthy: "wildcard" },
      engine: "Knowing enough to act, and never feeling ready to.",
      profile: [40, 30, 80, 55, 20, 60, 65, 85, 95, 60, 25, 35, 30, 70, 30, 85, 25, 70],
    },
    {
      n: 6, name: "Loyalist", color: "#4f7a4a",
      desire: "to be safe and supported", fear: "being without guidance or support",
      healthy: "Steady, brave and committed. Faces the fear and stays, and holds a group together through trust.",
      average: "Anxious and watchful. Tests loyalty, swings between obedience and defiance, and plans for the worst.",
      unhealthy: "Panicked and suspicious. Sees betrayal everywhere and lashes out at the very people they depend on.",
      growthLooks: "relaxes, trusts and stops scanning for danger",
      stressLooks: "puffs up, competes and performs confidence",
      roles: { healthy: "stabilizer", average: "anchor", unhealthy: "challenger" },
      engine: "Who can be trusted, and what happens when the answer changes.",
      profile: [20, 45, 20, 35, 15, 55, 60, 55, 50, 65, 50, 45, 30, 60, 10, 35, 35, 35],
    },
    {
      n: 7, name: "Enthusiast", color: "#d0662f",
      desire: "to be satisfied and free", fear: "being trapped in pain or deprivation",
      healthy: "Joyful and grateful. Brings energy and ideas, and can stay with a moment without running to the next.",
      average: "Busy, scattered and always planning the next thing. Uses fun to dodge anything heavy.",
      unhealthy: "Reckless and escapist. Burns through people, money and their own body to avoid a single hard feeling.",
      growthLooks: "slows down, goes deep and focuses",
      stressLooks: "turns critical, perfectionist and rigid",
      roles: { healthy: "catalyst", average: "trickster", unhealthy: "wildcard" },
      engine: "Running toward the next thing to avoid the one thing that hurts.",
      profile: [80, 80, 75, 55, 85, 35, 20, 25, 35, 15, 40, 80, 45, 65, 90, 60, 70, 75],
    },
    {
      n: 8, name: "Challenger", color: "#9e2f2f",
      desire: "to protect themselves and control their life", fear: "being harmed or controlled by others",
      healthy: "Big-hearted and protective. Uses strength to shield people and lets them in.",
      average: "Dominating and blunt. Tests everyone, takes charge, and treats softness as a risk.",
      unhealthy: "Ruthless and destructive. Crushes opposition and believes everyone is out to get them.",
      growthLooks: "opens their heart and cares for others",
      stressLooks: "withdraws, broods and plots in secret",
      roles: { healthy: "ally", average: "challenger", unhealthy: "antagonist" },
      engine: "Strength that protects, and strength that can't stop fighting.",
      profile: [75, 95, 75, 50, 75, 95, 55, 40, 55, 60, 95, 50, 25, 85, 80, 70, 50, 40],
    },
    {
      n: 9, name: "Peacemaker", color: "#5d8a86",
      desire: "inner stability and peace of mind", fear: "loss and separation",
      healthy: "Accepting and grounding. Brings people together and is fully present in their own life.",
      average: "Agreeable and checked out. Goes along to keep the peace and puts off what matters.",
      unhealthy: "Numb and stubborn. Disappears into routine and denial while problems grow.",
      growthLooks: "wakes up, takes initiative and goes after goals",
      stressLooks: "frets, doubts and gets anxious",
      roles: { healthy: "mediator", average: "stabilizer", unhealthy: "anchor" },
      engine: "Keeping the peace by disappearing from your own life.",
      profile: [10, 20, 25, 25, 25, 15, 30, 40, 50, 35, 5, 50, 30, 50, 20, 50, 70, 55],
    },
  ];
  const GROWTH = { 1: 7, 2: 4, 3: 6, 4: 1, 5: 8, 6: 9, 7: 5, 8: 2, 9: 3 };
  const STRESS = { 1: 4, 2: 8, 3: 9, 4: 2, 5: 7, 6: 3, 7: 1, 8: 5, 9: 6 };
  TYPES.forEach((t) => {
    t.growth = GROWTH[t.n];
    t.stress = STRESS[t.n];
  });

  /* Health levels, 1 most healthy to 9 least, in three bands. */
  const LEVELS = [
    { level: 1, band: "healthy", label: "Liberated" },
    { level: 2, band: "healthy", label: "Grounded" },
    { level: 3, band: "healthy", label: "Thriving" },
    { level: 4, band: "average", label: "Off balance" },
    { level: 5, band: "average", label: "Defensive" },
    { level: 6, band: "average", label: "Overcompensating" },
    { level: 7, band: "unhealthy", label: "Cornered" },
    { level: 8, band: "unhealthy", label: "Obsessed" },
    { level: 9, band: "unhealthy", label: "Collapsed" },
  ];

  /* Every type picks these up as health rises or falls, on top of its own drift. */
  const HEALTH_PUSH = {
    healthy: { morality: -20, truth: -20, adaptability: -15, focus: 15, perspective: 25, competence: 10 },
    unhealthy: { morality: 20, truth: 25, adaptability: 15, focus: -25, perspective: -30, competence: -20, temperament: 15 },
  };

  /* A starting cast so the space is not empty. Generic sketches, not anyone's show. */
  const EXAMPLE = {
    scenes: 6,
    characters: [
      {
        id: "founder", name: "The Founder", type: 3, color: "#c9852d",
        scenes: [{ health: 4, role: "catalyst" }, { health: 5, role: "challenger" }, { health: 7, role: "antagonist" }, { health: 8, role: "antagonist" }, { health: 5, role: "ally" }, { health: 3, role: "stabilizer" }],
      },
      {
        id: "skeptic", name: "The Skeptic", type: 6, color: "#4f7a4a",
        scenes: [{ health: 5, role: "anchor" }, { health: 6, role: "challenger" }, { health: 6, role: "challenger" }, { health: 4, role: "mediator" }, { health: 3, role: "stabilizer" }, { health: 2, role: "moral-center" }],
      },
      {
        id: "drifter", name: "The Drifter", type: 7, color: "#d0662f",
        scenes: [{ health: 5, role: "wildcard" }, { health: 4, role: "trickster" }, { health: 6, role: "temptation" }, { health: 8, role: "wildcard" }, { health: 6, role: "catalyst" }, { health: 4, role: "catalyst" }],
      },
    ],
  };

  window.CHARACTER_MATRIX_DATA = { AXES, ROLES, TYPES, LEVELS, HEALTH_PUSH, EXAMPLE };
})();
