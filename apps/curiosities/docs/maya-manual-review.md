# Maya and Arnold manual review

Every topic from the Maya User Guide and the Arnold for Maya User Guide that we went through, graded for this app. **Major** topics get working tools in the Studio tab where a browser can do it. **Minor** topics are listed for you to keep or skip. Change the Call column, or use the Manual sub-tab in Studio.

241 topics: 92 major, 149 minor. Pages actually read: 48; every other row is from working knowledge of Maya and is marked "knowledge".

## Major topics

### Maya

| Topic | Area | In the app | Studio tool | Call | Why | Curiosities |
| --- | --- | --- | --- | --- | --- | --- |
| Animating cameras (shake, follow, turntable) | Animation | Curiosity only |  | **keep** | Most-used camera tooling. | cameraMove, cameraCarry, cameraShake, moveSpeed |
| Animation layers (additive, override) | Animation | Working tool | remix | **keep** | Non-destructive remix layers fit remixers and live performers. | devAugment, devSwap, layerWeight |
| Animation principles in Maya tutorials | Animation | Curiosity only | motion | **keep** | The core of the Animation group. | anticipation, overshoot, overlap, arcs, squash, spacing |
| Audio for animation and lip sync | Animation | Curiosity only | face (partly) | **keep** | Dialogue scenes depend on it. | lipSync, breath |
| Auto Key and live recording | Animation | Working tool | curves | **keep** | Live performers record by playing. |  |
| Cycles and walk cycles | Animation | Curiosity only |  | **keep** | Gait reads character instantly. | characterSpeed, gait |
| Dope Sheet | Animation | Working tool | curves (partly) | **keep** | Grid of ticks is how studies are read. | poseRate |
| Editable motion trails | Animation | Working tool | motion (partly) | **keep** | Spacing dots make ease visible. | arcs, spacing |
| Ghosting (onion skin) | Animation | Working tool | motion | **keep** | Onion skin is the oldest animator check. | arcs, stepping |
| Graph Editor curves | Animation | Working tool | curves | **keep** | Curves over beats are the app's main drawing. | spacing, moveSpeed, afterLast |
| Graph Editor tangent types | Animation | Working tool | curves | **keep** | Tangent type is the plainest measurable motion feel. | spacing, stepping, easeType |
| Motion paths | Animation | Working tool | motion (partly) | **keep** | Floor plan paths are already drawn; markers make timing editable. | characterPath, objectPath, cameraMove, bank |
| Pose library and saved poses | Animation | Working tool | face | **keep** | Pose reuse is fast for beginners and live pads. | posture, gesture, faceIntensity |
| Retime tool | Animation | Working tool | remix (partly) | **keep** | Direct timing control everyone uses. | speedRamp, pace |
| Scene time warp | Animation | Working tool | curves | **keep** | Speed ramps are a filmmaker staple. | speedRamp |
| Setting keyframes | Animation | Working tool | curves | **keep** | Keys versus in-betweens is the first thing an animator learns. | poseRate, keyKind |
| Spacing and timing (ones, twos, holds) | Animation | Curiosity only | motion | **keep** | Core timing vocabulary. | stepping, spacing, settleTime, holdLength |
| Time Editor clips | Animation | Working tool | remix | **keep** | Clip mixing is the remixer and live-set workflow. | transition, repetition, clipLoop |
| Import sound file | Audio | Working tool | sequencer | **keep** | Sound drives timing. | musicCue, volume |
| Waveform on the time slider | Audio | Working tool | sequencer | **keep** | Waveform is the bridge to performers and editors. | volume, silence, soundToCut, loudPeak |
| Camera Sequencer (shots on a track) | Basics | Working tool | sequencer | **keep** | Closest Maya feature to the app itself: shots, cameras, cuts, audio. | cutRate, shotDuration, angleCount, transition, shotScale |
| Camera attributes | Basics | Curiosity only | camera | **keep** | Lens is the most-used camera measure. | lensLength, aspect |
| Playback rate and frame rate | Basics | Working tool | sequencer | **keep** | Live performers need loop and ping-pong; students need fps vs drawn-on-twos. | stepping, speedRamp, loopMode |
| Playblast (quick preview movie) | Basics | Working tool |  | **keep** | Everyone needs to share a quick motion preview; canvas recording makes it doable. | shotDuration |
| Sound in the scene (waveform on time slider) | Basics | Working tool | sequencer | **keep** | Lip sync, music video and live performance all key off audio. | volume, musicCue, soundToCut |
| Time slider and range slider | Basics | Working tool | sequencer (partly) | **keep** | The beat strip is the app's spine; bookmarks name sections for students and remixers. | shotDuration, sceneLength, beatBookmark |
| Viewports and camera views | Basics | Partly built |  | **keep** | Floor plan plus camera view is how filmmakers block; full 3D is out of scope. | shotSize, angleHeight, characterPath |
| Playblast (quick preview movie) | Camera Sequencer | Working tool |  | **keep** | Students and performers need a shareable animatic. | shotDuration |
| Pre/post hold and transitions in/out | Camera Sequencer | Working tool |  | **keep** | Transitions are core to editing study. | transition, shotDuration, holdFrames |
| Sequence time versus scene time | Camera Sequencer | Partly built | sequencer (partly) | **keep** | Edit time vs story time is a key remix lens. | speedRamp, sceneRate, timeOrder |
| Shot audio (audio linked to shots) | Camera Sequencer | Working tool | sequencer | **keep** | Cutting on sound is basic editing craft. | soundToCut, musicCue |
| Shots on tracks (camera, start, end) | Camera Sequencer | Working tool | sequencer | **keep** | Core edit model maps directly to beats. | shotDuration, angleCount, cutRate |
| Animated focus distance (rack focus) | Cameras | Working tool | camera (partly) | **keep** | Focus pulls are a direct storytelling tool. | rackFocus, focus, pullSpeed |
| Camera shake attribute (2D filmback shake) | Cameras | Working tool |  | **keep** | Shake on impact is common and performer friendly. | cameraShake, cameraCarry |
| Depth of field (f-stop, focus distance, focus region scale) | Cameras | Working tool | camera | **keep** | Shallow focus is a core visual signature filmmakers talk about. | depthOfField, focus, rackFocus, focusDistance |
| Focal length and angle of view | Cameras | Working tool | camera | **keep** | Lens choice is the most used camera value after shot size. | lensLength, shotSize, angleOfView |
| Image planes (reference footage behind the camera) | Cameras | Working tool |  | **keep** | Tracing reference is the remixer workflow. | shotSize, composition, referenceUsed |
| Look through selected / panel camera switching | Cameras | Partly built |  | **keep** | Maps to cut and setup counting. | angleCount, cutRate |
| Shutter angle and motion blur | Cameras | Partly built | camera (partly) | **keep** | Shutter look is a known genre cue (war films, action). | motionBlur, moveSpeed |
| Zoom versus dolly (focal length animated vs camera translated) | Cameras | Working tool | camera | **keep** | Classic filmmaker trick that is easy to explain in a timeline. | cameraMove, lensLength, moveSpeed, dollyZoom |
| Live character streaming from MotionBuilder (motion capture) | Devices | Partly built | rig (partly) | **keep** | Body straps are named audience hardware. | gesture, characterSpeed, stillness |
| MIDI and input devices (MPxMidiInputDevice, device editor) | Devices | Working tool | curves | **keep** | Performer audience needs this. | pedal, operatorFeel, liveInput |
| Record device input to keys | Devices | Working tool | curves | **keep** | Turns performance into a study. | operatorFeel, cameraShake |
| nCloth and cloth presets | Dynamics | Curiosity only | dynamics | **keep** | Costume weight changes how a move reads. | clothResponse, overlap, settleTime, clothWeight |
| Animated lights (flicker, switch on, sweep) | Lighting | Working tool | light | **keep** | Live light cues suit performers. | lightChange, fireLight |
| Area light (window, softbox) | Lighting | Partly built | light | **keep** | Soft vs hard light is basic. | softness, lightShape |
| Directional light (sun or moon) | Lighting | Working tool | light | **keep** | Key direction is a major lighting value the user asked for. | key, timeOfDay, lighting, keyDirection |
| Light fog (visible beam) | Lighting | Working tool | light | **keep** | Haze beams are a strong look. | atmosphere, lightShape, visibleBeam |
| Light intensity and color | Lighting | Working tool | light | **keep** | Already central. | key, colorTemp |
| Point light (bulb, practical) | Lighting | Working tool | light | **keep** | Practicals are a common look. | practicalInFrame, lightCount |
| Shadows: depth map vs raytraced, shadow color, softness | Lighting | Partly built | light (partly) | **keep** | Shadows are visible story cues. | softness, contrast, shadowShape |
| Spot light (cone, penumbra, dropoff) | Lighting | Working tool | light | **keep** | Performers and theater-style scenes use pools. | lightShape, softness, lightPool |
| Three-point lighting setup (key, fill, rim) | Lighting | Working tool | light | **keep** | Most taught lighting concept. | lightCount, rim, key, keyFillRatio |
| MASH Audio node | Motion graphics | Working tool |  | **keep** | Audio-reactive visuals are the performer's core. | volume |
| MASH Delay and Time (ripple offsets) | Motion graphics | Curiosity only |  | **keep** | Ripples on the beat are a live-visual staple. | callResponse, ripple |
| MASH Distribute | Motion graphics | Curiosity only | crowd | **keep** | Repetition patterns are a music-video staple. | repeatInFrame, visualDensity, arrayShape |
| Type tool and animated text | Motion graphics | Working tool | crowd (partly) | **keep** | Titles, captions, comic SFX lettering. | textDensity, soundLettering, typeOn |
| Image size, resolution presets, pixel aspect | Rendering | Partly built |  | **keep** | Needed for any export. | aspect |
| Render Setup layers, collections, overrides | Rendering | Partly built | passes | **keep** | Teaches the suite idea through a known tool. | renderStyle |
| Toon outlines: profile lines | Rendering | Working tool | light (partly) | **keep** | Outline weight is a comic signature. | lineWeight |
| Toon shading: fill (solid, light angle, shaded brightness) | Rendering | Working tool | light | **keep** | Comic and animation users want cel look. | renderStyle, valueKey, toneSteps |
| Blend shapes and Shape Editor | Rigging | Curiosity only | face | **keep** | Facial weights are a core acting value; pad performers can drive weights live. | faceIntensity, lipSync |
| Set Driven Key | Rigging | Working tool | curves | **keep** | Driver to driven is exactly how a live performer's controller maps to curiosities. | shotSize, cameraShake |
| Color management: rendering space and view transform (sRGB, ACES, log) | Shading | Partly built |  | **keep** | Grade is a major remix signature. | saturation, contrast, palette, gradeLook |
| Frame rate (working units: 24 film, 25 PAL, 29.97, 30, 48, 60) | Time | Working tool | sequencer | **keep** | Needed to turn beats into time. | stepping, shotDuration, frameRate |
| Playback speed and looping (real-time, half, every frame) | Time | Working tool | sequencer | **keep** | Live loops suit performers. | speedRamp |

