---
sidebar_position: 1
slug: /intro
title: Intro
---

# Skardi

<p align="center"><img src="/skardi-docs/img/skardi-logo.png" alt="Skardi" width="600" /></p>

## What is Skardi?

Skardi is an open-source **data plane for AI agents** — every tool call your agent makes hits a Skardi pipeline: declarative SQL, served over REST or shell, with retrieval primitives built in. Build RAG, hybrid search, memory, and data APIs across databases, files, data lakes, and vector stores.

Borrowing Spark's shape — one engine over every data source — but tilted for online serving, not analytics. Your agent and your pipeline YAMLs are the *control plane*; Skardi is the *data plane* every tool call traverses, designed for how agents actually use data: schemas they can *read*, outputs they can *parse*, tools they can *discover*, writes they can *trust*.

- **`skardi` CLI** — federated SQL + parameterized pipelines as shell commands. Drop it into any agent that has a Bash tool (Claude Code, Cursor, custom loops) and it's wired.
- **`skardi-server`** — two peer surfaces on one engine: **online serving** (declarative SQL pipelines as parameterized REST endpoints) and **offline jobs** (async batch writes into Lance or any read-write DB, with atomic commit + run ledger).
- **Soon** — skills generation for auto-discovery, MCP binding for non-Claude hosts, a first-class **memory primitive** (structured + vector + FTS + provenance + TTL), lineage, and agent-scoped governance.

> **Beta.** Skardi is under active development. APIs may move. Hit us on [Discord](https://discord.gg/S5YQQPEV2m) if you want to co-design a POC.

## Why an Agent Data Plane?

Agents don't lack intelligence — they lack **data autonomy**. Hand an LLM a raw schema dump and it hallucinates; hand it a bag of bespoke REST endpoints and it gets lost; hand it a vector store and it still can't JOIN. The gap isn't the model. The gap is that today's data stack was designed for humans writing queries, not agents calling tools.

Skardi closes that gap with three deliberate choices:

1. **One engine over every source.** DataFusion-based single-node federation. An agent can `JOIN` a CSV against Postgres against a Lance dataset in one query.
2. **Online serving.** Parameterized SQL served synchronously as REST endpoints; the low-latency path every agent tool call hits.
3. **Offline jobs.** The same SQL shape run asynchronously into a durable destination, with a run ledger, atomic commit, and submit / poll / cancel.

Read the full narrative in [docs/agent_data_plane.md](/docs/agent-data-plane).

## RAG Skills for Agents

Two ready-to-use skills from **[skardi-skills](https://github.com/SkardiLabs/skardi-skills)** you can drop into Claude Code or Cursor:

- **[`auto_knowledge_base`](https://github.com/SkardiLabs/skardi-skills/tree/main/auto_knowledge_base)** — turn a directory of documents into a queryable local RAG with one command. Chunking, embedding, indexing, and hybrid search exposed as a `skardi grep` verb. Zero infra by default (SQLite + local embeddings), so any agent session gets a grounded, citable local knowledge base.
- **[`auto_rag`](https://github.com/SkardiLabs/skardi-skills/tree/main/auto_rag)** — stand up server-backed hybrid-search RAG via `skardi-server` on top of a datastore you already control (Postgres + pgvector, MongoDB, or Lance). The skill renders the `ctx.yaml` + pipelines, starts the server, and drives ingestion and queries through REST — for when retrieval needs to be shared across multiple agents or processes.

## Architecture

<p align="center"><img src="/skardi-docs/img/skardi-architecture.png" alt="Skardi Architecture" width="800" /></p>

## What's already in the box

### Engine
- **Federated SQL across every major source** — CSV, Parquet, JSON, S3 / GCS / Azure, Postgres, MySQL, SQLite, MongoDB, Redis, Iceberg, Lance, SeekDB — all joinable in one query.
- **Register by table or by catalog** — pick per source: expose a single named table, or load an entire Postgres / MySQL / SQLite database as a DataFusion catalog. One config line either way.
- **Vector search** — native KNN via Lance, `pg_knn` (pgvector), `sqlite_knn` (sqlite-vec), SeekDB HNSW.
- **Full-text search** — Lance BM25 inverted indexes, `pg_fts`, `sqlite_fts`, SeekDB native FULLTEXT.
- **Inline embeddings** — `candle()` UDF (GGUF / Candle / remote embed APIs) directly inside SQL, so content + vector stay on the same row atomically.
- **Inline chunking** — `chunk()` UDF (character / markdown splitters via [`text-splitter`](https://crates.io/crates/text-splitter)) so RAG ingest stays a single SQL statement: chunk → embed → write ([docs](/docs/features/chunk)).
- **ONNX inference** — `onnx_predict` UDF for inline model predictions in SQL.
- **Hybrid search** — RRF merge of FTS + KNN in plain SQL (see [llm_wiki demo](/docs/demos/llm-wiki)).

### Agent-facing surfaces
- **CLI `skardi run <pipeline>`** — parameterized pipeline invocation from any shell; works in Claude Code / Cursor / any agent with a Bash tool.
- **User-defined aliases** — `skardi grep "…"` → `run wiki-search-hybrid`. Collapses multi-line SQL into agent-ergonomic verbs.
- **Online serving** — YAML → parameterized HTTP endpoint, with an inferred request / response schema and a built-in dashboard.
- **Offline jobs** — async pipeline that commits to Lance or a DB destination, with a SQLite run ledger and submit / poll / cancel. ([#98](https://github.com/SkardiLabs/skardi/pull/98))

### Ops
- **Session auth** — drop-in user auth via [better-auth](https://www.better-auth.com/) backed by SQLite.
- **Observability** — OpenTelemetry traces / metrics / logs with a pre-configured Grafana stack.
- **Docker + pre-built binaries** — Linux x86_64 / ARM64, macOS ARM64.
