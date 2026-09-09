---
sidebar_position: 2
title: Quick Start
---

# Quick Start

### Install the CLI

```bash
# From source (recommended during beta)
git clone https://github.com/SkardiLabs/skardi.git
cd skardi
cargo install --locked --path crates/cli
```

Or grab a pre-built binary:

```bash
curl -fSL "https://github.com/SkardiLabs/skardi/releases/latest/download/skardi-$(uname -m | sed 's/arm64/aarch64/')-$(uname -s | sed 's/Linux/unknown-linux-gnu/' | sed 's/Darwin/apple-darwin/').tar.gz" | tar xz
sudo mv skardi /usr/local/bin/
```

| Platform | Target |
|----------|--------|
| Linux x86_64 | `skardi-x86_64-unknown-linux-gnu.tar.gz` |
| Linux ARM64 | `skardi-aarch64-unknown-linux-gnu.tar.gz` |
| macOS ARM64 (Apple Silicon) | `skardi-aarch64-apple-darwin.tar.gz` |

> macOS Intel binaries are not published. [Build from source](/docs/docker#building-from-source) if you need one.

### First-time agent loop (two minutes)

The CLI is a thin HTTP client — every command below talks to a running
`skardi-server`, so step 1 is always starting one. See
[docs/cli.md](/docs/cli) for the full command reference.

**Step 1 — register named sources in a `ctx.yaml`, and start the server.** Five example lines:

```yaml
# ctx.yaml — describes where your data lives. Each entry gets a name you use in SQL.
kind: context
spec:
  data_sources:
    - name: products            # referenceable as `products` in SQL
      type: sqlite
      path: ./shop.db
      access_mode: read_write
      options: { table: products }       # register one specific table…
    - name: warehouse
      type: postgres
      connection_string: "postgresql://localhost:5432/warehouse"
      hierarchy_level: catalog           # …or auto-discover every table in the DB.
                                         # Reference catalog tables in SQL as
                                         # `warehouse.<schema>.<table>` (3-part name).
```

```bash
cargo run --bin skardi-server -- --ctx ./ctx.yaml --port 8080
```

**Step 2 — ad-hoc SQL against the running server.** The CLI prints the
response's `data` array as pretty-printed JSON to stdout by default (pass
`--table` for an ASCII table) — see [docs/cli.md](/docs/cli).

```bash
skardi query -e "SELECT * FROM products LIMIT 10"
skardi query -e "SELECT * FROM products LIMIT 10" --table
```

**Step 3 — turn a parameterized SQL into an agent-callable pipeline.** One
YAML from `demo/llm_wiki/cli/` — the actual file, not
pseudo-code:

> ⚠️ Unlike Steps 1–2 (zero-dependency), this hybrid-search pipeline also needs a local embedding model at `models/…` + the `sqlite-vec` extension (`SQLITE_VEC_PATH`) and a seeded DB — so it is **not runnable by copy-paste alone**. The [`auto_knowledge_base` skill](https://github.com/SkardiLabs/skardi-skills/tree/main/auto_knowledge_base) sets all of this up for you; use it if you just want the pipeline working.

```yaml
# pipelines/search_hybrid.yaml — declares the SQL once; Skardi infers the params
kind: pipeline
metadata: { name: wiki-search-hybrid }
spec:
  query: |
    WITH vec AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY _score ASC) AS rk
      FROM sqlite_knn('wiki.main.wiki_pages_vec', 'embedding',
           (SELECT candle('models/bge-small-en-v1.5', {query})), 80)
    ),
    fts AS (
      SELECT id, slug, title, ROW_NUMBER() OVER (ORDER BY _score DESC) AS rk
      FROM sqlite_fts('wiki.main.wiki_pages_fts', 'content', {text_query}, 60)
    )
    SELECT COALESCE(f.slug, p.slug) AS slug, COALESCE(f.title, p.title) AS title,
           COALESCE({vector_weight}/(60.0 + v.rk), 0)
         + COALESCE({text_weight} /(60.0 + f.rk), 0) AS rrf_score
    FROM vec v FULL OUTER JOIN fts f USING (id)
    LEFT JOIN wiki.main.wiki_pages p ON p.id = COALESCE(v.id, f.id)
    ORDER BY rrf_score DESC LIMIT {limit}
```

Restart the server with `--pipeline pipelines/` so it loads this file (see
[Skardi Server](/docs/server) below), and
any agent with a shell can call it by name — no separate alias file, no
alias-management step:

```bash
skardi run wiki-search-hybrid \
  -p query="turing machine computation" \
  -p text_query="turing machine computation" \
  -p vector_weight=0.5 -p text_weight=0.5 -p limit=10
```

The same pipeline is mounted at `POST /wiki-search-hybrid/execute` — the
request body is a JSON object whose keys match the `{...}` placeholders in
the SQL (Skardi infers this schema and serves it on `GET /data_source` so
the agent can read it). One full cycle:

```bash
curl -X POST http://localhost:8080/wiki-search-hybrid/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "turing machine computation",
       "text_query": "turing machine computation",
       "vector_weight": 0.5, "text_weight": 0.5, "limit": 10}'
```

```json
{ "success": true,
  "data": [ { "slug": "concept/turing-machine", "title": "Turing machine", "rrf_score": 0.0312 }, ... ],
  "rows": 10, "execution_time_ms": 23 }
```

Drop `skardi` into a Claude Code or Cursor session and the agent can already use any pipeline you've declared as a tool via its Bash integration, as long as a `skardi-server` is reachable — no MCP config needed.

### Skardi Server — online serving + offline jobs

```bash
cargo run --bin skardi-server -- \
  --ctx ctx.yaml \
  --pipeline pipelines/ \
  --jobs jobs/ \
  --port 8080
```

```bash
# Pipelines: synchronous answer
curl -X POST http://localhost:8080/product-search-demo/execute \
  -H "Content-Type: application/json" \
  -d '{"brand": null, "max_price": 100.0, "limit": 5}'

# Jobs: submit an async write-to-destination
skardi job run backfill-to-lake --param from_date='2026-01-01'
skardi job status <run_id>
```

Full reference:
- **CLI** — [docs/cli.md](/docs/cli)
- **Server** — [docs/server.md](/docs/server)
- **Pipelines (online serving)** — [docs/pipelines.md](/docs/pipelines)
- **Jobs (offline batch)** — [docs/jobs.md](/docs/jobs)
- **Table descriptions for agent discovery** — [docs/semantics.md](/docs/features/semantics)
- **Background — design intent** — [Why one engine](./agent-data-plane)

## Next Steps

- [Skardi CLI](/docs/cli) — the full CLI reference.
- [Skardi Server](/docs/server) — running the server and its HTTP surface.
- [Pipelines](/docs/pipelines) — the online-serving primitive.
- [Jobs](/docs/jobs) — the offline-batch peer.
