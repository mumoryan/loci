# Spec: Observability Dashboard

**Type:** Architecture  
**Scope:** agent-primitives (schema, scripts, dashboard) + loci (project-specific config)  
**Branch:** `arch/observability-dashboard` (in both repos)  
**Run from:** `~/Development/loci-root/`  

---

## Context

Every agent tool call writes one JSON line to `logs/events.jsonl` via the
PostToolUse `log-event.sh` hook. This data is currently write-only and
unqueryable. This spec adds:

1. A SQLite database (`logs/loci.db`) synced from events.jsonl
2. A sync script that runs at session end and on demand
3. A local browser dashboard served by Bun with auto-shutdown
4. Read + append access for agents, no update/delete

The dashboard answers three categories of questions:
- **Cost:** per-feature, per-agent, per-trace, trending over time
- **Quality:** retry rates, first-pass success, human escalations, optimization deltas
- **Operational:** what's in flight, trace duration, blockers

---

## Part 1: SQLite schema

Create `agent-primitives/observability/schema.sql`:

```sql
-- Observability database schema
-- Synced from logs/events.jsonl via sync-events.sh
-- Agents: read + append only. Never update or delete.

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,                    -- event_id from jsonl
  session_id TEXT NOT NULL,
  trace_id TEXT,                          -- spans full feature implementation
  agent TEXT NOT NULL,
  model TEXT NOT NULL,
  event_type TEXT NOT NULL,
  tool TEXT NOT NULL,
  tool_type TEXT NOT NULL,                -- raw | mcp
  ts TEXT NOT NULL,                       -- ISO8601 UTC
  duration_ms INTEGER,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_cache_read INTEGER DEFAULT 0,
  tokens_cache_write INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  cost_bucket TEXT NOT NULL,              -- code_generation | world_building | review | orchestration
  input_summary TEXT,
  output_summary TEXT,
  sensitive_data BOOLEAN DEFAULT FALSE,
  review_required BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  error TEXT
);

CREATE TABLE IF NOT EXISTS traces (
  trace_id TEXT PRIMARY KEY,
  spec_path TEXT NOT NULL,
  spec_category TEXT,                     -- features | refactors | optimizations | architecture
  status TEXT NOT NULL,                   -- in_progress | complete | blocked | escalated
  started_at TEXT NOT NULL,
  completed_at TEXT,
  total_cost_usd REAL DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  agents_used TEXT,                       -- JSON array of agent names
  retry_total INTEGER DEFAULT 0,
  human_escalated BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS agent_stats (
  agent TEXT NOT NULL,
  period TEXT NOT NULL,                   -- YYYY-MM-DD or YYYY-WXX
  total_events INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  avg_duration_ms REAL DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  first_pass_rate REAL DEFAULT 0,         -- % of specs passed reviewer on first try
  PRIMARY KEY (agent, period)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_trace ON events(trace_id);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_cost_bucket ON events(cost_bucket);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);
CREATE INDEX IF NOT EXISTS idx_traces_spec_category ON traces(spec_category);

-- Views for dashboard
CREATE VIEW IF NOT EXISTS v_cost_by_agent AS
SELECT
  agent,
  COUNT(*) as total_events,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_event,
  SUM(tokens_input + tokens_output) as total_tokens,
  SUM(tokens_cache_read) as total_cache_hits
FROM events
GROUP BY agent;

CREATE VIEW IF NOT EXISTS v_cost_by_bucket AS
SELECT
  cost_bucket,
  COUNT(*) as total_events,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_event
FROM events
GROUP BY cost_bucket;

CREATE VIEW IF NOT EXISTS v_cost_by_trace AS
SELECT
  t.trace_id,
  t.spec_path,
  t.spec_category,
  t.status,
  COUNT(e.id) as total_events,
  SUM(e.cost_usd) as total_cost,
  MIN(e.ts) as started,
  MAX(e.ts) as ended,
  SUM(e.retry_count) as total_retries
FROM traces t
LEFT JOIN events e ON e.trace_id = t.trace_id
GROUP BY t.trace_id;

CREATE VIEW IF NOT EXISTS v_retry_rates AS
SELECT
  agent,
  COUNT(*) as total_specs,
  SUM(CASE WHEN retry_count = 0 THEN 1 ELSE 0 END) as first_pass_success,
  ROUND(100.0 * SUM(CASE WHEN retry_count = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_pass_rate,
  AVG(retry_count) as avg_retries
FROM events
WHERE event_type = 'task_complete'
GROUP BY agent;

CREATE VIEW IF NOT EXISTS v_cost_trend AS
SELECT
  DATE(ts) as day,
  agent,
  cost_bucket,
  SUM(cost_usd) as daily_cost,
  COUNT(*) as daily_events
FROM events
GROUP BY DATE(ts), agent, cost_bucket
ORDER BY day DESC;
```

