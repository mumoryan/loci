# Loci — Session 02
**Product Definition, Default World & Agent Architecture**
*March 2026 · Pulse point: ready for architecture and first feature specs*

---

## Part 1 — V1 Product Definition

### Product identity

Loci is a contemplation tool. Notes are the primary content; the world is atmosphere that holds them. World-building is a power feature that arrives once the note experience is solid.

### Session entry flow

> Darkness → Historical quote fades in → Ambient fade to default world → World selector (optional)

Each session opens in the same default world. The world selector is available but not forced — it lives outside the space.

### Worlds

A world is a discrete environment with its own mood, geometry, and purpose. Not just aesthetic variation — each world has a narrative reason to exist.

| World | Description |
|-------|-------------|
| Story tower | Climb with notes as chapters |
| Thought gallery | Random placement, browsing |
| Principles temple | Greek architecture, beliefs |

**Navigation:** Worlds are selected from a menu outside the space. Entry and exit are deliberate — never accidental.

### Notes

| Attribute | Definition |
|-----------|------------|
| Object type | Orbs / glyphs — abstract objects with presence before content. Text reveals on approach. |
| Discovery | Wander to find, glow to confirm. Orbs brighten as you near them. No map, no list. |
| Creation | Voice (primary in-headset), controller / hand input, import from outside (phone, desktop). |

### World-building controls

A small exposed set of parameters (fog, light intensity, colour temperature) backed by a multi-agent AI network with defined MCPs. Simple interface, intelligent engine.

### V1 scope

| | Feature |
|---|---------|
| ✅ | Note creation via voice, controller, and import |
| ✅ | Orb/glyph note objects with proximity reveal |
| ✅ | Multiple worlds with distinct geometry and mood |
| ✅ | World selector menu (outside the space) |
| ✅ | Entry sequence: darkness → quote → fade to default world |
| ✅ | Basic world controls (fog, light, colour) + AI agent backend |
| ❌ | Multiplayer / shared sessions |
| ❌ | Reflection agent / semantic note connections |
| ❌ | Voice-controlled world building via natural language |

---

## Part 2 — Default World Definition

### The Hokkaido mansion

A sleek, minimalistic mansion at the peak of an unnamed Hokkaido mountain. Warm wood panels, clean geometry, deliberate silence. Modernised Japanese architecture — the Hitman Hokkaido register. Not a home, not a hotel. Something between a sanctuary and a private museum.

| Attribute | Value |
|-----------|-------|
| Tone | Warm wood, calming, minimal, sleek geometry, deliberate silence |
| Reference | Hitman World of Assassination — Hokkaido / GAMA facility mission |
| View | Floor-to-ceiling glass. Snow-covered mountain peaks in the far distance — visible, vast, unreachable. |

### Time of day — ambient shifts

The world tracks real local device time. Lighting shifts subtly across three registers. The architecture stays constant — only light temperature, shadow angle, and sky colour change.

| Time | Light | Feel |
|------|-------|------|
| Morning | Cool blue-white | Long shadows across wood floors. Mountains sharp and clear. Still. |
| Afternoon | Neutral warm | High diffuse. Peaks catch yellow on their edges. The default register. |
| Evening | Amber, low on walls | Mountains silhouette against deep blue. Orbs glow warmer. |

*Time-of-day uses real device clock. No manual override in V1 — the world responds to when you show up.*

### Quest rendering guidance

| Element | Implementation |
|---------|---------------|
| Wood surfaces | Baked diffuse textures, MeshBasicMaterial. No dynamic shadows. |
| Ambient shift | Interpolated fog colour + hemisphere light intensity keyed to device clock. |
| Mountains | Low-poly distant mesh, no detail needed. |
| Glass | Semi-transparent plane, additive blend, no refraction. |
| Orbs | Emissive MeshBasicMaterial + additive halo mesh — the fake bloom trick. |
| Constraints | No bloom post-processing, no dynamic shadows, no real-time GI. |

---

## Part 3 — Agent Architecture

### Repository structure

Two repos, not one, not three.

```
loci-docs/                 ← human only, never touched by agents
  sessions/
    session-01.md
    session-02.md
  decisions/               ← architectural decision records
  sketches/                ← rough ideas, explorations

loci/                      ← everything Claude touches
  .claude/
  │   ├── CLAUDE.md        ← project memory, read every session
  │   └── agents/          ← subagent definitions (md files)
  │       ├── supervisor.md
  │       ├── frontend-dev.md
  │       ├── backend-dev.md
  │       ├── world-builder.md
  │       └── code-reviewer.md
  ├── scripts/
  │   └── guard-core.sh    ← blocks agent writes to protected paths
  ├── specs/               ← every feature starts here, colocated with code
  │   └── entry-sequence.md
  ├── frontend/            ← R3F + WebXR app
  ├── backend/             ← FastAPI or Hono
  ├── ARCHITECTURE.md      ← single source of truth
  └── mcp.json             ← MCP server config
```

