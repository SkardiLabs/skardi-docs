---
sidebar_position: 3
title: Quick Start
---

# Quick Start


```bash
# Build
cargo build --release

# --- Skardi CLI ---
# Query local files directly
skardi query --sql "SELECT * FROM './data/products.csv' LIMIT 10"

# Query remote files
skardi query --sql "SELECT * FROM 's3://mybucket/events.parquet' LIMIT 10"

# --- Skardi Server ---
# Start the server with a context and pipeline
cargo run --bin skardi-server -- \
  --ctx docs/basic/ctx.yaml \
  --pipeline docs/basic/pipeline.yaml \
  --port 8080

# Execute the pipeline
curl -X POST http://localhost:8080/product-search-demo/execute \
  -H "Content-Type: application/json" \
  -d '{"brand": null, "max_price": 100.0, "color": null, "limit": 5}'
```

## Next Steps

For a fuller getting-started walkthrough — context files, pipeline files, and end-to-end examples — see [Skardi Server](/docs/server).
