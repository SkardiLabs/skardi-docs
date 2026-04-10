# skardi-docs

Documentation site for [Skardi](https://github.com/SkardiLabs/skardi).

Published at **https://skardilabs.github.io/skardi-docs/**.

## Local Development

```bash
cd website
npm ci
npm run build && npm run serve
```

The `prebuild` hook generates `website/docs/` from the root `README.md` automatically.
For live reload during development use `npm run start` instead.