Specs belong in `loci/` alongside the code — not in `loci-docs/`. A spec is an instruction to an agent. The reviewer needs to read the spec and the diff in the same context window.

Agents live in `.claude/agents/` as markdown files with YAML frontmatter. No Python, no framework.

### Agent write protection

Agents must never modify their own definitions, `ARCHITECTURE.md`, or `CLAUDE.md`. This is enforced at the tool level — not by trust.

**Guard script** (`scripts/guard-core.sh`):

```bash
#!/bin/bash
# Blocks any agent write to protected core paths.
# Called as a PreToolUse hook before every Write, Edit, or Bash tool call.

INPUT=$(cat)
PATH=$(echo "$INPUT" | jq -r '.tool_input.path // ""')

if echo "$PATH" | grep -qE '^\.(claude|git)/|ARCHITECTURE\.md|CLAUDE\.md|mcp\.json'; then
  echo "Blocked: agents cannot modify core architecture files" >&2
  exit 2  # exit 2 = hard block, Claude Code will not proceed
fi
```

**Applied in every agent definition:**

```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit|Bash"
      hooks:
        - type: command
          command: "./scripts/guard-core.sh"
```

**Protected paths (read-only for all agents):**

| Path | Reason |
|------|--------|
| `.claude/` | Agent definitions — agents cannot rewrite their own instructions |
| `ARCHITECTURE.md` | Constitution — only the human PM modifies this |
| `CLAUDE.md` | Project memory — human-authored, not agent-authored |
| `mcp.json` | MCP server config — controls what agents can reach |

Agents have full write access to `/frontend`, `/backend`, and `/specs`. All other paths are read-only by default.

### Agent definition format

```markdown
---
name: world-builder
description: Generates scene diff JSON from mood/theme input.
             Triggered when any world environment change is needed.
tools: Read, Write, Bash
disallowedTools: Edit
memory: project
---

You are the World Builder agent for Loci.
You read ARCHITECTURE.md and the world schema before every task.
You output partial scene diffs only — never full world rewrites.
Schema lives at: backend/schema/world.ts
Exit condition: valid JSON matching WorldDiff type with no TS errors.
```

The `description` field is the routing rule — write it like a signal, not a job title. The system prompt holds constraints, schema references, and exit conditions.

### Agent roles

| Agent | Model | Role |
|-------|-------|------|
| Supervisor | claude-opus-4-6 | Reads the spec, decomposes the task, routes to executors, collects results, decides done/retry. Never writes code. Tools: Read only. |
| Frontend dev | claude-sonnet-4-6 | R3F, WebXR, Zustand, shaders. Works in /frontend only. Reads ARCHITECTURE.md and the active spec before every task. |
| Backend dev | claude-sonnet-4-6 | FastAPI/Hono, SQLite, REST endpoints. Works in /backend only. Enforces `owner_id` + `world_id` on every schema change. |
| World builder | claude-sonnet-4-6 | Mood/theme input → scene diff JSON. Reads world schema. Outputs partial diffs only — never full world rewrites. |
| Code reviewer | claude-sonnet-4-6 | Read-only. Checks diff against spec acceptance criteria, ARCHITECTURE.md constraints, and Quest rendering budget. Returns pass/fail + comments. |

### Parallel flow

```
Supervisor reads spec
  │
  ├── [parallel] Frontend dev  ← git worktree: feat/entry-sequence-fe
  ├── [parallel] Backend dev   ← git worktree: feat/entry-sequence-be
  │
  ↓  both complete
Code Reviewer reads both diffs
  │
  ├── PASS → Supervisor merges, spec closed
  └── FAIL → routes back to executor with reviewer comments
              max 2 retry iterations, then escalate to human
```

Git worktrees are the mechanism — each agent gets its own checked-out branch on the same filesystem. Run simultaneously in separate terminal tabs or tmux panes.

### Exit conditions

| Condition | Definition |
|-----------|------------|
| Executor done | TypeScript compiles clean, lint passes, all acceptance criteria in the spec are checkable by the reviewer without running the headset. |
| Reviewer pass | Diff matches spec intent. No ARCHITECTURE.md violations. No Quest rendering budget violations (no bloom, no dynamic shadows, etc). |
| Retry limit | 2 iterations max per agent per spec. On third failure, agent writes a blocker comment to the spec file and stops. Human resolves. |
| Human-only gate | Experiential / sensory quality in headset. Agents cannot test this. Every spec must include a human review section checked in-headset before closing. |