### Arnold for Maya

| Topic | Area | In the app | Studio tool | Call | Why | Curiosities |
| --- | --- | --- | --- | --- | --- | --- |
| Camera exposure | Cameras | Working tool | camera (partly) | **keep** | Exposure shifts sell bright/dark transitions. | valueKey, exposure |
| Depth of field | Cameras | Working tool | camera | **keep** | Focus is a primary storytelling tool. | depthOfField, rackFocus |
| Perspective camera | Cameras | Curiosity only | camera (partly) | **keep** | Base camera; covered by existing ids. | lensLength, shotSize |
| Shutter angle and shutter curve | Cameras | Partly built | camera (partly) | **keep** | Narrow shutter equals jittery action; known since Saving Private Ryan. | motionBlur, blurTrail |
| Barndoor | Light filters | Working tool | light | **keep** | Shaping light into a slash is classic thriller lighting. | lightShape, lightCut |
| Gobo | Light filters | Working tool | light | **keep** | Patterned light is the cheapest strong look and already a curiosity. | lightShape, atmosphere, patternMotion |
| Animated and flickering lights | Lights | Working tool | light | **keep** | Light that changes in time is the most filmic of lighting acts. | lightChange, fireLight, flicker |
| Area light | Lights | Working tool | light | **keep** | The main film light; size and spread map straight to soft versus hard light. | key, softness, contrast, lightShape, sourceSize, lightSpread |
| Color and color temperature | Lights | Working tool | light | **keep** | Color of light is one of the strongest mood levers. | colorTemp, palette, warmCoolSplit |
| Directional light (sun) | Lights | Working tool | light | **keep** | Sun angle is the base of every exterior. | timeOfDay, key, softness, shadowLength |
| Intensity and exposure | Lights | Working tool | light | **keep** | Stops are how cinematographers talk; the manual uses the same math. | contrast, valueKey, keyStops |
| Physical sky | Lights | Working tool | light (partly) | **keep** | One knob that explains why sunlight changes through a day. | timeOfDay, colorTemp, sunHeight, haziness |
| Shadow density and color | Lights | Working tool | light (partly) | **keep** | Shadow depth and tint are easy to read and to remix. | contrast, shadowTone, shadowTint |
| Skydome light | Lights | Working tool | light | **keep** | Environment light is how most 3D scenes start; plain fill level is measurable. | timeOfDay, colorTemp, lighting, ambientFill |
| Spot light | Lights | Working tool | light | **keep** | Live performers and theatre-style staging use spots constantly. | key, lightShape, softness, spotFollow |
| Motion blur settings | Render settings | Curiosity only |  | **keep** | Already modeled. | motionBlur |
| RenderView snapshots and A/B compare | Render settings | Working tool |  | **keep** | A/B compare is how people learn what one change does. | lightChange |
| Standard Surface: base and diffuse | Shaders | Curiosity only |  | **keep** | Material reads matter for props. | palette, material |
| Standard Surface: emission | Shaders | Curiosity only |  | **keep** | Glowing screens and signs drive night scenes. | glow, practicalInFrame |
| Standard Surface: specular | Shaders | Curiosity only |  | **keep** | Shine reads instantly on screen. | gloss |
| Standard Surface: subsurface | Shaders | Curiosity only |  | **keep** | Skin glow is key to flattering faces. | skinLight |
| Toon outlines and edges | Shaders | Working tool | light (partly) | **keep** | Comic and zine panels depend on line weight. | lineWeight, lineVaries |
| Toon shader | Shaders | Working tool | light | **keep** | Animation and comic users want cel looks. | renderStyle, rim, toneBands |
| HDRI lighting | Tutorials | Partly built |  | **keep** | Most beginners light with an HDRI first. | key, timeOfDay, colorTemp, envTurn |
| Three-point lighting | Tutorials | Working tool | light | **keep** | The first lighting lesson for every beginner. | key, contrast, rim, lightCount, fillRatio |
| Atmosphere volume | Volumes | Working tool | light | **keep** | Haze is a defining cinematic look. | atmosphere, hazeLevel |

