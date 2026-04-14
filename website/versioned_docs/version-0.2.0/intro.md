---
sidebar_position: 1
slug: /intro
title: Intro
---

# Skardi

<p align="center"><img src="/skardi-docs/img/skardi-logo.png" alt="Skardi" width="600" /></p>

Skardi runs federated SQL across files, databases, object stores, and vector stores — and turns any query into a parameterized REST API with no application code.

- **`skardi-cli`** — Run SQL queries locally against files, object stores, databases, and datalake formats. Ideal for local agents like [OpenClaw](https://github.com/openclaw/openclaw) that need structured data access without a running server.
- **`skardi-server`** — Define SQL queries in YAML and serve them as parameterized HTTP APIs. Connect to multiple data sources, run federated queries, and expose results as REST endpoints.

> **Warning:** This software is in BETA. It may still contain bugs and unexpected behavior. Use caution with production data and ensure you have backups. Feel free to contact us if you want to have a POC for the product.

## Key Features


- **CLI for local agents & queries** — Run SQL against local files, remote object stores (S3, GCS, Azure), databases, and datalake formats — ideal for local AI agents like [OpenClaw](https://github.com/openclaw/openclaw)
- **Declarative pipelines** — Define SQL queries in YAML, get REST APIs automatically
- **Automatic parameter inference** — Request parameters, types, and response schemas are inferred from your SQL
- **Multi-source federation** — JOIN across CSV, Parquet, PostgreSQL, MySQL, SQLite, MongoDB, Redis, Iceberg, and Lance in a single query
- **Full CRUD** — SELECT, INSERT, UPDATE, and DELETE operations on supported databases
- **Vector search** — Native KNN similarity search via Lance, `pg_knn` for PostgreSQL pgvector, and SQLite-vec
- **Embedding inference** — Generate embeddings inline via GGUF, Candle, or remote embedding APIs (requires `--features embedding`)
- **Full-text search** — BM25-scored full-text search via Lance inverted indexes
- **Catalog mode** — Load an entire PostgreSQL, MySQL, or SQLite database as a DataFusion catalog with a single config entry
- **Simple auth** — Drop-in user authentication via [better-auth](https://www.better-auth.com/) backed by an internal SQLite database
- **S3 support** — Read CSV, Parquet, and Lance files directly from S3
- **Docker ready** — Ship as a container with your config files mounted at runtime
- **ONNX inference** — Run ONNX model predictions inline in SQL via the `onnx_predict` UDF

## Cloud (Sealos)


The fastest way to get started is with **[skardi-skills](https://github.com/SkardiLabs/skardi-skills)** — a collection of ready-to-deploy Skardi templates for [Sealos](https://sealos.io). Launch a fully configured Skardi server in the cloud with one click, no local setup required.

## Architecture

<p align="center"><img src="/img/skardi-architecture.png" alt="Skardi Architecture" width="800" /></p>