---

## Part 2: Sync script

Create `agent-primitives/observability/sync-events.sh`:

The script accepts PROJECT_DIR as an argument so it works for any project.

```bash
#!/bin/bash
# Syncs logs/events.jsonl into logs/observability.db (SQLite)
# Reusable across projects — pass project root as argument.
# Run: at end of each orchestrator session + on demand by human
# Usage: ./sync-events.sh <project-dir>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${1:?Usage: sync-events.sh <project-dir>}"
DB_PATH="$PROJECT_DIR/logs/observability.db"
EVENTS_PATH="$PROJECT_DIR/logs/events.jsonl"
SCHEMA_PATH="$SCRIPT_DIR/schema.sql"

# Initialize DB if it doesn't exist
if [ ! -f "$DB_PATH" ]; then
  echo "Initializing database..."
  sqlite3 "$DB_PATH" < "$SCHEMA_PATH"
fi

# Check events file exists and is non-empty
if [ ! -s "$EVENTS_PATH" ]; then
  echo "No events to sync."
  exit 0
fi

# Count existing events to determine what's new
EXISTING=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM events;" 2>/dev/null || echo "0")
TOTAL=$(wc -l < "$EVENTS_PATH" | tr -d ' ')

if [ "$EXISTING" -ge "$TOTAL" ]; then
  echo "Database is up to date ($EXISTING events)."
  exit 0
fi

# Skip already-synced lines, import new ones
SKIP=$EXISTING
echo "Syncing $((TOTAL - SKIP)) new events..."

tail -n "+$((SKIP + 1))" "$EVENTS_PATH" | while IFS= read -r line; do
  # Extract fields from JSON line using jq
  sqlite3 "$DB_PATH" "INSERT OR IGNORE INTO events (
    id, session_id, trace_id, agent, model, event_type, tool, tool_type,
    ts, duration_ms, tokens_input, tokens_output, tokens_cache_read,
    tokens_cache_write, cost_usd, cost_bucket, input_summary, output_summary,
    sensitive_data, review_required, retry_count, error
  ) VALUES (
    $(echo "$line" | jq -r '[
      .event_id, .session_id, .trace_id, .agent, .model, .event_type,
      .tool, .tool_type, .ts, .duration_ms,
      (.tokens.input // 0), (.tokens.output // 0),
      (.tokens.cache_read // 0), (.tokens.cache_write // 0),
      (.cost_usd // 0), .cost_bucket, .input_summary, .output_summary,
      (.sensitive_data // false), (.review_required // false),
      (.retry_count // 0), .error
    ] | map(if . == null then "NULL" elif type == "boolean" then (if . then 1 else 0 end) elif type == "number" then . else @json end) | join(",")')
  );"
done

# Update trace summaries
sqlite3 "$DB_PATH" "
  INSERT OR REPLACE INTO traces (trace_id, spec_path, spec_category, status, started_at, completed_at, total_cost_usd, total_events, retry_total)
  SELECT
    trace_id,
    COALESCE(input_summary, ''),
    '',
    CASE WHEN SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) > 0 THEN 'blocked' ELSE 'complete' END,
    MIN(ts),
    MAX(ts),
    SUM(cost_usd),
    COUNT(*),
    SUM(retry_count)
  FROM events
  WHERE trace_id IS NOT NULL
  GROUP BY trace_id;
"

# Update agent stats for today
sqlite3 "$DB_PATH" "
  INSERT OR REPLACE INTO agent_stats (agent, period, total_events, total_cost_usd, avg_duration_ms, retry_count)
  SELECT
    agent,
    DATE(ts),
    COUNT(*),
    SUM(cost_usd),
    AVG(duration_ms),
    SUM(retry_count)
  FROM events
  WHERE DATE(ts) = DATE('now')
  GROUP BY agent;
"

FINAL=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM events;")
echo "Sync complete. $FINAL total events in database."
```

