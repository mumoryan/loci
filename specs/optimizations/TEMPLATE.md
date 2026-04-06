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
