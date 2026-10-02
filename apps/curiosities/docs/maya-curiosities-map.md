# Maya Curiosities Map

Sharani's six Maya areas read as Curiosities: one measurable value per beat. Ids follow `catalog.js`; rows marked (board) already exist there.

Live version: https://claude.ai/artifact/HVG3dk2PSApWS3aMcCjbe9

## Animation

Maya tools: Graph Editor · Time Slider · Time Editor · IK/FK · constraints

The timing and spacing of a move. In Maya this lives in key placement and tangent shape on the Graph Editor curves.

| Id | Curiosity | Values | In Maya |
| --- | --- | --- | --- |
| spacing | Spacing | even · ease in · ease out · ease both · snap | Tangent type: linear, spline, flat, stepped. |
| stepping | Drawn on | ones · twos · threes | How many frames each pose holds. Twos read as hand-drawn. |
| anticipation | Anticipation | none · small · big | The wind-up before the move. |
| overshoot | Overshoot | none · settle · bounce | What happens after the stop. |
| overlap | Overlap | none · hair · cloth · hands · all | Parts that keep moving after the body stops. |
| arcs | Path shape | straight · arc · figure-eight | The motion trail of a hand or head. |
| leadPart | Leads the move | eyes · head · hips · hands | Which part starts first. |
| squash | Squash and stretch | 0–5 | How much the volume deforms. |
| poseRate | Key poses per line | 1–8 | How many held poses a line of dialogue gets. |
| gesture (board) | Size of gesture | hand · arm · whole body |  |
| stillness (board) | Stillness | see board |  |

**Suites**

- Snappy cartoon: stepping twos, anticipation big, overshoot bounce, squash 4
- Grounded realism: stepping ones, anticipation small, overshoot settle, overlap hair
- Moving hold: stillness high, overlap cloth, spacing ease both

**Proximities**

- When leadPart is eyes, the head turns, then the body (within 1 beats)
- When anticipation is big, the move is fast (within 1 beats)
- When the character stops, overlap settles (within 2 beats)

## Lighting

Maya tools: Arnold area, skydome, spot, photometric, mesh lights · gobo, barndoor, blocker filters · atmosphere volume

Where light comes from, how hard it is, and when it changes. Arnold lights carry intensity and exposure in stops, so contrast can be counted.

| Id | Curiosity | Values | In Maya |
| --- | --- | --- | --- |
| key (board) | Key direction | side · front · back · under · none |  |
| contrast (board) | Contrast | stops between key and fill | Exposure difference, measurable in Arnold. |
| colorTemp (board) | Color of the light | Kelvin, e.g. 2700 · 5600 · 7500 | Arnold lights have a color temperature switch. |
| softness | Softness | hard · soft | Area light size or spot penumbra. |
| rim | Rim light | off · thin · strong | Separates a figure from the back. |
| lightCount | Sources | 1–8 | Lights doing work in the shot. |
| practicalInFrame | Source in frame | yes · no | A lamp, a screen, a fire the audience can see. |
| lightShape | Shaped light | open · blinds · leaves · barndoor | Gobo, blocker and barndoor filters. |
| atmosphere | Air | clear · haze · beams | Atmosphere volume density. |
| lightChange | When the light changes | never · on the cut · on the action · during the hold | Matches the board's angleChange. |

**Suites**

- Noir: softness hard, contrast 4 stops, lightShape blinds, atmosphere haze
- Golden hour: colorTemp 3200K, key back, rim strong, softness soft
- Screen glow: practicalInFrame yes, colorTemp 7500K, lightCount 1

**Proximities**

- When a practical switches on, the key moves to it (within 0 beats)
- When a person approaches the lens, the rim drops and the key finds the face (within 1 beats)
- When volume drops, contrast rises (within 2 beats)

## Shading

Maya tools: Arnold Standard Surface · Toon · Flat · bump and displacement

What a surface does with light. Most of it is fixed per object, so the curiosities are the few that change through a scene, plus the overall render style.

| Id | Curiosity | Values | In Maya |
| --- | --- | --- | --- |
| renderStyle | Render style | photoreal · painterly · toon · flat | Toon shader gives ink lines and banded shade. |
| lineWeight | Ink line | none · thin · heavy | Toon contour width. The bridge to comic and zine. |
| gloss | Gloss | matte · satin · mirror | Specular roughness. |
| wetness | Wetness | dry · damp · soaked | Coat weight and roughness together. |
| skinLight | Light in skin | 0–5 | Subsurface amount. Reads strongest in close shots. |
| glow | Something glows | none · object · person · room | Emission. |
| wear | Wear | new · used · ruined | Can change inside a scene: a burn, mud, a scratch. |
| saturation | Color saturation | 0–5 | Of the frame as a whole. |

**Suites**

- Comic ink: renderStyle toon, lineWeight heavy, saturation 2
- Wet night: wetness soaked, gloss mirror, practicalInFrame yes
- Clean product: gloss satin, wear new, softness soft