---

## Part 3: Dashboard server

Create `agent-primitives/observability/dashboard.ts`:

A single Bun TypeScript file that serves a local HTML dashboard.
Auto-shuts down after 10 minutes of inactivity.
Accepts project directory as CLI argument so it works for any project.

```typescript
import { Database } from "bun:sqlite";
import { resolve } from "path";

const PROJECT_DIR = process.argv[2] || resolve(import.meta.dir, "..");
const DB_PATH = resolve(PROJECT_DIR, "logs/observability.db");
const PORT = 3737;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

let shutdownTimer: Timer;

function resetShutdownTimer() {
  clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(() => {
    console.log("\nAuto-shutdown: no activity for 10 minutes.");
    process.exit(0);
  }, IDLE_TIMEOUT_MS);
}

function queryDb(sql: string): any[] {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    return db.query(sql).all();
  } finally {
    db.close();
  }
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loci — Observability Dashboard</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --surface: #141414;
      --border: #2a2a2a;
      --text: #e0e0e0;
      --text-dim: #808080;
      --accent: #4a9eff;
      --green: #4ade80;
      --red: #f87171;
      --amber: #fbbf24;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { font-size: 18px; color: var(--text-dim); margin-bottom: 24px; }
    h2 { font-size: 14px; color: var(--accent); margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 1px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }
    .card-title { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .card-value { font-size: 28px; font-weight: 600; }
    .card-value.cost { color: var(--accent); }
    .card-value.good { color: var(--green); }
    .card-value.warn { color: var(--amber); }
    .card-value.bad { color: var(--red); }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { text-align: left; font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; border-bottom: 1px solid var(--border); }
    td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid var(--border); }
    tr:hover td { background: rgba(74, 158, 255, 0.05); }
    .status-complete { color: var(--green); }
    .status-blocked { color: var(--red); }
    .status-in_progress { color: var(--amber); }
    .refresh { float: right; background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .refresh:hover { border-color: var(--accent); color: var(--accent); }
    .footer { margin-top: 32px; font-size: 11px; color: var(--text-dim); }
  </style>
</head>
<body>
  <button class="refresh" onclick="location.reload()">Refresh</button>
  <h1>Agent Observability Dashboard</h1>

  <div class="grid" id="summary-cards"></div>

  <h2>Cost by Agent</h2>
  <table id="cost-by-agent"></table>

  <h2>Cost by Bucket</h2>
  <table id="cost-by-bucket"></table>

  <h2>Traces</h2>
  <table id="traces"></table>

  <h2>Cost Trend (Daily)</h2>
  <table id="cost-trend"></table>

  <h2>Retry Rates</h2>
  <table id="retry-rates"></table>

  <div class="footer" id="footer"></div>

  <script>
    async function load() {
      const res = await fetch('/api/dashboard');
      const data = await res.json();

      // Summary cards
      const cards = document.getElementById('summary-cards');
      cards.innerHTML = [
        { title: 'Total Events', value: data.totalEvents, cls: '' },
        { title: 'Total Cost', value: '$' + (data.totalCost || 0).toFixed(4), cls: 'cost' },
        { title: 'Active Traces', value: data.activeTraces, cls: data.activeTraces > 0 ? 'warn' : '' },
        { title: 'Blocked', value: data.blockedTraces, cls: data.blockedTraces > 0 ? 'bad' : 'good' },
      ].map(c => '<div class="card"><div class="card-title">' + c.title + '</div><div class="card-value ' + c.cls + '">' + c.value + '</div></div>').join('');

      // Tables
      renderTable('cost-by-agent', ['Agent', 'Events', 'Total Cost', 'Avg Cost', 'Tokens', 'Cache Hits'], data.costByAgent, r => [r.agent, r.total_events, '$' + (r.total_cost || 0).toFixed(4), '$' + (r.avg_cost_per_event || 0).toFixed(4), r.total_tokens, r.total_cache_hits]);
      renderTable('cost-by-bucket', ['Bucket', 'Events', 'Total Cost', 'Avg Cost'], data.costByBucket, r => [r.cost_bucket, r.total_events, '$' + (r.total_cost || 0).toFixed(4), '$' + (r.avg_cost_per_event || 0).toFixed(4)]);
      renderTable('traces', ['Trace', 'Spec', 'Status', 'Events', 'Cost', 'Retries', 'Started', 'Ended'], data.traces, r => [r.trace_id ? r.trace_id.slice(0, 8) : '', r.spec_path || '', '<span class="status-' + r.status + '">' + r.status + '</span>', r.total_events, '$' + (r.total_cost || 0).toFixed(4), r.total_retries, r.started || '', r.ended || '']);
      renderTable('cost-trend', ['Day', 'Agent', 'Bucket', 'Cost', 'Events'], data.costTrend, r => [r.day, r.agent, r.cost_bucket, '$' + (r.daily_cost || 0).toFixed(4), r.daily_events]);
      renderTable('retry-rates', ['Agent', 'Total Specs', 'First Pass', 'First Pass Rate', 'Avg Retries'], data.retryRates, r => [r.agent, r.total_specs, r.first_pass_success, r.first_pass_rate + '%', r.avg_retries?.toFixed(1)]);

      document.getElementById('footer').textContent = 'Last refreshed: ' + new Date().toLocaleString() + ' · Auto-shutdown in 10 min of inactivity';
    }

    function renderTable(id, headers, rows, mapper) {
      const el = document.getElementById(id);
      if (!rows || rows.length === 0) { el.innerHTML = '<tr><td style="color:var(--text-dim)">No data</td></tr>'; return; }
      el.innerHTML = '<tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + mapper(r).map(v => '<td>' + (v ?? '') + '</td>').join('') + '</tr>').join('');
    }

    load();
  </script>
</body>
</html>`;

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    resetShutdownTimer();
    const url = new URL(req.url);

    if (url.pathname === "/api/dashboard") {
      try {
        const totalEvents = queryDb("SELECT COUNT(*) as c FROM events")[0]?.c || 0;
        const totalCost = queryDb("SELECT SUM(cost_usd) as c FROM events")[0]?.c || 0;
        const activeTraces = queryDb("SELECT COUNT(*) as c FROM traces WHERE status = 'in_progress'")[0]?.c || 0;
        const blockedTraces = queryDb("SELECT COUNT(*) as c FROM traces WHERE status = 'blocked'")[0]?.c || 0;
        const costByAgent = queryDb("SELECT * FROM v_cost_by_agent");
        const costByBucket = queryDb("SELECT * FROM v_cost_by_bucket");
        const traces = queryDb("SELECT * FROM v_cost_by_trace ORDER BY started DESC LIMIT 50");
        const costTrend = queryDb("SELECT * FROM v_cost_trend LIMIT 100");
        const retryRates = queryDb("SELECT * FROM v_retry_rates");

        return Response.json({
          totalEvents, totalCost, activeTraces, blockedTraces,
          costByAgent, costByBucket, traces, costTrend, retryRates
        });
      } catch (e: any) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }

    return new Response(HTML, { headers: { "Content-Type": "text/html" } });
  },
});

