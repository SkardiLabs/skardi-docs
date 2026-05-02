---
sidebar_position: 11
title: Docker & Deployment
---

# Docker & Deployment

## Docker

```bash
# Build
docker build -t skardi .
docker build -t skardi --build-arg FEATURES=rag .   # adds embedding + chunk UDFs

# Or pull pre-built
docker pull ghcr.io/skardilabs/skardi/skardi-server:latest
docker pull ghcr.io/skardilabs/skardi/skardi-server-rag:latest   # embedding + chunk UDFs

# Run
docker run --rm \
  -v /path/to/your/ctx.yaml:/config/ctx.yaml \
  -v /path/to/your/pipelines:/config/pipelines \
  -p 8080:8080 \
  skardi \
  --ctx /config/ctx.yaml \
  --pipeline /config/pipelines \
  --port 8080
```

## Cloud (Sealos)

The fastest cloud path is the [Sealos](https://sealos.io) template in **[skardi-skills](https://github.com/SkardiLabs/skardi-skills)** — our growing library of ready-to-use Skardi setups. One-click launch, no local setup.

## Building from Source

```bash
git clone https://github.com/SkardiLabs/skardi.git
cd skardi

cargo build --release -p skardi-cli
cargo build --release -p skardi-server

# With the full RAG kit (embedding UDFs + chunk UDF)
cargo build --release -p skardi-server --features rag

# Or just the embedding UDFs (ONNX, GGUF, Candle, remote embed) without chunking
cargo build --release -p skardi-server --features embedding
```
