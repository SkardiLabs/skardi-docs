---
sidebar_position: 1
slug: /intro
title: Intro
---

# Skardi

<p align="center"><img src="/skardi-docs/img/skardi-logo.png" alt="Skardi" width="600" /></p>

**Skardi is an open-source self-improving context framework.** In 0.5.0 that means parameterized SQL templates served as REST endpoints (and shell verbs) your agent calls as tools, turning *data autonomy* (letting the agent decide what to query and write) into a default you can govern.

## Why Skardi?

**The most agent-friendly backend for builders shipping their first AI agent.** The painful part of agent-building isn't the prompt — it's the data plumbing: a vector DB to stand up, an embedding pipeline to maintain, a chunker to debug, a tool-call wrapper to write for every query. Skardi auto-bootstraps the primitives every agent needs so you ship in hours, not weeks:

- **[`auto_rag`](https://github.com/SkardiLabs/skardi-skills/tree/main/auto_rag) — Auto-RAG (Retrieval Augmented Generation).** Server-backed hybrid search (vector + full-text + RRF) via `skardi-server` over a datastore you already control (Postgres + pgvector, MongoDB, or Lance). The skill renders the config, starts the server, and drives ingestion and queries through REST. One command from a datastore to a working retrieval API your agent calls as a tool — no Python orchestration layer, no glue code.
- **[`auto_knowledge_base`](https://github.com/SkardiLabs/skardi-skills/tree/main/auto_knowledge_base) — Auto agent knowledge base.** Point it at a directory of documents and you have a queryable, citable local KB one command later. Chunking, embedding, indexing, and hybrid search are exposed to your agent as a `skardi run` verb. Zero infra by default (SQLite + local embeddings), so any Claude Code / Cursor session gets a grounded knowledge base over your files.
- **Zero bootstrap** — `ctx.yaml`, pipelines, schema, server, all rendered for you by **[skardi-skills](https://github.com/SkardiLabs/skardi-skills)**. Install once and your agent has a working data tool the same hour.

You build the agent. Skardi handles the data.

## Get started in 60 seconds — install on Claude Code

Open any Claude Code session and run:

```text
/plugin marketplace add SkardiLabs/skardi-skills
/plugin install skardi-deploy-and-patterns@skardi-skills
/plugin install auto-knowledge-base@skardi-skills
/plugin install auto-rag@skardi-skills
```

That's it — the skills are now available across all your projects, and `/plugin marketplace update skardi-skills` pulls future versions. For Cursor and other [Agent Skills](https://agentskills.io/)-compatible tools, plus a manual-copy fallback, see the [skardi-skills README](https://github.com/SkardiLabs/skardi-skills#installation).

Curious why one layer in front of everything matters? Read on.

## What Skardi is

Your AI agent has two halves. One is the reasoning loop — prompts, tool selection, your orchestration code. The other is where every byte of context comes from and goes to: vector DB hits, SQL queries, file reads, writes back, audit trails. Skardi is the second half.

It is one uniform layer over all of that. A single open-source server (and CLI) that exposes your data — Postgres, SQLite, MongoDB, S3 files, data lakes, vector stores — as parameterized SQL pipelines declared in YAML. Each pipeline is callable as both a REST endpoint and a `skardi` shell verb, so the same definition works in Claude Code, Cursor, your own agent loop, or any HTTP-aware host. One JOIN can span every registered source. Latency typically sits in tens of milliseconds, dominated by your data source's own.

```yaml
# pipelines/wiki-search-hybrid.yaml — your agent's hybrid-search tool, declared once
kind: pipeline
metadata: { name: wiki-search-hybrid }
spec:
  query: |
    SELECT slug, title FROM sqlite_knn('wiki', candle('bge-small', {query}), {limit})
    -- (full vector + FTS + RRF version in Quick Start below)
```

```bash
$ skardi run wiki-search-hybrid -p query="turing machines" -p limit=10  # shell tool, any Bash-tool agent
$ curl -X POST :8080/wiki-search-hybrid/execute -d '{...}'              # same pipeline, served as REST
```

That uniformity is also what makes the *durable* reason to put one layer in front possible: **governance**. Once every read and write goes through one engine, three primitives compose on top of it instead of fragmenting across N SDKs:

1. **Semantic overlay.** Plain-English descriptions of every table, column, and pipeline, served on `GET /data_source` as the agent's discovery surface. The agent reads *what each table is for* before querying, instead of guessing from a schema dump. Reading agents already cash this win — the catalog endpoint *is* the agent's prompt. ([docs/semantics.md](/docs/features/semantics), shipped today)
2. **Lineage.** Every write tagged with `agent_id`, `session_id`, `tool_call_id`, and `timestamp`, queryable from metadata. The async-job ledger already records every batch write today (parameters, status, run id); inline-write lineage on the synchronous path is in progress — see [Roadmap](/docs/roadmap).
3. **Snapshot-as-branch.** Iceberg / Lance-backed branches with `git checkout`-like semantics — an agent writes into a branch, you review, you merge or roll back. If the agent updated 1,000 rows you don't like, undoing it is one call, not an incident. (in progress — see [Roadmap](/docs/roadmap))

Without these, "let the agent touch the database" is reckless and the right answer is "don't"; with them, *data autonomy* — letting the agent decide what to query and write — becomes a default you can actually grant. Federation, declarative SQL pipelines, REST + shell bindings — those are how the layer is built. Governance is what it is *for*.

For the longer technical read — each primitive's shipped vs. in-progress status, the run-ledger schema, the chokepoint argument unpacked — see [Why one engine](./agent-data-plane).

```text
   your agent  ──▶  skardi  ──┬─▶  Postgres / MySQL / SQLite / MongoDB / Redis
   (Claude / GPT /     │              ├─▶  S3 / GCS / Azure (CSV, Parquet, Lance)
    Cursor / your      │              ├─▶  Apache Iceberg, Lance datasets
    own loop)          │              └─▶  pgvector, sqlite-vec, Lance KNN, SeekDB HNSW
                       │
                  parameterized SQL  ──▶  one JOIN can span all of the above
                  (YAML pipelines)
```

- **`skardi` CLI** — a thin HTTP client: send ad-hoc SQL or call any pipeline against a running `skardi-server`, right from a shell. Drop it into Claude Code, Cursor, or any agent with a Bash tool and it's wired with no MCP config.
- **`skardi-server`** — same engine over HTTP, with two surfaces: **online serving** (a YAML pipeline becomes a parameterized REST endpoint with an inferred request/response schema) and **offline jobs** (async batch writes into Lance or any read-write DB; if a job fails halfway you don't get a corrupted dataset, and every run is logged in a SQLite ledger you can list and inspect).
- **Skardi-server is stateful but lightweight** — a single Rust process, plus a small SQLite file for the run ledger and (optional) auth. One server can serve many agents; deploy it next to your data, behind your usual auth.

> **Beta.** Skardi is under active development. APIs may move. Hit us on [Discord](https://discord.gg/S5YQQPEV2m) if you want to co-design a POC.

<p align="center">
  <a href="https://htmlpreview.github.io/?https://github.com/SkardiLabs/skardi/blob/main/asset/architecture-open-source.html">
    
      <img src="/skardi-docs/img/skardi-architecture-open-source.svg" alt="Skardi open source architecture — between any AI agent and your data sources" width="100%" />
    
  </a>
  <br />
  <sub><a href="https://htmlpreview.github.io/?https://github.com/SkardiLabs/skardi/blob/main/asset/architecture-open-source.html">View interactive diagram →</a></sub>
</p>

## When is one layer in front of everything worth it?

Direct SDKs work fine for a single read-only RAG bot — you can wire one to Postgres + a vector DB and ship in an afternoon. The layer earns its keep cumulatively: every property below is true on day one for the simplest agent, and the last three become load-bearing once the agent starts writing, you add a second agent, or "what did the agent do yesterday?" stops being a rhetorical question.

1. **Discovery — the agent reads what data *means*, not just shapes.** A semantic overlay attaches plain-English descriptions to every table, column, and pipeline; the catalog endpoint serves them so the agent picks the right verb before querying instead of guessing from a schema dump. (shipped — [docs/semantics.md](/docs/features/semantics))
2. **Federation — one JOIN over every source.** Federated SQL across Postgres / SQLite / MongoDB / S3 / Iceberg / Lance / vector stores, so the agent's "give me X about Y" doesn't need application-side joins.
3. **Bindings — one pipeline, every host.** The same YAML serves as REST endpoint, `skardi` shell verb, and (soon) MCP tool — works in Claude Code, Cursor, your own loop, or a hosted agent with no extra glue.
4. **Audit — one trail across every write.** Every write tagged with `agent_id` / `session_id` / `tool_call_id` / `timestamp`, queryable from one place. With direct SDKs you get distributed log files; through one layer you get one ledger. (the existing async-job ledger already records every batch write today; inline-write lineage in progress)
5. **Rollback — branch the data, not your incident channel.** Iceberg / Lance-backed branches with `git checkout`-like semantics: agent writes into a branch, you review, you merge or revert. With direct DB writes a bad agent run is an incident; through the layer it's one call. (in progress)

If your agent only ever reads from one source, direct SDKs are simpler. If it reads from many, or writes back, or you want to govern what it does — one layer in front is what makes data autonomy a responsible default rather than a gamble.

Full breakdown of the three primitives — semantic-overlay YAML, the verbatim run-ledger schema, and why each primitive requires a chokepoint — in [Why one engine](./agent-data-plane).

## Architecture

<p align="center"><img src="/skardi-docs/img/skardi-architecture.png" alt="Skardi Architecture" width="800" /></p>