## Minor topics for review

### Maya

| Topic | Area | In the app | Studio tool | Call | Why | Curiosities |
| --- | --- | --- | --- | --- | --- | --- |
| Bake simulation / bake keys | Animation | Partly built |  | **keep** | Lets a live take become an editable study. |  |
| Breakdown keys | Animation | Curiosity only |  | **keep** | Favoring is a timing choice students study. | poseRate, favor |
| Buffer curves and curve snapshots | Animation | Working tool | curves | **keep** | Remixers compare original vs remixed curve. |  |
| Character sets and quick select sets | Animation | Partly built |  | **keep** | Same idea as suites. |  |
| Editing keys in the time slider | Animation | Working tool | curves | **keep** | Basic editing. |  |
| Expressions | Animation | Partly built | curves (partly) | **keep** | Noise and sine drive shake and idle motion. | cameraShake, valueWave |
| Ghosting for animation layers | Animation | Partly built |  | **keep** | Shows what a remix layer changed. |  |
| Graph Editor curve tools | Animation | Partly built |  | **keep** | Scale and simplify help editing studies. | spacing |
| Motion capture and live devices | Animation | Partly built | rig (partly) | **keep** | Performer audience. | gesture |
| Trax Editor (legacy clips and poses) | Animation | Partly built | remix | **keep** | Legacy, covered by the Time Editor row. |  |
| Visibility keys (pop on, pop off) | Animation | Curiosity only |  | **keep** | Pop-on reveals. | bodyEnter, objectEnter, reveal |
| Audio scrubbing and playback sync | Audio | Working tool | sequencer (partly) | **keep** | Small but expected. | breath, silence |
| Camera depth of field and motion blur | Basics | Curiosity only | camera | **keep** | Existing Maya-sourced rows; keeps them tied to the manual. | depthOfField, rackFocus, motionBlur |
| Camera rigs (camera and aim, camera aim and up) | Basics | Partly built | rig (partly) | **keep** | Aim-at-subject is how a follow pan is built. | moveFollows, cameraMove |
| Display layers | Basics | Partly built | passes (partly) | **keep** | Layer toggles reduce clutter on busy panels. |  |
| File referencing and assets | Basics | Partly built | remix (partly) | **keep** | Remixers reuse other people's strands; maps to Shelf import. |  |
| Heads-up display (frame counter, camera name) | Basics | Working tool |  | **keep** | Cheap, helps students read a panel. | lensLength |
| Image planes (reference images behind the camera) | Basics | Partly built |  | **keep** | Storyboarders and remixers trace over reference. |  |
| Outliner (scene list) | Basics | Partly built |  | **keep** | Students need a roster of what is on stage. | peopleCount |
| Project folders, scene units and preferences | Basics | Skip |  | **skip** | File management, nothing to measure. |  |
| Sequencer shot sync markers | Basics | Partly built |  | **keep** | Useful stale-preview flag for edited studies. |  |
| Editorial import/export (FCP XML, AAF) | Camera Sequencer | Partly built |  | **keep** | Bridges to editing software. | cutRate, shotDuration |
| Shot favorites and names | Camera Sequencer | Working tool | sequencer | **keep** | Small organizing win. |  |
| Ubercam / ubershot (one camera playing the whole cut) | Camera Sequencer | Working tool | sequencer | **keep** | Same as the app's play mode. | cutRate |
| 2D pan/zoom (punch-in without moving camera) | Cameras | Working tool |  | **keep** | Edit-room punch-ins are common in comedy and online video. | shotSize, cameraMove, punchIn |
| Camera bookmarks (saved views) | Cameras | Working tool |  | **keep** | Performers can fire saved setups from pads. | angleCount, angleFamily, setupReturn |
| Camera outputs: renderable, mask, depth | Cameras | Skip |  | **skip** | Technical. |  |
| Camera types (one node, aim, aim and up) | Cameras | Curiosity only | camera (partly) | **keep** | Aim-locked cameras explain why a move tracks a person. | moveFollows, cameraAim |
| Composition guides (thirds, golden, center) | Cameras | Working tool | camera | **keep** | Feeds the existing composition curiosity directly. | composition |
| Film back and film gate presets | Cameras | Curiosity only | camera (partly) | **keep** | Explains why the same mm looks different across formats. | aspect, lensLength, filmGauge |
| Film fit (fill, horizontal, vertical, overscan) | Cameras | Partly built | camera (partly) | **keep** | Vertical reframes of films are a common remix task. | aspect, composition, reframeFit |
| Film offset and film roll | Cameras | Curiosity only |  | **keep** | Maps cleanly onto existing Dutch value. | dutch, composition |
| Lens squeeze ratio (anamorphic) | Cameras | Curiosity only |  | **keep** | Remixers spot anamorphic flares and ovals. | aspect, lensSqueeze |
| Near and far clipping planes | Cameras | Skip |  | **skip** | Technical, invisible to the audience. |  |
| Orthographic versus perspective view | Cameras | Curiosity only |  | **keep** | Distinguishes isometric and side-scroller looks. | renderStyle, projection |
| Resolution gate, gate mask, overscan display | Cameras | Partly built | camera (partly) | **keep** | Visual aid for frame edges. | aspect, emptySpace |
| Safe action and safe title | Cameras | Working tool | camera | **keep** | Cheap overlay, teaches framing basics. | composition, insideSafe |
| Stereo camera: interaxial separation | Cameras | Curiosity only |  | **keep** | Only for 3D releases but measurable. | stereoDepth |
| Stereo camera: zero parallax plane (screen plane) | Cameras | Curiosity only |  | **keep** | Pop-out moments are timed beats in 3D films. | focus, screenPlane |
| Stereo viewing modes (anaglyph, interlace) | Cameras | Skip |  | **skip** | Viewer setting, not a beat value. |  |
| Depth pass for fog and DOF in compositing | Compositing | Curiosity only |  | **keep** | Links depth to mood. | atmosphere, depthOfField |
| Mask/alpha output and matte layers | Compositing | Partly built | passes (partly) | **keep** | Collage remix use. | visualDensity |
| HumanIK retargeting (one motion onto another body) | Devices | Partly built |  | **keep** | Retarget idea fits strand reuse. | gesture, posture |
| Motion capture cleanup and filters | Devices | Skip |  | **skip** | Technical. |  |
| Bifrost and fluid effects (liquid, smoke, fire) | Dynamics | Curiosity only |  | **keep** | Liquid feel is visible on screen. | splash, fireLight, atmosphere, element, viscosity |
| Fields (gravity, wind, turbulence, vortex, drag, radial, uniform, newton, volume axis) | Dynamics | Curiosity only | dynamics (partly) | **keep** | Weather moods. | windForce, turbulence, envMotion, swirl |
| Nucleus solver | Dynamics | Curiosity only | dynamics | **keep** | Kept as the source of gravity and wind values. | gravityFeel, windForce |
| Paint Effects (strokes, grass, trees) | Dynamics | Curiosity only |  | **keep** | Growth already exists. | growth |
| Rigid bodies and Bullet | Dynamics | Curiosity only | dynamics | **keep** | Collision beats. | impacts, breakage, overshoot |
| Simulation caching and initial state | Dynamics | Skip |  | **skip** | Pipeline internals. |  |
| Soft bodies and jiggle | Dynamics | Curiosity only |  | **keep** | Covered by wobble. | squash |
| XGen and fur grooming | Dynamics | Curiosity only |  | **keep** | Existing Maya-sourced rows. | furLength, clump, frizz, hairColor |
| nCloth constraints and tearing | Dynamics | Curiosity only | dynamics (partly) | **keep** | Breakage already exists. | breakage |
| nHair and dynamic curves | Dynamics | Curiosity only |  | **keep** | Hair follow-through is overlap. | furLag, furResponse |
| nParticles (points, balls, liquids) | Dynamics | Curiosity only | dynamics | **keep** | Debris and dust punctuate hits. | scatter, element, density, emitRate |
| Ambient light | Lighting | Curiosity only | light | **keep** | Fill amount sets mood. | key, contrast, fillLevel |
| Barn doors and decay regions (spot) | Lighting | Curiosity only | light | **keep** | Shapes light like a set flag. | lightShape |
| Decay rate (falloff) | Lighting | Curiosity only | light | **keep** | Explains pools of dark. | contrast, falloff |
| Light glow, halo, lens flare (optical FX) | Lighting | Curiosity only |  | **keep** | Flares are a signature some directors are known for. | glow, lensFlare |
| Light linking (light only some objects) | Lighting | Partly built |  | **keep** | Hero lighting is a readable choice. | skinLight, rim, heroLight |
| Projected image (spot light color map, gobo) | Lighting | Curiosity only | light | **keep** | Classic noir signature. | lightShape |
| Volume light (bounded region, negative light) | Lighting | Curiosity only |  | **keep** | Negative fill is a cinematographer term. | key, valueKey, negativeFill |
| NURBS curves and surfaces | Modeling | Partly built |  | **keep** | Path drawing uses the same curve idea; surfaces skipped. | characterPath, arcs |
| Object scale and proportion | Modeling | Curiosity only |  | **keep** | Scale shifts are a storytelling choice (giant/tiny). | scale |
| Polygon primitives and basic modeling | Modeling | Skip |  | **skip** | Mesh building is not a filmmaker measure. |  |
| Retopology, cleanup and mesh display | Modeling | Skip |  | **skip** | Technical modeling. |  |
| Sculpting tools | Modeling | Skip |  | **skip** | Asset creation only. |  |
| Smooth mesh preview and subdivision | Modeling | Skip |  | **skip** | Modeling internals. |  |
| UV mapping and unwrapping | Modeling | Skip |  | **skip** | Texture layout, no on-screen meaning per beat. |  |
| MASH Curve, Flight, Spring, Orient, World, Visibility, Color | Motion graphics | Curiosity only | crowd (partly) | **keep** | Crowd cohesion is a staging value. | overshoot, peopleCount, flocking |
| MASH Signal and Random | Motion graphics | Curiosity only | crowd | **keep** | Order vs chaos is measurable. | turbulence, copyJitter |
| AOVs / render passes (beauty, diffuse, specular, depth, mask) | Rendering | Partly built | passes (partly) | **keep** | Depth view helps blocking study. | depthOfField, passView |
| Batch render | Rendering | Skip |  | **skip** | Pipeline only. |  |
| Frame range, by-frame, file name padding | Rendering | Skip |  | **skip** | Pipeline only. |  |
| Image formats (PNG, EXR, TIFF, movie) | Rendering | Partly built |  | **keep** | Export only PNG/WebM in browser. |  |
| Renderer choice (Maya Software, Hardware, Arnold) | Rendering | Skip |  | **skip** | Engine choice is not a story value. | renderStyle |
| Toon line modifiers and line color/opacity | Rendering | Curiosity only |  | **keep** | Expressive line variation. | lineWeight |
| Toon outlines: crease, border and intersection lines | Rendering | Curiosity only |  | **keep** | Line detail varies by style and mood. | lineWeight, visualDensity, inkDetail |
| Viewport 2.0 / Hardware 2.0 (real-time look) | Rendering | Partly built |  | **keep** | Live preview is what a browser app can do. | depthOfField, motionBlur |
| Constraints (point, orient, parent, aim) | Rigging | Partly built | rig (partly) | **keep** | Handing props off is a staple staging beat. | objectPath, eyeline, moveFollows, carriedBy |
| Control curves and character pickers | Rigging | Partly built | rig (partly) | **keep** | UI idea only. |  |
| HumanIK full-body rig | Rigging | Partly built | rig (partly) | **keep** | Performers with body straps map onto a few effectors like HumanIK. | gesture, posture |
| IK and FK (posing limbs) | Rigging | Curiosity only | rig | **keep** | Planted contact is a readable acting beat. | touch, limbPlanted |
| Nonlinear and other deformers | Rigging | Curiosity only |  | **keep** | Squash/jiggle are cartoon staples. | squash, overlap, wobble |
| Skeletons and joints | Rigging | Partly built | rig | **keep** | A minimal stick body makes body curiosities visible. | leadPart, gesture |
| Skinning and paint weights | Rigging | Skip |  | **skip** | Mesh-to-bone binding has no beat value. |  |
| MEL and Python scripting | Scripting | Partly built |  | **keep** | Advanced users batch-edit studies. |  |
| Node Editor and connections | Scripting | Partly built |  | **keep** | Visualizes proximities and drivers. |  |
| Shelves, marking menus and hotkeys | Scripting | Working tool |  | **keep** | Performers need key/pad mappings. |  |
| 2D/3D textures and file textures | Shading | Skip |  | **skip** | Asset work. |  |
| Hypershade (material network editor) | Shading | Skip |  | **skip** | Tool UI, not a beat value. |  |
| Ramp shader (color by light angle) | Shading | Curiosity only |  | **keep** | Stylized color lever. | palette, renderStyle |
| Subsurface (skin) shading | Shading | Curiosity only |  | **keep** | Maps to existing value. | skinLight |
| Surface materials (Lambert, Blinn, Phong, Standard Surface) | Shading | Curiosity only |  | **keep** | Gloss is readable on screen. | gloss, wetness |
| Time warp (retime animation curve) | Time | Curiosity only | curves | **keep** | Speed ramps are an action signature. | speedRamp |
| Timecode display and drop frame | Time | Working tool | sequencer | **keep** | Lines up studies with real cuts. | shotDuration |

