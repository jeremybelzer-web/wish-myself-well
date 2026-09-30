/* Structural comparison only. Not a retelling of anyone’s episodes.
   The other show is the public shape of that ensemble: many companies,
   and principals go out by death. Titles below are the public names of hours,
   used as measurements, not as plots. */

const REFERENCE = {
  other: {
    name: "The other ensemble",
    exits: "Principals leave by death. A journey is usually a delay. The person comes back, or the body does.",
    groups: "An hour often crosses several companies of people, in different places.",
    mains: "A season carries many points of view. One hour may follow a handful, each in their own company.",
    hours: [
      { id: "First hour", measure: "Many companies are introduced. No principal dies." },
      { id: "A late hour of the first season", measure: "Companies converge. A principal dies." },
      { id: "A wedding hour", measure: "The hour stays with one company. Several principals die." },
      { id: "A celebration hour", measure: "One crowded group. One principal dies inside it." },
      { id: "A battle hour", measure: "One place. Many people. The principals mostly survive the hour." },
      { id: "A last war hour", measure: "One place. Mass death. Few of the principals die." },
      { id: "The closing hour", measure: "The remaining principals. Several deaths. The story ends. Nobody simply moves away." },
    ],
  },
  ours: {
    name: "Channel 2892",
    mains: "A season carries many mains. Most never meet. An hour follows 2 to 4 of them in one place.",
    groups: "One place an hour. The world shows up in the relationships there, and in a few crossings: a shift, a shipment, a question. Companies do not gather unless a later hour earns it.",
    exits: "A main may die. A main may also leave alive and not return.",
    season: "12 hours in a boarded season. Count who is in them. A leave ends the count. A death ends the count.",
    ledger: [
      { name: "Riven Vale", status: "stay", hours: "1–12, and the shop" },
      { name: "Nessa Kade", status: "stay", hours: "The Glass" },
      { name: "Ida Quill", status: "stay", hours: "The shop" },
      { name: "Petra Quill", status: "leave", hours: "The shop, then the door" },
      { name: "BYT", status: "leave", hours: "A feed. Not a funeral." },
    ],
  },
};

const SCENES = [
  {
    id: "glass",
    title: "The crystal is quiet",
    slug: "INT. LAB — THE GLASS",
    people: ["Nessa", "Subject", "Ida", "Riven", "Petra", "A tech", "BYT on a screen", "The crystal"],
    action: "A kindness is performed for the score. The hinge does not move. Then somebody sits and stops being anyone.",
    lines: [
      { who: "Nessa", text: "Hold the door. Mean it. Or don’t." },
      { who: "Subject", text: "I held it for a stranger. On camera." },
      { who: "Ida", text: "That’s a profile. The board can show the difference." },
      { who: "Nessa", text: "The crystal is quiet." },
      { who: "Riven", text: "So we change the shot, not the sermon." },
      { who: "Petra", text: "I’m going. Not dying. Going." },
      { who: "Nessa", text: "Sit. Don’t be anyone." },
      { who: "The crystal", text: "—" },
    ],
  },
  {
    id: "sleep",
    title: "Nightly disappearance",
    slug: "INT. ROOM — LAMP DOWN",
    people: ["Riven", "Anu", "The lamp", "A neighbor", "Juniper", "Moss", "The bed", "Morning"],
    action: "The person who cares about yesterday is not in the bed. Morning is the trick.",
    lines: [
      { who: "Riven", text: "I do it every night and call it nothing." },
      { who: "Anu", text: "The one who cares about yesterday isn’t in the bed." },
      { who: "Juniper", text: "Where do they go." },
      { who: "Anu", text: "You experience the morning. That’s the trick." },
      { who: "Moss", text: "That’s not dying." },
      { who: "Riven", text: "It feels like maintenance." },
      { who: "The lamp", text: "—" },
      { who: "Morning", text: "Hello." },
    ],
  },
];
