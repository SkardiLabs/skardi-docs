---
sidebar_position: 1
title: Overview
---

# Supported Data Sources


| Type | CRUD | Description | Docs |
|------|------|-------------|------|
| CSV | Read | Local or remote CSV files | [docs/server.md](/docs/server) |
| Parquet | Read | Local or remote Parquet files | [docs/server.md](/docs/server) |
| PostgreSQL | Full | Tables, catalog mode, pgvector KNN | [docs/postgres/](/docs/data-sources/postgres) |
| MySQL | Full | Tables and catalog mode | [docs/mysql/](/docs/data-sources/mysql) |
| SQLite | Full | Tables, catalog mode, sqlite-vec KNN, FTS | [docs/sqlite/](/docs/data-sources/sqlite) |
| MongoDB | Full | Collections with point lookups | [docs/mongo/](/docs/data-sources/mongo) |
| Redis | Full | Hashes mapped to SQL rows | [docs/redis/](/docs/data-sources/redis) |
| Apache Iceberg | Read | Schema evolution, partition pruning | [docs/iceberg/](/docs/data-sources/iceberg) |
| Lance | Read | KNN vector search, BM25 full-text search | [docs/lance/](/docs/data-sources/lance) |
| S3 | Read | CSV, Parquet, and Lance from S3/GCS/Azure | [docs/S3_USAGE.md](/docs/data-sources/s3) |