### Arnold for Maya

| Topic | Area | In the app | Studio tool | Call | Why | Curiosities |
| --- | --- | --- | --- | --- | --- | --- |
| Beauty and component AOVs | AOVs | Partly built | passes (partly) | **keep** | Seeing light layers teaches lighting. |  |
| Cryptomatte | AOVs | Skip | passes (partly) | **skip** | Compositing mask tool. |  |
| Depth (Z) AOV | AOVs | Curiosity only |  | **keep** | Supports depth-based looks. | depthOfField |
| Light groups and light path expressions | AOVs | Partly built | passes (partly) | **keep** | Relighting in comp is advanced but useful to see. | lightCount |
| Aperture blades and bokeh shape | Cameras | Curiosity only |  | **keep** | Oval bokeh is a signature anamorphic tell. | depthOfField, bokehShape |
| Cylindrical camera | Cameras | Skip |  | **skip** | Rare in narrative work. |  |
| Fisheye camera | Cameras | Curiosity only |  | **keep** | Music videos and skate films. | lensLength |
| Orthographic camera | Cameras | Curiosity only |  | **keep** | Wes-Anderson-like flat staging and side-scrollers. | renderStyle, projection |
| Rolling shutter | Cameras | Curiosity only |  | **keep** | Found-footage realism. | cameraCarry, skew |
| Spherical and VR cameras | Cameras | Skip |  | **skip** | VR output is outside the strip-based app. | aspect |
| UV remap, filtermap and vignetting | Cameras | Curiosity only |  | **keep** | Vignettes steer the eye; cheap to draw. | composition, vignette |
| Light blocker | Light filters | Working tool | light | **keep** | Flagging light off walls is how pros add contrast. | lightShape, contrast, flag |
| Light decay | Light filters | Curiosity only | light | **keep** | Steep falloff makes isolated pools of light. | contrast, falloff |
| Light AOV group | Lights | Partly built | passes (partly) | **keep** | Soloing lights is a strong teaching view. | lightCount |
| Light linking and shadow linking | Lights | Curiosity only |  | **keep** | Lighting only the hero is a common cheat. | lightCount, lightOwner |
| Light portal | Lights | Skip |  | **skip** | A render-efficiency tool with no visible effect of its own. |  |
| Light samples | Lights | Skip |  | **skip** | Render cost, not a visible choice. |  |
| Max bounces and per-light diffuse/specular | Lights | Curiosity only |  | **keep** | Pros cheat lights to hit only eyes or only fill. | gloss, lightJob |
| Mesh light | Lights | Curiosity only | light | **keep** | Neon, screens and lamp shades are practicals the board already tracks. | glow, practicalInFrame |
| Normalize | Lights | Partly built | light | **keep** | Teaches that size equals softness without confounding brightness. | softness |
| Photometric light | Lights | Curiosity only |  | **keep** | Scalloped wall light is a recognizable practical look. | practicalInFrame, lightShape, throwPattern |
| Point and sphere light | Lights | Curiosity only | light | **keep** | Classic interrogation-room bulb. | practicalInFrame, softness |
| Volume contribution | Lights | Partly built |  | **keep** | Beams through haze are a common cinematic look. | atmosphere, beamFromLight |
| Operators (set parameter, merge, override) | Operators/procedurals | Partly built |  | **keep** | Same idea as a suite; useful for performers switching looks live. |  |
| Stand-ins and procedurals (.ass) | Operators/procedurals | Skip |  | **skip** | Scene management. |  |
| Adaptive sampling and noise | Render settings | Skip |  | **skip** | Technical. |  |
| Camera (AA) and ray-type samples | Render settings | Skip |  | **skip** | Render cost, not storytelling. |  |
| Color management and view transform | Render settings | Curiosity only |  | **keep** | A look transform defines a show's color. | saturation, filmLook |
| Denoisers (OptiX, Noice, OIDN) | Render settings | Skip |  | **skip** | Pipeline tool. |  |
| GPU rendering | Render settings | Skip |  | **skip** | Hardware choice. |  |
| IPR and Arnold RenderView | Render settings | Partly built |  | **keep** | Model for instant feedback in the preview. |  |
| Pixel filter | Render settings | Skip |  | **skip** | Sharpness tweak. |  |
| Ray depth | Render settings | Curiosity only |  | **keep** | Bounce changes contrast in interiors. | contrast, bounce |
| Visible noise and grain | Render settings | Curiosity only |  | **keep** | Grain is a style choice even if render noise is not. | grain |
| Ambient occlusion | Shaders | Curiosity only |  | **keep** | AO grounds objects; useful style knob. | contrast, contactShadow |
| Curvature shader | Shaders | Skip |  | **skip** | Texturing helper. |  |
| Facing ratio toon setup | Shaders | Partly built |  | **keep** | Teaches how edge falloff makes cartoon shading. | renderStyle |
| Layer shader and mix | Shaders | Skip |  | **skip** | Technical node graph. |  |
| Matte and shadow matte | Shaders | Partly built |  | **keep** | Remixers composite drawn things into footage. | renderStyle, liveMix |
| Opacity and cutout | Shaders | Skip |  | **skip** | Technical, not a story choice. |  |
| Standard Hair | Shaders | Curiosity only |  | **keep** | Already modeled. | hairColor, hairShine |
| Standard Surface: coat | Shaders | Curiosity only |  | **keep** | Covered by gloss. | gloss |
| Standard Surface: sheen | Shaders | Curiosity only |  | **keep** | Minor read on costume. | clothResponse |
| Standard Surface: thin film | Shaders | Curiosity only |  | **keep** | Sci-fi and dream sequences use it. | glow, iridescence |
| Standard Surface: transmission | Shaders | Curiosity only |  | **keep** | Shooting through glass is a framing device. | seeThrough |
| Utility shader | Shaders | Skip |  | **skip** | Debug tool. |  |
| Wireframe shader | Shaders | Curiosity only |  | **keep** | Hologram/HUD looks. | renderStyle |
| Pattern and texture scale | Textures | Curiosity only |  | **keep** | Busy backgrounds change readability. | visualDensity |
| TX texture conversion and tiling | Textures | Skip |  | **skip** | Pipeline optimization. |  |
| aiImage texture | Textures | Skip |  | **skip** | File plumbing. |  |
| Interior lighting tutorial (museum) | Tutorials | Curiosity only |  | **keep** | Interior day mix is a frequent setup. | intExt, practicalInFrame, lightCount |
| Fog | Volumes | Curiosity only | light | **keep** | Depth fade separates planes. | weather, atmosphere, depthFade |
| VDB volumes (smoke, fire, clouds) | Volumes | Curiosity only |  | **keep** | Already covered by element curiosities. | element, fireLight |

