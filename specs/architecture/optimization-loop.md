# Spec: Optimization Loop

**Type:** Architecture  
**Scope:** loci (process definition + spec template) + agent-primitives (schema update)  
**Branch:** `arch/optimization-loop`  
**Run from:** `~/Development/loci-root/`  

---

## Context

The agent architecture needs a periodic process that reviews both the external
landscape (Claude toolchain updates, agentic architecture best practices,
industry developments) and internal performance (agent retry rates, cost
patterns, spec pass/fail ratios). This process produces two kinds of output:
safe changes it can make autonomously via PR, and architectural suggestions
delivered to the human.

This was designed in Session 04. The key constraints:

- Runs on a weekly cadence by default, but can be triggered on demand by humans
- Runs on its own dedicated branch — never mingled with feature or architecture work in the same branch/PR. Can run in parallel with feature work as long as file scopes don't overlap
- High-confidence changes → PR + independent reviewer approval → merge
- Lower-confidence changes → PR for human review + email summary with priorities
- Architectural suggestions (contract changes, agent modifications) → email only, human executes
- The reviewer agent validates all optimization PRs independently — never the same agent that produced the work
- The acting agent scans broadly (not just Claude ecosystem) for best practices

---

## Scheduling

The weekly cadence is a guideline, not an automated trigger. For PoC phase,
the optimization loop is kicked off manually by the human. There is no cron
job, GitHub Action, or scheduled automation.

**How to run it:** Copy `specs/optimizations/TEMPLATE.md` to
`specs/optimizations/review-YYYY-MM-DD.md`, fill in the date, then in Claude
Code: `Implement specs/optimizations/review-YYYY-MM-DD.md`

**Future automation path (post-PoC):** When the process has proven useful
over several manual cycles, automate the trigger via one of:
- System cron calling Claude Code CLI
- GitHub Actions scheduled workflow
- Calendar reminder remains acceptable if solo developer

The trigger mechanism does not change the process — only how it gets kicked
off. The spec template supports both `scheduled` and `on-demand` as trigger
values regardless of how the run was initiated.

---

## Part 1: Create the optimization spec template

Create `specs/optimizations/TEMPLATE.md`:

```markdown
# Optimization Review — [DATE]

**Trigger:** scheduled | on-demand  
**Branch:** `opt/review-YYYY-MM-DD`  
**Isolation:** Own branch, never mingled with feature work. May run in parallel.

---

## Scope

### External landscape scan
- [ ] Anthropic changelog / Claude Code release notes
- [ ] MCP ecosystem updates (new servers, protocol changes)
- [ ] Agentic architecture developments (industry-wide, not just Claude)
- [ ] Relevant framework updates (R3F, WebXR, Fastify, Bun)

### Internal performance review
- [ ] Read logs/events.jsonl since last optimization review
- [ ] Agent retry rates by agent and by spec category
- [ ] Cost per agent, cost per trace, cost per spec category
- [ ] Specs that required human escalation (third-failure blockers)
- [ ] Reviewer pass/fail ratio on first submission

---

## Output

### Autonomous changes (high confidence)
Changes the optimization process can make directly, submitted as PR:
- Performance tuning (tool scope adjustments, prompt refinements in stubs)
- Dependency version updates with passing tests
- Log format improvements
- Non-architectural configuration changes

Each change must:
- Be on the dedicated `opt/review-YYYY-MM-DD` branch
- Pass independent reviewer validation
- Include a delta measurement (before/after metric or rationale)

### Human review changes (lower confidence)
Changes submitted as PR but not merged — human reviews first:
- Stack-specific context updates (Layer 2 changes)
- Dispatch rule adjustments
- New tool additions to agent contracts
- Changes affecting multiple agents

Each must include:
- Rationale with evidence from logs or external research
- Risk assessment
- Rollback path

### Architectural suggestions (email)
Recommendations that require human decision-making:
- Agent contract schema changes
- New agent proposals
- Protected path changes
- MCP migration candidates
- Security policy updates

Each must include:
- Priority: critical | high | medium | low
- Evidence or rationale
- Estimated effort
- Dependencies on other work

---

## Acceptance criteria

- [ ] External scan covers all four areas listed above
- [ ] Internal review covers all five metrics listed above
- [ ] Every autonomous change has a delta measurement
- [ ] Every human-review change has rationale + risk + rollback
- [ ] Every architectural suggestion has priority + evidence + effort estimate
- [ ] All changes on dedicated branch, no mixing with feature work
- [ ] Independent reviewer approved all autonomous changes
- [ ] Summary report written to logs/reviews/YYYY-MM-DD.md
- [ ] Email draft prepared for human-review and architectural items
```

---

## Part 2: Create the reviews log directory

Create `logs/reviews/` directory with a `.gitkeep` file.

This is where optimization review reports accumulate. Unlike `events.jsonl`
(which is write-only and never re-read by agents), review reports ARE read
by the next optimization cycle to track deltas over time.

---

## Part 3: Update agent contract schema

In `agent-primitives/schema/agent-contract.md`, the `trigger_type` and
related fields are already defined. No schema changes needed — the
optimization loop uses the existing schema as-is:

```yaml
trigger_type: periodic
periodic_cadence: "weekly"
trigger_source: supervisor | human | schedule
```

Verify these fields exist in the schema. If they don't (check first), add them.

---

## Part 4: Create the supervisor dispatch extension

Add to the supervisor's Loci stub (`loci/.claude/agents/supervisor.md`) the
following dispatch rules for optimization specs. Add these as body text
below the existing content — do not replace existing dispatch rules:

```markdown
## Optimization loop dispatch

When executing a spec from `specs/optimizations/`:

1. Verify no file scope overlap with in-progress work (check progress.md for active traces)
2. Create dedicated branch: `opt/review-YYYY-MM-DD`
3. Execute external landscape scan (web research — supervisor handles this directly)
4. Execute internal performance review (read events.jsonl, compute metrics)
5. Classify each finding by confidence:
   - High confidence → implement change, submit for reviewer validation
   - Lower confidence → prepare PR + email draft, do not merge
   - Architectural → email draft only, no code changes
6. Route all code changes through reviewer agent before any merge
7. Write summary report to logs/reviews/YYYY-MM-DD.md
8. Update progress.md with review outcomes
```

---

## Part 5: Update progress.md

Add an `## Optimization Reviews` section to `logs/progress.md` that tracks:

```markdown
## Optimization Reviews

| Date | Trigger | Autonomous changes | Human review items | Architectural suggestions | Report |
|---|---|---|---|---|---|
```

This table is updated by the supervisor after each optimization cycle.

---

## Acceptance criteria (for this spec)

- [ ] `specs/optimizations/TEMPLATE.md` exists with all sections
- [ ] `logs/reviews/` directory exists with `.gitkeep`
- [ ] Agent contract schema verified to include trigger fields
- [ ] Supervisor stub updated with optimization dispatch rules
- [ ] `logs/progress.md` updated with optimization reviews tracking section
- [ ] No changes to ARCHITECTURE.md, CLAUDE.md, or guard-core.sh
- [ ] Changes committed on branch `arch/optimization-loop`

## What NOT to change

- Do not modify ARCHITECTURE.md or CLAUDE.md — human-authored
- Do not modify guard-core.sh or log-event.sh
- Do not modify any base agent files in agent-primitives/base/
- Do not create a new agent — the supervisor handles optimization dispatch
- Do not implement email delivery — for now reports land as markdown files
- Do not run an actual optimization review — this spec sets up the process only