---
sidebar_position: 12
title: Roadmap
---

# Roadmap

We're **building in public**. `[x]` means shipped today, `[ ]` means open for contribution. Open an issue or hop into [Discord](https://discord.gg/S5YQQPEV2m) on anything unchecked.

`1` Federated SQL engine
   - [x] DataFusion single-node federation across CSV, Parquet, JSON, S3 / GCS / Azure, Postgres, MySQL, SQLite, MongoDB, Redis, Iceberg, Lance, SeekDB — all joinable in one query
   - [x] Register by table, or load an entire DB (Postgres / MySQL / SQLite) as a DataFusion catalog — one config line either way
   - [ ] Graph database sources (Neo4j / Kuzu) — native federation to unlock graphRAG patterns alongside vector / FTS retrieval

`2` Retrieval primitives
   - [x] Vector search — `pg_knn` (pgvector), `sqlite_knn` (sqlite-vec), Lance KNN, SeekDB HNSW
   - [x] Full-text search — `pg_fts`, `sqlite_fts`, Lance BM25 inverted indexes, SeekDB FULLTEXT
   - [x] Hybrid search — RRF merge of FTS + KNN in plain SQL
   - [x] Inline embeddings — `candle()` UDF (GGUF / Candle / remote embed APIs) runs directly inside SQL; content + vector stay on the same row atomically
   - [x] ONNX inference — `onnx_predict` UDF for inline model predictions in SQL
   - [x] Chunking UDF — `chunk()` with character / markdown splitters (via [`text-splitter`](https://crates.io/crates/text-splitter)) so ingestion can chunk inline in SQL ([docs](/docs/features/chunk)); token / code splitters next
   - [ ] Memory primitive — hybrid access + TTL + provenance + consolidation collapsed into one declarative macro

`3` Online serving (pipelines)
   - [x] Declarative YAML → parameterized REST endpoint with inferred request / response schema
   - [x] Built-in pipeline dashboard
   - [x] CLI pipeline binding + aliases — `skardi run <pipeline> --param=…` and user-defined verb aliases ([#90](https://github.com/SkardiLabs/skardi/pull/90))
   - [x] CLI federated SQL — `skardi query` against files, object stores, datalake formats, and databases with no server required

`4` Offline jobs
   - [x] Async batch execution with submit / poll / cancel ([#98](https://github.com/SkardiLabs/skardi/pull/98))
   - [x] Lance dataset destinations with atomic commit + crash recovery
   - [x] SQL-DML destinations (Postgres / MySQL / SQLite)
   - [x] SQLite-backed run ledger with submit-time schema diff

`5` Agent-facing bindings
   - [x] REST — every pipeline served as a parameterized HTTP endpoint
   - [x] Shell — every pipeline runnable as a `skardi` command; works in Claude Code, Cursor, and any agent with a Bash tool
   - [ ] Skills generator — `skardi skills generate --ctx <ctx.yaml> --out .claude/skills/` emits a skill Markdown per pipeline for Claude Code / Desktop auto-discovery
   - [ ] MCP binding — same pipeline YAML projected to MCP tools for non-Claude hosts

`6` Governance & lineage
   - [x] Catalog with semantics — `kind: semantics` YAML overlay attaching NL descriptions to tables / columns; supports both bare source names and fully-qualified `catalog.schema.table` paths for per-table targeting on catalog-mode sources; surfaced on `GET /data_source` for agent-side discovery
   - [ ] Agent-callable `describe` verb — CLI / pipeline form on top of the catalog endpoint
   - [ ] Lineage capture — `agent_id`, `session_id`, `tool_call_id`, `timestamp` on writes; queryable from metadata tables
   - [ ] Agent identity passthrough — any binding injects client identity into a SQL context var pipelines can read
   - [ ] Snapshot-as-branch / agent checkpoints — Iceberg / Lance-backed; `git checkout`-like semantics for destructive agent experiments

`7` Ops
   - [x] Session auth — drop-in user auth via [better-auth](https://www.better-auth.com/) backed by SQLite
   - [x] Observability — OpenTelemetry traces / metrics / logs with a pre-configured Grafana stack
   - [x] Docker + pre-built binaries — Linux x86_64 / ARM64, macOS ARM64
