---
sidebar_position: 1
title: Overview
---

# Supported Data Sources

| Type | CRUD | Description | Docs |
|------|------|-------------|------|
| CSV | Read | Local or remote CSV files | [docs/server.md](/docs/server) |
| Parquet | Read | Local or remote Parquet files | [docs/server.md](/docs/server) |
| JSON / NDJSON | Read | Local or remote JSON files | [docs/cli.md](/docs/cli) |
| PostgreSQL | Full | Table or catalog registration, pgvector KNN | [docs/postgres/](/docs/data-sources/postgres) |
| MySQL | Full | Table or catalog registration | [docs/mysql/](/docs/data-sources/mysql) |
| SQLite | Full | Table or catalog registration, sqlite-vec KNN, FTS | [docs/sqlite/](/docs/data-sources/sqlite) |
| MongoDB | Full | Collections with point lookups | [docs/mongo/](/docs/data-sources/mongo) |
| Redis | Full | Hashes mapped to SQL rows | [docs/redis/](/docs/data-sources/redis) |
| SeekDB | Full | MySQL-wire CRUD, native FULLTEXT FTS, HNSW VECTOR KNN | [docs/seekdb/](/docs/data-sources/seekdb) |
| Apache Iceberg | Read | Schema evolution, partition pruning | [docs/iceberg/](/docs/data-sources/iceberg) |
| Lance | Read (job-write) | KNN vector search, BM25 FTS; job destination | [docs/lance/](/docs/data-sources/lance) |
| S3 / GCS / Azure | Read | CSV, Parquet, Lance from object stores | [docs/S3_USAGE.md](/docs/data-sources/s3) |
