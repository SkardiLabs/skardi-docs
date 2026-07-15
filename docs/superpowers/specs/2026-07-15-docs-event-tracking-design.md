# Docs Event Tracking — Design

**Date:** 2026-07-15
**Status:** Approved for planning
**Goal:** Understand how visitors use the Skardi docs site — which pages they visit, in what order, which commands they copy, where they leave, and how far they read.

## Context

The docs site is a Docusaurus 3.9.2 project (`website/`) deployed to GitHub Pages at
`https://skardilabs.github.io/skardi-docs/`, with versioned docs (0.1.1–0.4.0 plus `next`).
It currently has no analytics of any kind.

## Decisions

| Question | Decision |
|---|---|
| Analytics backend | PostHog, **self-hosted** (instance URL configured, not hardcoded) |
| Identity/privacy | Cookie-based persistent anonymous IDs, gated behind a consent banner |
| Custom events | Code-block copies, scroll depth, outbound clicks (no version-switch event in v1) |
| Integration style | Single custom Docusaurus client module — no `posthog-docusaurus` plugin, no theme-component swizzling beyond `Root` |

Rationale for the integration style: consent gating and custom events must be custom code
either way, so owning PostHog initialization in one module is simpler than splitting
ownership with a plugin. DOM event delegation (instead of swizzling `CopyButton`/`Link`)
keeps the site resilient to Docusaurus upgrades.

## Architecture

Three new units, all under `website/src/`:

1. **`src/lib/analytics.js` — core module.** Owns the `posthog-js` instance:
   initialization against the configured self-hosted host, consent state
   (localStorage-backed), and typed capture helpers (`trackPageView()`,
   `trackCodeCopy()`, `trackOutboundClick()`, `trackScrollDepth()`,
   `trackConsentResponse()`). No other code imports `posthog` directly.

2. **`src/clientModules/analytics-client.js` — Docusaurus client module**, registered
   via `clientModules` in `docusaurus.config.js`. Initializes PostHog on first browser
   load, captures a pageview in `onRouteDidUpdate`, attaches document-level delegated
   click listeners (code-copy buttons, outbound links), and runs a scroll-depth
   observer that resets on every route change.

3. **`src/theme/Root.js` + `src/components/ConsentBanner/` — consent UI.** `Root` is
   the officially supported stable swizzle point; it renders children plus the banner.
   The banner shows until answered and calls `analytics.optIn()` / `analytics.optOut()`.

**Data flow:** user action → DOM event → delegated listener (client module) → capture
helper (`analytics.js`) → PostHog → self-hosted instance. PostHog is initialized with
`opt_out_capturing_by_default: true`; nothing is sent before consent. On accept, PostHog
sets its persistent cookie, enabling cross-visit user journeys.

**Configuration:** PostHog project API key and API host (the self-hosted instance URL)
live in `docusaurus.config.js` under `customFields.posthog = { apiKey, apiHost }`.
Docs-site keys are public by nature; no secret handling is required. If `apiKey` is
empty, the analytics module disables itself entirely (useful for local dev).

## Event taxonomy

| Event | Trigger | Properties |
|---|---|---|
| `$pageview` (PostHog standard) | Initial load + every client-side route change (`onRouteDidUpdate`) | `docs_version` parsed from the URL (`next`, `0.3.0`, …); unprefixed URLs record the current latest label (`0.4.0`), `doc_path` (version-stripped, e.g. `/docs/quick-start`), plus PostHog's automatic referrer/UTM/device context |
| `code_copy` | Click on the copy button of any code block — delegated listener matching Docusaurus's copy button inside `.theme-code-block` | `language` (from code-block class), `snippet_first_line` (first 80 chars), `doc_path`, `docs_version` |
| `outbound_click` | Click on any link leaving the site origin | `target_url`, `link_category` (`github_repo` \| `github_edit` \| `releases` \| `other`, classified by URL pattern), `doc_path` |
| `scroll_depth` | Crossing 25/50/75/100% of the doc content container; each threshold fires **at most once per page visit**, reset on route change | `depth_pct`, `doc_path`, `docs_version` |
| `consent_response` | Banner answered (once ever per browser) | `accepted` (boolean). A decline is sent as a single anonymous, cookieless event; nothing further is ever sent after a decline |

`doc_path` is version-stripped so the same document aggregates across versions, with
`docs_version` available as a breakdown dimension.

**Non-goals for v1:** no version-switch event, no search tracking (no search plugin is
installed), no `posthog.identify()` — all visitors remain anonymous persistent IDs, no
consent "manage preferences" UI (visitors change their mind by clearing site data).

## Consent flow

1. First visit: PostHog initializes opted-out; no cookie is set and no events are sent.
   A bottom banner explains tracking in one line with **Accept** and **Decline** buttons.
2. **Accept:** `posthog.opt_in_capturing()`, consent stored in `localStorage`,
   `consent_response {accepted: true}` and a `$pageview` for the current page fire,
   banner never renders again.
3. **Decline:** a single anonymous cookieless `consent_response {accepted: false}` is
   sent (so opt-out rate is measurable), choice stored in `localStorage`, PostHog
   remains permanently opted out.

## Error handling

Analytics must never break the docs site:

- All browser-only code is guarded with `ExecutionEnvironment.canUseDOM` so
  `npm run build` (Node SSR pre-rendering of every page) is unaffected.
- A blocked script or unreachable self-hosted instance fails silently; capture helpers
  are additionally wrapped in try/catch.
- If a Docusaurus upgrade changes the copy-button DOM, the failure mode is silently
  missing `code_copy` events — never a crash.
- Empty `apiKey` in config disables the whole module.

## Verification checklist

The site has no automated test harness; v1 verification is:

1. `npm run build` succeeds (proves SSR safety).
2. Against `npm run serve` with PostHog debug mode:
   - No network calls to the PostHog host before consent is given.
   - Accept → `consent_response` and `$pageview` fire with correct properties.
   - Decline → exactly one anonymous `consent_response`, then permanent silence,
     including after reloads.
   - Navigating between docs pages fires `$pageview` with correct `doc_path` and
     `docs_version` (test `next`, a numbered version, and the implicit latest).
   - Copying a code block fires `code_copy` with language and first line.
   - Clicking the GitHub navbar/footer links fires `outbound_click` with the right
     `link_category`.
   - Scrolling a long page fires each `scroll_depth` threshold exactly once;
     re-visiting the page fires them again.
3. Events appear in the self-hosted PostHog instance with session/person grouping.
