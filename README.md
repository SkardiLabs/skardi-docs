# skardi-docs

Documentation site for [Skardi](https://github.com/SkardiLabs/skardi).

Published at **https://skardilabs.github.io/skardi-docs/**.

## How versions work

The version a visitor lands on is **`main`** — generated from the skardi repo at
build time, so the site says what the README says. Tagged releases stay in the
version dropdown as frozen snapshots (`0.5.0`, `0.4.0`, …).

That split matters because the two drift on purpose: `main` documents what is
being built, including things marked *in flight* that are not in a release yet,
while a snapshot documents what a given tag shipped. Neither one alone is
honest for both audiences.

## Local development

The build generates the `main` docs from a skardi checkout, so point
`SKARDI_ROOT` at one:

```bash
cd website
npm ci
SKARDI_ROOT=/path/to/skardi npm run build && npm run serve
```

The default is a `skardi` checkout sitting next to this repo — from inside
`website/` that is `../../skardi`, so the variable above is only needed when
your checkout lives elsewhere. Use `npm run start` for live reload. The
generator fails loudly if the README headings or `docs/` paths it expects have
moved — that is deliberate: it used to return an empty string instead, which
produced a full set of empty pages and reported success.

## Cutting a release snapshot

When a version ships, freeze it:

```bash
cd website
# with the skardi checkout at the tag you are cutting
SKARDI_ROOT=/path/to/skardi node scripts/snapshot-v0.5.0.mjs
```

Copy `scripts/snapshot-v0.5.0.mjs` to the new version, adjust the README
section names and page list to match that tag, then add the version to
`versions.json` and `docusaurus.config.js` and copy a `versioned_sidebars`
file. Edit the snapshot in place afterwards; do not re-run the script against a
later tag.
