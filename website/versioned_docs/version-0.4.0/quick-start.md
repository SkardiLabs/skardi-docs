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

```bash
# 1. Ad-hoc SQL across local + remote data — no server, no pre-registration
skardi query --sql "SELECT * FROM './data/products.csv' LIMIT 10"
skardi query --sql "SELECT * FROM 's3://mybucket/events.parquet' LIMIT 10"

# 2. Register named sources in a ctx, query them by name
skardi query --ctx ./ctx.yaml --sql "SELECT * FROM products LIMIT 10"

# 3. Turn a parameterized SQL into an agent-callable verb (alias + pipeline)
#    — now any agent with a shell can call it:
skardi grep "turing machine computation" --limit=10
```

Drop `skardi` into a Claude Code or Cursor session and the agent can already use any pipeline you've declared as a tool via its Bash integration. No MCP config, no separate server — that's the MVP design intent.

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
- **Catalog semantics** — [docs/semantics.md](/docs/features/semantics)
- **Why an agent data plane** — [docs/agent_data_plane.md](/docs/agent-data-plane)

## Next Steps

- [Skardi CLI](/docs/cli) — the full CLI reference.
- [Skardi Server](/docs/server) — running the server and its HTTP surface.
- [Pipelines](/docs/pipelines) — the online-serving primitive.
- [Jobs](/docs/jobs) — the offline-batch peer.
