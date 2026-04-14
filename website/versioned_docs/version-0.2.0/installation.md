---
sidebar_position: 2
title: Installation
---

# Installation


### Docker (GHCR)

Pre-built Docker images are published to GitHub Container Registry on every release.

```bash
# Latest release
docker pull ghcr.io/skardilabs/skardi/skardi-server:latest

# Pull a specific version
docker pull ghcr.io/skardilabs/skardi/skardi-server:0.1.0
```

### CLI Binary

Download the latest CLI binary for your platform:

```bash
curl -fSL "https://github.com/SkardiLabs/skardi/releases/latest/download/skardi-$(uname -m | sed 's/arm64/aarch64/')-$(uname -s | sed 's/Linux/unknown-linux-gnu/' | sed 's/Darwin/apple-darwin/').tar.gz" | tar xz
sudo mv skardi /usr/local/bin/
```

Or download manually from the [Releases](https://github.com/SkardiLabs/skardi/releases) page. Available targets:

| Platform | Target |
|----------|--------|
| Linux x86_64 | `skardi-x86_64-unknown-linux-gnu.tar.gz` |
| Linux ARM64 | `skardi-aarch64-unknown-linux-gnu.tar.gz` |
| macOS ARM64 (Apple Silicon) | `skardi-aarch64-apple-darwin.tar.gz` |

> **Note:** macOS Intel (x86_64) binaries are not provided. Apple no longer produces Intel-based Macs. You can [build from source](#building-from-source) if needed.

## Building from Source


```bash
git clone https://github.com/SkardiLabs/skardi.git
cd skardi

# Build CLI
cargo build --release -p skardi-cli

# Build server
cargo build --release -p skardi-server

# With embedding support (ONNX, GGUF, Candle, remote embed)
cargo build --release -p skardi-server --features embedding
```
