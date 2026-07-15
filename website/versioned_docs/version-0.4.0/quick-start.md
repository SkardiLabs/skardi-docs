---
sidebar_position: 2
title: Quick Start
---

# Quick Start

Turn a pile of documents into a knowledge base your agent can search. **You only do 3 things** — the agent does the rest.

### 1 — Install the CLI (pick one)

```bash
# Option A · pre-built binary (faster, no Rust needed)
curl -fSL "https://github.com/SkardiLabs/skardi/releases/latest/download/skardi-$(uname -m | sed 's/arm64/aarch64/')-$(uname -s | sed 's/Linux/unknown-linux-gnu/' | sed 's/Darwin/apple-darwin/').tar.gz" | tar xz && sudo mv skardi /usr/local/bin/

# Option B · from source (recommended during beta; needs Rust first)
git clone https://github.com/SkardiLabs/skardi.git && cd skardi && cargo install --locked --path crates/cli
```

You should see `skardi --version` print `0.4.0` or higher.

### 2 — Install the skill in Claude Code (two lines)

```
/plugin marketplace add SkardiLabs/skardi-skills
/plugin install auto-knowledge-base@skardi-skills
```

(Cursor / manual: copy the skill directory into `~/.claude/skills/`.)

### 3 — Talk to the agent in plain language (no need to say "vectors" or "RAG")

> "Turn `./docs` into a knowledge base I can search, then find 'how is X implemented'."

From here **the agent runs the whole thing itself** — downloads the model, chunks, builds the index, retrieves — and answers **grounded in the matched passages, with sources**.

### Did it really work? (4 checks — "no errors" is not enough)

- [ ] `kb.db` exists and it prints `[6/6] Workspace ready`
- [ ] `rows` ≥ number of documents, `files` = number of documents (every file made it in)
- [ ] Ask something the docs clearly cover — the **first result actually matches** (not a random line)
- [ ] The agent's answer can point to which document it came from

All four pass = the knowledge base really works.

### What you get

- ⏱️ **Under 15 minutes**: your agent retrieves from your docs / databases and answers **with sources**
- 🔗 **One SQL across many sources**: Postgres / MySQL / SQLite / MongoDB / Redis / S3 / Iceberg / Lance / vector stores
- 🧩 **Zero infrastructure to start**: install skardi and go — no server, no signup, no payment, all on your machine
- 🔒 **You own permissions**: sources are read-only by default; writing requires you to opt in explicitly — the bottom line for handing data to an agent

**Versus other self-hosted KB / RAG stacks, three things they typically can't do, or make you assemble yourself:**

- **Live cross-source JOIN**: other stacks must first "ingest" data into their own store, then query; Skardi runs one SQL directly across live sources
- **Define once = CLI verb + REST endpoint**: the same YAML works in both places, zero MCP config to plug into Claude Code / Cursor; others give you an API only, or a framework you must wire into a service yourself
- **Write-facing governance**: read-only by default + dangerous-op (DDL) blocking + write lineage (rollback in progress); others mostly do "query auditing" only, or let you write by default

### Troubleshooting (symptom → fix)

| Symptom | Cause | Fix |
|---|---|---|
| Init fails with `AttributeError …'enable_load_extension'` | Using macOS system Python | `brew install python`, re-run with `/opt/homebrew/bin/python3` |
| `skardi: command not found` | Not installed / not on PATH | Re-read "Install the CLI"; confirm `skardi --version` |
| Ingest fails with `Invalid function 'chunk'` | skardi version below 0.4.0 | Upgrade to 0.4.0+ (`chunk()` is a hard dependency) |
| Ingest fails with `UNIQUE constraint failed` | Same batch ingested twice | Normal protection; to rebuild, re-init with `--force` |
| Retrieval returns empty | Empty index / keyword too obscure | Confirm ingest `rows > 0` first; reword closer to the docs' wording, or use pure semantic search |
| Retrieval results irrelevant | Embedding model doesn't match corpus language / domain | Switch model (multilingual e5, code voyage-code), then rebuild the index |

### Connect your own database (optional — only when wiring in your own DB)

This is an advanced step. Skip it if you're just indexing local files — the 3 steps above already gave you a working knowledge base.

**(1) You do this** (only you can — the agent can't): write a `ctx.yaml` that names each source, fills in connection + credentials, and sets permissions:

```yaml
data_sources:
  - name: products          # the name you'll use in SQL later
    type: csv
    path: ./data/products.csv
  - name: warehouse
    type: postgres
    connection_string: "postgresql://localhost:5432/warehouse"   # you fill in credentials
# All sources are read-only by default; to let the agent write,
# opt in explicitly on that source:
#   access_mode: read_write
```

**(2) You do this**: have the agent (or you) query against that config:

```bash
skardi query --ctx ./ctx.yaml --sql "SELECT * FROM products LIMIT 10"
```

You should see your database's data come back (a result table); one SQL can JOIN across every source above.

**Key (the safety line)**: which sources, and read vs. write, is yours alone to decide. Read-only by default; writing requires an explicit `access_mode: read_write`.