## Next to build

Major topics no Studio tool covers yet, most valuable first.

- {'rank': 1, 'id': 'motion-paths', 'area': 'animation', 'missing': 'Draw your own path on the floor plan for a character, prop or camera, with follow and bank; Motion only offers preset path shapes.', 'status': 'partly covered by motion'}
- {'rank': 2, 'id': 'motion-trails', 'area': 'animation', 'missing': 'Drag the spacing dots on the trail to retime; the trail is display only today.', 'status': 'partly covered by motion'}
- {'rank': 3, 'id': 'retime-tool', 'area': 'animation', 'missing': 'Retime markers inside a curve to squeeze or stretch a span; Remix only retimes whole clips.', 'status': 'partly covered by remix'}
- {'rank': 4, 'id': 'camera-shake', 'area': 'animation', 'missing': 'Keyed camera shake for impacts and handheld; no tool sets cameraShake over time.', 'status': 'not covered'}
- {'rank': 5, 'id': 'focus-pull', 'area': 'animation', 'missing': 'Keyed focus pull between two subjects on a line or action; Camera has only a one-shot rack button.', 'status': 'partly covered by camera'}
- {'rank': 6, 'id': 'dope-sheet', 'area': 'animation', 'missing': 'A full Dope Sheet that moves and scales keys for every curiosity at once; Curves has one row only.', 'status': 'partly covered by curves'}
- {'rank': 7, 'id': 'arnold-shadow-density-color', 'area': 'lighting', 'missing': 'Shadow density and color controls (blue night shadows, faint fill shadows).', 'status': 'partly covered by light'}
- {'rank': 8, 'id': 'arnold-snapshots-ab', 'area': 'lighting', 'missing': 'Snapshot a look and wipe A/B against the current one in Light & look.', 'status': 'not covered'}
- {'rank': 9, 'id': 'arnold-physical-sky', 'area': 'lighting', 'missing': 'A sun position (elevation, azimuth) driving sky color and time of day; today only presets.', 'status': 'partly covered by light'}
- {'rank': 10, 'id': 'toon-profile-lines', 'area': 'shading', 'missing': 'Line weight and color controls for ink outlines in panels; Ink is on or off.', 'status': 'partly covered by light'}
- {'rank': 11, 'id': 'arnold-toon-outlines', 'area': 'shading', 'missing': 'Same as above for Arnold toon edges: silhouette, crease, line width by depth.', 'status': 'partly covered by light'}
- {'rank': 12, 'id': '_note-dynamics-fur-bifrost', 'area': 'dynamics/fur/Bifrost', 'missing': 'No major build topic is uncovered in dynamics; fur (XGen, nHair) and Bifrost liquids have no tool yet (studio-fur.js, studio-bifrost.js not in the folder), and their rows are fit curiosity, so they are listed here as the next Sharani areas to build.', 'status': 'not covered'}
- {'rank': 13, 'id': 'playblast', 'area': 'other', 'missing': 'Export the board or ubershot as a WebM or GIF flipbook with MediaRecorder; no tool exports a movie yet.', 'status': 'not covered'}
- {'rank': 14, 'id': 'seq-playblast', 'area': 'other', 'missing': 'Same as playblast, from the Shots sequencer.', 'status': 'not covered'}
- {'rank': 15, 'id': 'mash-audio', 'area': 'other', 'missing': "Drive a crowd or any curiosity from the loaded sound's loudness (WebAudio) for performers.", 'status': 'not covered'}
- {'rank': 16, 'id': 'seq-hold-transitions', 'area': 'other', 'missing': 'Pre/post hold and dissolve or wipe transitions between shots in Shots.', 'status': 'not covered'}
- {'rank': 17, 'id': 'type-tool', 'area': 'other', 'missing': 'Title and caption type-on by letter, word or line with delay and reverse order.', 'status': 'partly covered by crowd'}
- {'rank': 18, 'id': 'time-slider', 'area': 'other', 'missing': 'Named bookmark spans over the beat strip.', 'status': 'partly covered by sequencer'}
- {'rank': 19, 'id': 'image-plane', 'area': 'other', 'missing': 'Drop a reference still or storyboard image behind a panel.', 'status': 'not covered'}
- {'rank': 20, 'id': 'arnold-camera-exposure', 'area': 'other', 'missing': 'Exposure in stops on the camera, tied to Light & look.', 'status': 'partly covered by camera'}

