---
sidebar_position: 9
title: Docker
---

# Docker


### Build the image

```bash
docker build -t skardi .

# With embedding support (ONNX, GGUF, Candle, remote embed)
docker build -t skardi --build-arg FEATURES=embedding .
```

### Run with config files mounted

```bash
docker run --rm \
  -v /path/to/your/ctx.yaml:/config/ctx.yaml \
  -v /path/to/your/pipelines:/config/pipelines \
  -p 8080:8080 \
  skardi \
  --ctx /config/ctx.yaml \
  --pipeline /config/pipelines \
  --port 8080
```
