#!/usr/bin/env node
/**
 * Generates the `current` docs version from a skardi checkout.
 *
 * Reads README + docs/ + demo/ and writes website/docs/, the version a
 * visitor lands on. Run automatically by the prestart/prebuild hooks.
 *
 * Point it at the checkout with SKARDI_ROOT; it defaults to a sibling
 * `skardi` directory:
 *
 *   SKARDI_ROOT=/path/to/skardi node scripts/generate-docs.mjs
 *
 * The previous version of this script sliced the README by heading name and
 * returned an empty string for any heading it could not find. When the README
 * was rewritten every heading moved, so it produced a complete set of empty
 * pages and reported success. Missing input is now fatal — see MISSING below.
 *
 * Links are rewritten to internal Docusaurus paths when a mapping exists;
 * references to source code, raw YAML, or anything else not on the site keep
 * their text and lose the link.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKARDI = resolve(process.env.SKARDI_ROOT ?? join(__dirname, '../../../skardi'));
const DEST = join(__dirname, '../docs');
const STATIC_IMG = join(__dirname, '../static/img');

if (!existsSync(join(SKARDI, 'README.md')) || !existsSync(join(SKARDI, 'docs'))) {
  console.error(
    `No skardi checkout at ${SKARDI} (need README.md and docs/).\n` +
    `Set SKARDI_ROOT to a checkout, e.g. SKARDI_ROOT=../../skardi npm run build.`,
  );
  process.exit(1);
}

const DOC_MAP = {
  'README.md': '/docs/intro',
  'docs/cli.md': '/docs/cli',
  'docs/server.md': '/docs/server',
  'docs/pipelines.md': '/docs/pipelines',
  'docs/jobs.md': '/docs/jobs',
  'docs/mcp.md': '/docs/mcp',
  'docs/postgres/README.md': '/docs/data-sources/postgres',
  'docs/postgres': '/docs/data-sources/postgres',
  'docs/mysql/README.md': '/docs/data-sources/mysql',
  'docs/mysql': '/docs/data-sources/mysql',
  'docs/sqlite/README.md': '/docs/data-sources/sqlite',
  'docs/sqlite': '/docs/data-sources/sqlite',
  'docs/mongo/README.md': '/docs/data-sources/mongo',
  'docs/mongo': '/docs/data-sources/mongo',
  'docs/redis/README.md': '/docs/data-sources/redis',
  'docs/redis': '/docs/data-sources/redis',
  'docs/dynamodb/README.md': '/docs/data-sources/dynamodb',
  'docs/dynamodb': '/docs/data-sources/dynamodb',
  'docs/seekdb/README.md': '/docs/data-sources/seekdb',
  'docs/seekdb': '/docs/data-sources/seekdb',
  'docs/clickhouse/README.md': '/docs/data-sources/clickhouse',
  'docs/clickhouse': '/docs/data-sources/clickhouse',
  'docs/iceberg/README.md': '/docs/data-sources/iceberg',
  'docs/iceberg': '/docs/data-sources/iceberg',
  'docs/lance/README.md': '/docs/data-sources/lance',
  'docs/lance': '/docs/data-sources/lance',
  'docs/influxdb/README.md': '/docs/data-sources/influxdb',
  'docs/influxdb': '/docs/data-sources/influxdb',
  'docs/graph.md': '/docs/data-sources/graph',
  'docs/rss.md': '/docs/data-sources/rss',
  'docs/rss': '/docs/data-sources/rss',
  'docs/open-connector.md': '/docs/data-sources/open-connector',
  'docs/open-connector/README.md': '/docs/data-sources/open-connector',
  'docs/open-connector': '/docs/data-sources/open-connector',
  'docs/S3_USAGE.md': '/docs/data-sources/s3',
  'docs/federated-queries.md': '/docs/features/federated-queries',
  'docs/catalog.md': '/docs/features/catalog',
  'docs/semantics.md': '/docs/features/semantics',
  'docs/chunk.md': '/docs/features/chunk',
  'docs/documents.md': '/docs/features/documents',
  'docs/llm_extract.md': '/docs/features/llm-extract',
  'docs/json_pack.md': '/docs/features/json-pack',
  'docs/onnx_predict.md': '/docs/features/onnx-inference',
  'docs/observability.md': '/docs/features/observability',
  'docs/auth/README.md': '/docs/features/auth',
  'docs/auth': '/docs/features/auth',
  'docs/embeddings/README.md': '/docs/features/embeddings/overview',
  'docs/embeddings': '/docs/features/embeddings/overview',
  'docs/embeddings/candle/README.md': '/docs/features/embeddings/candle',
  'docs/embeddings/candle': '/docs/features/embeddings/candle',
  'docs/embeddings/gguf/README.md': '/docs/features/embeddings/gguf',
  'docs/embeddings/gguf': '/docs/features/embeddings/gguf',
  'docs/embeddings/remote/README.md': '/docs/features/embeddings/remote',
  'docs/embeddings/remote': '/docs/features/embeddings/remote',
  'demo/simple_backend/README.md': '/docs/demos/simple-backend',
  'demo/simple_backend': '/docs/demos/simple-backend',
  'demo/llm_wiki/README.md': '/docs/demos/llm-wiki',
  'demo/llm_wiki': '/docs/demos/llm-wiki',
  'demo/rag/README.md': '/docs/demos/rag',
  'demo/rag': '/docs/demos/rag',
  'demo/movie_recommendation/README.md': '/docs/demos/movie-recommendation',
  'demo/movie_recommendation': '/docs/demos/movie-recommendation',
  'demo': '/docs/demos/overview',
};

// One Open Connector page per shipped source pack.
const OC_PACKS = [
  ['github', 'GitHub'],
  ['slack', 'Slack'],
  ['notion', 'Notion'],
  ['feishu', 'Feishu / Lark'],
  ['gmail', 'Gmail'],
  ['google-drive', 'Google Drive'],
  ['microsoft-365', 'Microsoft 365 / Outlook'],
  ['one-drive', 'OneDrive'],
  ['dropbox', 'Dropbox'],
  ['discord', 'Discord'],
];
for (const [slug] of OC_PACKS) {
  DOC_MAP[`docs/open-connector-${slug}.md`] = `/docs/data-sources/open-connector-${slug}`;
}

const ASSET_MAP = {
  'asset/logo.png': '/skardi-docs/img/skardi-logo.png',
  'asset/architecture.png': '/skardi-docs/img/skardi-architecture.png',
  'asset/architecture-open-source.svg': '/skardi-docs/img/skardi-architecture-open-source.svg',
  'asset/loop-light.svg': '/skardi-docs/img/skardi-loop-light.svg',
  'asset/loop-dark.svg': '/skardi-docs/img/skardi-loop-dark.svg',
};

const ASSET_COPIES = [
  ['asset/architecture-open-source.svg', 'skardi-architecture-open-source.svg'],
  ['asset/loop-light.svg', 'skardi-loop-light.svg'],
  ['asset/loop-dark.svg', 'skardi-loop-dark.svg'],
];

// Anything the README references by bare anchor that lives on its own page here.
const BARE_ANCHOR_FIXUPS = {
  '#the-loop': '/docs/intro#the-loop',
  '#install': '/docs/install',
  '#security': '/docs/community#security',
  '#roadmap': '/docs/intro',
  '#supported-data-sources': '/docs/data-sources/overview',
};

const MISSING = [];

function resolveRelative(baseDir, rel) {
  rel = rel.replace(/^\.\//, '');
  const [pathOnly, suffix = ''] = rel.split(/(?=[?#])/, 2);
  const parts = baseDir === '.' ? [] : baseDir.split('/').filter(Boolean);
  let r = pathOnly;
  while (r.startsWith('../')) {
    parts.pop();
    r = r.slice(3);
  }
  const joined = [...parts, r].filter(Boolean).join('/').replace(/^\/+/, '');
  return { path: joined, suffix };
}

function lookupDoc(normalized) {
  if (DOC_MAP[normalized]) return DOC_MAP[normalized];
  const noslash = normalized.replace(/\/$/, '');
  if (DOC_MAP[noslash]) return DOC_MAP[noslash];
  return null;
}

function rewriteContent(content, sourceDir) {
  content = content.replace(
    /^\[([^\]]+)\]:\s*(?!https?:\/\/)(?!#)([^\s]+).*$/gm,
    '',
  );

  content = content.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)(?!#)([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, alt, href) => {
      const { path } = resolveRelative(sourceDir, href);
      const asset = ASSET_MAP[path];
      return asset ? `![${alt}](${asset})` : '';
    },
  );

  content = content.replace(
    /\[([^\]]+)\]\((?!https?:\/\/)(?!#)([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, text, href) => {
      const { path, suffix } = resolveRelative(sourceDir, href);
      const mapped = lookupDoc(path);
      return mapped ? `[${text}](${mapped}${suffix})` : text;
    },
  );

  // <picture> with a prefers-color-scheme source is a light/dark image swap.
  // The site sets data-theme rather than relying on the OS, so emit both
  // images and let CSS (.themedImage--light/--dark) pick one.
  content = content.replace(
    /<picture>([\s\S]*?)<\/picture>/g,
    (whole, inner) => {
      const dark = inner.match(/<source[^>]*prefers-color-scheme:\s*dark[^>]*srcset=["']([^"']+)["'][^>]*>/);
      const img = inner.match(/<img\s+([^>]*)\/?>/);
      if (!dark || !img) return whole;
      const darkSrc = ASSET_MAP[resolveRelative(sourceDir, dark[1]).path];
      const attrs = img[1].trim().replace(/\/$/, '').trim();
      const lightSrcMatch = attrs.match(/src=["']([^"']+)["']/);
      if (!darkSrc || !lightSrcMatch) return whole;
      const lightSrc = ASSET_MAP[resolveRelative(sourceDir, lightSrcMatch[1]).path];
      if (!lightSrc) return whole;
      const rest = attrs.replace(/src=["'][^"']+["']\s*/, '').trim();
      return (
        `<img className="themedImage--light" src="${lightSrc}"${rest ? ' ' + rest : ''} />\n` +
        `<img className="themedImage--dark" src="${darkSrc}"${rest ? ' ' + rest : ''} />`
      );
    },
  );

  content = content.replace(
    /<img\s+([^>]*?)src=["'](?!https?:\/\/)(?!\/)([^"']+)["']([^>]*?)\/?>/g,
    (_, before, src, after) => {
      const { path } = resolveRelative(sourceDir, src);
      const asset = ASSET_MAP[path];
      if (!asset) return '';
      const cleanedAfter = after.trim().replace(/\/$/, '').trim();
      const beforeTrim = before.trim();
      return `<img ${beforeTrim ? beforeTrim + ' ' : ''}src="${asset}"${cleanedAfter ? ' ' + cleanedAfter : ''} />`;
    },
  );

  // Any <source> left over (no matching pair) is dropped.
  content = content.replace(/<source\s+[^>]*\/?>(?:\s*<\/source>)?/g, '');
  content = content.replace(/<\/?picture>/g, '');

  // MDX is JSX: void elements written HTML-style abort the build.
  content = content.replace(/<(br|hr)\s*>/gi, '<$1 />');

  // Quoted `<placeholder>` tokens in prose look like unclosed JSX.
  content = content.replace(
    /(['"])<([a-zA-Z][a-zA-Z0-9_-]*)>(['"])/g,
    '$1\\<$2\\>$3',
  );

  content = content.replace(/\]\((#[^)\s]+)\)/g, (m, anchor) =>
    BARE_ANCHOR_FIXUPS[anchor] ? `](${BARE_ANCHOR_FIXUPS[anchor]})` : m,
  );

  return content;
}

// Pages are generated from the skardi repo, so "Edit this page" has to point
// there. The site-wide editUrl used to aim at skardi/website/, a path that has
// never existed in that repo — every edit link 404'd. Each page now carries its
// own source; the stubs below carry none, and frozen snapshots get no link.
const GH_BLOB = 'https://github.com/SkardiLabs/skardi/blob/main';

function write(relPath, frontmatter, body, editSource) {
  if (!editSource) {
    MISSING.push(`edit source for ${relPath}`);
  }
  const fm = editSource
    ? `${frontmatter}\ncustom_edit_url: ${GH_BLOB}/${editSource}`
    : frontmatter;
  const full = join(DEST, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `---\n${fm}\n---\n\n${body.trim()}\n`);
  console.log(`  wrote ${relPath}`);
}

function writeRaw(relPath, body) {
  const full = join(DEST, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, body);
  console.log(`  wrote ${relPath}`);
}

function loadAndTransform(relSourcePath, { stripTopHeading = true } = {}) {
  const abs = join(SKARDI, relSourcePath);
  if (!existsSync(abs)) {
    MISSING.push(`file ${relSourcePath}`);
    return '';
  }
  let content = rewriteContent(readFileSync(abs, 'utf8'), dirname(relSourcePath));
  if (stripTopHeading) content = content.replace(/^#\s+[^\n]+\n+/, '');
  return content;
}

// ---------- Parse README ----------
const README = readFileSync(join(SKARDI, 'README.md'), 'utf8');

const sections = {};
{
  let heading = null;
  let lines = [];
  for (const line of README.split('\n')) {
    if (line.startsWith('## ')) {
      if (heading) sections[heading] = lines.join('\n').trimEnd();
      heading = line.slice(3).trim();
      lines = [];
    } else if (heading) {
      lines.push(line);
    }
  }
  if (heading) sections[heading] = lines.join('\n').trimEnd();
}

function stripDividers(text) {
  return text.replace(/^\s*---\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

function section(name) {
  if (!(name in sections)) {
    MISSING.push(`README section "${name}"`);
    return '';
  }
  return stripDividers(rewriteContent(sections[name], '.'));
}

// The hero sits inside a centered <div> with the badges, so it cannot be taken
// by heading. Slice from the logo image to the first nav link.
function heroPitch() {
  const m = README.match(/logo\.png[^>]*>\s*\n([\s\S]*?)\n\s*<a href=/);
  if (!m) {
    MISSING.push('README hero block (logo → first nav link)');
    return '';
  }
  return stripDividers(rewriteContent(m[1], '.'));
}

// One <details><summary><strong>Name</strong></summary> block out of "More".
function detailsBlock(name) {
  const more = sections['More'];
  if (more === undefined) {
    MISSING.push('README section "More"');
    return '';
  }
  const re = new RegExp(
    `<details>\\s*<summary><strong>${name}</strong></summary>([\\s\\S]*?)</details>`,
  );
  const m = more.match(re);
  if (!m) {
    MISSING.push(`README <details> block "${name}"`);
    return '';
  }
  return stripDividers(rewriteContent(m[1], '.'));
}

// "What's underneath" carries a nested "### Supported data sources" table.
function underneath(part) {
  const raw = sections["What's underneath"];
  if (raw === undefined) {
    MISSING.push(`README section "What's underneath"`);
    return '';
  }
  const idx = raw.indexOf('### Supported data sources');
  if (idx === -1) {
    MISSING.push('README heading "### Supported data sources"');
    return '';
  }
  const text = part === 'table'
    ? raw.slice(idx).replace(/^### Supported data sources\n*/, '')
    : raw.slice(0, idx);
  return stripDividers(rewriteContent(text, '.'));
}

// ---------- Reset ----------
rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

for (const [src, destName] of ASSET_COPIES) {
  const abs = join(SKARDI, src);
  if (!existsSync(abs)) { MISSING.push(`asset ${src}`); continue; }
  copyFileSync(abs, join(STATIC_IMG, destName));
  console.log(`  copied static/img/${destName}`);
}

// ---------- Top-level ----------
write(
  'intro.md',
  'sidebar_position: 1\nslug: /intro\ntitle: Intro',
  [
    '# Skardi',
    '',
    '<p align="center"><img src="/skardi-docs/img/skardi-logo.png" alt="Skardi" width="600" /></p>',
    '',
    heroPitch(),
    '',
    '## The loop',
    '',
    section('The loop'),
    '',
    '## Why it compounds',
    '',
    section('Why it compounds'),
    '',
    '## Next steps',
    '',
    '- [Install](/docs/install) — the two skills, the CLI, and the server.',
    '- [Server](/docs/server) — ad-hoc queries, `ai_context`, and the audit ledger.',
    '- [Pipelines](/docs/pipelines) — what the loop promotes into.',
    '- [Data sources](/docs/data-sources/overview) — everything you can register.',
  ].join('\n'),
  'README.md',
);

write('install.md', 'sidebar_position: 2\ntitle: Install', `# Install\n\n${section('Install')}`, 'README.md');
write('cli.md', 'sidebar_position: 3\ntitle: Skardi CLI', `# Skardi CLI\n\n${loadAndTransform('docs/cli.md')}`, 'docs/cli.md');
write('server.md', 'sidebar_position: 4\ntitle: Skardi Server', `# Skardi Server\n\n${loadAndTransform('docs/server.md')}`, 'docs/server.md');
write('pipelines.md', 'sidebar_position: 5\ntitle: Pipelines', `# Pipelines\n\n${loadAndTransform('docs/pipelines.md')}`, 'docs/pipelines.md');
write('jobs.md', 'sidebar_position: 6\ntitle: Offline Jobs', `# Offline Jobs\n\n${loadAndTransform('docs/jobs.md')}`, 'docs/jobs.md');
write('mcp.md', 'sidebar_position: 7\ntitle: MCP Binding', `# MCP Binding\n\n${loadAndTransform('docs/mcp.md')}`, 'docs/mcp.md');

writeRaw('data-sources/_category_.json', JSON.stringify({ label: 'Data Sources', position: 8 }, null, 2) + '\n');
writeRaw('features/_category_.json', JSON.stringify({ label: 'Features', position: 9 }, null, 2) + '\n');
writeRaw('demos/_category_.json', JSON.stringify({ label: 'Demos', position: 10 }, null, 2) + '\n');

write(
  'architecture.md',
  'sidebar_position: 11\ntitle: Architecture',
  `# Architecture\n\n${underneath('prose')}\n\n${detailsBlock('Architecture diagram')}`,
  'README.md',
);
// The trailing section keeps `#building-from-source` resolvable: older
// snapshots link to /docs/docker#building-from-source, absolute /docs/ links
// land on the current version, and the README moved source builds to Install.
write(
  'docker.md',
  'sidebar_position: 12\ntitle: Docker & Cloud',
  `# Docker & Cloud\n\n${detailsBlock('Docker & cloud')}\n\n## Building from source\n\nSource builds moved to [Install](/docs/install), which covers the CLI, the\nserver, and which feature flags each one needs.`,
  'README.md',
);
write(
  'community.md',
  'sidebar_position: 13\ntitle: Community & Security',
  `# Community\n\n${section('Community')}\n\n## Security\n\n${section('Security')}\n\n## License\n\n${section('License')}`,
  'README.md',
);

// ---------- Data sources ----------
write(
  'data-sources/overview.md',
  'sidebar_position: 1\ntitle: Overview',
  `# Supported Data Sources\n\n${underneath('table')}`,
  'README.md',
);

const dataSources = [
  ['postgres', 'PostgreSQL', 'docs/postgres/README.md'],
  ['mysql', 'MySQL', 'docs/mysql/README.md'],
  ['sqlite', 'SQLite', 'docs/sqlite/README.md'],
  ['mongo', 'MongoDB', 'docs/mongo/README.md'],
  ['redis', 'Redis', 'docs/redis/README.md'],
  ['dynamodb', 'Amazon DynamoDB', 'docs/dynamodb/README.md'],
  ['seekdb', 'SeekDB', 'docs/seekdb/README.md'],
  ['clickhouse', 'ClickHouse', 'docs/clickhouse/README.md'],
  ['lance', 'Lance', 'docs/lance/README.md'],
  ['iceberg', 'Apache Iceberg', 'docs/iceberg/README.md'],
  ['influxdb', 'InfluxDB 3', 'docs/influxdb/README.md'],
  ['s3', 'S3 / Object Stores', 'docs/S3_USAGE.md'],
  ['graph', 'Graph (Apache AGE)', 'docs/graph.md'],
  ['rss', 'RSS / Atom', 'docs/rss.md'],
];
dataSources.forEach(([slug, title, src], i) => {
  write(
    `data-sources/${slug}.md`,
    `sidebar_position: ${i + 2}\ntitle: ${title}`,
    `# ${title}\n\n${loadAndTransform(src)}`,
    src,
  );
});

const ocBase = dataSources.length + 2;
write(
  'data-sources/open-connector.md',
  `sidebar_position: ${ocBase}\ntitle: Open Connector`,
  `# Open Connector\n\n${loadAndTransform('docs/open-connector.md')}`,
  'docs/open-connector.md',
);
OC_PACKS.forEach(([slug, title], i) => {
  write(
    `data-sources/open-connector-${slug}.md`,
    `sidebar_position: ${ocBase + 1 + i}\ntitle: Open Connector — ${title}`,
    `# Open Connector — ${title}\n\n${loadAndTransform(`docs/open-connector-${slug}.md`)}`,
    `docs/open-connector-${slug}.md`,
  );
});

// ---------- Features ----------
const features = [
  ['federated-queries', 'Federated Queries', 'docs/federated-queries.md', 1],
  ['catalog', 'Catalog Mode', 'docs/catalog.md', 2],
  ['semantics', 'Catalog Semantics', 'docs/semantics.md', 3],
  ['chunk', 'Text Chunking', 'docs/chunk.md', 5],
  ['documents', 'Document Ingestion', 'docs/documents.md', 6],
  ['llm-extract', 'LLM Extraction', 'docs/llm_extract.md', 7],
  ['json-pack', 'JSON Packing', 'docs/json_pack.md', 8],
  ['onnx-inference', 'ONNX Inference', 'docs/onnx_predict.md', 9],
  ['observability', 'Observability', 'docs/observability.md', 10],
  ['auth', 'Authentication', 'docs/auth/README.md', 11],
];
features.forEach(([slug, title, src, pos]) => {
  write(`features/${slug}.md`, `sidebar_position: ${pos}\ntitle: ${title}`, `# ${title}\n\n${loadAndTransform(src)}`, src);
});

writeRaw('features/embeddings/_category_.json', JSON.stringify({ label: 'Embeddings', position: 4 }, null, 2) + '\n');
write(
  'features/embeddings/overview.md',
  'sidebar_position: 1\ntitle: Overview',
  `# Embedding Inference\n\n${loadAndTransform('docs/embeddings/README.md')}`,
  'docs/embeddings/README.md',
);
[
  ['candle', 'Candle (local SafeTensors)', 'docs/embeddings/candle/README.md'],
  ['gguf', 'GGUF (llama.cpp)', 'docs/embeddings/gguf/README.md'],
  ['remote', 'Remote APIs', 'docs/embeddings/remote/README.md'],
].forEach(([slug, title, src], i) => {
  write(
    `features/embeddings/${slug}.md`,
    `sidebar_position: ${i + 2}\ntitle: ${title}`,
    `# ${title}\n\n${loadAndTransform(src)}`,
    src,
  );
});

// ---------- Demos ----------
write(
  'demos/overview.md',
  'sidebar_position: 1\ntitle: Overview',
  `# Worked Examples\n\n${detailsBlock('Worked examples & docs index')}`,
  'README.md',
);
[
  ['llm-wiki', 'LLM Wiki Q&A', 'demo/llm_wiki/README.md'],
  ['rag', 'RAG Pipeline', 'demo/rag/README.md'],
  ['simple-backend', 'Simple Backend', 'demo/simple_backend/README.md'],
  ['movie-recommendation', 'Movie Recommendation', 'demo/movie_recommendation/README.md'],
].forEach(([slug, title, src], i) => {
  write(`demos/${slug}.md`, `sidebar_position: ${i + 2}\ntitle: ${title}`, `# ${title}\n\n${loadAndTransform(src)}`, src);
});

// A 0.3.0-era page still links here by absolute path; absolute /docs/ links
// fall through to whichever version is current, so keep the URL resolvable.
writeRaw(
  'spark-for-agents.md',
  `---
title: Spark for Agents
slug: /spark-for-agents
unlisted: true
---

# Spark for Agents

This page is gone. The framing it described was replaced twice: first by
"agent data plane" in 0.4.0, then by the self-improving context loop the
current [Intro](/docs/intro) describes. Older doc snapshots still link here,
so this stub keeps those URLs resolvable.
`,
);

// The README dropped its Roadmap section; what was there is now marked
// `in flight` inline in the loop. Older snapshots still link to /docs/roadmap,
// and absolute /docs/ links resolve against the current version.
writeRaw(
  'roadmap.md',
  `---
title: Roadmap
slug: /roadmap
unlisted: true
---

# Roadmap

There is no standalone roadmap page any more. What is shipped and what is
still in flight is marked inline on [Intro](/docs/intro) — anything tagged
*in flight* is being built now. For what lands next, and to argue for
something, use [GitHub issues](https://github.com/SkardiLabs/skardi/issues)
or [Discord](https://discord.gg/S5YQQPEV2m).
`,
);

// Same reason: 0.4.0 and 0.5.0 pages link to /docs/agent-data-plane.
writeRaw(
  'agent-data-plane.md',
  `---
title: Agent Data Plane
slug: /agent-data-plane
unlisted: true
---

# Agent Data Plane

The "agent data plane" narrative was the 0.4.0–0.5.0 framing and no longer
has a page of its own. What it described — one engine in front of every
source — is now the foundation the loop is built on; see
[Intro](/docs/intro) and [Architecture](/docs/architecture). The 0.5.0
snapshot keeps the original page if you need it.
`,
);

if (MISSING.length) {
  console.error(`\nInput not found — the README or docs/ layout moved:\n  ${MISSING.join('\n  ')}`);
  process.exit(1);
}

console.log(`\nCurrent docs generated from ${SKARDI}`);