**Proximities**

- When weather is rain, surfaces go wet (within 2 beats)
- When glow turns on, it becomes the key (within 0 beats)
- When shot size becomes close, light in skin shows (within 0 beats)

## Dynamics

Maya tools: nCloth · nParticles · nHair · nucleus fields (gravity, air, turbulence, drag) · rigid bodies

Things that move by simulation rather than by hand. The curiosity is how strongly the world pushes back and how long it keeps moving.

| Id | Curiosity | Values | In Maya |
| --- | --- | --- | --- |
| envMotion (board) | Motion of the environment | still · wind · crowd · water · transit |  |
| windForce | Wind | 0–5 | Air field magnitude. |
| turbulence | Chaos | 0–5 | Turbulence field. Calm drift against gusts. |
| clothResponse | Cloth reacts | stiff · loose · flutter | nCloth stretch and bend. |
| impacts | Impacts per beat | 0–8 | Collisions the audience notices. |
| breakage | Breaks | holds · cracks · shatters | An object fails. |
| settleTime | Settle time | beats until still | How long debris, cloth or hair keeps moving after a hit. |
| gravityFeel | Weight | floaty · real · heavy | Gravity and drag together. Dreams are floaty. |

**Suites**

- Storm: windForce 5, turbulence 4, clothResponse flutter
- Slow motion: gravityFeel floaty, settleTime long
- Brawl: impacts 6, breakage shatters, cameraCarry handheld

**Proximities**

- When an impact, the camera goes handheld (within 0 beats)
- When a door opens fast, cloth and hair react (within 1 beats)
- When breakage shatters, silence follows (within 2 beats)

## Fur

Maya tools: XGen Interactive Groom · nHair · Arnold Standard Hair (melanin, roughness)

Hair and fur as a look and as motion. The groom is fixed per character; what changes through a shot is wetness, wind response and how it catches light.

| Id | Curiosity | Values | In Maya |
| --- | --- | --- | --- |
| furLength | Length | short · medium · long |  |
| clump | Clumping | fine · tufted · matted | Clump modifier. Wet fur clumps. |
| frizz | Frizz | 0–5 | Noise modifier. |
| hairColor | Hair color | melanin 0–1 | Arnold uses melanin, the way real hair does. |
| hairShine | Shine | dull · sheen · glossy | Hair roughness and specular. |
| furResponse | Fur reacts to | nothing · wind · the body · both | nHair or a groom cache. |
| furLag | Fur lag | beats behind the body | The fur version of overlap. |

**Suites**

- Drenched: clump matted, hairShine glossy, furResponse the body
- Backlit fluff: frizz 4, rim strong, hairShine sheen

**Proximities**

- When wetness is soaked, clumping goes matted (within 1 beats)
- When rim light is strong, the fur edge glows (within 0 beats)
- When the character stops, fur settles (within 2 beats)

## Bifrost

Maya tools: Bifrost Graph · Aero (smoke, fire) · MPM (sand, snow, cloth) · liquids · scattering

Procedural graphs and large simulations. Good curiosities here are about the element and how it grows, not the solver.

| Id | Curiosity | Values | In Maya |
| --- | --- | --- | --- |
| element | Element | water · smoke · fire · sand · snow | Which solver and material. |
| density | Thickness | wisp · plume · wall | Volume density. |
| growth | Growth | shrinking · steady · building | Emission rate over the shot. |
| curl | Curl | 0–5 | How much the smoke or water swirls. |
| splash | Splash | none · drip · burst | Liquid response to an object. |
| scatter | Scattered things | 0–5 | Leaves, debris, crowd instances per area. |
| fireLight | Fire lights the scene | no · flicker · floods | Volume emission feeding the lighting. |

**Suites**

- Hearth: element fire, growth steady, fireLight flicker, colorTemp 2700K
- Avalanche: element snow, density wall, growth building, impacts 8
- Drift: element smoke, density wisp, curl 3, atmosphere beams

**Proximities**

- When fire is building, the key warms and flickers (within 0 beats)
- When an object drops into water, splash, then the surface settles (within 2 beats)
- When smoke thickens, contrast falls (within 1 beats)

## Proximities that cross areas

- When windForce rises (Dynamics), fur and cloth lag behind the body (Fur, Dynamics) (within 1 beats)
- When weather turns to rain (Place), wetness soaked, clump matted, gloss mirror (Shading, Fur) (within 2 beats)
- When fire is building (Bifrost), colorTemp warms and contrast rises (Lighting) (within 0 beats)
- When an impact lands (Dynamics), overshoot bounces and the camera goes handheld (Animation, Camera) (within 0 beats)
- When the character stops (Animation), overlap, fur lag and cloth settle, in that order (within 2 beats)
- When renderStyle becomes toon (Shading), lighting flattens to two bands and lineWeight rises (within 0 beats)