resetShutdownTimer();
console.log(\`
  Agent Observability Dashboard
  http://localhost:\${PORT}
  Project: \${PROJECT_DIR}
  Auto-shutdown after 10 minutes of inactivity.
  Press Ctrl+C to stop manually.
\`);
```

---

## Part 3.5: Loci wrapper scripts

Create thin wrapper scripts in `loci/scripts/` that call the shared
agent-primitives tooling with the correct project path.

Create `loci/scripts/sync-events.sh`:

```bash
#!/bin/bash
# Wrapper: syncs Loci events to observability DB
# Usage: ./scripts/sync-events.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec "$PROJECT_DIR/../agent-primitives/observability/sync-events.sh" "$PROJECT_DIR"
```

Create `loci/scripts/dashboard.sh`:

```bash
#!/bin/bash
# Wrapper: launches observability dashboard for Loci
# Usage: ./scripts/dashboard.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
exec bun run "$PROJECT_DIR/../agent-primitives/observability/dashboard.ts" "$PROJECT_DIR"
```

Both must be executable: `chmod +x loci/scripts/sync-events.sh loci/scripts/dashboard.sh`

---

## Part 4: Update orchestrator dispatch

Add to `loci/.claude/agents/orchestrator.md` body text:

```markdown
## Observability

- At the end of every session, run `./scripts/sync-events.sh` to sync events to SQLite
- Agents can read from logs/observability.db (read-only queries) for performance analysis
- Agents can append new events via log-event.sh — never modify or delete existing entries
- Dashboard is for human consumption: `./scripts/dashboard.sh`
```

---

## Part 5: Update READMEs

### agent-primitives/README.md

Add a new section:

```markdown
## Observability

Reusable observability tooling for agent-primitives projects.

```
observability/
  schema.sql        SQLite schema for event storage and dashboard views
  sync-events.sh    Syncs events.jsonl → observability.db (pass project dir as arg)
  dashboard.ts      Local browser dashboard served by Bun (pass project dir as arg)
```

Each project creates thin wrapper scripts that call these with the correct
project path. See any project's `scripts/` directory for examples.
```

### loci/README.md

Add a new section:

```markdown
## Observability Dashboard

Agent activity is logged to `logs/events.jsonl` and synced to `logs/observability.db` (SQLite).

```bash
# Sync latest events to database (also runs automatically at session end)
./scripts/sync-events.sh

# Launch local dashboard (auto-shuts down after 10 min idle)
./scripts/dashboard.sh
# Open http://localhost:3737
```

The dashboard shows cost by agent, cost by bucket, trace summaries, retry
rates, and daily cost trends. Agents can read from the database for
optimization analysis but cannot modify or delete entries.
```

---

## Part 6: Add observability.db to .gitignore

The database is a derived artifact — it's regenerated from events.jsonl.
Do not commit it.

Add to `loci/.gitignore`:

```
logs/observability.db
```

---

## Acceptance criteria

- [ ] `agent-primitives/observability/schema.sql` exists with all tables, indexes, and views
- [ ] `agent-primitives/observability/sync-events.sh` exists and is executable
- [ ] `agent-primitives/observability/dashboard.ts` exists and serves on port 3737
- [ ] Dashboard auto-shuts down after 10 minutes of inactivity
- [ ] `loci/scripts/sync-events.sh` wrapper exists and is executable
- [ ] `loci/scripts/dashboard.sh` wrapper exists and is executable
- [ ] `logs/observability.db` is in `loci/.gitignore`
- [ ] Orchestrator stub updated with observability section
- [ ] Both READMEs updated with observability documentation
- [ ] Changes committed on branch `arch/observability-dashboard` in both repos

## What NOT to change

- Do not modify ARCHITECTURE.md or CLAUDE.md
- Do not modify log-event.sh (it writes to events.jsonl — the sync reads from it)
- Do not modify guard-core.sh
- Do not modify any base agent contract files in agent-primitives/base/
- Do not commit logs/observability.db