### MCP configuration

```json
// .claude/mcp.json
{
  "servers": {
    "loci-db-dev":  { "url": "...", "scope": "backend-dev" },
    "loci-db-prod": { "url": "...", "scope": "human-only" },
    "scene-schema": { "url": "...", "scope": "world-builder, supervisor" },
    "filesystem":   { "url": "...", "scope": "all", "access": "read" }
  }
}
```

### Key limitations

| Limitation | Mitigation |
|------------|------------|
| Context drift | Long sessions degrade. CLAUDE.md + ARCHITECTURE.md are the anchors. Split sessions at natural feature boundaries, not mid-feature. |
| MCP token cost | Too many MCP servers = 40–50% of context eaten by tool definitions before any work. Keep MCPs minimal per agent. |
| No headset testing | Agents cannot validate experiential quality in VR. Every spec needs a human review section that is explicitly not delegatable. |
| Fast-moving APIs | R3F and @react-three/xr docs change quickly. Pin versions in package.json. Keep relevant docs linked in each spec. |
| Cost | Parallel Opus sessions are expensive. Supervisor = Opus. Executors + Reviewer = Sonnet. Opus only where orchestration judgment is needed. |

### Repo structure — single repo with sparse checkout

One repo, not two or three. `loci-docs/` lives inside it but is excluded from every agent worktree via git sparse checkout — agents can't read it, can't list it, can't reach it.

```
loci/                          ← single repo, your full checkout sees everything
  loci-docs/                   ← human only — invisible to agent worktrees
    sessions/
    decisions/
  .claude/
    CLAUDE.md
    agents/
  specs/
  frontend/
  backend/
  scripts/
    guard-core.sh              ← blocks agent writes to protected paths
    new-agent-worktree.sh      ← automates sparse checkout setup
  ARCHITECTURE.md
  mcp.json
```

**Spinning up an agent worktree:**

```bash
# scripts/new-agent-worktree.sh
AGENT=$1   # e.g. "frontend-dev"
BRANCH=$2  # e.g. "feat/entry-sequence-fe"

git worktree add worktrees/$AGENT $BRANCH
cd worktrees/$AGENT
git sparse-checkout init --cone
git sparse-checkout set frontend backend specs .claude scripts ARCHITECTURE.md
echo "Worktree ready for $AGENT — loci-docs excluded"
```

Run `./scripts/new-agent-worktree.sh frontend-dev feat/entry-sequence-fe` and the agent gets a clean, restricted working tree in one command. `loci-docs/` is physically absent from the folder — not hidden, not permission-blocked, simply not checked out.

**Two layers of protection:**

| Threat | Mitigation |
|--------|------------|
| Agent reads loci-docs | Sparse checkout — directory not present in worktree |
| Agent writes to .claude or ARCHITECTURE.md | PreToolUse guard script blocks it |
| Agent writes to loci-docs via absolute path | Sparse checkout — path doesn't exist to write to |

### Base agents — reusability across projects

Agent definitions have two layers. Base agents live in a shared repo and define the role generically. Project-level overrides are thin files that add project-specific context.

```
studio/
├── agents/                    ← shared base agents, reused across all projects
│   ├── supervisor.md
│   ├── frontend-dev.md
│   ├── backend-dev.md
│   ├── code-reviewer.md
│   └── world-builder.md
└── loci/                      ← project repo
    └── .claude/
        └── agents/            ← thin overrides only
            ├── backend-dev.md
            └── world-builder.md
```

A project override references the base and adds only what's specific to this project:

```markdown
---
name: backend-dev
description: Implements backend features in /backend for this project.
tools: Read, Write, Bash
memory: project
hooks:
  PreToolUse:
    - matcher: "Write|Edit|Bash"
      hooks:
        - type: command
          command: "./scripts/guard-core.sh"
---

Read and follow all base instructions from: ../../agents/backend-dev.md

Project overrides for Loci — these take precedence over the base:
- Schema lives at backend/schema/
- Every table must have owner_id and world_id
- SQLite in dev, Postgres + pgvector in prod
- Stack: Fastify (TypeScript), not FastAPI
- Exit condition: tsc compiles clean, no lint errors, migration file included
```

Improvements to a base agent automatically benefit every project using it.

---

### How agents actually execute

**Claude Code runs entirely on your local machine.** There are no dedicated Anthropic servers processing your code. The only remote call is inference.

```
Your machine
├── Claude Code process (local, runs in your terminal)
│   ├── reads files directly from your filesystem
│   ├── executes bash commands in your local shell
│   └── writes file changes directly to disk
│
└── Anthropic API (the only remote call)
    └── sends: system prompt + file contents + conversation history
        receives: next action (read this file / write this / run this command)
```