## Pages read

- https://download.autodesk.com/global/docs/maya2014/en_US/files/GUID-E1BB9406-F1BC-4784-B89C-E289D07A3C31.htm
- https://download.autodesk.com/us/maya/2009help/files/Toon_shading_Types_of_toon_lines.htm
- https://help.autodesk.com/cloudhelp/2016/ENU/Maya-Tech-Docs/Commands/shot.html
- https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-32296732-723B-457F-88EB-681A2965ED3E.htm
- https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-9D37DF95-4AC6-4FBE-960A-66531104D758.htm
- https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-C85B12D5-EB38-45D4-BA21-5E5A63330B7D.htm
- https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-F976E7C0-394C-4797-85DF-C0F8D0CCB800.htm
- https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-FDCA1426-D7FE-41A5-9563-5628C736BCCC.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-10701398-2AE0-4A3A-8C9F-F26C4EB4D4CE.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-19B154DE-58F2-46AF-B2EF-7D00B2E46476.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-1EC3357B-62DD-424F-9595-277C373D133C.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-22BF637E-5F92-4D2E-91E6-2FF1CA392270.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-2D865271-2873-4EDB-82C4-7FB9D7B311E7.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-2DFBE283-1A1E-4194-B6C5-B4E0F72D61CA.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3C92402C-B24E-4874-AC8D-EADF976A19DC.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-43A4FE2C-4863-4EA6-B6AE-6D2B6757F6C7.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-4D653DC9-57AA-4D8B-987A-5B7A9735CAF0.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-62FA61B5-4A76-4525-83BC-550EEF245936.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-65271F97-19E4-4E3E-A541-F89F7247B6BF.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-92112B70-161B-4D89-A1E5-BC3D58274EFB.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-A8D2F488-8215-46F2-8D96-9503E2D0669A.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-A9CA3572-FAFA-440D-92EB-37566A2DFE0B.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-ACC3EC75-5564-49FB-9571-CF43ACCA001A.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-B1BBD05B-0172-4626-A85C-35943A67E8BE.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-B718F1FE-8688-4A57-95DD-5B22C4D40F1A.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-BBCA0BC3-7608-4E86-8E9F-B4099C316156.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D2B1C7EF-F177-4B0E-9E41-B479CFF2AFD4.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D4FECFDC-F91A-4BDC-A1B0-A24EB087B2DD.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-E43621EC-5810-47FF-90FE-168ADFA63C4E.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-E4B5DB7D-7351-4561-BD8B-60AC9D48DDF6.htm
- https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-F7BE47E6-76D5-47F0-8159-9F39FF0C4215.htm
- https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm
- https://help.autodesk.com/cloudhelp/2023/ENU/Maya-Animation/files/GUID-2656574F-FBC6-457B-B0C1-5C1249DA89EF.htm
- https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/getting-started/am-Hyperspace_Madness_Production/arnold_for_maya_getting_started_am_Hyperspace_Effect_using_a_Gobo_and_Atmosphere_Volume_html.html
- https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Shading/arnold_for_maya_shading_am_Using_Barndoor_Filter_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-lights/ac-light-filters/arnold_user_guide_ac_light_filters_ac_light_blocker_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-lights/arnold_user_guide_ac_lights_ac_light_filters_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-output-aovs/arnold_user_guide_ac_output_aovs_ac_aovs_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-render-settings/arnold_user_guide_ac_render_settings_ac_sampling_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_render_settings_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/arnold_for_maya_am_Getting_Started_with_Arnold_GPU_html.html
- https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Shading/am-Toon_Tutorials/arnold_for_maya_toon_am_Toon_Shading_with_the_Facing_Ratio_shader_html.html
- https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html
- https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html
