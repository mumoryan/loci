# Loci — Session 01 Summary
**Type:** Exploratory brainstorm  
**Status:** Pre-design, pre-spec  
**Next step:** Product definition session — nail the design, outcome, and objectives before any further technical discussion

---

## What Loci Is

A personal VR space where notes are scattered throughout a dreamlike environment. Used for contemplation, reflection, memory, and creative world-building. Also a creative sandbox for building astonishing environments and experiences.

Core tension that emerged: this is simultaneously a *personal tool* (notes, reflection) and a *creative medium* (world-building, environments). Both need to be first-class. The product definition session should clarify which is primary in V1.

---

## What We Have Not Done Yet (Important)

- Defined the core user experience in concrete terms
- Established product objectives and success criteria
- Designed the actual UX flows — how you enter, navigate, create, and read notes
- Decided on the visual identity beyond rough aesthetic references
- Written any specs
- Validated assumptions with a prototype

**This is the work that needs to happen before going deeper on anything technical.**

---

## Aesthetic Direction (Rough)

References that came up:
- **The Beginner's Guide** — intimate, vast, slightly melancholy, contemplative pace, hand-placed feeling
- **Beat Saber** — neon emissives on near-black, glowing geometry, crisp and clean
- **Kentucky Route Zero** — mentioned implicitly in the "dreamlike" register

Synthesised direction: emissive notes floating in vast dark space, soft glow halos, slow ambient motion, retro but crisp. Not AAA. Intentional low-fi. Atmosphere over fidelity. Silence as texture.

Key insight: **the retro aesthetic and Quest's mobile GPU constraints are aligned, not fighting each other.** This is a free win.

---

## Platform Decision

- **VR only** — AR was considered and ruled out. AR breaks immersion; this experience depends on owning the full visual space.
- **Primary target:** Meta Quest (standalone)
- **Secondary:** PC VR via browser, open platform
- **Distribution strategy:** WebXR via browser URL — no app store friction

AR was correctly identified as working against the core design intent. Dropping it simplifies everything.

---

## Technology Decisions (Directional, Not Final)

These were discussed and directionally agreed but should be revisited once the product is defined.

### Frontend
- **React Three Fiber (R3F)** + `@react-three/xr` v6
- Rationale: cross-platform, fast iteration, good Quest browser support, JS/TS native
- `troika-three-text` for crisp SDF text rendering in VR (critical for a notes app)
- `drei` for helpers
- **Zustand** for world state management
- Custom GLSL shaders for dither/retro effects

### Why not Unity/AR Foundation
- Unity has a higher visual ceiling but slower iteration, app store friction, and a steeper learning curve
- For this aesthetic (retro, ambient, not AAA) the WebXR ceiling is sufficient
- Unity remains an option if specific Quest native features become necessary later

### Backend
- Simple REST API — FastAPI (Python) or Hono (TypeScript)
- WebSocket layer for future sync
- SQLite to start, Postgres + pgvector when semantic search is needed
- **Key principle:** Build the V1 data model as if multiplayer already exists

### Data model principle
Add `owner_id` and `world_id` to every table row from day one. V1 is single player but the schema should not need to change when shared sessions are added. The gap between single-player and multiplayer is just a WebSocket layer and a sessions table on top of the same core data.

---

## Multiplayer Vision

- **V1:** Single player only
- **Future:** Shared sessions — invite others into your world, read-only or collaborative
- **Design principle:** Build infrastructure for sharing from day one, expose it in V2

---

## AI / Agent Layer (Discussed, Not Designed)

Several AI roles were identified. None are specced yet.

**Multi-agent architecture concept:**
An orchestrator (Claude with tool use) routes to specialist agents:

- **World Builder agent** — takes mood/theme input, generates environment JSON (fog, lighting, particles, soundscape)
- **Note Placer agent** — decides 3D position and visual form for new notes based on content and spatial context
- **Reflection agent** — runs across all notes, surfaces patterns and hidden connections, can manifest as a new world or visual thread
- **Semantic Search agent** — embedding-based retrieval, spatially-aware results

**Voice-controlled world building:**
Pipeline concept: Voice → Whisper/Web Speech API → Claude → scene diff JSON → R3F renderer

Claude interprets natural language commands against a defined world state schema and outputs a partial diff. The schema is also the persistence format. Example: *"make it feel like dusk"* → `{ fogColor: "#FF6B35", ambientLight: 0.2, skyColor: "#1a0a2e" }`.

This does not exist as an off-the-shelf product. The components (Whisper, Web Speech API, Claude tool use, R3F) are all mature. The integration is the build.

---

## Development Process Vision

**AI-native development workflow:**
- Owner acts as PM/technical lead — writes specs, reviews output, makes product decisions, provides sensory/experiential feedback from inside the headset
- Claude Code acts as the implementing developer
- Multiple Claude Code instances can run in parallel on separate Git branches (backend, frontend, voice pipeline)

**What this requires:**
- A `/specs` folder in the repo — every feature starts as a markdown file
- Specs must be technical and precise: exact file paths, input/output types, acceptance criteria, which libraries to use
- An `ARCHITECTURE.md` that Claude Code reads at the start of every session
- Owner reviews diffs, not full files

**Honest limitations of this workflow:**
- Claude Code cannot test experiential/sensory quality in VR — that feedback loop is entirely human
- Fast-moving APIs (R3F, @react-three/xr) can produce outdated code — keep docs open
- Context drift over time if architectural decisions aren't documented

---

## Owner Background (Relevant to Approach)

- 6-7 years software engineering experience
- 5 years JS/TS web frontend
- Can read React, understands concepts, not deeply fluent
- Strong engineering fundamentals, learns quickly
- New to 3D environment building and game design

**Implication:** The 3D math (vectors, quaternions, scene graphs) is the only genuinely unfamiliar territory. Everything else maps to existing skills. Recommended approach: go straight to building with docs alongside rather than following tutorials. R3F fluency in 2-3 weeks is realistic.

---

## Rendering Notes (Quest-Specific)

Quest 3 is mobile-class GPU (Snapdragon XR2 Gen 2). Key constraints:

- 72fps minimum, 90fps preferred, ~4ms frame budget per eye
- **Do:** instanced geometry, MeshBasicMaterial/MeshToonMaterial, fog for distance culling, baked lighting, texture atlases, spatial audio via Web Audio API
- **Be careful with:** post-processing (bloom especially), dynamic shadows, transparent material stacking, particle counts above ~2k
- **Avoid:** real-time GI, uncompressed textures, high poly environments, DOM UI overlays in VR

**Fake bloom trick:** Beat Saber on Quest uses additive emissive halos (scaled mesh behind glowing objects with additive blending) rather than full-screen UnrealBloomPass. ~80% of the visual effect at near-zero GPU cost. This is the right approach for Quest.

---

## Open Questions (For Future Sessions)

These are the things that should be answered in the product definition session before any further technical work:

1. What is the core loop? How does a user actually spend 10 minutes in Loci?
2. How are notes created? Voice, controller, typed, imported?
3. How are notes navigated and discovered? Spatial proximity, search, themes?
4. What is a "world"? How many worlds does a user have? How do they move between them?
5. What does the note object look like? Card, orb, floating text, something else?
6. What is the entry experience? Where do you start each session?
7. Is world-building a separate mode or woven into normal use?
8. What is the emotional tone of the default world? Is it always dark/ambient or does it shift with content?
9. What does sharing actually mean — watch someone explore their world, or build together?
10. What is V1 scope — minimum viable experience that feels complete?

---

*Generated end of Session 01. Feed into project context before starting Session 02.*