The execution loop:

1. You give Claude Code a task
2. It reads relevant files from local disk into the context window
3. That context is sent to the Anthropic API — the model lives there
4. The API responds with a tool call: read file X, write this to Y, run this bash command
5. Claude Code executes that tool call locally
6. The result goes back into context, sent to the API again
7. Repeat until the task is done

Your code never lives on Anthropic's servers. Only what gets included in the context window crosses the wire — transiently, not stored.

**What a worktree actually is:**

A worktree is a second (or third) folder on your local disk pointing at a different branch of the same repo. No networking. You open separate terminal tabs, run `claude` in each worktree folder, and those are independent Claude Code processes — each with its own context window, each making its own API calls, each reading and writing only the files in its folder.

```
Your filesystem
├── loci/                        ← your main checkout (full)
└── loci/worktrees/
    ├── frontend-dev/            ← second checkout, feat/entry-sequence-fe branch
    └── backend-dev/             ← third checkout, feat/entry-sequence-be branch
```

**The VS Code plugin** is a UI wrapper. It shows Claude Code's activity in a sidebar instead of raw terminal output. The mechanics are identical underneath — local process, local file access, remote API calls for inference only.

**Practical implications:**

| Assumption | Reality |
|------------|---------|
| Agents run on Anthropic's infrastructure | No — local processes on your machine |
| Code is sent to and stored remotely | No — context window contents only, transiently |
| Worktrees are remote sandboxes | No — folders on your local disk |
| Parallel agents need a server | No — multiple terminal sessions |

Running three parallel agents means three local processes, three context windows sent to the API concurrently, and three sets of file reads/writes on your disk simultaneously. Your machine is the compute host, not Anthropic.

### Context, state, and memory

**Context is stateless and reconstructed on every API call.** There is no persistent session. No live connection between Anthropic's servers and your worktrees. Every time Claude Code needs to take the next action it assembles the full conversation history, file contents, and tool results from scratch, sends that payload to the API, gets one response, executes the action locally, and closes the connection. Then repeats.

```
API call 1:  [system prompt + task]                               → "read ARCHITECTURE.md"
API call 2:  [system prompt + task + file contents]               → "read specs/entry-sequence.md"
API call 3:  [system prompt + task + files + spec]                → "write frontend/Entry.tsx"
API call 4:  [system prompt + task + files + spec + write result] → "run tsc --noEmit"
API call 5:  [system prompt + task + files + spec + tsc output]   → "done"
```

Anthropic's servers are stateless — they see the full context on every call, return one action, and forget it. The "memory" of what happened is the conversation history being stitched together and re-sent each time.

**What actually lives where:**

| Thing | Where it lives |
|-------|---------------|
| Conversation history (current session) | Claude Code process in RAM, on your machine |
| File contents before and after edits | Your disk |
| Tool results — bash output, file reads | RAM, appended to conversation history |
| The model weights | Anthropic's servers |
| Cross-session memory | Nowhere, unless `memory: project` is set — then a summary file on your disk |

**The `memory: project` flag** is the one exception. When set, Claude Code writes a small markdown file to a designated directory at the end of a session — a summary of codebase patterns, architectural decisions, and recurring findings. On the next session it reads that file back in as part of the initial context. Cross-session memory is just a text file on your disk, not a live connection or server-side state.

**Parallel agents share nothing except the filesystem.** Each Claude Code process has its own independent conversation history in RAM. If the frontend agent writes a file and the backend agent needs to know about it, the only way that happens is if the backend agent explicitly reads that file. There is no shared context, no inter-agent communication channel, no awareness of each other. This is exactly why the supervisor role exists — it is the only agent that reads outputs from other agents and synthesises them into a coherent next action.

---

*Loci — Session 02 · March 2026 · Next session: ARCHITECTURE.md, agent files, first feature spec*

## Locked technical decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | Fastify (TypeScript) | Mature ecosystem since 2016, strong TypeScript, large community |
| Database — V1 | SQLite | Zero infrastructure, file on disk, start immediately |
| Database — V2 | Postgres + pgvector | Triggered by second user or semantic search requirement |
| Migration trigger | Second user | Not a technical threshold — schema is ready from day one |
| Runtime | Bun | TypeScript-native, fast |
| Cloud infra | None for V1 | Fly.io or Railway when multi-user — not GCP or AWS |

SQLite → Postgres migration is a driver swap and a day of work. Schema doesn't change because `owner_id` and `world_id` are on every table from day one.

---

*Next: first feature spec — entry sequence*
